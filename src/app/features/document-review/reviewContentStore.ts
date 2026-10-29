import { useMemo, useSyncExternalStore } from "react";
import {
  getDocumentExtractionStatus,
  setDocumentExtractionStatus,
} from "@/app/features/data-sources/documents";
import {
  cloneReviewPages,
  isReviewSampleFixtureDocument,
  REVIEW_SAMPLE_PAGES,
  type ReviewPage,
} from "./reviewSampleFixtures";

/**
 * Prototype review-content store, separate from the Tag and extraction-status stores.
 *
 * localStorage key `luxia.document-review-content.v1`:
 * { version: 1, sources: { [dataSourceId]: { [localDocumentId]: DocumentReviewRecord } } }
 *
 * Only saved corrections and approvals are written. Unsaved edits stay in the
 * workspace. Content is never generated from a filename: a document has
 * content only when a record exists or it is the explicit sample fixture.
 */
export const REVIEW_CONTENT_STORAGE_KEY = "luxia.document-review-content.v1";
const STORE_VERSION = 1;

/** Where the reviewable Markdown came from. Production would add "extraction". */
export type ReviewContentOrigin = "sample-fixture";

export interface DocumentReviewRecord {
  origin: ReviewContentOrigin;
  pages: ReviewPage[];
  /** Last explicit Save Changes. */
  savedAt: string | null;
  savedByUserId: string | null;
  /**
   * PROTOTYPE-LOCAL snapshot taken at approval, never shown in the UI. The
   * production backend stores one Markdown text per file: saving an edit
   * overwrites it and resets the status to EXTRACTED, so no approved copy
   * survives an edit. Kept only for local compatibility; drop it when the
   * store is replaced by the backend adapter.
   */
  approvedPages: ReviewPage[] | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
  /** Production `fileMetadataId`, once a backend supplies it. */
  fileMetadataId: string | null;
}

export interface DocumentReviewContent {
  origin: ReviewContentOrigin;
  pages: ReviewPage[];
  record: DocumentReviewRecord | null;
}

type Snapshot = Readonly<Record<string, Readonly<Record<string, DocumentReviewRecord>>>>;

const EMPTY: Snapshot = Object.freeze({});
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: Snapshot = EMPTY;

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(REVIEW_CONTENT_STORAGE_KEY);
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

function sanitizePages(value: unknown): ReviewPage[] | null {
  if (!Array.isArray(value)) return null;
  const pages: ReviewPage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const page = item as Record<string, unknown>;
    if (typeof page.pageNumber !== "number" || typeof page.markdown !== "string") return null;
    pages.push({ pageNumber: page.pageNumber, markdown: page.markdown });
  }
  return pages.length > 0 ? pages : null;
}

function sanitizeRecord(value: unknown): DocumentReviewRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.origin !== "sample-fixture") return null;
  const pages = sanitizePages(record.pages);
  if (!pages) return null;
  const text = (item: unknown) => (typeof item === "string" && item ? item : null);
  return {
    origin: "sample-fixture",
    pages,
    savedAt: text(record.savedAt),
    savedByUserId: text(record.savedByUserId),
    approvedPages: sanitizePages(record.approvedPages),
    approvedAt: text(record.approvedAt),
    approvedByUserId: text(record.approvedByUserId),
    fileMetadataId: text(record.fileMetadataId),
  };
}

function readSnapshot(): Snapshot {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  const sources = parseObject(raw)?.sources;
  const result: Record<string, Record<string, DocumentReviewRecord>> = {};
  if (sources && typeof sources === "object") {
    for (const [dataSourceId, documents] of Object.entries(sources as Record<string, unknown>)) {
      if (!documents || typeof documents !== "object") continue;
      const valid: Record<string, DocumentReviewRecord> = {};
      for (const [documentId, value] of Object.entries(documents as Record<string, unknown>)) {
        const record = sanitizeRecord(value);
        if (record) valid[documentId] = record;
      }
      if (Object.keys(valid).length > 0) result[dataSourceId] = valid;
    }
  }
  cachedSnapshot = result;
  return cachedSnapshot;
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key === null || event.key === REVIEW_CONTENT_STORAGE_KEY) notify();
}

export function subscribeReviewContent(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Merge one record into storage, keeping unknown entries. Refuses unparseable storage. */
function writeRecord(dataSourceId: string, localDocumentId: string, record: DocumentReviewRecord): boolean {
  if (typeof window === "undefined") return false;
  const raw = readRaw();
  const root = raw ? parseObject(raw) : { version: STORE_VERSION, sources: {} };
  if (!root) return false;
  const sources = root.sources && typeof root.sources === "object"
    ? { ...(root.sources as Record<string, unknown>) }
    : {};
  const current = sources[dataSourceId];
  const documents = current && typeof current === "object" ? { ...(current as Record<string, unknown>) } : {};
  documents[localDocumentId] = record;
  sources[dataSourceId] = documents;
  try {
    window.localStorage.setItem(
      REVIEW_CONTENT_STORAGE_KEY,
      JSON.stringify({ ...root, version: STORE_VERSION, sources }),
    );
  } catch {
    return false;
  }
  notify();
  return true;
}

/** Remove one draft document's review content (removed before its Data Source existed). */
export function clearDocumentReviewContent(dataSourceId: string, localDocumentId: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = readRaw();
  const root = parseObject(raw);
  if (!root) return raw === null;
  const sources = root.sources && typeof root.sources === "object"
    ? { ...(root.sources as Record<string, unknown>) }
    : {};
  const current = sources[dataSourceId];
  if (!current || typeof current !== "object" || !(localDocumentId in current)) return true;
  const documents = { ...(current as Record<string, unknown>) };
  delete documents[localDocumentId];
  sources[dataSourceId] = documents;
  try {
    window.localStorage.setItem(REVIEW_CONTENT_STORAGE_KEY, JSON.stringify({ ...root, sources }));
  } catch {
    return false;
  }
  notify();
  return true;
}

/** Remove all review content of a creation draft discarded before the source existed. */
export function clearDataSourceReviewContent(dataSourceId: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = readRaw();
  const root = parseObject(raw);
  if (!root) return raw === null;
  const sources = root.sources && typeof root.sources === "object"
    ? { ...(root.sources as Record<string, unknown>) }
    : {};
  if (!(dataSourceId in sources)) return true;
  delete sources[dataSourceId];
  try {
    window.localStorage.setItem(REVIEW_CONTENT_STORAGE_KEY, JSON.stringify({ ...root, sources }));
  } catch {
    return false;
  }
  notify();
  return true;
}

export function getDocumentReviewRecord(dataSourceId: string, localDocumentId: string): DocumentReviewRecord | null {
  return readSnapshot()[dataSourceId]?.[localDocumentId] ?? null;
}

/** Reviewable content for a document, or null when none exists. Never derived from the filename. */
export function getDocumentReviewContent(
  dataSourceId: string,
  localDocumentId: string,
): DocumentReviewContent | null {
  const record = getDocumentReviewRecord(dataSourceId, localDocumentId);
  if (record) return { origin: record.origin, pages: cloneReviewPages(record.pages), record };
  if (isReviewSampleFixtureDocument(dataSourceId, localDocumentId)) {
    return { origin: "sample-fixture", pages: cloneReviewPages(REVIEW_SAMPLE_PAGES), record: null };
  }
  return null;
}

export function hasReviewableContent(content: DocumentReviewContent | null): boolean {
  return Boolean(content?.pages.some((page) => page.markdown.trim().length > 0));
}

function pagesEqual(a: readonly ReviewPage[], b: readonly ReviewPage[]): boolean {
  return a.length === b.length
    && a.every((page, index) => page.pageNumber === b[index]!.pageNumber && page.markdown === b[index]!.markdown);
}

/**
 * Explicit Save Changes. A real change to approved content returns the
 * document to To review (EXTRACTED); the approved snapshot is kept.
 */
export function saveDocumentReviewContent(
  dataSourceId: string,
  localDocumentId: string,
  pages: readonly ReviewPage[],
  userId: string | null,
): { saved: boolean; changed: boolean; reopenedForReview: boolean } {
  const content = getDocumentReviewContent(dataSourceId, localDocumentId);
  if (!content) return { saved: false, changed: false, reopenedForReview: false };
  const changed = !pagesEqual(content.pages, pages);
  if (!changed) return { saved: true, changed: false, reopenedForReview: false };
  const base = content.record;
  const saved = writeRecord(dataSourceId, localDocumentId, {
    origin: content.origin,
    pages: cloneReviewPages(pages),
    savedAt: new Date().toISOString(),
    savedByUserId: userId,
    approvedPages: base?.approvedPages ?? null,
    approvedAt: base?.approvedAt ?? null,
    approvedByUserId: base?.approvedByUserId ?? null,
    fileMetadataId: base?.fileMetadataId ?? null,
  });
  if (!saved) return { saved: false, changed: true, reopenedForReview: false };
  let reopenedForReview = false;
  if (getDocumentExtractionStatus(dataSourceId, localDocumentId) === "REVIEWED") {
    reopenedForReview = setDocumentExtractionStatus(dataSourceId, localDocumentId, "EXTRACTED");
  }
  return { saved: true, changed: true, reopenedForReview };
}

/**
 * Explicit human approval of one document. Only an EXTRACTED document with
 * reviewable content can be approved; the status becomes REVIEWED only after
 * the approval record is stored.
 */
export function approveDocumentReview(
  dataSourceId: string,
  localDocumentId: string,
  userId: string | null,
): boolean {
  if (getDocumentExtractionStatus(dataSourceId, localDocumentId) !== "EXTRACTED") return false;
  const content = getDocumentReviewContent(dataSourceId, localDocumentId);
  if (!content || !hasReviewableContent(content)) return false;
  const base = content.record;
  const now = new Date().toISOString();
  const stored = writeRecord(dataSourceId, localDocumentId, {
    origin: content.origin,
    pages: cloneReviewPages(content.pages),
    savedAt: base?.savedAt ?? null,
    savedByUserId: base?.savedByUserId ?? null,
    approvedPages: cloneReviewPages(content.pages),
    approvedAt: now,
    approvedByUserId: userId,
    fileMetadataId: base?.fileMetadataId ?? null,
  });
  if (!stored) return false;
  return setDocumentExtractionStatus(dataSourceId, localDocumentId, "REVIEWED", { lastReviewedAt: now });
}

/** Content for one document that re-renders on any store change. */
export function useDocumentReviewContent(
  dataSourceId: string,
  localDocumentId: string,
): DocumentReviewContent | null {
  const snapshot = useSyncExternalStore(subscribeReviewContent, readSnapshot, () => EMPTY);
  return useMemo(
    () => getDocumentReviewContent(dataSourceId, localDocumentId),
    // `snapshot` identity changes whenever stored content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshot, dataSourceId, localDocumentId],
  );
}
