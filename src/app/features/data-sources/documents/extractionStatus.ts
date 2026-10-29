/**
 * Per-document extraction status, mirroring the production backend enum.
 * Separate from upload status, Data Source lifecycle status, Constellation
 * ingestion status and publication status. Type and labels only — the
 * prototype runs no extraction jobs.
 */
export const DOCUMENT_EXTRACTION_STATUSES = [
  "PENDING",
  "PROCESSING",
  "EXTRACTED",
  "REVIEWED",
  "FAILED",
] as const;

export type DocumentExtractionStatus = (typeof DOCUMENT_EXTRACTION_STATUSES)[number];

export const DOCUMENT_EXTRACTION_STATUS_LABELS: Record<DocumentExtractionStatus, string> = {
  PENDING: "Not extracted",
  PROCESSING: "Extracting",
  EXTRACTED: "To review",
  REVIEWED: "Approved",
  FAILED: "Failed",
};

/**
 * What each status means for the document's content. Describes availability
 * only: nothing here says a Constellation has ingested the content.
 */
export const DOCUMENT_EXTRACTION_STATUS_DESCRIPTIONS: Record<DocumentExtractionStatus, string> = {
  PENDING: "Extraction has not run yet.",
  PROCESSING: "Extraction is in progress.",
  EXTRACTED: "Extracted text is available but not approved.",
  REVIEWED: "Reviewed Markdown is available.",
  FAILED: "Extraction failed.",
};

/** Status of a document with no extraction record. */
export const DEFAULT_DOCUMENT_EXTRACTION_STATUS: DocumentExtractionStatus = "PENDING";

export function documentExtractionStatusLabel(status: DocumentExtractionStatus): string {
  return DOCUMENT_EXTRACTION_STATUS_LABELS[status];
}

export function isDocumentExtractionStatus(value: unknown): value is DocumentExtractionStatus {
  return typeof value === "string"
    && (DOCUMENT_EXTRACTION_STATUSES as readonly string[]).includes(value);
}
