import { applyResponsePresentationState } from "./previewModel";
import type {
  AppliedResponsePresentation,
  ResponseConfidencePolicy,
  ResponseConfidencePreviewState,
} from "./types";

/**
 * Maps a real 0–1 confidence onto the Constellation policy. Do not call without a genuine score.
 * Galaxy uses the matched Constellation (`message.galaxy.matched.id`); there is no Galaxy policy.
 * Backend: confidence + policy → this helper → Message.responsePresentation → AICard,
 * or pass resolved responsePresentation directly.
 */
export function resolveResponsePresentationState(
  confidence: number,
  policy: ResponseConfidencePolicy,
): ResponseConfidencePreviewState {
  if (!Number.isFinite(confidence)) return "normal";
  const value = confidence < 0 ? 0 : confidence > 1 ? 1 : confidence;
  if (value >= policy.upper.value) return "normal";
  if (value >= policy.lower.value) return policy.upper.action;
  return policy.lower.action;
}

export function resolveResponsePresentation(
  confidence: number,
  policy: ResponseConfidencePolicy,
  generatedContent: string,
): AppliedResponsePresentation {
  return applyResponsePresentationState(
    resolveResponsePresentationState(confidence, policy),
    policy,
    generatedContent,
  );
}
