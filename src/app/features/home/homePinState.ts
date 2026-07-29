import type { HomeEntityKey } from "./homeEntityKeys";

const PINNED_PROJECTS_KEY = "luxia-home-pinned-projects";
const PINNED_ENTITY_ORDER_KEY = "luxia-home-pinned-entity-order";

/** Prototype seed when no pin order has been persisted yet. */
export const DEFAULT_PINNED_ENTITY_ORDER: HomeEntityKey[] = [
  "chat:chat-01",
  "chat:chat-04",
  "galaxy:galaxy-02",
];

/** Prototype Project Pin seed — prioritized in the Home Projects preview. */
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
    /* ignore */
  }
}

export function readPinnedProjectIds(): string[] {
  return readJson<string[]>(PINNED_PROJECTS_KEY, DEFAULT_PINNED_PROJECT_IDS);
}

export function writePinnedProjectIds(ids: string[]): void {
  writeJson(PINNED_PROJECTS_KEY, ids);
}

export function readPinnedEntityOrder(): HomeEntityKey[] {
  return readJson<HomeEntityKey[]>(PINNED_ENTITY_ORDER_KEY, DEFAULT_PINNED_ENTITY_ORDER);
}

export function writePinnedEntityOrder(order: HomeEntityKey[]): void {
  writeJson(PINNED_ENTITY_ORDER_KEY, order);
}

/** Toggle Project Pin; newly pinned Projects move to the front of the order. */
export function togglePinnedProjectId(
  current: string[],
  projectId: string,
): string[] {
  if (current.includes(projectId)) {
    return current.filter((id) => id !== projectId);
  }
  return [projectId, ...current];
}

export function togglePinnedEntityKey(
  current: HomeEntityKey[],
  entityKey: HomeEntityKey,
): HomeEntityKey[] {
  return current.includes(entityKey)
    ? current.filter((key) => key !== entityKey)
    : [...current, entityKey];
}
