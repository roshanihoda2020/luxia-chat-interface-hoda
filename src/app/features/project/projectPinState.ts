import {
  readUserHomePreference,
  writeUserHomePreference,
} from "@/app/features/home/homePreferenceScope";

/** Base key; each user's pins are saved under their own key (see homePreferenceScope). */
const PINNED_PROJECTS_KEY = "luxia-home-pinned-projects";

export const DEFAULT_PINNED_PROJECT_IDS: string[] = [
  "project-02",
];

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Pins seeded by an earlier prototype release; dropped whenever they are read. */
const REMOVED_SEEDED_PIN_IDS = new Set([
  "project-07",
  "project-08",
  "project-09",
  "project-10",
]);

/**
 * This user's saved pins, distinguishing three cases:
 * - Nothing saved (or unreadable / not a list of ids) → the default pins.
 * - A saved empty list → no pins. Unpinning every Project is a real choice and persists.
 * - A saved non-empty list → those pins, minus retired seeded ids. If only retired
 *   seeded ids were saved, the user never chose them, so the defaults apply.
 */
export function readPinnedProjectIds(userId: string): string[] {
  const saved = parseJson(readUserHomePreference(PINNED_PROJECTS_KEY, userId));
  if (!Array.isArray(saved) || !saved.every((id) => typeof id === "string")) {
    return [...DEFAULT_PINNED_PROJECT_IDS];
  }
  if (saved.length === 0) return [];
  const filtered = saved.filter((id) => !REMOVED_SEEDED_PIN_IDS.has(id));
  return filtered.length > 0 ? filtered : [...DEFAULT_PINNED_PROJECT_IDS];
}

export function writePinnedProjectIds(userId: string, ids: string[]): void {
  writeUserHomePreference(PINNED_PROJECTS_KEY, userId, ids);
}

export function togglePinnedProjectId(
  current: string[],
  projectId: string,
): string[] {
  if (current.includes(projectId)) {
    return current.filter((id) => id !== projectId);
  }
  return [projectId, ...current];
}
