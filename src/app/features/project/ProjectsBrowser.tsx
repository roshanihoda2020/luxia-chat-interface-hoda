import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import {
  BROWSER_PAGE_SIZE,
  BrowserPagination,
  BrowserShell,
  FilterChip,
  FilterGroup,
} from "@/app/features/home/browserShared";
import { EntityIdentityRow } from "@/app/features/home/entityIdentity";
import { getHomeCardStyle, getProjectCardTypography, HS } from "@/app/features/home/homeSurfaces";
import { PinButton } from "@/app/features/home/PinButton";
import { isProjectActive, isProjectArchived } from "./data";
import { ProjectCardFooter, ProjectCardMeta } from "./ProjectCardMeta";
import { ProjectCornerMarker } from "./ProjectCornerMarker";
import { getProjectPath } from "./projectPaths";
import { buildProjectCardOptions, ProjectDestinationActions } from "./ProjectsPreview";
import type { HomeProjectCard, ProjectDestination, ProjectLifecycleStatus } from "./types";

type ProjectVisibilityFilter = "all" | "pinned";
type ProjectSortMode = "updated" | "name" | "pinned";

interface ProjectsBrowserProps {
  projects: HomeProjectCard[];
  onBack: () => void;
  onToggleProjectPin: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onRestoreProject?: (projectId: string) => void;
  onOpenProject: (projectId: string) => void;
  onNavigateProjectDestination?: (destination: ProjectDestination, projectId: string) => void;
  onNewProject?: () => void;
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
  onArchiveProject,
  onRestoreProject,
  onOpenProject,
  onNavigateProjectDestination,
  onNewProject,
}: ProjectsBrowserProps) {
  const [lifecycleTab, setLifecycleTab] = useState<ProjectLifecycleStatus>("active");
  const [query, setQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<ProjectVisibilityFilter>("all");
  const [sortMode, setSortMode] = useState<ProjectSortMode>("updated");
  const [page, setPage] = useState(1);

  const cardStyle = getHomeCardStyle("supportingProject");
  const text = getProjectCardTypography(cardStyle);
  const isArchivedTab = lifecycleTab === "archived";

  useEffect(() => {
    setPage(1);
  }, [query, visibilityFilter, sortMode, lifecycleTab]);

  useEffect(() => {
    if (isArchivedTab && visibilityFilter === "pinned") {
      setVisibilityFilter("all");
    }
    if (isArchivedTab && sortMode === "pinned") {
      setSortMode("updated");
    }
  }, [isArchivedTab, sortMode, visibilityFilter]);

  const activeCount = useMemo(
    () => projects.filter(isProjectActive).length,
    [projects],
  );
  const archivedCount = useMemo(
    () => projects.filter(isProjectArchived).length,
    [projects],
  );

  const filtered = useMemo(() => {
    let next = projects.filter((project) => (
      lifecycleTab === "archived" ? isProjectArchived(project) : isProjectActive(project)
    ));
    next = next.filter((project) => matchesProjectSearch(project, query));
    if (!isArchivedTab && visibilityFilter === "pinned") {
      next = next.filter((project) => project.isPinned);
    }

    return next.slice().sort((a, b) => {
      if (sortMode === "name") {
        return a.name.localeCompare(b.name);
      }
      if (!isArchivedTab && sortMode === "pinned") {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      }
      return (b.updatedAtTimestamp ?? 0) - (a.updatedAtTimestamp ?? 0);
    });
  }, [isArchivedTab, lifecycleTab, projects, query, sortMode, visibilityFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / BROWSER_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * BROWSER_PAGE_SIZE,
    safePage * BROWSER_PAGE_SIZE,
  );

  return (
    <BrowserShell
      title="Projects"
      archiveId="projects"
      description="Browse active Projects or restore archived ones. Pin and open Project-level Galaxies from Active."
      onBack={onBack}
      actions={
        onNewProject && !isArchivedTab ? (
          <Button type="button" variant="primary" size="compact" onClick={onNewProject}>
            New Project
          </Button>
        ) : null
      }
      searchLabel="Search Projects"
      searchPlaceholder={isArchivedTab ? "Search archived Projects" : "Search active Projects"}
      searchValue={query}
      onSearchChange={setQuery}
      filters={(
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FilterGroup label="Status">
            <FilterChip
              active={lifecycleTab === "active"}
              onClick={() => setLifecycleTab("active")}
            >
              Active{activeCount > 0 ? ` (${activeCount})` : ""}
            </FilterChip>
            <FilterChip
              active={lifecycleTab === "archived"}
              onClick={() => setLifecycleTab("archived")}
            >
              Archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
            </FilterChip>
          </FilterGroup>
          {!isArchivedTab ? (
            <FilterGroup label="Visibility">
              <FilterChip
                active={visibilityFilter === "all"}
                onClick={() => setVisibilityFilter("all")}
              >
                All
              </FilterChip>
              <FilterChip
                active={visibilityFilter === "pinned"}
                onClick={() => setVisibilityFilter("pinned")}
              >
                Pinned
              </FilterChip>
            </FilterGroup>
          ) : null}
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
            {!isArchivedTab ? <option value="pinned">Pinned first</option> : null}
            <option value="name">Name</option>
          </select>
        </label>
      )}
      resultSummary={(
        <p className="luxia-type-body-small" style={{ color: "var(--luxia-text-muted)" }}>
          {filtered.length} {isArchivedTab ? "archived" : "active"}{" "}
          {filtered.length === 1 ? "Project" : "Projects"}
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
          const archived = isProjectArchived(project);
          const optionsItems = buildProjectCardOptions(project, {
            onArchiveProject,
            onRestoreProject,
          });

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
                className="absolute z-[2] flex shrink-0 items-center gap-1"
                style={{ top: 5, right: 50 }}
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

              <div className="relative z-[1] min-w-0" style={{ paddingRight: 116 }}>
                <EntityIdentityRow
                  entityType="project"
                  iconColor={HS.projectIcon}
                  size="compact"
                  hideIcon
                />
                <h3 className="mt-1.5 line-clamp-1 luxia-type-title-card">
                  <a
                    href={getProjectPath(project.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenProject(project.id);
                    }}
                    className="max-w-full truncate text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] rounded-[4px]"
                    style={{ color: text.title, display: "inline-block", maxWidth: "100%" }}
                    title={project.name}
                    aria-label={`Open Project ${project.name}`}
                  >
                    {project.name}
                  </a>
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

              <ProjectCardMeta project={project} density="supporting" showUpdated={false} />

              <ProjectCardFooter
                updatedAt={project.updatedAt}
                actions={(
                  <ProjectDestinationActions
                    projectId={project.id}
                    projectName={project.name}
                    compact
                    onOpenProject={onOpenProject}
                    onNavigate={onNavigateProjectDestination}
                  />
                )}
              />
            </div>
          );
        })}
      </div>

      {pageItems.length === 0 ? (
        <p className="px-1 py-6 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
          {isArchivedTab
            ? "No archived Projects."
            : visibilityFilter === "pinned"
              ? "No pinned Projects."
              : "No matching Projects."}
        </p>
      ) : null}
    </BrowserShell>
  );
}
