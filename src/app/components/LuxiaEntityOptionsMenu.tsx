import { Fragment, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";

/**
 * Shared named-entity Options menu item.
 * Prefer omitting unsupported actions; use `disabled` only for approved
 * visual prototypes that must remain non-functional.
 */
export interface LuxiaEntityOptionsItem {
  id: string;
  label: string;
  /** Optional accessible name; defaults to `label`. */
  ariaLabel?: string;
  /** Omit or leave undefined for static/disabled prototype items. */
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separatorBefore?: boolean;
  icon?: ReactNode;
}

export interface LuxiaEntityOptionsMenuProps {
  /** Entity display name used in the accessible trigger label. */
  entityLabel: string;
  /** Entity type word for a11y, e.g. Project, Galaxy, Chat. */
  entityType: string;
  items: LuxiaEntityOptionsItem[];
  /**
   * `icon` — compact utility ellipsis (entity cards / Project header).
   * `text` — outlined page-level “Options” button (Chat workspace header).
   */
  triggerVariant?: "text" | "icon";
  /**
   * `default` — light card / page surfaces (matches Project Pin utility).
   * `onDark` — dark Galaxy feature card.
   */
  tone?: "default" | "onDark";
  /**
   * Override accessible name. Defaults to `{entityType} options`
   * (e.g. “Galaxy options”, “Project options”).
   */
  ariaLabel?: string;
  className?: string;
  align?: "start" | "center" | "end";
}

/** Compact utility hit area — matches Project-card Pin (~30×30). */
export const ENTITY_UTILITY_HIT =
  "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

/**
 * Canonical Options trigger + menu for named-entity surfaces.
 * Gear/settings icons are reserved for real Settings actions — not used here.
 */
export function LuxiaEntityOptionsMenu({
  entityLabel,
  entityType,
  items,
  triggerVariant = "icon",
  tone = "default",
  ariaLabel,
  className,
  align = "end",
}: LuxiaEntityOptionsMenuProps) {
  if (!items.length) return null;

  const resolvedAria = ariaLabel ?? `${entityType} options`;
  const onDark = tone === "onDark";

  const idleColor = onDark
    ? "rgba(198,177,245,0.72)"
    : "var(--luxia-text-secondary)";
  const hoverBg = onDark
    ? "var(--luxia-opacity-white-08)"
    : "var(--luxia-opacity-brand-primary-08)";
  const openBg = onDark
    ? "var(--luxia-opacity-white-12)"
    : "var(--luxia-opacity-brand-primary-08)";

  if (triggerVariant === "text") {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="compact"
            aria-label={resolvedAria}
            aria-haspopup="menu"
            title="Options"
            className={cn(
              "inline-flex shrink-0 items-center gap-2 data-[state=open]:bg-[var(--luxia-opacity-brand-primary-08)]",
              className,
            )}
          >
            <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden />
            Options
          </Button>
        </DropdownMenuTrigger>
        <OptionsMenuContent align={align} items={items} />
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={resolvedAria}
          aria-haspopup="menu"
          title="Options"
          className={cn(ENTITY_UTILITY_HIT, className)}
          style={{
            color: idleColor,
            background: "transparent",
            border: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = hoverBg;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            const expanded = el.getAttribute("aria-expanded") === "true";
            el.style.background = expanded ? openBg : "transparent";
          }}
        >
          <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <OptionsMenuContent align={align} items={items} />
    </DropdownMenu>
  );
}

function OptionsMenuContent({
  align,
  items,
}: {
  align: "start" | "center" | "end";
  items: LuxiaEntityOptionsItem[];
}) {
  return (
    <DropdownMenuContent
      align={align}
      side="bottom"
      sideOffset={6}
      collisionPadding={12}
      className="w-[220px] min-w-[220px] max-w-[240px]"
    >
      {items.map((item) => {
        const isDisabled = item.disabled || !item.onSelect;
        return (
          <Fragment key={item.id}>
            {item.separatorBefore ? <DropdownMenuSeparator className="my-1" /> : null}
              <DropdownMenuItem
                variant={item.destructive ? "destructive" : "default"}
                disabled={isDisabled}
                aria-label={
                  isDisabled
                    ? `${item.ariaLabel ?? item.label} (unavailable)`
                    : (item.ariaLabel ?? item.label)
                }
                className={
                  isDisabled
                    ? undefined
                    : "cursor-pointer luxia-type-body-dense-strong text-[var(--luxia-text-primary)]"
                }
                onSelect={(event) => {
                  if (isDisabled) {
                    event.preventDefault();
                    return;
                  }
                  item.onSelect?.();
                }}
              >
                {item.icon ?? null}
                {item.label}
              </DropdownMenuItem>
          </Fragment>
        );
      })}
    </DropdownMenuContent>
  );
}
