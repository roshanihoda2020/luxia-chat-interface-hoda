import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { LX } from "./tokens";
import type { PDFCatalogFile, PDFFileRecord } from "./types";

export function ManagePDFFilesDialog({
    open,
    onOpenChange,
    catalog,
    connectedFiles,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    catalog: PDFCatalogFile[];
    connectedFiles: PDFFileRecord[];
    onSave: (selectedCatalogIds: string[]) => void;
}) {
    const connectedCatalogIds = useMemo(
        () => new Set(connectedFiles.filter((f) => !f.markedForRemoval && f.catalogId).map((f) => f.catalogId as string)),
        [connectedFiles],
    );

    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const initialSelected = useMemo(() => [...connectedCatalogIds], [connectedCatalogIds]);

    useEffect(() => {
        if (!open) return;
        setSearch("");
        setSelected([...connectedCatalogIds]);
    }, [open, connectedCatalogIds]);

    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return catalog;
        return catalog.filter((file) => file.name.toLowerCase().includes(lowered));
    }, [catalog, search]);

    const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...initialSelected].sort());

    function toggle(id: string) {
        setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    }

    function selectAllVisible() {
        const visibleIds = filtered.map((file) => file.id);
        setSelected((current) => Array.from(new Set([...current, ...visibleIds])));
    }

    function deselectAllVisible() {
        const visibleIds = new Set(filtered.map((file) => file.id));
        setSelected((current) => current.filter((id) => !visibleIds.has(id)));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(88vh,640px)] flex-col overflow-hidden p-0" style={{ width: "min(92vw, 560px)", maxWidth: "min(92vw, 560px)" }}>
                <DialogHeader>
                    <DialogTitle className="luxia-type-title-panel">Manage Files</DialogTitle>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
                    <div className="flex items-center gap-2 rounded-[14px] border px-3 py-2" style={{ borderColor: LX.border, background: LX.subtle }}>
                        <Search size={14} style={{ color: LX.textMuted }} />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files…" className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0" aria-label="Search available files" />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={selectAllVisible}>Select All</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={deselectAllVisible}>Deselect all</Button>
                    </div>

                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical pr-1">
                        {filtered.length === 0 ? (
                            <p className="py-8 text-center luxia-type-body-dense" style={{ color: LX.textMuted }}>No files match your search.</p>
                        ) : filtered.map((file) => {
                            const checked = selected.includes(file.id);
                            return (
                                <button
                                    key={file.id}
                                    type="button"
                                    onClick={() => toggle(file.id)}
                                    className="flex w-full items-start gap-3 rounded-[12px] border px-3 py-2.5 text-left"
                                    style={{ borderColor: checked ? LX.secondary : LX.border, background: checked ? LX.subtle : LX.surface }}
                                >
                                    <Checkbox checked={checked} className="mt-0.5" aria-hidden tabIndex={-1} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{file.name}</p>
                                        <p className="mt-0.5 luxia-type-caption" style={{ color: LX.textMuted }}>{file.sizeLabel}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" variant="primary" disabled={!dirty} onClick={() => { onSave(selected); onOpenChange(false); }}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
