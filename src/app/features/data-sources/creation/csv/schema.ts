import type { CsvColumnDraft } from "../types";
import {
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

export function isIntegerValue(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  return /^-?\d+$/.test(value);
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

export function inferColumnType(values: string[]): {
  type: CsvColumnType;
  needsReview: boolean;
  dateFormat?: string;
} {
  const sampled = values.filter((value) => value.trim() !== "");
  if (sampled.length === 0) {
    return { type: "Text", needsReview: false };
  }

  const dateHits = sampled.filter(isDateValue).length;
  const dateLikeHits = sampled.filter((value) => looksLikeFormattedDate(value)).length;
  const dateRatio = dateLikeHits / sampled.length;
  const hasIsoDateTime = sampled.some(looksLikeIsoDateTime);

  if (dateHits === sampled.length) {
    const format = hasIsoDateTime ? "ISO date-time" : "YYYY-MM-DD";
    return { type: "Date", needsReview: false, dateFormat: format };
  }

  // Majority date-like (including ISO timestamps with a few invalid cells) stays Date.
  // True invalid values are row-level validation issues, not a reason to infer Integer.
  if (dateLikeHits >= 2 && dateRatio >= 0.7) {
    const format = hasIsoDateTime ? "ISO date-time" : "YYYY-MM-DD";
    return { type: "Date", needsReview: dateHits !== sampled.length, dateFormat: format };
  }

  if (sampled.every(isBooleanValue)) {
    return { type: "Boolean", needsReview: false };
  }
  if (sampled.every((value) => isIntegerValue(value) && !looksLikeIsoDateTime(value))) {
    return { type: "Integer", needsReview: false };
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
  if (input.type === "Date") {
    const mismatches = sampled.filter((value) => !isDateValue(value));
    if (mismatches.length > 0) {
      return "Some values do not match the detected Date format.";
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

export function selectedColumnType(column: CsvColumnDraft): CsvColumnType {
  const type = column.type;
  if (type === "Integer" || type === "Number" || type === "Text" || type === "Date" || type === "Boolean") {
    return type;
  }
  return "Text";
}

export function valueMatchesType(raw: string, type: CsvColumnType): boolean {
  const value = raw.trim();
  if (value === "") return true;
  switch (type) {
    case "Integer":
      return isIntegerValue(value);
    case "Number":
      return isNumberValue(value);
    case "Boolean":
      return isBooleanValue(value);
    case "Date":
      return isDateValue(value);
    case "Text":
      return true;
    default:
      return true;
  }
}
