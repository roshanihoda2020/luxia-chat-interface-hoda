import { useSyncExternalStore } from "react";
import {
  VERIFAI_STAGE_BLUEPRINT,
  VERIFAI_STAGE_DURATIONS,
  gdprStyleFindings,
  isScannedUpload,
  procurementFindings,
} from "./mockData";
import type {
  VerifaiChecklist,
  VerifaiDocument,
  VerifaiFailure,
  VerifaiFinding,
  VerifaiFollowUpContext,
  VerifaiReview,
  VerifaiStage,
  VerifaiStartInput,
} from "./types";

/**
 * Prototype session store for VerifAI reviews. Reviews live in memory for the current session,
 * keyed by id; each belongs to one Chat. Progress runs on timers here (not in a component) so
 * switching Chats or tabs never stops or restarts a review.
 */
type State = {
  reviews: Record<string, VerifaiReview>;
  followUps: Record<string, VerifaiFollowUpContext | undefined>;
};

let state: State = { reviews: {}, followUps: {} };
const listeners = new Set<() => void>();
let counter = 0;

function emit(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function patchReview(id: string, patch: (review: VerifaiReview) => VerifaiReview) {
  const current = state.reviews[id];
  if (!current) return;
  emit({ ...state, reviews: { ...state.reviews, [id]: patch(current) } });
}

function matchesKeywords(finding: VerifaiFinding, text: string) {
  const value = text.toLowerCase();
  return finding.keywords.some((keyword) => value.includes(keyword));
}

/**
 * Findings are attached to the exact requirements in this review. A requirement from the original
 * checklist keeps its own finding only while its text still describes the same issue; added or
 * manual requirements can pick up a finding whose topic they describe. Nothing else is reported,
 * so every finding points at a requirement the user can see.
 */
function matchFindings(checklist: VerifaiChecklist, candidates: VerifaiFinding[]): VerifaiFinding[] {
  const used = new Set<string>();
  const findings: VerifaiFinding[] = [];
  for (const requirement of checklist.requirements) {
    const isOriginal = checklist.originalIds.includes(requirement.id);
    let match = candidates.find((f) => !used.has(f.id) && f.requirementId === requirement.id && matchesKeywords(f, requirement.text));
    if (!match && !isOriginal) match = candidates.find((f) => !used.has(f.id) && matchesKeywords(f, requirement.text));
    if (!match) continue;
    used.add(match.id);
    findings.push({
      ...match,
      requirementId: requirement.id,
      requirement: requirement.text,
      reportSection: match.reportSection.split(match.requirementId).join(requirement.id),
    });
  }
  return findings;
}

type Outcome = { findings: VerifaiFinding[]; failure?: VerifaiFailure };

function resolveOutcome(document: VerifaiDocument, checklist: VerifaiChecklist): Outcome {
  if (isScannedUpload(document)) {
    return {
      findings: [],
      failure: {
        stage: "text",
        title: "VerifAI Review Failed",
        message: `No readable text was found in ${document.name}. It looks like a scanned image. Upload a text-based PDF or choose another document.`,
        detail: "No readable text found",
      },
    };
  }
  const procurement = procurementFindings(document);
  if (checklist.kind === "procurement" && procurement === null) {
    const total = checklist.requirements.length;
    const matched = Math.min(2, total);
    return {
      findings: [],
      failure: {
        stage: "match",
        title: "VerifAI Review Failed",
        message: `Only ${matched} of ${total} requirements could be matched to ${document.name}. This checklist is for commercial contracts; choose a contract or the GDPR Vendor Checklist.`,
        detail: `${matched} of ${total} requirements matched`,
      },
    };
  }
  const candidates = checklist.kind === "gdpr"
    ? gdprStyleFindings(document)
    : checklist.kind === "procurement"
      ? procurement ?? []
      : [...gdprStyleFindings(document), ...(procurement ?? [])];
  return { findings: matchFindings(checklist, candidates) };
}

/** Exposed for tests and the modal summary. */
export function previewFindings(document: VerifaiDocument, checklist: VerifaiChecklist): VerifaiFinding[] {
  return resolveOutcome(document, checklist).findings;
}

function stageDetail(stage: VerifaiStage["id"], input: VerifaiStartInput, findings: VerifaiFinding[]): string {
  const count = input.checklist.requirementCount;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  switch (stage) {
    case "text":
      return `${plural(input.document.pages, "page")} · ${(input.document.pages * 351).toLocaleString("en-US")} words`;
    case "checklist":
      return `${plural(count, "requirement")}${input.checklist.sectionCount > 1 ? ` in ${input.checklist.sectionCount} sections` : ""}`;
    case "match":
      return `${plural(count, "requirement")} matched to ${plural(Math.max(count, Math.round(count * 1.7)), "passage")}`;
    case "compliance":
      return `${plural(count, "check")} · ${count - findings.length} met · ${findings.length} with findings`;
    case "verify":
      return findings.length === 0 ? "No findings to verify" : `${plural(findings.length, "finding")} confirmed against the source text`;
  }
}

export function startVerifaiReview(input: VerifaiStartInput): string {
  counter += 1;
  const id = `verifai-${Date.now().toString(36)}-${counter}`;
  const { findings, failure } = resolveOutcome(input.document, input.checklist);
  const now = Date.now();
  const failIndex = failure ? VERIFAI_STAGE_BLUEPRINT.findIndex((s) => s.id === failure.stage) : -1;
  const stages: VerifaiStage[] = VERIFAI_STAGE_BLUEPRINT.map((stage, index) => ({
    ...stage,
    detail: index === failIndex && failure ? failure.detail : stageDetail(stage.id, input, findings),
    status: index === 0 ? "active" : "pending",
    startedAt: index === 0 ? now : undefined,
  }));
  emit({
    ...state,
    reviews: {
      ...state.reviews,
      [id]: { id, ...input, status: "running", progress: 2, stages, findings, startedAt: now, reportFindingIds: [] },
    },
  });

  const lastIndex = failure ? failIndex : VERIFAI_STAGE_BLUEPRINT.length - 1;
  const total = VERIFAI_STAGE_BLUEPRINT.reduce((sum, stage) => sum + VERIFAI_STAGE_DURATIONS[stage.id], 0);
  let elapsed = 0;
  VERIFAI_STAGE_BLUEPRINT.slice(0, lastIndex + 1).forEach((stage, index) => {
    const duration = VERIFAI_STAGE_DURATIONS[stage.id];
    window.setTimeout(() => {
      patchReview(id, (review) => ({
        ...review,
        progress: Math.max(review.progress, Math.round(((elapsed + duration / 2) / total) * 100)),
      }));
    }, elapsed + duration / 2);
    elapsed += duration;
    const doneAt = elapsed;
    window.setTimeout(() => {
      const finishedAt = Date.now();
      const failsHere = Boolean(failure) && index === lastIndex;
      const completes = !failure && index === lastIndex;
      patchReview(id, (review) => ({
        ...review,
        stages: review.stages.map((item, i) => {
          if (i === index) return { ...item, status: failsHere ? "failed" as const : "done" as const, finishedAt };
          if (i === index + 1 && !failsHere) return { ...item, status: "active" as const, startedAt: finishedAt };
          return item;
        }),
        progress: completes ? 100 : Math.round((doneAt / total) * 100),
        status: failsHere ? "failed" : completes ? "complete" : "running",
        failure: failsHere ? failure : undefined,
        completedAt: failsHere || completes ? finishedAt : undefined,
      }));
    }, doneAt);
  });
  return id;
}

export function toggleVerifaiReportFinding(reviewId: string, findingId: string) {
  patchReview(reviewId, (review) => ({
    ...review,
    reportFindingIds: review.reportFindingIds.includes(findingId)
      ? review.reportFindingIds.filter((id) => id !== findingId)
      : [...review.reportFindingIds, findingId],
  }));
}

/** Review context is only set by an explicit user action (Ask Luxia, a suggested follow-up, Ask about this review). */
export function setVerifaiFollowUp(chatId: string, context: VerifaiFollowUpContext | undefined) {
  emit({ ...state, followUps: { ...state.followUps, [chatId]: context } });
}

export function getVerifaiReview(id: string): VerifaiReview | undefined {
  return state.reviews[id];
}

export function getVerifaiFollowUp(chatId: string): VerifaiFollowUpContext | undefined {
  const context = state.followUps[chatId];
  if (!context) return undefined;
  const review = state.reviews[context.reviewId];
  return review && review.status === "complete" && review.chatId === chatId ? context : undefined;
}

export function useVerifaiReview(id: string | undefined): VerifaiReview | undefined {
  return useSyncExternalStore(subscribe, () => (id ? state.reviews[id] : undefined));
}

export function useVerifaiFollowUp(chatId: string | undefined): VerifaiFollowUpContext | undefined {
  return useSyncExternalStore(subscribe, () => (chatId ? getVerifaiFollowUp(chatId) : undefined));
}

export function countBySeverity(findings: VerifaiFinding[]) {
  return {
    major: findings.filter((f) => f.severity === "major").length,
    minor: findings.filter((f) => f.severity === "minor").length,
    review: findings.filter((f) => f.severity === "review").length,
  };
}
