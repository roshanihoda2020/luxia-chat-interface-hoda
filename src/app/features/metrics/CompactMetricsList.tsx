import { BarChart3, ChevronDown, Maximize2, Plus, Search, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { LX } from "./tokens";
import type { MetricRecord } from "./types";

const CARD = { background: "white", border: `1px solid ${LX.border}`, boxShadow: "0 1px 3px rgba(15,23,42,.05)", borderRadius: 12 };
const BTN_ICON = "w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors outline-none flex-shrink-0";
const hoverOn = (e: { currentTarget: EventTarget | null }) => { (e.currentTarget as HTMLElement).style.background = LX.state.secondary08; };
const hoverOff = (e: { currentTarget: EventTarget | null }) => { (e.currentTarget as HTMLElement).style.background = "transparent"; };

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
        <div style={CARD}>
            <div className="flex items-center gap-1.5 px-[14px] py-3">
                <BarChart3 size={14} color={LX.secondary} className="flex-shrink-0" />
                <span className="flex-1 truncate text-[14px] font-semibold leading-5" style={{ color: LX.primary }}>Metrics</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className={BTN_ICON} aria-label="Manage metrics"
                            onClick={(e) => { e.stopPropagation(); onOpenManager(); }}
                            onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                            <Maximize2 size={15} style={{ color: LX.textMuted }} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>Manage</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className={BTN_ICON} aria-label={isOpen ? "Collapse" : "Expand"} onClick={onToggle}
                            onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                            <ChevronDown size={15} style={{ color: LX.textMuted, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>{isOpen ? "Collapse" : "Expand"}</TooltipContent>
                </Tooltip>
            </div>

            {isOpen && (
                <div className="px-2 pb-2.5" style={{ borderTop: `1px solid ${LX.borderSubtle}` }}>
                    <div className="flex items-center gap-1.5 px-2.5 h-[28px] rounded-[7px] mt-2 mb-1" style={{ border: `1px solid ${LX.border}`, background: LX.subtle }}>
                        <Search size={10} style={{ color: LX.textMuted }} />
                        <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search…"
                            className="flex-1 bg-transparent text-[11px] outline-none" style={{ color: LX.primary }}
                            aria-label="Search metrics" />
                        {search && (
                            <button type="button" aria-label="Clear search" onClick={() => onSearchChange("")} className="outline-none">
                                <X size={9} style={{ color: LX.textMuted }} />
                            </button>
                        )}
                    </div>

                    {filtered.length === 0 ? (
                        <p className="px-2 py-2 text-[11px]" style={{ color: LX.textMuted }}>
                            {search ? "No matches." : "No metrics yet."}
                        </p>
                    ) : (
                        filtered.map((item) => (
                            <div key={item.id}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] transition-colors"
                                style={{ background: "transparent" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <BarChart3 size={10} color={LX.secondary} className="flex-shrink-0" />
                                <span className="min-w-0 flex-1 truncate text-[11px] font-medium" style={{ color: LX.primary }}>{item.name}</span>
                            </div>
                        ))
                    )}

                    <button type="button" onClick={onOpenManager}
                        className="mt-1 w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] text-[11px] font-semibold transition-colors outline-none"
                        style={{ color: LX.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <Plus size={10} />Add metric
                    </button>
                </div>
            )}
        </div>
    );
}
