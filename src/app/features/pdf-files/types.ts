export interface PDFFileRecord {
    id: string;
    name: string;
    sizeLabel: string;
    sizeBytes: number;
    source: "upload" | "catalog";
    catalogId?: string;
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
}
