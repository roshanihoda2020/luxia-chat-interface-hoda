import type { PipelineTaskStatus } from "./types";
import { PIPELINE_TASK_STATUS_LABELS } from "./types";
import type { PipelineRunStatus, PipelineStatus } from "./types";

export function pipelineStatusBadgeVariant(
  status: PipelineStatus | PipelineRunStatus | PipelineTaskStatus,
): "success" | "error" | "info" | "warning" | "secondary" | "outline" {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  // Softer than Failed — task never executed due to a dependency.
  if (status === "upstream_failed") return "outline";
  if (status === "running") return "info";
  if (status === "paused" || status === "skipped") return "warning";
  if (status === "queued") return "secondary";
  return "outline";
}

export const UPSTREAM_FAILED_BADGE_CLASS =
  "border-[var(--luxia-opacity-error-16)] bg-[color-mix(in_srgb,var(--luxia-error-70)_6%,transparent)] text-[var(--luxia-error-70)]";

export const PIPELINE_COMPACT_STATUS_BADGE_CLASS =
  "min-h-0 max-w-full gap-0.5 px-1.5 py-0 luxia-type-caption [&>svg]:size-[11px]";

export function pipelineTaskStatusBadgeClass(
  status: PipelineTaskStatus,
): string | undefined {
  return status === "upstream_failed" ? UPSTREAM_FAILED_BADGE_CLASS : undefined;
}

export function formatPipelineLastRunRelative(
  iso: string | null,
  nowMs: number = Date.now(),
): string {
  if (!iso) return "Never run";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "Unknown";

  const delta = Math.max(0, nowMs - then);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 12) return `${hours}h ago`;

  const thenDate = new Date(then);
  const nowDate = new Date(nowMs);
  const startOfToday = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
  ).getTime();
  const startOfYesterday = startOfToday - 86_400_000;

  if (then >= startOfYesterday && then < startOfToday) return "Last night";
  if (then >= startOfToday) return `${hours}h ago`;

  const days = Math.floor(delta / 86_400_000);
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;

  return thenDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      thenDate.getFullYear() !== nowDate.getFullYear() ? "numeric" : undefined,
  });
}

export function formatPipelineLastRunExact(iso: string | null): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  return formatPipelineRunStartedDisplay(then);
}

export function formatPipelineRunStartedDisplay(
  value: string | number | Date,
): string {
  const then =
    value instanceof Date
      ? value
      : typeof value === "number"
        ? new Date(value)
        : new Date(Date.parse(value));
  if (Number.isNaN(then.getTime())) return "Unknown";
  return then.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPipelineDuration(seconds: number | null): string {
  if (seconds == null) return "In progress";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes < 60) {
    return rem === 0 ? `${minutes}m` : `${minutes}m ${rem}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return remMin === 0 ? `${hours}h` : `${hours}h ${remMin}m`;
}

/**
 * Task duration for details/lists — never invents “In progress” for tasks
 * that did not start (queued / upstream_failed / skipped).
 */
export function formatTaskDuration(
  seconds: number | null,
  status: PipelineTaskStatus,
): string {
  if (status === "running") {
    return seconds == null ? "In progress" : formatPipelineDuration(seconds);
  }
  if (seconds == null) return "—";
  return formatPipelineDuration(seconds);
}

export function formatPipelineRunLabel(startedAt: string): string {
  return formatPipelineLastRunRelative(startedAt);
}

/**
 * Persistent Run Detail page title — exact start, never relative.
 * Example: "Run — Oct 1, 2026, 5:48 PM"
 */
export function formatPipelineRunPageTitle(startedAt: string): string {
  return `Run — ${formatPipelineRunStartedDisplay(startedAt)}`;
}

/** Final breadcrumb segment — object type, not a changing relative time. */
export function formatPipelineRunBreadcrumbLabel(_startedAt?: string): string {
  return "Run";
}

export function formatTaskStatusLabel(status: PipelineTaskStatus): string {
  return PIPELINE_TASK_STATUS_LABELS[status];
}

export function formatPipelineCountLabel(count: number): string {
  return `${count} ${count === 1 ? "pipeline" : "pipelines"}`;
}
