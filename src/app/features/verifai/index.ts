export { VerifyReviewModal } from "./VerifyReviewModal";
export { VerifaiReviewMessage, VerifaiChatActionsContext, type VerifaiChatActions } from "./VerifaiReviewMessage";
export { VerifaiComposerIndicator } from "./VerifaiComposerIndicator";
export {
  getVerifaiFollowUp,
  getVerifaiReview,
  linkVerifaiReviewToChat,
  listVerifaiReviews,
  setVerifaiFollowUp,
  startVerifaiReview,
  useVerifaiFollowUp,
  useVerifaiReview,
  useVerifaiReviewsVersion,
} from "./verifaiStore";
export {
  listVerifaiChecklistFiles,
  listVerifaiLibraryFiles,
  listVerifaiTargetFiles,
  useVerifaiLibraryVersion,
  type VerifaiLibraryFile,
} from "./libraryStore";
export {
  VERIFAI_LIBRARY_MANAGE_DENIED_MESSAGE,
  VERIFAI_RUN_DENIED_MESSAGE,
  canManageVerifaiLibrary,
  canRunVerifaiReview,
  canViewVerifaiReview,
  type VerifaiViewer,
} from "./access";
export { answerReviewFollowUp } from "./reviewText";
export { ActivitySection } from "./components/ActivitySection";
export { FindingCard } from "./components/FindingCard";
export { ReviewContextLine, StageList } from "./components/ReviewParts";
export { ReviewMetrics } from "./components/ReviewMetrics";
export { downloadReport } from "./components/reviewActions";
export type {
  VerifaiLaunchContext,
  VerifaiLaunchOrigin,
  VerifaiRequirementResult,
  VerifaiRequirementStatus,
  VerifaiReview,
  VerifaiStartInput,
} from "./types";

/** Composer tool reachable with "@": typed as @verifai, shown as "VerifAI". */
export const VERIFAI_COMMAND = {
  id: "verifai",
  trigger: "@verifai",
  label: "VerifAI",
  description: "Verify documents against a checklist",
} as const;
