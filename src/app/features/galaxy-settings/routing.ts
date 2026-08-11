import { getConstellationSettingsRecord } from "@/app/features/constellation-settings/data";
import type { HomeConstellationSource } from "@/app/features/home/types";
import {
  evaluateConstellationUseAccess,
  type AccessLevelRecord,
  type DataSourceCatalogItem,
  type ProjectMembership,
  type ProjectRole,
} from "@/app/features/permissions";
import type { GalaxyConstellationRoutingItem } from "./types";

function mapConstellationType(type: string): HomeConstellationSource {
  if (type === "pdf") return "pdf";
  if (type === "csv") return "csv";
  return "database";
}

function typeLabel(type: HomeConstellationSource): string {
  if (type === "pdf") return "PDF";
  if (type === "csv") return "CSV";
  return "Database";
}

function toSafeUnavailableReason(reason: string): string {
  if (reason.includes("Data Source")) return "Required data access unavailable";
  if (reason.includes("connected Data Sources")) return "No connected Data Sources";
  if (reason.includes("invitation")) return "Project access pending";
  if (reason.includes("not an active member")) return "Project access unavailable";
  return "Unavailable";
}

export function buildGalaxyConstellationRoutingItems(input: {
  projectConstellations: Array<{ id: string; label: string; type: string }>;
  projectRole: ProjectRole | null | undefined;
  membershipStatus?: ProjectMembership["status"];
  userId: string;
  accessLevels: AccessLevelRecord[];
  dataSources: DataSourceCatalogItem[];
  constellationSettingsById?: Record<
    string,
    ReturnType<typeof getConstellationSettingsRecord>
  >;
}): GalaxyConstellationRoutingItem[] {
  return input.projectConstellations.map((constellation) => {
    const record = input.constellationSettingsById?.[constellation.id]
      ?? getConstellationSettingsRecord(constellation.id);
    const connectedSourceIds = record?.connectedSources.map((source) => source.id) ?? [];
    const access = evaluateConstellationUseAccess({
      userId: input.userId,
      projectRole: input.projectRole,
      membershipStatus: input.membershipStatus,
      connectedSourceIds,
      accessLevels: input.accessLevels,
      dataSources: input.dataSources,
    });
    const mappedType = mapConstellationType(constellation.type);

    return {
      id: constellation.id,
      name: constellation.label,
      type: mappedType,
      typeLabel: typeLabel(mappedType),
      available: access.available,
      unavailableReason: access.available
        ? undefined
        : toSafeUnavailableReason(access.reason),
    };
  });
}

export function filterRoutingItemsBySearch(
  items: GalaxyConstellationRoutingItem[],
  query: string,
): GalaxyConstellationRoutingItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(normalized)
      || item.typeLabel.toLowerCase().includes(normalized),
  );
}

export function idsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}
