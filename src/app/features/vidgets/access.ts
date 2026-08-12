import type { ProjectRole } from "@/app/features/permissions/types";
import { canConfigureConstellation } from "@/app/features/permissions/accessGuards";

/**
 * Vidget management follows Project role.
 * Owner and Manager can create/configure. Org Admin does not bypass.
 */
export function canManageVidgets(
  projectRole: ProjectRole | null | undefined,
): boolean {
  return canConfigureConstellation(projectRole);
}

export const VIDGET_MANAGE_DENIED_MESSAGE =
  "You do not have permission to manage Vidgets for this Project.";
