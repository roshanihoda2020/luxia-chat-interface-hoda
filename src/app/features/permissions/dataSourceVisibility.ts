import { CANONICAL_CONSTELLATIONS } from "@/app/features/constellation/catalog";
import type {
  AccessLevelPermission,
  AccessLevelRecord,
  DataSourceCatalogItem,
} from "./types";
import {
  DATA_SOURCE_CATALOG,
  CURRENT_USER_ID,
  permissionRank,
  resolveUserDataSourceAccess,
} from "./data";

/** True when the user has any effective Data Source permission (Owner/Manage/Use/View). */
export function canUserAccessDataSource(
  dataSourceId: string,
  accessLevels: AccessLevelRecord[],
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
  userId: string = CURRENT_USER_ID,
): boolean {
  const resolved = resolveUserDataSourceAccess(
    userId,
    dataSourceId,
    accessLevels,
    dataSources,
  );
  return Boolean(resolved.permission);
}

/**
 * Connecting a Data Source to a Constellation requires effective Use or Manage.
 * View-only is not sufficient. Uses effective access, not creator identity.
 */
export function hasConstellationConnectAccess(
  userId: string,
  dataSourceId: string,
  accessLevels: AccessLevelRecord[],
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
): boolean {
  const resolved = resolveUserDataSourceAccess(
    userId,
    dataSourceId,
    accessLevels,
    dataSources,
  );
  if (!resolved.permission) return false;
  return permissionRank(resolved.permission) >= permissionRank("Use");
}

/** Access-aware catalog — never includes inaccessible Private or ungranted Organizational sources. */
export function listAccessibleDataSources(
  accessLevels: AccessLevelRecord[],
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
  userId: string = CURRENT_USER_ID,
): DataSourceCatalogItem[] {
  return dataSources.filter((source) =>
    canUserAccessDataSource(source.id, accessLevels, dataSources, userId),
  );
}

/** Data Sources the user may connect to a Constellation (effective Use or Manage). */
export function listConstellationConnectableDataSources(
  accessLevels: AccessLevelRecord[],
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
  userId: string = CURRENT_USER_ID,
): DataSourceCatalogItem[] {
  return dataSources.filter((source) =>
    hasConstellationConnectAccess(userId, source.id, accessLevels, dataSources),
  );
}

export type LibraryMyAccessLabel = "Owner" | AccessLevelPermission;

export function getLibraryMyAccessLabel(
  dataSourceId: string,
  accessLevels: AccessLevelRecord[],
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
  userId: string = CURRENT_USER_ID,
): LibraryMyAccessLabel | null {
  const resolved = resolveUserDataSourceAccess(
    userId,
    dataSourceId,
    accessLevels,
    dataSources,
  );
  if (!resolved.permission) return null;
  if (resolved.viaOwner) return "Owner";
  return resolved.permission;
}

export type LibraryTypeCategory = "database" | "csv" | "file";

export function getLibraryTypeCategory(
  source: Pick<DataSourceCatalogItem, "type">,
): LibraryTypeCategory {
  const normalized = source.type.trim().toLowerCase();
  if (normalized.includes("csv")) return "csv";
  if (normalized.includes("pdf") || normalized.includes("file")) return "file";
  return "database";
}

/** Prefers connector subtype when present. */
export function getLibraryTypeLabel(
  source: Pick<DataSourceCatalogItem, "type" | "connector">,
): string {
  if (source.connector) {
    const labels: Record<string, string> = {
      postgres: "PostgreSQL",
      mysql: "MySQL",
      mssql: "Microsoft SQL Server",
      snowflake: "Snowflake",
      redshift: "Redshift",
      bigquery: "BigQuery",
      csv: "CSV",
      // v2 parity: Google Sheet imports surface as CSV in library / Settings Type.
      googlesheet: "CSV",
      file: "File",
    };
    return labels[source.connector] ?? source.connector;
  }
  const category = getLibraryTypeCategory(source);
  if (category === "csv") return "CSV";
  if (category === "file") return "File";
  const raw = source.type.trim();
  if (/database/i.test(raw) && raw.toLowerCase() !== "database") {
    return raw;
  }
  return "Database";
}

export function getLibraryStatusLabel(
  source: Pick<DataSourceCatalogItem, "type" | "status">,
): string {
  const category = getLibraryTypeCategory(source);
  if (category === "database") {
    if (source.status === "active") return "Connected";
    if (source.status === "archived") return "Archived";
    return "Needs attention";
  }
  if (source.status === "active") return "Ready";
  if (source.status === "archived") return "Archived";
  return "Failed";
}

/** Count Constellations that connect this source (canonical + optional live links). */
export function countConnectedConstellations(
  dataSourceId: string,
  liveConnections?: Array<{ id: string; dataSourceIds: string[] }>,
): number {
  const byId = new Set<string>();
  for (const item of CANONICAL_CONSTELLATIONS) {
    if (item.dataSourceIds.includes(dataSourceId)) byId.add(item.id);
  }
  if (liveConnections) {
    for (const item of liveConnections) {
      if (item.dataSourceIds.includes(dataSourceId)) byId.add(item.id);
    }
  }
  return byId.size;
}

export function formatConnectedConstellationCount(count: number): string {
  if (count <= 0) return "—";
  return String(count);
}
