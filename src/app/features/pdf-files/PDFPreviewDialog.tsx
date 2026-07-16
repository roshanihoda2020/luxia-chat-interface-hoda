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
                    <DialogTitle className="text-[16px] font-extrabold">{file.name}</DialogTitle>
                </DialogHeader>
                <p className="text-[12px]" style={{ color: LX.textMuted }}>{file.sizeLabel}</p>
                <div className="mt-3 flex min-h-[200px] items-center justify-center rounded-[12px] border px-4 py-8 text-center" style={{ borderColor: LX.border, background: LX.subtle }}>
                    {file.previewable ? (
                        <p className="text-[13px] font-medium" style={{ color: LX.textSecondary }}>PDF preview placeholder</p>
                    ) : (
                        <>
                            <div>
                                <p className="text-[14px] font-semibold" style={{ color: LX.primary }}>Preview unavailable</p>
                                <p className="mt-1 text-[13px]" style={{ color: LX.textMuted }}>This PDF cannot be previewed here.</p>
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" className="rounded-full px-4" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
