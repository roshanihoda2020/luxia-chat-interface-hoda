import { History, Pin } from "lucide-react";
import { LuxiaArrowRightIcon, LuxiaProjectsIcon } from "@/assets/icons";
import { NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import type { HomeProjectCard } from "@/app/features/project/types";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileSurface,
  type HomeTileDensity,
} from "./HomeTileSurface";

/** Rows that fit each compact size (Pinned is also capped by the pinned preview limit). */
export const PROJECT_LIST_TILE_ROWS: Record<HomeTileDensity, number> = {
  small: 3,
  medium: 4,
  large: 4,
};

/** With this few Projects, Medium and Large show each one as a preview instead of a one-line row. */
const PREVIEW_UP_TO = 2;

function plural(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

const ROW_CLASS =
  "flex w-full min-w-0 items-center gap-3 rounded-[6px] px-1 py-1 text-left outline-none hover:bg-[var(--home-tile-row-hover)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

/**
 * Pinned projects / Recent projects at Small, Medium and Large. Full width
 * keeps the original ProjectsPreview section. The outer heading names the
 * list and the corner shows its icon, so the card is just the Projects.
 * Small: up to three names. Medium / Large: a one-line summary, then rows —
 * or, with only one or two Projects, a short preview of each (description,
 * counts, members, role) so the card isn't mostly empty. Rows open the Project.
 */
export function ProjectListHomeTile({
  variant,
  projects,
  total,
  density,
  onOpenProject,
  onViewAll,
}: {
  variant: "pinned" | "recent";
  /** Already ordered and limited by the caller. */
  projects: readonly HomeProjectCard[];
  /** How many Projects the full section would list. */
  total: number;
  density: HomeTileDensity;
  onOpenProject: (projectId: string) => void;
  onViewAll: () => void;
}) {
  const title = variant === "pinned" ? "Pinned projects" : "Recent projects";
  // Collection tile: one corner for the tile; the Project rows inside keep their own small icons.
  const corner = {
    icon: (size: number) => (variant === "pinned"
      ? <Pin size={size} strokeWidth={2} />
      : <History size={size} strokeWidth={2} />),
  };

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={title} className="justify-center" corner={corner}>
        <ul className={`min-w-0 space-y-0.5 ${HOME_TILE_CORNER_CLEARANCE.small}`} aria-label={title}>
          {projects.map((project) => (
            <li key={project.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onOpenProject(project.id)}
                aria-label={`Open Project ${project.name}`}
                title={project.name}
                className="flex w-full min-w-0 items-center gap-2 rounded-[6px] px-1 py-0.5 text-left outline-none hover:bg-[var(--home-tile-row-hover)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
              >
                <LuxiaProjectsIcon size={13} color={HT.icon} className="shrink-0" />
                <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: HT.title }}>
                  {project.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </HomeTileSurface>
    );
  }

  const wide = density === "large";
  const preview = projects.length <= PREVIEW_UP_TO;
  // One line that adds information the heading doesn't: how many, and what is shown.
  const summary = variant === "pinned"
    ? plural(total, "pinned Project")
    : total > projects.length
      ? `${projects.length} of ${total} · most recent first`
      : "Most recent first";

  return (
    <HomeTileSurface density={density} label={title} corner={corner}>
      <p
        className={`truncate luxia-type-caption ${HOME_TILE_CORNER_CLEARANCE[density]}`}
        style={{ color: HT.muted }}
      >
        {summary}
      </p>
      <ul
        className={`mt-2 min-w-0 ${preview ? "space-y-2" : "divide-y"}`}
        style={{ borderColor: HT.divider }}
        aria-label={title}
      >
        {projects.map((project) => {
          const role = project.viewerProjectRole === undefined ? null : project.viewerProjectRole ?? NO_PROJECT_ROLE_LABEL;
          const counts = `${plural(project.constellationCount, "Constellation")} · ${plural(project.sourceCount ?? 0, "Source")}`;
          if (preview) {
            const description = project.description?.trim();
            const details = [counts, plural(project.memberCount, "member"), role].filter(Boolean).join(" · ");
            return (
              <li key={project.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenProject(project.id)}
                  aria-label={`Open Project ${project.name}`}
                  className="block w-full min-w-0 rounded-[10px] px-3.5 py-3 text-left outline-none transition-colors hover:bg-[var(--home-tile-panel-hover)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                  style={{ background: HT.panel }}
                >
                  <span className="flex min-w-0 items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate luxia-type-title-card" style={{ color: HT.title }} title={project.name}>
                      {project.name}
                    </span>
                    <span className="shrink-0 luxia-type-caption" style={{ color: HT.muted }}>
                      {`Updated ${project.updatedAt}`}
                    </span>
                  </span>
                  {description ? (
                    <span
                      className={`mt-1 block ${wide || projects.length === 1 ? "line-clamp-2" : "line-clamp-1"} luxia-type-body-dense`}
                      style={{ color: HT.secondary, overflowWrap: "anywhere" }}
                    >
                      {description}
                    </span>
                  ) : null}
                  <span className="mt-1.5 block truncate luxia-type-caption" style={{ color: HT.muted }}>
                    {details}
                  </span>
                </button>
              </li>
            );
          }
          return (
            <li key={project.id} className="min-w-0" style={{ borderColor: HT.divider }}>
              <button
                type="button"
                onClick={() => onOpenProject(project.id)}
                aria-label={`Open Project ${project.name}`}
                className={ROW_CLASS}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={project.name}>
                    {project.name}
                  </span>
                  <span className="block truncate luxia-type-caption" style={{ color: HT.muted }}>
                    {counts}
                  </span>
                </span>
                {wide ? (
                  <span className="shrink-0 text-right">
                    <span className="block luxia-type-caption" style={{ color: HT.secondary }}>
                      {`Updated ${project.updatedAt}`}
                    </span>
                    {role ? (
                      <span className="block luxia-type-caption" style={{ color: HT.muted }}>
                        {role}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {variant === "pinned" && projects.length < PROJECT_LIST_TILE_ROWS[density] ? (
        <p className="mt-2 luxia-type-caption" style={{ color: HT.muted }}>
          Pin Projects from Recent projects or the Projects library to see them here.
        </p>
      ) : null}
      <div className="mt-auto flex justify-end pt-3">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 rounded-[6px] px-1 luxia-type-body-dense-strong outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: HT.link }}
        >
          View all projects
          <LuxiaArrowRightIcon size={13} color="currentColor" aria-hidden />
        </button>
      </div>
    </HomeTileSurface>
  );
}
