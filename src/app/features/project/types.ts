/** Canonical Project card / list record used by Home, archive, search, and Overview. */
export type ProjectLifecycleStatus = "active" | "archived";

export interface HomeProjectCard {
  id: string;
  name: string;
  /** Single Project-level Galaxy ID (exactly one per Project). */
  galaxyId: string;
  constellationCount: number;
  /** Project-level source total when available; omit from meta when undefined. */
  sourceCount?: number;
  memberCount: number;
  /** Visible relative label (e.g. "2h ago"). */
  updatedAt: string;
  /** Sortable absolute timestamp for ranking. */
  updatedAtTimestamp: number;
  isPinned: boolean;
  isFeatured: boolean;
  isEmpty: boolean;
  /**
   * Project lifecycle. New Projects always start as `active`.
   * Archiving moves the Project out of Home preview without deleting data.
   */
  status: ProjectLifecycleStatus;
  recentPreview?: string;
  description?: string;
}

export type ProjectDestination = "galaxy" | "constellations" | "openProject";
