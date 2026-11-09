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
  getStarted: "default-get-started",
  tryExample: "default-try-example",
  whatsNew: "default-whats-new",
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
 * The Luxia default Home, on the existing 12-column grid and size presets.
 * The fixed header, Start panel and search sit above it and are not tiles.
 *
 *   ┌──────────────────────── 12 ─────────────────────────┐
 *   │ Get started · Full width · Soft (dismissible)       │  rows 0–4
 *   ├─────────────────────────────────────────────────────┤
 *   │ Try an example · Full width (dismissible)           │  rows 4–8
 *   ├────── 4 ───────┬────── 4 ───────┬────── 4 ──────────┤
 *   │ Projects       │ Writing        │ Dashboards        │  rows 8–12
 *   │ Recently upd.  │ Assistant      │ Soft              │
 *   └────────────────┴────────────────┴───────────────────┘
 *
 * Recent Chats sit in the Start panel's Continue list, and What's New in the
 * notice above the grid, so neither is a default tile (both can be added).
 *
 * Only users without a saved layout, and Reset to Luxia default, get this one.
 * Every tile stays optional: removable, movable, resizable and restylable.
 * Returns a fresh copy on every call.
 */
export function createDefaultHomeLayout(): HomeLayout {
  return {
    schemaVersion: HOME_LAYOUT_SCHEMA_VERSION,
    tiles: [
      defaultTile(DEFAULT_HOME_TILE_IDS.getStarted, "get-started", 0, 0, "wide", { surface: "soft" }),
      defaultTile(DEFAULT_HOME_TILE_IDS.tryExample, "try-example", 0, 4, "wide", { surface: "default" }),
      defaultTile(DEFAULT_HOME_TILE_IDS.projects, "projects-collection", 0, 8, "medium", { view: "updated", surface: "default" }),
      defaultTile(
        DEFAULT_HOME_TILE_IDS.writingAssistant,
        "tool",
        4,
        8,
        "medium",
        { surface: "default" },
        { scope: "tool", entityId: "writing-assistant" },
      ),
      defaultTile(DEFAULT_HOME_TILE_IDS.dashboards, "dashboards-collection", 8, 8, "medium", { surface: "soft" }),
    ],
  };
}
