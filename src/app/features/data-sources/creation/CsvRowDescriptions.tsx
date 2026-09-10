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
import { LuxiaAiButton } from "@/app/components/LuxiaAiButton";
import {
  csvRecordPreview,
  importableCsvRecords,
  resolvedRowFields,
  rowDescriptionStats,
  selectedColumnType,
  ROW_DESCRIPTION_PAGE_SIZE_DEFAULT,
  ROW_DESCRIPTION_PAGE_SIZES,
  type CsvImportFileDraft,
  type CsvRowDescriptionEntry,
} from "./csv";
import { proposeCsvRowDescriptions } from "./csvAi";

function statusLabel(entry: CsvRowDescriptionEntry | undefined): string {
  if (!entry?.text.trim()) return "Missing";
  if (entry.origin === "edited") return "Edited";
  return "AI generated";
}

function DescriptionEditor({
  value,
  onSave,
}: {
  value: string;
  onSave: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed !== value.trim()) onSave(draft);
    setEditing(false);
    setDraft(trimmed);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="block w-full max-w-full truncate rounded-[4px] px-1 py-0.5 text-left underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
        style={{ color: value.trim() ? "var(--luxia-text-primary)" : "var(--luxia-text-muted)" }}
        title={value.trim() || "Add a description"}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value.trim() || "Add a description"}
      </button>
    );
  }

  const dirty = draft.trim() !== value.trim();
  return (
    <div className="min-w-0 space-y-1.5">
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        onBlur={() => {
          if (!dirty) {
            setEditing(false);
            return;
          }
          commit();
        }}
        autoComplete="off"
        aria-label="Row description"
        className="h-8 min-h-8"
        autoFocus
      />
      {dirty ? (
        <div className="flex gap-1.5">
          <Button type="button" variant="outline" size="compact" className="h-7 min-h-7 px-2" onMouseDown={(event) => event.preventDefault()} onClick={cancel}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="compact" className="h-7 min-h-7 px-2" onMouseDown={(event) => event.preventDefault()} onClick={commit}>
            Save
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function CsvRowDescriptionsSection({
  file,
  onSaveDescription,
  onApplyAiDescriptions,
}: {
  file: CsvImportFileDraft;
  onSaveDescription: (rowNumber: number, text: string) => void;
  onApplyAiDescriptions: (changes: Array<{ rowNumber: number; description: string }>) => void;
}) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState<(typeof ROW_DESCRIPTION_PAGE_SIZES)[number]>(
    ROW_DESCRIPTION_PAGE_SIZE_DEFAULT,
  );
  const [page, setPage] = useState(0);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const records = useMemo(() => importableCsvRecords(file), [file]);
  const stats = useMemo(() => rowDescriptionStats(file), [file]);

  useEffect(() => {
    setQuery("");
    setPage(0);
    setAiNotice(null);
    setAiBusy(false);
  }, [file.id]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) => {
      const preview = csvRecordPreview(file, record).toLowerCase();
      const description = file.rowDescriptions?.[record.rowNumber]?.text.toLowerCase() ?? "";
      return (
        String(record.rowNumber).includes(needle)
        || preview.includes(needle)
        || description.includes(needle)
      );
    });
  }, [file, query, records]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  async function generateDescriptions() {
    if (aiBusy) return;
    const missing = records.filter((record) => !file.rowDescriptions?.[record.rowNumber]?.text.trim());
    if (missing.length === 0) return;
    setAiBusy(true);
    setAiNotice(null);
    const result = await proposeCsvRowDescriptions({
      fileId: file.id,
      fileName: file.fileName,
      tableName: file.tableName,
      columns: file.columns.map((column) => ({
        name: column.name,
        type: selectedColumnType(column),
      })),
      rows: missing.map((record) => ({
        rowNumber: record.rowNumber,
        fields: resolvedRowFields(file, record),
      })),
    });
    setAiBusy(false);
    if (result.status === "ok") {
      onApplyAiDescriptions(result.data.changes);
      const filled = result.data.changes.length;
      setAiNotice(
        filled === 0
          ? "No new descriptions were generated."
          : `${filled.toLocaleString()} description${filled === 1 ? "" : "s"} generated.`,
      );
      return;
    }
    setAiNotice(result.message);
  }

  const countLabel =
    stats.missing === 0 && stats.described > 0
      ? `${stats.total.toLocaleString()} rows · ${stats.described.toLocaleString()} descriptions generated`
      : `${stats.total.toLocaleString()} rows · ${stats.described.toLocaleString()} described · ${stats.missing.toLocaleString()} missing`;

  return (
    <div className="space-y-3">
      <div>
        <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
          Row descriptions
        </p>
        <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          Add a short description for each record. Generate them with AI or edit them manually.
        </p>
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <LuxiaAiButton disabled={aiBusy || stats.missing === 0} onClick={() => void generateDescriptions()}>
          {aiBusy
            ? "Generating…"
            : stats.described > 0
              ? "Generate missing descriptions"
              : "Generate row descriptions with AI"}
        </LuxiaAiButton>
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          {countLabel}
        </p>
      </div>
      {aiNotice ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
          {aiNotice}
        </p>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Search rows"
          aria-label="Search row descriptions"
          className="h-8 min-h-8 w-full max-w-xs"
        />
      </div>
      <div className="luxia-settings-table-surface overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              <th className="w-[3.5rem] px-3 py-2 font-normal">Row</th>
              <th className="px-3 py-2 font-normal">Record preview</th>
              <th className="px-3 py-2 font-normal">Description</th>
              <th className="w-[8rem] px-3 py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                  {records.length === 0 ? "No rows to describe." : "No matching rows."}
                </td>
              </tr>
            ) : (
              paged.map((record) => {
                const preview = csvRecordPreview(file, record);
                const entry = file.rowDescriptions?.[record.rowNumber];
                return (
                  <tr
                    key={record.rowNumber}
                    className="border-t"
                    style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                  >
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums luxia-type-caption" style={{ color: "var(--luxia-text-primary)" }}>
                      {record.rowNumber}
                    </td>
                    <td className="max-w-[14rem] px-3 py-2">
                      <span
                        className="block truncate luxia-type-caption"
                        style={{ color: "var(--luxia-text-secondary)" }}
                        title={preview || undefined}
                      >
                        {preview || "—"}
                      </span>
                    </td>
                    <td className="min-w-[14rem] max-w-[22rem] px-3 py-2">
                      <DescriptionEditor
                        value={entry?.text ?? ""}
                        onSave={(next) => onSaveDescription(record.rowNumber, next)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                      {statusLabel(entry)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 ? (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            Showing {(safePage * pageSize + 1).toLocaleString()}–{Math.min(filtered.length, (safePage + 1) * pageSize).toLocaleString()} of {filtered.length.toLocaleString()}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value) as (typeof ROW_DESCRIPTION_PAGE_SIZES)[number]);
                setPage(0);
              }}
            >
              <SelectTrigger size="sm" className="h-7 min-h-7 w-[6.5rem]" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!z-[80]">
                {ROW_DESCRIPTION_PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="tertiary"
              size="compact"
              disabled={safePage <= 0}
              onClick={() => setPage(Math.max(0, safePage - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="tertiary"
              size="compact"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
