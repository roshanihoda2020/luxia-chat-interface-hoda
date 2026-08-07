import type { DataSourceConnector } from "@/app/features/permissions/types";
import {
  Database,
  FileSpreadsheet,
  FileText,
  Table2,
  type LucideIcon,
} from "lucide-react";

export type ConnectorGroupId = "database" | "files";

export interface DataSourceConnectorOption {
  id: DataSourceConnector;
  label: string;
  group: ConnectorGroupId;
  catalogType: "Database" | "CSV" | "File";
  Icon: LucideIcon;
  helper?: string;
}

/** Prototype-only chooser tiles that are visible but not selectable. */
export interface PrototypePlaceholderConnector {
  id: "googlesheet" | "other";
  label: string;
  group: ConnectorGroupId;
  Icon: LucideIcon;
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
  { id: "postgres", label: "PostgreSQL", group: "database", catalogType: "Database", Icon: Database, helper: "Relational database" },
  { id: "mysql", label: "MySQL", group: "database", catalogType: "Database", Icon: Database, helper: "Relational database" },
  { id: "mssql", label: "Microsoft SQL Server", group: "database", catalogType: "Database", Icon: Database, helper: "Relational database" },
  { id: "snowflake", label: "Snowflake", group: "database", catalogType: "Database", Icon: Database, helper: "Cloud warehouse" },
  { id: "redshift", label: "Redshift", group: "database", catalogType: "Database", Icon: Database, helper: "Cloud warehouse" },
  { id: "bigquery", label: "BigQuery", group: "database", catalogType: "Database", Icon: Database, helper: "Analytics warehouse" },
  { id: "csv", label: "CSV", group: "files", catalogType: "CSV", Icon: FileSpreadsheet, helper: "Tabular upload wizard" },
  { id: "file", label: "File", group: "files", catalogType: "File", Icon: FileText, helper: "Documents and text" },
];

export const PROTOTYPE_PLACEHOLDER_CONNECTORS: PrototypePlaceholderConnector[] = [
  {
    id: "googlesheet",
    label: "Google Sheet",
    group: "files",
    Icon: Table2,
    unavailableReason: "Google Sheet import is not available in this prototype.",
  },
  {
    id: "other",
    label: "Other",
    group: "files",
    Icon: Database,
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
