import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { AlertCircle, FileText, FileUp, PenLine } from "lucide-react";
import { DocumentFindBar } from "./DocumentFindBar";
import { CommentMarginBadges } from "./CommentMarginBadges";
import {
  clearAssistanceMark,
  clearRevisionMarks,
  createComment,
  getAssistanceRange,
  markAssistanceRange,
  removeCommentMark,
  replaceAssistanceWithRevision,
  setShowRevisionMarks,
  updateCommentMark,
  wrapSelectionAsComment,
  type DocumentComment,
} from "./documentAnnotations";
import {
  applyDocumentSearch,
  clearDocumentSearch,
} from "./documentSearch";
import {
  applyBlockStyle,
  applyFontSize,
  applyHighlightColor,
  applyTextColor,
  captureEditorRange,
  detectBlockStyle,
  detectFontSize,
  detectHighlightColor,
  detectTextColor,
  insertImageDataUrl,
  queryEditorState,
  resolveFormattingRange,
  restoreEditorRange,
  runEditorCommand,
  type BlockStyle,
  type EditorCommand,
  type FontSizeOption,
} from "./editorCommands";
import { WRITING_ASSISTANT_EDITOR_STYLES } from "./editorStyles";
import {
  WritingAssistantToolbar,
  type ToolbarActiveState,
} from "./WritingAssistantToolbar";
import { DOCUMENT_MAX_BYTES } from "./documentIo";
import {
  DocumentWorkspaceHeader,
  type WritingAssistantDocumentOption,
} from "./DocumentWorkspaceHeader";
import { DocumentsLibrarySheet } from "./DocumentsLibrarySheet";
import type { EditorTextSelection, ImportedDocumentInfo } from "./types";
import type { ExportFormat } from "./documentIo";

const INITIAL_DOCUMENT_HTML = "";

const EMPTY_TOOLBAR_STATE: ToolbarActiveState = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
  justifyFull: false,
  unordered: false,
  ordered: false,
  canUndo: false,
  canRedo: false,
  blockStyle: "p",
  fontSize: "",
  textColor: null,
  highlightColor: null,
};

export type DocumentEditorHandle = {
  focus: () => void;
  getRoot: () => HTMLDivElement | null;
  getHtml: () => string;
  setHtml: (html: string) => void;
  isEmpty: () => boolean;
  syncAssistanceMark: (selection: EditorTextSelection | null) => Range | null;
  clearAssistanceMark: () => void;
  replaceAssistedContent: (html: string) => boolean;
  setShowChanges: (show: boolean) => void;
  clearChangeMarkers: () => void;
  addComment: (body: string) => DocumentComment | null;
  updateComment: (comment: DocumentComment) => void;
  deleteComment: (commentId: string) => void;
};

type DocumentEditorProps = {
  documents: WritingAssistantDocumentOption[];
  activeDocumentId: string;
  documentName: string;
  showChanges: boolean;
  importedDocument: ImportedDocumentInfo | null;
  importMessage: string | null;
  commentComposerOpen: boolean;
  activeComment: DocumentComment | null;
  comments: Record<string, DocumentComment>;
  onSelectDocument: (documentId: string) => void;
  onDocumentNameChange: (value: string) => void;
  onRenameDocument: (documentId: string, title: string) => void;
  onContentChange: (html: string) => void;
  onNewDocument: () => void;
  onRequestSaveToDashboard: () => void;
  onRequestDelete: (documentId: string) => void;
  onShareViaEmail: () => void;
  onOpenDashboard: (documentId: string) => void;
  documentsLibraryOpen: boolean;
  onDocumentsLibraryOpenChange: (open: boolean) => void;
  onSelectionChange: (selection: EditorTextSelection | null) => void;
  onImportFile: (file: File) => void;
  onExport: (format: ExportFormat) => void;
  onDismissImport: () => void;
  onClearImportMessage: () => void;
  onToggleShowChanges: () => void;
  onClearChangeMarkers: () => void;
  onRequestAddComment: () => void;
  onCommentComposerOpenChange: (open: boolean) => void;
  onSaveComment: (body: string) => void;
  onEditComment: (comment: DocumentComment) => void;
  onDeleteComment: (commentId: string) => void;
  onOpenComment: (commentId: string) => void;
  onCloseComment: () => void;
};

function isEditorEmpty(root: HTMLElement): boolean {
  const text = root.innerText.replace(/\u00a0/g, " ").trim();
  return text.length === 0;
}

function ensureEmptyEditorScaffold(root: HTMLElement): void {
  if (!root.firstChild || root.innerHTML.trim() === "") {
    root.innerHTML = "<p><br></p>";
  }
}

function placeCaretAtEditorStart(root: HTMLElement): void {
  ensureEmptyEditorScaffold(root);
  root.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const paragraph = root.querySelector("p") ?? root;
  const range = document.createRange();
  range.setStart(paragraph, 0);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function dataTransferHasFiles(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types).includes("Files");
}

type FileDragKind = "valid" | "invalid";

const SUPPORTED_IMPORT_EXTENSIONS = new Set(["docx", "txt", "md", "markdown"]);

const SUPPORTED_IMPORT_MIME_PREFIXES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml",
  "application/msword",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
];

function extensionOfName(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** Best-effort drag-over classification; final validation runs on import. */
function assessDraggedFile(dataTransfer: DataTransfer): FileDragKind {
  const items = Array.from(dataTransfer.items).filter((item) => item.kind === "file");
  if (items.length === 0) return "valid";

  const item = items[0];
  const asFile = typeof item.getAsFile === "function" ? item.getAsFile() : null;
  if (asFile) {
    if (asFile.size > DOCUMENT_MAX_BYTES) return "invalid";
    if (asFile.name) {
      return SUPPORTED_IMPORT_EXTENSIONS.has(extensionOfName(asFile.name))
        ? "valid"
        : "invalid";
    }
  }

  const type = (item.type || "").toLowerCase();
  if (!type || type === "application/octet-stream") return "valid";
  if (SUPPORTED_IMPORT_MIME_PREFIXES.some((prefix) => type.startsWith(prefix) || type === prefix)) {
    return "valid";
  }
  return "invalid";
}

export const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(
  function DocumentEditor(
    {
      documents,
      activeDocumentId,
      documentName,
      showChanges,
      importedDocument,
      importMessage,
      commentComposerOpen,
      activeComment,
      comments,
      onSelectDocument,
      onDocumentNameChange,
      onRenameDocument,
      onContentChange,
      onNewDocument,
      onRequestSaveToDashboard,
      onRequestDelete,
      onShareViaEmail,
      onOpenDashboard,
      documentsLibraryOpen,
      onDocumentsLibraryOpenChange,
      onSelectionChange,
      onImportFile,
      onExport,
      onDismissImport,
      onClearImportMessage,
      onToggleShowChanges,
      onClearChangeMarkers,
      onRequestAddComment,
      onCommentComposerOpenChange,
      onSaveComment,
      onEditComment,
      onDeleteComment,
      onOpenComment,
      onCloseComment,
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const preservedRangeRef = useRef<Range | null>(null);
    const suppressAssistSelectionRef = useRef(false);
    const isPointerSelectingRef = useRef(false);
    const isKeyboardSelectingRef = useRef(false);
    const searchOpenRef = useRef(false);
    const editorShellRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const scrollParentRef = useRef<HTMLDivElement>(null);
    const dragDepthRef = useRef(0);
    const emptyStateDescId = useId();
    const [showEmptyHint, setShowEmptyHint] = useState(true);
    const [fileDragKind, setFileDragKind] = useState<FileDragKind | null>(null);
    const [isCanvasHovered, setIsCanvasHovered] = useState(false);
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const isFileDragOver = fileDragKind !== null;
    const emptyImportError = Boolean(importMessage && !importedDocument && showEmptyHint);
    // Hide once the user focuses to type; keep visible for drag / import / idle empty.
    const showEmptyGuidance =
      showEmptyHint && (isFileDragOver || isImporting || !isEditorFocused);

    useEffect(() => {
      if (!showEmptyHint || importedDocument) {
        setIsImporting(false);
        return;
      }
      if (importMessage) setIsImporting(false);
    }, [showEmptyHint, importedDocument, importMessage]);
    const [toolbarState, setToolbarState] = useState<ToolbarActiveState>(EMPTY_TOOLBAR_STATE);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchTotal, setSearchTotal] = useState(0);
    const [searchIndex, setSearchIndex] = useState(-1);
    const [findFocusToken, setFindFocusToken] = useState(0);
    const [commentDraft, setCommentDraft] = useState("");
    const [commentLayoutEpoch, setCommentLayoutEpoch] = useState(0);
    const [editorRootEl, setEditorRootEl] = useState<HTMLDivElement | null>(null);

    const bumpCommentLayout = useCallback(() => {
      setCommentLayoutEpoch((value) => value + 1);
    }, []);

    useImperativeHandle(ref, () => ({
      focus: () => {
        const root = rootRef.current;
        if (!root) return;
        if (isEditorEmpty(root)) {
          placeCaretAtEditorStart(root);
          return;
        }
        root.focus();
      },
      getRoot: () => rootRef.current,
      getHtml: () => rootRef.current?.innerHTML ?? "",
      isEmpty: () => {
        const root = rootRef.current;
        return !root || isEditorEmpty(root);
      },
      setHtml: (html: string) => {
        const root = rootRef.current;
        if (!root) return;
        clearDocumentSearch(root);
        root.innerHTML = html;
        root.querySelectorAll("[data-wa-comment-trigger]").forEach((node) => node.remove());
        setShowEmptyHint(isEditorEmpty(root));
        syncToolbarState();
        bumpCommentLayout();
      },
      syncAssistanceMark: (selection) => {
        const root = rootRef.current;
        if (!root) return null;
        if (!selection) {
          clearAssistanceMark(root);
          return null;
        }
        suppressAssistSelectionRef.current = true;
        const marked = markAssistanceRange(root, selection.range);
        if (marked) {
          preservedRangeRef.current = marked.cloneRange();
          // Keep the live selection aligned with the assist host so toolbar
          // formatting (Bold, etc.) does not run against a detached range.
          restoreEditorRange(root, marked);
        }
        window.setTimeout(() => {
          suppressAssistSelectionRef.current = false;
        }, 50);
        return marked;
      },
      clearAssistanceMark: () => {
        const root = rootRef.current;
        if (root) clearAssistanceMark(root);
      },
      replaceAssistedContent: (html: string) => {
        const root = rootRef.current;
        if (!root) return false;
        const result = replaceAssistanceWithRevision(root, html);
        if (!result) return false;
        preservedRangeRef.current = null;
        setShowEmptyHint(isEditorEmpty(root));
        bumpCommentLayout();
        return true;
      },
      setShowChanges: (show: boolean) => {
        const root = rootRef.current;
        if (root) setShowRevisionMarks(root, show);
      },
      clearChangeMarkers: () => {
        const root = rootRef.current;
        if (root) clearRevisionMarks(root);
      },
      addComment: (body: string) => {
        const root = rootRef.current;
        if (!root) return null;
        const captured = captureEditorRange(root);
        const range =
          (captured && !captured.collapsed ? captured : null)
          ?? (
            preservedRangeRef.current && !preservedRangeRef.current.collapsed
              ? preservedRangeRef.current
              : null
          )
          ?? getAssistanceRange(root);
        if (!range || range.collapsed) return null;
        const comment = createComment(body);
        const mark = wrapSelectionAsComment(root, range, comment);
        if (!mark) return null;
        bumpCommentLayout();
        return comment;
      },
      updateComment: (comment: DocumentComment) => {
        const root = rootRef.current;
        if (root) {
          updateCommentMark(root, comment);
          bumpCommentLayout();
        }
      },
      deleteComment: (commentId: string) => {
        const root = rootRef.current;
        if (root) {
          removeCommentMark(root, commentId);
          bumpCommentLayout();
        }
      },
    }));

    useEffect(() => {
      searchOpenRef.current = searchOpen;
    }, [searchOpen]);

    const searchQueryRef = useRef(searchQuery);
    const searchIndexRef = useRef(searchIndex);
    useEffect(() => {
      searchQueryRef.current = searchQuery;
    }, [searchQuery]);
    useEffect(() => {
      searchIndexRef.current = searchIndex;
    }, [searchIndex]);

    useEffect(() => {
      const root = rootRef.current;
      if (root) setShowRevisionMarks(root, showChanges);
    }, [showChanges]);

    useEffect(() => {
      if (commentComposerOpen && !activeComment) setCommentDraft("");
    }, [commentComposerOpen, activeComment]);

    const syncToolbarState = useCallback(() => {
      const root = rootRef.current;
      if (!root) return;
      const queried = queryEditorState();
      setToolbarState({
        ...queried,
        blockStyle: detectBlockStyle(root),
        fontSize: detectFontSize(root),
        textColor: detectTextColor(root),
        highlightColor: detectHighlightColor(root),
      });
    }, []);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.dataset.initialized) {
        root.innerHTML = INITIAL_DOCUMENT_HTML;
        root.dataset.initialized = "true";
        setShowRevisionMarks(root, showChanges);
      }
      setShowEmptyHint(isEditorEmpty(root));
      syncToolbarState();
    }, [showChanges, syncToolbarState]);

    useEffect(() => {
      return () => {
        const root = rootRef.current;
        if (root) clearDocumentSearch(root);
      };
    }, []);

    const publishSelection = useCallback(() => {
      const root = rootRef.current;
      if (!root) return;

      setShowEmptyHint(isEditorEmpty(root));
      syncToolbarState();

      if (suppressAssistSelectionRef.current) {
        return;
      }

      // Native drag / Shift+arrow selection must finish before WA captures a range.
      if (isPointerSelectingRef.current || isKeyboardSelectingRef.current) {
        return;
      }

      const active = document.activeElement;
      const findBarFocused =
        searchOpenRef.current
        && active instanceof HTMLElement
        && Boolean(active.closest('[role="search"][aria-label="Find in document"]'));
      if (findBarFocused) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const anchor = selection.anchorNode;
      if (!anchor || !root.contains(anchor)) {
        return;
      }

      if (selection.isCollapsed) {
        if (searchOpenRef.current) return;
        if (active && !root.contains(active)) {
          return;
        }
        // Keep caret for Bold/Italic typing-mode toggles; clear WA selection.
        try {
          preservedRangeRef.current = selection.getRangeAt(0).cloneRange();
        } catch {
          preservedRangeRef.current = null;
        }
        onSelectionChange(null);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) {
        return;
      }

      const text = range.toString().replace(/\u00a0/g, " ");
      if (!text.trim()) {
        if (searchOpenRef.current) return;
        try {
          preservedRangeRef.current = range.cloneRange();
        } catch {
          preservedRangeRef.current = null;
        }
        onSelectionChange(null);
        return;
      }

      const cloned = range.cloneRange();
      preservedRangeRef.current = cloned;
      onSelectionChange({
        text,
        range: cloned,
      });
    }, [onSelectionChange, syncToolbarState]);

    useEffect(() => {
      const handleSelectionChange = () => {
        if (isPointerSelectingRef.current || isKeyboardSelectingRef.current) {
          syncToolbarState();
          return;
        }
        publishSelection();
      };
      document.addEventListener("selectionchange", handleSelectionChange);
      return () => {
        document.removeEventListener("selectionchange", handleSelectionChange);
      };
    }, [publishSelection, syncToolbarState]);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;

      const beginPointerSelection = () => {
        isPointerSelectingRef.current = true;
      };

      const endPointerSelection = () => {
        if (!isPointerSelectingRef.current) return;
        isPointerSelectingRef.current = false;
        publishSelection();
      };

      // selectstart fires when the user begins a native mouse selection.
      root.addEventListener("selectstart", beginPointerSelection);
      window.addEventListener("pointerup", endPointerSelection);
      window.addEventListener("pointercancel", endPointerSelection);
      window.addEventListener("mouseup", endPointerSelection);
      return () => {
        root.removeEventListener("selectstart", beginPointerSelection);
        window.removeEventListener("pointerup", endPointerSelection);
        window.removeEventListener("pointercancel", endPointerSelection);
        window.removeEventListener("mouseup", endPointerSelection);
      };
    }, [publishSelection]);

    function preserveSelection() {
      const root = rootRef.current;
      if (!root) return;
      const range = captureEditorRange(root);
      // Capture collapsed carets too — needed for Bold typing-mode toggles.
      if (range) {
        preservedRangeRef.current = range;
      }
    }

    function withPreservedSelection(
      run: (root: HTMLDivElement, range: Range | null) => void,
      options?: { allowCollapsed?: boolean; notifySelection?: boolean },
    ) {
      const root = rootRef.current;
      if (!root) return;
      const allowCollapsed = options?.allowCollapsed ?? false;
      const notifySelection = options?.notifySelection ?? true;
      const preferred = resolveFormattingRange(root, preservedRangeRef.current, {
        allowCollapsed,
      });
      if (preferred) {
        preservedRangeRef.current = preferred.cloneRange();
        restoreEditorRange(root, preferred);
      }
      run(root, preferred);
      const nextRange = captureEditorRange(root);
      if (nextRange) {
        preservedRangeRef.current = nextRange.cloneRange();
        if (notifySelection && !nextRange.collapsed) {
          const text = nextRange.toString().replace(/\u00a0/g, " ");
          if (text.trim()) {
            onSelectionChange({
              text,
              range: nextRange.cloneRange(),
            });
          }
        }
      }
      setShowEmptyHint(isEditorEmpty(root));
      syncToolbarState();
    }

    function handleCommand(command: EditorCommand) {
      withPreservedSelection(
        (root, range) => {
          runEditorCommand(root, command, range);
        },
        { allowCollapsed: true, notifySelection: true },
      );
    }

    function handleBlockStyle(style: BlockStyle) {
      withPreservedSelection(
        (root, range) => {
          applyBlockStyle(root, style, range);
        },
        { allowCollapsed: true },
      );
    }

    function handleFontSize(size: FontSizeOption) {
      withPreservedSelection((root, range) => {
        applyFontSize(root, size, range);
      });
    }

    function handleTextColor(color: string | null) {
      withPreservedSelection((root, range) => {
        applyTextColor(root, color, range);
      });
    }

    function handleHighlightColor(color: string | null) {
      withPreservedSelection((root, range) => {
        applyHighlightColor(root, color, range);
      });
    }

    function handleInsertImage(file: File) {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : null;
        if (!dataUrl) return;
        withPreservedSelection((editorRoot) => {
          insertImageDataUrl(editorRoot, dataUrl, file.name || "Inserted image");
        });
      };
      reader.readAsDataURL(file);
    }

    function runSearch(query: string, index: number) {
      const root = rootRef.current;
      if (!root) return;
      suppressAssistSelectionRef.current = true;
      const result = applyDocumentSearch(root, query, index);
      setSearchTotal(result.total);
      setSearchIndex(result.currentIndex);
      window.setTimeout(() => {
        suppressAssistSelectionRef.current = false;
      }, 0);
    }

    function openFind() {
      setSearchOpen(true);
      setFindFocusToken((token) => token + 1);
      if (searchQuery.trim()) {
        runSearch(searchQuery, Math.max(0, searchIndex));
      }
    }

    function closeFind() {
      const root = rootRef.current;
      if (root) clearDocumentSearch(root);
      setSearchOpen(false);
      setSearchQuery("");
      setSearchTotal(0);
      setSearchIndex(-1);
    }

    function handleToggleSearch() {
      if (searchOpen) closeFind();
      else openFind();
    }

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        const shell = editorShellRef.current;
        if (!shell) return;

        const active = document.activeElement;
        const inShell =
          active === shell
          || (active instanceof Node && shell.contains(active));

        if (event.key === "Escape" && searchOpenRef.current && inShell) {
          event.preventDefault();
          const root = rootRef.current;
          if (root) clearDocumentSearch(root);
          setSearchOpen(false);
          setSearchQuery("");
          setSearchTotal(0);
          setSearchIndex(-1);
          root?.focus();
          return;
        }

        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "f") {
          return;
        }
        if (!inShell && !searchOpenRef.current) return;
        event.preventDefault();
        setSearchOpen(true);
        setFindFocusToken((token) => token + 1);
        const query = searchQueryRef.current;
        const root = rootRef.current;
        if (root && query.trim()) {
          suppressAssistSelectionRef.current = true;
          const result = applyDocumentSearch(
            root,
            query,
            Math.max(0, searchIndexRef.current),
          );
          setSearchTotal(result.total);
          setSearchIndex(result.currentIndex);
          window.setTimeout(() => {
            suppressAssistSelectionRef.current = false;
          }, 0);
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
      <div
        ref={editorShellRef}
        data-wa-editor-shell
        className="flex min-h-[min(52vh,28rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border bg-white shadow-[0_1px_2px_rgba(48,33,78,0.04)] xl:min-h-0"
        style={{
          borderColor:
            "color-mix(in srgb, var(--luxia-brand-secondary, #8E63EB) 18%, var(--luxia-border-default))",
        }}
      >
        <style>{WRITING_ASSISTANT_EDITOR_STYLES}</style>

        <DocumentWorkspaceHeader
          documents={documents}
          activeDocumentId={activeDocumentId}
          documentName={documentName}
          onSelectDocument={onSelectDocument}
          onDocumentNameChange={onDocumentNameChange}
          onRenameDocument={onRenameDocument}
          onRequestSaveToDashboard={onRequestSaveToDashboard}
          onExport={onExport}
          onImportFile={onImportFile}
          onNewDocument={onNewDocument}
          onRequestDelete={onRequestDelete}
          onShareViaEmail={onShareViaEmail}
          onOpenDashboard={onOpenDashboard}
          onViewAllDocuments={() => onDocumentsLibraryOpenChange(true)}
        />

        <DocumentsLibrarySheet
          open={documentsLibraryOpen}
          documents={documents}
          activeDocumentId={activeDocumentId}
          onOpenChange={onDocumentsLibraryOpenChange}
          onSelectDocument={onSelectDocument}
          onRenameDocument={onRenameDocument}
          onRequestDelete={onRequestDelete}
          onOpenDashboard={onOpenDashboard}
        />

        <WritingAssistantToolbar
          active={toolbarState}
          searchOpen={searchOpen}
          showChanges={showChanges}
          onCommand={handleCommand}
          onBlockStyle={handleBlockStyle}
          onFontSize={handleFontSize}
          onTextColor={handleTextColor}
          onHighlightColor={handleHighlightColor}
          onInsertImage={handleInsertImage}
          onToggleSearch={handleToggleSearch}
          onToggleShowChanges={onToggleShowChanges}
          onClearChangeMarkers={onClearChangeMarkers}
          onAddComment={onRequestAddComment}
          onPreserveSelection={preserveSelection}
        />

        {searchOpen ? (
          <DocumentFindBar
            query={searchQuery}
            total={searchTotal}
            currentIndex={searchIndex}
            focusToken={findFocusToken}
            onQueryChange={(value) => {
              setSearchQuery(value);
              runSearch(value, 0);
            }}
            onNext={() => {
              if (searchTotal <= 0) return;
              const next = searchIndex < 0 ? 0 : (searchIndex + 1) % searchTotal;
              runSearch(searchQuery, next);
            }}
            onPrevious={() => {
              if (searchTotal <= 0) return;
              const prev =
                searchIndex < 0
                  ? searchTotal - 1
                  : (searchIndex - 1 + searchTotal) % searchTotal;
              runSearch(searchQuery, prev);
            }}
            onClose={closeFind}
          />
        ) : null}

        {(importedDocument || importMessage) && (
          <div
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b px-4 py-2"
            style={
              importMessage && !importedDocument
                ? {
                    borderColor: "color-mix(in srgb, var(--luxia-error-70, #B91C1C) 28%, transparent)",
                    background: "color-mix(in srgb, var(--luxia-error-70, #B91C1C) 6%, white)",
                    color: "var(--luxia-error-70, #B91C1C)",
                  }
                : {
                    borderColor: "color-mix(in srgb, var(--luxia-success, #10B981) 28%, transparent)",
                    background: "color-mix(in srgb, var(--luxia-success, #10B981) 7%, white)",
                    color: "color-mix(in srgb, var(--luxia-success, #10B981) 55%, #1f2937)",
                  }
            }
            role={importMessage && !importedDocument ? "alert" : "status"}
          >
            <div className="min-w-0">
              {importedDocument ? (
                <p className="luxia-type-caption truncate leading-snug">
                  <span className="font-medium">{importedDocument.name}</span>
                  <span>{` · ${formatBytes(importedDocument.sizeBytes)}`}</span>
                </p>
              ) : null}
              {importMessage ? (
                <p className="luxia-type-caption leading-snug">{importMessage}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="luxia-type-caption shrink-0 font-semibold underline-offset-2 hover:underline"
              style={{ color: "inherit" }}
              onClick={() => {
                onDismissImport();
                onClearImportMessage();
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {commentComposerOpen && !activeComment ? (
          <div
            className="border-b px-4 py-3.5"
            style={{
              borderColor: "var(--luxia-border-default)",
              background: "var(--luxia-neutral-surface-subtle, #F7F6FA)",
            }}
          >
            <p
              className="luxia-type-caption mb-0.5 font-semibold tracking-[0.04em] uppercase"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              Review
            </p>
            <p
              className="mb-2.5 text-[13px] font-semibold leading-none"
              style={{ color: "var(--luxia-brand-primary)" }}
            >
              Add a comment
            </p>
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-[6px] border bg-white px-3 py-2 luxia-type-body-dense outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-brand-primary)]"
              style={{ borderColor: "var(--luxia-border-default)" }}
              placeholder="Add a helpful note…"
              aria-label="Comment"
            />
            <div className="mt-2.5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="luxia-button luxia-button--ghost luxia-button--compact"
                onClick={() => {
                  setCommentDraft("");
                  onCommentComposerOpenChange(false);
                  onCloseComment();
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="luxia-button luxia-button--primary luxia-button--compact"
                disabled={!commentDraft.trim()}
                onClick={() => {
                  onSaveComment(commentDraft.trim());
                  setCommentDraft("");
                  onCommentComposerOpenChange(false);
                  bumpCommentLayout();
                }}
              >
                Save comment
              </button>
            </div>
          </div>
        ) : null}

        <div
          ref={scrollParentRef}
          className="relative min-h-0 min-w-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-messages"
          style={{
            background: "var(--luxia-neutral-surface-subtle, #F3F1F6)",
            scrollbarColor: "color-mix(in srgb, var(--luxia-text-muted) 35%, transparent) transparent",
          }}
        >
          <div className="box-border flex min-h-full flex-col px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
            <div
              ref={canvasRef}
              className="relative mx-auto flex w-full min-w-0 max-w-[50rem] flex-1 flex-col rounded-[2px] border transition-[border-color,background-color,box-shadow] duration-150"
              style={{
                minHeight: "max(100%, 32rem)",
                cursor: showEmptyHint && !isFileDragOver && !isImporting ? "text" : undefined,
                borderColor:
                  fileDragKind === "invalid" || emptyImportError
                    ? "color-mix(in srgb, var(--luxia-error-70, #B91C1C) 30%, var(--luxia-border-subtle))"
                    : fileDragKind === "valid" || isImporting
                      ? "color-mix(in srgb, #8E63EB 38%, var(--luxia-border-subtle))"
                      : isEditorFocused
                        ? "color-mix(in srgb, #8E63EB 28%, var(--luxia-border-subtle))"
                        : isCanvasHovered && showEmptyHint
                          ? "color-mix(in srgb, #8E63EB 22%, var(--luxia-border-subtle))"
                          : showEmptyHint
                            ? "color-mix(in srgb, #8E63EB 14%, var(--luxia-border-subtle))"
                            : "var(--luxia-border-subtle)",
                background:
                  fileDragKind === "invalid" || emptyImportError
                    ? "color-mix(in srgb, var(--luxia-error-70, #B91C1C) 3.5%, white)"
                    : fileDragKind === "valid"
                      ? "color-mix(in srgb, #8E63EB 9%, white)"
                      : isImporting
                        ? "color-mix(in srgb, #8E63EB 6%, white)"
                        : showEmptyHint
                          ? "color-mix(in srgb, #8E63EB 3.5%, white)"
                          : "#ffffff",
                boxShadow:
                  isEditorFocused && !isFileDragOver
                    ? "0 1px 3px rgba(15,23,42,0.04), 0 0 0 1px color-mix(in srgb, #8E63EB 14%, transparent)"
                    : isCanvasHovered && showEmptyHint && !isFileDragOver
                      ? "0 1px 5px rgba(15,23,42,0.05)"
                      : "0 1px 3px rgba(15,23,42,0.04)",
              }}
              onMouseEnter={() => setIsCanvasHovered(true)}
              onMouseLeave={() => setIsCanvasHovered(false)}
              onMouseDown={(event) => {
                if (event.button !== 0 || isFileDragOver || isImporting) return;
                if (!showEmptyHint) return;
                const root = rootRef.current;
                if (!root) return;
                // Clicks on the sheet (including padding outside text) start writing.
                if (event.target === canvasRef.current || event.target === root) {
                  placeCaretAtEditorStart(root);
                }
              }}
              onDragEnter={(event: DragEvent<HTMLDivElement>) => {
                if (!dataTransferHasFiles(event.dataTransfer)) return;
                event.preventDefault();
                event.stopPropagation();
                dragDepthRef.current += 1;
                setIsImporting(false);
                setFileDragKind(assessDraggedFile(event.dataTransfer));
              }}
              onDragLeave={(event: DragEvent<HTMLDivElement>) => {
                if (!dataTransferHasFiles(event.dataTransfer)) return;
                event.preventDefault();
                event.stopPropagation();
                dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
                if (dragDepthRef.current === 0) {
                  setFileDragKind(null);
                }
              }}
              onDragOver={(event: DragEvent<HTMLDivElement>) => {
                if (!dataTransferHasFiles(event.dataTransfer)) return;
                event.preventDefault();
                event.stopPropagation();
                const kind = assessDraggedFile(event.dataTransfer);
                setFileDragKind(kind);
                event.dataTransfer.dropEffect = kind === "invalid" ? "none" : "copy";
              }}
              onDrop={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                event.stopPropagation();
                dragDepthRef.current = 0;
                const kind = assessDraggedFile(event.dataTransfer);
                setFileDragKind(null);
                const file = event.dataTransfer.files?.[0];
                if (!file) return;
                if (kind === "valid") setIsImporting(true);
                onImportFile(file);
              }}
            >
              <p id={emptyStateDescId} className="sr-only">
                Empty document. Click anywhere in the page to begin typing, or drop a
                .docx, .txt, or .md file here. You can also use File → Import document.
                Maximum file size 10 MB.
              </p>
              {showEmptyGuidance ? (
                <div
                  className="pointer-events-none absolute inset-0 z-[1] flex justify-center px-6 sm:px-8"
                  style={{
                    alignItems: "center",
                    paddingBottom: "8%",
                  }}
                  aria-hidden
                >
                  <div
                    className={[
                      "wa-empty-zone",
                      fileDragKind === "valid"
                        ? "wa-empty-zone--drag-valid"
                        : fileDragKind === "invalid"
                          ? "wa-empty-zone--drag-invalid"
                          : emptyImportError
                            ? "wa-empty-zone--error"
                            : isImporting
                              ? "wa-empty-zone--uploading"
                              : isCanvasHovered && !isEditorFocused
                                ? "wa-empty-zone--hover"
                                : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {isImporting ? (
                      <>
                        <span className="wa-empty-zone__icon" aria-hidden>
                          <span className="wa-empty-zone__spin" />
                        </span>
                        <p
                          className="text-[15px] font-semibold leading-snug tracking-[-0.015em]"
                          style={{ color: "var(--luxia-brand-primary)" }}
                        >
                          Importing document…
                        </p>
                        <p
                          className="mt-1.5 text-[12px] leading-snug"
                          style={{ color: "var(--luxia-text-muted)" }}
                        >
                          This only takes a moment
                        </p>
                      </>
                    ) : fileDragKind === "invalid" || emptyImportError ? (
                      <>
                        <span className="wa-empty-zone__icon wa-empty-zone__icon--error" aria-hidden>
                          <AlertCircle size={20} strokeWidth={1.7} />
                        </span>
                        <p
                          className="text-[15px] font-semibold leading-snug tracking-[-0.015em]"
                          style={{ color: "var(--luxia-error-70, #B91C1C)" }}
                        >
                          {fileDragKind === "invalid"
                            ? "Not a supported document"
                            : "Could not import document"}
                        </p>
                        <p
                          className="mt-1.5 text-[12px] leading-snug"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          {importMessage && emptyImportError
                            ? importMessage
                            : "Only .docx, .txt, and .md files up to 10 MB are supported."}
                        </p>
                      </>
                    ) : fileDragKind === "valid" ? (
                      <>
                        <span className="wa-empty-zone__icon" aria-hidden>
                          <FileUp size={22} strokeWidth={1.7} />
                        </span>
                        <p
                          className="text-[15px] font-semibold leading-snug tracking-[-0.015em]"
                          style={{ color: "var(--luxia-brand-primary)" }}
                        >
                          Drop to import document
                        </p>
                        <p
                          className="mt-1.5 text-[12px] leading-snug"
                          style={{ color: "var(--luxia-text-muted)" }}
                        >
                          .docx, .txt, .md · Max 10 MB
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="wa-empty-zone__icon" aria-hidden>
                          <PenLine size={20} strokeWidth={1.7} />
                        </span>
                        <p
                          className="text-[16px] font-semibold leading-snug tracking-[-0.02em]"
                          style={{ color: "var(--luxia-brand-primary)" }}
                        >
                          Start writing
                        </p>
                        <p
                          className="mt-1.5 text-[12.5px] leading-snug"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          Click anywhere in the page to begin typing
                        </p>
                        <div className="wa-empty-zone__divider" aria-hidden>
                          or
                        </div>
                        <p
                          className="flex items-center justify-center gap-1.5 text-[13px] font-semibold leading-snug"
                          style={{ color: "var(--luxia-brand-primary)" }}
                        >
                          <FileText size={14} strokeWidth={1.75} aria-hidden />
                          Drop a document here
                        </p>
                        <p
                          className="mt-1.5 text-[11.5px] leading-snug"
                          style={{ color: "var(--luxia-text-muted)" }}
                        >
                          .docx, .txt, .md · Max 10 MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
              <div
                ref={(node) => {
                  rootRef.current = node;
                  setEditorRootEl(node);
                }}
                role="textbox"
                aria-multiline="true"
                aria-label="Document editor"
                aria-describedby={emptyStateDescId}
                contentEditable
                suppressContentEditableWarning
                spellCheck
                className="writing-assistant-editor wa-show-revisions relative z-0 min-h-full w-full min-w-0 flex-1 cursor-text px-8 py-12 pr-11 outline-none focus-visible:ring-0 sm:px-12 sm:py-14 sm:pr-14 lg:px-16 lg:pr-16 luxia-type-body-default leading-[1.75] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h1]:mb-5 [&_h1]:mt-0 [&_h1]:text-[1.875rem] [&_h1]:font-semibold [&_h1]:leading-[1.25] [&_h1]:tracking-[-0.025em] [&_h2]:mb-2.5 [&_h2]:mt-8 [&_h2]:text-[1.25rem] [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:tracking-[-0.02em] [&_h2:first-child]:mt-0 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-[1.0625rem] [&_h3]:font-semibold [&_h3]:leading-snug [&_h3:first-child]:mt-0 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_img]:mx-auto [&_img]:my-5 [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[4px] [&_::selection]:bg-[var(--luxia-opacity-brand-primary-16)]"
                style={{
                  color: "var(--luxia-text-primary)",
                  caretColor: "var(--luxia-brand-primary)",
                  userSelect: "text",
                  WebkitUserSelect: "text",
                }}
                onMouseDown={(event) => {
                  if (event.button !== 0) return;
                  isPointerSelectingRef.current = true;
                  if (!showEmptyHint) return;
                  const root = rootRef.current;
                  if (!root) return;
                  // Defer so we win over the browser's empty-contenteditable caret quirks.
                  requestAnimationFrame(() => {
                    if (rootRef.current && isEditorEmpty(rootRef.current)) {
                      placeCaretAtEditorStart(rootRef.current);
                    }
                  });
                }}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  isPointerSelectingRef.current = true;
                }}
                onFocus={() => {
                  setIsEditorFocused(true);
                  const root = rootRef.current;
                  if (root && isEditorEmpty(root)) {
                    placeCaretAtEditorStart(root);
                  }
                }}
                onInput={() => {
                  const root = rootRef.current;
                  if (root) {
                    setShowEmptyHint(isEditorEmpty(root));
                    onContentChange(root.innerHTML);
                    syncToolbarState();
                    bumpCommentLayout();
                    if (searchOpen && searchQuery.trim()) {
                      runSearch(searchQuery, Math.max(0, searchIndex));
                    }
                  }
                }}
                onKeyDown={(event) => {
                  const isArrow =
                    event.key === "ArrowLeft"
                    || event.key === "ArrowRight"
                    || event.key === "ArrowUp"
                    || event.key === "ArrowDown"
                    || event.key === "Home"
                    || event.key === "End";
                  if (event.shiftKey && isArrow) {
                    isKeyboardSelectingRef.current = true;
                  }
                }}
                onKeyUp={(event) => {
                  if (isKeyboardSelectingRef.current) {
                    isKeyboardSelectingRef.current = false;
                  }
                  if (
                    event.key === "Shift"
                    || event.key.startsWith("Arrow")
                    || event.key === "Home"
                    || event.key === "End"
                  ) {
                    publishSelection();
                    return;
                  }
                  publishSelection();
                }}
                onBlur={() => {
                  setIsEditorFocused(false);
                  const root = rootRef.current;
                  if (root) setShowEmptyHint(isEditorEmpty(root));
                  publishSelection();
                }}
              >
              </div>
              <CommentMarginBadges
                editorRoot={editorRootEl}
                canvasRef={canvasRef}
                scrollParentRef={scrollParentRef}
                comments={comments}
                activeCommentId={activeComment?.id ?? null}
                onOpenComment={onOpenComment}
                onCloseComment={onCloseComment}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                layoutEpoch={commentLayoutEpoch}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
