import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import { CsvFileGlyph } from "./DataSourceTypeIcon";
import {
  CSV_COLUMN_TYPES,
  CSV_ENCODING_LABELS,
  CSV_DELIMITER_LABELS,
  columnTypeConfidence,
  csvColumnTypeLabel,
  csvHeaderConfigFor,
  csvHeaderSummaryLabel,
  csvFileNotices,
  selectedColumnType,
  valueMatchesType,
  type CsvImportFileDraft,
} from "./csv";
import type { CsvColumnDraft, CsvValidationIssue, CsvValidationSummary } from "./types";

export const EXCLUDE_ROW_HINT =
  "Exclude this row from import. You can restore it before creating the Data Source.";
export const SCHEMA_PREVIEW_ROW_LIMIT = 20;

type IssueResolution = "open" | "skipped" | "resolved";
export type DisplayCsvIssue = CsvValidationIssue & { resolution: IssueResolution };

function truncateCsvCell(value: string, max = 36): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, Math.max(1, max - 1))}…`;
}

export function issueRowSurface(resolution: IssueResolution): {
  background: string;
  statusLabel: string;
  statusColor: string;
} {
  if (resolution === "skipped") {
    return {
      background: "var(--luxia-warning-10)",
      statusLabel: "Excluded",
      statusColor: "var(--luxia-warning-90)",
    };
  }
  if (resolution === "resolved") {
    return {
      background: "var(--luxia-success-10)",
      statusLabel: "Resolved",
      statusColor: "var(--luxia-success-70)",
    };
  }
  return {
    background: "var(--luxia-opacity-error-08)",
    statusLabel: "Error",
    statusColor: "var(--luxia-error-70)",
  };
}

export function ExcludeRowButton({
  onExclude,
  variant = "secondary",
}: {
  onExclude: () => void;
  variant?: "secondary" | "outline";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size="compact"
          onClick={onExclude}
          aria-label={`Exclude row. ${EXCLUDE_ROW_HINT}`}
        >
          Exclude
        </Button>
      </TooltipTrigger>
      <TooltipContent>{EXCLUDE_ROW_HINT}</TooltipContent>
    </Tooltip>
  );
}

function SchemaExcludeAction({
  rowNumber,
  onExclude,
}: {
  rowNumber: number;
  onExclude: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="luxia-csv-schema-exclude luxia-csv-text-action luxia-csv-text-action--inline"
          aria-label={`Exclude row ${rowNumber}`}
          onClick={onExclude}
        >
          Exclude
        </button>
      </TooltipTrigger>
      <TooltipContent className="!z-[80]">{EXCLUDE_ROW_HINT}</TooltipContent>
    </Tooltip>
  );
}

function SchemaRowEditorStrip({
  expected,
  value,
  error,
  onChange,
  onSave,
  onCancel,
}: {
  expected: string;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex min-w-0 w-full flex-col gap-1.5 px-3 py-2">
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
        Expected: {expected || "value"}
      </p>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSave();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
          autoComplete="off"
          aria-label="Edit value"
          aria-invalid={Boolean(error)}
          className="h-9 min-h-9 min-w-[12rem] flex-1"
          autoFocus
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" size="compact" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="compact" onClick={onSave}>
            Save & validate
          </Button>
        </div>
      </div>
      {error ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function similarIssueGroups(issues: DisplayCsvIssue[]): Array<{
  columnId: string;
  columnName: string;
  expected: string;
  issues: DisplayCsvIssue[];
}> {
  const open = issues.filter((issue) => issue.resolution === "open");
  const byColumn = new Map<string, DisplayCsvIssue[]>();
  for (const issue of open) {
    const list = byColumn.get(issue.columnId) ?? [];
    list.push(issue);
    byColumn.set(issue.columnId, list);
  }
  return [...byColumn.entries()]
    .map(([columnId, columnIssues]) => ({
      columnId,
      columnName: columnIssues[0]?.columnName ?? "",
      expected: columnIssues[0]?.expected ?? "",
      issues: columnIssues,
    }))
    .filter((group) => group.issues.length >= 2);
}

export function primaryIssueColumn(
  issues: CsvValidationIssue[],
): { columnId: string; columnName: string; count: number } | null {
  const byColumn = new Map<string, { name: string; rows: Set<number> }>();
  for (const issue of issues) {
    const current = byColumn.get(issue.columnId) ?? { name: issue.columnName, rows: new Set<number>() };
    current.rows.add(issue.rowNumber);
    byColumn.set(issue.columnId, current);
  }
  let top: { columnId: string; columnName: string; count: number } | null = null;
  for (const [columnId, item] of byColumn) {
    if (!top || item.rows.size > top.count) {
      top = { columnId, columnName: item.name, count: item.rows.size };
    }
  }
  return top;
}

export function schemaPreviewRows(
  records: Array<{ rowNumber: number; fields: string[] }>,
  issueRowNumbers: ReadonlySet<number>,
  options: { issuesOnly?: boolean; limit?: number } = {},
): Array<{ rowNumber: number; fields: string[] }> {
  const limit = options.limit ?? SCHEMA_PREVIEW_ROW_LIMIT;
  if (options.issuesOnly) {
    return records.filter((record) => issueRowNumbers.has(record.rowNumber));
  }
  if (records.length <= limit) return records;
  return records.slice(0, limit);
}

export function schemaIssueAttentionCopy(count: number): string {
  if (count === 1) return "1 issue needs attention";
  return `${count.toLocaleString()} issues need attention`;
}

export function schemaIssueViewActionLabel(count: number, issuesOnly: boolean): string {
  if (issuesOnly) return "Show all rows";
  if (count === 1) return "Show issue";
  return `View ${count.toLocaleString()} issues`;
}

function schemaDataColumnTrack(column: CsvColumnDraft, index: number, total: number): string {
  const type = selectedColumnType(column);
  const name = column.name.trim().toLowerCase();
  if (type === "Date" || type === "Timestamp" || /date|time|timestamp/.test(name)) return "minmax(180px, 1.15fr)";
  if (/host|server|machine/.test(name)) return "minmax(180px, 1.1fr)";
  if (/service/.test(name)) return "minmax(110px, 0.7fr)";
  if (index === total - 1 || /content|message|log|text/.test(name)) return "minmax(220px, 1.6fr)";
  return "minmax(140px, 1fr)";
}

function schemaGridTemplate(columns: CsvColumnDraft[]): string {
  const tracks = columns.map((column, index) => schemaDataColumnTrack(column, index, columns.length));
  return `56px ${tracks.join(" ")} 96px`;
}

function validExamplesForColumn(file: CsvImportFileDraft, columnId: string): string[] {
  const index = file.columns.findIndex((column) => column.id === columnId);
  const column = file.columns[index];
  if (index < 0 || !column) return [];
  const expected = selectedColumnType(column);
  const skipped = new Set(file.skipped);
  const examples: string[] = [];
  const seen = new Set<string>();
  for (const record of file.parsed?.records ?? []) {
    if (skipped.has(record.rowNumber)) continue;
    const value = (file.overrides[record.rowNumber]?.[column.id] ?? record.fields[index] ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (!value || seen.has(value) || !valueMatchesType(value, expected)) continue;
    seen.add(value);
    examples.push(value);
    if (examples.length >= 5) break;
  }
  return examples;
}

function isGeneratedFallbackName(file: CsvImportFileDraft, column: CsvColumnDraft): boolean {
  const name = column.name.trim();
  if (!/^Column \d+$/.test(name)) return false;
  if (column.originalName && column.originalName !== column.name) return false;
  if (file.headerMode === "none") return true;
  return (file.parsed?.issues ?? []).some((issue) => issue.message.includes("Column names were generated"));
}

export function ColumnNameEditor({
  name,
  originalName,
  describedBy,
  onSave,
}: {
  name: string;
  originalName?: string;
  describedBy?: string;
  onSave: (nextName: string) => string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const original = originalName && originalName !== name ? originalName : null;

  useEffect(() => {
    setDraft(name);
    setError(null);
    setEditing(false);
  }, [name]);

  useLayoutEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [editing]);

  function cancel() {
    setDraft(name);
    setError(null);
    setEditing(false);
  }

  function save() {
    const message = onSave(draft);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="min-w-0">
        <button
          type="button"
          className="luxia-csv-editable-text luxia-type-body-dense-strong max-w-full truncate rounded-[4px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: "var(--luxia-text-primary)" }}
          title={name}
          aria-label={`Rename ${name} column`}
          aria-describedby={describedBy}
          onClick={() => {
            setDraft(name);
            setError(null);
            setEditing(true);
          }}
        >
          {name}
        </button>
      </div>
    );
  }

  return (
    <div className="luxia-csv-column-rename-block">
      <div className="luxia-csv-column-rename">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              save();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              cancel();
            }
          }}
          autoComplete="off"
          aria-label={`Rename ${name} column`}
          aria-invalid={Boolean(error)}
          className="luxia-csv-column-rename-field h-7 min-h-7 w-auto"
        />
        <div className="luxia-csv-column-rename-actions">
          <Button type="button" variant="secondary" size="compact" className="h-7 min-h-7 px-2" onClick={save}>
            Save
          </Button>
          <Button type="button" variant="outline" size="compact" className="h-7 min-h-7 px-2" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </div>
      {error ? (
        <p className="luxia-csv-column-rename-note" style={{ color: "var(--luxia-error-70)" }} role="alert">
          {error}
        </p>
      ) : original ? (
        <p className="luxia-csv-column-rename-note truncate" style={{ color: "var(--luxia-text-muted)" }} title={`Original: ${original}`}>
          Original: {original}
        </p>
      ) : null}
    </div>
  );
}

function evidenceValues(file: CsvImportFileDraft, column: CsvColumnDraft): string[] {
  const index = file.columns.findIndex((item) => item.id === column.id);
  if (index < 0) return [];
  const skipped = new Set(file.skipped);
  return (file.parsed?.records ?? [])
    .filter((record) => !skipped.has(record.rowNumber))
    .map((record) => file.overrides[record.rowNumber]?.[column.id] ?? record.fields[index] ?? "");
}

export function ColumnStructureTable({
  file,
  suggestions = [],
  onTypeChange,
  onConfirmType,
  onRenameColumn,
  onUseSuggestion,
}: {
  file: CsvImportFileDraft;
  suggestions?: Array<{ columnId: string; suggestedType: string }>;
  onTypeChange: (columnId: string, type: string) => void;
  onConfirmType: (columnId: string) => void;
  onRenameColumn: (columnId: string, nextName: string) => string | null;
  onUseSuggestion?: (columnId: string, type: string) => void;
}) {
  const rowCount = file.parsed?.records.length ?? 0;
  const columnCount = file.columns.length;
  const notices = csvFileNotices(file).filter((issue) => issue.severity !== "info");
  const suggestionByColumn = new Map(suggestions.map((item) => [item.columnId, item.suggestedType]));
  return (
    <div className="luxia-csv-file-section min-w-0">
      <div className="luxia-csv-file-heading">
        <CsvFileGlyph />
        <div className="min-w-0">
          <p className="luxia-type-body-dense-strong truncate" style={{ color: "var(--luxia-text-primary)" }} title={file.fileName}>
            {file.fileName}
          </p>
          <p className="mt-0.5 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            {`${rowCount.toLocaleString()} ${rowCount === 1 ? "row" : "rows"} · ${columnCount.toLocaleString()} ${columnCount === 1 ? "column" : "columns"}`}
          </p>
        </div>
      </div>
      {notices.map((issue) => (
          <p
            key={`${issue.severity}-${issue.message}`}
            className="luxia-csv-file-note"
            data-severity={issue.severity}
            role="status"
          >
            {issue.message}
          </p>
        ))}
      {file.columns.length === 0 ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          No columns were found in this file.
        </p>
      ) : (
        <div className="luxia-settings-table-surface overflow-x-auto">
          <table className="luxia-csv-structure-table w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                <th scope="col" className="px-3 py-2 font-normal">Column</th>
                <th scope="col" className="px-3 py-2 font-normal">Type</th>
                <th scope="col" className="px-3 py-2 font-normal">Confidence</th>
                <th scope="col" className="px-3 py-2 font-normal">Examples</th>
              </tr>
            </thead>
            <tbody>
              {file.columns.map((column) => {
                const type = selectedColumnType(column);
                const needsConfirm = column.status === "needs-review";
                const confidence = columnTypeConfidence(evidenceValues(file, column), type, needsConfirm);
                const examples = column.examples.filter(Boolean).slice(0, 3).join(", ") || "—";
                const suggestion = suggestionByColumn.get(column.id);
                const format = (type === "Date" || type === "Timestamp") ? column.dateFormat : undefined;
                return (
                  <tr
                    key={column.id}
                    className="border-t"
                    style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                  >
                    <th scope="row" className="px-3 py-2 align-middle font-normal">
                      <ColumnNameEditor
                        name={column.name}
                        originalName={column.originalName}
                        onSave={(nextName) => onRenameColumn(column.id, nextName)}
                      />
                    </th>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex flex-nowrap items-center gap-2">
                        <Select
                          key={`${file.id}:${column.id}:type:${column.type}`}
                          value={type}
                          onValueChange={(value) => {
                            if (value === column.type) return;
                            onTypeChange(column.id, value);
                          }}
                        >
                          <SelectTrigger size="sm" aria-label={`Type for ${column.name}`} className="h-8 min-h-8 w-[9.5rem]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="!z-[80]">
                            {CSV_COLUMN_TYPES.map((option) => (
                              <SelectItem key={option} value={option}>
                                {csvColumnTypeLabel(option)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {format ? (
                          <span className="luxia-csv-format-chip" title={format}>{format}</span>
                        ) : null}
                        {needsConfirm ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="compact"
                            className="h-8 min-h-8 w-fit px-2"
                            aria-label={`Accept ${csvColumnTypeLabel(type)} type for ${column.name} column`}
                            onClick={() => onConfirmType(column.id)}
                          >
                            Accept type
                          </Button>
                        ) : null}
                      </div>
                    </td>
                    <td className="luxia-csv-confidence px-3 py-2 align-middle">
                      <p
                        className="luxia-csv-confidence-status"
                        data-warning={confidence.label === "Needs confirmation" ? "true" : undefined}
                      >
                        {confidence.label}
                      </p>
                      {confidence.detail || (suggestion && suggestion !== type) ? (
                        <p className="luxia-csv-confidence-meta">
                          {confidence.detail ? <span>{confidence.detail}</span> : null}
                          {confidence.detail && suggestion && suggestion !== type ? <span aria-hidden="true"> · </span> : null}
                          {suggestion && suggestion !== type ? (
                            <span>{`Suggested: ${csvColumnTypeLabel(suggestion)}`}</span>
                          ) : null}
                          {suggestion && suggestion !== type && onUseSuggestion ? (
                            <button
                              type="button"
                              className="luxia-csv-confidence-use luxia-csv-text-action luxia-csv-text-action--inline"
                              onClick={() => onUseSuggestion(column.id, suggestion)}
                            >
                              Use type
                            </button>
                          ) : null}
                        </p>
                      ) : null}
                    </td>
                    <td className="luxia-csv-structure-examples max-w-[16rem] truncate px-3 py-2 align-middle" title={examples}>
                      {examples}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function SchemaDataPreview({
  file,
  live,
  focusedColumnId,
  onTypeChange,
  onConfirmType,
  onRenameColumn,
  onSaveFix,
  onSaveFixes,
  onExclude,
  onUndo,
  inlinePreview = true,
}: {
  file: CsvImportFileDraft;
  live: CsvValidationSummary;
  focusedColumnId: string | null;
  onTypeChange: (columnId: string, type: string) => void;
  onConfirmType: (columnId: string) => void;
  onRenameColumn: (columnId: string, nextName: string) => string | null;
  onSaveFix: (issue: CsvValidationIssue, value: string) => string | null;
  onSaveFixes: (fixes: Array<{ issue: CsvValidationIssue; value: string }>) => string | null;
  onExclude: (rowNumber: number) => void;
  onUndo: (rowNumber: number) => void;
  /** When false, the data grid opens only from Expand table. */
  inlinePreview?: boolean;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollMemory = useRef({ left: 0, top: 0 });
  const firstIssueCellRef = useRef<HTMLButtonElement | null>(null);
  const [editedRows, setEditedRows] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    setIssuesOnly(false);
    setExpanded(false);
    setEditingKey(null);
    setEditingDraft("");
    setEditingError(null);
    setEditedRows(new Set());
  }, [file.id]);

  useEffect(() => {
    if (editedRows.size === 0) return;
    const timer = globalThis.setTimeout(() => setEditedRows(new Set()), 4000);
    return () => globalThis.clearTimeout(timer);
  }, [editedRows]);

  const skipped = useMemo(() => new Set(file.skipped), [file.skipped]);
  const invalidRowNumbers = useMemo(
    () => new Set(live.issues.map((issue) => issue.rowNumber)),
    [live.issues],
  );
  const records = file.parsed?.records ?? [];
  const issueCount = live.issues.length;
  const viewingIssues = issuesOnly && issueCount > 0;
  const rows = schemaPreviewRows(records, invalidRowNumbers, {
    issuesOnly: viewingIssues,
  });
  const previewCount = Math.min(SCHEMA_PREVIEW_ROW_LIMIT, records.length);
  const firstIssueKey = live.issues[0]
    ? `${live.issues[0].rowNumber}:${live.issues[0].columnId}`
    : null;
  const issueByCell = useMemo(
    () => new Map(live.issues.map((issue) => [`${issue.rowNumber}:${issue.columnId}`, issue])),
    [live.issues],
  );
  const issueCountByColumn = useMemo(() => {
    const counts = new Map<string, number>();
    for (const issue of live.issues) {
      counts.set(issue.columnId, (counts.get(issue.columnId) ?? 0) + 1);
    }
    return counts;
  }, [live.issues]);
  useEffect(() => {
    if (issueCount === 0) setIssuesOnly(false);
  }, [issueCount]);

  useLayoutEffect(() => {
    if (!viewingIssues) return;
    firstIssueCellRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [viewingIssues, file.id, firstIssueKey]);

  const editingIssue = editingKey ? issueByCell.get(editingKey) : undefined;

  function startEdit(cellKey: string, currentValue: string) {
    setEditingKey(cellKey);
    setEditingDraft(currentValue);
    setEditingError(null);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditingDraft("");
    setEditingError(null);
  }

  function captureScroll() {
    const node = scrollRef.current;
    if (!node) return;
    scrollMemory.current = { left: node.scrollLeft, top: node.scrollTop };
  }

  function openExpanded() {
    captureScroll();
    setExpanded(true);
  }

  function closeExpanded() {
    captureScroll();
    setExpanded(false);
  }

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollLeft = scrollMemory.current.left;
    node.scrollTop = scrollMemory.current.top;
  }, [expanded]);

  function saveEdit() {
    if (!editingIssue) {
      cancelEdit();
      return;
    }
    const message = onSaveFix(editingIssue, editingDraft);
    if (message) {
      setEditingError(message);
      return;
    }
    setEditedRows((current) => {
      const nextRows = new Set(current);
      nextRows.add(editingIssue.rowNumber);
      return nextRows;
    });
    cancelEdit();
  }

  const workspace = (
    <div className={cn("flex min-w-0 flex-col gap-2", expanded && "min-h-0 flex-1")}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="min-w-0 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          {`Previewing ${previewCount.toLocaleString()} sample row${previewCount === 1 ? "" : "s"} of ${records.length.toLocaleString()} total rows`}
        </p>
        {file.columns.length > 0 && !expanded ? (
          <Button
            type="button"
            variant="secondary"
            size="compact"
            className="h-7 min-h-7 shrink-0 gap-1.5 px-2"
            aria-label="Expand Schema table"
            onClick={openExpanded}
          >
            <Maximize2 size={14} aria-hidden />
            Expand table
          </Button>
        ) : null}
      </div>
      {issueCount > 0 ? (
        <div className="luxia-csv-schema-issue-bar">
          <p
            className="luxia-type-caption"
            style={{ color: "var(--luxia-warning-90)" }}
            role="status"
          >
            ⚠ {schemaIssueAttentionCopy(issueCount)}
          </p>
          <Button
            type="button"
            variant={viewingIssues ? "outline" : "secondary"}
            size="compact"
            aria-pressed={viewingIssues}
            onClick={() => setIssuesOnly((current) => !current)}
          >
            {schemaIssueViewActionLabel(issueCount, viewingIssues)}
          </Button>
        </div>
      ) : null}
      {file.columns.length === 0 ? (
        <div className="luxia-settings-section-surface">
          <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            No columns were found in this file.
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className={cn(
            "luxia-settings-table-surface luxia-csv-schema-scroll luxia-scrollbar luxia-scrollbar-light min-w-0",
            expanded && "is-expanded",
          )}
          onScroll={captureScroll}
        >
          <div
            role="table"
            className="luxia-csv-schema-grid"
            style={{ gridTemplateColumns: schemaGridTemplate(file.columns) }}
          >
            <div
              role="row"
              className="luxia-csv-schema-grid-row is-header luxia-type-caption"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              <div role="columnheader" className="luxia-csv-schema-grid-cell is-sticky-start px-2 py-2 font-normal">
                Row
              </div>
              {file.columns.map((col) => {
                const issueCountForColumn = issueCountByColumn.get(col.id) ?? 0;
                const needsConfirm = col.status === "needs-review";
                const detectedType = selectedColumnType(col);
                const generatedName = isGeneratedFallbackName(file, col);
                const generatedNameId = `csv-generated-name-${col.id}`;
                return (
                  <div
                    key={col.id}
                    role="columnheader"
                    className="luxia-csv-schema-grid-cell px-2 py-2 font-normal"
                    style={{
                      background: needsConfirm ? "var(--luxia-warning-10)" : undefined,
                    }}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <ColumnNameEditor
                        name={col.name}
                        originalName={col.originalName}
                        describedBy={generatedName ? generatedNameId : undefined}
                        onSave={(nextName) => onRenameColumn(col.id, nextName)}
                      />
                      {generatedName ? (
                        <p
                          id={generatedNameId}
                          className="luxia-type-caption"
                          style={{ color: "var(--luxia-text-muted)", fontWeight: 400 }}
                        >
                          Generated name
                        </p>
                      ) : null}
                      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                        <div className="min-w-[5.5rem] max-w-[8.5rem] flex-1">
                          <Select
                            key={`${file.id}:${col.id}:type:${col.type}`}
                            value={detectedType}
                            onValueChange={(value) => {
                              if (value === col.type) return;
                              onTypeChange(col.id, value);
                            }}
                          >
                            <SelectTrigger
                              size="sm"
                              aria-label={`Type for ${col.name}`}
                              className="h-7 min-h-7 w-full min-w-0 max-w-full"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="!z-[80]">
                              {CSV_COLUMN_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {csvColumnTypeLabel(type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {issueCountForColumn > 0 ? (
                          <span
                            className="shrink-0 luxia-type-caption"
                            style={{ color: "var(--luxia-warning-90)" }}
                            title={`${issueCountForColumn.toLocaleString()} values need attention`}
                          >
                            ⚠ {issueCountForColumn.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                      {needsConfirm ? (
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="luxia-type-caption" style={{ color: "var(--luxia-warning-90)" }}>
                            {`Detected as ${csvColumnTypeLabel(detectedType)} · Needs confirmation`}
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="compact"
                            className="h-7 min-h-7 shrink-0 px-2"
                            aria-label={`Accept ${csvColumnTypeLabel(detectedType)} type for ${col.name} column`}
                            onClick={() => onConfirmType(col.id)}
                          >
                            Accept type
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              <div role="columnheader" className="luxia-csv-schema-grid-cell is-actions is-sticky-end px-2 py-2 font-normal">
                Actions
              </div>
            </div>
            {rows.length === 0 ? (
              <div role="row" className="luxia-csv-schema-grid-span">
                <div
                  role="cell"
                  className="px-2 py-3 luxia-type-caption"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  {viewingIssues ? "No unresolved issues." : "No data rows in this file."}
                </div>
              </div>
            ) : (
              rows.map((row) => {
                const excluded = skipped.has(row.rowNumber);
                const rowIssues = live.issues.filter((issue) => issue.rowNumber === row.rowNumber);
                const invalid = !excluded && rowIssues.length > 0;
                const edited = !excluded && !invalid && editedRows.has(row.rowNumber);
                const rowEditing = Boolean(editingIssue && editingIssue.rowNumber === row.rowNumber);
                const statusLabel = excluded
                  ? "Excluded"
                  : invalid
                    ? "Error"
                    : edited
                      ? "Edited"
                      : null;
                const statusColor = excluded
                  ? "var(--luxia-warning-90)"
                  : invalid
                    ? "var(--luxia-error-70)"
                    : "var(--luxia-text-muted)";
                return (
                  <Fragment key={row.rowNumber}>
                    <div
                      role="row"
                      className={cn(
                        "luxia-csv-schema-grid-row is-body luxia-type-caption",
                        excluded && "is-excluded",
                        invalid && "is-error",
                      )}
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      <div
                        role="cell"
                        className="luxia-csv-schema-grid-cell is-sticky-start whitespace-nowrap px-2 py-1.5 tabular-nums"
                      >
                        <span style={{ color: "var(--luxia-text-primary)" }}>{row.rowNumber}</span>
                      </div>
                      {file.columns.map((column, cellIndex) => {
                        const value = file.overrides[row.rowNumber]?.[column.id] ?? row.fields[cellIndex] ?? "";
                        const issue = excluded ? undefined : issueByCell.get(`${row.rowNumber}:${column.id}`);
                        const cellKey = `${row.rowNumber}:${column.id}`;
                        const isFirstIssue = viewingIssues && cellKey === firstIssueKey;
                        return (
                          <div
                            key={cellKey}
                            role="cell"
                            className={cn(
                              "luxia-csv-schema-grid-cell whitespace-nowrap px-2 py-1.5",
                              issue ? "is-invalid" : null,
                            )}
                            title={value || undefined}
                          >
                            {issue ? (
                              <button
                                type="button"
                                ref={isFirstIssue ? firstIssueCellRef : undefined}
                                className="luxia-csv-schema-invalid-value luxia-csv-editable-text"
                                aria-invalid
                                title={`${value || "Empty"}. Click to edit.`}
                                onClick={() => startEdit(cellKey, value)}
                              >
                                {value === "" ? "—" : value}
                              </button>
                            ) : (
                              <span className="block truncate" title={value || undefined}>
                                {value === "" ? "—" : value}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      <div role="cell" className="luxia-csv-schema-grid-cell is-actions is-sticky-end px-2 py-1.5">
                        <div className="flex min-w-0 flex-col items-start gap-0.5">
                          {statusLabel ? (
                            <span className="luxia-type-caption" style={{ color: statusColor }}>
                              {statusLabel}
                            </span>
                          ) : null}
                          {excluded ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="compact"
                              className="h-7 min-h-7 px-2"
                              aria-label={`Restore row ${row.rowNumber}`}
                              onClick={() => onUndo(row.rowNumber)}
                            >
                              Undo
                            </Button>
                          ) : (
                            <SchemaExcludeAction
                              rowNumber={row.rowNumber}
                              onExclude={() => {
                                if (rowEditing) cancelEdit();
                                onExclude(row.rowNumber);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    {rowEditing && editingIssue ? (
                      <div
                        role="row"
                        className="luxia-csv-schema-grid-row luxia-csv-schema-editor is-error luxia-type-caption"
                        style={{ gridColumn: "1 / -1", color: "var(--luxia-text-secondary)" }}
                      >
                        <div role="cell" className="luxia-csv-schema-editor-cell" style={{ gridColumn: "1 / -1" }}>
                          <div className="luxia-csv-schema-editor-inner">
                            <SchemaRowEditorStrip
                              expected={csvColumnTypeLabel(editingIssue.expected)}
                              value={editingDraft}
                              error={editingError}
                              onChange={(next) => {
                                setEditingDraft(next);
                                setEditingError(null);
                              }}
                              onSave={saveEdit}
                              onCancel={cancelEdit}
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {inlinePreview && !expanded ? workspace : null}
      {!inlinePreview ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="compact"
            className="h-7 min-h-7 shrink-0 gap-1.5 px-2"
            aria-label="Expand Schema table"
            disabled={file.columns.length === 0}
            onClick={openExpanded}
          >
            <Maximize2 size={14} aria-hidden />
            Expand table
          </Button>
        </div>
      ) : null}
      <Dialog
        open={expanded}
        onOpenChange={(next) => {
          if (!next) closeExpanded();
        }}
      >
        <DialogContent
          hideCloseButton
          data-csv-schema-expanded="true"
          overlayClassName="z-[70]"
          className="z-[70] flex h-[92vh] max-h-[92vh] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[96vw]"
          onPointerDownOutside={(event) => {
            const target = event.target;
            if (target instanceof Element && target.closest("[data-slot=select-content], [role=listbox]")) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            const target = event.target;
            if (target instanceof Element && target.closest("[data-slot=select-content], [role=listbox]")) {
              event.preventDefault();
            }
          }}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div
              className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3"
              style={{ borderColor: "var(--luxia-border-default)" }}
            >
              <div className="min-w-0">
                <DialogTitle className="truncate text-left text-[var(--luxia-text-primary)]">
                  {file.fileName}
                </DialogTitle>
                <DialogDescription className="sr-only">Expanded Schema table</DialogDescription>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  className="h-7 min-h-7 gap-1.5 px-2"
                  onClick={closeExpanded}
                >
                  <Minimize2 size={14} aria-hidden />
                  Exit expanded view
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="iconCompact"
                  aria-label="Close expanded Schema table"
                  onClick={closeExpanded}
                >
                  <X size={15} aria-hidden />
                </Button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
              {expanded ? workspace : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ExcludedRowsTable({
  issues,
  onUndo,
}: {
  issues: DisplayCsvIssue[];
  onUndo: (rowNumber: number) => void;
}) {
  if (issues.length === 0) {
    return (
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
        No excluded rows.
      </p>
    );
  }
  return (
    <div className="luxia-settings-table-surface max-h-[min(16rem,36vh)] overflow-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            <th className="px-3 py-2 font-normal">Row</th>
            <th className="px-3 py-2 font-normal">Value</th>
            <th className="px-3 py-2 font-normal">Status</th>
            <th className="px-3 py-2 font-normal">Action</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr
              key={`${issue.rowNumber}:${issue.columnId}`}
              className="border-t luxia-type-caption"
              style={{
                borderColor: "var(--luxia-settings-row-divider)",
                background: "var(--luxia-warning-10)",
              }}
            >
              <td className="px-3 py-2 tabular-nums" style={{ color: "var(--luxia-text-primary)" }}>
                {issue.rowNumber}
              </td>
              <td className="max-w-[18rem] truncate px-3 py-2" style={{ color: "var(--luxia-text-secondary)" }} title={issue.value || undefined}>
                {issue.columnName !== "Row" ? `${issue.columnName}: ` : null}
                {issue.value === "" ? "—" : truncateCsvCell(issue.value, 40)}
              </td>
              <td className="px-3 py-2" style={{ color: "var(--luxia-warning-90)" }}>
                Excluded
              </td>
              <td className="px-3 py-2">
                <Button type="button" variant="secondary" size="compact" onClick={() => onUndo(issue.rowNumber)}>
                  Undo
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
