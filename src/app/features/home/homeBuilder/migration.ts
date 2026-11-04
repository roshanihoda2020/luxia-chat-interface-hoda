import { HOME_LAYOUT_SCHEMA_VERSION } from "./types";

/**
 * Saved Home layouts are user data, so old versions are converted, never
 * dropped. Migration is deterministic and idempotent: running it on its own
 * output changes nothing, and every tile keeps its id, position, size, style,
 * target and other config.
 *
 * Version 1 → 2: the Pinned projects / Recent projects tiles become the
 * Projects collection with the matching view. Everything else is unchanged.
 */

/** Tile types that only exist in version 1 layouts, and the Projects view each becomes. */
export const LEGACY_PROJECT_LIST_TILE_VIEWS = {
  "pinned-projects": "pinned",
  "recent-projects": "updated",
} as const;

export interface HomeLayoutMigrationContext {
  /**
   * The Show 3 / 6 / 9 / All choice the old Recent projects section kept in a
   * shared key. Only passed when that value can be attributed to this user;
   * a migrated Recent tile then keeps it as its own `limit`.
   */
  legacyRecentLimit?: string | null;
}

export interface HomeLayoutMigrationResult {
  data: unknown;
  /** Version the stored data had, when it was migrated. */
  migratedFrom?: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateTileV1(raw: unknown, context: HomeLayoutMigrationContext): unknown {
  if (!isPlainObject(raw) || typeof raw.type !== "string") return raw;
  if (!Object.prototype.hasOwnProperty.call(LEGACY_PROJECT_LIST_TILE_VIEWS, raw.type)) return raw;
  const view = LEGACY_PROJECT_LIST_TILE_VIEWS[raw.type as keyof typeof LEGACY_PROJECT_LIST_TILE_VIEWS];
  const config = isPlainObject(raw.config) ? raw.config : {};
  const limit = view === "updated" && config.limit === undefined && context.legacyRecentLimit
    ? { limit: context.legacyRecentLimit }
    : {};
  return { ...raw, type: "projects-collection", config: { ...config, view, ...limit } };
}

/**
 * Converts stored layout data to the current schema. Data that is already
 * current, or that isn't a recognisable layout, is returned unchanged (and
 * then validated or rejected by parseHomeLayout as usual).
 */
export function migrateHomeLayoutData(
  raw: unknown,
  context: HomeLayoutMigrationContext = {},
): HomeLayoutMigrationResult {
  if (!isPlainObject(raw) || raw.schemaVersion !== 1 || !Array.isArray(raw.tiles)) {
    return { data: raw };
  }
  return {
    data: {
      ...raw,
      schemaVersion: HOME_LAYOUT_SCHEMA_VERSION,
      tiles: raw.tiles.map((tile) => migrateTileV1(tile, context)),
    },
    migratedFrom: 1,
  };
}
