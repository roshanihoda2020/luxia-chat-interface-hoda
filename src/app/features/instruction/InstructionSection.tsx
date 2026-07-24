import { ChevronDown, Cpu, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { INSTRUCTION_MAX_CHARS } from "./constants";
import { InstructionManager } from "./InstructionManager";
import { LX } from "./tokens";
import type { InstructionData } from "./types";
import { instructionSignature } from "./utils";

const BTN_ICON = "w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors outline-none flex-shrink-0";
const hoverOn = (e: { currentTarget: EventTarget | null }) => { (e.currentTarget as HTMLElement).style.background = LX.state.secondary08; };
const hoverOff = (e: { currentTarget: EventTarget | null }) => { (e.currentTarget as HTMLElement).style.background = "transparent"; };

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
            <div className="overflow-visible rounded-[14px]" style={{ background: LX.surface, border: `1px solid ${LX.border}`, boxShadow: LX.shadow.xs }}>
                <div className="flex items-center gap-1.5 px-[14px] py-3">
                    <Cpu size={14} color={LX.secondary} className="flex-shrink-0" />
                    <span className="flex-1 truncate luxia-type-body-small-strong leading-5" style={{ color: LX.primary }}>Instruction</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={BTN_ICON}
                                aria-label="Manage instruction"
                                onClick={(e) => { e.stopPropagation(); setManagerOpen(true); }}
                                onMouseEnter={hoverOn}
                                onMouseLeave={hoverOff}
                            >
                                <Maximize2 size={15} style={{ color: LX.textMuted }} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>Manage</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={BTN_ICON}
                                aria-label={isOpen ? "Collapse instruction" : "Expand instruction"}
                                onClick={onToggle}
                                onMouseEnter={hoverOn}
                                onMouseLeave={hoverOff}
                            >
                                <ChevronDown
                                    size={15}
                                    style={{
                                        color: LX.textMuted,
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
                    <div className="px-3 pb-3" style={{ borderTop: `1px solid ${LX.borderSubtle}` }}>
                        <textarea
                            value={data.text}
                            onChange={(event) => handleTextChange(event.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            rows={3}
                            placeholder="Write instructions…"
                            aria-label="Instruction text"
                            className="mt-2 w-full resize-none overflow-y-auto rounded-[8px] p-2.5 outline-none luxia-type-metadata transition-colors"
                            style={{
                                color: LX.primary,
                                background: LX.subtle,
                                border: `1px solid ${focused ? LX.borderStrong : LX.border}`,
                                boxShadow: focused ? `0 0 0 1px ${LX.borderStrong}` : "none",
                            }}
                        />
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
