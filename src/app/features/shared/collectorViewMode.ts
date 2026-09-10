export type CollectorViewMode = "grid" | "list";

export type CollectorViewKey = "projects" | "dashboard" | "home-projects";

const STORAGE_PREFIX = "luxia-collector-view-";

const DEFAULT_MODE: CollectorViewMode = "grid";

function storageKey(collector: CollectorViewKey): string {
  return `${STORAGE_PREFIX}${collector}`;
}

function parseMode(value: string | null): CollectorViewMode {
  return value === "list" ? "list" : DEFAULT_MODE;
}

/** Invalid or missing values fall back to Grid (current approved default). */
export function readCollectorViewMode(collector: CollectorViewKey): CollectorViewMode {
  try {
    return parseMode(localStorage.getItem(storageKey(collector)));
  } catch {
    return DEFAULT_MODE;
  }
}

export function writeCollectorViewMode(
  collector: CollectorViewKey,
  mode: CollectorViewMode,
): void {
  try {
    localStorage.setItem(storageKey(collector), mode);
  } catch {
    /* ignore quota / private-mode failures */
  }
}
