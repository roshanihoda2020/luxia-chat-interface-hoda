import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { HomeProjectCard } from "@/app/features/project/types";
import {
  resolveVidgetSourceDisplay,
  type VidgetRecord,
} from "@/app/features/vidgets";
import { VIDGET_CHANNEL_LABELS, VIDGET_STATUS_LABELS } from "@/app/features/vidgets/types";
import { getProjectActivity, getProjectDashboardOutputs } from "./data";
import { listProjectDashboards, useProjectDashboards } from "./projectDashboardStore";
import { ProjectAssistantOverviewEntry } from "@/app/features/project-assistant";
import type { ActivityNavigationContext } from "./activityNavigation";
import { openProjectActivity } from "./activityNavigation";
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
  ProjectWidgetItem,
} from "./types";

export interface ProjectOverviewPageProps {
  projectId: string | null;
  projects: HomeProjectCard[];
  galaxyNameById: Record<string, string>;
  galaxyInstructionById?: Record<string, string>;
  chats: ProjectOverviewChat[];
  constellations: ProjectOverviewConstellation[];
  vidgets?: VidgetRecord[];
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
  /** Project › Dashboards (a named Dashboard when `dashboardId` is given). */
  onOpenDashboard?: (projectId: string, dashboardId?: string | null) => void;
  /** Project › All Outputs. */
  onOpenAllOutputs?: (projectId: string) => void;
  onOpenDashboardOutput?: (projectId: string, outputId: string) => void;
  onOpenVirtualAssistant?: (projectId: string, vidgetId: string) => void;
  onViewAllActivity?: (projectId: string) => void;
  activityNavigationContext?: ActivityNavigationContext;
  onViewAllVidgets?: (projectId: string) => void;
  onCreateVidget?: (projectId: string) => void;
  onCreateVidgetFromGalaxy?: (projectId: string) => void;
  canManageVidgets?: (projectId: string) => boolean;
  onAskProjectAssistant?: (projectId: string) => void;
  onBrowseModeChange?: (mode: ProjectOverviewBrowseMode) => void;
  onRenameProject?: (projectId: string, name: string) => void;
  onEditProject?: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
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
  onOpenAllOutputs,
  onOpenDashboardOutput,
  onBrowseModeChange,
  onRenameProject,
  onEditProject,
  onArchiveProject,
  onDeleteProject,
  onOpenConstellationSettings,
  onViewAllConstellations,
  onViewAllChats,
  onOpenVirtualAssistant,
  onViewAllActivity,
  onViewAllVidgets,
  activityNavigationContext,
  onCreateVidget,
  onCreateVidgetFromGalaxy,
  canManageVidgets,
  onAskProjectAssistant,
  vidgets = [],
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
  // Re-render when Dashboards change (the outputs module shows their count).
  useProjectDashboards();
  const dashboardOutputs = useMemo(
    () => (projectId ? getProjectDashboardOutputs(projectId) : []),
    [projectId],
  );
  const widgets = useMemo((): ProjectWidgetItem[] => {
    if (!projectId || !project) return [];
    const galaxyName =
      galaxyNameById[project.galaxyId]
      ?? null;
    return vidgets
      .filter((item) => item.projectId === projectId)
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((item) => {
        const constellation = item.constellationId
          ? projectConstellations.find((entry) => entry.id === item.constellationId)
          : undefined;
        const source = resolveVidgetSourceDisplay(item, {
          projectGalaxyId: project.galaxyId,
          galaxyName,
          constellation: constellation
            ? {
                id: constellation.id,
                projectId: constellation.projectId,
                name: constellation.label,
              }
            : item.constellationId
              ? null
              : undefined,
          projectConstellations: projectConstellations.map((entry) => ({
            id: entry.id,
            projectId: entry.projectId,
            name: entry.label,
          })),
        });
        return {
          id: item.id,
          projectId: item.projectId,
          name: item.name,
          channel: item.channel,
          channelLabel: VIDGET_CHANNEL_LABELS[item.channel],
          sourceType: item.sourceType,
          sourceLabel: source.label,
          statusLabel: VIDGET_STATUS_LABELS[item.status],
          sourceAvailable: source.available,
        };
      });
  }, [projectId, project, vidgets, galaxyNameById, projectConstellations]);

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
    if (!activityNavigationContext) return;
    openProjectActivity(item, activityNavigationContext, {
      onOpenChat,
      onOpenConstellation,
      onOpenDashboard: (projectId, dashboardId) => onOpenDashboard?.(projectId, dashboardId ?? null),
      onOpenDashboardOutput: (projectId, outputId) =>
        onOpenDashboardOutput?.(projectId, outputId),
      onOpenVidget: (projectId, vidgetId) =>
        onOpenVirtualAssistant?.(projectId, vidgetId),
      onOpenGalaxy,
      onOpenGalaxySettings,
    });
  }

  const resolvedActivityContext = activityNavigationContext ?? {
    projectId: resolvedProject.id,
    chatIds: new Set(projectChats.map((chat) => chat.id)),
    constellationIds: new Set(projectConstellations.map((item) => item.id)),
    outputIds: new Set(dashboardOutputs.map((item) => item.id)),
    vidgetIds: new Set(widgets.map((item) => item.id)),
    hasGalaxy: Boolean(resolvedProject.galaxyId),
  };

  return (
    <>
      <ProjectHeader
        project={resolvedProject}
        onNavigateHome={onNavigateHome}
        onRenameProject={(name) => onRenameProject?.(resolvedProject.id, name)}
        onEditProject={onEditProject}
        onArchiveProject={onArchiveProject}
        onDeleteProject={onDeleteProject}
      />

      <div className="flex min-w-0 flex-col gap-5">
        {onAskProjectAssistant ? (
          <ProjectAssistantOverviewEntry
            onAskProject={() => onAskProjectAssistant(resolvedProject.id)}
          />
        ) : null}

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
            usableConstellationCount={projectConstellations.length}
            onOpenGalaxy={() => onOpenGalaxy(resolvedProject.id)}
            onOpenGalaxySettings={() => onOpenGalaxySettings(resolvedProject.id)}
            canCreateVidget={canManageVidgets?.(resolvedProject.id) ?? false}
            onCreateVidget={
              onCreateVidgetFromGalaxy
                ? () => onCreateVidgetFromGalaxy(resolvedProject.id)
                : undefined
            }
          />
        </section>

        <section className="min-w-0">
          <OverviewLabel>Project outputs</OverviewLabel>
          <DashboardsModule
            outputs={dashboardOutputs}
            dashboardCount={listProjectDashboards(resolvedProject.id).length}
            onOpenDashboards={
              onOpenDashboard
                ? () => onOpenDashboard(resolvedProject.id, null)
                : undefined
            }
            onOpenAllOutputs={
              onOpenAllOutputs
                ? () => onOpenAllOutputs(resolvedProject.id)
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
          <WidgetsModule
            widgets={widgets}
            onViewAll={
              onViewAllVidgets
                ? () => onViewAllVidgets(resolvedProject.id)
                : undefined
            }
            onCreateVidget={
              canManageVidgets?.(resolvedProject.id) && onCreateVidget
                ? () => onCreateVidget(resolvedProject.id)
                : undefined
            }
            onOpen={
              onOpenVirtualAssistant
                ? (id) => onOpenVirtualAssistant(resolvedProject.id, id)
                : undefined
            }
          />
        </section>

        <section className="min-w-0">
          <OverviewLabel>Recent activity</OverviewLabel>
          <RecentActivityCard
            items={activity}
            navigationContext={resolvedActivityContext}
            onOpenActivity={handleActivityOpen}
            onViewAll={
              onViewAllActivity
                ? () => onViewAllActivity(resolvedProject.id)
                : undefined
            }
          />
        </section>
      </div>
    </>
  );
}
