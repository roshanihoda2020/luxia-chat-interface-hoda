import { ExternalLink } from "lucide-react";
import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import {
  LuxiaPageHeader,
  LUXIA_PAGE_HEADER_ACTION,
} from "@/app/components/LuxiaPageHeader";
import { LuxiaPageBody, LuxiaPageFrame } from "@/app/components/LuxiaPageFrame";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import type { ProjectRole } from "@/app/features/permissions/types";
import { HS } from "@/app/features/home/homeSurfaces";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { LuxiaPipelineIcon } from "@/assets/icons";
import { canTriggerPipeline, canUpdatePipelineVariables } from "./access";
import {
  formatPipelineDuration,
  formatPipelineLastRunExact,
  formatPipelineLastRunRelative,
  formatPipelineRunLabel,
  pipelineStatusBadgeVariant,
} from "./format";
import { PipelineVariablesSection } from "./PipelineVariablesSection";
import { PipelineRunHistory } from "./PipelineRunHistory";
import type {
  PipelineRunRecord,
  PipelineTaskRecord,
  PipelineVariableRecord,
  ProjectPipelineRecord,
} from "./types";
import {
  PIPELINE_RUN_STATUS_LABELS,
  PIPELINE_STATUS_LABELS,
} from "./types";
import {
  PIPELINE_RECENT_RUNS_PREVIEW_COUNT,
  PIPELINE_RUNS_GROUP_CLASS,
  PIPELINES_CONTENT_MAX_WIDTH_CLASS,
} from "./pipelinesLayout";

const SURFACE = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

/**
 * Recent Runs column tracks — Run dominant, Status/Duration/Tasks compact.
 * Run | Status | Started | Duration | Tasks
 */
const RECENT_RUNS_COLS =
  "minmax(0, 2.2fr) 6.5rem minmax(9rem, 1.5fr) 6.5rem 4.5rem";

export interface PipelineDetailPageProps {
  projectId: string;
  projectName: string;
  pipeline: ProjectPipelineRecord;
  runs: PipelineRunRecord[];
  tasks: PipelineTaskRecord[];
  variables: PipelineVariableRecord[];
  feedsConstellationName?: string | null;
  projectRole: ProjectRole | null;
  isOrgAdmin: boolean;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenPipelines: (projectId: string) => void;
  onOpenRun: (runId: string, taskKey?: string) => void;
  onRunPipeline: () => void;
  onSaveVariables: (next: PipelineVariableRecord[]) => void;
}

export function PipelineDetailPage({
  projectId,
  projectName,
  pipeline,
  runs,
  tasks,
  variables,
  feedsConstellationName,
  projectRole,
  isOrgAdmin,
  onNavigateHome,
  onOpenProject,
  onOpenPipelines,
  onOpenRun,
  onRunPipeline,
  onSaveVariables,
}: PipelineDetailPageProps) {
  const [confirmRun, setConfirmRun] = useState(false);
  const [variablesDirty, setVariablesDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [showAllRuns, setShowAllRuns] = useState(false);
  const pendingLeaveRef = useRef<(() => void) | null>(null);

  const statusLabel = PIPELINE_STATUS_LABELS[pipeline.status];
  const lastRunRelative = formatPipelineLastRunRelative(pipeline.lastRunAt);
  const lastRunExact = formatPipelineLastRunExact(pipeline.lastRunAt);
  const latestFailed =
    pipeline.status === "failed"
      ? runs.find((run) => run.status === "failed")
      : undefined;
  const failedTaskHint =
    latestFailed?.failedTaskCount && latestFailed.failedTaskCount > 0
      ? `${latestFailed.failedTaskCount} task${
          latestFailed.failedTaskCount === 1 ? "" : "s"
        } failed`
      : null;

  const canRun = canTriggerPipeline(pipeline, projectRole, isOrgAdmin);
  const canEditVariables = canUpdatePipelineVariables(
    pipeline,
    projectRole,
    isOrgAdmin,
  );

  const canExpandRuns = runs.length > PIPELINE_RECENT_RUNS_PREVIEW_COUNT;
  const visibleRuns = showAllRuns
    ? runs
    : runs.slice(0, PIPELINE_RECENT_RUNS_PREVIEW_COUNT);

  const requestLeave = useCallback(
    (action: () => void) => {
      if (!variablesDirty) {
        action();
        return;
      }
      pendingLeaveRef.current = action;
      setLeaveOpen(true);
    },
    [variablesDirty],
  );

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
      destination: { kind: "pipelines", projectId },
    },
    {
      id: "pipeline",
      label: pipeline.name,
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: () => requestLeave(onNavigateHome),
    onProject: (pid) => requestLeave(() => onOpenProject(pid)),
    onPipelines: (pid) => requestLeave(() => onOpenPipelines(pid)),
  };

  return (
    <LuxiaPageFrame variant="standard">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="PIPELINE"
        title={
          <div className="min-w-0 max-w-full">
            <h1
              className="min-w-0 luxia-type-title-page"
              style={{
                color: HS.sectionHeading,
                overflowWrap: "anywhere",
              }}
              title={pipeline.name}
            >
              {pipeline.name}
            </h1>
            <p
              className="mt-1 min-w-0 max-w-full truncate luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)" }}
              title={pipeline.dagId}
            >
              {pipeline.dagId}
            </p>
          </div>
        }
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        secondaryAction={
          pipeline.documentationUrl ? (
            <Button asChild {...LUXIA_PAGE_HEADER_ACTION.secondary}>
              <a
                href={pipeline.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View documentation
                <ExternalLink size={14} strokeWidth={2} aria-hidden />
              </a>
            </Button>
          ) : null
        }
        primaryAction={
          canRun ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.primary}
              onClick={() => setConfirmRun(true)}
            >
              Run pipeline
            </Button>
          ) : null
        }
      />

      <LuxiaPageBody>
        <div
          className={`w-full min-w-0 space-y-8 ${PIPELINES_CONTENT_MAX_WIDTH_CLASS}`}
        >
          <section
            aria-label="Pipeline summary"
            className="rounded-[var(--luxia-radius-16)] border bg-white px-5 py-3.5"
            style={{ borderColor: "var(--luxia-border-default)" }}
          >
            <div
              className={`grid grid-cols-2 gap-x-6 gap-y-3 ${
                feedsConstellationName ? "sm:grid-cols-4" : "sm:grid-cols-3"
              }`}
            >
              <SummaryItem label="Status">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Badge variant={pipelineStatusBadgeVariant(pipeline.status)}>
                    {statusLabel}
                  </Badge>
                  {failedTaskHint ? (
                    <span
                      className="luxia-type-caption"
                      style={{ color: "var(--luxia-error-70)" }}
                    >
                      {failedTaskHint}
                    </span>
                  ) : null}
                </span>
              </SummaryItem>

              <SummaryItem label="Last run">
                {lastRunExact ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="luxia-type-body-dense-strong"
                        style={{
                          color:
                            pipeline.status === "failed"
                              ? "var(--luxia-error-70)"
                              : "var(--luxia-text-primary)",
                        }}
                        tabIndex={0}
                      >
                        {lastRunRelative}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{lastRunExact}</TooltipContent>
                  </Tooltip>
                ) : (
                  <span
                    className="luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {lastRunRelative}
                  </span>
                )}
              </SummaryItem>

              <SummaryItem label="Schedule">
                <span
                  className="luxia-type-body-dense-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  {pipeline.scheduleLabel}
                </span>
              </SummaryItem>

              {feedsConstellationName ? (
                <SummaryItem label="Feeds">
                  <span
                    className="luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {feedsConstellationName}
                  </span>
                </SummaryItem>
              ) : null}
            </div>
          </section>

          <div
            className={PIPELINE_RUNS_GROUP_CLASS}
            role="group"
            aria-label="Pipeline runs"
          >
            <section aria-labelledby="pipeline-recent-runs-heading">
              <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <h2
                  id="pipeline-recent-runs-heading"
                  className="luxia-type-title-section"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  Recent runs
                </h2>
                {canExpandRuns ? (
                  <Button
                    type="button"
                    variant="tertiary"
                    size="compact"
                    className="h-auto px-0 py-0 luxia-type-body-dense"
                    onClick={() => setShowAllRuns((prev) => !prev)}
                    aria-expanded={showAllRuns}
                  >
                    {showAllRuns ? "Show fewer runs" : "View all runs"}
                  </Button>
                ) : null}
              </div>

              {runs.length === 0 ? (
                <div
                  className="w-full rounded-[var(--luxia-radius-16)] border bg-white px-5 py-10 text-center"
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
                    No runs yet
                  </p>
                  <p
                    className="mx-auto mt-1 max-w-md luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    This pipeline has not run yet.
                  </p>
                </div>
              ) : (
                <div
                  className={`overflow-x-auto ${SURFACE}`}
                  style={
                    {
                      ["--pipelines-recent-runs-cols"]: RECENT_RUNS_COLS,
                    } as CSSProperties
                  }
                >
                  <div
                    className="hidden min-w-[40rem] gap-x-3 px-4 py-2 sm:grid sm:items-center sm:[grid-template-columns:var(--pipelines-recent-runs-cols)]"
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
                      Run
                    </span>
                    <span className="luxia-type-caption" role="columnheader">
                      Status
                    </span>
                    <span className="luxia-type-caption" role="columnheader">
                      Started
                    </span>
                    <span className="luxia-type-caption" role="columnheader">
                      Duration
                    </span>
                    <span className="luxia-type-caption" role="columnheader">
                      Tasks
                    </span>
                  </div>
                  <ul>
                    {visibleRuns.map((run) => (
                      <RunRow
                        key={run.id}
                        run={run}
                        onOpen={() =>
                          requestLeave(() => onOpenRun(run.id))
                        }
                      />
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section aria-labelledby="pipeline-run-history-heading">
              <div className="mb-2.5">
                <h2
                  id="pipeline-run-history-heading"
                  className="luxia-type-title-section"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  Run history
                </h2>
                <p
                  className="mt-0.5 luxia-type-caption"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  How tasks behaved across recent executions
                </p>
              </div>
              <PipelineRunHistory
                runs={runs}
                tasks={tasks}
                onOpenRun={(runId, taskKey) =>
                  requestLeave(() => onOpenRun(runId, taskKey))
                }
              />
            </section>
          </div>

          <section aria-labelledby="pipeline-variables-heading">
            <div className="mb-2.5">
              <h2
                id="pipeline-variables-heading"
                className="luxia-type-title-section"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Variables
              </h2>
              <p
                className="mt-0.5 luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                Changes apply to future runs only.
              </p>
            </div>
            <PipelineVariablesSection
              variables={variables}
              canEdit={canEditVariables}
              onSave={onSaveVariables}
              onDirtyChange={setVariablesDirty}
            />
          </section>
        </div>
      </LuxiaPageBody>

      <AlertDialog open={confirmRun} onOpenChange={setConfirmRun}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run {pipeline.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will start a new run using the pipeline’s current
              configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmRun(false);
                onRunPipeline();
              }}
            >
              Run pipeline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={leaveOpen}
        onOpenChange={(open) => {
          setLeaveOpen(open);
          if (!open) pendingLeaveRef.current = null;
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to this pipeline’s variables.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = pendingLeaveRef.current;
                pendingLeaveRef.current = null;
                setLeaveOpen(false);
                // Navigate away immediately; unmount discards the draft.
                action?.();
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LuxiaPageFrame>
  );
}

function SummaryItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p
        className="mb-0.5 luxia-type-caption"
        style={{ color: "var(--luxia-text-muted)" }}
      >
        {label}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function RunRow({
  run,
  onOpen,
}: {
  run: PipelineRunRecord;
  onOpen: () => void;
}) {
  const statusLabel = PIPELINE_RUN_STATUS_LABELS[run.status];
  const runLabel = formatPipelineRunLabel(run.startedAt);
  const startedExact = formatPipelineLastRunExact(run.startedAt);
  const failedHint =
    run.status === "failed" && run.failedTaskCount && run.failedTaskCount > 0
      ? `${run.failedTaskCount} failed task${
          run.failedTaskCount === 1 ? "" : "s"
        }`
      : null;

  return (
    <li
      className="luxia-settings-row is-interactive"
      style={{ borderColor: "var(--luxia-settings-row-divider)" }}
    >
      <button
        type="button"
        className="grid w-full min-w-[40rem] cursor-pointer grid-cols-1 gap-2.5 px-4 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--luxia-border-focus)] sm:grid sm:items-center sm:gap-x-3 sm:[grid-template-columns:var(--pipelines-recent-runs-cols)]"
        onClick={onOpen}
        aria-label={`Open run started ${runLabel}, status ${statusLabel}`}
      >
        <span className="min-w-0">
          <span
            className="block truncate luxia-type-body-dense-strong"
            style={{ color: "var(--luxia-text-primary)" }}
          >
            {runLabel}
          </span>
          {failedHint ? (
            <span
              className="mt-px block luxia-type-caption"
              style={{ color: "var(--luxia-error-70)" }}
            >
              {failedHint}
            </span>
          ) : null}
        </span>

        <span className="flex items-center gap-2 sm:justify-start">
          <span
            className="luxia-type-caption sm:hidden"
            style={{ color: "var(--luxia-text-muted)" }}
          >
            Status
          </span>
          <Badge
            variant={pipelineStatusBadgeVariant(run.status)}
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
            Started
          </span>
          <span
            className="truncate luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            {startedExact ?? "—"}
          </span>
        </span>

        <span className="flex items-center gap-2 sm:justify-start">
          <span
            className="luxia-type-caption sm:hidden"
            style={{ color: "var(--luxia-text-muted)" }}
          >
            Duration
          </span>
          <span
            className="luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            {formatPipelineDuration(run.durationSeconds)}
          </span>
        </span>

        <span className="flex items-center gap-2 sm:justify-start">
          <span
            className="luxia-type-caption sm:hidden"
            style={{ color: "var(--luxia-text-muted)" }}
          >
            Tasks
          </span>
          <span
            className="luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            {run.taskCount}
          </span>
        </span>
      </button>
    </li>
  );
}
