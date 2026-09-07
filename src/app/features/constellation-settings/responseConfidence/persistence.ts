import {
  cloneResponseConfidencePolicy,
  DEFAULT_RESPONSE_CONFIDENCE_POLICY,
} from "./defaults";
import { isResponseConfidenceAction } from "./validation";
import type { ResponseConfidencePolicy } from "./types";

const STORAGE_KEY = "luxia.constellation-response-confidence.v1";

type ResponseConfidenceStore = Record<string, ResponseConfidencePolicy>;

function emptyStore(): ResponseConfidenceStore {
  return {};
}

function clampConfidence(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function sanitizePolicy(raw: unknown): ResponseConfidencePolicy | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Partial<ResponseConfidencePolicy>;
  const upper = record.upper;
  const lower = record.lower;
  if (!upper || !lower || typeof upper !== "object" || typeof lower !== "object") {
    return null;
  }
  if (!isResponseConfidenceAction(upper.action) || !isResponseConfidenceAction(lower.action)) {
    return null;
  }
  const policy: ResponseConfidencePolicy = {
    upper: {
      value: clampConfidence(upper.value, DEFAULT_RESPONSE_CONFIDENCE_POLICY.upper.value),
      action: upper.action,
    },
    lower: {
      value: clampConfidence(lower.value, DEFAULT_RESPONSE_CONFIDENCE_POLICY.lower.value),
      action: lower.action,
    },
    warningMessage:
      typeof record.warningMessage === "string"
        ? record.warningMessage
        : DEFAULT_RESPONSE_CONFIDENCE_POLICY.warningMessage,
    warningAppend:
      typeof record.warningAppend === "boolean"
        ? record.warningAppend
        : DEFAULT_RESPONSE_CONFIDENCE_POLICY.warningAppend,
    errorMessage:
      typeof record.errorMessage === "string"
        ? record.errorMessage
        : DEFAULT_RESPONSE_CONFIDENCE_POLICY.errorMessage,
    errorAppend:
      typeof record.errorAppend === "boolean"
        ? record.errorAppend
        : DEFAULT_RESPONSE_CONFIDENCE_POLICY.errorAppend,
    blockDefaultAnswer:
      typeof record.blockDefaultAnswer === "string"
        ? record.blockDefaultAnswer
        : DEFAULT_RESPONSE_CONFIDENCE_POLICY.blockDefaultAnswer,
  };
  if (policy.upper.value <= policy.lower.value) return null;
  return policy;
}

function readStore(): ResponseConfidenceStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyStore();
    const store: ResponseConfidenceStore = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      const policy = sanitizePolicy(value);
      if (policy) store[id] = policy;
    }
    return store;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: ResponseConfidenceStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage write is best-effort.
  }
}

export function loadResponseConfidencePolicy(
  constellationId: string,
): ResponseConfidencePolicy {
  const stored = readStore()[constellationId];
  return cloneResponseConfidencePolicy(stored ?? DEFAULT_RESPONSE_CONFIDENCE_POLICY);
}

export function saveResponseConfidencePolicy(
  constellationId: string,
  policy: ResponseConfidencePolicy,
) {
  if (!constellationId) return;
  const store = readStore();
  store[constellationId] = cloneResponseConfidencePolicy(policy);
  writeStore(store);
}
