import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { CloudOff, Inbox, LoaderCircle, Lock } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import { PIPELINE_COMPACT_STATUS_BADGE_CLASS } from "@/app/features/pipelines/format";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import type { AdminAirflowLoadState } from "./types";

const ADMIN_TABLE_BADGE_CLASS = cn(
  PIPELINE_COMPACT_STATUS_BADGE_CLASS,
  "pointer-events-none max-w-full min-w-0 cursor-default select-none truncate shadow-none",
);

type AdminBadgeVariant =
  | "success"
  | "warning"
  | "database"
  | "outline"
  | "secondary";

/**
 * Semantic Badge variants for Pipeline Admin tables.
 * Geometry matches customer Run/Task Flow labels; colors stay concept-specific.
 * - success / positive: Active, Declared, Attached
 * - warning: Paused
 * - config (database): Mapped — purple/configuration, not operational green
 * - neutral / muted / attention: Unmapped, Undeclared, Not attached, Sensitive No
 */
export const ADMIN_TABLE_STATUS_BADGE_VARIANT = {
  success: "success",
  warning: "warning",
  config: "database",
  neutral: "outline",
  positive: "success",
  muted: "outline",
  attention: "outline",
} as const satisfies Record<string, AdminBadgeVariant>;

export const ADMIN_TABLE_META_CHIP_CLASS = ADMIN_TABLE_BADGE_CLASS;

/** @deprecated Prefer ADMIN_TABLE_META_CHIP_CLASS */
export const ADMIN_TABLE_TYPE_META_CLASS = ADMIN_TABLE_META_CHIP_CLASS;

export const ADMIN_TABLE_METADATA_TEXT_CLASS =
  "luxia-type-caption tabular-nums text-[var(--luxia-text-muted)]";

export const ADMIN_TABLE_METADATA_TEXT_STRONG_CLASS =
  "luxia-type-caption tabular-nums text-[var(--luxia-text-secondary)]";

export const ADMIN_TABLE_ROW_ACTION_CLASS =
  "max-w-full shrink whitespace-nowrap";

/**
 * Fixed slot width for Map/Declare labels so short and long actions share one
 * left edge while the action column stays end-aligned.
 * Sized for “Map/Declare for another project” at compact density.
 *
 * Use a fixed track (not max-content): each Admin table row is its own grid, so
 * max-content would size the Action column differently in the header vs body.
 */
export const ADMIN_TABLE_ROW_ACTION_SLOT_CLASS =
  "flex w-full min-w-0 items-center justify-start";

export const ADMIN_TABLE_ROW_ACTION_COL = "11rem";

/** Compact end column for inline icon row actions (up to 3 × 32px + gaps). */
export const ADMIN_TABLE_INLINE_ACTIONS_COL = "6.25rem";

/**
 * Shared grid tracks for Pipeline Admin tables.
 * Keep technical IDs capped, human text flexible, metadata/actions compact.
 * Each row is its own grid — prefer fixed tracks over max-content for alignment.
 */
export const ADMIN_COL_ID = "minmax(8.5rem, 0.95fr)";
/** Primary prose column (Description / Label when it is the flex lead). */
export const ADMIN_COL_TEXT = "minmax(10rem, 2fr)";
/** Secondary readable column (Display name / Label beside Key). */
export const ADMIN_COL_TEXT_SECONDARY = "minmax(7.5rem, 1.15fr)";
/** Organization / Project — shared across DAGs + Variables. */
export const ADMIN_COL_ENTITY = "minmax(6.5rem, 0.85fr)";
/** Compact badge columns (Type, Sensitive, Status). */
export const ADMIN_COL_META = "4.75rem";
/** Mapping / Declaration status meta. */
export const ADMIN_COL_STATUS_META = "5.75rem";
/** Numeric count (Variables / DAGs). */
export const ADMIN_COL_COUNT = "2.75rem";
/** Enabled-actions chip cluster. */
export const ADMIN_COL_CHIPS = "minmax(12rem, 1.35fr)";

/** Shell min-widths — table-local scroll instead of page overflow. */
export const ADMIN_TABLE_MIN_WIDTH_MAPPINGS = "58rem";
export const ADMIN_TABLE_MIN_WIDTH_INVENTORY = "48rem";

/**
 * Stable badge cell: content-width labels share one vertical (left) axis.
 * Do not center variable-width pills — that staggers rows.
 */
export function AdminTableBadgeCell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-start">{children}</div>
  );
}

export function AdminTableRowActionCell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-end">
      <div className={ADMIN_TABLE_ROW_ACTION_SLOT_CLASS}>{children}</div>
    </div>
  );
}

/** Header twin of AdminTableRowActionCell — label shares the action slot axis. */
export function AdminTableRowActionHeaderCell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="flex min-w-0 items-center justify-end"
      role="columnheader"
    >
      <div className={ADMIN_TABLE_ROW_ACTION_SLOT_CLASS}>
        <span className="luxia-type-caption font-medium uppercase tracking-wide text-[var(--luxia-text-muted)]">
          {children}
        </span>
      </div>
    </div>
  );
}

export function AdminTableInlineActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 shrink-0 items-center justify-end gap-0.5">
      {children}
    </div>
  );
}

export function AdminTableIconAction({
  label,
  onClick,
  children,
  destructive = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={destructive ? "destructiveGhost" : "ghost"}
          size="iconCompact"
          className={cn(
            "shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]",
            destructive
              ? undefined
              : "text-[var(--luxia-text-secondary)] hover:bg-[var(--luxia-neutral-100)] hover:text-[var(--luxia-text-primary)]",
          )}
          aria-label={label}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

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

export function AdminTableTypeMeta({ label }: { label: string }) {
  return (
    <Badge variant="outline" className={ADMIN_TABLE_BADGE_CLASS}>
      <span className="truncate">{label}</span>
    </Badge>
  );
}

export function AdminTableCapabilityMeta({ label }: { label: string }) {
  return (
    <Badge variant="secondary" className={ADMIN_TABLE_BADGE_CLASS}>
      <span className="truncate">{label}</span>
    </Badge>
  );
}

export function AdminTableStatusMeta({
  tone,
  children,
  title,
}: {
  tone: keyof typeof ADMIN_TABLE_STATUS_BADGE_VARIANT;
  children: ReactNode;
  title?: string;
}) {
  return (
    <Badge
      variant={ADMIN_TABLE_STATUS_BADGE_VARIANT[tone]}
      className={ADMIN_TABLE_BADGE_CLASS}
      title={title}
    >
      <span className="truncate">{children}</span>
    </Badge>
  );
}

export function AdminTableMetadataText({
  children,
  strong,
  className,
}: {
  children: ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        strong ? ADMIN_TABLE_METADATA_TEXT_STRONG_CLASS : ADMIN_TABLE_METADATA_TEXT_CLASS,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AdminTableSensitiveMeta({ sensitive }: { sensitive: boolean }) {
  if (!sensitive) {
    return (
      <Badge
        variant="outline"
        className={ADMIN_TABLE_BADGE_CLASS}
        aria-label="Not sensitive"
      >
        No
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={cn(
        ADMIN_TABLE_BADGE_CLASS,
        "text-[var(--luxia-text-primary)]",
      )}
      aria-label="Sensitive"
    >
      <Lock className="size-[11px] shrink-0 opacity-75" strokeWidth={2} aria-hidden />
      <span>Yes</span>
    </Badge>
  );
}

export function AdminTableCountMeta({
  count,
  emptyLabel = "—",
  tooltip,
  emptyTooltip,
}: {
  count: number;
  emptyLabel?: string;
  tooltip?: string;
  emptyTooltip?: string;
}) {
  if (count === 0) {
    const tip = emptyTooltip ?? tooltip;
    if (!tip) {
      return <AdminTableMetadataText>{emptyLabel}</AdminTableMetadataText>;
    }
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={cn(ADMIN_TABLE_METADATA_TEXT_CLASS, "cursor-default")}>
            {emptyLabel}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="max-w-xs">
          {tip}
        </TooltipContent>
      </Tooltip>
    );
  }
  const label = String(count);
  if (!tooltip) {
    return <AdminTableMetadataText strong>{label}</AdminTableMetadataText>;
  }
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span
          className={cn(
            ADMIN_TABLE_METADATA_TEXT_STRONG_CLASS,
            "cursor-default",
          )}
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export function AdminTableRowAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={ADMIN_TABLE_ROW_ACTION_CLASS}
      onClick={onClick}
    >
      {children}
    </Button>
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
        "grid items-center gap-x-3 border-b border-[var(--luxia-border-subtle)] bg-[var(--luxia-settings-section-bg)] px-4 py-2",
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
        "grid items-center gap-x-3 border-b border-[var(--luxia-border-subtle)] px-4 py-2.5 last:border-b-0 hover:bg-[var(--luxia-surface-subtle)]",
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

const ADMIN_INVENTORY_STATE_SHELL_CLASS = `${ADMIN_SURFACE} min-h-[7.5rem] px-4 py-7 sm:px-5 sm:py-8`;

const ADMIN_INVENTORY_STATE_COPY_CLASS = "max-w-md space-y-1.5";

type AdminInventoryStateKind = "loading" | "empty" | "error";

function AdminInventoryStatePanel({
  kind,
  title,
  description,
  action,
  role,
  "aria-live": ariaLive,
}: {
  kind: AdminInventoryStateKind;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  role?: "alert" | "status";
  "aria-live"?: "polite" | "assertive" | "off";
}) {
  const icon =
    kind === "loading" ? (
      <LoaderCircle
        className="size-[1.125rem] shrink-0 text-[var(--luxia-text-muted)] animate-spin"
        strokeWidth={2}
        aria-hidden
      />
    ) : kind === "error" ? (
      <CloudOff
        className="size-[1.125rem] shrink-0 text-[var(--luxia-text-muted)]"
        strokeWidth={2}
        aria-hidden
      />
    ) : (
      <Inbox
        className="size-[1.125rem] shrink-0 text-[var(--luxia-text-muted)]"
        strokeWidth={2}
        aria-hidden
      />
    );

  return (
    <div
      className={ADMIN_INVENTORY_STATE_SHELL_CLASS}
      role={role}
      aria-live={ariaLive}
    >
      <div className={ADMIN_INVENTORY_STATE_COPY_CLASS}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex shrink-0">{icon}</span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="luxia-type-body font-medium text-[var(--luxia-text-primary)]">
              {title}
            </p>
            {description ? (
              <div className="luxia-type-body-small text-[var(--luxia-text-secondary)] [&>p+p]:mt-1.5">
                {description}
              </div>
            ) : null}
            {action ? <div className="pt-2.5">{action}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <AdminInventoryStatePanel
      kind="empty"
      title={title}
      description={description}
      action={action}
    />
  );
}

export function AdminErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <AdminInventoryStatePanel
      kind="error"
      title={title}
      description={description}
      action={action}
      role="alert"
    />
  );
}

export function AdminLoadingState({ label }: { label: string }) {
  return (
    <AdminInventoryStatePanel
      kind="loading"
      title={label}
      description=""
      role="status"
      aria-live="polite"
    />
  );
}

export function isAirflowInventoryFilterDisabled(
  airflowState: AdminAirflowLoadState,
  inventoryCount: number,
): boolean {
  if (
    airflowState === "loading"
    || airflowState === "unavailable"
    || airflowState === "empty"
  ) {
    return true;
  }
  return airflowState === "ready" && inventoryCount === 0;
}

export function isAirflowInventoryEmpty(
  airflowState: AdminAirflowLoadState,
  inventoryCount: number,
): boolean {
  return airflowState === "empty" || (airflowState === "ready" && inventoryCount === 0);
}
