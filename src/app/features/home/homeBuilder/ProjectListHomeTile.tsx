import { History, Pin, UserRound } from "lucide-react";
import { HOME_PROJECTS_VIEW_COPY } from "./collections";
import { useFittingCount } from "./CollectionHomeTile";
import type { HomeProjectsView } from "./types";
import { LuxiaProjectsIcon } from "@/assets/icons";
import { NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import type { HomeProjectCard } from "@/app/features/project/types";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileSurface,
  type HomeTileDensity,
} from "./HomeTileSurface";
import {
  HOME_TILE_FOCUS_RING,
  HOME_TILE_PANEL_BUTTON,
  HOME_TILE_ROW,
  Monogram,
  OpenCue,
  TileStat,
  plural,
} from "./homeTileVisuals";

/**
 * Most Projects each compact size offers. The tile shows only as many as fit
 * its slot (useFittingCount); these are upper bounds, never a reason to grow.
 */
export const PROJECT_LIST_TILE_ROWS: Record<HomeTileDensity, number> = {
  small: 3,
  medium: 6,
  large: 7,
};

/** With this few Projects, Medium and Large give each one a full preview. */
const PREVIEW_UP_TO = 2;

function roleOf(project: HomeProjectCard): string | null {
  return project.viewerProjectRole === undefined ? null : project.viewerProjectRole ?? NO_PROJECT_ROLE_LABEL;
}

/** What a row says under the name on Home: the user's role, else the description. Counts live in Project Overview. */
function contextOf(project: HomeProjectCard): string {
  const role = roleOf(project);
  return role ? `Your role: ${role}` : project.description?.trim() || "";
}

function Updated({ project, long = false }: { project: HomeProjectCard; long?: boolean }) {
  return (
    <span className="shrink-0 luxia-type-caption tabular-nums" style={{ color: HT.muted }} title={`Updated ${project.updatedAt}`}>
      <span className={long ? "" : "sr-only"}>Updated </span>
      {project.updatedAt}
    </span>
  );
}

function PinMark({ project }: { project: HomeProjectCard }) {
  if (!project.isPinned) return null;
  return (
    <span className="shrink-0" style={{ color: HT.icon }} title="Pinned">
      <Pin size={12} strokeWidth={2} aria-hidden />
      <span className="sr-only">Pinned</span>
    </span>
  );
}

/** One Project as a row: its monogram, name and when it changed. */
function ProjectRow({ project, onOpen, dense = false }: { project: HomeProjectCard; onOpen: () => void; dense?: boolean }) {
  return (
    <button type="button" onClick={onOpen} aria-label={`Open Project ${project.name}`} className={`${HOME_TILE_ROW} ${dense ? "py-1" : ""}`}>
      <Monogram name={project.name} size={dense ? 24 : 30} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={project.name}>{project.name}</span>
          <PinMark project={project} />
        </span>
        {dense ? null : (
          <span className="block truncate luxia-type-caption" style={{ color: HT.secondary }} title={contextOf(project)}>{contextOf(project)}</span>
        )}
      </span>
      <Updated project={project} />
    </button>
  );
}

/**
 * The first (or only) Project in full: identity, description and its real
 * facts. `size` sets how much of it fits (Medium lead, Large column, previews).
 */
function LeadProject({
  project,
  onOpen,
  size,
  descriptionLines,
}: {
  project: HomeProjectCard;
  onOpen: () => void;
  size: "compact" | "full";
  descriptionLines: 1 | 2 | 3;
}) {
  const description = project.description?.trim();
  const role = roleOf(project);
  const clamp = descriptionLines === 1 ? "line-clamp-1" : descriptionLines === 2 ? "line-clamp-2" : "line-clamp-3";
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open Project ${project.name}`}
      className={`${HOME_TILE_PANEL_BUTTON} h-full flex-col gap-2.5 ${size === "full" ? "p-4" : "px-3.5 py-3"}`}
      data-home-project-lead=""
    >
      <span className="flex min-w-0 items-center gap-3">
        <Monogram name={project.name} size={size === "full" ? 44 : 36} />
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 truncate luxia-type-title-card" style={{ color: HT.title, fontSize: 16, lineHeight: "22px" }} title={project.name}>
              {project.name}
            </span>
            <PinMark project={project} />
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <Updated project={project} long />
            {role ? (
              <span className="inline-flex min-w-0 items-center gap-1 luxia-type-caption" style={{ color: HT.muted }} title={`Your role: ${role}`}>
                <UserRound size={11} strokeWidth={2} aria-hidden className="shrink-0" />
                <span className="sr-only">Your role: </span>
                <span className="truncate">{role}</span>
              </span>
            ) : null}
          </span>
        </span>
      </span>
      {description ? (
        <span className={`block ${clamp} luxia-type-body-dense`} style={{ color: HT.secondary, overflowWrap: "anywhere" }} title={description}>
          {description}
        </span>
      ) : null}
      <span className="mt-auto flex min-w-0 items-center justify-between gap-2 border-t pt-2.5 luxia-type-caption" style={{ borderColor: HT.divider, color: HT.muted }}>
        <span className="min-w-0 truncate">Knowledge and members in the Project</span>
        <span className="shrink-0 font-semibold" style={{ color: HT.title }} aria-hidden>Open →</span>
      </span>
    </button>
  );
}

/**
 * The Projects collection at Small, Medium and Large, for any view (Pinned,
 * Recently updated, All A–Z). Full width keeps the Project-card section
 * (ProjectsPreview). The caller renders the empty state when there are none.
 *
 * Small — how many, then the first Projects by monogram and name (each opens).
 *   A single Project gets its identity and counts instead of a one-row list.
 * Medium — the first Project as a lead preview, the next ones as rows.
 * Large — lead preview on the left, the following Projects on the right.
 * One or two Projects: each gets a full preview, never a stretched list.
 */
export function ProjectListHomeTile({
  view,
  projects,
  total,
  density,
  onOpenProject,
  onViewAll,
}: {
  view: HomeProjectsView;
  /** Every Project in the view, already ordered; the tile shows as many as fit. */
  projects: readonly HomeProjectCard[];
  /** How many Projects the view has. */
  total: number;
  density: HomeTileDensity;
  onOpenProject: (projectId: string) => void;
  onViewAll: () => void;
}) {
  const copy = HOME_PROJECTS_VIEW_COPY[view];
  const title = copy.title;
  const preview = projects.length <= PREVIEW_UP_TO;
  const restCandidate = density === "small"
    ? Math.min(projects.length, PROJECT_LIST_TILE_ROWS.small)
    : preview ? 0 : Math.min(projects.length - 1, PROJECT_LIST_TILE_ROWS[density]);
  const rest = density === "small" ? projects : projects.slice(1);
  const { areaRef, listRef, count } = useFittingCount(restCandidate, `projects|${view}|${density}|${projects.map((project) => project.id).join(",")}`);
  const shownRest = rest.slice(0, count);
  const corner = {
    icon: (size: number) => (view === "pinned"
      ? <Pin size={size} strokeWidth={2} />
      : view === "updated"
        ? <History size={size} strokeWidth={2} />
        : <LuxiaProjectsIcon size={size} color="currentColor" />),
  };
  const countLabel = view === "pinned" ? (total === 1 ? "pinned Project" : "pinned Projects") : total === 1 ? "Project" : "Projects";
  const open = (project: HomeProjectCard) => () => onOpenProject(project.id);

  if (density === "small") {
    if (projects.length === 1) {
      const project = projects[0];
      return (
        <HomeTileSurface density="small" label={title} corner={corner}>
          <div className={`flex min-w-0 items-center gap-1.5 ${HOME_TILE_CORNER_CLEARANCE.small}`}>
            <TileStat value={total} label={countLabel} size="sm" />
          </div>
          <div className="mt-auto">
            <ProjectRow project={project} onOpen={open(project)} />
          </div>
        </HomeTileSurface>
      );
    }
    return (
      <HomeTileSurface density="small" label={title} corner={corner}>
        <div className={HOME_TILE_CORNER_CLEARANCE.small} title={`${total} ${countLabel} · ${copy.orderInline}`}>
          <TileStat value={total} label={countLabel} size="sm" />
        </div>
        <div ref={areaRef} className="mt-1 min-h-0 flex-1 overflow-hidden">
          <ul ref={listRef} className="-mx-1.5 min-w-0" aria-label={title}>
            {shownRest.map((project) => (
              <li key={project.id} className="min-w-0"><ProjectRow project={project} onOpen={open(project)} dense /></li>
            ))}
          </ul>
        </div>
      </HomeTileSurface>
    );
  }

  const large = density === "large";
  const summary = `${view === "pinned" ? `${total} pinned` : plural(total, "Project")} · ${copy.orderInline}`;
  const header = (
    <div className={`flex min-w-0 items-center justify-between gap-3 ${HOME_TILE_CORNER_CLEARANCE[density]}`}>
      <p className="min-w-0 truncate luxia-type-caption" style={{ color: HT.muted }} title={summary}>{summary}</p>
      <OpenCue label="View all" ariaLabel="View all projects" onClick={onViewAll} />
    </div>
  );

  if (preview) {
    // One or two Projects: each gets its full preview. A single pinned Project
    // keeps its natural height and the rest of the card invites more pins.
    const single = projects.length === 1;
    return (
      <HomeTileSurface density={density} label={title} corner={corner} className="@container">
        {header}
        <ul
          className={`mt-3 grid min-w-0 gap-3 ${single ? "" : "min-h-0 flex-1"} ${large && !single ? "grid-cols-1 @sm:grid-cols-2" : "grid-cols-1"} ${!single && !large ? "grid-rows-2" : ""}`}
          aria-label={title}
          data-home-projects-layout="preview"
        >
          {projects.map((project) => (
            <li key={project.id} className="min-h-0 min-w-0">
              <LeadProject
                project={project}
                onOpen={open(project)}
                size={single ? "full" : "compact"}
                descriptionLines={single ? 2 : large ? 2 : 1}
              />
            </li>
          ))}
        </ul>
        {single ? (
          <button
            type="button"
            onClick={onViewAll}
            className={`group/more mt-3 flex min-h-[44px] w-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed px-4 py-3 text-center transition-colors hover:bg-[var(--home-tile-row-hover)] ${HOME_TILE_FOCUS_RING}`}
            style={{ borderColor: HT.chipBorder }}
            data-home-projects-invite=""
          >
            <span className="luxia-type-body-dense-strong" style={{ color: HT.link }}>
              {view === "pinned" ? "Pin more Projects" : "Browse all Projects"}
            </span>
            <span className="luxia-type-caption" style={{ color: HT.muted }}>
              {view === "pinned" ? "Pin from any Project card or the Projects library." : "Every Project you can access."}
            </span>
          </button>
        ) : null}
      </HomeTileSurface>
    );
  }

  const lead = projects[0];
  const list = (
    <div ref={areaRef} className="min-h-0 flex-1 overflow-hidden">
      <ul ref={listRef} className="-mx-1.5 flex min-w-0 flex-col" aria-label={`More ${title.toLowerCase()}`}>
        {shownRest.map((project) => (
          <li key={project.id} className="min-w-0"><ProjectRow project={project} onOpen={open(project)} dense={!large} /></li>
        ))}
      </ul>
    </div>
  );

  return (
    <HomeTileSurface density={density} label={title} corner={corner} className="@container">
      {header}
      {large ? (
        <div className="mt-3 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 @sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-home-projects-layout="large">
          <div className="min-h-0 min-w-0">
            <LeadProject project={lead} onOpen={open(lead)} size="full" descriptionLines={3} />
          </div>
          <div className="flex min-h-0 min-w-0 flex-col">
            {list}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-2" data-home-projects-layout="medium">
          <div className="shrink-0">
            <LeadProject project={lead} onOpen={open(lead)} size="compact" descriptionLines={1} />
          </div>
          {list}
        </div>
      )}
    </HomeTileSurface>
  );
}
