import { FileText, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { LX } from "./tokens";
import type { ExtraContextFile } from "./types";
import { fileMetaLine } from "./utils";

export function ExtraContextFilePreview({
    file,
    open,
    onOpenChange,
}: {
    file: ExtraContextFile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!file) return null;

    const meta = fileMetaLine(file);
    const canPreview = file.previewable !== false && !file.name.endsWith(".docx") && !file.name.endsWith(".pptx");

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="right">
            <DrawerContent className="w-[min(96vw,520px)] max-w-none p-0">
                <div className="flex h-full flex-col" style={{ background: LX.surface }}>
                    <DrawerHeader className="border-b px-6 py-5 text-left" style={{ borderColor: LX.border }}>
                        <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <DrawerTitle className="truncate luxia-type-title-modal" style={{ color: LX.primary }}>{file.name}</DrawerTitle>
                                {meta ? <DrawerDescription className="mt-1 luxia-type-metadata" style={{ color: LX.textMuted }}>{meta}</DrawerDescription> : null}
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" aria-label="Close preview" onClick={() => onOpenChange(false)}>
                                        <X size={15} style={{ color: LX.textMuted }} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent sideOffset={6}>Close</TooltipContent>
                            </Tooltip>
                        </div>
                    </DrawerHeader>
                    <div className="flex-1 overflow-auto px-6 py-5">
                        {canPreview ? (
                            <div className="rounded-[14px] border p-4 luxia-type-body-dense" style={{ borderColor: LX.border, background: LX.subtle, color: LX.textSecondary }}>
                                <p className="font-bold" style={{ color: LX.primary }}>{file.name}</p>
                                <p className="mt-2">Preview content for this file would appear here when connected to your document store.</p>
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-[14px] border border-dashed px-6 py-10 text-center" style={{ borderColor: LX.border }}>
                                <FileText size={28} style={{ color: `${LX.textMuted}66` }} />
                                <h3 className="mt-3 luxia-type-title-panel" style={{ color: LX.primary }}>Preview unavailable</h3>
                                <p className="mt-2 max-w-[320px] luxia-type-body-dense" style={{ color: LX.textMuted }}>This file type cannot be previewed here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
