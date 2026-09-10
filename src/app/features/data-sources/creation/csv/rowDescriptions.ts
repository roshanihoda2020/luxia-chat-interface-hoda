import type { CsvImportFileDraft, CsvRowDescriptionEntry } from "./fileDraft";
import type { CsvRecord } from "./parse";

export const ROW_DESCRIPTION_PAGE_SIZES = [10, 25, 50] as const;
export const ROW_DESCRIPTION_PAGE_SIZE_DEFAULT = 10;

export function importableCsvRecords(file: CsvImportFileDraft): CsvRecord[] {
  const skipped = new Set(file.skipped);
  return (file.parsed?.records ?? []).filter((record) => !skipped.has(record.rowNumber));
}

export function resolvedRowFields(file: CsvImportFileDraft, record: CsvRecord): string[] {
  const overrides = file.overrides[record.rowNumber] ?? {};
  return file.columns.map((column, index) => overrides[column.id] ?? record.fields[index] ?? "");
}

export function csvRecordPreview(file: CsvImportFileDraft, record: CsvRecord, maxParts = 3): string {
  const values = resolvedRowFields(file, record)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, maxParts);
  return values.join(" · ");
}

export function rowDescriptionFor(
  file: CsvImportFileDraft,
  rowNumber: number,
): CsvRowDescriptionEntry | undefined {
  return file.rowDescriptions?.[rowNumber];
}

export function rowDescriptionStats(file: CsvImportFileDraft): {
  total: number;
  described: number;
  missing: number;
} {
  const rows = importableCsvRecords(file);
  let described = 0;
  for (const record of rows) {
    if (file.rowDescriptions?.[record.rowNumber]?.text.trim()) described += 1;
  }
  return {
    total: rows.length,
    described,
    missing: Math.max(0, rows.length - described),
  };
}

export function rowDescriptionReviewLabel(file: CsvImportFileDraft): string {
  const { total, described, missing } = rowDescriptionStats(file);
  if (total === 0) return "No rows";
  if (described === 0) return "None";
  if (missing === 0) return `${described.toLocaleString()} generated`;
  return `${described.toLocaleString()} described · ${missing.toLocaleString()} missing`;
}
