import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileSpreadsheet,
  MinusCircle,
  PlusCircle,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
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
  csvFileNotices,
  csvFileSchemaUiStatus,
  csvFileUiStatus,
  detectColumnTypeMismatches,
  csvColumnNameConflict,
  defaultTableNameFromFile,
  duplicateTableNameKeys,
  includedCsvFiles,
  reparseCsvImportFile,
  selectedColumnType,
  tableNameConflictKey,
  validateCsvRows,
  valueMatchesType,
  type CsvColumnType,
  type CsvColumnTypeMismatch,
  type CsvDelimiterId,
  type CsvEncodingId,
  type CsvFileUiStatus,
  type CsvImportFileDraft,
} from "./csv";
import {
  ExcludedRowsTable,
  SchemaDataPreview,
  primaryIssueColumn,
  type DisplayCsvIssue,
} from "./CsvImportRowActions";
import { LuxiaAiButton } from "@/app/components/LuxiaAiButton";
import { proposeCsvTableMetadata } from "./csvAi";
import type { DataSourceHandoffProject } from "../constellationHandoff";

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Schema" },
  { id: 3, label: "Validation" },
  { id: 4, label: "Tables" },
  { id: 5, label: "Review" },
  { id: 6, label: "Summary" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type RailState = "current" | "completed" | "needs-review" | "blocked" | "future";
type ValidationFileStatus = "not-run" | "needs-review" | "errors" | "valid" | "excluded" | "schema-mismatch";

const PARSE_RESET_HINT = "This will re-read the file.";
const PARSE_RESET_EDITS_HINT =
  "Reparsing updates the detected columns and row values. Cell edits and excluded rows for this file will be reset.";
const PREVIEW_ROW_LIMIT = 5;

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
  if (status === "ready") return "Ready";
  if (status === "excluded") return "Excluded";
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

function StepMarker({ state }: { state: RailState }) {
  const current = state === "current";
  const completed = state === "completed";
  return (
    <span
      className="relative z-[1] flex size-[22px] shrink-0 items-center justify-center rounded-full border"
      style={{
        borderColor: current
          ? "var(--luxia-text-inverse)"
          : "var(--luxia-opacity-white-32)",
        background: current
          ? "var(--luxia-text-inverse)"
          : "var(--luxia-brand-primary-dark)",
        color: current ? "var(--luxia-brand-primary-dark)" : "var(--luxia-opacity-white-80)",
      }}
      aria-hidden
    >
      {completed ? (
        <Check size={12} strokeWidth={2.5} />
      ) : current ? (
        <span
          className="size-1.5 rounded-full"
          style={{ background: "var(--luxia-brand-primary-dark)" }}
        />
      ) : null}
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
  if (type === "Date") {
    return column.dateFormat ? `Date values · ${column.dateFormat}` : "Date values";
  }
  if (type === "Integer") return "Whole numbers";
  if (type === "Number") return "Numeric values";
  if (type === "Boolean") return "True or false values";
  return "Text values";
}

function columnInsightUsage(column: CsvColumnDraft): string {
  const type = selectedColumnType(column);
  if (type === "Date") return "Time filters";
  if (type === "Integer" || type === "Number") return "Counts and measures";
  if (type === "Boolean") return "Flags and filters";
  return "Labels and search";
}

function schemaStatusForType(type: string, detectedType: string): NonNullable<CsvColumnDraft["status"]> {
  return type === detectedType ? "confirmed" : "modified";
}

function liveValidationForFile(file: CsvImportFileDraft): CsvValidationSummary {
  if (!file.parsed || file.columns.length === 0) {
    return {
      ...EMPTY_VALIDATION,
      totalRows: file.parsed?.records.length ?? 0,
    };
  }
  return validateCsvRows({
    parsed: file.parsed,
    columns: file.columns,
    overrides: file.overrides,
    skipped: new Set(file.skipped),
    previouslyInvalid: new Set(file.lastInvalidRows),
  });
}

function validationForFile(file: CsvImportFileDraft): CsvValidationSummary {
  if (!file.validationRan || file.validationStale || !file.parsed || !csvFileIsStructurallyUsable(file)) {
    return {
      ...EMPTY_VALIDATION,
      totalRows: file.parsed?.records.length ?? 0,
      skippedRows: file.skipped.length,
    };
  }
  return liveValidationForFile(file);
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
      return {
        rowNumber,
        rowIndex: rowNumber - 2,
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
  if (summary.invalidRows > 0) return "errors";
  return "valid";
}

function validationStatusLabel(status: ValidationFileStatus, summary?: CsvValidationSummary): string {
  if (status === "valid") return "Ready";
  if (status === "excluded") return "Excluded";
  if (status === "not-run") return "Not checked";
  if (status === "schema-mismatch") return "Needs review";
  if (status === "errors") {
    const count = summary?.invalidRows ?? 0;
    return `${count.toLocaleString()} issue${count === 1 ? "" : "s"}`;
  }
  return "Needs review";
}

function fileRowCount(file: CsvImportFileDraft): number {
  return file.parsed?.records.length ?? 0;
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
  sourceName: string;
  ownershipLabel: string;
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
  ownershipLabel,
  onBackToChooser,
  onCancel,
  onComplete,
  onFinish,
  eligibleProjects = [],
  onCreateConstellation,
}: CsvImportFlowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<StepId>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<StepId>(1);
  const [files, setFiles] = useState<CsvImportFileDraft[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [parseDraft, setParseDraft] = useState<{
    fileId: string;
    encoding: CsvEncodingId;
    delimiter: CsvDelimiterId;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [reading, setReading] = useState(false);
  const [acceptNotice, setAcceptNotice] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reviewDetailsOpen, setReviewDetailsOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [parseResetNotice, setParseResetNotice] = useState<string | null>(null);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [focusedColumnId, setFocusedColumnId] = useState<string | null>(null);
  const [handoffProjectId, setHandoffProjectId] = useState<string | null>(null);

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

  const validations = useMemo(() => {
    const map = new Map<string, CsvValidationSummary>();
    for (const file of files) map.set(file.id, validationForFile(file));
    return map;
  }, [files]);

  const activeValidation = activeFile
    ? validations.get(activeFile.id) ?? EMPTY_VALIDATION
    : EMPTY_VALIDATION;
  const duplicateNames = useMemo(() => duplicateTableNameKeys(files), [files]);

  const uploadComplete =
    included.length > 0 && included.every((file) => csvFileHasUsableParse(file));
  const schemaComplete =
    uploadComplete
    && included.every((file) => csvFileIsStructurallyUsable(file) && !csvFileNeedsSchemaReview(file));
  const schemaRowErrorCount = included.reduce(
    (sum, file) => sum + liveValidationForFile(file).invalidRows,
    0,
  );
  const schemaRowsClean = schemaRowErrorCount === 0;
  const filesNeedingParsingReview = included.filter((file) => csvFileNeedsParsingReview(file));
  const filesNeedingValidationRun = included.filter(
    (file) => csvFileIsStructurallyUsable(file) && (!file.validationRan || file.validationStale),
  );
  const validationComplete =
    schemaComplete
    && included.every((file) => {
      const summary = validations.get(file.id) ?? EMPTY_VALIDATION;
      return file.validationRan && !file.validationStale && summary.invalidRows === 0;
    });
  const tablesComplete =
    validationComplete
    && included.every((file) => file.tableName.trim().length > 0)
    && duplicateNames.size === 0;
  const validationHasRun = included.some((file) => file.validationRan);
  const includedTotals = included.reduce(
    (acc, file) => {
      if (!file.validationRan || file.validationStale) return acc;
      const summary = validations.get(file.id) ?? EMPTY_VALIDATION;
      acc.ready += summary.readyRows;
      acc.skipped += summary.skippedRows;
      acc.resolved += summary.resolvedRows;
      acc.errors += summary.invalidRows;
      acc.total += summary.totalRows;
      return acc;
    },
    { ready: 0, skipped: 0, resolved: 0, errors: 0, total: 0 },
  );
  const validHandoffProjectId = eligibleProjects.some((project) => project.id === handoffProjectId)
    ? handoffProjectId
    : null;

  useEffect(() => {
    if (focusedColumnId && step === 2) return;
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
    if (!schemaComplete && step >= 3 && step < 6) {
      setStep(2);
    }
  }, [schemaComplete, step, created]);

  function goToStep(next: StepId, options?: { focusColumnId?: string | null; keepParseEdit?: boolean }) {
    if (created && next !== 6) return;
    if (!options?.keepParseEdit) {
      setEditingFileId(null);
      setParseDraft(null);
    }
    if (options && "focusColumnId" in options) {
      setFocusedColumnId(options.focusColumnId ?? null);
    } else {
      setFocusedColumnId(null);
    }
    if (next === 3) {
      setFiles((prev) =>
        prev.map((file) =>
          file.included && file.parsed && csvFileIsStructurallyUsable(file) && (!file.validationRan || file.validationStale)
            ? runValidationFor(file)
            : file,
        ),
      );
    }
    if (next === 4) {
      setSelectedTableId((current) =>
        current && included.some((file) => file.id === current) ? current : included[0]?.id ?? null,
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

  function selectFile(fileId: string) {
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
    const incoming = Array.from(list);
    const rejected = incoming.filter((file) => !file.name.toLowerCase().endsWith(".csv"));
    const csvFiles = incoming.filter((file) => file.name.toLowerCase().endsWith(".csv"));
    const notices: string[] = [];
    if (rejected.length > 0) {
      notices.push(
        `Only CSV files are accepted. Not added: ${rejected.map((file) => file.name).join(", ")}.`,
      );
    }

    setReading(true);
    try {
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
        if (wasEmpty) setActiveFileId(built[0]!.id);
      }
      setAcceptNotice(notices.length > 0 ? notices.join(" ") : null);
    } finally {
      setReading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    void acceptFiles(event.dataTransfer.files);
  }

  function handleDropzoneKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }

  function removeFile(fileId: string) {
    setFiles((prev) => {
      const next = prev.filter((file) => file.id !== fileId);
      if (editingFileId === fileId) {
        setEditingFileId(null);
        setParseDraft(null);
      }
      if (includedCsvFiles(next).length === 0) {
        setMaxReachedStep(1);
        setStep(1);
      }
      snapActiveToIncluded(next);
      return next;
    });
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
    const file = files.find((item) => item.id === fileId);
    if (!file) return;
    setActiveFileId(fileId);
    const draft = {
      fileId,
      encoding: file.encoding,
      delimiter: file.delimiter,
    };
    setParseDraft(draft);
    setEditingFileId(fileId);
  }

  function reparseEditedFile() {
    if (!parseDraft) return;
    updateFile(parseDraft.fileId, (file) =>
      reparseCsvImportFile(file, {
        encoding: parseDraft.encoding,
        delimiter: parseDraft.delimiter,
        invalidateDownstream: true,
      }),
    );
    if (step >= 2 || maxReachedStep >= 2) {
      setParseResetNotice("Columns were updated.");
    }
    setEditingFileId(null);
    setParseDraft(null);
  }

  function cancelParseEdit() {
    setEditingFileId(null);
    setParseDraft(null);
  }

  function updateParseDraftEncoding(encoding: CsvEncodingId) {
    setParseDraft((current) => (current ? { ...current, encoding } : current));
  }

  function updateParseDraftDelimiter(delimiter: CsvDelimiterId) {
    setParseDraft((current) => (current ? { ...current, delimiter } : current));
  }

  function changeColumnType(columnId: string, type: string) {
    if (!activeFile) return;
    const current = activeFile.columns.find((column) => column.id === columnId);
    if (!current || current.type === type) return;
    updateFile(activeFile.id, (file) => {
      const nextFile: CsvImportFileDraft = {
        ...file,
        columns: file.columns.map((item) => {
          if (item.id !== columnId) return item;
          return {
            ...item,
            type,
            status: schemaStatusForType(type, item.detectedType),
          };
        }),
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
        const nextFile: CsvImportFileDraft = {
          ...file,
          columns: file.columns.map((item) => {
            if (item.id !== columnId) return item;
            return {
              ...item,
              type: detectedType,
              status: schemaStatusForType(detectedType, item.detectedType),
            };
          }),
        };
        return nextFile.parsed && csvFileIsStructurallyUsable(nextFile)
          ? runValidationFor(nextFile)
          : { ...nextFile, validationRan: false, validationStale: true };
      }),
    );
  }

  function reviewColumnType(fileId: string, columnId: string) {
    setActiveFileId(fileId);
    goToStep(2, { focusColumnId: columnId });
  }

  function confirmColumnType(columnId: string) {
    if (!activeFile) return;
    updateFile(activeFile.id, (file) => ({
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

  function renameColumn(columnId: string, nextName: string): string | null {
    if (!activeFile) return "This file is not available.";
    const conflict = csvColumnNameConflict(activeFile.columns, columnId, nextName);
    if (conflict) return conflict;
    const trimmed = nextName.trim();
    updateFile(activeFile.id, (file) => ({
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
    return {
      ...file,
      lastInvalidRows: [...merged],
      validationRan: true,
      validationStale: false,
      issueSnapshot: [
        ...next.issues,
        ...skippedKept.filter((issue) => !snapshotKeys.has(`${issue.rowNumber}:${issue.columnId}`)),
      ],
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

  function skipRow(rowNumber: number) {
    if (!activeFile) return;
    updateFile(activeFile.id, (file) => {
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

  function unskipRow(rowNumber: number) {
    if (!activeFile) return;
    updateFile(activeFile.id, (file) =>
      runValidationFor({
        ...file,
        skipped: file.skipped.filter((row) => row !== rowNumber),
      }),
    );
  }

  function applyCellFix(issue: CsvValidationIssue, value: string): string | null {
    if (!activeFile) return "This file is not available.";
    const column = activeFile.columns.find((item) => item.id === issue.columnId);
    const expected = column ? selectedColumnType(column) : (issue.expected as CsvColumnType);
    if (!valueMatchesType(value, expected)) {
      return `This value does not match ${expected}.`;
    }
    updateFile(activeFile.id, (file) =>
      runValidationFor({
        ...file,
        overrides: {
          ...file.overrides,
          [issue.rowNumber]: {
            ...(file.overrides[issue.rowNumber] ?? {}),
            [issue.columnId]: value,
          },
        },
      }),
    );
    return null;
  }

  function applyCellFixes(
    fixes: Array<{ issue: CsvValidationIssue; value: string }>,
  ): string | null {
    if (!activeFile) return "This file is not available.";
    const accepted: Array<{ issue: CsvValidationIssue; value: string }> = [];
    let rejected = 0;
    for (const fix of fixes) {
      const column = activeFile.columns.find((item) => item.id === fix.issue.columnId);
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
    updateFile(activeFile.id, (file) => {
      let overrides = file.overrides;
      for (const { issue, value } of accepted) {
        overrides = {
          ...overrides,
          [issue.rowNumber]: {
            ...(overrides[issue.rowNumber] ?? {}),
            [issue.columnId]: value,
          },
        };
      }
      return runValidationFor({ ...file, overrides });
    });
    if (rejected === 0) return null;
    return `Applied ${accepted.length.toLocaleString()}. ${rejected.toLocaleString()} did not match the column type.`;
  }

  function completePayload(): CsvImportCompletePayload {
    return {
      tables: included.map((file) => {
        const summary = validations.get(file.id) ?? EMPTY_VALIDATION;
        return {
          id: file.id,
          fileName: file.fileName,
          tableName: file.tableName.trim() || "imported_table",
          tableDescription: file.tableDescription.trim(),
          delimiter: CSV_DELIMITER_LABELS[file.delimiter],
          encoding: CSV_ENCODING_LABELS[file.encoding],
          importedRows: summary.readyRows,
          skippedRows: summary.skippedRows,
        };
      }),
    };
  }

  function railState(id: StepId): RailState {
    if (created) {
      if (id === 6) return "current";
      return "completed";
    }
    if (id === 6) return "future";
    if (id === step) return "current";
    if (id === 1) return uploadComplete ? "completed" : "future";
    if (id === 2) {
      if (!uploadComplete) return id <= maxReachedStep ? "blocked" : "future";
      if (step > 2 && schemaComplete && schemaRowsClean) return "completed";
      return id <= maxReachedStep ? "needs-review" : "future";
    }
    if (id === 3) {
      if (!schemaComplete || !schemaRowsClean) return id <= maxReachedStep ? "blocked" : "future";
      if (validationComplete) return "completed";
      if (id <= maxReachedStep) return "needs-review";
      return "future";
    }
    if (id === 4) {
      if (!validationComplete) return id <= maxReachedStep ? "blocked" : "future";
      return tablesComplete ? "completed" : id <= maxReachedStep ? "needs-review" : "future";
    }
    if (!tablesComplete) return id <= maxReachedStep ? "blocked" : "future";
    return id <= maxReachedStep ? "completed" : "future";
  }

  function canOpenStep(id: StepId): boolean {
    if (created) return false;
    if (id === 6) return false;
    if (id === 1) return true;
    if (id > maxReachedStep) return false;
    if (id === 2) return uploadComplete;
    if (id === 3) return schemaComplete && schemaRowsClean;
    if (id === 4) return validationComplete;
    if (id === 5) return tablesComplete;
    return false;
  }

  function primaryLabel() {
    if (step === 3 && filesNeedingValidationRun.length > 0) {
      return validationHasRun ? "Revalidate all files" : "Validate all files";
    }
    if (step === 5) return creating ? "Creating Data Source…" : "Create Data Source";
    if (step === 6) return "Done";
    return "Next";
  }

  function canAdvance() {
    if (created && step === 6) return true;
    if (creating || reading) return false;
    if (step === 1) return uploadComplete;
    if (step === 2) return schemaComplete && schemaRowsClean;
    if (step === 3) {
      if (!schemaComplete) return false;
      if (filesNeedingValidationRun.length > 0) return true;
      return validationComplete;
    }
    if (step === 4) return tablesComplete;
    if (step === 5) return tablesComplete && includedTotals.errors === 0 && !created;
    return true;
  }

  function handlePrimary() {
    if (step === 3 && !schemaComplete) return;
    if (step === 3 && filesNeedingValidationRun.length > 0) {
      runValidation();
      return;
    }
    if (step === 3 && !validationComplete) return;
    if (step === 5) {
      if (creating || created || !tablesComplete || includedTotals.errors > 0) return;
      setCreating(true);
      setCreateError(null);
      try {
        onComplete(completePayload());
        setCreated(true);
        goToStep(6);
      } catch {
        setCreateError("The Data Source could not be created.");
      } finally {
        setCreating(false);
      }
      return;
    }
    if (step === 6) {
      onFinish();
      return;
    }
    if (step === 1 && included[0]) setActiveFileId(included[0].id);
    goToStep(Math.min(step + 1, 6) as StepId);
  }

  function handleBack() {
    if (created) return;
    if (step === 1) {
      onBackToChooser();
      return;
    }
    goToStep(Math.max(step - 1, 1) as StepId);
  }

  function handleDialogOpenChange(next: boolean) {
    if (next) return;
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
    setPreviewFileId(null);
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
  const blockingMismatches = included.flatMap((file) =>
    mismatchesForFile(file, validations.get(file.id) ?? EMPTY_VALIDATION),
  );
  const activeMismatches = activeFile
    ? mismatchesForFile(activeFile, activeValidation)
    : [];

  function schemaAdvanceBlockReason(): string | null {
    if (filesNeedingParsingReview.length > 0) {
      const rows = filesNeedingParsingReview.reduce(
        (sum, file) => sum + (file.parsed?.records.length ?? 0),
        0,
      );
      if (rows >= 8) return `Review parsing — ${rows.toLocaleString()} rows are affected.`;
      return "Review parsing to continue.";
    }
    for (const file of included) {
      const column = file.columns.find((item) => item.status === "needs-review");
      if (column) return `Confirm the ${column.name} column type to continue.`;
    }
    let top: { name: string; count: number } | null = null;
    for (const file of included) {
      const live = liveValidationForFile(file);
      const column = primaryIssueColumn(live.issues);
      if (!column) continue;
      if (!top || column.count > top.count) top = { name: column.columnName, count: column.count };
    }
    if (top) {
      return `Resolve ${top.count.toLocaleString()} ${top.name} value${top.count === 1 ? "" : "s"} to continue.`;
    }
    return null;
  }

  function validationBlockedCopy(): string | null {
    if (step !== 3 || filesNeedingValidationRun.length > 0) return null;
    if (blockingMismatches.length > 0) {
      const mismatch = blockingMismatches[0]!;
      return `Confirm the ${mismatch.columnName} column type to continue.`;
    }
    if (blockingErrorCount === 0) return null;
    return `Resolve or exclude ${blockingErrorCount.toLocaleString()} row${blockingErrorCount === 1 ? "" : "s"} to continue.`;
  }

  function advanceBlockedReason(): string | null {
    if (canAdvance()) return null;
    if (step === 1) return "Add a CSV file to continue.";
    if (step === 2) return schemaAdvanceBlockReason();
    if (step === 3) return validationBlockedCopy();
    if (step === 4) return "Enter a table name to continue.";
    return null;
  }

  const nextReason = advanceBlockedReason();

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="flex min-h-[min(540px,82vh)] max-h-[min(82vh,760px)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        onEscapeKeyDown={(event) => {
          if (previewFileId) event.preventDefault();
        }}
      >
        <DialogHeader
          className="shrink-0 space-y-1 px-6 py-4 pr-14 text-left"
          style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
        >
          <DialogTitle className="text-left" style={{ color: "var(--luxia-text-inverse)" }}>
            Import CSV
          </DialogTitle>
          <DialogDescription className="mt-1 text-left" style={{ color: "var(--luxia-purple-10)" }}>
            {sourceName} · {ownershipLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row md:items-stretch">
          <nav
            className="luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical shrink-0 px-3 py-3 md:flex md:w-44 md:min-h-0 md:flex-col md:self-stretch md:overflow-y-auto"
            style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
            aria-label="CSV import steps"
          >
            <ol className="relative z-[1] flex gap-2 overflow-x-auto md:flex-col md:gap-0">
              {STEPS.map((item, index) => {
                const state = railState(item.id);
                const active = item.id === step;
                const disabled = !canOpenStep(item.id);
                const isLast = index === STEPS.length - 1;
                const schemaNeedsReview =
                  item.id === 2
                  && (!schemaComplete || !schemaRowsClean)
                  && (active || maxReachedStep >= 2);
                const showNeedsReview = state === "needs-review" || (active && schemaNeedsReview);
                const showCompleted = state === "completed";
                const statusText = showNeedsReview ? "Needs review" : showCompleted ? "Completed" : null;
                const stepLabel = `${String(item.id).padStart(2, "0")} ${item.label}`;
                const connectorColor = "var(--luxia-opacity-white-16)";
                return (
                  <li key={item.id} className={`relative z-[1] flex min-w-0 shrink-0 items-stretch gap-2 md:w-full ${isLast ? "" : "md:pb-3"}`}>
                    <div className="relative z-[1] hidden w-[22px] shrink-0 items-start justify-center md:flex">
                      {index > 0 ? (
                        <span
                          aria-hidden
                          className="absolute left-1/2 top-0 h-[11px] w-px -translate-x-1/2"
                          style={{ background: connectorColor }}
                        />
                      ) : null}
                      {!isLast ? (
                        <span
                          aria-hidden
                          className="absolute left-1/2 top-[11px] bottom-0 w-px -translate-x-1/2"
                          style={{ background: connectorColor }}
                        />
                      ) : null}
                      <StepMarker state={active ? "current" : state} />
                    </div>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-current={active ? "step" : undefined}
                      aria-disabled={disabled}
                      aria-label={`${stepLabel}, ${statusText ?? railStateLabel(state)}`}
                      onClick={() => {
                        if (disabled) return;
                        goToStep(item.id);
                      }}
                      className="min-w-0 flex-1 rounded-[8px] px-1.5 py-1.5 text-left luxia-type-caption whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-opacity-white-32)] disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:bg-[var(--luxia-opacity-white-08)] md:whitespace-normal"
                      style={{
                        color: active
                          ? "var(--luxia-text-inverse)"
                          : state === "future" || state === "blocked"
                            ? "var(--luxia-opacity-white-48)"
                            : "var(--luxia-opacity-white-80)",
                        background: active ? "var(--luxia-opacity-white-12)" : "transparent",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <span className="flex items-start gap-2 md:block">
                        <span className="md:hidden">
                          <StepMarker state={state} />
                        </span>
                        <span className="min-w-0">
                          <span className="block">
                            <span className="tabular-nums opacity-70">
                              {String(item.id).padStart(2, "0")}
                            </span>
                            {" "}
                            {item.label}
                          </span>
                          {statusText ? (
                            <span
                              className="mt-0.5 block"
                              style={{
                                color: showNeedsReview
                                  ? "var(--luxia-warning-50)"
                                  : "var(--luxia-opacity-white-48)",
                              }}
                            >
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
              className="luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical min-h-0 flex-1 overflow-y-auto px-6 py-5"
            >
              {step === 1 ? (
                <UploadStep
                  files={files}
                  dragActive={dragActive}
                  reading={reading}
                  acceptNotice={acceptNotice}
                  editingFileId={editingFileId}
                  parseDraft={parseDraft}
                  fileInputRef={fileInputRef}
                  onBrowse={() => fileInputRef.current?.click()}
                  onFiles={(list) => void acceptFiles(list)}
                  onDrop={handleDrop}
                  onDropzoneKey={handleDropzoneKey}
                  onDragEnter={() => setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onPreview={openFilePreview}
                  onStartParseEdit={startParseEdit}
                  onReparseFile={reparseEditedFile}
                  onCancelParseEdit={cancelParseEdit}
                  onRemove={removeFile}
                  onToggleIncluded={toggleIncluded}
                  onEncoding={updateParseDraftEncoding}
                  onDelimiter={updateParseDraftDelimiter}
                  warnParseReset={maxReachedStep >= 2}
                />
              ) : null}

              {step === 2 && activeFile ? (
                <div className="min-w-0 space-y-4">
                  <StepIntro title="Schema" body="Inspect columns and correct values here." />
                  <FileSwitcher
                    files={included}
                    activeId={activeFile.id}
                    validations={validations}
                    mode="schema"
                    onSelect={selectFile}
                  />
                  {parseResetNotice ? (
                    <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status" aria-live="polite">
                      {parseResetNotice}
                    </p>
                  ) : null}
                  <SchemaPanel
                    file={activeFile}
                    focusedColumnId={focusedColumnId}
                    editingParse={editingFileId === activeFile.id}
                    draftEncoding={parseDraft?.fileId === activeFile.id ? parseDraft.encoding : activeFile.encoding}
                    draftDelimiter={parseDraft?.fileId === activeFile.id ? parseDraft.delimiter : activeFile.delimiter}
                    onTypeChange={changeColumnType}
                    onConfirmType={confirmColumnType}
                    onRenameColumn={renameColumn}
                    onSaveFix={applyCellFix}
                    onSaveFixes={applyCellFixes}
                    onExclude={skipRow}
                    onUndo={unskipRow}
                    onStartParseEdit={() => startParseEdit(activeFile.id)}
                    onReparseFile={reparseEditedFile}
                    onCancelParseEdit={cancelParseEdit}
                    onEncoding={updateParseDraftEncoding}
                    onDelimiter={updateParseDraftDelimiter}
                  />
                </div>
              ) : null}

              {step === 3 && activeFile ? (
                <div className="space-y-4">
                  <StepIntro title="Validation" body="Confirm the rows now fit the column types." />
                  <FileSwitcher
                    files={included}
                    activeId={activeFile.id}
                    validations={validations}
                    mode="validation"
                    onSelect={selectFile}
                  />
                  <ValidationPanel
                    file={activeFile}
                    summary={activeValidation}
                    remainingIssues={activeValidation.invalidRows}
                    excludedIssues={skippedDisplayIssues(activeFile)}
                    onReviewInSchema={() => goToStep(2)}
                    onUndo={unskipRow}
                  />
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-4">
                  <StepIntro title="Tables" body="Name and describe each table in this Data Source." />
                  {included.length === 1 ? (
                    (() => {
                      const file = included[0]!;
                      return (
                        <TableMetadataEditor
                          file={file}
                          conflict={Boolean(file.tableName.trim()) && duplicateNames.has(tableNameConflictKey(file.tableName))}
                          onNameChange={(value) =>
                            updateFile(file.id, (current) => ({ ...current, tableName: value }))
                          }
                          onDescriptionChange={(value) =>
                            updateFile(file.id, (current) => ({
                              ...current,
                              tableDescription: value,
                              descriptionDrafted: false,
                            }))
                          }
                          onApplyAiMeta={(tableName, tableDescription) =>
                            updateFile(file.id, (current) => ({
                              ...current,
                              tableName,
                              tableDescription,
                              tableMetaAiGenerated: true,
                            }))
                          }
                        />
                      );
                    })()
                  ) : (
                    <div className="space-y-2">
                      {included.map((file) => {
                        const expanded = (selectedTableId ?? included[0]?.id) === file.id;
                        const ready = Boolean(file.tableName.trim())
                          && !duplicateNames.has(tableNameConflictKey(file.tableName));
                        return (
                          <div key={file.id} className={LUXIA_SETTINGS_SECTION_SURFACE_CLASS}>
                            <button
                              type="button"
                              aria-expanded={expanded}
                              onClick={() => setSelectedTableId(file.id)}
                              className="flex w-full items-center gap-2 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                            >
                              <span
                                className="flex size-4 shrink-0 items-center justify-center rounded-full border"
                                style={{
                                  borderColor: ready ? "var(--luxia-success-70)" : "var(--luxia-border-default)",
                                  color: ready ? "var(--luxia-success-70)" : "var(--luxia-text-muted)",
                                }}
                                aria-hidden
                              >
                                {ready ? <Check size={10} strokeWidth={2.5} /> : null}
                              </span>
                              <span className="min-w-0 flex-1 truncate luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
                                {file.tableName.trim() || file.fileName}
                              </span>
                              <span className="truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                                {file.fileName}
                              </span>
                              <ChevronDown
                                size={14}
                                strokeWidth={1.75}
                                aria-hidden
                                className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                                style={{ color: "var(--luxia-text-muted)" }}
                              />
                            </button>
                            {expanded ? (
                              <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
                                <TableMetadataEditor
                                  file={file}
                                  embedded
                                  conflict={Boolean(file.tableName.trim()) && duplicateNames.has(tableNameConflictKey(file.tableName))}
                                  onNameChange={(value) =>
                                    updateFile(file.id, (current) => ({ ...current, tableName: value }))
                                  }
                                  onDescriptionChange={(value) =>
                                    updateFile(file.id, (current) => ({
                                      ...current,
                                      tableDescription: value,
                                      descriptionDrafted: false,
                                    }))
                                  }
                                  onApplyAiMeta={(tableName, tableDescription) =>
                                    updateFile(file.id, (current) => ({
                                      ...current,
                                      tableName,
                                      tableDescription,
                                      tableMetaAiGenerated: true,
                                    }))
                                  }
                                />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-4">
                  <StepIntro title="Review" body="What am I about to create?" />
                  <div className={LUXIA_SETTINGS_SECTION_SURFACE_CLASS}>
                    <div className="space-y-3 px-4 py-4">
                      <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                        {sourceName}
                      </p>
                      <dl className="grid gap-3 sm:grid-cols-2">
                        <ReviewCell label="Ownership" value={ownershipLabel} />
                        <ReviewCell
                          label="Files"
                          value={`${included.length} file${included.length === 1 ? "" : "s"}`}
                        />
                        <ReviewCell
                          label="Tables"
                          value={`${included.length} table${included.length === 1 ? "" : "s"}`}
                        />
                        <ReviewCell
                          label="Ready rows"
                          value={includedTotals.ready.toLocaleString()}
                        />
                        <ReviewCell
                          label="Excluded rows"
                          value={includedTotals.skipped.toLocaleString()}
                        />
                        <ReviewCell
                          label="Errors"
                          value={includedTotals.errors.toLocaleString()}
                        />
                      </dl>
                    </div>
                  </div>
                  <div className="luxia-settings-table-surface overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                          <th className="px-3 py-2 font-normal">Table</th>
                          <th className="px-3 py-2 font-normal">Source file</th>
                          <th className="px-3 py-2 font-normal">Ready rows</th>
                          <th className="px-3 py-2 font-normal">Excluded rows</th>
                        </tr>
                      </thead>
                      <tbody>
                        {included.map((file) => {
                          const summary = validations.get(file.id) ?? EMPTY_VALIDATION;
                          return (
                            <tr
                              key={file.id}
                              className="border-t luxia-type-body-dense"
                              style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                            >
                              <td className="px-3 py-2" style={{ color: "var(--luxia-text-primary)" }}>
                                {file.tableName.trim() || file.fileName}
                              </td>
                              <td className="px-3 py-2" style={{ color: "var(--luxia-text-secondary)" }}>
                                {file.fileName}
                              </td>
                              <td className="px-3 py-2 tabular-nums" style={{ color: "var(--luxia-text-primary)" }}>
                                {summary.readyRows.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 tabular-nums" style={{ color: "var(--luxia-text-secondary)" }}>
                                {summary.skippedRows.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="compact"
                      onClick={() => setReviewDetailsOpen((open) => !open)}
                      aria-expanded={reviewDetailsOpen}
                    >
                      {reviewDetailsOpen ? "Hide technical details" : "View technical details"}
                    </Button>
                    {reviewDetailsOpen ? (
                      <dl className={`${LUXIA_SETTINGS_SECTION_SURFACE_CLASS} mt-3 grid gap-3 px-4 py-4 sm:grid-cols-2`}>
                        {included.map((file) => (
                          <div key={file.id} className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                            <ReviewCell label="Table" value={file.tableName.trim() || file.fileName} />
                            <ReviewCell label="File" value={file.fileName} />
                            <ReviewCell label="Encoding" value={CSV_ENCODING_LABELS[file.encoding]} />
                            <ReviewCell label="Delimiter" value={CSV_DELIMITER_LABELS[file.delimiter]} />
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
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

              {step === 6 ? (
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={22}
                      strokeWidth={1.75}
                      className="mt-0.5 shrink-0"
                      style={{ color: "var(--luxia-success-70)" }}
                      aria-hidden
                    />
                    <div>
                      <h3 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                        Data Source created
                      </h3>
                      <p className="mt-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
                        {sourceName}
                      </p>
                      <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        {`${included.length.toLocaleString()} table${included.length === 1 ? "" : "s"} · ${includedTotals.ready.toLocaleString()} rows imported`}
                        {includedTotals.skipped > 0
                          ? ` · ${includedTotals.skipped.toLocaleString()} excluded`
                          : ""}
                      </p>
                    </div>
                  </div>
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
              className="shrink-0 justify-between border-t px-6 py-4"
              style={{
                borderColor: "var(--luxia-border-subtle)",
                background: "var(--luxia-settings-panel-bg)",
              }}
            >
              {step === 6 ? (
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
                      <p id="csv-advance-reason" className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        {nextReason}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant="primary"
                      size="compact"
                      disabled={!canAdvance()}
                      aria-describedby={nextReason ? "csv-advance-reason" : undefined}
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
    </Dialog>
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

function FileSwitcher({
  files,
  activeId,
  validations,
  mode,
  onSelect,
}: {
  files: CsvImportFileDraft[];
  activeId: string;
  validations: Map<string, CsvValidationSummary>;
  mode: "schema" | "validation";
  onSelect: (id: string) => void;
}) {
  if (files.length === 0) return null;

  function statusFor(file: CsvImportFileDraft): { kind: StatusToneKind; label: string } {
    if (mode === "schema") {
      if (!file.included) return { kind: "excluded", label: "Excluded" };
      const schemaStatus = csvFileSchemaUiStatus(file);
      const live = liveValidationForFile(file);
      const needsReview =
        schemaStatus !== "ready"
        || live.invalidRows > 0
        || file.columns.some((column) => column.status === "needs-review");
      if (needsReview) return { kind: "needs-review", label: "Needs review" };
      return { kind: "ready", label: "Ready" };
    }
    const validationStatus = validationFileStatus(
      file,
      validations.get(file.id) ?? EMPTY_VALIDATION,
    );
    return {
      kind: validationStatus,
      label: validationStatusLabel(validationStatus, validations.get(file.id)),
    };
  }

  if (files.length === 1) {
    const file = files[0]!;
    const status = statusFor(file);
    return (
      <div className="min-w-0">
        <p className="truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }} title={file.fileName}>
          {file.fileName}
        </p>
        <div className="mt-1">
          <StatusDotLabel kind={status.kind} label={status.label} />
        </div>
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Included CSV files"
      className="flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5"
    >
      {files.map((file) => {
        const selected = file.id === activeId;
        const status = statusFor(file);
        return (
          <button
            key={file.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`${file.fileName}, ${status.label}`}
            onClick={() => onSelect(file.id)}
            title={`${file.fileName} · ${status.label}`}
            className="min-w-[9.5rem] max-w-[14rem] shrink-0 rounded-[var(--luxia-radius-control)] border px-2.5 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            style={{
              borderColor: selected
                ? "var(--luxia-settings-tab-active-border)"
                : "var(--luxia-border-subtle)",
              background: selected
                ? "var(--luxia-settings-tab-active-bg)"
                : "var(--luxia-settings-panel-bg)",
              color: selected
                ? "var(--luxia-settings-tab-active-text)"
                : "var(--luxia-text-primary)",
            }}
          >
            <span className="block truncate luxia-type-body-dense-strong">{file.fileName}</span>
            <span className="mt-1 block">
              <StatusDotLabel kind={status.kind} label={status.label} />
            </span>
          </button>
        );
      })}
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
        <CsvFilePreviewBody file={file} parsed={parsed} onFixParsing={onFixParsing} />
      ) : null}
    </Dialog>
  );
}

function CsvFilePreviewBody({
  file,
  parsed,
  onFixParsing,
}: {
  file: CsvImportFileDraft;
  parsed: NonNullable<CsvImportFileDraft["parsed"]>;
  onFixParsing: () => void;
}) {
  const headers = parsed.headers;
  const rows = parsed.records.slice(0, PREVIEW_ROW_LIMIT);
  const showWarning = csvPreviewShowsParseWarning(file);
  const rowCount = parsed.records.length;
  const columnCount = headers.length;
  const parseContext = `${rowCount.toLocaleString()} row${rowCount === 1 ? "" : "s"} · ${columnCount.toLocaleString()} column${columnCount === 1 ? "" : "s"}`;
  const parseMeta = `${CSV_DELIMITER_LABELS[file.delimiter]} · ${CSV_ENCODING_LABELS[file.encoding]}`;

  return (
    <DialogContent
      overlayClassName="z-[60]"
      className="z-[60] flex max-h-[min(82vh,640px)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      aria-describedby="csv-preview-context"
    >
      <DialogHeader className="shrink-0 space-y-1 px-6 py-4 pr-14 text-left">
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
      {showWarning ? (
        <DialogFooter
          className="shrink-0 justify-end border-t px-6 py-4"
          style={{
            borderColor: "var(--luxia-border-subtle)",
            background: "var(--luxia-settings-panel-bg)",
          }}
        >
          <Button
            type="button"
            variant="secondary"
            size="compact"
            onClick={onFixParsing}
          >
            <SlidersHorizontal size={14} strokeWidth={1.75} aria-hidden />
            Fix parsing
          </Button>
        </DialogFooter>
      ) : null}
    </DialogContent>
  );
}

function CsvDropzone({
  compact,
  dragActive,
  onBrowse,
  onDrop,
  onDropzoneKey,
  onDragEnter,
  onDragLeave,
}: {
  compact: boolean;
  dragActive: boolean;
  onBrowse: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDropzoneKey: (event: KeyboardEvent<HTMLDivElement>) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={compact ? "Add more CSV files. Drop files here or browse" : "Drop CSV files here or browse"}
      onDragEnter={(event) => {
        event.preventDefault();
        onDragEnter();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragEnter();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onKeyDown={onDropzoneKey}
      onClick={onBrowse}
      className={`luxia-csv-dropzone focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] ${
        dragActive ? "is-active" : ""
      } ${compact ? "px-4 py-5" : "px-4 py-10"}`}
    >
      <FileSpreadsheet
        className="luxia-csv-dropzone-icon mx-auto mb-2"
        size={compact ? 22 : 28}
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
        {compact ? "Add more CSV files" : "Upload CSV files"}
      </p>
      <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
        Drag and drop CSV files here, or browse from your device.
      </p>
      <Button type="button" variant="secondary" size="compact" className="mt-3" onClick={(event) => {
        event.stopPropagation();
        onBrowse();
      }}>
        Browse files
      </Button>
    </div>
  );
}

function UploadStep({
  files,
  dragActive,
  reading,
  acceptNotice,
  editingFileId,
  parseDraft,
  fileInputRef,
  onBrowse,
  onFiles,
  onDrop,
  onDropzoneKey,
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
  warnParseReset,
}: {
  files: CsvImportFileDraft[];
  dragActive: boolean;
  reading: boolean;
  acceptNotice: string | null;
  editingFileId: string | null;
  parseDraft: { fileId: string; encoding: CsvEncodingId; delimiter: CsvDelimiterId } | null;
  fileInputRef: React.Ref<HTMLInputElement>;
  onBrowse: () => void;
  onFiles: (list: FileList | null) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDropzoneKey: (event: KeyboardEvent<HTMLDivElement>) => void;
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
  warnParseReset?: boolean;
}) {
  return (
    <div className="space-y-4">
      <StepIntro title="Upload" body="Add one or more CSV files." />
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        multiple
        className="sr-only"
        onChange={(event) => onFiles(event.target.files)}
      />
      <CsvDropzone
        compact={files.length > 0}
        dragActive={dragActive}
        onBrowse={onBrowse}
        onDrop={onDrop}
        onDropzoneKey={onDropzoneKey}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      />
      {files.length > 0 ? (
        <ul className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} divide-y`}>
            {files.map((file) => {
              const status = csvFileUiStatus(file);
              const notices = csvFileNotices(file);
              const editing = editingFileId === file.id;
              const parsingProblem =
                csvFileNeedsParsingReview(file)
                || status === "error"
                || file.decodeIssues.some((issue) => issue.severity === "warning");
              return (
                <li key={file.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }} title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className="mt-0.5 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        {file.parsed
                          ? `${fileRowCount(file).toLocaleString()} rows`
                          : "Could not read this file"}
                      </p>
                    </div>
                    <StatusDotLabel kind={status} label={uploadFileStatusLabel(status)} />
                  </div>
                  {parsingProblem && !editing ? (
                    <div className="mt-3 space-y-1" role="status">
                      <p className="luxia-type-body-dense" style={{ color: "var(--luxia-warning-90)" }}>
                        We couldn't read the columns correctly.
                      </p>
                      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        Review the delimiter or encoding for this file.
                      </p>
                    </div>
                  ) : null}
                  {editing ? (
                    <div className="mt-3 space-y-2">
                      {warnParseReset ? (
                        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                          {PARSE_RESET_HINT}
                        </p>
                      ) : null}
                      <ParseSettingsFields
                        fileId={file.id}
                        encoding={parseDraft?.fileId === file.id ? parseDraft.encoding : file.encoding}
                        delimiter={parseDraft?.fileId === file.id ? parseDraft.delimiter : file.delimiter}
                        detectedDelimiter={file.detectedDelimiter}
                        onEncoding={onEncoding}
                        onDelimiter={onDelimiter}
                      />
                      {notices.map((issue) => (
                        <p
                          key={`${file.id}-${issue.severity}-${issue.message}`}
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
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {csvFileCanPreview(file) ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="compact"
                        onClick={() => onPreview(file.id)}
                        aria-label={`Preview ${file.fileName}`}
                      >
                        <Eye size={14} strokeWidth={1.75} aria-hidden />
                        Preview
                      </Button>
                    ) : null}
                    {editing ? (
                      <>
                        <Button type="button" variant="secondary" size="compact" onClick={onReparseFile}>
                          Reparse file
                        </Button>
                        <Button type="button" variant="outline" size="compact" onClick={onCancelParseEdit}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="compact"
                          onClick={() => onStartParseEdit(file.id)}
                        >
                          <SlidersHorizontal size={14} strokeWidth={1.75} aria-hidden />
                          {parsingProblem ? "Fix parsing" : "Edit parsing"}
                        </Button>
                        <Button
                          type="button"
                          variant="tertiary"
                          size="compact"
                          onClick={() => onToggleIncluded(file.id)}
                        >
                          {file.included ? (
                            <MinusCircle size={14} strokeWidth={1.75} aria-hidden />
                          ) : (
                            <PlusCircle size={14} strokeWidth={1.75} aria-hidden />
                          )}
                          {file.included ? "Exclude" : "Include"}
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="compact"
                      aria-label={`Remove ${file.fileName}`}
                      onClick={() => onRemove(file.id)}
                    >
                      <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                      Remove
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
      ) : null}
      {reading ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
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
  fileId,
  encoding,
  delimiter,
  detectedDelimiter,
  onEncoding,
  onDelimiter,
}: {
  fileId: string;
  encoding: CsvEncodingId;
  delimiter: CsvDelimiterId;
  detectedDelimiter?: CsvDelimiterId;
  onEncoding: (encoding: CsvEncodingId) => void;
  onDelimiter: (delimiter: CsvDelimiterId) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`csv-encoding-${fileId}`}>Encoding</Label>
        <Select value={encoding} onValueChange={(value) => onEncoding(value as CsvEncodingId)}>
          <SelectTrigger id={`csv-encoding-${fileId}`} size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CSV_ENCODING_IDS.map((key) => (
              <SelectItem key={key} value={key}>
                {CSV_ENCODING_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`csv-delimiter-${fileId}`}>Delimiter</Label>
        <Select value={delimiter} onValueChange={(value) => onDelimiter(value as CsvDelimiterId)}>
          <SelectTrigger id={`csv-delimiter-${fileId}`} size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
}: {
  file: CsvImportFileDraft;
  focusedColumnId: string | null;
  editingParse: boolean;
  draftEncoding: CsvEncodingId;
  draftDelimiter: CsvDelimiterId;
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
}) {
  const [reparseConfirm, setReparseConfirm] = useState(false);
  const parsingNeedsReview = csvFileNeedsParsingReview(file);
  const live = liveValidationForFile(file);
  const destructiveReparse =
    Object.keys(file.overrides).length > 0 || file.skipped.length > 0;

  function requestReparse() {
    if (destructiveReparse && !reparseConfirm) {
      setReparseConfirm(true);
      return;
    }
    setReparseConfirm(false);
    onReparseFile();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--luxia-radius-12)] border px-3 py-2.5" style={{ borderColor: "var(--luxia-settings-section-border)", background: "var(--luxia-settings-panel-bg)" }}>
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          <span>Encoding: {CSV_ENCODING_LABELS[file.encoding]}</span>
          <span>Delimiter: {CSV_DELIMITER_LABELS[file.delimiter]}</span>
          <span>Header: First row</span>
        </div>
        {editingParse ? null : (
          <Button type="button" variant="secondary" size="compact" onClick={onStartParseEdit}>
            <SlidersHorizontal size={14} strokeWidth={1.75} aria-hidden />
            Edit parsing
          </Button>
        )}
      </div>
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
      {editingParse ? (
        <div className="luxia-settings-section-surface space-y-3">
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            Reparsing updates the detected columns and row values.
          </p>
          <ParseSettingsFields
            fileId={`${file.id}-schema`}
            encoding={draftEncoding}
            delimiter={draftDelimiter}
            detectedDelimiter={file.detectedDelimiter}
            onEncoding={onEncoding}
            onDelimiter={onDelimiter}
          />
          <div>
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
              Header
            </p>
            <p className="mt-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
              First row
            </p>
          </div>
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="compact" onClick={requestReparse}>
              Reparse file
            </Button>
            <Button
              type="button"
              variant="outline"
              size="compact"
              onClick={() => {
                setReparseConfirm(false);
                onCancelParseEdit();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      <SchemaDataPreview
        file={file}
        live={live}
        focusedColumnId={focusedColumnId}
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

function ValidationPanel({
  file,
  summary,
  remainingIssues,
  excludedIssues,
  onReviewInSchema,
  onUndo,
}: {
  file: CsvImportFileDraft;
  summary: CsvValidationSummary;
  remainingIssues: number;
  excludedIssues: DisplayCsvIssue[];
  onReviewInSchema: () => void;
  onUndo: (rowNumber: number) => void;
}) {
  const [showExcluded, setShowExcluded] = useState(false);

  if (!file.validationRan || file.validationStale) {
    return (
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
        {file.validationStale ? "Check this file again after parsing or type changes." : "Checking this file…"}
      </p>
    );
  }

  const excludedView = summary.skippedRows > 0 ? (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="compact"
        onClick={() => setShowExcluded((current) => !current)}
      >
        {showExcluded ? "Hide excluded rows" : "View excluded rows"}
      </Button>
      {showExcluded ? <ExcludedRowsTable issues={excludedIssues} onUndo={onUndo} /> : null}
    </div>
  ) : null;

  if (remainingIssues > 0) {
    return (
      <div className="space-y-3" role="status">
        <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-error-70)" }}>
          Validation did not pass
        </p>
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          {remainingIssues.toLocaleString()} issue{remainingIssues === 1 ? "" : "s"} still need attention. Fix values in Schema. Excluded rows are not blockers.
        </p>
        <Button type="button" variant="secondary" size="compact" onClick={onReviewInSchema}>
          Review issues in Schema
        </Button>
        {excludedView}
      </div>
    );
  }

  return (
    <div role="status" className="space-y-3">
      <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-success-70)" }}>
        Validation passed
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <ReviewCell label="Ready rows" value={summary.readyRows.toLocaleString()} />
        <ReviewCell label="Excluded rows" value={summary.skippedRows.toLocaleString()} />
        <ReviewCell label="Resolved" value={summary.resolvedRows.toLocaleString()} />
        <ReviewCell label="Errors" value={summary.invalidRows.toLocaleString()} />
      </dl>
      {excludedView}
    </div>
  );
}

function TableMetadataEditor({
  file,
  conflict,
  embedded,
  onNameChange,
  onDescriptionChange,
  onApplyAiMeta,
}: {
  file: CsvImportFileDraft;
  conflict: boolean;
  embedded?: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onApplyAiMeta: (tableName: string, tableDescription: string) => void;
}) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [pendingMeta, setPendingMeta] = useState<{
    tableName: string;
    tableDescription: string;
  } | null>(null);

  useEffect(() => {
    setPendingMeta(null);
    setAiNotice(null);
  }, [file.id]);

  async function generateTableMeta() {
    if (aiBusy) return;
    setAiBusy(true);
    setAiNotice(null);
    setPendingMeta(null);
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
    if (result.status === "ok") {
      const defaultName = defaultTableNameFromFile(file.fileName);
      const nameCustom =
        file.tableName.trim() !== ""
        && file.tableName.trim() !== result.data.tableName
        && file.tableName.trim() !== defaultName;
      const descCustom =
        file.tableDescription.trim() !== ""
        && file.tableDescription.trim() !== result.data.tableDescription;
      if (nameCustom || descCustom) {
        setPendingMeta(result.data);
        return;
      }
      onApplyAiMeta(result.data.tableName, result.data.tableDescription);
      return;
    }
    setAiNotice(result.message);
  }

  const fields = (
    <div className="space-y-4">
        {!embedded ? (
          <div>
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
              File name
            </p>
            <p className="mt-1 truncate luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }} title={file.fileName}>
              {file.fileName}
            </p>
          </div>
        ) : null}
        <div className="max-w-xl space-y-2">
          <Label htmlFor={`csv-table-name-${file.id}`}>Table name</Label>
          <Input
            id={`csv-table-name-${file.id}`}
            value={file.tableName}
            onChange={(event) => onNameChange(event.target.value)}
            autoComplete="off"
            aria-invalid={conflict || !file.tableName.trim()}
          />
          {conflict ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }}>
              Table names must be unique.
            </p>
          ) : null}
          {!file.tableName.trim() ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }}>
              Enter a table name.
            </p>
          ) : null}
        </div>
        <div className="max-w-xl space-y-2">
          <Label htmlFor={`csv-table-desc-${file.id}`}>Table description</Label>
          <Textarea
            id={`csv-table-desc-${file.id}`}
            value={file.tableDescription}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={3}
            placeholder="Optional description"
          />
        </div>
        <div className="max-w-xl space-y-2">
          <LuxiaAiButton disabled={aiBusy} onClick={() => void generateTableMeta()}>
            {aiBusy
              ? "Generating…"
              : file.tableMetaAiGenerated
                ? "Regenerate with AI"
                : "Generate with AI"}
          </LuxiaAiButton>
          {aiNotice ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
              {aiNotice}
            </p>
          ) : null}
          {pendingMeta ? (
            <div className="space-y-2">
              <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                Replace the current name and description with this suggestion?
              </p>
              <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
                {pendingMeta.tableName}
              </p>
              <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                {pendingMeta.tableDescription}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="compact" onClick={() => setPendingMeta(null)}>
                  Dismiss
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="compact"
                  onClick={() => {
                    onApplyAiMeta(pendingMeta.tableName, pendingMeta.tableDescription);
                    setPendingMeta(null);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        {file.columns.length > 0 ? (
          <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="tertiary" size="compact" className="-ml-1">
                <ChevronDown
                  size={14}
                  strokeWidth={1.75}
                  aria-hidden
                  className={`mr-1.5 transition-transform ${insightsOpen ? "rotate-180" : ""}`}
                />
                Table insights
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="mt-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                From selected column types.
              </p>
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
    </div>
  );

  if (embedded) return fields;
  return (
    <div className={LUXIA_SETTINGS_SECTION_SURFACE_CLASS}>
      <div className="px-4 py-4">{fields}</div>
    </div>
  );
}
