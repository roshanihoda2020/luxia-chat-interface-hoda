import { FileText, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { TagMultiSelectFilter, useFileTagFilter } from "@/app/features/document-tags";
import { ListEmptyState } from "@/app/features/shared/ListEmptyState";
import { ListNoResultsState } from "@/app/features/shared/ListNoResultsState";
import {
    DESTRUCTIVE_CONFIRM,
    DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { SearchField } from "@/app/features/shared/SearchField";
import { useManagerLeaveRegistration } from "@/app/features/shared/unsavedNavigationGuard";
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
    dirtyRef,
    hideChrome,
    fileKind = "pdf",
    fileTagSourceIds = [],
    readOnly = false,
}: {
    open: boolean;
    files: PDFFileRecord[];
    onCommit: (next: PDFFileRecord[]) => void;
    onCancel: () => void;
    presentation?: "dialog" | "page";
    closeRef?: MutableRefObject<(() => void) | null>;
    dirtyRef?: MutableRefObject<boolean>;
    hideChrome?: boolean;
    /** Settings label override for CSV Constellations reusing this manager. */
    fileKind?: "pdf" | "csv";
    /** Connected Data Source IDs used to resolve File Tags access-safely. */
    fileTagSourceIds?: readonly string[];
    /** When true, View/Preview stays available; mutations are blocked. */
    readOnly?: boolean;
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
    const [removing, setRemoving] = useState(false);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [discardIntent, setDiscardIntent] = useState<"leave" | "reset">("leave");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef(clonePdfFiles(files));
    const removeTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!effectiveOpen) return;
        const snapshot = clonePdfFiles(files);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setSearch("");
        setManageOpen(false);
        setViewId(null);
        setConfirmRemoveId(null);
        setRemoving(false);
        setDiscardOpen(false);
        setSaving(false);
        setSaveError(null);
    }, [effectiveOpen, files]);

    useEffect(() => {
        return () => {
            if (removeTimerRef.current !== null) {
                window.clearTimeout(removeTimerRef.current);
            }
        };
    }, []);

    const dirty = !readOnly && pdfFilesSignature(draft) !== pdfFilesSignature(initialRef.current);
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
        if (readOnly) {
            onCancel();
            return;
        }
        if (dirty) {
            setDiscardIntent("leave");
            setDiscardOpen(true);
            return;
        }
        onCancel();
    }

    function requestCancelEdits() {
        if (readOnly) {
            if (!isPage) onCancel();
            return;
        }
        if (!dirty) {
            if (!isPage) onCancel();
            return;
        }
        setDiscardIntent(isPage ? "reset" : "leave");
        setDiscardOpen(true);
    }

    useManagerLeaveRegistration({ closeRef, dirtyRef, dirty, requestLeave });

    function confirmMarkRemove() {
        if (readOnly || !confirmRemoveId || removing) return;
        const removeId = confirmRemoveId;
        setRemoving(true);
        removeTimerRef.current = window.setTimeout(() => {
            removeTimerRef.current = null;
            try {
                setDraft((c) =>
                    c.map((f) => (f.id === removeId ? { ...f, markedForRemoval: true } : f)),
                );
                luxiaToast.success(DESTRUCTIVE_CONFIRM.pdf.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.pdf.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }

    function handleUpload(file: File) {
        if (readOnly) return;
        setDraft((c) => [...c, fileToPdfRecord(file)]);
    }

    function handleManageSave(selectedCatalogIds: string[]) {
        if (readOnly) return;
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
                        previewUrl: catalog.previewUrl ?? null,
                    };
                    return [record];
                });
            return [...uploads, ...keptCatalog, ...newCatalog, ...marked, ...removedCatalog];
        });
    }

    function save() {
        if (readOnly || !dirty || saving) return;
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
                                    <DialogDescription className="mt-1.5 luxia-type-metadata">
                                        {readOnly ? "View only. Changes cannot be saved for your Project role." : "Changes are local until saved."}
                                    </DialogDescription>
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

                        <div className="flex-shrink-0 border-b px-6 py-3.5" style={{ borderColor: LX.border }}>
                            <div className="flex flex-wrap items-end gap-2">
                                <SearchField
                                    density="dense"
                                    value={search}
                                    onChange={setSearch}
                                    placeholder={`Search ${filesLabel}…`}
                                    aria-label={`Search ${filesLabel}`}
                                />
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
                                {!readOnly ? (
                                    <Button type="button" variant="primary" size="compact" onClick={() => setManageOpen(true)}>
                                        <Plus size={14} />{addLabel}
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <div className="overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                            {filtered.length === 0 ? (
                                visibleDraft.length > 0 ? (
                                    <ListNoResultsState
                                        title={`No ${filesLabel.toLowerCase()} match these filters.`}
                                        description={search ? "Try another file name." : "Try adjusting the tag filter."}
                                        onClear={fileTagFilter.hasActiveTagFilters ? fileTagFilter.clear : undefined}
                                    />
                                ) : (
                                    <ListEmptyState
                                        title={`No ${filesLabel.toLowerCase()} yet`}
                                        description={readOnly ? "No files are connected yet." : "Add existing files or upload new ones."}
                                    />
                                )
                            ) : (
                                <div className="space-y-2">{filtered.map((item) => (
                                    <PDFFileRow
                                        key={item.id}
                                        item={item}
                                        fileTagSourceIds={fileTagSourceIds}
                                        onTagClick={
                                          showFileTagFilter
                                            ? (tag) => fileTagFilter.selectTag(tag.id)
                                            : undefined
                                        }
                                        onView={() => setViewId(item.id)}
                                        onRemove={readOnly ? undefined : () => setConfirmRemoveId(item.id)}
                                    />
                                ))}</div>
                            )}
                        </div>

                        <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            {!readOnly && !isPage ? <PDFUploadZone onUpload={handleUpload} /> : null}
                            {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>{count} {count === 1 ? "file" : "files"}{dirty ? " · Unsaved changes" : ""}</span>
                                {!readOnly ? (
                                    <div className="flex items-center gap-2">
                                        {dirty ? (
                                          <Button type="button" variant="secondary" className="px-4" onClick={requestCancelEdits}>Cancel</Button>
                                        ) : null}
                                        <Button type="button" variant="primary" className="min-w-[132px] px-4 !bg-[var(--luxia-purple-70)] !bg-none disabled:!opacity-[0.45]" disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save Changes"}</Button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
    );

    return (
        <>
            {isPage ? (
                shell
            ) : (
                <Dialog open={open} onOpenChange={(next) => { if (!next) requestLeave(); }}>
                    <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 760px)", maxWidth: "min(92vw, 760px)", maxHeight: "88vh" }}>
                        {shell}
                    </DialogContent>
                </Dialog>
            )}

            {!readOnly ? (
                <ManagePDFFilesDialog open={manageOpen} onOpenChange={setManageOpen} catalog={PDF_CATALOG} connectedFiles={draft} onSave={handleManageSave} />
            ) : null}
            <PDFPreviewDialog open={!!viewFile} onOpenChange={(o) => { if (!o) setViewId(null); }} file={viewFile} />
            {!readOnly ? (
                <RemovePDFDialog
                    open={!!confirmRemoveId}
                    onOpenChange={(o) => { if (!o && !removing) setConfirmRemoveId(null); }}
                    onConfirm={confirmMarkRemove}
                    busy={removing}
                    chrome={isPage ? "standard" : "compact"}
                />
            ) : null}
            {!readOnly ? (
                <DiscardPDFChangesDialog open={discardOpen} onOpenChange={setDiscardOpen} onDiscard={() => {
                    setDiscardOpen(false);
                    if (discardIntent === "reset") {
                        setDraft(clonePdfFiles(initialRef.current));
                        return;
                    }
                    onCancel();
                }} />
            ) : null}
        </>
    );
}
