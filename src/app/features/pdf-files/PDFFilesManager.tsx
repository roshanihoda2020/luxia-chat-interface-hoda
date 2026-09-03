import { FileText, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/components/ui/utils";
import { TagMultiSelectFilter, useFileTagFilter } from "@/app/features/document-tags";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
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
    presentation = "dialog",
    closeRef,
    hideChrome,
    fileKind = "pdf",
    fileTagSourceIds = [],
}: {
    open: boolean;
    files: PDFFileRecord[];
    onCommit: (next: PDFFileRecord[]) => void;
    onCancel: () => void;
    presentation?: "dialog" | "page";
    closeRef?: MutableRefObject<(() => void) | null>;
    hideChrome?: boolean;
    /** Settings label override for CSV Constellations reusing this manager. */
    fileKind?: "pdf" | "csv";
    /** Connected Data Source IDs used to resolve File Tags access-safely. */
    fileTagSourceIds?: readonly string[];
}) {
    const isPage = presentation === "page";
    const effectiveOpen = isPage ? true : open;
    const showHeaderChrome = !hideChrome && !isPage;
    const filesLabel = fileKind === "csv" ? "CSV Files" : "PDF Files";
    const addLabel = fileKind === "csv" ? "Add CSV Files" : "Add PDF Files";
    const [draft, setDraft] = useState<PDFFileRecord[]>(() => clonePdfFiles(files));
    const [search, setSearch] = useState("");
    const [manageOpen, setManageOpen] = useState(false);
    const [viewId, setViewId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [discardIntent, setDiscardIntent] = useState<"leave" | "reset">("leave");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef(clonePdfFiles(files));

    useEffect(() => {
        if (!effectiveOpen) return;
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
    }, [effectiveOpen, files]);

    const dirty = pdfFilesSignature(draft) !== pdfFilesSignature(initialRef.current);
    const visibleDraft = useMemo(() => draft.filter((f) => !f.markedForRemoval), [draft]);
    const visibleFileNames = useMemo(() => visibleDraft.map((file) => file.name), [visibleDraft]);
    const resolvedSourceIds = useMemo(() => {
        const ids = new Set(fileTagSourceIds);
        for (const file of visibleDraft) {
            if (file.catalogId) ids.add(file.catalogId);
        }
        return [...ids];
    }, [visibleDraft, fileTagSourceIds]);
    const fileTagFilter = useFileTagFilter(visibleFileNames, resolvedSourceIds);
    const showFileTagFilter = fileTagSourceIds.length > 0;

    useEffect(() => {
        if (!effectiveOpen) return;
        fileTagFilter.clear();
        // Reset with the file list, not on every filter identity change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveOpen, files]);

    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        return visibleDraft.filter((file) => {
            if (!fileTagFilter.matches(file.name)) return false;
            if (lowered && !file.name.toLowerCase().includes(lowered)) return false;
            return true;
        });
    }, [
        visibleDraft,
        search,
        fileTagFilter.matches,
        fileTagFilter.selectedTagIds,
        fileTagFilter.untaggedSelected,
    ]);

    const viewFile = visibleDraft.find((f) => f.id === viewId) ?? null;
    const count = activePdfCount(draft);

    function requestLeave() {
        if (dirty) {
            setDiscardIntent("leave");
            setDiscardOpen(true);
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
        setDiscardOpen(true);
    }

    useEffect(() => {
        if (closeRef) closeRef.current = requestLeave;
        return () => { if (closeRef) closeRef.current = null; };
    });

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
            const committed = draft.filter((f) => !f.markedForRemoval).map((f) => ({ ...f, markedForRemoval: false }));
            onCommit(committed);
            initialRef.current = clonePdfFiles(committed);
            setDraft(clonePdfFiles(committed));
            setSaving(false);
            if (!isPage) onCancel();
        }, 500);
    }

    if (!effectiveOpen) return null;

    const shell = (
                    <div className={isPage ? "flex min-h-0 flex-1 flex-col" : "flex max-h-[88vh] flex-col"}>
                        {showHeaderChrome ? (
                        <DialogHeader className="flex-shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]" style={{ background: LX.blueT10 }}>
                                    <FileText size={18} color={LX.secondary} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal">{filesLabel}</DialogTitle>
                                    <DialogDescription className="mt-1 luxia-type-metadata">Changes are local until saved.</DialogDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-9 w-9", LUXIA_DIALOG_CLOSE_ON_DARK_CLASS)}
                                    aria-label="Close PDF files manager"
                                    onClick={requestLeave}
                                >
                                    <X size={15} />
                                </Button>
                            </div>
                        </DialogHeader>
                        ) : null}

                        <div className="flex-shrink-0 border-b px-6 py-3" style={{ borderColor: LX.border }}>
                            <div className="flex flex-wrap items-end gap-2">
                                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] border px-3 py-2" style={{ borderColor: LX.border, background: LX.subtle }}>
                                    <Search size={14} style={{ color: LX.textMuted }} />
                                    <Input
                                      value={search}
                                      onChange={(e) => setSearch(e.target.value)}
                                      placeholder={`Search ${filesLabel}…`}
                                      className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0"
                                      aria-label={`Search ${filesLabel}`}
                                    />
                                    {search ? <Button type="button" variant="ghost" size="icon" className="h-7 w-7 " aria-label="Clear search" onClick={() => setSearch("")}><X size={12} style={{ color: LX.textMuted }} /></Button> : null}
                                </div>
                                {showFileTagFilter ? (
                                    <TagMultiSelectFilter
                                        options={fileTagFilter.tagOptions}
                                        hasUntagged={fileTagFilter.hasUntagged}
                                        selectedTagIds={fileTagFilter.selectedTagIds}
                                        untaggedSelected={fileTagFilter.untaggedSelected}
                                        onToggleTag={fileTagFilter.toggleTag}
                                        onToggleUntagged={fileTagFilter.toggleUntagged}
                                        onClear={fileTagFilter.clear}
                                    />
                                ) : null}
                                <Button type="button" variant="primary" size="compact" onClick={() => setManageOpen(true)}>
                                    <Plus size={14} />{addLabel}
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    {visibleDraft.length > 0 ? (
                                        <>
                                            <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>No {filesLabel.toLowerCase()} match these filters.</p>
                                            <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>
                                                {search ? "Try another file name." : "Try adjusting the tag filter."}
                                            </p>
                                            {fileTagFilter.hasActiveTagFilters ? (
                                                <Button type="button" variant="tertiary" size="compact" className="mt-3" onClick={fileTagFilter.clear}>
                                                    Clear filters
                                                </Button>
                                            ) : null}
                                        </>
                                    ) : (
                                        <>
                                            <p className="luxia-type-title-component" style={{ color: LX.primary }}>No {filesLabel.toLowerCase()} yet</p>
                                            <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Add existing files or upload new ones.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">{filtered.map((item) => (
                                    <PDFFileRow
                                        key={item.id}
                                        item={item}
                                        fileTagSourceIds={fileTagSourceIds}
                                        onView={() => setViewId(item.id)}
                                        onRemove={() => setConfirmRemoveId(item.id)}
                                    />
                                ))}</div>
                            )}
                        </div>

                        <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            {isPage ? null : <PDFUploadZone onUpload={handleUpload} />}
                            {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>{count} {count === 1 ? "file" : "files"}{dirty ? " · Unsaved changes" : ""}</span>
                                <div className="flex items-center gap-2">
                                    {dirty ? (
                                      <Button type="button" variant="secondary" className="px-4" onClick={requestCancelEdits}>Cancel</Button>
                                    ) : null}
                                    <Button type="button" variant="primary" className="min-w-[132px] px-4 !bg-[var(--luxia-purple-70)] !bg-none disabled:!opacity-[0.45]" disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save Changes"}</Button>
                                </div>
                            </div>
                        </div>
                    </div>
    );

    return (
        <>
            {isPage ? (
                <div className="flex flex-col overflow-hidden rounded-[12px] border" style={{ borderColor: LX.border }}>
                    {shell}
                </div>
            ) : (
                <Dialog open={open} onOpenChange={(next) => { if (!next) requestLeave(); }}>
                    <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 760px)", maxWidth: "min(92vw, 760px)", maxHeight: "88vh" }}>
                        {shell}
                    </DialogContent>
                </Dialog>
            )}

            <ManagePDFFilesDialog open={manageOpen} onOpenChange={setManageOpen} catalog={PDF_CATALOG} connectedFiles={draft} onSave={handleManageSave} />
            <PDFPreviewDialog open={!!viewFile} onOpenChange={(o) => { if (!o) setViewId(null); }} file={viewFile} />
            <RemovePDFDialog open={!!confirmRemoveId} onOpenChange={(o) => { if (!o) setConfirmRemoveId(null); }} onConfirm={() => confirmRemoveId && markRemove(confirmRemoveId)} />
            <DiscardPDFChangesDialog open={discardOpen} onOpenChange={setDiscardOpen} onDiscard={() => {
                setDiscardOpen(false);
                if (discardIntent === "reset") {
                    setDraft(clonePdfFiles(initialRef.current));
                    return;
                }
                onCancel();
            }} />
        </>
    );
}
