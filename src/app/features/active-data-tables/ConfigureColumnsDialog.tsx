import { Columns3, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";
import { BusyButton } from "@/app/features/shared/Loading";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { SearchField } from "@/app/features/shared/SearchField";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Textarea } from "@/app/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { ColumnValueContextDialog } from "./ColumnValueContextDialog";
import { LX } from "./tokens";
import type { DataTableColumn, DataTableRecord } from "./types";
import { COLUMN_LANGUAGES } from "./data";
import { cloneColumn } from "./utils";

const SAVE_DELAY_MS = 500;

export function ConfigureColumnsDialog({
    table,
    open,
    onOpenChange,
    onSave,
    entityKind = "table",
    constellationId = "demo",
}: {
    table: DataTableRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (tableId: string, columns: DataTableColumn[]) => void;
    /** Local copy context — defaults preserve Active Data Tables labels. */
    entityKind?: "table" | "view";
    /** Scopes database CVC mock snapshots per Constellation. */
    constellationId?: string;
}) {
    const isView = entityKind === "view";
    const successToast = isView ? "View columns updated" : "Table columns updated";
    const errorToast = isView ? "Could not save the View columns" : "Could not save the Table columns";
    const [draftColumns, setDraftColumns] = useState<DataTableColumn[]>([]);
    const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [cvcOpen, setCvcOpen] = useState(false);
    const initialColumnsRef = useRef<DataTableColumn[]>([]);
    const saveTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!table || !open) return;
        const snapshot = table.columns.map(cloneColumn);
        initialColumnsRef.current = snapshot;
        setDraftColumns(snapshot);
        setSelectedColumnId(table.columns[0]?.id ?? null);
        setSearch("");
        setConfirmDiscardOpen(false);
        setSaving(false);
        setCvcOpen(false);
    }, [table, open]);

    useEffect(() => {
        return () => {
            if (saveTimerRef.current !== null) {
                window.clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    const selectedColumn = draftColumns.find((column) => column.id === selectedColumnId) ?? null;
    const filteredColumns = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return draftColumns;
        return draftColumns.filter((column) => [column.displayName, column.originalName, column.description, column.type, column.language].join(" ").toLowerCase().includes(lowered));
    }, [draftColumns, search]);
    const firstInvalidColumnId = draftColumns.find((column) => column.displayName.trim().length === 0)?.id ?? null;
    const hasInvalidColumns = firstInvalidColumnId !== null;
    const isDirty = !!table && JSON.stringify(draftColumns) !== JSON.stringify(initialColumnsRef.current);
    const canSave = !!selectedColumn && selectedColumn.displayName.trim().length > 0 && !hasInvalidColumns;

    useEffect(() => {
        if (firstInvalidColumnId && selectedColumnId !== firstInvalidColumnId) {
            setSelectedColumnId(firstInvalidColumnId);
        }
    }, [firstInvalidColumnId, selectedColumnId]);

    function patchSelectedColumn(patch: Partial<DataTableColumn>) {
        if (!selectedColumnId) return;
        setDraftColumns((current) => current.map((column) => column.id === selectedColumnId ? { ...column, ...patch } : column));
    }

    function requestClose() {
        if (saving) return;
        if (isDirty) {
            setConfirmDiscardOpen(true);
            return;
        }
        onOpenChange(false);
    }

    function handleSave() {
        if (!table || !isDirty || !canSave || saving) return;
        setSaving(true);
        const tableId = table.id;
        const nextColumns = draftColumns.map(cloneColumn);
        saveTimerRef.current = window.setTimeout(() => {
            saveTimerRef.current = null;
            try {
                onSave(tableId, nextColumns);
                luxiaToast.success(successToast);
                setSaving(false);
                onOpenChange(false);
            } catch {
                luxiaToast.error(errorToast);
                setSaving(false);
            }
        }, SAVE_DELAY_MS);
    }

    if (!table) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
                <DialogContent
                    hideCloseButton
                    className="flex max-h-[calc(100vh-64px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
                    style={{
                        width: "min(calc(100vw - 64px), 1280px)",
                        maxWidth: "min(calc(100vw - 64px), 1280px)",
                        maxHeight: "calc(100vh - 64px)",
                    }}
                    onEscapeKeyDown={(event) => {
                        if (saving || isDirty) {
                            event.preventDefault();
                            requestClose();
                        }
                    }}
                    onPointerDownOutside={(event) => {
                        if (saving || isDirty) {
                            event.preventDefault();
                            requestClose();
                        }
                    }}
                >
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <DialogHeader className="flex-shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <DialogTitle>Configure columns</DialogTitle>
                                    <DialogDescription className="sr-only">
                                        {isView
                                            ? `Control visibility, display names, types, descriptions, and value context for columns in view ${table.displayName}.`
                                            : "Control visibility, display names, types, descriptions, and value context for columns."}
                                    </DialogDescription>
                                    <p className="mt-1 luxia-type-metadata leading-snug text-[var(--luxia-purple-10)]">
                                        {isView
                                            ? `Columns for ${table.displayName}. Control visibility, display names, types, descriptions, and value context.`
                                            : "Control visibility, display names, types, descriptions, and value context."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={requestClose}
                                    disabled={saving}
                                    className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2",
                                        LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
                                    )}
                                    aria-label="Close configure columns"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </DialogHeader>

                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
                            <div
                                className="flex min-h-0 min-w-0 flex-1 flex-col border-b px-5 py-4 lg:basis-[68%] lg:border-b-0 lg:border-r"
                                style={{ borderColor: LX.border }}
                            >
                                <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                                    <SearchField
                                        density="dense"
                                        value={search}
                                        onChange={setSearch}
                                        placeholder="Search columns..."
                                        aria-label="Search columns"
                                        clearable={false}
                                        style={{ background: LX.surface }}
                                    />
                                </div>

                                {hasInvalidColumns ? (
                                    <p className="mt-2 flex-shrink-0 luxia-type-metadata" style={{ color: LX.error }}>Fix the highlighted display names before saving.</p>
                                ) : null}

                                <div className="mt-3 min-h-0 flex-1 overflow-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical rounded-[18px] border" style={{ borderColor: LX.border }}>
                                    <Table className="luxia-type-table-cell-dense">
                                        <TableHeader>
                                            <TableRow style={{ background: LX.subtle }}>
                                                <TableHead className="sticky top-0 z-10 h-8 px-3 py-1.5 w-[88px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Active</TableHead>
                                                <TableHead className="sticky top-0 z-10 h-8 px-3 py-1.5 min-w-[200px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Column</TableHead>
                                                <TableHead className="sticky top-0 z-10 h-8 px-3 py-1.5 min-w-[100px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Type</TableHead>
                                                <TableHead className="sticky top-0 z-10 h-8 px-3 py-1.5 min-w-[180px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Description</TableHead>
                                                <TableHead className="sticky top-0 z-10 h-8 px-3 py-1.5 min-w-[120px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Value context</TableHead>
                                                <TableHead className="sticky top-0 z-10 h-8 px-3 py-1.5 w-[84px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredColumns.length === 0 ? (
                                                <TableRow><TableCell colSpan={6} className="px-3 py-8 text-center luxia-type-body-dense" style={{ color: LX.textMuted }}>No columns match your search.</TableCell></TableRow>
                                            ) : filteredColumns.map((column) => {
                                                const invalid = column.displayName.trim().length === 0;
                                                return (
                                                    <TableRow
                                                        key={column.id}
                                                        data-state={column.id === selectedColumnId ? "selected" : undefined}
                                                        onClick={() => setSelectedColumnId(column.id)}
                                                        className="cursor-pointer"
                                                        style={{
                                                            background: invalid
                                                                ? LX.state.error06
                                                                : column.id === selectedColumnId
                                                                  ? LX.state.secondary04
                                                                  : undefined,
                                                        }}
                                                    >
                                                        <TableCell className="px-3 py-1.5 luxia-type-table-cell-dense"><Switch checked={column.active} onCheckedChange={(next) => setDraftColumns((current) => current.map((item) => item.id === column.id ? { ...item, active: next } : item))} aria-label={`${column.displayName} active state`} /></TableCell>
                                                        <TableCell className="px-3 py-1.5 luxia-type-table-cell-dense">
                                                            <div className="min-w-0 leading-snug">
                                                                <Tooltip><TooltipTrigger asChild><p className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{column.displayName}</p></TooltipTrigger><TooltipContent sideOffset={6}>{column.displayName}</TooltipContent></Tooltip>
                                                                <p className="mt-0.5 truncate luxia-type-caption" style={{ color: LX.textMuted }}>Original: {column.originalName}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-3 py-1.5 luxia-type-table-cell-dense" style={{ color: LX.primary }}>{column.type}</TableCell>
                                                        <TableCell className="px-3 py-1.5 luxia-type-table-cell-dense"><p className="max-w-[280px] truncate luxia-type-table-cell-dense" style={{ color: LX.textMuted }}>{column.description || "No description"}</p></TableCell>
                                                        <TableCell className="px-3 py-1.5 luxia-type-table-cell-dense"><Switch checked={column.valueContext} onCheckedChange={(next) => setDraftColumns((current) => current.map((item) => item.id === column.id ? { ...item, valueContext: next } : item))} aria-label={`${column.displayName} value context`} /></TableCell>
                                                        <TableCell className="px-3 py-1.5 luxia-type-table-cell-dense">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${column.displayName}`} onClick={(event) => { event.stopPropagation(); setSelectedColumnId(column.id); }}>
                                                                        <Columns3 size={14} style={{ color: LX.textMuted }} />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent sideOffset={6}>Edit column</TooltipContent>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div
                                className="flex min-h-0 w-full flex-1 flex-col overflow-hidden px-5 py-4 lg:max-w-[360px] lg:flex-none lg:basis-[32%] lg:border-l"
                                style={{ borderColor: LX.border }}
                            >
                                {selectedColumn ? (
                                    <div className="flex h-full min-h-0 flex-col overflow-hidden">
                                        <div className="min-h-0 flex-1 space-y-3 overflow-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical pr-1">
                                            <div>
                                                <label className="mb-1 block luxia-type-label-small" style={{ color: LX.textSecondary }}>Display name</label>
                                                <Input value={selectedColumn.displayName} onChange={(e) => patchSelectedColumn({ displayName: e.target.value })} aria-invalid={selectedColumn.displayName.trim().length === 0} />
                                                {selectedColumn.displayName.trim().length === 0 && <p className="mt-1 luxia-type-metadata" style={{ color: LX.error }}>Display name cannot be empty.</p>}
                                            </div>
                                            <div>
                                                <label className="mb-1 block luxia-type-label-small" style={{ color: LX.textSecondary }}>Original field name</label>
                                                <Input value={selectedColumn.originalName} readOnly style={{ background: LX.subtle }} />
                                            </div>
                                            <div>
                                                <label className="mb-1 block luxia-type-label-small" style={{ color: LX.textSecondary }}>Type</label>
                                                <Select value={selectedColumn.type} onValueChange={(value) => patchSelectedColumn({ type: value as DataTableColumn["type"] })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>{(["Text", "Number", "Date", "Boolean", "Currency", "Enum"] as DataTableColumn["type"][]).map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block luxia-type-label-small" style={{ color: LX.textSecondary }}>Description</label>
                                                <Textarea rows={3} value={selectedColumn.description} onChange={(e) => patchSelectedColumn({ description: e.target.value })} className="min-h-16 leading-snug" />
                                            </div>
                                            <div>
                                                <label className="mb-1 block luxia-type-label-small" style={{ color: LX.textSecondary }}>Language</label>
                                                <Select value={selectedColumn.language} onValueChange={(value) => patchSelectedColumn({ language: value })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>{COLUMN_LANGUAGES.map((language) => <SelectItem key={language} value={language}>{language}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2" style={{ borderColor: LX.border }}>
                                                <p className="luxia-type-label-form" style={{ color: LX.primary }}>Active</p>
                                                <Switch checked={selectedColumn.active} onCheckedChange={(next) => patchSelectedColumn({ active: next })} aria-label="Active toggle" />
                                            </div>
                                            <div className="flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2" style={{ borderColor: LX.border }}>
                                                <p className="luxia-type-label-form" style={{ color: LX.primary }}>Value context</p>
                                                <Switch checked={selectedColumn.valueContext} onCheckedChange={(next) => patchSelectedColumn({ valueContext: next })} aria-label="Value context toggle" />
                                            </div>
                                            {selectedColumn.valueContext ? (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="w-full px-4"
                                                    disabled={saving}
                                                    onClick={() => setCvcOpen(true)}
                                                >
                                                    Manage values
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : <div className="flex h-full items-center justify-center rounded-[18px] border border-dashed px-6 py-8 text-center luxia-type-body-dense" style={{ borderColor: LX.border, color: LX.textMuted }}>Select a column to edit its details.</div>}
                            </div>
                        </div>

                        <div className="flex-shrink-0 border-t px-5 py-3" style={{ borderColor: LX.border, background: LX.surface }}>
                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="secondary" className="px-4" onClick={requestClose} disabled={saving}>Cancel</Button>
                                <BusyButton
                                    type="button"
                                    className="min-w-[132px] px-4"
                                    disabled={!isDirty || !canSave}
                                    busy={saving}
                                    busyLabel="Saving…"
                                    busyText="Saving…"
                                    onClick={handleSave}
                                >
                                    Save changes
                                </BusyButton>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <DiscardChangesDialog
                open={confirmDiscardOpen}
                onOpenChange={(next) => {
                    if (saving && !next) return;
                    setConfirmDiscardOpen(next);
                }}
                onDiscard={() => {
                    setConfirmDiscardOpen(false);
                    onOpenChange(false);
                }}
            />

            <ColumnValueContextDialog
                open={cvcOpen && Boolean(selectedColumn?.valueContext)}
                onOpenChange={setCvcOpen}
                constellationId={constellationId}
                entityKind={entityKind}
                entity={table}
                column={selectedColumn}
                onValueContextCleared={(clearedColumnId) => {
                    if (!table) return;
                    const nextColumns = draftColumns.map((column) =>
                        column.id === clearedColumnId
                            ? { ...column, valueContext: false }
                            : column,
                    );
                    setDraftColumns(nextColumns);
                    initialColumnsRef.current = nextColumns.map(cloneColumn);
                    onSave(table.id, nextColumns.map(cloneColumn));
                    setCvcOpen(false);
                }}
            />
        </>
    );
}
