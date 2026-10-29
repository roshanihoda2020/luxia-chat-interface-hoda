export interface PDFFileRecord {
    id: string;
    name: string;
    sizeLabel: string;
    sizeBytes: number;
    source: "upload" | "catalog";
    catalogId?: string;
    /**
     * Stable document reference (`dataSourceId + localDocumentId`) when the file
     * comes from a Data Source document. Missing on legacy and library records.
     */
    dataSourceId?: string;
    localDocumentId?: string;
    previewable: boolean;
    /** Local/static prototype URL for iframe preview. Null/undefined = unavailable. */
    previewUrl?: string | null;
    markedForRemoval?: boolean;
}

export interface PDFCatalogFile {
    id: string;
    name: string;
    sizeLabel: string;
    sizeBytes: number;
    previewable: boolean;
    previewUrl?: string | null;
}

/** Minimal shape accepted by PDFPreviewDialog (Constellation + Data Source reuse). */
export interface PDFPreviewTarget {
    name: string;
    sizeLabel?: string;
    previewUrl?: string | null;
    /** Why no preview is available, when the reason is known. */
    unavailableReason?: string;
}
