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
  | "output"
  | "virtual-assistant"
  | "widget"
  | "instruction"
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

export type ProjectDashboardOutputType =
  | "chart"
  | "table"
  | "report"
  | "metric"
  | "analysis"
  | "insight"
  | "comparison"
  | "mixed";

export type ProjectDashboardSourceType = "galaxy" | "constellation" | "chat";

export interface ProjectDashboardOutput {
  id: string;
  projectId: string;
  name: string;
  outputType: ProjectDashboardOutputType;
  sourceType: ProjectDashboardSourceType;
  sourceContext: string;
  updatedAt: string;
  updatedAtTimestamp: number;
}

/** @deprecated Prefer ProjectDashboardOutput for Overview gallery; kept for library prototypes. */
export interface ProjectDashboardItem {
  id: string;
  projectId: string;
  name: string;
  kind: "dashboard" | "group";
  updatedAt: string;
  updatedAtTimestamp: number;
}

export type ProjectWidgetDeployment =
  | "Website"
  | "Totem"
  | "Embedded assistant"
  | "Laptop"
  | "Kiosk";

export type ProjectWidgetStatus = "Published" | "Draft";

export interface ProjectWidgetItem {
  id: string;
  projectId: string;
  name: string;
  deployment: ProjectWidgetDeployment;
  language: string;
  status: ProjectWidgetStatus;
  constellationCount: number;
}

export type ProjectVirtualAssistantItem = ProjectWidgetItem;

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
  chatSource: "galaxy" | "constellation";
  constellationId?: string;
  constellationName?: string;
  constellationSource?: HomeConstellationSource;
  lastOpenedAt: string;
  lastOpenedTimestamp: number;
}
