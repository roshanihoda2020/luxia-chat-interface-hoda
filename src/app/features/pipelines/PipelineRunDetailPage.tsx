import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { HS } from "@/app/features/home/homeSurfaces";
import type { ProjectRole } from "@/app/features/permissions/types";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { canRetryFailedTask } from "./access";
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
import { TaskFlowGraph } from "./TaskFlowGraph";
import type {
  PipelineRunRecord,
  PipelineTaskRecord,
  ProjectPipelineRecord,
} from "./types";
import { PIPELINE_RUN_STATUS_LABELS } from "./types";
import { PIPELINE_SUMMARY_MAX_WIDTH_CLASS } from "./pipelinesLayout";

const SURFACE = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

export interface PipelineRunDetailPageProps {
  projectId: string;
  projectName: string;
  pipeline: ProjectPipelineRecord;
  run: PipelineRunRecord;
  /** Optional task key to select when opening from Run history. */
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

  const canRetrySelected =
    selectedTask
    && canRetryFailedTask(
      pipeline,
      selectedTask.status,
      projectRole,
      isOrgAdmin,
    );

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
        context={
          <div className="min-w-0">
            <p
              className="luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              Pipeline
            </p>
            <button
              type="button"
              className="mt-0.5 block max-w-full truncate text-left luxia-type-body-dense-strong outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
              style={{ color: "var(--luxia-text-primary)" }}
              onClick={() => onOpenPipeline(pipeline.id)}
              title={pipeline.name}
            >
              {pipeline.name}
            </button>
          </div>
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
              className="mb-3 luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              Run summary
            </h2>
            <div
              className="rounded-[var(--luxia-radius-16)] border bg-white px-5 py-4"
              style={{ borderColor: "var(--luxia-border-default)" }}
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
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
              className="mb-3 luxia-type-title-section"
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

          <div className="grid gap-5 lg:grid-cols-[minmax(0,2.55fr)_minmax(16rem,1fr)] lg:items-start">
            <section aria-labelledby="task-list-heading" className="min-w-0">
              <h2
                id="task-list-heading"
                className="mb-3 luxia-type-title-section"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Tasks
              </h2>
              <div className={`overflow-hidden ${SURFACE}`}>
                <ul ref={taskListRef}>
                  {tasks.map((task) => {
                    const selected = task.id === selectedTaskId;
                    const durationLabel = formatTaskDuration(
                      task.durationSeconds,
                      task.status,
                    );
                    return (
                      <li key={task.id}>
                        <button
                          type="button"
                          data-pipeline-task-id={task.id}
                          className="luxia-settings-row is-interactive flex w-full items-center justify-between gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--luxia-border-focus)]"
                          style={{
                            borderColor: "var(--luxia-settings-row-divider)",
                            background: selected
                              ? "var(--luxia-opacity-purple-08)"
                              : undefined,
                            boxShadow: selected
                              ? "inset 2px 0 0 var(--luxia-purple-40)"
                              : undefined,
                          }}
                          onClick={() => setSelectedTaskId(task.id)}
                          aria-pressed={selected}
                        >
                          <span className="min-w-0">
                            <span
                              className="block truncate luxia-type-body-dense-strong"
                              style={{ color: "var(--luxia-text-primary)" }}
                            >
                              {task.name}
                            </span>
                            <span
                              className="mt-0.5 block luxia-type-caption"
                              style={{ color: "var(--luxia-text-muted)" }}
                            >
                              Attempt {task.attempt}
                              {durationLabel !== "—"
                                ? ` · ${durationLabel}`
                                : ""}
                            </span>
                          </span>
                          <Badge
                            variant={pipelineStatusBadgeVariant(task.status)}
                            className={pipelineTaskStatusBadgeClass(task.status)}
                          >
                            {formatTaskStatusLabel(task.status)}
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
                className="mb-3 luxia-type-title-section"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Task details
              </h2>
              <div
                className="h-fit rounded-[var(--luxia-radius-16)] border bg-white px-4 py-4"
                style={{
                  borderColor: "var(--luxia-border-default)",
                  background: selectedTask
                    ? "var(--luxia-opacity-purple-04, rgba(118,82,196,0.04))"
                    : undefined,
                  boxShadow: selectedTask
                    ? "inset 2px 0 0 var(--luxia-purple-40)"
                    : undefined,
                }}
              >
                {selectedTask ? (
                  <div className="space-y-3">
                    <DetailRow label="Task" value={selectedTask.name} />
                    <DetailRow
                      label="Status"
                      value={
                        <Badge
                          variant={pipelineStatusBadgeVariant(selectedTask.status)}
                          className={pipelineTaskStatusBadgeClass(
                            selectedTask.status,
                          )}
                        >
                          {formatTaskStatusLabel(selectedTask.status)}
                        </Badge>
                      }
                    />
                    <DetailRow
                      label="Duration"
                      value={formatTaskDuration(
                        selectedTask.durationSeconds,
                        selectedTask.status,
                      )}
                    />
                    <DetailRow
                      label="Attempt"
                      value={String(selectedTask.attempt)}
                    />
                    {selectedTask.status === "upstream_failed" ? (
                      <p
                        className="luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        This task could not run because an upstream task failed.
                      </p>
                    ) : null}
                    {failureImpact ? (
                      <DetailRow label="Impact" value={failureImpact} />
                    ) : null}
                    {canRetrySelected ? (
                      <Button
                        type="button"
                        {...LUXIA_PAGE_HEADER_ACTION.primary}
                        className="mt-1"
                        onClick={() => setRetryTaskId(selectedTask.id)}
                      >
                        Retry failed task
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <p
                    className="luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    Select a task to inspect its status.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </LuxiaPageBody>

      <AlertDialog
        open={Boolean(retryTarget)}
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
              {retryTarget?.status === "upstream_failed"
                ? "This task could not run because an upstream task failed. Luxia will clear it so Airflow can attempt it again. This does not automatically repair the upstream failure."
                : "Luxia will retry this failed task for the current pipeline run."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!retryTarget) return;
                onRetryTask(retryTarget.id);
                setRetryTaskId(null);
              }}
            >
              Retry task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
        className="mb-1 luxia-type-caption"
        style={{ color: "var(--luxia-text-muted)" }}
      >
        {label}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p
        className="luxia-type-caption"
        style={{ color: "var(--luxia-text-muted)" }}
      >
        {label}
      </p>
      <div
        className="mt-0.5 luxia-type-body-dense-strong"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
