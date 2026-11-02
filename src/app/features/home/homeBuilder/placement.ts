import type { HomeTile } from "./types";

export interface HomeTilePlacement {
  tile: HomeTile;
  /** CSS grid row lines (1-based, end exclusive). */
  rowStart: number;
  rowEnd: number;
}

/**
 * Maps stored grid rows onto compact CSS grid tracks. Only rows where a tile
 * starts or ends become track lines, and unused row ranges collapse, so
 * content-height tiles never leave empty gaps. Tile x / w are used as stored.
 * The result is in reading order (row, then column); the stored layout array
 * itself is never reordered.
 */
export function placeHomeTiles(tiles: readonly HomeTile[]): HomeTilePlacement[] {
  const edges = [...new Set(tiles.flatMap((tile) => [tile.y, tile.y + tile.h]))].sort(
    (a, b) => a - b,
  );
  const trackAtEdge = new Map<number, number>();
  let track = 1;
  edges.forEach((edge, index) => {
    trackAtEdge.set(edge, track);
    const next = edges[index + 1];
    if (next === undefined) return;
    const used = tiles.some((tile) => tile.y <= edge && tile.y + tile.h >= next);
    if (used) track += 1;
  });

  return tiles
    .map((tile) => ({
      tile,
      rowStart: trackAtEdge.get(tile.y) ?? 1,
      rowEnd: trackAtEdge.get(tile.y + tile.h) ?? 2,
    }))
    .sort((a, b) => a.rowStart - b.rowStart || a.tile.x - b.tile.x);
}
