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
            <p className="luxia-type-caption" style={{ color: LX.textMuted }}>{label}</p>
            <p className="mt-1 truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{table}</p>
            <p className="truncate luxia-type-metadata" style={{ color: LX.textSecondary }}>{column}</p>
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
                    <DialogTitle className="luxia-type-title-panel">{relationshipName(item)}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 px-6 py-4">
                    <p className="luxia-type-metadata" style={{ color: LX.textSecondary }}>
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
                        <span className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Active</span>
                        <span className="luxia-type-body-dense-strong" style={{ color: item.active ? LX.success : LX.textMuted }}>
                            {item.active ? "On" : "Off"}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="primary" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
