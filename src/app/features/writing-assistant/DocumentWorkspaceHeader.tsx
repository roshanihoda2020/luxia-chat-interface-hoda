import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Check,
  ChevronDown,
  Download,
  File,
  FileCode,
  FileText,
  FileType,
  FolderOpen,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import type { ExportFormat } from "./documentIo";
import {
  formatDocumentUpdatedLabel,
} from "./documentStore";
import {
  type WritingAssistantDocumentOption,
} from "./DocumentsLibrarySheet";
import { DOCX_MESSAGES } from "./types";

export type { WritingAssistantDocumentOption };

type DocumentWorkspaceHeaderProps = {
  documents: WritingAssistantDocumentOption[];
  activeDocumentId: string;
  documentName: string;
  onSelectDocument: (documentId: string) => void;
  onDocumentNameChange: (value: string) => void;
  onRenameDocument: (documentId: string, title: string) => void;
  onRequestSaveToDashboard: () => void;
  onExport: (format: ExportFormat) => void;
  onImportFile: (file: File) => void;
  onNewDocument: () => void;
  onRequestDelete: (documentId: string) => void;
  onShareViaEmail: () => void;
  onOpenDashboard: (documentId: string) => void;
  onViewAllDocuments: () => void;
};

function displayTitle(title: string): string {
  return title.trim() || "Untitled document";
}

const destructiveItemClass =
  "gap-2 text-[var(--luxia-error)] focus:bg-[var(--luxia-error-10)] focus:text-[var(--luxia-error)] data-[highlighted]:bg-[var(--luxia-error-10)] data-[highlighted]:text-[var(--luxia-error)]";

const POPOVER_RECENT_LIMIT = 6;

export function DocumentWorkspaceHeader({
  documents,
  activeDocumentId,
  documentName,
  onSelectDocument,
  onDocumentNameChange,
  onRenameDocument,
  onRequestSaveToDashboard,
  onExport,
  onImportFile,
  onNewDocument,
  onRequestDelete,
  onShareViaEmail,
  onOpenDashboard,
  onViewAllDocuments,
}: DocumentWorkspaceHeaderProps) {
  const titleInputId = useId();
  const searchInputId = useId();
  const panelRenameInputId = useId();
  const importInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const panelRenameRef = useRef<HTMLInputElement>(null);
  const titleBeforeEditRef = useRef(documentName);
  const skipTitleBlurRef = useRef(false);
  const skipPanelBlurRef = useRef(false);

  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(documentName);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [panelRenameDraft, setPanelRenameDraft] = useState("");
  const [panelRenameBefore, setPanelRenameBefore] = useState("");

  useEffect(() => {
    if (!titleEditing) {
      setTitleDraft(documentName);
      titleBeforeEditRef.current = documentName;
    }
  }, [documentName, titleEditing]);

  useEffect(() => {
    if (!documentsOpen) {
      setSearchQuery("");
      setRenamingId(null);
    }
  }, [documentsOpen]);

  useEffect(() => {
    if (!titleEditing) return;
    const frame = window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [titleEditing]);

  useEffect(() => {
    if (!renamingId) return;
    const frame = window.requestAnimationFrame(() => {
      panelRenameRef.current?.focus();
      panelRenameRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [renamingId]);

  const sortedDocuments = useMemo(
    () => documents.slice().sort((a, b) => b.updatedAt - a.updatedAt),
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedDocuments;
    return sortedDocuments.filter((doc) => {
      const title = displayTitle(doc.title).toLowerCase();
      const dash = (doc.dashboardProjectName ?? "").toLowerCase();
      return title.includes(query) || dash.includes(query);
    });
  }, [sortedDocuments, searchQuery]);

  const recentDocuments = useMemo(
    () => filteredDocuments.slice(0, POPOVER_RECENT_LIMIT),
    [filteredDocuments],
  );

  const beginTitleEdit = () => {
    titleBeforeEditRef.current = documentName;
    setTitleDraft(documentName);
    setTitleEditing(true);
  };

  const cancelTitleEdit = () => {
    skipTitleBlurRef.current = true;
    setTitleDraft(titleBeforeEditRef.current || "Untitled document");
    setTitleEditing(false);
  };

  const commitTitleEdit = () => {
    if (skipTitleBlurRef.current) {
      skipTitleBlurRef.current = false;
      return;
    }
    const next = titleDraft.trim() || "Untitled document";
    setTitleDraft(next);
    setTitleEditing(false);
    onDocumentNameChange(next);
  };

  const beginPanelRename = (doc: WritingAssistantDocumentOption) => {
    const current = displayTitle(doc.title);
    setPanelRenameBefore(current);
    setPanelRenameDraft(current);
    setRenamingId(doc.id);
  };

  const cancelPanelRename = () => {
    skipPanelBlurRef.current = true;
    setPanelRenameDraft(panelRenameBefore);
    setRenamingId(null);
  };

  const commitPanelRename = () => {
    if (skipPanelBlurRef.current) {
      skipPanelBlurRef.current = false;
      return;
    }
    if (!renamingId) return;
    const next = panelRenameDraft.trim() || "Untitled document";
    onRenameDocument(renamingId, next);
    setRenamingId(null);
  };

  function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onImportFile(file);
  }

  function renderDocumentRow(doc: WritingAssistantDocumentOption) {
    const active = doc.id === activeDocumentId;
    const updated = formatDocumentUpdatedLabel(doc.updatedAt);
    const hasDashboard = Boolean(doc.lastDashboardProjectId && doc.dashboardProjectName);

    if (renamingId === doc.id) {
      return (
        <div
          key={doc.id}
          className="rounded-[6px] px-2 py-1.5"
          style={{ background: "var(--luxia-opacity-brand-secondary-08)" }}
        >
          <label className="sr-only" htmlFor={panelRenameInputId}>
            Rename document
          </label>
          <input
            ref={panelRenameRef}
            id={panelRenameInputId}
            value={panelRenameDraft}
            onChange={(event) => setPanelRenameDraft(event.target.value)}
            onBlur={commitPanelRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitPanelRename();
                return;
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancelPanelRename();
              }
            }}
            className="wa-doc-switcher-title-input h-8 w-full rounded-[6px] border bg-white px-2.5 text-[0.9375rem] font-semibold outline-none"
            style={{
              borderColor: "var(--luxia-border-default)",
              color: "var(--luxia-brand-primary)",
            }}
            placeholder="Untitled document"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      );
    }

    return (
      <div
        key={doc.id}
        role="option"
        aria-selected={active}
        className={cn(
          "group/row flex w-full items-center gap-1 rounded-[6px] py-0.5 pr-0.5 pl-1.5",
          active
            ? "bg-[var(--luxia-opacity-brand-secondary-08)]"
            : "hover:bg-[var(--luxia-opacity-brand-secondary-08)]",
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-2 rounded-[5px] px-1 py-1.5 text-left outline-none"
          onClick={() => {
            if (!active) onSelectDocument(doc.id);
            setDocumentsOpen(false);
          }}
        >
          <Check
            size={15}
            strokeWidth={2}
            aria-hidden
            className={cn("mt-0.5 shrink-0", active ? "opacity-100" : "opacity-0")}
            style={{ color: "var(--luxia-brand-secondary)" }}
          />
          <span className="min-w-0 flex-1">
            <span
              className="block truncate text-[0.9375rem] font-medium leading-snug"
              style={{
                color: active ? "var(--luxia-brand-primary)" : "var(--luxia-text-primary)",
              }}
            >
              {displayTitle(doc.title)}
            </span>
            <span
              className="mt-0.5 block truncate text-[11px] leading-snug"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              {updated}
            </span>
            {hasDashboard ? (
              <button
                type="button"
                className="mt-0.5 block truncate text-left text-[11px] font-medium leading-snug outline-none hover:underline"
                style={{ color: "var(--luxia-brand-secondary)" }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDocumentsOpen(false);
                  onOpenDashboard(doc.id);
                }}
              >
                {`${doc.dashboardProjectName} · Dashboard`}
              </button>
            ) : null}
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="iconCompact"
              className="h-7 w-7 shrink-0 opacity-70 group-hover/row:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Actions for ${displayTitle(doc.title)}`}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal size={15} strokeWidth={1.75} aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={4}
            className="w-[10.5rem] min-w-[10.5rem] p-1"
            onClick={(event) => event.stopPropagation()}
          >
            {hasDashboard ? (
              <DropdownMenuItem
                onSelect={() => {
                  setDocumentsOpen(false);
                  onOpenDashboard(doc.id);
                }}
              >
                Open Dashboard
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={() => beginPanelRename(doc)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className={destructiveItemClass}
              onSelect={() => {
                setDocumentsOpen(false);
                onRequestDelete(doc.id);
              }}
            >
              <Trash2
                size={15}
                strokeWidth={1.75}
                aria-hidden
                className="shrink-0 text-[var(--luxia-error)]"
              />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="wa-doc-header flex shrink-0 items-center gap-2.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
      <input
        ref={importInputRef}
        type="file"
        accept=".docx,.txt,.md,.markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
        hidden
        onChange={handleImportChange}
      />

      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        {titleEditing ? (
          <>
            <label className="sr-only" htmlFor={titleInputId}>
              Document title
            </label>
            <input
              ref={titleInputRef}
              id={titleInputId}
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={commitTitleEdit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitTitleEdit();
                  return;
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelTitleEdit();
                }
              }}
              className="wa-doc-title-input h-8 min-w-0 max-w-[min(100%,20rem)] flex-1 rounded-[6px] border border-transparent bg-transparent px-1.5 text-[1.0625rem] font-semibold tracking-[-0.02em] leading-snug outline-none sm:max-w-[min(100%,24rem)] sm:text-[1.125rem]"
              placeholder="Untitled document"
              spellCheck={false}
              autoComplete="off"
            />
          </>
        ) : (
          <button
            type="button"
            className="wa-doc-title-trigger min-w-0 max-w-[min(100%,20rem)] truncate rounded-[6px] px-1.5 py-1 text-left text-[1.0625rem] font-semibold tracking-[-0.02em] leading-snug outline-none sm:max-w-[min(100%,24rem)] sm:text-[1.125rem]"
            onClick={beginTitleEdit}
            aria-label={`Document title: ${displayTitle(documentName)}. Click to rename`}
          >
            <span className="wa-doc-title-label truncate">
              {displayTitle(documentName)}
            </span>
          </button>
        )}

        <Popover open={documentsOpen} onOpenChange={setDocumentsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  className="wa-doc-header-btn wa-doc-documents-btn gap-1.5 px-2.5"
                  aria-label="Documents"
                  aria-haspopup="dialog"
                  aria-expanded={documentsOpen}
                >
                  <FolderOpen size={15} strokeWidth={1.75} aria-hidden className="shrink-0" />
                  <span className="hidden min-[380px]:inline">Documents</span>
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Find Writing Assistant documents</TooltipContent>
          </Tooltip>

          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={6}
            collisionPadding={8}
            className="wa-doc-library w-[min(18.5rem,calc(100vw-1.5rem))] border-[var(--luxia-border-default)] bg-[var(--luxia-surface-floating)] p-0 shadow-[var(--luxia-shadow-md)]"
          >
            <div
              className="border-b px-3 py-2"
              style={{ borderColor: "var(--luxia-border-subtle)" }}
            >
              <p
                className="luxia-type-caption mb-1.5 font-semibold"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Documents
              </p>
              <div className="relative">
                <Search
                  size={14}
                  strokeWidth={1.75}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 opacity-50"
                  style={{ color: "var(--luxia-text-muted)" }}
                />
                <label className="sr-only" htmlFor={searchInputId}>
                  Search documents
                </label>
                <input
                  id={searchInputId}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search documents…"
                  className="h-8 w-full rounded-[6px] border bg-white py-1.5 pr-2.5 pl-8 text-[0.8125rem] outline-none"
                  style={{
                    borderColor: "var(--luxia-border-default)",
                    color: "var(--luxia-text-primary)",
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            <div
              className="max-h-[12.5rem] overflow-y-auto p-1.5"
              role="listbox"
              aria-label="Recent documents"
            >
              {recentDocuments.length === 0 ? (
                <p
                  className="px-2.5 py-3 text-center luxia-type-caption"
                  style={{ color: "var(--luxia-text-muted)" }}
                  role="status"
                >
                  No matching documents
                </p>
              ) : (
                recentDocuments.map(renderDocumentRow)
              )}
            </div>

            <div
              className="border-t p-1.5"
              style={{ borderColor: "var(--luxia-border-subtle)" }}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[0.875rem] font-medium outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-secondary-08)]"
                style={{ color: "var(--luxia-brand-primary)" }}
                onClick={() => {
                  setDocumentsOpen(false);
                  onViewAllDocuments();
                }}
              >
                View all documents
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="wa-doc-actions ml-auto shrink-0 items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="iconCompact"
              className="wa-doc-header-btn wa-doc-icon-btn wa-doc-share-btn"
              aria-label="Share"
              onClick={onShareViaEmail}
            >
              <Share2 size={16} strokeWidth={1.75} aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Share</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="iconCompact"
              className="wa-doc-header-btn wa-doc-icon-btn wa-doc-new-btn"
              aria-label="New document"
              onClick={onNewDocument}
            >
              <Plus size={17} strokeWidth={1.85} aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">New document</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  className="wa-doc-header-btn wa-doc-file-btn gap-1 px-2.5"
                  aria-label="File"
                  aria-haspopup="menu"
                >
                  File
                  <ChevronDown size={14} strokeWidth={1.75} aria-hidden className="shrink-0 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">File actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={6}
            collisionPadding={8}
            className="w-[14rem] min-w-[14rem] p-1.5"
          >
            <DropdownMenuItem
              className="gap-2"
              onSelect={onViewAllDocuments}
            >
              Open documents…
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onSelect={() => importInputRef.current?.click()}
            >
              <Upload size={15} strokeWidth={1.75} aria-hidden className="shrink-0 opacity-70" />
              <span className="min-w-0 flex-1">
                <span className="block leading-snug">Import document…</span>
                <span
                  className="mt-0.5 block text-[11px] font-normal leading-snug"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  {DOCX_MESSAGES.formatsHint}
                </span>
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5" />

            <DropdownMenuItem className="gap-2" onSelect={onRequestSaveToDashboard}>
              <LayoutDashboard
                size={15}
                strokeWidth={1.75}
                aria-hidden
                className="shrink-0 opacity-70"
              />
              Save to Dashboard…
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                className={cn(
                  "gap-2 rounded-[var(--luxia-radius-8)] px-2 py-1.5 luxia-type-body-dense-strong",
                  "focus:bg-[var(--luxia-opacity-brand-secondary-08)] focus:text-[var(--luxia-brand-primary)]",
                  "data-[state=open]:bg-[var(--luxia-opacity-brand-secondary-08)] data-[state=open]:text-[var(--luxia-brand-primary)]",
                )}
              >
                <Download
                  size={15}
                  strokeWidth={1.75}
                  aria-hidden
                  className="shrink-0 opacity-70"
                />
                Export as…
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                className="min-w-[10.5rem] border-[var(--luxia-border-default)] bg-[var(--luxia-surface-floating)] p-1.5 shadow-[var(--luxia-shadow-md)]"
                sideOffset={6}
              >
                <DropdownMenuItem className="gap-2" onSelect={() => onExport("pdf")}>
                  <FileText size={15} strokeWidth={1.75} aria-hidden className="shrink-0 opacity-70" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onSelect={() => onExport("docx")}>
                  <FileType size={15} strokeWidth={1.75} aria-hidden className="shrink-0 opacity-70" />
                  DOCX
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onSelect={() => onExport("md")}>
                  <FileCode size={15} strokeWidth={1.75} aria-hidden className="shrink-0 opacity-70" />
                  Markdown
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onSelect={() => onExport("txt")}>
                  <File size={15} strokeWidth={1.75} aria-hidden className="shrink-0 opacity-70" />
                  TXT
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="my-1.5" />

            <DropdownMenuItem
              className={destructiveItemClass}
              onSelect={() => onRequestDelete(activeDocumentId)}
            >
              <Trash2
                size={15}
                strokeWidth={1.75}
                aria-hidden
                className="shrink-0 text-[var(--luxia-error)]"
              />
              Delete document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
