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
}

export type ProjectDestination = "galaxy" | "constellations" | "openProject";
