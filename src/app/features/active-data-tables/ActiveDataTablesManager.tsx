import { GripVertical, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
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
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
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
    hideChrome,
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
    hideChrome?: boolean;
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
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dropId, setDropId] = useState<string | null>(null);
    const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
    const [discardIntent, setDiscardIntent] = useState<"leave" | "reset">("leave");
    const initialRef = useRef(cloneTables(tables));

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
        setDraggingId(null);
        setDropId(null);
        setDiscardConfirmOpen(false);
    }, [effectiveOpen, tables]);

    const dirty = tableSignature(draft) !== tableSignature(initialRef.current);
    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return draft;
        return draft.filter((table) => [table.displayName, table.originalName, table.sourceDatabase, table.description].join(" ").toLowerCase().includes(lowered));
    }, [draft, search]);
    const activeCount = draft.filter((table) => table.active).length;

    function patchTable(id: string, patch: Partial<DataTableRecord>) {
        setDraft((current) => current.map((table) => table.id === id ? { ...table, ...patch } : table));
    }

    function reorder(fromId: string, toId: string) {
        if (fromId === toId) return;
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

    function removeTable(id: string) {
        setDraft((current) => current.filter((table) => table.id !== id));
        setConfirmRemoveId(null);
    }

    function addSelectedTables() {
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
        const next = cloneTables(draft);
        onCommit(next);
        initialRef.current = next;
        setDraft(next);
        setDiscardConfirmOpen(false);
        if (!isPage) onCancel();
    }

    function requestLeave() {
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

    useEffect(() => {
        if (closeRef) closeRef.current = requestLeave;
        return () => { if (closeRef) closeRef.current = null; };
    });

    if (!effectiveOpen) return null;

    const shell = (
                <>
                    {showHeaderChrome ? (
                    <DialogHeader className="flex-shrink-0 border-b px-6 py-5 text-left" style={{ borderColor: LX.border }}>
                        <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="luxia-type-title-modal" style={{ color: LX.primary }}>Active Data Tables</DialogTitle>
                                <DialogDescription className="sr-only">Manage which data tables are available to this constellation.</DialogDescription>
                                <p className="mt-1 luxia-type-metadata" style={{ color: LX.textMuted }}>Manage tables available to this constellation.</p>
                            </div>
                            <button type="button" onClick={requestLeave} className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ borderColor: LX.border, color: LX.textMuted }} aria-label="Close active data tables manager">
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
                                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] border px-3 py-2" style={{ borderColor: LX.border }}>
                                            <Search size={14} style={{ color: LX.textMuted }} />
                                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search data tables..." className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0" aria-label="Search data tables" />
                                        </div>
                                        <Button variant="primary" size="compact" onClick={() => setAddMode(true)}>
                                            <Plus size={14} />Add Data Table
                                        </Button>
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
                                                        <TableCell colSpan={5} className="py-12 text-center luxia-type-body-dense" style={{ color: LX.textMuted }}>
                                                            {search.trim() ? "No data tables match your search." : "No tables available in this constellation."}
                                                        </TableCell>
                                                    </TableRow>
                                                ) : filtered.map((table) => {
                                                    const rowIndex = draft.findIndex((item) => item.id === table.id);
                                                    return (
                                                        <TableRow
                                                            key={table.id}
                                                            onDragOver={(event) => { event.preventDefault(); setDropId(table.id); }}
                                                            onDrop={(event) => { event.preventDefault(); if (draggingId) reorder(draggingId, table.id); setDraggingId(null); setDropId(null); }}
                                                            onDragEnd={() => { setDraggingId(null); setDropId(null); }}
                                                            className="transition-colors"
                                                            style={{ background: dropId === table.id ? LX.state.secondary04 : undefined }}
                                                        >
                                                            <TableCell>
                                                                <button type="button" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; setDraggingId(table.id); }} className="flex h-8 w-8 cursor-grab items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" aria-label={`Drag ${table.displayName}`}>
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
                                                                <Switch checked={table.active} onCheckedChange={(next) => patchTable(table.id, { active: next })} aria-label={`${table.displayName} active state`} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div
                                                                    className="relative z-20"
                                                                    onMouseDown={(event) => event.stopPropagation()}
                                                                    onPointerDown={(event) => event.stopPropagation()}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                >
                                                                    <TableRowMenu
                                                                    onMoveUp={rowIndex > 0 ? () => moveTable(table.id, -1) : undefined}
                                                                    onMoveDown={rowIndex >= 0 && rowIndex < draft.length - 1 ? () => moveTable(table.id, 1) : undefined}
                                                                    disableMoveUp={rowIndex <= 0}
                                                                    disableMoveDown={rowIndex < 0 || rowIndex >= draft.length - 1}
                                                                    onView={() => onPreview(table.id)}
                                                                    onEditDetails={() => onEditDetails(table.id)}
                                                                    onConfigureColumns={() => onConfigureColumns(table.id)}
                                                                    onRemove={() => setConfirmRemoveId(table.id)}
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
                                <div className="flex items-center gap-2">
                                    {dirty || !isPage ? (
                                        <Button variant="secondary" className="px-4" onClick={requestCancelEdits}>Cancel</Button>
                                    ) : null}
                                    <Button variant="primary" className="px-4 !bg-[var(--luxia-purple-70)] !bg-none disabled:!opacity-[0.45]" disabled={!dirty} onClick={save}>Save changes</Button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </>
    );

    return (
        <>
            {isPage ? (
                <div className="flex flex-col overflow-hidden rounded-[12px] border" style={{ borderColor: LX.border }}>
                    {shell}
                </div>
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
            <AlertDialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>Unsaved changes will be lost.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDiscardConfirmOpen(false)}>Keep editing</AlertDialogCancel>
                        <AlertDialogAction
                            style={{ background: LX.error }}
                            className="text-white hover:opacity-90"
                            onClick={() => {
                                setDiscardConfirmOpen(false);
                                if (discardIntent === "reset") {
                                    setDraft(cloneTables(initialRef.current));
                                    return;
                                }
                                onCancel();
                            }}
                        >
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!confirmRemoveId} onOpenChange={(next) => { if (!next) setConfirmRemoveId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove from constellation?</AlertDialogTitle>
                        <AlertDialogDescription>This removes the table from this constellation only. The source table will not be deleted.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConfirmRemoveId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction style={{ background: LX.error }} className="text-white hover:opacity-90" onClick={() => confirmRemoveId && removeTable(confirmRemoveId)}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}