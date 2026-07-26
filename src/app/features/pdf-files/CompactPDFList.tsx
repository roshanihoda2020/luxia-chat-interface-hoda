import { ChevronDown, FileText, Plus, Search, SquareArrowOutUpRight, X } from "lucide-react";
import { useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { IC, IC_BTN_ICON, IC_BTN_OPEN, IC_CARD_HEADER, IC_INPUT_TEXT, IC_SEARCH_SHELL, IC_SEARCH_SHELL_STYLE, icCardStyle, icHoverOff, icHoverOn, icOpenActiveOn, icSearchShellBlur, icSearchShellFocus, icSearchShellHoverOff, icSearchShellHoverOn } from "../active-data-tables/inspectorTheme";
import { PDFFileMenu } from "./PDFFileMenu";
import { LX } from "./tokens";
import type { PDFFileRecord } from "./types";
import { PDF_MAX_BYTES, isPdfFile } from "./utils";

export function CompactPDFList({
    files,
    isOpen,
    search,
    onSearchChange,
    onToggle,
    onOpenManager,
    onView,
    onRemove,
    onUpload,
}: {
    files: PDFFileRecord[];
    isOpen: boolean;
    search: string;
    onSearchChange: (value: string) => void;
    onToggle: () => void;
    onOpenManager: () => void;
    onView: (id: string) => void;
    onRemove: (id: string) => void;
    onUpload: (file: File) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const visible = files.filter((f) => !f.markedForRemoval);
    const lowered = search.trim().toLowerCase();
    const filtered = visible.filter((f) => f.name.toLowerCase().includes(lowered));

    function handlePickedFile(file: File | null) {
        if (!file) return;
        setUploadError(null);
        if (!isPdfFile(file.name)) {
            setUploadError("This file type is not supported.");
            return;
        }
        if (file.size > PDF_MAX_BYTES) {
            setUploadError("File must be 10 MB or smaller.");
            return;
        }
        onUpload(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <div style={icCardStyle(isOpen)}>
            <div className={IC_CARD_HEADER}>
                <FileText size={14} color={IC.iconSemantic} className="flex-shrink-0" />
                <span className="flex-1 truncate luxia-type-title-component" style={{ color: IC.textPrimary }}>PDF Files</span>
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
                            aria-label="Search PDF files"
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
                            {search ? "No matches." : "No files yet."}
                        </p>
                    ) : (
                        filtered.map((file) => (
                            <div key={file.id}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] transition-colors"
                                style={{ background: "transparent" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = IC.hover; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <FileText size={10} color={IC.iconSemantic} className="flex-shrink-0" />
                                <span className="min-w-0 flex-1 truncate luxia-type-caption" style={{ color: IC.textPrimary }}>{file.name}</span>
                                <div className="relative z-20 flex-shrink-0" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                                    <PDFFileMenu onView={() => onView(file.id)} onRemove={() => onRemove(file.id)} />
                                </div>
                            </div>
                        ))
                    )}

                    {uploadError ? (
                        <p className="px-2 py-1 luxia-type-caption" role="alert" style={{ color: LX.error }}>{uploadError}</p>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] luxia-type-caption transition-colors outline-none"
                        style={{ color: IC.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = IC.hover; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                        <Plus size={10} />Add files
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,application/pdf"
                        onChange={(e) => handlePickedFile(e.target.files?.[0] ?? null)}
                    />
                </div>
            )}
        </div>
    );
}
