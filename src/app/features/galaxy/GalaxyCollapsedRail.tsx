import { ChevronLeft, Network } from "lucide-react";
import type { GalaxyActivityStatus } from "./constants";
import { GALAXY_COLLAPSED_WIDTH, GALAXY_PANEL_OUTER_GAP } from "./constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";

/** Collapsed rail — same Luxia galaxy shell family as the expanded panel. */
const RAIL = {
  shell: "var(--luxia-galaxy-shell)",
  shellGradient: "var(--luxia-gradient-galaxy-panel)",
  shellBorder: "rgba(255, 255, 255, 0.06)",
  shellShadow: "0 16px 40px rgba(8, 5, 18, 0.28)",
  iconWell: "var(--luxia-galaxy-surface-raised)",
  active: "var(--luxia-purple-50)",
  icon: "rgba(255, 255, 255, 0.88)",
  chevron: "rgba(255, 255, 255, 0.55)",
  btn: "rgba(255, 255, 255, 0.06)",
  focusRing: "0 0 0 2px rgba(142, 99, 235, 0.28)",
} as const;

export function GalaxyCollapsedRail({
  status,
  onExpand,
}: {
  status?: GalaxyActivityStatus;
  onExpand: () => void;
}) {
  const isActive =
    status === "searching" ||
    status === "matching" ||
    status === "answering" ||
    status === "complete";

  return (
    <div
      className="flex h-full min-h-0 flex-shrink-0 flex-col self-stretch"
      style={{
        width: GALAXY_COLLAPSED_WIDTH + GALAXY_PANEL_OUTER_GAP * 2,
        padding: GALAXY_PANEL_OUTER_GAP,
        boxSizing: "border-box",
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand sidebar"
            aria-expanded={false}
            className="relative flex min-h-0 flex-1 flex-col items-center overflow-hidden outline-none focus-visible:outline-none"
            style={{
              width: GALAXY_COLLAPSED_WIDTH,
              minWidth: GALAXY_COLLAPSED_WIDTH,
              minHeight: 40,
              borderRadius: "var(--luxia-radius-24)",
              backgroundColor: RAIL.shell,
              backgroundImage: RAIL.shellGradient,
              border: `1px solid ${RAIL.shellBorder}`,
              boxShadow: RAIL.shellShadow,
              cursor: "pointer",
              transition: "filter 140ms ease, box-shadow 140ms ease",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `${RAIL.shellShadow}, ${RAIL.focusRing}`;
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = RAIL.shellShadow;
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.filter = "brightness(1.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.filter = "none";
            }}
            data-galaxy-panel="intelligence-collapsed"
          >
            <span
              className="mt-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px]"
              style={{ background: RAIL.btn }}
              aria-hidden
            >
              <ChevronLeft size={16} style={{ color: RAIL.chevron }} strokeWidth={2.2} />
            </span>

            <span
              className="mt-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]"
              style={{ background: RAIL.iconWell }}
              aria-hidden
            >
              <Network size={18} style={{ color: RAIL.icon }} strokeWidth={2} />
            </span>

            {isActive ? (
              <span
                className="mt-3 h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: RAIL.active }}
                aria-hidden
              />
            ) : (
              <span className="mt-3 h-2 w-2 flex-shrink-0" aria-hidden />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">Expand sidebar</TooltipContent>
      </Tooltip>
    </div>
  );
}
