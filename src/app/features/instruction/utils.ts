import type { InstructionData } from "./types";

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
