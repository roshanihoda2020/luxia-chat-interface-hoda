import type { DataSourceDocumentRecord } from "./types";

/** Engines the production Luxia extraction service implements. */
export type ExtractionEngineId = "azure-layout" | "azure-read" | "docling";

export interface ExtractionEngine {
  id: ExtractionEngineId;
  label: string;
  description: string;
}

/**
 * PROTOTYPE DATA. Production availability depends on deployment configuration,
 * so a real build must ask the backend which engines are enabled.
 */
const PROTOTYPE_AVAILABLE_ENGINES: readonly ExtractionEngine[] = [
  { id: "azure-layout", label: "Azure Layout", description: "Text, tables and document structure." },
  { id: "azure-read", label: "Azure Read", description: "Text in reading order." },
  { id: "docling", label: "Docling", description: "Open-source document conversion." },
];

/** Adapter seam: replace with a backend lookup when one exists. */
export function listAvailableExtractionEngines(): readonly ExtractionEngine[] {
  return PROTOTYPE_AVAILABLE_ENGINES;
}

/** Formats the production extraction backend accepts. Other File formats stay taggable. */
export const EXTRACTABLE_FILE_FORMATS: readonly string[] = ["PDF", "DOCX"];

export function isExtractableDocument(document: Pick<DataSourceDocumentRecord, "fileFormat">): boolean {
  return EXTRACTABLE_FILE_FORMATS.includes(document.fileFormat.toUpperCase());
}

const PLAIN_TEXT_FORMATS: readonly string[] = ["TXT", "MD", "MARKDOWN"];

/**
 * What to show instead of an extraction status for a format extraction does
 * not cover, or null for PDF and DOCX. Plain text needs no OCR.
 */
export function extractionNotApplicable(fileFormat: string): { label: string; description: string } | null {
  const format = fileFormat.toUpperCase();
  if (EXTRACTABLE_FILE_FORMATS.includes(format)) return null;
  if (PLAIN_TEXT_FORMATS.includes(format)) {
    return { label: "Plain text", description: "Used as text. Extraction applies to PDF and DOCX only." };
  }
  return { label: "No extraction", description: "Extraction supports PDF and DOCX only." };
}
