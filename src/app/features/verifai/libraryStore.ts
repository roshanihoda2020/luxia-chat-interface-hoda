import { useSyncExternalStore } from "react";
import {
  VERIFAI_CHECKLISTS,
  VERIFAI_UPLOADED_CHECKLIST_SECTIONS,
  checklistRequirementCount,
  uploadedChecklistRequirements,
  verifaiScopeDocuments,
} from "./mockData";
import type { VerifaiDocument } from "./types";

/**
 * VerifAI review file library: one per Constellation, separate from Data Sources (nothing here
 * is ever added to the Data Source catalog). Prototype session store, in memory only.
 *
 * - shared: the Constellation's library (seeded demo files today; managed by Project Owners and
 *   Project Managers in a later phase).
 * - private: uploaded by one user for their own reviews; listed for that user only.
 */
export type VerifaiLibraryFileRole = "checklist" | "target";
export type VerifaiLibraryFileVisibility = "shared" | "private";

type FileBase = {
  id: string;
  constellationId: string;
  visibility: VerifaiLibraryFileVisibility;
  /** Set for private files: the only user who can see and use them. */
  ownerUserId?: string;
  origin: "seed" | "upload";
  name: string;
  /** e.g. "Uploaded 3 days ago" / "Uploaded just now". */
  uploadedLabel: string;
  /** Reviews that used this file (a file is never copied per review). */
  reviewIds: string[];
};

export type VerifaiChecklistFile = FileBase & {
  role: "checklist";
  checklistKind: "gdpr" | "procurement" | "upload";
  requirementCount: number;
  sectionCount: number;
};

export type VerifaiTargetFile = FileBase & {
  role: "target";
  document: VerifaiDocument;
};

export type VerifaiLibraryFile = VerifaiChecklistFile | VerifaiTargetFile;

type State = { uploads: VerifaiLibraryFile[]; reviewLinks: Record<string, string[]>; version: number };

let state: State = { uploads: [], reviewLinks: {}, version: 0 };
const listeners = new Set<() => void>();

function emit(next: Omit<State, "version">) {
  state = { ...next, version: state.version + 1 };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Shared seed files of a Constellation. The two demo checklists keep the ids "gdpr" and
 * "procurement" in every Constellation, so a chosen checklist stays chosen when the scope changes.
 */
function sharedSeedFiles(constellationId: string): VerifaiLibraryFile[] {
  const checklists: VerifaiChecklistFile[] = VERIFAI_CHECKLISTS.map((c) => ({
    id: c.id,
    constellationId,
    visibility: "shared",
    origin: "seed",
    role: "checklist",
    name: c.fileName,
    uploadedLabel: c.uploaded,
    checklistKind: c.id,
    requirementCount: checklistRequirementCount(c),
    sectionCount: c.sections.length,
    reviewIds: [],
  }));
  const targets: VerifaiTargetFile[] = verifaiScopeDocuments(constellationId).map((document) => ({
    id: document.id,
    constellationId,
    visibility: "shared",
    origin: "seed",
    role: "target",
    name: document.name,
    uploadedLabel: document.updated,
    document,
    reviewIds: [],
  }));
  return [...checklists, ...targets];
}

function withReviewLinks(file: VerifaiLibraryFile): VerifaiLibraryFile {
  const key = `${file.constellationId}::${file.id}`;
  return { ...file, reviewIds: state.reviewLinks[key] ?? file.reviewIds };
}

/**
 * Files a viewer may use in a Constellation: the shared library plus their own private uploads,
 * in upload order. Another user's private files are never returned.
 */
export function listVerifaiLibraryFiles(constellationId: string, viewerId: string): VerifaiLibraryFile[] {
  const own = state.uploads.filter(
    (file) => file.constellationId === constellationId && file.visibility === "private" && file.ownerUserId === viewerId,
  );
  return [...sharedSeedFiles(constellationId), ...own].map(withReviewLinks);
}

export function listVerifaiChecklistFiles(constellationId: string, viewerId: string): VerifaiChecklistFile[] {
  return listVerifaiLibraryFiles(constellationId, viewerId).filter((f): f is VerifaiChecklistFile => f.role === "checklist");
}

export function listVerifaiTargetFiles(constellationId: string, viewerId: string): VerifaiTargetFile[] {
  return listVerifaiLibraryFiles(constellationId, viewerId).filter((f): f is VerifaiTargetFile => f.role === "target");
}

/** A checklist file uploaded for the uploader's own reviews (simulated read: 12 requirements). */
export function addVerifaiPrivateChecklist(input: { constellationId: string; ownerUserId: string; name: string }): VerifaiChecklistFile {
  const file: VerifaiChecklistFile = {
    id: `cl-upload-${Date.now()}`,
    constellationId: input.constellationId,
    visibility: "private",
    ownerUserId: input.ownerUserId,
    origin: "upload",
    role: "checklist",
    name: input.name,
    uploadedLabel: "Uploaded just now",
    checklistKind: "upload",
    requirementCount: uploadedChecklistRequirements().length,
    sectionCount: VERIFAI_UPLOADED_CHECKLIST_SECTIONS,
    reviewIds: [],
  };
  emit({ ...state, uploads: [...state.uploads, file] });
  return file;
}

/** A target PDF uploaded for the uploader's own reviews. */
export function addVerifaiPrivateTarget(input: { constellationId: string; ownerUserId: string; document: VerifaiDocument }): VerifaiTargetFile {
  const file: VerifaiTargetFile = {
    id: input.document.id,
    constellationId: input.constellationId,
    visibility: "private",
    ownerUserId: input.ownerUserId,
    origin: "upload",
    role: "target",
    name: input.document.name,
    uploadedLabel: input.document.updated,
    document: input.document,
    reviewIds: [],
  };
  emit({ ...state, uploads: [...state.uploads, file] });
  return file;
}

/** Records which library files a review used (no copies are made). */
export function linkVerifaiFilesToReview(constellationId: string, fileIds: string[], reviewId: string) {
  const reviewLinks = { ...state.reviewLinks };
  for (const fileId of fileIds) {
    const key = `${constellationId}::${fileId}`;
    const current = reviewLinks[key] ?? [];
    if (!current.includes(reviewId)) reviewLinks[key] = [...current, reviewId];
  }
  emit({ ...state, reviewLinks });
}

/** Re-renders on any library change; pair with the list functions in a memo. */
export function useVerifaiLibraryVersion(): number {
  return useSyncExternalStore(subscribe, () => state.version);
}
