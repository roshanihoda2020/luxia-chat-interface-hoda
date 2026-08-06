/**
 * Constellation Settings information architecture.
 * Overview sections only — no duplicate Instruction / Relationships / Data Configuration nav.
 */

import type { LucideIcon } from "lucide-react";
import {
  capabilityMetaForType,
  capsuleCapabilitiesForType,
  type CapsuleCapabilityId,
  type CapsuleConstellationType,
} from "@/app/features/constellation/capsuleCapabilities";

export type ConstellationSettingsSectionId =
  | "general"
  | "configuration"
  | "sources"
  | "access"
  | "lifecycle";

/** URL `?tab=` values for Constellation Settings. */
export type ConstellationSettingsTabParam =
  | "general"
  | "configuration"
  | "connected-data-sources"
  | "access"
  | "lifecycle";

export const CONSTELLATION_SETTINGS_SECTIONS: {
  id: ConstellationSettingsSectionId;
  label: string;
}[] = [
  { id: "general", label: "General" },
  { id: "configuration", label: "Configuration" },
  { id: "sources", label: "Connected Data Sources" },
  { id: "access", label: "Access" },
  { id: "lifecycle", label: "Lifecycle" },
];

const SECTION_TO_TAB: Record<
  ConstellationSettingsSectionId,
  ConstellationSettingsTabParam
> = {
  general: "general",
  configuration: "configuration",
  sources: "connected-data-sources",
  access: "access",
  lifecycle: "lifecycle",
};

const TAB_TO_SECTION: Record<
  ConstellationSettingsTabParam,
  ConstellationSettingsSectionId
> = {
  general: "general",
  configuration: "configuration",
  "connected-data-sources": "sources",
  access: "access",
  lifecycle: "lifecycle",
};

/** Legacy tab params / section ids — map to Lifecycle during prototype. */
const LEGACY_TAB_ALIASES: Record<string, ConstellationSettingsSectionId> = {
  "danger-zone": "lifecycle",
  danger: "lifecycle",
};

const TAB_PARAM_SET = new Set<string>(Object.keys(TAB_TO_SECTION));

export function constellationSettingsSectionToTab(
  section: ConstellationSettingsSectionId,
): ConstellationSettingsTabParam {
  return SECTION_TO_TAB[section];
}

/** Missing or invalid `tab` → General. Legacy `danger-zone` → Lifecycle. */
export function parseConstellationSettingsTabParam(
  raw: string | null | undefined,
): ConstellationSettingsSectionId {
  if (!raw) return "general";
  if (raw in LEGACY_TAB_ALIASES) return LEGACY_TAB_ALIASES[raw]!;
  if (!TAB_PARAM_SET.has(raw)) return "general";
  return TAB_TO_SECTION[raw as ConstellationSettingsTabParam];
}

export function parseConstellationSettingsTabFromSearch(
  search: string,
): ConstellationSettingsSectionId {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(normalized);
  return parseConstellationSettingsTabParam(params.get("tab"));
}

export const CONSTELLATION_SETTINGS_GUIDANCE = {
  sourcesDescription:
    "Associate Data Sources with this Constellation. Access Levels stay on Data Sources.",
  accessDescription:
    "A person can use this Constellation only when their Project role allows it and they can use all required Data Sources.",
  lifecycleDescription:
    "Manage this Constellation's lifecycle.",
} as const;

export const CONSTELLATION_SETTINGS_PAGE_VARIANT = "wide" as const;

export function configurationCapabilitiesForType(
  type: CapsuleConstellationType,
): Array<{
  id: CapsuleCapabilityId;
  label: string;
  purpose: string;
  manageLabel: string;
  icon: LucideIcon;
}> {
  return capsuleCapabilitiesForType(type).map((id) => {
    const meta = capabilityMetaForType(id, type);
    return {
      id,
      label: meta.label,
      purpose: meta.purpose,
      manageLabel: meta.manageLabel,
      icon: meta.icon,
    };
  });
}
