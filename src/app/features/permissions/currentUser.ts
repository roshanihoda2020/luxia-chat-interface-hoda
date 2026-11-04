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

export let CURRENT_USER_ID = PROTOTYPE_DEFAULT_USER_ID;

export function setPrototypeCurrentUserId(userId: string): void {
  CURRENT_USER_ID = userId;
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
