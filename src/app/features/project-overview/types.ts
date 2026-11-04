import type { HomeConstellationSource } from "@/app/features/home/types";
import type { VidgetChannel, VidgetSourceType } from "@/app/features/vidgets/types";

export type ProjectOverviewBrowseMode =
  | "overview"
  | "activity"
  | "chats"
  | "constellations"
  | "dashboards"
  | "outputs"
  | "virtual-assistants";

export type ProjectNavSection =
  | "overview"
  | "galaxy"
  | "chats"
  | "constellations"
  | "dashboard"
  | "vidgets"
  | "pipelines"
  | "members"
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
  /** General Dashboard entity — used for dashboard-wide activity. */
  dashboardId?: string;
  /** Saved Dashboard output — used for output activity navigation. */
  outputId?: string;
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

export type ProjectDashboardConversationSource = "galaxy" | "constellation-chat";

/** @deprecated Use ProjectDashboardConversationSource */
export type ProjectDashboardSourceType = ProjectDashboardConversationSource;

export interface ProjectDashboardOutput {
  id: string;
  projectId: string;
  name: string;
  outputType: ProjectDashboardOutputType;
  conversationSource: ProjectDashboardConversationSource;
  sourceContext: string;
  updatedAt: string;
  updatedAtTimestamp: number;
  /** Stable creator id — Dashboard modification rights for Analyst depend on this. */
  createdByUserId: string;
}

/**
 * A named Dashboard inside a Project: an ordered selection of the Project's
 * saved outputs. A Project may have zero, one or many Dashboards. Outputs
 * belong to the Project (All Outputs), not to a Dashboard, so changing a
 * Dashboard never creates, edits or deletes an output.
 */
export interface ProjectDashboard {
  /** Stable ID, unique across Projects. */
  id: string;
  projectId: string;
  /** User-visible name; unique within its Project. */
  name: string;
  /** Saved output IDs from the same Project, in display order. */
  outputIds: string[];
  /** Who created it — Analyst management rights depend on this. */
  createdByUserId: string;
  createdAtTimestamp: number;
  updatedAtTimestamp: number;
  /**
   * The Dashboard that replaced the Project's single Dashboard of the old
   * model. Home Tiles saved under that model map to it.
   */
  migratedFromLegacy?: boolean;
}

/**
 * @deprecated Superseded by ProjectDashboard (named Dashboards with output
 * selections, projectDashboardStore.ts). Not used by any screen.
 */
export interface ProjectDashboardItem {
  id: string;
  projectId: string;
  name: string;
  kind: "dashboard" | "group";
  updatedAt: string;
  updatedAtTimestamp: number;
  createdByUserId: string;
}

/** @deprecated Legacy deployment labels — Overview now uses channel from canonical Vidgets. */
export type ProjectWidgetDeployment =
  | "Website"
  | "Totem"
  | "Embedded assistant"
  | "Laptop"
  | "Kiosk";

export type ProjectWidgetStatus = "Published" | "Draft" | "Paused";

/**
 * Overview Vidget row — must be derived from canonical Vidget state (not a second dataset).
 * Meta: channel · source name · status. Never multi-Constellation counts as direct source.
 */
export interface ProjectWidgetItem {
  id: string;
  projectId: string;
  name: string;
  channel: VidgetChannel;
  channelLabel: string;
  sourceType: VidgetSourceType;
  sourceLabel: string;
  statusLabel: string;
  sourceAvailable: boolean;
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
  updatedAtTimestamp: number;
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
