import { useMemo, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { ExternalLink, Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageBody, LuxiaPageFrame } from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  BrowserFilterSelect,
  FilteredEmptyState,
  FilterToolbar,
  ResultsCount,
} from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { LuxiaPipelineIcon } from "@/assets/icons";
import {
  formatPipelineLastRunExact,
  formatPipelineLastRunRelative,
  pipelineStatusBadgeVariant,
} from "./format";
import { PIPELINES_LIST_CONTENT_MAX_WIDTH_CLASS } from "./pipelinesLayout";
import type { PipelineStatus, ProjectPipelineRecord } from "./types";
import { PIPELINE_STATUS_LABELS } from "./types";

const SURFACE = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

/**
 * Shared collector column tracks — header and rows use the same CSS variable.
 * Visual targets ≈ Pipeline 48% | Status 12% | Last run 16% | Schedule 20% | docs 4%.
 */
const PIPELINES_COLLECTOR_COLS =
  "minmax(0, 4.8fr) minmax(5.5rem, 1.2fr) minmax(6.25rem, 1.6fr) minmax(7.25rem, 2fr) 2.5rem";

/** Cap search so it stays a primary control without stretching across ultra-wide viewports. */
const SEARCH_MAX_WIDTH_CLASS = "max-w-xl";

const PIPELINES_GUIDANCE =
  "Pipelines keep this Project’s connected data up to date.";

type StatusFilter = "all" | PipelineStatus;

export interface PipelinesPageProps {
  projectId: string;
  projectName: string;
  pipelines: ProjectPipelineRecord[];
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenPipeline: (pipelineId: string) => void;
}

export function PipelinesPage({
  projectId,
  projectName,
  pipelines,
  onNavigateHome,
  onOpenProject,
  onOpenPipeline,
}: PipelinesPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "project",
      label: projectName,
      destination: { kind: "project", projectId },
    },
    {
      id: "pipelines",
      label: "Pipelines",
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onProject: onOpenProject,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pipelines.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q)
        || item.dagId.toLowerCase().includes(q)
        || item.scheduleLabel.toLowerCase().includes(q)
      );
    });
  }, [pipelines, query, statusFilter]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
  }

  const hasActiveFilters = Boolean(query.trim()) || statusFilter !== "all";

  return (
    <LuxiaPageFrame variant="standard">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="PROJECT EXPERIENCE"
        title="Pipelines"
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={PIPELINES_GUIDANCE}
      />

      <LuxiaPageBody>
        <div
          className={`w-full min-w-0 ${PIPELINES_LIST_CONTENT_MAX_WIDTH_CLASS}`}
        >
          {pipelines.length === 0 ? (
            <div
              className="rounded-[var(--luxia-radius-16)] border bg-white px-5 py-12 text-center"
              style={{ borderColor: "var(--luxia-border-default)" }}
              role="status"
            >
              <span
                className="mx-auto mb-3 inline-flex size-10 items-center justify-center rounded-[10px]"
                style={{
                  color: "var(--luxia-purple-60)",
                  background: "var(--luxia-opacity-purple-08)",
                }}
                aria-hidden
              >
                <LuxiaPipelineIcon size={18} color="currentColor" />
              </span>
              <p
                className="luxia-type-body-dense-strong"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                No pipelines available
              </p>
              <p
                className="mx-auto mt-1 max-w-md luxia-type-body-dense"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                Pipelines assigned to this Project will appear here.
              </p>
            </div>
          ) : (
            <>
              <FilterToolbar>
                <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                  <label
                    className={`block min-w-0 w-full flex-1 ${SEARCH_MAX_WIDTH_CLASS}`}
                  >
                    <span className="sr-only">Search Pipelines</span>
                    <div className="relative">
                      <Search
                        size={16}
                        strokeWidth={1.75}
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                        style={{ color: "var(--luxia-text-muted)" }}
                      />
                      <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by name, ID, or schedule"
                        aria-label="Search Pipelines"
                        className="h-10 w-full pl-9"
                        style={{
                          background: HS.searchBg,
                          borderColor: HS.searchBorder,
                        }}
                      />
                    </div>
                  </label>
                  <BrowserFilterSelect
                    label="Status"
                    labelVisible={false}
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="w-full shrink-0 sm:w-[10.5rem]"
                    selectClassName="min-w-0 max-w-full"
                    selectStyle={{ height: "2.5rem" }}
                  >
                    <option value="all">All statuses</option>
                    <option value="success">Success</option>
                    <option value="running">Running</option>
                    <option value="failed">Failed</option>
                    <option value="paused">Paused</option>
                  </BrowserFilterSelect>
                </div>
              </FilterToolbar>

              <div className="mt-3 space-y-1.5">
                <ResultsCount>
                  {filtered.length} pipeline{filtered.length === 1 ? "" : "s"}
                </ResultsCount>

                {filtered.length === 0 ? (
                  <FilteredEmptyState
                    title="No pipelines match"
                    description="Try another search term or status filter."
                    onClear={hasActiveFilters ? clearFilters : undefined}
                  />
                ) : (
                  <div
                    className={`overflow-x-auto ${SURFACE}`}
                    style={
                      {
                        ["--pipelines-collector-cols"]: PIPELINES_COLLECTOR_COLS,
                      } as CSSProperties
                    }
                  >
                    <div
                      className="hidden min-w-[40rem] gap-x-3 px-4 py-2 sm:grid sm:items-center sm:[grid-template-columns:var(--pipelines-collector-cols)]"
                      style={{
                        borderBottom:
                          "1px solid var(--luxia-settings-row-divider)",
                        background:
                          "var(--luxia-surface-subtle, var(--luxia-neutral-50, #F8FAFC))",
                        color: "var(--luxia-text-muted)",
                      }}
                      role="row"
                    >
                      <span className="luxia-type-caption" role="columnheader">
                        Pipeline
                      </span>
                      <span className="luxia-type-caption" role="columnheader">
                        Status
                      </span>
                      <span className="luxia-type-caption" role="columnheader">
                        Last run
                      </span>
                      <span className="luxia-type-caption" role="columnheader">
                        Schedule
                      </span>
                      <span className="sr-only" role="columnheader">
                        Documentation
                      </span>
                    </div>
                    <ul>
                      {filtered.map((item) => (
                        <PipelineRow
                          key={item.id}
                          item={item}
                          onOpen={() => onOpenPipeline(item.id)}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}

function PipelineRow({
  item,
  onOpen,
}: {
  item: ProjectPipelineRecord;
  onOpen: () => void;
}) {
  const relative = formatPipelineLastRunRelative(item.lastRunAt);
  const exact = formatPipelineLastRunExact(item.lastRunAt);
  const statusLabel = PIPELINE_STATUS_LABELS[item.status];

  function handleDocsClick(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
  }

  function handleDocsKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
    event.stopPropagation();
  }

  return (
    <li
      className="luxia-settings-row is-interactive"
      style={{ borderColor: "var(--luxia-settings-row-divider)" }}
    >
      <div className="relative sm:min-w-[40rem]">
        <button
          type="button"
          className="absolute inset-0 z-0 cursor-pointer outline-none focus-visible:bg-[var(--luxia-settings-hover-bg)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--luxia-border-focus)]"
          onClick={onOpen}
          aria-label={`Open pipeline ${item.name}, status ${statusLabel}`}
        />

        <div className="pointer-events-none relative z-[1] grid grid-cols-1 gap-2.5 px-4 py-2.5 sm:grid sm:items-center sm:gap-x-3 sm:[grid-template-columns:var(--pipelines-collector-cols)]">
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className="inline-flex shrink-0"
              style={{ color: "var(--luxia-purple-60)" }}
              aria-hidden
            >
              <LuxiaPipelineIcon size={16} color="currentColor" />
            </span>
            <span className="min-w-0">
              <span
                className="block truncate luxia-type-body-dense-strong"
                style={{ color: "var(--luxia-text-primary)" }}
                title={item.name}
              >
                {item.name}
              </span>
              <span
                className="mt-px block truncate luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
                title={item.dagId}
              >
                {item.dagId}
              </span>
            </span>
          </span>

          <span className="flex min-w-0 items-center gap-2 sm:justify-start">
            <span
              className="luxia-type-caption sm:hidden"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              Status
            </span>
            <Badge
              variant={pipelineStatusBadgeVariant(item.status)}
              className="pointer-events-none"
            >
              {statusLabel}
            </Badge>
          </span>

          <span className="flex min-w-0 items-center gap-2 sm:justify-start">
            <span
              className="luxia-type-caption sm:hidden"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              Last run
            </span>
            {exact ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="luxia-type-body-dense"
                    style={{
                      color:
                        item.status === "failed"
                          ? "var(--luxia-error-70)"
                          : "var(--luxia-text-secondary)",
                    }}
                    title={exact}
                  >
                    {relative}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{exact}</TooltipContent>
              </Tooltip>
            ) : (
              <span
                className="luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                {relative}
              </span>
            )}
          </span>

          <span className="flex min-w-0 items-center gap-2 sm:justify-start">
            <span
              className="luxia-type-caption sm:hidden"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              Schedule
            </span>
            <span
              className="block min-w-0 truncate luxia-type-body-dense"
              style={{ color: "var(--luxia-text-secondary)" }}
              title={item.scheduleLabel}
            >
              {item.scheduleLabel}
            </span>
          </span>

          {item.documentationUrl ? (
            <span className="pointer-events-auto flex justify-end sm:justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={item.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                    style={{ color: "var(--luxia-text-muted)" }}
                    aria-label={`View documentation for ${item.name}`}
                    onClick={handleDocsClick}
                    onKeyDown={handleDocsKeyDown}
                  >
                    <ExternalLink size={14} strokeWidth={2} aria-hidden />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="top">View documentation</TooltipContent>
              </Tooltip>
            </span>
          ) : (
            <span className="hidden size-7 sm:block" aria-hidden />
          )}
        </div>
      </div>
    </li>
  );
}
