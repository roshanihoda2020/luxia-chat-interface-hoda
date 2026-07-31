import type { HomeConstellationSource } from "@/app/features/home/types";

export type ProjectOverviewBrowseMode =
  | "overview"
  | "activity"
  | "chats"
  | "constellations"
  | "dashboards"
  | "virtual-assistants";

export type ProjectNavSection =
  | "overview"
  | "galaxy"
  | "chats"
  | "constellations"
  | "dashboard"
  | "virtual-assistant";

export type ProjectActivityType =
  | "chat"
  | "constellation"
  | "source"
  | "dashboard"
  | "virtual-assistant"
  | "member"
  | "project";

export interface ProjectActivityItem {
  id: string;
  projectId: string;
  type: ProjectActivityType;
  primary: string;
  secondary?: string;
  timestamp: string;
  timestampValue: number;
  chatId?: string;
  constellationId?: string;
  dashboardId?: string;
  virtualAssistantId?: string;
}

export interface ProjectDashboardItem {
  id: string;
  projectId: string;
  name: string;
  kind: "dashboard" | "group";
  updatedAt: string;
  updatedAtTimestamp: number;
}

export interface ProjectVirtualAssistantItem {
  id: string;
  projectId: string;
  name: string;
  channel?: string;
}

export interface ProjectMemberItem {
  id: string;
  projectId: string;
  name: string;
  role: string;
  email: string;
}

export interface ProjectOverviewConstellation {
  id: string;
  label: string;
  type: HomeConstellationSource;
  projectId: string;
  sourceCount: number;
  description?: string;
}

export interface ProjectOverviewChat {
  id: string;
  label: string;
  projectId: string;
  constellationId?: string;
  constellationName?: string;
  constellationSource?: HomeConstellationSource;
  lastOpenedAt: string;
  lastOpenedTimestamp: number;
}
