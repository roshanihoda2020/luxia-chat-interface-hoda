import { useMemo, useSyncExternalStore } from "react";

/**
 * Prototype AI tag-suggestion store, separate from Tag assignments.
 *
 * localStorage key `luxia.document-tag-suggestions.v1`:
 * { version: 1, sources: { [dataSourceId]: { [localDocumentId]: DocumentTagSuggestionRecord } } }
 *
 * A suggestion never applies a tag. Accepting one writes a normal document tag
 * through the Tag store and marks the suggestion "accepted" here.
 */
export const TAG_SUGGESTION_STORAGE_KEY = "luxia.document-tag-suggestions.v1";
const STORE_VERSION = 1;

/** pending → accepted | rejected; pending → stale when the document's content changed. */
export type TagSuggestionState = "pending" | "accepted" | "rejected" | "stale";

/** What the prototype read to make the suggestion. */
export type TagSuggestionBasis = "extracted-text" | "filename";

export interface TagSuggestionItem {
  id: string;
  /** Display label of the suggested tag. */
  label: string;
  /** Normalized concept key used to collapse synonyms. */
  conceptKey: string;
  /** Existing Organization tag definition with this name, when there is one. */
  tagId: string | null;
  /** True when the tag is not yet used by any document of this Data Source. */
  isNewToVocabulary: boolean;
  state: TagSuggestionState;
  /** Words in the read text that matched, for transparency. */
  evidence: string[];
}

export interface DocumentTagSuggestionRecord {
  generatedAt: string;
  basis: TagSuggestionBasis;
  /** Fingerprint of the text the suggestions were made from. */
  contentFingerprint: string;
  /** Always "prototype-rules": no AI model is called in this prototype. */
  generator: "prototype-rules";
  items: TagSuggestionItem[];
}

type Snapshot = Readonly<Record<string, Readonly<Record<string, DocumentTagSuggestionRecord>>>>;

const EMPTY: Snapshot = Object.freeze({});
const EMPTY_SOURCE: Readonly<Record<string, DocumentTagSuggestionRecord>> = Object.freeze({});
const STATES: readonly TagSuggestionState[] = ["pending", "accepted", "rejected", "stale"];
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: Snapshot = EMPTY;

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TAG_SUGGESTION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function sanitizeItem(value: unknown): TagSuggestionItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.label !== "string" || !item.label.trim()) return null;
  if (typeof item.conceptKey !== "string" || !STATES.includes(item.state as TagSuggestionState)) return null;
  return {
    id: item.id,
    label: item.label,
    conceptKey: item.conceptKey,
    tagId: typeof item.tagId === "string" && item.tagId ? item.tagId : null,
    isNewToVocabulary: item.isNewToVocabulary === true,
    state: item.state as TagSuggestionState,
    evidence: Array.isArray(item.evidence) ? item.evidence.filter((e): e is string => typeof e === "string") : [],
  };
}

function sanitizeRecord(value: unknown): DocumentTagSuggestionRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.basis !== "extracted-text" && record.basis !== "filename") return null;
  if (!Array.isArray(record.items)) return null;
  return {
    generatedAt: typeof record.generatedAt === "string" ? record.generatedAt : "",
    basis: record.basis,
    contentFingerprint: typeof record.contentFingerprint === "string" ? record.contentFingerprint : "",
    generator: "prototype-rules",
    items: record.items.map(sanitizeItem).filter((item): item is TagSuggestionItem => Boolean(item)),
  };
}

export function readTagSuggestionSnapshot(): Snapshot {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  const sources = parseObject(raw)?.sources;
  const result: Record<string, Record<string, DocumentTagSuggestionRecord>> = {};
  if (sources && typeof sources === "object") {
    for (const [dataSourceId, documents] of Object.entries(sources as Record<string, unknown>)) {
      if (!documents || typeof documents !== "object") continue;
      const valid: Record<string, DocumentTagSuggestionRecord> = {};
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

export function getDocumentTagSuggestions(
  dataSourceId: string,
  localDocumentId: string,
): DocumentTagSuggestionRecord | null {
  return readTagSuggestionSnapshot()[dataSourceId]?.[localDocumentId] ?? null;
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key === null || event.key === TAG_SUGGESTION_STORAGE_KEY) notify();
}

export function subscribeTagSuggestions(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/**
 * Apply `update` to one Data Source's records and write back, keeping
 * unknown entries. Refuses to overwrite storage it cannot parse.
 */
function updateSource(
  dataSourceId: string,
  update: (documents: Record<string, unknown>) => void,
): boolean {
  if (typeof window === "undefined" || !dataSourceId) return false;
  const raw = readRaw();
  const root = raw ? parseObject(raw) : { version: STORE_VERSION, sources: {} };
  if (!root) return false;
  const sources = root.sources && typeof root.sources === "object" ? { ...(root.sources as Record<string, unknown>) } : {};
  const current = sources[dataSourceId];
  const documents = current && typeof current === "object" ? { ...(current as Record<string, unknown>) } : {};
  update(documents);
  if (Object.keys(documents).length > 0) sources[dataSourceId] = documents;
  else delete sources[dataSourceId];
  try {
    window.localStorage.setItem(TAG_SUGGESTION_STORAGE_KEY, JSON.stringify({ ...root, version: STORE_VERSION, sources }));
  } catch {
    return false;
  }
  notify();
  return true;
}

export function writeDocumentTagSuggestions(
  dataSourceId: string,
  localDocumentId: string,
  record: DocumentTagSuggestionRecord,
): boolean {
  return updateSource(dataSourceId, (documents) => {
    documents[localDocumentId] = record;
  });
}

export function setTagSuggestionState(
  dataSourceId: string,
  localDocumentId: string,
  itemIds: readonly string[],
  state: TagSuggestionState,
  tagId?: string | null,
): boolean {
  const record = getDocumentTagSuggestions(dataSourceId, localDocumentId);
  if (!record) return false;
  const ids = new Set(itemIds);
  return writeDocumentTagSuggestions(dataSourceId, localDocumentId, {
    ...record,
    items: record.items.map((item) => (ids.has(item.id)
      ? { ...item, state, tagId: tagId === undefined ? item.tagId : tagId }
      : item)),
  });
}

/** Remove one document's suggestions (document deleted or removed from a draft). */
export function clearDocumentTagSuggestions(dataSourceId: string, localDocumentId: string): boolean {
  if (!getDocumentTagSuggestions(dataSourceId, localDocumentId)) return true;
  return updateSource(dataSourceId, (documents) => {
    delete documents[localDocumentId];
  });
}

/** Remove all suggestions of a creation draft discarded before its Data Source existed. */
export function clearDataSourceTagSuggestions(dataSourceId: string): boolean {
  if (!readTagSuggestionSnapshot()[dataSourceId]) return true;
  return updateSource(dataSourceId, (documents) => {
    for (const key of Object.keys(documents)) delete documents[key];
  });
}

export function useDataSourceTagSuggestions(
  dataSourceId: string,
): Readonly<Record<string, DocumentTagSuggestionRecord>> {
  const snapshot = useSyncExternalStore(subscribeTagSuggestions, readTagSuggestionSnapshot, () => EMPTY);
  return useMemo(() => snapshot[dataSourceId] ?? EMPTY_SOURCE, [snapshot, dataSourceId]);
}
