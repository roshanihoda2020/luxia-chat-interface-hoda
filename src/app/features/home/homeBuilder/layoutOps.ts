import { HOME_TILE_GRID, getHomeTileSizePreset } from "./grid";
import { getHomeTileDefinition } from "./registry";
import type {
  HomeLayout,
  HomeTile,
  HomeTileSize,
  HomeTileSurfaceStyle,
  HomeTileTarget,
  HomeTileType,
} from "./types";

/** Unique, stable once created; never derived from position or content. */
export function createHomeTileId(type: HomeTileType): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${type}-${Date.now().toString(36)}-${random}`;
}

function overlaps(a: Pick<HomeTile, "x" | "y" | "w" | "h">, b: HomeTile): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/**
 * First free slot scanning rows top to bottom, then columns left to right.
 * Existing tiles never move. Falls back to a new row below everything.
 */
export function findOpenHomeTileSlot(
  tiles: readonly HomeTile[],
  w: number,
  h: number,
): { x: number; y: number } {
  const bottom = tiles.reduce((max, tile) => Math.max(max, tile.y + tile.h), 0);
  for (let y = 0; y <= bottom; y += 1) {
    for (let x = 0; x + w <= HOME_TILE_GRID.columns; x += 1) {
      const candidate = { x, y, w, h };
      if (!tiles.some((tile) => overlaps(candidate, tile))) return { x, y };
    }
  }
  return { x: 0, y: bottom };
}

export function countHomeTilesOfType(layout: HomeLayout, type: HomeTileType): number {
  return layout.tiles.filter((tile) => tile.type === type).length;
}

export function canAddHomeTileType(layout: HomeLayout, type: HomeTileType): boolean {
  const max = getHomeTileDefinition(type).maxInstances;
  return max === undefined || countHomeTilesOfType(layout, type) < max;
}

export function isHomeTileTargetOnLayout(
  layout: HomeLayout,
  type: HomeTileType,
  target: HomeTileTarget,
): boolean {
  return layout.tiles.some(
    (tile) =>
      tile.type === type
      && tile.target?.scope === target.scope
      && tile.target.entityId === target.entityId,
  );
}

/** Returns a new layout with the tile appended at its default size in the first free slot. */
export function addHomeTile(
  layout: HomeLayout,
  type: HomeTileType,
  target?: HomeTileTarget,
): { layout: HomeLayout; tile: HomeTile } {
  const definition = getHomeTileDefinition(type);
  const size = getHomeTileSizePreset(definition.defaultSize);
  const slot = findOpenHomeTileSlot(layout.tiles, size.w, size.h);
  const tile: HomeTile = {
    id: createHomeTileId(type),
    type,
    ...(target ? { target } : {}),
    x: slot.x,
    y: slot.y,
    w: size.w,
    h: size.h,
    config: { ...definition.defaultConfig },
  };
  return { layout: { ...layout, tiles: [...layout.tiles, tile] }, tile };
}

/**
 * Points an existing tile at a different item (Configure Tile). The tile keeps
 * its id, position, size and configuration; only its target changes. Returns
 * the layout unchanged when the tile is missing or the target doesn't suit it.
 */
export function replaceHomeTileTarget(layout: HomeLayout, tileId: string, target: HomeTileTarget): HomeLayout {
  const tile = layout.tiles.find((entry) => entry.id === tileId);
  if (!tile || !getHomeTileDefinition(tile.type).targetScopes.includes(target.scope)) return layout;
  return {
    ...layout,
    tiles: layout.tiles.map((entry) => (entry.id === tileId ? { ...entry, target: { ...target } } : entry)),
  };
}

/**
 * Sets a tile's card style. The style lives in the tile's config, so it stays
 * with the tile through moves, resizes and item changes. Choosing the type's
 * default style removes the key, keeping the saved layout minimal.
 */
export function setHomeTileSurface(layout: HomeLayout, tileId: string, surface: HomeTileSurfaceStyle): HomeLayout {
  const tile = layout.tiles.find((entry) => entry.id === tileId);
  if (!tile) return layout;
  const typeDefault = getHomeTileDefinition(tile.type).defaultSurface ?? "default";
  const { surface: _previous, ...rest } = tile.config;
  const config = surface === typeDefault ? rest : { ...rest, surface };
  if (JSON.stringify(config) === JSON.stringify(tile.config)) return layout;
  return {
    ...layout,
    tiles: layout.tiles.map((entry) => (entry.id === tileId ? { ...entry, config } : entry)),
  };
}

/** Configure Tile: a different item and/or style, applied together (one save, one Undo). */
export function configureHomeTile(
  layout: HomeLayout,
  tileId: string,
  changes: { target?: HomeTileTarget; surface?: HomeTileSurfaceStyle },
): HomeLayout {
  let next = layout;
  if (changes.target) next = replaceHomeTileTarget(next, tileId, changes.target);
  if (changes.surface) next = setHomeTileSurface(next, tileId, changes.surface);
  return next;
}

/** Removes a tile from the layout only. Other tiles keep their positions. */
export function removeHomeTile(layout: HomeLayout, tileId: string): HomeLayout {
  return { ...layout, tiles: layout.tiles.filter((tile) => tile.id !== tileId) };
}

export interface HomeTileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Puts one tile at `rect` (clamped to the grid). Any tile it now overlaps is
 * pushed straight down, cascading, until nothing overlaps. Tiles that are not
 * in the way keep their positions, and the stored array order is unchanged.
 */
export function placeHomeTileAt(layout: HomeLayout, tileId: string, rect: HomeTileRect): HomeLayout {
  const moving = layout.tiles.find((tile) => tile.id === tileId);
  if (!moving) return layout;
  const w = Math.min(Math.max(1, rect.w), HOME_TILE_GRID.columns);
  const placedMoving: HomeTile = {
    ...moving,
    w,
    h: Math.max(1, rect.h),
    x: Math.min(Math.max(0, rect.x), HOME_TILE_GRID.columns - w),
    y: Math.max(0, rect.y),
  };

  const placed: HomeTile[] = [placedMoving];
  const others = layout.tiles
    .filter((tile) => tile.id !== tileId)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const tile of others) {
    const current = { ...tile };
    let blockers = placed.filter((other) => overlaps(current, other));
    while (blockers.length > 0) {
      current.y = Math.max(...blockers.map((other) => other.y + other.h));
      blockers = placed.filter((other) => overlaps(current, other));
    }
    placed.push(current);
  }

  const byId = new Map(placed.map((tile) => [tile.id, tile]));
  return { ...layout, tiles: layout.tiles.map((tile) => byId.get(tile.id) ?? tile) };
}

/**
 * After a drag move (`placed` = placeHomeTileAt on `base`), closes only the
 * gaps this move created, without touching anything else:
 * - Tiles the move pushed down rise again, never above where they were.
 * - Tiles below the space the dragged tile left rise by at most the height
 *   that was freed (so a gap the user left below it is kept). A tile that
 *   rises leaves space of its own, which the tiles under it may fill the same way.
 * - The dragged tile follows a row it was dropped under when that row rises.
 * Tiles only ever move straight up and stop at the first tile in their way;
 * tiles the move didn't affect keep their positions. Array order is unchanged.
 */
export function settleHomeTilesAfterMove(base: HomeLayout, placed: HomeLayout, movedId: string): HomeLayout {
  const original = base.tiles.find((tile) => tile.id === movedId);
  const tiles = placed.tiles.map((tile) => ({ ...tile }));
  const moved = tiles.find((tile) => tile.id === movedId);
  if (!original || !moved) return placed;

  const baseY = new Map(base.tiles.map((tile) => [tile.id, tile.y]));
  /** Highest row each tile may rise to; tiles without an entry stay put. */
  const floors = new Map<string, number>();
  const allow = (id: string, floor: number) => {
    if (id !== movedId) floors.set(id, Math.min(floors.get(id) ?? Number.POSITIVE_INFINITY, floor));
  };
  for (const tile of tiles) {
    const before = baseY.get(tile.id);
    if (before !== undefined && tile.y > before) allow(tile.id, before);
  }

  type Vacated = { x: number; w: number; top: number; bottom: number };
  let vacated: Vacated[] = original.x !== moved.x || original.y !== moved.y
    ? [{ x: original.x, w: original.w, top: original.y, bottom: original.y + original.h }]
    : [];
  const rose = new Map<string, number>();
  let followed = 0;
  const fits = (tile: HomeTile, y: number) =>
    !tiles.some((other) => other !== tile && overlaps({ ...tile, y }, other));
  const lift = (tile: HomeTile, y: number) => {
    vacated.push({ x: tile.x, w: tile.w, top: y + tile.h, bottom: tile.y + tile.h });
    rose.set(tile.id, (rose.get(tile.id) ?? 0) + tile.y - y);
    tile.y = y;
  };

  for (let pass = 0; pass < tiles.length * 4; pass += 1) {
    for (const space of vacated) {
      const height = space.bottom - space.top;
      for (const tile of tiles) {
        const below = tile.y >= space.bottom && tile.x < space.x + space.w && space.x < tile.x + tile.w;
        if (below) allow(tile.id, Math.max(space.top, tile.y - height));
      }
    }
    vacated = [];

    for (const tile of [...tiles].sort((a, b) => a.y - b.y || a.x - b.x)) {
      const floor = floors.get(tile.id);
      if (floor === undefined) continue;
      let y = tile.y;
      while (y > floor && fits(tile, y - 1)) y -= 1;
      if (y < tile.y) lift(tile, y);
    }

    // The dragged tile keeps following the row directly above it, if that row rose.
    let free = 0;
    while (moved.y - free > 0 && fits(moved, moved.y - free - 1)) free += 1;
    const above = tiles.filter(
      (other) => other !== moved && overlaps({ ...moved, y: moved.y - free - 1 }, other),
    );
    const rowRose = Math.max(0, ...above.map((other) => rose.get(other.id) ?? 0));
    const follow = Math.min(free, rowRose - followed);
    if (follow > 0 && moved.y - free > 0) {
      lift(moved, moved.y - follow);
      followed += follow;
    }

    if (vacated.length === 0) break;
  }

  const byId = new Map(tiles.map((tile) => [tile.id, tile]));
  return { ...placed, tiles: placed.tiles.map((tile) => byId.get(tile.id) ?? tile) };
}

/** Distinct row starts of the other tiles, top to bottom, with where each row band ends. */
function rowBands(tiles: readonly HomeTile[], excludeId: string): Array<{ y: number; end: number }> {
  const bands = new Map<number, number>();
  for (const tile of tiles) {
    if (tile.id === excludeId) continue;
    bands.set(tile.y, Math.max(bands.get(tile.y) ?? 0, tile.y + tile.h));
  }
  return [...bands.entries()].sort((a, b) => a[0] - b[0]).map(([y, end]) => ({ y, end }));
}

export type HomeTileMoveDirection = "left" | "right" | "up" | "down";

/**
 * Keyboard move. Left / right move to the nearest free column in the same row
 * (other tiles are never pushed sideways out of their row). Up places the tile
 * at the start of the row above (that row moves below it); down places it after
 * the next row. Returns null when the tile cannot move further.
 */
export function moveHomeTileByKeyboard(
  layout: HomeLayout,
  tileId: string,
  direction: HomeTileMoveDirection,
): HomeLayout | null {
  const tile = layout.tiles.find((entry) => entry.id === tileId);
  if (!tile) return null;
  const rect = { x: tile.x, y: tile.y, w: tile.w, h: tile.h };
  if (direction === "left" || direction === "right") {
    const step = direction === "left" ? -1 : 1;
    const others = layout.tiles.filter((entry) => entry.id !== tileId);
    for (let x = tile.x + step; x >= 0 && x + tile.w <= HOME_TILE_GRID.columns; x += step) {
      if (!others.some((other) => overlaps({ ...rect, x }, other))) {
        return placeHomeTileAt(layout, tileId, { ...rect, x });
      }
    }
    return null;
  }
  const bands = rowBands(layout.tiles, tileId);
  if (direction === "up") {
    const above = bands.filter((band) => band.y < tile.y).pop();
    if (!above) return null;
    return placeHomeTileAt(layout, tileId, { ...rect, y: above.y });
  }
  const below = bands.find((band) => band.y > tile.y);
  if (!below) return null;
  return placeHomeTileAt(layout, tileId, { ...rect, y: below.end });
}

/** Applies a size preset, keeping the tile inside the grid. */
export function resizeHomeTile(layout: HomeLayout, tileId: string, sizeId: HomeTileSize): HomeLayout {
  const tile = layout.tiles.find((entry) => entry.id === tileId);
  if (!tile || !getHomeTileDefinition(tile.type).allowedSizes.includes(sizeId)) return layout;
  const size = getHomeTileSizePreset(sizeId);
  return placeHomeTileAt(layout, tileId, {
    x: Math.min(tile.x, HOME_TILE_GRID.columns - size.w),
    y: tile.y,
    w: size.w,
    h: size.h,
  });
}

/** Closest allowed preset to a free-form size in grid units; never an in-between size. */
export function snapHomeTileSize(
  type: HomeTileType,
  desiredW: number,
  desiredH: number,
  /** 0 snaps by width only (tiles whose height follows their content). */
  heightWeight = 1,
): HomeTileSize {
  const allowed = getHomeTileDefinition(type).allowedSizes;
  let best = allowed[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const sizeId of allowed) {
    const preset = getHomeTileSizePreset(sizeId);
    const score =
      Math.abs(preset.w - desiredW) / HOME_TILE_GRID.columns
      + (heightWeight * Math.abs(preset.h - desiredH)) / 8;
    if (score < bestScore) {
      bestScore = score;
      best = sizeId;
    }
  }
  return best;
}
