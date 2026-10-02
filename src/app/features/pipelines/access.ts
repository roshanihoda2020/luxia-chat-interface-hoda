import type { ProjectRole } from "@/app/features/permissions/types";
import type {
  PipelineEnabledActions,
  PipelineTaskStatus,
  ProjectPipelineRecord,
} from "./types";

/**
 * Prototype stand-in for Feature Access: Pipelines → Pipelines viewer.
 * Replace when the real feature-access contract is wired.
 */
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

export function canRetryFailedTask(
  pipeline: ProjectPipelineRecord,
  taskStatus: PipelineTaskStatus,
  projectRole: ProjectRole | null | undefined,
  isOrgAdmin: boolean,
): boolean {
  if (!hasPipelineWriteRole(projectRole, isOrgAdmin)) return false;
  if (!pipeline.enabledActions.clear) return false;
  return taskStatus === "failed" || taskStatus === "upstream_failed";
}

export const PIPELINE_TRIGGER_DENIED_MESSAGE =
  "You do not have permission to run this pipeline.";

export const PIPELINE_VARIABLES_DENIED_MESSAGE =
  "You do not have permission to edit variables for this pipeline.";

export const PIPELINE_RETRY_DENIED_MESSAGE =
  "You do not have permission to retry this task.";

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
