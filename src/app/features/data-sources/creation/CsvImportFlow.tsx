import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  FileSpreadsheet,
  MinusCircle,
  MoreHorizontal,
  Plus,
  PlusCircle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import {
  LUXIA_SETTINGS_LIST_SURFACE_CLASS,
  LUXIA_SETTINGS_SECTION_SURFACE_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import { STRUCTURED_MODAL_DARK_CHROME_STYLE } from "@/app/features/shared/structuredModalChrome";
import type {
  CsvColumnDraft,
  CsvImportCompletePayload,
  CsvValidationIssue,
  CsvValidationSummary,
} from "./types";
import {
  CSV_DELIMITER_IDS,
  CSV_DELIMITER_LABELS,
  CSV_ENCODING_IDS,
  CSV_ENCODING_LABELS,
  buildCsvImportFile,
  csvFileFingerprint,
  csvFileHasSuspiciousDelimiter,
  csvFileHasUsableParse,
  csvFileIsStructurallyUsable,
  csvFileNeedsParsingReview,
  csvFileNeedsSchemaReview,
  csvFileSchemaReady,
  csvFileValidationReportReady,
  csvFileNotices,
  csvFileSchemaUiStatus,
  csvFileUiStatus,
  decodeCsvBytes,
  detectColumnTypeMismatches,
  csvHeaderConfigFor,
  csvHeaderSummaryLabel,
  csvPhysicalRowCount,
  csvPhysicalRowRole,
  csvPhysicalRowRoleLabel,
  csvPhysicalRows,
  validateCsvHeaderRowNumber,
  csvColumnNameConflict,
  duplicateTableNameKeys,
  includedCsvFiles,
  csvColumnTypeLabel,
  inferColumnType,
  columnReviewReason,
  replaceCsvImportFileContents,
  reparseCsvImportFile,
  selectedColumnType,
  bulkTableMetaNotice,
  tableDescriptionNeedsAi,
  rowDescriptionStats,
  tableNameConflictKey,
  csvFileOutcome,
  asTextColumns,
  clearCellFix,
  hasFixOrigin,
  keptReviewedProposals,
  restoreColumnSnapshot,
  writeCellFix,
  validateCsvRows,
  valueMatchesType,
  valueContextTabLabel,
  unsavedValueContextColumnCount,
  unsavedValueContextColumnIds,
  type CsvAiProposal,
  type CsvColumnType,
  type CsvValidationStrategy,
  type CsvColumnTypeMismatch,
  type CsvResolutionKind,
  type CsvTypeSuggestion,
  type CsvDelimiterId,
  type CsvEncodingId,
  type CsvFileUiStatus,
  type CsvHeaderMode,
  type CsvImportFileDraft,
  type CsvColumnValueContext,
} from "./csv";
import { CsvFileGlyph } from "./DataSourceTypeIcon";
import {
  ColumnStructureTable,
  SchemaDataPreview,
  type DisplayCsvIssue,
} from "./CsvImportRowActions";
import { CsvValidationWorkspace } from "./CsvValidationWorkspace";
import { CsvAiOriginBadge } from "./CsvAiOriginBadge";
import { CsvRowDescriptionsSection } from "./CsvRowDescriptions";
import { CsvValueContextSection } from "./CsvValueContextSection";
import { DocumentTagSummary, DraftDataSourceTagsField, DraftTableTagRow, type DocumentTagDefinition, type DraftDataSourceTagsApi } from "@/app/features/document-tags";
import { LuxiaAiButton } from "@/app/components/LuxiaAiButton";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { proposeCsvSimilarRepairs, proposeCsvTableMetadata, suggestedRepairValue } from "./csvAi";
import type { DataSourceHandoffProject } from "../constellationHandoff";

const CSV_STEP = {
  upload: 1,
  columns: 2,
  validation: 3,
  import: 4,
  tableDescriptions: 5,
  sampleValues: 6,
  columnDescriptions: 7,
  summary: 8,
} as const;

const CSV_STACKED_SECTION_MAX = 5;

const STEPS = [
  { id: CSV_STEP.upload, label: "Upload File" },
  { id: CSV_STEP.columns, label: "Columns & Types" },
  { id: CSV_STEP.validation, label: "Validation" },
  { id: CSV_STEP.import, label: "Import" },
  { id: CSV_STEP.tableDescriptions, label: "Table Descriptions" },
  { id: CSV_STEP.sampleValues, label: "Sample Values" },
  { id: CSV_STEP.columnDescriptions, label: "Column Descriptions" },
  { id: CSV_STEP.summary, label: "Summary" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type RailState = "current" | "completed" | "needs-review" | "blocked" | "future";
type ValidationFileStatus = "not-run" | "needs-review" | "errors" | "valid" | "excluded" | "schema-mismatch";

const PARSE_RESET_HINT = "This will re-read the file and rebuild columns from the selected header row.";
const PARSE_RESET_EDITS_HINT =
  "Reparsing rebuilds columns and row values. Column definitions, cell edits, excluded rows, validation, sample values, and row descriptions for this file will be reset.";
const PREVIEW_ROW_LIMIT = 5;
const PARSE_HEADER_PREVIEW_LIMIT = 8;

type CsvHeaderChoice = "1" | "2" | "3" | "4" | "5" | "custom" | "none";

type CsvParseDraft = {
  fileId: string;
  encoding: CsvEncodingId;
  delimiter: CsvDelimiterId;
  headerMode: CsvHeaderMode;
  headerRow: number | null;
  headerChoice: CsvHeaderChoice;
  customHeaderRow: string;
};

const HEADER_CHOICE_OPTIONS: Array<{ value: CsvHeaderChoice; label: string }> = [
  { value: "1", label: "First row" },
  { value: "2", label: "Row 2" },
  { value: "3", label: "Row 3" },
  { value: "4", label: "Row 4" },
  { value: "5", label: "Row 5" },
  { value: "custom", label: "Custom row…" },
  { value: "none", label: "No header row" },
];

function headerChoiceFromFile(file: CsvImportFileDraft): CsvHeaderChoice {
  if (file.headerMode === "none") return "none";
  const row = file.headerRow && file.headerRow > 0 ? file.headerRow : 1;
  if (row >= 1 && row <= 5) return String(row) as CsvHeaderChoice;
  return "custom";
}

function parseDraftIsDirty(draft: CsvParseDraft | null, file: CsvImportFileDraft | undefined): boolean {
  if (!draft || !file || draft.fileId !== file.id) return false;
  const saved = parseDraftFromFile(file);
  return saved.encoding !== draft.encoding
    || saved.delimiter !== draft.delimiter
    || saved.headerChoice !== draft.headerChoice
    || saved.customHeaderRow !== draft.customHeaderRow;
}

function uploadCollectionSummary(fileList: CsvImportFileDraft[]): string | null {
  if (fileList.length < 2) return null;
  let ready = 0;
  let excluded = 0;
  let attention = 0;
  for (const file of fileList) {
    const status = csvFileUiStatus(file);
    if (status === "excluded") excluded += 1;
    else if (status === "ready") ready += 1;
    else attention += 1;
  }
  const summary = [`${fileList.length} files`, `${ready} ready to continue`];
  if (excluded === 0 && attention === 0) return summary.join(" · ");
  if (excluded > 0) summary.push(`${excluded} excluded`);
  if (attention > 0) summary.push(`${attention} needs attention`);
  return summary.join(" · ");
}

function parseDraftFromFile(file: CsvImportFileDraft): CsvParseDraft {
  const headerChoice = headerChoiceFromFile(file);
  const headerRow =
    file.headerMode === "none"
      ? null
      : file.headerRow && file.headerRow > 0
        ? file.headerRow
        : 1;
  return {
    fileId: file.id,
    encoding: file.encoding,
    delimiter: file.delimiter,
    headerMode: file.headerMode === "none" ? "none" : "row",
    headerRow,
    headerChoice,
    customHeaderRow: headerChoice === "custom" && headerRow ? String(headerRow) : "",
  };
}

function decodedTextForParseDraft(file: CsvImportFileDraft, encoding: CsvEncodingId): string {
  if (encoding === file.encoding && file.decodedText) return file.decodedText;
  return decodeCsvBytes(file.bytes, encoding, file.bomLength).text;
}

function headerConfigFromDraft(draft: CsvParseDraft): {
  mode: CsvHeaderMode;
  row: number | null;
} {
  if (draft.headerChoice === "none") return { mode: "none", row: null };
  if (draft.headerChoice === "custom") {
    const trimmed = draft.customHeaderRow.trim();
    if (!/^[0-9]+$/.test(trimmed)) return { mode: "row", row: null };
    const row = Number(trimmed);
    return { mode: "row", row: row >= 1 ? row : null };
  }
  return { mode: "row", row: Number(draft.headerChoice) };
}

function customHeaderErrorFor(draft: CsvParseDraft, file: CsvImportFileDraft): string | null {
  if (draft.headerChoice !== "custom") return null;
  const maxRows = csvPhysicalRowCount(
    decodedTextForParseDraft(file, draft.encoding),
    draft.delimiter,
  );
  return validateCsvHeaderRowNumber(draft.customHeaderRow, maxRows);
}

const EMPTY_VALIDATION: CsvValidationSummary = {
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

function uploadFileStatusLabel(status: CsvFileUiStatus): string {
  if (status === "ready") return "Ready to continue";
  if (status === "excluded") return "Excluded";
  if (status === "error") return "Parsing error";
  return "Review parsing";
}

function schemaFileStatusLabel(status: CsvFileUiStatus): string {
  if (status === "ready") return "Ready";
  if (status === "excluded") return "Excluded";
  return "Needs review";
}

type StatusToneKind =
  | CsvFileUiStatus
  | ValidationFileStatus;

function statusTone(kind: StatusToneKind): { color: string; dot: string } {
  if (kind === "ready" || kind === "valid") {
    return { color: "var(--luxia-success-70)", dot: "var(--luxia-success)" };
  }
  if (kind === "error" || kind === "errors") {
    return { color: "var(--luxia-error-70)", dot: "var(--luxia-error)" };
  }
  if (kind === "needs-review" || kind === "parsing-needs-review" || kind === "schema-mismatch") {
    return { color: "var(--luxia-warning-90)", dot: "var(--luxia-warning-50)" };
  }
  return { color: "var(--luxia-text-muted)", dot: "var(--luxia-text-muted)" };
}

function StatusDotLabel({
  kind,
  label,
}: {
  kind: StatusToneKind;
  label: string;
}) {
  const tone = statusTone(kind);
  return (
    <span
      className="inline-flex items-center gap-1.5 cursor-default whitespace-nowrap luxia-type-caption"
      style={{ color: tone.color }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: tone.dot }}
        aria-hidden
      />
      {label}
    </span>
  );
}

function unsavedValueContextLeaveCopy(columnCount: number, fileCount: number): string {
  if (fileCount > 1) {
    return `${columnCount.toLocaleString()} column${columnCount === 1 ? "" : "s"} across ${fileCount.toLocaleString()} files have unsaved value context.`;
  }
  if (columnCount === 1) return "1 column has unsaved value context.";
  return `${columnCount.toLocaleString()} columns have unsaved value context.`;
}

function StepMarker({ state, index }: { state: "done" | "current" | "open" | "muted"; index: number }) {
  return (
    <span className="luxia-csv-step-marker" data-state={state} aria-hidden>
      {state === "done" ? <Check size={15} strokeWidth={2.5} /> : String(index).padStart(2, "0")}
    </span>
  );
}

function railStateLabel(state: RailState): string {
  if (state === "current") return "Current";
  if (state === "completed") return "Completed";
  if (state === "needs-review") return "Needs review";
  if (state === "blocked") return "Blocked";
  return "Upcoming";
}

function truncateCsvCell(value: string, max = 36): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, Math.max(1, max - 1))}…`;
}

function columnInsightMeaning(column: CsvColumnDraft): string {
  const type = selectedColumnType(column);
  if (type === "Date" || type === "Timestamp") {
    return column.dateFormat ? `${csvColumnTypeLabel(type)} · ${column.dateFormat}` : `${csvColumnTypeLabel(type)} values`;
  }
  if (type === "Integer" || type === "BigInt") return "Whole numbers";
  if (type === "Number") return "Numeric values";
  if (type === "Boolean") return "True or false values";
  return "Text values";
}

function columnInsightUsage(column: CsvColumnDraft): string {
  const type = selectedColumnType(column);
  if (type === "Date" || type === "Timestamp") return "Time filters";
  if (type === "Integer" || type === "BigInt" || type === "Number") return "Counts and measures";
  if (type === "Boolean") return "Flags and filters";
  return "Labels and search";
}

function schemaStatusForType(type: string, detectedType: string): NonNullable<CsvColumnDraft["status"]> {
  return type === detectedType ? "confirmed" : "modified";
}

function liveValidationForFile(file: CsvImportFileDraft): CsvValidationSummary {
  return csvFileOutcome(file).summary;
}

function validationForFile(file: CsvImportFileDraft): CsvValidationSummary {
  return csvFileOutcome(file).summary;
}

function mismatchesForFile(
  file: CsvImportFileDraft,
  summary: CsvValidationSummary,
): CsvColumnTypeMismatch[] {
  if (!file.parsed || !csvFileIsStructurallyUsable(file)) return [];
  return detectColumnTypeMismatches({
    parsed: file.parsed,
    columns: file.columns,
    summary,
    skipped: new Set(file.skipped),
  });
}

function schemaDiagnosis(
  file: CsvImportFileDraft,
  summary: CsvValidationSummary,
): {
  title: string;
  body: string;
  mismatch?: CsvColumnTypeMismatch;
  topColumnId?: string;
  recommendedType?: string;
} | null {
  if (csvFileHasSuspiciousDelimiter(file) || csvFileNeedsParsingReview(file)) {
    const n = file.parsed?.records.length ?? 0;
    return {
      title: "Most issues appear to come from parsing.",
      body:
        n > 0
          ? `Review parsing — ${n.toLocaleString()} rows are affected.`
          : "Review delimiter or encoding before fixing individual values.",
    };
  }
  const mismatches = mismatchesForFile(file, summary);
  if (mismatches[0]) {
    const mismatch = mismatches[0];
    return {
      title: `Most issues appear to come from the ${mismatch.columnName} column type.`,
      body: `${mismatch.invalidCount.toLocaleString()} rows are affected by the selected type.`,
      mismatch,
      recommendedType: mismatch.detectedType,
      topColumnId: mismatch.columnId,
    };
  }
  if (summary.invalidRows >= 8 && summary.totalRows > 0 && summary.invalidRows / summary.totalRows >= 0.5) {
    const counts = new Map<string, { name: string; count: number }>();
    for (const issue of summary.issues) {
      const current = counts.get(issue.columnId) ?? { name: issue.columnName, count: 0 };
      current.count += 1;
      counts.set(issue.columnId, current);
    }
    let top: { id: string; name: string; count: number } | null = null;
    for (const [id, item] of counts) {
      if (!top || item.count > top.count) top = { id, name: item.name, count: item.count };
    }
    return {
      title: top
        ? `Most issues appear to come from the ${top.name} column.`
        : "Most issues appear to come from a selected column type.",
      body: `${summary.invalidRows.toLocaleString()} rows are affected by the selected type.`,
      topColumnId: top?.id,
    };
  }
  return null;
}

function excludedRowPlaceholders(
  file: CsvImportFileDraft,
  existing: DisplayCsvIssue[],
): DisplayCsvIssue[] {
  const covered = new Set(
    existing.filter((issue) => issue.resolution === "skipped").map((issue) => issue.rowNumber),
  );
  const records = file.parsed?.records ?? [];
  return file.skipped
    .filter((rowNumber) => !covered.has(rowNumber))
    .map((rowNumber) => {
      const record = records.find((item) => item.rowNumber === rowNumber);
      const recordIndex = records.findIndex((item) => item.rowNumber === rowNumber);
      return {
        rowNumber,
        rowIndex: recordIndex >= 0 ? recordIndex : 0,
        columnId: `${file.id}:excluded:${rowNumber}`,
        columnName: "Row",
        value: record ? record.fields.filter(Boolean).slice(0, 3).join(" · ") : "",
        expected: "—",
        resolution: "skipped" as const,
      };
    });
}

function validationFileStatus(
  file: CsvImportFileDraft,
  summary: CsvValidationSummary,
): ValidationFileStatus {
  if (!file.included) return "excluded";
  if (csvFileNeedsParsingReview(file) || !csvFileIsStructurallyUsable(file)) return "needs-review";
  if (!file.validationRan || file.validationStale) return "not-run";
  if (mismatchesForFile(file, summary).length > 0) return "schema-mismatch";
  if (summary.invalidRows > 0 || csvFileOutcome(file).strategyOpen) return "errors";
  return "valid";
}

function validationStatusLabel(
  file: CsvImportFileDraft,
  status: ValidationFileStatus,
  summary?: CsvValidationSummary,
): string {
  if (status === "valid") {
    const outcome = csvFileOutcome(file);
    if (outcome.resolution === "needs-resolution") return "Needs resolution";
    if (outcome.resolution === "resolved") return "Resolved";
    return "No issues";
  }
  if (status === "excluded") return "Excluded";
  if (status === "not-run") return "Not checked";
  if (status === "schema-mismatch" || status === "errors") {
    const count = summary?.invalidRows || summary?.issues.length || 0;
    if (count > 0) return "Needs resolution";
    return "Needs review";
  }
  return "Needs review";
}

function typeSuggestionsFor(file: CsvImportFileDraft): CsvTypeSuggestion[] {
  if (file.importAsText || !file.parsed) return [];
  const skipped = new Set(file.skipped);
  const suggestions: CsvTypeSuggestion[] = [];
  file.columns.forEach((column, index) => {
    const values = file.parsed!.records
      .filter((record) => !skipped.has(record.rowNumber))
      .map((record) => file.overrides[record.rowNumber]?.[column.id] ?? record.fields[index] ?? "");
    const inferred = inferColumnType(values);
    const selected = selectedColumnType(column);
    if (inferred.needsReview || inferred.type === selected) return;
    suggestions.push({
      columnId: column.id,
      columnName: column.name,
      currentType: selected,
      suggestedType: inferred.type,
    });
  });
  return suggestions;
}

function withResolution(file: CsvImportFileDraft, kind: CsvResolutionKind): CsvImportFileDraft {
  if (file.appliedResolutions.includes(kind)) return file;
  return { ...file, appliedResolutions: [...file.appliedResolutions, kind] };
}

function fileRowCount(file: CsvImportFileDraft): number {
  return file.parsed?.records.length ?? 0;
}

function uploadFileMeta(file: CsvImportFileDraft): { visual: string; spoken: string } | null {
  if (!file.parsed) return null;
  const rows = fileRowCount(file);
  const rowLabel = `${rows.toLocaleString()} ${rows === 1 ? "row" : "rows"}`;
  const columns = file.parsed.headers.length;
  if (columns <= 0) return { visual: rowLabel, spoken: rowLabel };
  const columnLabel = `${columns.toLocaleString()} ${columns === 1 ? "column" : "columns"}`;
  return {
    visual: `${rowLabel} · ${columnLabel}`,
    spoken: `${rowLabel}, ${columnLabel}`,
  };
}

function csvFileCanPreview(file: CsvImportFileDraft): boolean {
  if (!file.parsed) return false;
  return file.parsed.headers.length > 0 || file.parsed.records.length > 0;
}

function csvPreviewShowsParseWarning(file: CsvImportFileDraft): boolean {
  if (!csvFileCanPreview(file)) return false;
  return csvFileHasSuspiciousDelimiter(file) || !csvFileHasUsableParse(file);
}

function displayIssuesFor(
  file: CsvImportFileDraft,
  summary: CsvValidationSummary,
): Array<CsvValidationIssue & { resolution: "open" | "skipped" | "resolved" }> {
  if (!file.validationRan || file.validationStale) return [];
  const skippedRows = new Set(file.skipped);
  const liveKeys = new Set(
    summary.issues.map((issue) => `${issue.rowNumber}:${issue.columnId}`),
  );
  const byKey = new Map<string, CsvValidationIssue & { resolution: "open" | "skipped" | "resolved" }>();
  for (const issue of file.issueSnapshot ?? []) {
    byKey.set(`${issue.rowNumber}:${issue.columnId}`, { ...issue, resolution: "open" });
  }
  for (const issue of summary.issues) {
    byKey.set(`${issue.rowNumber}:${issue.columnId}`, { ...issue, resolution: "open" });
  }
  return [...byKey.values()]
    .map((issue) => {
      const key = `${issue.rowNumber}:${issue.columnId}`;
      if (skippedRows.has(issue.rowNumber)) {
        return { ...issue, resolution: "skipped" as const };
      }
      if (liveKeys.has(key)) return { ...issue, resolution: "open" as const };
      const override = file.overrides[issue.rowNumber]?.[issue.columnId];
      return {
        ...issue,
        value: override ?? issue.value,
        resolution: "resolved" as const,
      };
    })
    .sort((a, b) => a.rowNumber - b.rowNumber || a.columnName.localeCompare(b.columnName));
}

export interface CsvImportFlowProps {
  open: boolean;
  /** Trimmed name, for display. */
  sourceName: string;
  /** The same draft name, untrimmed, for the Step 01 input. */
  sourceNameDraft: string;
  onSourceNameChange: (value: string) => void;
  ownershipLabel: string;
  tagDraft: DraftDataSourceTagsApi;
  onBackToChooser: () => void;
  onCancel: () => void;
  onComplete: (payload: CsvImportCompletePayload) => void;
  onFinish: (options?: { openSettings?: boolean }) => void;
  eligibleProjects?: DataSourceHandoffProject[];
  onCreateConstellation?: (projectId: string) => void;
}

export function CsvImportFlow({
  open,
  sourceName,
  sourceNameDraft,
  onSourceNameChange,
  ownershipLabel,
  tagDraft,
  onBackToChooser,
  onCancel,
  onComplete,
  onFinish,
  eligibleProjects = [],
  onCreateConstellation,
}: CsvImportFlowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFilesFromSwitcherRef = useRef(false);
  const readingRef = useRef(false);
  const parseApplyLock = useRef(false);
  const removeConfirmedRef = useRef(false);
  const focusRequestRef = useRef<
    | { type: "editor" | "parse-trigger" | "preview" | "more"; fileId: string }
    | { type: "dropzone" | "add-more" }
    | null
  >(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<StepId>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<StepId>(1);
  const [files, setFiles] = useState<CsvImportFileDraft[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [parseDraft, setParseDraft] = useState<CsvParseDraft | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [reading, setReading] = useState(false);
  const [applyingParse, setApplyingParse] = useState(false);
  const [acceptNotice, setAcceptNotice] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmedImportSignature, setConfirmedImportSignature] = useState<string | null>(null);
  const [bulkTableAiBusy, setBulkTableAiBusy] = useState(false);
  const [bulkTableAiNotice, setBulkTableAiNotice] = useState<string | null>(null);
  const [tableAiBusy, setTableAiBusy] = useState(false);
  const tableDescriptionAiBusy = bulkTableAiBusy || tableAiBusy;
  const [parseResetNotice, setParseResetNotice] = useState<string | null>(null);
  const [schemaParseLeaveAttempt, setSchemaParseLeaveAttempt] = useState(0);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [focusedColumnId, setFocusedColumnId] = useState<string | null>(null);
  const [handoffProjectId, setHandoffProjectId] = useState<string | null>(null);
  const [sampleValuesLeaveStep, setSampleValuesLeaveStep] = useState<StepId | null>(null);
  const [pendingRemoveFileId, setPendingRemoveFileId] = useState<string | null>(null);
  const [aiBusyFileId, setAiBusyFileId] = useState<string | null>(null);
  const [proposeNotice, setProposeNotice] = useState<string | null>(null);

  const included = useMemo(() => includedCsvFiles(files), [files]);
  const previewFile = previewFileId
    ? files.find((file) => file.id === previewFileId) ?? null
    : null;
  const activeFile =
    included.find((file) => file.id === activeFileId)
    ?? included[0]
    ?? files.find((file) => file.id === activeFileId)
    ?? files[0]
    ?? null;

  const outcomes = useMemo(() => {
    const map = new Map<string, ReturnType<typeof csvFileOutcome>>();
    for (const file of files) map.set(file.id, csvFileOutcome(file));
    return map;
  }, [files]);
  const validations = useMemo(() => {
    const map = new Map<string, CsvValidationSummary>();
    for (const [id, outcome] of outcomes) map.set(id, outcome.summary);
    return map;
  }, [outcomes]);

  const activeValidation = activeFile
    ? validations.get(activeFile.id) ?? EMPTY_VALIDATION
    : EMPTY_VALIDATION;
  const duplicateNames = useMemo(() => duplicateTableNameKeys(files), [files]);
  const importOutcomeSignature = useMemo(
    () => included.map((file) => {
      const outcome = outcomes.get(file.id) ?? csvFileOutcome(file);
      return `${file.id}:${file.tableName.trim()}:${outcome.importedRows}:${outcome.skippedRows}:${outcome.rejectedRows}:${outcome.strategyOpen ? "open" : "done"}:${outcome.totalRows}`;
    }).join("|"),
    [included, outcomes],
  );
  const importLocked = confirmedImportSignature !== null && confirmedImportSignature === importOutcomeSignature;

  const uploadComplete =
    included.length > 0 && included.every((file) => csvFileHasUsableParse(file));
  const schemaComplete =
    uploadComplete
    && included.every((file) => csvFileIsStructurallyUsable(file) && !csvFileNeedsSchemaReview(file));
  const filesNeedingValidationRun = included.filter((file) => !csvFileValidationReportReady(file));
  const validationComplete =
    schemaComplete
    && included.every((file) => {
      const outcome = outcomes.get(file.id) ?? csvFileOutcome(file);
      return outcome.fresh && outcome.rejectedRows === 0 && !outcome.strategyOpen;
    });
  const tablesComplete =
    validationComplete
    && included.every((file) => file.tableName.trim().length > 0)
    && duplicateNames.size === 0;
  const validationHasRun = included.some((file) => file.validationRan);
  const includedTotals = included.reduce(
    (acc, file) => {
      const outcome = outcomes.get(file.id) ?? csvFileOutcome(file);
      acc.ready += outcome.importedRows;
      acc.skipped += outcome.skippedRows;
      acc.rejected += outcome.rejectedRows;
      acc.resolved += outcome.summary.resolvedRows;
      acc.errors += outcome.rejectedRows;
      acc.total += outcome.totalRows;
      return acc;
    },
    { ready: 0, skipped: 0, rejected: 0, resolved: 0, errors: 0, total: 0 },
  );
  const unsavedSampleValueColumns = useMemo(
    () => unsavedValueContextColumnCount(included),
    [included],
  );
  const unsavedSampleValueFiles = useMemo(
    () => included.filter((file) => unsavedValueContextColumnIds(file).length > 0).length,
    [included],
  );
  const validHandoffProjectId = eligibleProjects.some((project) => project.id === handoffProjectId)
    ? handoffProjectId
    : null;

  useEffect(() => {
    if (focusedColumnId && step === CSV_STEP.columns) return;
    contentScrollRef.current?.scrollTo({ top: 0 });
  }, [step, focusedColumnId]);

  useEffect(() => {
    if (!previewFileId) return;
    const file = files.find((item) => item.id === previewFileId);
    if (!file || !csvFileCanPreview(file)) {
      setPreviewFileId(null);
    }
  }, [files, previewFileId]);

  useEffect(() => {
    if (created) return;
    if (!uploadComplete && step > CSV_STEP.upload && step < CSV_STEP.summary) {
      setStep(CSV_STEP.upload);
      return;
    }
    if (!importLocked && step > CSV_STEP.import && step < CSV_STEP.summary) {
      setStep(CSV_STEP.import);
    }
  }, [uploadComplete, importLocked, step, created]);

  useEffect(() => {
    const request = focusRequestRef.current;
    if (!request) return;
    focusRequestRef.current = null;
    let id = "csv-empty-dropzone";
    if (request.type === "add-more") id = "csv-add-more-files";
    else if (request.type === "editor") id = `csv-encoding-${request.fileId}`;
    else if (request.type === "parse-trigger") id = `csv-file-parse-${request.fileId}`;
    else if (request.type === "preview") id = `csv-file-preview-${request.fileId}`;
    else if (request.type === "more") id = `csv-file-more-${request.fileId}`;
    const focusTarget = () => {
      const element = document.getElementById(id);
      if (element instanceof HTMLElement) element.focus();
    };
    focusTarget();
    requestAnimationFrame(() => {
      focusTarget();
      requestAnimationFrame(focusTarget);
    });
  });

  function goToStep(next: StepId, options?: {
    focusColumnId?: string | null;
    keepParseEdit?: boolean;
    skipValueContextPrompt?: boolean;
    fileId?: string;
  }) {
    if (created && next !== CSV_STEP.summary) return;
    if (
      step === CSV_STEP.upload
      && next !== CSV_STEP.upload
      && parseDraftIsDirty(parseDraft, files.find((file) => file.id === parseDraft?.fileId))
    ) return;
    if (
      step === CSV_STEP.columns
      && next !== CSV_STEP.columns
      && parseDraftIsDirty(parseDraft, files.find((file) => file.id === parseDraft?.fileId))
    ) {
      setSchemaParseLeaveAttempt((attempt) => attempt + 1);
      return;
    }
    if (
      step === CSV_STEP.sampleValues
      && next > CSV_STEP.sampleValues
      && !options?.skipValueContextPrompt
      && unsavedSampleValueColumns > 0
    ) {
      setSampleValuesLeaveStep(next);
      return;
    }
    setSampleValuesLeaveStep(null);
    if (!options?.keepParseEdit) {
      setEditingFileId(null);
      setParseDraft(null);
    }
    if (options && "focusColumnId" in options) {
      setFocusedColumnId(options.focusColumnId ?? null);
    } else {
      setFocusedColumnId(null);
    }
    if (next === CSV_STEP.validation) {
      setFiles((prev) =>
        prev.map((file) =>
          file.included && file.parsed && csvFileIsStructurallyUsable(file) && (!file.validationRan || file.validationStale)
            ? runValidationFor(file)
            : file,
        ),
      );
    }
    const focusFileId =
      options?.fileId && included.some((file) => file.id === options.fileId)
        ? options.fileId
        : null;
    if (focusFileId && (next === CSV_STEP.columns || next === CSV_STEP.validation)) {
      setActiveFileId(focusFileId);
    }
    if (
      next === CSV_STEP.import
      || next === CSV_STEP.tableDescriptions
      || next === CSV_STEP.sampleValues
      || next === CSV_STEP.columnDescriptions
    ) {
      setActiveFileId((current) =>
        focusFileId
        ?? (current && included.some((file) => file.id === current) ? current : included[0]?.id ?? null),
      );
    }
    setStep(next);
    setMaxReachedStep((current) => (next > current ? next : current) as StepId);
  }

  function updateFile(
    fileId: string,
    updater: (file: CsvImportFileDraft) => CsvImportFileDraft,
  ) {
    setFiles((prev) => prev.map((file) => (file.id === fileId ? updater(file) : file)));
  }

  function saveRowDescription(fileId: string, rowNumber: number, text: string) {
    updateFile(fileId, (current) => {
      const next = { ...(current.rowDescriptions ?? {}) };
      const trimmed = text.trim();
      if (!trimmed) {
        delete next[rowNumber];
      } else {
        next[rowNumber] = { text: trimmed, origin: "edited" };
      }
      return { ...current, rowDescriptions: next };
    });
  }

  function applyAiRowDescriptions(
    fileId: string,
    changes: Array<{ rowNumber: number; description: string }>,
  ) {
    updateFile(fileId, (current) => {
      const next = { ...(current.rowDescriptions ?? {}) };
      for (const change of changes) {
        if (next[change.rowNumber]?.text.trim()) continue;
        const description = change.description.trim();
        if (!description) continue;
        next[change.rowNumber] = { text: description, origin: "ai" };
      }
      return { ...current, rowDescriptions: next };
    });
  }

  function saveValueContextDrafts(
    fileId: string,
    entries: Array<{ columnId: string; context: CsvColumnValueContext }>,
  ) {
    updateFile(fileId, (current) => {
      const next = { ...(current.valueContextDraft ?? {}) };
      for (const entry of entries) {
        next[entry.columnId] = entry.context;
      }
      return { ...current, valueContextDraft: next };
    });
  }

  function commitValueContextDrafts(fileId: string, columnIds: string[]) {
    if (columnIds.length === 0) return;
    updateFile(fileId, (current) => {
      const drafts = current.valueContextDraft ?? {};
      const saved = { ...(current.valueContext ?? {}) };
      const remaining = { ...drafts };
      for (const columnId of columnIds) {
        const draft = remaining[columnId];
        if (!draft) continue;
        saved[columnId] = {
          ...draft,
          values: draft.values.map((value) => value.trim()).filter(Boolean),
        };
        delete remaining[columnId];
      }
      return { ...current, valueContext: saved, valueContextDraft: remaining };
    });
  }

  function commitAllValueContextDrafts() {
    setFiles((prev) =>
      prev.map((file) => {
        const drafts = file.valueContextDraft ?? {};
        const keys = Object.keys(drafts);
        if (keys.length === 0) return file;
        const remaining = { ...drafts };
        const saved = { ...(file.valueContext ?? {}) };
        for (const columnId of keys) {
          const draft = remaining[columnId];
          if (!draft) continue;
          saved[columnId] = {
            ...draft,
            values: draft.values.map((value) => value.trim()).filter(Boolean),
          };
          delete remaining[columnId];
        }
        return { ...file, valueContext: saved, valueContextDraft: remaining };
      }),
    );
  }

  function discardAllValueContextDrafts() {
    setFiles((prev) =>
      prev.map((file) => {
        if (!file.valueContextDraft || Object.keys(file.valueContextDraft).length === 0) return file;
        return { ...file, valueContextDraft: {} };
      }),
    );
  }

  function patchTableName(fileId: string, value: string) {
    updateFile(fileId, (current) => ({
      ...current,
      tableName: value,
      tableNameOrigin: "edited",
    }));
  }

  function patchTableDescription(fileId: string, value: string) {
    setBulkTableAiNotice(null);
    updateFile(fileId, (current) => ({
      ...current,
      tableDescription: value,
      descriptionDrafted: false,
      tableDescriptionOrigin: value.trim() ? "edited" : "unset",
    }));
  }

  function applyAiTableDescription(fileId: string, tableDescription: string) {
    setBulkTableAiNotice(null);
    updateFile(fileId, (current) => ({
      ...current,
      tableDescription,
      tableMetaAiGenerated: true,
      tableDescriptionOrigin: tableDescription.trim() ? "ai" : "unset",
    }));
  }

  async function generateBulkTableMeta() {
    if (tableDescriptionAiBusy) return;
    const includedNow = includedCsvFiles(files);
    const alreadyComplete = includedNow.filter((file) => !tableDescriptionNeedsAi(file)).length;
    const targets = includedNow.filter((file) => tableDescriptionNeedsAi(file));
    if (targets.length === 0) {
      setBulkTableAiNotice(bulkTableMetaNotice({ generated: 0, alreadyComplete, failed: 0 }));
      return;
    }
    setBulkTableAiBusy(true);
    setBulkTableAiNotice(null);
    let generated = 0;
    let failed = 0;
    try {
      for (const file of targets) {
        const result = await proposeCsvTableMetadata({
          fileId: file.id,
          fileName: file.fileName,
          columns: file.columns.map((column) => ({
            name: column.name,
            type: selectedColumnType(column),
          })),
          sampleRows: (file.parsed?.records ?? []).slice(0, 5).map((record) => record.fields),
        });
        if (result.status !== "ok") {
          failed += 1;
          continue;
        }
        generated += 1;
        const description = result.data.tableDescription.trim();
        setFiles((current) =>
          current.map((item) => {
            if (item.id !== file.id || !description || !tableDescriptionNeedsAi(item)) return item;
            return {
              ...item,
              tableDescription: description,
              tableDescriptionOrigin: "ai" as const,
              tableMetaAiGenerated: true,
            };
          }),
        );
      }
      setBulkTableAiNotice(bulkTableMetaNotice({ generated, alreadyComplete, failed }));
    } finally {
      setBulkTableAiBusy(false);
    }
  }

  function schemaParseDirty(): boolean {
    return step === CSV_STEP.columns && parseDraftIsDirty(
      parseDraft,
      files.find((file) => file.id === parseDraft?.fileId),
    );
  }

  function blockSchemaParseLeave(): boolean {
    if (!schemaParseDirty()) return false;
    setSchemaParseLeaveAttempt((attempt) => attempt + 1);
    return true;
  }

  function selectFile(fileId: string) {
    if (fileId !== (activeFileId ?? activeFile?.id) && blockSchemaParseLeave()) return;
    setEditingFileId(null);
    setParseDraft(null);
    setFocusedColumnId(null);
    setActiveFileId(fileId);
  }

  function snapActiveToIncluded(nextFiles: CsvImportFileDraft[]) {
    const nextIncluded = includedCsvFiles(nextFiles);
    if (nextIncluded.length === 0) {
      setActiveFileId(nextFiles[0]?.id ?? null);
      return;
    }
    if (!nextIncluded.some((file) => file.id === activeFileId)) {
      setActiveFileId(nextIncluded[0]!.id);
    }
  }

  async function acceptFiles(list: FileList | File[] | null | undefined) {
    if (!list || (Array.isArray(list) ? list.length === 0 : list.length === 0)) return;
    if (readingRef.current || parseApplyLock.current) {
      addFilesFromSwitcherRef.current = false;
      return;
    }
    readingRef.current = true;
    setReading(true);
    const fromSwitcher = addFilesFromSwitcherRef.current;
    addFilesFromSwitcherRef.current = false;
    try {
      const incoming = Array.from(list);
      const rejected = incoming.filter((file) => !file.name.toLowerCase().endsWith(".csv"));
      const csvFiles = incoming.filter((file) => file.name.toLowerCase().endsWith(".csv"));
      const notices: string[] = [];
      if (rejected.length > 0) {
        notices.push(
          `Only CSV files are accepted. Not added: ${rejected.map((file) => file.name).join(", ")}.`,
        );
      }

      const existingFingerprints = new Set(files.map((file) => file.fingerprint));
      const unique: File[] = [];
      for (const file of csvFiles) {
        const fingerprint = csvFileFingerprint(file.name, file.size, file.lastModified);
        if (
          existingFingerprints.has(fingerprint)
          || unique.some((item) => csvFileFingerprint(item.name, item.size, item.lastModified) === fingerprint)
        ) {
          notices.push(`${file.name} is already in the list.`);
          continue;
        }
        unique.push(file);
      }

      const built: CsvImportFileDraft[] = [];
      for (const file of unique) {
        try {
          const buffer = await file.arrayBuffer();
          built.push(
            buildCsvImportFile(file.name || "upload.csv", new Uint8Array(buffer), {
              size: file.size,
              lastModified: file.lastModified,
            }),
          );
        } catch {
          notices.push(`${file.name} could not be read.`);
        }
      }

      if (built.length > 0) {
        const wasEmpty = files.length === 0;
        setFiles((prev) => [...prev, ...built]);
        if (wasEmpty || fromSwitcher) {
          setEditingFileId(null);
          setParseDraft(null);
          setFocusedColumnId(null);
          setActiveFileId(built[0]!.id);
        }
      }
      if (notices.length === 0) {
        setAcceptNotice(null);
      } else if (fromSwitcher) {
        setAcceptNotice(notices.join(" "));
      } else {
        setAcceptNotice(null);
        for (const message of notices) {
          if (message.endsWith("is already in the list.")) luxiaToast.warning(message);
          else luxiaToast.error(message);
        }
      }
    } finally {
      readingRef.current = false;
      setReading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function openCsvFilePicker(fromSwitcher = false) {
    addFilesFromSwitcherRef.current = fromSwitcher;
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragActive(false);
    if (readingRef.current || parseApplyLock.current) return;
    addFilesFromSwitcherRef.current = false;
    void acceptFiles(event.dataTransfer.files);
  }

  function removeFile(fileId: string) {
    const removed = files.find((file) => file.id === fileId);
    if (!removed) {
      if (step === CSV_STEP.upload) luxiaToast.error("Couldn't remove the file.");
      return;
    }
    try {
      tagDraft.clearTableAssignments(fileId);
    } catch {
      if (step === CSV_STEP.upload) luxiaToast.error(`Couldn't remove "${removed.fileName}".`);
      return;
    }
    const removedIndex = files.findIndex((file) => file.id === fileId);
    const includedBefore = includedCsvFiles(files);
    const removedIncludedIndex = includedBefore.findIndex((file) => file.id === fileId);
    const next = files.filter((file) => file.id !== fileId);
    const includedAfter = includedCsvFiles(next);
    const removingActive = activeFileId === fileId;

    if (editingFileId === fileId) {
      setEditingFileId(null);
      setParseDraft(null);
    }
    if (previewFileId === fileId) setPreviewFileId(null);
    if (removingActive) setFocusedColumnId(null);

    setFiles(next);
    if (step === CSV_STEP.upload) {
      const nextFile = files[removedIndex + 1];
      const previousFile = files[removedIndex - 1];
      focusRequestRef.current = nextFile
        ? { type: "more", fileId: nextFile.id }
        : previousFile
          ? { type: "more", fileId: previousFile.id }
          : next.length > 0
            ? { type: "add-more" }
            : { type: "dropzone" };
      luxiaToast.success(`"${removed.fileName}" removed`);
    }

    if (unsavedValueContextColumnCount(includedAfter) === 0) {
      setSampleValuesLeaveStep(null);
    }

    if (includedAfter.length === 0) {
      setMaxReachedStep(1);
      setStep(1);
      setActiveFileId(next[0]?.id ?? null);
      return;
    }

    if (removingActive) {
      const neighbor =
        removedIncludedIndex >= 0
          ? includedBefore[removedIncludedIndex + 1] ?? includedBefore[removedIncludedIndex - 1]
          : undefined;
      const nextId = neighbor && neighbor.id !== fileId ? neighbor.id : includedAfter[0]!.id;
      setActiveFileId(nextId);
    }
  }

  function requestRemoveFile(fileId: string) {
    removeConfirmedRef.current = false;
    setPendingRemoveFileId(fileId);
  }

  function confirmRemoveFile() {
    if (!pendingRemoveFileId) return;
    const fileId = pendingRemoveFileId;
    removeConfirmedRef.current = true;
    setPendingRemoveFileId(null);
    removeFile(fileId);
  }

  function dismissRemoveDialog() {
    if (removeConfirmedRef.current) return;
    const fileId = pendingRemoveFileId;
    if (!fileId) return;
    setPendingRemoveFileId(null);
    if (step === CSV_STEP.upload) focusRequestRef.current = { type: "more", fileId };
  }

  function toggleIncluded(fileId: string) {
    setFiles((prev) => {
      const next = prev.map((file) =>
        file.id === fileId ? { ...file, included: !file.included } : file,
      );
      if (includedCsvFiles(next).length === 0) {
        setMaxReachedStep(1);
        setStep(1);
      }
      snapActiveToIncluded(next);
      return next;
    });
  }

  function startParseEdit(fileId: string) {
    if (applyingParse) return;
    if (
      step === CSV_STEP.upload
      && editingFileId
      && editingFileId !== fileId
      && parseDraftIsDirty(parseDraft, files.find((item) => item.id === editingFileId))
    ) return;
    const file = files.find((item) => item.id === fileId);
    if (!file) return;
    setActiveFileId(fileId);
    setParseDraft(parseDraftFromFile(file));
    setEditingFileId(fileId);
    if (step === CSV_STEP.upload) focusRequestRef.current = { type: "editor", fileId };
  }

  function reparseEditedFile() {
    if (parseApplyLock.current || applyingParse || !parseDraft) return;
    const draft = parseDraft;
    const file = files.find((item) => item.id === draft.fileId);
    if (!file) return;
    const customError = customHeaderErrorFor(draft, file);
    if (customError) return;
    const header = headerConfigFromDraft(draft);
    if (header.mode === "row" && (!header.row || header.row < 1)) return;
    const run = () => {
      updateFile(draft.fileId, (current) =>
        reparseCsvImportFile(current, {
          encoding: draft.encoding,
          delimiter: draft.delimiter,
          headerMode: header.mode,
          headerRow: header.row,
          invalidateDownstream: true,
        }),
      );
      if (step >= CSV_STEP.columns || maxReachedStep >= CSV_STEP.columns) {
        setParseResetNotice("Columns were updated.");
      }
      setEditingFileId(null);
      setParseDraft(null);
      if (step === CSV_STEP.upload) focusRequestRef.current = { type: "parse-trigger", fileId: draft.fileId };
    };
    if (step !== CSV_STEP.upload) {
      run();
      return;
    }
    parseApplyLock.current = true;
    setApplyingParse(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          run();
        } finally {
          parseApplyLock.current = false;
          setApplyingParse(false);
        }
      });
    });
  }

  function cancelParseEdit() {
    const fileId = editingFileId;
    setEditingFileId(null);
    setParseDraft(null);
    if (step === CSV_STEP.upload && fileId) focusRequestRef.current = { type: "parse-trigger", fileId };
  }

  function updateParseDraftEncoding(encoding: CsvEncodingId) {
    setParseDraft((current) => (current ? { ...current, encoding } : current));
  }

  function updateParseDraftDelimiter(delimiter: CsvDelimiterId) {
    setParseDraft((current) => (current ? { ...current, delimiter } : current));
  }

  function updateParseDraftHeaderChoice(choice: CsvHeaderChoice) {
    setParseDraft((current) => {
      if (!current) return current;
      if (choice === "none") {
        return {
          ...current,
          headerChoice: "none",
          headerMode: "none",
          headerRow: null,
        };
      }
      if (choice === "custom") {
        const seed =
          current.headerChoice === "custom"
            ? current.customHeaderRow
            : current.headerRow && current.headerRow > 5
              ? String(current.headerRow)
              : current.customHeaderRow;
        const parsed = /^[0-9]+$/.test(seed.trim()) ? Number(seed.trim()) : null;
        return {
          ...current,
          headerChoice: "custom",
          headerMode: "row",
          headerRow: parsed && parsed > 0 ? parsed : current.headerRow,
          customHeaderRow: seed,
        };
      }
      const row = Number(choice);
      return {
        ...current,
        headerChoice: choice,
        headerMode: "row",
        headerRow: row,
      };
    });
  }

  function updateParseDraftCustomHeaderRow(value: string) {
    setParseDraft((current) => {
      if (!current) return current;
      const parsed = /^[0-9]+$/.test(value.trim()) ? Number(value.trim()) : null;
      return {
        ...current,
        headerChoice: "custom",
        headerMode: "row",
        customHeaderRow: value,
        headerRow: parsed && parsed > 0 ? parsed : current.headerRow,
      };
    });
  }

  function fileFor(fileId?: string): CsvImportFileDraft | null {
    if (fileId) return files.find((file) => file.id === fileId) ?? null;
    return activeFile;
  }

  function changeColumnType(columnId: string, type: string, fileId?: string) {
    const target = fileFor(fileId);
    if (!target) return;
    const current = target.columns.find((column) => column.id === columnId);
    if (!current || current.type === type) return;
    updateFile(target.id, (file) => {
      const base = file.importAsText ? restoreColumnSnapshot(file) : file;
      const nextFile: CsvImportFileDraft = {
        ...base,
        columns: base.columns.map((item) => {
          if (item.id !== columnId) return item;
          return {
            ...item,
            type,
            status: schemaStatusForType(type, item.detectedType),
          };
        }),
        aiProposals: base.aiProposals.filter((proposal) =>
          proposal.columnId !== columnId || proposal.status === "accepted" || proposal.status === "rejected",
        ),
        importAsText: false,
      };
      return nextFile.parsed && csvFileIsStructurallyUsable(nextFile)
        ? runValidationFor(nextFile)
        : { ...nextFile, validationRan: false, validationStale: true };
    });
  }

  function applyDetectedType(fileId: string, columnId: string, detectedType: string) {
    setActiveFileId(fileId);
    setFiles((prev) =>
      prev.map((file) => {
        if (file.id !== fileId) return file;
        const current = file.columns.find((column) => column.id === columnId);
        if (!current || current.type === detectedType) {
          return file.parsed ? runValidationFor(file) : file;
        }
        const base = file.importAsText ? restoreColumnSnapshot(file) : file;
        const nextFile: CsvImportFileDraft = {
          ...base,
          columns: base.columns.map((item) => {
            if (item.id !== columnId) return item;
            return {
              ...item,
              type: detectedType,
              status: schemaStatusForType(detectedType, item.detectedType),
            };
          }),
          aiProposals: base.aiProposals.filter((proposal) =>
            proposal.columnId !== columnId || proposal.status === "accepted" || proposal.status === "rejected",
          ),
          importAsText: false,
        };
        return nextFile.parsed && csvFileIsStructurallyUsable(nextFile)
          ? runValidationFor(nextFile)
          : { ...nextFile, validationRan: false, validationStale: true };
      }),
    );
  }

  function reviewColumnType(fileId: string, columnId: string) {
    setActiveFileId(fileId);
    goToStep(CSV_STEP.columns, { focusColumnId: columnId });
  }

  function confirmColumnType(columnId: string, fileId?: string) {
    const target = fileFor(fileId);
    if (!target) return;
    updateFile(target.id, (file) => ({
      ...file,
      columns: file.columns.map((item) => {
        if (item.id !== columnId) return item;
        return {
          ...item,
          status: item.type === item.detectedType ? "confirmed" : "modified",
          warning: undefined,
        };
      }),
    }));
  }

  function renameColumn(columnId: string, nextName: string, fileId?: string): string | null {
    const target = fileFor(fileId);
    if (!target) return "This file is not available.";
    const conflict = csvColumnNameConflict(target.columns, columnId, nextName);
    if (conflict) return conflict;
    const trimmed = nextName.trim();
    updateFile(target.id, (file) => ({
      ...file,
      columns: file.columns.map((item) =>
        item.id === columnId
          ? { ...item, name: trimmed, originalName: item.originalName ?? item.name }
          : item,
      ),
    }));
    return null;
  }

  function runValidationFor(file: CsvImportFileDraft): CsvImportFileDraft {
    if (!file.parsed) return file;
    const next = validateCsvRows({
      parsed: file.parsed,
      columns: file.columns,
      overrides: file.overrides,
      skipped: new Set(file.skipped),
      previouslyInvalid: new Set(file.lastInvalidRows),
    });
    const merged = new Set(file.lastInvalidRows);
    for (const issue of next.issues) merged.add(issue.rowNumber);
    const skippedKept = (file.issueSnapshot ?? []).filter((issue) =>
      file.skipped.includes(issue.rowNumber),
    );
    const snapshotKeys = new Set(next.issues.map((issue) => `${issue.rowNumber}:${issue.columnId}`));
    // Skip is a one-shot action over the rows that were invalid when it was chosen. Once a row is
    // restored or a fix is undone, Skip no longer covers the live issues, so it must be choosable again.
    const skipStillCovers = file.validationStrategy !== "skip" || next.invalidRows === 0;
    return {
      ...file,
      validationStrategy: skipStillCovers ? file.validationStrategy : null,
      lastInvalidRows: [...merged],
      validationRan: true,
      validationStale: false,
      issueSnapshot: [
        ...next.issues,
        ...skippedKept.filter((issue) => !snapshotKeys.has(`${issue.rowNumber}:${issue.columnId}`)),
      ],
      typeSuggestions: typeSuggestionsFor({
        ...file,
        validationRan: true,
        validationStale: false,
      }),
    };
  }

  function runValidation() {
    setFiles((prev) =>
      prev.map((file) =>
        file.included && file.parsed && csvFileIsStructurallyUsable(file)
          ? runValidationFor(file)
          : file,
      ),
    );
  }

  function skipRow(rowNumber: number, fileId?: string) {
    const target = fileFor(fileId);
    if (!target) return;
    updateFile(target.id, (file) => {
      const live = liveValidationForFile(file);
      const extra = live.issues.filter((issue) => issue.rowNumber === rowNumber);
      const keys = new Set((file.issueSnapshot ?? []).map((issue) => `${issue.rowNumber}:${issue.columnId}`));
      return runValidationFor({
        ...file,
        skipped: file.skipped.includes(rowNumber) ? file.skipped : [...file.skipped, rowNumber],
        issueSnapshot: [
          ...(file.issueSnapshot ?? []),
          ...extra.filter((issue) => !keys.has(`${issue.rowNumber}:${issue.columnId}`)),
        ],
      });
    });
  }

  function unskipRow(rowNumber: number, fileId?: string) {
    const target = fileFor(fileId);
    if (!target) return;
    updateFile(target.id, (file) => {
      const skipped = file.skipped.filter((row) => row !== rowNumber);
      const next = runValidationFor({ ...file, skipped });
      if (skipped.length > 0) return next;
      return { ...next, appliedResolutions: next.appliedResolutions.filter((kind) => kind !== "skip-affected") };
    });
  }

  function selectValidationStrategy(strategy: CsvValidationStrategy, fileId?: string) {
    const target = fileFor(fileId);
    if (!target) return;
    updateFile(target.id, (file) => {
      if (strategy === "text") {
        return runValidationFor(withResolution({
          ...asTextColumns(file),
          validationStrategy: "text",
          reuploadPending: false,
        }, "import-as-text"));
      }
      const leavingText = file.validationStrategy === "text" || file.importAsText;
      let next = leavingText ? restoreColumnSnapshot(file) : file;
      next = {
        ...next,
        validationStrategy: strategy,
        reuploadPending: strategy === "reupload",
      };
      if (strategy === "skip") {
        const rows = [...new Set(csvFileOutcome(next).summary.issues.map((issue) => issue.rowNumber))];
        const skipped = new Set([...next.skipped, ...rows]);
        return runValidationFor(withResolution({
          ...next,
          skipped: [...skipped],
          aiProposals: next.aiProposals.filter((proposal) =>
            proposal.status === "accepted" || proposal.status === "rejected" || !skipped.has(proposal.rowNumber),
          ),
        }, "skip-affected"));
      }
      return next.parsed && csvFileIsStructurallyUsable(next)
        ? runValidationFor(next)
        : { ...next, validationRan: false, validationStale: true };
    });
  }

  function undoAllSkipped(fileId?: string) {
    const target = fileFor(fileId);
    if (!target) return;
    updateFile(target.id, (file) => {
      const next = runValidationFor({ ...file, skipped: [] });
      return { ...next, appliedResolutions: next.appliedResolutions.filter((kind) => kind !== "skip-affected") };
    });
  }

  function restoreDetectedTypes(fileId?: string) {
    const target = fileFor(fileId);
    if (!target) return;
    updateFile(target.id, (file) => {
      const restored = restoreColumnSnapshot(file);
      return restored.parsed && csvFileIsStructurallyUsable(restored)
        ? runValidationFor(restored)
        : { ...restored, validationRan: false, validationStale: true };
    });
  }

  function applyProposal(proposal: CsvAiProposal, fileId?: string) {
    const target = fileFor(fileId);
    if (!target || proposal.status !== "proposed") return;
    const issue = liveValidationForFile(target).issues.find(
      (item) => item.rowNumber === proposal.rowNumber && item.columnId === proposal.columnId,
    );
    if (!issue) return;
    updateFile(target.id, (file) => {
      const next = writeCellFix(
        file,
        proposal.rowNumber,
        proposal.columnId,
        proposal.suggestedValue,
        "ai",
        file.fixMeta[proposal.rowNumber]?.[proposal.columnId]?.originalValue ?? proposal.currentValue,
      );
      return runValidationFor(withResolution({
        ...next,
        aiProposals: next.aiProposals.map((item) =>
          item.rowNumber === proposal.rowNumber && item.columnId === proposal.columnId
            ? { ...item, status: "accepted" }
            : item,
        ),
      }, "ai-accepted"));
    });
  }

  function applyAllProposals(fileId?: string) {
    const target = fileFor(fileId);
    if (!target) return;
    updateFile(target.id, (file) => {
      let next = file;
      const accepted = new Set<string>();
      for (const proposal of file.aiProposals) {
        if (proposal.status !== "proposed") continue;
        const column = file.columns.find((item) => item.id === proposal.columnId);
        const expected = column ? selectedColumnType(column) : "Text";
        if (!valueMatchesType(proposal.suggestedValue, expected)) continue;
        const key = `${proposal.rowNumber}:${proposal.columnId}`;
        next = writeCellFix(
          next,
          proposal.rowNumber,
          proposal.columnId,
          proposal.suggestedValue,
          "ai",
          next.fixMeta[proposal.rowNumber]?.[proposal.columnId]?.originalValue ?? proposal.currentValue,
        );
        accepted.add(key);
      }
      if (accepted.size === 0) return file;
      return runValidationFor(withResolution({
        ...next,
        aiProposals: next.aiProposals.map((item) =>
          accepted.has(`${item.rowNumber}:${item.columnId}`)
            ? { ...item, status: "accepted" }
            : item,
        ),
      }, "ai-accepted"));
    });
  }

  function rejectProposal(proposal: CsvAiProposal, fileId?: string) {
    const target = fileFor(fileId);
    if (!target || proposal.status !== "proposed") return;
    updateFile(target.id, (file) => ({
      ...file,
      aiProposals: file.aiProposals.map((item) =>
        item.rowNumber === proposal.rowNumber && item.columnId === proposal.columnId
          ? { ...item, status: "rejected" }
          : item,
      ),
    }));
  }

  function undoCellFix(rowNumber: number, columnId: string, fileId?: string) {
    const target = fileFor(fileId);
    if (!target?.fixMeta[rowNumber]?.[columnId]) return;
    updateFile(target.id, (file) => {
      const meta = file.fixMeta[rowNumber]?.[columnId];
      if (!meta) return file;
      const cleared = clearCellFix(file, rowNumber, columnId);
      const next: CsvImportFileDraft = {
        ...cleared,
        aiProposals: cleared.aiProposals.map((proposal) =>
          proposal.rowNumber === rowNumber && proposal.columnId === columnId && proposal.status === "accepted"
            ? { ...proposal, status: "proposed" }
            : proposal,
        ),
        appliedResolutions: cleared.appliedResolutions.filter((kind) => {
          if (kind === "ai-accepted" && meta.origin === "ai" && !hasFixOrigin(cleared, "ai")) return false;
          if (kind === "manual" && meta.origin === "manual" && !hasFixOrigin(cleared, "manual")) return false;
          return true;
        }),
      };
      return next.parsed && csvFileIsStructurallyUsable(next)
        ? runValidationFor(next)
        : { ...next, validationRan: false, validationStale: true };
    });
  }

  async function proposeAiFixes(fileId?: string) {
    const target = fileFor(fileId);
    if (!target || aiBusyFileId) return;
    const file = target;
    setAiBusyFileId(file.id);
    setProposeNotice(null);
    try {
      const live = liveValidationForFile(file);
      const byColumn = new Map<string, typeof live.issues>();
      for (const issue of live.issues) {
        const list = byColumn.get(issue.columnId) ?? [];
        list.push(issue);
        byColumn.set(issue.columnId, list);
      }
      const proposals: CsvAiProposal[] = [];
      const replaced = new Set<string>();
      for (const [columnId, issues] of byColumn) {
        const column = file.columns.find((item) => item.id === columnId);
        const expected = column ? selectedColumnType(column) : issues[0]?.expected ?? "Text";
        const examples = (column?.examples ?? []).filter((value) => valueMatchesType(value, expected as CsvColumnType));
        const columnName = column?.name ?? issues[0]?.columnName ?? "Column";
        const repairable: typeof issues = [];
        for (const issue of issues) {
          const key = `${issue.rowNumber}:${issue.columnId}`;
          replaced.add(key);
          if (suggestedRepairValue(issue.value, expected, examples)) {
            repairable.push(issue);
            continue;
          }
          proposals.push({
            rowNumber: issue.rowNumber,
            columnId,
            columnName,
            currentValue: issue.value,
            suggestedValue: "",
            status: "unrecoverable",
          });
        }
        if (repairable.length === 0) continue;
        const result = await proposeCsvSimilarRepairs({
          fileId: file.id,
          fileName: file.fileName,
          columnId,
          columnName,
          selectedType: expected,
          validExamples: examples,
          issues: repairable.map((issue) => ({
            rowNumber: issue.rowNumber,
            currentValue: issue.value,
          })),
        });
        const returned = new Set<string>();
        if (result.status === "ok") {
          for (const change of result.data.changes) {
            if (!valueMatchesType(change.suggestedValue, expected as CsvColumnType)) continue;
            const key = `${change.rowNumber}:${columnId}`;
            returned.add(key);
            proposals.push({
              rowNumber: change.rowNumber,
              columnId,
              columnName,
              currentValue: change.currentValue,
              suggestedValue: change.suggestedValue,
              status: "proposed",
            });
          }
        }
        for (const issue of repairable) {
          const key = `${issue.rowNumber}:${issue.columnId}`;
          if (returned.has(key)) continue;
          proposals.push({
            rowNumber: issue.rowNumber,
            columnId,
            columnName,
            currentValue: issue.value,
            suggestedValue: "",
            status: "unrecoverable",
          });
        }
      }
      updateFile(file.id, (current) => ({
        ...current,
        validationStrategy: current.validationStrategy ?? "ai",
        aiProposalsGenerated: true,
        aiProposals: [...keptReviewedProposals(current, replaced), ...proposals],
      }));
      if (proposals.some((proposal) => proposal.status === "unrecoverable")) {
        setProposeNotice("Some values could not be repaired.");
      }
    } finally {
      setAiBusyFileId(null);
    }
  }

  async function replaceCurrentFile(next: File, fileId?: string) {
    const target = fileFor(fileId);
    if (!target) return;
    if (!next.name.toLowerCase().endsWith(".csv")) {
      setProposeNotice("Only a CSV file can replace this file.");
      return;
    }
    const targetId = target.id;
    try {
      const buffer = await next.arrayBuffer();
      updateFile(targetId, (file) => {
        const replaced = replaceCsvImportFileContents(file, new Uint8Array(buffer), {
          fileName: next.name || file.fileName,
          size: next.size,
          lastModified: next.lastModified,
        });
        if (csvFileIsStructurallyUsable(replaced) && !csvFileNeedsSchemaReview(replaced)) {
          return runValidationFor(replaced);
        }
        return replaced;
      });
      setProposeNotice(null);
    } catch {
      setProposeNotice(`${next.name} could not be read.`);
    }
  }

  function applyCellFix(issue: CsvValidationIssue, value: string, fileId?: string): string | null {
    const target = fileFor(fileId);
    if (!target) return "This file is not available.";
    const column = target.columns.find((item) => item.id === issue.columnId);
    const expected = column ? selectedColumnType(column) : (issue.expected as CsvColumnType);
    if (!valueMatchesType(value, expected)) {
      return `This value does not match ${csvColumnTypeLabel(expected)}.`;
    }
    updateFile(target.id, (file) => {
      const originalValue = file.fixMeta[issue.rowNumber]?.[issue.columnId]?.originalValue ?? issue.value;
      const next = writeCellFix(file, issue.rowNumber, issue.columnId, value, "manual", originalValue);
      return runValidationFor(withResolution({
        ...next,
        aiProposals: next.aiProposals.map((proposal) =>
          proposal.rowNumber === issue.rowNumber && proposal.columnId === issue.columnId
            && proposal.status !== "rejected"
            ? { ...proposal, status: "rejected" }
            : proposal,
        ),
      }, "manual"));
    });
    return null;
  }

  function applyCellFixes(
    fixes: Array<{ issue: CsvValidationIssue; value: string }>,
    fileId?: string,
  ): string | null {
    const target = fileFor(fileId);
    if (!target) return "This file is not available.";
    const accepted: Array<{ issue: CsvValidationIssue; value: string }> = [];
    let rejected = 0;
    for (const fix of fixes) {
      const column = target.columns.find((item) => item.id === fix.issue.columnId);
      const expected = column
        ? selectedColumnType(column)
        : (fix.issue.expected as CsvColumnType);
      if (!valueMatchesType(fix.value, expected)) {
        rejected += 1;
        continue;
      }
      accepted.push(fix);
    }
    if (accepted.length === 0) {
      return rejected > 0 ? "Suggested values do not match the column type." : null;
    }
    updateFile(target.id, (file) => {
      let next = file;
      const touched = new Set<string>();
      for (const { issue, value } of accepted) {
        const originalValue = next.fixMeta[issue.rowNumber]?.[issue.columnId]?.originalValue ?? issue.value;
        next = writeCellFix(next, issue.rowNumber, issue.columnId, value, "manual", originalValue);
        touched.add(`${issue.rowNumber}:${issue.columnId}`);
      }
      return runValidationFor(withResolution({
        ...next,
        aiProposals: next.aiProposals.map((proposal) =>
          touched.has(`${proposal.rowNumber}:${proposal.columnId}`) && proposal.status !== "rejected"
            ? { ...proposal, status: "rejected" }
            : proposal,
        ),
      }, "manual"));
    });
    if (rejected === 0) return null;
    return `Applied ${accepted.length.toLocaleString()}. ${rejected.toLocaleString()} did not match the column type.`;
  }

  function completePayload(): CsvImportCompletePayload {
    return {
      tables: included.map((file) => {
        const outcome = outcomes.get(file.id) ?? csvFileOutcome(file);
        const valueContext = file.columns.flatMap((column) => {
          const entry = file.valueContext?.[column.id];
          if (!entry) return [];
          const values = entry.values.map((value) => value.trim()).filter(Boolean);
          if (values.length === 0) return [];
          return [{
            columnId: column.id,
            columnName: column.name,
            retrievalMethod: entry.retrievalMethod,
            order: entry.order,
            limit: entry.limit,
            aggregateColumnId: entry.aggregateColumnId,
            values,
            origin: entry.origin,
          }];
        });
        return {
          id: file.id,
          fileName: file.fileName,
          tableName: file.tableName.trim() || "imported_table",
          tableDescription: file.tableDescription.trim(),
          delimiter: CSV_DELIMITER_LABELS[file.delimiter],
          encoding: CSV_ENCODING_LABELS[file.encoding],
          importedRows: outcome.importedRows,
          skippedRows: outcome.skippedRows,
          valueContext: valueContext.length > 0 ? valueContext : undefined,
        };
      }),
    };
  }

  function railState(id: StepId): RailState {
    if (created) {
      if (id === CSV_STEP.summary) return "current";
      return "completed";
    }
    if (id === CSV_STEP.summary) return "future";
    if (id === step) return "current";
    if (id === CSV_STEP.upload) return uploadComplete ? "completed" : "future";
    if (id === CSV_STEP.columns) {
      if (!uploadComplete) return id <= maxReachedStep ? "blocked" : "future";
      if (step > CSV_STEP.columns && schemaComplete) return "completed";
      return id <= maxReachedStep ? "needs-review" : "future";
    }
    if (id === CSV_STEP.validation) {
      if (!uploadComplete) return id <= maxReachedStep ? "blocked" : "future";
      if (validationComplete) return "completed";
      if (id <= maxReachedStep) return "needs-review";
      return "future";
    }
    if (id === CSV_STEP.import) {
      if (!uploadComplete) return id <= maxReachedStep ? "blocked" : "future";
      if (importLocked && step > CSV_STEP.import) return "completed";
      if (id <= maxReachedStep) return importLocked ? "completed" : "needs-review";
      return "future";
    }
    if (!importLocked || !tablesComplete) return id <= maxReachedStep ? "blocked" : "future";
    return id <= maxReachedStep ? "completed" : "future";
  }

  function canOpenStep(id: StepId): boolean {
    if (created) return false;
    if (id === CSV_STEP.summary) return false;
    if (id === CSV_STEP.upload) return true;
    if (
      step === CSV_STEP.upload
      && parseDraftIsDirty(parseDraft, files.find((file) => file.id === parseDraft?.fileId))
    ) return false;
    if (id > maxReachedStep) return false;
    if (id === CSV_STEP.columns) return uploadComplete;
    if (id === CSV_STEP.validation) return uploadComplete;
    if (id === CSV_STEP.import) return uploadComplete;
    if (
      id === CSV_STEP.tableDescriptions
      || id === CSV_STEP.sampleValues
      || id === CSV_STEP.columnDescriptions
    ) {
      return importLocked && tablesComplete;
    }
    return false;
  }

  function primaryLabel() {
    if (step === CSV_STEP.validation && filesNeedingValidationRun.length > 0) {
      return validationHasRun ? "Revalidate all files" : "Validate all files";
    }
    if (step === CSV_STEP.import) return "Import data";
    if (step === CSV_STEP.columnDescriptions) return creating ? "Creating Data Source…" : "Create Data Source";
    if (step === CSV_STEP.summary) return "Done";
    return "Next";
  }

  function canAdvance() {
    if (created && step === CSV_STEP.summary) return true;
    if (!sourceName) return false;
    if (creating || reading || applyingParse) return false;
    if (
      step === CSV_STEP.upload
      && parseDraftIsDirty(parseDraft, files.find((file) => file.id === parseDraft?.fileId))
    ) return false;
    if (step === CSV_STEP.upload) return uploadComplete;
    if (step === CSV_STEP.columns && schemaParseDirty()) return false;
    if (step === CSV_STEP.columns) return Boolean(activeFile && csvFileSchemaReady(activeFile));
    if (step === CSV_STEP.validation) return true;
    if (step === CSV_STEP.import) return tablesComplete;
    if (step === CSV_STEP.tableDescriptions) return tablesComplete && importLocked && !tableDescriptionAiBusy;
    if (step === CSV_STEP.sampleValues) return tablesComplete && importLocked;
    if (step === CSV_STEP.columnDescriptions) {
      const unresolved = included.some((file) => liveValidationForFile(file).invalidRows > 0);
      return tablesComplete && importLocked && includedTotals.errors === 0 && !unresolved && !created;
    }
    return true;
  }

  function handlePrimary() {
    if (blockSchemaParseLeave()) return;
    if (!canAdvance()) return;
    if (step === CSV_STEP.validation && filesNeedingValidationRun.length > 0) {
      runValidation();
      return;
    }
    if (step === CSV_STEP.import) {
      if (!tablesComplete) return;
      setConfirmedImportSignature(importOutcomeSignature);
      goToStep(CSV_STEP.tableDescriptions);
      return;
    }
    if (step === CSV_STEP.columnDescriptions) {
      if (
        creating
        || created
        || !tablesComplete
        || !importLocked
        || includedTotals.errors > 0
        || included.some((file) => liveValidationForFile(file).invalidRows > 0)
      ) return;
      setCreating(true);
      setCreateError(null);
      try {
        onComplete(completePayload());
        setCreated(true);
        goToStep(CSV_STEP.summary);
      } catch {
        setCreateError("The Data Source could not be created.");
      } finally {
        setCreating(false);
      }
      return;
    }
    if (step === CSV_STEP.summary) {
      onFinish();
      return;
    }
    if (step === CSV_STEP.upload && included[0]) setActiveFileId(included[0].id);
    goToStep(Math.min(step + 1, CSV_STEP.summary) as StepId);
  }

  function handleBack() {
    if (created) return;
    if (blockSchemaParseLeave()) return;
    if (step === CSV_STEP.upload) {
      onBackToChooser();
      return;
    }
    goToStep(Math.max(step - 1, CSV_STEP.upload) as StepId);
  }

  function handleDialogOpenChange(next: boolean) {
    if (next) return;
    if (sampleValuesLeaveStep) {
      setSampleValuesLeaveStep(null);
      return;
    }
    if (pendingRemoveFileId) {
      dismissRemoveDialog();
      return;
    }
    if (previewFileId) {
      setPreviewFileId(null);
      return;
    }
    if (created) onFinish();
    else onCancel();
  }

  function openFilePreview(fileId: string) {
    const file = files.find((item) => item.id === fileId);
    if (!file || !csvFileCanPreview(file)) return;
    setPreviewFileId(fileId);
  }

  function closeFilePreview() {
    const fileId = previewFileId;
    setPreviewFileId(null);
    if (fileId) focusRequestRef.current = { type: "preview", fileId };
  }

  function fixParsingFromPreview() {
    if (!previewFileId) return;
    const fileId = previewFileId;
    setPreviewFileId(null);
    startParseEdit(fileId);
  }

  const blockingFiles = included.filter((file) => {
    const summary = validations.get(file.id) ?? EMPTY_VALIDATION;
    return file.validationRan && !file.validationStale && summary.invalidRows > 0;
  });
  const blockingErrorCount = blockingFiles.reduce((sum, file) => {
    const summary = validations.get(file.id) ?? EMPTY_VALIDATION;
    return sum + summary.invalidRows;
  }, 0);

  function schemaAdvanceBlockReason(): string | null {
    if (!activeFile) return null;
    if (csvFileNeedsParsingReview(activeFile)) {
      const rows = activeFile.parsed?.records.length ?? 0;
      if (rows >= 8) return `Review parsing — ${rows.toLocaleString()} rows are affected.`;
      return "Review parsing to continue.";
    }
    const column = activeFile.columns.find((item) => item.status === "needs-review");
    if (column) return `Accept the ${column.name} column type to continue.`;
    return null;
  }

  function validationBlockedCopy(): string | null {
    if (step !== CSV_STEP.validation || filesNeedingValidationRun.length > 0) return null;
    const unresolved = included.flatMap((file) => {
      const rows = liveValidationForFile(file).invalidRows;
      return rows > 0 ? [{ fileName: file.fileName, rows }] : [];
    });
    if (unresolved.length === 1) {
      const { fileName, rows } = unresolved[0]!;
      return `${fileName} still has ${rows.toLocaleString()} unresolved row${rows === 1 ? "" : "s"}.`;
    }
    const total = unresolved.reduce((sum, item) => sum + item.rows, 0);
    if (total > 0) {
      return total === 1
        ? "1 row still needs a resolution."
        : `${total.toLocaleString()} rows still need a resolution.`;
    }
    if (blockingErrorCount === 0) return null;
    return `Resolve or exclude ${blockingErrorCount.toLocaleString()} row${blockingErrorCount === 1 ? "" : "s"} to continue.`;
  }

  function advanceBlockedReason(): string | null {
    if (canAdvance()) return null;
    // Step 01 shows this under the name field itself.
    if (!created && !sourceName) return step === CSV_STEP.upload ? null : "Enter a Data Source name.";
    if (step === CSV_STEP.upload) return null;
    if (step === CSV_STEP.columns) return schemaAdvanceBlockReason();
    if (step === CSV_STEP.validation) return validationBlockedCopy();
    if (
      step === CSV_STEP.import
      || step === CSV_STEP.tableDescriptions
      || step === CSV_STEP.columnDescriptions
    ) {
      return importAdvanceBlocker();
    }
    return null;
  }

  function importAdvanceBlocker(): string {
    if (reading || applyingParse) return "Wait until the current action finishes.";
    if (tableDescriptionAiBusy) return "Wait for AI generation to finish.";
    for (const file of included) {
      const unresolved = liveValidationForFile(file).invalidRows;
      if (unresolved > 0) {
        return `${file.fileName} still has ${unresolved.toLocaleString()} unresolved row${unresolved === 1 ? "" : "s"}.`;
      }
    }
    for (const file of included) {
      if (!csvFileSchemaReady(file)) return `${file.fileName} still needs a column type confirmed.`;
    }
    for (const file of included) {
      if (!file.tableName.trim()) return `${file.fileName} needs a table name.`;
    }
    for (const file of included) {
      const name = file.tableName.trim();
      if (name && duplicateNames.has(tableNameConflictKey(name))) {
        return `${file.fileName} has a duplicate table name.`;
      }
    }
    if (includedTotals.errors > 0) {
      const count = includedTotals.errors;
      return `Resolve or exclude ${count.toLocaleString()} row${count === 1 ? "" : "s"} to continue.`;
    }
    if (!importLocked && step > CSV_STEP.import) return "Import the data before continuing.";
    if (step === CSV_STEP.columnDescriptions) return "Resolve the remaining issues before creating this Data Source.";
    return "Choose a unique table name for each file.";
  }

  const nextReason = advanceBlockedReason();
  const step1ParseDirty = step === CSV_STEP.upload && parseDraftIsDirty(
    parseDraft,
    files.find((file) => file.id === parseDraft?.fileId),
  );
  const step2ParseDirty = schemaParseDirty();
  const step2BlockedWithReason = step === CSV_STEP.columns && !canAdvance() && !step2ParseDirty && Boolean(nextReason);
  const step1NextReason = (() => {
    if (step !== CSV_STEP.upload || step1ParseDirty || canAdvance()) return null;
    if (applyingParse) return "Applying parsing changes.";
    if (reading) return "Reading files. Wait until the files finish loading.";
    if (files.length === 0) return "Add at least one CSV file to continue.";
    const blocking = included.find((file) => !csvFileHasUsableParse(file));
    if (blocking) {
      const notice = csvFileNotices(blocking)[0]?.message ?? "We couldn't read the columns correctly.";
      return `Fix parsing for ${blocking.fileName} to continue. ${notice}`;
    }
    return "Include at least one CSV file to continue.";
  })();
  const pendingRemoveFile = pendingRemoveFileId
    ? files.find((file) => file.id === pendingRemoveFileId)
    : undefined;
  const pendingRemoveHasUnsavedValues = pendingRemoveFile
    ? unsavedValueContextColumnCount([pendingRemoveFile]) > 0
    : false;
  const stackSections = included.length <= CSV_STACKED_SECTION_MAX;

  function renderSchemaFile(file: CsvImportFileDraft) {
    const draftForFile = parseDraft?.fileId === file.id ? parseDraft : null;
    return (
      <SchemaPanel
        key={file.id}
        file={file}
        focusedColumnId={file.id === activeFile?.id ? focusedColumnId : null}
        editingParse={editingFileId === file.id}
        draftEncoding={draftForFile?.encoding ?? file.encoding}
        draftDelimiter={draftForFile?.delimiter ?? file.delimiter}
        draftHeaderChoice={draftForFile?.headerChoice ?? headerChoiceFromFile(file)}
        draftCustomHeaderRow={
          draftForFile
            ? draftForFile.customHeaderRow
            : headerChoiceFromFile(file) === "custom" && file.headerRow
              ? String(file.headerRow)
              : ""
        }
        onTypeChange={(columnId, type) => changeColumnType(columnId, type, file.id)}
        onConfirmType={(columnId) => confirmColumnType(columnId, file.id)}
        onRenameColumn={(columnId, nextName) => renameColumn(columnId, nextName, file.id)}
        onSaveFix={(issue, value) => applyCellFix(issue, value, file.id)}
        onSaveFixes={(fixes) => applyCellFixes(fixes, file.id)}
        onExclude={(rowNumber) => skipRow(rowNumber, file.id)}
        onUndo={(rowNumber) => unskipRow(rowNumber, file.id)}
        onStartParseEdit={() => startParseEdit(file.id)}
        onReparseFile={reparseEditedFile}
        onCancelParseEdit={cancelParseEdit}
        onEncoding={updateParseDraftEncoding}
        onDelimiter={updateParseDraftDelimiter}
        onHeaderChoice={updateParseDraftHeaderChoice}
        onCustomHeaderRow={updateParseDraftCustomHeaderRow}
        draftDirty={Boolean(draftForFile) && schemaParseDirty()}
        leaveAttempt={editingFileId === file.id ? schemaParseLeaveAttempt : 0}
      />
    );
  }

  function renderValidationFile(file: CsvImportFileDraft) {
    return (
      <section key={file.id} className="min-w-0" aria-label={file.fileName}>
        <CsvValidationWorkspace
          file={file}
          proposing={aiBusyFileId === file.id}
          proposeNotice={file.id === activeFileId ? proposeNotice : null}
          onSelectStrategy={(strategy) => selectValidationStrategy(strategy, file.id)}
          onUndoFix={(rowNumber, columnId) => undoCellFix(rowNumber, columnId, file.id)}
          onUndoSkip={(rowNumber) => unskipRow(rowNumber, file.id)}
          onUndoAllSkipped={() => undoAllSkipped(file.id)}
          onSaveFix={(issue, value) => applyCellFix(issue, value, file.id)}
          onPropose={() => void proposeAiFixes(file.id)}
          onApplyProposal={(proposal) => applyProposal(proposal, file.id)}
          onApplyAll={() => applyAllProposals(file.id)}
          onRejectProposal={(proposal) => rejectProposal(proposal, file.id)}
          onRestoreDetectedTypes={() => restoreDetectedTypes(file.id)}
          onReplaceFile={(next) => void replaceCurrentFile(next, file.id)}
          onUseSuggestion={(suggestion) => changeColumnType(suggestion.columnId, suggestion.suggestedType, file.id)}
        />
      </section>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="luxia-csv-wizard flex flex-col gap-0 overflow-hidden p-0"
        onEscapeKeyDown={(event) => {
          if (document.querySelector("[data-csv-schema-expanded='true']")) {
            event.preventDefault();
            return;
          }
          if (previewFileId || pendingRemoveFileId || sampleValuesLeaveStep) event.preventDefault();
        }}
      >
        <DialogHeader
          className="luxia-csv-wizard-header shrink-0 space-y-0 pr-14 text-left"
          style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
        >
          <DialogTitle className="text-left" style={{ color: "var(--luxia-text-inverse)" }}>
            Import CSV
          </DialogTitle>
          <DialogDescription className="sr-only">{sourceName}</DialogDescription>
        </DialogHeader>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => void acceptFiles(event.target.files)}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row md:items-stretch">
          <nav
            className="luxia-creation-side-rail luxia-csv-wizard-rail luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical shrink-0 md:flex md:min-h-0 md:flex-col md:self-stretch md:overflow-y-auto"
            aria-label="CSV import steps"
          >
            <ol className="relative z-[1] flex gap-2 overflow-x-auto md:flex-col md:gap-0">
              {STEPS.map((item, index) => {
                const state = railState(item.id);
                const active = item.id === step;
                const disabled = !canOpenStep(item.id);
                const isLast = index === STEPS.length - 1;
                const schemaNeedsReview =
                  item.id === CSV_STEP.columns
                  && !schemaComplete
                  && (active || maxReachedStep >= CSV_STEP.columns);
                const validationNeedsReview =
                  item.id === CSV_STEP.validation
                  && uploadComplete
                  && !validationComplete
                  && (active || maxReachedStep >= CSV_STEP.validation);
                const showNeedsReview =
                  state === "needs-review"
                  || (active && schemaNeedsReview)
                  || validationNeedsReview;
                const showCompleted = !active && state === "completed";
                const statusText = showNeedsReview ? "Needs review" : showCompleted ? "Completed" : null;
                const markerState = active
                  ? "current"
                  : state === "completed"
                    ? "done"
                    : showNeedsReview
                      ? "open"
                      : "muted";
                const previousCompleted = index > 0 && railState(STEPS[index - 1].id) === "completed";
                const stepLabel = `${String(item.id).padStart(2, "0")} ${item.label}`;
                return (
                  <li key={item.id} className="luxia-csv-step relative z-[1] flex min-w-0 shrink-0 items-center md:w-full">
                    <div className="luxia-csv-step-track relative z-[1] hidden shrink-0 items-center justify-center self-stretch md:flex">
                      {index > 0 ? (
                        <span
                          aria-hidden
                          className="luxia-csv-step-line luxia-csv-step-line-before"
                          data-progress={previousCompleted ? "done" : "next"}
                        />
                      ) : null}
                      {!isLast ? (
                        <span
                          aria-hidden
                          className="luxia-csv-step-line luxia-csv-step-line-after"
                          data-progress={state === "completed" ? "done" : "next"}
                        />
                      ) : null}
                      <StepMarker index={item.id} state={markerState} />
                    </div>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-current={active ? "step" : undefined}
                      aria-disabled={disabled}
                      aria-label={`${stepLabel}, ${statusText ?? railStateLabel(state)}`}
                      onClick={() => {
                        if (item.id !== step && blockSchemaParseLeave()) return;
                        if (disabled) return;
                        goToStep(item.id);
                      }}
                      className="luxia-csv-step-button min-w-0 flex-1 rounded-[6px] px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] disabled:cursor-not-allowed enabled:cursor-pointer"
                      data-state={active ? "current" : state}
                    >
                      <span className="flex items-center gap-3 md:block">
                        <span className="md:hidden">
                          <StepMarker index={item.id} state={markerState} />
                        </span>
                        <span className="min-w-0">
                          <span className="luxia-csv-step-label block">{item.label}</span>
                          {statusText ? (
                            <span className="luxia-csv-step-status" data-kind={showNeedsReview ? "review" : "done"}>
                              {statusText}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col"
            style={{ background: "var(--luxia-settings-canvas)" }}
          >
            <div
              ref={contentScrollRef}
              className="luxia-csv-wizard-canvas luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical min-h-0 flex-1 overflow-y-auto px-8 py-7"
            >
              {step === CSV_STEP.upload ? (
                <div className="flex flex-col gap-5">
                  <UploadSourceSummary
                    name={sourceNameDraft}
                    onNameChange={onSourceNameChange}
                    ownershipLabel={ownershipLabel}
                    tagDraft={tagDraft}
                  />
                  <UploadStep
                    files={files}
                    dragActive={dragActive}
                    reading={reading}
                    applyingParse={applyingParse}
                    acceptNotice={acceptNotice}
                    editingFileId={editingFileId}
                    parseDraft={parseDraft}
                    onBrowse={() => openCsvFilePicker(false)}
                    onDrop={handleDrop}
                    onDragEnter={() => setDragActive(true)}
                    onDragLeave={() => setDragActive(false)}
                    onPreview={openFilePreview}
                    onStartParseEdit={startParseEdit}
                    onReparseFile={reparseEditedFile}
                    onCancelParseEdit={cancelParseEdit}
                    onRemove={requestRemoveFile}
                    onToggleIncluded={toggleIncluded}
                    onEncoding={updateParseDraftEncoding}
                    onDelimiter={updateParseDraftDelimiter}
                    onHeaderChoice={updateParseDraftHeaderChoice}
                    onCustomHeaderRow={updateParseDraftCustomHeaderRow}
                    warnParseReset={maxReachedStep >= CSV_STEP.columns}
                  />
                </div>
              ) : null}

              {step === CSV_STEP.columns && activeFile ? (
                <div className="min-w-0 space-y-6">
                  <StepIntro title="Columns & Types" body="Confirm the structure of each file." />
                  <FileSwitcher
                    files={included}
                    activeId={activeFile.id}
                    validations={validations}
                    mode="schema"
                    onSelect={selectFile}
                    onRequestRemove={requestRemoveFile}
                    allowAddFile
                    onAddFile={() => {
                      if (blockSchemaParseLeave()) return;
                      openCsvFilePicker(true);
                    }}
                    adding={reading}
                    notice={acceptNotice}
                  />
                  {parseResetNotice ? (
                    <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status" aria-live="polite">
                      {parseResetNotice}
                    </p>
                  ) : null}
                  {renderSchemaFile(activeFile)}
                </div>
              ) : null}

              {step === CSV_STEP.validation && activeFile ? (
                <div className="min-w-0 space-y-6">
                  <StepIntro
                    title="Validation"
                    body="Resolve values that do not match the column types."
                  />
                  <FileSwitcher
                    files={included}
                    activeId={activeFile.id}
                    validations={validations}
                    mode="validation"
                    onSelect={selectFile}
                    onRequestRemove={requestRemoveFile}
                  />
                  {renderValidationFile(activeFile)}
                </div>
              ) : null}

              {step === CSV_STEP.import ? (
                <div className="space-y-6">
                  <StepIntro
                    title={`Ready to import “${sourceName}”`}
                    body="Nothing has been written yet. Confirm to create the tables and import the rows."
                  />
                  {!validationComplete ? (
                    <p className="luxia-type-caption" style={{ color: "var(--luxia-warning-90)" }} role="status">
                      A validation choice is still incomplete. Go back to Validation or choose another resolution.
                    </p>
                  ) : null}
                  <ul className="luxia-csv-import-files">
                    {included.map((file) => (
                      <ReviewFileCard
                        key={file.id}
                        outcome={describeReviewFile(file, duplicateNames)}
                        tableName={file.tableName}
                        nameInputId={`csv-import-table-${file.id}`}
                        nameConflict={Boolean(file.tableName.trim()) && duplicateNames.has(tableNameConflictKey(file.tableName))}
                        onTableNameChange={(value) => patchTableName(file.id, value)}
                        onEditSchema={() => goToStep(CSV_STEP.columns, { fileId: file.id })}
                        onReviewValidation={() => goToStep(CSV_STEP.validation, { fileId: file.id })}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}

              {step === CSV_STEP.tableDescriptions && activeFile ? (
                <div className="space-y-5">
                  <StepIntro
                    title="What does each table hold?"
                    body="Describe the contents so Luxia can choose the right table."
                  />
                  {included.length > 1 ? (
                    <div className="luxia-csv-table-desc-toolbar">
                      <FileSwitcher
                        files={included}
                        activeId={activeFile.id}
                        validations={validations}
                        mode="tables"
                        onSelect={selectFile}
                        onRequestRemove={requestRemoveFile}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <LuxiaAiButton
                          disabled={tableDescriptionAiBusy || included.every((file) => !tableDescriptionNeedsAi(file))}
                          aria-busy={bulkTableAiBusy}
                          onClick={() => void generateBulkTableMeta()}
                        >
                          {bulkTableAiBusy ? "Generating…" : "Generate missing descriptions"}
                        </LuxiaAiButton>
                        {bulkTableAiNotice ? (
                          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status" aria-live="polite">
                            {bulkTableAiNotice}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <TableDescriptionEditor
                    key={activeFile.id}
                    file={activeFile}
                    tagDraft={tagDraft}
                    aiLocked={bulkTableAiBusy}
                    onAiBusyChange={setTableAiBusy}
                    onDescriptionChange={(value) => patchTableDescription(activeFile.id, value)}
                    onApplyAiDescription={(tableDescription) =>
                      applyAiTableDescription(activeFile.id, tableDescription)
                    }
                    onRowDescriptionSave={(rowNumber, text) => saveRowDescription(activeFile.id, rowNumber, text)}
                    onApplyRowDescriptions={(changes) => applyAiRowDescriptions(activeFile.id, changes)}
                  />
                </div>
              ) : null}

              {step === CSV_STEP.sampleValues && activeFile ? (
                <div className="space-y-6">
                  <StepIntro
                    title="Which columns need example values?"
                    body="Retrieve a few representative values, then save the ones Luxia should remember."
                  />
                  {included.length > 1 ? (
                    <FileSwitcher
                      files={included}
                      activeId={activeFile.id}
                      validations={validations}
                      mode="sample-values"
                      onSelect={selectFile}
                      onRequestRemove={requestRemoveFile}
                    />
                  ) : null}
                  <CsvValueContextSection
                    file={activeFile}
                    onPatchDrafts={(entries) => saveValueContextDrafts(activeFile.id, entries)}
                    onCommitDrafts={(columnIds) => commitValueContextDrafts(activeFile.id, columnIds)}
                  />
                </div>
              ) : null}

              {step === CSV_STEP.columnDescriptions && activeFile ? (
                <div className="space-y-6">
                  <StepIntro
                    title="What does each column mean?"
                    body="Review the accepted type and examples for each column."
                  />
                  {stackSections ? null : (
                    <FileSwitcher
                      files={included}
                      activeId={activeFile.id}
                      validations={validations}
                      mode="schema"
                      onSelect={selectFile}
                      onRequestRemove={requestRemoveFile}
                    />
                  )}
                  {(stackSections ? included : [activeFile]).map((file) => (
                    <section key={file.id} className="luxia-csv-file-section" aria-label={file.tableName || file.fileName}>
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="inline-flex min-w-0 items-center gap-2 luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }} title={file.fileName}>
                          <CsvFileGlyph size={16} />
                          <span className="truncate">{file.tableName.trim() || file.fileName}</span>
                        </h3>
                        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                          {`0 of ${file.columns.length.toLocaleString()} described`}
                        </p>
                      </div>
                      <div className="luxia-settings-table-surface overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                              <th className="px-3 py-2 font-normal">Column</th>
                              <th className="px-3 py-2 font-normal">Type</th>
                              <th className="px-3 py-2 font-normal">Examples</th>
                            </tr>
                          </thead>
                          <tbody>
                            {file.columns.map((column) => (
                              <tr
                                key={column.id}
                                className="border-t luxia-type-caption"
                                style={{ borderColor: "var(--luxia-settings-row-divider)", color: "var(--luxia-text-secondary)" }}
                              >
                                <td className="px-3 py-2 align-top" style={{ color: "var(--luxia-text-primary)" }}>
                                  {column.name}
                                </td>
                                <td className="px-3 py-2 align-top">{csvColumnTypeLabel(selectedColumnType(column))}</td>
                                <td className="px-3 py-2 align-top" title={columnContextExamples(file, column)}>
                                  {columnContextExamples(file, column)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))}
                  {creating ? (
                    <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
                      Creating Data Source…
                    </p>
                  ) : null}
                  {createError ? (
                    <p className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }} role="alert">
                      {createError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step === CSV_STEP.summary ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                      {`“${sourceName}” is ready`}
                    </h3>
                    <p className="mt-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                      {`${includedTotals.ready.toLocaleString()} rows imported · ${includedTotals.skipped.toLocaleString()} rows skipped · ${includedTotals.rejected.toLocaleString()} rows rejected`}
                    </p>
                  </div>
                  <div className="luxia-settings-table-surface overflow-x-auto">
                    <table className="w-full min-w-[40rem] border-collapse text-left">
                      <thead>
                        <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                          <th className="px-3 py-2 font-normal">File</th>
                          <th className="px-3 py-2 font-normal">Table</th>
                          <th className="px-3 py-2 font-normal">Imported</th>
                          <th className="px-3 py-2 font-normal">Skipped</th>
                          <th className="px-3 py-2 font-normal">Rejected</th>
                          <th className="px-3 py-2 font-normal">AI-fixed</th>
                          <th className="px-3 py-2 font-normal">Resolution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {included.map((file) => {
                          const outcome = outcomes.get(file.id) ?? csvFileOutcome(file);
                          return (
                            <tr
                              key={file.id}
                              className="border-t luxia-type-caption"
                              style={{ borderColor: "var(--luxia-settings-row-divider)", color: "var(--luxia-text-primary)" }}
                            >
                              <td className="px-3 py-2" title={file.fileName}>
                                <span className="inline-flex min-w-0 items-center gap-2">
                                  <CsvFileGlyph size={16} />
                                  <span className="truncate">{file.fileName}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2">{file.tableName.trim() || "imported_table"}</td>
                              <td className="px-3 py-2 tabular-nums">{outcome.importedRows.toLocaleString()}</td>
                              <td className="px-3 py-2 tabular-nums">{outcome.skippedRows.toLocaleString()}</td>
                              <td className="px-3 py-2 tabular-nums">{outcome.rejectedRows.toLocaleString()}</td>
                              <td className="px-3 py-2 tabular-nums">{outcome.aiFixedRows.toLocaleString()}</td>
                              <td className="px-3 py-2">{outcome.resolutionLabel}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {included.some((file) => file.skipped.length > 0) ? (
                    <div className="space-y-3">
                      <h4 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                        Skipped rows
                      </h4>
                      {included.filter((file) => file.skipped.length > 0).map((file) => (
                        <div key={file.id}>
                          <p className="mb-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                            {file.fileName}
                          </p>
                          <ul className="luxia-type-caption" style={{ color: "var(--luxia-text-primary)" }}>
                            {file.skipped.map((rowNumber) => {
                              const snapshot = (file.issueSnapshot ?? []).filter((issue) => issue.rowNumber === rowNumber);
                              const detail = snapshot.length > 0
                                ? snapshot.map((issue) => `${issue.columnName}: ${issue.value || "empty"}`).join(" · ")
                                : "Skipped";
                              return <li key={rowNumber}>{`Row ${rowNumber.toLocaleString()} · ${detail}`}</li>;
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className={LUXIA_SETTINGS_SECTION_SURFACE_CLASS}>
                    <div className="space-y-3 px-4 py-4">
                      <div>
                        <h4
                          className="luxia-type-body-dense-strong"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          Use this Data Source
                        </h4>
                        <p
                          className="mt-1 luxia-type-caption"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          Select a Project and create a Constellation with this Data Source already connected.
                        </p>
                      </div>
                      {eligibleProjects.length === 0 ? (
                        <p
                          className="luxia-type-caption"
                          style={{ color: "var(--luxia-text-secondary)" }}
                          role="status"
                        >
                          You don’t have permission to create a Constellation in any Project.
                        </p>
                      ) : (
                        <div className="max-w-xl space-y-2">
                          <Label htmlFor="csv-handoff-project">Project</Label>
                          <Select
                            value={validHandoffProjectId ?? undefined}
                            onValueChange={(value) => setHandoffProjectId(value)}
                          >
                            <SelectTrigger id="csv-handoff-project" size="sm">
                              <SelectValue placeholder="Select a Project" />
                            </SelectTrigger>
                            <SelectContent>
                              {eligibleProjects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter
              className="luxia-csv-wizard-footer shrink-0 justify-between border-t px-6 py-4"
              style={{
                borderColor: "var(--luxia-border-subtle)",
                background: "var(--luxia-settings-panel-bg)",
              }}
            >
              {step === CSV_STEP.summary ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    onClick={() => onFinish()}
                  >
                    Done
                  </Button>
                  <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="compact"
                      onClick={() => onFinish({ openSettings: true })}
                    >
                      Open Data Source Settings
                    </Button>
                    {eligibleProjects.length > 0 && onCreateConstellation ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="compact"
                        disabled={!validHandoffProjectId}
                        onClick={() => {
                          if (!validHandoffProjectId) return;
                          onCreateConstellation(validHandoffProjectId);
                        }}
                      >
                        Create Constellation
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    disabled={creating || created}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
                    {nextReason ? (
                      <p
                        id="csv-advance-reason"
                        className={step === CSV_STEP.columns ? "sr-only" : "luxia-type-caption"}
                        style={step === CSV_STEP.columns ? undefined : { color: "var(--luxia-text-secondary)" }}
                      >
                        {nextReason}
                      </p>
                    ) : null}
                    {step1NextReason ? (
                      <p id="csv-step1-next-reason" className="sr-only">
                        {step1NextReason}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant="primary"
                      size="compact"
                      disabled={step !== CSV_STEP.upload && !canAdvance() && !step2ParseDirty && !step2BlockedWithReason}
                      aria-disabled={
                        (step === CSV_STEP.upload && !canAdvance()) || step2ParseDirty || step2BlockedWithReason
                          ? true
                          : undefined
                      }
                      aria-describedby={
                        step1ParseDirty && editingFileId
                          ? `csv-parse-dirty-${editingFileId}`
                          : step2ParseDirty && editingFileId
                            ? `csv-schema-parse-dirty-${editingFileId}`
                            : step1NextReason
                              ? "csv-step1-next-reason"
                              : nextReason
                                ? "csv-advance-reason"
                                : undefined
                      }
                      onClick={handlePrimary}
                    >
                      {primaryLabel()}
                    </Button>
                  </div>
                </>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>

      <CsvFilePreviewDialog
        file={previewFile && csvFileCanPreview(previewFile) ? previewFile : null}
        open={Boolean(previewFile && csvFileCanPreview(previewFile))}
        onOpenChange={(next) => {
          if (!next) closeFilePreview();
        }}
        onFixParsing={fixParsingFromPreview}
      />

      <AlertDialog
        open={sampleValuesLeaveStep !== null}
        onOpenChange={(open) => {
          if (!open) setSampleValuesLeaveStep(null);
        }}
      >
        <AlertDialogContent overlayClassName="z-[70]" className="z-[70] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved value context</AlertDialogTitle>
            <AlertDialogDescription>
              {`${unsavedValueContextLeaveCopy(unsavedSampleValueColumns, unsavedSampleValueFiles)} You can save them before continuing, or continue without saving them.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={buttonVariants({ variant: "tertiary", size: "compact" })}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              onClick={() => {
                const next = sampleValuesLeaveStep;
                if (!next) return;
                discardAllValueContextDrafts();
                goToStep(next, { skipValueContextPrompt: true });
              }}
            >
              Continue without saving
            </Button>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary", size: "compact" })}
              onClick={() => {
                const next = sampleValuesLeaveStep;
                if (!next) return;
                commitAllValueContextDrafts();
                goToStep(next, { skipValueContextPrompt: true });
              }}
            >
              Save all and continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingRemoveFileId !== null}
        onOpenChange={(open) => {
          if (!open) dismissRemoveDialog();
        }}
      >
        <AlertDialogContent
          overlayClassName="z-[70]"
          className="z-[70] sm:max-w-lg"
          onOpenAutoFocus={(event) => {
            if (step !== CSV_STEP.upload) return;
            event.preventDefault();
            const focusCancel = () => document.getElementById("csv-step1-remove-cancel")?.focus();
            focusCancel();
            requestAnimationFrame(() => {
              focusCancel();
              requestAnimationFrame(focusCancel);
            });
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {step === CSV_STEP.upload ? "Remove this file?" : "Remove this file from the import?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {step === CSV_STEP.upload ? (
                pendingRemoveFile ? (
                  <>
                    <span className="sr-only">
                      {`"${pendingRemoveFile.fileName}" and its import changes will be removed.`}
                    </span>
                    <span aria-hidden="true" className="flex min-w-0 items-baseline">
                      <span className="max-w-[14rem] truncate">
                        {`"${pendingRemoveFile.fileName}"`}
                      </span>
                      <span className="shrink-0">&nbsp;and its import changes will be removed.</span>
                    </span>
                  </>
                ) : (
                  "This file and its import changes will be removed."
                )
              ) : pendingRemoveHasUnsavedValues
                ? "This will remove the file and any changes made during this import. Unsaved Sample Values drafts will be discarded."
                : "This will remove the file and any changes made during this import."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel id={step === CSV_STEP.upload ? "csv-step1-remove-cancel" : undefined}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              size="compact"
              onClick={confirmRemoveFile}
            >
              Remove file
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function UploadSourceSummary({
  name,
  onNameChange,
  ownershipLabel,
  tagDraft,
}: {
  name: string;
  onNameChange: (value: string) => void;
  ownershipLabel: string;
  tagDraft: DraftDataSourceTagsApi;
}) {
  const blank = !name.trim();
  return (
    <section className="luxia-csv-step1-summary" aria-label="Data Source details">
      <div className="luxia-csv-step1-name-field">
        <div className="luxia-csv-step1-summary-identity">
          <Label htmlFor="csv-source-name" className="luxia-type-label-form">Data Source name</Label>
          <p className="luxia-csv-step1-summary-ownership">{ownershipLabel}</p>
        </div>
        <Input
          id="csv-source-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          autoComplete="off"
          aria-invalid={blank}
          aria-describedby={blank ? "csv-source-name-error" : undefined}
        />
        {blank ? (
          <p id="csv-source-name-error" className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }}>
            Enter a Data Source name.
          </p>
        ) : null}
      </div>
      <DraftDataSourceTagsField
        draft={tagDraft}
        labeledAdd
        quiet
        title="Data Source tags"
        titleClassName="luxia-csv-step1-summary-tags-label luxia-type-label-form"
        listClassName="luxia-csv-step1-tag-list"
        chipClassName="max-w-full"
        addTriggerClassName="luxia-csv-step1-add-tag"
      />
    </section>
  );
}

function textFallbackColumnNames(file: CsvImportFileDraft): string[] {
  return file.columns
    .filter((column) => selectedColumnType(column) === "Text" && column.detectedType !== "Text")
    .map((column) => column.name);
}

type ReviewFileAction = "schema" | "validation" | "tables";

type ReviewFileBlocker = {
  text: string;
  action: ReviewFileAction;
};

type ReviewOutcomeLine = {
  text: string;
  tone?: "skipped" | "rejected";
  ai?: boolean;
};

type ReviewFileOutcome = {
  fileName: string;
  importedRows: number;
  totalRows: number;
  /** Secondary outcome lines, in reading order. Only what applies to the final resolution. */
  lines: ReviewOutcomeLine[];
  blockers: ReviewFileBlocker[];
  accessibleName: string;
};

function describeReviewFile(
  file: CsvImportFileDraft,
  duplicateNames: Set<string>,
): ReviewFileOutcome {
  const counted = csvFileOutcome(file);
  const tableName = file.tableName.trim();
  const blank = tableName.length === 0;
  const duplicate = !blank && duplicateNames.has(tableNameConflictKey(file.tableName));
  const wholeFileText = file.importAsText;
  const blockers: ReviewFileBlocker[] = [];
  if (!counted.fresh) {
    blockers.push({ text: "Check this file again before importing", action: "validation" });
  } else {
    if (counted.strategyOpen && file.validationStrategy === "ai") {
      blockers.push({ text: "AI fixes are not finished", action: "validation" });
    } else if (counted.strategyOpen && file.validationStrategy === "reupload") {
      blockers.push({ text: "Replace this file or choose another resolution", action: "validation" });
    }
    if (counted.rejectedRows > 0) {
      blockers.push({ text: `${reviewRowCount(counted.rejectedRows)} rejected`, action: "validation" });
    }
  }
  if (blank) blockers.push({ text: "Table name is required", action: "tables" });
  else if (duplicate) blockers.push({ text: "Table name must be unique", action: "tables" });

  // Import as text supersedes earlier value fixes, so only fix-based resolutions report them.
  const lines: ReviewOutcomeLine[] = [];
  if (wholeFileText) {
    lines.push({ text: "All columns imported as Text" });
  } else {
    if (counted.aiFixedRows > 0) {
      lines.push({ text: `${reviewValueCount(counted.aiFixedRows)} fixed by AI`, ai: true });
    }
    if (counted.manuallyFixedRows > 0) {
      lines.push({ text: `${reviewValueCount(counted.manuallyFixedRows)} fixed manually` });
    }
    const textColumns = textFallbackColumnNames(file);
    if (textColumns.length > 0) lines.push({ text: `${textColumns.join(", ")} imported as Text` });
  }
  if (counted.skippedRows > 0) {
    lines.push({ text: `${reviewRowCount(counted.skippedRows)} skipped`, tone: "skipped" });
  }
  for (const blocker of blockers) {
    if (blocker.action === "validation") lines.push({ text: blocker.text, tone: "rejected" });
  }
  if (lines.length === 0) lines.push({ text: "Ready to import" });

  const accessibleName = [
    `${file.fileName}, table ${tableName || "unnamed"}, ${reviewImportLabel(counted.importedRows, counted.totalRows)}.`,
    ...lines.map((line) => `${line.text}.`),
    ...blockers.filter((blocker) => blocker.action === "tables").map((blocker) => `${blocker.text}.`),
  ].join(" ");
  return {
    fileName: file.fileName,
    importedRows: counted.importedRows,
    totalRows: counted.totalRows,
    lines,
    blockers,
    accessibleName,
  };
}

function columnContextExamples(file: CsvImportFileDraft, column: CsvColumnDraft): string {
  const saved = file.valueContext?.[column.id]?.values ?? [];
  const values = [...column.examples, ...saved].map((value) => value.trim()).filter(Boolean);
  const unique = [...new Set(values)].slice(0, 4);
  return unique.length > 0 ? unique.join(", ") : "—";
}

function reviewImportLabel(importedRows: number, totalRows: number): string {
  const imported = importedRows.toLocaleString();
  const total = totalRows.toLocaleString();
  if (totalRows === 1) return `${imported} of ${total} row will be imported`;
  return `${imported} of ${total} rows will be imported`;
}

function reviewRowCount(count: number): string {
  return `${count.toLocaleString()} row${count === 1 ? "" : "s"}`;
}

function reviewValueCount(count: number): string {
  return `${count.toLocaleString()} value${count === 1 ? "" : "s"}`;
}

function ReviewSourceSummary({
  name,
  ownershipLabel,
  tags,
  fileCount,
  importedRows,
  skippedRows,
}: {
  name: string;
  ownershipLabel: string;
  tags: DocumentTagDefinition[];
  fileCount: number;
  importedRows: number;
  skippedRows: number;
}) {
  const facts = [
    `${fileCount.toLocaleString()} file${fileCount === 1 ? "" : "s"}`,
    `${importedRows.toLocaleString()} row${importedRows === 1 ? "" : "s"} will be imported`,
  ];
  if (skippedRows > 0) {
    facts.push(`${skippedRows.toLocaleString()} row${skippedRows === 1 ? "" : "s"} will be skipped`);
  }
  return (
    <section className={`${LUXIA_SETTINGS_SECTION_SURFACE_CLASS} luxia-csv-review-source`} aria-label={name}>
      <div className="luxia-csv-review-source-identity">
        <p className="luxia-csv-review-source-name" title={name}>{name}</p>
        <p className="luxia-csv-review-source-ownership">{ownershipLabel}</p>
      </div>
      {tags.length > 0 ? <DocumentTagSummary tags={tags} /> : null}
      <p className="luxia-csv-review-source-facts">{facts.join(" · ")}</p>
    </section>
  );
}

function ReviewFileCard({
  outcome,
  tableName,
  nameInputId,
  nameConflict,
  onTableNameChange,
  onEditSchema,
  onReviewValidation,
}: {
  outcome: ReviewFileOutcome;
  tableName: string;
  nameInputId: string;
  nameConflict: boolean;
  onTableNameChange: (value: string) => void;
  onEditSchema: () => void;
  onReviewValidation: () => void;
}) {
  const blank = !tableName.trim();
  const nameError = nameConflict ? "Table names must be unique." : blank ? "Enter a table name." : null;
  const showValidation = outcome.blockers.some((blocker) => blocker.action === "validation");
  const total = outcome.totalRows;
  return (
    <li className="min-w-0">
      <article className="luxia-csv-import-card" aria-label={outcome.accessibleName}>
        <h4 className="luxia-csv-review-file-name" title={outcome.fileName}>
          <CsvFileGlyph size={18} />
          <span className="min-w-0 truncate">{outcome.fileName}</span>
        </h4>
        <div className="luxia-csv-import-card-grid">
          <div className="luxia-csv-import-card-field">
            <Label htmlFor={nameInputId}>Table name</Label>
            <Input
              id={nameInputId}
              value={tableName}
              onChange={(event) => onTableNameChange(event.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? `${nameInputId}-error` : undefined}
            />
            {nameError ? (
              <p id={`${nameInputId}-error`} className="luxia-csv-import-card-error">{nameError}</p>
            ) : null}
          </div>
          <div className="luxia-csv-import-card-outcome">
            <p className="luxia-csv-import-card-label">Import outcome</p>
            <p className="luxia-csv-import-card-primary">
              {`${outcome.importedRows.toLocaleString()} of ${total.toLocaleString()} ${total === 1 ? "row" : "rows"}`}
            </p>
            {outcome.lines.map((line) => (
              <p key={line.text} className="luxia-csv-import-card-line" data-tone={line.tone}>
                {line.text}
                {line.ai ? <CsvAiOriginBadge /> : null}
              </p>
            ))}
          </div>
          <div className="luxia-csv-import-card-actions">
            {showValidation ? (
              <Button
                type="button"
                variant="tertiary"
                size="compact"
                aria-label={`Review validation for ${outcome.fileName}`}
                onClick={onReviewValidation}
              >
                Review validation
              </Button>
            ) : null}
            <Button
              type="button"
              variant="tertiary"
              size="compact"
              aria-label={`Edit schema for ${outcome.fileName}`}
              onClick={onEditSchema}
            >
              Edit schema
            </Button>
          </div>
        </div>
      </article>
    </li>
  );
}

function StepIntro({ title, body }: { title: string; body?: string }) {
  return (
    <div>
      <h3 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
        {title}
      </h3>
      {body ? (
        <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          {body}
        </p>
      ) : null}
    </div>
  );
}

function ReviewCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
        {label}
      </dt>
      <dd className="mt-1 truncate luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }} title={value}>
        {value}
      </dd>
    </div>
  );
}

function FileSwitcherRemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      className="luxia-csv-file-switcher-remove"
      title="Remove file"
      aria-label="Remove file"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onRemove();
      }}
    >
      <X className="size-3" strokeWidth={2} aria-hidden />
    </button>
  );
}

function FileSwitcherTabName({ label }: { label: string }) {
  const match = label.match(/^(.*)(\.[A-Za-z0-9]{1,8})$/);
  if (!match?.[1] || !match[2]) {
    return <span className="luxia-csv-file-switcher-tab-name luxia-type-body-dense">{label}</span>;
  }
  return (
    <span className="luxia-csv-file-switcher-tab-name luxia-type-body-dense">
      <span className="luxia-csv-file-switcher-tab-name-base">{match[1]}</span>
      <span className="luxia-csv-file-switcher-tab-name-ext">{match[2]}</span>
    </span>
  );
}

function FileSwitcher({
  files,
  activeId,
  validations,
  mode,
  onSelect,
  onRequestRemove,
  allowAddFile = false,
  onAddFile,
  adding = false,
  notice = null,
}: {
  files: CsvImportFileDraft[];
  activeId: string;
  validations: Map<string, CsvValidationSummary>;
  mode: "schema" | "validation" | "sample-values" | "tables";
  onSelect: (id: string) => void;
  onRequestRemove: (id: string) => void;
  allowAddFile?: boolean;
  onAddFile?: () => void;
  adding?: boolean;
  notice?: string | null;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const structuredTabs = mode === "schema" || mode === "validation";

  useEffect(() => {
    const parent = listRef.current;
    if (!parent || files.length === 0) return;
    const selected = parent.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!selected) return;
    const parentRect = parent.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();
    if (selectedRect.left < parentRect.left - 1) {
      parent.scrollLeft -= parentRect.left - selectedRect.left;
    } else if (selectedRect.right > parentRect.right + 1) {
      parent.scrollLeft += selectedRect.right - parentRect.right;
    }
  }, [activeId, files.length]);

  useEffect(() => {
    const node = listRef.current;
    if (!node || !structuredTabs) return;
    const onWheel = (event: WheelEvent) => {
      if (node.scrollWidth <= node.clientWidth + 1) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      const max = node.scrollWidth - node.clientWidth;
      const next = Math.min(max, Math.max(0, node.scrollLeft + delta));
      if (next === node.scrollLeft) return;
      event.preventDefault();
      node.scrollLeft = next;
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [structuredTabs, files.length]);

  if (files.length === 0) return null;
  const tableDuplicates = mode === "tables" ? duplicateTableNameKeys(files) : null;

  function fileLabel(file: CsvImportFileDraft): string {
    if (mode === "sample-values" || mode === "tables") return file.tableName.trim() || file.fileName;
    return file.fileName;
  }

  function statusFor(file: CsvImportFileDraft): { kind: StatusToneKind; label: string } {
    if (mode === "tables") {
      if (!file.tableName.trim()) return { kind: "needs-review", label: "Needs name" };
      if (tableDuplicates?.has(tableNameConflictKey(file.tableName))) {
        return { kind: "needs-review", label: "Duplicate name" };
      }
      return { kind: "ready", label: "Ready" };
    }
    if (mode === "sample-values") {
      return {
        kind: "not-run",
        label: valueContextTabLabel(file),
      };
    }
    if (mode === "schema") {
      if (!file.included) return { kind: "excluded", label: "Excluded" };
      const schemaStatus = csvFileSchemaUiStatus(file);
      if (schemaStatus === "error" || schemaStatus === "parsing-needs-review") {
        return { kind: "needs-review", label: "Parsing issue" };
      }
      if (schemaStatus === "needs-review") return { kind: "needs-review", label: "Needs confirmation" };
      return { kind: "ready", label: "Ready" };
    }
    const validationStatus = validationFileStatus(
      file,
      validations.get(file.id) ?? EMPTY_VALIDATION,
    );
    return {
      kind: validationStatus,
      label: validationStatusLabel(file, validationStatus, validations.get(file.id)),
    };
  }

  function focusFileAt(index: number) {
    const next = files[index];
    if (!next) return;
    onSelect(next.id);
    const options = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
    options?.[index]?.focus();
  }

  const addFileButton = allowAddFile && onAddFile ? (
    <button
      type="button"
      className="luxia-csv-file-switcher-add"
      aria-label="Add CSV file"
      disabled={adding}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onAddFile();
      }}
    >
      <Plus size={14} strokeWidth={1.75} aria-hidden />
      Add file
    </button>
  ) : null;

  const fileOptions = files.map((file, index) => {
    const selected = file.id === activeId;
    const status = statusFor(file);
    const tone = statusTone(status.kind);
    const label = fileLabel(file);
    const fileNumber = index + 1;
    const fileIndexLabel = String(fileNumber).padStart(2, "0");
    return (
      <div
        key={file.id}
        role="option"
        aria-selected={selected}
        aria-label={structuredTabs ? `File ${fileIndexLabel}, ${label}, ${status.label}` : `${label}, ${status.label}`}
        tabIndex={0}
        title={`${label} · ${status.label}`}
        onClick={() => onSelect(file.id)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(file.id);
            return;
          }
          if (!structuredTabs) return;
          if (event.key === "ArrowRight") {
            event.preventDefault();
            focusFileAt(Math.min(files.length - 1, index + 1));
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            focusFileAt(Math.max(0, index - 1));
          } else if (event.key === "Home") {
            event.preventDefault();
            focusFileAt(0);
          } else if (event.key === "End") {
            event.preventDefault();
            focusFileAt(files.length - 1);
          }
        }}
        className="luxia-csv-file-switcher-tab"
      >
        {structuredTabs ? (
          <span className="luxia-csv-file-switcher-tab-line">
            <span className="luxia-csv-file-switcher-tab-index" aria-hidden>
              {fileIndexLabel}
            </span>
            {structuredTabs ? <CsvFileGlyph size={16} /> : null}
            <FileSwitcherTabName label={label} />
          </span>
        ) : (
          <FileSpreadsheet
            className="luxia-csv-file-switcher-tab-icon"
            size={14}
            strokeWidth={1.75}
            aria-hidden
          />
        )}
        {structuredTabs ? (
          <span
            className="luxia-csv-file-switcher-tab-status"
            data-status={status.kind}
            style={mode === "validation" ? { color: tone.color } : undefined}
          >
            <span className="shrink-0 rounded-full" style={{ background: tone.dot }} aria-hidden />
            <span>{status.label}</span>
          </span>
        ) : (
          <span className="luxia-csv-file-switcher-tab-body">
            <FileSwitcherTabName label={label} />
            <span className="luxia-csv-file-switcher-tab-status" data-status={status.kind} style={{ color: tone.color }}>
              <span className="shrink-0 rounded-full" style={{ background: tone.dot }} aria-hidden />
              <span>{status.label}</span>
            </span>
          </span>
        )}
        <FileSwitcherRemoveButton onRemove={() => onRequestRemove(file.id)} />
      </div>
    );
  });

  return (
    <div className="luxia-csv-file-switcher-frame">
      <p className="luxia-csv-file-switcher-meta">
        Imported files · {files.length.toLocaleString()}
      </p>
      {structuredTabs ? (
        <div className={`luxia-csv-file-switcher luxia-csv-file-switcher--schema luxia-settings-tablist luxia-csv-file-switcher--columns${mode === "validation" ? " luxia-csv-file-switcher--validation" : ""}`}>
          <div
            ref={listRef}
            role="listbox"
            aria-label="Imported files"
            aria-orientation="horizontal"
            className="luxia-csv-file-switcher-scroller luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-horizontal"
          >
            {fileOptions}
          </div>
          {addFileButton}
        </div>
      ) : (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Imported files"
          aria-orientation="horizontal"
          className="luxia-csv-file-switcher luxia-settings-tablist luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-horizontal"
        >
          {fileOptions}
          {addFileButton}
        </div>
      )}
      {adding ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }} role="status">
          Reading files…
        </p>
      ) : notice ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }} role="alert">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

function CsvFilePreviewDialog({
  file,
  open,
  onOpenChange,
  onFixParsing,
}: {
  file: CsvImportFileDraft | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFixParsing: () => void;
}) {
  const parsed = file?.parsed ?? null;
  const canShow = Boolean(open && file && parsed);

  return (
    <Dialog open={canShow} onOpenChange={onOpenChange}>
      {file && parsed ? (
        <CsvFilePreviewBody
          file={file}
          parsed={parsed}
          onClose={() => onOpenChange(false)}
          onFixParsing={onFixParsing}
        />
      ) : null}
    </Dialog>
  );
}

function CsvFilePreviewBody({
  file,
  parsed,
  onClose,
  onFixParsing,
}: {
  file: CsvImportFileDraft;
  parsed: NonNullable<CsvImportFileDraft["parsed"]>;
  onClose: () => void;
  onFixParsing: () => void;
}) {
  const headers = parsed.headers;
  const rows = parsed.records.slice(0, PREVIEW_ROW_LIMIT);
  const showWarning = csvPreviewShowsParseWarning(file);
  const rowCount = parsed.records.length;
  const columnCount = headers.length;
  const parseContext = `${rowCount.toLocaleString()} row${rowCount === 1 ? "" : "s"} · ${columnCount.toLocaleString()} column${columnCount === 1 ? "" : "s"}`;
  const parseMeta = `${CSV_DELIMITER_LABELS[file.delimiter]} · ${CSV_ENCODING_LABELS[file.encoding]} · Header: ${csvHeaderSummaryLabel(csvHeaderConfigFor(file))}`;

  return (
    <DialogContent
      overlayClassName="z-[60]"
      className="z-[60] flex max-h-[min(82vh,640px)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      aria-describedby="csv-preview-context"
    >
      <DialogHeader className="shrink-0 space-y-1 pr-14 text-left">
        <DialogTitle className="text-left" style={{ color: "var(--luxia-text-inverse)" }}>
          Preview CSV
        </DialogTitle>
        <DialogDescription className="mt-1 truncate text-left" style={{ color: "var(--luxia-purple-10)" }} title={file.fileName}>
          {file.fileName}
        </DialogDescription>
      </DialogHeader>
      <div className="luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <p id="csv-preview-context" className="luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
          {parseContext}
        </p>
        <p className="mt-0.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          {parseMeta}
        </p>
        {showWarning ? (
          <div className="mt-3 space-y-1" role="status">
            <p className="luxia-type-body-dense" style={{ color: "var(--luxia-warning-90)" }}>
              This file may not be parsed correctly.
            </p>
          </div>
        ) : null}
        <div
          className="luxia-settings-table-surface luxia-scrollbar luxia-scrollbar-light mt-3 overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label={`Preview of ${file.fileName}`}
        >
          <table className="w-full min-w-max border-collapse text-left">
            <thead>
              <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                <th scope="col" className="sticky left-0 z-[1] whitespace-nowrap bg-[var(--luxia-settings-section-bg)] px-3 py-2 font-normal">
                  Row
                </th>
                {headers.map((header, index) => (
                  <th
                    key={`${file.id}-preview-h-${index}`}
                    scope="col"
                    className="min-w-[8rem] whitespace-nowrap px-3 py-2 font-normal"
                    title={header || undefined}
                  >
                    {header.trim() === "" ? `Column ${index + 1}` : header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length + 1}
                    className="px-3 py-3 luxia-type-caption"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    No data rows in this file.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={`${file.id}-preview-r-${row.rowNumber}`}
                    className="border-t luxia-type-body-dense"
                    style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                  >
                    <td className="sticky left-0 z-[1] whitespace-nowrap bg-[var(--luxia-settings-panel-bg)] px-3 py-2 tabular-nums" style={{ color: "var(--luxia-text-secondary)" }}>
                      {row.rowNumber}
                    </td>
                    {headers.map((_, index) => {
                      const cell = row.fields[index] ?? "";
                      return (
                        <td
                          key={`${file.id}-preview-r-${row.rowNumber}-c-${index}`}
                          className="max-w-[16rem] truncate whitespace-nowrap px-3 py-2"
                          style={{ color: "var(--luxia-text-secondary)" }}
                          title={cell || undefined}
                          aria-label={cell === "" ? "Empty" : cell}
                        >
                          {cell === "" ? "—" : truncateCsvCell(cell, 80)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DialogFooter
        className="shrink-0 justify-end border-t px-6 py-4"
        style={{
          borderColor: "var(--luxia-border-subtle)",
          background: "var(--luxia-settings-panel-bg)",
        }}
      >
        <Button
          type="button"
          variant="outline"
          size="compact"
          onClick={onClose}
        >
          Close
        </Button>
        {showWarning ? (
          <Button
            type="button"
            variant="secondary"
            size="compact"
            onClick={onFixParsing}
          >
            <SlidersHorizontal size={14} strokeWidth={1.75} aria-hidden />
            Fix parsing
          </Button>
        ) : null}
      </DialogFooter>
    </DialogContent>
  );
}

function bindCsvDrop(
  onDragEnter: () => void,
  onDragLeave: () => void,
  onDrop: (event: DragEvent<HTMLElement>) => void,
) {
  return {
    onDragEnter: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      onDragEnter();
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      onDragEnter();
    },
    onDragLeave: onDragLeave,
    onDrop,
  };
}

function CsvDropzone({
  compact,
  dragActive,
  disabled,
  onBrowse,
  onDrop,
  onDragEnter,
  onDragLeave,
}: {
  compact: boolean;
  dragActive: boolean;
  disabled: boolean;
  onBrowse: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
}) {
  const drop = disabled ? {} : bindCsvDrop(onDragEnter, onDragLeave, onDrop);
  // With files added the drop target stays full size (as in Luxia), only slightly shorter.
  return (
    <button
      id={compact ? "csv-add-more-files" : "csv-empty-dropzone"}
      type="button"
      aria-label={compact
        ? "Add more CSV files. Drop files here or browse from your device."
        : "Drop CSV files here or browse. Browse files from your device."}
      disabled={disabled}
      aria-busy={disabled || undefined}
      onClick={onBrowse}
      {...drop}
      className={`luxia-csv-dropzone w-full px-4 ${compact ? "py-6" : "py-8"} focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] ${
        dragActive ? "is-active" : ""
      }`}
    >
      <FileSpreadsheet
        className="luxia-csv-dropzone-icon mx-auto mb-2"
        size={28}
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
        Drop CSV files here
      </p>
      <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
        Or browse from your device.
      </p>
      <span className="luxia-button luxia-button--secondary luxia-button--compact pointer-events-none mt-3" aria-hidden>
        Browse files
      </span>
    </button>
  );
}

function UploadStep({
  files,
  dragActive,
  reading,
  applyingParse,
  acceptNotice,
  editingFileId,
  parseDraft,
  onBrowse,
  onDrop,
  onDragEnter,
  onDragLeave,
  onPreview,
  onStartParseEdit,
  onReparseFile,
  onCancelParseEdit,
  onRemove,
  onToggleIncluded,
  onEncoding,
  onDelimiter,
  onHeaderChoice,
  onCustomHeaderRow,
  warnParseReset,
}: {
  files: CsvImportFileDraft[];
  dragActive: boolean;
  reading: boolean;
  applyingParse: boolean;
  acceptNotice: string | null;
  editingFileId: string | null;
  parseDraft: CsvParseDraft | null;
  onBrowse: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onPreview: (id: string) => void;
  onStartParseEdit: (id: string) => void;
  onReparseFile: () => void;
  onCancelParseEdit: () => void;
  onRemove: (id: string) => void;
  onToggleIncluded: (id: string) => void;
  onEncoding: (encoding: CsvEncodingId) => void;
  onDelimiter: (delimiter: CsvDelimiterId) => void;
  onHeaderChoice: (choice: CsvHeaderChoice) => void;
  onCustomHeaderRow: (value: string) => void;
  warnParseReset?: boolean;
}) {
  const [collapseHintId, setCollapseHintId] = useState<string | null>(null);
  const removingFromMenuRef = useRef(false);

  function revealDirtyParseHint(fileId: string) {
    setCollapseHintId(fileId);
    requestAnimationFrame(() => {
      document.getElementById(`csv-parse-dirty-${fileId}`)?.scrollIntoView({ block: "nearest" });
    });
  }

  function toggleParseEdit(fileId: string) {
    if (applyingParse) return;
    const openFile = editingFileId ? files.find((item) => item.id === editingFileId) : undefined;
    const openDirty = Boolean(editingFileId && parseDraftIsDirty(parseDraft, openFile));
    if (editingFileId === fileId) {
      if (openDirty) {
        revealDirtyParseHint(fileId);
        return;
      }
      setCollapseHintId(null);
      onCancelParseEdit();
      return;
    }
    if (openDirty && editingFileId) {
      revealDirtyParseHint(editingFileId);
      return;
    }
    setCollapseHintId(null);
    onStartParseEdit(fileId);
  }

  const dropzone = (
    <CsvDropzone
      compact={files.length > 0}
      dragActive={dragActive}
      disabled={reading || applyingParse}
      onBrowse={onBrowse}
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
    />
  );

  return (
    <div className="space-y-4" aria-busy={reading || undefined}>
      <div>
        <h3 className="luxia-type-title-section" style={{ color: "var(--luxia-text-primary)" }}>
          Upload files
        </h3>
        <p className="mt-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          Each CSV will be imported as a separate table.
        </p>
        {uploadCollectionSummary(files) ? (
          <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            {uploadCollectionSummary(files)}
          </p>
        ) : null}
      </div>
      {files.length === 0 ? dropzone : null}
      {files.length === 0 && !reading ? (
        <div id="csv-step1-guidance" role="status">
          <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            No files added yet.
          </p>
          <p className="mt-0.5 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            Add at least one CSV file to continue.
          </p>
        </div>
      ) : null}
      {files.length > 0 ? dropzone : null}
      {files.length > 0 ? (
        <ul className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} luxia-csv-upload-files divide-y`}>
            {files.map((file) => {
              const status = csvFileUiStatus(file);
              const notices = csvFileNotices(file);
              const editing = editingFileId === file.id;
              const parsingProblem =
                csvFileNeedsParsingReview(file)
                || status === "error"
                || file.decodeIssues.some((issue) => issue.severity === "warning");
              const statusPrefix =
                status === "needs-review" || status === "parsing-needs-review"
                  ? "Warning: "
                  : "Status: ";
              const applyDisabled = Boolean(
                parseDraft?.fileId === file.id && customHeaderErrorFor(parseDraft, file),
              );
              const fileNameId = `csv-file-name-${file.id}`;
              const fileMeta = uploadFileMeta(file);
              const fileStatusId = `csv-file-status-${file.id}`;
              const fileIssueId = `csv-file-issue-${file.id}`;
              const draftDirty = editing && parseDraftIsDirty(parseDraft, file);
              const applyingThisFile = applyingParse && parseDraft?.fileId === file.id;
              return (
                <li
                  key={file.id}
                  aria-labelledby={fileNameId}
                  aria-describedby={parsingProblem ? `${fileStatusId} ${fileIssueId}` : fileStatusId}
                  className={`luxia-csv-upload-file px-4 py-2 ${
                    editing
                      ? "bg-[var(--luxia-neutral-white)] ring-1 ring-inset ring-[var(--luxia-border-subtle)]"
                      : file.included
                        ? ""
                        : "bg-[var(--luxia-settings-section-bg)]"
                  }`}
                >
                  <div className="luxia-csv-upload-file-header">
                    <div className="luxia-csv-upload-file-name flex min-w-0 items-center gap-2">
                    <CsvFileGlyph />
                    <p
                      id={fileNameId}
                      className="min-w-0 truncate luxia-type-body-dense-strong"
                      style={{ color: file.included ? "var(--luxia-text-primary)" : "var(--luxia-text-secondary)" }}
                      title={file.fileName}
                    >
                      {file.fileName}
                    </p>
                    </div>
                    <p className="luxia-csv-upload-file-meta luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                      {fileMeta ? (
                        <>
                          <span className="sr-only">{fileMeta.spoken}</span>
                          <span aria-hidden="true">{fileMeta.visual}</span>
                        </>
                      ) : (
                        "Could not read this file"
                      )}
                    </p>
                    <span id={fileStatusId} className="luxia-csv-upload-file-status">
                      <span className="sr-only">{statusPrefix}</span>
                      <StatusDotLabel kind={status} label={uploadFileStatusLabel(status)} />
                    </span>
                  </div>
                  {parsingProblem ? (
                    <div id={fileIssueId} className="mt-2 space-y-1" role="status">
                      {notices.length > 0 ? (
                        notices.map((issue) => (
                          <p
                            key={`${file.id}-summary-${issue.severity}-${issue.message}`}
                            className="luxia-type-caption"
                            style={{
                              color:
                                issue.severity === "error"
                                  ? "var(--luxia-error-70)"
                                  : issue.severity === "warning"
                                    ? "var(--luxia-warning-90)"
                                    : "var(--luxia-text-muted)",
                            }}
                          >
                            <span className="sr-only">
                              {`${issue.severity === "error" ? "Error" : issue.severity === "warning" ? "Warning" : "Note"} for ${file.fileName}: `}
                            </span>
                            {issue.message}
                          </p>
                        ))
                      ) : (
                        <>
                          <p className="luxia-type-body-dense" style={{ color: "var(--luxia-warning-90)" }}>
                            <span className="sr-only">{`Warning for ${file.fileName}: `}</span>
                            We couldn't read the columns correctly.
                          </p>
                          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                            Review the delimiter or encoding for this file.
                          </p>
                        </>
                      )}
                    </div>
                  ) : null}
                  <div className="luxia-csv-upload-file-actions">
                    {csvFileCanPreview(file) ? (
                      <Button
                        id={`csv-file-preview-${file.id}`}
                        type="button"
                        variant="outline"
                        size="compact"
                        disabled={applyingParse}
                        onClick={() => onPreview(file.id)}
                        aria-label={`Preview ${file.fileName}`}
                      >
                        <Eye size={14} strokeWidth={1.75} aria-hidden />
                        Preview
                      </Button>
                    ) : null}
                    <Button
                      id={`csv-file-parse-${file.id}`}
                      type="button"
                      variant="secondary"
                      size="compact"
                      disabled={applyingParse}
                      aria-expanded={editing}
                      aria-controls={editing ? `csv-parse-editor-${file.id}` : undefined}
                      aria-describedby={draftDirty ? `csv-parse-dirty-${file.id}` : undefined}
                      aria-label={`${parsingProblem ? "Fix parsing" : "Parsing settings"} for ${file.fileName}`}
                      style={
                        editing
                          ? {
                              background: "var(--luxia-opacity-brand-secondary-08)",
                              borderColor: "color-mix(in srgb, var(--luxia-brand-primary) 35%, var(--luxia-border-default))",
                            }
                          : undefined
                      }
                      onClick={() => toggleParseEdit(file.id)}
                      onKeyDown={(event) => {
                        if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
                        event.preventDefault();
                        toggleParseEdit(file.id);
                      }}
                    >
                      {parsingProblem ? "Fix parsing" : "Parsing settings"}
                      {editing ? (
                        <ChevronUp size={14} strokeWidth={1.75} aria-hidden />
                      ) : (
                        <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="tertiary"
                      size="compact"
                      className="luxia-csv-upload-exclude"
                      data-state={file.included ? "exclude" : "include"}
                      disabled={applyingParse}
                      aria-label={`${file.included ? "Exclude" : "Include"} ${file.fileName}`}
                      onClick={() => onToggleIncluded(file.id)}
                    >
                      {file.included ? (
                        <MinusCircle size={14} strokeWidth={1.75} aria-hidden />
                      ) : (
                        <PlusCircle size={14} strokeWidth={1.75} aria-hidden />
                      )}
                      {file.included ? "Exclude" : "Include"}
                    </Button>
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              id={`csv-file-more-${file.id}`}
                              type="button"
                              variant="tertiary"
                              size="icon"
                              className="luxia-csv-upload-more"
                              disabled={applyingParse}
                              aria-label={`More actions for ${file.fileName}`}
                            >
                              <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6}>More actions</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent
                        align="end"
                        side="bottom"
                        sideOffset={4}
                        collisionPadding={8}
                        className="z-[80] w-max min-w-0"
                        onCloseAutoFocus={(event) => {
                          if (!removingFromMenuRef.current) return;
                          removingFromMenuRef.current = false;
                          event.preventDefault();
                        }}
                      >
                        <DropdownMenuItem
                          variant="destructive"
                          aria-label={`Remove ${file.fileName}`}
                          onSelect={() => {
                            removingFromMenuRef.current = true;
                            onRemove(file.id);
                          }}
                        >
                          Remove file
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {editing ? (
                    <div
                      id={`csv-parse-editor-${file.id}`}
                      role="region"
                      aria-label={`Parsing settings for ${file.fileName}`}
                      className="mt-3 space-y-2 border-t border-[var(--luxia-border-subtle)] pt-3"
                    >
                      <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                        Parsing settings
                      </p>
                      <ParseSettingsFields
                        file={file}
                        fileId={file.id}
                        compact
                        previewRowLimit={5}
                        encoding={parseDraft?.fileId === file.id ? parseDraft.encoding : file.encoding}
                        delimiter={parseDraft?.fileId === file.id ? parseDraft.delimiter : file.delimiter}
                        detectedDelimiter={file.detectedDelimiter}
                        headerChoice={
                          parseDraft?.fileId === file.id
                            ? parseDraft.headerChoice
                            : headerChoiceFromFile(file)
                        }
                        customHeaderRow={
                          parseDraft?.fileId === file.id
                            ? parseDraft.customHeaderRow
                            : headerChoiceFromFile(file) === "custom" && file.headerRow
                              ? String(file.headerRow)
                              : ""
                        }
                        customHeaderError={
                          parseDraft?.fileId === file.id
                            ? customHeaderErrorFor(parseDraft, file)
                            : null
                        }
                        onEncoding={onEncoding}
                        onDelimiter={onDelimiter}
                        onHeaderChoice={onHeaderChoice}
                        onCustomHeaderRow={onCustomHeaderRow}
                      />
                      {warnParseReset ? (
                        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                          {PARSE_RESET_HINT}
                        </p>
                      ) : null}
                      <div className="sticky bottom-0 z-[2] -mx-4 mt-2 border-t border-[var(--luxia-border-subtle)] bg-[var(--luxia-neutral-white)] px-4 py-3">
                        {draftDirty ? (
                          <p
                            id={`csv-parse-dirty-${file.id}`}
                            className="mb-2 luxia-type-caption"
                            style={{ color: collapseHintId === file.id ? "var(--luxia-warning-90)" : "var(--luxia-text-secondary)" }}
                            role={collapseHintId === file.id ? "status" : undefined}
                          >
                            Apply or cancel parsing changes first.
                          </p>
                        ) : null}
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="compact"
                            disabled={applyingThisFile}
                            aria-label={`Cancel parsing changes for ${file.fileName}`}
                            onClick={onCancelParseEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="compact"
                            disabled={applyDisabled || applyingThisFile}
                            aria-busy={applyingThisFile || undefined}
                            aria-label={`Apply parsing for ${file.fileName}`}
                            aria-describedby={applyDisabled ? `csv-header-row-error-${file.id}` : undefined}
                            onClick={onReparseFile}
                          >
                            {applyingThisFile ? "Applying…" : "Apply parsing"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
      ) : null}
      {reading ? (
        <p id="csv-step1-reading" className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
          Reading files…
        </p>
      ) : null}
      {acceptNotice ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }} role="alert">
          {acceptNotice}
        </p>
      ) : null}
    </div>
  );
}

function ParseSettingsFields({
  file,
  fileId,
  compact = false,
  previewRowLimit = PARSE_HEADER_PREVIEW_LIMIT,
  encoding,
  delimiter,
  detectedDelimiter,
  headerChoice,
  customHeaderRow,
  customHeaderError,
  onEncoding,
  onDelimiter,
  onHeaderChoice,
  onCustomHeaderRow,
}: {
  file: CsvImportFileDraft;
  fileId: string;
  compact?: boolean;
  previewRowLimit?: number;
  encoding: CsvEncodingId;
  delimiter: CsvDelimiterId;
  detectedDelimiter?: CsvDelimiterId;
  headerChoice: CsvHeaderChoice;
  customHeaderRow: string;
  customHeaderError: string | null;
  onEncoding: (encoding: CsvEncodingId) => void;
  onDelimiter: (delimiter: CsvDelimiterId) => void;
  onHeaderChoice: (choice: CsvHeaderChoice) => void;
  onCustomHeaderRow: (value: string) => void;
}) {
  const previewRows = csvPhysicalRows(decodedTextForParseDraft(file, encoding), delimiter);
  const previewHeader = headerConfigFromDraft({
    fileId: file.id,
    encoding,
    delimiter,
    headerMode: headerChoice === "none" ? "none" : "row",
    headerRow: headerChoice === "custom"
      ? (/^[0-9]+$/.test(customHeaderRow.trim()) ? Number(customHeaderRow.trim()) : null)
      : headerChoice === "none"
        ? null
        : Number(headerChoice),
    headerChoice,
    customHeaderRow,
  });
  const showCustom = headerChoice === "custom";
  const fieldClass = compact ? "flex min-w-0 flex-col gap-1.5" : "space-y-2";
  const triggerClass = compact ? "!h-9 !min-h-9 !px-3" : undefined;
  const customField = showCustom ? (
    <div className={compact ? "mt-1.5 flex min-w-0 flex-col gap-1.5" : "space-y-2 sm:max-w-xs"}>
      <Label htmlFor={`csv-header-row-number-${fileId}`}>Header row number</Label>
      <Input
        id={`csv-header-row-number-${fileId}`}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={customHeaderRow}
        aria-invalid={Boolean(customHeaderError)}
        aria-describedby={customHeaderError ? `csv-header-row-error-${fileId}` : undefined}
        onChange={(event) => onCustomHeaderRow(event.target.value)}
        className={compact ? "!h-9 !min-h-9 px-3" : "h-9"}
      />
      {customHeaderError ? (
        <p id={`csv-header-row-error-${fileId}`} className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }} role="alert">
          {customHeaderError}
        </p>
      ) : null}
    </div>
  ) : null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className={compact ? "@container" : undefined}>
        <div
          className={
            compact
              ? "grid grid-cols-1 items-start gap-3 @min-[28rem]:grid-cols-2 @min-[40rem]:grid-cols-3"
              : "grid gap-3 sm:grid-cols-2"
          }
        >
          <div className={fieldClass}>
            <Label htmlFor={`csv-encoding-${fileId}`}>Encoding</Label>
            <Select value={encoding} onValueChange={(value) => onEncoding(value as CsvEncodingId)}>
              <SelectTrigger id={`csv-encoding-${fileId}`} size={compact ? "default" : "sm"} className={triggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!z-[80]">
                {CSV_ENCODING_IDS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {CSV_ENCODING_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={fieldClass}>
            <Label htmlFor={`csv-delimiter-${fileId}`}>Delimiter</Label>
            <Select value={delimiter} onValueChange={(value) => onDelimiter(value as CsvDelimiterId)}>
              <SelectTrigger id={`csv-delimiter-${fileId}`} size={compact ? "default" : "sm"} className={triggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!z-[80]">
                {CSV_DELIMITER_IDS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {CSV_DELIMITER_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {detectedDelimiter && detectedDelimiter !== delimiter ? (
              <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                Detected: {CSV_DELIMITER_LABELS[detectedDelimiter]}
              </p>
            ) : null}
          </div>
          {compact ? (
            <div className={fieldClass}>
              <Label htmlFor={`csv-header-row-${fileId}`}>Header row</Label>
              <Select value={headerChoice} onValueChange={(value) => onHeaderChoice(value as CsvHeaderChoice)}>
                <SelectTrigger id={`csv-header-row-${fileId}`} size="default" className={triggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="!z-[80]">
                  {HEADER_CHOICE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customField}
            </div>
          ) : null}
        </div>
      </div>
      {compact ? null : (
        <>
          <div className="space-y-2">
            <Label htmlFor={`csv-header-row-${fileId}`}>Header row</Label>
            <Select value={headerChoice} onValueChange={(value) => onHeaderChoice(value as CsvHeaderChoice)}>
              <SelectTrigger id={`csv-header-row-${fileId}`} size="sm" className="sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!z-[80]">
                {HEADER_CHOICE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {customField}
        </>
      )}
      {previewRows.length > 0 ? (
        <div className="space-y-1">
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            Parsing preview
          </p>
          <div className="luxia-settings-table-surface luxia-scrollbar luxia-scrollbar-light overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left">
              <thead>
                <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                  <th scope="col" className="whitespace-nowrap px-3 py-1.5 font-normal">Row</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-1.5 font-normal">Role</th>
                  <th scope="col" className="px-3 py-1.5 font-normal">Values</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const headerRow = previewHeader.mode === "row" ? previewHeader.row : null;
                  const start = headerRow && headerRow > previewRowLimit
                    ? Math.max(0, headerRow - 3)
                    : 0;
                  return previewRows.slice(start, start + previewRowLimit).map((row, index) => {
                  const sourceRow = start + index + 1;
                  const role = csvPhysicalRowRole(sourceRow, previewHeader);
                  return (
                    <tr
                      key={`${fileId}-parse-preview-${sourceRow}`}
                      className="luxia-type-caption"
                      style={{
                        background:
                          role === "header"
                            ? "var(--luxia-warning-10)"
                            : role === "ignored"
                              ? "var(--luxia-settings-section-bg)"
                              : undefined,
                        color:
                          role === "ignored"
                            ? "var(--luxia-text-muted)"
                            : "var(--luxia-text-secondary)",
                      }}
                    >
                      <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">{sourceRow}</td>
                      <td
                        className="whitespace-nowrap px-3 py-1.5"
                        style={{
                          color:
                            role === "header"
                              ? "var(--luxia-warning-90)"
                              : role === "ignored"
                                ? "var(--luxia-text-muted)"
                                : "var(--luxia-text-secondary)",
                        }}
                      >
                        {csvPhysicalRowRoleLabel(role)}
                      </td>
                      <td className="max-w-[28rem] truncate px-3 py-1.5" title={row.join(" · ") || undefined}>
                        {row.map((cell) => truncateCsvCell(cell, 24)).filter(Boolean).join(" · ") || "—"}
                      </td>
                    </tr>
                  );
                  });
                })()}
              </tbody>
            </table>
          </div>
          {previewHeader.mode === "row" && previewHeader.row && previewHeader.row > 1 ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
              Rows before the header are ignored.
            </p>
          ) : null}
          {previewHeader.mode === "none" ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
              Column names will be generated. The first row stays as data.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function skippedDisplayIssues(file: CsvImportFileDraft): DisplayCsvIssue[] {
  if (file.skipped.length === 0) return [];
  const fromSnapshot = (file.issueSnapshot ?? [])
    .filter((issue) => file.skipped.includes(issue.rowNumber))
    .map((issue) => ({ ...issue, resolution: "skipped" as const }));
  return [...fromSnapshot, ...excludedRowPlaceholders(file, fromSnapshot)].sort(
    (a, b) => a.rowNumber - b.rowNumber || a.columnName.localeCompare(b.columnName),
  );
}

function SchemaPanel({
  file,
  focusedColumnId,
  editingParse,
  draftEncoding,
  draftDelimiter,
  draftHeaderChoice,
  draftCustomHeaderRow,
  onTypeChange,
  onConfirmType,
  onRenameColumn,
  onSaveFix,
  onSaveFixes,
  onExclude,
  onUndo,
  onStartParseEdit,
  onReparseFile,
  onCancelParseEdit,
  onEncoding,
  onDelimiter,
  onHeaderChoice,
  onCustomHeaderRow,
  draftDirty,
  leaveAttempt,
}: {
  file: CsvImportFileDraft;
  focusedColumnId: string | null;
  editingParse: boolean;
  draftEncoding: CsvEncodingId;
  draftDelimiter: CsvDelimiterId;
  draftHeaderChoice: CsvHeaderChoice;
  draftCustomHeaderRow: string;
  draftDirty: boolean;
  leaveAttempt: number;
  onTypeChange: (columnId: string, type: string) => void;
  onConfirmType: (columnId: string) => void;
  onRenameColumn: (columnId: string, nextName: string) => string | null;
  onSaveFix: (issue: CsvValidationIssue, value: string) => string | null;
  onSaveFixes: (fixes: Array<{ issue: CsvValidationIssue; value: string }>) => string | null;
  onExclude: (rowNumber: number) => void;
  onUndo: (rowNumber: number) => void;
  onStartParseEdit: () => void;
  onReparseFile: () => void;
  onCancelParseEdit: () => void;
  onEncoding: (encoding: CsvEncodingId) => void;
  onDelimiter: (delimiter: CsvDelimiterId) => void;
  onHeaderChoice: (choice: CsvHeaderChoice) => void;
  onCustomHeaderRow: (value: string) => void;
}) {
  const [reparseConfirm, setReparseConfirm] = useState(false);
  const [guardArmed, setGuardArmed] = useState(false);
  const parseTriggerRef = useRef<HTMLButtonElement>(null);
  const wasEditingParseRef = useRef(false);
  const parseEditorId = `csv-schema-parse-editor-${file.id}`;
  const parseDirtyId = `csv-schema-parse-dirty-${file.id}`;
  useEffect(() => {
    if (!editingParse) setReparseConfirm(false);
  }, [editingParse, file.id]);
  useEffect(() => {
    if (!draftDirty) setGuardArmed(false);
  }, [draftDirty]);
  useEffect(() => {
    if (!leaveAttempt || !draftDirty) return;
    setGuardArmed(true);
    requestAnimationFrame(() => {
      document.getElementById(parseDirtyId)?.scrollIntoView({ block: "nearest" });
    });
  }, [leaveAttempt, draftDirty, parseDirtyId]);
  useEffect(() => {
    const wasEditing = wasEditingParseRef.current;
    if (editingParse && !wasEditing) {
      document.getElementById(`csv-encoding-${file.id}-schema`)?.focus();
    } else if (!editingParse && wasEditing) {
      parseTriggerRef.current?.focus();
    }
    wasEditingParseRef.current = editingParse;
  }, [editingParse, file.id]);

  function revealParseGuard() {
    setGuardArmed(true);
    requestAnimationFrame(() => {
      document.getElementById(parseDirtyId)?.scrollIntoView({ block: "nearest" });
    });
  }

  function toggleParseSettings() {
    if (editingParse) {
      if (draftDirty) {
        revealParseGuard();
        return;
      }
      setReparseConfirm(false);
      onCancelParseEdit();
      return;
    }
    onStartParseEdit();
  }
  const parsingNeedsReview = csvFileNeedsParsingReview(file);
  const live = liveValidationForFile(file);
  const customHeaderError = customHeaderErrorFor(
    {
      fileId: file.id,
      encoding: draftEncoding,
      delimiter: draftDelimiter,
      headerMode: draftHeaderChoice === "none" ? "none" : "row",
      headerRow: file.headerRow,
      headerChoice: draftHeaderChoice,
      customHeaderRow: draftCustomHeaderRow,
    },
    file,
  );
  const destructiveReparse =
    Object.keys(file.overrides).length > 0
    || file.skipped.length > 0
    || Object.keys(file.valueContext ?? {}).length > 0
    || Object.keys(file.rowDescriptions ?? {}).length > 0
    || file.validationRan;

  function requestReparse() {
    if (customHeaderError) return;
    if (destructiveReparse && !reparseConfirm) {
      setReparseConfirm(true);
      return;
    }
    setReparseConfirm(false);
    onReparseFile();
  }

  return (
    <>
      {parsingNeedsReview && !editingParse ? (
        <div className="luxia-settings-section-surface space-y-2" role="status">
          <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-warning-90)" }}>
            We couldn't read the columns correctly.
          </p>
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            Review the delimiter or encoding for this file.
          </p>
        </div>
      ) : null}
      <div
        className="@container rounded-[var(--luxia-radius-12)] border px-3 py-2.5"
        style={
          editingParse
            ? { borderColor: "var(--luxia-border-subtle)", background: "var(--luxia-neutral-white)" }
            : { borderColor: "var(--luxia-settings-section-border)", background: "var(--luxia-settings-panel-bg)" }
        }
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Button
            ref={parseTriggerRef}
            id={`csv-schema-parse-${file.id}`}
            type="button"
            variant="secondary"
            size="compact"
            className="shrink-0"
            aria-expanded={editingParse}
            aria-controls={editingParse ? parseEditorId : undefined}
            aria-describedby={draftDirty ? parseDirtyId : undefined}
            aria-label={`Parsing settings for ${file.fileName}`}
            style={
              editingParse
                ? {
                    background: "var(--luxia-opacity-brand-secondary-08)",
                    borderColor: "color-mix(in srgb, var(--luxia-brand-primary) 35%, var(--luxia-border-default))",
                  }
                : undefined
            }
            onClick={toggleParseSettings}
            onKeyDown={(event) => {
              if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
              event.preventDefault();
              toggleParseSettings();
            }}
          >
            Parsing settings
            {editingParse ? (
              <ChevronUp size={14} strokeWidth={1.75} aria-hidden />
            ) : (
              <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
            )}
          </Button>
          {editingParse ? null : (
            <p className="whitespace-nowrap luxia-type-caption @max-[36rem]:basis-full @max-[36rem]:whitespace-normal" style={{ color: "var(--luxia-text-muted)" }}>
              {`${CSV_ENCODING_LABELS[file.encoding]} · ${CSV_DELIMITER_LABELS[file.delimiter]} · ${csvHeaderSummaryLabel(csvHeaderConfigFor(file))}`}
            </p>
          )}
        </div>
        {editingParse ? (
          <div
            id={parseEditorId}
            role="region"
            aria-label={`Parsing settings for ${file.fileName}`}
            className="mt-3 space-y-2 border-t border-[var(--luxia-border-subtle)] pt-3"
          >
            <ParseSettingsFields
              file={file}
              fileId={`${file.id}-schema`}
              compact
              previewRowLimit={5}
              encoding={draftEncoding}
              delimiter={draftDelimiter}
              detectedDelimiter={file.detectedDelimiter}
              headerChoice={draftHeaderChoice}
              customHeaderRow={draftCustomHeaderRow}
              customHeaderError={customHeaderError}
              onEncoding={onEncoding}
              onDelimiter={onDelimiter}
              onHeaderChoice={onHeaderChoice}
              onCustomHeaderRow={onCustomHeaderRow}
            />
            {csvFileNotices(file).map((issue) => (
              <p
                key={`${file.id}-schema-${issue.severity}-${issue.message}`}
                className="luxia-type-caption"
                style={{
                  color:
                    issue.severity === "error"
                      ? "var(--luxia-error-70)"
                      : issue.severity === "warning"
                        ? "var(--luxia-warning-90)"
                        : "var(--luxia-text-muted)",
                }}
              >
                {issue.message}
              </p>
            ))}
            {reparseConfirm ? (
              <p className="luxia-type-caption" style={{ color: "var(--luxia-warning-90)" }} role="status">
                {PARSE_RESET_EDITS_HINT}
              </p>
            ) : (
              <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                {PARSE_RESET_HINT}
              </p>
            )}
            <div className="sticky bottom-0 z-[2] mt-2 border-t border-[var(--luxia-border-subtle)] bg-[var(--luxia-neutral-white)] pt-3">
              {draftDirty ? (
                <p
                  id={parseDirtyId}
                  className="mb-2 luxia-type-caption"
                  style={{ color: guardArmed ? "var(--luxia-warning-90)" : "var(--luxia-text-secondary)" }}
                  role={guardArmed ? "status" : undefined}
                >
                  Apply or cancel parsing changes first.
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  aria-label={`Cancel parsing changes for ${file.fileName}`}
                  onClick={() => {
                    setReparseConfirm(false);
                    onCancelParseEdit();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  disabled={Boolean(customHeaderError)}
                  aria-label={`Apply parsing for ${file.fileName}`}
                  aria-describedby={customHeaderError ? `csv-header-row-error-${file.id}-schema` : undefined}
                  onClick={requestReparse}
                >
                  Apply parsing
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <ColumnStructureTable
        file={file}
        suggestions={file.typeSuggestions}
        onTypeChange={onTypeChange}
        onConfirmType={onConfirmType}
        onRenameColumn={onRenameColumn}
        onUseSuggestion={onTypeChange}
      />
      <SchemaDataPreview
        file={file}
        live={live}
        focusedColumnId={focusedColumnId}
        inlinePreview={false}
        onTypeChange={onTypeChange}
        onConfirmType={onConfirmType}
        onRenameColumn={onRenameColumn}
        onSaveFix={onSaveFix}
        onSaveFixes={onSaveFixes}
        onExclude={onExclude}
        onUndo={onUndo}
      />
    </>
  );
}

function TableDescriptionEditor({
  file,
  tagDraft,
  aiLocked,
  onAiBusyChange,
  onDescriptionChange,
  onApplyAiDescription,
  onRowDescriptionSave,
  onApplyRowDescriptions,
}: {
  file: CsvImportFileDraft;
  tagDraft: DraftDataSourceTagsApi;
  aiLocked?: boolean;
  onAiBusyChange: (busy: boolean) => void;
  onDescriptionChange: (value: string) => void;
  onApplyAiDescription: (tableDescription: string) => void;
  onRowDescriptionSave: (rowNumber: number, text: string) => void;
  onApplyRowDescriptions: (changes: Array<{ rowNumber: number; description: string }>) => void;
}) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [rowsOpen, setRowsOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [pendingDescription, setPendingDescription] = useState<string | null>(null);
  // The AI result arrives after a delay; decide against the latest draft, not the one from the click.
  const latest = useRef({ file, onApplyAiDescription, onAiBusyChange });
  latest.current = { file, onApplyAiDescription, onAiBusyChange };
  const descriptionId = `csv-table-desc-${file.id}`;
  const tableLabel = file.tableName.trim() || "Unnamed table";
  const hasDescription = file.tableDescription.trim() !== "";
  const rowStats = rowDescriptionStats(file);

  useEffect(() => {
    setPendingDescription(null);
    setAiNotice(null);
  }, [file.id]);

  async function generateDescription() {
    if (aiBusy || aiLocked) return;
    setAiBusy(true);
    onAiBusyChange(true);
    setAiNotice(null);
    setPendingDescription(null);
    const result = await proposeCsvTableMetadata({
      fileId: file.id,
      fileName: file.fileName,
      columns: file.columns.map((column) => ({
        name: column.name,
        type: selectedColumnType(column),
      })),
      sampleRows: (file.parsed?.records ?? []).slice(0, 5).map((record) => record.fields),
    });
    setAiBusy(false);
    latest.current.onAiBusyChange(false);
    if (result.status !== "ok") {
      setAiNotice(result.message);
      return;
    }
    const current = latest.current.file;
    const suggestion = result.data.tableDescription;
    const custom =
      current.tableDescriptionOrigin === "edited"
      || (current.tableDescription.trim() !== "" && current.tableDescription.trim() !== suggestion);
    if (custom) {
      setPendingDescription(suggestion);
      return;
    }
    latest.current.onApplyAiDescription(suggestion);
  }

  return (
    <section className={`${LUXIA_SETTINGS_SECTION_SURFACE_CLASS} luxia-csv-table-desc`} aria-label={tableLabel}>
      <header className="luxia-csv-table-desc-header">
        <div className="min-w-0">
          <h3 className="luxia-csv-table-desc-title" title={tableLabel}>{tableLabel}</h3>
          <p className="luxia-csv-table-desc-file" title={file.fileName}>{file.fileName}</p>
        </div>
        <DraftTableTagRow tableId={file.id} tableLabel={tableLabel} draft={tagDraft} />
      </header>

      <div className="luxia-csv-table-desc-field">
        <div className="flex items-baseline justify-between gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Label htmlFor={descriptionId}>Table description</Label>
            {file.tableDescriptionOrigin === "ai" && hasDescription ? <CsvAiOriginBadge /> : null}
          </span>
          <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>Optional</span>
        </div>
        <Textarea
          id={descriptionId}
          value={file.tableDescription}
          onChange={(event) => onDescriptionChange(event.target.value)}
          readOnly={aiBusy}
          aria-busy={aiBusy}
          rows={3}
          placeholder="What does this table contain?"
        />
        <div className="flex flex-wrap items-center gap-3">
          <LuxiaAiButton disabled={aiBusy || aiLocked} aria-busy={aiBusy} onClick={() => void generateDescription()}>
            {aiBusy ? "Generating…" : hasDescription ? "Regenerate with AI" : "Generate with AI"}
          </LuxiaAiButton>
          {aiNotice ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
              {aiNotice}
            </p>
          ) : null}
        </div>
        {pendingDescription !== null ? (
          <div className="luxia-csv-table-desc-suggestion" role="status">
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              Replace your description with this suggestion?
            </p>
            <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
              {pendingDescription}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="compact" onClick={() => setPendingDescription(null)}>
                Dismiss
              </Button>
              <Button
                type="button"
                variant="primary"
                size="compact"
                onClick={() => {
                  onApplyAiDescription(pendingDescription);
                  setPendingDescription(null);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {file.columns.length > 0 ? (
        <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen} className="luxia-csv-table-desc-more">
          <CollapsibleTrigger asChild>
            <button type="button" className="luxia-csv-table-desc-disclosure">
              <ChevronDown
                size={14}
                strokeWidth={1.75}
                aria-hidden
                className={`transition-transform ${insightsOpen ? "rotate-180" : ""}`}
              />
              <span>Table insights</span>
              <span className="luxia-csv-table-desc-disclosure-meta">From selected column types</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                    <th className="px-0 py-1.5 pr-3 font-normal">Column</th>
                    <th className="px-0 py-1.5 pr-3 font-normal">Meaning</th>
                    <th className="px-0 py-1.5 font-normal">Suggested usage</th>
                  </tr>
                </thead>
                <tbody>
                  {file.columns.map((column) => (
                    <tr
                      key={column.id}
                      className="border-t luxia-type-caption"
                      style={{ borderColor: "var(--luxia-settings-row-divider)", color: "var(--luxia-text-secondary)" }}
                    >
                      <td className="px-0 py-1.5 pr-3 align-top" style={{ color: "var(--luxia-text-primary)" }}>
                        {column.name}
                      </td>
                      <td className="px-0 py-1.5 pr-3 align-top">{columnInsightMeaning(column)}</td>
                      <td className="px-0 py-1.5 align-top">{columnInsightUsage(column)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      <Collapsible open={rowsOpen} onOpenChange={setRowsOpen} className="luxia-csv-table-desc-more">
        <CollapsibleTrigger asChild>
          <button type="button" className="luxia-csv-table-desc-disclosure">
            <ChevronDown
              size={14}
              strokeWidth={1.75}
              aria-hidden
              className={`transition-transform ${rowsOpen ? "rotate-180" : ""}`}
            />
            <span>Row descriptions</span>
            <span className="luxia-csv-table-desc-disclosure-meta">
              {`Optional · ${rowStats.described.toLocaleString()} of ${rowStats.total.toLocaleString()} described`}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2">
            <CsvRowDescriptionsSection
              file={file}
              onSaveDescription={onRowDescriptionSave}
              onApplyAiDescriptions={onApplyRowDescriptions}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
