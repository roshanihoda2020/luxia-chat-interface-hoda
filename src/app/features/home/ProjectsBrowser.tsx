import { useEffect, useMemo, useState } from "react";
import {
  BROWSER_PAGE_SIZE,
  BrowserPagination,
  BrowserShell,
  FilterChip,
  FilterGroup,
} from "./browserShared";
import { EntityIdentityRow } from "./entityIdentity";
import { ProjectCardMeta } from "./ProjectCardMeta";
import { ProjectCornerMarker } from "./ProjectCornerMarker";
import { getHomeCardStyle, getProjectCardTypography, HS } from "./homeSurfaces";
import { PinButton } from "./PinButton";
import { ProjectDestinationActions } from "./ProjectsPreview";
import type { HomeProjectCard, ProjectDestination } from "./types";

type ProjectVisibilityFilter = "all" | "pinned";
type ProjectSortMode = "updated" | "name" | "pinned";

interface ProjectsBrowserProps {
  projects: HomeProjectCard[];
  onBack: () => void;
  onToggleProjectPin: (projectId: string) => void;
  onOpenProject: (projectId: string) => void;
  onNavigateProjectDestination?: (destination: ProjectDestination, projectId: string) => void;
}

function matchesProjectSearch(project: HomeProjectCard, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    project.name,
    project.description ?? "",
    `${project.constellationCount}`,
    typeof project.sourceCount === "number" ? `${project.sourceCount}` : "",
    "constellation",
    "constellations",
    "source",
    "sources",
    "project",
  ].join(" ").toLowerCase();

  return haystack.includes(q);
}

export function ProjectsBrowser({
  projects,
  onBack,
  onToggleProjectPin,
  onOpenProject,
  onNavigateProjectDestination,
}: ProjectsBrowserProps) {
  const [query, setQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<ProjectVisibilityFilter>("all");
  const [sortMode, setSortMode] = useState<ProjectSortMode>("updated");
  const [page, setPage] = useState(1);

  const cardStyle = getHomeCardStyle("supportingProject");
  const text = getProjectCardTypography(cardStyle);

  useEffect(() => {
    setPage(1);
  }, [query, visibilityFilter, sortMode]);

  const filtered = useMemo(() => {
    let next = projects.filter((project) => matchesProjectSearch(project, query));
    if (visibilityFilter === "pinned") {
      next = next.filter((project) => project.isPinned);
    }

    return next.slice().sort((a, b) => {
      if (sortMode === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortMode === "pinned") {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      }
      return (b.updatedAtTimestamp ?? 0) - (a.updatedAtTimestamp ?? 0);
    });
  }, [projects, query, sortMode, visibilityFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / BROWSER_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * BROWSER_PAGE_SIZE,
    safePage * BROWSER_PAGE_SIZE,
  );

  return (
    <BrowserShell
      title="Projects"
      description="Search, pin, and open your Projects and their Project-level Galaxies."
      onBack={onBack}
      searchLabel="Search Projects"
      searchPlaceholder="Search Projects"
      searchValue={query}
      onSearchChange={setQuery}
      filters={(
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FilterGroup label="Visibility">
            <FilterChip active={visibilityFilter === "all"} onClick={() => setVisibilityFilter("all")}>
              All
            </FilterChip>
            <FilterChip
              active={visibilityFilter === "pinned"}
              onClick={() => setVisibilityFilter("pinned")}
            >
              Pinned
            </FilterChip>
          </FilterGroup>
        </div>
      )}
      sortControls={(
        <label className="flex items-center gap-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
          <span>Sort</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as ProjectSortMode)}
            className="h-8 rounded-[8px] border px-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            style={{
              borderColor: "var(--luxia-border-default)",
              background: "var(--luxia-surface)",
              color: "var(--luxia-text-primary)",
            }}
            aria-label="Sort Projects"
          >
            <option value="updated">Recently updated</option>
            <option value="pinned">Pinned first</option>
            <option value="name">Name</option>
          </select>
        </label>
      )}
      resultSummary={(
        <p className="luxia-type-body-small" style={{ color: "var(--luxia-text-muted)" }}>
          {filtered.length} {filtered.length === 1 ? "Project" : "Projects"}
        </p>
      )}
      footer={
        pageCount > 1 ? (
          <BrowserPagination
            page={safePage}
            totalPages={pageCount}
            onPageChange={setPage}
          />
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        {pageItems.map((project) => {
          const description = project.description?.trim();

          return (
            <div
              key={project.id}
              className="relative flex h-full min-w-0 flex-col overflow-hidden p-4"
              style={{
                background: cardStyle.bg,
                border: `1px solid ${cardStyle.border}`,
                borderRadius: "var(--luxia-radius-12)",
              }}
            >
              <ProjectCornerMarker size="supporting" />

              <div
                className="absolute z-[2] flex shrink-0 items-center"
                style={{ top: 5, right: 50 }}
              >
                <PinButton
                  pinned={project.isPinned}
                  label={project.name}
                  controlSize="project"
                  onToggle={() => onToggleProjectPin(project.id)}
                />
              </div>

              <div className="relative z-[1] min-w-0" style={{ paddingRight: 88 }}>
                <EntityIdentityRow
                  entityType="project"
                  iconColor={HS.projectIcon}
                  size="compact"
                  hideIcon
                />
                <h3
                  className="mt-1.5 line-clamp-1 luxia-type-title-card"
                  style={{ color: text.title }}
                  title={project.name}
                >
                  {project.name}
                </h3>
                {description ? (
                  <p
                    className="mt-1.5 line-clamp-1 luxia-type-body-dense"
                    style={{
                      color: "var(--luxia-text-secondary)",
                      fontSize: 14,
                      lineHeight: 1.45,
                      overflowWrap: "anywhere",
                    }}
                    title={description}
                  >
                    {description}
                  </p>
                ) : null}
              </div>

              <ProjectCardMeta project={project} density="supporting" />

              <div className="relative z-[1] mt-auto">
                <ProjectDestinationActions
                  projectId={project.id}
                  projectName={project.name}
                  compact
                  onOpenProject={onOpenProject}
                  onNavigate={onNavigateProjectDestination}
                />
              </div>
            </div>
          );
        })}
      </div>

      {pageItems.length === 0 ? (
        <p className="px-1 py-6 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
          {visibilityFilter === "pinned"
            ? "No pinned Projects."
            : "No matching Projects."}
        </p>
      ) : null}
    </BrowserShell>
  );
}
