import { ChevronDown, Layers, Plus, SquareArrowOutUpRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { TableRowMenu } from "@/app/features/active-data-tables/TableRowMenu";
import {
  IC,
  IC_BTN_ICON,
  IC_BTN_OPEN,
  IC_CARD_HEADER,
  icCardStyle,
  icHoverOff,
  icHoverOn,
  icOpenActiveOn,
} from "@/app/features/active-data-tables/inspectorTheme";
import type { DataTableRecord } from "@/app/features/active-data-tables/types";

/**
 * Chat capsule Views accordion — compact summary.
 * Header open → full Views manager. Row menu → View data / edit / configure / remove.
 */
export function CompactViewsList({
  views,
  isOpen,
  onToggle,
  onOpenManager,
  onView,
  onEditDetails,
  onConfigureColumns,
  onRemove,
  readOnly = false,
}: {
  views: DataTableRecord[];
  isOpen: boolean;
  onToggle: () => void;
  onOpenManager: () => void;
  onView: (viewId: string) => void;
  onEditDetails?: (viewId: string) => void;
  onConfigureColumns?: (viewId: string) => void;
  onRemove?: (viewId: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div style={icCardStyle(isOpen)}>
      <div className={IC_CARD_HEADER}>
        <Layers size={14} color={IC.iconSemantic} className="flex-shrink-0" />
        <span className="min-w-0 flex-1 truncate luxia-type-title-component" style={{ color: IC.iconSemantic }}>
          Views
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={IC_BTN_OPEN}
              aria-label={readOnly ? "View Views" : "Open Views"}
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
            {readOnly ? "View Views" : "Open Views"}
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
          {views.length === 0 ? (
            <p className="px-2 py-2 luxia-type-caption" style={{ color: IC.textMuted }}>
              No Views selected.
            </p>
          ) : (
            views.map((view) => (
              <div
                key={view.id}
                className="flex items-center gap-1.5 rounded-[7px] px-2 py-1.5 transition-colors"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = IC.hover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Layers size={10} color={IC.iconSemantic} className="flex-shrink-0" />
                <span className="min-w-0 flex-1 truncate luxia-type-caption select-none" style={{ color: IC.textPrimary }}>
                  {view.displayName}
                </span>
                <div
                  className="relative z-20 flex-shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <TableRowMenu
                    entityKind="view"
                    onView={() => onView(view.id)}
                    onEditDetails={
                      !readOnly && onEditDetails
                        ? () => onEditDetails(view.id)
                        : undefined
                    }
                    onConfigureColumns={
                      !readOnly && onConfigureColumns
                        ? () => onConfigureColumns(view.id)
                        : undefined
                    }
                    onRemove={
                      !readOnly && onRemove
                        ? () => onRemove(view.id)
                        : undefined
                    }
                  />
                </div>
              </div>
            ))
          )}

          {!readOnly ? (
            <button
              type="button"
              onClick={onOpenManager}
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
              Manage Views
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
