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

/**
 * Map Admin mapping → customer pipeline.
 * Returns null when Display name is missing — never invent a title from dagId.
 */
export function mappingToCustomerPipeline(
  mapping: AdminDagMapping,
  previousName?: string,
): ProjectPipelineRecord | null {
  const name = mapping.displayName.trim() || previousName?.trim() || "";
  if (!name) return null;

  return {
    id: customerPipelineIdFromMapping(mapping.id),
    projectId: mapping.projectId,
    name,
    dagId: mapping.dagId,
    description: mapping.description,
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
    const label = declaration.label.trim();
    if (!label) return [];
    return [
      {
        id: `${ADMIN_CUSTOMER_VARIABLE_PREFIX}${mapping.id}-${declaration.id}`,
        pipelineId: customerPipelineIdFromMapping(mapping.id),
        projectId: mapping.projectId,
        key: declaration.key,
        label,
        description: declaration.description,
        type: declaration.type,
        value: declaration.sensitive
          ? null
          : declaration.type === "boolean"
            ? false
            : declaration.type === "number"
              ? 0
              : declaration.type === "select"
                ? (declaration.selectOptions?.[0]?.value
                  ?? declaration.allowedValues?.[0]
                  ?? "")
                : "",
        sensitive: declaration.sensitive,
        selectOptions: declaration.selectOptions
          ? declaration.selectOptions.map((option) => ({ ...option }))
          : declaration.allowedValues
            ? declaration.allowedValues.map((value) => ({
                value,
                label: value,
              }))
            : undefined,
        allowedValues: declaration.allowedValues
          ? [...declaration.allowedValues]
          : declaration.selectOptions
            ? declaration.selectOptions.map((option) => option.value)
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
  const fromAdmin = mappings.flatMap((mapping) => {
    const previous = existingAdmin.get(customerPipelineIdFromMapping(mapping.id));
    const next = mappingToCustomerPipeline(mapping, previous?.name);
    if (!next) return [];
    if (!previous) return [next];
    return [
      {
        ...next,
        // Refresh Luxia mapping-owned fields from `next`; preserve runtime facts.
        status: previous.status,
        lastRunAt: previous.lastRunAt,
        scheduleLabel: previous.scheduleLabel || next.scheduleLabel,
      },
    ];
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
