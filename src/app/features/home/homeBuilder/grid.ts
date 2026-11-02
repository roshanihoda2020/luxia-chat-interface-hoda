import type { HomeTileSize } from "./types";

/**
 * Home Tile Grid. Values come from the measured Luxia layout:
 * at 1063px content, 12 columns with 16px gaps reproduce the existing
 * 254 / 344 / 524px card widths (spans 3 / 4 / 6).
 */
export const HOME_TILE_GRID = {
  columns: 12,
  gapPx: 16,
  /** One row unit; a tile h units tall renders at h * 60 + (h - 1) * 16 px. */
  rowUnitPx: 60,
  /** Vertical space between tile rows — matches the existing Home section spacing (space-y-8). */
  rowGapPx: 32,
  /** Below this grid width every tile stacks full width in reading order. */
  stackBelowPx: 900,
} as const;

export interface HomeTileSizePreset {
  id: HomeTileSize;
  label: string;
  w: number;
  h: number;
  /** Reserved for list/collection tiles. */
  listOnly?: boolean;
}

/** Central size presets. Add entries here to introduce new sizes. */
export const HOME_TILE_SIZE_PRESETS: Record<HomeTileSize, HomeTileSizePreset> = {
  small: { id: "small", label: "Small", w: 3, h: 2 },
  medium: { id: "medium", label: "Medium", w: 4, h: 4 },
  large: { id: "large", label: "Large", w: 6, h: 4 },
  wide: { id: "wide", label: "Full width", w: 12, h: 4 },
  // List tiles grow with their content; h only reserves a starting row span.
  "wide-tall": { id: "wide-tall", label: "Full width", w: 12, h: 8, listOnly: true },
};

export function getHomeTileSizePreset(sizeId: HomeTileSize): HomeTileSizePreset {
  return HOME_TILE_SIZE_PRESETS[sizeId];
}

/** Preset whose dimensions match exactly, or undefined. */
export function findHomeTileSizeByDimensions(
  w: number,
  h: number,
): HomeTileSizePreset | undefined {
  return Object.values(HOME_TILE_SIZE_PRESETS).find(
    (preset) => preset.w === w && preset.h === h,
  );
}

/** Rendered height in px for a height in row units. */
export function homeTileRowsToPx(h: number): number {
  return h * HOME_TILE_GRID.rowUnitPx + Math.max(0, h - 1) * HOME_TILE_GRID.gapPx;
}

/**
 * Height a grid-height tile occupies on Home. Tiles stack with the row gap
 * (32px), not the 16px unit gap, so each extra 2-row band adds the difference:
 * a 4-row tile is exactly two stacked 2-row tiles (136 + 32 + 136 = 304px),
 * and mixed-size rows line up without stretching.
 */
export function homeTileSlotHeightPx(h: number): number {
  const bands = Math.max(0, Math.ceil(h / 2) - 1);
  return homeTileRowsToPx(h) + bands * (HOME_TILE_GRID.rowGapPx - HOME_TILE_GRID.gapPx);
}

/**
 * Section heading above a Home Tile (same pattern as "Your focus" / "Pinned
 * projects"): a fixed-height title + subtitle block and the Home section
 * heading gap before the card. Fixed so every tile in a row starts its card
 * at the same height.
 */
export const HOME_TILE_SECTION_HEADER = { heightPx: 50, gapPx: 16 } as const;

/**
 * Card height for a grid-height tile. When tiles carry section headings, a
 * 4-row tile also spans the heading of the 2-row tile stacked beside it, so
 * two stacked Small tiles and one Medium tile still line up exactly.
 */
export function homeTileBodyHeightPx(h: number, withSectionHeader: boolean): number {
  const bands = Math.max(0, Math.ceil(h / 2) - 1);
  const header = HOME_TILE_SECTION_HEADER.heightPx + HOME_TILE_SECTION_HEADER.gapPx;
  return homeTileSlotHeightPx(h) + (withSectionHeader ? bands * header : 0);
}
