import { LEGACY_HOME_PREFERENCE_OWNER } from "../homePreferenceScope";
import { readSavedHomeRecentPreviewCount } from "../homeRecentPreviewCount";
import { createDefaultHomeLayout } from "./defaultLayout";
import { migrateHomeLayoutData } from "./migration";
import { parseHomeLayout, serializeHomeLayout } from "./validation";
import type { HomeLayout } from "./types";

/**
 * Per prototype user. The `v1` segment is the storage key format, not the
 * layout schema: layouts carry their own `schemaVersion` and older versions
 * are migrated on read (migration.ts). Independent of the Home preference keys.
 */
const HOME_LAYOUT_STORAGE_PREFIX = "luxia-home-layout:v1:";

/** One-time copy of a layout as it was before its first schema migration. Never overwritten. */
const HOME_LAYOUT_BACKUP_PREFIX = "luxia-home-layout:pre-migration-backup:";

export function getHomeLayoutStorageKey(userId: string): string {
  return `${HOME_LAYOUT_STORAGE_PREFIX}${userId}`;
}

export function getHomeLayoutBackupKey(userId: string): string {
  return `${HOME_LAYOUT_BACKUP_PREFIX}${userId}`;
}

export type HomeLayoutReadResult = {
  layout: HomeLayout;
  /** "default" when nothing was saved, the saved value was invalid, or storage failed. */
  source: "saved" | "default";
  /** Schema version the saved layout was migrated from, if it was. */
  migratedFrom?: number;
  /** Why a saved value was rejected, for debugging. */
  error?: string;
};

/**
 * Always returns a usable layout. An older saved layout is migrated in memory;
 * the stored text stays as it was until the user's next change saves the new
 * version, and a copy of it is kept once under the backup key. An invalid
 * saved value is left in place (not deleted) so it can be inspected; the
 * default is used instead.
 */
export function readHomeLayout(userId: string): HomeLayoutReadResult {
  if (!userId) return { layout: createDefaultHomeLayout(), source: "default" };
  try {
    const raw = localStorage.getItem(getHomeLayoutStorageKey(userId));
    if (raw === null) return { layout: createDefaultHomeLayout(), source: "default" };
    let data: unknown;
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      return { layout: createDefaultHomeLayout(), source: "default", error: "stored layout is not valid JSON" };
    }
    const migration = migrateHomeLayoutData(data, {
      // The old shared Show choice belongs to the identity sessions start as (homePreferenceScope).
      legacyRecentLimit: userId === LEGACY_HOME_PREFERENCE_OWNER
        ? (() => {
          const count = readSavedHomeRecentPreviewCount();
          return count === null ? null : String(count);
        })()
        : null,
    });
    const parsed = parseHomeLayout(migration.data);
    if (!parsed.ok) {
      return { layout: createDefaultHomeLayout(), source: "default", error: parsed.error };
    }
    if (migration.migratedFrom !== undefined) backUpHomeLayoutOnce(userId, raw);
    return { layout: parsed.layout, source: "saved", migratedFrom: migration.migratedFrom };
  } catch {
    return { layout: createDefaultHomeLayout(), source: "default", error: "storage unavailable" };
  }
}

function backUpHomeLayoutOnce(userId: string, raw: string): void {
  try {
    const key = getHomeLayoutBackupKey(userId);
    if (localStorage.getItem(key) === null) localStorage.setItem(key, raw);
  } catch {
    /* a missing backup never blocks reading the layout */
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

/** Reset to default: removes this user's saved layout only (any migration backup is kept). */
export function clearHomeLayout(userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(getHomeLayoutStorageKey(userId));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

/**
 * My Default: one optional snapshot of a Home Layout the user chose to keep,
 * separate from the automatically saved current Home. Per prototype user, in
 * this browser only. Reset to Luxia Default never touches it.
 */
const HOME_MY_DEFAULT_STORAGE_PREFIX = "luxia-home-my-default:v1:";

export function getHomeMyDefaultStorageKey(userId: string): string {
  return `${HOME_MY_DEFAULT_STORAGE_PREFIX}${userId}`;
}

export interface HomeMyDefault {
  layout: HomeLayout;
  savedAt: number;
}

/** The user's My Default, or null when none is saved or the saved value is unusable. */
export function readHomeMyDefault(userId: string): HomeMyDefault | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(getHomeMyDefaultStorageKey(userId));
    if (raw === null) return null;
    const data = JSON.parse(raw) as { savedAt?: unknown; layout?: unknown };
    const parsed = parseHomeLayout(migrateHomeLayoutData(data.layout, { legacyRecentLimit: null }).data);
    if (!parsed.ok) return null;
    return { layout: parsed.layout, savedAt: typeof data.savedAt === "number" ? data.savedAt : 0 };
  } catch {
    return null;
  }
}

/** Saves a copy of `layout` as the user's My Default. Returns the snapshot, or null when invalid or storage fails. */
export function writeHomeMyDefault(userId: string, layout: HomeLayout, savedAt = Date.now()): HomeMyDefault | null {
  if (!userId) return null;
  const text = serializeHomeLayout(layout);
  if (text === null) return null;
  try {
    localStorage.setItem(
      getHomeMyDefaultStorageKey(userId),
      JSON.stringify({ savedAt, layout: JSON.parse(text) as unknown }),
    );
    return { layout: JSON.parse(text) as HomeLayout, savedAt };
  } catch {
    return null;
  }
}
