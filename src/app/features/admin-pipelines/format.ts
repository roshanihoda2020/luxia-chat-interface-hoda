import type { AdminDagActionKey, AdminVariableType } from "./types";

export const ADMIN_DAG_ACTION_LABELS: Record<AdminDagActionKey, string> = {
  trigger: "Allow manual runs",
  clear_task: "Allow retrying failed tasks",
  update_variables: "Allow editing variables",
};

export const ADMIN_DAG_ACTION_TABLE_LABELS: Record<AdminDagActionKey, string> = {
  trigger: "Manual runs",
  clear_task: "Retry failed tasks",
  update_variables: "Edit variables",
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

export const ADMIN_PIPELINE_DISPLAY_NAME_MAX = 120;
export const ADMIN_PIPELINE_DESCRIPTION_MAX = 500;
export const ADMIN_VARIABLE_LABEL_MAX = 80;
export const ADMIN_VARIABLE_DESCRIPTION_MAX = 500;

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

export type AdminSelectOption = { value: string; label: string };

/** Parse select options: one per line (or comma-separated). Optional `value|Label`. */
export function parseAdminSelectOptionLines(text: string): AdminSelectOption[] {
  const seen = new Set<string>();
  const options: AdminSelectOption[] = [];
  for (const raw of text.split(/\n|,/)) {
    const line = raw.trim();
    if (!line) continue;
    const idx = line.indexOf("|");
    const value = (idx >= 0 ? line.slice(0, idx) : line).trim();
    const label = (idx >= 0 ? line.slice(idx + 1) : line).trim() || value;
    if (!value || seen.has(value)) continue;
    seen.add(value);
    options.push({ value, label });
  }
  return options;
}

export function formatAdminSelectOptionLines(
  options: AdminSelectOption[] | undefined,
  fallbackValues?: string[],
): string {
  const list =
    options && options.length > 0
      ? options
      : (fallbackValues ?? []).map((value) => ({ value, label: value }));
  return list
    .map((option) =>
      option.label && option.label !== option.value
        ? `${option.value}|${option.label}`
        : option.value,
    )
    .join("\n");
}
