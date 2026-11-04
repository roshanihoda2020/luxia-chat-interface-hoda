import { useSyncExternalStore } from "react";
import { HOME_PROJECTS } from "@/app/features/project/data";
import type { ProjectDashboard } from "./types";

/**
 * Named Project Dashboards (prototype persistence).
 *
 * A Project has two separate areas:
 * - **All Outputs**: every saved output that belongs to the Project
 *   (`getProjectDashboardOutputs`). Outputs exist on their own.
 * - **Dashboards**: zero or more named containers. Each one holds an ordered
 *   list of output IDs from the same Project. Adding, removing or reordering
 *   outputs on a Dashboard never creates, changes or deletes an output, and
 *   deleting a Dashboard leaves every output in All Outputs.
 *
 * Seeded Dashboards are used until the first change. After that the full list
 * is kept in localStorage, so changes survive a refresh. No backend.
 */

const STORAGE_KEY = "luxia.project-dashboards.v1";

type Snapshot = { version: 1; dashboards: ProjectDashboard[] };

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const SEED_NOW = Date.now();

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Matches the seeded output IDs in data.ts (`<projectId>-output-NN`). */
function seedOutputId(projectId: string, n: number): string {
  return `${projectId}-output-${pad(n)}`;
}

/** Demo creators: members of each Project (same roster as the seeded outputs). */
const SEED_CREATORS: Record<string, [string, string, string]> = {
  "project-01": ["user-01", "user-03", "user-05"],
  "project-02": ["user-03", "user-01", "user-03"],
  "project-03": ["user-02", "user-04", "user-01"],
  "project-04": ["user-04", "user-02", "user-03"],
  "project-05": ["user-05", "user-01", "user-04"],
  "project-06": ["user-04", "user-03", "user-05"],
};

/**
 * The ID the first seeded Dashboard of each Project carries. It is also the
 * Dashboard that replaced the Project's single legacy Dashboard, so Home Tiles
 * saved under the old model (which pointed at the Project) map to it.
 */
export function legacyDashboardIdForProject(projectId: string): string {
  return `${projectId}-dashboard-01`;
}

/**
 * Seeds: Projects 01–05 have Dashboards (01 and 03 have three, the others
 * two), each with a different selection of the Project's seeded outputs.
 * Project 06 has saved outputs but no Dashboards, to show that All Outputs
 * does not depend on Dashboards. Generated Projects (07+) and empty Projects
 * have none.
 */
const SEED_PLAN: Record<string, Array<{ n: number; outputs: number[]; creator: 0 | 1 | 2; updatedHoursAgo: number }>> = {
  // Dashboard name 01 replaced each Project's single legacy Dashboard, which showed every output.
  "project-01": [
    { n: 1, outputs: [1, 2, 3, 4, 5, 6, 7, 8], creator: 0, updatedHoursAgo: 2 },
    { n: 2, outputs: [4, 1, 7], creator: 1, updatedHoursAgo: 26 },
    { n: 3, outputs: [2, 3], creator: 2, updatedHoursAgo: 75 },
  ],
  "project-02": [
    { n: 1, outputs: [1, 2, 3, 4, 5, 6, 7, 8], creator: 0, updatedHoursAgo: 52 },
    { n: 2, outputs: [6, 8, 2], creator: 1, updatedHoursAgo: 5 },
  ],
  "project-03": [
    { n: 1, outputs: [1, 2, 3, 4, 5, 6, 7, 8], creator: 0, updatedHoursAgo: 30 },
    { n: 2, outputs: [5, 3], creator: 1, updatedHoursAgo: 9 },
    { n: 3, outputs: [8, 5, 1, 2], creator: 2, updatedHoursAgo: 120 },
  ],
  "project-04": [
    { n: 1, outputs: [1, 2, 3, 4, 5, 6, 7, 8], creator: 0, updatedHoursAgo: 98 },
    { n: 2, outputs: [7, 4, 1, 2], creator: 1, updatedHoursAgo: 14 },
  ],
  "project-05": [
    { n: 1, outputs: [1, 2, 3, 4, 5, 6, 7, 8], creator: 0, updatedHoursAgo: 170 },
    { n: 2, outputs: [], creator: 1, updatedHoursAgo: 40 },
  ],
};

function buildSeedDashboards(): ProjectDashboard[] {
  return HOME_PROJECTS.filter((project) => SEED_PLAN[project.id] && !project.isEmpty).flatMap((project) => {
    const creators = SEED_CREATORS[project.id] ?? ["user-01", "user-01", "user-01"];
    return SEED_PLAN[project.id].map((plan): ProjectDashboard => ({
      id: plan.n === 1 ? legacyDashboardIdForProject(project.id) : `${project.id}-dashboard-${pad(plan.n)}`,
      projectId: project.id,
      name: `Dashboard name ${pad(plan.n)}`,
      outputIds: plan.outputs.map((n) => seedOutputId(project.id, n)),
      createdByUserId: creators[plan.creator],
      createdAtTimestamp: SEED_NOW - DAY_MS * (30 - plan.n * 5),
      updatedAtTimestamp: SEED_NOW - HOUR_MS * plan.updatedHoursAgo,
      ...(plan.n === 1 ? { migratedFromLegacy: true } : {}),
    }));
  });
}

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: ProjectDashboard[] | null = null;

function isDashboard(value: unknown): value is ProjectDashboard {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string"
    && typeof item.projectId === "string"
    && typeof item.name === "string"
    && Array.isArray(item.outputIds)
    && item.outputIds.every((outputId) => typeof outputId === "string")
    && typeof item.createdByUserId === "string"
    && typeof item.updatedAtTimestamp === "number"
  );
}

function readStored(): ProjectDashboard[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot;
    if (parsed?.version !== 1 || !Array.isArray(parsed.dashboards)) return null;
    return parsed.dashboards.filter(isDashboard).map((item) => ({
      ...item,
      createdAtTimestamp: typeof item.createdAtTimestamp === "number" ? item.createdAtTimestamp : item.updatedAtTimestamp,
    }));
  } catch {
    return null;
  }
}

function all(): ProjectDashboard[] {
  if (!cache) cache = readStored() ?? buildSeedDashboards();
  return cache;
}

function commit(next: ProjectDashboard[]): boolean {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      const snapshot: Snapshot = { version: 1, dashboards: next };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage full or blocked: the change still applies for this session.
    }
  }
  listeners.forEach((listener) => listener());
  return true;
}

export function subscribeProjectDashboards(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Every Dashboard, all Projects. Callers filter to Projects the user can access. */
export function listAllProjectDashboards(): readonly ProjectDashboard[] {
  return all();
}

/** One Project's Dashboards, most recently updated first. */
export function listProjectDashboards(projectId: string): ProjectDashboard[] {
  return all()
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => b.updatedAtTimestamp - a.updatedAtTimestamp || a.name.localeCompare(b.name));
}

export function getProjectDashboard(dashboardId: string): ProjectDashboard | null {
  return all().find((item) => item.id === dashboardId) ?? null;
}

/** Re-renders when any Dashboard changes. Returns the full list (stable between changes). */
export function useProjectDashboards(): readonly ProjectDashboard[] {
  return useSyncExternalStore(subscribeProjectDashboards, all, all);
}

/** Suggested name for a new Dashboard: the next free "Dashboard name NN" in that Project. */
export function nextDashboardName(projectId: string): string {
  const taken = new Set(listProjectDashboards(projectId).map((item) => item.name.trim().toLowerCase()));
  for (let n = 1; n < 100; n += 1) {
    const name = `Dashboard name ${pad(n)}`;
    if (!taken.has(name.toLowerCase())) return name;
  }
  return "Dashboard name";
}

export const DASHBOARD_NAME_MAX = 80;

/** Validation shared by Create and Rename. Names are unique within a Project (case-insensitive). */
export function validateDashboardName(
  projectId: string,
  name: string,
  exceptDashboardId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Enter a Dashboard name.";
  if (trimmed.length > DASHBOARD_NAME_MAX) return `Use ${DASHBOARD_NAME_MAX} characters or fewer.`;
  const clash = listProjectDashboards(projectId).some(
    (item) => item.id !== exceptDashboardId && item.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  return clash ? "This Project already has a Dashboard with that name." : null;
}

export function createProjectDashboard(input: {
  projectId: string;
  name: string;
  createdByUserId: string;
  outputIds?: string[];
}): ProjectDashboard | null {
  if (validateDashboardName(input.projectId, input.name)) return null;
  const now = Date.now();
  const record: ProjectDashboard = {
    id: `${input.projectId}-dashboard-${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    projectId: input.projectId,
    name: input.name.trim(),
    outputIds: [...new Set(input.outputIds ?? [])],
    createdByUserId: input.createdByUserId,
    createdAtTimestamp: now,
    updatedAtTimestamp: now,
  };
  commit([record, ...all()]);
  return record;
}

function update(dashboardId: string, patch: (item: ProjectDashboard) => ProjectDashboard | null): ProjectDashboard | null {
  const current = getProjectDashboard(dashboardId);
  if (!current) return null;
  const next = patch(current);
  if (!next) return null;
  const record = { ...next, updatedAtTimestamp: Date.now() };
  commit(all().map((item) => (item.id === dashboardId ? record : item)));
  return record;
}

export function renameProjectDashboard(dashboardId: string, name: string): ProjectDashboard | null {
  return update(dashboardId, (item) =>
    validateDashboardName(item.projectId, name, item.id) ? null : { ...item, name: name.trim() });
}

/** Replaces the Dashboard's selection (order kept, duplicates dropped). Outputs themselves are untouched. */
export function setProjectDashboardOutputs(dashboardId: string, outputIds: readonly string[]): ProjectDashboard | null {
  return update(dashboardId, (item) => ({ ...item, outputIds: [...new Set(outputIds)] }));
}

/** Adds outputs to the end of a Dashboard; outputs already on it are left where they are. */
export function addOutputsToProjectDashboard(dashboardId: string, outputIds: readonly string[]): ProjectDashboard | null {
  return update(dashboardId, (item) => ({ ...item, outputIds: [...new Set([...item.outputIds, ...outputIds])] }));
}

/** Takes an output off one Dashboard. The output stays in All Outputs and on other Dashboards. */
export function removeOutputFromProjectDashboard(dashboardId: string, outputId: string): ProjectDashboard | null {
  return update(dashboardId, (item) =>
    item.outputIds.includes(outputId) ? { ...item, outputIds: item.outputIds.filter((id) => id !== outputId) } : null);
}

/** Moves an output one place earlier (-1) or later (+1) on a Dashboard. */
export function moveOutputOnProjectDashboard(dashboardId: string, outputId: string, delta: -1 | 1): ProjectDashboard | null {
  return update(dashboardId, (item) => {
    const from = item.outputIds.indexOf(outputId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= item.outputIds.length) return null;
    const outputIds = [...item.outputIds];
    [outputIds[from], outputIds[to]] = [outputIds[to], outputIds[from]];
    return { ...item, outputIds };
  });
}

/** Deletes the Dashboard only. Its outputs remain in All Outputs. */
export function deleteProjectDashboard(dashboardId: string): boolean {
  if (!getProjectDashboard(dashboardId)) return false;
  return commit(all().filter((item) => item.id !== dashboardId));
}
