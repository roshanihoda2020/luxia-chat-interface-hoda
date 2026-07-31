const PINNED_PROJECTS_KEY = "luxia-home-pinned-projects";

export const DEFAULT_PINNED_PROJECT_IDS: string[] = [
  "project-02",
  "project-05",
  "project-09",
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

export function readPinnedProjectIds(): string[] {
  return readJson<string[]>(PINNED_PROJECTS_KEY, DEFAULT_PINNED_PROJECT_IDS);
}

export function writePinnedProjectIds(ids: string[]): void {
  writeJson(PINNED_PROJECTS_KEY, ids);
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
