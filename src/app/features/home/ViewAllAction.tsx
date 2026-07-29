import { HS } from "./homeSurfaces";

interface ViewAllActionProps {
  label?: string;
  ariaLabel: string;
  onClick: () => void;
}

export function ViewAllAction({
  label = "View all",
  ariaLabel,
  onClick,
}: ViewAllActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="rounded-[8px] px-2.5 py-1.5 luxia-type-body-small-strong outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
      style={{ color: HS.viewAllText, background: HS.viewAllBg }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = HS.viewAllHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = HS.viewAllBg;
      }}
    >
      {label}
    </button>
  );
}
