import { useMemo, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
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
import {
  EntityHomeTile,
  FocusHomeTile,
  HomeBuilderToolbar,
  HomeTileGrid,
  HomeTileLibrary,
  HomeUnavailableTile,
  PROJECT_LIST_TILE_ROWS,
  ProjectHomeTile,
  ProjectListHomeTile,
  ToolHomeTile,
  getHomeTileDefinition,
  getHomeTileSection,
  getHomeTileSizeId,
  useHomeLayout,
  type EntityHomeTileProps,
  type HomeTile,
  type HomeTileDensity,
  type HomeTileTargetOption,
  type HomeTileType,
} from "./homeBuilder";
import { HS } from "./homeSurfaces";
import { readHomeRecentPreviewCount, resolveHomeRecentPreviewLimit } from "./homeRecentPreviewCount";
import { canCreateProject } from "@/app/features/permissions";
import { formatDataSourceConnectorLabel } from "@/app/features/permissions/data";
import { ProjectsBrowser, ProjectsPreview } from "@/app/features/project";
import { filterActiveProjects, getHomeProjectsSections } from "@/app/features/project/data";
import { getProjectDashboardOutputs } from "@/app/features/project-overview/data";
import {
  DashboardOutputPreviewGraphic,
  outputTypeLabel,
} from "@/app/features/project-overview/DashboardOutputPreviews";
import { LUXIA_TOOLS } from "@/app/features/tools/data";
import {
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaDatasourceIcon,
  LuxiaGalaxyIcon,
} from "@/assets/icons";
import type {
  HomeHeroContent,
  HomePageProps,
  ProjectDestination,
} from "./types";

export function HomePage({
  homeLayoutUserId,
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
  homeTileDataSources = [],
  onOpenDataSource,
  onOpenDashboard,
  onOpenTool,
}: HomePageProps) {
  const homeBuilder = useHomeLayout(homeLayoutUserId);
  const [libraryOpen, setLibraryOpen] = useState(false);

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

  // ── Home Tiles: every tile resolves on each render from data the user can already access ──

  const projectById = new Map(activeProjects.map((project) => [project.id, project]));
  const chatItems = workWithPin.filter((item) => item.kind === "chat");
  const projectSections = getHomeProjectsSections(activeProjects, pinnedProjectIds, null);

  function densityOf(tile: HomeTile): HomeTileDensity {
    const size = getHomeTileSizeId(tile);
    return size === "large" ? "large" : size === "medium" ? "medium" : "small";
  }

  function renderHomeTile(tile: HomeTile) {
    const size = getHomeTileSizeId(tile);
    switch (tile.type) {
      case "your-focus":
        if (size !== "wide") {
          return (
            <FocusHomeTile
              hero={hero}
              density={densityOf(tile)}
              onPrimary={() => handleHeroPrimary(hero)}
              onSecondary={() => handleHeroSecondary(hero)}
            />
          );
        }
        return (
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
        );
      case "pinned-projects":
      case "recent-projects": {
        const pinned = tile.type === "pinned-projects";
        if (size !== "wide-tall") {
          const density = densityOf(tile);
          // Same ordering as the full sections; Recent also respects the Show 3/6/9/All preference.
          const source = pinned ? projectSections.pinned : projectSections.recent;
          const showLimit = resolveHomeRecentPreviewLimit(readHomeRecentPreviewCount());
          const rows = Math.min(
            PROJECT_LIST_TILE_ROWS[density],
            pinned ? Number.POSITIVE_INFINITY : showLimit ?? Number.POSITIVE_INFINITY,
          );
          if (source.length === 0) return null;
          return (
            <ProjectListHomeTile
              variant={pinned ? "pinned" : "recent"}
              projects={source.slice(0, rows)}
              total={pinned ? projectSections.pinnedTotal : projectSections.recentEligibleTotal}
              density={density}
              onOpenProject={onOpenProject}
              onViewAll={() => onBrowseModeChange("projects")}
            />
          );
        }
        return (
          <ProjectsPreview
            sections={pinned ? "pinned" : "recent"}
            projects={activeProjects}
            pinnedProjectOrder={pinnedProjectIds}
            onViewAll={() => onBrowseModeChange("projects")}
            onNewProject={canCreateProject() ? onNewProject : undefined}
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
        );
      }
      default:
        return renderItemTile(tile);
    }
  }

  const SOURCE_LABEL: Record<string, string> = { database: "Database", csv: "CSV", pdf: "PDF" };

  /** Real data and actions for Galaxy, Chat, Constellation, Data Source and Dashboard tiles. */
  function entityTileProps(tile: HomeTile): Omit<EntityHomeTileProps, "density"> | null {
    const target = tile.target;
    if (!target) return null;
    switch (tile.type) {
      case "galaxy": {
        const project = projectById.get(target.entityId);
        if (!project) return null;
        const counts = `${project.constellationCount} ${project.constellationCount === 1 ? "Constellation" : "Constellations"}`;
        return {
          icon: (size) => <LuxiaGalaxyIcon size={size} color="currentColor" />,
          typeLabel: "Galaxy",
          title: `${project.name} Galaxy`,
          summary: counts,
          context: project.name,
          description: project.description,
          chips: [counts, `${project.sourceCount ?? 0} ${(project.sourceCount ?? 0) === 1 ? "Source" : "Sources"}`],
          primary: { label: "Open Galaxy", ariaLabel: `Open Galaxy for ${project.name}`, onClick: () => onOpenGalaxy(project.id) },
          secondary: { label: "Open Project", ariaLabel: `Open Project ${project.name}`, onClick: () => onOpenProject(project.id) },
        };
      }
      case "chat": {
        const item = chatItems.find((entry) => entry.chatId === target.entityId);
        if (!item) return null;
        const projectName = projectById.get(item.projectId)?.name;
        const source = item.constellationSource ? SOURCE_LABEL[item.constellationSource] : undefined;
        return {
          icon: (size) => <LuxiaChatIcon size={size} color="currentColor" />,
          typeLabel: "Chat",
          title: item.title,
          summary: [item.constellationName, projectName].filter(Boolean).join(" · "),
          context: [projectName, item.constellationName].filter(Boolean).join(" · "),
          chips: source ? [source] : undefined,
          meta: item.updatedAt ? `Updated ${item.updatedAt}` : undefined,
          primary: { label: "Continue Chat", ariaLabel: `Continue Chat ${item.title}`, onClick: () => onContinueWork(item) },
          secondary: projectName
            ? { label: "Open Project", ariaLabel: `Open Project ${projectName}`, onClick: () => onOpenProject(item.projectId) }
            : undefined,
        };
      }
      case "constellation": {
        const constellation = constellations.find((entry) => entry.id === target.entityId);
        if (!constellation || !onOpenConstellation) return null;
        const projectName = projectById.get(constellation.projectId)?.name;
        const recentChats = chatItems.filter((item) => item.constellationId === constellation.id);
        const latestChat = recentChats[0];
        return {
          icon: (size) => <LuxiaConstellationIcon size={size} color="currentColor" />,
          typeLabel: "Constellation",
          title: constellation.label,
          summary: [projectName, SOURCE_LABEL[constellation.type]].filter(Boolean).join(" · "),
          context: projectName,
          chips: [SOURCE_LABEL[constellation.type] ?? constellation.type],
          meta: recentChats.length > 0
            ? `${recentChats.length} recent ${recentChats.length === 1 ? "Chat" : "Chats"}`
            : undefined,
          primary: {
            label: "Open Constellation",
            ariaLabel: `Open Constellation ${constellation.label}`,
            onClick: () => onOpenConstellation(constellation.projectId, constellation.id),
          },
          secondary: latestChat
            ? { label: "Continue Chat", ariaLabel: `Continue Chat ${latestChat.title}`, onClick: () => onContinueWork(latestChat) }
            : undefined,
        };
      }
      case "data-source": {
        const source = homeTileDataSources.find((entry) => entry.id === target.entityId);
        if (!source || !onOpenDataSource) return null;
        const ownership = source.ownership === "private" ? "Private" : source.ownership === "organizational" ? "Organizational" : undefined;
        const connector = formatDataSourceConnectorLabel(source.connector) ?? undefined;
        const status = source.status ? source.status.charAt(0).toUpperCase() + source.status.slice(1) : undefined;
        return {
          icon: (size) => <LuxiaDatasourceIcon size={size} color="currentColor" />,
          typeLabel: "Data Source",
          status: source.status && source.status !== "active" ? status : undefined,
          title: source.name,
          summary: [source.typeLabel, ownership].filter(Boolean).join(" · "),
          context: connector && connector !== source.typeLabel ? `${source.typeLabel} · ${connector}` : source.typeLabel,
          chips: [ownership, status].filter((value): value is string => Boolean(value)),
          primary: { label: "Open Data Source", ariaLabel: `Open Data Source ${source.name}`, onClick: () => onOpenDataSource(source.id) },
        };
      }
      case "dashboard": {
        const project = projectById.get(target.entityId);
        if (!project || !onOpenDashboard) return null;
        const outputs = getProjectDashboardOutputs(project.id);
        const count = `${outputs.length} saved ${outputs.length === 1 ? "output" : "outputs"}`;
        const density = densityOf(tile);
        const latest = outputs.slice(0, density === "large" ? 2 : 3);
        return {
          icon: (size) => <LuxiaDashboardIcon size={size} color="currentColor" />,
          typeLabel: "Dashboard",
          title: `${project.name} Dashboard`,
          summary: count,
          context: count,
          related: outputs.length === 0
            ? undefined
            : density === "large"
              ? (
                <ul className="grid grid-cols-2 gap-2" aria-label="Latest saved outputs">
                  {latest.map((output) => (
                    <li key={output.id} className="min-w-0">
                      <DashboardOutputPreviewGraphic variant={output.outputType} />
                      <p className="mt-1 truncate luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} title={output.name}>
                        {output.name}
                      </p>
                    </li>
                  ))}
                </ul>
              )
              : (
                <ul className="min-w-0 space-y-1" aria-label="Latest saved outputs">
                  {latest.map((output) => (
                    <li key={output.id} className="flex min-w-0 items-center justify-between gap-2 luxia-type-caption">
                      <span className="min-w-0 truncate" style={{ color: "var(--luxia-text-secondary)" }} title={output.name}>
                        {output.name}
                      </span>
                      <span className="shrink-0" style={{ color: "var(--luxia-text-muted)" }}>
                        {outputTypeLabel(output.outputType)}
                      </span>
                    </li>
                  ))}
                </ul>
              ),
          primary: { label: "Open Dashboard", ariaLabel: `Open Dashboard for ${project.name}`, onClick: () => onOpenDashboard(project.id) },
          secondary: { label: "Open Project", ariaLabel: `Open Project ${project.name}`, onClick: () => onOpenProject(project.id) },
        };
      }
      default:
        return null;
    }
  }

  function renderItemTile(tile: HomeTile) {
    const definition = getHomeTileDefinition(tile.type);
    const density = densityOf(tile);
    if (tile.type === "project" && tile.target) {
      const project = projectById.get(tile.target.entityId);
      if (!project) return <HomeUnavailableTile typeLabel={definition.label} />;
      return (
        <ProjectHomeTile
          project={project}
          density={density}
          onOpenProject={onOpenProject}
          onNavigate={handleNavigate}
          onTogglePin={onToggleProjectPin}
        />
      );
    }
    if (tile.type === "tool" && tile.target) {
      const tool = LUXIA_TOOLS.find((entry) => entry.id === tile.target?.entityId);
      if (!tool || !onOpenTool) return <HomeUnavailableTile typeLabel={definition.label} />;
      return (
        <ToolHomeTile
          tool={tool}
          density={density === "small" ? "small" : "medium"}
          onOpen={() => onOpenTool(tool.id)}
        />
      );
    }
    const props = entityTileProps(tile);
    if (!props) return <HomeUnavailableTile typeLabel={definition.label} />;
    return <EntityHomeTile density={density} {...props} />;
  }

  function getTileLabel(tile: HomeTile): string {
    const definition = getHomeTileDefinition(tile.type);
    if (!tile.target) return definition.label;
    const title = tile.type === "project"
      ? projectById.get(tile.target.entityId)?.name
      : tile.type === "tool"
        ? LUXIA_TOOLS.find((entry) => entry.id === tile.target?.entityId)?.name
        : entityTileProps(tile)?.title;
    return title ? `${definition.label} · ${title}` : definition.label;
  }

  const targetOptions: Partial<Record<HomeTileType, HomeTileTargetOption[]>> = {
    project: activeProjects.map((project) => ({
      target: { scope: "project", entityId: project.id },
      label: project.name,
      detail: `${project.constellationCount} Constellations · ${project.memberCount} members`,
    })),
    galaxy: activeProjects.map((project) => ({
      target: { scope: "galaxy", entityId: project.id, projectId: project.id },
      label: `${project.name} Galaxy`,
      detail: project.name,
    })),
    dashboard: onOpenDashboard
      ? activeProjects.map((project) => ({
        target: { scope: "dashboard", entityId: project.id, projectId: project.id },
        label: `${project.name} Dashboard`,
        detail: project.name,
      }))
      : [],
    chat: chatItems.map((item) => ({
      target: { scope: "chat", entityId: item.chatId, projectId: item.projectId },
      label: item.title,
      detail: [projectById.get(item.projectId)?.name, item.constellationName].filter(Boolean).join(" · "),
    })),
    constellation: onOpenConstellation
      ? constellations.map((constellation) => ({
        target: { scope: "constellation", entityId: constellation.id, projectId: constellation.projectId },
        label: constellation.label,
        detail: projectById.get(constellation.projectId)?.name,
      }))
      : [],
    "data-source": onOpenDataSource
      ? homeTileDataSources.map((source) => ({
        target: { scope: "data-source", entityId: source.id },
        label: source.name,
        detail: source.typeLabel,
      }))
      : [],
    tool: onOpenTool
      ? LUXIA_TOOLS.map((tool) => ({
        target: { scope: "tool", entityId: tool.id },
        label: tool.name,
        detail: tool.description,
      }))
      : [],
  };

  const { layout: homeLayout, editing } = homeBuilder;
  const layoutIsEmpty = homeLayout.tiles.length === 0;

  return (
    <>
      <HomeHeader onNewChat={onNewChat} onNewProject={onNewProject} />

      <GlobalSearch
        projects={activeProjects}
        recentWork={workWithPin}
        constellations={constellations}
        onSelect={handleSearchSelect}
      />

      <HomeBuilderToolbar
        editing={editing}
        onCustomize={homeBuilder.startEditing}
        onAddTile={() => setLibraryOpen(true)}
        onResetToDefault={homeBuilder.resetToDefault}
        onDone={homeBuilder.stopEditing}
        canReset={!homeBuilder.isDefaultLayout}
      />

      {layoutIsEmpty ? (
        <div
          className="flex flex-col items-center gap-3 rounded-[var(--luxia-radius-16)] border border-dashed px-6 py-10 text-center"
          style={{ borderColor: "var(--luxia-opacity-brand-primary-24)", background: "var(--luxia-surface)" }}
        >
          <p className="luxia-type-title-card" style={{ color: HS.sectionHeading }}>
            Your Home has no tiles
          </p>
          <p className="max-w-md luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            Add Home Tiles for the Projects, Chats and tools you use most, or reset to the default Home.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="compact"
              onClick={() => {
                homeBuilder.startEditing();
                setLibraryOpen(true);
              }}
            >
              Add Tile
            </Button>
            <Button type="button" variant="secondary" size="compact" onClick={homeBuilder.resetToDefault}>
              Reset to default
            </Button>
          </div>
        </div>
      ) : (
        <HomeTileGrid
          layout={homeLayout}
          renderTile={renderHomeTile}
          editing={editing}
          getTileLabel={getTileLabel}
          onRemoveTile={(tile) => homeBuilder.removeTile(tile, getTileLabel(tile))}
          onLayoutChange={homeBuilder.updateLayout}
          getTileSection={getHomeTileSection}
        />
      )}

      <HomeTileLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        layout={homeLayout}
        targetOptions={targetOptions}
        onAdd={(type, target) => {
          homeBuilder.addTile(type, target);
        }}
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
        /* relative: contain abspos descendants (e.g. .sr-only) inside the
           page scrollport so they cannot inflate document height. */
        "luxia-home-shell relative min-h-0 min-w-0 flex-1",
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
