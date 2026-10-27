import type { CsvColumnDraft } from "../types";
import type {
  CsvColumnValueContext,
  CsvImportFileDraft,
  CsvValueContextLimit,
  CsvValueContextMethod,
  CsvValueContextOrder,
} from "./fileDraft";
import { importableCsvRecords, resolvedRowFields } from "./rowDescriptions";
import { isNumberValue, selectedColumnType } from "./schema";

export const VALUE_CONTEXT_LIMITS = [10, 25, 50] as const;
export const VALUE_CONTEXT_LIMIT_DEFAULT: CsvValueContextLimit = 10;

export interface CsvValueContextConfig {
  retrievalMethod: CsvValueContextMethod;
  order: CsvValueContextOrder;
  limit: CsvValueContextLimit;
  aggregateColumnId: string | null;
}

export const DEFAULT_VALUE_CONTEXT_CONFIG: CsvValueContextConfig = {
  retrievalMethod: "distinct",
  order: "asc",
  limit: VALUE_CONTEXT_LIMIT_DEFAULT,
  aggregateColumnId: null,
};

export type CsvValueContextRetrieveResult =
  | { status: "ok"; values: string[] }
  | { status: "error"; message: string };

function columnIndex(file: CsvImportFileDraft, columnId: string): number {
  return file.columns.findIndex((column) => column.id === columnId);
}

function isNumericColumn(column: CsvColumnDraft): boolean {
  const type = selectedColumnType(column);
  return type === "Integer" || type === "BigInt" || type === "Number";
}

export function numericAggregateColumns(
  file: CsvImportFileDraft,
  targetColumnId?: string,
): CsvColumnDraft[] {
  return file.columns.filter((column) => {
    if (targetColumnId && column.id === targetColumnId) return false;
    return isNumericColumn(column);
  });
}

export function hasNumericAggregateColumn(file: CsvImportFileDraft, targetColumnId?: string): boolean {
  return numericAggregateColumns(file, targetColumnId).length > 0;
}

function parseNumericCell(raw: string): number | null {
  const value = raw.trim();
  if (!value || !isNumberValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolvedColumnValues(file: CsvImportFileDraft, columnId: string): string[] {
  const index = columnIndex(file, columnId);
  if (index < 0) return [];
  const values: string[] = [];
  for (const record of importableCsvRecords(file)) {
    const value = resolvedRowFields(file, record)[index]?.replace(/\s+/g, " ").trim() ?? "";
    if (value) values.push(value);
  }
  return values;
}

export function columnHasImportableValues(file: CsvImportFileDraft, columnId: string): boolean {
  return resolvedColumnValues(file, columnId).length > 0;
}

function applyOrderAndLimit<T>(
  items: T[],
  order: CsvValueContextOrder,
  limit: CsvValueContextLimit,
  metric: (a: T, b: T) => number,
  tieBreak: (a: T, b: T) => number = () => 0,
): T[] {
  const direction = order === "asc" ? 1 : -1;
  return [...items]
    .sort((a, b) => {
      const delta = metric(a, b);
      if (delta !== 0) return delta * direction;
      return tieBreak(a, b);
    })
    .slice(0, limit);
}

function distinctValues(values: string[], order: CsvValueContextOrder, limit: CsvValueContextLimit): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }
  return applyOrderAndLimit(unique, order, limit, (a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function frequentValues(values: string[], order: CsvValueContextOrder, limit: CsvValueContextLimit): string[] {
  const counts = new Map<string, { value: string; count: number; firstIndex: number }>();
  values.forEach((value, index) => {
    const current = counts.get(value);
    if (current) {
      current.count += 1;
      return;
    }
    counts.set(value, { value, count: 1, firstIndex: index });
  });
  return applyOrderAndLimit(
    [...counts.values()],
    order,
    limit,
    (a, b) => a.count - b.count,
    (a, b) => a.firstIndex - b.firstIndex,
  ).map((item) => item.value);
}

function sumValues(
  file: CsvImportFileDraft,
  targetColumnId: string,
  aggregateColumnId: string,
  order: CsvValueContextOrder,
  limit: CsvValueContextLimit,
): CsvValueContextRetrieveResult {
  const targetIndex = columnIndex(file, targetColumnId);
  const aggregateIndex = columnIndex(file, aggregateColumnId);
  if (targetIndex < 0) return { status: "error", message: "The selected column is not in this table." };
  if (aggregateIndex < 0) return { status: "error", message: "Choose an aggregate column." };
  if (targetColumnId === aggregateColumnId) {
    return { status: "error", message: "The aggregate column must be different from the selected column." };
  }
  const aggregate = file.columns[aggregateIndex];
  if (!aggregate || !isNumericColumn(aggregate)) {
    return { status: "error", message: "The aggregate column must be Integer or Number." };
  }
  const groups = new Map<string, { value: string; sum: number; firstIndex: number }>();
  importableCsvRecords(file).forEach((record, index) => {
    const fields = resolvedRowFields(file, record);
    const target = fields[targetIndex]?.replace(/\s+/g, " ").trim() ?? "";
    if (!target) return;
    const amount = parseNumericCell(fields[aggregateIndex] ?? "");
    if (amount === null) return;
    const current = groups.get(target);
    if (current) {
      current.sum += amount;
      return;
    }
    groups.set(target, { value: target, sum: amount, firstIndex: index });
  });
  return {
    status: "ok",
    values: applyOrderAndLimit(
      [...groups.values()],
      order,
      limit,
      (a, b) => a.sum - b.sum,
      (a, b) => a.firstIndex - b.firstIndex,
    ).map((item) => item.value),
  };
}

export function retrieveValueContext(
  file: CsvImportFileDraft,
  targetColumnId: string,
  config: CsvValueContextConfig,
): CsvValueContextRetrieveResult {
  if (columnIndex(file, targetColumnId) < 0) {
    return { status: "error", message: "The selected column is not in this table." };
  }
  if (config.retrievalMethod === "sum") {
    if (!config.aggregateColumnId) {
      return { status: "error", message: "Choose an aggregate column to rank by SUM." };
    }
    return sumValues(file, targetColumnId, config.aggregateColumnId, config.order, config.limit);
  }
  const values = resolvedColumnValues(file, targetColumnId);
  return {
    status: "ok",
    values:
      config.retrievalMethod === "frequency"
        ? frequentValues(values, config.order, config.limit)
        : distinctValues(values, config.order, config.limit),
  };
}

export function canBulkRetrieveSum(
  file: CsvImportFileDraft,
  selectedColumnIds: string[],
  aggregateColumnId: string | null,
): boolean {
  if (!aggregateColumnId || selectedColumnIds.length === 0) return false;
  const aggregate = file.columns.find((column) => column.id === aggregateColumnId);
  if (!aggregate || !isNumericColumn(aggregate)) return false;
  if (selectedColumnIds.includes(aggregateColumnId)) return false;
  return selectedColumnIds.every((columnId) => file.columns.some((column) => column.id === columnId));
}

export function valueContextFor(
  file: CsvImportFileDraft,
  columnId: string,
): CsvColumnValueContext | undefined {
  return file.valueContext?.[columnId];
}

export function valueContextDraftFor(
  file: CsvImportFileDraft,
  columnId: string,
): CsvColumnValueContext | undefined {
  return file.valueContextDraft?.[columnId];
}

export function workingValueContext(
  file: CsvImportFileDraft,
  columnId: string,
): CsvColumnValueContext | undefined {
  return valueContextDraftFor(file, columnId) ?? valueContextFor(file, columnId);
}

export function hasWorkingValueContext(file: CsvImportFileDraft, columnId: string): boolean {
  const entry = workingValueContext(file, columnId);
  return Boolean(entry && entry.values.some((value) => value.trim()));
}

export type CsvValueContextColumnStatus = "not-configured" | "retrieved" | "saved" | "edited-unsaved";

export function valueContextColumnStatus(
  file: CsvImportFileDraft,
  columnId: string,
): CsvValueContextColumnStatus {
  const draft = valueContextDraftFor(file, columnId);
  const saved = valueContextFor(file, columnId);
  if (draft) {
    return draft.origin === "edited" ? "edited-unsaved" : "retrieved";
  }
  if (saved && saved.values.some((value) => value.trim())) return "saved";
  return "not-configured";
}

export function valueContextColumnStatusLabel(
  file: CsvImportFileDraft,
  columnId: string,
): string {
  const status = valueContextColumnStatus(file, columnId);
  if (status === "not-configured") return "Not configured";
  if (status === "edited-unsaved") return "Edited · unsaved";
  const entry = workingValueContext(file, columnId);
  const count = entry ? entry.values.filter((value) => value.trim()).length : 0;
  if (status === "retrieved") {
    return count > 0 ? `Retrieved · ${count.toLocaleString()}` : "Retrieved";
  }
  return count > 0 ? `Saved · ${count.toLocaleString()}` : "Saved";
}

export function unsavedValueContextColumnIds(file: CsvImportFileDraft): string[] {
  return Object.keys(file.valueContextDraft ?? {}).filter((columnId) => file.valueContextDraft?.[columnId]);
}

export function unsavedValueContextColumnCount(files: CsvImportFileDraft[]): number {
  return files.reduce((sum, file) => sum + unsavedValueContextColumnIds(file).length, 0);
}

export function valueContextStatusLabel(entry: CsvColumnValueContext | undefined): "Not configured" | "Retrieved" | "Edited" {
  if (!entry || entry.values.every((value) => !value.trim())) return "Not configured";
  if (entry.origin === "edited") return "Edited";
  return "Retrieved";
}

export function valueContextPreview(entry: CsvColumnValueContext | undefined, max = 3): string {
  if (!entry) return "—";
  const values = entry.values.map((value) => value.trim()).filter(Boolean);
  if (values.length === 0) return "—";
  const shown = values.slice(0, max);
  return shown.join(" · ");
}

export function valueContextStats(file: CsvImportFileDraft): { columns: number; examples: number } {
  let columns = 0;
  let examples = 0;
  for (const entry of Object.values(file.valueContext ?? {})) {
    const count = entry.values.filter((value) => value.trim()).length;
    if (count === 0) continue;
    columns += 1;
    examples += count;
  }
  return { columns, examples };
}

export function valueContextReviewLabel(file: CsvImportFileDraft): string {
  const { columns, examples } = valueContextStats(file);
  if (columns === 0) return "None";
  return `${columns.toLocaleString()} column${columns === 1 ? "" : "s"} · ${examples.toLocaleString()} example${examples === 1 ? "" : "s"}`;
}

export function valueContextSourceReviewLabel(files: CsvImportFileDraft[]): string {
  let columns = 0;
  let examples = 0;
  for (const file of files) {
    const stats = valueContextStats(file);
    columns += stats.columns;
    examples += stats.examples;
  }
  if (columns === 0) return "None";
  return `${columns.toLocaleString()} column${columns === 1 ? "" : "s"} with value context · ${examples.toLocaleString()} saved example${examples === 1 ? "" : "s"}`;
}

export function valueContextTabLabel(file: CsvImportFileDraft): string {
  const { columns } = valueContextStats(file);
  if (columns === 0) return "Not configured";
  return `${columns.toLocaleString()} column${columns === 1 ? "" : "s"} configured`;
}

export function valueContextCountLabel(entry: CsvColumnValueContext | undefined): string {
  if (!entry) return "—";
  const count = entry.values.filter((value) => value.trim()).length;
  return count === 0 ? "—" : String(count);
}

export function configFromValueContext(entry: CsvColumnValueContext): CsvValueContextConfig {
  return {
    retrievalMethod: entry.retrievalMethod,
    order: entry.order,
    limit: entry.limit,
    aggregateColumnId: entry.retrievalMethod === "sum" ? entry.aggregateColumnId : null,
  };
}

export function buildValueContext(
  config: CsvValueContextConfig,
  values: string[],
  origin: CsvColumnValueContext["origin"] = "retrieved",
): CsvColumnValueContext {
  return {
    retrievalMethod: config.retrievalMethod,
    order: config.order,
    limit: config.limit,
    aggregateColumnId: config.retrievalMethod === "sum" ? config.aggregateColumnId : null,
    values: values.map((value) => value.trim()).filter(Boolean),
    origin,
  };
}

export function buildRetrievedValueContext(
  config: CsvValueContextConfig,
  values: string[],
): CsvColumnValueContext {
  return buildValueContext(config, values, "retrieved");
}
