import type { HomeProjectCard } from "./types";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const NOW = Date.now();

/** One-line Project card description for neutral prototypes. */
export const PROJECT_DESCRIPTION_PLACEHOLDER = `${"x".repeat(80)}`;

/** Canonical Project catalog — single source of truth for cards, archive, search, Overview. */
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
    status: "active",
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
    status: "active",
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
    status: "active",
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
    status: "active",
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
    status: "active",
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
    status: "active",
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
    status: "active",
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
    status: "active",
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
    status: "active",
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
    status: "active",
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
];

/** Rank Projects for the limited Home preview: pinned order, then most recently updated. */
export function isProjectActive(project: HomeProjectCard): boolean {
  return project.status !== "archived";
}

export function isProjectArchived(project: HomeProjectCard): boolean {
  return project.status === "archived";
}

export function filterActiveProjects(
  projects: readonly HomeProjectCard[],
): HomeProjectCard[] {
  return projects.filter(isProjectActive);
}

export function filterArchivedProjects(
  projects: readonly HomeProjectCard[],
): HomeProjectCard[] {
  return projects.filter(isProjectArchived);
}

/** Rank active Projects for the limited Home preview: pinned order, then most recently updated. */
export function rankProjectsForPreview(
  projects: HomeProjectCard[],
  pinnedProjectOrder: readonly string[],
): HomeProjectCard[] {
  return filterActiveProjects(projects).slice().sort((a, b) => {
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

/** Stable lookup map for the canonical Project catalog. */
export const PROJECTS_BY_ID: ReadonlyMap<string, HomeProjectCard> = new Map(
  HOME_PROJECTS.map((project) => [project.id, project]),
);

export const UNKNOWN_PROJECT_NAME = "Unknown Project";

export function getProjectById(
  projectId: string | null | undefined,
  projects: readonly HomeProjectCard[] = HOME_PROJECTS,
): HomeProjectCard | undefined {
  if (!projectId) return undefined;
  if (projects === HOME_PROJECTS) {
    return PROJECTS_BY_ID.get(projectId);
  }
  return projects.find((project) => project.id === projectId)
    ?? PROJECTS_BY_ID.get(projectId);
}

/**
 * Resolve a Project display name from a stable Project ID.
 * Does not reconstruct names from IDs and does not fall back to the first Project.
 * Legacy stored `projectName` values should be ignored in favor of this helper.
 */
export function getProjectNameById(
  projectId: string | null | undefined,
  projects: readonly HomeProjectCard[] = HOME_PROJECTS,
  fallback: string = UNKNOWN_PROJECT_NAME,
): string {
  return getProjectById(projectId, projects)?.name ?? fallback;
}
