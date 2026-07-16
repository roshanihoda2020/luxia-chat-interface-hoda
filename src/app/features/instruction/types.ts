export interface InstructionAttachment {
    name: string;
    size: number;
    sizeLabel: string;
}

export interface InstructionData {
    text: string;
    attachment: InstructionAttachment | null;
}
