import { useSyncExternalStore } from "react";
import { readUserHomePreference, writeUserHomePreference } from "@/app/features/home/homePreferenceScope";
import type { ExploreEntry } from "./types";

/**
 * Per-user What's New state, three separate things:
 * - read: updates the user opened (saved per user).
 * - dismissed: Home notices hidden with × in THIS page session only (memory,
 *   never saved); a refresh may show the notice again while it is unread.
 * - preferences: Home notices and the unread dot (saved per user).
 *
 * Prototype: saved per user in this browser (homePreferenceScope).
 * Production: needs server-backed preferences and a read ledger so the state
 * follows the user across devices.
 *
 * Concept Demo reads are tracked in memory only and never saved.
 * Operational and security alerts are not governed by these preferences.
 */
export interface ExploreUserState {
  read: string[];
  /** Hidden from the Home notice in this page session (not saved). */
  dismissed: string[];
  hideHomeNotices: boolean;
  hideIndicator: boolean;
}

const STORAGE_KEY = "luxia-explore-state";
const EMPTY: ExploreUserState = { read: [], dismissed: [], hideHomeNotices: false, hideIndicator: false };

const cache = new Map<string, ExploreUserState>();
/** Concept Demo read / dismissed ids, per user, for this tab only. */
const demoState = new Map<string, { read: Set<string>; dismissed: Set<string> }>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function demoFor(userId: string) {
  let entry = demoState.get(userId);
  if (!entry) {
    entry = { read: new Set(), dismissed: new Set() };
    demoState.set(userId, entry);
  }
  return entry;
}

function readSaved(userId: string): ExploreUserState {
  const raw = readUserHomePreference(STORAGE_KEY, userId);
  if (!raw) return EMPTY;
  try {
    const data = JSON.parse(raw) as Partial<ExploreUserState>;
    const ids = (value: unknown) => (Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
    // Dismissals are per page session now; any saved by an earlier version are ignored (read state untouched).
    return {
      read: ids(data.read),
      dismissed: [],
      hideHomeNotices: data.hideHomeNotices === true,
      hideIndicator: data.hideIndicator === true,
    };
  } catch {
    return EMPTY;
  }
}

/** The user's state, with this session's dismissals and Concept Demo reads merged in (not saved). */
export function getExploreUserState(userId: string): ExploreUserState {
  let saved = cache.get(userId);
  if (!saved) {
    saved = readSaved(userId);
    cache.set(userId, saved);
  }
  const demo = demoState.get(userId);
  if (!demo || (demo.read.size === 0 && demo.dismissed.size === 0)) return saved;
  const key = `${userId}::demo`;
  const merged = {
    ...saved,
    read: [...saved.read, ...demo.read],
    dismissed: [...saved.dismissed, ...demo.dismissed],
  };
  const previous = cache.get(key);
  if (previous && JSON.stringify(previous) === JSON.stringify(merged)) return previous;
  cache.set(key, merged);
  return merged;
}

function save(userId: string, next: ExploreUserState) {
  cache.set(userId, next);
  writeUserHomePreference(STORAGE_KEY, userId, {
    read: next.read,
    hideHomeNotices: next.hideHomeNotices,
    hideIndicator: next.hideIndicator,
  });
  emit();
}

function updateIds(userId: string, entry: ExploreEntry, field: "read" | "dismissed", add: boolean) {
  // Concept reads, and every dismissal, live in memory for this page session only.
  if (entry.publication === "concept" || field === "dismissed") {
    const set = demoFor(userId)[field];
    if (add) set.add(entry.id);
    else set.delete(entry.id);
    emit();
    return;
  }
  const current = getExploreUserState(userId);
  const saved = cache.get(userId) ?? current;
  const has = saved[field].includes(entry.id);
  if (add === has) return;
  save(userId, { ...saved, [field]: add ? [...saved[field], entry.id] : saved[field].filter((id) => id !== entry.id) });
}

export function markExploreEntryRead(userId: string, entry: ExploreEntry): void {
  updateIds(userId, entry, "read", true);
}

/** Hides the Home notice for this update until the page is reloaded. Never marks it read. */
export function dismissExploreEntry(userId: string, entry: ExploreEntry): void {
  updateIds(userId, entry, "dismissed", true);
}

export function restoreExploreEntry(userId: string, entry: ExploreEntry): void {
  updateIds(userId, entry, "dismissed", false);
}

export function setExplorePreference(
  userId: string,
  preference: "hideHomeNotices" | "hideIndicator",
  value: boolean,
): void {
  const saved = cache.get(userId) ?? readSaved(userId);
  if (saved[preference] === value) return;
  save(userId, { ...saved, [preference]: value });
}

export function useExploreUserState(userId: string): ExploreUserState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => getExploreUserState(userId),
    () => EMPTY,
  );
}

/**
 * The announcement each user's Home shows in this page session (memory only).
 * Once chosen it is the only one until reload, so Home never cycles notices.
 */
const sessionNoticeIds = new Map<string, string>();

export function getSessionNoticeId(userId: string): string | undefined {
  return sessionNoticeIds.get(userId);
}

export function setSessionNoticeId(userId: string, updateId: string): void {
  if (!sessionNoticeIds.has(userId)) sessionNoticeIds.set(userId, updateId);
}

/**
 * Internal demo builds only: brings the Home notice back for presenting.
 * For this user: marks updates unread, clears this session's hidden notices and
 * notice choice, and turns "Show updates on Home" back on (the one preference
 * that would otherwise keep the notice away). Keeps the unread-indicator
 * preference, Home layouts, other users and all other data.
 */
export function resetDemoNotifications(userId: string): void {
  const saved = cache.get(userId) ?? readSaved(userId);
  demoState.delete(userId);
  sessionNoticeIds.delete(userId);
  save(userId, { ...saved, read: [], dismissed: [], hideHomeNotices: false });
}
