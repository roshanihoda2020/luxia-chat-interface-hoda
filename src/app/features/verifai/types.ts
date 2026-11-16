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

export type VerifaiRequirement = { id: string; text: string };

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

export type VerifaiReview = {
  id: string;
  chatId: string;
  projectId: string;
  projectName: string;
  scope: VerifaiScope;
  document: VerifaiDocument;
  checklist: VerifaiChecklist;
  status: "running" | "complete" | "failed";
  progress: number;
  stages: VerifaiStage[];
  findings: VerifaiFinding[];
  failure?: VerifaiFailure;
  startedAt: number;
  completedAt?: number;
  /** Finding ids added to the exported report, in the order they were added. */
  reportFindingIds: string[];
};

export type VerifaiFollowUpContext = {
  reviewId: string;
  findingId?: string;
};

export type VerifaiStartInput = {
  chatId: string;
  projectId: string;
  projectName: string;
  scope: VerifaiScope;
  document: VerifaiDocument;
  checklist: VerifaiChecklist;
};

export type VerifaiLaunchContext = {
  chatId: string;
  projectId: string;
  projectName: string;
  chatType: "constellation" | "galaxy";
  /** Constellation Chat: its Constellation. Galaxy Chat: the Constellations the user can Use. */
  constellations: Array<{ id: string; label: string }>;
};
