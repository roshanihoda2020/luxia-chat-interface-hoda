import type { DataTableRecord } from "@/app/features/active-data-tables/types";
import { cloneTable } from "@/app/features/active-data-tables/utils";

export type CreationDatabaseTableOption = {
  id: string;
  name: string;
  schema: string;
};

export type CreationDatabaseViewOption = {
  id: string;
  name: string;
  schema: string;
};

export const CREATION_DATABASE_TABLES: CreationDatabaseTableOption[] = [
  { id: "creation-tbl-01", name: "Table name 01", schema: "Schema name 01" },
  { id: "creation-tbl-02", name: "Table name 02", schema: "Schema name 01" },
  { id: "creation-tbl-03", name: "Table name 03", schema: "Schema name 01" },
  { id: "creation-tbl-04", name: "Table name 04", schema: "Schema name 02" },
  { id: "creation-tbl-05", name: "Table name 05", schema: "Schema name 02" },
  { id: "creation-tbl-06", name: "Table name 06", schema: "Schema name 02" },
];

export const CREATION_DATABASE_VIEWS: CreationDatabaseViewOption[] = [
  { id: "creation-view-01", name: "View name 01", schema: "Schema name 01" },
  { id: "creation-view-02", name: "View name 02", schema: "Schema name 02" },
];

/** Distinct schema names available in the creation mock catalog. */
export function getCreationDatabaseSchemas(): string[] {
  const schemas = new Set<string>();
  for (const table of CREATION_DATABASE_TABLES) {
    schemas.add(table.schema);
  }
  return [...schemas].sort((a, b) => a.localeCompare(b));
}

/**
 * Derive the effective schema label from selected tables (for Review and creation payload).
 * Single schema → that name; multiple → comma-separated list; none → empty string.
 */
export function deriveDatabaseSchemaFromSelection(
  selectedTableIds: readonly string[],
): string {
  const schemas = new Set<string>();
  for (const tableId of selectedTableIds) {
    const table = CREATION_DATABASE_TABLES.find((item) => item.id === tableId);
    if (table) schemas.add(table.schema);
  }
  if (schemas.size === 0) return "";
  return [...schemas].sort((a, b) => a.localeCompare(b)).join(", ");
}

const TABLE_TEMPLATE: DataTableRecord = {
  id: "creation-tbl-template",
  displayName: "Table name 01",
  originalName: "TABLE_NAME_01",
  sourceDatabase: "Data source name 01",
  description: "Structured table selected during Constellation creation.",
  active: true,
  rowCount: 120,
  columns: [
    {
      id: "col_01",
      displayName: "Column name 01",
      originalName: "COL_01",
      type: "Text",
      description: "Primary identifier column.",
      language: "EN",
      active: true,
      valueContext: true,
    },
    {
      id: "col_02",
      displayName: "Column name 02",
      originalName: "COL_02",
      type: "Number",
      description: "Numeric metric column.",
      language: "EN",
      active: true,
      valueContext: false,
    },
  ],
  rows: [
    { id: "row-1", values: { col_01: "Value 01", col_02: "42" } },
    { id: "row-2", values: { col_01: "Value 02", col_02: "18" } },
  ],
};

export function buildCreationTablesFromSelection(
  tableIds: string[],
  dataSourceName: string,
): DataTableRecord[] {
  return tableIds
    .map((tableId) => {
      const option = CREATION_DATABASE_TABLES.find((item) => item.id === tableId);
      if (!option) return null;
      const table = cloneTable(TABLE_TEMPLATE);
      table.id = tableId;
      table.displayName = option.name;
      table.originalName = option.name.replace(/\s+/g, "_").toUpperCase();
      table.sourceDatabase = dataSourceName.trim() || "Data source name 01";
      table.description = "Structured table selected during Constellation creation.";
      return table;
    })
    .filter((item): item is DataTableRecord => Boolean(item));
}

const VIEW_TEMPLATE: DataTableRecord = {
  ...TABLE_TEMPLATE,
  id: "creation-view-template",
  displayName: "View name 01",
  originalName: "VIEW_NAME_01",
  description: "Database view selected during Constellation creation.",
  rowCount: 48,
};

export function buildCreationViewsFromSelection(
  viewIds: string[],
  dataSourceName: string,
): DataTableRecord[] {
  return viewIds
    .map((viewId) => {
      const option = CREATION_DATABASE_VIEWS.find((item) => item.id === viewId);
      if (!option) return null;
      const view = cloneTable(VIEW_TEMPLATE);
      view.id = viewId;
      view.displayName = option.name;
      view.originalName = option.name.replace(/\s+/g, "_").toUpperCase();
      view.sourceDatabase = dataSourceName.trim() || "Data source name 01";
      view.description = "Database view selected during Constellation creation.";
      return view;
    })
    .filter((item): item is DataTableRecord => Boolean(item));
}
