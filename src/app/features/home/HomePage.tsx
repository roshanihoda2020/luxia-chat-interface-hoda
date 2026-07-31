import { useMemo, useEffect, useRef, type ReactNode } from "react";
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

  const heroResolution = useMemo(
    () => resolveHomeHero({
      recentWork: workWithPin,
      primaryPreference: effectivePrimaryPreference,
      pinnedWorkIds,
      pinnedOrder: pinnedEntityOrder,
      dismissed: dismissedContinueKeys,
      projects,
    }),
    [dismissedContinueKeys, effectivePrimaryPreference, pinnedEntityOrder, pinnedWorkIds, projects, workWithPin],
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
        pinnedEntityOrder={pinnedEntityOrder}
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
        onBack={() => onBrowseModeChange("overview")}
        onToggleProjectPin={onToggleProjectPin}
        onArchiveProject={onArchiveProject}
        onRestoreProject={onRestoreProject}
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
        onOpenProject={onOpenProject}
        onNavigateProjectDestination={handleNavigate}
      />
    </>
  );
}

export function HomePageShell({
  children,
  scrollRequest = 0,
  contentMax = HS.contentMax,
}: {
  children: ReactNode;
  scrollRequest?: number;
  contentMax?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRequest <= 0) return;
    scrollRef.current?.scrollTo({ top: 0 });
  }, [scrollRequest]);

  return (
    <div
      ref={scrollRef}
      className="luxia-home-shell luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
      style={{ background: HS.pageBg }}
    >
      <div
        className="w-full py-8"
        style={{ paddingInline: HS.pagePadInline }}
      >
        <div
          className="luxia-home-content mx-auto w-full min-w-0"
          style={{ maxWidth: contentMax }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
