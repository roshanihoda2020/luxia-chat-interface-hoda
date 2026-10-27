import type { CsvColumnDraft } from "../types";
import {
  CSV_COLUMN_TYPE_LABELS,
  normalizeColumnName,
  type CsvColumnType,
  type CsvParseResult,
} from "./parse";

const BOOLEAN_VALUES = new Set([
  "true",
  "false",
  "yes",
  "no",
]);

const ISO_DATE = /^(\d{4}-\d{2}-\d{2})([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

const INT32_MIN = BigInt("-2147483648");
const INT32_MAX = BigInt("2147483647");

export function isIntegerValue(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  return /^-?\d+$/.test(value);
}

export function isInt32Value(raw: string): boolean {
  const value = raw.trim();
  if (!isIntegerValue(value)) return false;
  try {
    const parsed = BigInt(value);
    return parsed >= INT32_MIN && parsed <= INT32_MAX;
  } catch {
    return false;
  }
}

export function isTimestampValue(raw: string): boolean {
  return isDateValue(raw) && looksLikeIsoDateTime(raw);
}

export function isDateOnlyValue(raw: string): boolean {
  const value = raw.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && isDateValue(value);
}

export function isNumberValue(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  if (isIntegerValue(value)) return true;
  return /^-?(?:\d+\.\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)
    || /^-?\d+[eE][+-]?\d+$/.test(value);
}

export function isBooleanValue(raw: string): boolean {
  return BOOLEAN_VALUES.has(raw.trim().toLowerCase());
}

export function looksLikeIsoDateTime(raw: string): boolean {
  const value = raw.trim();
  return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value);
}

export function looksLikeFormattedDate(raw: string): boolean {
  const value = raw.trim();
  if (isDateValue(value) || looksLikeIsoDateTime(value)) return true;
  return /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?$/.test(value)
    || /^\d{4}[./-]\d{1,2}[./-]\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?$/.test(value);
}

function calendarDateIsValid(year: number, month: number, day: number): boolean {
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

export function isDateValue(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  if (isIntegerValue(value) || isNumberValue(value)) return false;
  if (!ISO_DATE.test(value) && !looksLikeIsoDateTime(value)) return false;
  const dateParts = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateParts) return false;
  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]);
  const day = Number(dateParts[3]);
  if (!calendarDateIsValid(year, month, day)) return false;
  const timeParts = value.match(/[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (timeParts) {
    const hour = Number(timeParts[1]);
    const minute = Number(timeParts[2]);
    const second = timeParts[3] === undefined ? 0 : Number(timeParts[3]);
    if (hour > 23 || minute > 59 || second > 59) return false;
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return false;
  return !Number.isNaN(new Date(parsed).getTime());
}

function sampleValues(values: string[]): string[] {
  const nonEmpty = values.filter((value) => value.trim() !== "");
  const unique: string[] = [];
  for (const value of nonEmpty) {
    if (!unique.includes(value)) unique.push(value);
    if (unique.length >= 3) break;
  }
  return unique;
}

function timestampFormatLabel(values: string[]): string | undefined {
  const sample = values.map((value) => value.trim()).find((value) => isTimestampValue(value));
  if (!sample) return undefined;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(sample)) return "YYYY-MM-DD HH:MM:SS";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(sample)) return "YYYY-MM-DDTHH:MM:SS";
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(sample)) return "YYYY-MM-DD HH:MM";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(sample)) return "YYYY-MM-DDTHH:MM";
  return undefined;
}

export function inferColumnType(values: string[]): {
  type: CsvColumnType;
  needsReview: boolean;
  dateFormat?: string;
} {
  const sampled = values.filter((value) => value.trim() !== "");
  if (sampled.length === 0) {
    return { type: "Text", needsReview: false };
  }

  const timestampHits = sampled.filter(isTimestampValue).length;
  const dateOnlyHits = sampled.filter(isDateOnlyValue).length;
  const dateLikeHits = sampled.filter((value) => looksLikeFormattedDate(value)).length;
  const dateRatio = dateLikeHits / sampled.length;

  if (timestampHits === sampled.length) {
    return { type: "Timestamp", needsReview: false, dateFormat: timestampFormatLabel(sampled) };
  }
  if (dateOnlyHits === sampled.length) {
    return { type: "Date", needsReview: false, dateFormat: "YYYY-MM-DD" };
  }

  // Majority date-like values stay temporal. Invalid cells are validation issues.
  if (dateLikeHits >= 2 && dateRatio >= 0.7) {
    const preferTimestamp = timestampHits > 0 && timestampHits >= dateOnlyHits;
    if (preferTimestamp) {
      return {
        type: "Timestamp",
        needsReview: timestampHits !== sampled.length,
        dateFormat: timestampFormatLabel(sampled),
      };
    }
    return {
      type: "Date",
      needsReview: dateOnlyHits !== sampled.length,
      dateFormat: dateOnlyHits > 0 ? "YYYY-MM-DD" : undefined,
    };
  }

  if (sampled.every(isBooleanValue)) {
    return { type: "Boolean", needsReview: false };
  }
  if (sampled.every((value) => isIntegerValue(value) && !looksLikeIsoDateTime(value))) {
    const fitsInt32 = sampled.every(isInt32Value);
    return { type: fitsInt32 ? "Integer" : "BigInt", needsReview: false };
  }
  if (sampled.every((value) => isNumberValue(value) && !looksLikeIsoDateTime(value))) {
    return { type: "Number", needsReview: false };
  }

  return { type: "Text", needsReview: false };
}

export function columnReviewReason(input: {
  type: CsvColumnType;
  values: string[];
}): string {
  const sampled = input.values.filter((value) => value.trim() !== "");
  if (input.type === "Date" || input.type === "Timestamp") {
    const matches = input.type === "Timestamp" ? isTimestampValue : isDateOnlyValue;
    const mismatches = sampled.filter((value) => !matches(value));
    if (mismatches.length > 0) {
      return input.type === "Timestamp"
        ? "Some values do not match the detected timestamp format."
        : "Some values do not match the detected date format.";
    }
  }

  const kinds = new Set(
    sampled.map((value) => {
      if (isDateValue(value) || looksLikeIsoDateTime(value) || looksLikeFormattedDate(value)) return "date";
      if (isBooleanValue(value)) return "boolean";
      if (isIntegerValue(value)) return "integer";
      if (isNumberValue(value)) return "number";
      return "text";
    }),
  );
  if (kinds.size > 1) {
    return "Mixed values detected in this column.";
  }
  return "The detected type should be confirmed before validation.";
}

export function bindCsvColumnIds(fileId: string, columns: CsvColumnDraft[]): CsvColumnDraft[] {
  return columns.map((column, index) => ({
    ...column,
    id: `${fileId}:col-${index + 1}`,
  }));
}

export function inferCsvSchema(parsed: CsvParseResult, fileId?: string): CsvColumnDraft[] {
  const columns = parsed.headers.map((header, index) => {
    const original = parsed.originalHeaders[index] ?? header;
    const values = parsed.records.map((record) => record.fields[index] ?? "");
    const inferred = inferColumnType(values);
    const originalName = original.trim() === "" ? header : original;
    return {
      id: `col-${index + 1}`,
      name: originalName,
      originalName,
      normalizedName: normalizeColumnName(header),
      detectedType: inferred.type,
      type: inferred.type,
      examples: sampleValues(values),
      dateFormat: inferred.dateFormat,
      status: inferred.needsReview ? "needs-review" as const : "inferred" as const,
      warning: inferred.needsReview
        ? columnReviewReason({ type: inferred.type, values })
        : undefined,
      notes: "",
    };
  });
  return fileId ? bindCsvColumnIds(fileId, columns) : columns;
}

export function csvColumnTypeLabel(type: CsvColumnType | string): string {
  if (type in CSV_COLUMN_TYPE_LABELS) {
    return CSV_COLUMN_TYPE_LABELS[type as CsvColumnType];
  }
  return type;
}

export function selectedColumnType(column: CsvColumnDraft): CsvColumnType {
  const type = column.type;
  if (
    type === "Text"
    || type === "Integer"
    || type === "BigInt"
    || type === "Number"
    || type === "Boolean"
    || type === "Date"
    || type === "Timestamp"
  ) {
    return type;
  }
  return "Text";
}

export function valueMatchesType(raw: string, type: CsvColumnType): boolean {
  const value = raw.trim();
  if (value === "") return true;
  switch (type) {
    case "Integer":
      return isInt32Value(value);
    case "BigInt":
      return isIntegerValue(value);
    case "Number":
      return isNumberValue(value);
    case "Boolean":
      return isBooleanValue(value);
    case "Date":
      return isDateOnlyValue(value);
    case "Timestamp":
      return isTimestampValue(value);
    case "Text":
      return true;
    default:
      return true;
  }
}

export function columnTypeConfidence(
  values: string[],
  type: CsvColumnType,
  needsConfirmation: boolean,
): { label: string; detail: string | null } {
  const evidence = values.map((value) => value.trim()).filter(Boolean);
  const matchCount = evidence.filter((value) => valueMatchesType(value, type)).length;
  const evidenceCount = evidence.length;
  const countLabel = evidenceCount > 0
    ? `${matchCount.toLocaleString()} of ${evidenceCount.toLocaleString()} values match`
    : null;
  if (needsConfirmation) {
    return {
      label: "Needs confirmation",
      detail: matchCount === evidenceCount ? null : countLabel,
    };
  }
  if (evidenceCount === 0 || matchCount === evidenceCount) {
    return { label: "All values match", detail: null };
  }
  if (matchCount / evidenceCount >= 0.7) {
    return { label: countLabel ?? "Most values match", detail: null };
  }
  return { label: "Needs confirmation", detail: countLabel };
}

export function columnProblemCopy(type: CsvColumnType, dateFormat?: string): string {
  if (type === "Timestamp") {
    return dateFormat
      ? "Not a timestamp in the detected format"
      : "Not a timestamp";
  }
  if (type === "Date") {
    return dateFormat ? "Not a date in the detected format" : "Not a date";
  }
  if (type === "Integer" || type === "BigInt") return "Not an integer";
  if (type === "Number") return "Not a number";
  if (type === "Boolean") return "Not a boolean";
  return "Value does not match the column type";
}
