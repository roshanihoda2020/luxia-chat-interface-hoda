import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { LuxiaArrowRightIcon } from "@/assets/icons";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileSurface,
  type HomeTileDensity,
} from "./HomeTileSurface";

/** Collection tiles also have a Full-width (12 × 4) presentation. */
export type HomeCollectionDensity = HomeTileDensity | "wide";

export interface HomeCollectionItem {
  id: string;
  title: string;
  /** One muted line under the title (e.g. "Constellation name 01 · Project name 01"). */
  meta?: string;
  /** Right-hand detail from Large up (e.g. "Updated 2h ago"). */
  aside?: string;
  /** Short label beside the title (e.g. "PDF", "Inactive"). */
  badge?: string;
  /** Card layout only: a second muted line under `meta` (e.g. "Latest: Output name 01"). */
  detail?: string;
  /** Accessible name of the row's action (e.g. "Open Galaxy for Project name 01"). */
  openLabel: string;
  onOpen: () => void;
  /** Card layout only: a real preview shown above the title (e.g. a saved output). */
  preview?: ReactNode;
  /** Rows only: a per-item visual instead of the shared item icon (e.g. a Vidget's character). */
  leading?: ReactNode;
}

export interface HomeCollectionEmptyState {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}

/**
 * Most items each size offers (Full width spreads them over three columns).
 * Arranged on the grid, the tile shows only as many as fit its slot (see
 * useFittingCount); these are upper bounds, never a reason to grow the tile.
 */
const ROWS: Record<HomeCollectionDensity, number> = { small: 2, medium: 5, large: 6, wide: 12 };

/**
 * How many of `candidate` list items fit the list area without growing the
 * card. Renders all candidates, measures before paint, then keeps the ones
 * that end inside the area (at least one); re-measures when the area resizes.
 * Unconstrained (stacked tiles follow their content) everything fits.
 */
export function useFittingCount(candidate: number, resetKey: string) {
  const areaRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [fit, setFit] = useState<number | null>(null);

  useLayoutEffect(() => {
    setFit(null);
  }, [candidate, resetKey]);

  useLayoutEffect(() => {
    const area = areaRef.current;
    const list = listRef.current;
    if (!area || !list) return;
    const limit = area.getBoundingClientRect().bottom + 0.5;
    if (fit !== null) {
      // The "+N more" footer appears once rows are trimmed and takes some height: drop one more if needed.
      const last = list.lastElementChild;
      if (fit > 1 && last && last.getBoundingClientRect().bottom > limit) setFit(fit - 1);
      return;
    }
    let count = 0;
    for (const row of Array.from(list.children)) {
      if (row.getBoundingClientRect().bottom > limit) break;
      count += 1;
    }
    setFit(Math.max(Math.min(1, candidate), count));
  });

  useEffect(() => {
    const area = areaRef.current;
    if (!area || typeof ResizeObserver === "undefined") return;
    let lastHeight = area.clientHeight;
    let lastWidth = area.clientWidth;
    const observer = new ResizeObserver(() => {
      if (Math.abs(area.clientHeight - lastHeight) < 1 && Math.abs(area.clientWidth - lastWidth) < 1) return;
      lastHeight = area.clientHeight;
      lastWidth = area.clientWidth;
      setFit(null);
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  return { areaRef, listRef, count: fit ?? candidate };
}
/**
 * Card layout (Large / Full width): up to two rows of preview cards. With a
 * second row the previews are shorter (.luxia-home-card-previews-compact), so
 * both rows fit the tile's height and little of it is left empty.
 */
const CARD_LAYOUT: Record<"large" | "wide", { cards: number; perRow: number; columns: string }> = {
  large: { cards: 4, perRow: 2, columns: "grid-cols-2" },
  wide: { cards: 8, perRow: 4, columns: "grid-cols-4" },
};

const ROW_BUTTON =
  "flex w-full min-w-0 items-center gap-2.5 rounded-[6px] px-1 py-1.5 text-left outline-none hover:bg-[var(--home-tile-row-hover)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      className="shrink-0 rounded-[6px] px-1.5 py-px luxia-type-caption"
      style={{ color: HT.secondary, background: HT.chipBg, border: `1px solid ${HT.chipBorder}` }}
    >
      {children}
    </span>
  );
}

function ItemRow({
  item,
  itemIcon,
  showAside,
  compact,
}: {
  item: HomeCollectionItem;
  itemIcon?: (size: number) => ReactNode;
  showAside: boolean;
  compact: boolean;
}) {
  return (
    <button type="button" onClick={item.onOpen} aria-label={item.openLabel} className={ROW_BUTTON}>
      {item.leading ? (
        <span className="shrink-0" aria-hidden>{item.leading}</span>
      ) : itemIcon ? (
        <span className="shrink-0" style={{ color: HT.icon }} aria-hidden>{itemIcon(14)}</span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={item.title}>
            {item.title}
          </span>
          {item.badge && !compact ? <Badge>{item.badge}</Badge> : null}
        </span>
        {item.meta && !compact ? (
          <span className="block truncate luxia-type-caption" style={{ color: HT.muted }} title={[item.meta, item.detail].filter(Boolean).join(" · ")}>
            {[item.meta, item.detail].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </span>
      {showAside && item.aside ? (
        <span className="shrink-0 luxia-type-caption" style={{ color: HT.secondary }}>
          {item.aside}
        </span>
      ) : null}
    </button>
  );
}

/** `showDetail` false (two compact rows): the second line stays in the tooltip so both rows fit. */
function ItemCard({ item, showDetail = true }: { item: HomeCollectionItem; showDetail?: boolean }) {
  const lines = [item.meta, item.detail].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={item.onOpen}
      aria-label={item.openLabel}
      className="flex h-full w-full min-w-0 flex-col gap-2 rounded-[10px] p-2.5 text-left outline-none transition-colors hover:bg-[var(--home-tile-panel-hover)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
      style={{ background: HT.panel }}
    >
      {item.preview ? <span className="block min-w-0">{item.preview}</span> : null}
      <span className="min-w-0">
        <span className="block truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={item.title}>
          {item.title}
        </span>
        {item.meta ? (
          <span className="block truncate luxia-type-caption" style={{ color: HT.muted }} title={lines}>
            {item.meta}
          </span>
        ) : null}
        {item.detail && showDetail ? (
          <span className="block truncate luxia-type-caption" style={{ color: HT.muted }} title={lines}>
            {item.detail}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * Shared shell for collection Home Tiles: a count line, the first items of an
 * already-ordered list, "View all" when Luxia has a page for the whole
 * collection, and an empty state that explains what will appear — the tile is
 * never hidden. Rows suit most categories; `cards` suits content with a real
 * preview (e.g. Dashboard outputs): up to two rows of preview cards. Small shows the count and two names; Medium a short list; Large
 * adds detail; Full width spreads the list over three columns.
 */
export function CollectionHomeTile({
  density,
  label,
  icon,
  itemIcon,
  items,
  summary,
  smallSummary,
  empty,
  viewAll,
  layout = "rows",
}: {
  density: HomeCollectionDensity;
  /** Accessible name for the card (e.g. "Chats collection"). */
  label: string;
  /** Category icon for the card's corner. */
  icon: (size: number) => ReactNode;
  /** Small icon before each row's title. */
  itemIcon?: (size: number) => ReactNode;
  /** Every item to offer, already ordered; the tile shows as many as its size fits. */
  items: readonly HomeCollectionItem[];
  /** What the list is and how it is ordered (e.g. "6 Chats · most recently opened first"). */
  summary: string;
  /** Small tiles: a shorter count line that fits (e.g. "6 Chats"); the full summary stays as its tooltip. */
  smallSummary?: string;
  empty: HomeCollectionEmptyState;
  viewAll?: { label: string; ariaLabel?: string; onClick: () => void };
  layout?: "rows" | "cards";
}) {
  const surfaceDensity: HomeTileDensity = density === "wide" ? "large" : density;
  const corner = { icon };
  const cardLayout = layout === "cards" && (density === "large" || density === "wide") ? CARD_LAYOUT[density] : null;
  const candidate = Math.min(items.length, cardLayout ? cardLayout.cards : ROWS[density]);
  // Previews stay compact whenever two rows were offered, so trimming to fit never changes card heights.
  const compactPreviews = Boolean(cardLayout && candidate > cardLayout.perRow);
  const { areaRef, listRef, count } = useFittingCount(candidate, `${density}|${layout}|${items.map((item) => item.id).join(",")}`);
  const shown = items.slice(0, count);
  const hidden = items.length - shown.length;

  const summaryText = density === "small" && smallSummary ? smallSummary : summary;
  const summaryLine = (
    <p className={`truncate luxia-type-caption ${HOME_TILE_CORNER_CLEARANCE[surfaceDensity]}`} style={{ color: HT.muted }} title={summary}>
      {summaryText}
    </p>
  );

  if (items.length === 0) {
    return (
      <HomeTileSurface density={surfaceDensity} label={label} corner={corner} className={density === "small" ? "justify-center" : ""}>
        <div className={`flex min-w-0 flex-1 flex-col ${density === "small" ? "justify-center" : "justify-center gap-1"} ${HOME_TILE_CORNER_CLEARANCE[surfaceDensity]}`}>
          <p className="luxia-type-body-dense-strong" style={{ color: HT.title }}>{empty.title}</p>
          <p className={`${density === "small" ? "line-clamp-2" : ""} luxia-type-caption`} style={{ color: HT.secondary }}>
            {empty.body}
          </p>
          {empty.action && density !== "small" ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={empty.action.onClick}
                className="inline-flex items-center gap-1 rounded-[6px] px-1 luxia-type-body-dense-strong outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                style={{ color: HT.link }}
              >
                {empty.action.label}
                <LuxiaArrowRightIcon size={13} color="currentColor" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      </HomeTileSurface>
    );
  }

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={label} corner={corner}>
        {summaryLine}
        {/* Rows sit below the corner, so they use the full width; no row icon (the corner shows the category). */}
        <div ref={areaRef} className="mt-1 min-h-0 flex-1 overflow-hidden">
          <ul ref={listRef} className="min-w-0" aria-label={label}>
            {shown.map((item) => (
              <li key={item.id} className="min-w-0">
                <ItemRow item={item} showAside={false} compact />
              </li>
            ))}
          </ul>
        </div>
      </HomeTileSurface>
    );
  }

  const columns = cardLayout ? cardLayout.columns : density === "wide" ? "grid-cols-3" : "grid-cols-1";

  return (
    <HomeTileSurface density={surfaceDensity} label={label} corner={corner}>
      {summaryLine}
      {/* The list takes the space between the count line and the footer; rows that wouldn't fit aren't shown. */}
      <div ref={areaRef} className="mt-2 min-h-0 flex-1 overflow-hidden">
      <ul
        ref={listRef}
        className={`grid min-w-0 ${columns} ${cardLayout ? "gap-3" : density === "wide" ? "gap-x-6 gap-y-0.5" : "gap-0.5"} ${compactPreviews ? "luxia-home-card-previews-compact" : ""}`}
        aria-label={label}
      >
        {shown.map((item) => (
          <li key={item.id} className="min-w-0">
            {cardLayout
              ? <ItemCard item={item} showDetail={!compactPreviews} />
              : <ItemRow item={item} itemIcon={itemIcon} showAside={density === "large"} compact={false} />}
          </li>
        ))}
      </ul>
      </div>

      {viewAll || hidden > 0 ? (
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="luxia-type-caption" style={{ color: HT.muted }}>
            {hidden > 0 && !viewAll ? `+${hidden} more` : ""}
          </span>
          {viewAll ? (
            <button
              type="button"
              onClick={viewAll.onClick}
              aria-label={viewAll.ariaLabel}
              className="inline-flex items-center gap-1 rounded-[6px] px-1 luxia-type-body-dense-strong outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
              style={{ color: HT.link }}
            >
              {viewAll.label}
              <LuxiaArrowRightIcon size={13} color="currentColor" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
    </HomeTileSurface>
  );
}
