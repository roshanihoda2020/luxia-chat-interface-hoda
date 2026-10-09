import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn } from "@/app/components/ui/utils";
import type { VariantProps } from "class-variance-authority";

/**
 * Luxia loading system — usage rules
 *
 * Skeleton (`LuxiaSkeleton` / `Skeleton`)
 * - Known list/card/table structure is loading for the first time
 * - Prefer matching approximate layout of final content
 *
 * Spinner (`LuxiaSpinner`)
 * - Compact indeterminate work (inline, icon buttons, overlays)
 * - Do not block an entire page when only a row/action is busy
 *
 * Linear progress (`LuxiaLinearProgress`)
 * - Measurable progress (upload, import %, job %)
 * - Always pair with accessible label / aria-valuenow
 *
 * Button busy (`BusyButton` / `buttonBusyProps`)
 * - Prevent double submit; keep width; expose aria-busy + accessible name
 *
 * Background refetch (`RefetchIndicator`)
 * - Do NOT replace existing content with a full-surface spinner
 * - Subtle corner/header indicator while stale data refreshes
 */

export { Skeleton as LuxiaSkeleton };

export function LuxiaSpinner({
  size = 16,
  className,
  label = "Loading",
  ...props
}: {
  size?: number;
  label?: string;
  className?: string;
} & Omit<ComponentProps<"span">, "children">) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      {...props}
    >
      <LoaderCircle
        size={size}
        strokeWidth={1.8}
        className="animate-spin text-[var(--luxia-text-muted)]"
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LuxiaLinearProgress({
  value,
  max = 100,
  label,
  className,
  indicatorClassName,
}: {
  value: number;
  max?: number;
  /** Accessible name, e.g. "Import progress" */
  label: string;
  className?: string;
  indicatorClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(max, value));
  const percent = max === 0 ? 0 : Math.round((clamped / max) * 100);

  return (
    <ProgressPrimitive.Root
      data-slot="luxia-linear-progress"
      value={clamped}
      max={max}
      aria-label={label}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-[var(--luxia-radius-pill)] bg-[var(--luxia-opacity-brand-primary-08)]",
        className,
      )}
    >
      <ProgressPrimitive.Indicator
        data-slot="luxia-linear-progress-indicator"
        className={cn(
          "h-full w-full flex-1 rounded-[var(--luxia-radius-pill)] bg-[var(--luxia-brand-primary)] transition-transform duration-200",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

/** Props to spread onto an existing Button when busy. */
export function buttonBusyProps(busy: boolean, busyLabel?: string) {
  return {
    disabled: busy || undefined,
    "aria-busy": busy || undefined,
    "aria-disabled": busy || undefined,
    ...(busy && busyLabel ? { "aria-label": busyLabel } : {}),
  } as const;
}

type BusyButtonProps = ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & {
    busy?: boolean;
    busyLabel?: string;
    /** Shown while busy; defaults to children (width preserved via invisible clone). */
    busyText?: ReactNode;
  };

/**
 * Primary/secondary actions with loading: spinner + preserved min width.
 */
export function BusyButton({
  busy = false,
  busyLabel,
  busyText,
  children,
  disabled,
  className,
  ...props
}: BusyButtonProps) {
  const label = busyLabel ?? (typeof children === "string" ? children : "Working");

  return (
    <Button
      {...props}
      className={cn("relative", className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-label={busy ? label : props["aria-label"]}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center gap-2",
          busy && "invisible",
        )}
        aria-hidden={busy || undefined}
      >
        {children}
      </span>
      {busy ? (
        <span className="absolute inset-0 inline-flex items-center justify-center gap-2">
          <LoaderCircle
            size={16}
            strokeWidth={1.8}
            className="animate-spin"
            aria-hidden
          />
          {busyText != null ? <span>{busyText}</span> : null}
        </span>
      ) : null}
    </Button>
  );
}

/** Subtle non-blocking refetch cue for lists/panels that keep showing data. */
export function RefetchIndicator({
  active,
  label = "Refreshing",
  className,
}: {
  active: boolean;
  label?: string;
  className?: string;
}) {
  if (!active) return null;

  return (
    <LuxiaSpinner
      size={14}
      label={label}
      className={cn("opacity-80", className)}
    />
  );
}
