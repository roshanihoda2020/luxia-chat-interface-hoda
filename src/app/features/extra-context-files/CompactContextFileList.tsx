import { ChevronDown, Eye, FolderOpen, Maximize2, Plus, Search, Trash2, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { LX } from "./tokens";
import type { ExtraContextFile } from "./types";

const CARD = { background: "white", border: `1px solid ${LX.border}`, boxShadow: "0 1px 3px rgba(15,23,42,.05)", borderRadius: 12 };
const BTN_ICON = "w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors outline-none flex-shrink-0";
const hoverOn = (e: { currentTarget: EventTarget | null }) => { (e.currentTarget as HTMLElement).style.background = LX.state.secondary08; };
const hoverOff = (e: { currentTarget: EventTarget | null }) => { (e.currentTarget as HTMLElement).style.background = "transparent"; };

export function CompactContextFileList({
    files,
    isOpen,
    search,
    onSearchChange,
    onToggle,
    onOpenManager,
    onView,
    onRemove,
}: {
    files: ExtraContextFile[];
    isOpen: boolean;
    search: string;
    onSearchChange: (value: string) => void;
    onToggle: () => void;
    onOpenManager: () => void;
    onView: (id: string) => void;
    onRemove: (id: string) => void;
}) {
    const visible = files.filter((f) => !f.markedForRemoval);
    const filtered = visible.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <div style={CARD}>
            <div className="flex items-center gap-1.5 px-[14px] py-3">
                <FolderOpen size={14} color={LX.secondary} className="flex-shrink-0" />
                <span className="flex-1 truncate luxia-type-title-component" style={{ color: LX.primary }}>Extra Context Files</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className={BTN_ICON} aria-label="Manage extra context files"
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
                            className="flex-1 bg-transparent luxia-type-caption outline-none" style={{ color: LX.primary }} />
                        {search && (
                            <button type="button" onClick={() => onSearchChange("")} className="outline-none">
                                <X size={9} style={{ color: LX.textMuted }} />
                            </button>
                        )}
                    </div>

                    {filtered.length === 0 ? (
                        <p className="px-2 py-2 luxia-type-caption" style={{ color: LX.textMuted }}>
                            {search ? "No matches." : "No files yet."}
                        </p>
                    ) : (
                        filtered.map((file) => (
                            <div key={file.id}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] transition-colors"
                                style={{ background: "transparent" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <FolderOpen size={10} color={LX.secondary} className="flex-shrink-0" />
                                <span className="min-w-0 flex-1 truncate luxia-type-caption" style={{ color: LX.primary }}>{file.name}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" className="w-5 h-5 flex items-center justify-center rounded-full outline-none hover:opacity-70"
                                            aria-label="View file" onClick={() => onView(file.id)}>
                                            <Eye size={10} style={{ color: LX.textMuted }} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent sideOffset={6}>View file</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" className="w-5 h-5 flex items-center justify-center rounded-full outline-none hover:opacity-70"
                                            aria-label="Remove file" onClick={() => onRemove(file.id)}>
                                            <Trash2 size={10} style={{ color: LX.error }} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent sideOffset={6}>Remove file</TooltipContent>
                                </Tooltip>
                            </div>
                        ))
                    )}

                    <button type="button" onClick={onOpenManager}
                        className="mt-1 w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] luxia-type-caption transition-colors outline-none"
                        style={{ color: LX.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <Plus size={10} />Add files
                    </button>
                </div>
            )}
        </div>
    );
}
