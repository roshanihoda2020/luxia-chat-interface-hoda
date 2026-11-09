import type { ReactNode } from "react";
import { Bot, History, ListChecks, Megaphone, Pin, Sparkles } from "lucide-react";
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
import { HOME_PROJECTS_VIEW_COPY, getHomeProjectsView } from "./collections";
import { homeTileUsesContentHeight } from "./registry";
import type { HomeProjectsView, HomeTile, HomeTileType } from "./types";

const ICON_SIZE = 22;

/**
 * Outer section heading per Home Tile type: label, icon and short helper text.
 * Collections use the plural category ("Chats"); specific items the singular
 * ("Chat"), so the two models read differently before the card is read.
 * Your focus reuses the exact title, icon and colour of its Home section.
 */
export const HOME_TILE_SECTIONS: Record<HomeTileType, HomeTileSection> = {
  "projects-collection": {
    title: "Projects",
    subtitle: "Projects you can access.",
    icon: <LuxiaProjectsIcon size={ICON_SIZE} color="currentColor" />,
  },
  "chats-collection": {
    title: "Recent chats",
    subtitle: "Your Chats, most recently opened first.",
    shortSubtitle: "Most recently opened first.",
    icon: <LuxiaChatIcon size={ICON_SIZE} color="currentColor" />,
  },
  "galaxies-collection": {
    title: "Galaxies",
    subtitle: "Each Project's Galaxy, latest activity first.",
    shortSubtitle: "Latest activity first.",
    icon: <LuxiaGalaxyIcon size={ICON_SIZE} color="currentColor" />,
  },
  "constellations-collection": {
    title: "Constellations",
    subtitle: "Constellations you can use.",
    shortSubtitle: "You can use these.",
    icon: <LuxiaConstellationIcon size={ICON_SIZE} color="currentColor" />,
  },
  "data-sources-collection": {
    title: "Data sources",
    subtitle: "Data Sources you can access.",
    shortSubtitle: "You can access these.",
    icon: <LuxiaDatasourceIcon size={ICON_SIZE} color="currentColor" />,
  },
  "dashboards-collection": {
    title: "Dashboards",
    subtitle: "From your Projects, recently updated first.",
    shortSubtitle: "Recently updated first.",
    icon: <LuxiaDashboardIcon size={ICON_SIZE} color="currentColor" />,
  },
  "vidgets-collection": {
    title: "Vidgets",
    subtitle: "Customer-facing assistants in the Projects you manage.",
    shortSubtitle: "Your customer assistants.",
    icon: <Bot size={ICON_SIZE} strokeWidth={1.75} />,
  },
  "whats-new": {
    title: "What's New",
    subtitle: "Product updates and Luxia news.",
    shortSubtitle: "Product updates.",
    icon: <Megaphone size={ICON_SIZE} strokeWidth={1.75} />,
  },
  "your-focus": {
    title: "Your focus",
    subtitle: "Pick up where you left off.",
    icon: <History size={ICON_SIZE} strokeWidth={1.75} />,
    iconColor: HS.sectionIconContinue,
  },
  project: {
    title: "Project",
    subtitle: "Quick access to a Project.",
    shortSubtitle: "Quick access.",
    icon: <LuxiaProjectsIcon size={ICON_SIZE} color="currentColor" />,
  },
  galaxy: {
    title: "Galaxy",
    subtitle: "Ask across a Project's Constellations.",
    shortSubtitle: "Ask across Constellations.",
    icon: <LuxiaGalaxyIcon size={ICON_SIZE} color="currentColor" />,
  },
  chat: {
    title: "Chat",
    subtitle: "Continue a Constellation Chat.",
    shortSubtitle: "Continue a Chat.",
    icon: <LuxiaChatIcon size={ICON_SIZE} color="currentColor" />,
  },
  constellation: {
    title: "Constellation",
    subtitle: "Knowledge your Chats use.",
    shortSubtitle: "Knowledge for Chats.",
    icon: <LuxiaConstellationIcon size={ICON_SIZE} color="currentColor" />,
  },
  "data-source": {
    title: "Data source",
    subtitle: "Data you can access in Luxia.",
    shortSubtitle: "Data you can access.",
    icon: <LuxiaDatasourceIcon size={ICON_SIZE} color="currentColor" />,
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Saved outputs chosen for this Dashboard.",
    shortSubtitle: "Chosen outputs.",
    icon: <LuxiaDashboardIcon size={ICON_SIZE} color="currentColor" />,
  },
  tool: {
    title: "Tools",
    subtitle: "Luxia tools and workspaces.",
    shortSubtitle: "Luxia tools.",
    icon: <LuxiaToolsGalleryIcon size={ICON_SIZE} color="currentColor" />,
  },
  "get-started": {
    title: "Get started with Luxia",
    subtitle: "A few short steps. Hide them whenever you like and bring them back any time.",
    shortSubtitle: "A few short steps.",
    icon: <ListChecks size={ICON_SIZE} strokeWidth={1.75} />,
  },
  "try-example": {
    title: "Try an example",
    subtitle: "Real starting points. Each one opens the feature it describes.",
    shortSubtitle: "Real starting points.",
    icon: <Sparkles size={ICON_SIZE} strokeWidth={1.75} />,
  },
};

const PROJECTS_VIEW_SHORT_SUBTITLES: Record<HomeProjectsView, string> = {
  pinned: "Your pins.",
  updated: "Latest activity first.",
  name: "A–Z.",
};

/** The Projects collection's heading follows its view (Pinned / Recently updated / All). */
const PROJECTS_VIEW_ICONS: Record<HomeProjectsView, ReactNode> = {
  pinned: <Pin size={ICON_SIZE} strokeWidth={1.75} />,
  updated: <History size={ICON_SIZE} strokeWidth={1.75} />,
  name: <LuxiaProjectsIcon size={ICON_SIZE} color="currentColor" />,
};

/** Per-tool heading overrides (the tile's own tool is the clearest label). */
const TOOL_SECTIONS: Record<string, Omit<HomeTileSection, "title">> = {
  "writing-assistant": {
    subtitle: "Write and edit documents with AI.",
    shortSubtitle: "Write with AI.",
    icon: <LuxiaWritingAssistantIcon size={ICON_SIZE} color="currentColor" />,
  },
};

/**
 * Section heading shown above a tile, or null when the tile already renders
 * its own Home section heading (Your focus / Projects collection at Full width).
 */
export function getHomeTileSection(tile: HomeTile): HomeTileSection | null {
  if (homeTileUsesContentHeight(tile)) return null;
  return getHomeTileHeading(tile);
}

/** The tile's heading at any size (used where a Full-width tile must draw its own). */
export function getHomeTileHeading(tile: HomeTile): HomeTileSection {
  if (tile.type === "projects-collection") {
    const view = getHomeProjectsView(tile);
    const copy = HOME_PROJECTS_VIEW_COPY[view];
    return {
      title: copy.title,
      // "Recently updated projects" can't fit a Small tile; the subtitle still says they're Projects.
      ...(view === "updated" ? { shortTitle: "Recently updated" } : {}),
      subtitle: copy.subtitle,
      shortSubtitle: PROJECTS_VIEW_SHORT_SUBTITLES[view],
      icon: PROJECTS_VIEW_ICONS[view],
    };
  }
  if (tile.type === "tool" && tile.target) {
    const tool = LUXIA_TOOLS.find((entry) => entry.id === tile.target?.entityId);
    const override = tool ? TOOL_SECTIONS[tool.id] : undefined;
    if (tool && override) return { ...HOME_TILE_SECTIONS.tool, ...override, title: tool.name };
  }
  return HOME_TILE_SECTIONS[tile.type];
}
