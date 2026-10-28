import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { LuxiaAiButton } from "@/app/components/LuxiaAiButton";
import { CsvAiOriginBadge } from "@/app/features/data-sources/creation/CsvAiOriginBadge";
import { proposeCsvColumnDescriptions } from "@/app/features/data-sources/creation/csvAi";
import type { CsvImportedColumnDescription, CsvImportedTableSummary } from "./types";

type Draft = {
  columnId: string;
  text: string;
  /** "ai" while the text is an untouched AI suggestion; any typing makes it the user's. */
  origin: "ai" | "edited";
};

/** Only imports that stored their schema have columns to list; older sources show no Columns section. */
function tableColumns(table: CsvImportedTableSummary) {
  return table.columns ?? [];
}

/**
 * Settings → Content → Columns for one CSV table. Reads and writes the same
 * `csvTables[].columnDescriptions` the CSV wizard creates. Nothing is stored until Save changes.
 */
export function CsvColumnDescriptionsSettings({
  table,
  canEdit,
  onSaveTable,
}: {
  table: CsvImportedTableSummary;
  canEdit: boolean;
  onSaveTable?: (next: CsvImportedTableSummary) => void;
}) {
  const columns = tableColumns(table);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ columnId: string; text: string } | null>(null);
  const requestToken = useRef(0);
  const editable = canEdit && Boolean(onSaveTable);

  useEffect(() => {
    // A different table invalidates any open editor or pending AI result.
    requestToken.current += 1;
    setDraft(null);
    setBusyId(null);
    setConfirmId(null);
    setNotice(null);
  }, [table.id]);

  if (columns.length === 0) return null;

  const saved = (columnId: string) => table.columnDescriptions?.find((entry) => entry.columnId === columnId);
  const described = columns.filter((column) => saved(column.id)?.description.trim()).length;

  function openEditor(columnId: string) {
    const entry = saved(columnId);
    setConfirmId(null);
    setNotice(null);
    setDraft({ columnId, text: entry?.description ?? "", origin: entry?.origin ?? "edited" });
  }

  function save() {
    if (!draft || !onSaveTable) return;
    const column = columns.find((item) => item.id === draft.columnId);
    if (!column) return;
    const text = draft.text.trim();
    const current = saved(draft.columnId);
    if (text === (current?.description ?? "") && (!text || draft.origin === current?.origin)) {
      setDraft(null);
      return;
    }
    const others = (table.columnDescriptions ?? []).filter((entry) => entry.columnId !== draft.columnId);
    const next: CsvImportedColumnDescription[] = text
      ? [...others, { columnId: column.id, columnName: column.name, description: text, origin: draft.origin }]
      : others;
    onSaveTable({ ...table, columnDescriptions: next.length > 0 ? next : undefined });
    setDraft(null);
    toast.success("Column description updated");
  }

  async function generate(columnId: string) {
    const column = columns.find((item) => item.id === columnId);
    if (!column || busyId) return;
    const token = ++requestToken.current;
    setConfirmId(null);
    setNotice(null);
    setDraft(null);
    setBusyId(columnId);
    const examples = table.valueContext?.find((entry) => entry.columnId === columnId)?.values ?? [];
    const result = await proposeCsvColumnDescriptions({
      fileId: table.id,
      tableName: table.tableName || table.fileName,
      columns: [{ id: column.id, name: column.name, type: column.type, examples }],
    });
    // Ignore a result that arrives after the table changed or another request started.
    if (token !== requestToken.current) return;
    setBusyId(null);
    if (result.status !== "ok") {
      setNotice({ columnId, text: result.message });
      return;
    }
    const suggestion = result.data.changes.find((change) => change.columnId === columnId)?.description ?? "";
    setDraft({ columnId, text: suggestion, origin: "ai" });
  }

  function requestGenerate(columnId: string) {
    const entry = saved(columnId);
    if (entry?.description.trim() && entry.origin === "edited") {
      setConfirmId(columnId);
      return;
    }
    void generate(columnId);
  }

  return (
    <section className="luxia-ds-columns" aria-label={`Columns in ${table.tableName || table.fileName}`}>
      <div className="luxia-ds-columns-head">
        <p className="luxia-ds-columns-title">Columns</p>
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          {`${described.toLocaleString()} of ${columns.length.toLocaleString()} described`}
        </p>
      </div>
      <ul className="luxia-ds-columns-list">
        {columns.map((column) => {
          const entry = saved(column.id);
          const text = entry?.description ?? "";
          const editing = draft?.columnId === column.id;
          const busy = busyId === column.id;
          const fieldId = `ds-coldesc-${table.id}-${column.id}`;
          return (
            <li key={column.id} className="luxia-ds-columns-row">
              <div className="luxia-ds-columns-meta">
                <p className="luxia-ds-columns-name" title={column.name}>{column.name}</p>
                {column.type ? <p className="luxia-ds-columns-type">{column.type}</p> : null}
              </div>
              <div className="luxia-ds-columns-body">
                {editing && draft ? (
                  <div className="space-y-2">
                    {draft.origin === "ai" ? (
                      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        AI suggestion. Review it, then save.
                      </p>
                    ) : null}
                    <Textarea
                      id={fieldId}
                      aria-label={`Description for ${column.name}`}
                      value={draft.text}
                      rows={2}
                      autoFocus
                      className="min-h-[3.25rem] luxia-type-body-dense"
                      onChange={(event) => setDraft({ ...draft, text: event.target.value, origin: "edited" })}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          event.stopPropagation();
                          setDraft(null);
                        }
                      }}
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="outline" size="compact" onClick={() => setDraft(null)}>
                        Cancel
                      </Button>
                      <Button type="button" variant="primary" size="compact" onClick={save}>
                        Save changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="luxia-ds-columns-text" data-empty={text.trim() ? undefined : ""}>
                    {busy ? "Generating…" : text.trim() || "No description"}
                    {!busy && text.trim() && entry?.origin === "ai" ? <CsvAiOriginBadge /> : null}
                  </p>
                )}
                {confirmId === column.id ? (
                  <div className="luxia-ds-columns-confirm" role="alert">
                    <p className="luxia-type-caption" style={{ color: "var(--luxia-text-primary)" }}>
                      Replace your description with an AI suggestion? Yours stays until you save the suggestion.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="compact" onClick={() => setConfirmId(null)}>
                        Keep mine
                      </Button>
                      <Button type="button" variant="secondary" size="compact" onClick={() => void generate(column.id)}>
                        Generate suggestion
                      </Button>
                    </div>
                  </div>
                ) : null}
                {notice?.columnId === column.id ? (
                  <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
                    {notice.text}
                  </p>
                ) : null}
              </div>
              {editable && !editing ? (
                <div className="luxia-ds-columns-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    disabled={Boolean(busyId)}
                    aria-label={`Edit description for ${column.name}`}
                    onClick={() => openEditor(column.id)}
                  >
                    Edit
                  </Button>
                  <LuxiaAiButton
                    disabled={Boolean(busyId) || Boolean(draft)}
                    aria-busy={busy}
                    aria-label={`${text.trim() ? "Regenerate" : "Generate"} description for ${column.name} with AI`}
                    onClick={() => requestGenerate(column.id)}
                  >
                    {busy ? "Generating…" : text.trim() ? "Regenerate with AI" : "Generate with AI"}
                  </LuxiaAiButton>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
