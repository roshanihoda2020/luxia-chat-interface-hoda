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
 * Live binding so access helpers re-read the active demo user on each call.
 * App must also hold React state keyed to this ID so the UI re-renders.
 */

export let CURRENT_USER_ID = "user-01";

export function setPrototypeCurrentUserId(userId: string): void {
  CURRENT_USER_ID = userId;
}

/**
 * Stable UX labels for the Demo identity selector only.
 * Not Organization roles and not a substitute for Project membership checks.
 */
export const DEMO_PERSONA_ROLE_LABELS: Record<string, string> = {
  "user-01": "Project Owner",
  "user-02": "Project Manager",
  "user-03": "Analyst",
  "user-04": "Member",
};

export function getDemoPersonaRoleLabel(userId: string): string {
  return DEMO_PERSONA_ROLE_LABELS[userId] ?? "Member";
}
