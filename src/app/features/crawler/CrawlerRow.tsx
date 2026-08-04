import { Globe } from "lucide-react";
import { CrawlerMenu } from "./CrawlerMenu";
import { LX } from "./tokens";
import type { CrawlerEntry } from "./types";

export function CrawlerRow({
    item,
    onView,
    onEdit,
    onRemove,
}: {
    item: CrawlerEntry;
    onView: () => void;
    onEdit: () => void;
    onRemove: () => void;
}) {
    return (
        <div className="group/item flex items-center gap-2 rounded-[10px] px-2.5 py-2 transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)]" style={{ background: "transparent" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]" style={{ background: LX.subtle }}>
                <Globe size={14} style={{ color: LX.secondary }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{item.url}</p>
                {item.description ? <p className="truncate luxia-type-caption" style={{ color: LX.textMuted }}>{item.description}</p> : null}
                {item.exactSearch ? <p className="truncate luxia-type-caption" style={{ color: LX.textMuted }}>Exact search on</p> : null}
            </div>
            <CrawlerMenu onView={onView} onEdit={onEdit} onRemove={onRemove} />
        </div>
    );
}
