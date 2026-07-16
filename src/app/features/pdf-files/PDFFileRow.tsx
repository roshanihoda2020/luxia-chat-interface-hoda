import { FileText } from "lucide-react";
import { PDFFileMenu } from "./PDFFileMenu";
import { LX } from "./tokens";
import type { PDFFileRecord } from "./types";

export function PDFFileRow({
    item,
    onView,
    onRemove,
}: {
    item: PDFFileRecord;
    onView: () => void;
    onRemove: () => void;
}) {
    const metadata = item.source === "upload" ? `PDF · ${item.sizeLabel}` : `PDF · ${item.sizeLabel}`;

    return (
        <div className="group/item flex items-center gap-2 rounded-[14px] border px-2.5 py-2" style={{ borderColor: LX.border, background: LX.subtle }} onClick={(e) => e.stopPropagation()}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]" style={{ background: LX.surface, border: `1px solid ${LX.border}` }}>
                <FileText size={14} style={{ color: LX.secondary }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold" style={{ color: LX.primary }}>{item.name}</p>
                <p className="truncate text-[11px]" style={{ color: LX.textMuted }}>{metadata}</p>
            </div>
            <PDFFileMenu onView={onView} onRemove={onRemove} />
        </div>
    );
}
