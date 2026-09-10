import type { CsvColumnDraft, CsvValidationIssue } from "../types";
import {
  CSV_DELIMITER_CHARS,
  CSV_DELIMITER_IDS,
  DEFAULT_CSV_HEADER_CONFIG,
  decodeCsvBytes,
  defaultTableNameFromFile,
  detectCsvDelimiter,
  detectCsvEncoding,
  parseCsvTable,
  type CsvDelimiterId,
  type CsvEncodingId,
  type CsvHeaderConfig,
  type CsvHeaderMode,
  type CsvParseResult,
  type CsvStructuralIssue,
} from "./parse";
import { inferCsvSchema } from "./schema";

export type { CsvHeaderMode };
export type CsvFileUiStatus = "ready" | "needs-review" | "parsing-needs-review" | "error" | "excluded";
export type CsvRowDescriptionOrigin = "ai" | "edited";
export type CsvTableMetaOrigin = "unset" | "ai" | "edited";
export type CsvValueContextMethod = "distinct" | "frequency" | "sum";
export type CsvValueContextOrder = "asc" | "desc";
export type CsvValueContextLimit = 10 | 25 | 50;
export type CsvValueContextOrigin = "retrieved" | "edited";

export interface CsvRowDescriptionEntry {
  text: string;
  origin: CsvRowDescriptionOrigin;
}

export interface CsvColumnValueContext {
  retrievalMethod: CsvValueContextMethod;
  order: CsvValueContextOrder;
  limit: CsvValueContextLimit;
  aggregateColumnId: string | null;
  values: string[];
  origin: CsvValueContextOrigin;
}

export interface CsvImportFileDraft {
  id: string;
  fileName: string;
  size: number;
  lastModified: number;
  fingerprint: string;
  included: boolean;
  bytes: Uint8Array;
  encoding: CsvEncodingId;
  detectedEncoding: CsvEncodingId;
  bomLength: number;
  delimiter: CsvDelimiterId;
  detectedDelimiter: CsvDelimiterId;
  headerMode: CsvHeaderMode;
  headerRow: number | null;
  decodedText: string;
  decodeIssues: CsvStructuralIssue[];
  parsed: CsvParseResult | null;
  columns: CsvColumnDraft[];
  readError: string | null;
  overrides: Record<number, Record<string, string>>;
  skipped: number[];
  lastInvalidRows: number[];
  validationRan: boolean;
  validationStale: boolean;
  issueSnapshot: CsvValidationIssue[];
  tableName: string;
  tableDescription: string;
  descriptionDrafted: boolean;
  tableMetaAiGenerated: boolean;
  tableNameOrigin: CsvTableMetaOrigin;
  tableDescriptionOrigin: CsvTableMetaOrigin;
  /** Keyed by source rowNumber. Does not mutate CSV cells. */
  rowDescriptions: Record<number, CsvRowDescriptionEntry>;
  /** Does not mutate CSV cells. */
  valueContext: Record<string, CsvColumnValueContext>;
  /** Unsaved; omitted from create payload until saved. */
  valueContextDraft: Record<string, CsvColumnValueContext>;
}

function nextFileId(fileName: string): string {
  return `csv-${fileName}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function csvFileFingerprint(
  fileName: string,
  size: number,
  lastModified: number,
): string {
  return `${fileName.trim().toLowerCase()}|${size}|${lastModified}`;
}

function decodeIssuesFor(bytes: Uint8Array, encoding: CsvEncodingId): {
  decoded: ReturnType<typeof decodeCsvBytes>;
  issues: CsvStructuralIssue[];
  bomLength: number;
  detectedEncoding: CsvEncodingId;
} {
  const detected = detectCsvEncoding(bytes);
  const decoded = decodeCsvBytes(bytes, encoding, detected.bomLength);
  const issues: CsvStructuralIssue[] = [];
  if (decoded.bomRemoved) {
    issues.push({
      severity: "info",
      message:
        detected.encoding === "utf-8"
          ? "UTF-8 BOM removed."
          : "Byte order mark (BOM) removed.",
    });
  }
  if (decoded.replacementChars > 0) {
    issues.push({
      severity: "warning",
      message: `${decoded.replacementChars} replacement character${decoded.replacementChars === 1 ? "" : "s"} appeared. The selected encoding may be wrong.`,
    });
  }
  return {
    decoded,
    issues,
    bomLength: detected.bomLength,
    detectedEncoding: detected.encoding,
  };
}

export function csvFileHasUsableParse(file: CsvImportFileDraft): boolean {
  if (file.readError || !file.parsed) return false;
  if (file.parsed.headers.length === 0 || file.columns.length === 0) return false;
  const issues = [...file.decodeIssues, ...file.parsed.issues];
  return !issues.some((issue) => issue.severity === "error");
}

export function csvFileHasSuspiciousDelimiter(file: CsvImportFileDraft): boolean {
  const columnCount = file.columns.length || file.parsed?.headers.length || 0;
  if (columnCount !== 1) return false;
  const header = file.columns[0]?.name ?? file.parsed?.headers[0] ?? "";
  if (CSV_DELIMITER_IDS.some((id) => header.includes(CSV_DELIMITER_CHARS[id]))) {
    return true;
  }
  if (!file.decodedText) return false;
  const detected = detectCsvDelimiter(file.decodedText);
  if (detected === file.delimiter) return false;
  const alternative = parseCsvTable(file.decodedText, detected, {
    mode: file.headerMode,
    row: file.headerRow,
  });
  return alternative.headers.length > 1;
}

export function csvFileNeedsParsingReview(file: CsvImportFileDraft): boolean {
  return file.included && csvFileHasSuspiciousDelimiter(file);
}

export function csvFileIsStructurallyUsable(file: CsvImportFileDraft): boolean {
  return csvFileHasUsableParse(file) && !csvFileHasSuspiciousDelimiter(file);
}

export function csvFileNeedsSchemaReview(file: CsvImportFileDraft): boolean {
  if (!file.included) return false;
  if (!csvFileHasUsableParse(file)) return true;
  if (csvFileNeedsParsingReview(file)) return true;
  return file.columns.some((column) => column.status === "needs-review");
}

export function csvFileSchemaUiStatus(file: CsvImportFileDraft): CsvFileUiStatus {
  if (!file.included) return "excluded";
  if (!csvFileHasUsableParse(file)) return "error";
  if (csvFileNeedsParsingReview(file)) return "parsing-needs-review";
  if (file.columns.some((column) => column.status === "needs-review")) return "needs-review";
  return "ready";
}

export function csvFileUiStatus(file: CsvImportFileDraft): CsvFileUiStatus {
  if (!file.included) return "excluded";
  if (!csvFileHasUsableParse(file)) return "error";
  if (csvFileNeedsParsingReview(file)) return "parsing-needs-review";
  if (file.decodeIssues.some((issue) => issue.severity === "warning")) return "needs-review";
  return "ready";
}

export function csvFileNotices(file: CsvImportFileDraft): CsvStructuralIssue[] {
  return [...file.decodeIssues, ...(file.parsed?.issues ?? [])];
}

export function csvHeaderConfigFor(file: Pick<CsvImportFileDraft, "headerMode" | "headerRow">): CsvHeaderConfig {
  if (file.headerMode === "none") return { mode: "none", row: null };
  return { mode: "row", row: file.headerRow && file.headerRow > 0 ? file.headerRow : 1 };
}

export function reparseCsvImportFile(
  file: CsvImportFileDraft,
  options: {
    encoding?: CsvEncodingId;
    delimiter?: CsvDelimiterId;
    headerMode?: CsvHeaderMode;
    headerRow?: number | null;
    invalidateDownstream?: boolean;
  } = {},
): CsvImportFileDraft {
  const encoding = options.encoding ?? file.encoding;
  const { decoded, issues, bomLength, detectedEncoding } = decodeIssuesFor(
    file.bytes,
    encoding,
  );
  const detectedDelimiter = detectCsvDelimiter(decoded.text);
  const delimiter = options.delimiter ?? detectedDelimiter;
  const headerMode = options.headerMode ?? file.headerMode ?? DEFAULT_CSV_HEADER_CONFIG.mode;
  const headerRow =
    headerMode === "none"
      ? null
      : options.headerRow !== undefined
        ? options.headerRow && options.headerRow > 0
          ? options.headerRow
          : 1
        : file.headerRow && file.headerRow > 0
          ? file.headerRow
          : 1;
  const parsed = parseCsvTable(decoded.text, delimiter, { mode: headerMode, row: headerRow });
  const structuralIssues = [...parsed.issues];
  if (parsed.headers.length === 0) {
    structuralIssues.push({
      severity: "error",
      message: "This file is empty or has no columns.",
    });
  }
  const parsedWithIssues: CsvParseResult = { ...parsed, issues: structuralIssues };
  const columns = inferCsvSchema(parsedWithIssues, file.id);
  return {
    ...file,
    encoding,
    detectedEncoding,
    bomLength,
    delimiter,
    detectedDelimiter,
    headerMode,
    headerRow,
    decodedText: decoded.text,
    decodeIssues: issues,
    parsed: parsedWithIssues,
    columns,
    readError: null,
    overrides: {},
    skipped: [],
    lastInvalidRows: [],
    validationRan: false,
    validationStale: Boolean(options.invalidateDownstream),
    issueSnapshot: [],
    rowDescriptions: {},
    valueContext: {},
    valueContextDraft: {},
  };
}

export function buildCsvImportFile(
  fileName: string,
  bytes: Uint8Array,
  meta?: { size?: number; lastModified?: number },
): CsvImportFileDraft {
  const size = meta?.size ?? bytes.byteLength;
  const lastModified = meta?.lastModified ?? 0;
  const detected = detectCsvEncoding(bytes);
  return reparseCsvImportFile(
    {
      id: nextFileId(fileName),
      fileName,
      size,
      lastModified,
      fingerprint: csvFileFingerprint(fileName, size, lastModified),
      included: true,
      bytes,
      encoding: detected.encoding,
      detectedEncoding: detected.encoding,
      bomLength: detected.bomLength,
      delimiter: "comma",
      detectedDelimiter: "comma",
      headerMode: "row",
      headerRow: 1,
      decodedText: "",
      decodeIssues: [],
      parsed: null,
      columns: [],
      readError: null,
      overrides: {},
      skipped: [],
      lastInvalidRows: [],
      validationRan: false,
      validationStale: false,
      issueSnapshot: [],
      tableName: defaultTableNameFromFile(fileName),
      tableDescription: "",
      descriptionDrafted: false,
      tableMetaAiGenerated: false,
      tableNameOrigin: "unset",
      tableDescriptionOrigin: "unset",
      rowDescriptions: {},
      valueContext: {},
      valueContextDraft: {},
    },
    { encoding: detected.encoding },
  );
}

export function includedCsvFiles(files: CsvImportFileDraft[]): CsvImportFileDraft[] {
  return files.filter((file) => file.included);
}

export function tableNameConflictKey(tableName: string): string {
  return tableName.trim().toLowerCase();
}

export function duplicateTableNameKeys(files: CsvImportFileDraft[]): Set<string> {
  const counts = new Map<string, number>();
  for (const file of includedCsvFiles(files)) {
    const key = tableNameConflictKey(file.tableName);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set(
    [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key),
  );
}

export function csvColumnNameConflict(
  columns: CsvColumnDraft[],
  columnId: string,
  nextName: string,
): string | null {
  const trimmed = nextName.trim();
  if (!trimmed) return "Enter a column name.";
  const taken = columns.some(
    (column) =>
      column.id !== columnId
      && column.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (taken) return "Column names must be unique.";
  return null;
}
