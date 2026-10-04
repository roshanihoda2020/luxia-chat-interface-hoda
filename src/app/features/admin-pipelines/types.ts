/**
 * Admin Pipelines — types aligned with future /api/admin/pipelines/* contract.
 * Prototype-only; values never talk to Airflow from the browser.
 */

export type AdminDagActionKey = "trigger" | "clear_task" | "update_variables";

export type AdminVariableType = "text" | "number" | "boolean" | "select";

export type AdminAirflowDagStatus = "active" | "paused";

export type AdminProjectsLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; projectIds: string[] }
  | { status: "empty" }
  | { status: "error"; message: string };

export type AdminAirflowLoadState = "ready" | "loading" | "unavailable" | "empty";

export interface AdminOrganization {
  id: string;
  name: string;
  /** Prototype: force project-load failure for this org. */
  projectsLoadFails?: boolean;
}

export interface AdminProject {
  id: string;
  organizationId: string;
  name: string;
  active: boolean;
  /**
   * When true, this project id matches a Customer Project prototype id
   * (`project-01`…), so Admin mappings surface in Project Pipelines.
   */
  customerLinked?: boolean;
}

export interface AdminDagMapping {
  /** Luxia mapping UUID (maps to :dagUuid in API). */
  id: string;
  dagId: string;
  /** Required Luxia customer-facing Pipeline title. Never fall back to dagId for customers. */
  displayName: string;
  /** Optional Luxia customer-facing Pipeline description. */
  description: string | null;
  organizationId: string;
  projectId: string;
  documentationUrl: string | null;
  constellationId: string | null;
  enabledActions: AdminDagActionKey[];
  attachedVariableIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminVariableDeclaration {
  id: string;
  key: string;
  label: string;
  description: string;
  type: AdminVariableType;
  sensitive: boolean;
  allowedValues?: string[];
  /** Optional richer select metadata (value + display label). */
  selectOptions?: Array<{ value: string; label: string }>;
  organizationId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAirflowDag {
  dagId: string;
  description: string | null;
  status: AdminAirflowDagStatus;
}

export interface AdminAirflowVariable {
  key: string;
  /** Metadata only — never a secret value. */
  description: string | null;
}

export type AdminPipelinesTabId =
  | "dags"
  | "variables"
  | "airflow-dags"
  | "airflow-variables";

export const ADMIN_PIPELINES_TAB_IDS: AdminPipelinesTabId[] = [
  "dags",
  "variables",
  "airflow-dags",
  "airflow-variables",
];

export function parseAdminPipelinesTab(
  value: string | null | undefined,
): AdminPipelinesTabId {
  if (
    value === "dags"
    || value === "variables"
    || value === "airflow-dags"
    || value === "airflow-variables"
  ) {
    return value;
  }
  return "dags";
}

export interface AdminDagMappingInput {
  dagId: string;
  displayName: string;
  description: string;
  organizationId: string;
  projectId: string;
  documentationUrl: string;
  constellationId: string;
  enabledActions: AdminDagActionKey[];
}

export interface AdminVariableInput {
  key: string;
  label: string;
  description: string;
  type: AdminVariableType;
  sensitive: boolean;
  allowedValues: string[];
  selectOptions?: Array<{ value: string; label: string }>;
  organizationId: string;
  projectId: string;
}
