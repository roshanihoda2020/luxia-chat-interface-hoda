/**
 * Prototype suggestion provider — replace adapter with production AI service.
 *
 * UI code must call `csvAi.ts` (the integration boundary), not this file.
 * Do not surface “prototype” wording in the product UI.
 */

import type { CsvColumnType } from "./csv/parse";
import { inferColumnType, isDateValue, valueMatchesType } from "./csv/schema";
import type {
  CsvAiColumnTypeRequest,
  CsvAiColumnTypeSuccess,
  CsvAiResult,
  CsvAiSimilarRepairRequest,
  CsvAiSimilarRepairSuccess,
  CsvAiTableMetadataRequest,
  CsvAiTableMetadataSuccess,
  CsvAiValueRepairRequest,
  CsvAiValueRepairSuccess,
} from "./csvAi";
import {
  CSV_AI_NO_RELIABLE_FIX,
  CSV_AI_UNAVAILABLE_MESSAGE,
} from "./csvAiMessages";

const PROTOTYPE_LATENCY_MS = 180;

function delay(): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, PROTOTYPE_LATENCY_MS);
  });
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function utcDateParts(
  year: number,
  month: number,
  day: number,
  hour?: number,
  minute?: number,
  second?: number,
): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour !== undefined && (hour > 23 || (minute ?? 0) > 59 || (second ?? 0) > 59)) {
    return null;
  }
  const dt = new Date(Date.UTC(year, month - 1, day, hour ?? 0, minute ?? 0, second ?? 0));
  if (
    dt.getUTCFullYear() !== year
    || dt.getUTCMonth() !== month - 1
    || dt.getUTCDate() !== day
  ) {
    return null;
  }
  if (hour === undefined) return `${year}-${pad(month)}-${pad(day)}`;
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute ?? 0)}:${pad(second ?? 0)}`;
}

function looksUnrecoverable(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^(not_a_date|n\/a|na|null|undefined|#value!|#ref!)$/i.test(trimmed);
}

function parseRecoverableDate(raw: string): string | null {
  const value = raw.trim();
  if (!value || looksUnrecoverable(value)) return null;
  if (isDateValue(value)) return value;

  const ymd = value.match(
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (ymd) {
    return utcDateParts(
      Number(ymd[1]),
      Number(ymd[2]),
      Number(ymd[3]),
      ymd[4] === undefined ? undefined : Number(ymd[4]),
      ymd[5] === undefined ? undefined : Number(ymd[5]),
      ymd[6] === undefined ? undefined : Number(ymd[6]),
    );
  }

  const dmy = value.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!dmy) return null;
  let year = Number(dmy[3]);
  if (year < 100) year += 2000;
  const first = Number(dmy[1]);
  const second = Number(dmy[2]);
  let day = first;
  let month = second;
  if (first > 12 && second <= 12) {
    day = first;
    month = second;
  } else if (second > 12 && first <= 12) {
    day = second;
    month = first;
  }
  return utcDateParts(
    year,
    month,
    day,
    dmy[4] === undefined ? undefined : Number(dmy[4]),
    dmy[5] === undefined ? undefined : Number(dmy[5]),
    dmy[6] === undefined ? undefined : Number(dmy[6]),
  );
}

function repairForType(currentValue: string, selectedType: string): string | null {
  const trimmed = currentValue.trim();
  if (looksUnrecoverable(trimmed)) return null;
  if (valueMatchesType(trimmed, selectedType as CsvColumnType)) {
    return trimmed === currentValue ? null : trimmed;
  }
  if (selectedType === "Date") {
    const next = parseRecoverableDate(trimmed);
    return next && isDateValue(next) ? next : null;
  }
  if (selectedType === "Integer") {
    const compact = trimmed.replace(/,/g, "");
    if (/^-?\d+(?:\.0+)?$/.test(compact)) {
      const asInt = String(Number.parseInt(compact, 10));
      return valueMatchesType(asInt, "Integer") ? asInt : null;
    }
    return null;
  }
  if (selectedType === "Number") {
    const compact = trimmed.replace(/,/g, "");
    return valueMatchesType(compact, "Number") ? compact : null;
  }
  if (selectedType === "Boolean") {
    const lower = trimmed.toLowerCase();
    if (lower === "1" || lower === "y") return "true";
    if (lower === "0" || lower === "n") return "false";
    return null;
  }
  return null;
}

function ok<T>(data: T): CsvAiResult<T> {
  return { status: "ok", data };
}

function noSuggestion<T>(message = CSV_AI_NO_RELIABLE_FIX): CsvAiResult<T> {
  return { status: "no-suggestion", message };
}

function unavailable<T>(): CsvAiResult<T> {
  return { status: "unavailable", message: CSV_AI_UNAVAILABLE_MESSAGE };
}

export async function prototypeSuggestCellFix(
  request: CsvAiValueRepairRequest,
): Promise<CsvAiResult<CsvAiValueRepairSuccess>> {
  await delay();
  try {
    const suggestedValue = repairForType(request.currentValue, request.selectedType);
    if (!suggestedValue || suggestedValue === request.currentValue.trim()) {
      return noSuggestion();
    }
    return ok({
      suggestedValue,
      explanation: `Converted to a ${request.selectedType} value.`,
      confidence: "high",
    });
  } catch {
    return unavailable();
  }
}

export async function prototypeSuggestSimilarFixes(
  request: CsvAiSimilarRepairRequest,
): Promise<CsvAiResult<CsvAiSimilarRepairSuccess>> {
  await delay();
  try {
    const changes = [];
    for (const issue of request.issues) {
      const suggestedValue = repairForType(issue.currentValue, request.selectedType);
      if (!suggestedValue || suggestedValue === issue.currentValue.trim()) continue;
      changes.push({
        rowNumber: issue.rowNumber,
        currentValue: issue.currentValue,
        suggestedValue,
      });
    }
    if (changes.length === 0) {
      return noSuggestion();
    }
    return ok({
      proposedCount: changes.length,
      explanation: `${changes.length.toLocaleString()} of ${request.issues.length.toLocaleString()} can be safely fixed.`,
      changes,
    });
  } catch {
    return unavailable();
  }
}

export async function prototypeSuggestColumnType(
  request: CsvAiColumnTypeRequest,
): Promise<CsvAiResult<CsvAiColumnTypeSuccess>> {
  await delay();
  try {
    const inferred = inferColumnType(request.values);
    if (inferred.type === request.selectedType) {
      return noSuggestion("The current type already looks like the best match.");
    }
    return ok({
      suggestedType: inferred.type,
      explanation: `Most values in ${request.columnName} look like ${inferred.type}.`,
    });
  } catch {
    return unavailable();
  }
}

function looksLikeLogSchema(
  fileName: string,
  columns: Array<{ name: string; type: string }>,
): boolean {
  const names = columns.map((column) => column.name.toLowerCase());
  const fileLooksLikeLogs = /log/i.test(fileName);
  const hasDate = names.some((name) => /date|time|timestamp/.test(name));
  const hasHost = names.some((name) => /host|server|machine/.test(name));
  const hasService = names.some((name) => /service|app|source/.test(name));
  const hasContent = names.some((name) => /content|message|log|text/.test(name));
  return fileLooksLikeLogs || (hasDate && hasHost && (hasService || hasContent));
}

function slugTableName(fileName: string): string {
  return fileName
    .replace(/\.csv$/i, "")
    .toLowerCase()
    .replace(/_with_errors|_correct|_test/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "imported_table";
}

function describeFromColumns(columns: Array<{ name: string; type: string }>): string {
  const names = columns.map((column) => column.name).filter(Boolean);
  if (names.length === 0) {
    return "Imported table from the uploaded CSV file.";
  }
  const listed = names.slice(0, 6).join(", ");
  const extra = names.length > 6 ? `, and ${names.length - 6} more fields` : "";
  return `Imported records containing ${listed}${extra}.`;
}

export async function prototypeSuggestTableMetadata(
  request: CsvAiTableMetadataRequest,
): Promise<CsvAiResult<CsvAiTableMetadataSuccess>> {
  await delay();
  try {
    if (looksLikeLogSchema(request.fileName, request.columns)) {
      return ok({
        tableName: "application_logs",
        tableDescription:
          "Application log events containing timestamps, hosts, services, and log message content for operational analysis and troubleshooting.",
      });
    }
    return ok({
      tableName: slugTableName(request.fileName),
      tableDescription: describeFromColumns(request.columns),
    });
  } catch {
    return unavailable();
  }
}
