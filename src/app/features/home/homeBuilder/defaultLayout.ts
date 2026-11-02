import { getHomeTileSizePreset } from "./grid";
import { getHomeTileDefinition } from "./registry";
import {
  HOME_LAYOUT_SCHEMA_VERSION,
  type HomeLayout,
  type HomeTile,
  type HomeTileType,
} from "./types";

/** Stable IDs so the default layout is identical for every user and every load. */
export const DEFAULT_HOME_TILE_IDS = {
  yourFocus: "default-your-focus",
  pinnedProjects: "default-pinned-projects",
  recentProjects: "default-recent-projects",
} as const;

function defaultTile(id: string, type: HomeTileType, y: number): HomeTile {
  const definition = getHomeTileDefinition(type);
  const size = getHomeTileSizePreset(definition.defaultSize);
  return {
    id,
    type,
    x: 0,
    y,
    w: size.w,
    h: size.h,
    config: { ...definition.defaultConfig },
  };
}

/**
 * Mirrors today's Home: Your Focus, then Pinned projects, then Recent projects,
 * each full width and stacked. Returns a fresh copy on every call.
 */
export function createDefaultHomeLayout(): HomeLayout {
  const focus = defaultTile(DEFAULT_HOME_TILE_IDS.yourFocus, "your-focus", 0);
  const pinned = defaultTile(
    DEFAULT_HOME_TILE_IDS.pinnedProjects,
    "pinned-projects",
    focus.y + focus.h,
  );
  const recent = defaultTile(
    DEFAULT_HOME_TILE_IDS.recentProjects,
    "recent-projects",
    pinned.y + pinned.h,
  );
  return {
    schemaVersion: HOME_LAYOUT_SCHEMA_VERSION,
    tiles: [focus, pinned, recent],
  };
}
