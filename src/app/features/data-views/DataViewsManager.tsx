import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
  DESTRUCTIVE_CONFIRM,
  DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { ListEmptyState } from "@/app/features/shared/ListEmptyState";
import { ListNoResultsState } from "@/app/features/shared/ListNoResultsState";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { SearchField } from "@/app/features/shared/SearchField";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import { useManagerLeaveRegistration } from "@/app/features/shared/unsavedNavigationGuard";
import { TableRowMenu } from "@/app/features/active-data-tables/TableRowMenu";
import { LX } from "@/app/features/active-data-tables/tokens";
import type { DataTableCatalogItem, DataTableRecord } from "@/app/features/active-data-tables/types";
import { cloneTables } from "@/app/features/active-data-tables/utils";
import { VIEW_CATALOG } from "./catalog";
import { MAX_CONSTELLATION_VIEWS } from "./constants";
import { ManageViewsDialog } from "./ManageViewsDialog";


/**
 * Settings page + Chat capsule dialog — same manager, canonical bundle.views.
 * Selection commits immediately via Manage Views / Remove (no outer draft Save).
 */
export function DataViewsManager({
  open = true,
  views,
  catalog = VIEW_CATALOG,
  onCommit,
  onCancel,
  onPreview,
  onEditDetails,
  onConfigureColumns,
  readOnly = false,
  presentation = "page",
  closeRef,
  dirtyRef,
}: {
  open?: boolean;
  views: DataTableRecord[];
  catalog?: DataTableCatalogItem[];
  onCommit: (nextViews: DataTableRecord[]) => void;
  onCancel: () => void;
  onPreview: (id: string) => void;
  onEditDetails: (id: string) => void;
  onConfigureColumns: (id: string) => void;
  readOnly?: boolean;
  presentation?: "dialog" | "page";
  closeRef?: MutableRefObject<(() => void) | null>;
  dirtyRef?: MutableRefObject<boolean>;
}) {
  const isPage = presentation === "page";
  const effectiveOpen = isPage ? true : open;
  const [draft, setDraft] = useState<DataTableRecord[]>(() => cloneTables(views));
  const [search, setSearch] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const initialRef = useRef(cloneTables(views));
  const removeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!effectiveOpen) return;
    const snapshot = cloneTables(views);
    initialRef.current = snapshot;
    setDraft(snapshot);
    setSearch("");
    setManageOpen(false);
    setConfirmRemoveId(null);
    setRemoving(false);
  }, [effectiveOpen, views]);

  useEffect(() => {
    return () => {
      if (removeTimerRef.current !== null) {
        window.clearTimeout(removeTimerRef.current);
      }
    };
  }, []);

  useManagerLeaveRegistration({
    closeRef,
    dirtyRef,
    dirty: false,
    requestLeave: onCancel,
  });

  const filtered = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    if (!lowered) return draft;
    return draft.filter((view) =>
      [view.displayName, view.originalName, view.sourceDatabase, view.description]
        .join(" ")
        .toLowerCase()
        .includes(lowered),
    );
  }, [draft, search]);

  const count = draft.length;

  function requestClose() {
    if (removing || manageOpen) return;
    onCancel();
  }

  /** Apply selection from Manage Views — toast owned by ManageViewsDialog. */
  function handleManageSave(nextViews: DataTableRecord[]) {
    if (readOnly) return;
    const snapshot = cloneTables(nextViews);
    onCommit(snapshot);
    initialRef.current = snapshot;
    setDraft(snapshot);
  }

  function confirmRemove() {
    if (readOnly || !confirmRemoveId || removing) return;
    const removeId = confirmRemoveId;
    setRemoving(true);
    removeTimerRef.current = window.setTimeout(() => {
      removeTimerRef.current = null;
      try {
        const next = draft.filter((view) => view.id !== removeId);
        const snapshot = cloneTables(next);
        onCommit(snapshot);
        initialRef.current = snapshot;
        setDraft(snapshot);
        luxiaToast.success(DESTRUCTIVE_CONFIRM.view.successToast);
        setConfirmRemoveId(null);
      } catch {
        luxiaToast.error(DESTRUCTIVE_CONFIRM.view.errorToast);
      } finally {
        setRemoving(false);
      }
    }, DESTRUCTIVE_REMOVE_DELAY_MS);
  }

  if (!effectiveOpen) return null;

  const shell = (
    <>
      {!isPage ? (
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="luxia-type-title-modal">Views</DialogTitle>
              <DialogDescription className="sr-only">
                Manage which database views are available to this constellation.
              </DialogDescription>
              <p className="mt-1.5 luxia-type-metadata text-[var(--luxia-purple-10)]">
                Manage views available to this constellation.
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2",
                LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
              )}
              aria-label="Close Views manager"
            >
              <X size={15} />
            </button>
          </div>
        </DialogHeader>
      ) : null}

      <div
        className={
          isPage
            ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border"
            : "flex min-h-0 flex-1 flex-col overflow-hidden"
        }
        style={isPage ? { borderColor: LX.border } : undefined}
      >
        <div className="flex-shrink-0 px-6 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              density="dense"
              value={search}
              onChange={setSearch}
              placeholder="Search views..."
              aria-label="Search views"
            />
            <Button
              type="button"
              variant="primary"
              size="compact"
              disabled={readOnly}
              onClick={() => setManageOpen(true)}
            >
              Manage Views
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-4 pb-6">
          {draft.length === 0 && !search.trim() ? (
            <ListEmptyState
              title="No Views selected"
              description="Add database views to make them available to this Constellation."
              className="border-0 bg-transparent px-2 py-10"
            />
          ) : filtered.length === 0 ? (
            <ListNoResultsState
              title="No Views match your search."
              className="border-0 bg-transparent px-2 py-10"
            />
          ) : (
            <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: LX.border }}>
              <Table className="min-w-full table-fixed">
                <TableHeader>
                  <TableRow style={{ background: LX.subtle }}>
                    <TableHead
                      className="sticky top-0 z-10 min-w-[260px] luxia-type-table-header-dense"
                      style={{ background: LX.subtle, color: LX.textSecondary }}
                    >
                      View
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-10 min-w-[240px] luxia-type-table-header-dense"
                      style={{ background: LX.subtle, color: LX.textSecondary }}
                    >
                      Source / metadata
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-10 w-[92px] luxia-type-table-header-dense"
                      style={{ background: LX.subtle, color: LX.textSecondary }}
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((view) => (
                    <TableRow key={view.id} className="transition-colors">
                      <TableCell>
                        <button
                          type="button"
                          className="min-w-0 text-left"
                          onClick={() => onPreview(view.id)}
                        >
                          <div className="min-w-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className="min-w-0 truncate luxia-type-body-dense-strong"
                                  style={{ color: LX.primary }}
                                >
                                  {view.displayName}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={6}>{view.displayName}</TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="mt-0.5 truncate luxia-type-caption" style={{ color: LX.textMuted }}>
                            {view.originalName}
                          </p>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 luxia-type-metadata" style={{ color: LX.textMuted }}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="truncate">{view.sourceDatabase}</p>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={6}>{view.sourceDatabase}</TooltipContent>
                          </Tooltip>
                          <p className="truncate">
                            {view.rowCount} rows • {view.columns.length} columns
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="relative z-20"
                          onMouseDown={(event) => event.stopPropagation()}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <TableRowMenu
                            entityKind="view"
                            onView={() => onPreview(view.id)}
                            onEditDetails={
                              readOnly ? undefined : () => onEditDetails(view.id)
                            }
                            onConfigureColumns={
                              readOnly ? undefined : () => onConfigureColumns(view.id)
                            }
                            onRemove={
                              readOnly ? undefined : () => setConfirmRemoveId(view.id)
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div
          className="flex-shrink-0 border-t px-6 py-4"
          style={{ borderColor: LX.border, background: LX.surface }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
              {count === 0
                ? `0 of ${MAX_CONSTELLATION_VIEWS} views`
                : `${count} of ${MAX_CONSTELLATION_VIEWS} views`}
            </span>
            {!isPage ? (
              <Button type="button" variant="secondary" className="px-4" onClick={requestClose}>
                Close
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {isPage ? (
        shell
      ) : (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (!next) requestClose();
          }}
        >
          <DialogContent
            hideCloseButton
            className="flex max-h-[calc(100vh-48px)] flex-col gap-0 overflow-hidden p-0"
            style={{ width: "min(92vw, 1200px)", maxWidth: "min(92vw, 1200px)" }}
          >
            {shell}
          </DialogContent>
        </Dialog>
      )}

      <ManageViewsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        catalog={catalog}
        selectedViews={draft}
        onSave={handleManageSave}
      />

      <ConfirmDialog
        open={Boolean(confirmRemoveId)}
        onOpenChange={(next) => {
          if (!next && !removing) setConfirmRemoveId(null);
        }}
        tone="destructive"
        title={DESTRUCTIVE_CONFIRM.view.title}
        description={DESTRUCTIVE_CONFIRM.view.description}
        cancelLabel="Cancel"
        confirmLabel={DESTRUCTIVE_CONFIRM.view.confirmLabel}
        busy={removing}
        busyLabel={DESTRUCTIVE_CONFIRM.view.busyLabel}
        onConfirm={confirmRemove}
      />
    </>
  );
}
