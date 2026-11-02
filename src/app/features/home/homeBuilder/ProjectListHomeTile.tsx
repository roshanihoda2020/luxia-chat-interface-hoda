import { History, Pin } from "lucide-react";
import { LuxiaArrowRightIcon, LuxiaProjectsIcon } from "@/assets/icons";
import { NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import type { HomeProjectCard } from "@/app/features/project/types";
import { HS } from "../homeSurfaces";
import { HomeTileIcon, HomeTileOverline, HomeTileSurface, type HomeTileDensity } from "./HomeTileSurface";

/** Rows that fit each compact size (Pinned is also capped by the pinned preview limit). */
export const PROJECT_LIST_TILE_ROWS: Record<HomeTileDensity, number> = {
  small: 2,
  medium: 4,
  large: 4,
};

function plural(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

/**
 * Pinned projects / Recent projects at Small, Medium and Large. Full width
 * keeps the original ProjectsPreview section. Rows open the Project.
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
  const icon = variant === "pinned"
    ? <Pin size={density === "small" ? 16 : 18} strokeWidth={1.9} />
    : <History size={density === "small" ? 16 : 18} strokeWidth={1.9} />;

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={title}>
        <div className="flex min-w-0 items-center gap-2.5">
          <HomeTileIcon size="sm">{icon}</HomeTileIcon>
          <HomeTileOverline>{`${title} · ${total}`}</HomeTileOverline>
        </div>
        <ul className="mt-2 min-w-0 space-y-0.5" aria-label={title}>
          {projects.map((project) => (
            <li key={project.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onOpenProject(project.id)}
                aria-label={`Open Project ${project.name}`}
                title={project.name}
                className="flex w-full min-w-0 items-center gap-2 rounded-[6px] px-1 py-0.5 text-left outline-none hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
              >
                <LuxiaProjectsIcon size={13} color={HS.projectIcon} className="shrink-0" />
                <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: HS.projectTitle }}>
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
  return (
    <HomeTileSurface density={density} label={title}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <HomeTileIcon>{icon}</HomeTileIcon>
          <div className="min-w-0">
            <HomeTileOverline>{variant === "pinned" ? "Pinned" : "Recent"}</HomeTileOverline>
            <p className="truncate luxia-type-title-card" style={{ color: HS.projectTitle }}>
              {title}
              <span className="font-normal" style={{ color: "var(--luxia-text-secondary)" }}>{` · ${total}`}</span>
            </p>
          </div>
        </div>
      </div>
      <ul className="mt-3 min-w-0 divide-y" style={{ borderColor: "var(--luxia-border-default)" }} aria-label={title}>
        {projects.map((project) => {
          const role = project.viewerProjectRole === undefined ? null : project.viewerProjectRole ?? NO_PROJECT_ROLE_LABEL;
          const counts = `${plural(project.constellationCount, "Constellation")} · ${plural(project.sourceCount ?? 0, "Source")}`;
          return (
            <li key={project.id} className="min-w-0" style={{ borderColor: "var(--luxia-border-default)" }}>
              <button
                type="button"
                onClick={() => onOpenProject(project.id)}
                aria-label={`Open Project ${project.name}`}
                className="flex w-full min-w-0 items-center gap-3 rounded-[6px] px-1 py-1 text-left outline-none hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate luxia-type-body-dense-strong" style={{ color: HS.projectTitle }} title={project.name}>
                    {project.name}
                  </span>
                  <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    {counts}
                  </span>
                </span>
                {wide ? (
                  <span className="shrink-0 text-right">
                    <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                      {`Updated ${project.updatedAt}`}
                    </span>
                    {role ? (
                      <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
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
        <p className="mt-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          Pin Projects from Recent projects or the Projects library to see them here.
        </p>
      ) : null}
      <div className="mt-auto flex justify-end pt-3">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 rounded-[6px] px-1 luxia-type-body-dense-strong outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: HS.viewAllText }}
        >
          View all projects
          <LuxiaArrowRightIcon size={13} color="currentColor" aria-hidden />
        </button>
      </div>
    </HomeTileSurface>
  );
}
