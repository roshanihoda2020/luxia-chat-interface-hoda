import type { CsvColumnDraft, CsvValidationIssue, CsvValidationSummary } from "../types";
import type { CsvColumnType, CsvParseResult } from "./parse";
import { inferColumnType, selectedColumnType, valueMatchesType } from "./schema";

export function validateCsvRows(input: {
  parsed: CsvParseResult;
  columns: CsvColumnDraft[];
  overrides: Record<number, Record<string, string>>;
  skipped: ReadonlySet<number>;
  previouslyInvalid: ReadonlySet<number>;
}): CsvValidationSummary {
  const issues: CsvValidationIssue[] = [];
  const resolvedRows = new Set<number>();

  for (const record of input.parsed.records) {
    if (input.skipped.has(record.rowNumber)) continue;
    const rowOverrides = input.overrides[record.rowNumber] ?? {};
    let rowInvalid = false;
    input.columns.forEach((column, index) => {
      const expected = selectedColumnType(column);
      const raw = rowOverrides[column.id] ?? record.fields[index] ?? "";
      if (valueMatchesType(raw, expected)) {
        return;
      }
      rowInvalid = true;
      issues.push({
        rowNumber: record.rowNumber,
        rowIndex: record.rowNumber - 2,
        columnId: column.id,
        columnName: column.name,
        value: raw,
        expected,
      });
    });
    if (!rowInvalid && input.previouslyInvalid.has(record.rowNumber)) {
      resolvedRows.add(record.rowNumber);
    }
  }

  const totalRows = input.parsed.records.length;
  const skippedRows = [...input.skipped].filter((rowNumber) =>
    input.parsed.records.some((record) => record.rowNumber === rowNumber),
  ).length;
  const invalidRowNumbers = new Set(issues.map((issue) => issue.rowNumber));
  const invalidRows = invalidRowNumbers.size;
  const readyRows = totalRows - skippedRows - invalidRows;
  const columnIssues = new Set(issues.map((issue) => issue.columnId)).size;

  return {
    totalRows,
    validRows: readyRows,
    invalidRows,
    skippedRows,
    resolvedRows: resolvedRows.size,
    readyRows,
    columnIssues,
    issues,
    clean: invalidRows === 0,
  };
}

export interface CsvColumnTypeMismatch {
  columnId: string;
  columnName: string;
  selectedType: CsvColumnType;
  detectedType: CsvColumnType;
  invalidCount: number;
  eligibleCount: number;
}

export function detectColumnTypeMismatches(input: {
  parsed: CsvParseResult;
  columns: CsvColumnDraft[];
  summary: CsvValidationSummary;
  skipped: ReadonlySet<number>;
}): CsvColumnTypeMismatch[] {
  const mismatches: CsvColumnTypeMismatch[] = [];
  for (let index = 0; index < input.columns.length; index += 1) {
    const column = input.columns[index]!;
    const selectedType = selectedColumnType(column);
    const values = input.parsed.records
      .filter((record) => !input.skipped.has(record.rowNumber))
      .map((record) => record.fields[index] ?? "");
    const eligible = values.filter((value) => value.trim() !== "");
    const invalidCount = new Set(
      input.summary.issues
        .filter((issue) => issue.columnId === column.id)
        .map((issue) => issue.rowNumber),
    ).size;
    if (eligible.length === 0 || invalidCount === 0) continue;
    const failRatio = invalidCount / eligible.length;
    const massFailure =
      invalidCount >= Math.max(8, Math.ceil(eligible.length * 0.5))
      || (eligible.length >= 20 && failRatio >= 0.5);
    if (!massFailure) continue;
    const detectedType = inferColumnType(values).type;
    if (detectedType === selectedType) continue;
    mismatches.push({
      columnId: column.id,
      columnName: column.name,
      selectedType,
      detectedType,
      invalidCount,
      eligibleCount: eligible.length,
    });
  }
  return mismatches;
}
