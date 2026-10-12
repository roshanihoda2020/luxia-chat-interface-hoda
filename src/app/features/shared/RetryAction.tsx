import { BusyButton } from "@/app/features/shared/Loading";
import { cn } from "@/app/components/ui/utils";

export type RetryActionProps = {
  onRetry: () => void;
  /** Accessible button label when idle. Default: "Retry" */
  label?: string;
  disabled?: boolean;
  busy?: boolean;
  /** Accessible name (and BusyButton busy label) while busy. Default: "Retrying…" */
  busyLabel?: string;
  className?: string;
};

/**
 * Compact retry control for list/table failure regions.
 * Reuses BusyButton — does not invent a second loading pattern.
 */
export function RetryAction({
  onRetry,
  label = "Retry",
  disabled = false,
  busy = false,
  busyLabel = "Retrying…",
  className,
}: RetryActionProps) {
  return (
    <BusyButton
      type="button"
      variant="outline"
      size="compact"
      busy={busy}
      busyLabel={busyLabel}
      busyText={busyLabel}
      disabled={disabled}
      onClick={onRetry}
      className={cn("px-3", className)}
    >
      {label}
    </BusyButton>
  );
}
