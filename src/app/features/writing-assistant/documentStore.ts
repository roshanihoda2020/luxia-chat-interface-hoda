import type { DocumentComment } from "./documentAnnotations";
import type { ImportedDocumentInfo } from "./types";

export type DocumentTitleSource = "default" | "import" | "handoff" | "user";

export type WritingAssistantDocumentRecord = {
  id: string;
  title: string;
  html: string;
  comments: Record<string, DocumentComment>;
  showChanges: boolean;
  importedDocument: ImportedDocumentInfo | null;
  titleSource: DocumentTitleSource;
  lastAutoTitle: string;
  /** Originating Project when created from a Project Chat handoff. */
  sourceProjectId: string | null;
  /** Most recent Dashboard Save destination Project. */
  lastDashboardProjectId: string | null;
  /** Most recent Dashboard output linked to this document. */
  lastDashboardOutputId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type WritingAssistantWorkspaceSnapshot = {
  version: 1;
  activeDocumentId: string;
  documents: WritingAssistantDocumentRecord[];
};

/** Abandoned keys from earlier prototype persistence — cleared on load, never rewritten. */
const ABANDONED_WRITING_ASSISTANT_STORAGE_KEYS = [
  "luxia.writing-assistant.workspace.v1",
  "luxia.writing-assistant.dev-revision",
] as const;

export function clearAbandonedWritingAssistantStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of ABANDONED_WRITING_ASSISTANT_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function createDocumentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `wa-doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlankDocument(
  overrides: Partial<WritingAssistantDocumentRecord> = {},
): WritingAssistantDocumentRecord {
  const now = Date.now();
  const base: WritingAssistantDocumentRecord = {
    id: createDocumentId(),
    title: "Untitled document",
    html: "",
    comments: {},
    showChanges: true,
    importedDocument: null,
    titleSource: "default",
    lastAutoTitle: "Untitled document",
    sourceProjectId: null,
    lastDashboardProjectId: null,
    lastDashboardOutputId: null,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...base,
    ...overrides,
    comments: overrides.comments ?? base.comments,
    importedDocument:
      overrides.importedDocument !== undefined
        ? overrides.importedDocument
        : base.importedDocument,
    sourceProjectId:
      overrides.sourceProjectId !== undefined
        ? overrides.sourceProjectId
        : base.sourceProjectId,
    lastDashboardProjectId:
      overrides.lastDashboardProjectId !== undefined
        ? overrides.lastDashboardProjectId
        : base.lastDashboardProjectId,
    lastDashboardOutputId:
      overrides.lastDashboardOutputId !== undefined
        ? overrides.lastDashboardOutputId
        : base.lastDashboardOutputId,
  };
}

export function createEmptyWorkspace(): WritingAssistantWorkspaceSnapshot {
  const document = createBlankDocument();
  return {
    version: 1,
    activeDocumentId: document.id,
    documents: [document],
  };
}

export function getActiveDocument(
  workspace: WritingAssistantWorkspaceSnapshot,
): WritingAssistantDocumentRecord {
  return (
    workspace.documents.find((doc) => doc.id === workspace.activeDocumentId)
    ?? workspace.documents[0]
  );
}

export function formatDocumentUpdatedLabel(updatedAt: number, now = Date.now()): string {
  const deltaMs = Math.max(0, now - updatedAt);
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(updatedAt).toLocaleDateString();
}
