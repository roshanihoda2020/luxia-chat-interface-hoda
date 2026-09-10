import { BarChart3 } from "lucide-react";
import { MetricMenu } from "./MetricMenu";
import { LX } from "./tokens";
import type { MetricRecord } from "./types";

export function MetricRow({
    item,
    onView,
    onEdit,
    onRemove,
}: {
    item: MetricRecord;
    onView: () => void;
    onEdit: () => void;
    onRemove: () => void;
}) {
    return (
        <div
            className="group/item flex items-center gap-2 rounded-[10px] px-2.5 py-2 transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)]"
            style={{ background: "transparent" }}
            onClick={(event) => event.stopPropagation()}
        >
            <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: LX.subtle }}
            >
                <BarChart3 size={14} style={{ color: LX.secondary }} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{item.name}</p>
                {item.description ? (
                    <p className="truncate luxia-type-caption" style={{ color: LX.textMuted }}>{item.description}</p>
                ) : null}
            </div>

            <div
                className="relative z-20 flex flex-shrink-0 items-center"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
            >
                <MetricMenu onView={onView} onEdit={onEdit} onRemove={onRemove} />
            </div>
        </div>
    );
}
