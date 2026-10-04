import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageBody, LuxiaPageFrame } from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { HS } from "@/app/features/home/homeSurfaces";
import type { ProjectRole } from "@/app/features/permissions/types";
import {
  canRetryFailedTask,
  isRetryableTaskStatus,
  PIPELINE_RETRY_DENIED_MESSAGE,
} from "./access";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  formatPipelineDuration,
  formatPipelineLastRunExact,
  formatPipelineRunBreadcrumbLabel,
  formatPipelineRunPageTitle,
  formatTaskDuration,
  formatTaskStatusLabel,
  pipelineStatusBadgeVariant,
  pipelineTaskStatusBadgeClass,
} from "./format";
import {
  countDownstreamBlockedTasks,
  formatFailureImpact,
} from "./runHistory";
import { PipelineParentBackLink } from "./PipelineParentBackLink";
import { TaskFlowGraph } from "./TaskFlowGraph";
import { PipelineTaskStatusBadgeIcon } from "./taskStatusIcons";
import type {
  PipelineRunRecord,
  PipelineTaskRecord,
  ProjectPipelineRecord,
} from "./types";
import { PIPELINE_RUN_STATUS_LABELS } from "./types";
import {
  PIPELINE_SECTION_HEADER_GAP_CLASS,
  PIPELINE_SECTION_TITLE_CLASS,
  PIPELINE_SUMMARY_MAX_WIDTH_CLASS,
  PIPELINE_TASK_SELECTED,
} from "./pipelinesLayout";
import {
  resolveTaskTypeIcon,
  taskFlowNodeVisual,
  taskFlowSelectedVisual,
} from "./taskFlowNodeVisuals";

export interface PipelineRunDetailPageProps {
  projectId: string;
  projectName: string;
  pipeline: ProjectPipelineRecord;
  run: PipelineRunRecord;
  initialSelectedTaskKey?: string | null;
  tasks: PipelineTaskRecord[];
  projectRole: ProjectRole | null;
  isOrgAdmin: boolean;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenPipelines: (projectId: string) => void;
  onOpenPipeline: (pipelineId: string) => void;
  onRetryTask: (taskId: string) => void;
}

function resolveInitialTaskId(
  tasks: PipelineTaskRecord[],
  initialSelectedTaskKey?: string | null,
): string | null {
  if (initialSelectedTaskKey) {
    const focused = tasks.find((task) => task.taskKey === initialSelectedTaskKey);
    if (focused) return focused.id;
  }
  return tasks.find((task) => task.status === "failed")?.id ?? tasks[0]?.id ?? null;
}

export function PipelineRunDetailPage({
  projectId,
  projectName,
  pipeline,
  run,
  tasks,
  initialSelectedTaskKey = null,
  projectRole,
  isOrgAdmin,
  onNavigateHome,
  onOpenProject,
  onOpenPipelines,
  onOpenPipeline,
  onRetryTask,
}: PipelineRunDetailPageProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() =>
    resolveInitialTaskId(tasks, initialSelectedTaskKey),
  );
  const [retryTaskId, setRetryTaskId] = useState<string | null>(null);
  const taskListRef = useRef<HTMLUListElement>(null);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const failureImpact = useMemo(() => {
    if (!selectedTask || selectedTask.status !== "failed") return null;
    return formatFailureImpact(
      countDownstreamBlockedTasks(tasks, selectedTask.taskKey),
    );
  }, [selectedTask, tasks]);

  const failedCount = tasks.filter((task) => task.status === "failed").length;
  const statusLabel = PIPELINE_RUN_STATUS_LABELS[run.status];
  const startedExact = formatPipelineLastRunExact(run.startedAt);
  const runTitle = formatPipelineRunPageTitle(run.startedAt);
  const runCrumb = formatPipelineRunBreadcrumbLabel();
  const retryTarget = retryTaskId
    ? tasks.find((task) => task.id === retryTaskId) ?? null
    : null;

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
      destination: { kind: "pipeline", projectId, pipelineId: pipeline.id },
    },
    {
      id: "run",
      label: runCrumb,
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onProject: onOpenProject,
    onPipelines: onOpenPipelines,
    onPipeline: (_pid, pipelineId) => onOpenPipeline(pipelineId),
  };

  const selectedTaskRetryable =
    selectedTask != null && isRetryableTaskStatus(selectedTask.status);
  const canRetrySelected =
    selectedTaskRetryable
    && canRetryFailedTask(
      pipeline,
      selectedTask!.status,
      projectRole,
      isOrgAdmin,
    );
  const retryDeniedSelected =
    selectedTaskRetryable && !canRetrySelected;

  useEffect(() => {
    if (!selectedTaskId || !taskListRef.current) return;
    const row = taskListRef.current.querySelector(
      `[data-pipeline-task-id="${selectedTaskId}"]`,
    );
    row?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [selectedTaskId]);

  return (
    <LuxiaPageFrame variant="standard">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="PIPELINE RUN"
        title={
          <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1
              className="min-w-0 luxia-type-title-page"
              style={{
                color: HS.sectionHeading,
                overflowWrap: "anywhere",
              }}
              title={runTitle}
            >
              {runTitle}
            </h1>
            <Badge variant={pipelineStatusBadgeVariant(run.status)}>
              {statusLabel}
            </Badge>
          </div>
        }
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
      />

      <LuxiaPageBody>
        <div className="space-y-8">
          <section
            aria-labelledby="run-summary-heading"
            className={PIPELINE_SUMMARY_MAX_WIDTH_CLASS}
          >
            <h2
              id="run-summary-heading"
              className="mb-2.5 luxia-type-caption"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              Run summary
            </h2>
            <div
              className="rounded-[var(--luxia-radius-12)] border bg-white px-5 py-3.5"
              style={{ borderColor: "var(--luxia-border-default)" }}
            >
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
                <SummaryCell label="Pipeline">
                  <button
                    type="button"
                    className="block max-w-full truncate text-left luxia-type-body-dense-strong outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                    style={{ color: "var(--luxia-text-primary)" }}
                    onClick={() => onOpenPipeline(pipeline.id)}
                    title={pipeline.name}
                  >
                    {pipeline.name}
                  </button>
                </SummaryCell>
                <SummaryCell label="Status">
                  <Badge variant={pipelineStatusBadgeVariant(run.status)}>
                    {statusLabel}
                  </Badge>
                </SummaryCell>
                <SummaryCell label="Started">
                  <span
                    className="luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {startedExact ?? "—"}
                  </span>
                </SummaryCell>
                <SummaryCell label="Duration">
                  <span
                    className="luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {run.durationSeconds != null
                      ? formatPipelineDuration(run.durationSeconds)
                      : run.status === "running"
                        ? "In progress"
                        : "—"}
                  </span>
                </SummaryCell>
                <SummaryCell label="Tasks">
                  <span
                    className="luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {run.taskCount} total
                    {failedCount > 0
                      ? ` · ${failedCount} failed task${
                          failedCount === 1 ? "" : "s"
                        }`
                      : ""}
                  </span>
                </SummaryCell>
              </div>
            </div>
          </section>

          <section aria-labelledby="task-flow-heading">
            <h2
              id="task-flow-heading"
              className={`${PIPELINE_SECTION_HEADER_GAP_CLASS} ${PIPELINE_SECTION_TITLE_CLASS}`}
              style={{ color: "var(--luxia-text-primary)" }}
            >
              Task flow
            </h2>
            <TaskFlowGraph
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.55fr)_minmax(16rem,1fr)] lg:items-start">
            <section aria-labelledby="task-list-heading" className="min-w-0">
              <h2
                id="task-list-heading"
                className={`${PIPELINE_SECTION_HEADER_GAP_CLASS} ${PIPELINE_SECTION_TITLE_CLASS}`}
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Tasks
              </h2>
              <div
                className="rounded-[var(--luxia-radius-12)] border p-2.5 sm:p-3"
                style={{
                  borderColor: "var(--luxia-border-default)",
                  background:
                    "color-mix(in srgb, var(--luxia-neutral-50) 45%, var(--luxia-surface))",
                  boxShadow: PIPELINE_TASK_SELECTED.panelElevation,
                }}
              >
                <ul ref={taskListRef} className="m-0 flex list-none flex-col gap-2 p-0">
                  {tasks.map((task) => {
                    const selected = task.id === selectedTaskId;
                    const durationLabel = formatTaskDuration(
                      task.durationSeconds,
                      task.status,
                    );
                    const TaskTypeIcon = resolveTaskTypeIcon(
                      task.taskKey,
                      task.name,
                    );
                    const visual = taskFlowNodeVisual(task.status);
                    const selectedVisual = taskFlowSelectedVisual(task.status);
                    return (
                      <li key={task.id}>
                        <button
                          type="button"
                          data-pipeline-task-id={task.id}
                          className="flex w-full items-center justify-between gap-3 rounded-[10px] border px-3.5 py-3 text-left outline-none transition-[background-color,border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] focus-visible:ring-offset-1 sm:px-4"
                          style={{
                            borderColor: selected
                              ? selectedVisual.border
                              : "var(--luxia-border-default)",
                            background: selected
                              ? selectedVisual.background
                              : PIPELINE_TASK_SELECTED.rowIdle,
                            boxShadow: selected
                              ? PIPELINE_TASK_SELECTED.rowElevation
                              : "none",
                          }}
                          onClick={() => setSelectedTaskId(task.id)}
                          aria-pressed={selected}
                          onMouseEnter={(event) => {
                            if (selected) return;
                            event.currentTarget.style.background =
                              PIPELINE_TASK_SELECTED.rowHover;
                            event.currentTarget.style.borderColor =
                              "var(--luxia-border-strong)";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.background = selected
                              ? selectedVisual.background
                              : PIPELINE_TASK_SELECTED.rowIdle;
                            event.currentTarget.style.borderColor = selected
                              ? selectedVisual.border
                              : "var(--luxia-border-default)";
                          }}
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-3">
                            <span
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px]"
                              style={{
                                background: visual.iconSurface,
                                color: visual.iconColor,
                              }}
                              aria-hidden
                            >
                              <TaskTypeIcon size={15} strokeWidth={2} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className="block truncate luxia-type-body-dense-strong"
                                style={{
                                  color: "var(--luxia-text-primary)",
                                  fontWeight: selected ? 700 : 600,
                                }}
                              >
                                {task.name}
                              </span>
                              <span
                                className="mt-0.5 block luxia-type-caption"
                                style={{
                                  color: "var(--luxia-text-secondary)",
                                }}
                              >
                                Attempt {task.attempt}
                                {durationLabel !== "—"
                                  ? ` · ${durationLabel}`
                                  : ""}
                              </span>
                            </span>
                          </span>
                          <Badge
                            variant={pipelineStatusBadgeVariant(task.status)}
                            className={`shrink-0 self-center ${pipelineTaskStatusBadgeClass(task.status)}`}
                          >
                            <PipelineTaskStatusBadgeIcon status={task.status} />
                            <span>{formatTaskStatusLabel(task.status)}</span>
                          </Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            <section
              aria-labelledby="task-detail-heading"
              className="min-w-0 self-start"
            >
              <h2
                id="task-detail-heading"
                className={`${PIPELINE_SECTION_HEADER_GAP_CLASS} ${PIPELINE_SECTION_TITLE_CLASS}`}
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Task details
              </h2>
              <div
                className="h-fit overflow-hidden rounded-[var(--luxia-radius-12)] border"
                style={{
                  borderColor: selectedTask
                    ? taskFlowSelectedVisual(selectedTask.status).border
                    : "var(--luxia-border-default)",
                  background: "var(--luxia-surface)",
                  boxShadow: PIPELINE_TASK_SELECTED.panelElevation,
                }}
                aria-live="polite"
              >
                {selectedTask ? (
                  <TaskDetailsCard
                    task={selectedTask}
                    failureImpact={failureImpact}
                    canRetry={canRetrySelected}
                    retryDenied={retryDeniedSelected}
                    onRetry={() => setRetryTaskId(selectedTask.id)}
                  />
                ) : (
                  <p
                    className="px-4 py-5 luxia-type-body-dense sm:px-5"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    Select a task to inspect its status.
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="pt-2">
            <PipelineParentBackLink
              parentLabel={pipeline.name}
              onNavigate={() => onOpenPipeline(pipeline.id)}
            />
          </div>
        </div>
      </LuxiaPageBody>

      {retryTaskId != null ? (
        <AlertDialog
          open
          onOpenChange={(open) => {
            if (!open) setRetryTaskId(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {retryTarget ? `Retry “${retryTarget.name}”?` : "Retry task?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Luxia will retry this failed task for the current pipeline run.
                Downstream tasks that did not run because of an upstream failure
                stay unchanged.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  if (!retryTarget || retryTarget.status !== "failed") {
                    setRetryTaskId(null);
                    return;
                  }
                  const taskId = retryTarget.id;
                  // Unmount confirmation before retry so it cannot linger in the a11y tree.
                  flushSync(() => {
                    setRetryTaskId(null);
                  });
                  onRetryTask(taskId);
                }}
              >
                Retry task
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </LuxiaPageFrame>
  );
}

function SummaryCell({
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
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {label}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function TaskDetailsCard({
  task,
  failureImpact,
  canRetry,
  retryDenied,
  onRetry,
}: {
  task: PipelineTaskRecord;
  failureImpact: string | null;
  canRetry: boolean;
  retryDenied: boolean;
  onRetry: () => void;
}) {
  const visual = taskFlowNodeVisual(task.status);
  const TaskTypeIcon = resolveTaskTypeIcon(task.taskKey, task.name);
  const showCallout =
    task.status === "upstream_failed" || Boolean(failureImpact);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{
              background: visual.iconSurface,
              color: visual.iconColor,
            }}
            aria-hidden
          >
            <TaskTypeIcon size={16} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate luxia-type-body-dense-strong"
              style={{ color: "var(--luxia-text-primary)", fontWeight: 700 }}
              title={task.name}
            >
              {task.name}
            </p>
            <div className="mt-1.5">
              <Badge
                variant={pipelineStatusBadgeVariant(task.status)}
                className={pipelineTaskStatusBadgeClass(task.status)}
              >
                <PipelineTaskStatusBadgeIcon status={task.status} />
                <span>{formatTaskStatusLabel(task.status)}</span>
              </Badge>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-3 rounded-[10px] border px-3 py-3"
          style={{
            borderColor: "var(--luxia-border-default)",
            background:
              "color-mix(in srgb, var(--luxia-neutral-50) 60%, var(--luxia-surface))",
          }}
        >
          <DetailMeta
            label="Duration"
            value={formatTaskDuration(task.durationSeconds, task.status)}
          />
          <DetailMeta label="Attempt" value={String(task.attempt)} />
        </div>

        {showCallout ? (
          <div
            className="rounded-[10px] border px-3 py-2.5"
            style={{
              borderColor:
                task.status === "failed" || task.status === "upstream_failed"
                  ? "color-mix(in srgb, var(--luxia-error) 22%, var(--luxia-border-default))"
                  : "var(--luxia-border-default)",
              background:
                task.status === "failed" || task.status === "upstream_failed"
                  ? "color-mix(in srgb, var(--luxia-error-10) 45%, var(--luxia-surface))"
                  : "color-mix(in srgb, var(--luxia-neutral-50) 70%, var(--luxia-surface))",
            }}
          >
            {task.status === "upstream_failed" ? (
              <p
                className="luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                This task did not run because an upstream task failed. Retry the
                upstream failed task first — this task is not directly
                retryable.
              </p>
            ) : null}
            {failureImpact ? (
              <p
                className={
                  task.status === "upstream_failed"
                    ? "mt-1.5 luxia-type-body-dense-strong"
                    : "luxia-type-body-dense-strong"
                }
                style={{ color: "var(--luxia-text-primary)" }}
              >
                <span
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Impact
                </span>
                <span className="mt-0.5 block">{failureImpact}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {canRetry || retryDenied ? (
        <div
          className="px-4 py-3 sm:px-5"
          style={{
            borderTop: "1px solid var(--luxia-settings-row-divider)",
            background:
              "color-mix(in srgb, var(--luxia-neutral-50) 70%, var(--luxia-surface))",
          }}
        >
          {canRetry ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.primary}
              onClick={onRetry}
            >
              Retry failed task
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
                    Retry failed task
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[16rem]">
                {PIPELINE_RETRY_DENIED_MESSAGE}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ) : null}
    </div>
  );
}

function DetailMeta({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p
        className="luxia-type-caption"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 truncate luxia-type-body-dense-strong"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}
