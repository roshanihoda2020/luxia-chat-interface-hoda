import { BarChart3, ChevronDown, Plus, Search, SquareArrowOutUpRight, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { IC, IC_BTN_ICON, IC_BTN_OPEN, IC_CARD_HEADER, IC_INPUT_TEXT, IC_SEARCH_SHELL, IC_SEARCH_SHELL_STYLE, icCardStyle, icHoverOff, icHoverOn, icOpenActiveOn, icSearchShellBlur, icSearchShellFocus, icSearchShellHoverOff, icSearchShellHoverOn } from "../active-data-tables/inspectorTheme";
import type { MetricRecord } from "./types";


export function CompactMetricsList({
    metrics,
    isOpen,
    search,
    onSearchChange,
    onToggle,
    onOpenManager,
}: {
    metrics: MetricRecord[];
    isOpen: boolean;
    search: string;
    onSearchChange: (value: string) => void;
    onToggle: () => void;
    onOpenManager: () => void;
}) {
    const visible = metrics.filter((item) => !item.markedForRemoval);
    const lowered = search.trim().toLowerCase();
    const filtered = visible.filter((item) => [item.name, item.description].join(" ").toLowerCase().includes(lowered));

    return (
        <div style={icCardStyle(isOpen)}>
            <div className={IC_CARD_HEADER}>
                <BarChart3 size={14} color={IC.iconSemantic} className="flex-shrink-0" />
                <span className="flex-1 truncate luxia-type-title-component" style={{ color: IC.textPrimary }}>Metrics</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button type="button" className={IC_BTN_OPEN} aria-label="Open full editor"
                            onClick={(e) => { e.stopPropagation(); onOpenManager(); }}
                            onMouseEnter={icHoverOn} onMouseLeave={icHoverOff}
                            onMouseDown={icOpenActiveOn} onMouseUp={icHoverOn}>
                            <SquareArrowOutUpRight size={14} strokeWidth={2} style={{ color: IC.textMuted }} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>Open full editor</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className={IC_BTN_ICON} aria-label={isOpen ? "Collapse" : "Expand"} onClick={onToggle}
                            onMouseEnter={icHoverOn} onMouseLeave={icHoverOff}>
                            <ChevronDown size={15} style={{ color: IC.textMuted, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>{isOpen ? "Collapse" : "Expand"}</TooltipContent>
                </Tooltip>
            </div>

            {isOpen && (
                <div className="px-2 pb-2.5" style={{ borderTop: `1px solid ${IC.borderSubtle}` }}>
                    <div
                        className={IC_SEARCH_SHELL}
                        style={IC_SEARCH_SHELL_STYLE}
                        onMouseEnter={icSearchShellHoverOn}
                        onMouseLeave={icSearchShellHoverOff}
                    >
                        <Search size={10} style={{ color: IC.inputIcon }} />
                        <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search…"
                            className={`flex-1 ${IC_INPUT_TEXT}`} style={{ color: IC.textPrimary }}
                            aria-label="Search metrics"
                            onFocus={icSearchShellFocus}
                            onBlur={icSearchShellBlur} />
                        {search && (
                            <button type="button" aria-label="Clear search" onClick={() => onSearchChange("")} className="outline-none">
                                <X size={9} style={{ color: IC.inputIcon }} />
                            </button>
                        )}
                    </div>

                    {filtered.length === 0 ? (
                        <p className="px-2 py-2 luxia-type-caption" style={{ color: IC.textMuted }}>
                            {search ? "No matches." : "No metrics yet."}
                        </p>
                    ) : (
                        filtered.map((item) => (
                            <div key={item.id}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] transition-colors"
                                style={{ background: "transparent" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = IC.hover; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <BarChart3 size={10} color={IC.iconSemantic} className="flex-shrink-0" />
                                <span className="min-w-0 flex-1 truncate luxia-type-caption" style={{ color: IC.textPrimary }}>{item.name}</span>
                            </div>
                        ))
                    )}

                    <button type="button" onClick={onOpenManager}
                        className="mt-1 w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] luxia-type-caption transition-colors outline-none"
                        style={{ color: IC.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = IC.hover; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <Plus size={10} />Add metric
                    </button>
                </div>
            )}
        </div>
    );
}
