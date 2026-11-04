import { GripVertical, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
    DESTRUCTIVE_CONFIRM,
    DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";
import { ListEmptyState } from "@/app/features/shared/ListEmptyState";
import { ListNoResultsState } from "@/app/features/shared/ListNoResultsState";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { SearchField } from "@/app/features/shared/SearchField";
import { useManagerLeaveRegistration } from "@/app/features/shared/unsavedNavigationGuard";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import { Switch } from "@/app/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { AddDataTablesPanel } from "./AddDataTablesPanel";
import { TableRowMenu } from "./TableRowMenu";
import { LX } from "./tokens";
import type { DataTableCatalogItem, DataTableRecord } from "./types";
import { cloneTables, tableSignature } from "./utils";

export function ActiveDataTablesManager({
    open,
    tables,
    catalog,
    onCommit,
    onCancel,
    onPreview,
    onEditDetails,
    onConfigureColumns,
    presentation = "dialog",
    closeRef,
    dirtyRef,
    hideChrome,
    readOnly = false,
}: {
    open: boolean;
    tables: DataTableRecord[];
    catalog: DataTableCatalogItem[];
    onCommit: (nextTables: DataTableRecord[]) => void;
    onCancel: () => void;
    onPreview: (id: string) => void;
    onEditDetails: (id: string) => void;
    onConfigureColumns: (id: string) => void;
    presentation?: "dialog" | "page";
    closeRef?: MutableRefObject<(() => void) | null>;
    dirtyRef?: MutableRefObject<boolean>;
    hideChrome?: boolean;
    readOnly?: boolean;
}) {
    const isPage = presentation === "page";
    const effectiveOpen = isPage ? true : open;
    const showHeaderChrome = !hideChrome && !isPage;
    const [draft, setDraft] = useState<DataTableRecord[]>(() => cloneTables(tables));
    const [search, setSearch] = useState("");
    const [addMode, setAddMode] = useState(false);
    const [addQuery, setAddQuery] = useState("");
    const [addSelected, setAddSelected] = useState<string[]>([]);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dropId, setDropId] = useState<string | null>(null);
    const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
    const [discardIntent, setDiscardIntent] = useState<"leave" | "reset">("leave");
    const initialRef = useRef(cloneTables(tables));
    const removeTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!effectiveOpen) return;
        const snapshot = cloneTables(tables);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setSearch("");
        setAddMode(false);
        setAddQuery("");
        setAddSelected([]);
        setConfirmRemoveId(null);
        setRemoving(false);
        setDraggingId(null);
        setDropId(null);
        setDiscardConfirmOpen(false);
        if (removeTimerRef.current !== null) {
            window.clearTimeout(removeTimerRef.current);
            removeTimerRef.current = null;
        }
    }, [effectiveOpen, tables]);

    useEffect(() => {
        return () => {
            if (removeTimerRef.current !== null) {
                window.clearTimeout(removeTimerRef.current);
            }
        };
    }, []);

    const dirty = !readOnly && tableSignature(draft) !== tableSignature(initialRef.current);
    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return draft;
        return draft.filter((table) => [table.displayName, table.originalName, table.sourceDatabase, table.description].join(" ").toLowerCase().includes(lowered));
    }, [draft, search]);
    const activeCount = draft.filter((table) => table.active).length;

    function patchTable(id: string, patch: Partial<DataTableRecord>) {
        if (readOnly) return;
        setDraft((current) => current.map((table) => table.id === id ? { ...table, ...patch } : table));
    }

    function reorder(fromId: string, toId: string) {
        if (readOnly || fromId === toId) return;
        setDraft((current) => {
            const fromIndex = current.findIndex((table) => table.id === fromId);
            const toIndex = current.findIndex((table) => table.id === toId);
            if (fromIndex < 0 || toIndex < 0) return current;
            const next = [...current];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    }

    function moveTable(id: string, direction: -1 | 1) {
        if (readOnly) return;
        setDraft((current) => {
            const index = current.findIndex((table) => table.id === id);
            const nextIndex = index + direction;
            if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
            const next = [...current];
            const [moved] = next.splice(index, 1);
            next.splice(nextIndex, 0, moved);
            return next;
        });
    }

    function confirmRemove() {
        if (readOnly || !confirmRemoveId || removing) return;
        const removeId = confirmRemoveId;
        setRemoving(true);
        removeTimerRef.current = window.setTimeout(() => {
            removeTimerRef.current = null;
            try {
                const next = cloneTables(draft.filter((table) => table.id !== removeId));
                onCommit(next);
                initialRef.current = next;
                setDraft(next);
                luxiaToast.success(DESTRUCTIVE_CONFIRM.table.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.table.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }

    function addSelectedTables() {
        if (readOnly) return;
        const next = addSelected
            .map((id) => catalog.find((table) => table.id === id))
            .filter((table): table is DataTableCatalogItem => Boolean(table))
            .map((table) => ({ ...table, active: true }));
        setDraft((current) => [...current, ...next]);
        setAddSelected([]);
        setAddMode(false);
        setAddQuery("");
    }

    function save() {
        if (readOnly || !dirty) return;
        const next = cloneTables(draft);
        onCommit(next);
        initialRef.current = next;
        setDraft(next);
        setDiscardConfirmOpen(false);
        luxiaToast.success("Active data tables saved");
        if (!isPage) onCancel();
    }

    function requestLeave() {
        if (removing) return;
        if (dirty) {
            setDiscardIntent("leave");
            setDiscardConfirmOpen(true);
            return;
        }
        onCancel();
    }

    function requestCancelEdits() {
        if (!dirty) {
            if (!isPage) onCancel();
            return;
        }
        setDiscardIntent(isPage ? "reset" : "leave");
        setDiscardConfirmOpen(true);
    }

    useManagerLeaveRegistration({ closeRef, dirtyRef, dirty, requestLeave });

    if (!effectiveOpen) return null;

    const shell = (
                <>
                    {showHeaderChrome ? (
                    <DialogHeader className="flex-shrink-0">
                        <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="luxia-type-title-modal">Active Data Tables</DialogTitle>
                                <DialogDescription className="sr-only">Manage which data tables are available to this constellation.</DialogDescription>
                                <p className="mt-1.5 luxia-type-metadata text-[var(--luxia-purple-10)]">Manage tables available to this constellation.</p>
                            </div>
                            <button
                                type="button"
                                onClick={requestLeave}
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2",
                                    LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
                                )}
                                aria-label="Close active data tables manager"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </DialogHeader>
                    ) : null}

                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        {!addMode ? (
                            <>
                                <div className="flex-shrink-0 px-6 pt-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <SearchField
                                            density="dense"
                                            value={search}
                                            onChange={setSearch}
                                            placeholder="Search data tables..."
                                            aria-label="Search data tables"
                                        />
                                        {!readOnly ? (
                                            <Button variant="primary" size="compact" onClick={() => setAddMode(true)}>
                                                <Plus size={14} />Add Data Table
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-4 pb-6">
                                    <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: LX.border }}>
                                        <Table className="min-w-full table-fixed">
                                            <TableHeader>
                                                <TableRow style={{ background: LX.subtle }}>
                                                    <TableHead className="sticky top-0 z-10 w-[42px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}> </TableHead>
                                                    <TableHead className="sticky top-0 z-10 min-w-[260px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Table</TableHead>
                                                    <TableHead className="sticky top-0 z-10 min-w-[240px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Source / metadata</TableHead>
                                                    <TableHead className="sticky top-0 z-10 w-[110px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Active</TableHead>
                                                    <TableHead className="sticky top-0 z-10 w-[92px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filtered.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="py-6">
                                                            {search.trim() ? (
                                                                <ListNoResultsState title="No data tables match your search." />
                                                            ) : (
                                                                <ListEmptyState title="No tables available in this constellation." />
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ) : filtered.map((table) => {
                                                    const rowIndex = draft.findIndex((item) => item.id === table.id);
                                                    return (
                                                        <TableRow
                                                            key={table.id}
                                                            onDragOver={(event) => {
                                                                if (readOnly) return;
                                                                event.preventDefault();
                                                                setDropId(table.id);
                                                            }}
                                                            onDrop={(event) => {
                                                                if (readOnly) return;
                                                                event.preventDefault();
                                                                if (draggingId) reorder(draggingId, table.id);
                                                                setDraggingId(null);
                                                                setDropId(null);
                                                            }}
                                                            onDragEnd={() => { setDraggingId(null); setDropId(null); }}
                                                            className="transition-colors"
                                                            style={{ background: dropId === table.id ? LX.state.secondary04 : undefined }}
                                                        >
                                                            <TableCell>
                                                                <button
                                                                    type="button"
                                                                    draggable={!readOnly}
                                                                    disabled={readOnly}
                                                                    onDragStart={(event) => {
                                                                        if (readOnly) {
                                                                            event.preventDefault();
                                                                            return;
                                                                        }
                                                                        event.dataTransfer.effectAllowed = "move";
                                                                        setDraggingId(table.id);
                                                                    }}
                                                                    className="flex h-8 w-8 cursor-grab items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-40"
                                                                    aria-label={`Drag ${table.displayName}`}
                                                                >
                                                                    <GripVertical size={14} style={{ color: LX.textMuted }} />
                                                                </button>
                                                            </TableCell>
                                                            <TableCell>
                                                                <button type="button" className="min-w-0 text-left" onClick={() => onPreview(table.id)}>
                                                                    <div className="min-w-0">
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{table.displayName}</span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent sideOffset={6}>{table.displayName}</TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                    <p className="mt-0.5 truncate luxia-type-caption" style={{ color: LX.textMuted }}>{table.originalName}</p>
                                                                </button>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="min-w-0 luxia-type-metadata" style={{ color: LX.textMuted }}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <p className="truncate">{table.sourceDatabase}</p>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent sideOffset={6}>{table.sourceDatabase}</TooltipContent>
                                                                    </Tooltip>
                                                                    <p className="truncate">{table.rowCount} rows • {table.columns.length} columns</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Switch
                                                                    checked={table.active}
                                                                    disabled={readOnly}
                                                                    onCheckedChange={(next) => patchTable(table.id, { active: next })}
                                                                    aria-label={`${table.displayName} active state`}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div
                                                                    className="relative z-20"
                                                                    onMouseDown={(event) => event.stopPropagation()}
                                                                    onPointerDown={(event) => event.stopPropagation()}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                >
                                                                    <TableRowMenu
                                                                    onMoveUp={
                                                                        !readOnly && rowIndex > 0
                                                                            ? () => moveTable(table.id, -1)
                                                                            : undefined
                                                                    }
                                                                    onMoveDown={
                                                                        !readOnly && rowIndex >= 0 && rowIndex < draft.length - 1
                                                                            ? () => moveTable(table.id, 1)
                                                                            : undefined
                                                                    }
                                                                    disableMoveUp={readOnly || rowIndex <= 0}
                                                                    disableMoveDown={readOnly || rowIndex < 0 || rowIndex >= draft.length - 1}
                                                                    onView={() => onPreview(table.id)}
                                                                    onEditDetails={
                                                                        readOnly
                                                                            ? undefined
                                                                            : () => onEditDetails(table.id)
                                                                    }
                                                                    onConfigureColumns={
                                                                        readOnly
                                                                            ? undefined
                                                                            : () => onConfigureColumns(table.id)
                                                                    }
                                                                    onRemove={
                                                                        readOnly
                                                                            ? undefined
                                                                            : () => setConfirmRemoveId(table.id)
                                                                    }
                                                                />
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-5">
                                <AddDataTablesPanel
                                    catalog={catalog}
                                    activeTables={draft}
                                    selectedIds={addSelected}
                                    query={addQuery}
                                    onQueryChange={setAddQuery}
                                    onToggleSelected={(id) => setAddSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
                                    onBack={() => setAddMode(false)}
                                    onConfirm={addSelectedTables}
                                />
                            </div>
                        )}
                    </div>

                    {!addMode ? (
                        <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border, background: LX.surface }}>
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>{activeCount} active tables</span>
                                {!readOnly ? (
                                    <div className="flex items-center gap-2">
                                        {dirty || !isPage ? (
                                            <Button variant="secondary" className="px-4" onClick={requestCancelEdits}>Cancel</Button>
                                        ) : null}
                                        <Button variant="primary" className="px-4 !bg-[var(--luxia-purple-70)] !bg-none disabled:!opacity-[0.45]" disabled={!dirty || removing} onClick={save}>Save changes</Button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </>
    );

    return (
        <>
            {isPage ? (
                shell
            ) : (
                <Dialog open={open} onOpenChange={(next) => { if (!next) requestLeave(); }}>
                    <DialogContent
                        hideCloseButton
                        className="flex max-h-[calc(100vh-48px)] flex-col gap-0 overflow-hidden p-0"
                        style={{ width: "min(92vw, 1200px)", maxWidth: "min(92vw, 1200px)" }}
                    >
                        {shell}
                    </DialogContent>
                </Dialog>
            )}
            <DiscardChangesDialog
                open={discardConfirmOpen}
                onOpenChange={setDiscardConfirmOpen}
                onDiscard={() => {
                    setDiscardConfirmOpen(false);
                    if (discardIntent === "reset") {
                        setDraft(cloneTables(initialRef.current));
                        return;
                    }
                    onCancel();
                }}
            />
            <ConfirmDialog
                open={Boolean(confirmRemoveId)}
                onOpenChange={(next) => {
                    if (!next && !removing) setConfirmRemoveId(null);
                }}
                tone="destructive"
                chrome={isPage ? "standard" : "compact"}
                title={DESTRUCTIVE_CONFIRM.table.title}
                description={DESTRUCTIVE_CONFIRM.table.description}
                cancelLabel="Cancel"
                confirmLabel={DESTRUCTIVE_CONFIRM.table.confirmLabel}
                busy={removing}
                busyLabel={DESTRUCTIVE_CONFIRM.table.busyLabel}
                onConfirm={confirmRemove}
            />
        </>
    );
}
