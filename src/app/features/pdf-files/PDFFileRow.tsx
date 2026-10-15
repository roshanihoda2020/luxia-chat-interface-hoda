import { FileText } from "lucide-react";
import {
    FileLibraryDocumentTags,
    TableLibraryDocumentTags,
    sourceIdsForFileRecord,
    type DocumentTagDefinition,
} from "@/app/features/document-tags";
import { PDFFileMenu } from "./PDFFileMenu";
import { LX } from "./tokens";
import type { PDFFileRecord } from "./types";

export function PDFFileRow({
    item,
    onView,
    onRemove,
    fileTagSourceIds = [],
    onTagClick,
}: {
    item: PDFFileRecord;
    onView: () => void;
    onRemove?: () => void;
    fileTagSourceIds?: readonly string[];
    onTagClick?: (tag: DocumentTagDefinition) => void;
}) {
    const metadata = item.source === "upload" ? `PDF · ${item.sizeLabel}` : `PDF · ${item.sizeLabel}`;

    return (
        <div className="group/item flex items-center gap-2 rounded-[10px] px-2.5 py-2 transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)]" style={{ background: "transparent" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]" style={{ background: LX.subtle }}>
                <FileText size={14} style={{ color: LX.secondary }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{item.name}</p>
                <p className="truncate luxia-type-caption" style={{ color: LX.textMuted }}>{metadata}</p>
                <FileLibraryDocumentTags
                    fileName={item.name}
                    sourceIds={sourceIdsForFileRecord(item.catalogId, fileTagSourceIds)}
                    className="mt-1.5 block"
                    onTagClick={onTagClick}
                />
                <TableLibraryDocumentTags
                    tableId={item.id}
                    sourceIds={sourceIdsForFileRecord(item.catalogId, fileTagSourceIds)}
                    className="mt-1.5 block"
                />
            </div>
            <PDFFileMenu onView={onView} onRemove={onRemove} />
        </div>
    );
}
