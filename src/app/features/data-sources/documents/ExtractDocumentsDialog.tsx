import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { BusyButton } from "@/app/features/shared/Loading";
import {
  extractionNotApplicable,
  listAvailableExtractionEngines,
  type ExtractionEngineId,
} from "./extractionEngines";
import { EXTRACTION_EXCLUSION_LABELS, type ExtractionPlan } from "./extractionPrototype";

const LIST_CLASS =
  "max-h-40 space-y-1 overflow-y-auto rounded-[var(--luxia-radius-control)] border px-3 py-2";

/**
 * Confirms which documents will be extracted and with which engine.
 * `mode="reextract"` is the explicit confirmation for an Approved document.
 */
export function ExtractDocumentsDialog({
  open,
  plan,
  mode = "extract",
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  plan: ExtractionPlan;
  mode?: "extract" | "reextract";
  onOpenChange: (open: boolean) => void;
  onConfirm: (engineId: ExtractionEngineId) => void;
}) {
  const engines = listAvailableExtractionEngines();
  const [engineId, setEngineId] = useState<ExtractionEngineId>(engines[0]?.id ?? "azure-layout");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEngineId(engines[0]?.id ?? "azure-layout");
    setSubmitting(false);
    // Reset per opening only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { eligible, excluded } = plan;
  const reextract = mode === "reextract";
  const title = reextract ? "Re-extract document" : "Extract documents";
  const single = eligible.length === 1 && excluded.length === 0;
  const confirmLabel = reextract ? "Re-extract" : "Extract";

  function handleConfirm() {
    if (submitting || eligible.length === 0) return;
    setSubmitting(true);
    onConfirm(engineId);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting || !next) onOpenChange(next); }}>
      <DialogContent className="flex max-h-[min(90vh,36rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle className="break-words">{title}</DialogTitle>
          <DialogDescription>
            Converts each file to Markdown for review. Tags are not changed.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {/* Multi-file runs name the files in the lists below; one file is named here. */}
          {single ? (
            <p className="break-words luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
              {eligible[0]!.fileName}
            </p>
          ) : null}
          {reextract ? (
            <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }} role="note">
              This document is approved. Re-extracting replaces its Markdown, including any edits, and it
              will need to be reviewed and approved again. If extraction fails, the current text is kept.
            </p>
          ) : null}

          {eligible.length > 0 && !(eligible.length === 1 && excluded.length === 0) ? (
            <section className="space-y-2">
              <h3 className="luxia-type-label-form" style={{ color: "var(--luxia-text-primary)" }}>
                Will extract ({eligible.length})
              </h3>
              <ul className={LIST_CLASS} style={{ borderColor: "var(--luxia-border-subtle)" }}>
                {eligible.map((document) => (
                  <li key={document.localDocumentId} className="flex min-w-0 justify-between gap-3 luxia-type-body-dense">
                    <span className="min-w-0 truncate" style={{ color: "var(--luxia-text-primary)" }}>
                      {document.fileName}
                    </span>
                    <span className="shrink-0" style={{ color: "var(--luxia-text-muted)" }}>
                      {document.fileFormat}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {excluded.length > 0 ? (
            <section className="space-y-2">
              <h3 className="luxia-type-label-form" style={{ color: "var(--luxia-text-primary)" }}>
                Skipped ({excluded.length})
              </h3>
              <ul className={LIST_CLASS} style={{ borderColor: "var(--luxia-border-subtle)" }}>
                {excluded.map(({ document, reason }) => (
                  <li key={document.localDocumentId} className="flex min-w-0 justify-between gap-3 luxia-type-body-dense">
                    <span className="min-w-0 truncate" style={{ color: "var(--luxia-text-primary)" }}>
                      {document.fileName}
                    </span>
                    <span className="shrink-0" style={{ color: "var(--luxia-text-muted)" }}>
                      {/* Plain text needs no extraction; name that instead of "not supported". */}
                      {reason === "unsupported-format"
                        ? extractionNotApplicable(document.fileFormat)?.label ?? EXTRACTION_EXCLUSION_LABELS[reason]
                        : EXTRACTION_EXCLUSION_LABELS[reason]}
                    </span>
                  </li>
                ))}
              </ul>
              {excluded.some(({ reason }) => reason === "unsupported-format") ? (
                <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                  Extraction supports PDF and DOCX.
                </p>
              ) : null}
            </section>
          ) : null}

          {eligible.length > 0 ? (
            <fieldset className="luxia-creation-ownership-fieldset luxia-creation-ownership--quiet min-w-0 border-0 p-0">
              <legend className="mb-2 luxia-type-label-form text-[var(--luxia-text-primary)]">
                Extraction engine
              </legend>
              <RadioGroup
                value={engineId}
                onValueChange={(next) => setEngineId(next as ExtractionEngineId)}
                className="luxia-creation-ownership-list flex flex-col gap-0"
                aria-label="Extraction engine"
              >
                {engines.map((engine, index) => (
                  <div key={engine.id}>
                    {index > 0 ? <div className="luxia-creation-ownership-divider" role="presentation" /> : null}
                    <label
                      className={`luxia-creation-ownership-row${engineId === engine.id ? " is-selected" : ""}`}
                      htmlFor={`extract-engine-${engine.id}`}
                    >
                      <RadioGroupItem
                        value={engine.id}
                        id={`extract-engine-${engine.id}`}
                        aria-describedby={`extract-engine-${engine.id}-desc`}
                        className="luxia-creation-ownership-row-radio shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="luxia-creation-ownership-row-title">{engine.label}</span>
                        <p id={`extract-engine-${engine.id}-desc`} className="luxia-creation-ownership-row-desc">
                          {engine.description}
                        </p>
                      </span>
                    </label>
                  </div>
                ))}
              </RadioGroup>
              <p className="mt-2 luxia-type-caption text-[var(--luxia-text-muted)]">
                Simulated extraction: no OCR runs in this prototype, and only the sample document receives
                sample content. The engine list is a fixed example.
              </p>
            </fieldset>
          ) : (
            <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
              None of the selected files can be extracted.
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0 justify-between">
          <Button type="button" variant="secondary" size="compact" disabled={submitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <BusyButton
            type="button"
            variant="primary"
            size="compact"
            busy={submitting}
            busyLabel="Starting extraction"
            disabled={eligible.length === 0}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </BusyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
