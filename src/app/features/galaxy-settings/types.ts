import type { GalaxyRouteMode } from "@/app/features/galaxy";
import type { HomeConstellationSource } from "@/app/features/home/types";

/** Informational Helios capabilities — not independently toggled in this prototype. */
export type GalaxyCapabilityInfo = {
  id: string;
  name: string;
  description: string;
  status: "Available";
};

export type GalaxySettingsRecord = {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  instruction: string;
  routeMode: GalaxyRouteMode;
  manualConstellationIds: string[];
  updatedAt: string;
};

export type GalaxySettingsDraft = {
  name: string;
  instruction: string;
  routeMode: GalaxyRouteMode;
  manualConstellationIds: string[];
};

export type GalaxyAvailableConstellation = {
  id: string;
  name: string;
};

export type GalaxyConstellationRoutingItem = {
  id: string;
  name: string;
  type: HomeConstellationSource;
  typeLabel: string;
  available: boolean;
  unavailableReason?: string;
};

export type GalaxyInstructionConflict = {
  constellationId: string;
  constellationName: string;
  conflictKind: "language" | "response-style";
  conflictLabel: string;
  galaxyExcerpt: string;
  constellationExcerpt: string;
  result: string;
};

export function draftFromGalaxySettings(
  record: GalaxySettingsRecord,
): GalaxySettingsDraft {
  return {
    name: record.name,
    instruction: record.instruction,
    routeMode: record.routeMode,
    manualConstellationIds: [...record.manualConstellationIds],
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
    && idsEqual(a.manualConstellationIds, b.manualConstellationIds)
  );
}

export function generalDraftDirty(
  draft: GalaxySettingsDraft,
  baseline: GalaxySettingsDraft,
): boolean {
  return draft.name !== baseline.name;
}

export function instructionDraftDirty(
  draft: GalaxySettingsDraft,
  baseline: GalaxySettingsDraft,
): boolean {
  return draft.instruction !== baseline.instruction;
}

export function routingDraftDirty(
  draft: GalaxySettingsDraft,
  baseline: GalaxySettingsDraft,
): boolean {
  return (
    draft.routeMode !== baseline.routeMode
    || !idsEqual(draft.manualConstellationIds, baseline.manualConstellationIds)
  );
}

function idsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

export function resolveManualSelectionIds(
  draftIds: string[],
  availableIds: string[],
): string[] {
  if (draftIds.length > 0) {
    const allowed = new Set(availableIds);
    return draftIds.filter((id) => allowed.has(id));
  }
  return [...availableIds];
}
