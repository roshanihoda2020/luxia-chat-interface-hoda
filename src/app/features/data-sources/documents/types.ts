/**
 * Stable document identity for File Data Sources.
 *
 * Production Luxia identifies a document by `s3_file_metadata.uuid`, exposed by
 * the API as `fileMetadataId`. This prototype has no backend, so every record
 * carries an opaque prototype-local ID instead. `fileMetadataId` stays null until
 * a real backend response supplies it — the prototype never fabricates one.
 *
 * The filename is display metadata only, never the identity: two uploads with
 * the same name are two records.
 */

/**
 * How the local ID was obtained.
 * - "upload": generated once when the file was added to an upload draft.
 * - "derived": computed deterministically for a legacy source that only has
 *   `contentSummary.fileNames` (Data Source ID + filename + duplicate occurrence).
 */
export type LocalDocumentIdOrigin = "upload" | "derived";

export interface DataSourceDocumentRecord {
  /** Prototype-local, opaque, stable. Not a backend UUID. */
  localDocumentId: string;
  localDocumentIdOrigin: LocalDocumentIdOrigin;
  dataSourceId: string;
  /** Original filename as uploaded. Display only. */
  fileName: string;
  /** Upper-case extension, e.g. "PDF"; "FILE" when there is none. */
  fileFormat: string;
  sizeBytes?: number;
  /** ISO timestamp the file was added to the prototype upload draft. */
  uploadedAt?: string;
  /**
   * Production `s3_file_metadata.uuid` (API `fileMetadataId`). Always null in the
   * prototype — set only from a real backend response, never generated locally.
   */
  fileMetadataId: string | null;
}
