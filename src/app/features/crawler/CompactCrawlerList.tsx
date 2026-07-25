import { ChevronDown, Globe, Maximize2, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { CrawlerMenu } from "./CrawlerMenu";
import { IC, IC_BTN_ICON, IC_CARD, icHoverOff, icHoverOn } from "../active-data-tables/inspectorTheme";
import type { CrawlerEntry } from "./types";


export function CompactCrawlerList({
    entries,
    isOpen,
    onToggle,
    onOpenManager,
    onView,
    onEdit,
    onRemove,
}: {
    entries: CrawlerEntry[];
    isOpen: boolean;
    onToggle: () => void;
    onOpenManager: () => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
}) {
    const visible = entries.filter((e) => !e.markedForRemoval);

    return (
        <div style={IC_CARD}>
            <div className="flex items-center gap-1.5 px-[14px] py-3">
                <Globe size={14} color={IC.iconAccent} className="flex-shrink-0" />
                <span className="flex-1 truncate luxia-type-title-component" style={{ color: IC.textPrimary }}>Crawler URL Data</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className={IC_BTN_ICON} aria-label="Manage crawler URLs"
                            onClick={(e) => { e.stopPropagation(); onOpenManager(); }}
                            onMouseEnter={icHoverOn} onMouseLeave={icHoverOff}>
                            <Maximize2 size={15} style={{ color: IC.textMuted }} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>Manage</TooltipContent>
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
                    {visible.length === 0 ? (
                        <p className="px-2 py-2 luxia-type-caption mt-1" style={{ color: IC.textMuted }}>No URLs yet.</p>
                    ) : (
                        <div className="pt-1.5">
                            {visible.map((entry) => (
                                <div key={entry.id}
                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] transition-colors"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = IC.hover; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                    <Globe size={10} color={IC.iconAccent} className="flex-shrink-0" />
                                    <span className="min-w-0 flex-1 truncate luxia-type-caption" style={{ color: IC.textPrimary }}>{entry.url}</span>
                                    <div className="relative z-20 flex-shrink-0" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                                        <CrawlerMenu onView={() => onView(entry.id)} onEdit={() => onEdit(entry.id)} onRemove={() => onRemove(entry.id)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button type="button" onClick={onOpenManager}
                        className="mt-1 w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] luxia-type-caption transition-colors outline-none"
                        style={{ color: IC.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = IC.hover; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <Plus size={10} />Add URL
                    </button>
                </div>
            )}
        </div>
    );
}
