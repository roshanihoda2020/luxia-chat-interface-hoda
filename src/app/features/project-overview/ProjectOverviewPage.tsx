import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { HomeProjectCard } from "@/app/features/project/types";
import {
  getProjectActivity,
  getProjectDashboardOutputs,
  getProjectWidgets,
} from "./data";
import { ProjectGalaxyCard } from "./ProjectGalaxyCard";
import { ProjectHeader, ProjectNotFoundState } from "./ProjectHeader";
import {
  ChatsModule,
  ConstellationsModule,
  DashboardsModule,
  WidgetsModule,
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
  galaxyInstructionById?: Record<string, string>;
  chats: ProjectOverviewChat[];
  constellations: ProjectOverviewConstellation[];
  initialBrowseMode?: ProjectOverviewBrowseMode;
  onNavigateHome: () => void;
  onViewProjects: () => void;
  onOpenGalaxy: (projectId: string) => void;
  onOpenGalaxySettings: (projectId: string) => void;
  onOpenChat: (chatId: string) => void;
  onOpenConstellation: (projectId: string, constellationId: string) => void;
  onOpenConstellationSettings?: (projectId: string, constellationId: string) => void;
  onViewAllConstellations?: (projectId: string) => void;
  onViewAllChats?: (projectId: string) => void;
  onNewChat: (projectId: string) => void;
  onAddConstellation?: (projectId: string, name: string, type: "database" | "csv" | "pdf") => void;
  onOpenDashboard?: (projectId: string) => void;
  onNewDashboard?: (projectId: string) => void;
  onOpenVirtualAssistant?: (projectId: string, assistantId: string) => void;
  onBrowseModeChange?: (mode: ProjectOverviewBrowseMode) => void;
  onRenameProject?: (projectId: string, name: string) => void;
  onRenameGalaxy?: (projectId: string, name: string) => void;
  onSaveGalaxyInstruction?: (projectId: string, instruction: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenMembers?: (projectId: string) => void;
}

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
  galaxyInstructionById,
  chats,
  constellations,
  initialBrowseMode = "overview",
  onNavigateHome,
  onViewProjects,
  onOpenGalaxy,
  onOpenGalaxySettings,
  onOpenChat,
  onOpenConstellation,
  onNewChat,
  onAddConstellation,
  onOpenDashboard,
  onBrowseModeChange,
  onRenameProject,
  onRenameGalaxy,
  onSaveGalaxyInstruction,
  onArchiveProject,
  onDeleteProject,
  onOpenMembers,
  onOpenConstellationSettings,
  onViewAllConstellations,
  onViewAllChats,
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
    () =>
      (projectId ? chats.filter((chat) => chat.projectId === projectId) : [])
        .slice()
        .sort((a, b) => b.lastOpenedTimestamp - a.lastOpenedTimestamp),
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
  const dashboardOutputs = useMemo(
    () => (projectId ? getProjectDashboardOutputs(projectId) : []),
    [projectId],
  );
  const widgets = useMemo(
    () => (projectId ? getProjectWidgets(projectId) : []),
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
        onDeleteProject={onDeleteProject}
        onOpenMembers={onOpenMembers}
      />

      <div className="flex min-w-0 flex-col gap-5">
        <section className="min-w-0">
          <OverviewLabel>Project intelligence</OverviewLabel>
          <ProjectGalaxyCard
            project={resolvedProject}
            galaxyName={galaxyName}
            galaxyInstruction={
              resolvedProject.galaxyId
                ? galaxyInstructionById?.[resolvedProject.galaxyId]
                : undefined
            }
            onOpenGalaxy={() => onOpenGalaxy(resolvedProject.id)}
            onOpenGalaxySettings={() => onOpenGalaxySettings(resolvedProject.id)}
            onRenameGalaxy={
              onRenameGalaxy
                ? (name) => onRenameGalaxy(resolvedProject.id, name)
                : undefined
            }
            onSaveGalaxyInstruction={
              onSaveGalaxyInstruction
                ? (instruction) => onSaveGalaxyInstruction(resolvedProject.id, instruction)
                : undefined
            }
          />
        </section>

        <section className="min-w-0">
          <OverviewLabel>Project outputs</OverviewLabel>
          <DashboardsModule
            outputs={dashboardOutputs}
            onOpenDashboard={
              onOpenDashboard
                ? () => onOpenDashboard(resolvedProject.id)
                : undefined
            }
          />
        </section>

        <section className="min-w-0">
          <OverviewLabel>Knowledge and interactions</OverviewLabel>
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
            <ConstellationsModule
              projectId={resolvedProject.id}
              constellations={projectConstellations}
              onOpenConstellation={onOpenConstellation}
              onOpenConstellationSettings={onOpenConstellationSettings}
              onViewAll={() => onViewAllConstellations?.(resolvedProject.id)}
              onAddConstellation={
                onAddConstellation
                  ? () =>
                      onAddConstellation(resolvedProject.id, "Constellation name", "database")
                  : undefined
              }
            />
            <ChatsModule
              chats={projectChats}
              onOpenChat={onOpenChat}
              onViewAll={() => onViewAllChats?.(resolvedProject.id)}
              onNewChat={() => onNewChat(resolvedProject.id)}
            />
          </div>
        </section>

        <section className="min-w-0">
          <OverviewLabel>Deployment and Vidgets</OverviewLabel>
          <WidgetsModule widgets={widgets} />
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
