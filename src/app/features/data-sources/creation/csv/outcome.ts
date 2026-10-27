import type { CsvValidationSummary } from "../types";
import { csvFileIsStructurallyUsable, type CsvImportFileDraft, type CsvResolutionKind } from "./fileDraft";
import { validateCsvRows } from "./validate";

export type CsvOutcomeResolution =
  | "not-checked"
  | "no-issues"
  | "needs-resolution"
  | "resolved"
  | "unusable";

/**
 * One file's import result.
 * When `structurallyUsable` is true, importedRows + skippedRows + rejectedRows = totalRows.
 * A structural parse failure does not use that partition.
 */
export interface CsvFileOutcome {
  fresh: boolean;
  structurallyUsable: boolean;
  /** True when the selected strategy still has work, such as unreviewed AI proposals. */
  strategyOpen: boolean;
  totalRows: number;
  importedRows: number;
  readyRows: number;
  skippedRows: number;
  rejectedRows: number;
  invalidRows: number;
  aiFixedRows: number;
  manuallyFixedRows: number;
  resolution: CsvOutcomeResolution;
  resolutionLabel: string;
  summary: CsvValidationSummary;
}

const EMPTY_SUMMARY: CsvValidationSummary = {
  totalRows: 0,
  validRows: 0,
  invalidRows: 0,
  skippedRows: 0,
  resolvedRows: 0,
  readyRows: 0,
  columnIssues: 0,
  issues: [],
  clean: false,
};

const RESOLUTION_LABELS: Record<CsvResolutionKind, string> = {
  "skip-affected": "Skipped rows",
  manual: "Manual",
  "ai-accepted": "AI-fixed",
  reupload: "Re-uploaded",
  "import-as-text": "Import as text",
};

function correctionCounts(file: CsvImportFileDraft): { ai: number; manual: number } {
  let ai = 0;
  let manual = 0;
  for (const [rowKey, cells] of Object.entries(file.fixMeta ?? {})) {
    const rowNumber = Number(rowKey);
    for (const [columnId, meta] of Object.entries(cells)) {
      if (file.overrides[rowNumber]?.[columnId] === undefined) continue;
      if (meta.origin === "ai") ai += 1;
      else manual += 1;
    }
  }
  return { ai, manual };
}

export function csvStrategyOpen(file: CsvImportFileDraft): boolean {
  if (file.validationStrategy === "ai") {
    if (!file.aiProposalsGenerated) return true;
    if (file.aiProposals.some((proposal) => proposal.status === "proposed" || proposal.status === "unrecoverable")) {
      return true;
    }
  }
  if (file.validationStrategy === "reupload" && file.reuploadPending) return true;
  return false;
}

function resolutionLabel(file: CsvImportFileDraft, outcome: {
  resolution: CsvOutcomeResolution;
  skippedRows: number;
}): string {
  if (outcome.resolution === "unusable") return "Parsing issue";
  if (outcome.resolution === "not-checked") return "Not checked";
  if (outcome.resolution === "needs-resolution") return "Needs resolution";
  if (outcome.resolution === "no-issues") return "No issues";
  if (file.importAsText) return "Import as text";
  const names = file.appliedResolutions.map((kind) => RESOLUTION_LABELS[kind]);
  if (outcome.skippedRows > 0 && !file.appliedResolutions.includes("skip-affected")) {
    names.unshift("Skipped rows");
  }
  return names.length > 0 ? names.join(", ") : "Resolved";
}

export function csvFileOutcome(file: CsvImportFileDraft): CsvFileOutcome {
  const parsed = file.parsed;
  const canCount = Boolean(parsed) && file.columns.length > 0;
  const structurallyUsable = canCount && csvFileIsStructurallyUsable(file);
  const summary = canCount && parsed
    ? validateCsvRows({
      parsed,
      columns: file.columns,
      overrides: file.overrides,
      skipped: new Set(file.skipped),
      previouslyInvalid: new Set(file.lastInvalidRows),
    })
    : { ...EMPTY_SUMMARY, totalRows: parsed?.records.length ?? 0 };

  const importedRows = structurallyUsable ? summary.readyRows : 0;
  const skippedRows = structurallyUsable ? summary.skippedRows : 0;
  const rejectedRows = structurallyUsable ? summary.invalidRows : 0;
  const fresh = structurallyUsable && file.validationRan && !file.validationStale;
  const corrections = correctionCounts(file);
  // Cell counts. A cell has one origin, so the two counts do not share a cell.
  const aiFixedRows = corrections.ai;
  const manuallyFixedRows = corrections.manual;
  const strategyOpen = structurallyUsable && fresh && csvStrategyOpen(file);
  const resolved = skippedRows > 0
    || file.importAsText
    || aiFixedRows > 0
    || manuallyFixedRows > 0
    || summary.resolvedRows > 0;

  let resolution: CsvOutcomeResolution = "no-issues";
  if (!structurallyUsable) resolution = "unusable";
  else if (!fresh) resolution = "not-checked";
  else if (rejectedRows > 0 || strategyOpen) resolution = "needs-resolution";
  else if (resolved) resolution = "resolved";

  return {
    fresh,
    structurallyUsable,
    strategyOpen,
    totalRows: summary.totalRows,
    importedRows,
    readyRows: importedRows,
    skippedRows,
    rejectedRows,
    invalidRows: rejectedRows,
    aiFixedRows,
    manuallyFixedRows,
    resolution,
    resolutionLabel: resolutionLabel(file, { resolution, skippedRows }),
    summary: structurallyUsable ? summary : { ...EMPTY_SUMMARY, totalRows: summary.totalRows },
  };
}
