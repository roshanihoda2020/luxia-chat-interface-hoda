import { useMemo, useEffect, useRef, type ReactNode } from "react";
import {
  LuxiaPageFrame,
  type LuxiaPageFrameVariant,
} from "@/app/components/LuxiaPageFrame";
import { cn } from "@/app/components/ui/utils";
import { LUXIA_PAGE_LAYOUT } from "@/app/components/luxiaPageLayout";
import {
  homePrimaryPreferencesEqual,
  normalizeHomePrimaryPreference,
  resolveHomeHero,
} from "./homePrimaryPreference";
import { workItemEntityKey } from "./homeEntityKeys";
import { ContinueWorkingBrowser } from "./ContinueWorkingBrowser";
import { GlobalSearch, type HomeSearchResult } from "./GlobalSearch";
import { HomeHeader } from "./HomeHeader";
import { HomeHero } from "./HomeHero";
import { HS } from "./homeSurfaces";
import { ProjectsBrowser, ProjectsPreview } from "@/app/features/project";
import { filterActiveProjects } from "@/app/features/project/data";
import type {
  HomeHeroContent,
  HomePageProps,
  ProjectDestination,
} from "./types";

export function HomePage({
  projects,
  recentWork,
  pinnedProjectIds,
  pinnedEntityOrder,
  primaryPreference,
  dismissedContinueKeys,
  browseMode,
  onBrowseModeChange,
  onDismissFromContinue,
  onRestoreToContinue,
  onSetPrimaryHero,
  onShowAllOnHome,
  onPrimaryPreferenceChange,
  onToggleProjectPin,
  onArchiveProject,
  onRestoreProject,
  onEditProject,
  onDeleteProject,
  canEditProject,
  canArchiveProject,
  canDeleteProject,
  canRestoreProject,
  onToggleWorkPin,
  onContinueWork,
  onOpenProject,
  onOpenGalaxy,
  onOpenChat,
  onOpenConstellation,
  onNewChat,
  onNewProject,
  searchConstellations,
  onNavigateProjectDestination,
}: HomePageProps) {
  const projectsWithPin = useMemo(
    () => projects.map((project) => ({
      ...project,
      isPinned: project.status !== "archived" && pinnedProjectIds.includes(project.id),
    })),
    [pinnedProjectIds, projects],
  );

  const activeProjects = useMemo(
    () => filterActiveProjects(projectsWithPin),
    [projectsWithPin],
  );

  const workWithPin = useMemo(
    () => recentWork.map((item) => ({
      ...item,
      isPinned: pinnedEntityOrder.includes(workItemEntityKey(item)) || Boolean(item.isPinned),
    })),
    [pinnedEntityOrder, recentWork],
  );

  const pinnedWorkIds = useMemo(
    () => new Set(workWithPin.filter((item) => item.isPinned).map((item) => item.id)),
    [workWithPin],
  );

  const effectivePrimaryPreference = useMemo(
    () => normalizeHomePrimaryPreference(
      primaryPreference,
      workWithPin,
      dismissedContinueKeys,
    ),
    [dismissedContinueKeys, primaryPreference, workWithPin],
  );

  useEffect(() => {
    if (!homePrimaryPreferencesEqual(effectivePrimaryPreference, primaryPreference)) {
      onPrimaryPreferenceChange(effectivePrimaryPreference);
    }
  }, [effectivePrimaryPreference, onPrimaryPreferenceChange, primaryPreference]);

  const allowedFocusProjectIds = useMemo(
    () => new Set(projects.map((project) => project.id)),
    [projects],
  );

  const heroResolution = useMemo(
    () => resolveHomeHero({
      recentWork: workWithPin,
      primaryPreference: effectivePrimaryPreference,
      pinnedWorkIds,
      pinnedOrder: pinnedEntityOrder,
      dismissed: dismissedContinueKeys,
      projects,
      allowedProjectIds: allowedFocusProjectIds,
    }),
    [
      allowedFocusProjectIds,
      dismissedContinueKeys,
      effectivePrimaryPreference,
      pinnedEntityOrder,
      pinnedWorkIds,
      projects,
      workWithPin,
    ],
  );

  const constellations = useMemo(() => {
    if (searchConstellations && searchConstellations.length > 0) {
      return searchConstellations;
    }
    return workWithPin
      .filter((item) => item.constellationId && item.constellationName)
      .map((item) => ({
        id: item.constellationId!,
        label: item.constellationName!,
        projectId: item.projectId,
        type:
          item.constellationSource === "pdf"
            ? ("pdf" as const)
            : item.constellationSource === "csv"
              ? ("csv" as const)
              : ("database" as const),
      }));
  }, [searchConstellations, workWithPin]);

  function handleHeroPrimary(hero: HomeHeroContent) {
    if (hero.kind === "empty") {
      if (hero.emptyReason === "allHidden") return;
      onNewChat();
      return;
    }
    const item = workWithPin.find((entry) => entry.id === hero.workItemId);
    if (item) onContinueWork(item);
  }

  function handleHeroSecondary(hero: HomeHeroContent) {
    if (hero.secondaryAction === "viewYourWork") {
      onBrowseModeChange("your-work");
      return;
    }
    if (hero.secondaryAction === "newProject") {
      onNewProject();
      return;
    }
    if (hero.projectId) onOpenProject(hero.projectId);
  }

  function handleSearchSelect(result: HomeSearchResult) {
    if (result.kind === "project") {
      onOpenProject(result.entityId);
      return;
    }
    if (result.kind === "galaxy" || result.kind === "chat") {
      onOpenChat(result.entityId);
      return;
    }
    if (result.kind === "constellation" && result.constellationId) {
      if (onOpenConstellation) {
        onOpenConstellation(result.projectId, result.constellationId);
        return;
      }
      onOpenProject(result.projectId);
    }
  }

  function handleNavigate(destination: ProjectDestination, projectId: string) {
    if (onNavigateProjectDestination) {
      onNavigateProjectDestination(destination, projectId);
      return;
    }
    if (destination === "galaxy") onOpenGalaxy(projectId);
    else onOpenProject(projectId);
  }

  if (browseMode === "your-work") {
    return (
      <ContinueWorkingBrowser
        items={workWithPin}
        dismissedKeys={dismissedContinueKeys}
        heroEntityKey={heroResolution.heroEntityKey}
        projects={projectsWithPin}
        onBack={() => onBrowseModeChange("overview")}
        onContinue={onContinueWork}
        onTogglePin={onToggleWorkPin}
        onRestore={onRestoreToContinue}
        onDismiss={onDismissFromContinue}
        onSetPrimary={onSetPrimaryHero}
        onShowAllOnHome={onShowAllOnHome}
        onNewChat={onNewChat}
        onOpenGalaxy={onOpenGalaxy}
        onNewProject={onNewProject}
      />
    );
  }

  if (browseMode === "projects") {
    return (
      <ProjectsBrowser
        projects={projectsWithPin}
        pinnedProjectOrder={pinnedProjectIds}
        onBack={() => onBrowseModeChange("overview")}
        onToggleProjectPin={onToggleProjectPin}
        onArchiveProject={onArchiveProject}
        onRestoreProject={onRestoreProject}
        onEditProject={onEditProject}
        onDeleteProject={onDeleteProject}
        canEditProject={canEditProject}
        canArchiveProject={canArchiveProject}
        canDeleteProject={canDeleteProject}
        canRestoreProject={canRestoreProject}
        onOpenProject={onOpenProject}
        onNavigateProjectDestination={handleNavigate}
        onNewProject={onNewProject}
      />
    );
  }

  const hero = heroResolution.hero;
  const heroWorkItem = workWithPin.find((item) => item.id === hero.workItemId);

  return (
    <>
      <HomeHeader onNewChat={onNewChat} onNewProject={onNewProject} />

      <GlobalSearch
        projects={activeProjects}
        recentWork={workWithPin}
        constellations={constellations}
        onSelect={handleSearchSelect}
      />

      <HomeHero
        hero={hero}
        heroEntityKey={heroResolution.heroEntityKey}
        eligiblePrimaryItems={heroResolution.eligiblePrimaryItems}
        projects={activeProjects}
        onPrimary={() => handleHeroPrimary(hero)}
        onSecondary={() => handleHeroSecondary(hero)}
        onTogglePin={
          heroWorkItem
            ? () => onToggleWorkPin(heroWorkItem.id)
            : undefined
        }
        onSetPrimary={onSetPrimaryHero}
        onDismissFromContinue={onDismissFromContinue}
        onViewAll={() => onBrowseModeChange("your-work")}
      />

      <ProjectsPreview
        projects={activeProjects}
        pinnedProjectOrder={pinnedProjectIds}
        onViewAll={() => onBrowseModeChange("projects")}
        onToggleProjectPin={onToggleProjectPin}
        onArchiveProject={onArchiveProject}
        onRestoreProject={onRestoreProject}
        onEditProject={onEditProject}
        onDeleteProject={onDeleteProject}
        canEditProject={canEditProject}
        canArchiveProject={canArchiveProject}
        canDeleteProject={canDeleteProject}
        canRestoreProject={canRestoreProject}
        onOpenProject={onOpenProject}
        onNavigateProjectDestination={handleNavigate}
      />
    </>
  );
}

export function HomePageShell({
  children,
  scrollRequest = 0,
  /** @deprecated Prefer `variant`. Kept for existing Project Overview call sites. */
  contentMax,
  variant = "standard",
  /**
   * When false, only provide the scroll surface (no LuxiaPageFrame).
   * Use for pages that already render their own LuxiaPageFrame.
   */
  framed = true,
  className = "",
  /**
   * Desktop split workspaces (e.g. Vidget Inbox) fill remaining height and
   * must not be an extra vertical scroller. Below `lg` the shell still
   * page-scrolls so stacked/narrow layouts keep normal document flow.
   */
  containLayout = false,
}: {
  children: ReactNode;
  scrollRequest?: number;
  contentMax?: string;
  variant?: LuxiaPageFrameVariant;
  framed?: boolean;
  className?: string;
  containLayout?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRequest <= 0) return;
    scrollRef.current?.scrollTo({ top: 0 });
  }, [scrollRequest]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "luxia-home-shell min-h-0 min-w-0 flex-1",
        "luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical",
        containLayout
          ? "max-lg:overflow-x-hidden max-lg:overflow-y-auto max-lg:[scrollbar-gutter:stable] lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden"
          : "overflow-x-hidden overflow-y-auto",
        className,
      )}
      style={{
        background: HS.pageBg,
        ...(containLayout ? undefined : { scrollbarGutter: "stable" }),
      }}
    >
      {framed ? (
        <LuxiaPageFrame
          variant={variant}
          withGutter
          style={
            contentMax
              ? {
                  maxWidth: contentMax,
                  paddingBlockStart: LUXIA_PAGE_LAYOUT.padTop,
                }
              : undefined
          }
        >
          {children}
        </LuxiaPageFrame>
      ) : (
        children
      )}
    </div>
  );
}
