import { CircleDashed } from "lucide-react";
import { StatusBadge, type LuxiaStatusTone } from "@/app/features/shared/StatusBadge";
import {
  DOCUMENT_EXTRACTION_STATUS_DESCRIPTIONS,
  documentExtractionStatusLabel,
  type DocumentExtractionStatus,
} from "./extractionStatus";
import { extractionNotApplicable } from "./extractionEngines";

const EXTRACTION_STATUS_TONES: Record<DocumentExtractionStatus, LuxiaStatusTone> = {
  PENDING: "neutral",
  PROCESSING: "info",
  EXTRACTED: "warning",
  REVIEWED: "success",
  FAILED: "error",
};

export function DocumentExtractionStatusBadge({
  status,
  title,
}: {
  status: DocumentExtractionStatus;
  /** Short supporting detail, e.g. a failure reason. */
  title?: string;
}) {
  const description = DOCUMENT_EXTRACTION_STATUS_DESCRIPTIONS[status];
  return (
    <span className="inline-flex">
      <StatusBadge
        tone={EXTRACTION_STATUS_TONES[status]}
        label={documentExtractionStatusLabel(status)}
        icon={status === "PENDING" ? CircleDashed : undefined}
        spinning={status === "PROCESSING"}
        className="whitespace-nowrap"
        title={title ? `${description} ${title}` : description}
      />
      <span className="sr-only">{title ? `${description} ${title}` : description}</span>
    </span>
  );
}

/**
 * Status cell for a document. Formats outside extraction (TXT, Markdown,
 * PPTX) show what applies to them instead of an extraction lifecycle they
 * never enter.
 */
export function DocumentExtractionStatusCell({
  fileFormat,
  status,
  title,
  contentAvailable,
}: {
  fileFormat: string;
  status: DocumentExtractionStatus;
  title?: string;
  /**
   * False when the simulator moved the document to To review but the
   * prototype holds no extracted text for it. Omit when unknown.
   */
  contentAvailable?: boolean;
}) {
  if (status === "EXTRACTED" && contentAvailable === false) {
    const description = "Simulated extraction. This prototype has no extracted text for this file.";
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap" title={description}>
        <StatusBadge tone="warning" label={documentExtractionStatusLabel(status)} className="whitespace-nowrap" />
        <span className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          No text
        </span>
        <span className="sr-only">. {description}</span>
      </span>
    );
  }
  const notApplicable = status === "PENDING" ? extractionNotApplicable(fileFormat) : null;
  if (!notApplicable) return <DocumentExtractionStatusBadge status={status} title={title} />;
  return (
    <span
      className="luxia-type-caption whitespace-nowrap"
      style={{ color: "var(--luxia-text-secondary)" }}
      title={notApplicable.description}
    >
      {notApplicable.label}
      <span className="sr-only">. {notApplicable.description}</span>
    </span>
  );
}
