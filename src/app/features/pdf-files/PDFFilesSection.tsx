import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
    DESTRUCTIVE_CONFIRM,
    DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { CompactPDFList } from "./CompactPDFList";
import { PDFFilesManager } from "./PDFFilesManager";
import { PDFPreviewDialog } from "./PDFPreviewDialog";
import { fileToPdfRecord } from "./PDFUploadZone";
import type { PDFFileRecord } from "./types";
import { clonePdfFiles } from "./utils";

/**
 * Chat capsule PDF Files — expandable summary + dialog shortcut.
 * Reads/writes the same Constellation `bundle.pdfFiles` as Settings.
 */
export function PDFFilesSection({
    files,
    onCommitFiles,
    isOpen,
    onToggle,
    readOnly = false,
    fileTagSourceIds = [],
}: {
    files: PDFFileRecord[];
    onCommitFiles: (next: PDFFileRecord[]) => void;
    isOpen: boolean;
    onToggle: () => void;
    readOnly?: boolean;
    /** Connected Data Source IDs for File Tag filter/chips in the manager. */
    fileTagSourceIds?: readonly string[];
}) {
    const [compactSearch, setCompactSearch] = useState("");
    const [managerOpen, setManagerOpen] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const removeTimerRef = useRef<number | null>(null);

    const visibleFiles = useMemo(() => files.filter((f) => !f.markedForRemoval), [files]);
    const previewFile = files.find((f) => f.id === previewId) ?? null;

    useEffect(() => {
        return () => {
            if (removeTimerRef.current !== null) {
                window.clearTimeout(removeTimerRef.current);
            }
        };
    }, []);

    function commit(next: PDFFileRecord[]) {
        if (readOnly) return;
        onCommitFiles(clonePdfFiles(next));
    }

    function handleUpload(file: File) {
        if (readOnly) return;
        try {
            commit([...files, fileToPdfRecord(file)]);
            luxiaToast.success("PDF file added");
        } catch {
            luxiaToast.error("Could not add the PDF file");
        }
    }

    function confirmRemove() {
        if (readOnly || !confirmRemoveId || removing) return;
        const removeId = confirmRemoveId;
        setRemoving(true);
        removeTimerRef.current = window.setTimeout(() => {
            removeTimerRef.current = null;
            try {
                commit(files.filter((f) => f.id !== removeId));
                if (previewId === removeId) setPreviewId(null);
                luxiaToast.success(DESTRUCTIVE_CONFIRM.pdf.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.pdf.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }

    return (
        <>
            <CompactPDFList
                files={visibleFiles}
                isOpen={isOpen}
                search={compactSearch}
                onSearchChange={setCompactSearch}
                onToggle={onToggle}
                onOpenManager={() => setManagerOpen(true)}
                onView={(id) => setPreviewId(id)}
                onRemove={readOnly ? undefined : (id) => setConfirmRemoveId(id)}
                onUpload={readOnly ? undefined : handleUpload}
                readOnly={readOnly}
            />

            <PDFFilesManager
                open={managerOpen}
                files={files}
                fileTagSourceIds={fileTagSourceIds}
                onCommit={(next) => {
                    if (readOnly) return;
                    onCommitFiles(next);
                }}
                onCancel={() => setManagerOpen(false)}
            />
            <PDFPreviewDialog
                open={Boolean(previewFile)}
                onOpenChange={(o) => {
                    if (!o) setPreviewId(null);
                }}
                file={previewFile}
            />

            <ConfirmDialog
                open={Boolean(confirmRemoveId)}
                onOpenChange={(next) => {
                    if (!next && !removing) setConfirmRemoveId(null);
                }}
                tone="destructive"
                title={DESTRUCTIVE_CONFIRM.pdf.title}
                description={DESTRUCTIVE_CONFIRM.pdf.description}
                cancelLabel="Cancel"
                confirmLabel={DESTRUCTIVE_CONFIRM.pdf.confirmLabel}
                busy={removing}
                busyLabel={DESTRUCTIVE_CONFIRM.pdf.busyLabel}
                onConfirm={confirmRemove}
            />
        </>
    );
}
