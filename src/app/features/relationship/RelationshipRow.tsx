import { GitBranch } from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import { RelationshipMenu } from "./RelationshipMenu";
import { LX } from "./tokens";
import type { RelationshipRecord } from "./types";
import { relationshipName, relationshipSummary } from "./utils";

export function RelationshipRow({
    item,
    onToggleActive,
    onView,
    onEdit,
    onRemove,
}: {
    item: RelationshipRecord;
    onToggleActive: (active: boolean) => void;
    onView: () => void;
    onEdit: () => void;
    onRemove: () => void;
}) {
    return (
        <div
            className="group/item flex items-center gap-2 rounded-[14px] border px-2.5 py-2"
            style={{ borderColor: LX.border, background: LX.subtle }}
            onClick={(event) => event.stopPropagation()}
        >
            <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: LX.surface, border: `1px solid ${LX.border}` }}
            >
                <GitBranch size={14} style={{ color: LX.secondary }} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold" style={{ color: LX.primary }}>
                    {relationshipName(item)}
                </p>
                <p className="truncate text-[11px]" style={{ color: LX.textMuted }}>
                    {relationshipSummary(item)}
                </p>
            </div>

            <div
                className="relative z-20 flex flex-shrink-0 items-center gap-1"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
            >
                <Switch
                    checked={item.active}
                    onCheckedChange={onToggleActive}
                    aria-label={`Toggle ${relationshipName(item)} active`}
                    className="data-[state=checked]:bg-[#30214E]"
                />
                <RelationshipMenu onView={onView} onEdit={onEdit} onRemove={onRemove} />
            </div>
        </div>
    );
}
