import { useState, type ReactNode } from "react";
import { History, Pin, Plus } from "lucide-react";
import { LuxiaArrowRightIcon, LuxiaProjectsIcon } from "@/assets/icons";
import { Button } from "@/app/components/ui/button";
import {
  LuxiaEntityOptionsMenu,
  type LuxiaEntityOptionsItem,
} from "@/app/components/LuxiaEntityOptionsMenu";
import { EntityIdentityRow } from "@/app/features/home/entityIdentity";
import { getHomeCardStyle, getProjectCardTypography, HS, HI } from "@/app/features/home/homeSurfaces";
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
        color={HS.projectIcon}
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
}: {
  description?: string;
  color: string;
}) {
  const text = description?.trim();
  if (!text) return null;

  return (
    <p
      className="mt-1.5 line-clamp-1 luxia-type-body-dense"
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
}: {
  project: HomeProjectCard;
  handlers: ProjectHandlers;
}) {
  const style = getHomeCardStyle("supportingProject");
  const text = getProjectCardTypography(style);
  const archived = isProjectArchived(project);
  const optionsItems = buildProjectCardOptions(project, handlers);

  return (
    <div
      className={`relative flex h-full min-w-0 flex-col overflow-hidden ${HI.cardPadSupporting}`}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: "var(--luxia-radius-12)",
        boxShadow: "var(--luxia-shadow-sm)",
      }}
    >
      <ProjectCornerMarker size="supporting" />

      <div
        className="absolute z-[2] flex shrink-0 items-center gap-1"
        style={{ top: 6, right: 50 }}
      >
        {!archived ? (
          <PinButton
            pinned={project.isPinned}
            label={project.name}
            controlSize="project"
            onToggle={() => handlers.onToggleProjectPin(project.id)}
          />
        ) : null}
        <LuxiaEntityOptionsMenu
          entityType="Project"
          entityLabel={project.name}
          ariaLabel={`Project options for ${project.name}`}
          items={optionsItems}
        />
      </div>

      <div className="relative z-[1] min-w-0" style={{ paddingRight: 116 }}>
        <EntityIdentityRow
          entityType="project"
          iconColor={HS.projectIcon}
          size="compact"
          hideIcon
        />
        <h3 className="mt-2 line-clamp-1 luxia-type-title-card">
          <a
            href={getProjectPath(project.id)}
            onClick={(e) => {
              e.preventDefault();
              handlers.onOpenProject(project.id);
            }}
            className="max-w-full truncate rounded-[4px] text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            style={{ color: text.title, display: "inline-block", maxWidth: "100%" }}
            title={project.name}
            aria-label={`Open Project ${project.name}`}
          >
            {project.name}
          </a>
        </h3>
        <ProjectCardDescription
          description={project.description}
          color="var(--luxia-text-secondary)"
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
}: {
  project: HomeProjectCard;
  handlers: ProjectHandlers;
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
      className="flex min-w-0 flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0"
      style={{ borderColor: "var(--luxia-border-default)" }}
    >
      <div className="min-w-0 flex-1">
        <ProjectListTitleLink
          projectId={project.id}
          projectName={project.name}
          titleColor={HS.projectTitle}
          onOpenProject={handlers.onOpenProject}
        />
        {description ? (
          <p
            className="mt-0.5 line-clamp-1 luxia-type-caption"
            style={{ color: "var(--luxia-text-secondary)" }}
            title={description}
          >
            {description}
          </p>
        ) : null}
        <p
          className="mt-1.5 truncate luxia-type-caption"
          style={{ color: "var(--luxia-text-muted)" }}
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
            controlSize="project"
            onToggle={() => handlers.onToggleProjectPin(project.id)}
          />
        ) : null}
        <LuxiaEntityOptionsMenu
          entityType="Project"
          entityLabel={project.name}
          ariaLabel={`Project options for ${project.name}`}
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

/** Approved soft-purple create treatment — lighter than featured Project cards. */
const NEW_PROJECT_AFFORDANCE = {
  bg: "var(--luxia-opacity-brand-primary-04)",
  border: "var(--luxia-opacity-brand-primary-16)",
  hoverBg: "var(--luxia-opacity-brand-primary-08)",
  hoverBorder: "var(--luxia-opacity-brand-primary-24)",
  plus: "var(--luxia-purple-60)",
  plusRing: "var(--luxia-opacity-brand-primary-16)",
  label: HS.viewAllText,
  helper: "var(--luxia-text-muted)",
  chevron: "var(--luxia-text-muted)",
} as const;

function NewProjectCreateTile({ onNewProject }: { onNewProject: () => void }) {
  return (
    <button
      type="button"
      onClick={onNewProject}
      aria-label="New project"
      className={`group flex h-full min-h-[140px] min-w-0 cursor-pointer flex-col items-center justify-center border border-dashed text-center outline-none transition-[border-color,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] ${HI.cardPadSupporting}`}
      style={{
        borderColor: NEW_PROJECT_AFFORDANCE.border,
        borderRadius: "var(--luxia-radius-12)",
        background: NEW_PROJECT_AFFORDANCE.bg,
      }}
      onMouseEnter={(event) => {
        const el = event.currentTarget;
        el.style.borderColor = NEW_PROJECT_AFFORDANCE.hoverBorder;
        el.style.background = NEW_PROJECT_AFFORDANCE.hoverBg;
      }}
      onMouseLeave={(event) => {
        const el = event.currentTarget;
        el.style.borderColor = NEW_PROJECT_AFFORDANCE.border;
        el.style.background = NEW_PROJECT_AFFORDANCE.bg;
      }}
    >
      {/* Slight lift from vertical center so the tile feels composed, not empty. */}
      <span className="flex -translate-y-2 flex-col items-center gap-1.5">
        <span
          className="inline-flex size-8 items-center justify-center rounded-full"
          style={{
            border: `1px solid ${NEW_PROJECT_AFFORDANCE.plusRing}`,
            background: "var(--luxia-surface)",
            color: NEW_PROJECT_AFFORDANCE.plus,
          }}
          aria-hidden
        >
          <Plus size={16} strokeWidth={2.25} />
        </span>
        <span
          className="luxia-type-body-dense-strong"
          style={{ color: NEW_PROJECT_AFFORDANCE.label }}
        >
          New project
        </span>
        <span
          className="luxia-type-caption"
          style={{ color: NEW_PROJECT_AFFORDANCE.helper }}
        >
          Create a new workspace
        </span>
      </span>
    </button>
  );
}

function NewProjectCreateRow({
  onNewProject,
  showTopBorder,
}: {
  onNewProject: () => void;
  showTopBorder: boolean;
}) {
  return (
    <button
      type="button"
      role="listitem"
      onClick={onNewProject}
      aria-label="New project"
      className={`group flex w-full min-w-0 cursor-pointer items-center gap-3 px-4 py-3 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--luxia-border-focus)] ${showTopBorder ? "border-t" : ""}`}
      style={{
        borderColor: "var(--luxia-border-default)",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = NEW_PROJECT_AFFORDANCE.hoverBg;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = "transparent";
      }}
    >
      <span
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full"
        style={{
          border: `1px solid ${NEW_PROJECT_AFFORDANCE.plusRing}`,
          background: NEW_PROJECT_AFFORDANCE.bg,
          color: NEW_PROJECT_AFFORDANCE.plus,
        }}
        aria-hidden
      >
        <Plus size={14} strokeWidth={2.25} />
      </span>
      <span
        className="min-w-0 flex-1 truncate luxia-type-body-dense-strong"
        style={{ color: NEW_PROJECT_AFFORDANCE.label }}
      >
        New project
      </span>
      <span style={{ color: NEW_PROJECT_AFFORDANCE.chevron }} aria-hidden>
        <LuxiaArrowRightIcon size={14} color="currentColor" />
      </span>
    </button>
  );
}

function ProjectCollection({
  projects,
  viewMode,
  handlers,
  listLabel,
  onNewProject,
}: {
  projects: readonly HomeProjectCard[];
  viewMode: CollectorViewMode;
  handlers: ProjectHandlers;
  listLabel: string;
  /** Contextual create — does not count toward Recent preview limits. */
  onNewProject?: () => void;
}) {
  const showCreate = Boolean(onNewProject);
  if (projects.length === 0 && !showCreate) return null;

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
        {projects.map((project) => (
          <ProjectCardShell key={project.id} project={project} handlers={handlers} />
        ))}
        {showCreate ? <NewProjectCreateTile onNewProject={onNewProject!} /> : null}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[var(--luxia-radius-12)] border bg-white"
      style={{ borderColor: "var(--luxia-border-default)" }}
      role="list"
      aria-label={listLabel}
    >
      {projects.map((project) => (
        <ProjectListRow key={project.id} project={project} handlers={handlers} />
      ))}
      {showCreate ? (
        <NewProjectCreateRow
          onNewProject={onNewProject!}
          showTopBorder={projects.length > 0}
        />
      ) : null}
    </div>
  );
}

interface ProjectsPreviewProps {
  projects: HomeProjectCard[];
  pinnedProjectOrder: string[];
  onViewAll: () => void;
  /** Same Home New Project flow; omit when user cannot create. */
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
}

export type ProjectsPreviewSections = "pinned" | "recent" | "both";

const VIEW_ALL_PROJECTS_LABEL = "View all projects";

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
}: ProjectsPreviewProps) {
  // Grid/List applies only to Recent projects — not Pinned (always cards).
  const [recentProjectsView, setRecentProjectsView] = useState<CollectorViewMode>(() =>
    readCollectorViewMode("home-projects"),
  );
  const [recentPreviewCount, setRecentPreviewCount] = useState<HomeRecentPreviewCount>(() =>
    readHomeRecentPreviewCount(),
  );
  const {
    pinned,
    recent,
    ranked,
  } = getHomeProjectsSections(
    projects,
    pinnedProjectOrder,
    resolveHomeRecentPreviewLimit(recentPreviewCount),
  );

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
    setRecentProjectsView(mode);
    writeCollectorViewMode("home-projects", mode);
  }

  function handleRecentPreviewCountChange(count: HomeRecentPreviewCount) {
    setRecentPreviewCount(count);
    writeHomeRecentPreviewCount(count);
  }

  // Display group (tight) | navigation (looser gap). Whole toolbar wraps as one unit.
  const recentHeaderActions = (
    <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
      <div className="flex items-center gap-2">
        <CollectorViewToggle
          value={recentProjectsView}
          onChange={handleRecentViewChange}
        />
        <HomeRecentPreviewCountControl
          value={recentPreviewCount}
          onChange={handleRecentPreviewCountChange}
        />
      </div>
      <ViewAllAction
        label={VIEW_ALL_PROJECTS_LABEL}
        ariaLabel="View all projects — open full project library"
        onClick={onViewAll}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {showPinned ? (
        <section aria-labelledby="home-pinned-projects-heading">
          <SectionHeader
            title="Pinned projects"
            titleId="home-pinned-projects-heading"
            icon={<Pin size={22} strokeWidth={1.75} aria-hidden />}
            iconColor={HS.sectionIconProjects}
          />
          {collectionFrame(
            <ProjectCollection
              projects={pinned}
              viewMode="grid"
              handlers={handlers}
              listLabel="Pinned projects"
            />,
          )}
        </section>
      ) : null}

      {showRecent ? (
        <section aria-labelledby="home-recent-projects-heading">
          <SectionHeader
            title="Recent projects"
            titleId="home-recent-projects-heading"
            description="Your recently accessed projects."
            icon={<History size={22} strokeWidth={1.75} aria-hidden />}
            iconColor={HS.sectionIconProjects}
            actions={recentHeaderActions}
          />
          {collectionFrame(
            <ProjectCollection
              projects={recent}
              viewMode={recentProjectsView}
              handlers={handlers}
              listLabel="Recent projects"
              onNewProject={onNewProject}
            />,
          )}
        </section>
      ) : showRecentEmpty ? (
        <section aria-labelledby="home-recent-projects-heading">
          <SectionHeader
            title="Recent projects"
            titleId="home-recent-projects-heading"
            description="Your recently accessed projects."
            icon={<History size={22} strokeWidth={1.75} aria-hidden />}
            iconColor={HS.sectionIconProjects}
            actions={recentHeaderActions}
          />
          <p
            className="luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            No other recent projects. Open the full library to browse all projects.
          </p>
          {onNewProject ? (
            <div className="mt-3">
              {collectionFrame(
                <ProjectCollection
                  projects={[]}
                  viewMode={recentProjectsView}
                  handlers={handlers}
                  listLabel="Recent projects"
                  onNewProject={onNewProject}
                />,
              )}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
