/**
 * Prototype-only current user identity.
 *
 * The Demo identity selector is a development-only role simulation tool used to
 * preview UX for different mock identities. It does not provide authentication
 * or production authorization.
 *
 * In production:
 * - the current user comes from the authenticated backend session;
 * - permissions come from backend-provided roles, memberships, ownership, and grants;
 * - the frontend uses them for presentation;
 * - the backend must independently authorize routes and mutations.
 *
 * Organization role is user-level.
 * Project role is resolved from current Project membership.
 * Demo labels must never be used for authorization.
 *
 * Live binding so access helpers re-read the active demo user on each call.
 * App must also hold React state keyed to this ID so the UI re-renders.
 */

import type { ProjectRole } from "./types";

export let CURRENT_USER_ID = "user-01";

export function setPrototypeCurrentUserId(userId: string): void {
  CURRENT_USER_ID = userId;
}

/** Presentation-only Organization role label for profile and demo UI. */
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
