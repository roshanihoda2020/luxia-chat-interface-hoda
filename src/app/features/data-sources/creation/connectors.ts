import type { DataSourceCatalogItem, DataSourceConnector } from "@/app/features/permissions/types";
import {
  AppGenericRegular,
  DocumentCsvRegular,
  DocumentRegular,
  type FluentIcon,
} from "@fluentui/react-icons";
import {
  Cuboid,
  Database,
  type LucideIcon,
} from "lucide-react";
import {
  siGooglebigquery,
  siGooglesheets,
  siMysql,
  siPostgresql,
  siSnowflake,
  type SimpleIcon,
} from "simple-icons";

export type ConnectorGroupId = "database" | "files";

export type DataSourceTypeIconId = DataSourceConnector | "googlesheet" | "other";

/**
 * Brand marks: Simple Icons official paths + brand hex, unmodified.
 * SQL Server and Redshift are not in that package — tinted Lucide marks
 * using those products’ common brand colors.
 * CSV / File / Other use Microsoft Fluent System Icons.
 */
export type DataSourceTypeIconSpec =
  | { kind: "brand"; mark: SimpleIcon }
  | { kind: "generic"; icon: LucideIcon; color?: string }
  | { kind: "fluent"; icon: FluentIcon };

export const DATA_SOURCE_TYPE_ICONS: Record<DataSourceTypeIconId, DataSourceTypeIconSpec> = {
  postgres: { kind: "brand", mark: siPostgresql },
  mysql: { kind: "brand", mark: siMysql },
  mssql: { kind: "generic", icon: Database, color: "#CC2927" },
  snowflake: { kind: "brand", mark: siSnowflake },
  redshift: { kind: "generic", icon: Cuboid, color: "#8C4FFF" },
  bigquery: { kind: "brand", mark: siGooglebigquery },
  csv: { kind: "fluent", icon: DocumentCsvRegular },
  file: { kind: "fluent", icon: DocumentRegular },
  googlesheet: { kind: "brand", mark: siGooglesheets },
  other: { kind: "fluent", icon: AppGenericRegular },
};

export function getDataSourceTypeIcon(id: DataSourceTypeIconId): DataSourceTypeIconSpec {
  return DATA_SOURCE_TYPE_ICONS[id] ?? DATA_SOURCE_TYPE_ICONS.other;
}

/** Resolve a catalog item to the shared type-icon mapping. Unknown types fall back to `other`. */
export function resolveDataSourceTypeIconId(
  source: Pick<DataSourceCatalogItem, "connector" | "type"> | null | undefined,
): DataSourceTypeIconId {
  const connector = source?.connector;
  if (connector && Object.prototype.hasOwnProperty.call(DATA_SOURCE_TYPE_ICONS, connector)) {
    return connector;
  }
  if (!source) return "other";
  const normalized = source.type.trim().toLowerCase();
  if (normalized.includes("csv")) return "csv";
  if (normalized.includes("pdf") || normalized.includes("file")) return "file";
  return "other";
}

export interface DataSourceConnectorOption {
  id: DataSourceConnector;
  label: string;
  group: ConnectorGroupId;
  catalogType: "Database" | "CSV" | "File";
  helper?: string;
}

/** Prototype-only chooser tiles that are visible but not selectable. */
export interface PrototypePlaceholderConnector {
  id: "googlesheet" | "other";
  label: string;
  group: ConnectorGroupId;
  unavailableReason: string;
}

export const CONNECTOR_GROUPS: Array<{
  id: ConnectorGroupId;
  label: string;
}> = [
  { id: "database", label: "Database" },
  { id: "files", label: "Files & data" },
];

export const DATA_SOURCE_CONNECTORS: DataSourceConnectorOption[] = [
  { id: "postgres", label: "PostgreSQL", group: "database", catalogType: "Database", helper: "Relational database" },
  { id: "mysql", label: "MySQL", group: "database", catalogType: "Database", helper: "Relational database" },
  { id: "mssql", label: "Microsoft SQL Server", group: "database", catalogType: "Database", helper: "Relational database" },
  { id: "snowflake", label: "Snowflake", group: "database", catalogType: "Database", helper: "Cloud warehouse" },
  { id: "redshift", label: "Redshift", group: "database", catalogType: "Database", helper: "Cloud warehouse" },
  { id: "bigquery", label: "BigQuery", group: "database", catalogType: "Database", helper: "Analytics warehouse" },
  { id: "csv", label: "CSV", group: "files", catalogType: "CSV", helper: "Tabular upload wizard" },
  { id: "file", label: "File", group: "files", catalogType: "File", helper: "Documents and text" },
];

export const PROTOTYPE_PLACEHOLDER_CONNECTORS: PrototypePlaceholderConnector[] = [
  {
    id: "googlesheet",
    label: "Google Sheet",
    group: "files",
    unavailableReason: "Google Sheet import is not available in this prototype.",
  },
  {
    id: "other",
    label: "Other",
    group: "files",
    unavailableReason: "Custom connectors are not available in this prototype.",
  },
];

export function getConnectorOption(
  id: DataSourceConnector | null | undefined,
): DataSourceConnectorOption | undefined {
  if (!id) return undefined;
  return DATA_SOURCE_CONNECTORS.find((item) => item.id === id);
}

export function isDatabaseConnector(id: DataSourceConnector): boolean {
  return getConnectorOption(id)?.group === "database";
}
