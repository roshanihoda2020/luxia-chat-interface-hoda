import type { DataSourceContentSummary } from "@/app/features/permissions/types";
import type { DataSourceDocumentRecord } from "./types";

const UPLOAD_ID_PREFIX = "local-doc-";
const DERIVED_ID_PREFIX = "local-derived-doc:";

let uploadIdSequence = 0;

/**
 * New opaque prototype-local ID for an uploaded file. Call from event handlers
 * only (never during render). Intentionally not UUID-shaped so it cannot be
 * mistaken for a backend `fileMetadataId`.
 */
export function createLocalDocumentId(): string {
  uploadIdSequence += 1;
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2, 14);
  return `${UPLOAD_ID_PREFIX}${Date.now().toString(36)}-${uploadIdSequence.toString(36)}-${random}`;
}

/** Prefix of documents added through the explicit "Add sample document" prototype action. */
export const SAMPLE_FIXTURE_DOCUMENT_ID_PREFIX = `${UPLOAD_ID_PREFIX}sample-`;

/** ID for a prototype sample document. Only the explicit sample action may use it. */
export function createSampleFixtureDocumentId(): string {
  return `${SAMPLE_FIXTURE_DOCUMENT_ID_PREFIX}${createLocalDocumentId().slice(UPLOAD_ID_PREFIX.length)}`;
}

export function isSampleFixtureDocumentId(localDocumentId: string): boolean {
  return localDocumentId.startsWith(SAMPLE_FIXTURE_DOCUMENT_ID_PREFIX);
}

/**
 * Deterministic ID for a legacy filename entry. Combines the Data Source ID,
 * the filename and its duplicate occurrence, so repeated reads agree and two
 * identical names in one source stay distinct.
 */
export function deriveLegacyDocumentId(
  dataSourceId: string,
  fileName: string,
  occurrence: number,
): string {
  return `${DERIVED_ID_PREFIX}${encodeURIComponent(dataSourceId)}:${encodeURIComponent(fileName)}#${occurrence}`;
}

export function fileFormatFromName(fileName: string): string {
  const ext = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".") + 1) : "";
  return ext ? ext.toUpperCase() : "FILE";
}

export function createUploadedDocumentRecord(input: {
  localDocumentId: string;
  dataSourceId: string;
  fileName: string;
  sizeBytes?: number;
  uploadedAt?: string;
}): DataSourceDocumentRecord {
  return {
    localDocumentId: input.localDocumentId,
    localDocumentIdOrigin: "upload",
    dataSourceId: input.dataSourceId,
    fileName: input.fileName,
    fileFormat: fileFormatFromName(input.fileName),
    sizeBytes: input.sizeBytes,
    uploadedAt: input.uploadedAt,
    fileMetadataId: null,
  };
}

/**
 * Shared adapter: the document records of a File Data Source.
 * Uses `contentSummary.documents` when present; otherwise derives deterministic
 * records from the legacy `contentSummary.fileNames` array. Pure — safe to call
 * during render.
 */
export function readDataSourceDocuments(
  dataSourceId: string,
  summary: DataSourceContentSummary | undefined,
): DataSourceDocumentRecord[] {
  if (!summary || summary.kind !== "file") return [];
  if (summary.documents) return summary.documents;
  const occurrences = new Map<string, number>();
  return (summary.fileNames ?? []).map((fileName) => {
    const occurrence = occurrences.get(fileName) ?? 0;
    occurrences.set(fileName, occurrence + 1);
    return {
      localDocumentId: deriveLegacyDocumentId(dataSourceId, fileName, occurrence),
      localDocumentIdOrigin: "derived",
      dataSourceId,
      fileName,
      fileFormat: fileFormatFromName(fileName),
      fileMetadataId: null,
    };
  });
}

/**
 * File summary with both the document collection and the legacy filename array
 * kept in step, so every existing `fileNames` reader continues to work.
 */
export function withDataSourceDocuments(
  summary: DataSourceContentSummary,
  documents: readonly DataSourceDocumentRecord[],
): DataSourceContentSummary {
  return {
    ...summary,
    fileNames: documents.map((document) => document.fileName),
    documents: [...documents],
  };
}
