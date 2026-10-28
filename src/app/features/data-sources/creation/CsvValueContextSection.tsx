import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  DEFAULT_VALUE_CONTEXT_CONFIG,
  VALUE_CONTEXT_LIMITS,
  buildValueContext,
  hasNumericAggregateColumn,
  hasWorkingValueContext,
  numericAggregateColumns,
  retrieveValueContext,
  selectedColumnType,
  valueContextColumnStatus,
  valueContextColumnStatusLabel,
  valueContextCountLabel,
  valueContextDraftFor,
  valueContextFor,
  workingValueContext,
  type CsvColumnValueContext,
  type CsvImportFileDraft,
  type CsvValueContextConfig,
  type CsvValueContextLimit,
  type CsvValueContextMethod,
  type CsvValueContextOrder,
} from "./csv";

const METHOD_LABELS: Record<CsvValueContextMethod, string> = {
  distinct: "Distinct values",
  frequency: "Most frequent values",
  sum: "By SUM of another column",
};

interface FileValueContextUi {
  selectedIds: string[];
  expandedId: string | null;
  config: CsvValueContextConfig;
  aggregates: Record<string, string>;
  warnings: Record<string, string>;
}

function emptyFileUi(file: CsvImportFileDraft): FileValueContextUi {
  const aggregates: Record<string, string> = {};
  for (const column of file.columns) {
    const aggregateId =
      file.valueContextDraft?.[column.id]?.aggregateColumnId
      ?? file.valueContext?.[column.id]?.aggregateColumnId;
    if (aggregateId) aggregates[column.id] = aggregateId;
  }
  return {
    selectedIds: [],
    expandedId: null,
    config: { ...DEFAULT_VALUE_CONTEXT_CONFIG },
    aggregates,
    warnings: {},
  };
}

function formatColumnList(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function CsvValueContextSection({
  file,
  onPatchDrafts,
  onCommitDrafts,
}: {
  file: CsvImportFileDraft;
  onPatchDrafts: (entries: Array<{ columnId: string; context: CsvColumnValueContext }>) => void;
  onCommitDrafts: (columnIds: string[]) => void;
}) {
  const [uiByFile, setUiByFile] = useState<Record<string, FileValueContextUi>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingRetrieveIds, setPendingRetrieveIds] = useState<string[] | null>(null);

  useEffect(() => {
    setNotice(null);
    setPendingRetrieveIds(null);
  }, [file.id]);

  const columns = file.columns;
  const columnIds = useMemo(() => new Set(columns.map((column) => column.id)), [columns]);
  const stored = uiByFile[file.id] ?? emptyFileUi(file);
  const config = stored.config;
  const selectedIds = stored.selectedIds.filter((id) => columnIds.has(id));
  const expandedId = stored.expandedId && columnIds.has(stored.expandedId) ? stored.expandedId : null;
  const aggregates = stored.aggregates;
  const warnings = stored.warnings;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = columns.length > 0 && selectedIds.length === columns.length;
  const anyNumericAggregate = hasNumericAggregateColumn(file);
  const method = config.retrievalMethod === "sum" && !anyNumericAggregate
    ? "distinct"
    : config.retrievalMethod;
  const unsavedSelectedIds = selectedIds.filter((columnId) => Boolean(file.valueContextDraft?.[columnId]));
  // Retrieved (not hand-edited) values that no longer match the current settings. These cannot be
  // saved from this panel until they are retrieved again, so a save never mixes old values with new settings.
  const isStale = (columnId: string) => {
    const draft = file.valueContextDraft?.[columnId];
    return Boolean(draft)
      && draft!.origin !== "edited"
      && (draft!.retrievalMethod !== method || draft!.order !== config.order || draft!.limit !== config.limit);
  };
  const staleSelectedIds = selectedIds.filter(isStale);
  const pendingNames = (pendingRetrieveIds ?? [])
    .map((columnId) => columns.find((column) => column.id === columnId)?.name.trim() || columnId)
    .filter(Boolean);

  function patchUi(next: Partial<FileValueContextUi>) {
    setUiByFile((current) => {
      const previous = current[file.id] ?? emptyFileUi(file);
      return {
        ...current,
        [file.id]: {
          ...previous,
          ...next,
          selectedIds: (next.selectedIds ?? previous.selectedIds).filter((id) => columnIds.has(id)),
        },
      };
    });
  }

  function patchConfig(next: Partial<CsvValueContextConfig>) {
    const previous = stored.config;
    patchUi({
      config: {
        ...previous,
        ...next,
        retrievalMethod: next.retrievalMethod ?? previous.retrievalMethod,
        aggregateColumnId: null,
      },
    });
  }

  function toggleColumn(columnId: string, checked: boolean) {
    const next = checked
      ? selectedIds.includes(columnId) ? selectedIds : [...selectedIds, columnId]
      : selectedIds.filter((id) => id !== columnId);
    patchUi({ selectedIds: next });
  }

  function setAggregate(columnId: string, aggregateColumnId: string) {
    patchUi({
      aggregates: { ...aggregates, [columnId]: aggregateColumnId },
      warnings: { ...warnings, [columnId]: "" },
    });
  }

  function runRetrieve(columnIdsToRetrieve: string[]) {
    if (columnIdsToRetrieve.length === 0) return;
    const entries: Array<{ columnId: string; context: CsvColumnValueContext }> = [];
    const nextWarnings: Record<string, string> = { ...warnings };
    let skipped = 0;
    for (const columnId of columnIdsToRetrieve) {
      nextWarnings[columnId] = "";
      const columnConfig: CsvValueContextConfig = {
        retrievalMethod: method,
        order: config.order,
        limit: config.limit,
        aggregateColumnId: method === "sum" ? aggregates[columnId] ?? null : null,
      };
      if (method === "sum" && !columnConfig.aggregateColumnId) {
        nextWarnings[columnId] = "Choose a numeric aggregate column.";
        skipped += 1;
        continue;
      }
      const result = retrieveValueContext(file, columnId, columnConfig);
      if (result.status !== "ok") {
        nextWarnings[columnId] = result.message;
        skipped += 1;
        continue;
      }
      entries.push({ columnId, context: buildValueContext(columnConfig, result.values, "retrieved") });
    }
    patchUi({ warnings: nextWarnings });
    if (entries.length > 0) onPatchDrafts(entries);
    if (skipped > 0 && entries.length > 0) {
      setNotice(`${entries.length.toLocaleString()} retrieved · ${skipped.toLocaleString()} need attention`);
      return;
    }
    if (skipped > 0) {
      setNotice("Choose an aggregate column for each selected SUM target.");
      return;
    }
    const empty = entries.filter((entry) => entry.context.values.length === 0).length;
    setNotice(
      empty === entries.length
        ? "No importable values found for the selected columns."
        : `${entries.length.toLocaleString()} column${entries.length === 1 ? "" : "s"} retrieved`,
    );
  }

  function requestRetrieve(columnIdsToRetrieve: string[]) {
    if (columnIdsToRetrieve.length === 0) return;
    const replacing = columnIdsToRetrieve.filter((columnId) => hasWorkingValueContext(file, columnId));
    if (replacing.length > 0) {
      setPendingRetrieveIds(columnIdsToRetrieve);
      return;
    }
    setPendingRetrieveIds(null);
    runRetrieve(columnIdsToRetrieve);
  }

  function confirmPendingRetrieve() {
    if (!pendingRetrieveIds || pendingRetrieveIds.length === 0) return;
    const ids = pendingRetrieveIds;
    setPendingRetrieveIds(null);
    runRetrieve(ids);
  }

  function saveSelectedDrafts() {
    if (unsavedSelectedIds.length === 0 || staleSelectedIds.length > 0) return;
    onCommitDrafts(unsavedSelectedIds);
    setNotice(
      `${unsavedSelectedIds.length.toLocaleString()} column${unsavedSelectedIds.length === 1 ? "" : "s"} saved`,
    );
  }

  const savePrimary = unsavedSelectedIds.length > 0;
  return (
    <div className="space-y-3">
      <div className="luxia-csv-sv-controls">
        <div className="luxia-csv-sv-top">
          <div className="luxia-csv-sv-group">
            <p className="luxia-csv-sv-group-label">Columns</p>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="compact" onClick={() => patchUi({ selectedIds: columns.map((column) => column.id) })} disabled={allSelected || columns.length === 0}>
                Select all
              </Button>
              <Button type="button" variant="outline" size="compact" onClick={() => patchUi({ selectedIds: [] })} disabled={selectedIds.length === 0}>
                Clear selection
              </Button>
              <span className="ml-1 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }} aria-live="polite">
                {`${selectedIds.length.toLocaleString()} of ${columns.length.toLocaleString()} selected`}
              </span>
            </div>
          </div>

          <div className="luxia-csv-sv-group luxia-csv-sv-settings">
            <p className="luxia-csv-sv-group-label">Retrieve settings</p>
            <div className="grid min-w-0 gap-2 sm:grid-cols-3">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="csv-value-context-method" className="luxia-csv-sv-field-label">Method</Label>
                <Select
                  value={method}
                  onValueChange={(value) =>
                    patchConfig({
                      retrievalMethod: value as CsvValueContextMethod,
                    })
                  }
                >
                  <SelectTrigger id="csv-value-context-method" size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="!z-[80]">
                    <SelectItem value="distinct">{METHOD_LABELS.distinct}</SelectItem>
                    <SelectItem value="frequency">{METHOD_LABELS.frequency}</SelectItem>
                    <SelectItem value="sum" disabled={!anyNumericAggregate}>
                      {METHOD_LABELS.sum}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-1">
                <Label htmlFor="csv-value-context-order" className="luxia-csv-sv-field-label">Order</Label>
                <Select
                  value={config.order}
                  onValueChange={(value) => patchConfig({ order: value as CsvValueContextOrder })}
                >
                  <SelectTrigger id="csv-value-context-order" size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="!z-[80]">
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-1">
                <Label htmlFor="csv-value-context-limit" className="luxia-csv-sv-field-label">Limit</Label>
                <Select
                  value={String(config.limit)}
                  onValueChange={(value) => patchConfig({ limit: Number(value) as CsvValueContextLimit })}
                >
                  <SelectTrigger id="csv-value-context-limit" size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="!z-[80]">
                    {VALUE_CONTEXT_LIMITS.map((limit) => (
                      <SelectItem key={limit} value={String(limit)}>
                        {limit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="luxia-csv-sv-actions">
          <Button
            type="button"
            variant={savePrimary ? "secondary" : "primary"}
            size="compact"
            disabled={selectedIds.length === 0}
            onClick={() => requestRetrieve(selectedIds)}
          >
            {`Retrieve for ${selectedIds.length.toLocaleString()} column${selectedIds.length === 1 ? "" : "s"}`}
          </Button>
          {savePrimary ? (
            <Button type="button" variant="primary" size="compact" disabled={staleSelectedIds.length > 0} onClick={saveSelectedDrafts}>
              {`Save value context for ${unsavedSelectedIds.length.toLocaleString()} column${unsavedSelectedIds.length === 1 ? "" : "s"}`}
            </Button>
          ) : null}
          {notice ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
              {notice}
            </p>
          ) : selectedIds.length === 0 ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
              Select columns to retrieve their values.
            </p>
          ) : null}
        </div>
        {staleSelectedIds.length > 0 && !pendingRetrieveIds ? (
          <p className="luxia-type-caption" style={{ color: "var(--luxia-warning-90)" }} role="status">
            Settings changed since these values were retrieved. Retrieve again before saving.
          </p>
        ) : null}
        {method === "sum" && !anyNumericAggregate ? (
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            This table has no Integer or Number column to use as an aggregate.
          </p>
        ) : null}
        {pendingRetrieveIds ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              {`Retrieve again? This will replace the current examples for ${formatColumnList(pendingNames)}.`}
            </p>
            <Button type="button" variant="secondary" size="compact" onClick={confirmPendingRetrieve}>
              Retrieve again
            </Button>
            <Button type="button" variant="outline" size="compact" onClick={() => setPendingRetrieveIds(null)}>
              Cancel
            </Button>
          </div>
        ) : null}
      </div>

      <div className="luxia-settings-table-surface overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <thead>
            <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              <th className="w-10 px-3 py-2 font-normal">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-3 py-2 font-normal">Column</th>
              <th className="px-3 py-2 font-normal">Type</th>
              {method === "sum" ? (
                <th className="px-3 py-2 font-normal">Aggregate by</th>
              ) : null}
              <th className="px-3 py-2 font-normal">Status</th>
              <th className="px-3 py-2 font-normal">Examples</th>
              <th className="w-10 px-3 py-2 font-normal">
                <span className="sr-only">Expand</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {columns.length === 0 ? (
              <tr>
                <td colSpan={method === "sum" ? 7 : 6} className="px-3 py-4 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                  No columns in this table.
                </td>
              </tr>
            ) : (
              columns.map((column) => {
                const working = workingValueContext(file, column.id);
                const expanded = expandedId === column.id;
                const checked = selectedSet.has(column.id);
                const statusLabel = valueContextColumnStatusLabel(file, column.id);
                const countLabel = valueContextCountLabel(working);
                const aggregateChoices = numericAggregateColumns(file, column.id);
                const warning = warnings[column.id];
                const colSpan = method === "sum" ? 7 : 6;
                return (
                  <Fragment key={column.id}>
                    <tr
                      className="border-t"
                      style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                    >
                      <td className="px-3 py-2 align-top">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleColumn(column.id, value === true)}
                          aria-label={`Select ${column.name}`}
                        />
                      </td>
                      <td className="min-w-0 px-3 py-2 align-top">
                        <button
                          type="button"
                          className="block max-w-full truncate text-left luxia-type-body-dense outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                          style={{ color: "var(--luxia-text-primary)" }}
                          onClick={() => patchUi({ expandedId: expanded ? null : column.id })}
                        >
                          {column.name}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        {selectedColumnType(column)}
                      </td>
                      {method === "sum" ? (
                        <td className="min-w-0 px-3 py-2 align-top">
                          {checked ? (
                            <div className="min-w-[9.5rem] max-w-[14rem] space-y-1">
                              <Select
                                value={
                                  aggregates[column.id]
                                  && aggregateChoices.some((item) => item.id === aggregates[column.id])
                                    ? aggregates[column.id]
                                    : undefined
                                }
                                onValueChange={(value) => setAggregate(column.id, value)}
                                disabled={aggregateChoices.length === 0}
                              >
                                <SelectTrigger
                                  size="sm"
                                  className="h-7 min-h-7 w-full"
                                  aria-label={`Aggregate by for ${column.name}`}
                                >
                                  <SelectValue placeholder="Select a column" />
                                </SelectTrigger>
                                <SelectContent className="!z-[80]">
                                  {aggregateChoices.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {warning ? (
                                <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                                  {warning}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>—</span>
                          )}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-3 py-2 align-top">
                        <span className="luxia-csv-sv-status" data-status={valueContextColumnStatus(file, column.id)}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="min-w-0 px-3 py-2 align-top">
                        <span
                          className="block tabular-nums luxia-type-caption"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          {countLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <button
                          type="button"
                          className="inline-flex size-7 items-center justify-center rounded-[var(--luxia-radius-8)] outline-none hover:bg-[var(--luxia-settings-hover-bg)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                          aria-expanded={expanded}
                          aria-label={expanded ? `Hide examples for ${column.name}` : `Show examples for ${column.name}`}
                          onClick={() => patchUi({ expandedId: expanded ? null : column.id })}
                        >
                          <ChevronDown
                            size={14}
                            strokeWidth={1.75}
                            aria-hidden
                            className={expanded ? "rotate-180" : undefined}
                            style={{ color: "var(--luxia-text-muted)" }}
                          />
                        </button>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr style={{ background: "var(--luxia-settings-section-bg)" }}>
                        <td colSpan={colSpan} className="border-t px-3 py-3" style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
                          <ExpandedValueContext
                            file={file}
                            columnId={column.id}
                            warning={method === "sum" ? undefined : warning}
                            stale={isStale(column.id)}
                            onPatchDraft={(context) => onPatchDrafts([{ columnId: column.id, context }])}
                            onSave={() => {
                              onCommitDrafts([column.id]);
                              setNotice(
                                valueContextColumnStatus(file, column.id) === "edited-unsaved"
                                  ? "Changes saved"
                                  : "Column saved",
                              );
                            }}
                            onReretrieve={() => requestRetrieve([column.id])}
                          />
                        </td>
                      </tr>
                    ) : null}
                    {warning && method !== "sum" && !expanded ? (
                      <tr>
                        <td colSpan={colSpan} className="px-3 pb-2">
                          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                            {warning}
                          </p>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpandedValueContext({
  file,
  columnId,
  warning,
  stale = false,
  onPatchDraft,
  onSave,
  onReretrieve,
}: {
  file: CsvImportFileDraft;
  columnId: string;
  warning?: string;
  stale?: boolean;
  onPatchDraft: (context: CsvColumnValueContext) => void;
  onSave: () => void;
  onReretrieve: () => void;
}) {
  const column = file.columns.find((item) => item.id === columnId);
  const saved = valueContextFor(file, columnId);
  const draft = valueContextDraftFor(file, columnId);
  const working = draft ?? saved;
  const values = working?.values ?? [];
  const status = valueContextColumnStatus(file, columnId);
  const canSave = status === "retrieved" || status === "edited-unsaved";
  const saveLabel = status === "edited-unsaved" ? "Save changes" : "Save this column";
  const hasExamples = values.some((value) => value.trim());

  function updateValue(index: number, next: string) {
    if (!working) return;
    const nextValues = working.values.map((value, itemIndex) => (itemIndex === index ? next : value));
    onPatchDraft({
      ...working,
      values: nextValues,
      origin: "edited",
    });
  }

  if (!column) return null;

  return (
    <div className="space-y-2">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
          {column.name}
        </p>
        <div className="flex flex-wrap gap-2">
          {hasExamples ? (
            <Button type="button" variant="secondary" size="compact" onClick={onReretrieve}>
              Re-retrieve
            </Button>
          ) : null}
          {canSave ? (
            <Button type="button" variant="primary" size="compact" disabled={stale} onClick={onSave}>
              {saveLabel}
            </Button>
          ) : null}
        </div>
      </div>
      {warning ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          {warning}
        </p>
      ) : null}
      {stale ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-warning-90)" }}>
          Retrieved with earlier settings. Re-retrieve before saving.
        </p>
      ) : null}
      <div>
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          {status === "saved" ? "Saved examples" : "Retrieved values"}
        </p>
        {values.length === 0 ? (
          <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            No samples yet. Select this column and retrieve.
          </p>
        ) : (
          <ul className="mt-1 space-y-1">
            {values.map((value, index) => (
              <li key={`${columnId}-${index}`}>
                <Input
                  value={value}
                  onChange={(event) => updateValue(index, event.target.value)}
                  aria-label={`Example ${index + 1} for ${column.name}`}
                  className="h-8 min-h-8"
                  autoComplete="off"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
