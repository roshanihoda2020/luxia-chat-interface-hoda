import type { ResponseConfidencePolicy } from "./types";

/**
 * Default Warning / Error / Block copy until production strings are supplied.
 */
export const RESPONSE_CONFIDENCE_PLACEHOLDER_COPY = {
  warningMessage:
    "This answer may be incomplete. Please verify important details before using it.",
  errorMessage:
    "This answer has low confidence. Please verify it before using it.",
  blockDefaultAnswer:
    "I do not have enough confidence to answer this from the available knowledge.",
  sampleGeneratedAnswer:
    "The latest policy guidance is in the approved documents for this Constellation.",
} as const;

/** Default policy: 0.9 Warning / 0.3 Block. */
export const DEFAULT_RESPONSE_CONFIDENCE_POLICY: ResponseConfidencePolicy = {
  upper: { value: 0.9, action: "warning" },
  lower: { value: 0.3, action: "block" },
  warningMessage: RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.warningMessage,
  warningAppend: true,
  errorMessage: RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.errorMessage,
  errorAppend: true,
  blockDefaultAnswer: RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.blockDefaultAnswer,
};

export function cloneResponseConfidencePolicy(
  policy: ResponseConfidencePolicy,
): ResponseConfidencePolicy {
  return {
    upper: { value: policy.upper.value, action: policy.upper.action },
    lower: { value: policy.lower.value, action: policy.lower.action },
    warningMessage: policy.warningMessage,
    warningAppend: policy.warningAppend,
    errorMessage: policy.errorMessage,
    errorAppend: policy.errorAppend,
    blockDefaultAnswer: policy.blockDefaultAnswer,
  };
}

export function responseConfidencePolicySignature(
  policy: ResponseConfidencePolicy,
): string {
  return JSON.stringify({
    uv: policy.upper.value,
    ua: policy.upper.action,
    lv: policy.lower.value,
    la: policy.lower.action,
    wm: policy.warningMessage,
    wa: policy.warningAppend,
    em: policy.errorMessage,
    ea: policy.errorAppend,
    bd: policy.blockDefaultAnswer,
  });
}
