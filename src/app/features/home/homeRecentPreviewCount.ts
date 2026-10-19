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
