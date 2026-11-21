import type { ProjectRole } from "@/app/features/permissions/types";
import type { VerifaiReview } from "./types";

/**
 * VerifAI permissions. They only combine the app's existing checks: Project role from an active
 * membership (Org Admin never implies a Project role) and Constellation Use access
 * (`evaluateConstellationUseAccess`). The caller supplies both, so these rules stay pure.
 */
export type VerifaiViewer = {
  userId: string;
  /** Active Project membership AND Use access to the Constellation. */
  canUseConstellation: (projectId: string, constellationId: string) => boolean;
};

export const VERIFAI_RUN_DENIED_MESSAGE = "You need Use access to this Constellation to run a review.";
export const VERIFAI_LIBRARY_MANAGE_DENIED_MESSAGE = "Only Project Owners and Project Managers can manage the shared review library.";

/** Run a review, and upload files used only by your own reviews. */
export function canRunVerifaiReview(projectRole: ProjectRole | null | undefined, constellationUsable: boolean): boolean {
  return Boolean(projectRole) && constellationUsable;
}

/**
 * A review is visible when the viewer can still Use its Constellation AND either created it
 * (every user-created review, including Chat reviews, is private) or it is shared with the
 * Constellation (seeded demo reviews only for now).
 */
export function canViewVerifaiReview(review: VerifaiReview, viewer: VerifaiViewer): boolean {
  if (!viewer.canUseConstellation(review.projectId, review.scope.constellationId)) return false;
  return review.createdByUserId === viewer.userId || review.visibility === "constellation";
}

/** Add, share or remove files in the Constellation's shared review library. */
export function canManageVerifaiLibrary(projectRole: ProjectRole | null | undefined): boolean {
  return projectRole === "Project Owner" || projectRole === "Project Manager";
}
