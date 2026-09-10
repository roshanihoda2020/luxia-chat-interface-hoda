import { formatConfidenceValue } from "./validation";
import type { ResponseConfidenceAction, ResponseConfidencePolicy } from "./types";

export function responseConfidenceActionLabel(action: ResponseConfidenceAction): string {
  if (action === "warning") return "Warning";
  if (action === "error") return "Error";
  return "Block";
}

export function describeResponseConfidenceRanges(
  policy: ResponseConfidencePolicy,
): Array<{ range: string; outcome: string }> {
  const upper = formatConfidenceValue(policy.upper.value);
  const lower = formatConfidenceValue(policy.lower.value);
  return [
    {
      range: `${upper} – 1`,
      outcome: "Normal",
    },
    {
      range: `${lower} – below ${upper}`,
      outcome: responseConfidenceActionLabel(policy.upper.action),
    },
    {
      range: `Below ${lower}`,
      outcome: responseConfidenceActionLabel(policy.lower.action),
    },
  ];
}

export function formatResponseConfidenceRangeSummary(
  policy: ResponseConfidencePolicy,
): string {
  const upper = formatConfidenceValue(policy.upper.value);
  const lower = formatConfidenceValue(policy.lower.value);
  const mid = responseConfidenceActionLabel(policy.upper.action);
  const low = responseConfidenceActionLabel(policy.lower.action);
  return `Normal ≥ ${upper} • ${mid} ${lower}–<${upper} • ${low} < ${lower}`;
}
