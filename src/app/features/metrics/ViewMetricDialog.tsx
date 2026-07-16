import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { LX } from "./tokens";
import type { MetricRecord } from "./types";

export function ViewMetricDialog({
    open,
    onOpenChange,
    item,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: MetricRecord | null;
}) {
    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[min(92vw,560px)] rounded-[16px]">
                <DialogHeader>
                    <DialogTitle className="text-[16px] font-extrabold">{item.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div>
                        <p className="text-[11px] font-semibold" style={{ color: LX.textMuted }}>Metric Description</p>
                        <p className="mt-1 text-[13px] font-medium leading-relaxed" style={{ color: LX.primary }}>{item.description}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold" style={{ color: LX.textMuted }}>SQL Expression</p>
                        <pre
                            className="mt-1 max-h-[240px] overflow-auto rounded-[12px] border px-3 py-2.5 font-mono text-[12px] leading-relaxed whitespace-pre-wrap"
                            style={{ borderColor: LX.border, background: LX.subtle, color: LX.primary }}
                        >
                            {item.sqlExpression}
                        </pre>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" className="rounded-full px-4" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
