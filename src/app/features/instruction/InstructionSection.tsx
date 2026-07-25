import { ChevronDown, Cpu, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { IC, IC_BTN_ICON, IC_CARD, icHoverOff, icHoverOn } from "@/app/features/active-data-tables/inspectorTheme";
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
            <div style={IC_CARD}>
                <div className="flex items-center gap-1.5 px-[14px] py-3">
                    <Cpu size={14} color={IC.iconAccent} className="flex-shrink-0" />
                    <span className="flex-1 truncate luxia-type-title-component" style={{ color: IC.textPrimary }}>Instruction</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={IC_BTN_ICON}
                                aria-label="Manage instruction"
                                onClick={(e) => { e.stopPropagation(); setManagerOpen(true); }}
                                onMouseEnter={icHoverOn}
                                onMouseLeave={icHoverOff}
                            >
                                <Maximize2 size={15} style={{ color: IC.textMuted }} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>Manage</TooltipContent>
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
                            className="mt-2 w-full resize-none overflow-y-auto rounded-[7px] p-2.5 outline-none luxia-type-caption transition-colors"
                            style={{
                                color: IC.textPrimary,
                                background: IC.input,
                                border: `1px solid ${focused ? "var(--luxia-purple-50)" : IC.border}`,
                                boxShadow: focused ? IC.focusRing : "none",
                            }}
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
