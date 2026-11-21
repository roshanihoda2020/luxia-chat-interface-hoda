import { listVerifaiLibraryFiles } from "../libraryStore";
import type { VerifySetupSnapshot, WorkingSection } from "../setup/VerifySetupPanel";
import type { VerifaiReview } from "../types";

/**
 * Unfinished VerifAI Tool setups, kept in memory for this browser session only, per user and
 * scope. A draft is not a review: it is never listed in History and is cleared once Start
 * Verification creates the review.
 */
const drafts = new Map<string, VerifySetupSnapshot>();

const key = (userId: string, projectId: string, constellationId: string) => `${userId}::${projectId}::${constellationId}`;

export function readVerifaiDraft(userId: string, projectId: string, constellationId: string): VerifySetupSnapshot | null {
  return drafts.get(key(userId, projectId, constellationId)) ?? null;
}

export function writeVerifaiDraft(userId: string, projectId: string, constellationId: string, snapshot: VerifySetupSnapshot) {
  drafts.set(key(userId, projectId, constellationId), snapshot);
}

export function clearVerifaiDraft(userId: string, projectId: string, constellationId: string) {
  drafts.delete(key(userId, projectId, constellationId));
}

/**
 * "Try again" for a finished review: the same checklist (and edits) and the same document, where
 * they are still available to this user. Returned as a setup snapshot for that review's scope.
 */
export function draftFromReview(review: VerifaiReview, userId: string): VerifySetupSnapshot {
  const constellationId = review.scope.constellationId;
  const checklist = review.checklist;
  const base: VerifySetupSnapshot = {
    source: checklist.source,
    checklistId: "gdpr",
    structuredId: "gdpr",
    prepared: {},
    applied: {},
    drafts: {},
    manualText: "",
    scopeId: constellationId,
    documentId: review.document.id,
  };
  if (checklist.source === "upload") {
    const linked = listVerifaiLibraryFiles(constellationId, userId)
      .find((file) => file.role === "checklist" && file.reviewIds.includes(review.id));
    const fallback = checklist.kind === "procurement" ? "procurement" : "gdpr";
    return { ...base, checklistId: linked?.id ?? fallback };
  }
  if (checklist.source === "structured" && (checklist.kind === "gdpr" || checklist.kind === "procurement")) {
    const sections: WorkingSection[] = [];
    for (const requirement of checklist.requirements) {
      const title = requirement.section ?? "Requirements";
      let section = sections.find((s) => s.title === title);
      if (!section) { section = { title, requirements: [] }; sections.push(section); }
      section.requirements.push({ id: requirement.id, text: requirement.text });
    }
    return { ...base, structuredId: checklist.kind, prepared: { [checklist.kind]: "ready" }, applied: { [checklist.kind]: sections } };
  }
  return { ...base, source: "manual", manualText: checklist.requirements.map((r) => r.text).join("\n") };
}
