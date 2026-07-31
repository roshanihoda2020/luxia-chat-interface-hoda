import { getProjectNameById } from "@/app/features/project/data";
import type { HomeEntityKey } from "./homeEntityKeys";
import { workItemEntityKey } from "./homeEntityKeys";
import type { HomeRecentWorkItem } from "./types";

export type ContinueEntityFilter = "all" | "galaxy" | "chat" | "pinned";
export type ContinueSourceFilter = "all" | "database" | "pdf";
export type ContinueVisibilityFilter = "all" | "visible" | "hidden";
export type ContinueSortMode = "opened" | "pinned" | "name";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export function listContinueWorkingCollection(
  items: HomeRecentWorkItem[],
): HomeRecentWorkItem[] {
  return items.filter((item) => item.kind === "chat" || item.kind === "galaxySession");
}

export function formatWorkLastOpened(item: HomeRecentWorkItem): string {
  if (!item.lastOpenedAt) {
    return item.updatedAt ? `Last opened ${item.updatedAt.toLowerCase()}` : "Last opened recently";
  }
  const ms = Date.now() - item.lastOpenedAt;
  if (ms < 5 * 60_000) return "Opened just now";
  if (ms < DAY_MS) {
    const hours = Math.max(1, Math.floor(ms / HOUR_MS));
    if (hours === 1) return "Last opened 1 hour ago";
    return "Last opened today";
  }
  const days = Math.floor(ms / DAY_MS);
  if (days === 1) return "Last opened yesterday";
  if (days >= 7 && days < 14) return "Last opened 1 week ago";
  return `Last opened ${days} days ago`;
}

function entityTypeToken(item: HomeRecentWorkItem): string {
  return item.kind === "galaxySession" ? "galaxy" : "chat";
}

export function matchesContinueSearch(item: HomeRecentWorkItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const entityType = entityTypeToken(item);
  const sourceType =
    item.constellationSource === "database"
      ? "database"
      : item.constellationSource === "csv"
        ? "csv"
        : item.constellationSource === "pdf"
          ? "pdf"
          : "";

  const haystack = [
    item.title,
    getProjectNameById(item.projectId),
    item.constellationName ?? "",
    sourceType,
    entityType,
    entityType === "galaxy" ? "galaxies" : "chats",
  ].join(" ").toLowerCase();

  return haystack.includes(q);
}

export function filterContinueWorkItems(
  items: HomeRecentWorkItem[],
  options: {
    query: string;
    entityFilter: ContinueEntityFilter;
    sourceFilter: ContinueSourceFilter;
    visibilityFilter: ContinueVisibilityFilter;
    dismissedKeys: Set<HomeEntityKey>;
  },
): HomeRecentWorkItem[] {
  return listContinueWorkingCollection(items).filter((item) => {
    if (!matchesContinueSearch(item, options.query)) return false;

    const entityKey = workItemEntityKey(item);
    const isHidden = options.dismissedKeys.has(entityKey);

    if (options.visibilityFilter === "visible" && isHidden) return false;
    if (options.visibilityFilter === "hidden" && !isHidden) return false;

    if (options.entityFilter === "galaxy" && item.kind !== "galaxySession") return false;
    if (options.entityFilter === "chat" && item.kind !== "chat") return false;
    if (options.entityFilter === "pinned" && !item.isPinned) return false;

    if (options.sourceFilter === "database") {
      return item.constellationSource === "database";
    }
    if (options.sourceFilter === "pdf") {
      return item.constellationSource === "pdf";
    }

    return true;
  });
}

function pinOrderIndex(
  item: HomeRecentWorkItem,
  pinnedEntityOrder: HomeEntityKey[],
): number {
  const key = workItemEntityKey(item);
  const index = pinnedEntityOrder.indexOf(key);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

export function sortContinueWorkItems(
  items: HomeRecentWorkItem[],
  sortMode: ContinueSortMode,
  pinnedEntityOrder: HomeEntityKey[],
): HomeRecentWorkItem[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    if (sortMode === "name") {
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    }

    if (sortMode === "pinned") {
      const pinA = pinOrderIndex(a, pinnedEntityOrder);
      const pinB = pinOrderIndex(b, pinnedEntityOrder);
      if (pinA !== pinB) return pinA - pinB;
      return (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0);
    }

    const pinnedA = a.isPinned ? 1 : 0;
    const pinnedB = b.isPinned ? 1 : 0;
    if (pinnedA !== pinnedB) return pinnedB - pinnedA;

    const pinOrderA = pinOrderIndex(a, pinnedEntityOrder);
    const pinOrderB = pinOrderIndex(b, pinnedEntityOrder);
    if (pinOrderA !== pinOrderB) return pinOrderA - pinOrderB;

    return (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0);
  });

  return sorted;
}

export function areAllWorkItemsHidden(
  items: HomeRecentWorkItem[],
  dismissedKeys: HomeEntityKey[],
): boolean {
  const collection = listContinueWorkingCollection(items);
  if (collection.length === 0) return false;
  const dismissed = new Set(dismissedKeys);
  return collection.every((item) => dismissed.has(workItemEntityKey(item)));
}
