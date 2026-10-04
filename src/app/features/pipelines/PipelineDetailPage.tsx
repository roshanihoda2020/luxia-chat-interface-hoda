import { ChevronRight, ExternalLink } from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
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
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { LuxiaPipelineIcon } from "@/assets/icons";
import {
  canUpdatePipelineVariables,
  getPipelineRunBlockReason,
  PIPELINE_PAUSED_RUN_MESSAGE,
  PIPELINE_TRIGGER_DENIED_MESSAGE,
} from "./access";
import {
  formatPipelineDuration,
  formatPipelineLastRunExact,
  formatPipelineLastRunRelative,
  formatPipelineRunLabel,
  pipelineStatusBadgeVariant,
} from "./format";
import {
  PipelineVariablesSection,
  type PipelineVariablesSectionHandle,
} from "./PipelineVariablesSection";
import { PipelineParentBackLink } from "./PipelineParentBackLink";
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
  PIPELINE_LATEST_SURFACE,
  PIPELINE_RECENT_RUNS_PREVIEW_COUNT,
  PIPELINE_RUNS_GROUP_CLASS,
  PIPELINE_SECTION_HEADER_GAP_CLASS,
  PIPELINE_SECTION_HELPER_CLASS,
  PIPELINE_SECTION_TITLE_CLASS,
  PIPELINE_STRUCTURED_LIST,
  PIPELINE_TABLE_HEADER_SURFACE,
  PIPELINE_TASK_SELECTED,
  PIPELINES_CONTENT_MAX_WIDTH_CLASS,
} from "./pipelinesLayout";

const SURFACE = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

const RECENT_RUNS_COLS =
  "minmax(0, 2.2fr) 6.75rem minmax(9rem, 1.5fr) 6.5rem 4.5rem 1.25rem";

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
  onRunPipeline: () => string | null;
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
  const [confirmRunUsesSavedOnly, setConfirmRunUsesSavedOnly] = useState(false);
  const [dirtyRunOpen, setDirtyRunOpen] = useState(false);
  const [variablesDirty, setVariablesDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [showAllRuns, setShowAllRuns] = useState(false);
  const pendingLeaveRef = useRef<(() => void) | null>(null);
  const variablesRef = useRef<PipelineVariablesSectionHandle>(null);

  const statusLabel = PIPELINE_STATUS_LABELS[pipeline.status];
  const lastRunRelative = formatPipelineLastRunRelative(pipeline.lastRunAt);
  const lastRunExact = formatPipelineLastRunExact(pipeline.lastRunAt);
  const latestRun = runs[0] ?? null;
  const lastRunFailed = latestRun?.status === "failed";
  const failedTaskHint =
    lastRunFailed && latestRun?.failedTaskCount && latestRun.failedTaskCount > 0
      ? `${latestRun.failedTaskCount} task${
          latestRun.failedTaskCount === 1 ? "" : "s"
        } failed`
      : null;

  const runBlockReason = getPipelineRunBlockReason(
    pipeline,
    projectRole,
    isOrgAdmin,
  );
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

  function requestRun() {
    if (runBlockReason) return;
    if (variablesDirty) {
      setDirtyRunOpen(true);
      return;
    }
    setConfirmRunUsesSavedOnly(false);
    setConfirmRun(true);
  }

  function startRun() {
    flushSync(() => {
      setConfirmRun(false);
      setConfirmRunUsesSavedOnly(false);
      setDirtyRunOpen(false);
    });
    onRunPipeline();
  }

  function saveChangesAndRun() {
    const saved = variablesRef.current?.saveChanged() ?? false;
    if (!saved) return;
    // Unmount dirty-run confirmation before trigger — no second Run dialog.
    flushSync(() => {
      setDirtyRunOpen(false);
      setConfirmRun(false);
      setConfirmRunUsesSavedOnly(false);
    });
    onRunPipeline();
  }

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

  const runDisabledMessage =
    runBlockReason === "paused"
      ? PIPELINE_PAUSED_RUN_MESSAGE
      : runBlockReason === "permission"
        ? PIPELINE_TRIGGER_DENIED_MESSAGE
        : null;

  const runPrimaryAction =
    runBlockReason === null ? (
      <Button
        type="button"
        {...LUXIA_PAGE_HEADER_ACTION.primary}
        onClick={requestRun}
      >
        Run pipeline
      </Button>
    ) : (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.primary}
              disabled
              aria-disabled
            >
              Run pipeline
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[16rem]">
          {runDisabledMessage}
        </TooltipContent>
      </Tooltip>
    );

  return (
    <LuxiaPageFrame variant="standard">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="PIPELINE"
        title={pipeline.name}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        context={
          pipeline.description?.trim() ? (
            <p
              className="min-w-0 luxia-type-body-small"
              style={{
                color: "var(--luxia-text-secondary)",
                maxWidth: "780px",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {pipeline.description.trim()}
            </p>
          ) : null
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
        primaryAction={runPrimaryAction}
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
                feedsConstellationName ? "sm:grid-cols-5" : "sm:grid-cols-4"
              }`}
            >
              <SummaryItem label="Pipeline status">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Badge variant={pipelineStatusBadgeVariant(pipeline.status)}>
                    {statusLabel}
                  </Badge>
                  {pipeline.status === "paused" ? (
                    <span
                      className="luxia-type-caption"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      Schedule paused
                    </span>
                  ) : null}
                </span>
              </SummaryItem>

              <SummaryItem label="Last run">
                <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
                  {lastRunExact ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="luxia-type-body-dense-strong"
                          style={{ color: "var(--luxia-text-primary)" }}
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
                  {lastRunFailed ? (
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      {pipeline.status !== "failed" ? (
                        <Badge variant={pipelineStatusBadgeVariant("failed")}>
                          Failed
                        </Badge>
                      ) : null}
                      {failedTaskHint ? (
                        <span
                          className="luxia-type-caption"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          {failedTaskHint}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </span>
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

              <SummaryItem label="DAG ID">
                <span
                  className="min-w-0 max-w-full truncate font-mono luxia-type-caption"
                  style={{ color: "var(--luxia-text-muted)" }}
                  title={pipeline.dagId}
                >
                  {pipeline.dagId}
                </span>
              </SummaryItem>
            </div>
          </section>

          <div
            className={PIPELINE_RUNS_GROUP_CLASS}
            role="group"
            aria-label="Pipeline runs"
          >
            <section aria-labelledby="pipeline-recent-runs-heading">
              <div
                className={`${PIPELINE_SECTION_HEADER_GAP_CLASS} flex items-baseline justify-between gap-3`}
              >
                <h2
                  id="pipeline-recent-runs-heading"
                  className={PIPELINE_SECTION_TITLE_CLASS}
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
                      boxShadow: PIPELINE_TASK_SELECTED.panelElevation,
                    } as CSSProperties
                  }
                >
                  <div
                    className={`${PIPELINE_STRUCTURED_LIST.headerClass} min-w-[44rem] sm:[grid-template-columns:var(--pipelines-recent-runs-cols)]`}
                    style={{
                      borderBottom: PIPELINE_STRUCTURED_LIST.headerBorder,
                      background: PIPELINE_TABLE_HEADER_SURFACE,
                      color: "var(--luxia-text-muted)",
                    }}
                    role="row"
                  >
                    {(
                      [
                        "Run",
                        "Status",
                        "Started",
                        "Duration",
                        "Tasks",
                      ] as const
                    ).map((label) => (
                      <span
                        key={label}
                        className={PIPELINE_STRUCTURED_LIST.headerLabelClass}
                        role="columnheader"
                      >
                        {label}
                      </span>
                    ))}
                    <span className="sr-only" role="columnheader">
                      Open
                    </span>
                  </div>
                  <ul className={PIPELINE_STRUCTURED_LIST.bodyClass}>
                    {visibleRuns.map((run, index) => (
                      <RunRow
                        key={run.id}
                        run={run}
                        isLatest={index === 0}
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
              <div className={PIPELINE_SECTION_HEADER_GAP_CLASS}>
                <h2
                  id="pipeline-run-history-heading"
                  className={PIPELINE_SECTION_TITLE_CLASS}
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  Run history
                </h2>
                <p
                  className={PIPELINE_SECTION_HELPER_CLASS}
                  style={{ color: "var(--luxia-text-secondary)" }}
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
            <div className={PIPELINE_SECTION_HEADER_GAP_CLASS}>
              <h2
                id="pipeline-variables-heading"
                className={PIPELINE_SECTION_TITLE_CLASS}
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Variables
              </h2>
              <p
                className={PIPELINE_SECTION_HELPER_CLASS}
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Changes apply to future runs only.
              </p>
            </div>
            <PipelineVariablesSection
              ref={variablesRef}
              variables={variables}
              canEdit={canEditVariables}
              onSave={onSaveVariables}
              onDirtyChange={setVariablesDirty}
            />
          </section>

          <div className="pt-2">
            <PipelineParentBackLink
              parentLabel="Pipelines"
              onNavigate={() =>
                requestLeave(() => onOpenPipelines(projectId))
              }
            />
          </div>
        </div>
      </LuxiaPageBody>

      {dirtyRunOpen ? (
        <AlertDialog
          open
          onOpenChange={(open) => {
            setDirtyRunOpen(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved variable changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved variable changes. Save them before starting the
                pipeline to use the new values.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  saveChangesAndRun();
                }}
              >
                Save changes and run
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  flushSync(() => {
                    setDirtyRunOpen(false);
                  });
                  setConfirmRunUsesSavedOnly(true);
                  setConfirmRun(true);
                }}
              >
                Run with saved values
              </Button>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {confirmRun ? (
        <AlertDialog
          open
          onOpenChange={(open) => {
            setConfirmRun(open);
            if (!open) setConfirmRunUsesSavedOnly(false);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Run {pipeline.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmRunUsesSavedOnly
                  ? "This will start a new run using the last saved variable values. Your unsaved edits on this page will not be used for this run."
                  : "This will start a new run using the pipeline’s current configuration."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button type="button" variant="primary" onClick={startRun}>
                Run pipeline
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

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
  isLatest,
  onOpen,
}: {
  run: PipelineRunRecord;
  isLatest: boolean;
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
  const idleBackground = isLatest
    ? PIPELINE_LATEST_SURFACE
    : PIPELINE_TASK_SELECTED.rowIdle;

  return (
    <li>
      <button
        type="button"
        className={`grid w-full min-w-[44rem] cursor-pointer grid-cols-1 gap-2.5 text-left focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] focus-visible:ring-offset-1 sm:grid sm:items-center sm:gap-x-3 sm:[grid-template-columns:var(--pipelines-recent-runs-cols)] ${PIPELINE_STRUCTURED_LIST.rowClass}`}
        style={{
          borderColor: PIPELINE_STRUCTURED_LIST.rowBorderIdle,
          background: idleBackground,
          boxShadow: "none",
        }}
        onClick={onOpen}
        aria-label={`Open run started ${runLabel}, status ${statusLabel}${
          isLatest ? ", latest" : ""
        }`}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = PIPELINE_TASK_SELECTED.rowHover;
          event.currentTarget.style.borderColor =
            PIPELINE_STRUCTURED_LIST.rowBorderHover;
          event.currentTarget.style.boxShadow =
            PIPELINE_TASK_SELECTED.rowElevation;
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = idleBackground;
          event.currentTarget.style.borderColor =
            PIPELINE_STRUCTURED_LIST.rowBorderIdle;
          event.currentTarget.style.boxShadow = "none";
        }}
      >
        <span className="min-w-0">
          <span className="flex min-w-0 items-baseline gap-2">
            <span
              className="block truncate luxia-type-body-dense-strong"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              {runLabel}
            </span>
            {isLatest ? (
              <span
                className="shrink-0 luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                Latest
              </span>
            ) : null}
          </span>
          {failedHint ? (
            <span
              className="mt-0.5 block luxia-type-caption"
              style={{ color: "var(--luxia-text-secondary)" }}
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
            className="tabular-nums luxia-type-body-dense"
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
            className="tabular-nums luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            {run.taskCount}
          </span>
        </span>

        <span
          className="hidden items-center justify-end sm:flex"
          style={{ color: "var(--luxia-text-muted)" }}
          aria-hidden
        >
          <ChevronRight size={16} strokeWidth={2} />
        </span>
      </button>
    </li>
  );
}
