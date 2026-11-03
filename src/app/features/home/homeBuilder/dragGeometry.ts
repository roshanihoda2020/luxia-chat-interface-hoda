import { HOME_TILE_GRID, homeTileBodyHeightPx } from "./grid";
import type { HomeTile } from "./types";

/** A rendered row of other tiles, measured once when a drag starts (px relative to the grid). */
export interface HomeTileRowBand {
  /** Stored row where these tiles start, and where the row ends. */
  y: number;
  end: number;
  top: number;
  bottom: number;
}

export function homeTileColumnPitch(gridWidth: number): number {
  const { columns, gapPx } = HOME_TILE_GRID;
  return (gridWidth - gapPx * (columns - 1)) / columns + gapPx;
}

function collides(a: { x: number; y: number; w: number; h: number }, b: HomeTile): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** How close (in columns) a tile edge must be to a neighbour's edge or the grid edge to snap flush. */
export const HOME_TILE_EDGE_SNAP_COLUMNS = 1;

/**
 * Pulls a tile's column flush against a nearby edge so near-misses don't leave
 * a 1-column gap: the grid's left / right edge, or the facing edge of a tile
 * sharing any of its rows. A tile dropped further away keeps its column, so
 * deliberate gaps stay. Prefers a slot that doesn't overlap anything, then
 * the nearest edge, then the left-hand one.
 */
export function snapHomeTileToEdges(input: {
  x: number;
  y: number;
  w: number;
  h: number;
  others: readonly HomeTile[];
}): number {
  const { x, y, w, h, others } = input;
  const maxX = HOME_TILE_GRID.columns - w;
  const rowMates = others.filter((other) => other.y < y + h && y < other.y + other.h);
  const candidates = new Set<number>([0, maxX]);
  for (const other of rowMates) {
    candidates.add(other.x + other.w); // our left edge against its right edge
    candidates.add(other.x - w); // our right edge against its left edge
  }
  if (candidates.has(x)) return x;

  const isFree = (cx: number) => !rowMates.some((other) => collides({ x: cx, y, w, h }, other));
  const near = [...candidates]
    .filter((cx) => cx >= 0 && cx <= maxX && Math.abs(cx - x) <= HOME_TILE_EDGE_SNAP_COLUMNS)
    .sort((a, b) =>
      Number(isFree(b)) - Number(isFree(a)) || Math.abs(a - x) - Math.abs(b - x) || a - b,
    );
  const best = near[0];
  if (best === undefined) return x;
  // Never trade a free slot for an overlapping one.
  return isFree(best) || !isFree(x) ? best : x;
}

/**
 * Snaps a pointer position to a grid slot for the dragged tile.
 * - Column: nearest column for the tile's left edge, pulled flush against a
 *   neighbour or the grid edge when within one column (see snapHomeTileToEdges).
 * - Row: over a row, the tile goes beside that row's tiles when the columns
 *   are free, or into a free slot lower in the row when the pointer is over
 *   it. If only a smaller size of the dragged tile fits there, it goes
 *   beside at that size (largest of `fitSizes` that fits). Otherwise before
 *   the row (upper half) or after it (lower half).
 *   Between or outside rows it goes after the row above.
 * Returns the slot and the size the tile takes there (its own unless shrunk to fit).
 */
export function snapHomeTileDrop(input: {
  tile: HomeTile;
  others: readonly HomeTile[];
  bands: readonly HomeTileRowBand[];
  gridWidth: number;
  /** Pointer position relative to the grid's top-left corner. */
  pointerX: number;
  pointerY: number;
  /** Where inside the tile the pointer grabbed it (px from the tile's left edge). */
  grabOffsetX: number;
  /** Smaller sizes the tile may take to fit beside a row, largest first. Empty: never shrinks. */
  fitSizes?: ReadonlyArray<{ w: number; h: number }>;
}): { x: number; y: number; w: number; h: number } {
  const { tile, others, bands, gridWidth, pointerX, pointerY, grabOffsetX, fitSizes = [] } = input;
  const pitch = homeTileColumnPitch(gridWidth);
  const leftColumn = Math.max(0, Math.round((pointerX - grabOffsetX) / pitch));

  const at = (y: number, w = tile.w, h = tile.h) => {
    const x = Math.min(leftColumn, HOME_TILE_GRID.columns - w);
    return { x: snapHomeTileToEdges({ x, y, w, h, others }), y, w, h };
  };
  const isFree = (slot: { x: number; y: number; w: number; h: number }) =>
    !others.some((other) => collides(slot, other));

  if (bands.length === 0) return at(0);
  if (pointerY < bands[0].top) return at(bands[0].y);

  const over = bands.filter((band) => pointerY >= band.top && pointerY <= band.bottom).pop();
  if (over) {
    const beside = at(over.y);
    if (isFree(beside)) return beside;
    // A free slot lower inside the row, right under the pointer (e.g. below a Small tile,
    // beside a Medium one). Without this, that slot could never be reached by dragging.
    const rowAtPointer = over.y
      + Math.floor(((pointerY - over.top) / Math.max(1, over.bottom - over.top)) * (over.end - over.y));
    for (let y = over.y + 1; y + tile.h <= over.end; y += 1) {
      if (rowAtPointer < y || rowAtPointer >= y + tile.h) continue;
      const lower = at(y);
      if (isFree(lower)) return lower;
    }
    for (const size of fitSizes) {
      const fitted = at(over.y, size.w, size.h);
      if (isFree(fitted)) return fitted;
    }
    const middle = (over.top + over.bottom) / 2;
    return at(pointerY < middle ? over.y : over.end);
  }

  const above = bands.filter((band) => band.bottom < pointerY).pop() ?? bands[bands.length - 1];
  return at(above.end);
}

/** Column the dragged tile's left edge would snap to for this pointer position (before clamping). */
export function homeTilePointerColumn(gridWidth: number, pointerX: number, grabOffsetX: number): number {
  return Math.max(0, Math.round((pointerX - grabOffsetX) / homeTileColumnPitch(gridWidth)));
}

export interface HomeTileBesideSuggestion {
  /** Where the dragged tile goes, and at which size. */
  tile: { x: number; y: number; w: number; h: number };
  /** The Full-width tile's smaller size and position in the same row. */
  neighbour: { x: number; y: number; w: number; h: number };
}

/**
 * Side-by-side layout for a tile dropped beside a Full-width tile: the
 * Full-width tile takes its largest smaller size that leaves room, and the
 * dragged tile sits on the side the pointer is on (flush against it or the
 * grid edge). The dragged tile keeps its size if possible, else its largest
 * fit size. Null when no combination fits in 12 columns.
 */
export function suggestHomeTileBesideFullWidth(input: {
  /** The dragged tile's own size first, then the smaller sizes it may take. */
  tileSizes: ReadonlyArray<{ w: number; h: number }>;
  neighbour: HomeTile;
  /** Smaller sizes the Full-width tile may take, largest first. */
  neighbourSizes: ReadonlyArray<{ w: number; h: number }>;
  /** Column under the dragged tile's left edge (homeTilePointerColumn). */
  pointerColumn: number;
}): HomeTileBesideSuggestion | null {
  const { tileSizes, neighbour, neighbourSizes, pointerColumn } = input;
  const { columns } = HOME_TILE_GRID;
  for (const size of tileSizes) {
    const shrunk = neighbourSizes.find((option) => option.w + size.w <= columns);
    if (!shrunk) continue;
    const onRight = pointerColumn + size.w / 2 >= columns / 2;
    const neighbourX = onRight ? 0 : columns - shrunk.w;
    // The dragged tile's free span on its side, and the pointer's column clamped into it.
    const minX = onRight ? shrunk.w : 0;
    const maxX = onRight ? columns - size.w : neighbourX - size.w;
    const raw = Math.min(Math.max(pointerColumn, minX), maxX);
    const placedNeighbour = { ...neighbour, x: neighbourX, w: shrunk.w, h: shrunk.h };
    const x = snapHomeTileToEdges({ x: raw, y: neighbour.y, w: size.w, h: size.h, others: [placedNeighbour] });
    return {
      tile: { x: Math.min(Math.max(x, minX), maxX), y: neighbour.y, w: size.w, h: size.h },
      neighbour: { x: neighbourX, y: neighbour.y, w: shrunk.w, h: shrunk.h },
    };
  }
  return null;
}

/**
 * Grid units for a tile drawn at a free (fluid) size while resizing: width
 * from the column pitch, height from the card height that each row count
 * renders at (piecewise between 2, 4 and 8 rows), so snapping on release
 * picks the preset that looks closest to what the user drew.
 */
export function measureHomeTileFluidSize(input: {
  gridWidth: number;
  widthPx: number;
  /** Card (body) height, excluding the outer section heading. */
  bodyHeightPx: number;
  withSectionHeader: boolean;
}): { w: number; h: number } {
  const pitch = homeTileColumnPitch(input.gridWidth);
  const w = (input.widthPx + HOME_TILE_GRID.gapPx) / pitch;
  const stops = [2, 4, 8].map((rows) => ({ rows, px: homeTileBodyHeightPx(rows, input.withSectionHeader) }));
  const body = Math.max(0, input.bodyHeightPx);
  if (body <= stops[0].px) return { w, h: (stops[0].rows * body) / stops[0].px };
  for (let index = 1; index < stops.length; index += 1) {
    const low = stops[index - 1];
    const high = stops[index];
    if (body <= high.px || index === stops.length - 1) {
      return { w, h: low.rows + ((body - low.px) * (high.rows - low.rows)) / (high.px - low.px) };
    }
  }
  return { w, h: stops[stops.length - 1].rows };
}
