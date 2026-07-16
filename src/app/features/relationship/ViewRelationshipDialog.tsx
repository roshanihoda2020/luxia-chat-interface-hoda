import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { LX } from "./tokens";
import type { RelationshipRecord } from "./types";
import { relationshipName } from "./utils";

function MappingReadOnlySide({
    label,
    table,
    column,
}: {
    label: "From" | "To";
    table: string;
    column: string;
}) {
    return (
        <div className="min-w-0 rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.subtle }}>
            <p className="text-[11px] font-semibold" style={{ color: LX.textMuted }}>{label}</p>
            <p className="mt-1 truncate text-[13px] font-semibold" style={{ color: LX.primary }}>{table}</p>
            <p className="truncate text-[12px] font-medium" style={{ color: LX.textSecondary }}>{column}</p>
        </div>
    );
}

export function ViewRelationshipDialog({
    open,
    onOpenChange,
    item,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: RelationshipRecord | null;
}) {
    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[min(92vw,560px)] rounded-[16px]">
                <DialogHeader>
                    <DialogTitle className="text-[16px] font-extrabold">{relationshipName(item)}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <p className="text-[12px] font-medium" style={{ color: LX.textSecondary }}>
                        Type: <span className="font-semibold" style={{ color: LX.primary }}>{item.type}</span>
                    </p>

                    <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-3">
                        <MappingReadOnlySide label="From" table={item.fromTable} column={item.fromColumn} />

                        <div className="flex items-center justify-center py-1 md:pt-7">
                            <ArrowDown size={16} className="md:hidden" style={{ color: LX.textMuted }} aria-hidden />
                            <ArrowRight size={16} className="hidden md:block" style={{ color: LX.textMuted }} aria-hidden />
                        </div>

                        <MappingReadOnlySide label="To" table={item.toTable} column={item.toColumn} />
                    </div>

                    <div className="flex items-center justify-between rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.subtle }}>
                        <span className="text-[13px] font-semibold" style={{ color: LX.primary }}>Active</span>
                        <span className="text-[13px] font-semibold" style={{ color: item.active ? LX.success : LX.textMuted }}>
                            {item.active ? "On" : "Off"}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" className="rounded-full px-4" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
