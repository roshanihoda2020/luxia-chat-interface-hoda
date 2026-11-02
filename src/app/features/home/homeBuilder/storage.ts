import { createDefaultHomeLayout } from "./defaultLayout";
import { deserializeHomeLayout, serializeHomeLayout } from "./validation";
import type { HomeLayout } from "./types";

/**
 * Per prototype user. The `v1` segment is the storage format version;
 * bump it (with a migration) if the stored shape ever changes incompatibly.
 * Independent of the existing shared Home preference keys.
 */
const HOME_LAYOUT_STORAGE_PREFIX = "luxia-home-layout:v1:";

export function getHomeLayoutStorageKey(userId: string): string {
  return `${HOME_LAYOUT_STORAGE_PREFIX}${userId}`;
}

export type HomeLayoutReadResult = {
  layout: HomeLayout;
  /** "default" when nothing was saved, the saved value was invalid, or storage failed. */
  source: "saved" | "default";
  /** Why a saved value was rejected, for debugging. */
  error?: string;
};

/**
 * Always returns a usable layout. An invalid saved value is left in place
 * (not deleted) so it can be inspected; the default is used instead.
 */
export function readHomeLayout(userId: string): HomeLayoutReadResult {
  if (!userId) return { layout: createDefaultHomeLayout(), source: "default" };
  try {
    const raw = localStorage.getItem(getHomeLayoutStorageKey(userId));
    if (raw === null) return { layout: createDefaultHomeLayout(), source: "default" };
    const parsed = deserializeHomeLayout(raw);
    if (!parsed.ok) {
      return { layout: createDefaultHomeLayout(), source: "default", error: parsed.error };
    }
    return { layout: parsed.layout, source: "saved" };
  } catch {
    return { layout: createDefaultHomeLayout(), source: "default", error: "storage unavailable" };
  }
}

/** Saves only a valid layout. Returns false when invalid or storage fails. */
export function writeHomeLayout(userId: string, layout: HomeLayout): boolean {
  if (!userId) return false;
  const text = serializeHomeLayout(layout);
  if (text === null) return false;
  try {
    localStorage.setItem(getHomeLayoutStorageKey(userId), text);
    return true;
  } catch {
    return false;
  }
}

/** Reset to default: removes this user's saved layout only. */
export function clearHomeLayout(userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(getHomeLayoutStorageKey(userId));
  } catch {
    /* ignore quota / private-mode failures */
  }
}
