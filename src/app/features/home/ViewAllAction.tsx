import { LuxiaArrowRightIcon } from "@/assets/icons";
import { Button } from "@/app/components/ui/button";
import { HS } from "./homeSurfaces";

interface ViewAllActionProps {
  label?: string;
  ariaLabel: string;
  onClick: () => void;
}

/**
 * Shared Luxia text + right-arrow navigation action
 * (same treatment as Project Overview “Open Dashboard”).
 */
export function ViewAllAction({
  label = "View all",
  ariaLabel,
  onClick,
}: ViewAllActionProps) {
  return (
    <Button
      type="button"
      variant="link"
      onClick={onClick}
      aria-label={ariaLabel}
      className="min-h-8 gap-1 luxia-type-body-dense-strong"
      style={{ color: HS.viewAllText }}
    >
      <span>{label}</span>
      <LuxiaArrowRightIcon size={14} aria-hidden color="currentColor" />
    </Button>
  );
}
