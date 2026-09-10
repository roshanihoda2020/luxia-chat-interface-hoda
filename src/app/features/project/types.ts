import type { ProjectRole } from "@/app/features/permissions/types";

export type ProjectLifecycleStatus = "active" | "archived";

export interface HomeProjectCard {
  id: string;
  name: string;
  galaxyId: string;
  constellationCount: number;
  sourceCount?: number;
  memberCount: number;
  updatedAt: string;
  updatedAtTimestamp: number;
  isPinned: boolean;
  isFeatured: boolean;
  isEmpty: boolean;
  status: ProjectLifecycleStatus;
  recentPreview?: string;
  description?: string;
  /**
   * Presentation-only viewer role for this projectId.
   * undefined = omit; null = no explicit membership.
   */
  viewerProjectRole?: ProjectRole | null;
}

export type ProjectDestination = "galaxy" | "constellations" | "openProject";
