import type { AdminDagActionKey, AdminVariableType } from "./types";

export const ADMIN_DAG_ACTION_LABELS: Record<AdminDagActionKey, string> = {
  trigger: "Allow manual runs",
  clear_task: "Allow retrying failed tasks",
  update_variables: "Allow editing variables",
};

/** Compact table-only labels — not used in Edit dialog. */
export const ADMIN_DAG_ACTION_TABLE_LABELS: Record<AdminDagActionKey, string> = {
  trigger: "Manual runs",
  clear_task: "Retry failed tasks",
  update_variables: "Edit variables",
};

export const ADMIN_DAG_ACTION_HELPERS: Record<AdminDagActionKey, string> = {
  trigger: "Customers with write access can start a new pipeline run from Luxia.",
  clear_task: "Customers can retry a failed task.",
  update_variables: "Customers can change exposed variable values for future runs.",
};

export const ADMIN_VARIABLE_TYPE_LABELS: Record<AdminVariableType, string> = {
  text: "Text",
  number: "Number",
  boolean: "Boolean",
  select: "Select",
};

export function formatEnabledActions(actions: AdminDagActionKey[]): string {
  if (actions.length === 0) return "None";
  return actions.map((key) => ADMIN_DAG_ACTION_LABELS[key]).join(" · ");
}

export function getEnabledActionTableLabels(
  actions: AdminDagActionKey[],
): string[] {
  return actions.map((key) => ADMIN_DAG_ACTION_TABLE_LABELS[key]);
}

export function formatEnabledActionsCompact(actions: AdminDagActionKey[]): string {
  if (actions.length === 0) return "None";
  return getEnabledActionTableLabels(actions).join(" · ");
}

export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
