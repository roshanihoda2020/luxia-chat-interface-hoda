import type { DataTableCatalogItem, DataTableRecord } from "@/app/features/active-data-tables/types";
import { cloneTable } from "@/app/features/active-data-tables/utils";

const VIEW_COLUMNS_TEMPLATE: DataTableRecord["columns"] = [
  {
    id: "vcol_01",
    displayName: "Column name 01",
    originalName: "COL_01",
    type: "Text",
    description: "Primary identifier column.",
    language: "EN",
    active: true,
    valueContext: true,
  },
  {
    id: "vcol_02",
    displayName: "Column name 02",
    originalName: "COL_02",
    type: "Number",
    description: "Numeric metric column.",
    language: "EN",
    active: true,
    valueContext: false,
  },
  {
    id: "vcol_03",
    displayName: "Column name 03",
    originalName: "COL_03",
    type: "Date",
    description: "As-of date.",
    language: "EN",
    active: true,
    valueContext: false,
  },
];

const VIEW_ROWS_TEMPLATE: DataTableRecord["rows"] = [
  { id: "vrow-1", values: { vcol_01: "Value 01", vcol_02: "42", vcol_03: "2026-01-12" } },
  { id: "vrow-2", values: { vcol_01: "Value 02", vcol_02: "18", vcol_03: "2026-02-03" } },
  { id: "vrow-3", values: { vcol_01: "Value 03", vcol_02: "7", vcol_03: "2026-03-21" } },
];

function buildCatalogView(
  index: number,
  schema: string,
  sourceDatabase = "Data source name 01",
): DataTableCatalogItem {
  const n = String(index).padStart(2, "0");
  return {
    id: `schema-view-${n}`,
    displayName: `View name ${n}`,
    originalName: `VIEW_NAME_${n}`,
    sourceDatabase,
    description: `Prepared database view from ${schema}.`,
    active: true,
    rowCount: 36 + index * 3,
    columns: VIEW_COLUMNS_TEMPLATE.map((column) => ({ ...column })),
    rows: VIEW_ROWS_TEMPLATE.map((row) => ({
      id: `${row.id}-${n}`,
      values: { ...row.values },
    })),
  };
}

/** Mock schema-view candidates for Manage Views (prototype only). */
export const VIEW_CATALOG: DataTableCatalogItem[] = [
  buildCatalogView(1, "Schema name 01"),
  buildCatalogView(2, "Schema name 01"),
  buildCatalogView(3, "Schema name 01"),
  buildCatalogView(4, "Schema name 02"),
  buildCatalogView(5, "Schema name 02"),
  buildCatalogView(6, "Schema name 02"),
];

/** Ensure selected Views appear in the picker even if created outside the catalog. */
export function mergeViewCatalogWithSelected(
  catalog: DataTableCatalogItem[],
  selected: DataTableRecord[],
): DataTableCatalogItem[] {
  const catalogIds = new Set(catalog.map((item) => item.id));
  const extras = selected
    .filter((view) => !catalogIds.has(view.id))
    .map((view) => cloneTable(view) as DataTableCatalogItem);
  return [...extras, ...catalog.map((item) => cloneTable(item))];
}

export function buildViewsFromSelection(
  selectedIds: string[],
  catalog: DataTableCatalogItem[],
  currentViews: DataTableRecord[],
): DataTableRecord[] {
  const currentById = new Map(currentViews.map((view) => [view.id, view]));
  const catalogById = new Map(catalog.map((item) => [item.id, item]));

  return selectedIds
    .map((id) => {
      const existing = currentById.get(id);
      if (existing) return cloneTable(existing);
      const fromCatalog = catalogById.get(id);
      if (!fromCatalog) return null;
      return { ...cloneTable(fromCatalog), active: true };
    })
    .filter((item): item is DataTableRecord => Boolean(item));
}
