import { FileText, FolderOpen, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { DiscardPDFChangesDialog } from "./DiscardPDFChangesDialog";
import { ManagePDFFilesDialog } from "./ManagePDFFilesDialog";
import { PDFFileRow } from "./PDFFileRow";
import { PDFPreviewDialog } from "./PDFPreviewDialog";
import { PDFUploadZone, fileToPdfRecord } from "./PDFUploadZone";
import { RemovePDFDialog } from "./RemovePDFDialog";
import { PDF_CATALOG } from "./data";
import { LX } from "./tokens";
import type { PDFFileRecord } from "./types";
import { activePdfCount, clonePdfFiles, pdfFilesSignature } from "./utils";

export function PDFFilesManager({
    open,
    files,
    onCommit,
    onCancel,
}: {
    open: boolean;
    files: PDFFileRecord[];
    onCommit: (next: PDFFileRecord[]) => void;
    onCancel: () => void;
}) {
    const [draft, setDraft] = useState<PDFFileRecord[]>(() => clonePdfFiles(files));
    const [search, setSearch] = useState("");
    const [manageOpen, setManageOpen] = useState(false);
    const [viewId, setViewId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef(clonePdfFiles(files));

    useEffect(() => {
        if (!open) return;
        const snapshot = clonePdfFiles(files);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setSearch("");
        setManageOpen(false);
        setViewId(null);
        setConfirmRemoveId(null);
        setDiscardOpen(false);
        setSaving(false);
        setSaveError(null);
    }, [open, files]);

    const dirty = pdfFilesSignature(draft) !== pdfFilesSignature(initialRef.current);
    const visibleDraft = useMemo(() => draft.filter((f) => !f.markedForRemoval), [draft]);
    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return visibleDraft;
        return visibleDraft.filter((f) => f.name.toLowerCase().includes(lowered));
    }, [visibleDraft, search]);

    const viewFile = visibleDraft.find((f) => f.id === viewId) ?? null;
    const count = activePdfCount(draft);

    function requestClose() {
        if (dirty) { setDiscardOpen(true); return; }
        onCancel();
    }

    function markRemove(id: string) {
        setDraft((c) => c.map((f) => f.id === id ? { ...f, markedForRemoval: true } : f));
        setConfirmRemoveId(null);
    }

    function handleUpload(file: File) {
        setDraft((c) => [...c, fileToPdfRecord(file)]);
    }

    function handleManageSave(selectedCatalogIds: string[]) {
        setDraft((current) => {
            const uploads = current.filter((f) => !f.catalogId && !f.markedForRemoval);
            const marked = current.filter((f) => f.markedForRemoval);
            const keptCatalog = current.filter((f) => f.catalogId && !f.markedForRemoval && selectedCatalogIds.includes(f.catalogId));
            const removedCatalog = current
                .filter((f) => f.catalogId && !f.markedForRemoval && !selectedCatalogIds.includes(f.catalogId))
                .map((f) => ({ ...f, markedForRemoval: true }));
            const newCatalog: PDFFileRecord[] = selectedCatalogIds
                .filter((id) => !keptCatalog.some((f) => f.catalogId === id))
                .flatMap((catalogId) => {
                    const catalog = PDF_CATALOG.find((f) => f.id === catalogId);
                    if (!catalog) return [];
                    const record: PDFFileRecord = {
                        id: `pdf-${catalogId}-${Date.now()}`,
                        name: catalog.name,
                        sizeLabel: catalog.sizeLabel,
                        sizeBytes: catalog.sizeBytes,
                        source: "catalog",
                        catalogId,
                        previewable: catalog.previewable,
                    };
                    return [record];
                });
            return [...uploads, ...keptCatalog, ...newCatalog, ...marked, ...removedCatalog];
        });
    }

    function save() {
        if (!dirty || saving) return;
        setSaving(true);
        setSaveError(null);
        window.setTimeout(() => {
            onCommit(draft.filter((f) => !f.markedForRemoval).map((f) => ({ ...f, markedForRemoval: false })));
            setSaving(false);
            onCancel();
        }, 500);
    }

    if (!open) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
                <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 760px)", maxWidth: "min(92vw, 760px)", maxHeight: "88vh" }}>
                    <div className="flex max-h-[88vh] flex-col">
                        <DialogHeader className="flex-shrink-0 border-b px-6 py-5 text-left" style={{ borderColor: LX.border }}>
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]" style={{ background: LX.blueT10 }}>
                                    <FileText size={18} color={LX.secondary} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal" style={{ color: LX.primary }}>PDF Files</DialogTitle>
                                    <DialogDescription className="mt-1 luxia-type-metadata" style={{ color: LX.textMuted }}>Changes are local until saved.</DialogDescription>
                                </div>
                                <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" aria-label="Close PDF files manager" onClick={requestClose}>
                                    <X size={15} style={{ color: LX.textMuted }} />
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="flex-shrink-0 border-b px-6 py-3" style={{ borderColor: LX.border }}>
                            <div className="flex items-center gap-2 rounded-[14px] border px-3 py-2" style={{ borderColor: LX.border, background: LX.subtle }}>
                                <Search size={14} style={{ color: LX.textMuted }} />
                                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PDF files…" className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0" aria-label="Search PDF files" />
                                {search ? <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full" aria-label="Clear search" onClick={() => setSearch("")}><X size={12} style={{ color: LX.textMuted }} /></Button> : null}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    {search ? (
                                        <>
                                            <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>No PDF files match your search.</p>
                                            <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Try another file name.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="luxia-type-title-component" style={{ color: LX.primary }}>No PDF files yet</p>
                                            <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Upload or manage files to connect PDFs.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">{filtered.map((item) => (
                                    <PDFFileRow key={item.id} item={item} onView={() => setViewId(item.id)} onRemove={() => setConfirmRemoveId(item.id)} />
                                ))}</div>
                            )}
                        </div>

                        <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            <PDFUploadZone onUpload={handleUpload} />
                            <Button type="button" variant="outline" className="mb-4 mt-3 w-full rounded-full" onClick={() => setManageOpen(true)}>
                                <FolderOpen size={14} />Manage Files
                            </Button>
                            {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>{count} {count === 1 ? "item" : "items"}{dirty ? " · Unsaved changes" : ""}</span>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="secondary" className="rounded-full px-4" onClick={requestClose}>Cancel</Button>
                                    <Button type="button" className="min-w-[132px] rounded-full px-4" disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save Changes"}</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ManagePDFFilesDialog open={manageOpen} onOpenChange={setManageOpen} catalog={PDF_CATALOG} connectedFiles={draft} onSave={handleManageSave} />
            <PDFPreviewDialog open={!!viewFile} onOpenChange={(o) => { if (!o) setViewId(null); }} file={viewFile} />
            <RemovePDFDialog open={!!confirmRemoveId} onOpenChange={(o) => { if (!o) setConfirmRemoveId(null); }} onConfirm={() => confirmRemoveId && markRemove(confirmRemoveId)} />
            <DiscardPDFChangesDialog open={discardOpen} onOpenChange={setDiscardOpen} onDiscard={() => { setDiscardOpen(false); onCancel(); }} />
        </>
    );
}
