import { useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_DOCUMENT_EXTRACTION_STATUS,
  isDocumentExtractionStatus,
  type DocumentExtractionStatus,
} from "./extractionStatus";

/**
 * Prototype extraction-status store, separate from the Tag store.
 *
 * localStorage key `luxia.document-extraction-status.v1`:
 * { version: 1, sources: { [dataSourceId]: { [localDocumentId]: DocumentExtractionStatusRecord } } }
 *
 * A document with no valid record is PENDING. Nothing here runs extraction or
 * creates records on its own; the prototype simulator (extractionPrototype.ts)
 * is the only writer of run results.
 */
export const EXTRACTION_STATUS_STORAGE_KEY = "luxia.document-extraction-status.v1";
const STORE_VERSION = 1;

export interface DocumentExtractionStatusRecord {
  status: DocumentExtractionStatus;
  /** ISO timestamp of the last status change. */
  updatedAt: string;
  /** Production `fileMetadataId`, once a backend supplies it. Never generated locally. */
  fileMetadataId: string | null;
  /** Engine of the latest run (an ExtractionEngineId). */
  engineId?: string | null;
  /** Opaque id of the latest run; a finishing run only writes while it is still current. */
  runId?: string | null;
  /** Runs started for this document. */
  attempts?: number;
  /** Short reason shown for FAILED. */
  failureReason?: string | null;
  /** Set when an Approved document was re-extracted, so the earlier approval is not forgotten. */
  lastReviewedAt?: string | null;
}

export type DocumentExtractionRecordPatch = Partial<
  Omit<DocumentExtractionStatusRecord, "status" | "updatedAt">
>;

/** Validated statuses only: sources[dataSourceId][localDocumentId]. */
export type ExtractionStatusSnapshot = Readonly<
  Record<string, Readonly<Record<string, DocumentExtractionStatusRecord>>>
>;

const EMPTY_SNAPSHOT: ExtractionStatusSnapshot = Object.freeze({});
const EMPTY_SOURCE: Readonly<Record<string, DocumentExtractionStatusRecord>> = Object.freeze({});

const listeners = new Set<() => void>();
// Cache keyed by the raw stored string, so a change from any writer or tab is picked up on next read.
let cachedRaw: string | null | undefined;
let cachedSnapshot: ExtractionStatusSnapshot = EMPTY_SNAPSHOT;

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(EXTRACTION_STATUS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function sanitizeRecord(value: unknown): DocumentExtractionStatusRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!isDocumentExtractionStatus(record.status)) return null;
  const text = (value: unknown) => (typeof value === "string" && value ? value : null);
  return {
    status: record.status,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
    fileMetadataId: text(record.fileMetadataId),
    engineId: text(record.engineId),
    runId: text(record.runId),
    attempts: typeof record.attempts === "number" && record.attempts >= 0 ? record.attempts : 0,
    failureReason: text(record.failureReason),
    lastReviewedAt: text(record.lastReviewedAt),
  };
}

function sanitizeSnapshot(raw: string | null): ExtractionStatusSnapshot {
  const root = parseObject(raw);
  const sources = root?.sources;
  if (!sources || typeof sources !== "object") return EMPTY_SNAPSHOT;
  const result: Record<string, Record<string, DocumentExtractionStatusRecord>> = {};
  for (const [dataSourceId, documents] of Object.entries(sources as Record<string, unknown>)) {
    if (!documents || typeof documents !== "object") continue;
    const valid: Record<string, DocumentExtractionStatusRecord> = {};
    for (const [documentId, value] of Object.entries(documents as Record<string, unknown>)) {
      const record = sanitizeRecord(value);
      if (record) valid[documentId] = record;
    }
    if (Object.keys(valid).length > 0) result[dataSourceId] = valid;
  }
  return result;
}

export function readExtractionStatusSnapshot(): ExtractionStatusSnapshot {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = sanitizeSnapshot(raw);
  }
  return cachedSnapshot;
}

export function getDocumentExtractionStatus(
  dataSourceId: string,
  localDocumentId: string,
): DocumentExtractionStatus {
  return readExtractionStatusSnapshot()[dataSourceId]?.[localDocumentId]?.status
    ?? DEFAULT_DOCUMENT_EXTRACTION_STATUS;
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key === null || event.key === EXTRACTION_STATUS_STORAGE_KEY) notify();
}

export function subscribeExtractionStatus(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function getDocumentExtractionRecord(
  dataSourceId: string,
  localDocumentId: string,
): DocumentExtractionStatusRecord | null {
  return readExtractionStatusSnapshot()[dataSourceId]?.[localDocumentId] ?? null;
}

/**
 * Replace (or with `null`, remove) one document's record. Re-reads storage and
 * merges, so unknown or unreadable entries are kept. Refuses to overwrite
 * storage it cannot parse.
 */
function writeRecord(
  dataSourceId: string,
  localDocumentId: string,
  record: DocumentExtractionStatusRecord | null,
): boolean {
  if (typeof window === "undefined" || !dataSourceId || !localDocumentId) return false;
  const raw = readRaw();
  const root = raw ? parseObject(raw) : { version: STORE_VERSION, sources: {} };
  if (!root) return false;
  const sources = root.sources && typeof root.sources === "object"
    ? { ...(root.sources as Record<string, unknown>) }
    : {};
  const current = sources[dataSourceId];
  const documents = current && typeof current === "object"
    ? { ...(current as Record<string, unknown>) }
    : {};
  if (record) documents[localDocumentId] = record;
  else delete documents[localDocumentId];
  sources[dataSourceId] = documents;
  try {
    window.localStorage.setItem(
      EXTRACTION_STATUS_STORAGE_KEY,
      JSON.stringify({ ...root, version: STORE_VERSION, sources }),
    );
  } catch {
    return false;
  }
  notify();
  return true;
}

/** Set one document's status, keeping its other recorded fields unless patched. */
export function setDocumentExtractionStatus(
  dataSourceId: string,
  localDocumentId: string,
  status: DocumentExtractionStatus,
  patch: DocumentExtractionRecordPatch = {},
): boolean {
  if (!isDocumentExtractionStatus(status)) return false;
  const current = getDocumentExtractionRecord(dataSourceId, localDocumentId);
  return writeRecord(dataSourceId, localDocumentId, {
    fileMetadataId: null,
    ...current,
    ...patch,
    status,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Finish a run only if it is still the document's current PROCESSING run.
 * Returns false for a stale result (record deleted, reset, or superseded).
 */
export function completeDocumentExtractionRun(
  dataSourceId: string,
  localDocumentId: string,
  runId: string,
  outcome: Extract<DocumentExtractionStatus, "EXTRACTED" | "FAILED">,
  failureReason: string | null = null,
): boolean {
  const current = getDocumentExtractionRecord(dataSourceId, localDocumentId);
  if (!current || current.status !== "PROCESSING" || current.runId !== runId) return false;
  return setDocumentExtractionStatus(dataSourceId, localDocumentId, outcome, {
    failureReason: outcome === "FAILED" ? failureReason : null,
  });
}

/**
 * Remove every record of one Data Source. Only for a creation draft that was
 * discarded before the source existed. Pending runs are cancelled.
 */
export function clearDataSourceExtractionRecords(dataSourceId: string): boolean {
  const ids = Object.keys(readExtractionStatusSnapshot()[dataSourceId] ?? {});
  return ids.every((id) => writeRecord(dataSourceId, id, null));
}

/** Remove a document's record, e.g. after the document is deleted. Cancels any pending run. */
export function clearDocumentExtractionStatus(dataSourceId: string, localDocumentId: string): boolean {
  if (!getDocumentExtractionRecord(dataSourceId, localDocumentId)) return true;
  return writeRecord(dataSourceId, localDocumentId, null);
}

/** Validated records for one Data Source, keyed by localDocumentId. Re-renders on any change. */
export function useDataSourceExtractionStatuses(
  dataSourceId: string,
): Readonly<Record<string, DocumentExtractionStatusRecord>> {
  const snapshot = useSyncExternalStore(
    subscribeExtractionStatus,
    readExtractionStatusSnapshot,
    () => EMPTY_SNAPSHOT,
  );
  return useMemo(() => snapshot[dataSourceId] ?? EMPTY_SOURCE, [snapshot, dataSourceId]);
}
