import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
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
import { LuxiaAiButton } from "@/app/components/LuxiaAiButton";
import {
  CSV_COLUMN_TYPES,
  selectedColumnType,
  valueMatchesType,
  type CsvImportFileDraft,
} from "./csv";
import type { CsvColumnDraft, CsvValidationIssue, CsvValidationSummary } from "./types";
import {
  proposeCsvSimilarRepairs,
} from "./csvAi";

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
  onExclude,
  quiet = false,
}: {
  onExclude: () => void;
  quiet?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "luxia-type-caption rounded-[4px] px-1 py-0.5 underline-offset-2 outline-none hover:underline",
            "focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]",
            quiet && "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
          )}
          style={{ color: "var(--luxia-text-secondary)" }}
          aria-label={`Exclude row. ${EXCLUDE_ROW_HINT}`}
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
  if (type === "Date" || /date|time|timestamp/.test(name)) return "minmax(180px, 1.15fr)";
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

export function ColumnNameEditor({
  name,
  originalName,
  onSave,
}: {
  name: string;
  originalName?: string;
  onSave: (nextName: string) => string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const original = originalName && originalName !== name ? originalName : null;

  useEffect(() => {
    setDraft(name);
    setError(null);
    setEditing(false);
  }, [name]);

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
          className="max-w-full truncate rounded-[4px] text-left underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: "var(--luxia-text-primary)" }}
          title="Rename column"
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
    <div className="min-w-0 space-y-2">
      <Input
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
        aria-label="Working column name"
        aria-invalid={Boolean(error)}
        className="h-8"
        autoFocus
      />
      {error ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }} role="alert">
          {error}
        </p>
      ) : original ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          Original: {original}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="compact" onClick={cancel}>
          Cancel
        </Button>
        <Button type="button" variant="secondary" size="compact" onClick={save}>
          Save
        </Button>
      </div>
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
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const [issuesOnly, setIssuesOnly] = useState(false);
  const firstIssueCellRef = useRef<HTMLButtonElement | null>(null);
  const [similarBusy, setSimilarBusy] = useState<string | null>(null);
  const [aiOutcome, setAiOutcome] = useState<string | null>(null);
  const [aiFixedRows, setAiFixedRows] = useState<Set<number>>(() => new Set());
  const [editedRows, setEditedRows] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    setIssuesOnly(false);
    setEditingKey(null);
    setEditingDraft("");
    setEditingError(null);
    setAiOutcome(null);
    setAiFixedRows(new Set());
    setEditedRows(new Set());
  }, [file.id]);

  useEffect(() => {
    if (!aiOutcome) return;
    const timer = globalThis.setTimeout(() => setAiOutcome(null), 8000);
    return () => globalThis.clearTimeout(timer);
  }, [aiOutcome]);

  useEffect(() => {
    if (editedRows.size === 0) return;
    const timer = globalThis.setTimeout(() => setEditedRows(new Set()), 4000);
    return () => globalThis.clearTimeout(timer);
  }, [editedRows]);

  useEffect(() => {
    if (aiFixedRows.size === 0) return;
    const timer = globalThis.setTimeout(() => setAiFixedRows(new Set()), 4000);
    return () => globalThis.clearTimeout(timer);
  }, [aiFixedRows]);

  const skipped = useMemo(() => new Set(file.skipped), [file.skipped]);
  const openIssues: DisplayCsvIssue[] = live.issues.map((issue) => ({
    ...issue,
    resolution: "open",
  }));
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
  const similarGroups = useMemo(() => similarIssueGroups(openIssues), [openIssues]);

  useEffect(() => {
    if (issueCount === 0) setIssuesOnly(false);
  }, [issueCount]);

  useLayoutEffect(() => {
    if (!viewingIssues) return;
    firstIssueCellRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [viewingIssues, file.id, firstIssueKey]);

  async function requestSimilar(group: ReturnType<typeof similarIssueGroups>[number]) {
    if (similarBusy) return;
    setSimilarBusy(group.columnId);
    setAiOutcome(null);
    const reviewed = group.issues.length;
    const column = file.columns.find((item) => item.id === group.columnId);
    const expectedType = column ? selectedColumnType(column) : "Text";
    try {
      const result = await proposeCsvSimilarRepairs({
        fileId: file.id,
        fileName: file.fileName,
        columnId: group.columnId,
        columnName: group.columnName,
        selectedType: expectedType,
        validExamples: validExamplesForColumn(file, group.columnId),
        issues: group.issues.map((issue) => ({
          rowNumber: issue.rowNumber,
          currentValue: issue.value,
        })),
      });
      const changes = result.status === "ok" ? result.data.changes : [];
      const accepted: Array<{ issue: CsvValidationIssue; value: string }> = [];
      for (const change of changes) {
        const issue = group.issues.find((item) => item.rowNumber === change.rowNumber);
        if (!issue || !valueMatchesType(change.suggestedValue, expectedType)) continue;
        accepted.push({ issue, value: change.suggestedValue });
      }
      if (accepted.length > 0) {
        onSaveFixes(accepted);
        setAiFixedRows((current) => {
          const next = new Set(current);
          for (const fix of accepted) next.add(fix.issue.rowNumber);
          return next;
        });
      }
      const remaining = Math.max(0, reviewed - accepted.length);
      setAiOutcome(
        `${reviewed.toLocaleString()} values reviewed · ${accepted.length.toLocaleString()} corrected · ${remaining.toLocaleString()} remaining`,
      );
    } finally {
      setSimilarBusy(null);
    }
  }

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

  return (
    <div className="min-w-0 space-y-2">
      {similarGroups.length > 0 ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {similarGroups.map((group) => (
            <LuxiaAiButton
              key={group.columnId}
              disabled={similarBusy !== null}
              aria-busy={similarBusy === group.columnId}
              onClick={() => void requestSimilar(group)}
            >
              {similarBusy === group.columnId
                ? `Fixing ${group.issues.length.toLocaleString()} issues…`
                : `Fix ${group.issues.length.toLocaleString()} similar issues with AI`}
            </LuxiaAiButton>
          ))}
        </div>
      ) : null}
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
        {`Previewing ${previewCount.toLocaleString()} sample row${previewCount === 1 ? "" : "s"} of ${records.length.toLocaleString()} total rows`}
      </p>
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
      {aiOutcome ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
          {aiOutcome}
        </p>
      ) : null}
      {file.columns.length === 0 ? (
        <div className="luxia-settings-section-surface">
          <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            No columns were found in this file.
          </p>
        </div>
      ) : (
        <div className="luxia-settings-table-surface luxia-csv-schema-scroll luxia-scrollbar luxia-scrollbar-light min-w-0">
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
              <div role="columnheader" className="luxia-csv-schema-grid-cell px-2 py-2 font-normal">
                Row
              </div>
              {file.columns.map((col) => {
                const issueCountForColumn = issueCountByColumn.get(col.id) ?? 0;
                const needsConfirm = col.status === "needs-review";
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
                      <div className="flex min-w-0 items-center gap-1.5">
                        <div className="min-w-0 flex-1">
                          <ColumnNameEditor
                            name={col.name}
                            originalName={col.originalName}
                            onSave={(nextName) => onRenameColumn(col.id, nextName)}
                          />
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
                      <div className="flex min-w-0 items-center gap-1">
                        <div className="min-w-0 flex-1">
                          <Select
                            key={`${file.id}:${col.id}:type:${col.type}`}
                            value={selectedColumnType(col)}
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
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {needsConfirm ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="compact"
                            className="h-7 min-h-7 shrink-0 px-2"
                            onClick={() => onConfirmType(col.id)}
                          >
                            Confirm
                          </Button>
                        ) : null}
                      </div>
                      {needsConfirm && issueCountForColumn === 0 ? (
                        <p className="truncate luxia-type-caption" style={{ color: "var(--luxia-warning-90)" }}>
                          Type needs confirmation
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              <div role="columnheader" className="luxia-csv-schema-grid-cell is-actions px-2 py-2 font-normal">
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
                const aiFixed = !excluded && !invalid && aiFixedRows.has(row.rowNumber);
                const edited = !excluded && !invalid && !aiFixed && editedRows.has(row.rowNumber);
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
                        "luxia-csv-schema-grid-row is-body group luxia-type-caption",
                        excluded && "is-excluded",
                        invalid && "is-error",
                      )}
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      <div
                        role="cell"
                        className="luxia-csv-schema-grid-cell whitespace-nowrap px-2 py-1.5 tabular-nums"
                      >
                        <span className="inline-flex min-w-0 items-baseline gap-1 truncate">
                          <span style={{ color: "var(--luxia-text-primary)" }}>{row.rowNumber}</span>
                          {statusLabel ? (
                            <span style={{ color: statusColor }}>
                              · {statusLabel}
                            </span>
                          ) : null}
                        </span>
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
                                className="luxia-csv-schema-invalid-value"
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
                      <div role="cell" className="luxia-csv-schema-grid-cell is-actions whitespace-nowrap px-2 py-1.5">
                        {excluded ? (
                          <Button type="button" variant="secondary" size="compact" className="h-7 min-h-7 px-2" onClick={() => onUndo(row.rowNumber)}>
                            Undo
                          </Button>
                        ) : invalid ? (
                          <SchemaExcludeAction onExclude={() => {
                            if (rowEditing) cancelEdit();
                            onExclude(row.rowNumber);
                          }} />
                        ) : (
                          <SchemaExcludeAction quiet onExclude={() => onExclude(row.rowNumber)} />
                        )}
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
                              expected={editingIssue.expected}
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
