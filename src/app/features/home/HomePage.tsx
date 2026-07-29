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
import { ProjectsBrowser } from "./ProjectsBrowser";
import { ProjectsPreview } from "./ProjectsPreview";
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
  onToggleWorkPin,
  onContinueWork,
  onOpenProject,
  onOpenGalaxy,
  onOpenChat,
  onNewChat,
  onNewProject,
  onNavigateProjectDestination,
}: HomePageProps) {
  const projectsWithPin = useMemo(
    () => projects.map((project) => ({
      ...project,
      isPinned: pinnedProjectIds.includes(project.id),
    })),
    [pinnedProjectIds, projects],
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
    }),
    [dismissedContinueKeys, effectivePrimaryPreference, pinnedEntityOrder, pinnedWorkIds, workWithPin],
  );

  const constellations = useMemo(
    () => workWithPin
      .filter((item) => item.constellationId && item.constellationName)
      .map((item) => ({
        id: item.constellationId!,
        label: item.constellationName!,
        projectId: item.projectId,
        type: item.constellationSource === "pdf" ? "pdf" as const : "database" as const,
      })),
    [workWithPin],
  );

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
      // Exact Chat/Galaxy ID — never route by Project title or first match.
      onOpenChat(result.entityId);
      return;
    }
    if (result.kind === "constellation" && result.constellationId) {
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
        onOpenProject={onOpenProject}
        onNavigateProjectDestination={handleNavigate}
      />
    );
  }

  const hero = heroResolution.hero;
  const heroWorkItem = workWithPin.find((item) => item.id === hero.workItemId);

  return (
    <>
      <HomeHeader onNewChat={onNewChat} onNewProject={onNewProject} />

      <GlobalSearch
        projects={projectsWithPin}
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
        projects={projectsWithPin}
        pinnedProjectOrder={pinnedProjectIds}
        onViewAll={() => onBrowseModeChange("projects")}
        onToggleProjectPin={onToggleProjectPin}
        onOpenProject={onOpenProject}
        onNavigateProjectDestination={handleNavigate}
      />
    </>
  );
}

export function HomePageShell({
  children,
  scrollRequest = 0,
}: {
  children: ReactNode;
  /** Increment to scroll the Home surface to the top. */
  scrollRequest?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRequest <= 0) return;
    scrollRef.current?.scrollTo({ top: 0 });
  }, [scrollRequest]);

  return (
    <div
      ref={scrollRef}
      className="luxia-home-shell min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
      style={{ background: HS.pageBg }}
    >
      <div
        className="w-full py-8"
        style={{ paddingInline: HS.pagePadInline }}
      >
        <div
          className="luxia-home-content mx-auto w-full"
          style={{ maxWidth: HS.contentMax }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
