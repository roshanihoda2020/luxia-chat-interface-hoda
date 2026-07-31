import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { HomeProjectCard } from "@/app/features/project/types";
import {
  getProjectActivity,
  getProjectDashboards,
  getProjectVirtualAssistants,
} from "./data";
import { ProjectGalaxyCard } from "./ProjectGalaxyCard";
import { ProjectHeader, ProjectNotFoundState } from "./ProjectHeader";
import {
  ChatsModule,
  ConstellationsModule,
  DashboardsModule,
  VirtualAssistantsModule,
} from "./ProjectModules";
import { RecentActivityCard } from "./RecentActivityCard";
import type {
  ProjectActivityItem,
  ProjectOverviewBrowseMode,
  ProjectOverviewChat,
  ProjectOverviewConstellation,
} from "./types";

export interface ProjectOverviewPageProps {
  projectId: string | null;
  projects: HomeProjectCard[];
  galaxyNameById: Record<string, string>;
  chats: ProjectOverviewChat[];
  constellations: ProjectOverviewConstellation[];
  initialBrowseMode?: ProjectOverviewBrowseMode;
  onNavigateHome: () => void;
  onViewProjects: () => void;
  onOpenGalaxy: (projectId: string) => void;
  onOpenGalaxySettings: (projectId: string) => void;
  onOpenChat: (chatId: string) => void;
  onOpenConstellation: (projectId: string, constellationId: string) => void;
  onNewChat: (projectId: string) => void;
  onAddConstellation: (projectId: string, name: string, type: "database" | "csv" | "pdf") => void;
  onOpenDashboard?: (projectId: string, dashboardId: string) => void;
  onNewDashboard?: (projectId: string) => void;
  onOpenVirtualAssistant?: (projectId: string, assistantId: string) => void;
  onBrowseModeChange?: (mode: ProjectOverviewBrowseMode) => void;
  onRenameProject?: (projectId: string, name: string) => void;
  onArchiveProject?: (projectId: string) => void;
}

/**
 * Unfinished Project-scoped destinations are not navigable yet.
 * Keep Overview as the only browse surface until those pages are designed.
 */
const DESIGNED_BROWSE_MODES: ProjectOverviewBrowseMode[] = ["overview"];

function OverviewLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-2.5 luxia-type-overline-data"
      style={{ color: "var(--luxia-neutral-500, #64748B)" }}
    >
      {children}
    </p>
  );
}

export function ProjectOverviewPage({
  projectId,
  projects,
  galaxyNameById,
  chats,
  constellations,
  initialBrowseMode = "overview",
  onNavigateHome,
  onViewProjects,
  onOpenGalaxy,
  onOpenGalaxySettings,
  onOpenChat,
  onNewChat,
  onBrowseModeChange,
  onRenameProject,
  onArchiveProject,
}: ProjectOverviewPageProps) {
  const [browseMode, setBrowseMode] = useState<ProjectOverviewBrowseMode>(
    DESIGNED_BROWSE_MODES.includes(initialBrowseMode) ? initialBrowseMode : "overview",
  );

  useEffect(() => {
    const next = DESIGNED_BROWSE_MODES.includes(initialBrowseMode)
      ? initialBrowseMode
      : "overview";
    setBrowseMode(next);
    if (next !== initialBrowseMode) {
      onBrowseModeChange?.(next);
    }
  }, [projectId, initialBrowseMode, onBrowseModeChange]);

  useEffect(() => {
    if (!DESIGNED_BROWSE_MODES.includes(browseMode)) {
      setBrowseMode("overview");
      onBrowseModeChange?.("overview");
    }
  }, [browseMode, onBrowseModeChange]);

  const project = useMemo(
    () => (projectId ? projects.find((entry) => entry.id === projectId) ?? null : null),
    [projectId, projects],
  );

  const projectChats = useMemo(
    () => (projectId ? chats.filter((chat) => chat.projectId === projectId) : []),
    [chats, projectId],
  );

  const projectConstellations = useMemo(
    () => (projectId ? constellations.filter((item) => item.projectId === projectId) : []),
    [constellations, projectId],
  );

  const activity = useMemo(
    () => (projectId ? getProjectActivity(projectId) : []),
    [projectId],
  );
  const dashboards = useMemo(
    () => (projectId ? getProjectDashboards(projectId) : []),
    [projectId],
  );
  const assistants = useMemo(
    () => (projectId ? getProjectVirtualAssistants(projectId) : []),
    [projectId],
  );

  if (!projectId || !project) {
    return (
      <ProjectNotFoundState
        onBackHome={onNavigateHome}
        onViewProjects={onViewProjects}
      />
    );
  }

  const resolvedProject = project;
  const galaxyName = galaxyNameById[resolvedProject.galaxyId]
    ?? `Galaxy name ${resolvedProject.id.replace("project-", "")}`;

  function handleActivityOpen(item: ProjectActivityItem) {
    if (item.chatId) {
      onOpenChat(item.chatId);
    }
  }

  return (
    <>
      <ProjectHeader
        project={resolvedProject}
        onNavigateHome={onNavigateHome}
        onRenameProject={(name) => onRenameProject?.(resolvedProject.id, name)}
        onArchiveProject={onArchiveProject}
      />

      <div className="flex min-w-0 flex-col gap-5">
        <section className="min-w-0">
          <OverviewLabel>Project intelligence</OverviewLabel>
          <ProjectGalaxyCard
            project={resolvedProject}
            galaxyName={galaxyName}
            lastOpened={resolvedProject.updatedAt}
            onOpenGalaxy={() => onOpenGalaxy(resolvedProject.id)}
            onOpenGalaxySettings={() => onOpenGalaxySettings(resolvedProject.id)}
          />
        </section>

        <section className="min-w-0">
          <OverviewLabel>Knowledge and interactions</OverviewLabel>
          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.35fr)] xl:items-stretch">
            <ConstellationsModule constellations={projectConstellations} />
            <ChatsModule
              chats={projectChats}
              onOpenChat={onOpenChat}
              onNewChat={() => onNewChat(resolvedProject.id)}
            />
          </div>
        </section>

        <section className="min-w-0">
          <OverviewLabel>Outputs</OverviewLabel>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-stretch">
            <DashboardsModule dashboards={dashboards} />
            <VirtualAssistantsModule assistants={assistants} />
          </div>
        </section>

        <section className="min-w-0">
          <OverviewLabel>Recent activity</OverviewLabel>
          <RecentActivityCard
            items={activity}
            onOpenActivity={handleActivityOpen}
          />
        </section>
      </div>
    </>
  );
}
