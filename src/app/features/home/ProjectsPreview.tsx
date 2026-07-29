import { LuxiaProjectsIcon } from "@/assets/icons";
import { Button } from "@/app/components/ui/button";
import { EntityIdentityRow } from "./entityIdentity";
import { getProjectPreview } from "./data";
import { ProjectCardMeta } from "./ProjectCardMeta";
import { ProjectCornerMarker } from "./ProjectCornerMarker";
import { getHomeCardStyle, getProjectCardTypography, HS, HI } from "./homeSurfaces";
import { PinButton } from "./PinButton";
import { SectionHeader } from "./SectionHeader";
import type { HomeProjectCard, ProjectDestination } from "./types";

interface ProjectDestinationActionsProps {
  projectId: string;
  projectName: string;
  /** Featured card shows Constellations; supporting / View all stay compact. */
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="primary"
        size="compact"
        aria-label={`Open Project ${projectName}`}
        onClick={() => onOpenProject(projectId)}
      >
        Open Project
      </Button>
      <Button
        type="button"
        variant="outline"
        size="compact"
        aria-label={`Open Galaxy for ${projectName}`}
        onClick={openGalaxy}
      >
        Open Galaxy
      </Button>
      {!compact ? (
        <Button
          type="button"
          variant="outline"
          size="compact"
          aria-label={`View Constellations for ${projectName}`}
          onClick={openConstellations}
        >
          Constellations
        </Button>
      ) : null}
    </div>
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
  onOpenProject,
  onNavigate,
}: ProjectCardShellProps) {
  const isFeatured = markerSize === "featured";
  // Compact Project Pin (~30px) sits ~8px left of marker.
  const pinRight = isFeatured ? 56 : 50;
  const contentPadRight = isFeatured ? 100 : 88;

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
        className="absolute z-[2] flex shrink-0 items-center"
        style={{
          top: isFeatured ? 9 : 6,
          right: pinRight,
        }}
      >
        <PinButton
          pinned={project.isPinned}
          label={project.name}
          controlSize="project"
          onToggle={() => onToggleProjectPin(project.id)}
        />
      </div>

      <div className="relative z-[1] min-w-0" style={{ paddingRight: contentPadRight }}>
        <EntityIdentityRow
          entityType="project"
          iconColor={HS.projectIcon}
          size={isFeatured ? "standard" : "compact"}
          hideIcon
        />
        <h3
          className={`mt-2 line-clamp-1 ${titleClass}`}
          style={{
            color: titleColor,
            letterSpacing: isFeatured ? "-0.02em" : undefined,
          }}
          title={project.name}
        >
          {project.name}
        </h3>
        <ProjectCardDescription
          description={project.description}
          color={descriptionColor}
        />
      </div>

      <ProjectCardMeta project={project} density={markerSize} />

      <div className="relative z-[1] mt-auto">
        <ProjectDestinationActions
          projectId={project.id}
          projectName={project.name}
          compact={compactActions}
          onOpenProject={onOpenProject}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

interface ProjectsPreviewProps {
  projects: HomeProjectCard[];
  pinnedProjectOrder: string[];
  onViewAll: () => void;
  onToggleProjectPin: (projectId: string) => void;
  onOpenProject: (projectId: string) => void;
  onNavigateProjectDestination?: (destination: ProjectDestination, projectId: string) => void;
}

export function ProjectsPreview({
  projects,
  pinnedProjectOrder,
  onViewAll,
  onToggleProjectPin,
  onOpenProject,
  onNavigateProjectDestination,
}: ProjectsPreviewProps) {
  const { featured, supporting } = getProjectPreview(projects, pinnedProjectOrder);
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
        onViewAll={onViewAll}
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
            onOpenProject={onOpenProject}
            onNavigate={onNavigateProjectDestination}
          />
        ))}
      </div>
    </section>
  );
}
