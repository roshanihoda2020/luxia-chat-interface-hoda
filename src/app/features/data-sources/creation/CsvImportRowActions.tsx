import { useEffect, useMemo, useState } from "react";
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
import { LuxiaAiButton } from "@/app/components/LuxiaAiButton";
import {
  CSV_COLUMN_TYPES,
  selectedColumnType,
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
          Exclude row
        </Button>
      </TooltipTrigger>
      <TooltipContent>{EXCLUDE_ROW_HINT}</TooltipContent>
    </Tooltip>
  );
}

function SchemaValueEditor({
  value,
  error,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="min-w-0">
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
        aria-label="Corrected value"
        aria-invalid={Boolean(error)}
        className="h-7 min-h-7 w-full min-w-0"
        autoFocus
      />
      {error ? (
        <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-error-70)" }} role="alert">
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

function schemaColumnWidth(column: CsvColumnDraft, index: number, total: number): string {
  const type = selectedColumnType(column);
  const name = column.name.trim().toLowerCase();
  if (type === "Date" || /date|time|timestamp/.test(name)) return "12.5rem";
  if (/service/.test(name)) return "7.5rem";
  if (/host|server|machine/.test(name)) return "10rem";
  if (index === total - 1 || /content|message|log|text/.test(name)) return "14rem";
  return "9rem";
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
    <div className="min-w-[10rem] space-y-2">
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
  const rows = schemaPreviewRows(records, invalidRowNumbers, {
    issuesOnly: issuesOnly && issueCount > 0,
  });
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
  const blockingColumnId = focusedColumnId ?? primaryIssueColumn(live.issues)?.columnId ?? file.columns.find((column) => column.status === "needs-review")?.id ?? null;
  const showingCount = rows.length;

  useEffect(() => {
    if (issueCount === 0) setIssuesOnly(false);
  }, [issueCount]);

  async function requestSimilar(group: ReturnType<typeof similarIssueGroups>[number]) {
    setSimilarBusy(group.columnId);
    setAiOutcome(null);
    const result = await proposeCsvSimilarRepairs({
      fileId: file.id,
      fileName: file.fileName,
      columnId: group.columnId,
      columnName: group.columnName,
      selectedType: group.expected,
      issues: group.issues.map((issue) => ({
        rowNumber: issue.rowNumber,
        currentValue: issue.value,
      })),
    });
    setSimilarBusy(null);
    const reviewed = group.issues.length;
    const changes = result.status === "ok" ? result.data.changes : [];
    const fixes: Array<{ issue: CsvValidationIssue; value: string }> = [];
    for (const change of changes) {
      const issue = group.issues.find((item) => item.rowNumber === change.rowNumber);
      if (!issue) continue;
      fixes.push({ issue, value: change.suggestedValue });
    }
    if (fixes.length > 0) {
      onSaveFixes(fixes);
      setAiFixedRows((current) => {
        const next = new Set(current);
        for (const fix of fixes) next.add(fix.issue.rowNumber);
        return next;
      });
    }
    const remaining = Math.max(0, reviewed - fixes.length);
    setAiOutcome(
      remaining === 0
        ? `${fixes.length.toLocaleString()} value${fixes.length === 1 ? "" : "s"} corrected`
        : `${reviewed.toLocaleString()} value${reviewed === 1 ? "" : "s"} reviewed · ${fixes.length.toLocaleString()} corrected · ${remaining.toLocaleString()} still need attention`,
    );
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
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {similarGroups.map((group) => (
            <LuxiaAiButton
              key={group.columnId}
              disabled={similarBusy === group.columnId}
              onClick={() => void requestSimilar(group)}
            >
              {similarBusy === group.columnId
                ? "Reviewing…"
                : `Fix ${group.issues.length.toLocaleString()} similar issues with AI`}
            </LuxiaAiButton>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            {issuesOnly && issueCount > 0
              ? `Showing ${showingCount.toLocaleString()} issue row${showingCount === 1 ? "" : "s"}`
              : `Previewing ${showingCount.toLocaleString()} sample row${showingCount === 1 ? "" : "s"} of ${records.length.toLocaleString()} total rows${
                  issueCount > 0
                    ? ` · ${issueCount.toLocaleString()} issue${issueCount === 1 ? "" : "s"}`
                    : ""
                }`}
          </p>
          {issueCount > 0 ? (
            <Button
              type="button"
              variant={issuesOnly ? "secondary" : "outline"}
              size="compact"
              aria-pressed={issuesOnly}
              onClick={() => setIssuesOnly((current) => !current)}
            >
              {issuesOnly ? "Show all rows" : "View issues only"}
            </Button>
          ) : null}
        </div>
      </div>
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
        <div className="luxia-settings-table-surface luxia-scrollbar luxia-scrollbar-light min-w-0 overflow-x-auto">
          <table className="w-full min-w-[54rem] table-fixed border-collapse text-left">
            <colgroup>
              <col style={{ width: "5rem" }} />
              {file.columns.map((col, colIndex) => (
                <col
                  key={col.id}
                  style={{ width: schemaColumnWidth(col, colIndex, file.columns.length) }}
                />
              ))}
              <col style={{ width: "8.5rem" }} />
            </colgroup>
            <thead>
              <tr
                className="luxia-type-caption"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                <th
                  className="sticky top-0 left-0 z-[3] border-b-2 px-2 py-2 text-left align-bottom font-normal"
                  style={{
                    background: "var(--luxia-settings-section-bg)",
                    borderColor: "var(--luxia-settings-panel-border)",
                  }}
                >
                  Row
                </th>
                {file.columns.map((col) => {
                  const issueCountForColumn = issueCountByColumn.get(col.id) ?? 0;
                  const needsConfirm = col.status === "needs-review";
                  const showValueWarning = !needsConfirm && issueCountForColumn > 0;
                  const focused = blockingColumnId === col.id && (needsConfirm || issueCountForColumn > 0);
                  return (
                    <th
                      key={col.id}
                      className="sticky top-0 z-[2] min-w-0 overflow-hidden border-b-2 px-2 py-2 align-top font-normal"
                      style={{
                        background: focused ? "var(--luxia-warning-10)" : "var(--luxia-settings-section-bg)",
                        borderColor: "var(--luxia-settings-panel-border)",
                      }}
                    >
                      <div className="min-w-0 space-y-1 overflow-hidden">
                        <ColumnNameEditor
                          name={col.name}
                          originalName={col.originalName}
                          onSave={(nextName) => onRenameColumn(col.id, nextName)}
                        />
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
                        {needsConfirm ? (
                          <p className="truncate luxia-type-caption" style={{ color: "var(--luxia-warning-90)" }}>
                            Type needs confirmation
                          </p>
                        ) : null}
                        {needsConfirm ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="compact"
                            onClick={() => onConfirmType(col.id)}
                          >
                            Confirm
                          </Button>
                        ) : null}
                        {showValueWarning ? (
                          <p
                            className="truncate luxia-type-caption"
                            style={{ color: "var(--luxia-warning-90)" }}
                            title={`${issueCountForColumn.toLocaleString()} values need attention`}
                          >
                            ⚠ {issueCountForColumn.toLocaleString()} value{issueCountForColumn === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </div>
                    </th>
                  );
                })}
                <th
                  className="sticky top-0 right-0 z-[3] border-b-2 px-2 py-2 text-left align-bottom font-normal"
                  style={{
                    background: "var(--luxia-settings-section-bg)",
                    borderColor: "var(--luxia-settings-panel-border)",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={file.columns.length + 2}
                    className="px-2 py-3 luxia-type-caption"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    {issuesOnly ? "No unresolved issues." : "No data rows in this file."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const excluded = skipped.has(row.rowNumber);
                  const rowIssues = live.issues.filter((issue) => issue.rowNumber === row.rowNumber);
                  const invalid = !excluded && rowIssues.length > 0;
                  const aiFixed = !excluded && !invalid && aiFixedRows.has(row.rowNumber);
                  const edited = !excluded && !invalid && !aiFixed && editedRows.has(row.rowNumber);
                  const rowEditing = editingIssue?.rowNumber === row.rowNumber;
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
                  const rowBg = excluded
                    ? "var(--luxia-warning-10)"
                    : invalid
                      ? "var(--luxia-opacity-error-08)"
                      : "var(--luxia-settings-panel-bg)";
                  return (
                    <tr
                      key={row.rowNumber}
                      className="border-t luxia-type-caption"
                      style={{
                        borderColor: "var(--luxia-settings-row-divider)",
                        background: rowBg,
                        color: "var(--luxia-text-secondary)",
                      }}
                    >
                      <td
                        className="sticky left-0 z-[1] min-w-0 px-2 py-1.5 align-middle tabular-nums"
                        style={{ background: rowBg }}
                      >
                        <span className="inline-flex min-w-0 items-baseline gap-1 truncate">
                          <span style={{ color: "var(--luxia-text-primary)" }}>{row.rowNumber}</span>
                          {statusLabel ? (
                            <span style={{ color: statusColor }}>
                              · {statusLabel}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      {file.columns.map((column, cellIndex) => {
                        const value = file.overrides[row.rowNumber]?.[column.id] ?? row.fields[cellIndex] ?? "";
                        const issue = excluded ? undefined : issueByCell.get(`${row.rowNumber}:${column.id}`);
                        const cellKey = `${row.rowNumber}:${column.id}`;
                        const editing = Boolean(issue && editingKey === cellKey);
                        return (
                          <td
                            key={cellKey}
                            className="min-w-0 overflow-hidden px-2 py-1.5 align-middle"
                            title={editing ? undefined : value || undefined}
                          >
                            {editing ? (
                              <SchemaValueEditor
                                value={editingDraft}
                                error={editingError}
                                onChange={(next) => {
                                  setEditingDraft(next);
                                  setEditingError(null);
                                }}
                                onSave={saveEdit}
                                onCancel={cancelEdit}
                              />
                            ) : issue ? (
                              <button
                                type="button"
                                className="block max-w-full truncate rounded-[4px] text-left underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                                style={{ color: "var(--luxia-error-70)" }}
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
                          </td>
                        );
                      })}
                      <td
                        className="sticky right-0 z-[1] px-2 py-1.5 align-middle"
                        style={{ background: rowBg }}
                      >
                        {rowEditing ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <Button type="button" variant="primary" size="compact" onClick={saveEdit}>
                              Save
                            </Button>
                            <Button type="button" variant="outline" size="compact" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        ) : excluded ? (
                          <Button type="button" variant="secondary" size="compact" onClick={() => onUndo(row.rowNumber)}>
                            Undo
                          </Button>
                        ) : (
                          <ExcludeRowButton
                            variant={invalid ? "secondary" : "outline"}
                            onExclude={() => onExclude(row.rowNumber)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
