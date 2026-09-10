import type { ProjectRole } from "@/app/features/permissions/types";
import {
  canConfigureConstellation,
  canEditConstellationKnowledge,
} from "@/app/features/permissions/accessGuards";

/**
 * Vidget management follows Project role.
 * Owner and Manager can create/configure. Org Admin does not bypass.
 */
export function canManageVidgets(
  projectRole: ProjectRole | null | undefined,
): boolean {
  return canConfigureConstellation(projectRole);
}

/**
 * Vidget Inbox review: Owner, Manager, Analyst.
 * Reuses the Analyst knowledge-edit gate. Org Admin does not bypass.
 * Data Source View/Use/Manage is not used.
 */
export function canReviewVidgetInbox(
  projectRole: ProjectRole | null | undefined,
): boolean {
  return canEditConstellationKnowledge(projectRole);
}

export const VIDGET_MANAGE_DENIED_MESSAGE =
  "You do not have permission to manage Vidgets for this Project.";

export const VIDGET_INBOX_DENIED_MESSAGE =
  "You do not have permission to review Vidget conversations for this Project.";
