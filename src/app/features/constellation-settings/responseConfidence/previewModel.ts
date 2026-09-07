import type {
  AppliedResponsePresentation,
  ResponseConfidencePolicy,
  ResponseConfidencePreviewState,
} from "./types";

/**
 * Applies a resolved state to policy copy. Does not score confidence.
 */
export function applyResponsePresentationState(
  state: ResponseConfidencePreviewState,
  policy: ResponseConfidencePolicy,
  generatedContent: string,
): AppliedResponsePresentation {
  const isBlock = state === "block";
  const notice =
    state === "warning" && policy.warningAppend
      ? policy.warningMessage
      : state === "error" && policy.errorAppend
        ? policy.errorMessage
        : null;

  return {
    presentation: state,
    content: isBlock ? policy.blockDefaultAnswer : generatedContent,
    notice,
    showSources: !isBlock,
    footerVariant: isBlock ? "copy-only" : "full",
  };
}

/**
 * Settings preview from the in-memory draft, not saved policy.
 */
export function getLiveChatPreviewModel(
  draft: ResponseConfidencePolicy,
  previewState: ResponseConfidencePreviewState,
  sampleGeneratedAnswer: string,
): AppliedResponsePresentation {
  return applyResponsePresentationState(previewState, draft, sampleGeneratedAnswer);
}
