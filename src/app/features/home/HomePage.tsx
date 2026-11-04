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
  ChatHomeTile,
  ChatsCollectionHomeTile,
  ConstellationHomeTile,
  ConstellationsCollectionHomeTile,
  DashboardHomeTile,
  DashboardsCollectionHomeTile,
  DataSourceHomeTile,
  DataSourcesCollectionHomeTile,
  formatHomeDataSourceContent,
  knowledgeKindOf,
  listHomeDataSourceContents,
  GalaxiesCollectionHomeTile,
  GalaxyHomeTile,
  CollectionHomeTile,
  EntityHomeTile,
  FocusHomeTile,
  HOME_PROJECTS_VIEW_COPY,
  HOME_PROJECTS_VIEWS,
  HomeTileSectionHeader,
  HomeBuilderToolbar,
  HomeTileGrid,
  HomeTileConfigureDialog,
  HomeTileLibrary,
  homeTileSurfaceLabel,
  HomeUnavailableTile,
  ProjectHomeTile,
  ProjectListHomeTile,
  ToolHomeTile,
  getHomeProjectsView,
  getHomeTileDefinition,
  getHomeTileHeading,
  getHomeTileListDisplay,
  getHomeTileSection,
  getHomeTileSizeId,
  getHomeTileSurfaceStyle,
  selectHomeProjects,
  selectRecentChats,
  sortByName,
  uniqueById,
  formatHomeChatActivity,
  useHomeLayout,
  type EntityHomeTileProps,
  type HomeChatTileItem,
  type HomeConstellationTileItem,
  type HomeDashboardTileItem,
  type HomeDataSourceTileItem,
  type HomeGalaxyTileItem,
  type HomeCollectionAvailability,
  type HomeCollectionDensity,
  type HomeProjectsView,
  type HomeTile,
  type HomeTileDensity,
  type HomeTileTargetOption,
  type HomeTileSurfaceStyle,
  type HomeTileType,
} from "./homeBuilder";
import { HS } from "./homeSurfaces";
import { parseHomeRecentPreviewCount } from "./homeRecentPreviewCount";
import { canCreateProject } from "@/app/features/permissions";
import { formatDataSourceConnectorLabel } from "@/app/features/permissions/data";
import { ProjectsBrowser, ProjectsPreview } from "@/app/features/project";
import { filterActiveProjects, rankProjectsByRecency } from "@/app/features/project/data";
import { getProjectDashboardOutputs } from "@/app/features/project-overview/data";
import { useProjectDashboards } from "@/app/features/project-overview/projectDashboardStore";
import { formatDashboardUpdated, resolveDashboardOutputs } from "@/app/features/project-overview/ProjectDashboardsPage";
import type { ProjectDashboard } from "@/app/features/project-overview/types";
import {
  resolveHomeDashboardTarget,
  withResolvedDashboardTarget,
  type HomeDashboardResolution,
} from "./homeBuilder/dashboardTargets";
import { LUXIA_TOOLS } from "@/app/features/tools/data";
import {
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaDatasourceIcon,
  LuxiaGalaxyIcon,
  LuxiaProjectsIcon,
} from "@/assets/icons";
import type {
  HomeHeroContent,
  HomePageProps,
  HomeProjectCard,
  HomeRecentWorkItem,
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
  /** Every named Dashboard (re-renders when one is created, renamed or deleted). */
  const allDashboards = useProjectDashboards();
  const [libraryOpen, setLibraryOpen] = useState(false);
  /** Tile whose item is being changed (Configure Tile), or null. */
  const [configureTile, setConfigureTile] = useState<HomeTile | null>(null);

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
        description: item.constellationDescription,
        sourceCount: undefined as number | undefined,
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

  // Home Tiles: every tile resolves on each render from data the user can already access

  const projectById = new Map(activeProjects.map((project) => [project.id, project]));
  const chatItems = workWithPin.filter((item) => item.kind === "chat");

  /**
   * Full-width Pinned / Recent projects: Soft and Featured frame the Project cards
   * as a section panel in that style; Default keeps the original open section.
   */
  function fullWidthSectionFrame(surface: HomeTileSurfaceStyle) {
    if (surface === "default") return undefined;
    return (collection: ReactNode) => (
      <div className="luxia-home-tile-panel" data-home-tile-surface={surface} data-home-tile-section-panel="">
        {collection}
      </div>
    );
  }

  function densityOf(tile: HomeTile): HomeTileDensity {
    const size = getHomeTileSizeId(tile);
    return size === "large" ? "large" : size === "medium" ? "medium" : "small";
  }

  function collectionDensityOf(tile: HomeTile): HomeCollectionDensity {
    return getHomeTileSizeId(tile) === "wide" ? "wide" : densityOf(tile);
  }

  function plural(count: number, singular: string, pluralForm = `${singular}s`) {
    return `${count} ${count === 1 ? singular : pluralForm}`;
  }

  const projectsIcon = (size: number) => <LuxiaProjectsIcon size={size} color="currentColor" />;

  function projectsEmptyState(view: HomeProjectsView) {
    if (view === "pinned") {
      return {
        title: "No pinned Projects yet",
        body: "Pin a Project from its card or the Projects library and it appears here.",
        action: { label: "Browse Projects", onClick: () => onBrowseModeChange("projects") },
      };
    }
    return {
      title: "No Projects yet",
      body: "Projects you're a member of appear here.",
      action: canCreateProject() ? { label: "New Project", onClick: onNewProject } : undefined,
    };
  }

  /**
   * Projects collection. Full width keeps the existing Home section
   * (ProjectsPreview), with this tile's own Show and Grid / List choices once
   * the user sets them here (until then, the shared saved choice applies, as
   * before). Smaller sizes use the compact Project list.
   */
  function renderProjectsCollection(tile: HomeTile) {
    const view = getHomeProjectsView(tile);
    const copy = HOME_PROJECTS_VIEW_COPY[view];
    const projects = selectHomeProjects(activeProjects, pinnedProjectIds, view);
    if (getHomeTileSizeId(tile) === "wide-tall") {
      if (projects.length === 0) {
        // The section would render nothing; keep the tile visible, with its heading and what to do next.
        return (
          <section aria-label={copy.title}>
            <HomeTileSectionHeader section={getHomeTileHeading(tile)} />
            <div className="flex min-h-[136px] flex-col [&>*]:flex-1">
              <CollectionHomeTile
                density="wide"
                label={copy.title}
                icon={projectsIcon}
                items={[]}
                summary=""
                empty={projectsEmptyState(view)}
              />
            </div>
          </section>
        );
      }
      return (
        <ProjectsPreview
          sections={view === "pinned" ? "pinned" : "recent"}
          recentSection={view === "pinned"
            ? undefined
            : {
              title: copy.title,
              description: copy.subtitle,
              order: view === "name" ? "name" : "updated",
              icon: view === "name" ? <LuxiaProjectsIcon size={22} color="currentColor" aria-hidden /> : undefined,
            }}
          recentPreviewCount={parseHomeRecentPreviewCount(tile.config.limit) ?? undefined}
          onRecentPreviewCountChange={(count) => homeBuilder.updateTileConfig(tile, { limit: String(count) })}
          recentViewMode={getHomeTileListDisplay(tile) ?? undefined}
          onRecentViewModeChange={(mode) => homeBuilder.updateTileConfig(tile, { display: mode })}
          headingIdSuffix={`-${tile.id}`}
          pinnedSparseHint
          projects={activeProjects}
          pinnedProjectOrder={pinnedProjectIds}
          onViewAll={() => onBrowseModeChange("projects")}
          // No in-collection New Project: Home's header always offers it, and the Projects page keeps its own.
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
          collectionFrame={fullWidthSectionFrame(getHomeTileSurfaceStyle(tile))}
        />
      );
    }
    const density = densityOf(tile);
    if (projects.length === 0) {
      return (
        <CollectionHomeTile
          density={density}
          label={copy.title}
          icon={projectsIcon}
          items={[]}
          summary=""
          empty={projectsEmptyState(view)}
        />
      );
    }
    return (
      <ProjectListHomeTile
        view={view}
        projects={projects}
        total={projects.length}
        density={density}
        onOpenProject={onOpenProject}
        onViewAll={() => onBrowseModeChange("projects")}
      />
    );
  }

  /** A Chat's real record as Chat tiles show it (no message preview: Home's Chat records carry none). */
  function chatTileItem(item: HomeRecentWorkItem): HomeChatTileItem {
    return {
      id: item.id,
      title: item.title,
      projectName: projectById.get(item.projectId)?.name,
      constellationName: item.constellationName,
      constellationType: item.constellationSource ? SOURCE_LABEL[item.constellationSource] : undefined,
      description: item.constellationDescription?.trim() || undefined,
      activity: formatHomeChatActivity(item.lastOpenedAt, item.updatedAt),
      pinned: Boolean(item.isPinned),
      openLabel: `Continue Chat ${item.title}`,
      onOpen: () => onContinueWork(item),
    };
  }

  /**
   * A Galaxy as Galaxy tiles show it: its Project's real data, the Constellations
   * the user can access, and — only when their recent work has it — when they last
   * opened this Galaxy. Project activity is never presented as Galaxy activity.
   */
  function galaxyTileItem(project: HomeProjectCard): HomeGalaxyTileItem {
    const session = workWithPin.find((item) => item.kind === "galaxySession" && item.projectId === project.id && item.chatId === project.galaxyId);
    return {
      id: project.id,
      title: `${project.name} Galaxy`,
      projectName: project.name,
      constellationCount: project.constellationCount,
      sourceCount: project.sourceCount ?? 0,
      projectUpdatedAt: project.updatedAt,
      constellations: [...new Map(
        constellations
          .filter((entry) => entry.projectId === project.id)
          .map((entry) => [entry.id, { id: entry.id, label: entry.label, typeLabel: SOURCE_LABEL[entry.type] }]),
      ).values()],
      lastOpened: session?.lastOpenedAt ? formatHomeChatActivity(session.lastOpenedAt, undefined) : undefined,
      openLabel: `Open Galaxy for ${project.name}`,
      onOpen: () => onOpenGalaxy(project.id),
    };
  }

  /** A Constellation as Constellation tiles show it (only real fields). */
  function constellationTileItem(constellation: (typeof constellations)[number]): HomeConstellationTileItem {
    const open = onOpenConstellation;
    return {
      id: constellation.id,
      title: constellation.label,
      kind: knowledgeKindOf(constellation.type),
      typeLabel: SOURCE_LABEL[constellation.type] ?? constellation.type,
      projectId: constellation.projectId,
      projectName: projectById.get(constellation.projectId)?.name,
      openLabel: `Open Constellation ${constellation.label}`,
      onOpen: () => open?.(constellation.projectId, constellation.id),
    };
  }

  /** A Data Source as Data Source tiles show it: type, connector, access, status and one content fact. */
  function dataSourceTileItem(source: (typeof homeTileDataSources)[number]): HomeDataSourceTileItem {
    const access = source.ownership === "private" ? "Private" : source.ownership === "organizational" ? "Organizational" : undefined;
    const status = source.status && source.status !== "active"
      ? source.status.charAt(0).toUpperCase() + source.status.slice(1)
      : undefined;
    // The connector only when it adds something to the type (PostgreSQL, Snowflake — not "CSV" for a CSV).
    const connector = formatDataSourceConnectorLabel(source.connector) ?? undefined;
    const connectorLabel = connector && connector.toLowerCase() !== source.typeLabel.toLowerCase() && source.connector !== "file"
      ? connector
      : undefined;
    return {
      id: source.id,
      name: source.name,
      kind: knowledgeKindOf(source.connector === "googlesheet" ? "googlesheet" : source.typeLabel),
      typeLabel: source.typeLabel,
      connectorLabel,
      access,
      status,
      contentDetail: formatHomeDataSourceContent(source.contentSummary),
      contents: listHomeDataSourceContents(source.contentSummary),
      openLabel: `Open Data Source ${source.name}`,
      onOpen: () => onOpenDataSource?.(source.id),
    };
  }

  /** A named Dashboard as Dashboard tiles show it: its outputs in Dashboard order (names and types only). */
  function dashboardTileItem(dashboard: ProjectDashboard, project: HomeProjectCard): HomeDashboardTileItem {
    return {
      id: dashboard.id,
      title: dashboard.name,
      projectId: project.id,
      projectName: project.name,
      outputs: resolveDashboardOutputs(dashboard, getProjectDashboardOutputs(project.id)).map((output) => ({
        id: output.id,
        name: output.name,
        type: output.outputType,
        updatedAt: output.updatedAt,
        source: output.conversationSource,
      })),
      updatedAt: formatDashboardUpdated(dashboard.updatedAtTimestamp),
      openLabel: `Open Dashboard ${dashboard.name} in ${project.name}`,
      onOpen: () => onOpenDashboard?.(project.id, dashboard.id),
    };
  }

  /** What a Specific Dashboard tile's saved target points at now (see dashboardTargets.ts). */
  function resolveDashboardTile(tile: HomeTile): HomeDashboardResolution<ProjectDashboard> {
    return resolveHomeDashboardTarget(tile.target, accessibleDashboards, accessibleProjectIds, allDashboardIds);
  }

  /** Chats, Galaxies, Constellations, Data Sources and Dashboards collections. */
  function renderCollectionTile(tile: HomeTile) {
    const density = collectionDensityOf(tile);
    switch (tile.type) {
      case "chats-collection": {
        const chats = recentChats.map(chatTileItem);
        return (
          <ChatsCollectionHomeTile
            density={density}
            label="Recent chats"
            chats={chats}
            summary={`${plural(chats.length, "Chat")} · most recently opened first`}
            count={plural(chats.length, "Chat")}
            empty={{
              title: "No recent Chats",
              body: "Chats you open appear here, most recent first.",
              action: { label: "New Chat", onClick: onNewChat },
            }}
            viewAll={{ label: "View all your work", ariaLabel: "View all your recent work", onClick: () => onBrowseModeChange("your-work") }}
            onNewChat={onNewChat}
          />
        );
      }
      case "galaxies-collection": {
        const galaxies = galaxyProjects.map(galaxyTileItem);
        const count = plural(galaxies.length, "Galaxy", "Galaxies");
        return (
          <GalaxiesCollectionHomeTile
            density={density}
            label="Galaxies"
            galaxies={galaxies}
            summary={`${count} · latest Project activity first`}
            count={count}
            empty={{ title: "No Galaxies yet", body: "Each Project you're a member of has a Galaxy." }}
          />
        );
      }
      case "constellations-collection": {
        const items = onOpenConstellation ? usableConstellations.map(constellationTileItem) : [];
        return (
          <ConstellationsCollectionHomeTile
            density={density}
            label="Constellations"
            items={items}
            empty={{ title: "No Constellations to use yet", body: "Constellations you can use appear here." }}
          />
        );
      }
      case "data-sources-collection": {
        const items = onOpenDataSource ? dataSources.map(dataSourceTileItem) : [];
        return (
          <DataSourcesCollectionHomeTile
            density={density}
            label="Data sources"
            items={items}
            empty={{ title: "No Data Sources yet", body: "Data Sources you have access to appear here." }}
          />
        );
      }
      case "dashboards-collection": {
        const items = onOpenDashboard
          ? accessibleDashboards.map((dashboard) => dashboardTileItem(dashboard, projectById.get(dashboard.projectId)!))
          : [];
        return (
          <DashboardsCollectionHomeTile
            density={density}
            label="Dashboards"
            items={items}
            empty={{ title: "No Dashboards yet", body: "Dashboards created in your Projects appear here." }}
          />
        );
      }
      default:
        return null;
    }
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
            surface={getHomeTileSurfaceStyle(tile)}
          />
        );
      case "projects-collection":
        return renderProjectsCollection(tile);
      case "chats-collection":
      case "galaxies-collection":
      case "constellations-collection":
      case "data-sources-collection":
      case "dashboards-collection":
        return renderCollectionTile(tile);
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
          description: item.constellationDescription?.trim() || undefined,
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
          description: recentChats.find((item) => item.constellationDescription?.trim())?.constellationDescription?.trim(),
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
          facts: [
            { label: "Type", value: source.typeLabel },
            ...(connector && connector !== source.typeLabel ? [{ label: "Connector", value: connector }] : []),
            ...(ownership ? [{ label: "Access", value: ownership }] : []),
            ...(status ? [{ label: "Status", value: status }] : []),
          ],
          primary: { label: "Open Data Source", ariaLabel: `Open Data Source ${source.name}`, onClick: () => onOpenDataSource(source.id) },
        };
      }
      case "dashboard": {
        // Specific Dashboard tiles render DashboardHomeTile; this only names the tile (labels, Undo).
        const resolution = resolveDashboardTile(tile);
        if (resolution.status !== "ok" || !onOpenDashboard) return null;
        const project = projectById.get(resolution.dashboard.projectId);
        if (!project) return null;
        return {
          icon: (size) => <LuxiaDashboardIcon size={size} color="currentColor" />,
          typeLabel: "Dashboard",
          title: `${resolution.dashboard.name} · ${project.name}`,
          primary: {
            label: "Open Dashboard",
            ariaLabel: `Open Dashboard ${resolution.dashboard.name} in ${project.name}`,
            onClick: () => onOpenDashboard(project.id, resolution.dashboard.id),
          },
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
          // Only Constellations the user already reached through their work; one row each.
          constellations={[...new Map(
            constellations
              .filter((entry) => entry.projectId === project.id)
              .map((entry) => [entry.id, { id: entry.id, label: entry.label, typeLabel: SOURCE_LABEL[entry.type] }]),
          ).values()]}
          onOpenConstellation={onOpenConstellation}
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
    if (tile.type === "galaxy" && tile.target) {
      const project = projectById.get(tile.target.entityId);
      if (!project) return <HomeUnavailableTile typeLabel={definition.label} />;
      return (
        <GalaxyHomeTile
          density={density === "small" ? "small" : "medium"}
          galaxy={galaxyTileItem(project)}
          openProject={{ ariaLabel: `Open Project ${project.name}`, onClick: () => onOpenProject(project.id) }}
        />
      );
    }
    if (tile.type === "chat" && tile.target) {
      const item = chatItems.find((entry) => entry.chatId === tile.target?.entityId);
      if (!item) return <HomeUnavailableTile typeLabel={definition.label} />;
      const projectName = projectById.get(item.projectId)?.name;
      return (
        <ChatHomeTile
          density={density === "small" ? "small" : "medium"}
          chat={chatTileItem(item)}
          openProject={projectName
            ? { ariaLabel: `Open Project ${projectName}`, onClick: () => onOpenProject(item.projectId) }
            : undefined}
        />
      );
    }
    if (tile.type === "constellation" && tile.target) {
      const constellation = constellations.find((entry) => entry.id === tile.target?.entityId);
      if (!constellation || !onOpenConstellation || !projectById.has(constellation.projectId)) {
        return <HomeUnavailableTile typeLabel={definition.label} />;
      }
      const recent = chatItems.filter((item) => item.constellationId === constellation.id);
      const latestChat = recent[0];
      return (
        <ConstellationHomeTile
          density={density === "small" ? "small" : "medium"}
          item={constellationTileItem(constellation)}
          description={constellation.description?.trim()
            || recent.find((item) => item.constellationDescription?.trim())?.constellationDescription?.trim()}
          recentChatCount={recent.length}
          sourceCount={constellation.sourceCount}
          continueChat={latestChat
            ? { label: "Continue Chat", ariaLabel: `Continue Chat ${latestChat.title}`, onClick: () => onContinueWork(latestChat) }
            : undefined}
          recentChats={recent.map((chat) => ({
            id: chat.id,
            title: chat.title,
            when: formatHomeChatActivity(chat.lastOpenedAt, chat.updatedAt)?.short,
            openLabel: `Continue Chat ${chat.title}`,
            onOpen: () => onContinueWork(chat),
          }))}
        />
      );
    }
    if (tile.type === "data-source" && tile.target) {
      const source = homeTileDataSources.find((entry) => entry.id === tile.target?.entityId);
      if (!source || !onOpenDataSource) return <HomeUnavailableTile typeLabel={definition.label} />;
      return <DataSourceHomeTile density={density === "small" ? "small" : "medium"} item={dataSourceTileItem(source)} />;
    }
    if (tile.type === "dashboard" && tile.target) {
      const resolution = resolveDashboardTile(tile);
      const project = resolution.status === "ok" ? projectById.get(resolution.dashboard.projectId) : undefined;
      if (resolution.status !== "ok" || !project || !onOpenDashboard) {
        const legacyProject = resolution.status === "unavailable" && resolution.reason === "legacy-unmapped" && resolution.projectId
          ? projectById.get(resolution.projectId)
          : undefined;
        return (
          <HomeUnavailableTile
            typeLabel={definition.label}
            message={legacyProject
              ? `Was ${legacyProject.name}'s Dashboard. Choose a named one.`
              : "This Dashboard is no longer available."}
            actions={onOpenDashboard ? [
              { label: "Choose Dashboard", ariaLabel: "Choose a Dashboard for this tile", onClick: () => setConfigureTile(tile) },
              { label: "Remove", ariaLabel: "Remove this tile from Home", onClick: () => homeBuilder.removeTile(tile, definition.label) },
            ] : undefined}
          />
        );
      }
      return (
        <DashboardHomeTile
          density={density}
          item={dashboardTileItem(resolution.dashboard, project)}
          openProject={{ ariaLabel: `Open Project ${project.name}`, onClick: () => onOpenProject(project.id) }}
        />
      );
    }
    const props = entityTileProps(tile);
    if (!props) return <HomeUnavailableTile typeLabel={definition.label} />;
    return <EntityHomeTile density={density} {...props} />;
  }

  function getTileLabel(tile: HomeTile): string {
    const definition = getHomeTileDefinition(tile.type);
    if (tile.type === "projects-collection") return HOME_PROJECTS_VIEW_COPY[getHomeProjectsView(tile)].title;
    if (definition.model === "collection") return getHomeTileHeading(tile).title;
    if (!tile.target) return definition.label;
    const title = tile.type === "project"
      ? projectById.get(tile.target.entityId)?.name
      : tile.type === "tool"
        ? LUXIA_TOOLS.find((entry) => entry.id === tile.target?.entityId)?.name
        : entityTileProps(tile)?.title;
    return title ? `${definition.label} · ${title}` : definition.label;
  }

  // Collection data: every list comes from data already filtered to what this user may access

  const recentChats = selectRecentChats(workWithPin);
  const galaxyProjects = rankProjectsByRecency(activeProjects);
  // Constellations of active Projects only; one row per Constellation, grouped by Project name.
  const usableConstellations = sortByName(
    uniqueById(constellations).filter((constellation) => projectById.has(constellation.projectId)),
    (constellation) => `${projectById.get(constellation.projectId)?.name ?? ""} ${constellation.label}`,
  );
  const dataSources = sortByName(homeTileDataSources, (source) => source.name);
  // Named Dashboards in Projects this user can access, most recently updated first.
  const accessibleProjectIds = new Set(activeProjects.map((project) => project.id));
  const allDashboardIds = new Set(allDashboards.map((dashboard) => dashboard.id));
  const accessibleDashboards = onOpenDashboard
    ? allDashboards
      .filter((dashboard) => accessibleProjectIds.has(dashboard.projectId))
      .slice()
      .sort((a, b) => b.updatedAtTimestamp - a.updatedAtTimestamp || a.name.localeCompare(b.name))
    : [];

  const collectionAvailability: Partial<Record<HomeTileType, HomeCollectionAvailability>> = {
    "projects-collection": {
      available: true,
      count: activeProjects.length,
      viewCounts: Object.fromEntries(
        HOME_PROJECTS_VIEWS.map((view) => [view, selectHomeProjects(activeProjects, pinnedProjectIds, view).length]),
      ),
    },
    "chats-collection": { available: true, count: recentChats.length },
    "galaxies-collection": { available: true, count: galaxyProjects.length },
    "constellations-collection": { available: Boolean(onOpenConstellation), count: usableConstellations.length },
    "data-sources-collection": { available: Boolean(onOpenDataSource), count: dataSources.length },
    "dashboards-collection": { available: Boolean(onOpenDashboard), count: accessibleDashboards.length },
  };

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
    // One option per named Dashboard; the Project in the detail tells same-named Dashboards apart (and is searchable).
    dashboard: sortByName(
      accessibleDashboards,
      (dashboard) => `${projectById.get(dashboard.projectId)?.name ?? ""} ${dashboard.name}`,
    ).map((dashboard) => {
      const projectName = projectById.get(dashboard.projectId)?.name ?? "";
      const outputCount = resolveDashboardOutputs(dashboard, getProjectDashboardOutputs(dashboard.projectId)).length;
      return {
        target: { scope: "dashboard" as const, entityId: dashboard.id, projectId: dashboard.projectId },
        label: dashboard.name,
        detail: `${projectName} · ${outputCount === 0 ? "No outputs yet" : `${outputCount} ${outputCount === 1 ? "output" : "outputs"}`}`,
      };
    }),
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
  /**
   * Old Project-Dashboard tiles shown with the Dashboard they map to, so Add Tile
   * and Configure treat that Dashboard as already on Home. Display only; the
   * stored layout keeps its saved target until the user changes it.
   */
  const withResolvedTargets = (tile: HomeTile) =>
    tile.type === "dashboard" ? withResolvedDashboardTarget(tile, resolveDashboardTile(tile)) : tile;
  const pickerLayout = homeLayout.tiles.some((tile) => tile.type === "dashboard")
    ? { ...homeLayout, tiles: homeLayout.tiles.map(withResolvedTargets) }
    : homeLayout;
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
          onConfigureTile={(tile) => setConfigureTile(withResolvedTargets(tile))}
        />
      )}

      <HomeTileConfigureDialog
        key={configureTile?.id ?? "none"}
        tile={configureTile}
        tileLabel={configureTile ? getTileLabel(configureTile) : ""}
        layout={pickerLayout}
        targetOptions={targetOptions}
        onClose={() => setConfigureTile(null)}
        onSave={(tile, changes) => {
          homeBuilder.configureTile(tile, changes, {
            before: getTileLabel(tile),
            after: getTileLabel(changes.target ? { ...tile, target: changes.target } : tile),
            surface: changes.surface ? homeTileSurfaceLabel(changes.surface) : undefined,
            setting: changes.config ? HOME_PROJECTS_VIEW_COPY[changes.config.view].title.toLowerCase() : undefined,
          });
        }}
      />

      <HomeTileLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        layout={pickerLayout}
        targetOptions={targetOptions}
        collections={collectionAvailability}
        onAdd={(type, target, config) => {
          homeBuilder.addTile(type, target, config);
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
