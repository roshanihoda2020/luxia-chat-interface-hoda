import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { LuxiaAiButton } from "@/app/components/LuxiaAiButton";
import { csvColumnTypeLabel, selectedColumnType, type CsvImportFileDraft } from "./csv";
import type { CsvColumnDraft } from "./types";
import { proposeCsvColumnDescriptions } from "./csvAi";
import { CsvAiOriginBadge } from "./CsvAiOriginBadge";

export function describedColumnCount(file: CsvImportFileDraft): number {
  return file.columns.filter((column) => file.columnDescriptions?.[column.id]?.text.trim()).length;
}

/**
 * Step 07 editor. Descriptions are optional metadata about what each column means.
 * AI only fills empty descriptions on its own; replacing your text always asks first.
 */
export function CsvColumnDescriptions({
  file,
  examplesFor,
  aiLocked,
  onAiBusyChange,
  onEdit,
  onApplyAi,
}: {
  file: CsvImportFileDraft;
  examplesFor: (column: CsvColumnDraft) => string;
  aiLocked?: boolean;
  onAiBusyChange: (busy: boolean) => void;
  onEdit: (columnId: string, text: string) => void;
  onApplyAi: (changes: Array<{ columnId: string; description: string }>) => void;
}) {
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});
  // AI results arrive after a delay; decide against the latest text, not the text from the click.
  const latest = useRef({ file, onApplyAi, onAiBusyChange });
  latest.current = { file, onApplyAi, onAiBusyChange };
  const busy = busyIds.length > 0;
  const described = describedColumnCount(file);
  const total = file.columns.length;
  const missing = file.columns.filter((column) => !file.columnDescriptions?.[column.id]?.text.trim());

  useEffect(() => {
    setNotice(null);
    setPending({});
  }, [file.id]);

  async function generate(columns: CsvColumnDraft[], mode: "missing" | "single") {
    if (busy || aiLocked || columns.length === 0) return;
    const ids = columns.map((column) => column.id);
    setBusyIds(ids);
    onAiBusyChange(true);
    setNotice(null);
    const result = await proposeCsvColumnDescriptions({
      fileId: file.id,
      tableName: file.tableName.trim() || file.fileName,
      columns: columns.map((column) => ({
        id: column.id,
        name: column.name,
        type: csvColumnTypeLabel(selectedColumnType(column)),
        examples: examplesFor(column).split(", ").filter((value) => value && value !== "—"),
      })),
    });
    setBusyIds([]);
    latest.current.onAiBusyChange(false);
    if (result.status !== "ok") {
      setNotice(result.message);
      return;
    }
    const current = latest.current.file.columnDescriptions ?? {};
    const apply: Array<{ columnId: string; description: string }> = [];
    const confirm: Record<string, string> = {};
    for (const change of result.data.changes) {
      const entry = current[change.columnId];
      const text = entry?.text.trim() ?? "";
      if (!text || entry?.origin === "ai") {
        if (mode === "missing" && text) continue;
        apply.push(change);
      } else if (mode === "single" && text !== change.description) {
        confirm[change.columnId] = change.description;
      }
    }
    if (apply.length > 0) latest.current.onApplyAi(apply);
    if (Object.keys(confirm).length > 0) setPending((prev) => ({ ...prev, ...confirm }));
    if (mode === "missing") {
      setNotice(`${apply.length.toLocaleString()} description${apply.length === 1 ? "" : "s"} generated`);
    }
  }

  return (
    <div className="space-y-3">
      <div className="luxia-csv-coldesc-toolbar">
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} aria-live="polite">
          {`${described.toLocaleString()} of ${total.toLocaleString()} described`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {notice ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
              {notice}
            </p>
          ) : null}
          <LuxiaAiButton
            disabled={busy || aiLocked || missing.length === 0}
            aria-busy={busy && busyIds.length > 1}
            onClick={() => void generate(missing, "missing")}
          >
            {busy && busyIds.length > 1 ? "Generating…" : "Generate missing descriptions"}
          </LuxiaAiButton>
        </div>
      </div>
      <div className="luxia-settings-table-surface overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <thead>
            <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              <th className="w-[8rem] px-3 py-2 font-normal">Column</th>
              <th className="w-[6rem] px-3 py-2 font-normal">Type</th>
              <th className="w-[9rem] px-3 py-2 font-normal">Examples</th>
              <th className="px-3 py-2 font-normal">Description</th>
            </tr>
          </thead>
          <tbody>
            {file.columns.map((column) => {
              const entry = file.columnDescriptions?.[column.id];
              const text = entry?.text ?? "";
              const examples = examplesFor(column);
              const columnBusy = busyIds.includes(column.id);
              const suggestion = pending[column.id];
              const fieldId = `csv-coldesc-${file.id}-${column.id}`;
              return (
                <tr
                  key={column.id}
                  className="border-t align-top"
                  style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                >
                  <td className="px-3 py-2.5">
                    <label htmlFor={fieldId} className="block truncate luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }} title={column.name}>
                      {column.name}
                    </label>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                    {csvColumnTypeLabel(selectedColumnType(column))}
                  </td>
                  <td className="max-w-[9rem] px-3 py-2.5">
                    <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} title={examples}>
                      {examples}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="luxia-csv-coldesc-field">
                      <Textarea
                        id={fieldId}
                        value={text}
                        rows={2}
                        readOnly={columnBusy}
                        aria-busy={columnBusy}
                        placeholder="What does this column contain?"
                        className="min-h-[3.25rem] luxia-type-body-dense"
                        onChange={(event) => onEdit(column.id, event.target.value)}
                      />
                      <div className="luxia-csv-coldesc-meta">
                        {entry?.origin === "ai" && text.trim() ? <CsvAiOriginBadge /> : <span />}
                        <LuxiaAiButton
                          size="compact"
                          disabled={busy || aiLocked}
                          aria-label={`${text.trim() ? "Regenerate" : "Generate"} description for ${column.name} with AI`}
                          onClick={() => void generate([column], "single")}
                        >
                          {columnBusy && busyIds.length === 1 ? "Generating…" : text.trim() ? "Regenerate" : "Generate"}
                        </LuxiaAiButton>
                      </div>
                      {suggestion !== undefined ? (
                        <div className="luxia-csv-table-desc-suggestion" role="status">
                          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                            Replace your description with this suggestion?
                          </p>
                          <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
                            {suggestion}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="compact"
                              onClick={() => setPending(({ [column.id]: _dismissed, ...rest }) => rest)}
                            >
                              Dismiss
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              size="compact"
                              onClick={() => {
                                onApplyAi([{ columnId: column.id, description: suggestion }]);
                                setPending(({ [column.id]: _applied, ...rest }) => rest);
                              }}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
