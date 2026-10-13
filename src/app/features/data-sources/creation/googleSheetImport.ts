import type { CsvImportedTableSummary, DataSourceContentSummary } from "@/app/features/permissions/types";

/** Same client pattern as Luxia v2 GoogleSheetImportDialog. */
const SHEET_LINK_PATTERN =
  /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]+/i;

/** Hidden prototype failure trigger — not shown in UI. */
const SHEET_FAIL_TOKEN = "__sheet_fail";

export const GOOGLE_SHEET_MOCK_IMPORT_MS = 1400;

export function isGoogleSheetLink(value: string): boolean {
  return SHEET_LINK_PATTERN.test(value.trim());
}

export function shouldFailGoogleSheetPrototype(link: string): boolean {
  return link.includes(SHEET_FAIL_TOKEN);
}

/** Mirror Dev: sheet tab title → table name with non-alphanumerics → `_`. */
export function sanitizeGoogleSheetTableName(tabTitle: string): string {
  return tabTitle.replace(/[^a-zA-Z0-9]/g, "_");
}

const MOCK_SHEET_TABS: Array<{ title: string; importedRows: number }> = [
  { title: "Overview", importedRows: 24 },
  { title: "Orders", importedRows: 186 },
  { title: "Customers", importedRows: 92 },
];

/**
 * Build CSV contentSummary for a successful Google Sheet import.
 * Each tab becomes one table (Dev imports all tabs automatically).
 */
export function buildGoogleSheetContentSummary(
  googleSheetLink: string,
): DataSourceContentSummary {
  const csvTables: CsvImportedTableSummary[] = MOCK_SHEET_TABS.map((tab, index) => {
    const tableName = sanitizeGoogleSheetTableName(tab.title);
    return {
      id: `gs-tab-${index + 1}-${tableName.toLowerCase()}`,
      fileName: tab.title,
      tableName,
      importedRows: tab.importedRows,
      skippedRows: 0,
      delimiter: ",",
      encoding: "UTF-8",
    };
  });

  const first = csvTables[0];
  const importedRows = csvTables.reduce(
    (sum, table) => sum + (table.importedRows ?? 0),
    0,
  );
  const skippedRows = csvTables.reduce(
    (sum, table) => sum + (table.skippedRows ?? 0),
    0,
  );

  return {
    kind: "csv",
    fileName: first?.fileName,
    tableName: first?.tableName,
    delimiter: first?.delimiter,
    encoding: first?.encoding,
    importedRows,
    skippedRows,
    csvTables,
    googleSheetLink: googleSheetLink.trim(),
  };
}

export function delayGoogleSheetMockImport(
  ms: number = GOOGLE_SHEET_MOCK_IMPORT_MS,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
