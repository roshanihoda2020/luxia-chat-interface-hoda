import { ChevronDown, Cpu, SquareArrowOutUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { IC, IC_BTN_ICON, IC_BTN_OPEN, IC_CARD_HEADER, icCardStyle, icHoverOff, icHoverOn, icInputBorderHoverOff, icInputBorderHoverOn, icOpenActiveOn, icTextareaStyle } from "@/app/features/active-data-tables/inspectorTheme";
import { INSTRUCTION_MAX_CHARS } from "./constants";
import { InstructionManager } from "./InstructionManager";
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
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        setData({ text: defaultInstruction, attachment: null });
        setFocused(false);
    }, [defaultInstruction]);

    useEffect(() => {
        onSignatureChange?.(instructionSignature(data));
    }, [data, onSignatureChange]);

    useEffect(() => {
        if (!isOpen) setFocused(false);
    }, [isOpen]);

    function handleTextChange(value: string) {
        if (value.length > INSTRUCTION_MAX_CHARS) return;
        setData((current) => ({ ...current, text: value }));
    }

    return (
        <>
            <div style={icCardStyle(isOpen)}>
                <div className={IC_CARD_HEADER}>
                    <Cpu size={14} color={IC.iconSemantic} className="flex-shrink-0" />
                    <span className="flex-1 truncate luxia-type-title-component" style={{ color: IC.iconSemantic }}>Instruction</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={IC_BTN_OPEN}
                                aria-label="Open full editor"
                                onClick={(e) => { e.stopPropagation(); setManagerOpen(true); }}
                                onMouseEnter={icHoverOn}
                                onMouseLeave={icHoverOff}
                                onMouseDown={icOpenActiveOn}
                                onMouseUp={icHoverOn}
                            >
                                <SquareArrowOutUpRight size={14} strokeWidth={2} style={{ color: IC.textMuted }} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>Open full editor</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={IC_BTN_ICON}
                                aria-label={isOpen ? "Collapse instruction" : "Expand instruction"}
                                onClick={onToggle}
                                onMouseEnter={icHoverOn}
                                onMouseLeave={icHoverOff}
                            >
                                <ChevronDown
                                    size={15}
                                    style={{
                                        color: IC.textMuted,
                                        transform: isOpen ? "rotate(180deg)" : "none",
                                        transition: "transform 160ms ease",
                                    }}
                                />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>{isOpen ? "Collapse" : "Expand"}</TooltipContent>
                    </Tooltip>
                </div>

                {isOpen ? (
                    <div className="px-2 pb-2.5" style={{ borderTop: `1px solid ${IC.borderSubtle}` }}>
                        <textarea
                            value={data.text}
                            onChange={(event) => handleTextChange(event.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            rows={3}
                            placeholder="Write instructions…"
                            aria-label="Instruction text"
                            className={`mt-2 w-full resize-none overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical rounded-[7px] p-2.5 outline-none luxia-type-caption transition-[border-color] duration-150 placeholder:text-[rgba(255,255,255,0.40)]`}
                            style={icTextareaStyle(focused)}
                            onMouseEnter={(e) => icInputBorderHoverOn(e, focused)}
                            onMouseLeave={(e) => icInputBorderHoverOff(e, focused)}
                        />
                        {data.attachment ? (
                            <p className="mt-1.5 truncate luxia-type-caption" style={{ color: IC.textMuted }}>
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
