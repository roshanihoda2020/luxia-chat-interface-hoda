/**
 * Navigation history foundation for Global Back.
 *
 * Native browser history stays the ONE source of truth. Every in-app history write goes through
 * `luxiaHistory.push` / `luxiaHistory.replace` (same signature as pushState/replaceState), which
 * stamp three small fields on the entry's state:
 *
 *   luxiaTab   — id of this browser tab (sessionStorage), so entries from another tab / stale
 *                sessions are never trusted;
 *   luxiaIndex — the entry's position in this tab's in-app history;
 *   luxiaKey   — a unique id per entry, so repeated visits to the same URL stay distinct.
 *
 * A tiny per-tab record (sessionStorage) keeps the key at each index. Push truncates it after the
 * current entry (the abandoned Forward branch is no longer valid, exactly like the browser);
 * replace overwrites the current slot (forward entries stay, like the browser); popstate changes
 * nothing (history.state is authoritative for the current entry).
 *
 * The record only answers "is there a valid previous in-app entry?". It never decides routes or
 * permissions — `applyPath` and the existing guards still do that.
 */

const TAB_STORAGE_KEY = "luxia-nav-tab";
const RECORD_STORAGE_KEY = "luxia-nav-entries";

export interface LuxiaHistoryMeta {
  luxiaTab: string;
  luxiaIndex: number;
  luxiaKey: string;
}

export interface LuxiaHistoryContext {
  /** Position of the current entry in this tab's in-app history (0 = first known entry). */
  index: number;
  /** True only when the previous entry is a verified in-app entry of this tab. */
  canGoBack: boolean;
  /** True when a verified in-app entry exists after the current one (Forward). */
  canGoForward: boolean;
}

type EntryKey = string | null; // null = unknown slot (never trusted as a Back target)
interface HistoryRecord { tab: string; keys: EntryKey[] }

let memoryTabId: string | null = null;
let memoryRecord: HistoryRecord | null = null;
/**
 * Index of the entry the APP is currently showing ("settled"). Set by push/replace and by
 * `markLuxiaHistorySettled()` after popstate handling. During a popstate it still holds the page
 * the user is leaving, so guards can compute how far the browser moved.
 */
let settledIndex: number | null = null;

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch { /* fall through */ }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** This tab's id. sessionStorage is per tab and survives refresh; memory fallback if blocked. */
export function getLuxiaTabId(): string {
  try {
    let id = window.sessionStorage.getItem(TAB_STORAGE_KEY);
    if (!id) {
      id = newId();
      window.sessionStorage.setItem(TAB_STORAGE_KEY, id);
    }
    return id;
  } catch {
    memoryTabId ??= newId();
    return memoryTabId;
  }
}

/** Valid metadata of THIS tab, or null (missing / malformed / from another tab → fail safe). */
export function readLuxiaHistoryMeta(state: unknown): LuxiaHistoryMeta | null {
  if (!state || typeof state !== "object") return null;
  const { luxiaTab, luxiaIndex, luxiaKey } = state as Partial<LuxiaHistoryMeta>;
  if (typeof luxiaTab !== "string" || luxiaTab !== getLuxiaTabId()) return null;
  if (typeof luxiaIndex !== "number" || !Number.isInteger(luxiaIndex) || luxiaIndex < 0) return null;
  if (typeof luxiaKey !== "string" || !luxiaKey) return null;
  return { luxiaTab, luxiaIndex, luxiaKey };
}

function readRecord(): EntryKey[] {
  const tab = getLuxiaTabId();
  let record: HistoryRecord | null = null;
  try {
    const raw = window.sessionStorage.getItem(RECORD_STORAGE_KEY);
    record = raw ? (JSON.parse(raw) as HistoryRecord) : null;
  } catch {
    record = memoryRecord;
  }
  if (!record || record.tab !== tab || !Array.isArray(record.keys)) return [];
  return record.keys.map((k) => (typeof k === "string" && k ? k : null));
}

function writeRecord(keys: EntryKey[]) {
  const record: HistoryRecord = { tab: getLuxiaTabId(), keys };
  memoryRecord = record;
  try {
    window.sessionStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(record));
  } catch { /* memory fallback already updated */ }
}

/** keys[0..length-1], with unknown slots filled by null. */
function sized(keys: EntryKey[], length: number): EntryKey[] {
  const out = keys.slice(0, length);
  while (out.length < length) out.push(null);
  return out;
}

function withMeta(state: unknown, meta: LuxiaHistoryMeta): Record<string, unknown> {
  // The caller's state is applied exactly as before; only the navigation metadata is added.
  const base = state && typeof state === "object" ? (state as Record<string, unknown>) : {};
  return { ...base, ...meta };
}

/** pushState replacement: a NEW in-app entry after the current one (drops the Forward branch). */
function push(state: unknown, _unused: string, url?: string | URL | null) {
  const current = readLuxiaHistoryMeta(window.history.state);
  const tab = getLuxiaTabId();
  // Unknown current entry (direct entry / pre-foundation state): its slot stays untrusted.
  const currentIndex = current ? current.luxiaIndex : freshEntryIndex();
  const keys = sized(readRecord(), currentIndex + 1);
  keys[currentIndex] = current ? current.luxiaKey : null;
  const meta: LuxiaHistoryMeta = { luxiaTab: tab, luxiaIndex: currentIndex + 1, luxiaKey: newId() };
  keys.push(meta.luxiaKey);
  writeRecord(keys);
  window.history.pushState(withMeta(state, meta), "", url);
  settledIndex = meta.luxiaIndex;
  notify();
}

/** Index for a fresh, unstamped entry: after anything this tab has numbered, at least its position. */
function freshEntryIndex(): number {
  const position = Math.max(0, (window.history?.length ?? 1) - 1);
  return Math.max(position, readRecord().length);
}

/** replaceState replacement: same position, new entry content (forward entries are kept). */
function replace(state: unknown, _unused: string, url?: string | URL | null) {
  const current = readLuxiaHistoryMeta(window.history.state);
  const tab = getLuxiaTabId();
  // Unstamped current entry = a fresh document entry (direct URL, a URL typed into an existing
  // tab, external arrival). It is the LAST entry of the tab, so it is numbered after every entry
  // this tab already numbered (position-like, never colliding with older entries — the guards'
  // Back/Forward direction maths stays correct). Earlier slots are unknown: never a Back target.
  const index = current ? current.luxiaIndex : freshEntryIndex();
  const keys = current ? readRecord() : [];
  const meta: LuxiaHistoryMeta = { luxiaTab: tab, luxiaIndex: index, luxiaKey: newId() };
  const next = sized(keys, Math.max(keys.length, index + 1));
  next[index] = meta.luxiaKey;
  writeRecord(next);
  window.history.replaceState(withMeta(state, meta), "", url);
  settledIndex = meta.luxiaIndex;
  notify();
}

export const luxiaHistory = { push, replace };

/** Call once the app shows the entry the browser is on (end of popstate handling). */
export function markLuxiaHistorySettled() {
  const current = readLuxiaHistoryMeta(typeof window !== "undefined" ? window.history.state : null);
  settledIndex = current ? current.luxiaIndex : null;
  notify();
}

/**
 * During a popstate: how many steps the browser moved away from the page the app still shows
 * (−1 = one Back, +1 = one Forward). `history.go(-delta)` returns to that exact entry without
 * creating a new one. Null when either side has no trusted metadata (callers must fall back).
 */
export function luxiaHistoryDeltaFromSettled(): number | null {
  const current = readLuxiaHistoryMeta(typeof window !== "undefined" ? window.history.state : null);
  if (!current || settledIndex === null) return null;
  const delta = current.luxiaIndex - settledIndex;
  return delta === 0 ? null : delta;
}

// Development builds only: read-only hook for automated history tests (no UI, no writes).
if (typeof window !== "undefined" && import.meta.env?.DEV) {
  (window as unknown as { __luxiaHistory?: unknown }).__luxiaHistory = {
    context: () => getLuxiaHistoryContext(),
  };
}

/** Where the current entry sits, and whether a verified in-app previous / next entry exists. */
export function getLuxiaHistoryContext(): LuxiaHistoryContext {
  const current = readLuxiaHistoryMeta(typeof window !== "undefined" ? window.history.state : null);
  if (!current) return { index: 0, canGoBack: false, canGoForward: false };
  const keys = readRecord();
  const consistent = keys[current.luxiaIndex] === current.luxiaKey;
  return {
    index: current.luxiaIndex,
    canGoBack: consistent && current.luxiaIndex > 0 && typeof keys[current.luxiaIndex - 1] === "string",
    canGoForward: consistent && typeof keys[current.luxiaIndex + 1] === "string",
  };
}

// ---------------------------------------------------------------------------------------------
// Visible Back: change notifications and heading focus after Back.
// ---------------------------------------------------------------------------------------------

let version = 0;
const listeners = new Set<() => void>();
function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

/** useSyncExternalStore subscription: fires after every in-app history write or popstate. */
export function subscribeLuxiaHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function getLuxiaHistoryVersion(): number {
  return version;
}

/** Key of the entry the browser is on (null for an untrusted entry). */
export function getLuxiaCurrentEntryKey(): string | null {
  return readLuxiaHistoryMeta(typeof window !== "undefined" ? window.history.state : null)?.luxiaKey ?? null;
}

/**
 * True when the app shows the entry the browser is on. False mid-popstate (e.g. while an
 * unsaved-change guard holds the old page).
 */
export function isLuxiaHistorySettled(): boolean {
  const current = readLuxiaHistoryMeta(typeof window !== "undefined" ? window.history.state : null);
  return Boolean(current) && current!.luxiaIndex === settledIndex;
}

/** Whether the visible Back control should show: a verified previous in-app entry exists. */
export function canLuxiaGoBack(): boolean {
  return getLuxiaHistoryContext().canGoBack;
}

/** Back via the visible control: native history.back() (never a push, never a parent fallback). */
let headingFocusRequestedAt = 0;
export function goLuxiaBack() {
  if (!canLuxiaGoBack()) return;
  headingFocusRequestedAt = Date.now();
  window.history.back();
}
/** True once, shortly after a visible-Back navigation: the new page's heading takes focus. */
export function consumeLuxiaHeadingFocusRequest(): boolean {
  const pending = headingFocusRequestedAt > 0 && Date.now() - headingFocusRequestedAt < 2000;
  headingFocusRequestedAt = 0;
  return pending;
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => notify());
  // Clear the obsolete per-entry title record left by earlier builds.
  try { window.sessionStorage.removeItem("luxia-nav-titles"); } catch { /* storage blocked */ }
}

// The page the app shows on first load is the settled entry until the first navigation.
if (typeof window !== "undefined") markLuxiaHistorySettled();
