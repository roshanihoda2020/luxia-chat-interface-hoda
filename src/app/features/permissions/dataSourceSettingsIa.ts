/**
 * Data Source Settings information architecture.
 * Full-page horizontal tabs, matching Constellation Settings.
 * Schema is omitted until a real schema-management capability exists.
 */

import type {
  CsvImportedTableSummary,
  DataSourceCatalogItem,
  DataSourceContentSummary,
} from "./types";

export type DataSourceSettingsSectionId =
  | "general"
  | "connection"
  | "content"
  | "access"
  | "usage"
  | "lifecycle";

/** Deep-link targets from the library and other surfaces. */
export type DataSourceSettingsFocusSection = "general" | "usage" | "access" | "content" | "lifecycle";

export type DataSourceSettingsContentKind = DataSourceContentSummary["kind"];

export const DATA_SOURCE_SETTINGS_USAGE_PREVIEW_LIMIT = 6;

export const DATA_SOURCE_SETTINGS_SECTION_LABELS: Record<
  DataSourceSettingsSectionId,
  string
> = {
  general: "General",
  connection: "Connection",
  content: "Content",
  access: "Access",
  usage: "Usage",
  lifecycle: "Lifecycle",
};

/** Type-specific label for the content tab. Google Sheets imports share the CSV kind. */
const CONTENT_SECTION_LABEL_BY_KIND: Record<DataSourceSettingsContentKind, string> = {
  file: "Tag & Extract",
  csv: "Tables",
  database: DATA_SOURCE_SETTINGS_SECTION_LABELS.connection,
};

export function getDataSourceSettingsContentLabel(
  kind: DataSourceSettingsContentKind,
): string {
  return CONTENT_SECTION_LABEL_BY_KIND[kind];
}

/**
 * The content tab (Tag & Extract, Tables, or Connection) when this source has one.
 * Mirrors `getDataSourceSettingsNavItems`, so a deep link never targets a missing tab.
 */
export function getDataSourceSettingsContentNavItem(
  source: DataSourceCatalogItem | null | undefined,
): { id: DataSourceSettingsSectionId; label: string } | null {
  const kind = getDataSourceSettingsContentKind(source);
  if (!kind || !source?.contentSummary) return null;
  return {
    id: kind === "database" ? "connection" : "content",
    label: getDataSourceSettingsContentLabel(kind),
  };
}

export function getDataSourceSettingsContentKind(
  source: DataSourceCatalogItem | null | undefined,
): DataSourceSettingsContentKind | null {
  if (!source) return null;
  if (source.contentSummary?.kind) return source.contentSummary.kind;
  if (
    source.connector === "csv"
    || source.connector === "googlesheet"
    || source.type === "CSV"
  ) {
    return "csv";
  }
  if (
    source.connector === "file"
    || source.type === "PDF"
    || source.type === "File"
  ) {
    return "file";
  }
  if (source.connector || source.type === "Database") return "database";
  return null;
}

export function getDataSourceSettingsNavItems(input: {
  kind: DataSourceSettingsContentKind | null;
  hasContentSummary: boolean;
}): Array<{ id: DataSourceSettingsSectionId; label: string }> {
  const items: Array<{ id: DataSourceSettingsSectionId; label: string }> = [
    { id: "general", label: DATA_SOURCE_SETTINGS_SECTION_LABELS.general },
  ];

  if (input.kind === "database" && input.hasContentSummary) {
    items.push({
      id: "connection",
      label: DATA_SOURCE_SETTINGS_SECTION_LABELS.connection,
    });
  } else if (
    (input.kind === "csv" || input.kind === "file")
    && input.hasContentSummary
  ) {
    items.push({
      id: "content",
      label: getDataSourceSettingsContentLabel(input.kind),
    });
  }

  items.push(
    { id: "access", label: DATA_SOURCE_SETTINGS_SECTION_LABELS.access },
    { id: "usage", label: DATA_SOURCE_SETTINGS_SECTION_LABELS.usage },
    { id: "lifecycle", label: DATA_SOURCE_SETTINGS_SECTION_LABELS.lifecycle },
  );

  return items;
}

export function resolveDataSourceSettingsSection(
  focus: DataSourceSettingsFocusSection | null | undefined,
  available: readonly DataSourceSettingsSectionId[],
): DataSourceSettingsSectionId {
  const fallback = available[0] ?? "general";
  const requested: DataSourceSettingsSectionId =
    focus === "usage"
      ? "usage"
      : focus === "access"
        ? "access"
        : focus === "lifecycle"
          ? "lifecycle"
          : focus === "content"
          ? available.includes("connection")
            ? "connection"
            : available.includes("content")
              ? "content"
              : fallback
          : "general";

  return available.includes(requested) ? requested : fallback;
}

/** Shared name validation for Settings → General and the library Rename action. */
export function parseDataSourceNameInput(value: string): string | null {
  const name = value.trim();
  return name ? name : null;
}

export function csvTablesFromContentSummary(
  summary: DataSourceContentSummary,
): CsvImportedTableSummary[] {
  if (summary.kind !== "csv") return [];
  if (summary.csvTables && summary.csvTables.length > 0) return summary.csvTables;
  if (!summary.fileName && !summary.tableName) return [];
  return [
    {
      id: "legacy",
      fileName: summary.fileName ?? "",
      tableName: summary.tableName ?? "",
      tableDescription: summary.tableDescription,
      tableDescriptionOrigin: summary.tableDescriptionOrigin,
      delimiter: summary.delimiter,
      encoding: summary.encoding,
      importedRows: summary.importedRows,
      skippedRows: summary.skippedRows,
    },
  ];
}
