import type { HomeTile, HomeTileTarget } from "./types";

/**
 * Specific Dashboard tiles point at one named Dashboard:
 *   { scope: "dashboard", entityId: <Dashboard id>, projectId: <Project id> }.
 *
 * Layouts saved under the old one-Dashboard-per-Project model point at the
 * Project instead ({ entityId: <Project id>, projectId: <Project id> }). Those
 * are resolved at render time, without rewriting the stored layout:
 * - to the Project's Dashboard that replaced its old single Dashboard
 *   (`migratedFromLegacy`), when that Dashboard still exists and the user can
 *   access the Project — an exact, unambiguous mapping;
 * - otherwise to an unavailable state ("Choose Dashboard" or "Remove"). Never to some
 *   other Dashboard picked by position or name.
 */

export interface HomeDashboardRef {
  id: string;
  projectId: string;
  migratedFromLegacy?: boolean;
}

export type HomeDashboardResolution<D extends HomeDashboardRef> =
  | { status: "ok"; dashboard: D; legacy: boolean }
  | {
      status: "unavailable";
      /**
       * "missing": deleted, or in a Project the user can't access (not told apart, so
       * nothing about inaccessible Projects leaks). "legacy-unmapped": an old Project
       * Dashboard tile whose Project is accessible but has no replacement Dashboard.
       */
      reason: "missing" | "legacy-unmapped";
      /** Set for "legacy-unmapped": the accessible Project the old tile pointed at. */
      projectId?: string;
    };

/** True for targets saved under the one-Dashboard-per-Project model. */
export function isLegacyDashboardTarget(
  target: HomeTileTarget,
  knownDashboardIds: ReadonlySet<string>,
): boolean {
  if (target.scope !== "dashboard" || knownDashboardIds.has(target.entityId)) return false;
  return target.projectId === undefined || target.projectId === target.entityId;
}

/**
 * @param accessible Dashboards in Projects the current user can access.
 * @param accessibleProjectIds Those Projects.
 * @param allDashboardIds Every Dashboard id (any Project), so a current-model
 *   target to an inaccessible Dashboard is never mistaken for a legacy one.
 */
export function resolveHomeDashboardTarget<D extends HomeDashboardRef>(
  target: HomeTileTarget | undefined,
  accessible: readonly D[],
  accessibleProjectIds: ReadonlySet<string>,
  allDashboardIds: ReadonlySet<string> = new Set(accessible.map((item) => item.id)),
): HomeDashboardResolution<D> {
  if (!target || target.scope !== "dashboard") return { status: "unavailable", reason: "missing" };

  const direct = accessible.find((item) => item.id === target.entityId);
  if (direct) {
    // A stored Project scope that disagrees with the Dashboard's Project is not trusted.
    if (target.projectId && target.projectId !== direct.projectId) return { status: "unavailable", reason: "missing" };
    return { status: "ok", dashboard: direct, legacy: false };
  }

  if (!isLegacyDashboardTarget(target, allDashboardIds)) return { status: "unavailable", reason: "missing" };

  const projectId = target.entityId;
  if (!accessibleProjectIds.has(projectId)) return { status: "unavailable", reason: "missing" };
  const replacement = accessible.find((item) => item.projectId === projectId && item.migratedFromLegacy);
  return replacement
    ? { status: "ok", dashboard: replacement, legacy: true }
    : { status: "unavailable", reason: "legacy-unmapped", projectId };
}

/** The current-model target for a Dashboard. */
export function homeDashboardTarget(dashboard: HomeDashboardRef): HomeTileTarget {
  return { scope: "dashboard", entityId: dashboard.id, projectId: dashboard.projectId };
}

/**
 * A copy of the tile whose legacy target is replaced by the Dashboard it maps
 * to — for Configure (so the mapped Dashboard shows as current) and duplicate
 * checks. Storage is untouched; the target is only rewritten if the user saves.
 */
export function withResolvedDashboardTarget<D extends HomeDashboardRef>(
  tile: HomeTile,
  resolution: HomeDashboardResolution<D>,
): HomeTile {
  if (tile.type !== "dashboard" || resolution.status !== "ok" || !resolution.legacy) return tile;
  return { ...tile, target: homeDashboardTarget(resolution.dashboard) };
}
