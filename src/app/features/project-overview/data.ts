import { HOME_PROJECTS } from "@/app/features/project/data";
import { buildConstellationSourceCountMap } from "@/app/features/constellation/catalog";
import type {
  ProjectActivityItem,
  ProjectDashboardItem,
  ProjectDashboardOutput,
  ProjectWidgetItem,
} from "./types";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const NOW = Date.now();

const PROJECT_IDS = HOME_PROJECTS.map((project) => project.id);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function projectIndex(projectId: string): number {
  const index = PROJECT_IDS.indexOf(projectId);
  return index >= 0 ? index : 0;
}

/** Demo Dashboard creators — only users who belong to each Project. */
const DASHBOARD_DEMO_CREATORS: Record<string, string[]> = {
  "project-01": ["user-01", "user-03", "user-02", "user-05", "user-01", "user-03", "user-02", "user-05"],
  "project-02": ["user-03", "user-01", "user-03", "user-01", "user-03", "user-01", "user-03", "user-01"],
  "project-03": ["user-02", "user-04", "user-01", "user-02", "user-04", "user-01", "user-02", "user-04"],
  "project-04": ["user-04", "user-02", "user-03", "user-04", "user-02", "user-03", "user-04", "user-02"],
  "project-05": ["user-05", "user-01", "user-04", "user-05", "user-01", "user-04", "user-05", "user-01"],
  "project-06": ["user-04", "user-03", "user-05", "user-04", "user-03", "user-05", "user-04", "user-03"],
};

function dashboardDemoCreator(projectId: string, index: number): string {
  const roster = DASHBOARD_DEMO_CREATORS[projectId] ?? ["user-01"];
  return roster[index % roster.length] ?? "user-01";
}

export const PROJECT_ACTIVITY: ProjectActivityItem[] = PROJECT_IDS.flatMap((projectId) => {
  const index = projectIndex(projectId);
  const n = index + 1;
  const homeProject = HOME_PROJECTS.find((project) => project.id === projectId);
  const base: ProjectActivityItem[] = [
    {
      id: `${projectId}-act-01`,
      projectId,
      type: "chat",
      primary: `Chat name ${pad(Math.min(n, 8))} was created`,
      secondary: `Constellation name ${pad(Math.min(n, 8))}`,
      timestamp: "1 hour ago",
      timestampValue: NOW - HOUR_MS,
      chatId: n <= 8 ? `chat-${pad(n)}` : undefined,
      constellationId: n <= 4 ? `con${(n - 1) * 2 + 1}` : undefined,
    },
    {
      id: `${projectId}-act-02`,
      projectId,
      type: "constellation",
      primary: `Constellation name ${pad(Math.min(n + 1, 8))} was updated`,
      secondary: n % 3 === 0 ? "PDF" : n % 3 === 1 ? "Database" : "CSV",
      timestamp: "3 hours ago",
      timestampValue: NOW - HOUR_MS * 3,
      constellationId: n <= 4 ? `con${Math.min((n - 1) * 2 + 2, 8)}` : undefined,
    },
    {
      id: `${projectId}-act-03`,
      projectId,
      type: "output",
      primary: `Output name ${pad(n)} was saved to Dashboard`,
      secondary: "Chart",
      timestamp: "Yesterday",
      timestampValue: NOW - DAY_MS,
      dashboardId: `${projectId}-output-01`,
    },
    {
      id: `${projectId}-act-04`,
      projectId,
      type: "dashboard",
      primary: `Dashboard was updated`,
      timestamp: "2 days ago",
      timestampValue: NOW - DAY_MS * 2,
      dashboardId: `${projectId}-dashboard-01`,
    },
  ];

  if (index === 0 && homeProject) {
    base.push(
      {
        id: `${projectId}-act-05`,
        projectId,
        type: "widget",
        primary: "Vidget name 01 was published",
        secondary: "Website",
        timestamp: "3 days ago",
        timestampValue: NOW - DAY_MS * 3,
        virtualAssistantId: `${projectId}-va-01`,
      },
      {
        id: `${projectId}-act-06`,
        projectId,
        type: "instruction",
        primary: "Galaxy Instruction was updated",
        secondary: homeProject.name,
        timestamp: "4 days ago",
        timestampValue: NOW - DAY_MS * 4,
      },
      {
        id: `${projectId}-act-07`,
        projectId,
        type: "member",
        primary: "User name was added",
        secondary: "Analyst",
        timestamp: "5 days ago",
        timestampValue: NOW - DAY_MS * 5,
      },
    );
  }

  if (homeProject?.isEmpty || homeProject?.constellationCount === 0) {
    return [];
  }

  return base;
});

export const PROJECT_DASHBOARD_OUTPUTS: ProjectDashboardOutput[] = PROJECT_IDS.flatMap(
  (projectId) => {
    const homeProject = HOME_PROJECTS.find((project) => project.id === projectId);
    if (homeProject?.isEmpty) return [];
    const templates: Omit<ProjectDashboardOutput, "id" | "projectId" | "createdByUserId">[] = [
      {
        name: "Output name 01",
        outputType: "chart",
        conversationSource: "galaxy",
        sourceContext: "Galaxy",
        updatedAt: "2h ago",
        updatedAtTimestamp: NOW - HOUR_MS * 2,
      },
      {
        name: "Output name 02",
        outputType: "table",
        conversationSource: "constellation-chat",
        sourceContext: "Constellation name 01",
        updatedAt: "yesterday",
        updatedAtTimestamp: NOW - DAY_MS,
      },
      {
        name: "Output name 03",
        outputType: "report",
        conversationSource: "constellation-chat",
        sourceContext: "Chat name 01",
        updatedAt: "3 days ago",
        updatedAtTimestamp: NOW - DAY_MS * 3,
      },
      {
        name: "Output name 04",
        outputType: "metric",
        conversationSource: "galaxy",
        sourceContext: "Galaxy",
        updatedAt: "4 days ago",
        updatedAtTimestamp: NOW - DAY_MS * 4,
      },
      {
        name: "Output name 05",
        outputType: "analysis",
        conversationSource: "constellation-chat",
        sourceContext: "Constellation name 02",
        updatedAt: "5 days ago",
        updatedAtTimestamp: NOW - DAY_MS * 5,
      },
      {
        name: "Output name 06",
        outputType: "insight",
        conversationSource: "constellation-chat",
        sourceContext: "Chat name 02",
        updatedAt: "6 days ago",
        updatedAtTimestamp: NOW - DAY_MS * 6,
      },
      {
        name: "Output name 07",
        outputType: "comparison",
        conversationSource: "galaxy",
        sourceContext: "Galaxy",
        updatedAt: "1 week ago",
        updatedAtTimestamp: NOW - DAY_MS * 7,
      },
      {
        name: "Output name 08",
        outputType: "mixed",
        conversationSource: "constellation-chat",
        sourceContext: "Chat name 03",
        updatedAt: "1 week ago",
        updatedAtTimestamp: NOW - DAY_MS * 7 - HOUR_MS,
      },
    ];
    return templates.map((item, index) => ({
      id: `${projectId}-output-${pad(index + 1)}`,
      projectId,
      ...item,
      createdByUserId: dashboardDemoCreator(projectId, index),
    }));
  },
);

export const PROJECT_DASHBOARDS: ProjectDashboardItem[] = PROJECT_IDS.flatMap((projectId) => {
  const index = projectIndex(projectId);
  const homeProject = HOME_PROJECTS.find((project) => project.id === projectId);
  if (homeProject?.isEmpty) return [];
  const n = index + 1;
  const items: ProjectDashboardItem[] = [
    {
      id: `${projectId}-dashboard-01`,
      projectId,
      name: `Dashboard name ${pad(n)}`,
      kind: "dashboard",
      updatedAt: "2h ago",
      updatedAtTimestamp: NOW - HOUR_MS * 2,
      createdByUserId: dashboardDemoCreator(projectId, 0),
    },
    {
      id: `${projectId}-dashboard-02`,
      projectId,
      name: `Dashboard name ${pad(Math.min(n + 1, 10))}`,
      kind: "dashboard",
      updatedAt: "1 day ago",
      updatedAtTimestamp: NOW - DAY_MS,
      createdByUserId: dashboardDemoCreator(projectId, 1),
    },
  ];
  if (index % 2 === 0) {
    items.push({
      id: `${projectId}-dashboard-group-01`,
      projectId,
      name: `Dashboard group name ${pad(n)}`,
      kind: "group",
      updatedAt: "3 days ago",
      updatedAtTimestamp: NOW - DAY_MS * 3,
      createdByUserId: dashboardDemoCreator(projectId, 2),
    });
  }
  return items;
});

/** @deprecated Use canonical Vidget state — kept empty to avoid a second dataset. */
export const PROJECT_WIDGETS: ProjectWidgetItem[] = [];

/** @deprecated Alias — empty; use canonical Vidget state. */
export const PROJECT_VIRTUAL_ASSISTANTS = PROJECT_WIDGETS;

export const CONSTELLATION_SOURCE_COUNTS: Record<string, number> =
  buildConstellationSourceCountMap();

export function getProjectActivity(projectId: string): ProjectActivityItem[] {
  return PROJECT_ACTIVITY
    .filter((item) => item.projectId === projectId)
    .slice()
    .sort((a, b) => b.timestampValue - a.timestampValue);
}

export function getProjectDashboardOutputs(projectId: string): ProjectDashboardOutput[] {
  return PROJECT_DASHBOARD_OUTPUTS
    .filter((item) => item.projectId === projectId)
    .slice()
    .sort((a, b) => b.updatedAtTimestamp - a.updatedAtTimestamp);
}

export function getProjectDashboards(projectId: string): ProjectDashboardItem[] {
  return PROJECT_DASHBOARDS
    .filter((item) => item.projectId === projectId)
    .slice()
    .sort((a, b) => b.updatedAtTimestamp - a.updatedAtTimestamp);
}

export function getProjectWidgets(projectId: string): ProjectWidgetItem[] {
  return PROJECT_WIDGETS.filter((item) => item.projectId === projectId);
}

export function getProjectVirtualAssistants(projectId: string): ProjectWidgetItem[] {
  return getProjectWidgets(projectId);
}
