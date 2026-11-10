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
 * Which Luxia default a user without a saved layout sees, from the same setup
 * facts Get started checks (data, a Project, a usable Constellation, a Chat).
 * - guided: setup is not finished, so Home teaches before it lists.
 * - returning: setup is done, so Home leads with work and keeps discovery close.
 */
export type HomeDefaultStage = "guided" | "returning";

const WRITING_ASSISTANT: HomeTileTarget = { scope: "tool", entityId: "writing-assistant" };

/**
 * The Luxia default Home, on the existing 12-column grid and size presets.
 * The fixed header, Hero, search and What's New notice sit above it and are not tiles.
 *
 * returning
 *   ┌──────────────────────── 12 ─────────────────────────┐
 *   │ Discover · Full width · Featured                    │  rows 0–4
 *   ├────── 4 ───────┬────── 4 ───────┬────── 4 ──────────┤
 *   │ Writing A.     │ Projects       │ Dashboards        │  rows 4–8
 *   │ Medium · Soft  │ Medium         │ Medium            │
 *   └────────────────┴────────────────┴───────────────────┘
 *
 * guided (setup not finished)
 *   ┌──────────────────────── 12 ─────────────────────────┐
 *   │ Discover · Full width · Featured                    │  rows 0–4
 *   ├─────────────────────────────────────────────────────┤
 *   │ Get started · Full width · Soft                     │  rows 4–8
 *   ├────────── 3 ───┬──── 3 ──────┬──── 3 ───┬───────────┤
 *   │                │ Writing A.  │ Projects │           │  rows 8–10
 *   │                │ Small · Soft│ Small    │           │
 *   └────────────────┴─────────────┴──────────┴───────────┘
 *   No Dashboards until there are some; Projects stays a compact entry point.
 *
 * Recent Chats sit in the Hero's Continue list and What's New in the notice above
 * the grid, so neither is a default tile; Data Sources and Constellations are
 * added from Add Tile.
 *
 * Only users without a saved layout, and Reset to Luxia default, get this one.
 * Every tile stays optional: removable, movable, resizable and restylable.
 * Returns a fresh copy on every call.
 */
export function createDefaultHomeLayout(stage: HomeDefaultStage = "returning"): HomeLayout {
  const discover = defaultTile(DEFAULT_HOME_TILE_IDS.tryExample, "try-example", 0, 0, "wide", { surface: "featured" });
  const tiles = stage === "guided"
    ? [
      discover,
      defaultTile(DEFAULT_HOME_TILE_IDS.getStarted, "get-started", 0, 4, "wide", { surface: "soft" }),
      defaultTile(DEFAULT_HOME_TILE_IDS.writingAssistant, "tool", 3, 8, "small", { surface: "soft" }, WRITING_ASSISTANT),
      defaultTile(DEFAULT_HOME_TILE_IDS.projects, "projects-collection", 6, 8, "small", { view: "updated", surface: "default" }),
    ]
    : [
      discover,
      defaultTile(DEFAULT_HOME_TILE_IDS.writingAssistant, "tool", 0, 4, "medium", { surface: "soft" }, WRITING_ASSISTANT),
      defaultTile(DEFAULT_HOME_TILE_IDS.projects, "projects-collection", 4, 4, "medium", { view: "updated", surface: "default" }),
      defaultTile(DEFAULT_HOME_TILE_IDS.dashboards, "dashboards-collection", 8, 4, "medium", { surface: "default" }),
    ];
  return { schemaVersion: HOME_LAYOUT_SCHEMA_VERSION, tiles };
}
