/** Home Recent projects preview density — not pagination. */

export const HOME_RECENT_PREVIEW_COUNT_OPTIONS = [3, 6, 9, "all"] as const;

export type HomeRecentPreviewCount =
  (typeof HOME_RECENT_PREVIEW_COUNT_OPTIONS)[number];

export const HOME_RECENT_PREVIEW_COUNT_DEFAULT: HomeRecentPreviewCount = 6;

const STORAGE_KEY = "luxia-home-recent-preview-count";

function parseCount(value: string | null): HomeRecentPreviewCount {
  if (value === "all") return "all";
  const parsed = Number(value);
  if (parsed === 3 || parsed === 6 || parsed === 9) {
    return parsed;
  }
  return HOME_RECENT_PREVIEW_COUNT_DEFAULT;
}

/**
 * Slice size for Recent after pinned exclusion.
 * `null` = Show All (no slice — entire eligible accessible collection).
 */
export function resolveHomeRecentPreviewLimit(
  count: HomeRecentPreviewCount,
): number | null {
  return count === "all" ? null : count;
}

export function readHomeRecentPreviewCount(): HomeRecentPreviewCount {
  try {
    return parseCount(localStorage.getItem(STORAGE_KEY));
  } catch {
    return HOME_RECENT_PREVIEW_COUNT_DEFAULT;
  }
}

export function writeHomeRecentPreviewCount(
  count: HomeRecentPreviewCount,
): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(count));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

/**
 * A stored count ("3", "6", "9", "all", or the numbers), or null when the
 * value is missing or not one of the options. Used for per-tile settings,
 * where an invalid value must fall back instead of picking a count silently.
 */
export function parseHomeRecentPreviewCount(value: unknown): HomeRecentPreviewCount | null {
  if (value === "all") return "all";
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return parsed === 3 || parsed === 6 || parsed === 9 ? parsed : null;
}

/** The legacy shared Show choice, or null when none was ever saved (no default filled in). */
export function readSavedHomeRecentPreviewCount(): HomeRecentPreviewCount | null {
  try {
    return parseHomeRecentPreviewCount(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}
