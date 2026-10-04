import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { LuxiaPipelineIcon } from "@/assets/icons";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { formatPipelineDuration } from "./format";
import {
  PIPELINE_LATEST_SURFACE,
  PIPELINE_MATRIX_ROW_DIVIDER,
  PIPELINE_MATRIX_TASK_EDGE,
  PIPELINE_TABLE_HEADER_SURFACE,
  PIPELINE_TASK_SELECTED,
} from "./pipelinesLayout";
import {
  RUN_HISTORY_MAX_COLUMNS,
  buildRunHistoryColumns,
  buildRunHistoryDayGroups,
  buildRunHistoryRows,
  getRunHistoryCell,
  summarizeRunHistory,
  type RunHistoryCell,
  type RunHistoryColumn,
} from "./runHistory";
import {
  resolveTaskTypeIcon,
  taskFlowNodeVisual,
} from "./taskFlowNodeVisuals";
import { PIPELINE_TASK_STATUS_ICON } from "./taskStatusIcons";
import type {
  PipelineRunRecord,
  PipelineTaskRecord,
  PipelineTaskStatus,
} from "./types";
import {
  PIPELINE_RUN_STATUS_LABELS,
  PIPELINE_TASK_STATUS_LABELS,
} from "./types";

const SURFACE = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

/**
 * Content-driven surface: sizes to Task + run columns instead of stretching
 * across the full page. Caps at 100% so wide matrices scroll internally.
 */
const SURFACE_WIDTH_CLASS = "w-fit max-w-full min-w-[18rem]";

const TASK_COL_PX = 200;
const TASK_COL_CLASS =
  "sticky left-0 z-[2] w-[200px] min-w-[200px] max-w-[212px]";

const TASK_COL_SURFACE =
  "color-mix(in srgb, var(--luxia-neutral-50) 48%, var(--luxia-surface))";

const TASK_COL_HEADER_SURFACE =
  "color-mix(in srgb, var(--luxia-neutral-50) 78%, var(--luxia-surface))";

function runColumnWidthPx(columnCount: number): number {
  if (columnCount <= 3) return 120;
  if (columnCount <= 6) return 112;
  return 104;
}

export interface PipelineRunHistoryProps {
  runs: PipelineRunRecord[];
  tasks: PipelineTaskRecord[];
  onOpenRun: (runId: string, taskKey?: string) => void;
}

const LEGEND_STATES: PipelineTaskStatus[] = [
  "success",
  "failed",
  "upstream_failed",
  "running",
  "queued",
  "skipped",
];

/**
 * Cross-run task health matrix for Pipeline Detail.
 * Compares task outcomes across recent runs — not a DAG / task-flow view.
 */
export function PipelineRunHistory({
  runs,
  tasks,
  onOpenRun,
}: PipelineRunHistoryProps) {
  const columns = useMemo(
    () => buildRunHistoryColumns(runs, RUN_HISTORY_MAX_COLUMNS),
    [runs],
  );
  const dayGroups = useMemo(
    () => buildRunHistoryDayGroups(columns),
    [columns],
  );
  const rows = useMemo(
    () => buildRunHistoryRows(columns.map((column) => column.run), tasks),
    [columns, tasks],
  );
  const summary = summarizeRunHistory(runs, RUN_HISTORY_MAX_COLUMNS);
  const runColPx = runColumnWidthPx(columns.length);

  const failedTaskByRun = useMemo(() => {
    const map = new Map<string, PipelineTaskRecord>();
    for (const task of tasks) {
      if (task.status !== "failed") continue;
      if (!map.has(task.runId)) map.set(task.runId, task);
    }
    return map;
  }, [tasks]);

  const activeLegend = useMemo(() => {
    const present = new Set<PipelineTaskStatus>();
    for (const column of columns) {
      for (const row of rows) {
        const cell = getRunHistoryCell(tasks, column.run.id, row.taskKey, column);
        if (cell) present.add(cell.status);
      }
    }
    return LEGEND_STATES.filter((status) => present.has(status));
  }, [columns, rows, tasks]);

  if (runs.length === 0) {
    return (
      <div
        className={`${SURFACE_WIDTH_CLASS} overflow-hidden rounded-[var(--luxia-radius-12)] border bg-white px-5 py-8 text-center`}
        style={{
          borderColor: "var(--luxia-border-default)",
          width: "fit-content",
          minWidth: "min(100%, 22rem)",
          maxWidth: "100%",
          boxShadow: PIPELINE_TASK_SELECTED.panelElevation,
        }}
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
          No run history yet
        </p>
        <p
          className="mx-auto mt-1 max-w-sm luxia-type-body-dense"
          style={{ color: "var(--luxia-text-muted)" }}
        >
          Run history will appear here after this pipeline has completed at
          least one run.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        className={`${SURFACE_WIDTH_CLASS} overflow-hidden rounded-[var(--luxia-radius-12)] border bg-white px-5 py-8 text-center`}
        style={{
          borderColor: "var(--luxia-border-default)",
          width: "fit-content",
          minWidth: "min(100%, 22rem)",
          maxWidth: "100%",
          boxShadow: PIPELINE_TASK_SELECTED.panelElevation,
        }}
        role="status"
      >
        <p
          className="luxia-type-body-dense-strong"
          style={{ color: "var(--luxia-text-primary)" }}
        >
          No task history available
        </p>
        <p
          className="mx-auto mt-1 max-w-sm luxia-type-body-dense"
          style={{ color: "var(--luxia-text-muted)" }}
        >
          Recent runs exist, but task-level history is not available for this
          pipeline yet.
        </p>
      </div>
    );
  }

  const tableWidth = TASK_COL_PX + columns.length * runColPx;
  const lastRowIndex = rows.length - 1;

  return (
    <div className="space-y-2.5">
      <div
        className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 luxia-type-caption"
        style={{ color: "var(--luxia-text-muted)" }}
        aria-label="Run history summary"
      >
        <span>
          Last {summary.total} run{summary.total === 1 ? "" : "s"}
        </span>
        <span aria-hidden>·</span>
        <span>
          Successful{" "}
          <span style={{ color: "var(--luxia-text-secondary)" }}>
            {summary.successful}
          </span>
        </span>
        <span aria-hidden>·</span>
        <span>
          Failed{" "}
          <span style={{ color: "var(--luxia-text-secondary)" }}>
            {summary.failed}
          </span>
        </span>
        {summary.running > 0 ? (
          <>
            <span aria-hidden>·</span>
            <span>
              Running{" "}
              <span style={{ color: "var(--luxia-text-secondary)" }}>
                {summary.running}
              </span>
            </span>
          </>
        ) : null}
      </div>

      <div
        className={`${SURFACE_WIDTH_CLASS} ${SURFACE} overflow-hidden`}
        style={{
          width: "fit-content",
          maxWidth: "100%",
          borderColor: "var(--luxia-border-default)",
          boxShadow: PIPELINE_TASK_SELECTED.panelElevation,
          background: "var(--luxia-surface)",
        }}
      >
        <div className="max-w-full overflow-x-auto">
          <table
            className="border-separate text-left"
            style={{
              width: tableWidth,
              minWidth: tableWidth,
              tableLayout: "fixed",
              borderSpacing: 0,
            }}
            aria-label="Task health across recent runs"
          >
            <colgroup>
              <col style={{ width: TASK_COL_PX }} />
              {columns.map((column) => (
                <col key={column.run.id} style={{ width: runColPx }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th
                  scope="col"
                  rowSpan={2}
                  className={`${TASK_COL_CLASS} px-4 pt-5 text-left align-middle luxia-type-table-header-dense`}
                  style={{
                    color: "var(--luxia-text-muted)",
                    background: TASK_COL_HEADER_SURFACE,
                    borderBottom: PIPELINE_MATRIX_ROW_DIVIDER,
                    boxShadow: PIPELINE_MATRIX_TASK_EDGE,
                  }}
                >
                  Task
                </th>
                {dayGroups.map((group) => (
                  <th
                    key={`day-${group.startIndex}-${group.dayLabel}`}
                    scope="colgroup"
                    colSpan={group.columnCount}
                    className="px-1 pt-3.5 pb-0.5 text-center"
                    style={{
                      background: groupHasLatest(columns, group)
                        ? PIPELINE_LATEST_SURFACE
                        : PIPELINE_TABLE_HEADER_SURFACE,
                    }}
                  >
                    <span
                      className="luxia-type-table-header-dense"
                      style={{
                        color: "var(--luxia-text-muted)",
                        letterSpacing: "0.1em",
                        opacity: 0.92,
                      }}
                    >
                      {group.dayLabel}
                    </span>
                  </th>
                ))}
              </tr>
              <tr>
                {columns.map((column) => {
                  const rootFailed = failedTaskByRun.get(column.run.id);
                  return (
                    <th
                      key={column.run.id}
                      scope="col"
                      className="px-1 pb-2.5 pt-1 align-top"
                      style={{
                        width: runColPx,
                        minWidth: runColPx,
                        maxWidth: runColPx,
                        background: column.isLatest
                          ? PIPELINE_LATEST_SURFACE
                          : PIPELINE_TABLE_HEADER_SURFACE,
                        borderBottom: PIPELINE_MATRIX_ROW_DIVIDER,
                      }}
                    >
                      <RunTimeHeader
                        column={column}
                        failedTaskName={rootFailed?.name ?? null}
                        onOpen={() => onOpenRun(column.run.id)}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const rowDivider =
                  rowIndex < lastRowIndex
                    ? PIPELINE_MATRIX_ROW_DIVIDER
                    : undefined;
                const TaskTypeIcon = resolveTaskTypeIcon(
                  row.taskKey,
                  row.taskName,
                );
                return (
                  <tr key={row.taskKey}>
                    <th
                      scope="row"
                      className={`${TASK_COL_CLASS} px-4 py-3 text-left luxia-type-body-dense-strong`}
                      style={{
                        color: "var(--luxia-text-primary)",
                        fontWeight: 600,
                        background: TASK_COL_SURFACE,
                        borderBottom: rowDivider,
                        boxShadow: PIPELINE_MATRIX_TASK_EDGE,
                      }}
                      title={row.taskName}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="inline-flex size-5 shrink-0 items-center justify-center rounded-[5px]"
                          style={{
                            background: "var(--luxia-neutral-100)",
                            color: "var(--luxia-neutral-600)",
                          }}
                          aria-hidden
                        >
                          <TaskTypeIcon size={12} strokeWidth={2} />
                        </span>
                        <span className="min-w-0 truncate">{row.taskName}</span>
                      </span>
                    </th>
                    {columns.map((column) => {
                      const cell = getRunHistoryCell(
                        tasks,
                        column.run.id,
                        row.taskKey,
                        column,
                      );
                      return (
                        <td
                          key={`${column.run.id}:${row.taskKey}`}
                          className="px-1 py-3 text-center align-middle"
                          style={{
                            width: runColPx,
                            minWidth: runColPx,
                            maxWidth: runColPx,
                            borderBottom: rowDivider,
                            background: column.isLatest
                              ? PIPELINE_LATEST_SURFACE
                              : "var(--luxia-surface)",
                          }}
                        >
                          {cell ? (
                            <StatusCell
                              cell={cell}
                              column={column}
                              onOpen={() =>
                                onOpenRun(column.run.id, cell.taskKey)
                              }
                            />
                          ) : (
                            <span
                              className="mx-auto inline-flex size-8 items-center justify-center luxia-type-caption"
                              style={{ color: "var(--luxia-text-muted)" }}
                              aria-label={`${row.taskName}, ${column.exactLabel}, no data`}
                            >
                              ·
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {activeLegend.length > 0 ? (
          <div
            className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3"
            style={{
              borderTop: PIPELINE_MATRIX_ROW_DIVIDER,
              background: PIPELINE_TABLE_HEADER_SURFACE,
            }}
            aria-label="Status legend"
          >
            {activeLegend.map((status) => (
              <span
                key={status}
                className="inline-flex h-5 items-center gap-1.5 luxia-type-caption"
                style={{
                  color: "var(--luxia-text-muted)",
                }}
              >
                <StatusMarker status={status} decorative size="sm" />
                <span>{PIPELINE_TASK_STATUS_LABELS[status]}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function groupHasLatest(
  columns: readonly RunHistoryColumn[],
  group: { startIndex: number; columnCount: number },
): boolean {
  for (let i = group.startIndex; i < group.startIndex + group.columnCount; i += 1) {
    if (columns[i]?.isLatest) return true;
  }
  return false;
}

function RunTimeHeader({
  column,
  failedTaskName,
  onOpen,
}: {
  column: RunHistoryColumn;
  failedTaskName: string | null;
  onOpen: () => void;
}) {
  const statusLabel = PIPELINE_RUN_STATUS_LABELS[column.run.status];
  const failureHint =
    column.run.status === "failed" && failedTaskName
      ? `Failed at ${failedTaskName}`
      : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="flex w-full min-h-[2.5rem] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[8px] px-1 py-1 text-center outline-none transition-colors hover:bg-[var(--luxia-settings-hover-bg)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          onClick={onOpen}
          aria-label={`Open run ${column.exactLabel}, status ${statusLabel}${
            failureHint ? `, ${failureHint}` : ""
          }${column.isLatest ? ", latest" : ""}`}
        >
          <span
            className="luxia-type-body-dense-strong"
            style={{
              color: "var(--luxia-text-primary)",
              lineHeight: 1.25,
              fontWeight: 600,
            }}
          >
            {column.timeLabel}
          </span>
          {column.isLatest ? (
            <span
              className="luxia-type-caption"
              style={{
                color: "var(--luxia-text-muted)",
                lineHeight: 1.2,
                fontSize: 11,
              }}
            >
              Latest
            </span>
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[16rem]">
        <p className="luxia-type-caption">{column.exactLabel}</p>
        <p className="luxia-type-caption">{statusLabel}</p>
        {column.isLatest ? (
          <p className="luxia-type-caption">Latest run</p>
        ) : null}
        {failureHint ? (
          <p
            className="luxia-type-caption"
            style={{ color: "var(--luxia-error-70)" }}
          >
            {failureHint}
          </p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

function StatusCell({
  cell,
  column,
  onOpen,
}: {
  cell: RunHistoryCell;
  column: RunHistoryColumn;
  onOpen: () => void;
}) {
  const durationLabel =
    cell.durationSeconds != null
      ? formatPipelineDuration(cell.durationSeconds)
      : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="mx-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-[8px] outline-none transition-colors hover:bg-[var(--luxia-settings-hover-bg)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          onClick={onOpen}
          aria-label={`${cell.taskName}, ${column.exactLabel}, ${cell.statusLabel}`}
        >
          <StatusMarker status={cell.status} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[16rem]">
        <p className="luxia-type-body-dense-strong">{cell.taskName}</p>
        <p className="luxia-type-caption">
          {column.dayLabel} · {column.timeLabel}
        </p>
        <p className="luxia-type-caption">{cell.statusLabel}</p>
        {durationLabel ? (
          <p className="luxia-type-caption">Duration: {durationLabel}</p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

function StatusMarker({
  status,
  decorative = false,
  size = "md",
}: {
  status: PipelineTaskStatus;
  decorative?: boolean;
  size?: "sm" | "md";
}) {
  const Icon = PIPELINE_TASK_STATUS_ICON[status];
  const tone = statusTone(status);
  const isFailed = status === "failed";
  const isUpstream = status === "upstream_failed";
  const box = size === "sm" ? "size-4" : "size-[22px]";
  const iconSize = size === "sm" ? 10 : isFailed ? 12 : 11;

  return (
    <span
      className={`inline-flex ${box} shrink-0 items-center justify-center rounded-full`}
      style={{
        color: tone.color,
        background: tone.background,
        boxShadow: isFailed
          ? "0 0 0 1px var(--luxia-opacity-error-16)"
          : isUpstream
            ? "0 0 0 1px color-mix(in srgb, var(--luxia-error-70) 12%, transparent)"
            : undefined,
      }}
      aria-hidden={decorative ? true : undefined}
    >
      <Icon
        size={iconSize}
        strokeWidth={isFailed ? 2.5 : 2.25}
        fill={status === "running" ? "currentColor" : "none"}
      />
    </span>
  );
}

function statusTone(status: PipelineTaskStatus): {
  color: string;
  background: string;
} {
  const visual = taskFlowNodeVisual(status);
  return {
    color: visual.iconColor,
    background: visual.iconSurface,
  };
}
