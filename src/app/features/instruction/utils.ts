import type { InstructionData } from "./types";

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(name: string): string {
    const index = name.lastIndexOf(".");
    return index >= 0 ? name.slice(index).toLowerCase() : "";
}

export function isSupportedInstructionFile(name: string): boolean {
    const extension = getFileExtension(name);
    return [".pdf", ".docx", ".odt", ".txt", ".md"].includes(extension);
}

export function instructionSignature(data: InstructionData): string {
    return JSON.stringify({
        text: data.text,
        attachment: data.attachment
            ? { name: data.attachment.name, size: data.attachment.size }
            : null,
    });
}

export function formatCharacterCount(count: number): string {
    return `${count.toLocaleString()} / 25,000`;
}
