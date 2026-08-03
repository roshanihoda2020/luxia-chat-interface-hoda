import { HOME_PROJECTS } from "@/app/features/project/data";
import type {
  ProjectActivityItem,
  ProjectDashboardItem,
  ProjectDashboardOutput,
  ProjectMemberItem,
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
        secondary: "Editor",
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
    return [
      {
        id: `${projectId}-output-01`,
        projectId,
        name: "Output name 01",
        outputType: "chart",
        conversationSource: "galaxy",
        sourceContext: "Galaxy",
        updatedAt: "2h ago",
        updatedAtTimestamp: NOW - HOUR_MS * 2,
      },
      {
        id: `${projectId}-output-02`,
        projectId,
        name: "Output name 02",
        outputType: "table",
        conversationSource: "constellation-chat",
        sourceContext: "Constellation name 01",
        updatedAt: "yesterday",
        updatedAtTimestamp: NOW - DAY_MS,
      },
      {
        id: `${projectId}-output-03`,
        projectId,
        name: "Output name 03",
        outputType: "report",
        conversationSource: "constellation-chat",
        sourceContext: "Chat name 01",
        updatedAt: "3 days ago",
        updatedAtTimestamp: NOW - DAY_MS * 3,
      },
      {
        id: `${projectId}-output-04`,
        projectId,
        name: "Output name 04",
        outputType: "metric",
        conversationSource: "galaxy",
        sourceContext: "Galaxy",
        updatedAt: "4 days ago",
        updatedAtTimestamp: NOW - DAY_MS * 4,
      },
      {
        id: `${projectId}-output-05`,
        projectId,
        name: "Output name 05",
        outputType: "analysis",
        conversationSource: "constellation-chat",
        sourceContext: "Constellation name 02",
        updatedAt: "5 days ago",
        updatedAtTimestamp: NOW - DAY_MS * 5,
      },
      {
        id: `${projectId}-output-06`,
        projectId,
        name: "Output name 06",
        outputType: "insight",
        conversationSource: "constellation-chat",
        sourceContext: "Chat name 02",
        updatedAt: "6 days ago",
        updatedAtTimestamp: NOW - DAY_MS * 6,
      },
      {
        id: `${projectId}-output-07`,
        projectId,
        name: "Output name 07",
        outputType: "comparison",
        conversationSource: "galaxy",
        sourceContext: "Galaxy",
        updatedAt: "1 week ago",
        updatedAtTimestamp: NOW - DAY_MS * 7,
      },
      {
        id: `${projectId}-output-08`,
        projectId,
        name: "Output name 08",
        outputType: "mixed",
        conversationSource: "constellation-chat",
        sourceContext: "Chat name 03",
        updatedAt: "1 week ago",
        updatedAtTimestamp: NOW - DAY_MS * 7 - HOUR_MS,
      },
    ];
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
    },
    {
      id: `${projectId}-dashboard-02`,
      projectId,
      name: `Dashboard name ${pad(Math.min(n + 1, 10))}`,
      kind: "dashboard",
      updatedAt: "1 day ago",
      updatedAtTimestamp: NOW - DAY_MS,
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
    });
  }
  return items;
});

const WIDGET_DEPLOYMENTS = [
  "Website",
  "Totem",
  "Embedded assistant",
] as const;

export const PROJECT_WIDGETS: ProjectWidgetItem[] = PROJECT_IDS.flatMap((projectId) => {
  const index = projectIndex(projectId);
  const homeProject = HOME_PROJECTS.find((project) => project.id === projectId);
  if (homeProject?.isEmpty) return [];
  const n = index + 1;
  const count = index === 0 ? 3 : index === 6 ? 4 : 2;
  return Array.from({ length: count }, (_, i) => ({
    id: `${projectId}-va-${pad(i + 1)}`,
    projectId,
    name: `Vidget name ${pad(Math.min(n + i, 10))}`,
    deployment: WIDGET_DEPLOYMENTS[i % WIDGET_DEPLOYMENTS.length],
    language: i % 2 === 0 ? "English" : "Spanish",
    status: i === 1 ? ("Draft" as const) : ("Published" as const),
    constellationCount: i === 0 ? 3 : i === 1 ? 1 : 2,
  }));
});

/** @deprecated Alias — stable getter name for existing imports. */
export const PROJECT_VIRTUAL_ASSISTANTS = PROJECT_WIDGETS;

const ROLE_CYCLE = ["Administrator", "Editor", "Viewer", "Contributor"] as const;

export const PROJECT_MEMBERS: ProjectMemberItem[] = PROJECT_IDS.flatMap((projectId) => {
  const homeProject = HOME_PROJECTS.find((project) => project.id === projectId);
  const memberCount = homeProject?.memberCount ?? 1;
  return Array.from({ length: memberCount }, (_, i) => ({
    id: `${projectId}-member-${pad(i + 1)}`,
    projectId,
    name: i === 0 ? "Hoda Roshani" : `User name ${pad(i + 1)}`,
    role: ROLE_CYCLE[i % ROLE_CYCLE.length],
    email: i === 0 ? "hoda@luxia.example" : `user${pad(i + 1)}@luxia.example`,
  }));
});

export const CONSTELLATION_SOURCE_COUNTS: Record<string, number> = {
  con1: 4,
  con2: 2,
  con3: 6,
  con4: 3,
  con5: 5,
  con6: 2,
  con7: 1,
  con8: 3,
};

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

export function getProjectMembers(projectId: string): ProjectMemberItem[] {
  return PROJECT_MEMBERS.filter((item) => item.projectId === projectId);
}
