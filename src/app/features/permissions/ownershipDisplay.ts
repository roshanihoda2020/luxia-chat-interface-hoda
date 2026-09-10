import type { AccessLevelRecord } from "./types";
import type { DataSourceCatalogItem } from "./types";
import {
  CURRENT_USER_ID,
  formatAccessLevelNames,
  getOrganizationUserById,
  resolveUserDataSourceAccess,
} from "./data";

export const ORGANIZATIONAL_OWNER_LABEL = "Organization";
export const ORGANIZATIONAL_MANAGED_LABEL = "Organization managed";
export const NO_ACCESS_LEVEL_ASSIGNED_LABEL = "No Access Level assigned yet";

export type DataSourceOwnerFields = Pick<
  DataSourceCatalogItem,
  "ownership" | "ownerUserId"
>;

/** Canonical owner label for UI — never a personal name for organizational sources. */
export function getDataSourceOwnerDisplay(source: DataSourceOwnerFields): string {
  if (source.ownership === "organizational") {
    return ORGANIZATIONAL_OWNER_LABEL;
  }
  if (!source.ownerUserId) {
    return "—";
  }
  return getOrganizationUserById(source.ownerUserId)?.name ?? "Unknown user";
}

export function getOwnershipLabel(
  ownership: DataSourceCatalogItem["ownership"],
): "Organizational" | "Private" {
  return ownership === "organizational" ? "Organizational" : "Private";
}

/** Truthful connected-source / list access summary — no placeholder Access Level names. */
export function buildDataSourceAccessSummary(
  source: Pick<DataSourceCatalogItem, "id" | "ownership" | "ownerUserId">,
  accessLevels: AccessLevelRecord[],
  userId: string = CURRENT_USER_ID,
  dataSources?: DataSourceCatalogItem[],
): string {
  if (source.ownership === "private" && source.ownerUserId === userId) {
    return "Owner access";
  }

  const resolved = resolveUserDataSourceAccess(
    userId,
    source.id,
    accessLevels,
    dataSources,
  );

  if (resolved.viaOwner) {
    return "Owner access";
  }

  const levelNames = formatAccessLevelNames(resolved.accessLevelNames);
  if (resolved.permission && levelNames) {
    return `${resolved.permission} via ${levelNames}`;
  }
  if (resolved.permission) {
    return resolved.permission;
  }

  if (source.ownership === "organizational") {
    return NO_ACCESS_LEVEL_ASSIGNED_LABEL;
  }

  return "No Data Source permission";
}

/** Access Level name column for Constellation Access rows. */
export function buildAccessLevelNameForSource(
  source: Pick<DataSourceCatalogItem, "id" | "ownership" | "ownerUserId">,
  accessLevels: AccessLevelRecord[],
  userId: string = CURRENT_USER_ID,
  dataSources?: DataSourceCatalogItem[],
): string {
  if (source.ownership === "private" && source.ownerUserId === userId) {
    return "Owner access";
  }

  const resolved = resolveUserDataSourceAccess(
    userId,
    source.id,
    accessLevels,
    dataSources,
  );

  if (resolved.viaOwner) {
    return "Owner access";
  }

  const levelNames = formatAccessLevelNames(resolved.accessLevelNames);
  if (levelNames) {
    return levelNames;
  }

  if (source.ownership === "organizational") {
    return NO_ACCESS_LEVEL_ASSIGNED_LABEL;
  }

  return "—";
}
