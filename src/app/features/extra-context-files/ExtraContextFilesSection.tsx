import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
    DESTRUCTIVE_CONFIRM,
    DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { CompactContextFileList } from "./CompactContextFileList";
import { ExtraContextFilePreview } from "./ExtraContextFilePreview";
import { ExtraContextFilesManager } from "./ExtraContextFilesManager";
import type { ExtraContextFile } from "./types";
import { cloneFiles } from "./utils";

/**
 * Chat capsule Extra Context Files — expandable summary + dialog shortcut.
 * Reads/writes the same Constellation `bundle.contextFiles` as Settings.
 */
export function ExtraContextFilesSection({
    files,
    onCommitFiles,
    isOpen,
    onToggle,
    readOnly = false,
}: {
    files: ExtraContextFile[];
    onCommitFiles: (next: ExtraContextFile[]) => void;
    isOpen: boolean;
    onToggle: () => void;
    readOnly?: boolean;
}) {
    const [compactSearch, setCompactSearch] = useState("");
    const [managerOpen, setManagerOpen] = useState(false);
    const [previewFileId, setPreviewFileId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const removeTimerRef = useRef<number | null>(null);

    const visibleFiles = useMemo(() => files.filter((file) => !file.markedForRemoval), [files]);
    const previewFile = files.find((file) => file.id === previewFileId) ?? null;

    useEffect(() => {
        return () => {
            if (removeTimerRef.current !== null) {
                window.clearTimeout(removeTimerRef.current);
            }
        };
    }, []);

    function commit(next: ExtraContextFile[]) {
        if (readOnly) return;
        onCommitFiles(cloneFiles(next));
    }

    function confirmRemove() {
        if (readOnly || !confirmRemoveId || removing) return;
        const removeId = confirmRemoveId;
        setRemoving(true);
        removeTimerRef.current = window.setTimeout(() => {
            removeTimerRef.current = null;
            try {
                commit(files.filter((file) => file.id !== removeId));
                if (previewFileId === removeId) setPreviewFileId(null);
                luxiaToast.success(DESTRUCTIVE_CONFIRM.extraContext.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.extraContext.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }

    return (
        <>
            <CompactContextFileList
                files={visibleFiles}
                isOpen={isOpen}
                search={compactSearch}
                onSearchChange={setCompactSearch}
                onToggle={onToggle}
                onOpenManager={() => setManagerOpen(true)}
                onView={(id) => setPreviewFileId(id)}
                onRemove={readOnly ? undefined : (id) => setConfirmRemoveId(id)}
                readOnly={readOnly}
            />

            <ExtraContextFilesManager
                open={managerOpen}
                files={files}
                onCommit={(next) => {
                    if (readOnly) return;
                    onCommitFiles(next);
                }}
                onCancel={() => setManagerOpen(false)}
            />

            <ExtraContextFilePreview
                file={previewFile}
                open={Boolean(previewFile)}
                onOpenChange={(open) => {
                    if (!open) setPreviewFileId(null);
                }}
            />

            <ConfirmDialog
                open={Boolean(confirmRemoveId)}
                onOpenChange={(next) => {
                    if (!next && !removing) setConfirmRemoveId(null);
                }}
                tone="destructive"
                title={DESTRUCTIVE_CONFIRM.extraContext.title}
                description={DESTRUCTIVE_CONFIRM.extraContext.description}
                cancelLabel="Cancel"
                confirmLabel={DESTRUCTIVE_CONFIRM.extraContext.confirmLabel}
                busy={removing}
                busyLabel={DESTRUCTIVE_CONFIRM.extraContext.busyLabel}
                onConfirm={confirmRemove}
            />
        </>
    );
}
