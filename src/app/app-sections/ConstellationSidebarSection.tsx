import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  ChevronDown, ChevronRight, ChevronLeft, Plus, X, Search, MoreHorizontal,
  Eye, Upload, GripVertical, Trash2, Check, Edit3, Table2,
  FileText, Database, BookOpen,
} from "lucide-react";
import { ActiveDataTablesSection } from "@/app/features/active-data-tables/ActiveDataTablesSection";
import type { DataTableRecord } from "@/app/features/active-data-tables/types";
import { ExtraContextFilesSection } from "@/app/features/extra-context-files/ExtraContextFilesSection";
import type { ExtraContextFile } from "@/app/features/extra-context-files/types";
import { InstructionSection } from "@/app/features/instruction/InstructionSection";
import {
  KnowledgeBaseSection,
  type KnowledgeBaseEntry,
} from "@/app/features/knowledge-base";
import { DataViewsSection } from "@/app/features/data-views";
import { MetricsSection } from "@/app/features/metrics/MetricsSection";
import type { MetricRecord } from "@/app/features/metrics/types";
import { PDFFilesSection } from "@/app/features/pdf-files/PDFFilesSection";
import type { PDFFileRecord } from "@/app/features/pdf-files/types";
import { CrawlerSection } from "@/app/features/crawler/CrawlerSection";
import type { CrawlerState } from "@/app/features/crawler/types";
import { RelationshipSection } from "@/app/features/relationship/RelationshipSection";
import type { RelationshipRecord } from "@/app/features/relationship/types";
import {
  CAPSULE_CAPABILITY_PATH,
  capabilityIdFromPath,
  isCapsuleCapabilityAllowed,
  type CapsuleCapabilityId,
} from "@/app/features/constellation";
import { GALAXY_PANEL_OUTER_GAP } from "@/app/features/galaxy";
import { LX } from "@/app/features/active-data-tables/tokens";
import {
  IC, IC_BTN_ICON, IC_BTN_OPEN, IC_CARD_HEADER, IC_INPUT_TEXT, IC_SEARCH_SHELL, IC_SEARCH_SHELL_STYLE,
  icCardStyle, icHoverOff, icHoverOn, icInspectorAccentStyle, icInspectorDescriptionColor,
  icInspectorTitleColor, icOpenActiveOn, icSearchShellBlur, icSearchShellFocus,
  icSearchShellHoverOff, icSearchShellHoverOn, icTextareaStyle,
} from "@/app/features/active-data-tables/inspectorTheme";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
  STRUCTURED_MODAL_DARK_CHROME_STYLE,
} from "@/app/features/shared/structuredModalChrome";
import {
  CONSTELLATION_STYLE,
  CONSTELLATION_SECTIONS,
  SECTION_DEFAULTS,
  SECTION_INSTRUCTION,
  SECTION_META,
  ConstellationNameWithSource,
  ConstellationSourceBadge,
  type Constellation,
  type ConstellationType,
  type SectionId,
  type SectionIcon,
} from "./appSectionShared";

/** Matches App.tsx layout constant — sidebar chrome width when collapsed. */
const CONSTELLATION_COLLAPSED_WIDTH = 56;

function SidebarListItem({ label, icon: Icon, onView, onRemove, draggable: isDraggable, onDragStart, onDragOver, onDrop, onDragEnd, dragOver }: {
  label: string; icon: SectionIcon;
  onView?: () => void; onRemove: () => void;
  draggable?: boolean; onDragStart?: () => void; onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void; onDragEnd?: () => void; dragOver?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] group transition-colors relative"
      style={{ borderTop: dragOver ? `2px solid ${LX.accent}` : "2px solid transparent", background: dragOver ? `${LX.accent}08` : "transparent" }}
      onMouseEnter={(e) => { if (!dragOver) (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
      onMouseLeave={(e) => { if (!dragOver) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {isDraggable && <GripVertical size={10} color={LX.borderStrong} className="flex-shrink-0 cursor-grab" />}
      <Icon size={11} color={LX.accent} className="flex-shrink-0" />
      <span className="flex-1 luxia-type-caption truncate select-none" style={{ color: LX.primary, fontWeight: 600 }}>{label}</span>
      <div ref={menuRef} className="relative flex-shrink-0">
        <button onClick={() => setMenuOpen(p => !p)}
          className="w-5 h-5 flex items-center justify-center rounded-[5px] transition-all"
          style={{ opacity: menuOpen ? 1 : 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.background = LX.border; }}
          onMouseLeave={(e) => { if (!menuOpen) { (e.currentTarget as HTMLElement).style.opacity = "0"; (e.currentTarget as HTMLElement).style.background = "transparent"; } }}>
          <MoreHorizontal size={11} style={{ color: LX.textMuted }} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-40 min-w-[176px] py-1"
            style={{ background: "white", boxShadow: LX.shadow.lg, border: `1px solid ${LX.border}`, borderRadius: 12 }}
            onClick={(e) => e.stopPropagation()}>
            {onView && (
              <button onClick={() => { setMenuOpen(false); onView(); }}
                className="w-full flex items-center gap-2.5 px-3.5 luxia-type-profile-secondary transition-colors text-left"
                style={{ color: LX.primary, height: 36 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <Eye size={13} style={{ color: LX.textMuted }} />View
              </button>
            )}
            <div className="h-px mx-3 my-0.5" style={{ background: LX.borderSubtle }} />
            <button onClick={() => { setMenuOpen(false); onRemove(); }}
              className="w-full flex items-center gap-2.5 px-3.5 luxia-type-profile-secondary transition-colors text-left"
              style={{ color: LX.error, height: 36 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.state.error06; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Trash2 size={13} style={{ color: LX.error }} />Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmRemoveDialog({ label, onConfirm, onCancel }: {
  label: string; onConfirm: () => void; onCancel: () => void;
}) {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0" style={{ background: "rgba(16,5,32,0.3)", backdropFilter: "blur(3px)" }} />
      <div
        className="relative w-[380px] overflow-hidden rounded-[20px]"
        style={{ background: "white", boxShadow: "0 12px 32px rgba(15,23,42,0.14)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-remove-title"
      >
        <div className="px-6 pt-5 pb-4" style={STRUCTURED_MODAL_DARK_CHROME_STYLE}>
          <h3
            id="confirm-remove-title"
            className="luxia-type-title-modal text-[var(--luxia-text-inverse)]"
          >
            Remove item?
          </h3>
        </div>
        <div className="px-6 py-5">
          <p className="luxia-type-body-dense mb-5" style={{ color: LX.textMuted }}>
            <span className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>{label}</span>
            {" "}will be removed from the constellation. This action cannot be undone.
          </p>
          <div className="flex items-center gap-2.5">
            <button onClick={onCancel}
              className="flex-1 h-[40px] rounded-[10px] luxia-type-body-dense-strong transition-colors outline-none"
              style={{ color: LX.textMuted, border: `1px solid ${LX.border}`, background: "white" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.subtle; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}>
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 h-[40px] rounded-[10px] luxia-type-body-dense-strong text-white hover:opacity-90 transition-opacity outline-none"
              style={{ background: LX.error }}>
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ItemPreviewModal({ label, icon: Icon, onClose }: {
  label: string; icon: SectionIcon; onClose: () => void;
}) {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" style={{ backdropFilter: "blur(2px)" }} />
      <div className="relative rounded-[20px] w-[560px] max-h-[70vh] overflow-hidden flex flex-col"
        style={{ background: "white", boxShadow: LX.shadow.xl }} onClick={(e) => e.stopPropagation()}>
        <div
          className="flex flex-shrink-0 items-center gap-3 px-6 pt-5 pb-4"
          style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ background: "rgba(255,255,255,0.12)" }}>
            <Icon size={14} color="var(--luxia-text-inverse)" />
          </div>
          <h3 className="min-w-0 flex-1 truncate luxia-type-title-panel text-[var(--luxia-text-inverse)]">{label}</h3>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full outline-none transition-opacity",
              LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
            )}
            aria-label="Close preview"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-6">
          <div className="rounded-[12px] p-4 luxia-type-body-dense"
            style={{ background: LX.subtle, border: `1px solid ${LX.border}`, color: LX.muted }}>
            <p className="font-bold mb-2" style={{ color: LX.primary }}>{label}</p>
            <p>Preview content for this resource would appear here. Connect to your data source to load the full content of this item.</p>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${LX.border}` }}>
          <button onClick={onClose} className="px-5 h-[38px] rounded-[24px] luxia-type-body-dense-strong hover:bg-black/5 transition-colors" style={{ color: LX.muted }}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FileDropZone({ onDrop }: { onDrop: (names: string[]) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-[10px] cursor-pointer transition-all mt-1"
      style={{ border: `1.5px dashed ${over ? LX.accent : LX.border}`, background: over ? `${LX.accent}08` : "transparent" }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const n = Array.from(e.dataTransfer.files).map(f => f.name); if (n.length) onDrop(n); }}
      onClick={() => { const i = document.createElement("input"); i.type = "file"; i.multiple = true; i.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f) onDrop(Array.from(f).map(x => x.name)); }; i.click(); }}>
      <Upload size={13} color={over ? LX.accent : LX.muted} />
      <span className="luxia-type-caption" style={{ color: over ? LX.accent : LX.muted }}>Drop files or click to upload</span>
    </div>
  );
}

function SectionWorkspaceModal({ sectionId, items, instruction, onSave, onClose }: {
  sectionId: SectionId; items: string[]; instruction: string;
  onSave: (items: string[], instruction: string) => void;
  onClose: () => void;
}) {
  const meta = SECTION_META[sectionId];
  const Icon = meta.icon;
  const isInstr = sectionId === "instr";
  const showDrop = sectionId === "pdfFiles";

  const [pendingItems, setPendingItems] = useState<string[]>([...items]);
  const [pendingInstr, setPendingInstr] = useState(instruction);
  const [searchQ, setSearchQ] = useState("");
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [itemMenu, setItemMenu] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemMenu === null) return;
    const close = (e: MouseEvent) => { setItemMenu(null); };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [itemMenu]);

  const filtered = pendingItems.filter(it => it.toLowerCase().includes(searchQ.toLowerCase()));

  function reorder(fromIdx: number, toIdx: number) {
    const next = [...pendingItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setPendingItems(next);
  }

  function removeItem(idx: number) {
    setPendingItems(p => p.filter((_, i) => i !== idx));
    setConfirmRemoveIdx(null);
  }

  const hasChanges = !isInstr
    ? JSON.stringify(pendingItems) !== JSON.stringify(items)
    : pendingInstr !== instruction;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(16,5,32,0.35)", backdropFilter: "blur(4px)" }} />
      <div className="relative w-[700px] max-h-[84vh] rounded-[20px] overflow-hidden flex flex-col"
        style={{ background: "white", boxShadow: "0 12px 32px rgba(15,23,42,0.14)" }}
        onClick={(e) => e.stopPropagation()}>

        <div
          className="flex flex-shrink-0 items-center gap-3 px-7 pt-5 pb-4"
          style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <Icon size={16} color="var(--luxia-text-inverse)" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="luxia-type-title-panel text-[var(--luxia-text-inverse)]">{meta.label}</h2>
            <p className="mt-0.5 luxia-type-caption text-[var(--luxia-purple-10)]">Changes are local until saved</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full outline-none transition-opacity",
              LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
            )}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {!isInstr && (
          <div className="flex items-center gap-2 px-6 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${LX.border}` }}>
            <Search size={13} style={{ color: LX.muted }} />
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder={`Search ${meta.label.toLowerCase()}…`}
              className="flex-1 outline-none luxia-type-body-dense bg-transparent"
              style={{ color: LX.primary }} />
            {searchQ && (
              <button onClick={() => setSearchQ("")} className="w-5 h-5 flex items-center justify-center">
                <X size={11} style={{ color: LX.muted }} />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-8 py-5">
          {isInstr ? (
            <textarea value={pendingInstr} onChange={(e) => setPendingInstr(e.target.value)} rows={14}
              className="w-full outline-none resize-none luxia-type-body-small p-4 rounded-[12px]"
              style={{ border: `1px solid ${LX.border}`, color: LX.primary, background: LX.subtle }} />
          ) : (
            <div className="space-y-1.5">
              {filtered.length === 0 && (
                <p className="text-center py-8 luxia-type-body-dense" style={{ color: LX.muted }}>
                  {searchQ ? "No items match your search." : "No items yet. Add one below."}
                </p>
              )}
              {filtered.map((item) => {
                const realIdx = pendingItems.indexOf(item);
                return (
                  <div key={realIdx}
                    draggable
                    onDragStart={() => setDragSrc(realIdx)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(realIdx); }}
                    onDrop={() => { if (dragSrc !== null && dragSrc !== realIdx) reorder(dragSrc, realIdx); setDragSrc(null); setDragOver(null); }}
                    onDragEnd={() => { setDragSrc(null); setDragOver(null); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-[12px] group transition-colors relative"
                    style={{
                      border: `1px solid ${dragOver === realIdx ? LX.accent : LX.border}`,
                      background: dragOver === realIdx ? `${LX.accent}06` : "white",
                    }}>
                    <GripVertical size={14} color="rgba(0,0,0,0.18)" className="cursor-grab flex-shrink-0" />
                    <Icon size={14} color={LX.accent} className="flex-shrink-0" />
                    <span className="flex-1 luxia-type-body-small-strong truncate" style={{ color: LX.primary }}>{item}</span>
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setItemMenu(itemMenu === realIdx ? null : realIdx)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-[7px] hover:bg-black/5 transition-all"
                        style={{ opacity: itemMenu === realIdx ? 1 : undefined }}>
                        <MoreHorizontal size={14} style={{ color: LX.muted }} />
                      </button>
                      {itemMenu === realIdx && (
                        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] py-1.5"
                          style={{ background: "white", boxShadow: LX.shadow.lg, border: `1px solid ${LX.border}`, borderRadius: 14 }}>
                          <button onClick={() => { setItemMenu(null); setPreviewIdx(realIdx); }}
                            className="w-full flex items-center gap-2.5 px-4 luxia-type-body-dense-strong transition-colors text-left"
                            style={{ color: LX.primary, height: 40 }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(218,203,248,0.28)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <Eye size={14} style={{ color: LX.muted }} />View
                          </button>
                          <div className="h-px mx-3 my-1" style={{ background: LX.border }} />
                          <button onClick={() => { setItemMenu(null); setConfirmRemoveIdx(realIdx); }}
                            className="w-full flex items-center gap-2.5 px-4 luxia-type-body-dense-strong transition-colors text-left"
                            style={{ color: LX.error, height: 40 }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(247,80,80,0.07)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <Trash2 size={14} style={{ color: LX.error }} />Remove from Constellation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {!searchQ && showDrop && <FileDropZone onDrop={(names) => setPendingItems(p => [...p, ...names])} />}
              {!searchQ && (
                <button
                  onClick={() => setPendingItems(p => [...p, sectionId === "crawler" ? "https://example.com" : `Item ${p.length + 1}`])}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] luxia-type-body-dense-strong hover:opacity-80 transition-opacity mt-1"
                  style={{ border: `1.5px dashed ${LX.border}`, color: LX.muted }}>
                  <Plus size={14} />{sectionId === "crawler" ? "Add URL" : "Add item"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-7 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${LX.border}` }}>
          <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
            {isInstr ? "" : `${pendingItems.length} item${pendingItems.length !== 1 ? "s" : ""}`}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-5 h-[38px] rounded-[10px] luxia-type-body-dense-strong transition-colors outline-none"
              style={{ color: LX.textMuted, border: `1px solid ${LX.border}` }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.subtle; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              Cancel
            </button>
            <button onClick={() => { onSave(pendingItems, pendingInstr); onClose(); }}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-5 h-[38px] rounded-[10px] luxia-type-body-dense-strong text-white transition-opacity outline-none disabled:opacity-40"
              style={{ background: LX.gradient.button, boxShadow: LX.shadow.sm }}>
              <Check size={13} />Save Changes
            </button>
          </div>
        </div>
      </div>

      {confirmRemoveIdx !== null && (
        <ConfirmRemoveDialog
          label={pendingItems[confirmRemoveIdx]}
          onConfirm={() => removeItem(confirmRemoveIdx)}
          onCancel={() => setConfirmRemoveIdx(null)}
        />
      )}
      {previewIdx !== null && (
        <ItemPreviewModal
          label={pendingItems[previewIdx]}
          icon={Icon}
          onClose={() => setPreviewIdx(null)}
        />
      )}
    </div>,
    document.body,
  );
}

const CONSTELLATION_MENU_ID = "luxia-constellation-selector-listbox";
const CONSTELLATION_MENU_WIDTH = 244;
const CONSTELLATION_MENU_MIN_WIDTH = 220;
const CONSTELLATION_MENU_GAP = 8;

export function ConstellationSelector({
  constellation,
  options,
  onChange,
  disabled = false,
  forceClosed = false,
}: {
  constellation: Constellation;
  options: Constellation[];
  onChange: (id: string) => void;
  disabled?: boolean;
  forceClosed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filtered = useMemo(
    () => options.filter((c) => c.label.toLowerCase().includes(searchQ.toLowerCase())),
    [options, searchQ],
  );

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    setSearchQ("");
    setMenuPos(null);
    setFocusIndex(-1);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const positionMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const width = Math.max(
      CONSTELLATION_MENU_MIN_WIDTH,
      Math.min(CONSTELLATION_MENU_WIDTH, window.innerWidth - 16),
    );
    let left = r.left;
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
    if (left < 8) left = 8;

    const estimatedHeight = Math.min(280, 52 + Math.max(filtered.length, 1) * 44 + 8);
    const spaceBelow = window.innerHeight - r.bottom - CONSTELLATION_MENU_GAP;
    const spaceAbove = r.top - CONSTELLATION_MENU_GAP;
    const openUpward = spaceBelow < Math.min(220, estimatedHeight) && spaceAbove > spaceBelow;

    if (openUpward) {
      setMenuPos({
        bottom: window.innerHeight - r.top + CONSTELLATION_MENU_GAP,
        left,
        width,
      });
    } else {
      setMenuPos({
        top: r.bottom + CONSTELLATION_MENU_GAP,
        left,
        width,
      });
    }
  }, [filtered.length]);

  function openMenu() {
    if (disabled) return;
    positionMenu();
    setOpen(true);
    setFocusIndex(-1);
  }

  useEffect(() => {
    if (forceClosed) closeMenu(false);
  }, [forceClosed, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    setFocusIndex(-1);
  }, [searchQ]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu(true);
        return;
      }
      if (filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((prev) => {
          const next = prev < filtered.length - 1 ? prev + 1 : 0;
          optionRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((prev) => {
          const next = prev <= 0 ? filtered.length - 1 : prev - 1;
          optionRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === "Home") {
        e.preventDefault();
        setFocusIndex(0);
        optionRefs.current[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        const last = filtered.length - 1;
        setFocusIndex(last);
        optionRefs.current[last]?.focus();
      } else if (e.key === "Enter" && focusIndex >= 0 && filtered[focusIndex]) {
        e.preventDefault();
        onChange(filtered[focusIndex].id);
        closeMenu(true);
      }
    }

    function onReposition() {
      positionMenu();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => onReposition())
      : null;
    if (triggerRef.current) resizeObserver?.observe(triggerRef.current);
    const inspectorEl = triggerRef.current?.closest("aside");
    if (inspectorEl) resizeObserver?.observe(inspectorEl);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
      resizeObserver?.disconnect();
    };
  }, [open, filtered, focusIndex, closeMenu, onChange, positionMenu]);

  function selectConstellation(id: string) {
    onChange(id);
    closeMenu(true);
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label="Change Constellation"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={CONSTELLATION_MENU_ID}
            disabled={disabled}
            onClick={() => (open ? closeMenu(false) : openMenu())}
            onMouseEnter={() => setTriggerHovered(true)}
            onMouseLeave={() => setTriggerHovered(false)}
            className="inline-flex max-w-full min-w-0 items-center justify-start gap-1.5 overflow-hidden text-left luxia-type-title-panel disabled:cursor-default disabled:opacity-100 outline-none focus-visible:outline-none rounded-[8px]"
            style={{
              color: "var(--luxia-text-inverse)",
              background: "transparent",
              transition: "background-color 140ms ease, box-shadow 140ms ease",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = IC.focusRing;
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <span className="min-w-0 flex-1 overflow-hidden text-left" title={constellation.label}>
              <span className="block min-w-0 truncate text-left">{constellation.label}</span>
            </span>
            <ConstellationSourceBadge
              type={constellation.type}
              className="pointer-events-none flex-shrink-0 select-none"
            />
            <ChevronDown
              size={14}
              strokeWidth={2.2}
              aria-hidden
              className="flex-shrink-0"
              style={{ color: triggerHovered && !disabled ? "rgba(255, 255, 255, 0.78)" : IC.textMuted }}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>Change Constellation</TooltipContent>
      </Tooltip>

      {open && menuPos && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] rounded-[14px] overflow-hidden"
          style={{
            top: menuPos.top,
            bottom: menuPos.bottom,
            left: menuPos.left,
            width: menuPos.width,
            background: "white",
            boxShadow: LX.shadow.lg,
            border: `1px solid ${LX.border}`,
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ borderBottom: `1px solid ${LX.borderSubtle}` }}
          >
            <Search size={12} style={{ color: LX.textMuted, flexShrink: 0 }} aria-hidden="true" />
            <input
              ref={searchRef}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search constellations…"
              aria-label="Search constellations"
              aria-controls={CONSTELLATION_MENU_ID}
              className="flex-1 outline-none luxia-type-body-dense bg-transparent"
              style={{ color: LX.primary }}
            />
          </div>
          <div
            id={CONSTELLATION_MENU_ID}
            role="listbox"
            aria-label="Constellations"
            className="py-1 max-h-[200px] overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical"
          >
            {filtered.length === 0 ? (
              <p className="px-4 py-3 luxia-type-metadata" style={{ color: LX.textMuted }}>No results</p>
            ) : (
              filtered.map((c, index) => {
                const cs = CONSTELLATION_STYLE[c.type];
                const selected = c.id === constellation.id;
                const focused = index === focusIndex;
                return (
                  <button
                    key={c.id}
                    ref={(el) => { optionRefs.current[index] = el; }}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={focused ? 0 : -1}
                    onClick={() => selectConstellation(c.id)}
                    onMouseEnter={() => setFocusIndex(index)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left outline-none"
                    style={{ background: focused ? LX.subtle : "transparent" }}
                  >
                    <div
                      className="w-5 h-5 rounded-[5px] flex items-center justify-center flex-shrink-0"
                      style={{ background: cs.bg, border: `1px solid ${cs.border}` }}
                    >
                      {c.type === "database"
                        ? <Database size={10} color={cs.color} />
                        : c.type === "csv"
                          ? <Table2 size={10} color={cs.color} />
                          : <FileText size={10} color={cs.color} />}
                    </div>
                    <span
                      className="flex-1 min-w-0 luxia-type-profile-secondary truncate"
                      style={{ color: selected ? LX.accent : LX.primary }}
                    >
                      <ConstellationNameWithSource
                        label={c.label}
                        type={c.type}
                        labelClassName="truncate"
                      />
                    </span>
                    {selected ? <Check size={11} style={{ color: LX.accent, flexShrink: 0 }} /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

export function ConstellationSidebar({
  width,
  onResizeStart,
  collapsed,
  onCollapse,
  constellation,
  allConstellations,
  onConstellationChange,
  onOpenConstellationSettings,
  projectId,
  allowConstellationChange,
  isGalaxyChat,
  canConfigure = false,
  canEditKnowledge = false,
  knowledgeBase,
  onCommitKnowledgeBase,
  views,
  onCommitViews,
  tables,
  onCommitTables,
  contextFiles,
  onCommitContextFiles,
  relationships,
  onCommitRelationships,
  metrics,
  onCommitMetrics,
  pdfFiles,
  onCommitPdfFiles,
  crawler,
  onCommitCrawler,
}: {
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  collapsed: boolean;
  onCollapse: () => void;
  constellation: Constellation;
  allConstellations: Constellation[];
  onConstellationChange: (id: string) => void;
  onOpenConstellationSettings?: (projectId: string, constellationId: string) => void;
  projectId: string;
  allowConstellationChange: boolean;
  isGalaxyChat: boolean;
  canConfigure?: boolean;
  canEditKnowledge?: boolean;
  /** Shared Constellation KB from capabilityBundlesById — not Chat-local state. */
  knowledgeBase: KnowledgeBaseEntry[];
  onCommitKnowledgeBase: (next: KnowledgeBaseEntry[]) => void;
  /** Shared Constellation Views from capabilityBundlesById — same as Settings. */
  views: DataTableRecord[];
  onCommitViews: (next: DataTableRecord[]) => void;
  tables: DataTableRecord[];
  onCommitTables: (next: DataTableRecord[]) => void;
  contextFiles: ExtraContextFile[];
  onCommitContextFiles: (next: ExtraContextFile[]) => void;
  relationships: RelationshipRecord[];
  onCommitRelationships: (next: RelationshipRecord[]) => void;
  metrics: MetricRecord[];
  onCommitMetrics: (next: MetricRecord[]) => void;
  pdfFiles: PDFFileRecord[];
  onCommitPdfFiles: (next: PDFFileRecord[]) => void;
  crawler: CrawlerState;
  onCommitCrawler: (next: CrawlerState) => void;
}) {
  const sectionIds = CONSTELLATION_SECTIONS[constellation.type];

  const initItems = () => Object.fromEntries(sectionIds.map(id => [id, [...(SECTION_DEFAULTS[id] ?? [])]])) as Record<SectionId, string[]>;
  const [items, setItems] = useState<Record<SectionId, string[]>>(initItems);
  const [instruction, setInstruction] = useState(SECTION_INSTRUCTION[constellation.type]);
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>(
    Object.fromEntries(sectionIds.map((id) => [id, false])) as Record<SectionId, boolean>
  );

  const [descExpanded, setDescExpanded] = useState(false);

  const [modalSection, setModalSection] = useState<SectionId | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ sid: SectionId; idx: number } | null>(null);
  const [previewItem, setPreviewItem] = useState<{ sid: SectionId; idx: number } | null>(null);

  const [kbWorkspaceOpen, setKbWorkspaceOpen] = useState(false);
  const kbCloseRef = useRef<(() => void) | null>(null);
  const kbDirtyRef = useRef(false);
  const kbLeaveActionRef = useRef<() => void>(() => {
    setKbWorkspaceOpen(false);
  });

  const [dragSrc, setDragSrc] = useState<{ sid: SectionId; i: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ sid: SectionId; i: number } | null>(null);

  const [sectionSignatures, setSectionSignatures] = useState<Record<string, string>>({});
  const [savedConstellationSnapshot, setSavedConstellationSnapshot] = useState<string | null>(null);
  const [constellationSaving, setConstellationSaving] = useState(false);
  const [constellationFeedback, setConstellationFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const registerSectionSignature = useCallback((sectionId: string, signature: string) => {
    setSectionSignatures((prev) => (prev[sectionId] === signature ? prev : { ...prev, [sectionId]: signature }));
  }, []);

  // KB commits via onCommitKnowledgeBase → capabilityBundlesById; exclude from Chat dirty snapshot.
  const currentConstellationSnapshot = useMemo(
    () => JSON.stringify({ sections: sectionSignatures }),
    [sectionSignatures],
  );

  function closeKbWorkspace() {
    setKbWorkspaceOpen(false);
  }

  function runKbLeaveAction() {
    const action = kbLeaveActionRef.current;
    kbLeaveActionRef.current = closeKbWorkspace;
    action();
  }

  /** Intercept constellation switch while Chat KB manager is dirty — reuse manager DiscardChangesDialog. */
  function requestConstellationChange(nextId: string) {
    if (nextId === constellation.id) return;

    const proceed = () => onConstellationChange(nextId);

    if (kbWorkspaceOpen && kbCloseRef.current) {
      kbLeaveActionRef.current = () => {
        closeKbWorkspace();
        proceed();
      };
      kbCloseRef.current();
      return;
    }

    closeKbWorkspace();
    proceed();
  }

  useEffect(() => {
    setSectionSignatures({});
    setSavedConstellationSnapshot(null);
    setConstellationFeedback(null);
    setKbWorkspaceOpen(false);
    kbLeaveActionRef.current = closeKbWorkspace;
  }, [constellation.id]);

  useEffect(() => {
    if (savedConstellationSnapshot === null) {
      const timer = window.setTimeout(() => setSavedConstellationSnapshot(currentConstellationSnapshot), 150);
      return () => window.clearTimeout(timer);
    }
  }, [savedConstellationSnapshot, currentConstellationSnapshot, constellation.id]);

  const constellationDirty = savedConstellationSnapshot !== null && currentConstellationSnapshot !== savedConstellationSnapshot;

  function saveConstellation() {
    if (!constellationDirty || constellationSaving) return;
    setConstellationSaving(true);
    setConstellationFeedback(null);
    window.setTimeout(() => {
      setSavedConstellationSnapshot(currentConstellationSnapshot);
      setConstellationSaving(false);
      setConstellationFeedback({ type: "success", message: "Constellation saved." });
      window.setTimeout(() => setConstellationFeedback(null), 2500);
    }, 600);
  }

  function updateItems(sid: SectionId, next: string[]) {
    setItems(prev => ({ ...prev, [sid]: next }));
  }

  function handleDrop(sid: SectionId, targetIdx: number) {
    if (!dragSrc || dragSrc.sid !== sid || dragSrc.i === targetIdx) return;
    const next = [...items[sid]];
    const [moved] = next.splice(dragSrc.i, 1);
    next.splice(targetIdx, 0, moved);
    updateItems(sid, next);
    setDragSrc(null); setDragOver(null);
  }

  const projectConstellations = useMemo(
    () => allConstellations.filter((c) => c.projectId === projectId),
    [allConstellations, projectId],
  );

  function expandToSection(sid: SectionId) {
    setOpenSections((prev) => {
      const next = { ...prev } as Record<SectionId, boolean>;
      for (const id of sectionIds) next[id] = id === sid;
      return next;
    });
    onCollapse();
  }

  const railHit =
    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] outline-none focus-visible:outline-none transition-colors";
  const expandHit =
    "mt-px flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] outline-none focus-visible:outline-none";

  if (collapsed) {
    return (
      <div
        className="flex h-full min-h-0 flex-shrink-0 flex-col self-stretch"
        style={{
          width: CONSTELLATION_COLLAPSED_WIDTH + GALAXY_PANEL_OUTER_GAP * 2,
          padding: GALAXY_PANEL_OUTER_GAP,
          boxSizing: "border-box",
          ...icInspectorAccentStyle(constellation.type),
        }}
        data-luxia-inspector="capsule-collapsed"
        data-constellation-type={constellation.type}
      >
        <aside
          className="relative flex min-h-0 flex-1 flex-col items-center overflow-hidden outline-none"
          style={{
            width: CONSTELLATION_COLLAPSED_WIDTH,
            minWidth: CONSTELLATION_COLLAPSED_WIDTH,
            minHeight: 40,
            borderRadius: "var(--luxia-radius-24)",
            backgroundColor: IC.shell,
            backgroundImage: IC.shellGradient,
            border: `1px solid ${IC.shellBorder}`,
            boxShadow: IC.shellShadow,
          }}
        >
          <div className="flex w-full flex-shrink-0 items-start justify-center px-1.5 pt-3 pb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onCollapse}
                  aria-label="Expand Constellation inspector"
                  aria-expanded={false}
                  className={expandHit}
                  style={{
                    background: "transparent",
                    color: IC.textMuted,
                    transition: "background-color 140ms ease, box-shadow 140ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = IC.hover;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = IC.focusRing;
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <ChevronLeft size={15} strokeWidth={2.2} aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8}>Expand inspector</TooltipContent>
            </Tooltip>
          </div>

          <div className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical px-1.5 pb-3">
            <div className="flex flex-col items-center gap-2 pt-1">
              {sectionIds.map((id) => {
                const Icon = SECTION_META[id].icon;
                const label = SECTION_META[id].label;
                return (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => expandToSection(id)}
                        aria-label={`Open ${label}`}
                        className={railHit}
                        style={{ background: "transparent", color: IC.iconSemantic }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = IC.hover;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = IC.focusRing;
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        }}
                      >
                        <Icon size={17} strokeWidth={2} aria-hidden color="currentColor" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={8}>{label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-shrink-0 flex-col self-stretch"
      style={{
        width,
        padding: IC.gap,
        boxSizing: "border-box",
        ...icInspectorAccentStyle(constellation.type),
      }}
      data-luxia-inspector="capsule"
      data-constellation-type={constellation.type}
    >
    <aside
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{
        width: "100%",
        borderRadius: IC.radiusShell,
        backgroundColor: IC.shell,
        backgroundImage: IC.shellGradient,
        border: `1px solid ${IC.shellBorder}`,
        boxShadow: IC.shellShadow,
      }}
    >

      <div className="absolute left-0 top-0 h-full w-[5px] z-20 cursor-col-resize group" onMouseDown={onResizeStart}>
        <div className="absolute inset-y-0 left-0 w-[3px] group-hover:bg-[var(--luxia-brand-secondary)]/30 transition-colors" />
      </div>

      <div
        className="relative flex-shrink-0 overflow-hidden px-5 pt-3 pb-2.5"
        style={{ background: IC.header, borderBottom: `1px solid ${IC.headerDivider}` }}
      >
        <div className="flex min-w-0 items-start gap-3 overflow-hidden">
          <div className="relative min-w-0 flex-1 overflow-hidden text-left">
            {isGalaxyChat ? (
              <div className="min-w-0 overflow-hidden text-left">
                <div
                  className="min-w-0 luxia-type-body-dense-strong text-left"
                  style={{ color: icInspectorTitleColor("galaxy"), letterSpacing: "-0.01em" }}
                >
                  <span className="min-w-0 truncate block text-left">Galaxy chat</span>
                </div>
                <p className="mt-0.5 truncate luxia-type-caption leading-4" style={{ color: IC.textSubtitle }}>
                  Uses all constellations in this project
                </p>
              </div>
            ) : (
              <ConstellationSelector
                constellation={constellation}
                options={projectConstellations}
                onChange={requestConstellationChange}
                disabled={!allowConstellationChange}
                forceClosed={collapsed}
              />
            )}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Collapse Constellation inspector"
                aria-expanded={true}
                className="mt-px flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] outline-none focus-visible:outline-none"
                style={{
                  background: "transparent",
                  color: IC.textMuted,
                  transition: "background-color 140ms ease, box-shadow 140ms ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = IC.hover;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  el.style.boxShadow = "none";
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = IC.focusRing;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Collapse inspector</TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-4">
          <p
            className="luxia-type-caption"
            style={{
              color: isGalaxyChat ? IC.textPrimary : icInspectorDescriptionColor(constellation.type),
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: descExpanded ? "unset" : 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.45,
            } as React.CSSProperties}
          >
            {constellation.description}
          </p>
          <div
            className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
            style={{ color: isGalaxyChat ? IC.textPrimary : IC.iconSemantic }}
          >
            <button
              type="button"
              onClick={() => setDescExpanded((p) => !p)}
              className="luxia-type-caption min-h-7 hover:opacity-80 transition-opacity outline-none focus-visible:underline"
              style={{ color: "inherit" }}
              aria-expanded={descExpanded}
              aria-label={descExpanded ? "Read less Constellation description" : "Read more Constellation description"}
            >
              {descExpanded ? "Read less" : "Read more"}
            </button>
            {!isGalaxyChat ? (
              <>
                <span className="luxia-type-caption select-none" style={{ color: IC.textMuted }} aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  className="luxia-type-caption min-h-7 hover:opacity-80 transition-opacity outline-none focus-visible:underline"
                  style={{ color: "inherit" }}
                  aria-label="Open Constellation"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const settingsProjectId = constellation.projectId || projectId;
                    const settingsConstellationId = constellation.id;
                    if (!settingsProjectId || !settingsConstellationId) return;
                    if (settingsConstellationId === "constellation-unavailable") return;
                    onOpenConstellationSettings?.(settingsProjectId, settingsConstellationId);
                  }}
                >
                  Open Constellation
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical galaxy-panel-scroll px-5 pt-5 pb-2.5 space-y-2"
      >
        {sectionIds.map((sid) => {
          const meta = SECTION_META[sid];
          const Icon = meta.icon;
          const isOpen = openSections[sid];

          if (sid === "dataTable") {
            return (
              <ActiveDataTablesSection
                key="dataTable"
                tables={tables}
                onCommitTables={onCommitTables}
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, dataTable: !p.dataTable }))}
                readOnly={!canConfigure}
                constellationId={constellation.id}
              />
            );
          }

          if (sid === "contextFiles") {
            return (
              <ExtraContextFilesSection
                key="contextFiles"
                files={contextFiles}
                onCommitFiles={onCommitContextFiles}
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, contextFiles: !p.contextFiles }))}
                readOnly={!canConfigure}
              />
            );
          }

          if (sid === "relationship") {
            return (
              <RelationshipSection
                key="relationship"
                relationships={relationships}
                onCommitRelationships={onCommitRelationships}
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, relationship: !p.relationship }))}
                readOnly={!canConfigure}
              />
            );
          }

          if (sid === "metrics") {
            return (
              <MetricsSection
                key="metrics"
                metrics={metrics}
                onCommitMetrics={onCommitMetrics}
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, metrics: !p.metrics }))}
                readOnly={!canConfigure}
              />
            );
          }

          if (sid === "instr") {
            return (
              <InstructionSection
                key={constellation.id}
                defaultInstruction={SECTION_INSTRUCTION[constellation.type]}
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, instr: !p.instr }))}
                onSignatureChange={(sig) => registerSectionSignature("instr", sig)}
                readOnly={!canEditKnowledge}
              />
            );
          }

          if (sid === "pdfFiles") {
            return (
              <PDFFilesSection
                key="pdfFiles"
                files={pdfFiles}
                onCommitFiles={onCommitPdfFiles}
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, pdfFiles: !p.pdfFiles }))}
                readOnly={!canConfigure}
              />
            );
          }

          if (sid === "crawler") {
            return (
              <CrawlerSection
                key="crawler"
                state={crawler}
                onCommitState={onCommitCrawler}
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, crawler: !p.crawler }))}
                readOnly={!canEditKnowledge}
              />
            );
          }

          if (sid === "kb") {
            return (
              <KnowledgeBaseSection
                key="kb"
                entries={knowledgeBase}
                onCommitEntries={onCommitKnowledgeBase}
                isOpen={isOpen}
                onToggle={() => setOpenSections((p) => ({ ...p, kb: !p.kb }))}
                readOnly={!canEditKnowledge}
                managerOpen={kbWorkspaceOpen}
                onManagerOpenChange={setKbWorkspaceOpen}
                closeRef={kbCloseRef}
                dirtyRef={kbDirtyRef}
                onLeaveAborted={() => {
                  kbLeaveActionRef.current = closeKbWorkspace;
                }}
                onCancelManager={runKbLeaveAction}
              />
            );
          }

          // Views: accordion + in-Chat dialog over shared bundle.views.
          if (sid === "views") {
            return (
              <DataViewsSection
                key="views"
                views={views}
                onCommitViews={onCommitViews}
                isOpen={isOpen}
                onToggle={() => setOpenSections((p) => ({ ...p, views: !p.views }))}
                readOnly={!canConfigure}
                constellationId={constellation.id}
              />
            );
          }

          return null;
        })}
      </div>

      <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: `1px solid ${IC.headerDivider}`, background: IC.shell }}>
        {constellationFeedback ? (
          <p className="mb-2 text-center luxia-type-caption" role="status"
            style={{ color: constellationFeedback.type === "error" ? LX.error : LX.success }}>
            {constellationFeedback.message}
          </p>
        ) : null}
        {canConfigure || canEditKnowledge ? (
          <Button
            type="button"
            variant="primary"
            disabled={!constellationDirty || constellationSaving}
            onClick={saveConstellation}
            className="w-full"
          >
            <Check size={16} aria-hidden />
            {constellationSaving ? "Saving…" : "Save Constellation"}
          </Button>
        ) : (
          <p className="text-center luxia-type-caption" style={{ color: IC.textMuted }}>
            Configuration is read-only for your Project role.
          </p>
        )}
      </div>
    </aside>

      {modalSection && (
        <SectionWorkspaceModal
          sectionId={modalSection}
          items={items[modalSection] ?? []}
          instruction={instruction}
          onSave={(newItems, newInstr) => {
            updateItems(modalSection, newItems);
            setInstruction(newInstr);
          }}
          onClose={() => setModalSection(null)}
        />
      )}
      {confirmRemove && (
        <ConfirmRemoveDialog
          label={items[confirmRemove.sid]?.[confirmRemove.idx] ?? ""}
          onConfirm={() => {
            updateItems(confirmRemove.sid, items[confirmRemove.sid].filter((_, j) => j !== confirmRemove.idx));
            setConfirmRemove(null);
          }}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
      {previewItem && (
        <ItemPreviewModal
          label={items[previewItem.sid]?.[previewItem.idx] ?? ""}
          icon={SECTION_META[previewItem.sid].icon}
          onClose={() => setPreviewItem(null)}
        />
      )}

    </div>
  );
}
