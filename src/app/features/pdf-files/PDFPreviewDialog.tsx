import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { LX } from "./tokens";
import type { PDFFileRecord } from "./types";

export function PDFPreviewDialog({
    open,
    onOpenChange,
    file,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: PDFFileRecord | null;
}) {
    if (!file) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[min(92vw,560px)] rounded-[16px]">
                <DialogHeader>
                    <DialogTitle className="luxia-type-title-panel">{file.name}</DialogTitle>
                </DialogHeader>
                <div className="px-6 py-4">
                    <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>{file.sizeLabel}</p>
                    <div className="mt-3 flex min-h-[200px] items-center justify-center rounded-[12px] border px-4 py-8 text-center" style={{ borderColor: LX.border, background: LX.subtle }}>
                        {file.previewable ? (
                            <p className="luxia-type-body-dense-strong" style={{ color: LX.textSecondary }}>PDF preview will appear here.</p>
                        ) : (
                            <>
                                <div>
                                    <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>Preview unavailable</p>
                                    <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>This PDF cannot be previewed here.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="primary" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
