import type { ReactNode } from "react";
import { HS } from "../homeSurfaces";

/**
 * Shared Home Tile design language. A tile is one card: Luxia surface,
 * 1px default border, 12px radius (the Home Project card radius), small shadow,
 * and a brand-tinted border on hover. Keyboard focus anywhere inside shows the
 * standard focus ring around the whole card.
 */

export type HomeTileDensity = "small" | "medium" | "large";

const PADDING: Record<HomeTileDensity, string> = {
  small: "px-4 py-3.5",
  medium: "p-5",
  large: "p-5",
};

export function HomeTileSurface({
  density,
  children,
  className = "",
  label,
}: {
  density: HomeTileDensity;
  children: ReactNode;
  className?: string;
  /** Accessible name for the card region (e.g. "Project Project name 02"). */
  label?: string;
}) {
  return (
    <article
      aria-label={label}
      className={`group/tile relative flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--luxia-radius-12)] border bg-[var(--luxia-surface)] shadow-[var(--luxia-shadow-sm)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--luxia-opacity-brand-primary-24)] hover:shadow-[var(--luxia-shadow-md)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--luxia-border-focus)] ${PADDING[density]} ${className}`.trim()}
      style={{ borderColor: "var(--luxia-border-default)" }}
    >
      {children}
    </article>
  );
}

const ICON_BOX: Record<"sm" | "md" | "lg", string> = {
  sm: "size-9 rounded-[10px]",
  md: "size-10 rounded-[10px]",
  lg: "size-12 rounded-[12px]",
};

/** Brand-tinted icon well used for every tile's identity. */
export function HomeTileIcon({ size = "md", children }: { size?: "sm" | "md" | "lg"; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${ICON_BOX[size]}`}
      style={{ color: HS.projectIcon, background: "var(--luxia-opacity-brand-primary-08)" }}
      aria-hidden
    >
      {children}
    </span>
  );
}

/** Kind of item ("Project", "Tool"), optionally followed by a status such as "Beta". */
export function HomeTileOverline({ children, status }: { children: ReactNode; status?: string }) {
  return (
    <p className="flex min-w-0 items-center gap-1.5 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>
      <span className="truncate">{children}</span>
      {status ? (
        <span
          className="shrink-0 rounded-[6px] border px-1.5 py-px luxia-type-caption normal-case tracking-normal"
          style={{ borderColor: "var(--luxia-border-subtle, var(--luxia-border-default))", color: "var(--luxia-text-secondary)" }}
        >
          {status}
        </span>
      ) : null}
    </p>
  );
}

/**
 * Tile title as its primary navigation. With `stretched`, the click area
 * covers the whole card (for single-action tiles); keep other controls above
 * it with `relative z-[1]`.
 */
export function HomeTileTitleAction({
  title,
  onOpen,
  ariaLabel,
  stretched = false,
  size = "card",
  lines = 1,
}: {
  title: string;
  onOpen: () => void;
  ariaLabel: string;
  stretched?: boolean;
  size?: "dense" | "card";
  lines?: 1 | 2;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ariaLabel}
      title={title}
      className={`max-w-full min-w-0 rounded-[4px] text-left outline-none transition-opacity hover:opacity-90 ${
        // line-clamp sets its own display; "block" would override it and stop the clamp.
        lines === 2 ? "line-clamp-2" : "block truncate"
      } ${size === "dense" ? "luxia-type-body-dense-strong" : "luxia-type-title-card"} ${
        stretched ? "after:absolute after:inset-0 after:content-['']" : "focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
      }`}
      style={{ color: HS.projectTitle, overflowWrap: "anywhere" }}
    >
      {title}
    </button>
  );
}

/** Secondary text line; truncates to one line by default. */
export function HomeTileText({
  children,
  lines = 1,
  tone = "secondary",
}: {
  children: ReactNode;
  lines?: 1 | 2 | 3;
  tone?: "secondary" | "muted";
}) {
  const clamp = lines === 1 ? "truncate" : lines === 2 ? "line-clamp-2" : "line-clamp-3";
  return (
    <p
      className={`min-w-0 ${clamp} ${lines === 1 ? "luxia-type-caption" : "luxia-type-body-dense"}`}
      style={{
        color: tone === "muted" ? "var(--luxia-text-muted)" : "var(--luxia-text-secondary)",
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </p>
  );
}

/** Label / value pairs for real metadata (no invented statistics). */
export function HomeTileFacts({ facts }: { facts: Array<{ label: string; value: string }> }) {
  return (
    <dl className="flex min-w-0 flex-col gap-1.5">
      {facts.map((fact) => (
        <div key={fact.label} className="flex min-w-0 items-baseline justify-between gap-3">
          <dt className="shrink-0 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            {fact.label}
          </dt>
          <dd
            className="min-w-0 truncate text-right luxia-type-body-dense-strong"
            style={{ color: "var(--luxia-text-primary)" }}
            title={fact.value}
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Shown when a tile's saved item no longer exists or is no longer accessible. Reveals nothing about it. */
export function HomeUnavailableTile({ typeLabel }: { typeLabel: string }) {
  return (
    <div
      className="flex h-full min-w-0 flex-col justify-center gap-1 rounded-[var(--luxia-radius-12)] border border-dashed px-4 py-3.5"
      style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}
    >
      <HomeTileOverline>{typeLabel}</HomeTileOverline>
      <HomeTileText lines={2}>This item is no longer available to you.</HomeTileText>
    </div>
  );
}
