import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { LX } from "./tokens";
import type { CrawlerEntry } from "./types";

export function ViewCrawlerDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: CrawlerEntry | null }) {
    if (!item) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[min(92vw,480px)] rounded-[16px]">
                <DialogHeader><DialogTitle className="text-[16px] font-extrabold break-all">{item.url}</DialogTitle></DialogHeader>
                <div className="space-y-2">
                    <div className="rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.subtle }}>
                        <p className="text-[11px] font-semibold" style={{ color: LX.textMuted }}>Description</p>
                        <p className="mt-1 text-[13px] font-medium" style={{ color: LX.primary }}>{item.description || "—"}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.subtle }}>
                        <span className="text-[13px] font-semibold" style={{ color: LX.primary }}>Exact Search</span>
                        <span className="text-[13px] font-semibold" style={{ color: item.exactSearch ? LX.success : LX.textMuted }}>{item.exactSearch ? "On" : "Off"}</span>
                    </div>
                </div>
                <DialogFooter><Button type="button" className="rounded-full px-4" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
