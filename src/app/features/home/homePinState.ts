import type { HomeEntityKey } from "./homeEntityKeys";

const PINNED_ENTITY_ORDER_KEY = "luxia-home-pinned-entity-order";

export const DEFAULT_PINNED_ENTITY_ORDER: HomeEntityKey[] = [
  "chat:chat-01",
  "chat:chat-04",
  "galaxy:galaxy-02",
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

export function readPinnedEntityOrder(): HomeEntityKey[] {
  return readJson<HomeEntityKey[]>(PINNED_ENTITY_ORDER_KEY, DEFAULT_PINNED_ENTITY_ORDER);
}

export function writePinnedEntityOrder(order: HomeEntityKey[]): void {
  writeJson(PINNED_ENTITY_ORDER_KEY, order);
}

export function togglePinnedEntityKey(
  current: HomeEntityKey[],
  entityKey: HomeEntityKey,
): HomeEntityKey[] {
  return current.includes(entityKey)
    ? current.filter((key) => key !== entityKey)
    : [...current, entityKey];
}
