import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";

/**
 * Admin tables use the full LuxiaPageFrame width (standard max 1920 + gutters).
 * Do not add a second nested max-width island.
 */
export const ADMIN_PIPELINES_CONTENT_CLASS = "w-full min-w-0";

export const ADMIN_SURFACE = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

/**
 * Truncated table text that only shows a tooltip when the value is actually
 * overflowing (scrollWidth > clientWidth). Avoids duplicate hover copy for
 * fully visible cells.
 */
export function AdminTruncateText({
  children,
  className,
  tooltip,
}: {
  children: string;
  className?: string;
  tooltip?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [open, setOpen] = useState(false);
  const tip = tooltip ?? children;

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) {
      setTruncated(false);
      return;
    }
    // Sub-pixel rounding can leave a fractional delta when not truncated.
    setTruncated(el.scrollWidth - el.clientWidth > 1);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [children, className, measure]);

  useEffect(() => {
    if (!truncated) setOpen(false);
  }, [truncated]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [measure, children]);

  return (
    <Tooltip
      delayDuration={300}
      open={truncated && open}
      onOpenChange={(next) => {
        if (!truncated) {
          setOpen(false);
          return;
        }
        setOpen(next);
      }}
    >
      <TooltipTrigger asChild>
        <p ref={ref} className={cn("min-w-0 truncate", className)}>
          {children}
        </p>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-sm break-words">
        {tip}
      </TooltipContent>
    </Tooltip>
  );
}

export function AdminTableShell({
  columns,
  children,
  minWidth = "48rem",
}: {
  columns: string;
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className={`${ADMIN_SURFACE} overflow-x-auto`}>
      <div
        className="min-w-0"
        style={
          {
            "--admin-pipe-cols": columns,
            minWidth,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}

export function AdminTableHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-center gap-x-3 border-b border-[var(--luxia-border-subtle)] bg-[var(--luxia-settings-section-bg)] px-4 py-2.5",
        className,
      )}
      style={{ gridTemplateColumns: "var(--admin-pipe-cols)" }}
      role="row"
    >
      {children}
    </div>
  );
}

export function AdminTableHeaderCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "luxia-type-caption font-medium uppercase tracking-wide text-[var(--luxia-text-muted)]",
        className,
      )}
      role="columnheader"
    >
      {children}
    </div>
  );
}

export function AdminTableRow({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-center gap-x-3 border-b border-[var(--luxia-border-subtle)] px-4 py-3 last:border-b-0 hover:bg-[var(--luxia-surface-subtle)]",
        className,
      )}
      style={{ gridTemplateColumns: "var(--admin-pipe-cols)" }}
      role="row"
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={`${ADMIN_SURFACE} flex flex-col items-start gap-3 px-5 py-10`}>
      <p className="luxia-type-body font-medium text-[var(--luxia-text-primary)]">{title}</p>
      <p className="max-w-lg luxia-type-body-small text-[var(--luxia-text-secondary)]">
        {description}
      </p>
      {action}
    </div>
  );
}

export function AdminErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={`${ADMIN_SURFACE} flex flex-col items-start gap-3 border-[var(--luxia-error)]/30 px-5 py-8`}
      role="alert"
    >
      <p className="luxia-type-body font-medium text-[var(--luxia-text-primary)]">{title}</p>
      <p className="max-w-lg luxia-type-body-small text-[var(--luxia-text-secondary)]">
        {description}
      </p>
      {action}
    </div>
  );
}

export function AdminLoadingState({ label }: { label: string }) {
  return (
    <div className={`${ADMIN_SURFACE} px-5 py-10`} role="status" aria-live="polite">
      <p className="luxia-type-body-small text-[var(--luxia-text-secondary)]">{label}</p>
    </div>
  );
}
