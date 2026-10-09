import { Columns3, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Textarea } from "@/app/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { LX } from "./tokens";
import type { DataTableColumn, DataTableRecord } from "./types";
import { COLUMN_LANGUAGES } from "./data";
import { cloneColumn } from "./utils";

export function ConfigureColumnsDialog({
    table,
    open,
    onOpenChange,
    onSave,
}: {
    table: DataTableRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (tableId: string, columns: DataTableColumn[]) => void;
}) {
    const [draftColumns, setDraftColumns] = useState<DataTableColumn[]>([]);
    const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
    const initialColumnsRef = useRef<DataTableColumn[]>([]);

    useEffect(() => {
        if (!table || !open) return;
        const snapshot = table.columns.map(cloneColumn);
        initialColumnsRef.current = snapshot;
        setDraftColumns(snapshot);
        setSelectedColumnId(table.columns[0]?.id ?? null);
        setSearch("");
        setConfirmDiscardOpen(false);
    }, [table, open]);

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
        if (isDirty) {
            setConfirmDiscardOpen(true);
            return;
        }
        onOpenChange(false);
    }

    if (!table) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
                <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 1280px)", maxWidth: "min(92vw, 1280px)" }}>
                    <div className="flex flex-col">
                        <DialogHeader>
                            <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal">Configure columns</DialogTitle>
                                    <DialogDescription className="sr-only">Control visibility, display names, types, descriptions, and value context for columns.</DialogDescription>
                                    <p className="mt-1 luxia-type-metadata text-[var(--luxia-purple-10)]">Control visibility, display names, types, descriptions, and value context.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={requestClose}
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2",
                                        LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
                                    )}
                                    aria-label="Close configure columns"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </DialogHeader>

                        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
                            <div className="flex min-h-0 flex-1 flex-col border-r px-6 py-5" style={{ borderColor: LX.border }}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] border px-3 py-2" style={{ borderColor: LX.border, background: LX.surface }}>
                                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search columns..." className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0" aria-label="Search columns" />
                                    </div>
                                </div>

                                {hasInvalidColumns ? (
                                    <p className="mt-3 luxia-type-metadata" style={{ color: LX.error }}>Fix the highlighted display names before saving.</p>
                                ) : null}

                                <div className="mt-4 flex-1 min-h-0 overflow-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical rounded-[18px] border" style={{ borderColor: LX.border }}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow style={{ background: LX.subtle }}>
                                                <TableHead className="sticky top-0 z-10 w-[88px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Active</TableHead>
                                                <TableHead className="sticky top-0 z-10 min-w-[240px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Column</TableHead>
                                                <TableHead className="sticky top-0 z-10 min-w-[120px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Type</TableHead>
                                                <TableHead className="sticky top-0 z-10 min-w-[220px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Description</TableHead>
                                                <TableHead className="sticky top-0 z-10 min-w-[140px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Value context</TableHead>
                                                <TableHead className="sticky top-0 z-10 w-[84px] luxia-type-table-header-dense" style={{ background: LX.subtle, color: LX.textSecondary }}>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredColumns.length === 0 ? (
                                                <TableRow><TableCell colSpan={6} className="py-12 text-center luxia-type-body-dense" style={{ color: LX.textMuted }}>No columns match your search.</TableCell></TableRow>
                                            ) : filteredColumns.map((column) => {
                                                const invalid = column.displayName.trim().length === 0;
                                                return (
                                                    <TableRow
                                                        key={column.id}
                                                        data-state={column.id === selectedColumnId ? "selected" : undefined}
                                                        onClick={() => setSelectedColumnId(column.id)}
                                                        className="cursor-pointer"
                                                        style={{
                                                            background: invalid ? LX.state.error06 : column.id === selectedColumnId ? LX.state.secondary04 : undefined,
                                                            boxShadow: column.id === selectedColumnId ? `inset 0 0 0 1px ${LX.secondary}` : undefined,
                                                        }}
                                                    >
                                                        <TableCell><Switch checked={column.active} onCheckedChange={(next) => setDraftColumns((current) => current.map((item) => item.id === column.id ? { ...item, active: next } : item))} aria-label={`${column.displayName} active state`} /></TableCell>
                                                        <TableCell>
                                                            <div className="min-w-0">
                                                                <Tooltip><TooltipTrigger asChild><p className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{column.displayName}</p></TooltipTrigger><TooltipContent sideOffset={6}>{column.displayName}</TooltipContent></Tooltip>
                                                                <p className="truncate luxia-type-caption" style={{ color: LX.textMuted }}>Original: {column.originalName}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="luxia-type-table-cell-dense" style={{ color: LX.primary }}>{column.type}</TableCell>
                                                        <TableCell><p className="max-w-[280px] truncate luxia-type-table-cell-dense" style={{ color: LX.textMuted }}>{column.description || "No description"}</p></TableCell>
                                                        <TableCell><Switch checked={column.valueContext} onCheckedChange={(next) => setDraftColumns((current) => current.map((item) => item.id === column.id ? { ...item, valueContext: next } : item))} aria-label={`${column.displayName} value context`} /></TableCell>
                                                        <TableCell>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 " aria-label={`Edit ${column.displayName}`} onClick={(event) => { event.stopPropagation(); setSelectedColumnId(column.id); }}>
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

                            <div className="flex min-h-0 w-full max-w-[480px] flex-col px-6 py-5 xl:border-l" style={{ borderColor: LX.border }}>
                                {selectedColumn ? (
                                    <div className="flex h-full min-h-0 flex-col">
                                        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical pr-1">
                                            <div>
                                                <label className="mb-1.5 block luxia-type-label-form" style={{ color: LX.primary }}>Display name</label>
                                                <Input value={selectedColumn.displayName} onChange={(e) => patchSelectedColumn({ displayName: e.target.value })} aria-invalid={selectedColumn.displayName.trim().length === 0} />
                                                {selectedColumn.displayName.trim().length === 0 && <p className="mt-1 luxia-type-metadata" style={{ color: LX.error }}>Display name cannot be empty.</p>}
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block luxia-type-label-form" style={{ color: LX.primary }}>Original field name</label>
                                                <Input value={selectedColumn.originalName} readOnly style={{ background: LX.subtle }} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block luxia-type-label-form" style={{ color: LX.primary }}>Type</label>
                                                <Select value={selectedColumn.type} onValueChange={(value) => patchSelectedColumn({ type: value as DataTableColumn["type"] })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>{(["Text", "Number", "Date", "Boolean", "Currency", "Enum"] as DataTableColumn["type"][]).map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block luxia-type-label-form" style={{ color: LX.primary }}>Description</label>
                                                <Textarea rows={4} value={selectedColumn.description} onChange={(e) => patchSelectedColumn({ description: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block luxia-type-label-form" style={{ color: LX.primary }}>Language</label>
                                                <Select value={selectedColumn.language} onValueChange={(value) => patchSelectedColumn({ language: value })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>{COLUMN_LANGUAGES.map((language) => <SelectItem key={language} value={language}>{language}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3" style={{ borderColor: LX.border }}>
                                                <p className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Active</p>
                                                <Switch checked={selectedColumn.active} onCheckedChange={(next) => patchSelectedColumn({ active: next })} aria-label="Active toggle" />
                                            </div>
                                            <div className="flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3" style={{ borderColor: LX.border }}>
                                                <p className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Value context</p>
                                                <Switch checked={selectedColumn.valueContext} onCheckedChange={(next) => patchSelectedColumn({ valueContext: next })} aria-label="Value context toggle" />
                                            </div>
                                        </div>
                                    </div>
                                ) : <div className="flex h-full items-center justify-center rounded-[18px] border border-dashed px-6 py-10 text-center luxia-type-body-dense" style={{ borderColor: LX.border, color: LX.textMuted }}>Select a column to edit its details.</div>}
                            </div>
                        </div>

                        <div className="border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="secondary" className="px-4" onClick={requestClose}>Cancel</Button>
                                <Button className="px-4" disabled={!isDirty || !canSave} onClick={() => { onSave(table.id, draftColumns.map(cloneColumn)); onOpenChange(false); }}>Save changes</Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <DiscardChangesDialog
                open={confirmDiscardOpen}
                onOpenChange={setConfirmDiscardOpen}
                onDiscard={() => {
                    setConfirmDiscardOpen(false);
                    onOpenChange(false);
                }}
            />
        </>
    );
}