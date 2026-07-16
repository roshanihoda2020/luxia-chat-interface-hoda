export interface PDFFileRecord {
    id: string;
    name: string;
    sizeLabel: string;
    sizeBytes: number;
    source: "upload" | "catalog";
    catalogId?: string;
    previewable: boolean;
    markedForRemoval?: boolean;
}

export interface PDFCatalogFile {
    id: string;
    name: string;
    sizeLabel: string;
    sizeBytes: number;
    previewable: boolean;
}
