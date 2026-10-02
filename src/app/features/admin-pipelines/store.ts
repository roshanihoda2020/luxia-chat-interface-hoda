/**
 * Module-level Admin Pipelines prototype store.
 * Survives Admin page unmount so App can sync Admin → Customer state.
 */

import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import {
  ADMIN_AIRFLOW_DAGS,
  ADMIN_AIRFLOW_VARIABLES,
  ADMIN_ORGANIZATIONS,
  ADMIN_PROJECTS,
  createInitialDagMappings,
  createInitialVariables,
} from "./mockData";
import type {
  AdminAirflowDag,
  AdminAirflowLoadState,
  AdminAirflowVariable,
  AdminDagMapping,
  AdminDagMappingInput,
  AdminOrganization,
  AdminProject,
  AdminProjectsLoadState,
  AdminVariableDeclaration,
  AdminVariableInput,
} from "./types";

const PROJECT_LOAD_MS = 420;
const AIRFLOW_LOAD_MS = 550;

type Snapshot = {
  mappings: AdminDagMapping[];
  variables: AdminVariableDeclaration[];
  airflowState: AdminAirflowLoadState;
  projectsLoad: AdminProjectsLoadState;
  projectsLoadOrgId: string | null;
};

const listeners = new Set<() => void>();
let loadToken = 0;

let snapshot: Snapshot = {
  mappings: createInitialDagMappings(),
  variables: createInitialVariables(),
  airflowState: "ready",
  projectsLoad: { status: "idle" },
  projectsLoadOrgId: null,
};

function emit() {
  for (const listener of listeners) listener();
}

function setSnapshot(partial: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...partial };
  emit();
}

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function subscribeAdminPipelines(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAdminPipelinesSnapshot(): Snapshot {
  return snapshot;
}

export function getAdminOrganizations(): AdminOrganization[] {
  return ADMIN_ORGANIZATIONS;
}

export function getAdminProjects(): AdminProject[] {
  return ADMIN_PROJECTS;
}

export function getAdminAirflowDags(): AdminAirflowDag[] {
  return ADMIN_AIRFLOW_DAGS;
}

export function getAdminAirflowVariables(): AdminAirflowVariable[] {
  return ADMIN_AIRFLOW_VARIABLES;
}

function loadProjectsForOrganizationInternal(organizationId: string | null) {
  const token = ++loadToken;
  if (!organizationId) {
    setSnapshot({ projectsLoad: { status: "idle" }, projectsLoadOrgId: null });
    return;
  }
  setSnapshot({
    projectsLoad: { status: "loading" },
    projectsLoadOrgId: organizationId,
  });
  const org = ADMIN_ORGANIZATIONS.find((item) => item.id === organizationId);
  window.setTimeout(() => {
    if (token !== loadToken) return;
    if (org?.projectsLoadFails) {
      setSnapshot({
        projectsLoad: {
          status: "error",
          message: "Could not load projects for this organization.",
        },
        projectsLoadOrgId: organizationId,
      });
      return;
    }
    const active = ADMIN_PROJECTS
      .filter((p) => p.organizationId === organizationId && p.active)
      .map((p) => p.id);
    if (active.length === 0) {
      setSnapshot({
        projectsLoad: { status: "empty" },
        projectsLoadOrgId: organizationId,
      });
      return;
    }
    setSnapshot({
      projectsLoad: { status: "ready", projectIds: active },
      projectsLoadOrgId: organizationId,
    });
  }, PROJECT_LOAD_MS);
}

async function createMappingInternal(input: AdminDagMappingInput) {
  if (!input.dagId.trim() || !input.organizationId || !input.projectId) {
    return { ok: false as const, error: "Required fields are missing." };
  }
  const dagId = input.dagId.trim();
  const duplicate = snapshot.mappings.some(
    (row) => row.dagId === dagId && row.projectId === input.projectId,
  );
  if (duplicate) {
    return {
      ok: false as const,
      error: "This Airflow DAG is already mapped to the selected project.",
    };
  }
  await delay(280);
  const mapping: AdminDagMapping = {
    id: newId("map"),
    dagId,
    displayName: input.displayName.trim() || dagId,
    organizationId: input.organizationId,
    projectId: input.projectId,
    documentationUrl: input.documentationUrl.trim() || null,
    constellationId: input.constellationId.trim() || null,
    enabledActions: [...input.enabledActions],
    attachedVariableIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  setSnapshot({ mappings: [mapping, ...snapshot.mappings] });
  return { ok: true as const, mapping };
}

async function updateMappingInternal(id: string, input: AdminDagMappingInput) {
  if (!input.dagId.trim() || !input.organizationId || !input.projectId) {
    return { ok: false as const, error: "Required fields are missing." };
  }
  const dagId = input.dagId.trim();
  const duplicate = snapshot.mappings.some(
    (row) =>
      row.id !== id
      && row.dagId === dagId
      && row.projectId === input.projectId,
  );
  if (duplicate) {
    return {
      ok: false as const,
      error: "This Airflow DAG is already mapped to the selected project.",
    };
  }
  await delay(280);
  let detachedVariables = false;
  let updated: AdminDagMapping | null = null;
  const mappings = snapshot.mappings.map((row) => {
    if (row.id !== id) return row;
    const projectChanged = row.projectId !== input.projectId;
    detachedVariables = projectChanged && row.attachedVariableIds.length > 0;
    updated = {
      ...row,
      dagId,
      displayName: input.displayName.trim() || dagId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      documentationUrl: input.documentationUrl.trim() || null,
      constellationId: input.constellationId.trim() || null,
      enabledActions: [...input.enabledActions],
      attachedVariableIds: projectChanged ? [] : row.attachedVariableIds,
      updatedAt: nowIso(),
    };
    return updated;
  });
  if (!updated) return { ok: false as const, error: "Mapping not found." };
  setSnapshot({ mappings });
  return { ok: true as const, mapping: updated, detachedVariables };
}

async function deleteMappingInternal(id: string) {
  await delay(220);
  setSnapshot({ mappings: snapshot.mappings.filter((row) => row.id !== id) });
}

async function createVariableInternal(input: AdminVariableInput) {
  if (!input.key.trim() || !input.organizationId || !input.projectId || !input.type) {
    return { ok: false as const, error: "Required fields are missing." };
  }
  const key = input.key.trim();
  if (input.type === "select" && input.allowedValues.map((v) => v.trim()).filter(Boolean).length === 0) {
    return { ok: false as const, error: "Select types need at least one allowed value." };
  }
  const duplicate = snapshot.variables.some(
    (row) => row.key === key && row.projectId === input.projectId,
  );
  if (duplicate) {
    return {
      ok: false as const,
      error: "This variable key is already declared for the selected project.",
    };
  }
  await delay(280);
  const variable: AdminVariableDeclaration = {
    id: newId("var"),
    key,
    label: input.label.trim() || input.key.trim(),
    description: input.description.trim(),
    type: input.type,
    sensitive: input.sensitive,
    allowedValues:
      input.type === "select"
        ? input.allowedValues.map((v) => v.trim()).filter(Boolean)
        : undefined,
    organizationId: input.organizationId,
    projectId: input.projectId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  setSnapshot({ variables: [variable, ...snapshot.variables] });
  return { ok: true as const, variable };
}

async function updateVariableInternal(
  id: string,
  input: Pick<AdminVariableInput, "label" | "description" | "type" | "sensitive" | "allowedValues">,
) {
  if (input.type === "select" && input.allowedValues.map((v) => v.trim()).filter(Boolean).length === 0) {
    return { ok: false as const, error: "Select types need at least one allowed value." };
  }
  await delay(280);
  let updated: AdminVariableDeclaration | null = null;
  const variables = snapshot.variables.map((row) => {
    if (row.id !== id) return row;
    updated = {
      ...row,
      label: input.label.trim() || row.key,
      description: input.description.trim(),
      type: input.type,
      sensitive: input.sensitive,
      allowedValues:
        input.type === "select"
          ? input.allowedValues.map((v) => v.trim()).filter(Boolean)
          : undefined,
      updatedAt: nowIso(),
    };
    return updated;
  });
  if (!updated) return { ok: false as const, error: "Variable not found." };
  setSnapshot({ variables });
  return { ok: true as const, variable: updated };
}

async function deleteVariableInternal(id: string) {
  await delay(220);
  setSnapshot({
    variables: snapshot.variables.filter((row) => row.id !== id),
    mappings: snapshot.mappings.map((row) => ({
      ...row,
      attachedVariableIds: row.attachedVariableIds.filter((vid) => vid !== id),
    })),
  });
}

async function attachVariableInternal(mappingId: string, variableId: string) {
  await delay(160);
  setSnapshot({
    mappings: snapshot.mappings.map((row) => {
      if (row.id !== mappingId) return row;
      if (row.attachedVariableIds.includes(variableId)) return row;
      return {
        ...row,
        attachedVariableIds: [...row.attachedVariableIds, variableId],
        updatedAt: nowIso(),
      };
    }),
  });
}

async function detachVariableInternal(mappingId: string, variableId: string) {
  await delay(160);
  setSnapshot({
    mappings: snapshot.mappings.map((row) => {
      if (row.id !== mappingId) return row;
      return {
        ...row,
        attachedVariableIds: row.attachedVariableIds.filter((vid) => vid !== variableId),
        updatedAt: nowIso(),
      };
    }),
  });
}

function simulateAirflowLoadInternal() {
  setSnapshot({ airflowState: "loading" });
  window.setTimeout(() => {
    setSnapshot({ airflowState: "ready" });
  }, AIRFLOW_LOAD_MS);
}

function resetPrototypeInternal() {
  loadToken += 1;
  snapshot = {
    mappings: createInitialDagMappings(),
    variables: createInitialVariables(),
    airflowState: "ready",
    projectsLoad: { status: "idle" },
    projectsLoadOrgId: null,
  };
  emit();
  simulateAirflowLoadInternal();
}

export interface AdminPipelinesStore {
  organizations: AdminOrganization[];
  projects: AdminProject[];
  mappings: AdminDagMapping[];
  variables: AdminVariableDeclaration[];
  airflowDags: AdminAirflowDag[];
  airflowVariables: AdminAirflowVariable[];
  airflowState: AdminAirflowLoadState;
  setAirflowState: (state: AdminAirflowLoadState) => void;
  simulateAirflowLoad: () => void;
  loadProjectsForOrganization: (organizationId: string | null) => void;
  projectsLoad: AdminProjectsLoadState;
  getOrganizationName: (id: string) => string;
  getProjectName: (id: string) => string;
  mappingCountForDag: (dagId: string) => number;
  dagsForVariable: (variableId: string) => AdminDagMapping[];
  createMapping: (input: AdminDagMappingInput) => Promise<{ ok: true; mapping: AdminDagMapping } | { ok: false; error: string }>;
  updateMapping: (
    id: string,
    input: AdminDagMappingInput,
  ) => Promise<{ ok: true; mapping: AdminDagMapping; detachedVariables: boolean } | { ok: false; error: string }>;
  deleteMapping: (id: string) => Promise<void>;
  createVariable: (input: AdminVariableInput) => Promise<{ ok: true; variable: AdminVariableDeclaration } | { ok: false; error: string }>;
  updateVariable: (
    id: string,
    input: Pick<AdminVariableInput, "label" | "description" | "type" | "sensitive" | "allowedValues">,
  ) => Promise<{ ok: true; variable: AdminVariableDeclaration } | { ok: false; error: string }>;
  deleteVariable: (id: string) => Promise<void>;
  attachVariable: (mappingId: string, variableId: string) => Promise<void>;
  detachVariable: (mappingId: string, variableId: string) => Promise<void>;
  resetPrototype: () => void;
}

export function useAdminPipelinesStore(): AdminPipelinesStore {
  const snap = useSyncExternalStore(
    subscribeAdminPipelines,
    getAdminPipelinesSnapshot,
    getAdminPipelinesSnapshot,
  );

  const projectsLoadRef = useRef(snap.projectsLoad);
  projectsLoadRef.current = snap.projectsLoad;

  const orgById = useMemo(() => {
    const map = new Map(ADMIN_ORGANIZATIONS.map((o) => [o.id, o]));
    return map;
  }, []);

  const projectById = useMemo(() => {
    const map = new Map(ADMIN_PROJECTS.map((p) => [p.id, p]));
    return map;
  }, []);

  const getOrganizationName = useCallback(
    (id: string) => orgById.get(id)?.name ?? id,
    [orgById],
  );

  const getProjectName = useCallback(
    (id: string) => projectById.get(id)?.name ?? id,
    [projectById],
  );

  const mappingCountForDag = useCallback(
    (dagId: string) => snap.mappings.filter((m) => m.dagId === dagId).length,
    [snap.mappings],
  );

  const dagsForVariable = useCallback(
    (variableId: string) =>
      snap.mappings.filter((m) => m.attachedVariableIds.includes(variableId)),
    [snap.mappings],
  );

  return {
    organizations: ADMIN_ORGANIZATIONS,
    projects: ADMIN_PROJECTS,
    mappings: snap.mappings,
    variables: snap.variables,
    airflowDags: ADMIN_AIRFLOW_DAGS,
    airflowVariables: ADMIN_AIRFLOW_VARIABLES,
    airflowState: snap.airflowState,
    setAirflowState: (state) => setSnapshot({ airflowState: state }),
    simulateAirflowLoad: simulateAirflowLoadInternal,
    loadProjectsForOrganization: loadProjectsForOrganizationInternal,
    projectsLoad: snap.projectsLoad,
    getOrganizationName,
    getProjectName,
    mappingCountForDag,
    dagsForVariable,
    createMapping: createMappingInternal,
    updateMapping: updateMappingInternal,
    deleteMapping: deleteMappingInternal,
    createVariable: createVariableInternal,
    updateVariable: updateVariableInternal,
    deleteVariable: deleteVariableInternal,
    attachVariable: attachVariableInternal,
    detachVariable: detachVariableInternal,
    resetPrototype: resetPrototypeInternal,
  };
}
