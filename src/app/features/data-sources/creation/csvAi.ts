/**
 * CSV importer AI integration boundary.
 *
 * UI components depend on this interface, not on a specific provider.
 * The current adapter is a prototype suggestion provider — replace these
 * function bodies with a production AI service when an endpoint exists.
 *
 * Wire a real backend by replacing the bodies of:
 * - `proposeCsvValueRepair`
 * - `proposeCsvSimilarRepairs`
 * - `proposeCsvColumnType`
 * - `proposeCsvTableMetadata`
 */

export {
  CSV_AI_NO_RELIABLE_CORRECTION,
  CSV_AI_NO_RELIABLE_FIX,
  CSV_AI_UNAVAILABLE_MESSAGE,
} from "./csvAiMessages";

import type { CsvColumnType } from "./csv/parse";
import {
  prototypeSuggestCellFix,
  prototypeSuggestColumnType,
  prototypeSuggestSimilarFixes,
  prototypeSuggestTableMetadata,
} from "./csvAiSuggestions";

export const CSV_AI_INTEGRATION = {
  available: true,
  service: "prototype-adapter",
  hook: "csvAiSuggestions.ts",
  endpoint: null,
  missing: null,
} as const;

export type CsvAiConfidence = "low" | "medium" | "high";

export interface CsvAiValueRepairRequest {
  fileId: string;
  fileName: string;
  rowNumber: number;
  rowIndex: number;
  columnId: string;
  columnName: string;
  currentValue: string;
  selectedType: string;
  neighborValues: string[];
  validExamples: string[];
}

export interface CsvAiValueRepairSuccess {
  suggestedValue: string;
  explanation: string;
  confidence: CsvAiConfidence;
}

export interface CsvAiSimilarRepairRequest {
  fileId: string;
  fileName: string;
  columnId: string;
  columnName: string;
  selectedType: string;
  issues: Array<{
    rowNumber: number;
    currentValue: string;
  }>;
}

export interface CsvAiSimilarRepairChange {
  rowNumber: number;
  currentValue: string;
  suggestedValue: string;
}

export interface CsvAiSimilarRepairSuccess {
  proposedCount: number;
  explanation: string;
  changes: CsvAiSimilarRepairChange[];
}

export interface CsvAiColumnTypeRequest {
  fileId: string;
  fileName: string;
  columnId: string;
  columnName: string;
  selectedType: string;
  values: string[];
}

export interface CsvAiColumnTypeSuccess {
  suggestedType: CsvColumnType;
  explanation: string;
}

export interface CsvAiTableMetadataRequest {
  fileId: string;
  fileName: string;
  columns: Array<{ name: string; type: string }>;
  sampleRows: string[][];
}

export interface CsvAiTableMetadataSuccess {
  tableName: string;
  tableDescription: string;
}

export type CsvAiResult<T> =
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string }
  | { status: "no-suggestion"; message: string }
  | { status: "ok"; data: T };

/** Capability A — single invalid value. Must not mutate the cell until Apply. */
export async function proposeCsvValueRepair(
  request: CsvAiValueRepairRequest,
): Promise<CsvAiResult<CsvAiValueRepairSuccess>> {
  return prototypeSuggestCellFix(request);
}

/** Capability B — same-pattern repairs. Must not auto-apply. */
export async function proposeCsvSimilarRepairs(
  request: CsvAiSimilarRepairRequest,
): Promise<CsvAiResult<CsvAiSimilarRepairSuccess>> {
  return prototypeSuggestSimilarFixes(request);
}

/** Capability C — recommended column type from current values. */
export async function proposeCsvColumnType(
  request: CsvAiColumnTypeRequest,
): Promise<CsvAiResult<CsvAiColumnTypeSuccess>> {
  return prototypeSuggestColumnType(request);
}

/** Table name + description from schema and sample values. */
export async function proposeCsvTableMetadata(
  request: CsvAiTableMetadataRequest,
): Promise<CsvAiResult<CsvAiTableMetadataSuccess>> {
  return prototypeSuggestTableMetadata(request);
}
