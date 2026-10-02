import { useMemo } from "react";
import {
  AlertCircle,
  Check,
  Circle,
  Clock,
  Minus,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { LuxiaPipelineIcon } from "@/assets/icons";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { formatPipelineDuration } from "./format";
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
 * Content-driven surface: override settings panel `width: 100%` so the card
 * sizes to Task + run columns instead of stretching across the page.
 */
const SURFACE_WIDTH_CLASS = "w-fit max-w-full min-w-[18rem]";

/** ~88px run columns — fixed size; do not grow with spare page width. */
const RUN_COL_PX = 88;
const RUN_COL_CLASS = "w-[88px] min-w-[88px] max-w-[96px]";

/** ~160px task column — fits “Quality check”. */
const TASK_COL_PX = 160;
const TASK_COL_CLASS =
  "sticky left-0 z-[2] w-[160px] min-w-[160px] max-w-[170px] bg-white";

const LATEST_TINT =
  "var(--luxia-opacity-purple-04, rgba(118,82,196,0.04))";

export interface PipelineRunHistoryProps {
  runs: PipelineRunRecord[];
  tasks: PipelineTaskRecord[];
  /** Opens Run Detail; optional taskKey focuses a task when already supported. */
  onOpenRun: (runId: string, taskKey?: string) => void;
}

const STATUS_ICON: Record<PipelineTaskStatus, LucideIcon> = {
  success: Check,
  running: Circle,
  failed: TriangleAlert,
  queued: Clock,
  skipped: Minus,
  upstream_failed: AlertCircle,
};

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
        className={`${SURFACE_WIDTH_CLASS} rounded-[var(--luxia-radius-12)] border bg-white px-5 py-8 text-center`}
        style={{
          borderColor: "var(--luxia-border-default)",
          width: "fit-content",
          minWidth: "min(100%, 22rem)",
          maxWidth: "100%",
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
        className={`${SURFACE_WIDTH_CLASS} ${SURFACE}`}
        style={{ width: "fit-content", maxWidth: "100%" }}
      >
        <div className="max-w-full overflow-x-auto">
          <table
            className="border-collapse text-left"
            style={{
              width: TASK_COL_PX + columns.length * RUN_COL_PX,
              tableLayout: "fixed",
            }}
            aria-label="Task health across recent runs"
          >
            <colgroup>
              <col style={{ width: TASK_COL_PX }} />
              {columns.map((column) => (
                <col key={column.run.id} style={{ width: RUN_COL_PX }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th
                  scope="col"
                  rowSpan={2}
                  className={`${TASK_COL_CLASS} px-3.5 pb-2 pt-3 text-left align-bottom luxia-type-caption`}
                  style={{
                    color: "var(--luxia-text-muted)",
                    boxShadow: "1px 0 0 var(--luxia-settings-row-divider)",
                  }}
                >
                  Task
                </th>
                {dayGroups.map((group) => (
                  <th
                    key={`day-${group.startIndex}-${group.dayLabel}`}
                    scope="colgroup"
                    colSpan={group.columnCount}
                    className="px-1 pt-3 pb-0.5 text-center"
                    style={{
                      background: groupHasLatest(columns, group)
                        ? LATEST_TINT
                        : undefined,
                    }}
                  >
                    <span
                      className="luxia-type-body-dense"
                      style={{
                        color: "var(--luxia-text-primary)",
                        fontWeight: 500,
                        lineHeight: 1.3,
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
                      className={`${RUN_COL_CLASS} px-1 pb-2.5 pt-0.5 align-top`}
                      style={{
                        background: column.isLatest ? LATEST_TINT : undefined,
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
              {rows.map((row, rowIndex) => (
                <tr key={row.taskKey}>
                  <th
                    scope="row"
                    className={`${TASK_COL_CLASS} truncate px-3.5 py-2 text-left luxia-type-body-dense`}
                    style={{
                      color: "var(--luxia-text-primary)",
                      fontWeight: 500,
                      borderTop:
                        rowIndex === 0
                          ? "1px solid var(--luxia-settings-row-divider)"
                          : "1px solid color-mix(in srgb, var(--luxia-settings-row-divider) 55%, transparent)",
                      boxShadow: "1px 0 0 var(--luxia-settings-row-divider)",
                    }}
                    title={row.taskName}
                  >
                    {row.taskName}
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
                        className={`${RUN_COL_CLASS} px-1 py-2 text-center`}
                        style={{
                          borderTop:
                            rowIndex === 0
                              ? "1px solid var(--luxia-settings-row-divider)"
                              : "1px solid color-mix(in srgb, var(--luxia-settings-row-divider) 55%, transparent)",
                          background: column.isLatest ? LATEST_TINT : undefined,
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
                            className="inline-flex size-6 items-center justify-center luxia-type-caption"
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
              ))}
            </tbody>
          </table>
        </div>

        {activeLegend.length > 0 ? (
          <div
            className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-t px-3.5 py-1.5"
            style={{ borderColor: "var(--luxia-settings-row-divider)" }}
            aria-label="Status legend"
          >
            {activeLegend.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-1 luxia-type-caption"
                style={{
                  color: "var(--luxia-text-muted)",
                  opacity: 0.85,
                }}
              >
                <StatusMarker status={status} decorative />
                {PIPELINE_TASK_STATUS_LABELS[status]}
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
          className="flex w-full cursor-pointer flex-col items-center gap-0.5 rounded-[6px] px-0.5 py-0.5 text-center outline-none hover:bg-[var(--luxia-settings-hover-bg)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          onClick={onOpen}
          aria-label={`Open run ${column.exactLabel}, status ${statusLabel}${
            failureHint ? `, ${failureHint}` : ""
          }${column.isLatest ? ", latest" : ""}`}
        >
          <span
            className="luxia-type-caption"
            style={{
              color: "var(--luxia-text-secondary)",
              lineHeight: 1.35,
            }}
          >
            {column.timeLabel}
          </span>
          {column.isLatest ? (
            <span
              className="inline-flex items-center rounded-[3px] px-1 py-px text-[9px] font-medium leading-none"
              style={{
                color: "var(--luxia-purple-60)",
                background:
                  "color-mix(in srgb, var(--luxia-purple-60, #7652c4) 10%, transparent)",
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
          className="mx-auto inline-flex size-7 cursor-pointer items-center justify-center rounded-[6px] outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
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
}: {
  status: PipelineTaskStatus;
  decorative?: boolean;
}) {
  const Icon = STATUS_ICON[status];
  const tone = statusTone(status);
  const isFailed = status === "failed";
  const isUpstream = status === "upstream_failed";

  return (
    <span
      className="inline-flex size-5 items-center justify-center rounded-full"
      style={{
        color: tone.color,
        background: tone.background,
        boxShadow: isFailed
          ? "0 0 0 1px var(--luxia-opacity-error-24)"
          : isUpstream
            ? "0 0 0 1px color-mix(in srgb, var(--luxia-error-70) 14%, transparent)"
            : undefined,
      }}
      aria-hidden={decorative ? true : undefined}
    >
      <Icon
        size={isFailed ? 12 : 11}
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
  switch (status) {
    case "failed":
      return {
        color: "var(--luxia-error-70)",
        background: "var(--luxia-opacity-error-08)",
      };
    case "upstream_failed":
      return {
        color: "color-mix(in srgb, var(--luxia-error-70) 72%, var(--luxia-text-muted))",
        background: "color-mix(in srgb, var(--luxia-error-70) 5%, transparent)",
      };
    case "running":
      return {
        color: "var(--luxia-blue-70)",
        background: "var(--luxia-blue-10)",
      };
    case "success":
      return {
        color:
          "color-mix(in srgb, var(--luxia-success-70) 55%, var(--luxia-text-muted))",
        background: "transparent",
      };
    case "queued":
      return {
        color: "var(--luxia-text-muted)",
        background: "var(--luxia-neutral-50, transparent)",
      };
    case "skipped":
      return {
        color: "var(--luxia-text-muted)",
        background: "transparent",
      };
    default:
      return {
        color: "var(--luxia-text-muted)",
        background: "transparent",
      };
  }
}
