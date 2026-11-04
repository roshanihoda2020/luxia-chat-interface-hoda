import { Clock3 } from "lucide-react";
import { LuxiaArrowRightIcon, LuxiaProjectsIcon } from "@/assets/icons";
import { NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import { ProjectDestinationActions } from "@/app/features/project/ProjectsPreview";
import type { HomeProjectCard, ProjectDestination } from "@/app/features/project/types";
import { PinButton } from "../PinButton";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileStatus,
  HomeTileSurface,
  HomeTileText,
  HomeTileTitleAction,
  useHomeTileSurface,
  type HomeTileDensity,
} from "./HomeTileSurface";
import { CardArrow, KnowledgeGlyph, KnowledgeStack, Monogram, knowledgeKindOf } from "./homeTileVisuals";

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
 * Medium: name, pin and description; a facts grid (Constellations, Sources,
 *   members, your role); last update and Open Project / Open Galaxy.
 * Large: adds the Constellations you can use (with types and a link to all of
 *   them) beside the facts.
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
    // Identity first: the Project's monogram and name; one real fact under it.
    return (
      <HomeTileSurface density="small" label={`Project ${project.name}`} corner={corner}>
        <div className="flex min-h-0 min-w-0 flex-1 items-center gap-3">
          <Monogram name={project.name} size={44} />
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className={HOME_TILE_CORNER_CLEARANCE.small}>
            <HomeTileTitleAction
              title={project.name}
              onOpen={open}
              ariaLabel={`Open Project ${project.name}`}
              stretched
              size="dense"
              lines={2}
            />
            </div>
            <HomeTileText>{archived ? `Archived · ${counts}` : counts}</HomeTileText>
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate luxia-type-caption" style={{ color: HT.muted }}>
            <Clock3 size={12} strokeWidth={2} aria-hidden className="shrink-0" />
            <span className="truncate">{`Updated ${project.updatedAt}`}</span>
          </span>
          <CardArrow />
        </div>
      </HomeTileSurface>
    );
  }

  // Name first; Archived and the pin sit beside it, all clear of the corner.
  const titleRow = (
    <div className={`flex min-w-0 items-center justify-between gap-2 ${HOME_TILE_CORNER_CLEARANCE[density]}`}>
      <div className="flex min-w-0 items-center gap-3">
        <Monogram name={project.name} size={density === "large" ? 44 : 40} />
        <div className="min-w-0">
          <HomeTileTitleAction title={project.name} onOpen={open} ariaLabel={`Open Project ${project.name}`} lines={2} />
          {archived ? <span className="mt-0.5 inline-block"><HomeTileStatus>Archived</HomeTileStatus></span> : null}
        </div>
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

  // Open Project leads; Open Galaxy is the one secondary action. (Constellations are linked from Large's list.)
  const actions = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <ProjectDestinationActions
        projectId={project.id}
        projectName={project.name}
        compact
        onOpenProject={onOpenProject}
        onNavigate={onNavigate}
      />
    </div>
  );

  const knownKinds = constellations.map((constellation) => knowledgeKindOf(constellation.typeLabel));
  const role = project.viewerProjectRole === undefined
    ? null
    : project.viewerProjectRole ?? NO_PROJECT_ROLE_LABEL;
  const updated = (
    <p className="flex min-w-0 items-center gap-1.5 luxia-type-caption" style={{ color: HT.muted }}>
      <Clock3 size={13} strokeWidth={2} aria-hidden className="shrink-0" />
      <span className="truncate">{`Updated ${project.updatedAt}`}</span>
    </p>
  );

  if (density === "medium") {
    // Three areas spread over the card: the Project, its facts, then when it changed and what to do.
    return (
      <HomeTileSurface density="medium" label={`Project ${project.name}`} corner={corner}>
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-3" data-home-project-layout="medium">
          <div className="min-w-0 space-y-2.5">
            {titleRow}
            {description ? <HomeTileText lines={2}>{description}</HomeTileText> : null}
          </div>
          <div className="min-w-0 space-y-2">
            <ProjectFacts project={project} role={role} />
            {knownKinds.length > 0 ? (
              <p className="flex min-w-0 items-center justify-between gap-2 px-1 luxia-type-caption" style={{ color: HT.muted }}>
                <span className="truncate">Constellations you use</span>
                <KnowledgeStack kinds={knownKinds} total={constellations.length} max={5} size={20} label={`${constellations.length} Constellations you use, by type`} />
              </p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-3">
            {updated}
            {actions}
          </div>
        </div>
      </HomeTileSurface>
    );
  }

  const shownConstellations = constellations.slice(0, LARGE_CONSTELLATION_ROWS);
  const moreConstellations = Math.max(0, project.constellationCount - shownConstellations.length);
  const constellationList = shownConstellations.length > 0 && onOpenConstellation ? (
    <div className="min-w-0">
      <p className="mb-1 luxia-type-overline-data" style={{ color: HT.muted }}>
        Constellations
      </p>
      <ul className="min-w-0 divide-y divide-[var(--home-tile-divider)]" aria-label={`Constellations in ${project.name}`}>
        {shownConstellations.map((constellation) => (
          <li key={constellation.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onOpenConstellation(project.id, constellation.id)}
              aria-label={`Open Constellation ${constellation.label}`}
              className="relative z-[1] flex w-full min-w-0 items-center gap-2 rounded-[6px] px-1 py-1.5 text-left outline-none hover:bg-[var(--home-tile-row-hover)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            >
              <KnowledgeGlyph kind={knowledgeKindOf(constellation.typeLabel)} size={24} />
              <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={constellation.label}>
                {constellation.label}
              </span>
              {constellation.typeLabel ? (
                <span
                  className="shrink-0 rounded-[6px] px-1.5 py-px luxia-type-caption"
                  style={{ color: HT.secondary, background: HT.chipBg, border: `1px solid ${HT.chipBorder}` }}
                >
                  {constellation.typeLabel}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      {moreConstellations > 0 ? (
        <button
          type="button"
          onClick={() => onNavigate("constellations", project.id)}
          aria-label={`View all ${project.constellationCount} Constellations in ${project.name}`}
          className="relative z-[1] mt-1 inline-flex items-center gap-1 rounded-[6px] px-1 luxia-type-caption outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: HT.link }}
        >
          {`View all ${project.constellationCount} Constellations`}
          <LuxiaArrowRightIcon size={12} color="currentColor" aria-hidden />
        </button>
      ) : null}
    </div>
  ) : null;

  return (
    <HomeTileSurface density="large" label={`Project ${project.name}`} className="@container" corner={corner}>
      <div className="flex min-h-0 flex-1 flex-col gap-3" data-home-project-layout="large">
        {titleRow}
        {/* Side by side from a 384px card (every desktop Large); stacked on narrow phones. */}
        <div className="grid min-w-0 flex-1 grid-cols-1 content-start gap-3 @sm:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] @sm:gap-4">
          <div className="min-w-0 space-y-3">
            {description ? <HomeTileText lines={constellationList ? 2 : 3}>{description}</HomeTileText> : null}
            {constellationList}
          </div>
          <div className="min-w-0 space-y-2.5 self-start">
            <ProjectFacts project={project} role={role} layout="rows" />
            <div className="px-1">{updated}</div>
          </div>
        </div>
      </div>
      <div className="mt-3">{actions}</div>
    </HomeTileSurface>
  );
}

/**
 * The Project's real facts: Constellations, Sources, members and the viewer's
 * role (when known). Medium: a 2 × 2 grid of value-over-label pairs. Large's
 * narrower side column: label / value rows.
 */
function ProjectFacts({ project, role, layout = "grid" }: { project: HomeProjectCard; role: string | null; layout?: "grid" | "rows" }) {
  const facts = [
    { label: project.constellationCount === 1 ? "Constellation" : "Constellations", value: String(project.constellationCount) },
    { label: (project.sourceCount ?? 0) === 1 ? "Source" : "Sources", value: String(project.sourceCount ?? 0) },
    { label: project.memberCount === 1 ? "Member" : "Members", value: String(project.memberCount) },
    ...(role ? [{ label: "Your role", value: role }] : []),
  ];
  if (layout === "rows") {
    return (
      <dl className="flex min-w-0 flex-col gap-1.5 rounded-[10px] px-3.5 py-3" style={{ background: HT.panel }} data-home-project-facts="">
        {facts.map((fact) => (
          <div key={fact.label} className="flex min-w-0 items-baseline justify-between gap-3">
            <dt className="shrink-0 luxia-type-caption" style={{ color: HT.muted }}>{fact.label}</dt>
            <dd className="min-w-0 truncate text-right luxia-type-body-dense-strong" style={{ color: HT.text }} title={fact.value}>{fact.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl
      className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-2.5 rounded-[10px] px-3.5 py-3"
      style={{ background: HT.panel }}
      data-home-project-facts=""
    >
      {facts.map((fact) => (
        <div key={fact.label} className="flex min-w-0 flex-col-reverse">
          <dt className="truncate luxia-type-caption" style={{ color: HT.muted }}>{fact.label}</dt>
          <dd className="truncate luxia-type-body-dense-strong" style={{ color: HT.text }} title={fact.value}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
