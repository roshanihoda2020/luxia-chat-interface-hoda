import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageBody, LuxiaPageFrame } from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { LuxiaWritingAssistantIcon } from "@/assets/icons";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  createDashboardOutput,
  getDashboardOutputById,
  updateDashboardOutput,
} from "@/app/features/project-overview/dashboardOutputStore";
import {
  rangesReferToSameSelection,
  runLocalAssistance,
  suggestionToHtml,
} from "./assistance";
import { consumeWritingAssistantHandoff } from "./chatHandoff";
import {
  assertImportFileAllowed,
  buildExportBlob,
  DOCUMENT_IO_MESSAGES,
  documentTitleFromFilename,
  downloadBlob,
  exportDocument,
  importDocumentFile,
  openMailtoDraft,
  stripEditorAnnotations,
  type ExportFormat,
} from "./documentIo";
import {
  DocumentSaveToDashboardDialog,
  type DashboardDestinationProject,
} from "./DocumentSaveToDashboardDialog";
import {
  DocumentShareEmailDialog,
  type ShareEmailPayload,
} from "./DocumentShareEmailDialog";
import {
  clearAbandonedWritingAssistantStorage,
  createBlankDocument,
  createEmptyWorkspace,
  getActiveDocument,
  type DocumentTitleSource,
  type WritingAssistantDocumentRecord,
  type WritingAssistantWorkspaceSnapshot,
} from "./documentStore";
import {
  DocumentEditor,
  type DocumentEditorHandle,
} from "./DocumentEditor";
import { getLanguageLabel } from "./languages";
import { WritingAssistantPanel } from "./WritingAssistantPanel";
import {
  type EditorTextSelection,
  type ImportedDocumentInfo,
  type WritingAssistantActionId,
} from "./types";
import { getAssistanceMark } from "./documentAnnotations";

const PAGE_GUIDANCE =
  "Highlight a passage in the document to revise it with Writing Assistant.";

type WritingAssistantPageProps = {
  onNavigateHome: () => void;
  onNavigateTools?: () => void;
  currentUserId?: string;
  /** Projects where the current user may create Dashboard outputs. */
  dashboardEligibleProjects?: DashboardDestinationProject[];
  /** Projects the user can view (for Dashboard destination labels / Open). */
  viewableProjects?: DashboardDestinationProject[];
  onOpenDashboardOutput?: (projectId: string, outputId: string | null) => void;
};

export function WritingAssistantPage({
  onNavigateHome,
  onNavigateTools,
  currentUserId = "prototype-user",
  dashboardEligibleProjects = [],
  viewableProjects = [],
  onOpenDashboardOutput,
}: WritingAssistantPageProps) {
  const editorRef = useRef<DocumentEditorHandle>(null);
  const requestIdRef = useRef(0);
  const selectionRef = useRef<EditorTextSelection | null>(null);
  const workspaceRef = useRef<WritingAssistantWorkspaceSnapshot>(createEmptyWorkspace());

  const [workspace, setWorkspace] = useState<WritingAssistantWorkspaceSnapshot>(
    () => workspaceRef.current,
  );
  const [selection, setSelection] = useState<EditorTextSelection | null>(null);
  const [question, setQuestion] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionMeta, setSuggestionMeta] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<WritingAssistantActionId | null>(null);
  const [translateLanguage, setTranslateLanguage] = useState<string | null>(null);
  const [referenceDocument, setReferenceDocument] = useState<{
    name: string;
    format: "docx" | "txt" | "md";
  } | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentComposerOpen, setCommentComposerOpen] = useState(false);
  const [clearMarkersOpen, setClearMarkersOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [replaceImportOpen, setReplaceImportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [shareEmailOpen, setShareEmailOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [saveDashboardOpen, setSaveDashboardOpen] = useState(false);
  const [saveDashboardBusy, setSaveDashboardBusy] = useState(false);
  const [documentsLibraryOpen, setDocumentsLibraryOpen] = useState(false);

  const activeDocument = getActiveDocument(workspace);

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    { id: "tools", label: "Tools", destination: { kind: "tools" } },
    {
      id: "writing-assistant",
      label: "Writing Assistant",
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onTools: onNavigateTools,
  };

  const clearAssistanceContext = useCallback(() => {
    requestIdRef.current += 1;
    setSuggestion(null);
    setSuggestionMeta(null);
    setQuestion("");
    setError(null);
    setActiveActionId(null);
    setWorking(false);
    setReferenceDocument(null);
  }, []);

  const handleClearSelection = useCallback(() => {
    selectionRef.current = null;
    setSelection(null);
    clearAssistanceContext();
    editorRef.current?.clearAssistanceMark();
    window.getSelection()?.removeAllRanges();
  }, [clearAssistanceContext]);

  const applyAssistanceMark = useCallback((next: EditorTextSelection | null) => {
    const marked = editorRef.current?.syncAssistanceMark(next) ?? null;
    if (marked && next) {
      const updated = { text: next.text, range: marked };
      selectionRef.current = updated;
      setSelection(updated);
      return;
    }
    if (!next) {
      editorRef.current?.clearAssistanceMark();
    }
  }, []);

  const commitWorkspace = useCallback(
    (
      updater:
        | WritingAssistantWorkspaceSnapshot
        | ((prev: WritingAssistantWorkspaceSnapshot) => WritingAssistantWorkspaceSnapshot),
    ) => {
      setWorkspace((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        workspaceRef.current = next;
        return next;
      });
    },
    [],
  );

  const patchActiveDocument = useCallback(
    (patch: Partial<WritingAssistantDocumentRecord>) => {
      commitWorkspace((prev) => {
        const activeId = prev.activeDocumentId;
        return {
          ...prev,
          documents: prev.documents.map((doc) =>
            doc.id === activeId
              ? { ...doc, ...patch, updatedAt: Date.now() }
              : doc,
          ),
        };
      });
    },
    [commitWorkspace],
  );

  const flushActiveEditorHtml = useCallback(() => {
    const html = editorRef.current?.getHtml();
    if (html === undefined) return;
    const activeId = workspaceRef.current.activeDocumentId;
    commitWorkspace((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) =>
        doc.id === activeId && doc.html !== html
          ? { ...doc, html, updatedAt: Date.now() }
          : doc,
      ),
    }));
  }, [commitWorkspace]);

  const loadDocumentIntoEditor = useCallback((doc: WritingAssistantDocumentRecord) => {
    editorRef.current?.setHtml(doc.html);
    editorRef.current?.clearAssistanceMark();
    selectionRef.current = null;
    setSelection(null);
    setActiveCommentId(null);
    setCommentComposerOpen(false);
    setImportMessage(null);
    clearAssistanceContext();
  }, [clearAssistanceContext]);

  useEffect(() => {
    clearAbandonedWritingAssistantStorage();
  }, []);

  useEffect(() => {
    const doc = getActiveDocument(workspaceRef.current);
    const apply = () => loadDocumentIntoEditor(doc);
    apply();
    window.requestAnimationFrame(apply);
  }, [loadDocumentIntoEditor]);

  useEffect(() => {
    const handoff = consumeWritingAssistantHandoff();
    if (!handoff) return;

    const title = handoff.title.trim() || "From Chat";
    const doc = createBlankDocument({
      title,
      html: handoff.html,
      titleSource: "handoff",
      lastAutoTitle: title,
      sourceProjectId: handoff.projectId,
    });

    flushActiveEditorHtml();
    commitWorkspace((prev) => ({
      version: 1,
      activeDocumentId: doc.id,
      documents: [...prev.documents, doc],
    }));

    const apply = () => loadDocumentIntoEditor(doc);
    apply();
    window.requestAnimationFrame(apply);
  }, [commitWorkspace, flushActiveEditorHtml, loadDocumentIntoEditor]);

  const handleRenameDocument = useCallback((documentId: string, value: string) => {
    const title = value.trim() || "Untitled document";
    commitWorkspace((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              title,
              titleSource: "user" as DocumentTitleSource,
              updatedAt: Date.now(),
            }
          : doc,
      ),
    }));
  }, [commitWorkspace]);

  const handleDocumentNameChange = useCallback((value: string) => {
    handleRenameDocument(workspaceRef.current.activeDocumentId, value);
  }, [handleRenameDocument]);

  const handleContentChange = useCallback((html: string) => {
    patchActiveDocument({ html });
  }, [patchActiveDocument]);

  const resolveTitleForImport = useCallback((filename: string, current: WritingAssistantDocumentRecord) => {
    // Manual rename (titleSource: user) is never overwritten by import.
    if (current.titleSource === "user") {
      return {
        title: current.title,
        titleSource: current.titleSource,
        lastAutoTitle: current.lastAutoTitle,
      };
    }
    const stem = documentTitleFromFilename(filename);
    return {
      title: stem,
      titleSource: "import" as DocumentTitleSource,
      lastAutoTitle: stem,
    };
  }, []);

  const handleNewDocument = useCallback(() => {
    flushActiveEditorHtml();
    const doc = createBlankDocument();
    commitWorkspace((prev) => ({
      version: 1,
      activeDocumentId: doc.id,
      documents: [...prev.documents, doc],
    }));
    loadDocumentIntoEditor(doc);
    toast.success("New document created");
    window.requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  }, [commitWorkspace, flushActiveEditorHtml, loadDocumentIntoEditor]);

  const handleSelectDocument = useCallback((documentId: string) => {
    if (documentId === workspaceRef.current.activeDocumentId) return;
    const next = workspaceRef.current.documents.find((doc) => doc.id === documentId);
    if (!next) return;
    flushActiveEditorHtml();
    commitWorkspace((prev) => ({
      ...prev,
      activeDocumentId: documentId,
    }));
    loadDocumentIntoEditor(next);
  }, [commitWorkspace, flushActiveEditorHtml, loadDocumentIntoEditor]);

  const handleRequestDelete = useCallback((documentId: string) => {
    setPendingDeleteId(documentId);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    const deleteId = pendingDeleteId ?? workspaceRef.current.activeDocumentId;
    setDeleteConfirmOpen(false);
    setPendingDeleteId(null);

    const prev = workspaceRef.current;
    const remaining = prev.documents.filter((doc) => doc.id !== deleteId);
    if (remaining.length === 0) {
      const blank = createBlankDocument();
      commitWorkspace({
        version: 1,
        activeDocumentId: blank.id,
        documents: [blank],
      });
      loadDocumentIntoEditor(blank);
      return;
    }

    const deletingActive = prev.activeDocumentId === deleteId;
    const nextActiveId = deletingActive
      ? remaining[0].id
      : prev.activeDocumentId;
    const nextActive = remaining.find((doc) => doc.id === nextActiveId) ?? remaining[0];

    commitWorkspace({
      version: 1,
      activeDocumentId: nextActive.id,
      documents: remaining,
    });

    if (deletingActive) {
      loadDocumentIntoEditor(nextActive);
    }
  }, [commitWorkspace, loadDocumentIntoEditor, pendingDeleteId]);

  const handleSelectionChange = useCallback(
    (next: EditorTextSelection | null) => {
      const prev = selectionRef.current;
      const sameRange =
        (!prev && !next)
        || (
          Boolean(prev && next)
          && rangesReferToSameSelection(prev!.range, next!.range)
        );

      if (sameRange) return;

      if (prev && next && prev.text === next.text) {
        selectionRef.current = next;
        setSelection(next);
        const root = editorRef.current?.getRoot();
        if (root && !getAssistanceMark(root)) {
          applyAssistanceMark(next);
        }
        return;
      }

      selectionRef.current = next;
      setSelection(next);
      clearAssistanceContext();
      applyAssistanceMark(next);
    },
    [applyAssistanceMark, clearAssistanceContext],
  );

  const runAssistance = useCallback(
    async (
      request:
        | {
          kind: "action";
          actionId: WritingAssistantActionId;
          targetLanguage?: string;
          targetLanguageLabel?: string;
          referenceFileName?: string;
        }
        | { kind: "question"; question: string },
    ) => {
      const current = selectionRef.current;
      if (!current?.text.trim()) {
        setError("Please select text and enter a query");
        return;
      }

      if (request.kind === "question" && !request.question.trim()) {
        setError("Please select text and enter a query");
        return;
      }

      const root = editorRef.current?.getRoot();
      if (root && !getAssistanceMark(root)) {
        applyAssistanceMark(current);
      }

      if (request.kind === "action" && request.actionId === "translate") {
        if (!request.targetLanguage || !request.targetLanguageLabel) {
          setActiveActionId("translate");
          setError(null);
          setSuggestion(null);
          setSuggestionMeta(null);
          return;
        }
      }

      if (request.kind === "action" && request.actionId === "match-reference") {
        if (!request.referenceFileName?.trim()) {
          setActiveActionId("match-reference");
          setError(null);
          setSuggestion(null);
          setSuggestionMeta(null);
          return;
        }
      }

      const requestId = ++requestIdRef.current;
      setWorking(true);
      setError(null);
      setSuggestion(null);
      setSuggestionMeta(null);
      setActiveActionId(request.kind === "action" ? request.actionId : null);

      const result = await runLocalAssistance(current.text, request);
      if (requestId !== requestIdRef.current) return;

      setWorking(false);
      if (!result.ok) {
        setSuggestion(null);
        setSuggestionMeta(null);
        setError(result.error);
        return;
      }

      setError(null);
      setSuggestion(result.suggestion);
      if (request.kind === "action" && request.actionId === "translate" && request.targetLanguageLabel) {
        setSuggestionMeta(`Translated to ${request.targetLanguageLabel}`);
      } else if (
        request.kind === "action"
        && request.actionId === "match-reference"
        && request.referenceFileName
      ) {
        setSuggestionMeta(`Matched to: ${request.referenceFileName}`);
      } else {
        setSuggestionMeta(null);
      }
      if (request.kind === "question") {
        setQuestion("");
      }
    },
    [applyAssistanceMark],
  );

  async function applyImportedFile(file: File, mode: "replace" | "new") {
    try {
      const imported = await importDocumentFile(file);
      const importedInfo: ImportedDocumentInfo = {
        name: imported.name,
        sizeBytes: imported.sizeBytes,
        format: imported.format,
      };

      if (mode === "new") {
        flushActiveEditorHtml();
        const titleMeta = resolveTitleForImport(
          imported.name,
          createBlankDocument(),
        );
        const doc = createBlankDocument({
          title: titleMeta.title,
          html: imported.html,
          importedDocument: importedInfo,
          titleSource: titleMeta.titleSource,
          lastAutoTitle: titleMeta.lastAutoTitle,
          sourceProjectId: null,
        });
        commitWorkspace((prev) => ({
          version: 1,
          activeDocumentId: doc.id,
          documents: [...prev.documents, doc],
        }));
        loadDocumentIntoEditor(doc);
        setImportMessage(null);
        return;
      }

      const current = getActiveDocument(workspaceRef.current);
      const titleMeta = resolveTitleForImport(imported.name, current);
      editorRef.current?.setHtml(imported.html);
      patchActiveDocument({
        html: imported.html,
        importedDocument: importedInfo,
        comments: {},
        ...titleMeta,
      });
      setImportMessage(null);
      selectionRef.current = null;
      setSelection(null);
      clearAssistanceContext();
      editorRef.current?.clearAssistanceMark();
      setActiveCommentId(null);
      setCommentComposerOpen(false);
    } catch (caught) {
      patchActiveDocument({ importedDocument: null });
      setImportMessage(
        caught instanceof Error ? caught.message : DOCUMENT_IO_MESSAGES.importFailed,
      );
    }
  }

  function handleImportFile(file: File) {
    try {
      assertImportFileAllowed(file);
    } catch (caught) {
      patchActiveDocument({ importedDocument: null });
      setImportMessage(
        caught instanceof Error ? caught.message : DOCUMENT_IO_MESSAGES.importFailed,
      );
      return;
    }

    if (!editorRef.current?.isEmpty()) {
      setPendingImportFile(file);
      setReplaceImportOpen(true);
      return;
    }

    void applyImportedFile(file, "replace");
  }

  async function handleExport(format: ExportFormat) {
    const html = editorRef.current?.getHtml() ?? "";
    const clean = stripEditorAnnotations(html);
    try {
      await exportDocument(clean, format, activeDocument.title);
    } catch {
      setError("Could not export this document");
    }
  }

  function handleRequestSaveToDashboard() {
    setSaveDashboardOpen(true);
  }

  function handleConfirmSaveToDashboard(projectId: string) {
    const destination = dashboardEligibleProjects.find((project) => project.id === projectId);
    if (!destination) {
      toast.error("Choose a Project you can save to.");
      return;
    }
    setSaveDashboardBusy(true);
    try {
      const doc = getActiveDocument(workspaceRef.current);
      const title = doc.title.trim() || "Untitled document";
      const linked =
        doc.lastDashboardOutputId
          ? getDashboardOutputById(doc.lastDashboardOutputId)
          : null;
      const canUpdateLinked =
        Boolean(linked)
        && linked!.projectId === destination.id;

      const record = canUpdateLinked
        ? updateDashboardOutput(linked!.id, {
            name: title,
            sourceContext: "Writing Assistant",
            outputType: "report",
          })
        : createDashboardOutput({
            projectId: destination.id,
            name: title,
            createdByUserId: currentUserId,
            outputType: "report",
            conversationSource: "galaxy",
            sourceContext: "Writing Assistant",
          });

      if (!record) {
        toast.error("Couldn’t save to Dashboard");
        return;
      }

      patchActiveDocument({
        lastDashboardProjectId: record.projectId,
        lastDashboardOutputId: record.id,
      });
      toast.success(`Saved to ${destination.name}`);
      setSaveDashboardOpen(false);
    } finally {
      setSaveDashboardBusy(false);
    }
  }

  const handleOpenDashboard = useCallback((documentId: string) => {
    const doc = workspaceRef.current.documents.find((item) => item.id === documentId);
    if (!doc?.lastDashboardProjectId) return;

    const canView = viewableProjects.some(
      (project) => project.id === doc.lastDashboardProjectId,
    );
    if (!canView) {
      toast.error("You no longer have access to that Project Dashboard.");
      return;
    }

    const outputId = doc.lastDashboardOutputId;
    const existing = outputId ? getDashboardOutputById(outputId) : null;
    const focusId =
      existing && existing.projectId === doc.lastDashboardProjectId
        ? existing.id
        : null;

    onOpenDashboardOutput?.(doc.lastDashboardProjectId, focusId);
  }, [onOpenDashboardOutput, viewableProjects]);

  async function handleShareViaEmail(payload: ShareEmailPayload) {
    const html = editorRef.current?.getHtml() ?? "";
    const clean = stripEditorAnnotations(html);
    setShareBusy(true);
    setError(null);
    try {
      const { blob, filename } = await buildExportBlob(
        clean,
        payload.attachmentFormat,
        activeDocument.title,
      );
      downloadBlob(blob, filename);
      const attachNote =
        `\n\n(Attach the downloaded file “${filename}” before sending. ` +
        "Browser email links cannot include attachments automatically.)";
      openMailtoDraft({
        recipients: payload.recipients,
        subject: payload.subject,
        body: `${payload.message || "I'm sharing this document with you."}${attachNote}`,
      });
      setShareEmailOpen(false);
    } catch {
      setError("Could not prepare the share attachment");
    } finally {
      setShareBusy(false);
    }
  }

  function handleReplace() {
    const nextSuggestion = suggestion;
    if (!nextSuggestion) return;
    const ok = editorRef.current?.replaceAssistedContent(suggestionToHtml(nextSuggestion));
    if (!ok) return;
    const html = editorRef.current?.getHtml();
    if (html !== undefined) patchActiveDocument({ html });
    clearAssistanceContext();
    selectionRef.current = null;
    setSelection(null);
    editorRef.current?.focus();
  }

  function handleAction(actionId: WritingAssistantActionId) {
    if (actionId === "translate") {
      void runAssistance({
        kind: "action",
        actionId,
        targetLanguage: undefined,
        targetLanguageLabel: undefined,
      });
      return;
    }
    if (actionId === "match-reference") {
      void runAssistance({
        kind: "action",
        actionId,
        referenceFileName: undefined,
      });
      return;
    }
    void runAssistance({ kind: "action", actionId });
  }

  function handleTranslateLanguageChange(code: string) {
    setTranslateLanguage(code);
    void runAssistance({
      kind: "action",
      actionId: "translate",
      targetLanguage: code,
      targetLanguageLabel: getLanguageLabel(code),
    });
  }

  function handleMatchReference() {
    if (!referenceDocument) {
      setActiveActionId("match-reference");
      setError("Choose a reference document to match");
      return;
    }
    void runAssistance({
      kind: "action",
      actionId: "match-reference",
      referenceFileName: referenceDocument.name,
    });
  }

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of viewableProjects) {
      map.set(project.id, project.name);
    }
    for (const project of dashboardEligibleProjects) {
      if (!map.has(project.id)) map.set(project.id, project.name);
    }
    return map;
  }, [viewableProjects, dashboardEligibleProjects]);

  const documentOptions = workspace.documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt,
    lastDashboardProjectId: doc.lastDashboardProjectId,
    lastDashboardOutputId: doc.lastDashboardOutputId,
    dashboardProjectName: doc.lastDashboardProjectId
      ? projectNameById.get(doc.lastDashboardProjectId) ?? null
      : null,
  }));

  return (
    <LuxiaPageFrame
      variant="standard"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{ paddingBlockEnd: "0.5rem" }}
    >
      <LuxiaPageHeader
        contentGap="page"
        className="shrink-0"
        pageTypeLabel="APPLICATION"
        title="Writing Assistant"
        titleStyle={{ color: "var(--luxia-brand-primary)" }}
        titleLeading={
          <LuxiaWritingAssistantIcon
            size={22}
            color="var(--luxia-brand-primary)"
            accentColor="var(--luxia-purple-50)"
            aria-hidden
          />
        }
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={PAGE_GUIDANCE}
      />

      <LuxiaPageBody className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden xl:flex-row xl:gap-5">
          <DocumentEditor
            ref={editorRef}
            documents={documentOptions}
            activeDocumentId={activeDocument.id}
            documentName={activeDocument.title}
            showChanges={activeDocument.showChanges}
            importedDocument={activeDocument.importedDocument}
            importMessage={importMessage}
            commentComposerOpen={commentComposerOpen}
            activeComment={
              activeCommentId
                ? activeDocument.comments[activeCommentId] ?? null
                : null
            }
            comments={activeDocument.comments}
            onSelectDocument={handleSelectDocument}
            onDocumentNameChange={handleDocumentNameChange}
            onRenameDocument={handleRenameDocument}
            onContentChange={handleContentChange}
            onNewDocument={handleNewDocument}
            onRequestSaveToDashboard={handleRequestSaveToDashboard}
            onRequestDelete={handleRequestDelete}
            onShareViaEmail={() => setShareEmailOpen(true)}
            onOpenDashboard={handleOpenDashboard}
            documentsLibraryOpen={documentsLibraryOpen}
            onDocumentsLibraryOpenChange={setDocumentsLibraryOpen}
            onSelectionChange={handleSelectionChange}
            onImportFile={handleImportFile}
            onExport={(format) => {
              void handleExport(format);
            }}
            onDismissImport={() => patchActiveDocument({ importedDocument: null })}
            onClearImportMessage={() => setImportMessage(null)}
            onToggleShowChanges={() =>
              patchActiveDocument({ showChanges: !activeDocument.showChanges })
            }
            onClearChangeMarkers={() => setClearMarkersOpen(true)}
            onRequestAddComment={() => {
              setActiveCommentId(null);
              setCommentComposerOpen(true);
            }}
            onCommentComposerOpenChange={setCommentComposerOpen}
            onSaveComment={(body) => {
              const created = editorRef.current?.addComment(body);
              if (!created) {
                setError("Select text in the document to add a comment");
                return;
              }
              setError(null);
              const current = getActiveDocument(workspaceRef.current);
              const html = editorRef.current?.getHtml();
              patchActiveDocument({
                comments: { ...current.comments, [created.id]: created },
                ...(html !== undefined ? { html } : {}),
              });
              setActiveCommentId(null);
              setCommentComposerOpen(false);
            }}
            onEditComment={(comment) => {
              editorRef.current?.updateComment(comment);
              const current = getActiveDocument(workspaceRef.current);
              const html = editorRef.current?.getHtml();
              patchActiveDocument({
                comments: { ...current.comments, [comment.id]: comment },
                ...(html !== undefined ? { html } : {}),
              });
              setActiveCommentId(comment.id);
              setCommentComposerOpen(false);
            }}
            onDeleteComment={(commentId) => {
              editorRef.current?.deleteComment(commentId);
              const current = getActiveDocument(workspaceRef.current);
              const nextComments = { ...current.comments };
              delete nextComments[commentId];
              const html = editorRef.current?.getHtml();
              patchActiveDocument({
                comments: nextComments,
                ...(html !== undefined ? { html } : {}),
              });
              setActiveCommentId(null);
              setCommentComposerOpen(false);
            }}
            onOpenComment={(commentId) => {
              setCommentComposerOpen(false);
              setActiveCommentId(commentId);
            }}
            onCloseComment={() => setActiveCommentId(null)}
          />
          <WritingAssistantPanel
            selectedText={selection?.text ?? null}
            question={question}
            suggestion={suggestion}
            suggestionMeta={suggestionMeta}
            working={working}
            error={error}
            activeActionId={activeActionId}
            translateLanguage={translateLanguage}
            referenceDocument={referenceDocument}
            onQuestionChange={setQuestion}
            onAction={handleAction}
            onTranslateLanguageChange={handleTranslateLanguageChange}
            onReferenceDocumentChange={setReferenceDocument}
            onMatchReference={handleMatchReference}
            onSubmitQuestion={() => {
              void runAssistance({ kind: "question", question });
            }}
            onReplace={handleReplace}
            onClearSelection={handleClearSelection}
          />
        </div>
      </LuxiaPageBody>

      <AlertDialog open={clearMarkersOpen} onOpenChange={setClearMarkersOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear change markers?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes revision markers from the document. Your text will stay unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                editorRef.current?.clearChangeMarkers();
                const html = editorRef.current?.getHtml();
                if (html !== undefined) patchActiveDocument({ html });
                setClearMarkersOpen(false);
              }}
            >
              Clear markers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={replaceImportOpen}
        onOpenChange={(open) => {
          setReplaceImportOpen(open);
          if (!open) setPendingImportFile(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current document?</AlertDialogTitle>
            <AlertDialogDescription>
              Importing this file will replace the current document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel
              onClick={() => {
                setPendingImportFile(null);
                setReplaceImportOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const file = pendingImportFile;
                  setPendingImportFile(null);
                  setReplaceImportOpen(false);
                  if (file) void applyImportedFile(file, "new");
                }}
              >
                Import as new
              </Button>
              <AlertDialogAction
                onClick={() => {
                  const file = pendingImportFile;
                  setPendingImportFile(null);
                  setReplaceImportOpen(false);
                  if (file) void applyImportedFile(file, "replace");
                }}
              >
                Replace
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingDeleteId(null);
                setDeleteConfirmOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentShareEmailDialog
        open={shareEmailOpen}
        documentTitle={activeDocument.title}
        busy={shareBusy}
        onOpenChange={setShareEmailOpen}
        onContinue={handleShareViaEmail}
      />

      <DocumentSaveToDashboardDialog
        open={saveDashboardOpen}
        documentTitle={activeDocument.title}
        sourceProjectId={activeDocument.sourceProjectId}
        eligibleProjects={dashboardEligibleProjects}
        busy={saveDashboardBusy}
        onOpenChange={setSaveDashboardOpen}
        onConfirm={handleConfirmSaveToDashboard}
      />
    </LuxiaPageFrame>
  );
}
