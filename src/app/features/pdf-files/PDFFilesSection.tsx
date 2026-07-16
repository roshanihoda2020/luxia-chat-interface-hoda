import { useEffect, useMemo, useState } from "react";
import { CompactPDFList } from "./CompactPDFList";
import { INITIAL_PDF_FILES } from "./data";
import { PDFFilesManager } from "./PDFFilesManager";
import { PDFPreviewDialog } from "./PDFPreviewDialog";
import { RemovePDFDialog } from "./RemovePDFDialog";
import { fileToPdfRecord } from "./PDFUploadZone";
import type { PDFFileRecord } from "./types";
import { clonePdfFiles, pdfFilesSignature } from "./utils";

export function PDFFilesSection({
    isOpen,
    onToggle,
    onSignatureChange,
}: {
    isOpen: boolean;
    onToggle: () => void;
    onSignatureChange?: (signature: string) => void;
}) {
    const [files, setFiles] = useState<PDFFileRecord[]>(() => clonePdfFiles(INITIAL_PDF_FILES));
    const [compactSearch, setCompactSearch] = useState("");
    const [managerOpen, setManagerOpen] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

    const visibleFiles = useMemo(() => files.filter((f) => !f.markedForRemoval), [files]);
    const previewFile = files.find((f) => f.id === previewId) ?? null;

    useEffect(() => {
        onSignatureChange?.(pdfFilesSignature(files));
    }, [files, onSignatureChange]);

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
                onRemove={(id) => setConfirmRemoveId(id)}
                onUpload={(file) => setFiles((c) => [...c, fileToPdfRecord(file)])}
            />

            <PDFFilesManager open={managerOpen} files={files} onCommit={setFiles} onCancel={() => setManagerOpen(false)} />
            <PDFPreviewDialog open={!!previewFile} onOpenChange={(o) => { if (!o) setPreviewId(null); }} file={previewFile} />
            <RemovePDFDialog
                open={!!confirmRemoveId}
                onOpenChange={(o) => { if (!o) setConfirmRemoveId(null); }}
                onConfirm={() => {
                    if (!confirmRemoveId) return;
                    setFiles((c) => c.filter((f) => f.id !== confirmRemoveId));
                    setConfirmRemoveId(null);
                }}
            />
        </>
    );
}
