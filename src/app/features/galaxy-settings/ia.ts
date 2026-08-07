/**
 * Galaxy Settings information architecture.
 * Matches Constellation Settings tab pattern — horizontal tabs, no Danger Zone.
 */

export type GalaxySettingsSectionId =
  | "general"
  | "instruction"
  | "routing"
  | "tools"
  | "access";

/** URL `?tab=` values for Galaxy Settings. */
export type GalaxySettingsTabParam =
  | "general"
  | "instruction-response"
  | "constellation-routing"
  | "helios-tools"
  | "access-availability";

export const GALAXY_SETTINGS_SECTIONS: {
  id: GalaxySettingsSectionId;
  label: string;
}[] = [
  { id: "general", label: "General" },
  { id: "instruction", label: "Instruction & Response" },
  { id: "routing", label: "Constellation Routing" },
  { id: "tools", label: "Helios & Tools" },
  { id: "access", label: "Access & Availability" },
];

const SECTION_TO_TAB: Record<GalaxySettingsSectionId, GalaxySettingsTabParam> = {
  general: "general",
  instruction: "instruction-response",
  routing: "constellation-routing",
  tools: "helios-tools",
  access: "access-availability",
};

const TAB_TO_SECTION: Record<GalaxySettingsTabParam, GalaxySettingsSectionId> = {
  general: "general",
  "instruction-response": "instruction",
  "constellation-routing": "routing",
  "helios-tools": "tools",
  "access-availability": "access",
};

/** Legacy tab param from earlier Tools & Helios label. */
const LEGACY_TAB_ALIASES: Record<string, GalaxySettingsSectionId> = {
  "tools-helios": "tools",
};

const TAB_PARAM_SET = new Set<string>(Object.keys(TAB_TO_SECTION));

export function galaxySettingsSectionToTab(
  section: GalaxySettingsSectionId,
): GalaxySettingsTabParam {
  return SECTION_TO_TAB[section];
}

/** Missing or invalid `tab` → General. */
export function parseGalaxySettingsTabParam(
  raw: string | null | undefined,
): GalaxySettingsSectionId {
  if (!raw) return "general";
  if (raw in LEGACY_TAB_ALIASES) return LEGACY_TAB_ALIASES[raw]!;
  if (!TAB_PARAM_SET.has(raw)) return "general";
  return TAB_TO_SECTION[raw as GalaxySettingsTabParam];
}

export function parseGalaxySettingsTabFromSearch(
  search: string,
): GalaxySettingsSectionId {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(normalized);
  return parseGalaxySettingsTabParam(params.get("tab"));
}

export const GALAXY_SETTINGS_GUIDANCE = {
  page:
    "Configure how this Project’s Galaxy responds, routes requests, and uses available tools.",
  instruction:
    "Guide how Galaxy should interpret requests and structure its responses.",
  routingAuto:
    "Galaxy automatically selects an available Constellation for the request.",
  routingManual:
    "You select the Constellation context before sending a Galaxy request.",
  routingEmptyTitle: "No available Constellations",
  routingEmptyBody:
    "Galaxy needs an available Constellation before it can route a request.",
  heliosOrchestration:
    "Helios orchestrates how Galaxy interprets requests, selects context, applies instructions, and uses available capabilities to produce responses.",
  toolsIntro: "Capabilities Helios may use when answering in Galaxy.",
  accessProject: "Available through Project membership",
  readOnlyTitle: "Read only",
  readOnlyBody: "You do not have permission to change Galaxy settings.",
} as const;

export const GALAXY_SETTINGS_PAGE_VARIANT = "wide" as const;

export const GALAXY_CONFIGURE_DENIED_MESSAGE =
  "You do not have permission to change Galaxy settings.";

/** Cap for available-Constellation names listed in Settings Routing. */
export const GALAXY_SETTINGS_CONSTELLATION_LIST_CAP = 8;

export const GALAXY_MANUAL_ROUTE_REQUIRED_MESSAGE =
  "Select a Constellation before sending in Manual routing.";
