import { Eye, FileText, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { LX } from "./tokens";
import type { ExtraContextFile } from "./types";
import { fileMetaLine } from "./utils";

export function ExtraContextFileRow({
    file,
    onView,
    onRemove,
}: {
    file: ExtraContextFile;
    onView: () => void;
    onRemove?: () => void;
}) {
    const meta = fileMetaLine(file);
    const isUploading = file.status === "uploading";
    const isFailed = file.status === "upload-failed";
    const isNew = file.status === "new";
    const isMarked = file.markedForRemoval;

    return (
        <div
            className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-offset-2"
            style={{
                border: isFailed || isNew ? `1px solid ${isFailed ? LX.error : LX.secondary}` : "1px solid transparent",
                background: isMarked ? LX.state.error06 : isNew ? LX.state.secondary04 : "transparent",
                opacity: isMarked ? 0.72 : isUploading ? 0.85 : 1,
            }}
        >
            <FileText size={14} color={LX.secondary} className="flex-shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
                <p className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary, textDecoration: isMarked ? "line-through" : "none" }}>
                    {file.name}
                </p>
                {meta ? <p className="mt-0.5 truncate luxia-type-caption" style={{ color: LX.textMuted }}>{meta}</p> : null}
                {isUploading ? <p className="mt-0.5 luxia-type-caption" style={{ color: LX.textMuted }}>Uploading…</p> : null}
                {isFailed ? <p className="mt-0.5 luxia-type-caption" style={{ color: LX.error }}>Upload failed. Try again.</p> : null}
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 " aria-label="View file" onClick={onView} disabled={isUploading}>
                            <Eye size={14} style={{ color: LX.textMuted }} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>View file</TooltipContent>
                </Tooltip>
                {onRemove ? (
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 " aria-label="Remove file" onClick={onRemove} disabled={isUploading || isMarked}>
                        <Trash2 size={14} style={{ color: LX.error }} />
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
