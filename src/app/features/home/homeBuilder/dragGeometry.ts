import { HOME_TILE_GRID } from "./grid";
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
 *   are free; otherwise before the row (upper half) or after it (lower half).
 *   Between or outside rows it goes after the row above.
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
}): { x: number; y: number } {
  const { tile, others, bands, gridWidth, pointerX, pointerY, grabOffsetX } = input;
  const pitch = homeTileColumnPitch(gridWidth);
  const x = Math.min(
    Math.max(0, Math.round((pointerX - grabOffsetX) / pitch)),
    HOME_TILE_GRID.columns - tile.w,
  );

  const at = (y: number) => ({
    x: snapHomeTileToEdges({ x, y, w: tile.w, h: tile.h, others }),
    y,
  });

  if (bands.length === 0) return at(0);
  if (pointerY < bands[0].top) return at(bands[0].y);

  const over = bands.filter((band) => pointerY >= band.top && pointerY <= band.bottom).pop();
  if (over) {
    const beside = at(over.y);
    if (!others.some((other) => collides({ ...beside, w: tile.w, h: tile.h }, other))) return beside;
    const middle = (over.top + over.bottom) / 2;
    return at(pointerY < middle ? over.y : over.end);
  }

  const above = bands.filter((band) => band.bottom < pointerY).pop() ?? bands[bands.length - 1];
  return at(above.end);
}

/** Free-form size in grid units from a resize pointer, for snapping to a preset. */
export function measureHomeTileResize(input: {
  gridWidth: number;
  /** Tile body's top-left corner relative to the grid (px). */
  bodyLeft: number;
  bodyTop: number;
  pointerX: number;
  pointerY: number;
}): { w: number; h: number } {
  const pitch = homeTileColumnPitch(input.gridWidth);
  const rowPitch = HOME_TILE_GRID.rowUnitPx + HOME_TILE_GRID.gapPx;
  return {
    w: (input.pointerX - input.bodyLeft + HOME_TILE_GRID.gapPx) / pitch,
    h: (input.pointerY - input.bodyTop + HOME_TILE_GRID.gapPx) / rowPitch,
  };
}
