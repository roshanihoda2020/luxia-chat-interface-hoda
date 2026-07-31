import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  buildProjectDashboardBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { FilterChip, FilterGroup } from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import { getProjectNameById } from "@/app/features/project";
import type { HomeProjectCard } from "@/app/features/project/types";
import {
  DashboardOutputPreviewGraphic,
  outputTypeLabel,
} from "./DashboardOutputPreviews";
import { getProjectDashboardOutputs } from "./data";
import { ProjectNotFoundState } from "./ProjectHeader";
import { ProjectModuleEmptyState } from "./ProjectModuleShared";
import type {
  ProjectDashboardOutput,
  ProjectDashboardOutputType,
  ProjectDashboardSourceType,
} from "./types";

type OutputTypeFilter = "all" | ProjectDashboardOutputType;
type SourceFilter = "all" | ProjectDashboardSourceType;

const OUTPUT_TYPE_FILTERS: { id: OutputTypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "chart", label: "Charts" },
  { id: "table", label: "Tables" },
  { id: "report", label: "Reports" },
  { id: "metric", label: "Metrics" },
  { id: "analysis", label: "Analysis" },
  { id: "insight", label: "Insights" },
  { id: "comparison", label: "Comparisons" },
  { id: "mixed", label: "Mixed" },
];

const SOURCE_FILTERS: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "All sources" },
  { id: "galaxy", label: "Galaxy" },
  { id: "constellation", label: "Constellations" },
  { id: "chat", label: "Chats" },
];

const PROJECT_NAME_FALLBACK = "Project name 01";

function summarizeOutputs(outputs: readonly ProjectDashboardOutput[]) {
  const charts = outputs.filter((item) => item.outputType === "chart").length;
  const tables = outputs.filter((item) => item.outputType === "table").length;
  return {
    total: outputs.length,
    charts,
    tables,
    other: Math.max(0, outputs.length - charts - tables),
  };
}

function matchesSearch(item: ProjectDashboardOutput, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.name.toLowerCase().includes(q)
    || outputTypeLabel(item.outputType).toLowerCase().includes(q)
    || item.sourceContext.toLowerCase().includes(q)
  );
}

export interface ProjectDashboardPageProps {
  projectId: string | null;
  projects: HomeProjectCard[];
  onNavigateHome: () => void;
  onViewProjects: () => void;
  onOpenProjectOverview: (projectId: string) => void;
  onOpenGalaxy?: (projectId: string) => void;
}

export function ProjectDashboardPage({
  projectId,
  projects,
  onNavigateHome,
  onViewProjects,
  onOpenProjectOverview,
  onOpenGalaxy,
}: ProjectDashboardPageProps) {
  const [typeFilter, setTypeFilter] = useState<OutputTypeFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const project = projectId
    ? projects.find((entry) => entry.id === projectId)
    : undefined;

  const projectName = projectId
    ? getProjectNameById(projectId, projects, PROJECT_NAME_FALLBACK)
    : PROJECT_NAME_FALLBACK;

  const outputs = useMemo(
    () => (projectId ? getProjectDashboardOutputs(projectId) : []),
    [projectId],
  );

  const summary = useMemo(() => summarizeOutputs(outputs), [outputs]);

  const filteredOutputs = useMemo(() => {
    return outputs.filter((item) => {
      if (typeFilter !== "all" && item.outputType !== typeFilter) return false;
      if (sourceFilter !== "all" && item.sourceType !== sourceFilter) return false;
      return matchesSearch(item, searchQuery);
    });
  }, [outputs, typeFilter, sourceFilter, searchQuery]);

  const filtersActive = typeFilter !== "all" || sourceFilter !== "all" || searchQuery.trim().length > 0;

  function clearFilters() {
    setTypeFilter("all");
    setSourceFilter("all");
    setSearchQuery("");
  }

  if (!projectId || !project) {
    return (
      <ProjectNotFoundState
        onBackHome={onNavigateHome}
        onViewProjects={onViewProjects}
      />
    );
  }

  const lastUpdated = outputs[0]?.updatedAt;
  const crumbItems = buildProjectDashboardBreadcrumbItems({
    projectId: project.id,
    projectName,
  });

  return (
    <div className="min-w-0 w-full">
      <LuxiaPageHeader
        contentGap="page"
        className="mb-5"
        pageTypeLabel="DASHBOARD"
        title="Dashboard"
        titleStyle={{ color: "var(--luxia-purple-70)" }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={crumbItems}
            handlers={{
              onHome: onNavigateHome,
              onProject: onOpenProjectOverview,
            }}
          />
        }
        description={
          <p
            className="luxia-type-body-small"
            style={{ color: "var(--luxia-neutral-600, #475569)", maxWidth: 780 }}
          >
            Saved charts, tables, reports, metrics, and analyses from Project conversations.
          </p>
        }
        metadata={
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 luxia-type-caption"
            style={{ color: "var(--luxia-neutral-600, #475569)" }}
          >
            <span>
              {summary.total} {summary.total === 1 ? "saved output" : "saved outputs"}
            </span>
            {lastUpdated ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Last updated {lastUpdated}</span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span className="truncate">{projectName}</span>
          </div>
        }
      />

      {outputs.length > 0 ? (
        <div
          className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
          aria-label="Dashboard summary"
        >
          {[
            { label: "Outputs", value: summary.total },
            { label: "Charts", value: summary.charts },
            { label: "Tables", value: summary.tables },
            { label: "Other outputs", value: summary.other },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-[10px] px-3.5 py-3"
              style={{
                background: "var(--luxia-surface)",
                border:
                  "1px solid color-mix(in srgb, var(--luxia-blue-20) 40%, var(--luxia-neutral-200))",
              }}
            >
              <p
                className="luxia-type-caption"
                style={{ color: "var(--luxia-neutral-500, #64748B)" }}
              >
                {item.label}
              </p>
              <p
                className="mt-1 luxia-type-body-dense-strong"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {outputs.length > 0 ? (
        <div className="mb-5 space-y-3">
          <label className="block max-w-md">
            <span className="sr-only">Search outputs</span>
            <div className="relative">
              <Search
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                style={{ color: "var(--luxia-text-muted)" }}
              />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search outputs"
                className="h-10 pl-9"
                style={{
                  background: HS.searchBg,
                  borderColor: HS.searchBorder,
                }}
              />
            </div>
          </label>

          <FilterGroup label="Output type">
            {OUTPUT_TYPE_FILTERS.map((filter) => (
              <FilterChip
                key={filter.id}
                active={typeFilter === filter.id}
                onClick={() => setTypeFilter(filter.id)}
              >
                {filter.label}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup label="Source">
            {SOURCE_FILTERS.map((filter) => (
              <FilterChip
                key={filter.id}
                active={sourceFilter === filter.id}
                onClick={() => setSourceFilter(filter.id)}
              >
                {filter.label}
              </FilterChip>
            ))}
          </FilterGroup>
        </div>
      ) : null}

      {outputs.length === 0 ? (
        <div
          className="rounded-[12px] px-6 py-12"
          style={{
            background: "var(--luxia-surface)",
            border:
              "1px solid color-mix(in srgb, var(--luxia-blue-20) 40%, var(--luxia-neutral-200))",
          }}
        >
          <ProjectModuleEmptyState
            title="No saved outputs yet"
            description="Save charts, tables, reports, metrics, and analyses from Project conversations to see them here."
            action={
              onOpenGalaxy ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  onClick={() => onOpenGalaxy(project.id)}
                >
                  Open Galaxy
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : filteredOutputs.length === 0 ? (
        <div
          className="rounded-[12px] px-6 py-12"
          style={{
            background: "var(--luxia-surface)",
            border:
              "1px solid color-mix(in srgb, var(--luxia-blue-20) 40%, var(--luxia-neutral-200))",
          }}
        >
          <ProjectModuleEmptyState
            title="No matching outputs"
            description="Try another output type or search term."
            action={
              filtersActive ? (
                <Button type="button" variant="secondary" size="compact" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div
          className="grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          style={{ gap: 16 }}
        >
          {filteredOutputs.map((item) => (
            <article
              key={item.id}
              className="flex min-w-0 flex-col rounded-[12px] p-3"
              style={{
                background: "var(--luxia-surface)",
                border:
                  "1px solid color-mix(in srgb, var(--luxia-blue-20) 45%, var(--luxia-neutral-200))",
              }}
              aria-label={`${item.name}, ${outputTypeLabel(item.outputType)}, from ${item.sourceContext}, updated ${item.updatedAt}`}
            >
              <DashboardOutputPreviewGraphic variant={item.outputType} size="full" />
              <div className="mt-3 flex min-w-0 flex-1 flex-col gap-1 px-0.5">
                <h2
                  className="truncate luxia-type-body-dense-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  {item.name}
                </h2>
                <p
                  className="truncate luxia-type-caption"
                  style={{ color: "var(--luxia-neutral-600, #475569)" }}
                >
                  {outputTypeLabel(item.outputType)}
                </p>
                <p
                  className="truncate luxia-type-caption"
                  style={{ color: "var(--luxia-neutral-500, #64748B)" }}
                >
                  {item.sourceContext}
                </p>
                <p
                  className="mt-auto pt-1 luxia-type-caption"
                  style={{ color: "var(--luxia-neutral-500, #64748B)" }}
                >
                  Updated {item.updatedAt}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
