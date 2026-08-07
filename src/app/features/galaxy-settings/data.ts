import {
  GALAXY_DEFAULT_INSTRUCTION,
  type GalaxyRouteMode,
} from "@/app/features/galaxy";
import type { GalaxyCapabilityInfo, GalaxySettingsRecord } from "./types";

/** Real named capabilities shown on the Galaxy card — informational only (no runtime toggles). */
export const GALAXY_HELIOS_CAPABILITIES: GalaxyCapabilityInfo[] = [
  {
    id: "verification",
    name: "Verification",
    description: "Checks answers against available Constellation context.",
  },
  {
    id: "writing-assistant",
    name: "Writing Assistant",
    description: "Helps structure and refine Galaxy responses.",
  },
];

export function buildGalaxySettingsRecord(input: {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  instruction?: string;
  routeMode?: GalaxyRouteMode;
  updatedAt?: string;
}): GalaxySettingsRecord {
  return {
    id: input.id,
    projectId: input.projectId,
    projectName: input.projectName,
    name: input.name,
    instruction: input.instruction ?? GALAXY_DEFAULT_INSTRUCTION,
    routeMode: input.routeMode ?? "auto",
    updatedAt: input.updatedAt ?? "Just now",
  };
}

export function cloneGalaxySettingsRecord(
  record: GalaxySettingsRecord,
): GalaxySettingsRecord {
  return { ...record };
}
