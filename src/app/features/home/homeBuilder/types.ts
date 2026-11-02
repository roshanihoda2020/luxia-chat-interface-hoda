/**
 * Home Builder data model (Home Tiles and Home Layout).
 * Only the Home area from Your Focus downward is customizable;
 * HomeHeader and GlobalSearch are never part of a layout.
 */

export const HOME_LAYOUT_SCHEMA_VERSION = 1;

/** Extend this union (and the registry) to add tile types. */
export type HomeTileType =
  | "your-focus"
  | "pinned-projects"
  | "recent-projects"
  | "project"
  | "galaxy"
  | "chat"
  | "constellation"
  | "data-source"
  | "dashboard"
  | "tool";

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

/** JSON-safe per-tile settings (e.g. a list count). */
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
