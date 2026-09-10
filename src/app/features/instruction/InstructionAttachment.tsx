import { FileText, RefreshCw, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { INSTRUCTION_ACCEPT, INSTRUCTION_MAX_FILE_BYTES } from "./constants";
import { LX } from "./tokens";
import type { InstructionAttachment } from "./types";
import { formatFileSize, isSupportedInstructionFile } from "./utils";

export function InstructionAttachment({
    attachment,
    onAttach,
    onRemove,
}: {
    attachment: InstructionAttachment | null;
    onAttach: (attachment: InstructionAttachment) => void;
    onRemove: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function validateAndUpload(file: File) {
        setError(null);
        if (!isSupportedInstructionFile(file.name)) {
            setError("This file type is not supported.");
            return;
        }
        if (file.size > INSTRUCTION_MAX_FILE_BYTES) {
            setError("File must be 10 MB or smaller.");
            return;
        }

        setUploading(true);
        window.setTimeout(() => {
            setUploading(false);
            onAttach({
                name: file.name,
                size: file.size,
                sizeLabel: formatFileSize(file.size),
            });
        }, 700);
    }

    function handleFile(file: File | null) {
        if (!file) return;
        validateAndUpload(file);
    }

    if (attachment) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.subtle }}>
                    <FileText size={14} style={{ color: LX.secondary }} className="flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{attachment.name}</p>
                        <p className="luxia-type-caption" style={{ color: LX.textMuted }}>{attachment.sizeLabel}</p>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 " aria-label="Replace attached file" onClick={() => inputRef.current?.click()}>
                                <RefreshCw size={14} style={{ color: LX.textMuted }} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>Replace</TooltipContent>
                    </Tooltip>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 " aria-label="Remove attached file" onClick={onRemove}>
                                <X size={14} style={{ color: LX.textMuted }} />
                            </Button>
                </div>
                {uploading ? <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>Uploading…</p> : null}
                {error ? <p className="luxia-type-metadata" role="alert" style={{ color: LX.error }}>{error}</p> : null}
                <input ref={inputRef} type="file" className="hidden" accept={INSTRUCTION_ACCEPT} onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                role="button"
                tabIndex={0}
                aria-label="Attach instruction file"
                className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed px-4 py-5 text-center transition-colors"
                style={{
                    borderColor: dragOver ? LX.secondary : LX.border,
                    background: dragOver ? LX.state.secondary04 : LX.subtle,
                }}
                onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    handleFile(event.dataTransfer.files?.[0] ?? null);
                }}
                onClick={() => !uploading && inputRef.current?.click()}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (!uploading) inputRef.current?.click();
                    }
                }}
            >
                <Upload size={16} style={{ color: dragOver ? LX.secondary : LX.textMuted }} />
                <p className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Drop a file here, or click to attach</p>
                <p className="luxia-type-caption" style={{ color: LX.textMuted }}>Up to 10 MB · PDF, DOCX, ODT, TXT, or MD</p>
            </div>
            {uploading ? <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>Uploading…</p> : null}
            {error ? <p className="luxia-type-metadata" role="alert" style={{ color: LX.error }}>{error}</p> : null}
            <input ref={inputRef} type="file" className="hidden" accept={INSTRUCTION_ACCEPT} onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
        </div>
    );
}
