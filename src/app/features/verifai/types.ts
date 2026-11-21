export type VerifaiSeverity = "major" | "minor" | "review";
export type VerifaiFindingStatus = "Not met" | "Partially met" | "Unclear";

export type VerifaiEvidence = {
  page: number;
  section: string;
  quote: string;
};

export type VerifaiFinding = {
  id: string;
  requirementId: string;
  severity: VerifaiSeverity;
  status: VerifaiFindingStatus;
  title: string;
  description: string;
  requirement: string;
  evidence: VerifaiEvidence;
  suggestedFix: string;
  why: string;
  clause: string;
  comparison: { requirement: string; document: string; gap: string };
  reportSection: string;
  /** Words that let a manual rule match this finding. */
  keywords: string[];
};

/** Which demo scenario a document runs: each has its own findings and evidence. */
export type VerifaiDocumentTemplate = "supplier" | "dpa" | "security" | "upload";

export type VerifaiDocument = {
  id: string;
  name: string;
  pages: number;
  sizeLabel: string;
  updated: string;
  origin: "scope" | "upload";
  template: VerifaiDocumentTemplate;
};

export type VerifaiChecklistSource = "upload" | "structured" | "manual";
/** gdpr / procurement: the two demo checklists. upload: a checklist file added in this session. */
export type VerifaiChecklistKind = "gdpr" | "procurement" | "upload" | "manual";

/** `section`: the checklist section it belongs to, when the checklist has sections. */
export type VerifaiRequirement = { id: string; text: string; section?: string };

/**
 * Simulated result for one requirement, stored on the review (never inferred in the UI).
 * "Not assessed": the review stopped before this requirement was checked.
 */
export type VerifaiRequirementStatus = "Met" | "Not met" | "Partially met" | "Unclear" | "Not assessed";

export type VerifaiRequirementResult = {
  requirementId: string;
  status: VerifaiRequirementStatus;
  /** The finding that explains this result, when there is one. */
  findingId?: string;
};

export type VerifaiChecklist = {
  kind: VerifaiChecklistKind;
  name: string;
  source: VerifaiChecklistSource;
  requirementCount: number;
  sectionCount: number;
  /** The exact requirements checked in this review (edited working copy, manual rules, …). */
  requirements: VerifaiRequirement[];
  /** IDs that exist in the original checklist; other IDs were added for this review. */
  originalIds: string[];
};

export type VerifaiScope = {
  kind: "constellation" | "galaxy";
  constellationId: string;
  constellationLabel: string;
};

export type VerifaiStageId = "text" | "checklist" | "match" | "compliance" | "verify";
export type VerifaiStageStatus = "pending" | "active" | "done" | "failed";

export type VerifaiStage = {
  id: VerifaiStageId;
  label: string;
  description: string;
  detail: string;
  status: VerifaiStageStatus;
  startedAt?: number;
  finishedAt?: number;
};

export type VerifaiFailure = {
  stage: VerifaiStageId;
  title: string;
  message: string;
  detail: string;
};

/** Where a review was started. Both kinds share one store and one review id. */
export type VerifaiReviewOrigin = "chat" | "tool";

/**
 * private: only its creator can see it (every user-created review, including Chat reviews).
 * constellation: anyone with Use access to its Constellation (seeded demo reviews only for now).
 */
export type VerifaiReviewVisibility = "private" | "constellation";

export type VerifaiReview = {
  id: string;
  origin: VerifaiReviewOrigin;
  /** The Chat that shows this review; null for a review started in the VerifAI Tool. */
  chatId: string | null;
  createdByUserId: string;
  visibility: VerifaiReviewVisibility;
  /** Seeded demo review (shown as a demo, never as a real user's work). */
  isDemo?: boolean;
  projectId: string;
  projectName: string;
  scope: VerifaiScope;
  document: VerifaiDocument;
  checklist: VerifaiChecklist;
  status: "running" | "complete" | "failed";
  progress: number;
  stages: VerifaiStage[];
  findings: VerifaiFinding[];
  /** One result per checklist requirement, in checklist order. */
  requirementResults: VerifaiRequirementResult[];
  failure?: VerifaiFailure;
  startedAt: number;
  completedAt?: number;
  /** Finding ids added to the exported report, in the order they were added. */
  reportFindingIds: string[];
};

/** One turn in the VerifAI Tool's review assistant (simulated answers; never sent to a Chat). */
export type VerifaiAssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** The finding the question was about, when one was selected. */
  findingId?: string;
};

export type VerifaiFollowUpContext = {
  reviewId: string;
  findingId?: string;
};

/** Chat: started from @verifai in that Chat. Tool: started in the VerifAI Tool. */
export type VerifaiLaunchOrigin =
  | { kind: "chat"; chatId: string; chatType: "constellation" | "galaxy" }
  | { kind: "tool" };

export type VerifaiStartInput = {
  origin: VerifaiLaunchOrigin;
  createdByUserId: string;
  projectId: string;
  projectName: string;
  scope: VerifaiScope;
  document: VerifaiDocument;
  checklist: VerifaiChecklist;
  /** Library checklist file used (Upload mode); Structured and Manual checklists are review-only. */
  checklistFileId?: string;
};

export type VerifaiLaunchContext = {
  origin: VerifaiLaunchOrigin;
  /** The signed-in user: owns new uploads and the review; only their private files are listed. */
  userId: string;
  projectId: string;
  projectName: string;
  /** Constellation Chat or Tool: the chosen Constellation. Galaxy Chat: the Constellations the user can Use. */
  constellations: Array<{ id: string; label: string }>;
};
