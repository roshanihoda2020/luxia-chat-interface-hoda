import { Button } from "@/app/components/ui/button";
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
    <Button
      type="button"
      variant="link"
      onClick={onClick}
      aria-label={ariaLabel}
      className="luxia-type-body-small-strong"
      style={{ color: HS.viewAllText }}
    >
      {label}
    </Button>
  );
}
