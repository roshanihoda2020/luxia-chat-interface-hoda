import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { LX } from "./tokens";
import type { DatasourceCatalogFile, ExtraContextFile } from "./types";

export function DatasourceFileSelector({
    catalog,
    linkedFiles,
    onAdd,
    onCancel,
}: {
    catalog: DatasourceCatalogFile[];
    linkedFiles: ExtraContextFile[];
    onAdd: (files: DatasourceCatalogFile[]) => void;
    onCancel: () => void;
}) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string[]>([]);

    const linkedNames = new Set(linkedFiles.filter((file) => !file.markedForRemoval).map((file) => file.name));
    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return catalog;
        return catalog.filter((file) => [file.name, file.fileType, "datasource"].join(" ").toLowerCase().includes(lowered));
    }, [catalog, search]);

    function toggle(id: string) {
        setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center gap-2 rounded-[14px] border px-3 py-2" style={{ borderColor: LX.border, background: LX.surface }}>
                <Search size={14} style={{ color: LX.textMuted }} />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search datasource files…" className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0" aria-label="Search datasource files" />
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical pr-1">
                {filtered.length === 0 ? (
                    <p className="py-8 text-center luxia-type-body-dense" style={{ color: LX.textMuted }}>No files match your search.</p>
                ) : filtered.map((file) => {
                    const isAdded = linkedNames.has(file.name);
                    const checked = selected.includes(file.id);
                    return (
                        <button
                            key={file.id}
                            type="button"
                            disabled={isAdded}
                            onClick={() => { if (!isAdded) toggle(file.id); }}
                            className="flex w-full items-start gap-3 rounded-[12px] border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed"
                            style={{
                                borderColor: checked ? LX.secondary : LX.border,
                                background: checked ? LX.subtle : LX.surface,
                                opacity: isAdded ? 0.65 : 1,
                                boxShadow: checked ? LX.shadow.xs : "none",
                            }}
                        >
                            <Checkbox checked={checked} disabled={isAdded} className="mt-0.5" aria-hidden tabIndex={-1} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{file.name}</span>
                                    {isAdded ? <span className="luxia-type-caption" style={{ color: LX.textMuted }}>Already added</span> : null}
                                </div>
                                <p className="mt-0.5 luxia-type-caption" style={{ color: LX.textMuted }}>{file.fileType}{file.sizeLabel ? ` · ${file.sizeLabel}` : ""}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" className="px-4" onClick={onCancel}>Cancel</Button>
                <Button
                    type="button"
                    className="px-4"
                    disabled={selected.length === 0}
                    onClick={() => onAdd(catalog.filter((file) => selected.includes(file.id)))}
                >
                    Add selected
                </Button>
            </div>
        </div>
    );
}
