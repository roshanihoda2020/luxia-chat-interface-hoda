import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { LX } from "@/app/features/active-data-tables/tokens";
import { ListErrorState } from "@/app/features/shared/ListErrorState";
import { LuxiaLinearProgress } from "@/app/features/shared/Loading";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import type { KnowledgeBaseEntry } from "./data";
import {
  downloadKbImportErrorCsv,
  runMockKbCsvImport,
  type KbImportCancelHandle,
  type KbImportParseResult,
} from "./importCsv";

export type KbImportDialogPhase = "idle" | "running" | "completed" | "failed" | "cancelled";

type KbImportCsvDialogProps = {
  open: boolean;
  file: File | null;
  existingEntries: readonly KnowledgeBaseEntry[];
  onOpenChange: (open: boolean) => void;
  /** Called once when mock import completes successfully (merge into draft). */
  onImportComplete: (createdEntries: KnowledgeBaseEntry[]) => void;
  onChooseAnotherFile: () => void;
};

export function KbImportCsvDialog({
  open,
  file,
  existingEntries,
  onOpenChange,
  onImportComplete,
  onChooseAnotherFile,
}: KbImportCsvDialogProps) {
  const [phase, setPhase] = useState<KbImportDialogPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<KbImportParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);

  const cancelHandleRef = useRef<KbImportCancelHandle | null>(null);
  const mergedForRunRef = useRef(false);
  const cancelledByUserRef = useRef(false);
  const existingEntriesRef = useRef(existingEntries);
  existingEntriesRef.current = existingEntries;

  const fileName = file?.name ?? "Selected file";

  useEffect(() => {
    if (!open || !file) {
      cancelHandleRef.current?.cancel();
      cancelHandleRef.current = null;
      setPhase("idle");
      setProgress(0);
      setResult(null);
      setErrorMessage(null);
      mergedForRunRef.current = false;
      cancelledByUserRef.current = false;
      return;
    }

    let active = true;
    mergedForRunRef.current = false;
    cancelledByUserRef.current = false;
    setPhase("running");
    setProgress(0);
    setResult(null);
    setErrorMessage(null);

    const { promise, handle } = runMockKbCsvImport({
      file,
      existingEntries: existingEntriesRef.current,
      onProgress: (percent) => {
        if (active && !cancelledByUserRef.current) setProgress(percent);
      },
    });
    cancelHandleRef.current = handle;

    void promise.then((outcome) => {
      if (!active || cancelledByUserRef.current) {
        cancelHandleRef.current = null;
        return;
      }
      cancelHandleRef.current = null;

      if (outcome.status === "cancelled") {
        setPhase("cancelled");
        setProgress(0);
        return;
      }

      if (outcome.status === "failed") {
        setPhase("failed");
        setErrorMessage(outcome.error);
        return;
      }

      setResult(outcome.result);
      setProgress(100);
      setPhase("completed");
      if (!mergedForRunRef.current) {
        mergedForRunRef.current = true;
        onImportComplete(outcome.result.createdEntries);
      }
      luxiaToast.success("Knowledge Base import completed.");
    });

    return () => {
      active = false;
      handle.cancel();
      cancelHandleRef.current = null;
    };
    // runKey forces retry with the same file; existingEntries captured at start via ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional run trigger
  }, [open, file, runKey]);

  function handleCancelImport() {
    cancelledByUserRef.current = true;
    cancelHandleRef.current?.cancel();
    cancelHandleRef.current = null;
    setPhase("cancelled");
    setProgress(0);
  }

  function handleRetry() {
    mergedForRunRef.current = false;
    setRunKey((value) => value + 1);
  }

  function handleDone() {
    onOpenChange(false);
  }

  function handleDialogOpenChange(next: boolean) {
    if (!next) {
      if (phase === "running") {
        handleCancelImport();
      }
      onOpenChange(false);
      return;
    }
    onOpenChange(true);
  }

  const counts = result?.counts;

  const completedCopy = (() => {
    if (!counts) return null;
    const { created, skipped, empty, invalid } = counts;
    if (created > 0) {
      return {
        title: "Import complete",
        description: null as string | null,
      };
    }
    if (created === 0 && skipped > 0 && invalid === 0 && empty === 0) {
      return {
        title: "No new entries were added",
        description: `${skipped} ${skipped === 1 ? "entry was" : "entries were"} skipped because they already exist in this Knowledge Base.`,
      };
    }
    if (created === 0 && skipped === 0 && empty === 0 && invalid === 0) {
      return {
        title: "No importable entries were found in this file.",
        description: null as string | null,
      };
    }
    return {
      title: "Import complete",
      description: null as string | null,
    };
  })();

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0"
        style={{ width: "min(92vw, 440px)", maxWidth: "min(92vw, 440px)" }}
        onPointerDownOutside={(event) => {
          if (phase === "running") event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (phase === "running") {
            event.preventDefault();
            handleCancelImport();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            Import question and answer pairs into this Knowledge Base draft.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div>
            <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>
              File
            </p>
            <p className="mt-1 truncate luxia-type-body-dense-strong" style={{ color: LX.primary }} title={fileName}>
              {fileName}
            </p>
          </div>

          {phase === "running" ? (
            <div className="space-y-3">
              <p className="luxia-type-body-dense-strong" role="status" aria-live="polite" style={{ color: LX.primary }}>
                Importing…
              </p>
              <LuxiaLinearProgress value={progress} label="Import progress" />
              <p className="luxia-type-caption" style={{ color: LX.textMuted }}>
                Processing rows from your CSV. You can cancel before it finishes.
              </p>
            </div>
          ) : null}

          {phase === "completed" && counts && completedCopy ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="luxia-type-body-dense-strong" role="status" aria-live="polite" style={{ color: LX.primary }}>
                  {completedCopy.title}
                </p>
                {completedCopy.description ? (
                  <p className="luxia-type-caption" style={{ color: LX.textMuted }}>
                    {completedCopy.description}
                  </p>
                ) : null}
              </div>
              <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 rounded-[10px] border px-3.5 py-3" style={{ borderColor: LX.border, background: LX.subtle }}>
                <dt className="luxia-type-caption" style={{ color: LX.textMuted }}>Created</dt>
                <dd className="text-right luxia-type-caption" style={{ color: LX.primary }}>{counts.created}</dd>
                <dt className="luxia-type-caption" style={{ color: LX.textMuted }}>Skipped</dt>
                <dd className="text-right luxia-type-caption" style={{ color: LX.primary }}>{counts.skipped}</dd>
                <dt className="luxia-type-caption" style={{ color: LX.textMuted }}>Empty</dt>
                <dd className="text-right luxia-type-caption" style={{ color: LX.primary }}>{counts.empty}</dd>
                <dt className="luxia-type-caption" style={{ color: LX.textMuted }}>Invalid</dt>
                <dd className="text-right luxia-type-caption" style={{ color: LX.primary }}>{counts.invalid}</dd>
              </dl>
              {counts.invalid > 0 && result ? (
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  className="w-full justify-center"
                  onClick={() => downloadKbImportErrorCsv(result.invalidRows)}
                >
                  <Download size={14} aria-hidden />
                  Download error CSV
                </Button>
              ) : null}
              {counts.created > 0 ? (
                <p className="luxia-type-caption" style={{ color: LX.textMuted }}>
                  New entries were added to your draft. Use Save Changes to keep them.
                </p>
              ) : null}
            </div>
          ) : null}

          {phase === "cancelled" ? (
            <div className="space-y-2">
              <p className="luxia-type-body-dense-strong" role="status" aria-live="polite" style={{ color: LX.primary }}>
                Import cancelled
              </p>
              <p className="luxia-type-caption" style={{ color: LX.textMuted }}>
                No entries were added. You can try again or choose another file.
              </p>
            </div>
          ) : null}

          {phase === "failed" ? (
            <ListErrorState
              title="Import failed"
              description={errorMessage ?? "Something went wrong while importing this CSV."}
              onRetry={handleRetry}
              retryLabel="Retry"
            />
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          {phase === "running" ? (
            <Button type="button" variant="secondary" className="px-4" onClick={handleCancelImport}>
              Cancel Import
            </Button>
          ) : null}

          {phase === "cancelled" ? (
            <>
              <Button type="button" variant="secondary" className="px-4" onClick={onChooseAnotherFile}>
                Choose another file
              </Button>
              <Button type="button" variant="primary" className="px-4" onClick={handleRetry}>
                Try again
              </Button>
            </>
          ) : null}

          {phase === "failed" ? (
            <Button type="button" variant="secondary" className="px-4" onClick={onChooseAnotherFile}>
              Choose another file
            </Button>
          ) : null}

          {phase === "completed" ? (
            <Button type="button" variant="primary" className="px-4" onClick={handleDone}>
              Done
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
