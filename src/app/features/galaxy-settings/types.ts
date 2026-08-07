import type { GalaxyRouteMode } from "@/app/features/galaxy";

/** Informational Helios capabilities — not independently toggled in this prototype. */
export type GalaxyCapabilityInfo = {
  id: string;
  name: string;
  description: string;
};

export type GalaxySettingsRecord = {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  instruction: string;
  routeMode: GalaxyRouteMode;
  updatedAt: string;
};

export type GalaxySettingsDraft = {
  name: string;
  instruction: string;
  routeMode: GalaxyRouteMode;
};

export type GalaxyAvailableConstellation = {
  id: string;
  name: string;
};

export function draftFromGalaxySettings(
  record: GalaxySettingsRecord,
): GalaxySettingsDraft {
  return {
    name: record.name,
    instruction: record.instruction,
    routeMode: record.routeMode,
  };
}

export function galaxySettingsDraftEqual(
  a: GalaxySettingsDraft,
  b: GalaxySettingsDraft,
): boolean {
  return (
    a.name === b.name
    && a.instruction === b.instruction
    && a.routeMode === b.routeMode
  );
}
