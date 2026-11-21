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
  verifai: "default-verifai",
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
const VERIFAI: HomeTileTarget = { scope: "tool", entityId: "verifai" };

/** Facts that shape a default beyond its stage. Each is independent of the others. */
export interface HomeDefaultFacts {
  /** The user can see at least one active Project. */
  hasProjects?: boolean;
  /**
   * The user can run a VerifAI review (a Project role and a Constellation they can use), from
   * the same access data as the VerifAI workspace. Without it, VerifAI stays on the Tools page
   * and in Add Tile, but the default Home doesn't show a tool the user can't use yet.
   */
  canRunVerifai?: boolean;
}

/**
 * The Luxia default Home, on the existing 12-column grid and size presets.
 * The fixed header, Hero (Ask Luxia + Continue), search and What's New notice sit
 * above it and are not tiles.
 *
 * returning: discovery, then tools, then work
 *   ┌──────────────────────── 12 ─────────────────────────┐
 *   │ Discover · Full width · Featured                    │  rows 0–4
 *   ├────────────── 6 ───────────┬────────── 6 ───────────┤
 *   │ Writing Assistant · Large  │ VerifAI · Large        │  rows 4–8
 *   │ Soft                       │ Soft (with access)     │
 *   ├────────────────────────────┼────────────────────────┤
 *   │ Projects (updated) · Large │ Dashboards · Large     │  rows 8–12
 *   └────────────────────────────┴────────────────────────┘
 *
 * guided (setup not finished): onboarding first
 *   ┌──────────────────────── 12 ─────────────────────────┐
 *   │ Get started · Full width · Soft                     │  rows 0–4
 *   ├─────────────────────────────────────────────────────┤
 *   │ Discover · Full width · Featured                    │  rows 4–8
 *   ├────────────── 6 ───────────┬────────── 6 ───────────┤
 *   │ Projects · Large           │ Dashboards · Large     │  only with a Project
 *   ├────────────────────────────┼────────────────────────┤
 *   │ Writing Assistant · Large  │ VerifAI · Large        │  VerifAI with access
 *   └────────────────────────────┴────────────────────────┘
 *   Without a Project there is no empty Projects card (Projects and Dashboards
 *   stay in Add Tile).
 *
 * Without VerifAI access, Writing Assistant keeps its Large size on its own.
 * Recent Chats sit in the Hero's Continue list and What's New in the notice above
 * the grid, so neither is a default tile; Data Sources and Constellations are
 * added from Add Tile. Each tool appears once.
 *
 * Only users without a saved layout, and Reset to Luxia default, get this one.
 * Every tile stays optional: removable, movable, resizable and restylable.
 * Returns a fresh copy on every call.
 */
export function createDefaultHomeLayout(
  stage: HomeDefaultStage = "returning",
  facts: HomeDefaultFacts = {},
): HomeLayout {
  const tiles: HomeTile[] = [];
  let y = 0;
  const discover = () => {
    tiles.push(defaultTile(DEFAULT_HOME_TILE_IDS.tryExample, "try-example", 0, y, "wide", { surface: "featured" }));
    y += 4;
  };
  const work = () => {
    tiles.push(
      defaultTile(DEFAULT_HOME_TILE_IDS.projects, "projects-collection", 0, y, "large", { view: "updated", surface: "default" }),
      defaultTile(DEFAULT_HOME_TILE_IDS.dashboards, "dashboards-collection", 6, y, "large", { surface: "default" }),
    );
    y += 4;
  };
  const tools = () => {
    tiles.push(defaultTile(DEFAULT_HOME_TILE_IDS.writingAssistant, "tool", 0, y, "large", { surface: "soft" }, WRITING_ASSISTANT));
    if (facts.canRunVerifai) {
      tiles.push(defaultTile(DEFAULT_HOME_TILE_IDS.verifai, "tool", 6, y, "large", { surface: "soft" }, VERIFAI));
    }
    y += 4;
  };

  if (stage === "guided") {
    tiles.push(defaultTile(DEFAULT_HOME_TILE_IDS.getStarted, "get-started", 0, y, "wide", { surface: "soft" }));
    y += 4;
    discover();
    if (facts.hasProjects) work();
    tools();
  } else {
    discover();
    tools();
    work();
  }
  return { schemaVersion: HOME_LAYOUT_SCHEMA_VERSION, tiles };
}
