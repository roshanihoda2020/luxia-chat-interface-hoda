import { FolderOpen, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { BusyButton } from "@/app/features/shared/Loading";
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
    presentation = "dialog",
    closeRef,
    dirtyRef,
    hideChrome,
    readOnly = false,
}: {
    open: boolean;
    files: ExtraContextFile[];
    onCommit: (nextFiles: ExtraContextFile[]) => void;
    onCancel: () => void;
    presentation?: "dialog" | "page";
    closeRef?: MutableRefObject<(() => void) | null>;
    dirtyRef?: MutableRefObject<boolean>;
    hideChrome?: boolean;
    /** When true, View/Preview stays available; mutations are blocked. */
    readOnly?: boolean;
}) {
    const isPage = presentation === "page";
    const effectiveOpen = isPage ? true : open;
    const showHeaderChrome = !hideChrome && !isPage;
    const [draft, setDraft] = useState<ExtraContextFile[]>(() => cloneFiles(files));
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [discardIntent, setDiscardIntent] = useState<"leave" | "reset">("leave");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef(cloneFiles(files));
    const removeTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!effectiveOpen) return;
        const snapshot = cloneFiles(files);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setSearch("");
        setAddOpen(false);
        setPreviewId(null);
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

    const dirty = !readOnly && filesSignature(draft) !== filesSignature(initialRef.current);
    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return draft;
        return draft.filter((file) => [file.name, file.fileType, file.source === "datasource" ? "datasource file" : ""].join(" ").toLowerCase().includes(lowered));
    }, [draft, search]);

    const previewFile = draft.find((file) => file.id === previewId) ?? null;
    const removeFile = draft.find((file) => file.id === confirmRemoveId) ?? null;
    const count = activeFileCount(draft);

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
                setDraft((current) =>
                    current.map((file) =>
                        file.id === removeId ? { ...file, markedForRemoval: true } : file,
                    ),
                );
                luxiaToast.success(DESTRUCTIVE_CONFIRM.extraContext.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.extraContext.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }

    function addUpload(file: ExtraContextFile) {
        if (readOnly) return;
        setDraft((current) => [...current, file]);
    }

    function addDatasource(items: DatasourceCatalogFile[]) {
        if (readOnly) return;
        const next = items.map((item) => ({
            id: `ds-${item.id}-${Date.now()}`,
            name: item.name,
            fileType: item.fileType,
            sizeLabel: item.sizeLabel,
            source: "datasource" as const,
            status: "new" as const,
            previewable: item.previewable,
            previewUrl: item.previewUrl ?? null,
        }));
        setDraft((current) => [...current, ...next]);
    }

    function save() {
        if (readOnly || !dirty || saving) return;
        setSaving(true);
        setSaveError(null);
        window.setTimeout(() => {
            const committed = draft
                .filter((file) => !file.markedForRemoval)
                .map((file) => ({ ...file, status: "ready" as const, markedForRemoval: false }));
            onCommit(committed);
            initialRef.current = cloneFiles(committed);
            setDraft(cloneFiles(committed));
            setSaving(false);
            luxiaToast.success("Extra context files saved");
            if (!isPage) onCancel();
        }, 500);
    }

    if (!effectiveOpen) return null;

    const shell = (
                    <div className={isPage ? "flex min-h-0 flex-1 flex-col" : "flex max-h-[88vh] flex-col"}>
                        {showHeaderChrome ? (
                        <DialogHeader>
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]" style={{ background: LX.blueT10 }}>
                                    <FolderOpen size={18} color={LX.secondary} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal">Extra Context Files</DialogTitle>
                                    <DialogDescription className="mt-1.5 luxia-type-metadata">
                                        {readOnly ? "View only. Changes cannot be saved for your Project role." : "Changes are local until saved."}
                                    </DialogDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-9 w-9", LUXIA_DIALOG_CLOSE_ON_DARK_CLASS)}
                                    aria-label="Close extra context files"
                                    onClick={requestLeave}
                                >
                                    <X size={15} />
                                </Button>
                            </div>
                        </DialogHeader>
                        ) : null}

                        <div className="border-b px-6 py-3.5" style={{ borderColor: LX.border }}>
                            <div className="flex flex-wrap items-center gap-2">
                            <SearchField
                                density="dense"
                                value={search}
                                onChange={setSearch}
                                placeholder="Search extra context files…"
                                aria-label="Search extra context files"
                            />
                            {!readOnly ? (
                                <Button type="button" variant="primary" size="compact" onClick={() => setAddOpen(true)}>
                                    <Plus size={14} />Add Extra Context File
                                </Button>
                            ) : null}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                            {filtered.length === 0 ? (
                                search ? (
                                    <ListNoResultsState
                                        title="No files match your search."
                                        description="Try another file name."
                                        className="border-0 bg-transparent px-2 py-10"
                                    />
                                ) : (
                                    <ListEmptyState
                                        title="No extra context files yet"
                                        description={readOnly ? "No extra context files are connected yet." : "Add files to provide additional context."}
                                        className="border-0 bg-transparent px-2 py-10"
                                        action={
                                            !readOnly ? (
                                                <Button type="button" className="px-4" onClick={() => setAddOpen(true)}>
                                                    <Plus size={14} />Add files
                                                </Button>
                                            ) : undefined
                                        }
                                    />
                                )
                            ) : (
                                <div className="space-y-2">
                                    {filtered.map((file) => (
                                        <ExtraContextFileRow
                                            key={file.id}
                                            file={file}
                                            onView={() => setPreviewId(file.id)}
                                            onRemove={readOnly ? undefined : () => setConfirmRemoveId(file.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            {saveError ? <p className="mb-3 luxia-type-metadata" style={{ color: LX.error }} role="alert">{saveError}</p> : null}
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
                                    {count} {count === 1 ? "item" : "items"}{dirty ? " · Unsaved changes" : ""}
                                </span>
                                {!readOnly ? (
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="secondary" className="px-4" onClick={requestCancelEdits} disabled={isPage && !dirty}>Cancel</Button>
                                        <BusyButton
                                            type="button"
                                            variant="primary"
                                            className="min-w-[132px] px-4 !bg-[var(--luxia-purple-70)] !bg-none disabled:!opacity-[0.45]"
                                            disabled={!dirty}
                                            busy={saving}
                                            busyLabel="Saving…"
                                            busyText="Saving…"
                                            onClick={save}
                                        >
                                            Save Changes
                                        </BusyButton>
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
                <AddExtraContextFilesDialog
                    open={addOpen}
                    onOpenChange={setAddOpen}
                    catalog={DATASOURCE_CATALOG}
                    linkedFiles={draft}
                    onAddUpload={addUpload}
                    onAddDatasource={addDatasource}
                />
            ) : null}

            <ExtraContextFilePreview file={previewFile} open={!!previewFile} onOpenChange={(next) => { if (!next) setPreviewId(null); }} />

            {!readOnly ? (
                <RemoveExtraContextFileDialog
                    open={!!removeFile}
                    fileName={removeFile?.name ?? ""}
                    onOpenChange={(next) => { if (!next && !removing) setConfirmRemoveId(null); }}
                    onConfirm={confirmMarkRemove}
                    busy={removing}
                    chrome={isPage ? "standard" : "compact"}
                />
            ) : null}

            {!readOnly ? (
                <DiscardExtraContextChangesDialog
                    open={discardOpen}
                    onOpenChange={setDiscardOpen}
                    onDiscard={() => {
                        setDiscardOpen(false);
                        if (discardIntent === "reset") {
                            setDraft(cloneFiles(initialRef.current));
                            return;
                        }
                        onCancel();
                    }}
                />
            ) : null}
        </>
    );
}
