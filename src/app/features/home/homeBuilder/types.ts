/**
 * Home Builder data model (Home Tiles and Home Layout).
 * Only the Home area below GlobalSearch is customizable;
 * HomeHeader and GlobalSearch are never part of a layout.
 *
 * Two tile models:
 * - Collection tiles show several accessible items of one category
 *   (`*-collection` types), configured through `config` (e.g. `view`).
 * - Specific item tiles show one chosen item (`target`), plus Your focus
 *   (one item resolved from recent work) and the Writing Assistant tool tile.
 */

/**
 * 2: collection tiles. Version 1 layouts (with the retired "pinned-projects" /
 * "recent-projects" types) are migrated on read; see migration.ts.
 */
export const HOME_LAYOUT_SCHEMA_VERSION = 2;

export const HOME_COLLECTION_TILE_TYPES = [
  "projects-collection",
  "chats-collection",
  "galaxies-collection",
  "constellations-collection",
  "data-sources-collection",
  "dashboards-collection",
] as const;
export type HomeCollectionTileType = (typeof HOME_COLLECTION_TILE_TYPES)[number];

export type HomeItemTileType =
  | "your-focus"
  | "project"
  | "galaxy"
  | "chat"
  | "constellation"
  | "data-source"
  | "dashboard"
  | "tool";

/** Extend these unions (and the registry) to add tile types. */
export type HomeTileType = HomeCollectionTileType | HomeItemTileType;

/**
 * Projects collection views. "updated" is ordered by Project activity
 * (`updatedAtTimestamp`); Luxia has no per-user "last opened" record for
 * Projects yet, so no "recently accessed" view is offered.
 */
export const HOME_PROJECTS_VIEWS = ["pinned", "updated", "name"] as const;
export type HomeProjectsView = (typeof HOME_PROJECTS_VIEWS)[number];

export function isHomeProjectsView(value: unknown): value is HomeProjectsView {
  return typeof value === "string" && (HOME_PROJECTS_VIEWS as readonly string[]).includes(value);
}

export type HomeTileSize =
  | "small"
  | "medium"
  | "large"
  | "wide"
  | "wide-tall";

/** Kinds of Luxia items a tile may point at. Organization is tenant context, never a target. */
export type HomeTileTargetScope =
  | "project"
  | "galaxy"
  | "chat"
  | "constellation"
  | "data-source"
  | "dashboard"
  | "output"
  | "vidget"
  | "tool";

/**
 * Reference to one specific Luxia item. Stores IDs only — names, counts and
 * access are resolved at render time through the existing permission filters.
 */
export interface HomeTileTarget {
  scope: HomeTileTargetScope;
  entityId: string;
  /** Owning Project, for scopes that need Project context to open. */
  projectId?: string;
}

/**
 * Visual style of a tile's card, chosen per tile and kept wherever it moves:
 * Featured (dark hero surface), Soft (light lavender) or Default (white).
 * Stored as `config.surface`; missing or unknown values use the type's default.
 */
export const HOME_TILE_SURFACES = ["featured", "soft", "default"] as const;
export type HomeTileSurfaceStyle = (typeof HOME_TILE_SURFACES)[number];

export function isHomeTileSurfaceStyle(value: unknown): value is HomeTileSurfaceStyle {
  return typeof value === "string" && (HOME_TILE_SURFACES as readonly string[]).includes(value);
}

/**
 * JSON-safe per-tile settings. Known keys:
 * - `surface`: card style (all tiles).
 * - `view`: Projects collection view (HomeProjectsView).
 * - `limit`: Full-width Projects list length, "3" | "6" | "9" | "all".
 * - `display`: Full-width Projects list layout, "grid" | "list".
 * Unknown or invalid values fall back to defaults; they never reject a layout.
 */
export type HomeTileConfigValue = string | number | boolean | null;
export type HomeTileConfig = Record<string, HomeTileConfigValue>;

export interface HomeTile {
  /** Unique per layout; several instances may share one type. */
  id: string;
  type: HomeTileType;
  target?: HomeTileTarget;
  /** Grid column (0-based) and row (0-based), in grid units. */
  x: number;
  y: number;
  /** Width in columns and height in row units. Must match an allowed size preset. */
  w: number;
  h: number;
  config: HomeTileConfig;
}

/** Tile order in `tiles` is preserved as saved; it is never re-sorted. */
export interface HomeLayout {
  schemaVersion: typeof HOME_LAYOUT_SCHEMA_VERSION;
  tiles: HomeTile[];
}
