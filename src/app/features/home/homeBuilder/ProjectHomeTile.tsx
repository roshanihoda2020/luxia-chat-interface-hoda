import { ChevronRight } from "lucide-react";
import { LuxiaProjectsIcon } from "@/assets/icons";
import { NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import { ProjectDestinationActions } from "@/app/features/project/ProjectsPreview";
import type { HomeProjectCard, ProjectDestination } from "@/app/features/project/types";
import { PinButton } from "../PinButton";
import {
  HomeTileFacts,
  HomeTileIcon,
  HomeTileOverline,
  HomeTileSurface,
  HomeTileText,
  HomeTileTitleAction,
  type HomeTileDensity,
} from "./HomeTileSurface";

interface ProjectHomeTileProps {
  project: HomeProjectCard;
  density: HomeTileDensity;
  onOpenProject: (projectId: string) => void;
  onNavigate: (destination: ProjectDestination, projectId: string) => void;
  onTogglePin?: (projectId: string) => void;
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

/**
 * Specific-Project Home Tile. Uses only real Project data.
 * Small: identity + name + counts; the whole card opens the Project.
 * Medium: name, description, counts, pin, Open Project / Open Galaxy.
 * Large: adds a facts panel (role, members, last update) and Constellations.
 */
export function ProjectHomeTile({
  project,
  density,
  onOpenProject,
  onNavigate,
  onTogglePin,
}: ProjectHomeTileProps) {
  const description = project.description?.trim();
  const counts = `${plural(project.constellationCount, "Constellation")} · ${plural(project.sourceCount ?? 0, "Source")}`;
  const open = () => onOpenProject(project.id);
  const archived = project.status === "archived";

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={`Project ${project.name}`} className="justify-center">
        <div className="flex min-w-0 items-center gap-3">
          <HomeTileIcon size="sm">
            <LuxiaProjectsIcon size={18} color="currentColor" />
          </HomeTileIcon>
          <div className="min-w-0 flex-1">
            <HomeTileOverline>Project</HomeTileOverline>
            <HomeTileTitleAction
              title={project.name}
              onOpen={open}
              ariaLabel={`Open Project ${project.name}`}
              stretched
              size="dense"
            />
            <HomeTileText>{counts}</HomeTileText>
          </div>
          <ChevronRight
            size={16}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 transition-transform duration-150 group-hover/tile:translate-x-0.5"
            style={{ color: "var(--luxia-purple-60)" }}
          />
        </div>
      </HomeTileSurface>
    );
  }

  const header = (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <HomeTileIcon>
          <LuxiaProjectsIcon size={20} color="currentColor" />
        </HomeTileIcon>
        <HomeTileOverline status={archived ? "Archived" : undefined}>Project</HomeTileOverline>
      </div>
      {onTogglePin && !archived ? (
        <PinButton
          pinned={project.isPinned}
          label={project.name}
          controlSize="project"
          onToggle={() => onTogglePin(project.id)}
        />
      ) : null}
    </div>
  );

  const body = (
    <div className="min-w-0 space-y-1.5">
      <HomeTileTitleAction
        title={project.name}
        onOpen={open}
        ariaLabel={`Open Project ${project.name}`}
        lines={density === "large" ? 1 : 2}
      />
      {description ? <HomeTileText lines={2}>{description}</HomeTileText> : null}
    </div>
  );

  const actions = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <ProjectDestinationActions
        projectId={project.id}
        projectName={project.name}
        compact={density !== "large"}
        onOpenProject={onOpenProject}
        onNavigate={onNavigate}
      />
    </div>
  );

  if (density === "medium") {
    return (
      <HomeTileSurface density="medium" label={`Project ${project.name}`}>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {header}
          {body}
          <HomeTileText tone="muted">{`${counts} · Updated ${project.updatedAt}`}</HomeTileText>
        </div>
        <div className="mt-4">{actions}</div>
      </HomeTileSurface>
    );
  }

  const role = project.viewerProjectRole === undefined
    ? null
    : project.viewerProjectRole ?? NO_PROJECT_ROLE_LABEL;
  const facts = [
    { label: "Constellations", value: String(project.constellationCount) },
    { label: "Sources", value: String(project.sourceCount ?? 0) },
    { label: "Members", value: String(project.memberCount) },
    ...(role ? [{ label: "Your role", value: role }] : []),
  ];

  return (
    <HomeTileSurface density="large" label={`Project ${project.name}`} className="@container">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {header}
        {/* Side by side when the tile is wide enough (desktop Large); stacked when tiles stack on small screens. */}
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 @md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] @md:gap-5">
          <div className="min-w-0 space-y-2">
            {body}
            <HomeTileText tone="muted">{`Updated ${project.updatedAt}`}</HomeTileText>
          </div>
          <div
            className="min-w-0 self-start rounded-[10px] px-3.5 py-3"
            style={{ background: "var(--luxia-opacity-brand-primary-04)" }}
          >
            <HomeTileFacts facts={facts} />
          </div>
        </div>
      </div>
      <div className="mt-4">{actions}</div>
    </HomeTileSurface>
  );
}
