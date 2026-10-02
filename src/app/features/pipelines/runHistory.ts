import type {
  PipelineRunRecord,
  PipelineTaskRecord,
  PipelineTaskStatus,
} from "./types";
import { PIPELINE_TASK_STATUS_LABELS } from "./types";

/** Prefer a compact recent window for the history matrix. */
export const RUN_HISTORY_MAX_COLUMNS = 10;

export type RunHistoryColumn = {
  run: PipelineRunRecord;
  /** Compact primary label (day, or time when same-day duplicates). */
  label: string;
  dayLabel: string;
  timeLabel: string;
  /** False when this column shares a calendar day with the previous column. */
  showDayLabel: boolean;
  exactLabel: string;
  isLatest: boolean;
};

export type RunHistoryRow = {
  taskKey: string;
  taskName: string;
};

export type RunHistoryCell = {
  runId: string;
  taskKey: string;
  taskId: string;
  taskName: string;
  status: PipelineTaskStatus;
  statusLabel: string;
  durationSeconds: number | null;
  runLabel: string;
  exactRunLabel: string;
};

/**
 * Short customer-friendly column label for a run start time.
 */
export function formatRunHistoryColumnLabel(
  iso: string,
  nowMs: number = Date.now(),
): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "Run";

  const thenDate = new Date(then);
  const nowDate = new Date(nowMs);
  const startOfToday = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
  ).getTime();
  const startOfYesterday = startOfToday - 86_400_000;

  if (then >= startOfToday) return "Today";
  if (then >= startOfYesterday) return "Yesterday";

  return thenDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Concise time for disambiguating multiple runs on the same calendar day. */
export function formatRunHistoryTimeLabel(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "Run";
  return new Date(then).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRunHistoryExactLabel(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "Unknown time";
  return new Date(then).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Task rows for the matrix — topology order from the newest run that has tasks,
 * otherwise any available task set for the pipeline.
 */
export function buildRunHistoryRows(
  runs: readonly PipelineRunRecord[],
  tasks: readonly PipelineTaskRecord[],
): RunHistoryRow[] {
  const runIds = new Set(runs.map((run) => run.id));
  const pipelineTasks = tasks.filter((task) => runIds.has(task.runId));
  if (pipelineTasks.length === 0) return [];

  for (const run of runs) {
    const forRun = pipelineTasks.filter((task) => task.runId === run.id);
    if (forRun.length > 0) {
      return forRun.map((task) => ({
        taskKey: task.taskKey,
        taskName: task.name,
      }));
    }
  }

  const seen = new Set<string>();
  const rows: RunHistoryRow[] = [];
  for (const task of pipelineTasks) {
    if (seen.has(task.taskKey)) continue;
    seen.add(task.taskKey);
    rows.push({ taskKey: task.taskKey, taskName: task.name });
  }
  return rows;
}

export function buildRunHistoryColumns(
  runs: readonly PipelineRunRecord[],
  maxColumns: number = RUN_HISTORY_MAX_COLUMNS,
  nowMs: number = Date.now(),
): RunHistoryColumn[] {
  const windowRuns = runs.slice(0, maxColumns);
  const dayLabels = windowRuns.map((run) =>
    formatRunHistoryColumnLabel(run.startedAt, nowMs),
  );
  const dayCounts = new Map<string, number>();
  for (const dayLabel of dayLabels) {
    dayCounts.set(dayLabel, (dayCounts.get(dayLabel) ?? 0) + 1);
  }

  return windowRuns.map((run, index) => {
    const dayLabel = dayLabels[index]!;
    const timeLabel = formatRunHistoryTimeLabel(run.startedAt);
    const sameDayAsPrevious =
      index > 0 && dayLabels[index - 1] === dayLabel;
    const dayRepeated = (dayCounts.get(dayLabel) ?? 0) > 1;
    // Prefer time as the distinguishing primary label when a day repeats.
    const label = dayRepeated ? timeLabel : dayLabel;

    return {
      run,
      label,
      dayLabel,
      timeLabel,
      showDayLabel: !sameDayAsPrevious,
      exactLabel: formatRunHistoryExactLabel(run.startedAt),
      isLatest: index === 0,
    };
  });
}

/** Consecutive same-calendar-day column spans for grouped matrix headers. */
export type RunHistoryDayGroup = {
  dayLabel: string;
  columnCount: number;
  startIndex: number;
};

export function buildRunHistoryDayGroups(
  columns: readonly RunHistoryColumn[],
): RunHistoryDayGroup[] {
  const groups: RunHistoryDayGroup[] = [];
  for (let index = 0; index < columns.length; index += 1) {
    const dayLabel = columns[index]!.dayLabel;
    const previous = groups[groups.length - 1];
    if (previous && previous.dayLabel === dayLabel) {
      previous.columnCount += 1;
      continue;
    }
    groups.push({ dayLabel, columnCount: 1, startIndex: index });
  }
  return groups;
}

export function getRunHistoryCell(
  tasks: readonly PipelineTaskRecord[],
  runId: string,
  taskKey: string,
  column: RunHistoryColumn,
): RunHistoryCell | null {
  const task = tasks.find(
    (item) => item.runId === runId && item.taskKey === taskKey,
  );
  if (!task) return null;
  return {
    runId,
    taskKey,
    taskId: task.id,
    taskName: task.name,
    status: task.status,
    statusLabel: PIPELINE_TASK_STATUS_LABELS[task.status],
    durationSeconds: task.durationSeconds,
    runLabel: column.label,
    exactRunLabel: column.exactLabel,
  };
}

export function summarizeRunHistory(
  runs: readonly PipelineRunRecord[],
  maxColumns: number = RUN_HISTORY_MAX_COLUMNS,
): {
  total: number;
  successful: number;
  failed: number;
  running: number;
} {
  const windowRuns = runs.slice(0, maxColumns);
  return {
    total: windowRuns.length,
    successful: windowRuns.filter((run) => run.status === "success").length,
    failed: windowRuns.filter((run) => run.status === "failed").length,
    running: windowRuns.filter((run) => run.status === "running").length,
  };
}

/**
 * Count downstream tasks blocked after a failure (status upstream_failed),
 * walking the structured dependency graph from the failed task.
 */
export function countDownstreamBlockedTasks(
  tasks: readonly PipelineTaskRecord[],
  failedTaskKey: string,
): number {
  const children = new Map<string, string[]>();
  for (const task of tasks) {
    for (const up of task.upstreamKeys) {
      const list = children.get(up) ?? [];
      list.push(task.taskKey);
      children.set(up, list);
    }
  }

  const visited = new Set<string>();
  const stack = [...(children.get(failedTaskKey) ?? [])];
  while (stack.length > 0) {
    const key = stack.pop()!;
    if (visited.has(key)) continue;
    visited.add(key);
    for (const child of children.get(key) ?? []) {
      stack.push(child);
    }
  }

  return tasks.filter(
    (task) =>
      visited.has(task.taskKey) && task.status === "upstream_failed",
  ).length;
}

export function formatFailureImpact(count: number): string | null {
  if (count <= 0) return null;
  return count === 1
    ? "1 downstream task could not run."
    : `${count} downstream tasks could not run.`;
}
