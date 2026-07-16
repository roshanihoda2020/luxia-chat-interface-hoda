import { ACCEPTED_UPLOAD_EXTENSIONS } from "./data";
import type { ExtraContextFile } from "./types";

export function cloneFiles(files: ExtraContextFile[]): ExtraContextFile[] {
    return files.map((file) => ({ ...file }));
}

export function filesSignature(files: ExtraContextFile[]): string {
    return JSON.stringify(files.map((file) => ({
        id: file.id,
        name: file.name,
        fileType: file.fileType,
        sizeLabel: file.sizeLabel,
        source: file.source,
        status: file.status,
        markedForRemoval: file.markedForRemoval ?? false,
        previewable: file.previewable ?? false,
    })));
}

export function fileExtension(name: string): string {
    const index = name.lastIndexOf(".");
    return index >= 0 ? name.slice(index).toLowerCase() : "";
}

export function inferFileType(name: string): string {
    const ext = fileExtension(name).replace(".", "").toUpperCase();
    return ext || "FILE";
}

export function isSupportedUpload(name: string): boolean {
    const ext = fileExtension(name);
    return ACCEPTED_UPLOAD_EXTENSIONS.includes(ext);
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function fileMetaLine(file: ExtraContextFile): string | null {
    if (file.source === "datasource") return "Datasource file";
    if (file.sizeLabel && file.fileType) return `${file.fileType} · ${file.sizeLabel}`;
    if (file.fileType) return file.fileType;
    return null;
}

export function activeFileCount(files: ExtraContextFile[]): number {
    return files.filter((file) => !file.markedForRemoval).length;
}
