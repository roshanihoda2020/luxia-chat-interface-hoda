import { findHomeTileSizeByDimensions } from "./grid";
import type {
  HomeTile,
  HomeTileConfig,
  HomeTileSize,
  HomeTileTargetScope,
  HomeTileType,
} from "./types";

export type HomeTileCategory = "home" | "projects" | "conversations" | "knowledge" | "tools";

export interface HomeTileDefinition {
  type: HomeTileType;
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

function entityTile(
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

/**
 * Tile catalog. Your focus, Pinned and Recent keep their original full-width
 * sections at Full width and switch to compact Home Tile layouts when smaller.
 */
export const HOME_TILE_DEFINITIONS: Record<HomeTileType, HomeTileDefinition> = {
  "your-focus": {
    type: "your-focus",
    label: "Your focus",
    description: "Continue your most recent Chat or Galaxy, or the one you choose.",
    category: "home",
    allowedSizes: ["small", "medium", "large", "wide"],
    defaultSize: "wide",
    targetScopes: [],
    requiresTarget: false,
    maxInstances: 1,
    defaultConfig: {},
    contentHeightSizes: ["wide"],
    // At Full width HomeHero's root section carries HI.sectionGap (mb-7).
    ownBottomSpacingSizes: ["wide"],
  },
  "pinned-projects": {
    type: "pinned-projects",
    label: "Pinned projects",
    description: "The Projects you pinned, from a short list to full cards.",
    category: "home",
    allowedSizes: ["small", "medium", "large", "wide-tall"],
    defaultSize: "wide-tall",
    targetScopes: [],
    requiresTarget: false,
    maxInstances: 1,
    defaultConfig: {},
    contentHeightSizes: ["wide-tall"],
  },
  "recent-projects": {
    type: "recent-projects",
    label: "Recent projects",
    description: "Your most recently updated Projects, from a short list to the full library view.",
    category: "home",
    allowedSizes: ["small", "medium", "large", "wide-tall"],
    defaultSize: "wide-tall",
    targetScopes: [],
    requiresTarget: false,
    maxInstances: 1,
    defaultConfig: {},
    contentHeightSizes: ["wide-tall"],
  },
  project: entityTile(
    "project",
    "Project",
    "One Project card with quick links to its Galaxy.",
    "projects",
    "project",
    "medium",
    ["small", "medium", "large"],
  ),
  galaxy: entityTile(
    "galaxy",
    "Galaxy",
    "Open one Project's Galaxy directly.",
    "projects",
    "galaxy",
    "small",
  ),
  dashboard: entityTile(
    "dashboard",
    "Project dashboard",
    "Open one Project's Dashboard of saved outputs.",
    "projects",
    "dashboard",
    "small",
    ["small", "medium", "large"],
  ),
  chat: entityTile(
    "chat",
    "Chat",
    "Continue one Constellation Chat.",
    "conversations",
    "chat",
    "small",
  ),
  constellation: entityTile(
    "constellation",
    "Constellation",
    "Open one Constellation you can use.",
    "knowledge",
    "constellation",
    "small",
  ),
  "data-source": entityTile(
    "data-source",
    "Data Source",
    "Open one Data Source's settings.",
    "knowledge",
    "data-source",
    "small",
  ),
  tool: entityTile(
    "tool",
    "Tool",
    "Open a Luxia tool such as Writing Assistant.",
    "tools",
    "tool",
    "small",
  ),
};

export const HOME_TILE_CATEGORY_LABELS: Record<HomeTileCategory, string> = {
  home: "Home sections",
  projects: "Projects",
  conversations: "Conversations",
  knowledge: "Knowledge & data",
  tools: "Tools",
};

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

/** True when the rendered component already ends with its own section margin at this size. */
export function homeTileHasOwnBottomSpacing(tile: Pick<HomeTile, "type" | "w" | "h">): boolean {
  const size = getHomeTileSizeId(tile);
  return Boolean(size && getHomeTileDefinition(tile.type).ownBottomSpacingSizes?.includes(size));
}
