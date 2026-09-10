import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { LX } from "./tokens";
import type { ExtraContextFile } from "./types";
import { formatFileSize, inferFileType, isSupportedUpload } from "./utils";

export function UploadExtraContextFilePanel({
    onAdd,
    onCancel,
}: {
    onAdd: (file: ExtraContextFile) => void;
    onCancel: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function pickFile(file: File | null) {
        setError(null);
        if (!file) {
            setSelectedFile(null);
            return;
        }
        if (!isSupportedUpload(file.name)) {
            setSelectedFile(null);
            setError("This file type is not supported.");
            return;
        }
        setSelectedFile(file);
    }

    function handleUpload() {
        if (!selectedFile || uploading) return;
        setUploading(true);
        setError(null);
        window.setTimeout(() => {
            onAdd({
                id: `upload-${Date.now()}`,
                name: selectedFile.name,
                fileType: inferFileType(selectedFile.name),
                sizeLabel: formatFileSize(selectedFile.size),
                source: "upload",
                status: "new",
                previewable: [".pdf", ".md", ".txt"].includes(selectedFile.name.slice(selectedFile.name.lastIndexOf(".")).toLowerCase()),
            });
            setUploading(false);
            setSelectedFile(null);
        }, 900);
    }

    return (
        <div className="flex flex-col gap-4">
            <div
                role="button"
                tabIndex={0}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed px-4 py-8 text-center transition-colors"
                style={{
                    borderColor: dragOver ? LX.secondary : LX.border,
                    background: dragOver ? LX.state.secondary04 : LX.subtle,
                }}
                onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    pickFile(event.dataTransfer.files?.[0] ?? null);
                }}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        inputRef.current?.click();
                    }
                }}
            >
                <Upload size={18} style={{ color: dragOver ? LX.secondary : LX.textMuted }} />
                <p className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Drag files here or click to upload</p>
                <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>PDF, DOCX, PPTX, MD, or TXT</p>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.pptx,.md,.txt"
                    onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
                />
            </div>

            {selectedFile ? (
                <div className="flex items-center gap-2 rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.surface }}>
                    <div className="min-w-0 flex-1">
                        <p className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{selectedFile.name}</p>
                        <p className="luxia-type-caption" style={{ color: LX.textMuted }}>{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 " aria-label="Remove selected file" onClick={() => pickFile(null)}>
                        <X size={14} style={{ color: LX.textMuted }} />
                    </Button>
                </div>
            ) : null}

            {error ? <p className="luxia-type-metadata" style={{ color: LX.error }} role="alert">{error}</p> : null}
            {uploading ? <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>Uploading…</p> : null}

            <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" className="px-4" onClick={onCancel}>Cancel</Button>
                <Button type="button" className="px-4" disabled={!selectedFile || uploading || !!error} onClick={handleUpload}>
                    Add File
                </Button>
            </div>
        </div>
    );
}
