/**
 * Admin → Customer prototype bridge.
 * Keeps presentation layers separate; App merges admin snapshot into customer state.
 * Replace with real APIs later — do not treat as persistence.
 */

import type {
  PipelineEnabledActions,
  PipelineVariableRecord,
  ProjectPipelineRecord,
} from "@/app/features/pipelines/types";
import type {
  AdminDagActionKey,
  AdminDagMapping,
  AdminVariableDeclaration,
} from "./types";

export const ADMIN_CUSTOMER_PIPELINE_PREFIX = "admin-pipeline-";
export const ADMIN_CUSTOMER_VARIABLE_PREFIX = "admin-var-";

export function customerPipelineIdFromMapping(mappingId: string): string {
  return `${ADMIN_CUSTOMER_PIPELINE_PREFIX}${mappingId}`;
}

export function isAdminOriginatedPipeline(pipelineId: string): boolean {
  return pipelineId.startsWith(ADMIN_CUSTOMER_PIPELINE_PREFIX);
}

export function isAdminOriginatedVariable(variableId: string): boolean {
  return variableId.startsWith(ADMIN_CUSTOMER_VARIABLE_PREFIX);
}

export function toCustomerEnabledActions(
  actions: AdminDagActionKey[],
): PipelineEnabledActions {
  return {
    trigger: actions.includes("trigger"),
    clear: actions.includes("clear_task"),
    updateVariables: actions.includes("update_variables"),
  };
}

export function mappingToCustomerPipeline(
  mapping: AdminDagMapping,
): ProjectPipelineRecord {
  return {
    id: customerPipelineIdFromMapping(mapping.id),
    projectId: mapping.projectId,
    name: mapping.displayName.trim() || mapping.dagId,
    dagId: mapping.dagId,
    status: "paused",
    lastRunAt: null,
    scheduleLabel: "Manual",
    documentationUrl: mapping.documentationUrl,
    feedsConstellationId: mapping.constellationId,
    enabledActions: toCustomerEnabledActions(mapping.enabledActions),
  };
}

export function attachedVariablesToCustomerRecords(
  mapping: AdminDagMapping,
  declarations: AdminVariableDeclaration[],
): PipelineVariableRecord[] {
  const byId = new Map(declarations.map((item) => [item.id, item]));
  return mapping.attachedVariableIds.flatMap((variableId) => {
    const declaration = byId.get(variableId);
    if (!declaration) return [];
    if (
      declaration.organizationId !== mapping.organizationId
      || declaration.projectId !== mapping.projectId
    ) {
      return [];
    }
    return [
      {
        id: `${ADMIN_CUSTOMER_VARIABLE_PREFIX}${mapping.id}-${declaration.id}`,
        pipelineId: customerPipelineIdFromMapping(mapping.id),
        projectId: mapping.projectId,
        key: declaration.key,
        label: declaration.label || declaration.key,
        description: declaration.description,
        type: declaration.type,
        value: declaration.sensitive
          ? null
          : declaration.type === "boolean"
            ? false
            : declaration.type === "number"
              ? 0
              : declaration.type === "select"
                ? (declaration.allowedValues?.[0] ?? "")
                : "",
        sensitive: declaration.sensitive,
        allowedValues: declaration.allowedValues
          ? [...declaration.allowedValues]
          : undefined,
      } satisfies PipelineVariableRecord,
    ];
  });
}

export function mergeAdminIntoCustomerPipelines(
  seedAndRuntime: ProjectPipelineRecord[],
  mappings: AdminDagMapping[],
): ProjectPipelineRecord[] {
  const kept = seedAndRuntime.filter((item) => !isAdminOriginatedPipeline(item.id));
  const existingAdmin = new Map(
    seedAndRuntime
      .filter((item) => isAdminOriginatedPipeline(item.id))
      .map((item) => [item.id, item]),
  );
  const fromAdmin = mappings.map((mapping) => {
    const next = mappingToCustomerPipeline(mapping);
    const previous = existingAdmin.get(next.id);
    if (!previous) return next;
    return {
      ...next,
      status: previous.status,
      lastRunAt: previous.lastRunAt,
      scheduleLabel: previous.scheduleLabel || next.scheduleLabel,
    };
  });
  return [...kept, ...fromAdmin];
}

export function mergeAdminIntoCustomerVariables(
  seedAndRuntime: PipelineVariableRecord[],
  mappings: AdminDagMapping[],
  declarations: AdminVariableDeclaration[],
): PipelineVariableRecord[] {
  const kept = seedAndRuntime.filter((item) => !isAdminOriginatedVariable(item.id));
  const existingAdmin = new Map(
    seedAndRuntime
      .filter((item) => isAdminOriginatedVariable(item.id))
      .map((item) => [item.id, item]),
  );
  const fromAdmin = mappings.flatMap((mapping) =>
    attachedVariablesToCustomerRecords(mapping, declarations).map((next) => {
      const previous = existingAdmin.get(next.id);
      if (!previous) return next;
      return {
        ...next,
        value: previous.value,
      };
    }),
  );
  return [...kept, ...fromAdmin];
}
