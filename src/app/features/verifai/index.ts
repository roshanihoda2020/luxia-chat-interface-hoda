export { VerifyReviewModal } from "./VerifyReviewModal";
export { VerifaiReviewMessage, VerifaiChatActionsContext, type VerifaiChatActions } from "./VerifaiReviewMessage";
export { VerifaiComposerIndicator } from "./VerifaiComposerIndicator";
export { getVerifaiFollowUp, getVerifaiReview, setVerifaiFollowUp, startVerifaiReview, useVerifaiFollowUp } from "./verifaiStore";
export { answerReviewFollowUp } from "./reviewText";
export type { VerifaiLaunchContext, VerifaiStartInput } from "./types";

/** Composer tool reachable with "@": typed as @verifai, shown as "VerifAI". */
export const VERIFAI_COMMAND = {
  id: "verifai",
  trigger: "@verifai",
  label: "VerifAI",
  description: "Verify documents against a checklist",
} as const;
