import { useEffect, useMemo, useState } from "react";
import { CompactContextFileList } from "./CompactContextFileList";
import { ExtraContextFilePreview } from "./ExtraContextFilePreview";
import { ExtraContextFilesManager } from "./ExtraContextFilesManager";
import { RemoveExtraContextFileDialog } from "./RemoveExtraContextFileDialog";
import { INITIAL_CONTEXT_FILES } from "./data";
import type { ExtraContextFile } from "./types";
import { cloneFiles, filesSignature } from "./utils";

export function ExtraContextFilesSection({ isOpen, onToggle, onSignatureChange }: { isOpen: boolean; onToggle: () => void; onSignatureChange?: (signature: string) => void }) {
    const [files, setFiles] = useState<ExtraContextFile[]>(() => cloneFiles(INITIAL_CONTEXT_FILES));
    const [compactSearch, setCompactSearch] = useState("");
    const [managerOpen, setManagerOpen] = useState(false);
    const [previewFileId, setPreviewFileId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

    const visibleFiles = useMemo(() => files.filter((file) => !file.markedForRemoval), [files]);
    const previewFile = files.find((file) => file.id === previewFileId) ?? null;
    const confirmFile = files.find((file) => file.id === confirmRemoveId) ?? null;

    useEffect(() => {
        onSignatureChange?.(filesSignature(files));
    }, [files, onSignatureChange]);

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
                onRemove={(id) => setConfirmRemoveId(id)}
            />

            <ExtraContextFilesManager
                open={managerOpen}
                files={files}
                onCommit={(nextFiles) => setFiles(nextFiles)}
                onCancel={() => setManagerOpen(false)}
            />

            <ExtraContextFilePreview
                file={previewFile}
                open={!!previewFile}
                onOpenChange={(open) => { if (!open) setPreviewFileId(null); }}
            />

            <RemoveExtraContextFileDialog
                open={!!confirmFile}
                fileName={confirmFile?.name ?? ""}
                onOpenChange={(open) => { if (!open) setConfirmRemoveId(null); }}
                onConfirm={() => {
                    if (!confirmRemoveId) return;
                    setFiles((current) => current.filter((file) => file.id !== confirmRemoveId));
                    setConfirmRemoveId(null);
                }}
            />
        </>
    );
}
