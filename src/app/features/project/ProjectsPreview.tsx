import { LuxiaProjectsIcon } from "@/assets/icons";
import { Button } from "@/app/components/ui/button";
import {
  LuxiaEntityOptionsMenu,
  type LuxiaEntityOptionsItem,
} from "@/app/components/LuxiaEntityOptionsMenu";
import { EntityIdentityRow } from "@/app/features/home/entityIdentity";
import { getHomeCardStyle, getProjectCardTypography, HS, HI } from "@/app/features/home/homeSurfaces";
import { PinButton } from "@/app/features/home/PinButton";
import { SectionHeader } from "@/app/features/home/SectionHeader";
import { getProjectPreview, isProjectArchived } from "./data";
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

interface ProjectCardShellProps {
  project: HomeProjectCard;
  markerSize: "featured" | "supporting";
  padClass: string;
  borderRadius: string;
  background: string;
  border: string;
  titleClass: string;
  titleColor: string;
  descriptionColor: string;
  compactActions: boolean;
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
}

function ProjectCardShell({
  project,
  markerSize,
  padClass,
  borderRadius,
  background,
  border,
  titleClass,
  titleColor,
  descriptionColor,
  compactActions,
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
  onNavigate,
}: ProjectCardShellProps) {
  const isFeatured = markerSize === "featured";
  const utilityRight = isFeatured ? 56 : 50;
  const contentPadRight = isFeatured ? 128 : 116;
  const archived = isProjectArchived(project);
  const optionsItems = buildProjectCardOptions(project, {
    onEditProject,
    onArchiveProject,
    onRestoreProject,
    onDeleteProject,
    canEditProject,
    canArchiveProject,
    canDeleteProject,
    canRestoreProject,
  });

  return (
    <div
      className={`relative flex h-full min-w-0 flex-col overflow-hidden ${padClass}`}
      style={{
        background,
        border: `1px solid ${border}`,
        borderRadius,
        boxShadow: "var(--luxia-shadow-sm)",
      }}
    >
      <ProjectCornerMarker size={markerSize} />

      <div
        className="absolute z-[2] flex shrink-0 items-center gap-1"
        style={{
          top: isFeatured ? 9 : 6,
          right: utilityRight,
        }}
      >
        {!archived ? (
          <PinButton
            pinned={project.isPinned}
            label={project.name}
            controlSize="project"
            onToggle={() => onToggleProjectPin(project.id)}
          />
        ) : null}
        <LuxiaEntityOptionsMenu
          entityType="Project"
          entityLabel={project.name}
          ariaLabel={`Project options for ${project.name}`}
          items={optionsItems}
        />
      </div>

      <div className="relative z-[1] min-w-0" style={{ paddingRight: contentPadRight }}>
        <EntityIdentityRow
          entityType="project"
          iconColor={HS.projectIcon}
          size={isFeatured ? "standard" : "compact"}
          hideIcon
        />
        <h3 className={`mt-2 line-clamp-1 ${titleClass}`} style={{ letterSpacing: isFeatured ? "-0.02em" : undefined }}>
          <a
            href={getProjectPath(project.id)}
            onClick={(e) => {
              e.preventDefault();
              onOpenProject(project.id);
            }}
            className="max-w-full truncate text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] rounded-[4px]"
            style={{ color: titleColor, display: "inline-block", maxWidth: "100%" }}
            title={project.name}
            aria-label={`Open Project ${project.name}`}
          >
            {project.name}
          </a>
        </h3>
        <ProjectCardDescription
          description={project.description}
          color={descriptionColor}
        />
      </div>

      <ProjectCardMeta project={project} density={markerSize} showUpdated={false} />

      <ProjectCardFooter
        updatedAt={project.updatedAt}
        density={markerSize}
        actions={(
          <ProjectDestinationActions
            projectId={project.id}
            projectName={project.name}
            compact={compactActions}
            onOpenProject={onOpenProject}
            onNavigate={onNavigate}
          />
        )}
      />
    </div>
  );
}

interface ProjectsPreviewProps {
  projects: HomeProjectCard[];
  pinnedProjectOrder: string[];
  onViewAll: () => void;
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
}

export function ProjectsPreview({
  projects,
  pinnedProjectOrder,
  onViewAll,
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
}: ProjectsPreviewProps) {
  const { featured, supporting, showViewAll } = getProjectPreview(
    projects,
    pinnedProjectOrder,
  );
  if (!featured) return null;

  const featuredStyle = getHomeCardStyle("featuredProject");
  const featuredText = getProjectCardTypography(featuredStyle);
  const supportingStyle = getHomeCardStyle("supportingProject");
  const supportingText = getProjectCardTypography(supportingStyle);

  return (
    <section aria-labelledby="home-projects-heading">
      <SectionHeader
        title="Projects"
        titleId="home-projects-heading"
        icon={<LuxiaProjectsIcon size={22} />}
        iconColor={HS.sectionIconProjects}
        onViewAll={showViewAll ? onViewAll : undefined}
        viewAllAriaLabel="View all Projects"
      />

      <div className="mb-4">
        <ProjectCardShell
          project={featured}
          markerSize="featured"
          padClass={HI.cardPadFeatured}
          borderRadius={HS.heroRadius}
          background={featuredStyle.bg}
          border={featuredStyle.border}
          titleClass="luxia-type-heading-h4"
          titleColor={featuredText.title}
          descriptionColor="var(--luxia-text-secondary)"
          compactActions={false}
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
          onNavigate={onNavigateProjectDestination}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch">
        {supporting.map((project) => (
          <ProjectCardShell
            key={project.id}
            project={project}
            markerSize="supporting"
            padClass={HI.cardPadSupporting}
            borderRadius="var(--luxia-radius-12)"
            background={supportingStyle.bg}
            border={supportingStyle.border}
            titleClass="luxia-type-title-card"
            titleColor={supportingText.title}
            descriptionColor="var(--luxia-text-secondary)"
            compactActions
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
            onNavigate={onNavigateProjectDestination}
          />
        ))}
      </div>
    </section>
  );
}
