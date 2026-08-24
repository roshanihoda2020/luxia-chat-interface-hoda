import { useMemo, useRef, useState, type DragEvent } from "react";
import { CheckCircle2, FileSpreadsheet, Sparkles, X } from "lucide-react";
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
import { Textarea } from "@/app/components/ui/textarea";
import { STRUCTURED_MODAL_DARK_CHROME_STYLE } from "@/app/features/shared/structuredModalChrome";
import type { CsvColumnDraft, CsvValidationSummary } from "./types";

const STEPS = [
  { id: 1, label: "Upload File" },
  { id: 2, label: "Schema Preview" },
  { id: 3, label: "Validation" },
  { id: 4, label: "Table Description" },
  { id: 5, label: "Confirm & Upload" },
  { id: 6, label: "Completion" },
] as const;

type DelimiterOption = "comma" | "semicolon" | "tab" | "pipe";

const DELIMITER_LABELS: Record<DelimiterOption, string> = {
  comma: "Comma (,)",
  semicolon: "Semicolon (;)",
  tab: "Tab",
  pipe: "Pipe (|)",
};

const MOCK_COLUMNS: CsvColumnDraft[] = [
  {
    id: "col-1",
    name: "Order Id",
    normalizedName: "order_id",
    detectedType: "Integer",
    type: "Integer",
    confidence: 0.98,
    examples: ["1001", "1002", "1003"],
    role: "Identifier",
    suggestedUsage: "Join key",
    notes: "",
  },
  {
    id: "col-2",
    name: "Ordered At",
    normalizedName: "ordered_at",
    detectedType: "Date",
    type: "Date",
    confidence: 0.91,
    examples: ["2024-01-12", "2024-01-13"],
    dateFormat: "YYYY-MM-DD",
    role: "Dimension",
    suggestedUsage: "Time series",
    notes: "",
  },
  {
    id: "col-3",
    name: "Amount",
    normalizedName: "amount",
    detectedType: "Number",
    type: "Number",
    confidence: 0.95,
    examples: ["12.50", "8.00"],
    role: "Measure",
    suggestedUsage: "Revenue metric",
    notes: "",
  },
  {
    id: "col-4",
    name: "Customer Note",
    normalizedName: "customer_note",
    detectedType: "Text",
    type: "Text",
    confidence: 0.88,
    examples: ["Rush", "—", "Gift wrap"],
    warning: "Mixed empty values detected",
    role: "Attribute",
    suggestedUsage: "Optional context",
    notes: "Sparse free-text field",
  },
];

const SAMPLE_ROWS: string[][] = [
  ["1001", "2024-01-12", "12.50", "Rush"],
  ["1002", "2024-01-13", "8.00", "—"],
  ["1003", "2024-01-13", "24.10", "Gift wrap"],
];

function buildValidation(columns: CsvColumnDraft[]): CsvValidationSummary {
  const columnIssues = columns.filter((col) => col.warning).length;
  return {
    validRows: 1184,
    warningRows: columnIssues > 0 ? 16 : 0,
    skippedRows: 0,
    columnIssues,
    clean: columnIssues === 0,
  };
}

function defaultTableNameFromFile(fileName: string): string {
  const base = fileName.replace(/\.csv$/i, "").trim();
  if (!base) return "imported_table";
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "imported_table";
}

export interface CsvImportFlowProps {
  open: boolean;
  sourceName: string;
  ownershipLabel: string;
  onBackToChooser: () => void;
  onCancel: () => void;
  onComplete: (payload: {
    fileName: string;
    tableName: string;
    tableDescription: string;
    delimiter: DelimiterOption;
    importedRows: number;
    skippedRows: number;
    openSettings?: boolean;
  }) => void;
}

export function CsvImportFlow({
  open,
  sourceName,
  ownershipLabel,
  onBackToChooser,
  onCancel,
  onComplete,
}: CsvImportFlowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [structuralNote, setStructuralNote] = useState<string | null>(null);
  const [delimiter, setDelimiter] = useState<DelimiterOption>("comma");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [columns, setColumns] = useState<CsvColumnDraft[]>(MOCK_COLUMNS);
  const [tableName, setTableName] = useState("imported_table");
  const [tableDescription, setTableDescription] = useState("");
  const [validationRan, setValidationRan] = useState(false);
  const [aiAssistUsed, setAiAssistUsed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const validation = useMemo(() => buildValidation(columns), [columns]);

  function resetFile() {
    setFileName(null);
    setStructuralNote(null);
    setValidationRan(false);
    setImportDone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function acceptFile(file: File | undefined | null) {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv")) {
      setStructuralNote("Only CSV files are accepted.");
      return;
    }
    const nextName = file.name || "sample_data.csv";
    setFileName(nextName);
    setStructuralNote("Line endings normalized · Header row detected");
    setColumns(MOCK_COLUMNS.map((col) => ({ ...col })));
    setTableName(defaultTableNameFromFile(nextName));
    setTableDescription("");
    setValidationRan(false);
    setAiAssistUsed(false);
    setImportDone(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  function runAiAssist() {
    setAiAssistUsed(true);
    setTableDescription(
      "Order-level transactional extract with identifiers, order dates, amounts, and optional customer notes. Suitable for revenue trends and order detail lookups.",
    );
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        notes:
          col.notes
          || (col.role === "Measure"
            ? "Numeric amount suitable for aggregation"
            : col.role === "Identifier"
              ? "Stable key for joins"
              : col.notes),
        suggestedUsage:
          col.suggestedUsage
          || (col.type === "Date" ? "Time dimension" : col.suggestedUsage),
      })),
    );
  }

  function runValidation() {
    setValidationRan(true);
  }

  function primaryLabel() {
    if (step === 3 && !validationRan) return "Run Validation";
    if (step === 5) return importing ? "Uploading…" : "Confirm & Upload";
    if (step === 6) return "Done";
    return "Next";
  }

  function canAdvance() {
    if (step === 1) return Boolean(fileName);
    if (step === 3) return validationRan && validation.skippedRows === 0;
    if (step === 4) return Boolean(tableName.trim());
    if (step === 5) return !importing && Boolean(tableName.trim());
    return true;
  }

  function finish(openSettings?: boolean) {
    onComplete({
      fileName: fileName ?? "sample_data.csv",
      tableName: tableName.trim() || "imported_table",
      tableDescription: tableDescription.trim(),
      delimiter,
      importedRows: validation.validRows + validation.warningRows,
      skippedRows: validation.skippedRows,
      openSettings,
    });
  }

  function handlePrimary() {
    if (step === 3 && !validationRan) {
      runValidation();
      return;
    }
    if (step === 5) {
      if (importing || importDone) return;
      setImporting(true);
      window.setTimeout(() => {
        setImporting(false);
        setImportDone(true);
        setStep(6);
      }, 650);
      return;
    }
    if (step === 6) {
      finish(false);
      return;
    }
    setStep((current) => Math.min(current + 1, 6));
  }

  function handleBack() {
    if (step === 1) {
      onBackToChooser();
      return;
    }
    if (step === 6) return;
    if (importing) return;
    setStep((current) => Math.max(current - 1, 1));
  }

  const statusTone = !validationRan
    ? "neutral"
    : validation.clean
      ? "success"
      : validation.skippedRows > 0
        ? "danger"
        : "warning";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent
        hideCloseButton
        className="flex h-[min(92vh,52rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
      >
        <DialogHeader
          className="shrink-0 space-y-1 px-6 py-4 text-left"
          style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
        >
          <DialogTitle
            className="text-left"
            style={{ color: "var(--luxia-text-inverse)" }}
          >
            Import CSV
          </DialogTitle>
          <DialogDescription
            className="mt-1 text-left"
            style={{ color: "var(--luxia-purple-10)" }}
          >
            {sourceName} · {ownershipLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row md:items-stretch">
          <nav
            className="luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical shrink-0 px-4 py-4 md:flex md:w-52 md:min-h-0 md:flex-col md:self-stretch md:overflow-y-auto"
            style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
            aria-label="CSV import steps"
          >
            <ol className="flex gap-2 overflow-x-auto md:flex-col md:gap-1">
              {STEPS.map((item) => {
                const active = item.id === step;
                const done = item.id < step || (item.id === 6 && importDone);
                return (
                  <li key={item.id} className="shrink-0 md:shrink">
                    <div
                      className={`rounded-[6px] px-2.5 py-2 luxia-type-caption whitespace-nowrap md:whitespace-normal ${
                        active ? "luxia-type-body-dense-strong" : ""
                      }`}
                      style={{
                        color: active
                          ? "var(--luxia-text-inverse)"
                          : "var(--luxia-opacity-white-80)",
                        background: active
                          ? "var(--luxia-opacity-white-16)"
                          : "transparent",
                      }}
                      aria-current={active ? "step" : undefined}
                    >
                      <span className="tabular-nums opacity-70">
                        {String(item.id).padStart(2, "0")}
                      </span>{" "}
                      {item.label}
                      {done ? <span className="sr-only"> (completed)</span> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--luxia-surface)] md:shadow-[inset_4px_4px_6px_-3px_var(--luxia-opacity-black-08)]">
          <div className="luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                    Upload File
                  </h3>
                  <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
                    Upload a CSV for this Data Source. Name and ownership were set when choosing the type.
                  </p>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Data Source name
                    </dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {sourceName}
                    </dd>
                  </div>
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Access
                    </dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {ownershipLabel}
                      <span className="mt-0.5 block luxia-type-caption text-[var(--luxia-text-muted)]">
                        Private sources stay owner-only until Access Levels grant others.
                      </span>
                    </dd>
                  </div>
                </dl>

                <div className="max-w-xs space-y-2">
                  <Label htmlFor="csv-delimiter">Delimiter</Label>
                  <select
                    id="csv-delimiter"
                    className="h-9 w-full rounded-[6px] border bg-transparent px-3 luxia-type-body-dense"
                    style={{ borderColor: "var(--luxia-border-subtle)" }}
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value as DelimiterOption)}
                  >
                    {(Object.keys(DELIMITER_LABELS) as DelimiterOption[]).map((key) => (
                      <option key={key} value={key}>
                        {DELIMITER_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Drop CSV file here or browse"
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className="rounded-[var(--luxia-radius-control)] border border-dashed px-4 py-10 text-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                  style={{
                    borderColor: dragActive
                      ? "var(--luxia-border-focus)"
                      : "var(--luxia-border-subtle)",
                    background: "var(--luxia-surface-muted)",
                  }}
                >
                  <FileSpreadsheet
                    className="mx-auto mb-3"
                    size={28}
                    strokeWidth={1.5}
                    aria-hidden
                    style={{ color: "var(--luxia-text-secondary)" }}
                  />
                  <p className="luxia-type-body-dense text-[var(--luxia-text-primary)]">
                    Drag and drop a CSV file here
                  </p>
                  <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
                    CSV only · click to browse
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={(e) => acceptFile(e.target.files?.[0])}
                  />
                </div>

                {fileName ? (
                  <div
                    className="flex items-center justify-between gap-3 rounded-[var(--luxia-radius-control)] border px-3 py-2.5"
                    style={{ borderColor: "var(--luxia-border-subtle)" }}
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span
                        className="mt-0.5 inline-flex shrink-0 items-center rounded-[6px] px-2 py-0.5 luxia-type-caption"
                        style={{
                          background: "var(--luxia-surface-muted)",
                          color: "var(--luxia-text-secondary)",
                        }}
                      >
                        CSV
                      </span>
                      <div className="min-w-0">
                        <p className="truncate luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                          {fileName}
                        </p>
                        {structuralNote ? (
                          <p className="mt-0.5 luxia-type-caption text-[var(--luxia-text-secondary)]">
                            {structuralNote}
                          </p>
                        ) : (
                          <p className="mt-0.5 luxia-type-caption text-[var(--luxia-text-secondary)]">
                            No structural issues detected
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="tertiary"
                      size="compact"
                      aria-label="Remove selected file"
                      onClick={resetFile}
                    >
                      <X size={16} aria-hidden />
                      Remove
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                      Schema Preview
                    </h3>
                    <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Review columns, inferred types, and sample values before validation.
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 luxia-type-caption"
                    style={{
                      borderColor: "var(--luxia-border-subtle)",
                      color: "var(--luxia-text-secondary)",
                    }}
                  >
                    <FileSpreadsheet size={14} strokeWidth={1.75} aria-hidden />
                    {fileName}
                  </span>
                </div>

                <div
                  className="overflow-x-auto rounded-[var(--luxia-radius-control)] border"
                  style={{ borderColor: "var(--luxia-border-subtle)" }}
                >
                  <table className="w-full min-w-[48rem] border-collapse text-left">
                    <thead>
                      <tr className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                        <th className="px-3 py-2 font-normal">Original</th>
                        <th className="px-3 py-2 font-normal">Normalized</th>
                        <th className="px-3 py-2 font-normal">Type</th>
                        <th className="px-3 py-2 font-normal">Confidence</th>
                        <th className="px-3 py-2 font-normal">Examples</th>
                        <th className="px-3 py-2 font-normal">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col) => (
                        <tr
                          key={col.id}
                          className="border-t luxia-type-body-dense"
                          style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                        >
                          <td className="px-3 py-2.5 text-[var(--luxia-text-primary)]">
                            {col.name}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--luxia-text-secondary)]">
                            {col.normalizedName ?? col.name}
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              aria-label={`Type for ${col.name}`}
                              className="h-8 rounded-[6px] border bg-transparent px-2 luxia-type-caption"
                              style={{ borderColor: "var(--luxia-border-subtle)" }}
                              value={col.type}
                              onChange={(e) => {
                                const type = e.target.value;
                                setColumns((prev) =>
                                  prev.map((item) =>
                                    item.id === col.id ? { ...item, type } : item,
                                  ),
                                );
                                setValidationRan(false);
                              }}
                            >
                              {["Integer", "Number", "Text", "Date", "Boolean"].map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                            {col.type === "Date" && col.dateFormat ? (
                              <p className="mt-1 luxia-type-caption text-[var(--luxia-text-muted)]">
                                Format: {col.dateFormat}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-[var(--luxia-text-secondary)]">
                            {Math.round(col.confidence * 100)}%
                          </td>
                          <td className="max-w-[12rem] truncate px-3 py-2.5 text-[var(--luxia-text-secondary)]">
                            {col.examples.join(", ")}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--luxia-text-secondary)]">
                            {col.warning ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <p className="mb-2 luxia-type-caption text-[var(--luxia-text-secondary)]">
                    Sample rows (first 3)
                  </p>
                  <div
                    className="overflow-x-auto rounded-[var(--luxia-radius-control)] border"
                    style={{ borderColor: "var(--luxia-border-subtle)" }}
                  >
                    <table className="w-full min-w-[36rem] border-collapse text-left">
                      <thead>
                        <tr className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                          {columns.map((col) => (
                            <th key={col.id} className="px-3 py-2 font-normal">
                              {col.normalizedName ?? col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SAMPLE_ROWS.map((row, index) => (
                          <tr
                            key={index}
                            className="border-t luxia-type-body-dense text-[var(--luxia-text-primary)]"
                            style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                          >
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-3 py-2">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="compact"
                    onClick={() => setAdvancedOpen((value) => !value)}
                  >
                    {advancedOpen ? "Hide advanced options" : "Advanced options"}
                  </Button>
                  {advancedOpen ? (
                    <p className="mt-2 luxia-type-caption text-[var(--luxia-text-muted)]">
                      Delimiter: {DELIMITER_LABELS[delimiter]} · Header row: Yes · Encoding: UTF-8
                      (prototype defaults).
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                      Validation
                    </h3>
                    <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Check structural readiness before describing the table.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    onClick={runValidation}
                  >
                    Run Validation
                  </Button>
                </div>

                {!validationRan ? (
                  <div
                    className="rounded-[var(--luxia-radius-control)] border px-4 py-3"
                    style={{
                      borderColor: "var(--luxia-border-subtle)",
                      background: "var(--luxia-surface-muted)",
                    }}
                    role="status"
                  >
                    <p className="luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      Validation has not been run yet
                    </p>
                    <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Run Validation to review row quality and column notes.
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className="rounded-[var(--luxia-radius-control)] border px-4 py-3"
                      style={{
                        borderColor: "var(--luxia-border-subtle)",
                        background: "var(--luxia-surface-muted)",
                      }}
                      role="status"
                    >
                      <p className="luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                        {statusTone === "success"
                          ? "Valid — ready to continue"
                          : statusTone === "warning"
                            ? "Issues found — warnings only"
                            : "Blocked — skipped rows require attention"}
                      </p>
                      <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
                        {validation.validRows.toLocaleString()} valid ·{" "}
                        {validation.warningRows.toLocaleString()} warnings ·{" "}
                        {validation.skippedRows.toLocaleString()} skipped ·{" "}
                        {validation.columnIssues} column note
                        {validation.columnIssues === 1 ? "" : "s"}
                      </p>
                      {structuralNote ? (
                        <p className="mt-2 luxia-type-caption text-[var(--luxia-text-secondary)]">
                          Cleanup applied: {structuralNote}
                        </p>
                      ) : null}
                    </div>
                    {columns.some((col) => col.warning) ? (
                      <ul className="space-y-2">
                        {columns
                          .filter((col) => col.warning)
                          .map((col) => (
                            <li
                              key={col.id}
                              className="rounded-[var(--luxia-radius-control)] border px-3 py-2 luxia-type-body-dense"
                              style={{ borderColor: "var(--luxia-border-subtle)" }}
                            >
                              <span className="text-[var(--luxia-text-primary)]">
                                {col.normalizedName ?? col.name}
                              </span>
                              <span className="text-[var(--luxia-text-secondary)]">
                                {" "}
                                — {col.warning}
                              </span>
                            </li>
                          ))}
                      </ul>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                      Table Description
                    </h3>
                    <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Name the imported table and capture column insights for later Constellation use.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    onClick={runAiAssist}
                  >
                    <Sparkles size={14} strokeWidth={1.75} aria-hidden className="mr-1.5" />
                    {aiAssistUsed ? "Refresh AI Assist" : "AI Assist"}
                  </Button>
                </div>

                <div className="max-w-xl space-y-2">
                  <Label htmlFor="csv-table-name">Table name</Label>
                  <Input
                    id="csv-table-name"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className="max-w-xl space-y-2">
                  <Label htmlFor="csv-table-summary">Table summary</Label>
                  <Textarea
                    id="csv-table-summary"
                    value={tableDescription}
                    onChange={(e) => setTableDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe what this table represents…"
                  />
                  <p className="luxia-type-caption text-[var(--luxia-text-muted)]">
                    Optional. AI Assist drafts a summary you can edit.
                  </p>
                </div>

                <div
                  className="overflow-x-auto rounded-[var(--luxia-radius-control)] border"
                  style={{ borderColor: "var(--luxia-border-subtle)" }}
                >
                  <table className="w-full min-w-[44rem] border-collapse text-left">
                    <thead>
                      <tr className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                        <th className="px-3 py-2 font-normal">Column</th>
                        <th className="px-3 py-2 font-normal">Role / insight</th>
                        <th className="px-3 py-2 font-normal">Suggested usage</th>
                        <th className="px-3 py-2 font-normal">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col) => (
                        <tr
                          key={col.id}
                          className="border-t luxia-type-body-dense"
                          style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                        >
                          <td className="px-3 py-2.5 text-[var(--luxia-text-primary)]">
                            {col.normalizedName ?? col.name}
                            <span className="mt-0.5 block luxia-type-caption text-[var(--luxia-text-muted)]">
                              {col.type}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--luxia-text-secondary)]">
                            {col.role ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--luxia-text-secondary)]">
                            {col.suggestedUsage ?? "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              aria-label={`Notes for ${col.name}`}
                              className="h-8 w-full min-w-[10rem] rounded-[6px] border bg-transparent px-2 luxia-type-caption"
                              style={{ borderColor: "var(--luxia-border-subtle)" }}
                              value={col.notes ?? ""}
                              onChange={(e) => {
                                const notes = e.target.value;
                                setColumns((prev) =>
                                  prev.map((item) =>
                                    item.id === col.id ? { ...item, notes } : item,
                                  ),
                                );
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                    Confirm & Upload
                  </h3>
                  <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
                    Review the import summary, then confirm to create this Data Source.
                  </p>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">File</dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {fileName}
                    </dd>
                  </div>
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Table name
                    </dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {tableName.trim() || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Rows to import
                    </dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {(validation.validRows + validation.warningRows).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Rows skipped
                    </dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {validation.skippedRows.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Delimiter
                    </dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {DELIMITER_LABELS[delimiter]}
                    </dd>
                  </div>
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Readiness
                    </dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {validation.clean ? "Valid" : "Valid with warnings"}
                    </dd>
                  </div>
                  {tableDescription.trim() ? (
                    <div className="sm:col-span-2">
                      <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                        Table summary
                      </dt>
                      <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                        {tableDescription.trim()}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                {importing ? (
                  <p className="luxia-type-caption text-[var(--luxia-text-secondary)]" role="status">
                    Uploading and creating the Data Source…
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 6 ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={22}
                    strokeWidth={1.75}
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--luxia-text-primary)" }}
                    aria-hidden
                  />
                  <div>
                    <h3 className="luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                      Import complete
                    </h3>
                    <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
                      {sourceName} is ready in your Data Sources library.
                    </p>
                  </div>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Imported
                    </dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {(validation.validRows + validation.warningRows).toLocaleString()} rows
                    </dd>
                  </div>
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Table
                    </dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {tableName.trim() || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      Skipped
                    </dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {validation.skippedRows.toLocaleString()} rows
                    </dd>
                  </div>
                  <div>
                    <dt className="luxia-type-caption text-[var(--luxia-text-secondary)]">File</dt>
                    <dd className="mt-1 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {fileName}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    onClick={() => finish(true)}
                  >
                    Open Data Source Settings
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

        <DialogFooter
          className="shrink-0 justify-between border-t px-6 py-4"
          style={{ borderColor: "var(--luxia-border-subtle)" }}
        >
          <Button
            type="button"
            variant="secondary"
            size="compact"
            disabled={step === 6 || importing}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            size="compact"
            disabled={!canAdvance()}
            onClick={handlePrimary}
          >
            {primaryLabel()}
          </Button>
        </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
