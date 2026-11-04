import { HOME_TILE_GRID, findHomeTileSizeByDimensions, getHomeTileSizePreset } from "./grid";
import {
  isHomeTileSurfaceStyle,
  type HomeTile,
  type HomeTileConfig,
  type HomeTileSize,
  type HomeTileSurfaceStyle,
  type HomeTileTargetScope,
  type HomeTileType,
} from "./types";

/** Full width spans every grid column. */
const HOME_TILE_FULL_WIDTH_COLUMNS = HOME_TILE_GRID.columns;

/** Collection: several accessible items. Item: one chosen (or resolved) item. Tool: a Luxia tool. */
export type HomeTileModel = "collection" | "item" | "tool";

/** The kind of Luxia content a tile is about; collections and items share these. */
export type HomeTileCategory =
  | "projects"
  | "chats"
  | "galaxies"
  | "constellations"
  | "data-sources"
  | "dashboards"
  | "continue"
  | "tools";

export interface HomeTileDefinition {
  type: HomeTileType;
  model: HomeTileModel;
  label: string;
  /** One line for the Home Tile Library. */
  description: string;
  category: HomeTileCategory;
  /** Sizes this tile may snap to. The first entry is not implied as default. */
  allowedSizes: readonly HomeTileSize[];
  defaultSize: HomeTileSize;
  /** Target scopes this tile accepts; empty means the tile never has a target. */
  targetScopes: readonly HomeTileTargetScope[];
  /** Whether a target is mandatory for this tile. */
  requiresTarget: boolean;
  /** Maximum instances per layout; undefined means unlimited. */
  maxInstances?: number;
  defaultConfig: HomeTileConfig;
  /** Card style when the user hasn't chosen one (Your focus keeps its dark hero look). */
  defaultSurface?: HomeTileSurfaceStyle;
  /**
   * Sizes at which the tile grows with its content (`h` only reserves a starting
   * span). At every other size the tile fills exactly its grid slot height.
   */
  contentHeightSizes?: readonly HomeTileSize[];
  /**
   * Sizes at which the rendered component already ends with its own Home
   * section margin, so the grid must not add its row gap below it.
   */
  ownBottomSpacingSizes?: readonly HomeTileSize[];
}

function itemTile(
  type: HomeTileType,
  label: string,
  description: string,
  category: HomeTileCategory,
  scope: HomeTileTargetScope,
  defaultSize: HomeTileSize,
  allowedSizes: readonly HomeTileSize[] = ["small", "medium"],
): HomeTileDefinition {
  return {
    type,
    model: scope === "tool" ? "tool" : "item",
    label,
    description,
    category,
    allowedSizes,
    defaultSize,
    targetScopes: [scope],
    requiresTarget: true,
    defaultConfig: {},
  };
}

/** Collections never have a target and may be added any number of times. */
function collectionTile(
  type: HomeTileType,
  label: string,
  description: string,
  category: HomeTileCategory,
  options: Pick<HomeTileDefinition, "allowedSizes"> & Partial<HomeTileDefinition> = {
    allowedSizes: ["small", "medium", "large", "wide"],
  },
): HomeTileDefinition {
  return {
    type,
    model: "collection",
    label,
    description,
    category,
    defaultSize: "medium",
    targetScopes: [],
    requiresTarget: false,
    defaultConfig: {},
    ...options,
  };
}

/**
 * Tile catalog. Collections first, then specific items, then tools.
 * The Projects collection replaces the former Pinned projects / Recent projects
 * tiles (now its "pinned" / "updated" views) and keeps their Full-width section.
 */
export const HOME_TILE_DEFINITIONS: Record<HomeTileType, HomeTileDefinition> = {
  "projects-collection": collectionTile(
    "projects-collection",
    "Projects",
    "Your pinned, recently updated or all Projects.",
    "projects",
    {
      allowedSizes: ["small", "medium", "large", "wide-tall"],
      defaultConfig: { view: "pinned" },
      contentHeightSizes: ["wide-tall"],
    },
  ),
  "chats-collection": collectionTile(
    "chats-collection",
    "Chats",
    "Your Constellation Chats, most recently opened first.",
    "chats",
  ),
  "galaxies-collection": collectionTile(
    "galaxies-collection",
    "Galaxies",
    "The Galaxy of each Project you can access.",
    "galaxies",
  ),
  "constellations-collection": collectionTile(
    "constellations-collection",
    "Constellations",
    "Constellations you can use, grouped by Project.",
    "constellations",
  ),
  "data-sources-collection": collectionTile(
    "data-sources-collection",
    "Data Sources",
    "Data Sources you can access.",
    "data-sources",
  ),
  "dashboards-collection": collectionTile(
    "dashboards-collection",
    "Dashboards",
    "Named Dashboards from your Projects, recently updated first.",
    "dashboards",
  ),
  "your-focus": {
    type: "your-focus",
    model: "item",
    label: "Your focus",
    description: "Continue your most recent Chat or Galaxy, or the one you choose.",
    category: "continue",
    allowedSizes: ["small", "medium", "large", "wide"],
    defaultSize: "wide",
    targetScopes: [],
    requiresTarget: false,
    maxInstances: 1,
    defaultConfig: {},
    defaultSurface: "featured",
    contentHeightSizes: ["wide"],
    // At Full width HomeHero's root section carries HI.sectionGap (mb-7).
    ownBottomSpacingSizes: ["wide"],
  },
  project: itemTile(
    "project",
    "Project",
    "One Project card with quick links to its Galaxy.",
    "projects",
    "project",
    "medium",
    ["small", "medium", "large"],
  ),
  chat: itemTile(
    "chat",
    "Chat",
    "Continue one Constellation Chat.",
    "chats",
    "chat",
    "small",
  ),
  galaxy: itemTile(
    "galaxy",
    "Galaxy",
    "Open one Project's Galaxy directly.",
    "galaxies",
    "galaxy",
    "small",
  ),
  constellation: itemTile(
    "constellation",
    "Constellation",
    "Open one Constellation you can use.",
    "constellations",
    "constellation",
    "small",
  ),
  "data-source": itemTile(
    "data-source",
    "Data Source",
    "Open one Data Source's settings.",
    "data-sources",
    "data-source",
    "small",
  ),
  dashboard: itemTile(
    "dashboard",
    "Dashboard",
    "One named Dashboard and its saved outputs.",
    "dashboards",
    "dashboard",
    "small",
    ["small", "medium", "large"],
  ),
  tool: itemTile(
    "tool",
    "Tool",
    "Open a Luxia tool such as Writing Assistant.",
    "tools",
    "tool",
    "small",
  ),
};

export const HOME_TILE_CATEGORY_LABELS: Record<HomeTileCategory, string> = {
  projects: "Projects",
  chats: "Chats",
  galaxies: "Galaxies",
  constellations: "Constellations",
  "data-sources": "Data Sources",
  dashboards: "Dashboards",
  continue: "Continue",
  tools: "Tools",
};

export const HOME_TILE_MODEL_LABELS: Record<HomeTileModel, string> = {
  collection: "Collections",
  item: "Specific items",
  tool: "Tools",
};

export function isHomeCollectionTile(tile: Pick<HomeTile, "type">): boolean {
  return getHomeTileDefinition(tile.type).model === "collection";
}

export function isHomeTileType(value: unknown): value is HomeTileType {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(HOME_TILE_DEFINITIONS, value);
}

export function getHomeTileDefinition(type: HomeTileType): HomeTileDefinition {
  return HOME_TILE_DEFINITIONS[type];
}

/** The size preset a tile is currently at, if its dimensions match one. */
export function getHomeTileSizeId(tile: Pick<HomeTile, "w" | "h">): HomeTileSize | undefined {
  return findHomeTileSizeByDimensions(tile.w, tile.h)?.id;
}

/** True when the tile grows with its content at its current size (otherwise it fills its slot). */
export function homeTileUsesContentHeight(tile: Pick<HomeTile, "type" | "w" | "h">): boolean {
  const size = getHomeTileSizeId(tile);
  return Boolean(size && getHomeTileDefinition(tile.type).contentHeightSizes?.includes(size));
}

/**
 * Smaller allowed sizes a dragged tile may take to fit beside other tiles,
 * largest first (narrower, never taller). Empty for tiles at a content-height
 * size (Full-width Your focus / Projects collection): shrinking those swaps their
 * whole section for a compact tile, so it's never done automatically.
 */
export function getHomeTileFitSizes(tile: HomeTile): Array<{ id: HomeTileSize; w: number; h: number }> {
  if (homeTileUsesContentHeight(tile)) return [];
  return getHomeTileDefinition(tile.type).allowedSizes
    .map((id) => getHomeTileSizePreset(id))
    .filter((size) => size.w < tile.w && size.h <= tile.h)
    .sort((a, b) => b.w - a.w || b.h - a.h)
    .map(({ id, w, h }) => ({ id, w, h }));
}

/**
 * Smaller sizes a Full-width tile may take so another tile fits beside it,
 * largest first. Only offered after the user rests a dragged tile beside it
 * (never automatically): these tiles switch from their full Home section to a
 * compact tile. Empty for tiles that aren't Full width.
 */
export function getHomeTileBesideSizes(tile: HomeTile): Array<{ id: HomeTileSize; w: number; h: number }> {
  if (tile.w !== HOME_TILE_FULL_WIDTH_COLUMNS) return [];
  return getHomeTileDefinition(tile.type).allowedSizes
    .map((id) => getHomeTileSizePreset(id))
    .filter((size) => size.w < HOME_TILE_FULL_WIDTH_COLUMNS)
    .sort((a, b) => b.w - a.w || b.h - a.h)
    .map(({ id, w, h }) => ({ id, w, h }));
}

/** The tile's card style: its saved choice, or its type's default (Default white unless stated). */
export function getHomeTileSurfaceStyle(tile: Pick<HomeTile, "type" | "config">): HomeTileSurfaceStyle {
  const saved = tile.config.surface;
  if (isHomeTileSurfaceStyle(saved)) return saved;
  return getHomeTileDefinition(tile.type).defaultSurface ?? "default";
}

/** True when the rendered component already ends with its own section margin at this size. */
export function homeTileHasOwnBottomSpacing(tile: Pick<HomeTile, "type" | "w" | "h">): boolean {
  const size = getHomeTileSizeId(tile);
  return Boolean(size && getHomeTileDefinition(tile.type).ownBottomSpacingSizes?.includes(size));
}
