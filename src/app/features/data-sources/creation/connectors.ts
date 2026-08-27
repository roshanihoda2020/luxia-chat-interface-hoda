import type { DataSourceConnector } from "@/app/features/permissions/types";
import {
  Boxes,
  FileSpreadsheet,
  FileText,
  Server,
  Warehouse,
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
 * SQL Server and Redshift are not in that package — Lucide fallbacks.
 */
export type DataSourceTypeIconSpec =
  | { kind: "brand"; mark: SimpleIcon }
  | { kind: "generic"; icon: LucideIcon };

export const DATA_SOURCE_TYPE_ICONS: Record<DataSourceTypeIconId, DataSourceTypeIconSpec> = {
  postgres: { kind: "brand", mark: siPostgresql },
  mysql: { kind: "brand", mark: siMysql },
  mssql: { kind: "generic", icon: Server },
  snowflake: { kind: "brand", mark: siSnowflake },
  redshift: { kind: "generic", icon: Warehouse },
  bigquery: { kind: "brand", mark: siGooglebigquery },
  csv: { kind: "generic", icon: FileSpreadsheet },
  file: { kind: "generic", icon: FileText },
  googlesheet: { kind: "brand", mark: siGooglesheets },
  other: { kind: "generic", icon: Boxes },
};

export function getDataSourceTypeIcon(id: DataSourceTypeIconId): DataSourceTypeIconSpec {
  return DATA_SOURCE_TYPE_ICONS[id];
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
