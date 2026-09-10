import {
  GALAXY_DEFAULT_INSTRUCTION,
  type GalaxyRouteMode,
} from "@/app/features/galaxy";
import type { GalaxyCapabilityInfo, GalaxySettingsRecord } from "./types";

/** Canonical Helios capabilities — shared by Galaxy Settings and Project Overview. */
export const GALAXY_HELIOS_CAPABILITIES: GalaxyCapabilityInfo[] = [
  {
    id: "verification",
    name: "Verification",
    description: "Helps validate response quality.",
    status: "Available",
  },
  {
    id: "writing-assistant",
    name: "Writing Assistant",
    description: "Supports structured writing tasks.",
    status: "Available",
  },
];

export function buildGalaxySettingsRecord(input: {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  instruction?: string;
  routeMode?: GalaxyRouteMode;
  manualConstellationIds?: string[];
  updatedAt?: string;
}): GalaxySettingsRecord {
  return {
    id: input.id,
    projectId: input.projectId,
    projectName: input.projectName,
    name: input.name,
    instruction: input.instruction ?? GALAXY_DEFAULT_INSTRUCTION,
    routeMode: input.routeMode ?? "auto",
    manualConstellationIds: input.manualConstellationIds ?? [],
    updatedAt: input.updatedAt ?? "Just now",
  };
}

export function cloneGalaxySettingsRecord(
  record: GalaxySettingsRecord,
): GalaxySettingsRecord {
  return {
    ...record,
    manualConstellationIds: [...record.manualConstellationIds],
  };
}

export function galaxyHeliosCapabilityCount(): number {
  return GALAXY_HELIOS_CAPABILITIES.length;
}

export function galaxyHeliosCapabilityLabels(): string[] {
  return GALAXY_HELIOS_CAPABILITIES.map((capability) => capability.name);
}
