import { useSyncExternalStore } from "react";
import {
  VERIFAI_STAGE_BLUEPRINT,
  VERIFAI_STAGE_DURATIONS,
  gdprStyleFindings,
  isScannedUpload,
  knownVerifaiRequirement,
  procurementFindings,
  verifaiDemoReviewInputs,
  verifaiScenarioCovers,
} from "./mockData";
import { linkVerifaiFilesToReview } from "./libraryStore";
import type {
  VerifaiChecklist,
  VerifaiDocument,
  VerifaiFailure,
  VerifaiFinding,
  VerifaiAssistantMessage,
  VerifaiFollowUpContext,
  VerifaiRequirementResult,
  VerifaiReview,
  VerifaiStage,
  VerifaiStartInput,
} from "./types";

/**
 * Prototype session store for VerifAI reviews, shared by Chat (@verifai) and the VerifAI Tool.
 * Reviews live in memory for the current session, keyed by id; a review started in a Chat keeps
 * that Chat's id, a Tool review has none. Progress runs on timers here (not in a component) so
 * switching Chats, tabs or pages never stops or restarts a review.
 */
type State = {
  reviews: Record<string, VerifaiReview>;
  followUps: Record<string, VerifaiFollowUpContext | undefined>;
  /** The Tool's review assistant threads, per review (Chat follow-ups stay in their Chat). */
  assistant: Record<string, VerifaiAssistantMessage[]>;
  /** Bumped on every change: a stable snapshot for list selectors. */
  version: number;
};

let state: State = { reviews: {}, followUps: {}, assistant: {}, version: 0 };
const NO_MESSAGES: VerifaiAssistantMessage[] = [];
const listeners = new Set<() => void>();
let counter = 0;

function emit(next: State) {
  state = { ...next, version: state.version + 1 };
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

type Outcome = { findings: VerifaiFinding[]; failure?: VerifaiFailure; results: VerifaiRequirementResult[] };

function resolveOutcome(document: VerifaiDocument, checklist: VerifaiChecklist): Outcome {
  const { findings, failure } = resolveFindings(document, checklist);
  return { findings, failure, results: requirementResults(document, checklist, findings, failure) };
}

function resolveFindings(document: VerifaiDocument, checklist: VerifaiChecklist): Omit<Outcome, "results"> {
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

function stageDetail(stage: VerifaiStage["id"], input: VerifaiStartInput, outcome: Outcome): string {
  const { findings, results } = outcome;
  const count = input.checklist.requirementCount;
  const met = results.filter((r) => r.status === "Met").length;
  const notAssessed = results.filter((r) => r.status === "Not assessed").length;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  switch (stage) {
    case "text":
      return `${plural(input.document.pages, "page")} · ${(input.document.pages * 351).toLocaleString("en-US")} words`;
    case "checklist":
      return `${plural(count, "requirement")}${input.checklist.sectionCount > 1 ? ` in ${input.checklist.sectionCount} sections` : ""}`;
    case "match":
      return `${plural(count, "requirement")} matched to ${plural(Math.max(count, Math.round(count * 1.7)), "passage")}`;
    case "compliance":
      return `${plural(count, "check")} · ${met} met · ${findings.length} with findings${notAssessed ? ` · ${notAssessed} not assessed` : ""}`;
    case "verify":
      return findings.length === 0 ? "No findings to verify" : `${plural(findings.length, "finding")} confirmed against the source text`;
  }
}

function totalStageDuration() {
  return VERIFAI_STAGE_BLUEPRINT.reduce((sum, stage) => sum + VERIFAI_STAGE_DURATIONS[stage.id], 0);
}

/**
 * The approved demo requirement behind a review requirement, if it is one: an unedited requirement
 * of a demo checklist (same id, same text), or a requirement whose text is exactly a demo
 * requirement (uploaded and manual checklists). Anything new or edited is not.
 */
function demoRequirementOf(checklist: VerifaiChecklist, requirement: VerifaiChecklist["requirements"][number]) {
  const kinds: Array<"gdpr" | "procurement"> = checklist.kind === "gdpr" || checklist.kind === "procurement"
    ? [checklist.kind]
    : ["gdpr", "procurement"];
  const known = knownVerifaiRequirement(requirement.text, kinds);
  if (!known) return null;
  // An original id must still be that requirement (an edit that swaps text for another one is not).
  if (checklist.originalIds.includes(requirement.id) && known.id !== requirement.id) return null;
  return known;
}

/**
 * One explicit result per requirement:
 * - a requirement with a finding takes the finding's status;
 * - without a finding it is Met only when it is an approved demo requirement and the document's
 *   mock scenario defines results for that checklist (so "no finding" is a known outcome);
 * - anything else (new, edited or unrelated rules) is Not assessed, never assumed Met;
 * - when the review fails, nothing was assessed.
 */
function requirementResults(
  document: VerifaiDocument,
  checklist: VerifaiChecklist,
  findings: VerifaiFinding[],
  failure?: VerifaiFailure,
): VerifaiRequirementResult[] {
  return checklist.requirements.map((requirement) => {
    if (failure) return { requirementId: requirement.id, status: "Not assessed" };
    const finding = findings.find((f) => f.requirementId === requirement.id);
    if (finding) return { requirementId: requirement.id, status: finding.status, findingId: finding.id };
    const known = demoRequirementOf(checklist, requirement);
    return known && verifaiScenarioCovers(document, known.kind)
      ? { requirementId: requirement.id, status: "Met" }
      : { requirementId: requirement.id, status: "Not assessed" };
  });
}

/** The review record both entry points create. Chat reviews keep their Chat; all user reviews are private. */
function newReviewRecord(id: string, input: VerifaiStartInput, outcome: Outcome, stages: VerifaiStage[], startedAt: number): VerifaiReview {
  const { origin, createdByUserId, checklistFileId, ...scope } = input;
  linkVerifaiFilesToReview(
    input.scope.constellationId,
    checklistFileId ? [input.document.id, checklistFileId] : [input.document.id],
    id,
  );
  return {
    id,
    origin: origin.kind,
    chatId: origin.kind === "chat" ? origin.chatId : null,
    createdByUserId,
    visibility: "private",
    ...scope,
    status: "running",
    progress: 2,
    stages,
    findings: outcome.findings,
    requirementResults: outcome.results,
    startedAt,
    reportFindingIds: [],
  };
}

export function startVerifaiReview(input: VerifaiStartInput): string {
  counter += 1;
  const id = `verifai-${Date.now().toString(36)}-${counter}`;
  const outcome = resolveOutcome(input.document, input.checklist);
  const { failure } = outcome;
  const now = Date.now();
  const failIndex = failure ? VERIFAI_STAGE_BLUEPRINT.findIndex((s) => s.id === failure.stage) : -1;
  const stages: VerifaiStage[] = VERIFAI_STAGE_BLUEPRINT.map((stage, index) => ({
    ...stage,
    detail: index === failIndex && failure ? failure.detail : stageDetail(stage.id, input, outcome),
    status: index === 0 ? "active" : "pending",
    startedAt: index === 0 ? now : undefined,
  }));
  emit({
    ...state,
    reviews: { ...state.reviews, [id]: newReviewRecord(id, input, outcome, stages, now) },
  });

  const lastIndex = failure ? failIndex : VERIFAI_STAGE_BLUEPRINT.length - 1;
  const total = totalStageDuration();
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

/**
 * Every review the viewer may see, newest first. `canView` applies the access rules
 * (see `canViewVerifaiReview` in ./access) — the store never decides visibility itself.
 */
export function listVerifaiReviews(canView: (review: VerifaiReview) => boolean): VerifaiReview[] {
  return Object.values(state.reviews)
    .filter(canView)
    .sort((a, b) => b.startedAt - a.startedAt);
}

/** Re-renders on any review change; pair with `listVerifaiReviews` in a memo. */
export function useVerifaiReviewsVersion(): number {
  return useSyncExternalStore(subscribe, () => state.version);
}

/**
 * A Tool review continued in a Chat keeps its id; the Chat is recorded once and never replaced,
 * so the same review is never attached to two Chats or duplicated.
 */
export function linkVerifaiReviewToChat(reviewId: string, chatId: string) {
  patchReview(reviewId, (review) => (review.chatId ? review : { ...review, chatId }));
}

/** Seeded demo reviews: deterministic, finished, shared with their Constellation and marked as demos. */
function seedDemoReviews() {
  const reviews: Record<string, VerifaiReview> = {};
  for (const seed of verifaiDemoReviewInputs()) {
    const outcome = resolveOutcome(seed.input.document, seed.input.checklist);
    const failIndex = outcome.failure ? VERIFAI_STAGE_BLUEPRINT.findIndex((s) => s.id === outcome.failure!.stage) : -1;
    const lastIndex = outcome.failure ? failIndex : VERIFAI_STAGE_BLUEPRINT.length - 1;
    let at = seed.startedAt;
    const stages: VerifaiStage[] = VERIFAI_STAGE_BLUEPRINT.map((stage, index) => {
      if (index > lastIndex) return { ...stage, detail: stageDetail(stage.id, seed.input, outcome), status: "pending" };
      const startedAt = at;
      at += VERIFAI_STAGE_DURATIONS[stage.id];
      const failsHere = index === failIndex;
      return {
        ...stage,
        detail: failsHere && outcome.failure ? outcome.failure.detail : stageDetail(stage.id, seed.input, outcome),
        status: failsHere ? "failed" : "done",
        startedAt,
        finishedAt: at,
      };
    });
    const record = newReviewRecord(seed.id, seed.input, outcome, stages, seed.startedAt);
    reviews[seed.id] = {
      ...record,
      visibility: "constellation",
      isDemo: true,
      status: outcome.failure ? "failed" : "complete",
      progress: outcome.failure ? Math.round(((at - seed.startedAt) / totalStageDuration()) * 100) : 100,
      failure: outcome.failure,
      completedAt: at,
    };
  }
  state = { ...state, reviews: { ...reviews, ...state.reviews } };
}
seedDemoReviews();

export function appendVerifaiAssistantMessage(reviewId: string, message: Omit<VerifaiAssistantMessage, "id">) {
  counter += 1;
  const next: VerifaiAssistantMessage = { ...message, id: `vam-${counter}` };
  emit({ ...state, assistant: { ...state.assistant, [reviewId]: [...(state.assistant[reviewId] ?? []), next] } });
}

export function useVerifaiAssistantThread(reviewId: string | undefined): VerifaiAssistantMessage[] {
  return useSyncExternalStore(subscribe, () => (reviewId ? state.assistant[reviewId] ?? NO_MESSAGES : NO_MESSAGES));
}

export function countBySeverity(findings: VerifaiFinding[]) {
  return {
    major: findings.filter((f) => f.severity === "major").length,
    minor: findings.filter((f) => f.severity === "minor").length,
    review: findings.filter((f) => f.severity === "review").length,
  };
}
