import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { LuxiaAiButton } from "@/app/components/LuxiaAiButton";
import { CsvAiOriginBadge } from "@/app/features/data-sources/creation/CsvAiOriginBadge";
import { proposeCsvTableMetadata } from "@/app/features/data-sources/creation/csvAi";
import type { CsvImportedTableSummary } from "./types";

type Draft = {
  text: string;
  /** "ai" while the text is an untouched AI suggestion; any typing makes it the user's. */
  origin: "ai" | "edited";
};

/**
 * Settings → Content → table description for one CSV table. Same model as the column
 * descriptions: nothing is stored until Save changes, and replacing your own text asks first.
 */
export function CsvTableDescriptionSettings({
  table,
  canEdit,
  onSaveTable,
}: {
  table: CsvImportedTableSummary;
  canEdit: boolean;
  onSaveTable?: (next: CsvImportedTableSummary) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const requestToken = useRef(0);
  const editable = canEdit && Boolean(onSaveTable);
  const saved = table.tableDescription?.trim() ?? "";
  // Older descriptions have no origin; they were written by a person.
  const savedOrigin = table.tableDescriptionOrigin ?? "edited";
  const fieldId = `ds-tabledesc-${table.id}`;

  useEffect(() => {
    requestToken.current += 1;
    setDraft(null);
    setBusy(false);
    setConfirming(false);
    setNotice(null);
  }, [table.id]);

  function save() {
    if (!draft || !onSaveTable) return;
    const text = draft.text.trim();
    if (text === saved && (!text || draft.origin === savedOrigin)) {
      setDraft(null);
      return;
    }
    onSaveTable({
      ...table,
      tableDescription: text || undefined,
      tableDescriptionOrigin: text ? draft.origin : undefined,
    });
    setDraft(null);
    toast.success("Table description updated");
  }

  async function generate() {
    if (busy) return;
    const token = ++requestToken.current;
    setConfirming(false);
    setNotice(null);
    setDraft(null);
    setBusy(true);
    const result = await proposeCsvTableMetadata({
      fileId: table.id,
      fileName: table.fileName || table.tableName,
      columns: (table.columns ?? []).map((column) => ({ name: column.name, type: column.type })),
      sampleRows: [],
    });
    // Ignore a result that arrives after the table changed or another request started.
    if (token !== requestToken.current) return;
    setBusy(false);
    if (result.status !== "ok") {
      setNotice(result.message);
      return;
    }
    setDraft({ text: result.data.tableDescription, origin: "ai" });
  }

  function requestGenerate() {
    if (saved && savedOrigin === "edited") {
      setConfirming(true);
      return;
    }
    void generate();
  }

  if (!editable && !saved) return null;

  return (
    <div className="luxia-ds-tabledesc">
      <div className="luxia-ds-tabledesc-head">
        <p className="luxia-ds-tabledesc-label">Table description</p>
        {editable && !draft ? (
          <div className="luxia-ds-columns-actions">
            <Button
              type="button"
              variant="secondary"
              size="compact"
              disabled={busy}
              aria-label={`Edit table description for ${table.tableName || table.fileName}`}
              onClick={() => {
                setConfirming(false);
                setNotice(null);
                setDraft({ text: saved, origin: savedOrigin });
              }}
            >
              Edit
            </Button>
            <LuxiaAiButton
              disabled={busy}
              aria-busy={busy}
              aria-label={`${saved ? "Regenerate" : "Generate"} table description for ${table.tableName || table.fileName} with AI`}
              onClick={requestGenerate}
            >
              {busy ? "Generating…" : saved ? "Regenerate with AI" : "Generate with AI"}
            </LuxiaAiButton>
          </div>
        ) : null}
      </div>
      {draft ? (
        <div className="space-y-2">
          {draft.origin === "ai" ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              AI suggestion. Review it, then save.
            </p>
          ) : null}
          <Textarea
            id={fieldId}
            aria-label={`Table description for ${table.tableName || table.fileName}`}
            value={draft.text}
            rows={3}
            autoFocus
            className="luxia-type-body-dense"
            onChange={(event) => setDraft({ text: event.target.value, origin: "edited" })}
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
        <p className="luxia-ds-columns-text" data-empty={saved ? undefined : ""}>
          {busy ? "Generating…" : saved || "No description"}
          {!busy && saved && savedOrigin === "ai" ? <CsvAiOriginBadge /> : null}
        </p>
      )}
      {confirming ? (
        <div className="luxia-ds-columns-confirm" role="alert">
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-primary)" }}>
            Replace your description with an AI suggestion? Yours stays until you save the suggestion.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="compact" onClick={() => setConfirming(false)}>
              Keep mine
            </Button>
            <Button type="button" variant="secondary" size="compact" onClick={() => void generate()}>
              Generate suggestion
            </Button>
          </div>
        </div>
      ) : null}
      {notice ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
