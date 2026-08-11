import {
  CANONICAL_CONSTELLATIONS,
  getProjectConstellationCount,
} from "@/app/features/constellation/catalog";
import type { HomeProjectCard } from "./types";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const NOW = Date.now();

export const PROJECT_DESCRIPTION_PLACEHOLDER = `${"x".repeat(80)}`;

/** One Constellation’s contribution to Project-derived Data Source counts. */
export interface ProjectConstellationSourceEntry {
  constellationId: string;
  projectId: string;
  status: "active" | "archived" | string;
  dataSourceIds: readonly string[];
}

/**
 * Project Constellation + unique Data Source counts from Constellation relationships.
 * Active Constellations only; Data Source IDs are deduped by stable id (not name).
 */
export function deriveProjectEntityCounts(
  projectId: string,
  entries: readonly ProjectConstellationSourceEntry[],
): { constellationCount: number; sourceCount: number } {
  const active = entries.filter(
    (entry) => entry.projectId === projectId && entry.status !== "archived",
  );
  const uniqueSourceIds = new Set<string>();
  for (const entry of active) {
    for (const sourceId of entry.dataSourceIds) {
      if (sourceId) uniqueSourceIds.add(sourceId);
    }
  }
  return {
    constellationCount: active.length,
    sourceCount: uniqueSourceIds.size,
  };
}

/** Seeded unique Data Source count — derived from canonical Constellation links only. */
export function uniqueSourceCountForProject(projectId: string): number {
  return deriveProjectEntityCounts(
    projectId,
    CANONICAL_CONSTELLATIONS.map((item) => ({
      constellationId: item.id,
      projectId: item.projectId,
      status: item.status,
      dataSourceIds: item.dataSourceIds,
    })),
  ).sourceCount;
}

/**
 * Seeded prototype Projects only. Empty Projects are not seeded — they may appear
 * only when the user creates one during the session.
 */
const HOME_PROJECT_BASE: Omit<HomeProjectCard, "constellationCount" | "sourceCount">[] = [
  {
    id: "project-01",
    name: "Project name 01",
    galaxyId: "galaxy-01",
    memberCount: 5,
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
    memberCount: 4,
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
    memberCount: 3,
    updatedAt: "4h ago",
    updatedAtTimestamp: NOW - HOUR_MS * 4,
    isPinned: false,
    isFeatured: false,
    isEmpty: false,
    status: "active",
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-05",
    name: "Project name 05",
    galaxyId: "galaxy-05",
    memberCount: 3,
    updatedAt: "8h ago",
    updatedAtTimestamp: NOW - HOUR_MS * 8,
    isPinned: false,
    isFeatured: false,
    isEmpty: false,
    status: "active",
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
  {
    id: "project-06",
    name: "Project name 06",
    galaxyId: "galaxy-06",
    memberCount: 3,
    updatedAt: "5h ago",
    updatedAtTimestamp: NOW - HOUR_MS * 5,
    isPinned: false,
    isFeatured: false,
    isEmpty: false,
    status: "active",
    description: PROJECT_DESCRIPTION_PLACEHOLDER,
  },
];

export const HOME_PROJECTS: HomeProjectCard[] = HOME_PROJECT_BASE.map((project) => {
  const constellationCount = getProjectConstellationCount(project.id);
  return {
    ...project,
    constellationCount,
    sourceCount: uniqueSourceCountForProject(project.id),
    isEmpty: constellationCount === 0 ? Boolean(project.isEmpty) : false,
  };
});

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

/** Max Project cards on the Home preview (not the full Projects directory). */
export const HOME_PROJECT_PREVIEW_LIMIT = 4;

/**
 * Home Project preview — first N of the shared filtered/sorted active list.
 * Full Projects page must use `rankProjectsForPreview` (or the unscoped catalog), not this slice.
 */
export function getProjectPreview(
  projects: HomeProjectCard[],
  pinnedProjectOrder: readonly string[] = [],
  limit: number = HOME_PROJECT_PREVIEW_LIMIT,
) {
  const ranked = rankProjectsForPreview(projects, pinnedProjectOrder);
  const preview = ranked.slice(0, Math.max(0, limit));
  const featured = preview[0];
  const supporting = featured
    ? preview.filter((project) => project.id !== featured.id)
    : [];
  return {
    featured,
    supporting,
    ranked,
    preview,
    totalVisible: ranked.length,
    showViewAll: ranked.length > limit,
  };
}

function pluralCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatProjectMeta(project: HomeProjectCard): string {
  const parts = [
    pluralCount(project.constellationCount, "Constellation", "Constellations"),
    pluralCount(project.sourceCount ?? 0, "Source", "Sources"),
    pluralCount(project.memberCount, "member", "members"),
    `Updated ${project.updatedAt}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

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

export function getProjectNameById(
  projectId: string | null | undefined,
  projects: readonly HomeProjectCard[] = HOME_PROJECTS,
  fallback: string = UNKNOWN_PROJECT_NAME,
): string {
  return getProjectById(projectId, projects)?.name ?? fallback;
}
