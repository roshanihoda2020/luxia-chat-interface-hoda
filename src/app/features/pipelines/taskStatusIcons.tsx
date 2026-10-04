import {
  AlertCircle,
  Check,
  Circle,
  Clock,
  Minus,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PipelineTaskStatus } from "./types";

/** Shared task-status icons for Run History, Task Flow, Tasks list, and Task Details. */
export const PIPELINE_TASK_STATUS_ICON: Record<PipelineTaskStatus, LucideIcon> =
  {
    success: Check,
    running: Circle,
    failed: TriangleAlert,
    queued: Clock,
    skipped: Minus,
    upstream_failed: AlertCircle,
  };

/** Decorative status glyph for badges — label remains the accessible name. */
export function PipelineTaskStatusBadgeIcon({
  status,
  className,
}: {
  status: PipelineTaskStatus;
  className?: string;
}) {
  const Icon = PIPELINE_TASK_STATUS_ICON[status];
  return (
    <Icon
      aria-hidden
      className={className}
      strokeWidth={2.25}
      fill={status === "running" ? "currentColor" : "none"}
    />
  );
}
