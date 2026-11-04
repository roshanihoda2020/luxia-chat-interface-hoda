import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import {
  BROWSER_COLLECTION_GRID,
  BROWSER_PAGE_SIZE,
  BrowserPagination,
  BrowserShell,
  BrowserSortSelect,
  CollectionFilterBar,
  FilterChip,
  FilteredEmptyState,
  FilterField,
  ResultsCount,
  SegmentedFilterGroup,
} from "@/app/features/home/browserShared";
import { EntityIdentityRow } from "@/app/features/home/entityIdentity";
import {
  getHomeCardStyle,
  getProjectCardTypography,
  HS,
} from "@/app/features/home/homeSurfaces";
import { PinButton } from "@/app/features/home/PinButton";
import {
  CollectorViewToggle,
  readCollectorViewMode,
  writeCollectorViewMode,
  type CollectorViewMode,
} from "@/app/features/shared";
import { NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import { isProjectActive, isProjectArchived, rankProjectsForPreview } from "./data";
import { ProjectCardFooter, ProjectCardMeta } from "./ProjectCardMeta";
import { ProjectCornerMarker } from "./ProjectCornerMarker";
import { getProjectPath } from "./projectPaths";
import {
  buildProjectCardOptions,
  ProjectDestinationActions,
  ProjectListTitleLink,
} from "./ProjectsPreview";
import type {
  HomeProjectCard,
  ProjectDestination,
  ProjectLifecycleStatus,
} from "./types";

type ProjectSortMode =
  | "updated"
  | "updated-oldest"
  | "name-asc"
  | "name-desc"
  | "pinned";

interface ProjectsBrowserProps {
  projects: HomeProjectCard[];
  pinnedProjectOrder?: string[];
  onBack: () => void;
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
  onNavigateProjectDestination?: (
    destination: ProjectDestination,
    projectId: string,
  ) => void;
  onNewProject?: () => void;
}

function matchesProjectSearch(
  project: HomeProjectCard,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();

  if (!q) return true;

  const haystack = [
    project.name,
    project.description ?? "",
    `${project.constellationCount}`,
    `${project.sourceCount ?? 0}`,
    "constellation",
    "constellations",
    "source",
    "sources",
    "project",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function compareUpdatedDesc(
  a: HomeProjectCard,
  b: HomeProjectCard,
): number {
  return (
    (b.updatedAtTimestamp ?? 0) -
    (a.updatedAtTimestamp ?? 0)
  );
}

export function ProjectsBrowser({
  projects,
  pinnedProjectOrder = [],
  onBack,
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
  onNewProject,
}: ProjectsBrowserProps) {
  const [lifecycleTab, setLifecycleTab] =
    useState<ProjectLifecycleStatus>("active");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] =
    useState<ProjectSortMode>("updated");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<CollectorViewMode>(() =>
    readCollectorViewMode("projects"),
  );

  const cardStyle = getHomeCardStyle("supportingProject");
  const text = getProjectCardTypography(cardStyle);
  const isArchivedTab = lifecycleTab === "archived";

  function handleViewModeChange(mode: CollectorViewMode) {
    setViewMode(mode);
    writeCollectorViewMode("projects", mode);
  }

  useEffect(() => {
    setPage(1);
  }, [query, sortMode, lifecycleTab]);

  const activeCount = useMemo(
    () => projects.filter(isProjectActive).length,
    [projects],
  );

  const archivedCount = useMemo(
    () => projects.filter(isProjectArchived).length,
    [projects],
  );

  const filtered = useMemo(() => {
    if (
      lifecycleTab === "active"
      && !query.trim()
      && sortMode === "updated"
    ) {
      return rankProjectsForPreview(projects, pinnedProjectOrder);
    }

    let next = projects.filter((project) =>
      lifecycleTab === "archived"
        ? isProjectArchived(project)
        : isProjectActive(project),
    );

    next = next.filter((project) =>
      matchesProjectSearch(project, query),
    );

    return next.slice().sort((a, b) => {
      if (sortMode === "name-asc") {
        return a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        });
      }

      if (sortMode === "name-desc") {
        return b.name.localeCompare(a.name, undefined, {
          sensitivity: "base",
        });
      }

      if (sortMode === "updated-oldest") {
        return (
          (a.updatedAtTimestamp ?? 0) -
          (b.updatedAtTimestamp ?? 0)
        );
      }

      if (sortMode === "pinned") {
        const pinnedA = a.isPinned ? 1 : 0;
        const pinnedB = b.isPinned ? 1 : 0;

        if (pinnedA !== pinnedB) {
          return pinnedB - pinnedA;
        }

        return compareUpdatedDesc(a, b);
      }

      return compareUpdatedDesc(a, b);
    });
  }, [lifecycleTab, pinnedProjectOrder, projects, query, sortMode]);

  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / BROWSER_PAGE_SIZE),
  );

  const safePage = Math.min(page, pageCount);

  const pageItems = filtered.slice(
    (safePage - 1) * BROWSER_PAGE_SIZE,
    safePage * BROWSER_PAGE_SIZE,
  );

  const hasActiveFilters = Boolean(
    query.trim() ||
      lifecycleTab !== "active" ||
      sortMode !== "updated",
  );

  const clearFilters = () => {
    setQuery("");
    setLifecycleTab("active");
    setSortMode("updated");
  };

  return (
    <BrowserShell
      title="Projects"
      pageTypeLabel="PROJECTS"
      archiveId="projects"
      description="Browse active Projects or restore archived ones. Pin and open Project-level Galaxies from Active."
      onBack={onBack}
      actions={
        onNewProject && !isArchivedTab ? (
          <Button
            key="new-project-action"
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.primary}
            onClick={onNewProject}
          >
            New Project
          </Button>
        ) : null
      }
      searchLabel="Search Projects"
      searchPlaceholder={
        isArchivedTab
          ? "Search archived Projects"
          : "Search active Projects"
      }
      searchValue={query}
      onSearchChange={setQuery}
      filters={
        <CollectionFilterBar
          trailing={
            <>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="tertiary"
                  size="compact"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              ) : null}

              <CollectorViewToggle
                value={viewMode}
                onChange={handleViewModeChange}
              />

              <ResultsCount>
                {filtered.length}{" "}
                {isArchivedTab ? "archived" : "active"}{" "}
                {filtered.length === 1
                  ? "Project"
                  : "Projects"}
              </ResultsCount>
            </>
          }
        >
          <FilterField label="Status">
            <SegmentedFilterGroup label="Status">
              <FilterChip
                active={lifecycleTab === "active"}
                onClick={() => setLifecycleTab("active")}
              >
                Active
                {activeCount > 0
                  ? ` (${activeCount})`
                  : ""}
              </FilterChip>

              <FilterChip
                active={lifecycleTab === "archived"}
                onClick={() =>
                  setLifecycleTab("archived")
                }
              >
                Archived
                {archivedCount > 0
                  ? ` (${archivedCount})`
                  : ""}
              </FilterChip>
            </SegmentedFilterGroup>
          </FilterField>

          <BrowserSortSelect
            value={sortMode}
            aria-label="Sort Projects"
            onChange={(event) =>
              setSortMode(
                event.target.value as ProjectSortMode,
              )
            }
          >
            <option value="updated">
              Recently updated
            </option>
            <option value="updated-oldest">
              Oldest updated
            </option>
            <option value="name-asc">
              Name A–Z
            </option>
            <option value="name-desc">
              Name Z–A
            </option>
            <option value="pinned">
              Pinned first
            </option>
          </BrowserSortSelect>
        </CollectionFilterBar>
      }
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
      {pageItems.length === 0 ? (
        hasActiveFilters ? (
          <FilteredEmptyState
            title="No matching Projects"
            onClear={clearFilters}
          />
        ) : (
          <p
            className="px-1 py-6 luxia-type-body-dense"
            style={{
              color: "var(--luxia-text-muted)",
            }}
          >
            {isArchivedTab
              ? "No archived Projects."
              : "No matching Projects."}
          </p>
        )
      ) : viewMode === "grid" ? (
        <div className={BROWSER_COLLECTION_GRID}>
          {pageItems.map((project) => {
            const description =
              project.description?.trim();
            const archived =
              isProjectArchived(project);

            const optionsItems =
              buildProjectCardOptions(project, {
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
                key={project.id}
                className="relative flex h-full min-w-0 flex-col overflow-hidden p-4"
                style={{
                  background: cardStyle.bg,
                  border: `1px solid ${cardStyle.border}`,
                  borderRadius:
                    "var(--luxia-radius-12)",
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
                      onToggle={() =>
                        onToggleProjectPin(project.id)
                      }
                    />
                  ) : null}

                  <LuxiaEntityOptionsMenu
                    entityType="Project"
                    entityLabel={project.name}
                    ariaLabel={`Project options for ${project.name}`}
                    items={optionsItems}
                  />
                </div>

                <div
                  className="relative z-[1] min-w-0"
                  style={{ paddingRight: 116 }}
                >
                  <EntityIdentityRow
                    entityType="project"
                    iconColor={HS.projectIcon}
                    size="compact"
                    hideIcon
                  />

                  <h3 className="mt-1.5 line-clamp-1 luxia-type-title-card">
                    <a
                      href={getProjectPath(project.id)}
                      onClick={(event) => {
                        event.preventDefault();
                        onOpenProject(project.id);
                      }}
                      className="max-w-full truncate rounded-[4px] text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                      style={{
                        color: text.title,
                        display: "inline-block",
                        maxWidth: "100%",
                      }}
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
                        color:
                          "var(--luxia-text-secondary)",
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

                <ProjectCardMeta
                  project={project}
                  density="supporting"
                  showUpdated={false}
                />

                <ProjectCardFooter
                  updatedAt={project.updatedAt}
                  actions={
                    <ProjectDestinationActions
                      projectId={project.id}
                      projectName={project.name}
                      compact
                      onOpenProject={onOpenProject}
                      onNavigate={
                        onNavigateProjectDestination
                      }
                    />
                  }
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-[var(--luxia-radius-12)] border bg-white"
          style={{ borderColor: "var(--luxia-border-default)" }}
          role="list"
        >
          {pageItems.map((project) => {
            const description = project.description?.trim();
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
            const roleLabel =
              project.viewerProjectRole !== undefined
                ? (project.viewerProjectRole ?? NO_PROJECT_ROLE_LABEL)
                : null;
            const metaLine = [
              `${project.constellationCount} ${project.constellationCount === 1 ? "Constellation" : "Constellations"}`,
              `${project.sourceCount ?? 0} ${(project.sourceCount ?? 0) === 1 ? "Source" : "Sources"}`,
              `${project.memberCount} ${project.memberCount === 1 ? "member" : "members"}`,
            ].join(" · ");
            const secondaryMeta = [
              roleLabel ? `Your role · ${roleLabel}` : null,
              `Updated ${project.updatedAt}`,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <div
                key={project.id}
                role="listitem"
                className="flex min-w-0 flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0"
                style={{
                  borderColor: "var(--luxia-border-default)",
                }}
              >
                <div className="min-w-0 flex-1">
                  <ProjectListTitleLink
                    projectId={project.id}
                    projectName={project.name}
                    titleColor={text.title}
                    onOpenProject={onOpenProject}
                  />
                  {description ? (
                    <p
                      className="mt-0.5 line-clamp-1 luxia-type-caption"
                      style={{ color: "var(--luxia-text-secondary)" }}
                      title={description}
                    >
                      {description}
                    </p>
                  ) : null}
                  <p
                    className="mt-1.5 truncate luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    <span>{metaLine}</span>
                    {secondaryMeta ? (
                      <span className="hidden md:inline">{` · ${secondaryMeta}`}</span>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
      )}
    </BrowserShell>
  );
}
