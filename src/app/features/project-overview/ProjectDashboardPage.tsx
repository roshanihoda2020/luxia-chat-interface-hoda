import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  buildProjectDashboardBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  BrowserFilterSelect,
  CollectionFilterBar,
  FilteredEmptyState,
  ResultsCount,
} from "@/app/features/home/browserShared";
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
  ProjectDashboardConversationSource,
  ProjectDashboardOutput,
  ProjectDashboardOutputType,
} from "./types";

type OutputTypeFilter = "all" | ProjectDashboardOutputType;
type ConversationSourceFilter = "all" | ProjectDashboardConversationSource;

const PROJECT_NAME_FALLBACK = "Project name 01";

function matchesSearch(item: ProjectDashboardOutput, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.name.toLowerCase().includes(q)
    || outputTypeLabel(item.outputType).toLowerCase().includes(q)
    || item.sourceContext.toLowerCase().includes(q)
  );
}

function outputCountLabel(count: number): string {
  return `${count} ${count === 1 ? "output" : "outputs"}`;
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
  const [sourceFilter, setSourceFilter] = useState<ConversationSourceFilter>("all");
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

  const filteredOutputs = useMemo(() => {
    return outputs.filter((item) => {
      if (typeFilter !== "all" && item.outputType !== typeFilter) return false;
      if (sourceFilter !== "all" && item.conversationSource !== sourceFilter) return false;
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
        className="mb-4"
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
              {outputs.length} {outputs.length === 1 ? "saved output" : "saved outputs"}
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
        <div className="mb-4 space-y-4">
          <label className="block w-full max-w-full">
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
                className="h-10 w-full pl-9"
                style={{
                  background: HS.searchBg,
                  borderColor: HS.searchBorder,
                }}
              />
            </div>
          </label>

          <CollectionFilterBar
            trailing={(
              <>
                {filtersActive ? (
                  <Button
                    type="button"
                    variant="tertiary"
                    size="compact"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                ) : null}
                <ResultsCount>{outputCountLabel(filteredOutputs.length)}</ResultsCount>
              </>
            )}
          >
            <BrowserFilterSelect
              label="Output type"
              value={typeFilter}
              aria-label="Output type"
              onChange={(event) => setTypeFilter(event.target.value as OutputTypeFilter)}
            >
              <option value="all">All output types</option>
              <option value="chart">Chart</option>
              <option value="table">Table</option>
              <option value="report">Report</option>
              <option value="metric">Metric</option>
              <option value="analysis">Analysis</option>
              <option value="insight">Insight</option>
              <option value="comparison">Comparison</option>
              <option value="mixed">Mixed</option>
            </BrowserFilterSelect>

            <BrowserFilterSelect
              label="Conversation source"
              value={sourceFilter}
              aria-label="Conversation source"
              onChange={(event) => setSourceFilter(event.target.value as ConversationSourceFilter)}
            >
              <option value="all">All conversations</option>
              <option value="galaxy">Galaxy</option>
              <option value="constellation-chat">Constellation Chats</option>
            </BrowserFilterSelect>
          </CollectionFilterBar>
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
        <FilteredEmptyState
          title="No matching outputs"
          onClear={filtersActive ? clearFilters : undefined}
        />
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
                  style={{ color: "var(--luxia-purple-70)" }}
                >
                  {item.name}
                </h2>
                <p
                  className="truncate luxia-type-caption"
                  style={{ color: "var(--luxia-neutral-600, #475569)" }}
                >
                  {outputTypeLabel(item.outputType)} · {item.sourceContext}
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
