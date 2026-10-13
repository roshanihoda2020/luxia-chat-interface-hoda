import { FileText, SquareArrowOutUpRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { cn } from "@/app/components/ui/utils";
import { LX } from "./tokens";
import type { ExtraContextFile } from "./types";
import { fileMetaLine } from "./utils";

const LOADING_FALLBACK_MS = 1200;

function isOfficeFile(file: ExtraContextFile): boolean {
    const lower = file.name.toLowerCase();
    return (
        lower.endsWith(".docx")
        || lower.endsWith(".pptx")
        || file.fileType.toUpperCase() === "DOCX"
        || file.fileType.toUpperCase() === "PPTX"
    );
}

function isPdfFile(file: ExtraContextFile): boolean {
    const lower = file.name.toLowerCase();
    return lower.endsWith(".pdf") || file.fileType.toUpperCase() === "PDF";
}

export function ExtraContextFilePreview({
    file,
    open,
    onOpenChange,
}: {
    file: ExtraContextFile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const previewUrl = file?.previewUrl?.trim() || null;
    const canInlinePdf = Boolean(file && isPdfFile(file) && previewUrl);
    const showOpenInNewTab = Boolean(previewUrl && file && !canInlinePdf);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open || !canInlinePdf || !previewUrl) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const timeoutId = window.setTimeout(() => {
            setLoading(false);
        }, LOADING_FALLBACK_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [open, canInlinePdf, previewUrl, file?.id]);

    if (!file) return null;

    const meta = fileMetaLine(file);

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="right">
            <DrawerContent
                className={cn(
                    "w-[min(96vw,520px)] max-w-none p-0",
                    // Chrome PDF plugin paints blank inside CSS-transformed ancestors (Vaul slide).
                    canInlinePdf && "!transform-none",
                )}
            >
                <div className="flex h-full flex-col" style={{ background: LX.surface }}>
                    <DrawerHeader className="border-b px-6 py-5 text-left" style={{ borderColor: LX.border }}>
                        <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <DrawerTitle className="truncate luxia-type-title-modal" style={{ color: LX.primary }}>{file.name}</DrawerTitle>
                                {meta ? <DrawerDescription className="mt-1 luxia-type-metadata" style={{ color: LX.textMuted }}>{meta}</DrawerDescription> : null}
                            </div>
                            <Button type="button" variant="outline" size="icon" className="h-9 w-9 " aria-label="Close preview" onClick={() => onOpenChange(false)}>
                                <X size={15} style={{ color: LX.textMuted }} />
                            </Button>
                        </div>
                    </DrawerHeader>
                    <div className="flex min-h-0 flex-1 flex-col overflow-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                        {canInlinePdf && previewUrl ? (
                            <div
                                className="relative min-h-0 w-full flex-1 rounded-[14px] border"
                                style={{ borderColor: LX.border, background: LX.subtle, minHeight: 420 }}
                            >
                                {loading ? (
                                    <div
                                        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-4 text-center"
                                        style={{ background: LX.subtle }}
                                        aria-live="polite"
                                    >
                                        <p className="luxia-type-body-dense-strong" style={{ color: LX.textSecondary }}>
                                            Loading preview...
                                        </p>
                                    </div>
                                ) : null}
                                <iframe
                                    title={`Preview of ${file.name}`}
                                    src={previewUrl}
                                    className="block h-full w-full border-0"
                                    style={{ minHeight: 420 }}
                                    onLoad={() => setLoading(false)}
                                />
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-[14px] border border-dashed px-6 py-10 text-center" style={{ borderColor: LX.border }}>
                                <FileText size={28} style={{ color: `${LX.textMuted}66` }} />
                                <h3 className="mt-3 luxia-type-title-panel" style={{ color: LX.primary }}>Preview unavailable</h3>
                                <p className="mt-2 max-w-[320px] luxia-type-body-dense" style={{ color: LX.textMuted }}>
                                    {isOfficeFile(file)
                                        ? "This file type cannot be previewed here."
                                        : "This file cannot be previewed here."}
                                </p>
                                {showOpenInNewTab && previewUrl ? (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="mt-4"
                                        onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
                                    >
                                        <SquareArrowOutUpRight size={14} />
                                        Open in new tab
                                    </Button>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
