import { useState, type ReactNode } from "react";
import { History, Pin, Plus } from "lucide-react";
import { LuxiaArrowRightIcon, LuxiaProjectsIcon } from "@/assets/icons";
import { Button } from "@/app/components/ui/button";
import {
  LuxiaEntityOptionsMenu,
  type LuxiaEntityOptionsItem,
} from "@/app/components/LuxiaEntityOptionsMenu";
import { EntityIdentityRow } from "@/app/features/home/entityIdentity";
import { HS, HI } from "@/app/features/home/homeSurfaces";
import { useHomeTileSurface } from "@/app/features/home/homeBuilder/HomeTileSurface";
import { HomeRecentPreviewCountControl } from "@/app/features/home/HomeRecentPreviewCountControl";
import {
  readHomeRecentPreviewCount,
  resolveHomeRecentPreviewLimit,
  writeHomeRecentPreviewCount,
  type HomeRecentPreviewCount,
} from "@/app/features/home/homeRecentPreviewCount";
import { PinButton } from "@/app/features/home/PinButton";
import { SectionHeader } from "@/app/features/home/SectionHeader";
import { ViewAllAction } from "@/app/features/home/ViewAllAction";
import { NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import {
  CollectorViewToggle,
  readCollectorViewMode,
  writeCollectorViewMode,
  type CollectorViewMode,
} from "@/app/features/shared";
import {
  getHomeProjectsSections,
  isProjectArchived,
} from "./data";
import { getProjectPath } from "./projectPaths";
import { ProjectCardFooter, ProjectCardMeta } from "./ProjectCardMeta";
import { ProjectCornerMarker } from "./ProjectCornerMarker";
import type { HomeProjectCard, ProjectDestination } from "./types";

export function buildProjectCardOptions(
  project: HomeProjectCard,
  handlers: {
    onEditProject?: (projectId: string) => void;
    onArchiveProject?: (projectId: string) => void;
    onRestoreProject?: (projectId: string) => void;
    onDeleteProject?: (projectId: string) => void;
    /** When provided, Archive/Restore/Delete/Edit are hidden when false (not merely disabled). */
    canEditProject?: (projectId: string) => boolean;
    canArchiveProject?: (projectId: string) => boolean;
    canDeleteProject?: (projectId: string) => boolean;
    canRestoreProject?: (projectId: string) => boolean;
  } = {},
): LuxiaEntityOptionsItem[] {
  const archived = isProjectArchived(project);
  const canEdit = handlers.canEditProject
    ? handlers.canEditProject(project.id)
    : Boolean(handlers.onEditProject);
  const allowArchive = handlers.canArchiveProject
    ? handlers.canArchiveProject(project.id)
    : Boolean(handlers.onArchiveProject);
  const allowRestore = handlers.canRestoreProject
    ? handlers.canRestoreProject(project.id)
    : Boolean(handlers.onRestoreProject);
  const allowDelete = handlers.canDeleteProject
    ? handlers.canDeleteProject(project.id)
    : Boolean(handlers.onDeleteProject);

  const items: LuxiaEntityOptionsItem[] = [];

  if (canEdit) {
    items.push({
      id: "edit",
      label: "Edit Project",
      ariaLabel: `Edit ${project.name}`,
      onSelect: () => handlers.onEditProject!(project.id),
    });
  }

  if (archived) {
    if (allowRestore && handlers.onRestoreProject) {
      items.push({
        id: "restore",
        label: "Restore Project",
        ariaLabel: `Restore ${project.name}`,
        onSelect: () => handlers.onRestoreProject!(project.id),
      });
    }
  } else if (allowArchive && handlers.onArchiveProject) {
    items.push({
      id: "archive",
      label: "Archive Project",
      ariaLabel: `Archive ${project.name}`,
      onSelect: () => handlers.onArchiveProject!(project.id),
    });
  }

  if (allowDelete && handlers.onDeleteProject) {
    items.push({
      id: "delete",
      label: "Delete Project",
      ariaLabel: `Delete ${project.name}`,
      onSelect: () => handlers.onDeleteProject!(project.id),
      destructive: true,
      separatorBefore: true,
    });
  }

  return items;
}

interface ProjectDestinationActionsProps {
  projectId: string;
  projectName: string;
  compact?: boolean;
  onOpenProject: (projectId: string) => void;
  onNavigate?: (destination: ProjectDestination, projectId: string) => void;
}

export function ProjectDestinationActions({
  projectId,
  projectName,
  compact = false,
  onOpenProject,
  onNavigate,
}: ProjectDestinationActionsProps) {
  const openGalaxy = () => onNavigate?.("galaxy", projectId);
  const openConstellations = () => onNavigate?.("constellations", projectId);
  const projectHref = getProjectPath(projectId);

  return (
    <>
      <a
        href={projectHref}
        aria-label={`Open Project ${projectName}`}
        onClick={(e) => {
          e.preventDefault();
          onOpenProject(projectId);
        }}
        className="luxia-button luxia-button--primary luxia-button--compact inline-flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
      >
        Open Project
      </a>
      <Button
        type="button"
        variant="secondary"
        size="compact"
        aria-label={`Open Galaxy for ${projectName}`}
        onClick={openGalaxy}
      >
        Open Galaxy
      </Button>
      {!compact ? (
        <Button
          type="button"
          variant="tertiary"
          size="compact"
          aria-label={`View Constellations for ${projectName}`}
          onClick={openConstellations}
        >
          Constellations
        </Button>
      ) : null}
    </>
  );
}

export function ProjectListTitleLink({
  projectId,
  projectName,
  titleColor,
  onOpenProject,
}: {
  projectId: string;
  projectName: string;
  titleColor: string;
  onOpenProject: (projectId: string) => void;
}) {
  return (
    <a
      href={getProjectPath(projectId)}
      onClick={(event) => {
        event.preventDefault();
        onOpenProject(projectId);
      }}
      className="flex min-w-0 items-center gap-1.5 rounded-[4px] outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
      title={projectName}
      aria-label={`Open Project ${projectName}`}
    >
      <LuxiaProjectsIcon
        size={16}
        color={`var(--project-card-icon, ${HS.projectIcon})`}
        className="shrink-0"
        aria-hidden
      />
      <span
        className="min-w-0 truncate luxia-type-body-dense-strong"
        style={{ color: titleColor }}
      >
        {projectName}
      </span>
    </a>
  );
}

function ProjectCardDescription({
  description,
  color,
  lines = 1,
}: {
  description?: string;
  color: string;
  lines?: 1 | 2;
}) {
  const text = description?.trim();
  if (!text) return null;

  return (
    <p
      className={`mt-1.5 ${lines === 2 ? "line-clamp-2" : "line-clamp-1"} luxia-type-body-dense`}
      style={{
        color,
        fontSize: 14,
        lineHeight: 1.45,
        overflowWrap: "anywhere",
      }}
      title={text}
    >
      {text}
    </p>
  );
}

type ProjectHandlers = {
  onToggleProjectPin: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onRestoreProject?: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  canEditProject?: (projectId: string) => boolean;
  canArchiveProject?: (projectId: string) => boolean;
  canDeleteProject?: (projectId: string) => boolean;
  canRestoreProject?: (projectId: string) => boolean;
  onOpenProject: (projectId: string) => void;
  onNavigate?: (destination: ProjectDestination, projectId: string) => void;
};

function ProjectCardShell({
  project,
  handlers,
  onDark,
}: {
  project: HomeProjectCard;
  handlers: ProjectHandlers;
  /** The panel is the dark Featured surface. */
  onDark: boolean;
}) {
  const archived = isProjectArchived(project);
  const optionsItems = buildProjectCardOptions(project, handlers);

  return (
    <div className={`luxia-home-project-card relative flex h-full min-w-0 flex-col overflow-hidden ${HI.cardPadSupporting}`}>
      {/* Takes the panel's surface corner colours, like every Home Tile corner. */}
      <ProjectCornerMarker
        size="supporting"
        tone={{ color: "var(--home-tile-corner-icon)", background: "var(--home-tile-corner-bg)" }}
      />

      <div
        className="absolute z-[2] flex shrink-0 items-center gap-1"
        style={{ top: 6, right: 50 }}
      >
        {!archived ? (
          <PinButton
            pinned={project.isPinned}
            label={project.name}
            tone={onDark ? "dark" : "light"}
            controlSize="project"
            onToggle={() => handlers.onToggleProjectPin(project.id)}
          />
        ) : null}
        <LuxiaEntityOptionsMenu
          entityType="Project"
          entityLabel={project.name}
          ariaLabel={`Project options for ${project.name}`}
          tone={onDark ? "onDark" : "default"}
          items={optionsItems}
        />
      </div>

      <div className="relative z-[1] min-w-0">
        {/* Only the first row shares the top with the pin, options and corner; the name below uses the full width. */}
        <div style={{ paddingRight: 116 }}>
          <EntityIdentityRow
            entityType="project"
            iconColor="var(--home-tile-overline)"
            size="compact"
            hideIcon
          />
        </div>
        <h3 className="mt-2 luxia-type-title-card">
          <a
            href={getProjectPath(project.id)}
            onClick={(e) => {
              e.preventDefault();
              handlers.onOpenProject(project.id);
            }}
            className="line-clamp-2 max-w-full rounded-[4px] text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            style={{ color: "var(--home-tile-title)", overflowWrap: "anywhere" }}
            title={project.name}
            aria-label={`Open Project ${project.name}`}
          >
            {project.name}
          </a>
        </h3>
        <ProjectCardDescription
          description={project.description}
          color="var(--home-tile-text-secondary)"
          lines={2}
        />
      </div>

      <ProjectCardMeta project={project} density="supporting" showUpdated={false} />

      <ProjectCardFooter
        updatedAt={project.updatedAt}
        density="supporting"
        actions={(
          <ProjectDestinationActions
            projectId={project.id}
            projectName={project.name}
            compact
            onOpenProject={handlers.onOpenProject}
            onNavigate={handlers.onNavigate}
          />
        )}
      />
    </div>
  );
}

function ProjectListRow({
  project,
  handlers,
  onDark,
}: {
  project: HomeProjectCard;
  handlers: ProjectHandlers;
  onDark: boolean;
}) {
  const description = project.description?.trim();
  const archived = isProjectArchived(project);
  const optionsItems = buildProjectCardOptions(project, handlers);
  const roleLabel =
    project.viewerProjectRole !== undefined
      ? (project.viewerProjectRole ?? NO_PROJECT_ROLE_LABEL)
      : null;
  const metaLine = [
    `${project.constellationCount} ${project.constellationCount === 1 ? "Constellation" : "Constellations"}`,
    `${project.sourceCount ?? 0} ${(project.sourceCount ?? 0) === 1 ? "Source" : "Sources"}`,
    `${project.memberCount} ${project.memberCount === 1 ? "member" : "members"}`,
  ].join(" · ");
  const secondaryMeta = [
    roleLabel ? `Your role · ${roleLabel}` : null,
    `Updated ${project.updatedAt}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      role="listitem"
      className="luxia-home-project-list-row flex min-w-0 flex-wrap items-center gap-3 px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <ProjectListTitleLink
          projectId={project.id}
          projectName={project.name}
          titleColor="var(--home-tile-title)"
          onOpenProject={handlers.onOpenProject}
        />
        {description ? (
          <p
            className="mt-0.5 line-clamp-1 luxia-type-caption"
            style={{ color: "var(--home-tile-text-secondary)" }}
            title={description}
          >
            {description}
          </p>
        ) : null}
        <p
          className="mt-1.5 truncate luxia-type-caption"
          style={{ color: "var(--home-tile-text-muted)" }}
          title={secondaryMeta ? `${metaLine} · ${secondaryMeta}` : metaLine}
        >
          <span>{metaLine}</span>
          {secondaryMeta ? (
            <span className="hidden md:inline">{` · ${secondaryMeta}`}</span>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {!archived ? (
          <PinButton
            pinned={project.isPinned}
            label={project.name}
            tone={onDark ? "dark" : "light"}
            controlSize="project"
            onToggle={() => handlers.onToggleProjectPin(project.id)}
          />
        ) : null}
        <LuxiaEntityOptionsMenu
          entityType="Project"
          entityLabel={project.name}
          ariaLabel={`Project options for ${project.name}`}
          tone={onDark ? "onDark" : "default"}
          items={optionsItems}
        />
        <ProjectDestinationActions
          projectId={project.id}
          projectName={project.name}
          compact
          onOpenProject={handlers.onOpenProject}
          onNavigate={handlers.onNavigate}
        />
      </div>
    </div>
  );
}

/**
 * Fills the rest of a sparse Pinned row: how to add more, and where. Reads the
 * Home Tile colours when inside a styled section panel (falls back to the page's).
 */
function PinMoreHint({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div
      className="flex h-full min-h-[140px] min-w-0 flex-col items-start justify-center gap-2 rounded-[var(--luxia-radius-12)] border border-dashed px-5 py-4"
      style={{ borderColor: "var(--home-tile-chip-border, var(--luxia-border-default))" }}
      data-home-pin-hint=""
    >
      <span
        className="flex size-8 items-center justify-center rounded-full"
        style={{ color: "var(--home-tile-icon, var(--luxia-purple-50))", background: "var(--home-tile-chip-bg, var(--luxia-opacity-brand-primary-04))" }}
        aria-hidden
      >
        <Pin size={15} strokeWidth={2} />
      </span>
      <p className="luxia-type-body-dense-strong" style={{ color: "var(--home-tile-text, var(--luxia-text-primary))" }}>
        Keep your key Projects here
      </p>
      <p className="max-w-[44ch] luxia-type-caption" style={{ color: "var(--home-tile-text-secondary, var(--luxia-text-secondary))" }}>
        Use the pin on any Project card to add it to this list.
      </p>
      <button
        type="button"
        onClick={onBrowse}
        className="mt-0.5 inline-flex items-center gap-1 rounded-[6px] px-1 luxia-type-body-dense-strong outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
        style={{ color: "var(--home-tile-link, var(--luxia-purple-70))" }}
      >
        Browse Projects
        <LuxiaArrowRightIcon size={13} color="currentColor" aria-hidden />
      </button>
    </div>
  );
}

function ProjectCollection({
  projects,
  viewMode,
  handlers,
  listLabel,
  onDark,
  sparseHint,
}: {
  projects: readonly HomeProjectCard[];
  viewMode: CollectorViewMode;
  handlers: ProjectHandlers;
  listLabel: string;
  onDark: boolean;
  /** Grid with fewer than three cards: fills the rest of the row (e.g. how to pin more). */
  sparseHint?: ReactNode;
}) {
  if (projects.length === 0) return null;

  if (viewMode === "grid") {
    const hint = sparseHint && projects.length < 3 ? sparseHint : null;
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
        {projects.map((project) => (
          <ProjectCardShell key={project.id} project={project} handlers={handlers} onDark={onDark} />
        ))}
        {hint ? (
          <div className={`min-w-0 ${projects.length === 1 ? "lg:col-span-2" : "sm:col-span-2 lg:col-span-1"}`}>{hint}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="luxia-home-project-list" role="list" aria-label={listLabel}>
      {projects.map((project) => (
        <ProjectListRow key={project.id} project={project} handlers={handlers} onDark={onDark} />
      ))}
    </div>
  );
}

interface ProjectsPreviewProps {
  projects: HomeProjectCard[];
  pinnedProjectOrder: string[];
  onViewAll: () => void;
  /** The Home New Project flow, shown as "+ New Project" in the section header; omit when the user cannot create. */
  onNewProject?: () => void;
  onToggleProjectPin: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onRestoreProject?: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  canEditProject?: (projectId: string) => boolean;
  canArchiveProject?: (projectId: string) => boolean;
  canDeleteProject?: (projectId: string) => boolean;
  canRestoreProject?: (projectId: string) => boolean;
  onOpenProject: (projectId: string) => void;
  onNavigateProjectDestination?: (destination: ProjectDestination, projectId: string) => void;
  /** Which Home sections to render. Default "both" keeps the original combined Home. */
  sections?: ProjectsPreviewSections;
  /**
   * Wraps each Project-card collection (not the section heading). Home Tiles use
   * it to frame the cards in the tile's chosen style; omitted, nothing changes.
   */
  collectionFrame?: (collection: ReactNode) => ReactNode;
  /**
   * The list section's heading and order. Default: "Recent projects", most
   * recently updated first. `order: "name"` lists every Project A–Z.
   */
  recentSection?: { title: string; order: "updated" | "name"; icon?: ReactNode };
  /**
   * Show 3 / 6 / 9 / All (both sections when only one is shown) and Grid / List
   * (list section). When given (Home Tiles keep them per tile), they replace
   * the shared saved choices.
   */
  recentPreviewCount?: HomeRecentPreviewCount;
  onRecentPreviewCountChange?: (count: HomeRecentPreviewCount) => void;
  recentViewMode?: CollectorViewMode;
  onRecentViewModeChange?: (mode: CollectorViewMode) => void;
  /** Keeps heading ids unique when several previews are on one page. */
  headingIdSuffix?: string;
  /** Pinned with one or two cards: explain how to pin more in the rest of the row (Home Tiles). */
  pinnedSparseHint?: boolean;
}

export type ProjectsPreviewSections = "pinned" | "recent" | "both";

const VIEW_ALL_PROJECTS_LABEL = "View all projects";

/**
 * Ordered by Project activity (`updatedAtTimestamp`), so it is described as
 * such: Luxia keeps no per-user "last opened" record for Projects yet.
 */
const DEFAULT_RECENT_SECTION = {
  title: "Recent projects",
  order: "updated" as const,
};

/** "Showing 6 of 48 · A–Z", or "48 Projects · A–Z" / "3 pinned · Your order" when every one is shown. */
function projectCountLabel(shown: number, total: number, order: string, pinned: boolean): string {
  if (shown < total) return `Showing ${shown} of ${total} · ${order}`;
  return pinned
    ? `${total} pinned · ${order}`
    : `${total} ${total === 1 ? "Project" : "Projects"} · ${order}`;
}

export function ProjectsPreview({
  projects,
  pinnedProjectOrder,
  onViewAll,
  onNewProject,
  onToggleProjectPin,
  onArchiveProject,
  onRestoreProject,
  onEditProject,
  onDeleteProject,
  canEditProject,
  canArchiveProject,
  canDeleteProject,
  canRestoreProject,
  onOpenProject,
  onNavigateProjectDestination,
  sections = "both",
  collectionFrame = (collection) => collection,
  recentSection = DEFAULT_RECENT_SECTION,
  recentPreviewCount: controlledPreviewCount,
  onRecentPreviewCountChange,
  recentViewMode: controlledViewMode,
  onRecentViewModeChange,
  headingIdSuffix = "",
  pinnedSparseHint = false,
}: ProjectsPreviewProps) {
  // Grid/List applies only to the list section — not Pinned (always cards).
  const [savedRecentProjectsView, setRecentProjectsView] = useState<CollectorViewMode>(() =>
    readCollectorViewMode("home-projects"),
  );
  const [savedRecentPreviewCount, setRecentPreviewCount] = useState<HomeRecentPreviewCount>(() =>
    readHomeRecentPreviewCount(),
  );
  const recentProjectsView = controlledViewMode ?? savedRecentProjectsView;
  const recentPreviewCount = controlledPreviewCount ?? savedRecentPreviewCount;
  const recentLimit = resolveHomeRecentPreviewLimit(recentPreviewCount);
  const onDark = useHomeTileSurface() === "featured";
  const sectionsData = getHomeProjectsSections(
    projects,
    pinnedProjectOrder,
    recentSection.order === "name" ? null : recentLimit,
    // Pinned on its own follows Show; the combined Home keeps its short Pinned row.
    sections === "pinned" ? (recentLimit ?? Number.POSITIVE_INFINITY) : undefined,
  );
  const { pinned, ranked, pinnedTotal } = sectionsData;
  const recent = recentSection.order === "name"
    ? [...ranked]
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))
      .slice(0, recentLimit ?? undefined)
    : sectionsData.recent;
  const pinnedHeadingId = `home-pinned-projects-heading${headingIdSuffix}`;
  const recentHeadingId = `home-recent-projects-heading${headingIdSuffix}`;

  if (ranked.length === 0) return null;

  const showPinned = sections !== "recent" && pinned.length > 0;
  const showRecent = sections !== "pinned" && recent.length > 0;
  const showRecentEmpty = sections !== "pinned" && recent.length === 0 && pinned.length > 0;
  if (!showPinned && !showRecent && !showRecentEmpty) return null;

  const handlers: ProjectHandlers = {
    onToggleProjectPin,
    onArchiveProject,
    onRestoreProject,
    onEditProject,
    onDeleteProject,
    canEditProject,
    canArchiveProject,
    canDeleteProject,
    canRestoreProject,
    onOpenProject,
    onNavigate: onNavigateProjectDestination,
  };

  function handleRecentViewChange(mode: CollectorViewMode) {
    if (onRecentViewModeChange) {
      onRecentViewModeChange(mode);
      return;
    }
    setRecentProjectsView(mode);
    writeCollectorViewMode("home-projects", mode);
  }

  function handleRecentPreviewCountChange(count: HomeRecentPreviewCount) {
    if (onRecentPreviewCountChange) {
      onRecentPreviewCountChange(count);
      return;
    }
    setRecentPreviewCount(count);
    writeHomeRecentPreviewCount(count);
  }

  // Display group (tight) | actions (looser gap). Whole toolbar wraps as one unit.
  const headerActions = (withViewToggle: boolean) => (
    <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
      <div className="flex items-center gap-2">
        {withViewToggle ? (
          <CollectorViewToggle
            value={recentProjectsView}
            onChange={handleRecentViewChange}
          />
        ) : null}
        <HomeRecentPreviewCountControl
          value={recentPreviewCount}
          onChange={handleRecentPreviewCountChange}
        />
      </div>
      <div className="flex items-center gap-3">
        {onNewProject ? (
          <Button type="button" variant="secondary" size="compact" onClick={onNewProject} data-home-projects-new="">
            <Plus size={14} strokeWidth={2.25} aria-hidden />
            New Project
          </Button>
        ) : null}
        <ViewAllAction
          label={VIEW_ALL_PROJECTS_LABEL}
          ariaLabel="View all projects — open full project library"
          onClick={onViewAll}
        />
      </div>
    </div>
  );
  const recentHeaderActions = headerActions(true);
  const recentCount = projectCountLabel(
    recent.length,
    ranked.length,
    recentSection.order === "name" ? "A–Z" : "Newest first",
    false,
  );

  return (
    <div className="space-y-8">
      {showPinned ? (
        <section aria-labelledby={pinnedHeadingId}>
          <SectionHeader
            title="Pinned projects"
            titleId={pinnedHeadingId}
            icon={<Pin size={22} strokeWidth={1.75} aria-hidden />}
            iconColor={HS.sectionIconProjects}
            {...(sections === "pinned"
              ? {
                description: projectCountLabel(pinned.length, pinnedTotal, "Your order", true),
                actions: headerActions(false),
              }
              : {})}
          />
          {collectionFrame(
            <ProjectCollection
              projects={pinned}
              viewMode="grid"
              handlers={handlers}
              listLabel="Pinned projects"
              onDark={onDark}
              sparseHint={pinnedSparseHint ? <PinMoreHint onBrowse={onViewAll} /> : undefined}
            />,
          )}
        </section>
      ) : null}

      {showRecent ? (
        <section aria-labelledby={recentHeadingId}>
          <SectionHeader
            title={recentSection.title}
            titleId={recentHeadingId}
            description={recentCount}
            icon={recentSection.icon ?? <History size={22} strokeWidth={1.75} aria-hidden />}
            iconColor={HS.sectionIconProjects}
            actions={recentHeaderActions}
          />
          {collectionFrame(
            <ProjectCollection
              projects={recent}
              viewMode={recentProjectsView}
              handlers={handlers}
              listLabel={recentSection.title}
              onDark={onDark}
            />,
          )}
        </section>
      ) : showRecentEmpty ? (
        <section aria-labelledby={recentHeadingId}>
          <SectionHeader
            title={recentSection.title}
            titleId={recentHeadingId}
            icon={recentSection.icon ?? <History size={22} strokeWidth={1.75} aria-hidden />}
            iconColor={HS.sectionIconProjects}
            actions={recentHeaderActions}
          />
          <p
            className="luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            No other recent projects. Open the full library to browse all projects.
          </p>
        </section>
      ) : null}
    </div>
  );
}
