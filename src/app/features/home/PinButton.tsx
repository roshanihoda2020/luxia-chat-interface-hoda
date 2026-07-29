import { Pin } from "lucide-react";
import { HS } from "./homeSurfaces";

interface PinButtonProps {
  pinned: boolean;
  label: string;
  tone?: "light" | "dark";
  /** `project` = compact Project-card control (30–32px). */
  controlSize?: "default" | "hero" | "project";
  onToggle: () => void;
}

export const HERO_CONTROL_HIT =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

export const HERO_HEADER_CONTROL_HIT =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

const PROJECT_CONTROL_HIT =
  "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

export function PinButton({
  pinned,
  label,
  tone = "light",
  controlSize = "default",
  onToggle,
}: PinButtonProps) {
  const isHero = controlSize === "hero";
  const isProject = controlSize === "project";
  const hitClass = isHero
    ? HERO_HEADER_CONTROL_HIT
    : isProject
      ? PROJECT_CONTROL_HIT
      : HERO_CONTROL_HIT;
  const iconSize = isProject ? 15 : 17;

  const idleColor = tone === "dark"
    ? (isHero ? "rgba(255, 255, 255, 0.82)" : "var(--luxia-opacity-white-72)")
    : "var(--luxia-text-secondary)";
  const hoverBg = tone === "dark" ? "var(--luxia-opacity-white-08)" : HS.menuHover;
  const activeColor = tone === "dark"
    ? (isHero ? "var(--luxia-text-inverse)" : "var(--luxia-opacity-white-92)")
    : HS.pinActive;
  const pinnedBg = tone === "dark"
    ? (isHero ? "var(--luxia-opacity-brand-secondary-20)" : "var(--luxia-opacity-white-12)")
    : "var(--luxia-opacity-brand-primary-08)";

  const tooltip = pinned ? "Unpin Project" : "Pin Project";
  const ariaLabel = pinned ? `Unpin ${label}` : `Pin ${label}`;

  return (
    <button
      type="button"
      className={hitClass}
      style={{
        color: pinned ? activeColor : idleColor,
        background: pinned ? pinnedBg : "transparent",
      }}
      title={tooltip}
      aria-label={ariaLabel}
      aria-pressed={pinned}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = pinned ? pinnedBg : "transparent";
      }}
    >
      <Pin size={iconSize} strokeWidth={pinned ? 2.25 : 1.75} fill={pinned ? "currentColor" : "none"} />
    </button>
  );
}
