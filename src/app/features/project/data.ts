import {
  CANONICAL_CONSTELLATIONS,
  getProjectConstellationCount,
} from "@/app/features/constellation/catalog";
import type { HomeProjectCard } from "./types";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const NOW = Date.now();

export const PROJECT_DESCRIPTION_PLACEHOLDER =
  "Short Project description.";

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
 * Prototype catalog size so Show 3 / 6 / 9 / All are distinguishable on Home.
 * Access still requires an active membership for the current profile.
 */
export const HOME_PROTOTYPE_PROJECT_TOTAL = 48;

export function homeProjectIdAt(index: number): string {
  return `project-${String(index).padStart(2, "0")}`;
}

type HomeProjectSeed = Omit<HomeProjectCard, "constellationCount" | "sourceCount">;

/**
 * Build N accessible-looking prototype project cards (1-based indexes).
 * Used by the seeded catalog and large-collection verification.
 */
export function buildHomeProjectSeeds(count: number): HomeProjectSeed[] {
  const safeCount = Math.max(0, Math.floor(count));
  const seeds: HomeProjectSeed[] = [];
  for (let i = 1; i <= safeCount; i += 1) {
    const id = homeProjectIdAt(i);
    const handcrafted = HANDCRAFTED_HOME_PROJECTS[id];
    if (handcrafted) {
      seeds.push({ ...handcrafted });
      continue;
    }
    seeds.push({
      id,
      name: `Project name ${String(i).padStart(2, "0")}`,
      galaxyId: `galaxy-${String(i).padStart(2, "0")}`,
      memberCount: 2 + (i % 4),
      updatedAt: `${(i % 23) + 1}h ago`,
      updatedAtTimestamp: NOW - HOUR_MS * i,
      isPinned: false,
      isFeatured: false,
      isEmpty: true,
      status: "active",
      description: PROJECT_DESCRIPTION_PLACEHOLDER,
    });
  }
  return seeds;
}

export function materializeHomeProjects(
  seeds: readonly HomeProjectSeed[],
): HomeProjectCard[] {
  return seeds.map((project) => {
    const constellationCount = getProjectConstellationCount(project.id);
    return {
      ...project,
      constellationCount,
      sourceCount: uniqueSourceCountForProject(project.id),
      isEmpty: constellationCount === 0 ? Boolean(project.isEmpty) : false,
    };
  });
}

/**
 * Seeded prototype Projects. Empty Projects may appear when generated beyond
 * handcrafted constellation data, or when the user creates one in-session.
 */
const HANDCRAFTED_HOME_PROJECTS: Record<string, HomeProjectSeed> = {
  "project-01": {
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
    description: "Primary workspace for Project name 01 knowledge and conversations.",
  },
  "project-02": {
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
    description: "Shared Project for ongoing analysis and Constellation work.",
  },
  "project-03": {
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
    description: "Focused Project space for structured knowledge and Chats.",
  },
  "project-04": {
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
    description: "Project for configuration and access settings.",
  },
  "project-05": {
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
    description: "Exploration Project for Dashboard outputs and Vidgets.",
  },
  "project-06": {
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
    description: "Broader Project with multiple Constellations and Chats.",
  },
};

export const HOME_PROJECTS: HomeProjectCard[] = materializeHomeProjects(
  buildHomeProjectSeeds(HOME_PROTOTYPE_PROJECT_TOTAL),
);

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

/** @deprecated Prefer HOME_PINNED_PREVIEW_LIMIT / HOME_RECENT_* limits. */
export const HOME_PROJECT_PREVIEW_LIMIT = 4;

/** Max pinned project cards on Home (card layout only). */
export const HOME_PINNED_PREVIEW_LIMIT = 4;

/**
 * @deprecated Prefer user preference via `readHomeRecentPreviewCount` (3 / 6 / 9 / all).
 * Kept as fallback defaults for legacy call sites.
 */
export const HOME_RECENT_LIST_PREVIEW_LIMIT = 6;

/**
 * @deprecated Prefer user preference via `readHomeRecentPreviewCount` (3 / 6 / 9 / all).
 * Kept as fallback defaults for legacy call sites.
 */
export const HOME_RECENT_GRID_PREVIEW_LIMIT = 6;

/** @deprecated Prefer explicit preview count from Home preference. */
export function homeRecentPreviewLimit(
  _viewMode: "grid" | "list",
): number {
  return HOME_RECENT_GRID_PREVIEW_LIMIT;
}

function isPinnedProject(
  project: HomeProjectCard,
  pinnedProjectOrder: readonly string[],
): boolean {
  return pinnedProjectOrder.includes(project.id) || Boolean(project.isPinned);
}

/**
 * Active projects ordered by updated time only (no pin-priority).
 * Used for Home Recent — pinned projects stay in this collection.
 */
export function rankProjectsByRecency(
  projects: HomeProjectCard[],
): HomeProjectCard[] {
  return filterActiveProjects(projects).slice().sort(
    (a, b) => (b.updatedAtTimestamp ?? 0) - (a.updatedAtTimestamp ?? 0),
  );
}

/**
 * Home overview sections: Pinned and Recent are independent presentations.
 * The same project may appear in both — pinned status does not remove it from Recent.
 *
 * Order of operations:
 * 1. Filter to accessible/active projects
 * 2. Derive Pinned independently (pin order + preview cap)
 * 3. Derive Recent independently from the full active collection (recency order)
 * 4. Apply Show limit to Recent only (`null` = Show All, no slice)
 */
export function getHomeProjectsSections(
  projects: HomeProjectCard[],
  pinnedProjectOrder: readonly string[] = [],
  recentLimit: number | null = HOME_RECENT_LIST_PREVIEW_LIMIT,
  pinnedLimit: number = HOME_PINNED_PREVIEW_LIMIT,
) {
  const ranked = rankProjectsByRecency(projects);
  const pinOrdered = rankProjectsForPreview(projects, pinnedProjectOrder);
  const allPinned = pinOrdered.filter((project) =>
    isPinnedProject(project, pinnedProjectOrder),
  );
  const pinned = allPinned.slice(0, Math.max(0, pinnedLimit));
  // Recent uses the full accessible collection — do not strip pinned IDs.
  const recent =
    recentLimit == null
      ? ranked
      : ranked.slice(0, Math.max(0, recentLimit));

  return {
    pinned,
    recent,
    ranked,
    recentEligibleTotal: ranked.length,
    pinnedTotal: allPinned.length,
    totalAccessible: ranked.length,
    totalVisible: pinned.length + recent.length,
    /** Always offer the full library from Home — this section is a subset. */
    showViewAll: true,
  };
}

/**
 * Home Project preview — first N of the shared filtered/sorted active list.
 * Full Projects page must use `rankProjectsForPreview` (or the unscoped catalog), not this slice.
 * @deprecated Prefer `getHomeProjectsSections` for Home overview.
 */
export function getProjectPreview(
  projects: HomeProjectCard[],
  pinnedProjectOrder: readonly string[] = [],
  limit: number = HOME_PINNED_PREVIEW_LIMIT,
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
