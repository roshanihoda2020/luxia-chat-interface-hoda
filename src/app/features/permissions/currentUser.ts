/**
 * Prototype-only demo identity.
 * Organization role is user-level; Project role comes from the active
 * Project membership. Demo labels are presentation-only and must never
 * be used for authorization. Production authorization must be enforced
 * by the backend.
 */

import type { ProjectRole } from "./types";

/** The identity every prototype session starts as (the account menu can switch it). */
export const PROTOTYPE_DEFAULT_USER_ID = "user-05";

/**
 * The invited Member who has not used Luxia yet: no Projects, Data Sources,
 * Chats or Dashboards. Selectable in Switch demo identity to preview the
 * first-time Home, although the invitation itself is still pending.
 */
export const FIRST_TIME_DEMO_USER_ID = "user-06";

export let CURRENT_USER_ID = PROTOTYPE_DEFAULT_USER_ID;

export function setPrototypeCurrentUserId(userId: string): void {
  CURRENT_USER_ID = userId;
}

const DEMO_IDENTITY_KEY = "luxia.prototype-demo-identity.v1";

/** Remembers the identity chosen in Switch demo identity, for this browser only. */
export function rememberPrototypeUserId(userId: string): void {
  try {
    localStorage.setItem(DEMO_IDENTITY_KEY, userId);
  } catch {
    /* storage unavailable: the session simply starts as the default identity */
  }
}

/** Restores the remembered identity if `isSelectable` still accepts it; otherwise keeps the default. */
export function restorePrototypeUserId(isSelectable: (userId: string) => boolean): string {
  try {
    const stored = localStorage.getItem(DEMO_IDENTITY_KEY);
    if (stored && isSelectable(stored)) CURRENT_USER_ID = stored;
  } catch {
    /* fall back to the default identity */
  }
  return CURRENT_USER_ID;
}

export function formatOrganizationRoleLabel(
  orgRole: string | undefined | null,
): string {
  return orgRole === "Admin" ? "Org Admin" : "Org Member";
}

const NO_PROJECT_ROLE_LABEL = "No Project role";

/**
 * Demo selector secondary line — Organization role plus optional Project role.
 * Never use for authorization; resolve membership via getActiveProjectMembership.
 */
export function formatDemoIdentityContextLabel(input: {
  orgRole: string;
  projectRole?: ProjectRole | null;
  includeProjectRole?: boolean;
}): string {
  const org = formatOrganizationRoleLabel(input.orgRole);
  if (!input.includeProjectRole) return org;
  const project = input.projectRole ?? NO_PROJECT_ROLE_LABEL;
  return `${org} · ${project}`;
}

export { NO_PROJECT_ROLE_LABEL };
