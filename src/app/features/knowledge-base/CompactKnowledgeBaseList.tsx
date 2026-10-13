import { BookOpen, ChevronDown, Plus, Search, SquareArrowOutUpRight, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  IC,
  IC_BTN_ICON,
  IC_BTN_OPEN,
  IC_CARD_HEADER,
  IC_INPUT_TEXT,
  IC_SEARCH_SHELL,
  IC_SEARCH_SHELL_STYLE,
  icCardStyle,
  icHoverOff,
  icHoverOn,
  icOpenActiveOn,
  icSearchShellBlur,
  icSearchShellFocus,
  icSearchShellHoverOff,
  icSearchShellHoverOn,
} from "@/app/features/active-data-tables/inspectorTheme";
import { KBEntryMenu } from "@/app/features/kb/KBEntryMenu";
import type { KnowledgeBaseEntry } from "./data";

/**
 * Chat capsule Knowledge Base accordion — compact summary.
 * Header open → full KnowledgeBaseManager. Row … → View / Edit / Delete.
 */
export function CompactKnowledgeBaseList({
  entries,
  isOpen,
  search,
  onSearchChange,
  onToggle,
  onOpenManager,
  onView,
  onEdit,
  onRemove,
  onAdd,
  readOnly = false,
}: {
  entries: KnowledgeBaseEntry[];
  isOpen: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onToggle: () => void;
  onOpenManager: () => void;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onAdd?: () => void;
  readOnly?: boolean;
}) {
  const filtered = entries.filter((entry) =>
    entry.question.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-[14px]" style={icCardStyle(isOpen)}>
      <div className={IC_CARD_HEADER}>
        <BookOpen size={14} color={IC.iconSemantic} className="flex-shrink-0" />
        <span
          className="min-w-0 flex-1 truncate luxia-type-title-component"
          style={{ color: IC.iconSemantic }}
        >
          Knowledge Base
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={IC_BTN_OPEN}
              aria-label={readOnly ? "View Knowledge Base" : "Manage Knowledge Base"}
              onClick={(e) => {
                e.stopPropagation();
                onOpenManager();
              }}
              onMouseEnter={icHoverOn}
              onMouseLeave={icHoverOff}
              onMouseDown={icOpenActiveOn}
              onMouseUp={icHoverOn}
            >
              <SquareArrowOutUpRight size={14} strokeWidth={2} style={{ color: IC.textMuted }} aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>
            {readOnly ? "View Knowledge Base" : "Manage Knowledge Base"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={IC_BTN_ICON}
              aria-label={isOpen ? "Collapse" : "Expand"}
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
          <div
            className={IC_SEARCH_SHELL}
            style={IC_SEARCH_SHELL_STYLE}
            onMouseEnter={icSearchShellHoverOn}
            onMouseLeave={icSearchShellHoverOff}
          >
            <Search size={10} style={{ color: IC.inputIcon }} />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search…"
              className={`flex-1 ${IC_INPUT_TEXT}`}
              style={{ color: IC.textPrimary }}
              onFocus={icSearchShellFocus}
              onBlur={icSearchShellBlur}
              aria-label="Search knowledge base entries"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="flex h-4 w-4 items-center justify-center outline-none"
                aria-label="Clear search"
              >
                <X size={9} style={{ color: IC.inputIcon }} />
              </button>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <p className="px-2 py-2 luxia-type-caption" style={{ color: IC.textMuted }}>
              {search ? "No matches." : "No entries yet."}
            </p>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                className="relative flex items-center gap-1.5 rounded-[7px] px-2 py-1.5"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = IC.hover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <BookOpen size={10} color={IC.iconSemantic} className="flex-shrink-0" />
                <span
                  className="min-w-0 flex-1 truncate luxia-type-caption"
                  style={{ color: IC.textPrimary }}
                >
                  {entry.question}
                </span>
                <div
                  className="relative z-20 flex-shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <KBEntryMenu
                    onView={() => onView(entry.id)}
                    onEdit={!readOnly && onEdit ? () => onEdit(entry.id) : undefined}
                    onRemove={!readOnly && onRemove ? () => onRemove(entry.id) : undefined}
                  />
                </div>
              </div>
            ))
          )}

          {!readOnly && onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="mt-1 flex w-full items-center gap-1.5 rounded-[7px] px-2 py-1.5 luxia-type-caption outline-none transition-colors"
              style={{ color: IC.textMuted }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = IC.hover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Plus size={10} />
              Add Knowledge Entry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
