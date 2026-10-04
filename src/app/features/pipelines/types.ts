export type PipelineStatus = "success" | "running" | "failed" | "paused";

export type PipelineRunStatus = "success" | "running" | "failed";

export type PipelineTaskStatus =
  | "success"
  | "running"
  | "failed"
  | "queued"
  | "skipped"
  | "upstream_failed";

export type PipelineVariableType = "text" | "number" | "boolean" | "select";

/** Select choice — labels come from data, not hard-coded UI knowledge. */
export type PipelineSelectOption = {
  value: string;
  label: string;
};

/** Mapping-level action gates (AND with write-capable role). */
export interface PipelineEnabledActions {
  trigger: boolean;
  clear: boolean;
  updateVariables: boolean;
}

export interface ProjectPipelineRecord {
  id: string;
  projectId: string;
  /** Luxia Display name — never derive from dagId for customer rendering. */
  name: string;
  dagId: string;
  /** Optional Luxia customer-facing Pipeline description. */
  description?: string | null;
  status: PipelineStatus;
  lastRunAt: string | null;
  scheduleLabel: string;
  /**
   * Optional documentation URL.
   * Prototype placeholders may use example.com — open only via explicit docs actions.
   */
  documentationUrl?: string | null;
  feedsConstellationId?: string | null;
  /** Prototype mapping action gates — replace with backend mapping later. */
  enabledActions: PipelineEnabledActions;
}

export interface PipelineRunRecord {
  id: string;
  pipelineId: string;
  projectId: string;
  status: PipelineRunStatus;
  startedAt: string;
  durationSeconds: number | null;
  taskCount: number;
  failedTaskCount?: number;
}

export interface PipelineTaskRecord {
  id: string;
  runId: string;
  pipelineId: string;
  projectId: string;
  /** Stable task key within the pipeline topology. */
  taskKey: string;
  name: string;
  status: PipelineTaskStatus;
  durationSeconds: number | null;
  attempt: number;
  upstreamKeys: string[];
}

export interface PipelineVariableRecord {
  id: string;
  pipelineId: string;
  projectId: string;
  key: string;
  label: string;
  description: string;
  type: PipelineVariableType;
  value: string | number | boolean | null;
  /** When true, value must not be revealed — only replaceable. */
  sensitive: boolean;
  /** Select option values (legacy / bridge). Prefer `selectOptions` when labels differ. */
  allowedValues?: string[];
  /** Preferred select metadata — display labels from data. */
  selectOptions?: PipelineSelectOption[];
}

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  success: "Success",
  running: "Running",
  failed: "Failed",
  paused: "Paused",
};

export const PIPELINE_RUN_STATUS_LABELS: Record<PipelineRunStatus, string> = {
  success: "Success",
  running: "Running",
  failed: "Failed",
};

export const PIPELINE_TASK_STATUS_LABELS: Record<PipelineTaskStatus, string> = {
  success: "Success",
  running: "Running",
  failed: "Failed",
  queued: "Queued",
  skipped: "Skipped",
  upstream_failed: "Upstream failed",
};
