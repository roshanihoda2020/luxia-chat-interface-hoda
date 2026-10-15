import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Check,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import { cn } from "@/app/components/ui/utils";
import { formatDocumentUpdatedLabel } from "./documentStore";

export type WritingAssistantDocumentOption = {
  id: string;
  title: string;
  updatedAt: number;
  lastDashboardProjectId: string | null;
  lastDashboardOutputId: string | null;
  dashboardProjectName: string | null;
};

type DocumentsLibrarySheetProps = {
  open: boolean;
  documents: WritingAssistantDocumentOption[];
  activeDocumentId: string;
  onOpenChange: (open: boolean) => void;
  onSelectDocument: (documentId: string) => void;
  onRenameDocument: (documentId: string, title: string) => void;
  onRequestDelete: (documentId: string) => void;
  onOpenDashboard: (documentId: string) => void;
};

function displayTitle(title: string): string {
  return title.trim() || "Untitled document";
}

const destructiveItemClass =
  "gap-2 text-[var(--luxia-error)] focus:bg-[var(--luxia-error-10)] focus:text-[var(--luxia-error)] data-[highlighted]:bg-[var(--luxia-error-10)] data-[highlighted]:text-[var(--luxia-error)]";

const RECENT_LIMIT = 8;

export function DocumentsLibrarySheet({
  open,
  documents,
  activeDocumentId,
  onOpenChange,
  onSelectDocument,
  onRenameDocument,
  onRequestDelete,
  onOpenDashboard,
}: DocumentsLibrarySheetProps) {
  const searchInputId = useId();
  const renameInputId = useId();
  const renameRef = useRef<HTMLInputElement>(null);
  const skipBlurRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameBefore, setRenameBefore] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setRenamingId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!renamingId) return;
    const frame = window.requestAnimationFrame(() => {
      renameRef.current?.focus();
      renameRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [renamingId]);

  const sorted = useMemo(
    () => documents.slice().sort((a, b) => b.updatedAt - a.updatedAt),
    [documents],
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter((doc) => {
      const title = displayTitle(doc.title).toLowerCase();
      const dash = (doc.dashboardProjectName ?? "").toLowerCase();
      return title.includes(query) || dash.includes(query);
    });
  }, [sorted, searchQuery]);

  const recent = useMemo(() => filtered.slice(0, RECENT_LIMIT), [filtered]);
  const searching = searchQuery.trim().length > 0;

  const beginRename = (doc: WritingAssistantDocumentOption) => {
    const current = displayTitle(doc.title);
    setRenameBefore(current);
    setRenameDraft(current);
    setRenamingId(doc.id);
  };

  const cancelRename = () => {
    skipBlurRef.current = true;
    setRenameDraft(renameBefore);
    setRenamingId(null);
  };

  const commitRename = () => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    if (!renamingId) return;
    const next = renameDraft.trim() || "Untitled document";
    onRenameDocument(renamingId, next);
    setRenamingId(null);
  };

  function renderRow(doc: WritingAssistantDocumentOption) {
    const active = doc.id === activeDocumentId;
    const updated = formatDocumentUpdatedLabel(doc.updatedAt);
    const hasDashboard = Boolean(doc.lastDashboardProjectId && doc.dashboardProjectName);

    if (renamingId === doc.id) {
      return (
        <div
          key={doc.id}
          className="rounded-[8px] px-2.5 py-2"
          style={{ background: "var(--luxia-opacity-brand-secondary-08)" }}
        >
          <label className="sr-only" htmlFor={renameInputId}>
            Rename document
          </label>
          <input
            ref={renameRef}
            id={renameInputId}
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitRename();
                return;
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancelRename();
              }
            }}
            className="h-8 w-full rounded-[6px] border bg-white px-2.5 text-[0.9375rem] font-semibold outline-none"
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
          "group/row flex w-full items-center gap-1 rounded-[8px] py-0.5 pr-0.5 pl-1.5",
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
            onOpenChange(false);
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
                  onOpenDashboard(doc.id);
                }}
              >
                Open Dashboard
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={() => beginRename(doc)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className={destructiveItemClass}
              onSelect={() => {
                onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-[22rem]"
      >
        <SheetHeader className="border-b px-5 py-4" style={{ borderColor: "var(--luxia-border-subtle)" }}>
          <SheetTitle>Writing Assistant Documents</SheetTitle>
          <SheetDescription>
            Find and open documents in this workspace.
          </SheetDescription>
          <div className="relative mt-3">
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
              className="h-9 w-full rounded-[6px] border bg-white py-1.5 pr-2.5 pl-8 text-[0.8125rem] outline-none"
              style={{
                borderColor: "var(--luxia-border-default)",
                color: "var(--luxia-text-primary)",
              }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {filtered.length === 0 ? (
            <p
              className="px-2 py-6 text-center luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)" }}
              role="status"
            >
              No matching documents
            </p>
          ) : searching ? (
            <div role="listbox" aria-label="All documents">
              <p
                className="luxia-type-caption mb-1.5 px-1.5 font-semibold"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                All documents
              </p>
              <div className="flex flex-col gap-0.5">
                {filtered.map(renderRow)}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {recent.length > 0 ? (
                <div role="listbox" aria-label="Recent documents">
                  <p
                    className="luxia-type-caption mb-1.5 px-1.5 font-semibold"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    Recent
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {recent.map(renderRow)}
                  </div>
                </div>
              ) : null}
              {sorted.length > RECENT_LIMIT ? (
                <div role="listbox" aria-label="All documents">
                  <p
                    className="luxia-type-caption mb-1.5 px-1.5 font-semibold"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    All documents
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {sorted.map(renderRow)}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
