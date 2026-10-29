import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { REVIEW_SAMPLE_PDF_URL } from "@/app/features/document-review";
import { SAMPLE_PDF_PREVIEW_URL } from "./data";
import { LX } from "./tokens";
import type { PDFPreviewTarget } from "./types";

const PREVIEW_FRAME_STYLE: CSSProperties = {
    width: "100%",
    minHeight: 420,
    height: "min(60vh, 520px)",
    border: "none",
};

const LOADING_FALLBACK_MS = 1200;

/**
 * Radix DialogContent centers with CSS transform + zoom animation.
 * Chrome's built-in PDF viewer paints blank inside any transformed ancestor.
 * Keep dialog chrome, but position without transform for PDF iframe parity.
 */
const PDF_DIALOG_CONTENT_CLASS = cn(
    "max-w-[min(92vw,560px)] w-[min(92vw,560px)] rounded-[16px]",
    // Kill transform/zoom so Chrome's PDF plugin can paint inside the iframe.
    "!transform-none !translate-x-0 !translate-y-0 !overflow-visible",
    "!top-[8vh] !left-[max(1rem,calc(50%-min(46vw,280px)))]",
    "data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100",
    "data-[state=open]:!animate-none data-[state=closed]:!animate-none",
);

export function PDFPreviewDialog({
    open,
    onOpenChange,
    file,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: PDFPreviewTarget | null;
}) {
    const previewUrl = file?.previewUrl?.trim() || null;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open || !previewUrl) {
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
    }, [open, previewUrl, file?.name]);

    if (!file) return null;

    // Say what is actually shown: the matching sample, or the seeded placeholder.
    const contentNote = previewUrl === REVIEW_SAMPLE_PDF_URL
        ? "Sample content: the matching sample PDF."
        : previewUrl === SAMPLE_PDF_PREVIEW_URL
            ? "Demo data: a placeholder PDF, not this file’s content."
            : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={PDF_DIALOG_CONTENT_CLASS}>
                <DialogHeader>
                    <DialogTitle className="luxia-type-title-panel">{file.name}</DialogTitle>
                </DialogHeader>
                <div className="px-6 py-4">
                    {file.sizeLabel || contentNote ? (
                        <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>
                            {[file.sizeLabel, contentNote].filter(Boolean).join(" · ")}
                        </p>
                    ) : null}
                    {previewUrl ? (
                        <div
                            className="relative mt-3 w-full rounded-[12px] border"
                            style={{ borderColor: LX.border, background: LX.subtle, ...PREVIEW_FRAME_STYLE }}
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
                                className="block"
                                style={PREVIEW_FRAME_STYLE}
                                onLoad={() => setLoading(false)}
                            />
                        </div>
                    ) : (
                        <div
                            className="mt-3 flex min-h-[200px] items-center justify-center rounded-[12px] border px-4 py-8 text-center"
                            style={{ borderColor: LX.border, background: LX.subtle }}
                        >
                            <div>
                                <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>
                                    Preview unavailable
                                </p>
                                <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>
                                    {file.unavailableReason ?? "This file cannot be previewed here."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="primary" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
