import type { ResponseConfidenceAction, ResponseConfidencePolicy, ResponseConfidenceValidation } from "./types";

export const RESPONSE_CONFIDENCE_ACTIONS: ResponseConfidenceAction[] = [
  "warning",
  "error",
  "block",
];

export function isResponseConfidenceAction(
  value: unknown,
): value is ResponseConfidenceAction {
  return value === "warning" || value === "error" || value === "block";
}

export function parseConfidenceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function formatConfidenceValue(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

export function validateResponseConfidencePolicy(input: {
  upperRaw: string;
  lowerRaw: string;
}): ResponseConfidenceValidation {
  const upper = parseConfidenceInput(input.upperRaw);
  const lower = parseConfidenceInput(input.lowerRaw);
  const result: ResponseConfidenceValidation = { valid: true };

  if (upper === null) {
    result.valid = false;
    result.upper = "Enter a number from 0 to 1.";
  } else if (upper < 0 || upper > 1) {
    result.valid = false;
    result.upper = "Must be between 0 and 1.";
  }

  if (lower === null) {
    result.valid = false;
    result.lower = "Enter a number from 0 to 1.";
  } else if (lower < 0 || lower > 1) {
    result.valid = false;
    result.lower = "Must be between 0 and 1.";
  }

  if (upper !== null && lower !== null && upper >= 0 && upper <= 1 && lower >= 0 && lower <= 1) {
    if (upper === lower) {
      result.valid = false;
      result.comparison = "Thresholds cannot be equal.";
    } else if (upper <= lower) {
      result.valid = false;
      result.comparison = "The higher threshold must be greater than the lower threshold.";
    }
  }

  return result;
}

export function policyFromDraftInputs(
  draft: ResponseConfidencePolicy,
  upperRaw: string,
  lowerRaw: string,
): ResponseConfidencePolicy | null {
  const validation = validateResponseConfidencePolicy({ upperRaw, lowerRaw });
  if (!validation.valid) return null;
  const upper = parseConfidenceInput(upperRaw);
  const lower = parseConfidenceInput(lowerRaw);
  if (upper === null || lower === null) return null;
  return {
    ...draft,
    upper: { ...draft.upper, value: upper },
    lower: { ...draft.lower, value: lower },
  };
}
