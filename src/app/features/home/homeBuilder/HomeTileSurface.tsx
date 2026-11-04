import { createContext, useContext, type ReactNode } from "react";
import type { HomeTileSurfaceStyle } from "./types";
import "./homeTileSurfaces.css";

/**
 * Shared Home Tile design language. A tile is one card: Luxia surface,
 * 1px default border, 12px radius (the Home Project card radius), small shadow,
 * and a brand-tinted border on hover. Keyboard focus anywhere inside shows the
 * standard focus ring around the whole card. Its category identity is the
 * corner marker (HomeTileCornerMarker), coloured for the card's surface; the
 * outer section heading names it.
 *
 * Every colour comes from the tile's surface style (Featured / Soft / Default,
 * see homeTileSurfaces.css), read through `--home-tile-*` variables — so each
 * tile is one component that works on all three surfaces.
 */

/** The current tile's card style, provided by the Home Tile Grid for each tile. */
const HomeTileSurfaceContext = createContext<HomeTileSurfaceStyle>("default");
export const HomeTileSurfaceProvider = HomeTileSurfaceContext.Provider;

export function useHomeTileSurface(): HomeTileSurfaceStyle {
  return useContext(HomeTileSurfaceContext);
}

/** Tile colour tokens (set per surface in homeTileSurfaces.css). */
export const HT = {
  title: "var(--home-tile-title)",
  text: "var(--home-tile-text)",
  secondary: "var(--home-tile-text-secondary)",
  muted: "var(--home-tile-text-muted)",
  panel: "var(--home-tile-panel)",
  chipBg: "var(--home-tile-chip-bg)",
  chipBorder: "var(--home-tile-chip-border)",
  accent: "var(--home-tile-accent)",
  link: "var(--home-tile-link)",
  icon: "var(--home-tile-icon)",
  divider: "var(--home-tile-divider)",
} as const;

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
  corner,
}: {
  density: HomeTileDensity;
  children: ReactNode;
  className?: string;
  /** Accessible name for the card region (e.g. "Project Project name 02"). */
  label?: string;
  /** The tile's category identity in the card's top-right corner. */
  corner?: HomeTileCorner;
}) {
  const surface = useHomeTileSurface();
  return (
    <article
      aria-label={label}
      data-home-tile-surface={surface}
      // Surface, border, shadow, hover and focus ring come from .luxia-home-tile-card (homeTileSurfaces.css),
      // so hover and keyboard focus can change them (inline styles would override both).
      className={`luxia-home-tile-card group/tile relative flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--luxia-radius-12)] border ${PADDING[density]} ${className}`.trim()}
    >
      {corner ? <HomeTileCornerMarker density={density} {...corner} /> : null}
      {children}
    </article>
  );
}

/**
 * Outer Home Tile identity: the category icon in the card's top-right corner.
 * Owned by the tile (one per tile); cards nested inside a tile, such as the
 * Project cards in Pinned / Recent projects, keep their own markers instead.
 */
export interface HomeTileCorner {
  /** Renders the category icon at the given pixel size, in `currentColor`. */
  icon: (size: number) => ReactNode;
  /**
   * Defaults to the surface's corner colours (deep purple on Default, brand
   * purple on Soft, light lavender on Featured); Your focus passes the hero's colours.
   */
  tone?: { color: string; background: string };
}

/**
 * Corner geometry. Medium and Large reuse the Home Project card marker exactly
 * (ProjectCornerMarker "supporting": 42px, 19px icon, 0 12 0 16 radius); Small
 * uses a compact 32px version so it never dominates a 136px card.
 */
export const HOME_TILE_CORNER: Record<HomeTileDensity, { boxPx: number; iconPx: number; radius: string }> = {
  small: { boxPx: 32, iconPx: 15, radius: "0 var(--luxia-radius-12) 0 12px" },
  medium: { boxPx: 42, iconPx: 19, radius: "0 var(--luxia-radius-12) 0 16px" },
  large: { boxPx: 42, iconPx: 19, radius: "0 var(--luxia-radius-12) 0 16px" },
};

/** Room content keeps clear of the corner on the card's first row. */
export const HOME_TILE_CORNER_CLEARANCE: Record<HomeTileDensity, string> = {
  small: "pr-6",
  medium: "pr-8",
  large: "pr-8",
};

export function HomeTileCornerMarker({ density, icon, tone }: HomeTileCorner & { density: HomeTileDensity }) {
  const corner = HOME_TILE_CORNER[density];
  return (
    <span
      aria-hidden
      data-home-tile-corner=""
      className="pointer-events-none absolute right-0 top-0 z-[1] flex items-center justify-center"
      style={{
        width: corner.boxPx,
        height: corner.boxPx,
        borderRadius: corner.radius,
        // Surface-aware by default (--home-tile-corner-*, homeTileSurfaces.css); an explicit tone wins.
        color: tone?.color ?? "var(--home-tile-corner-icon)",
        background: tone?.background ?? "var(--home-tile-corner-bg)",
      }}
    >
      {icon(corner.iconPx)}
    </span>
  );
}

/** Small status pill beside a tile title ("Beta", "Archived", "Inactive"). */
export function HomeTileStatus({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-[6px] border px-1.5 py-px luxia-type-caption"
      style={{ borderColor: HT.chipBorder, background: HT.chipBg, color: HT.secondary }}
    >
      {children}
    </span>
  );
}

/** Kind of item ("Project", "Tool"), optionally followed by a status such as "Beta". */
export function HomeTileOverline({ children, status }: { children: ReactNode; status?: string }) {
  return (
    <p className="flex min-w-0 items-center gap-1.5 luxia-type-overline-data" style={{ color: HT.muted }}>
      <span className="truncate">{children}</span>
      {status ? (
        <span
          className="shrink-0 rounded-[6px] border px-1.5 py-px luxia-type-caption normal-case tracking-normal"
          style={{ borderColor: HT.chipBorder, color: HT.secondary }}
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
      style={{ color: HT.title, overflowWrap: "anywhere" }}
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
      // Plain text gets its full wording as a tooltip, in case the line(s) are cut short.
      title={typeof children === "string" ? children : undefined}
      className={`min-w-0 ${clamp} ${lines === 1 ? "luxia-type-caption" : "luxia-type-body-dense"}`}
      style={{
        color: tone === "muted" ? HT.muted : HT.secondary,
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
          <dt className="shrink-0 luxia-type-caption" style={{ color: HT.muted }}>
            {fact.label}
          </dt>
          <dd
            className="min-w-0 truncate text-right luxia-type-body-dense-strong"
            style={{ color: HT.text }}
            title={fact.value}
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Shown when a tile's saved item no longer exists or is no longer accessible.
 * Reveals nothing about it. Optional actions (e.g. "Choose another", "Remove")
 * let the user fix the tile without entering Customize.
 */
export function HomeUnavailableTile({
  typeLabel,
  message = "This item is no longer available to you.",
  actions,
}: {
  typeLabel: string;
  message?: string;
  actions?: Array<{ label: string; ariaLabel?: string; onClick: () => void }>;
}) {
  return (
    <div
      data-home-tile-surface="default"
      data-home-tile-unavailable=""
      className="flex h-full min-w-0 flex-col justify-center gap-1 overflow-hidden rounded-[var(--luxia-radius-12)] border border-dashed px-4 py-3"
      style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}
    >
      <HomeTileOverline>{typeLabel}</HomeTileOverline>
      <HomeTileText lines={2}>{message}</HomeTileText>
      {actions && actions.length > 0 ? (
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              aria-label={action.ariaLabel ?? action.label}
              className="rounded-[4px] luxia-type-label-small underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
              style={{ color: "var(--luxia-purple-60)" }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
