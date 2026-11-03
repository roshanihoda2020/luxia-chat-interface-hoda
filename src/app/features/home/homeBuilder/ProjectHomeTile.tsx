import { ChevronRight } from "lucide-react";
import { LuxiaConstellationIcon, LuxiaProjectsIcon } from "@/assets/icons";
import { NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import { ProjectDestinationActions } from "@/app/features/project/ProjectsPreview";
import type { HomeProjectCard, ProjectDestination } from "@/app/features/project/types";
import { PinButton } from "../PinButton";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileFacts,
  HomeTileStatus,
  HomeTileSurface,
  HomeTileText,
  HomeTileTitleAction,
  useHomeTileSurface,
  type HomeTileDensity,
} from "./HomeTileSurface";

/** A Constellation of this Project the user already has access to (from their recent work). */
export interface ProjectHomeTileConstellation {
  id: string;
  label: string;
  typeLabel?: string;
}

interface ProjectHomeTileProps {
  project: HomeProjectCard;
  density: HomeTileDensity;
  onOpenProject: (projectId: string) => void;
  onNavigate: (destination: ProjectDestination, projectId: string) => void;
  onTogglePin?: (projectId: string) => void;
  /** Known Constellations, listed at Large when present (never invented). */
  constellations?: readonly ProjectHomeTileConstellation[];
  onOpenConstellation?: (projectId: string, constellationId: string) => void;
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

/** Constellations shown at Large; more than this are summarised as "+N more". */
const LARGE_CONSTELLATION_ROWS = 3;

/**
 * Specific-Project Home Tile. Uses only real Project data. The outer heading
 * says "Projects" and the corner shows the Project icon, so the card starts
 * with the Project's name.
 * Small: name + counts; the whole card opens the Project.
 * Medium: name, description, counts, pin, Open Project / Open Galaxy.
 * Large: adds a facts panel (counts, members, role) and the Project's known Constellations.
 */
export function ProjectHomeTile({
  project,
  density,
  onOpenProject,
  onNavigate,
  onTogglePin,
  constellations = [],
  onOpenConstellation,
}: ProjectHomeTileProps) {
  const description = project.description?.trim();
  const counts = `${plural(project.constellationCount, "Constellation")} · ${plural(project.sourceCount ?? 0, "Source")}`;
  const open = () => onOpenProject(project.id);
  const archived = project.status === "archived";
  const featured = useHomeTileSurface() === "featured";
  // Same purple corner as the Home Project cards.
  const corner = { icon: (size: number) => <LuxiaProjectsIcon size={size} color="currentColor" /> };

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={`Project ${project.name}`} className="justify-center" corner={corner}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <HomeTileTitleAction
              title={project.name}
              onOpen={open}
              ariaLabel={`Open Project ${project.name}`}
              stretched
              size="dense"
              lines={2}
            />
            <HomeTileText>{archived ? `Archived · ${counts}` : counts}</HomeTileText>
          </div>
          <ChevronRight
            size={16}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 transition-transform duration-150 group-hover/tile:translate-x-0.5"
            style={{ color: HT.accent }}
          />
        </div>
      </HomeTileSurface>
    );
  }

  // Name first; Archived and the pin sit beside it, all clear of the corner.
  const titleRow = (
    <div className={`flex min-w-0 items-start justify-between gap-2 ${HOME_TILE_CORNER_CLEARANCE[density]}`}>
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0">
          <HomeTileTitleAction title={project.name} onOpen={open} ariaLabel={`Open Project ${project.name}`} lines={2} />
        </div>
        {archived ? <span className="pt-0.5"><HomeTileStatus>Archived</HomeTileStatus></span> : null}
      </div>
      {onTogglePin && !archived ? (
        <PinButton
          pinned={project.isPinned}
          label={project.name}
          controlSize="project"
          tone={featured ? "dark" : "light"}
          onToggle={() => onTogglePin(project.id)}
        />
      ) : null}
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
      <HomeTileSurface density="medium" label={`Project ${project.name}`} corner={corner}>
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          {titleRow}
          {description ? <HomeTileText lines={3}>{description}</HomeTileText> : null}
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
  const shownConstellations = constellations.slice(0, LARGE_CONSTELLATION_ROWS);
  const moreConstellations = Math.max(0, project.constellationCount - shownConstellations.length);

  return (
    <HomeTileSurface density="large" label={`Project ${project.name}`} className="@container" corner={corner}>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {titleRow}
        {/* Side by side when the tile is wide enough (desktop Large); stacked when tiles stack on small screens. */}
        <div className="grid min-w-0 flex-1 grid-cols-1 content-start gap-3 @md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] @md:gap-5">
          <div className="min-w-0 space-y-3">
            <div className="min-w-0 space-y-1.5">
              {description ? <HomeTileText lines={2}>{description}</HomeTileText> : null}
              <HomeTileText tone="muted">{`Updated ${project.updatedAt}`}</HomeTileText>
            </div>
            {shownConstellations.length > 0 && onOpenConstellation ? (
              <div className="min-w-0">
                <p className="mb-1 luxia-type-overline-data" style={{ color: HT.muted }}>
                  Constellations
                </p>
                <ul className="min-w-0 space-y-0.5" aria-label={`Constellations in ${project.name}`}>
                  {shownConstellations.map((constellation) => (
                    <li key={constellation.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenConstellation(project.id, constellation.id)}
                        aria-label={`Open Constellation ${constellation.label}`}
                        className="relative z-[1] flex w-full min-w-0 items-center gap-2 rounded-[6px] px-1 py-0.5 text-left outline-none hover:bg-[var(--home-tile-row-hover)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                      >
                        <LuxiaConstellationIcon size={13} color={HT.icon} className="shrink-0" />
                        <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={constellation.label}>
                          {constellation.label}
                        </span>
                        {constellation.typeLabel ? (
                          <span className="shrink-0 luxia-type-caption" style={{ color: HT.muted }}>
                            {constellation.typeLabel}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
                {moreConstellations > 0 ? (
                  <p className="mt-0.5 px-1 luxia-type-caption" style={{ color: HT.muted }}>
                    {`+${moreConstellations} more in this Project`}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div
            className="min-w-0 self-start rounded-[10px] px-3.5 py-3"
            style={{ background: HT.panel }}
          >
            <HomeTileFacts facts={facts} />
          </div>
        </div>
      </div>
      <div className="mt-4">{actions}</div>
    </HomeTileSurface>
  );
}
