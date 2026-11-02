import { History, Pin } from "lucide-react";
import {
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaDatasourceIcon,
  LuxiaGalaxyIcon,
  LuxiaProjectsIcon,
  LuxiaToolsGalleryIcon,
  LuxiaWritingAssistantIcon,
} from "@/assets/icons";
import { LUXIA_TOOLS } from "@/app/features/tools/data";
import { HS } from "../homeSurfaces";
import type { HomeTileSection } from "./HomeTileSectionHeader";
import { homeTileUsesContentHeight } from "./registry";
import type { HomeTile, HomeTileType } from "./types";

const ICON_SIZE = 22;

/**
 * Outer section heading per Home Tile type: label, icon and short helper text.
 * Your focus / Pinned / Recent reuse the exact titles, icons and colours of their
 * existing Home section headings.
 */
export const HOME_TILE_SECTIONS: Record<HomeTileType, HomeTileSection> = {
  "your-focus": {
    title: "Your focus",
    subtitle: "Pick up where you left off.",
    icon: <History size={ICON_SIZE} strokeWidth={1.75} />,
    iconColor: HS.sectionIconContinue,
  },
  "pinned-projects": {
    title: "Pinned projects",
    subtitle: "The Projects you pinned.",
    icon: <Pin size={ICON_SIZE} strokeWidth={1.75} />,
  },
  "recent-projects": {
    title: "Recent projects",
    subtitle: "Your recently accessed projects.",
    icon: <History size={ICON_SIZE} strokeWidth={1.75} />,
  },
  project: {
    title: "Projects",
    subtitle: "Quick access to a Project.",
    icon: <LuxiaProjectsIcon size={ICON_SIZE} color="currentColor" />,
  },
  galaxy: {
    title: "Galaxies",
    subtitle: "Ask across a Project's Constellations.",
    icon: <LuxiaGalaxyIcon size={ICON_SIZE} color="currentColor" />,
  },
  chat: {
    title: "Chats",
    subtitle: "Continue a Constellation Chat.",
    icon: <LuxiaChatIcon size={ICON_SIZE} color="currentColor" />,
  },
  constellation: {
    title: "Constellations",
    subtitle: "Knowledge your Chats use.",
    icon: <LuxiaConstellationIcon size={ICON_SIZE} color="currentColor" />,
  },
  "data-source": {
    title: "Data sources",
    subtitle: "Data you can access in Luxia.",
    icon: <LuxiaDatasourceIcon size={ICON_SIZE} color="currentColor" />,
  },
  dashboard: {
    title: "Project dashboards",
    subtitle: "Saved outputs for a Project.",
    icon: <LuxiaDashboardIcon size={ICON_SIZE} color="currentColor" />,
  },
  tool: {
    title: "Tools",
    subtitle: "Luxia tools and workspaces.",
    icon: <LuxiaToolsGalleryIcon size={ICON_SIZE} color="currentColor" />,
  },
};

/** Per-tool heading overrides (the tile's own tool is the clearest label). */
const TOOL_SECTIONS: Record<string, Omit<HomeTileSection, "title">> = {
  "writing-assistant": {
    subtitle: "Write and edit documents with AI.",
    icon: <LuxiaWritingAssistantIcon size={ICON_SIZE} color="currentColor" />,
  },
};

/**
 * Section heading shown above a tile, or null when the tile already renders
 * its own Home section heading (Your focus / Pinned / Recent at Full width).
 */
export function getHomeTileSection(tile: HomeTile): HomeTileSection | null {
  if (homeTileUsesContentHeight(tile)) return null;
  if (tile.type === "tool" && tile.target) {
    const tool = LUXIA_TOOLS.find((entry) => entry.id === tile.target?.entityId);
    const override = tool ? TOOL_SECTIONS[tool.id] : undefined;
    if (tool && override) return { ...HOME_TILE_SECTIONS.tool, ...override, title: tool.name };
  }
  return HOME_TILE_SECTIONS[tile.type];
}
