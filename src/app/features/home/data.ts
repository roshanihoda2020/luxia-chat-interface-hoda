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
    projectName: "Project name 01",
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
    projectName: "Project name 01",
    chatId: "chat-02",
    conversationId: "chat-02",
    constellationId: "con2",
    constellationName: "Constellation name 02",
    constellationSource: "pdf",
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
    projectName: "Project name 01",
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
    projectName: "Project name 02",
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
    projectName: "Project name 02",
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
    projectName: "Project name 02",
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
    projectName: "Project name 03",
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
    projectName: "Project name 03",
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
    projectName: "Project name 03",
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
    projectName: "Project name 04",
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
    projectName: "Project name 04",
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
    projectName: "Project name 04",
    chatId: "galaxy-04",
    conversationId: "galaxy-04",
    updatedAt: "4 days ago",
    lastOpenedAt: NOW - DAY_MS * 4 - HOUR_MS,
    isPinned: false,
    isPrototype: true,
  },
];

/** One-line Project card description for neutral prototypes. */
export const PROJECT_DESCRIPTION_PLACEHOLDER = `${"x".repeat(80)}`;

export const HOME_PROJECTS: HomeProjectCard[] = [
  {
    id: "project-01",
    name: "Project name 01",
    galaxyId: "galaxy-01",
    constellationCount: 12,
    sourceCount: 24,
    memberCount: 8,
    updatedAt: "2h ago",
    updatedAtTimestamp: NOW - HOUR_MS * 2,
    isPinned: false,
    isFeatured: false,
    isEmpty: false,
    recentPreview: "Galaxy and constellation activity",
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-02",
    name: "Project name 02",
    galaxyId: "galaxy-02",
    constellationCount: 8,
    sourceCount: 16,
    memberCount: 4,
    updatedAt: "1d ago",
    updatedAtTimestamp: NOW - DAY_MS,
    isPinned: true,
    isFeatured: false,
    isEmpty: false,
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-03",
    name: "Project name 03",
    galaxyId: "galaxy-03",
    constellationCount: 2,
    sourceCount: 5,
    memberCount: 5,
    updatedAt: "3d ago",
    updatedAtTimestamp: NOW - DAY_MS * 3,
    isPinned: false,
    isFeatured: false,
    isEmpty: false,
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-04",
    name: "Project name 04",
    galaxyId: "galaxy-04",
    constellationCount: 0,
    sourceCount: 0,
    memberCount: 2,
    updatedAt: "1w ago",
    updatedAtTimestamp: NOW - DAY_MS * 7,
    isPinned: false,
    isFeatured: false,
    isEmpty: true,
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-05",
    name: "Project name 05",
    galaxyId: "galaxy-05",
    constellationCount: 6,
    sourceCount: 11,
    memberCount: 7,
    updatedAt: "today",
    updatedAtTimestamp: NOW - HOUR_MS * 5,
    isPinned: true,
    isFeatured: false,
    isEmpty: false,
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-06",
    name: "Project name 06",
    galaxyId: "galaxy-06",
    constellationCount: 4,
    sourceCount: 9,
    memberCount: 3,
    updatedAt: "4d ago",
    updatedAtTimestamp: NOW - DAY_MS * 4,
    isPinned: false,
    isFeatured: false,
    isEmpty: false,
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-07",
    name: "Project name 07",
    galaxyId: "galaxy-07",
    constellationCount: 15,
    sourceCount: 31,
    memberCount: 12,
    updatedAt: "yesterday",
    updatedAtTimestamp: NOW - DAY_MS,
    isPinned: false,
    isFeatured: false,
    isEmpty: false,
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-08",
    name: "Project name 08",
    galaxyId: "galaxy-08",
    constellationCount: 1,
    sourceCount: 2,
    memberCount: 2,
    updatedAt: "5d ago",
    updatedAtTimestamp: NOW - DAY_MS * 5,
    isPinned: false,
    isFeatured: false,
    isEmpty: false,
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-09",
    name: "Project name 09",
    galaxyId: "galaxy-09",
    constellationCount: 9,
    sourceCount: 18,
    memberCount: 6,
    updatedAt: "6h ago",
    updatedAtTimestamp: NOW - HOUR_MS * 6,
    isPinned: true,
    isFeatured: false,
    isEmpty: false,
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-10",
    name: "Project name 10",
    galaxyId: "galaxy-10",
    constellationCount: 3,
    sourceCount: 7,
    memberCount: 4,
    updatedAt: "2w ago",
    updatedAtTimestamp: NOW - DAY_MS * 14,
    isPinned: false,
    isFeatured: false,
    isEmpty: false,
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
];

export function workItemToHeroContent(
  source: HomeRecentWorkItem,
  pinnedWorkIds: Set<string>,
): HomeHeroContent {
  const isGalaxy = source.kind === "galaxySession";
  return {
    kind: source.kind,
    title: source.title,
    context: source.projectName,
    meta: formatLastOpened(source.lastOpenedAt),
    preview: source.latestPreview,
    description: resolveHeroDescription(source),
    projectId: source.projectId,
    projectName: source.projectName,
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

/** Rank Projects for the limited Home preview: pinned order, then most recently updated. */
export function rankProjectsForPreview(
  projects: HomeProjectCard[],
  pinnedProjectOrder: readonly string[],
): HomeProjectCard[] {
  return projects.slice().sort((a, b) => {
    const pinA = pinnedProjectOrder.indexOf(a.id);
    const pinB = pinnedProjectOrder.indexOf(b.id);
    const aPinned = pinA >= 0 || Boolean(a.isPinned);
    const bPinned = pinB >= 0 || Boolean(b.isPinned);

    if (aPinned && bPinned) {
      const orderA = pinA >= 0 ? pinA : Number.MAX_SAFE_INTEGER;
      const orderB = pinB >= 0 ? pinB : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
    } else if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }

    return (b.updatedAtTimestamp ?? 0) - (a.updatedAtTimestamp ?? 0);
  });
}

export function getProjectPreview(
  projects: HomeProjectCard[],
  pinnedProjectOrder: readonly string[] = [],
) {
  const ranked = rankProjectsForPreview(projects, pinnedProjectOrder);
  const featured = ranked[0];
  const supporting = ranked.filter((project) => project.id !== featured?.id).slice(0, 3);
  return { featured, supporting, ranked };
}

function pluralCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatProjectMeta(project: HomeProjectCard): string {
  const parts = [
    pluralCount(project.constellationCount, "Constellation", "Constellations"),
    typeof project.sourceCount === "number"
      ? pluralCount(project.sourceCount, "Source", "Sources")
      : null,
    pluralCount(project.memberCount, "member", "members"),
    `Updated ${project.updatedAt}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

