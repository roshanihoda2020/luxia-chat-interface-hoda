import { getHomeTileSizePreset } from "./grid";
import { getHomeTileDefinition } from "./registry";
import {
  HOME_LAYOUT_SCHEMA_VERSION,
  type HomeLayout,
  type HomeTile,
  type HomeTileConfig,
  type HomeTileSize,
  type HomeTileTarget,
  type HomeTileType,
} from "./types";

/**
 * Stable IDs so the default layout is identical for every user and every load.
 * Saved layouts (including ones made from an earlier default) are kept as they
 * are: only users without a saved layout, and Reset to default, get this one.
 */
export const DEFAULT_HOME_TILE_IDS = {
  projects: "default-projects",
  dashboards: "default-dashboards",
  writingAssistant: "default-writing-assistant",
  chats: "default-chats",
  constellations: "default-constellations",
  dataSources: "default-data-sources",
  galaxies: "default-galaxies",
} as const;

function defaultTile(
  id: string,
  type: HomeTileType,
  x: number,
  y: number,
  size: HomeTileSize,
  config: HomeTileConfig = {},
  target?: HomeTileTarget,
): HomeTile {
  const definition = getHomeTileDefinition(type);
  const preset = getHomeTileSizePreset(size);
  return {
    id,
    type,
    ...(target ? { target } : {}),
    x,
    y,
    w: preset.w,
    h: preset.h,
    config: { ...definition.defaultConfig, ...config },
  };
}

/**
 * The default Home (Executive Workspace), on the existing 12-column grid and
 * size presets:
 *
 *   ┌──────────── 6 ────────────┬───── 3 ─────┬───── 3 ─────┐
 *   │ Projects · Large          │ Dashboards  │ Writing     │  rows 0–2
 *   │ All, A–Z · Featured       │ Small · Soft│ Assistant   │
 *   │                           ├─────────────┼─────────────┤
 *   │                           │ Recent chats│ Constell.   │  rows 2–4
 *   │                           │ Small       │ Small · Soft│
 *   ├───────────────────────────┼─────────────┴─────────────┤
 *   │ Data Sources · Large      │ Galaxies · Large · Soft   │  rows 4–8
 *   └───────────────────────────┴───────────────────────────┘
 *
 * Projects is the primary area (the only Featured surface). Every tile is
 * optional: removable, movable, resizable and restylable.
 * Returns a fresh copy on every call.
 */
export function createDefaultHomeLayout(): HomeLayout {
  return {
    schemaVersion: HOME_LAYOUT_SCHEMA_VERSION,
    tiles: [
      defaultTile(DEFAULT_HOME_TILE_IDS.projects, "projects-collection", 0, 0, "large", { view: "name", surface: "featured" }),
      defaultTile(DEFAULT_HOME_TILE_IDS.dashboards, "dashboards-collection", 6, 0, "small", { surface: "soft" }),
      defaultTile(
        DEFAULT_HOME_TILE_IDS.writingAssistant,
        "tool",
        9,
        0,
        "small",
        { surface: "default" },
        { scope: "tool", entityId: "writing-assistant" },
      ),
      defaultTile(DEFAULT_HOME_TILE_IDS.chats, "chats-collection", 6, 2, "small", { surface: "default" }),
      defaultTile(DEFAULT_HOME_TILE_IDS.constellations, "constellations-collection", 9, 2, "small", { surface: "soft" }),
      defaultTile(DEFAULT_HOME_TILE_IDS.dataSources, "data-sources-collection", 0, 4, "large", { surface: "default" }),
      defaultTile(DEFAULT_HOME_TILE_IDS.galaxies, "galaxies-collection", 6, 4, "large", { surface: "soft" }),
    ],
  };
}
