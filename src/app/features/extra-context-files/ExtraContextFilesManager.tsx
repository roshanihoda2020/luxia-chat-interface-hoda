import { FolderOpen, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { AddExtraContextFilesDialog } from "./AddExtraContextFilesDialog";
import { DiscardExtraContextChangesDialog } from "./DiscardExtraContextChangesDialog";
import { ExtraContextFilePreview } from "./ExtraContextFilePreview";
import { ExtraContextFileRow } from "./ExtraContextFileRow";
import { RemoveExtraContextFileDialog } from "./RemoveExtraContextFileDialog";
import { DATASOURCE_CATALOG } from "./data";
import { LX } from "./tokens";
import type { DatasourceCatalogFile, ExtraContextFile } from "./types";
import { activeFileCount, cloneFiles, filesSignature } from "./utils";

export function ExtraContextFilesManager({
    open,
    files,
    onCommit,
    onCancel,
}: {
    open: boolean;
    files: ExtraContextFile[];
    onCommit: (nextFiles: ExtraContextFile[]) => void;
    onCancel: () => void;
}) {
    const [draft, setDraft] = useState<ExtraContextFile[]>(() => cloneFiles(files));
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef(cloneFiles(files));

    useEffect(() => {
        if (!open) return;
        const snapshot = cloneFiles(files);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setSearch("");
        setAddOpen(false);
        setPreviewId(null);
        setConfirmRemoveId(null);
        setDiscardOpen(false);
        setSaving(false);
        setSaveError(null);
    }, [open, files]);

    const dirty = filesSignature(draft) !== filesSignature(initialRef.current);
    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return draft;
        return draft.filter((file) => [file.name, file.fileType, file.source === "datasource" ? "datasource file" : ""].join(" ").toLowerCase().includes(lowered));
    }, [draft, search]);

    const previewFile = draft.find((file) => file.id === previewId) ?? null;
    const removeFile = draft.find((file) => file.id === confirmRemoveId) ?? null;
    const count = activeFileCount(draft);

    function requestClose() {
        if (dirty) {
            setDiscardOpen(true);
            return;
        }
        onCancel();
    }

    function markRemove(id: string) {
        setDraft((current) => current.map((file) => file.id === id ? { ...file, markedForRemoval: true } : file));
        setConfirmRemoveId(null);
    }

    function addUpload(file: ExtraContextFile) {
        setDraft((current) => [...current, file]);
    }

    function addDatasource(items: DatasourceCatalogFile[]) {
        const next = items.map((item) => ({
            id: `ds-${item.id}-${Date.now()}`,
            name: item.name,
            fileType: item.fileType,
            sizeLabel: item.sizeLabel,
            source: "datasource" as const,
            status: "new" as const,
            previewable: item.previewable,
        }));
        setDraft((current) => [...current, ...next]);
    }

    function save() {
        if (!dirty || saving) return;
        setSaving(true);
        setSaveError(null);
        window.setTimeout(() => {
            const committed = draft
                .filter((file) => !file.markedForRemoval)
                .map((file) => ({ ...file, status: "ready" as const, markedForRemoval: false }));
            onCommit(committed);
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
                        <DialogHeader className="border-b px-6 py-5 text-left" style={{ borderColor: LX.border }}>
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]" style={{ background: LX.blueT10 }}>
                                    <FolderOpen size={18} color={LX.secondary} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal" style={{ color: LX.primary }}>Extra Context Files</DialogTitle>
                                    <DialogDescription className="mt-1 luxia-type-metadata" style={{ color: LX.textMuted }}>Changes are local until saved.</DialogDescription>
                                </div>
                                <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" aria-label="Close extra context files" onClick={requestClose}>
                                    <X size={15} style={{ color: LX.textMuted }} />
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="border-b px-6 py-3" style={{ borderColor: LX.border }}>
                            <div className="flex items-center gap-2 rounded-[14px] border px-3 py-2" style={{ borderColor: LX.border, background: LX.subtle }}>
                                <Search size={14} style={{ color: LX.textMuted }} />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search extra context files…"
                                    className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0"
                                    aria-label="Search extra context files"
                                />
                                {search ? (
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full" aria-label="Clear search" onClick={() => setSearch("")}>
                                        <X size={12} style={{ color: LX.textMuted }} />
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    {search ? (
                                        <>
                                            <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>No files match your search.</p>
                                            <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Try another file name.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="luxia-type-title-component" style={{ color: LX.primary }}>No extra context files yet</p>
                                            <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Add files to provide additional context.</p>
                                            <Button type="button" className="mt-4 rounded-full px-4" onClick={() => setAddOpen(true)}>
                                                <Plus size={14} />Add files
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filtered.map((file) => (
                                        <ExtraContextFileRow
                                            key={file.id}
                                            file={file}
                                            onView={() => setPreviewId(file.id)}
                                            onRemove={() => setConfirmRemoveId(file.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            {filtered.length > 0 ? (
                                <Button type="button" variant="outline" className="mb-4 w-full rounded-full" onClick={() => setAddOpen(true)}>
                                    <Plus size={14} />Add files
                                </Button>
                            ) : null}
                            {saveError ? <p className="mb-3 luxia-type-metadata" style={{ color: LX.error }} role="alert">{saveError}</p> : null}
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
                                    {count} {count === 1 ? "item" : "items"}{dirty ? " · Unsaved changes" : ""}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="secondary" className="rounded-full px-4" onClick={requestClose}>Cancel</Button>
                                    <Button type="button" className="min-w-[132px] rounded-full px-4" disabled={!dirty || saving} onClick={save}>
                                        {saving ? "Saving…" : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AddExtraContextFilesDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                catalog={DATASOURCE_CATALOG}
                linkedFiles={draft}
                onAddUpload={addUpload}
                onAddDatasource={addDatasource}
            />

            <ExtraContextFilePreview file={previewFile} open={!!previewFile} onOpenChange={(next) => { if (!next) setPreviewId(null); }} />

            <RemoveExtraContextFileDialog
                open={!!removeFile}
                fileName={removeFile?.name ?? ""}
                onOpenChange={(next) => { if (!next) setConfirmRemoveId(null); }}
                onConfirm={() => confirmRemoveId && markRemove(confirmRemoveId)}
            />

            <DiscardExtraContextChangesDialog
                open={discardOpen}
                onOpenChange={setDiscardOpen}
                onDiscard={() => { setDiscardOpen(false); onCancel(); }}
            />
        </>
    );
}
