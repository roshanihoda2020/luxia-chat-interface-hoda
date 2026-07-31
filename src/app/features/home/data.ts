import { getProjectNameById } from "@/app/features/project/data";
import type { HomeHeroContent, HomeProjectCard, HomeRecentWorkItem } from "./types";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Reserved description area for neutral prototype / mock Home entities.
 * Two blocks wrap naturally into two readable lines in the left column. */
export const HERO_DESCRIPTION_PLACEHOLDER =
  `${"x".repeat(52)} ${"x".repeat(13)}\n${"x".repeat(52)} ${"x".repeat(13)}`;

function formatLastOpened(lastOpenedAt?: number): string {
  if (!lastOpenedAt) return "Last opened recently";
  const ms = Date.now() - lastOpenedAt;
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

/**
 * Chat → active Constellation description (by constellation ID).
 * Galaxy → Project description (by project ID).
 * Prototype/mock → reserved x-placeholder.
 * Real entity with no valid description → undefined (no block rendered).
 */
export function resolveHeroDescription(item: HomeRecentWorkItem): string | undefined {
  if (item.isPrototype) {
    return HERO_DESCRIPTION_PLACEHOLDER;
  }

  if (item.kind === "chat") {
    const text = item.constellationDescription?.trim();
    return text || undefined;
  }

  if (item.kind === "galaxySession") {
    const text = item.projectDescription?.trim();
    return text || undefined;
  }

  return undefined;
}

const NOW = Date.now();

/**
 * Shared Home / Your work prototype collection.
 * Chat IDs: chat-01…chat-08 · Galaxy IDs: galaxy-01…galaxy-04 (work items)
 * Projects: project-01…project-10 each with one Galaxy.
 */
export const HOME_RECENT_WORK: HomeRecentWorkItem[] = [
  {
    id: "work-chat-01",
    title: "Chat name 01",
    kind: "chat",
    projectId: "project-01",
    chatId: "chat-01",
    conversationId: "chat-01",
    constellationId: "con1",
    constellationName: "Constellation name 01",
    constellationSource: "database",
    updatedAt: "Just now",
    lastOpenedAt: NOW,
    isPinned: true,
    isPrototype: true,
  },
  {
    id: "work-chat-02",
    title: "Chat name 02",
    kind: "chat",
    projectId: "project-01",
    chatId: "chat-02",
    conversationId: "chat-02",
    constellationId: "con2",
    constellationName: "Constellation name 02",
    constellationSource: "csv",
    updatedAt: "1 hour ago",
    lastOpenedAt: NOW - HOUR_MS,
    isPinned: false,
    isPrototype: true,
  },
  {
    id: "work-galaxy-01",
    title: "Galaxy name 01",
    kind: "galaxySession",
    projectId: "project-01",
    chatId: "galaxy-01",
    conversationId: "galaxy-01",
    updatedAt: "Today",
    lastOpenedAt: NOW - HOUR_MS * 3,
    isPinned: false,
    isPrototype: true,
  },
  {
    id: "work-chat-03",
    title: "Chat name 03",
    kind: "chat",
    projectId: "project-02",
    chatId: "chat-03",
    conversationId: "chat-03",
    constellationId: "con3",
    constellationName: "Constellation name 03",
    constellationSource: "database",
    updatedAt: "Yesterday",
    lastOpenedAt: NOW - DAY_MS,
    isPinned: false,
    isPrototype: true,
  },
  {
    id: "work-chat-04",
    title: "Chat name 04",
    kind: "chat",
    projectId: "project-02",
    chatId: "chat-04",
    conversationId: "chat-04",
    constellationId: "con4",
    constellationName: "Constellation name 04",
    constellationSource: "pdf",
    updatedAt: "2 days ago",
    lastOpenedAt: NOW - DAY_MS * 2,
    isPinned: true,
    isPrototype: true,
  },
  {
    id: "work-galaxy-02",
    title: "Galaxy name 02",
    kind: "galaxySession",
    projectId: "project-02",
    chatId: "galaxy-02",
    conversationId: "galaxy-02",
    updatedAt: "3 days ago",
    lastOpenedAt: NOW - DAY_MS * 3,
    isPinned: true,
    isPrototype: true,
  },
  {
    id: "work-chat-05",
    title: "Chat name 05",
    kind: "chat",
    projectId: "project-03",
    chatId: "chat-05",
    conversationId: "chat-05",
    constellationId: "con5",
    constellationName: "Constellation name 05",
    constellationSource: "database",
    updatedAt: "4 days ago",
    lastOpenedAt: NOW - DAY_MS * 4,
    isPinned: false,
    isPrototype: true,
  },
  {
    id: "work-chat-06",
    title: "Chat name 06",
    kind: "chat",
    projectId: "project-03",
    chatId: "chat-06",
    conversationId: "chat-06",
    constellationId: "con6",
    constellationName: "Constellation name 06",
    constellationSource: "pdf",
    updatedAt: "1 week ago",
    lastOpenedAt: NOW - DAY_MS * 7,
    isPinned: false,
    isPrototype: true,
  },
  {
    id: "work-galaxy-03",
    title: "Galaxy name 03",
    kind: "galaxySession",
    projectId: "project-03",
    chatId: "galaxy-03",
    conversationId: "galaxy-03",
    updatedAt: "5 days ago",
    lastOpenedAt: NOW - DAY_MS * 5,
    isPinned: false,
    isPrototype: true,
  },
  {
    id: "work-chat-07",
    title: "Chat name 07",
    kind: "chat",
    projectId: "project-04",
    chatId: "chat-07",
    conversationId: "chat-07",
    constellationId: "con7",
    constellationName: "Constellation name 07",
    constellationSource: "database",
    updatedAt: "6 days ago",
    lastOpenedAt: NOW - DAY_MS * 6,
    isPinned: false,
    isPrototype: true,
  },
  {
    id: "work-chat-08",
    title: "Chat name 08",
    kind: "chat",
    projectId: "project-04",
    chatId: "chat-08",
    conversationId: "chat-08",
    constellationId: "con8",
    constellationName: "Constellation name 08",
    constellationSource: "pdf",
    updatedAt: "3 days ago",
    lastOpenedAt: NOW - DAY_MS * 3 - HOUR_MS * 2,
    isPinned: false,
    isPrototype: true,
  },
  {
    id: "work-galaxy-04",
    title: "Galaxy name 04",
    kind: "galaxySession",
    projectId: "project-04",
    chatId: "galaxy-04",
    conversationId: "galaxy-04",
    updatedAt: "4 days ago",
    lastOpenedAt: NOW - DAY_MS * 4 - HOUR_MS,
    isPinned: false,
    isPrototype: true,
  },
];

export function workItemToHeroContent(
  source: HomeRecentWorkItem,
  pinnedWorkIds: Set<string>,
  projects?: readonly HomeProjectCard[],
): HomeHeroContent {
  const isGalaxy = source.kind === "galaxySession";
  // Always resolve from canonical Project data — ignore any legacy stored projectName.
  const projectName = getProjectNameById(source.projectId, projects);
  return {
    kind: source.kind,
    title: source.title,
    context: projectName,
    meta: formatLastOpened(source.lastOpenedAt),
    preview: source.latestPreview,
    description: resolveHeroDescription(source),
    projectId: source.projectId,
    projectName,
    chatId: source.chatId,
    conversationId: source.conversationId,
    workItemId: source.id,
    constellationId: source.constellationId,
    constellationName: source.constellationName,
    constellationSource: source.constellationSource,
    isPinned: pinnedWorkIds.has(source.id) || Boolean(source.isPinned),
    primaryLabel: "Continue",
    secondaryLabel: "Open Project",
    secondaryAction: "openProject",
    mode: isGalaxy ? source.mode : undefined,
  };
}

