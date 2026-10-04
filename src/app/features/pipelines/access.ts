import type { ProjectRole } from "@/app/features/permissions/types";
import type {
  PipelineEnabledActions,
  PipelineTaskStatus,
  ProjectPipelineRecord,
} from "./types";

export const PIPELINES_VIEWER_AVAILABLE = true;

export function canViewProjectPipelines(): boolean {
  return PIPELINES_VIEWER_AVAILABLE;
}

/**
 * Prototype write-capable roles for Pipelines (AND mapping.enabledActions).
 * Isolated mock gate — replace with backend permission evaluation later.
 */
export function hasPipelineWriteRole(
  projectRole: ProjectRole | null | undefined,
  isOrgAdmin: boolean,
): boolean {
  if (isOrgAdmin) return true;
  return (
    projectRole === "Project Owner"
    || projectRole === "Project Manager"
    || projectRole === "Analyst"
  );
}

export function canTriggerPipeline(
  pipeline: ProjectPipelineRecord,
  projectRole: ProjectRole | null | undefined,
  isOrgAdmin: boolean,
): boolean {
  return (
    hasPipelineWriteRole(projectRole, isOrgAdmin)
    && pipeline.enabledActions.trigger
    && pipeline.status !== "paused"
  );
}

/**
 * Why Run is unavailable for display purposes.
 * - `paused`: show disabled control with explanation (product state)
 * - `permission`: role or mapping prevents trigger — show disabled with customer message
 */
export type PipelineRunBlockReason = "paused" | "permission";

export function getPipelineRunBlockReason(
  pipeline: ProjectPipelineRecord,
  projectRole: ProjectRole | null | undefined,
  isOrgAdmin: boolean,
): PipelineRunBlockReason | null {
  if (canTriggerPipeline(pipeline, projectRole, isOrgAdmin)) return null;
  if (
    pipeline.status === "paused"
    && hasPipelineWriteRole(projectRole, isOrgAdmin)
    && pipeline.enabledActions.trigger
  ) {
    return "paused";
  }
  return "permission";
}

export function canUpdatePipelineVariables(
  pipeline: ProjectPipelineRecord,
  projectRole: ProjectRole | null | undefined,
  isOrgAdmin: boolean,
): boolean {
  return (
    hasPipelineWriteRole(projectRole, isOrgAdmin)
    && pipeline.enabledActions.updateVariables
  );
}

/** Product intent: only directly failed tasks are retryable (not upstream_failed). */
export function isRetryableTaskStatus(taskStatus: PipelineTaskStatus): boolean {
  return taskStatus === "failed";
}

export function canRetryFailedTask(
  pipeline: ProjectPipelineRecord,
  taskStatus: PipelineTaskStatus,
  projectRole: ProjectRole | null | undefined,
  isOrgAdmin: boolean,
): boolean {
  if (!isRetryableTaskStatus(taskStatus)) return false;
  if (!hasPipelineWriteRole(projectRole, isOrgAdmin)) return false;
  if (!pipeline.enabledActions.clear) return false;
  return true;
}

export const PIPELINE_TRIGGER_DENIED_MESSAGE =
  "You don't have permission to run this pipeline.";

export const PIPELINE_VARIABLES_DENIED_MESSAGE =
  "You don't have permission to edit variables for this pipeline.";

export const PIPELINE_RETRY_DENIED_MESSAGE =
  "You don't have permission to retry this task.";

export const PIPELINE_PAUSED_RUN_MESSAGE =
  "This pipeline is currently paused.";

export const ACTIONS_FULL: PipelineEnabledActions = {
  trigger: true,
  clear: true,
  updateVariables: true,
};

export const ACTIONS_NO_TRIGGER: PipelineEnabledActions = {
  trigger: false,
  clear: true,
  updateVariables: true,
};

export const ACTIONS_NO_VARIABLES: PipelineEnabledActions = {
  trigger: true,
  clear: true,
  updateVariables: false,
};

export const ACTIONS_NO_RETRY: PipelineEnabledActions = {
  trigger: true,
  clear: false,
  updateVariables: true,
};

export const ACTIONS_READ_ONLY: PipelineEnabledActions = {
  trigger: false,
  clear: false,
  updateVariables: false,
};

/** Failed-task retry demo: clear/retry only — no trigger, no variable edits. */
export const ACTIONS_CLEAR_ONLY: PipelineEnabledActions = {
  trigger: false,
  clear: true,
  updateVariables: false,
};
