import { ChevronDown, Cpu, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { InstructionManager } from "./InstructionManager";
import { LX } from "./tokens";
import type { InstructionData } from "./types";
import { instructionSignature } from "./utils";

export function InstructionSection({
    defaultInstruction,
    isOpen,
    onToggle,
    onSignatureChange,
}: {
    defaultInstruction: string;
    isOpen: boolean;
    onToggle: () => void;
    onSignatureChange?: (signature: string) => void;
}) {
    const [data, setData] = useState<InstructionData>(() => ({
        text: defaultInstruction,
        attachment: null,
    }));
    const [managerOpen, setManagerOpen] = useState(false);

    useEffect(() => {
        setData({ text: defaultInstruction, attachment: null });
    }, [defaultInstruction]);

    useEffect(() => {
        onSignatureChange?.(instructionSignature(data));
    }, [data, onSignatureChange]);

    const preview = data.text.trim() || "No instruction yet.";

    return (
        <>
            <div className="overflow-visible rounded-[14px]" style={{ background: LX.surface, border: `1px solid ${LX.border}`, boxShadow: LX.shadow.xs }}>
                <div className="flex items-center gap-1.5 px-[14px] py-3">
                    <Cpu size={14} color={LX.secondary} className="flex-shrink-0" />
                    <span className="flex-1 truncate luxia-type-body-small-strong leading-5" style={{ color: LX.primary }}>Instruction</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors outline-none flex-shrink-0"
                                aria-label="Manage instruction"
                                onClick={(e) => { e.stopPropagation(); setManagerOpen(true); }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.state.secondary08; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <Maximize2 size={15} style={{ color: LX.textMuted }} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>Manage</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors outline-none flex-shrink-0"
                                aria-label={isOpen ? "Collapse instruction" : "Expand instruction"}
                                onClick={onToggle}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.state.secondary08; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <ChevronDown size={15} style={{ color: LX.textMuted, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>{isOpen ? "Collapse" : "Expand"}</TooltipContent>
                    </Tooltip>
                </div>

                {isOpen ? (
                    <div className="px-3 pb-3">
                        <p
                            className="line-clamp-3 luxia-type-caption leading-relaxed"
                            style={{ color: data.text.trim() ? LX.textSecondary : LX.textMuted }}
                        >
                            {preview}
                        </p>
                        {data.attachment ? (
                            <p className="mt-1.5 truncate luxia-type-caption" style={{ color: LX.textMuted }}>
                                {data.attachment.name}
                            </p>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <InstructionManager
                open={managerOpen}
                data={data}
                onCommit={(next) => setData(next)}
                onCancel={() => setManagerOpen(false)}
            />
        </>
    );
}
