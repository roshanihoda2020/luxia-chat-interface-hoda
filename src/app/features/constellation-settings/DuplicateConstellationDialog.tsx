import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { InlineAlert } from "@/app/features/shared/InlineAlert";
import { LuxiaLinearProgress } from "@/app/features/shared/Loading";
import { RetryAction } from "@/app/features/shared/RetryAction";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { shouldFailDuplicatePrototype } from "./duplicateConstellationLocal";

export type DuplicateConstellationCommitResult = {
  constellationId: string;
  projectId: string;
  name: string;
};

export type DuplicateConstellationDialogProps = {
  open: boolean;
  constellationName: string;
  onOpenChange: (open: boolean) => void;
  /**
   * Atomically commit the local clone for the trimmed name.
   * Called only after mock progress reaches success — never on cancel/fail.
   */
  onCommitDuplicate: (name: string) => DuplicateConstellationCommitResult;
  onOpenCopy: (projectId: string, constellationId: string) => void;
};

type DuplicatePhase = "idle" | "running" | "completed" | "cancelled" | "failed";

type ProgressStage = {
  percent: number;
  label: string;
};

const PROGRESS_STAGES: ProgressStage[] = [
  { percent: 12, label: "Preparing copy…" },
  { percent: 38, label: "Copying configuration…" },
  { percent: 72, label: "Copying knowledge and connected data…" },
  { percent: 100, label: "Finalizing…" },
];

const STAGE_DELAY_MS = 480;

function defaultDuplicateName(sourceName: string): string {
  const trimmed = sourceName.trim();
  return trimmed ? `Copy of ${trimmed}` : "Copy of Constellation";
}

export function DuplicateConstellationDialog({
  open,
  constellationName,
  onOpenChange,
  onCommitDuplicate,
  onOpenCopy,
}: DuplicateConstellationDialogProps) {
  const nameFieldId = useId();
  const nameErrorId = useId();
  const statusId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const jobTokenRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [phase, setPhase] = useState<DuplicatePhase>("idle");
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState("");
  const [result, setResult] = useState<DuplicateConstellationCommitResult | null>(null);
  const [failMessage, setFailMessage] = useState<string | null>(null);

  function clearTimers() {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  }

  function resetToIdleForm(nextName?: string) {
    clearTimers();
    jobTokenRef.current += 1;
    setPhase("idle");
    setProgress(0);
    setStageLabel("");
    setResult(null);
    setFailMessage(null);
    setSubmitted(false);
    setDetailsOpen(false);
    if (typeof nextName === "string") setName(nextName);
  }

  useEffect(() => {
    if (!open) {
      clearTimers();
      return;
    }
    resetToIdleForm(defaultDuplicateName(constellationName));
    const frame = window.requestAnimationFrame(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when dialog opens / source name changes
  }, [open, constellationName]);

  const trimmedName = name.trim();
  const nameError = submitted && phase === "idle" && !trimmedName
    ? "Enter a Constellation name."
    : null;
  const canSubmit = trimmedName.length > 0;
  const running = phase === "running";

  function handleOpenChange(next: boolean) {
    if (!next && running) {
      cancelJob();
      return;
    }
    onOpenChange(next);
  }

  function finishSuccess(token: number, committedName: string) {
    if (token !== jobTokenRef.current) return;
    try {
      const committed = onCommitDuplicate(committedName);
      if (token !== jobTokenRef.current) return;
      setResult(committed);
      setPhase("completed");
      setProgress(100);
      setStageLabel("Duplication finished.");
      luxiaToast.success("Constellation duplicated");
    } catch (error) {
      if (token !== jobTokenRef.current) return;
      setFailMessage(
        error instanceof Error ? error.message : "The duplication failed.",
      );
      setPhase("failed");
      setStageLabel("The duplication failed.");
    }
  }

  function runMockJob(committedName: string) {
    clearTimers();
    const token = ++jobTokenRef.current;
    setPhase("running");
    setProgress(0);
    setStageLabel(PROGRESS_STAGES[0]?.label ?? "Preparing copy…");
    setFailMessage(null);
    setResult(null);

    if (shouldFailDuplicatePrototype(committedName)) {
      const failTimer = window.setTimeout(() => {
        if (token !== jobTokenRef.current) return;
        setProgress(42);
        setStageLabel("Copying configuration…");
        const failTimer2 = window.setTimeout(() => {
          if (token !== jobTokenRef.current) return;
          setPhase("failed");
          setFailMessage("The duplication failed.");
          setStageLabel("The duplication failed.");
        }, STAGE_DELAY_MS);
        timersRef.current.push(failTimer2);
      }, STAGE_DELAY_MS);
      timersRef.current.push(failTimer);
      return;
    }

    PROGRESS_STAGES.forEach((stage, index) => {
      const timer = window.setTimeout(() => {
        if (token !== jobTokenRef.current) return;
        setProgress(stage.percent);
        setStageLabel(stage.label);
        if (index === PROGRESS_STAGES.length - 1) {
          const commitTimer = window.setTimeout(() => {
            finishSuccess(token, committedName);
          }, 220);
          timersRef.current.push(commitTimer);
        }
      }, STAGE_DELAY_MS * (index + 1));
      timersRef.current.push(timer);
    });
  }

  function cancelJob() {
    clearTimers();
    jobTokenRef.current += 1;
    setPhase("cancelled");
    setProgress(0);
    setStageLabel("The duplication was cancelled.");
    setResult(null);
    setFailMessage(null);
  }

  function handleDuplicate() {
    setSubmitted(true);
    if (!trimmedName || running) return;
    runMockJob(trimmedName);
  }

  function handleRetry() {
    if (!trimmedName) return;
    runMockJob(trimmedName);
  }

  function handleOpenCopy() {
    if (!result) return;
    onOpenChange(false);
    onOpenCopy(result.projectId, result.constellationId);
  }

  const showForm = phase === "idle";
  const showProgress = phase === "running" || phase === "completed" || phase === "cancelled" || phase === "failed";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,34rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        onPointerDownOutside={(event) => {
          if (running) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (running) {
            event.preventDefault();
            cancelJob();
          }
        }}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Duplicate Constellation</DialogTitle>
          <DialogDescription>
            Create a copy of this Constellation and its configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {showForm ? (
            <>
              <div className="space-y-2">
                <Label htmlFor={nameFieldId}>Name</Label>
                <Input
                  ref={nameInputRef}
                  id={nameFieldId}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={Boolean(nameError) || undefined}
                  aria-describedby={nameError ? nameErrorId : undefined}
                  aria-required
                  autoComplete="off"
                  className="min-w-0"
                />
                {nameError ? (
                  <p
                    id={nameErrorId}
                    className="luxia-type-caption"
                    role="alert"
                    style={{ color: "var(--luxia-error)" }}
                  >
                    {nameError}
                  </p>
                ) : null}
              </div>

              <p
                className="luxia-type-body-small"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Configuration, connected data, knowledge, instructions, metrics, and
                related settings will be copied. Chats, Vidgets, access assignments,
                relationships, and history will not be copied.
              </p>

              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="compact"
                    className="h-auto px-0 py-0 font-normal hover:bg-transparent"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    <span className="luxia-type-caption">What gets copied?</span>
                    <ChevronDown
                      size={14}
                      aria-hidden
                      className="transition-transform"
                      style={{
                        transform: detailsOpen ? "rotate(180deg)" : "none",
                      }}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  <div
                    className="space-y-2 rounded-[10px] border px-3.5 py-3"
                    style={{
                      borderColor: "var(--luxia-border-default)",
                      background: "var(--luxia-neutral-surface-subtle, #F8FAFC)",
                    }}
                  >
                    <div>
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        Copied
                      </p>
                      <p
                        className="mt-1 luxia-type-body-small"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        Configuration, Data Source links, tables and column context,
                        Instruction, Crawler, Welcome messages, Metrics, Knowledge
                        Base, Extra Context and linked files, retrieval and confidence
                        settings.
                      </p>
                    </div>
                    <div>
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        Not copied
                      </p>
                      <p
                        className="mt-1 luxia-type-body-small"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        Relationships, Chats, Vidgets, access assignments, and
                        history.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          ) : null}

          {showProgress ? (
            <div className="space-y-3">
              <p
                id={statusId}
                className="luxia-type-body-dense-strong"
                role="status"
                aria-live="polite"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                {stageLabel}
              </p>
              {phase === "running" || phase === "completed" ? (
                <>
                  <LuxiaLinearProgress
                    value={progress}
                    label="Duplication progress"
                  />
                  <p
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    {progress}%
                  </p>
                </>
              ) : null}

              {phase === "completed" && result ? (
                <InlineAlert tone="success" title="Constellation duplicated">
                  <span className="break-words">{result.name}</span> is ready.
                </InlineAlert>
              ) : null}

              {phase === "cancelled" ? (
                <InlineAlert tone="info" title="Duplication cancelled">
                  No copy was created. You can try again with the same name.
                </InlineAlert>
              ) : null}

              {phase === "failed" ? (
                <InlineAlert tone="error" title="The duplication failed">
                  {failMessage ?? "Please try again."}
                  <div className="mt-3">
                    <RetryAction onRetry={handleRetry} />
                  </div>
                </InlineAlert>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0">
          {running ? (
            <Button type="button" variant="secondary" onClick={cancelJob}>
              Cancel duplication
            </Button>
          ) : phase === "completed" && result ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
              <Button type="button" variant="primary" onClick={handleOpenCopy}>
                Open the copy
              </Button>
            </>
          ) : phase === "cancelled" || phase === "failed" ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
              <Button type="button" variant="primary" onClick={handleRetry}>
                Try again
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!canSubmit}
                onClick={handleDuplicate}
              >
                Duplicate
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
