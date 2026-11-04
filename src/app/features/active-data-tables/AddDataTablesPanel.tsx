import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SearchField } from "@/app/features/shared/SearchField";
import { LX } from "./tokens";
import type { DataTableCatalogItem, DataTableRecord } from "./types";
import { compactMeta } from "./utils";

export function AddDataTablesPanel({
    catalog,
    activeTables,
    selectedIds,
    query,
    onQueryChange,
    onToggleSelected,
    onBack,
    onConfirm,
}: {
    catalog: DataTableCatalogItem[];
    activeTables: DataTableRecord[];
    selectedIds: string[];
    query: string;
    onQueryChange: (value: string) => void;
    onToggleSelected: (id: string) => void;
    onBack: () => void;
    onConfirm: () => void;
}) {
    const activeIdSet = new Set(activeTables.map((table) => table.id));
    const filtered = catalog.filter((table) => {
        const lowered = query.trim().toLowerCase();
        if (!lowered) return true;
        return [table.displayName, table.originalName, table.sourceDatabase, `${table.rowCount} rows`, `${table.columns.length} columns`].join(" ").toLowerCase().includes(lowered);
    });

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between gap-3 border-b px-0 pb-4" style={{ borderColor: LX.border }}>
                <div>
                    <h4 className="luxia-type-title-component" style={{ color: LX.primary }}>Add data table</h4>
                    <p className="mt-0.5 luxia-type-metadata" style={{ color: LX.textMuted }}>Select from the available catalog.</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="px-3" onClick={onBack}>
                    Back
                </Button>
            </div>

            <SearchField
                density="dense"
                className="mt-4 flex-none"
                value={query}
                onChange={onQueryChange}
                placeholder="Search tables to add..."
                aria-label="Search available tables"
                clearable={false}
                style={{ background: LX.surface }}
            />

            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical pb-4 pr-1">
                {filtered.length === 0 ? (
                    <div className="rounded-[14px] border border-dashed px-4 py-8 text-center luxia-type-body-dense" style={{ borderColor: LX.border, color: LX.textMuted }}>
                        No tables match your search.
                    </div>
                ) : filtered.map((table) => {
                    const isAdded = activeIdSet.has(table.id);
                    const selected = selectedIds.includes(table.id);
                    return (
                        <button
                            key={table.id}
                            type="button"
                            disabled={isAdded}
                            onClick={() => { if (!isAdded) onToggleSelected(table.id); }}
                            className="flex w-full items-start gap-3 rounded-[14px] border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed"
                            style={{
                                borderColor: selected ? LX.secondary : LX.border,
                                background: selected ? LX.subtle : LX.surface,
                                boxShadow: selected ? LX.shadow.xs : "none",
                                opacity: isAdded ? 0.6 : 1,
                            }}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{table.displayName}</span>
                                    {isAdded ? <span className="luxia-type-caption" style={{ color: LX.textMuted }}>Already added</span> : selected ? <span className="luxia-type-caption" style={{ color: LX.textMuted }}>Selected</span> : null}
                                </div>
                                <p className="mt-0.5 luxia-type-caption" style={{ color: LX.textMuted }}>{compactMeta(table)}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex-shrink-0 flex items-center justify-end gap-2">
                <Button variant="secondary" className="px-4" onClick={onBack}>Cancel</Button>
                <Button className="px-4" disabled={selectedIds.length === 0} onClick={onConfirm}>
                    <Plus size={14} />Add selected
                </Button>
            </div>
        </div>
    );
}
