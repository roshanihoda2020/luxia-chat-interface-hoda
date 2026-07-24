import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { LX } from "./tokens";
import { PDF_MAX_BYTES, formatFileSize, isPdfFile } from "./utils";

export function PDFUploadZone({
    onUpload,
    compact = false,
}: {
    onUpload: (file: File) => void;
    compact?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleFile(file: File | null) {
        if (!file) return;
        setError(null);
        if (!isPdfFile(file.name)) {
            setError("This file type is not supported.");
            return;
        }
        if (file.size > PDF_MAX_BYTES) {
            setError("File must be 10 MB or smaller.");
            return;
        }
        setUploading(true);
        window.setTimeout(() => {
            setUploading(false);
            onUpload(file);
        }, 700);
    }

    return (
        <div className="space-y-1.5">
            <div
                role="button"
                tabIndex={0}
                aria-label="Upload PDF files"
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed text-center transition-colors ${compact ? "px-2 py-2.5" : "px-4 py-5"}`}
                style={{ borderColor: dragOver ? LX.secondary : LX.border, background: dragOver ? LX.state.secondary04 : LX.subtle }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0] ?? null); }}
                onClick={() => !uploading && inputRef.current?.click()}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !uploading) { e.preventDefault(); inputRef.current?.click(); } }}
            >
                <Upload size={compact ? 12 : 16} style={{ color: dragOver ? LX.secondary : LX.textMuted }} />
                <p className={`font-semibold ${compact ? "luxia-type-caption" : "luxia-type-body-dense"}`} style={{ color: LX.primary }}>
                    {compact ? "Drop files or click to upload" : "Drop PDF files here or click to upload"}
                </p>
                {!compact ? <p className="luxia-type-caption" style={{ color: LX.textMuted }}>PDF only · Up to 10 MB</p> : null}
            </div>
            {uploading ? <p className="luxia-type-caption" style={{ color: LX.textMuted }}>Uploading…</p> : null}
            {error ? <p className="luxia-type-caption" role="alert" style={{ color: LX.error }}>{error}</p> : null}
            <input ref={inputRef} type="file" className="hidden" accept=".pdf,application/pdf" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        </div>
    );
}

export function fileToPdfRecord(file: File): import("./types").PDFFileRecord {
    return {
        id: `pdf-upload-${Date.now()}`,
        name: file.name,
        sizeLabel: formatFileSize(file.size),
        sizeBytes: file.size,
        source: "upload",
        previewable: true,
    };
}
