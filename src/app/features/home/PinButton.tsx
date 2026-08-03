import { Pin } from "lucide-react";
import { HS } from "./homeSurfaces";

interface PinButtonProps {
  pinned: boolean;
  label: string;
  tone?: "light" | "dark";
  controlSize?: "default" | "hero" | "project";
  onToggle: () => void;
}

export const COMPACT_CONTROL_HIT =
  "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

export const HERO_CONTROL_HIT = COMPACT_CONTROL_HIT;

export const HERO_HEADER_CONTROL_HIT = COMPACT_CONTROL_HIT;

const COMPACT_ICON_SIZE = 14;

export function PinButton({
  pinned,
  label,
  tone = "light",
  controlSize = "default",
  onToggle,
}: PinButtonProps) {
  void controlSize;

  const idleColor = tone === "dark"
    ? "rgba(255, 255, 255, 0.82)"
    : "var(--luxia-text-secondary)";
  const hoverBg = tone === "dark" ? "var(--luxia-opacity-white-08)" : HS.menuHover;
  const activeColor = tone === "dark"
    ? "var(--luxia-text-inverse)"
    : HS.pinActive;
  const pinnedBg = tone === "dark"
    ? "var(--luxia-opacity-brand-secondary-20)"
    : "var(--luxia-opacity-brand-primary-08)";

  const tooltip = pinned ? "Unpin" : "Pin";
  const ariaLabel = pinned ? `Unpin ${label}` : `Pin ${label}`;

  return (
    <button
      type="button"
      className={COMPACT_CONTROL_HIT}
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
      <Pin
        size={COMPACT_ICON_SIZE}
        strokeWidth={pinned ? 2.25 : 1.75}
        fill={pinned ? "currentColor" : "none"}
      />
    </button>
  );
}
