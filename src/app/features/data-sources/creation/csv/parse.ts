export type CsvDelimiterId = "comma" | "semicolon" | "tab" | "pipe";

export const CSV_DELIMITER_CHARS: Record<CsvDelimiterId, string> = {
  comma: ",",
  semicolon: ";",
  tab: "\t",
  pipe: "|",
};

export const CSV_DELIMITER_LABELS: Record<CsvDelimiterId, string> = {
  comma: "Comma (,)",
  semicolon: "Semicolon (;)",
  tab: "Tab",
  pipe: "Pipe (|)",
};

export const CSV_DELIMITER_IDS = Object.keys(CSV_DELIMITER_CHARS) as CsvDelimiterId[];

export type CsvEncodingId = "utf-8" | "utf-16le" | "utf-16be" | "iso-8859-1";

export const CSV_ENCODING_LABELS: Record<CsvEncodingId, string> = {
  "utf-8": "UTF-8",
  "utf-16le": "UTF-16 LE",
  "utf-16be": "UTF-16 BE",
  "iso-8859-1": "ISO-8859-1",
};

export const CSV_ENCODING_IDS = Object.keys(CSV_ENCODING_LABELS) as CsvEncodingId[];

export type CsvColumnType = "Integer" | "Number" | "Text" | "Date" | "Boolean";

export const CSV_COLUMN_TYPES: CsvColumnType[] = [
  "Integer",
  "Number",
  "Text",
  "Date",
  "Boolean",
];

export type CsvIssueSeverity = "info" | "warning" | "error";

export interface CsvStructuralIssue {
  severity: CsvIssueSeverity;
  message: string;
}

export interface CsvRecord {
  /** 1-based original source row number in the file. */
  rowNumber: number;
  fields: string[];
}

export interface CsvParseResult {
  headers: string[];
  originalHeaders: string[];
  records: CsvRecord[];
  issues: CsvStructuralIssue[];
}

export type CsvHeaderMode = "row" | "none";

export interface CsvHeaderConfig {
  mode: CsvHeaderMode;
  /** 1-based source row used as the header when mode is "row". */
  row: number | null;
}

export const DEFAULT_CSV_HEADER_CONFIG: CsvHeaderConfig = { mode: "row", row: 1 };

export type CsvPhysicalRowRole = "ignored" | "header" | "data";

export function csvHeaderSummaryLabel(config: CsvHeaderConfig): string {
  if (config.mode === "none") return "No header";
  const row = config.row && config.row > 0 ? config.row : 1;
  if (row === 1) return "First row";
  return `Row ${row}`;
}

export function csvPhysicalRowRole(
  sourceRow: number,
  header: CsvHeaderConfig,
): CsvPhysicalRowRole {
  if (header.mode === "none") return "data";
  if (!header.row || header.row < 1) return "data";
  if (sourceRow < header.row) return "ignored";
  if (sourceRow === header.row) return "header";
  return "data";
}

export function csvPhysicalRowRoleLabel(role: CsvPhysicalRowRole): string {
  if (role === "ignored") return "Ignored";
  if (role === "header") return "Header";
  return "Data";
}

export function csvPhysicalRows(text: string, delimiterId: CsvDelimiterId): string[][] {
  return parseCsvRecords(text, CSV_DELIMITER_CHARS[delimiterId]).rows;
}

export function csvPhysicalRowCount(text: string, delimiterId: CsvDelimiterId): number {
  return csvPhysicalRows(text, delimiterId).length;
}

export function validateCsvHeaderRowNumber(raw: string, maxRows: number): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return "Enter a header row number.";
  if (!/^[0-9]+$/.test(trimmed)) return "Enter a whole number.";
  const value = Number(trimmed);
  if (value < 1) return "Header row must be at least 1.";
  if (maxRows <= 0) return "This file has no rows.";
  if (value > maxRows) {
    return `This file has ${maxRows.toLocaleString()} row${maxRows === 1 ? "" : "s"}.`;
  }
  return null;
}

export interface CsvDecodeResult {
  text: string;
  encoding: CsvEncodingId;
  bomRemoved: boolean;
  replacementChars: number;
}

function decoderLabel(encoding: CsvEncodingId): string {
  if (encoding === "iso-8859-1") return "iso-8859-1";
  return encoding;
}

export function detectCsvEncoding(bytes: Uint8Array): {
  encoding: CsvEncodingId;
  bomLength: number;
} {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { encoding: "utf-8", bomLength: 3 };
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { encoding: "utf-16le", bomLength: 2 };
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { encoding: "utf-16be", bomLength: 2 };
  }
  return { encoding: "utf-8", bomLength: 0 };
}

export function decodeCsvBytes(
  bytes: Uint8Array,
  encoding: CsvEncodingId,
  bomLength = 0,
): CsvDecodeResult {
  const slice = bomLength > 0 ? bytes.subarray(bomLength) : bytes;
  const text = new TextDecoder(decoderLabel(encoding), { fatal: false }).decode(slice);
  let replacementChars = 0;
  for (const char of text) {
    if (char === "\uFFFD") replacementChars += 1;
  }
  return {
    text,
    encoding,
    bomRemoved: bomLength > 0,
    replacementChars,
  };
}

function parseCsvRecords(text: string, delimiter: string): {
  rows: string[][];
  unclosedQuote: boolean;
} {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i]!;
    if (inQuotes) {
      if (char === "\"") {
        if (text[i + 1] === "\"") {
          field += "\"";
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (char === "\r") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i += text[i + 1] === "\n" ? 2 : 1;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (inQuotes || field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length > 0) {
    const last = rows[rows.length - 1]!;
    if (last.length === 1 && last[0] === "") {
      rows.pop();
    }
  }

  return { rows, unclosedQuote: inQuotes };
}

function scoreDelimiter(text: string, delimiter: string): number {
  const sample = text.slice(0, 12_000);
  const { rows } = parseCsvRecords(sample, delimiter);
  const usable = rows.filter((row) => row.some((cell) => cell.trim() !== "")).slice(0, 12);
  if (usable.length < 1) return 0;
  const widths = usable.map((row) => row.length);
  const counts = new Map<number, number>();
  for (const width of widths) {
    counts.set(width, (counts.get(width) ?? 0) + 1);
  }
  let bestWidth = 1;
  let bestCount = 0;
  for (const [width, count] of counts) {
    if (count > bestCount || (count === bestCount && width > bestWidth)) {
      bestWidth = width;
      bestCount = count;
    }
  }
  if (bestWidth < 2) return 0;
  return bestCount * bestWidth * 10 + bestWidth;
}

export function detectCsvDelimiter(text: string): CsvDelimiterId {
  let best: CsvDelimiterId = "comma";
  let bestScore = -1;
  for (const id of CSV_DELIMITER_IDS) {
    const score = scoreDelimiter(text, CSV_DELIMITER_CHARS[id]);
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}

function normalizeHeader(raw: string, index: number, used: Set<string>): {
  name: string;
  renamed: boolean;
  empty: boolean;
} {
  const empty = raw.trim() === "";
  let base = empty
    ? `column_${index + 1}`
    : raw.trim().replace(/\s+/g, " ");
  let name = base;
  let renamed = empty;
  let suffix = 2;
  while (used.has(name.toLowerCase())) {
    name = `${base}_${suffix}`;
    suffix += 1;
    renamed = true;
  }
  used.add(name.toLowerCase());
  return { name, renamed, empty };
}

function syntheticColumnName(index: number): string {
  return `Column ${index + 1}`;
}

function headersFromCells(
  cells: string[],
  issues: CsvStructuralIssue[],
): { headers: string[]; originalHeaders: string[] } {
  const originalHeaders = cells.map((cell) => cell);
  const used = new Set<string>();
  const headers = originalHeaders.map((header, index) => {
    const next = normalizeHeader(header, index, used);
    if (next.empty) {
      issues.push({
        severity: "warning",
        message: `Empty header in column ${index + 1} was named ${next.name}.`,
      });
    } else if (next.renamed) {
      issues.push({
        severity: "warning",
        message: `Duplicate header “${header.trim()}” was renamed to ${next.name}.`,
      });
    }
    return next.name;
  });
  return { headers, originalHeaders };
}

function alignRecordFields(fields: string[], width: number): { fields: string[]; mismatched: boolean } {
  if (fields.length === width) return { fields, mismatched: false };
  if (fields.length < width) {
    while (fields.length < width) fields.push("");
  } else {
    fields.length = width;
  }
  return { fields, mismatched: true };
}

function recordsFromRows(
  rows: string[][],
  startIndex: number,
  width: number,
): { records: CsvRecord[]; widthMismatches: number } {
  const records: CsvRecord[] = [];
  let widthMismatches = 0;
  for (let index = startIndex; index < rows.length; index += 1) {
    const fields = [...rows[index]!];
    if (fields.length === 1 && fields[0] === "" && index === rows.length - 1) {
      continue;
    }
    const aligned = alignRecordFields(fields, width);
    if (aligned.mismatched) widthMismatches += 1;
    records.push({
      rowNumber: index + 1,
      fields: aligned.fields,
    });
  }
  return { records, widthMismatches };
}

export function parseCsvTable(
  text: string,
  delimiterId: CsvDelimiterId,
  header: CsvHeaderConfig = DEFAULT_CSV_HEADER_CONFIG,
): CsvParseResult {
  const delimiter = CSV_DELIMITER_CHARS[delimiterId];
  const { rows, unclosedQuote } = parseCsvRecords(text, delimiter);
  const issues: CsvStructuralIssue[] = [];

  if (unclosedQuote) {
    issues.push({
      severity: "error",
      message: "A quoted field was not closed. Later rows may be unreliable.",
    });
  }

  if (rows.length === 0) {
    return { headers: [], originalHeaders: [], records: [], issues };
  }

  if (header.mode === "none") {
    const width = rows[0]!.length;
    const originalHeaders = Array.from({ length: width }, (_, index) => syntheticColumnName(index));
    const { records, widthMismatches } = recordsFromRows(rows, 0, width);
    if (widthMismatches > 0) {
      issues.push({
        severity: "warning",
        message: `${widthMismatches} row${widthMismatches === 1 ? "" : "s"} had a different column count and ${widthMismatches === 1 ? "was" : "were"} aligned to the generated columns.`,
      });
    }
    return { headers: originalHeaders, originalHeaders, records, issues };
  }

  const headerRow = header.row && header.row > 0 ? header.row : 1;
  if (headerRow > rows.length) {
    issues.push({
      severity: "error",
      message: "The selected header row is beyond the file length.",
    });
    return { headers: [], originalHeaders: [], records: [], issues };
  }

  const headerIndex = headerRow - 1;
  const headerCells = [...rows[headerIndex]!];
  const headerEmpty = headerCells.length === 0 || headerCells.every((cell) => cell.trim() === "");
  if (headerEmpty) {
    issues.push({
      severity: "warning",
      message: "The selected header row is empty. Column names were generated.",
    });
  }
  const { headers, originalHeaders } = headerEmpty
    ? (() => {
        const width = Math.max(1, headerCells.length);
        const names = Array.from({ length: width }, (_, index) => syntheticColumnName(index));
        return { headers: names, originalHeaders: names };
      })()
    : headersFromCells(headerCells, issues);
  const { records, widthMismatches } = recordsFromRows(rows, headerIndex + 1, headers.length);
  if (widthMismatches > 0) {
    issues.push({
      severity: "warning",
      message: `${widthMismatches} row${widthMismatches === 1 ? "" : "s"} had a different column count and ${widthMismatches === 1 ? "was" : "were"} aligned to the header.`,
    });
  }

  return { headers, originalHeaders, records, issues };
}

export function defaultTableNameFromFile(fileName: string): string {
  const base = fileName.replace(/\.csv$/i, "").trim();
  if (!base) return "imported_table";
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "imported_table";
}

export function normalizeColumnName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "column";
}
