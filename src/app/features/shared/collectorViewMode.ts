export type CollectorViewMode = "grid" | "list";

export type CollectorViewKey = "projects" | "dashboard" | "home-projects";

const STORAGE_PREFIX = "luxia-collector-view-";

const DEFAULT_MODE: CollectorViewMode = "grid";

function storageKey(collector: CollectorViewKey): string {
  return `${STORAGE_PREFIX}${collector}`;
}

function defaultModeFor(collector: CollectorViewKey): CollectorViewMode {
  // Home Recent projects opens in List; full Projects/Dashboard keep Grid.
  return collector === "home-projects" ? "list" : DEFAULT_MODE;
}

function parseMode(
  value: string | null,
  fallback: CollectorViewMode,
): CollectorViewMode {
  if (value === "list" || value === "grid") return value;
  return fallback;
}

/** Invalid or missing values fall back to the collector default. */
export function readCollectorViewMode(collector: CollectorViewKey): CollectorViewMode {
  const fallback = defaultModeFor(collector);
  try {
    return parseMode(localStorage.getItem(storageKey(collector)), fallback);
  } catch {
    return fallback;
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
