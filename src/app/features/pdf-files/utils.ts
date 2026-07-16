import type { PDFFileRecord } from "./types";

export const PDF_MAX_BYTES = 10 * 1024 * 1024;

export function clonePdfFiles(items: PDFFileRecord[]): PDFFileRecord[] {
    return items.map((item) => ({ ...item }));
}

export function pdfFilesSignature(items: PDFFileRecord[]): string {
    return JSON.stringify(items.map((item) => ({
        id: item.id,
        name: item.name,
        sizeBytes: item.sizeBytes,
        source: item.source,
        catalogId: item.catalogId ?? null,
        markedForRemoval: item.markedForRemoval ?? false,
    })));
}

export function activePdfCount(items: PDFFileRecord[]): number {
    return items.filter((item) => !item.markedForRemoval).length;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isPdfFile(name: string): boolean {
    return name.toLowerCase().endsWith(".pdf");
}
