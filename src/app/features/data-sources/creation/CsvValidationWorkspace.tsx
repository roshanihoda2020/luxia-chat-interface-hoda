import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  columnProblemCopy,
  csvColumnTypeLabel,
  selectedColumnType,
  type CsvAiProposal,
  type CsvColumnType,
  type CsvImportFileDraft,
  type CsvTypeSuggestion,
} from "./csv";
import { suggestedRepairValue } from "./csvAi";
import { CsvFileGlyph } from "./DataSourceTypeIcon";
import type { CsvValidationIssue, CsvValidationSummary } from "./types";

function quoteExample(issue: CsvValidationIssue): string {
  const value = issue.value.replace(/\s+/g, " ").trim();
  const shown = value.length > 42 ? `${value.slice(0, 41)}…` : value;
  return `line ${issue.rowNumber.toLocaleString()}: "${shown || "empty"}"`;
}

function groupIssues(file: CsvImportFileDraft, issues: CsvValidationIssue[]) {
  const groups = new Map<string, CsvValidationIssue[]>();
  for (const issue of issues) {
    const list = groups.get(issue.columnId) ?? [];
    list.push(issue);
    groups.set(issue.columnId, list);
  }
  return [...groups.entries()].map(([columnId, columnIssues]) => {
    const column = file.columns.find((item) => item.id === columnId);
    const type = column ? selectedColumnType(column) : (columnIssues[0]?.expected as CsvColumnType);
    const rows = new Set(columnIssues.map((issue) => issue.rowNumber));
    return {
      columnId,
      columnName: column?.name ?? columnIssues[0]?.columnName ?? "Column",
      affected: rows.size,
      examples: columnIssues.slice(0, 3).map(quoteExample),
      problem: columnProblemCopy(type, column?.dateFormat),
      issues: columnIssues,
    };
  });
}

type ValidationChoice = "skip" | "ai" | "manual" | "reupload" | "text";
const validationChoiceMemory = new Map<string, ValidationChoice | null>();

export function CsvValidationWorkspace({
  file,
  summary,
  proposing,
  proposeNotice,
  onSkipAffected,
  onUndoSkip,
  onUndoAllSkipped,
  onSaveFix,
  onPropose,
  onApplyProposal,
  onApplyAll,
  onRejectProposal,
  onImportAsText,
  onRestoreDetectedTypes,
  onReplaceFile,
  onUseSuggestion,
}: {
  file: CsvImportFileDraft;
  summary: CsvValidationSummary;
  proposing: boolean;
  proposeNotice: string | null;
  onSkipAffected: () => void;
  onUndoSkip: (rowNumber: number) => void;
  onUndoAllSkipped: () => void;
  onSaveFix: (issue: CsvValidationIssue, value: string) => string | null;
  onPropose: () => void;
  onApplyProposal: (proposal: CsvAiProposal) => void;
  onApplyAll: () => void;
  onRejectProposal: (proposal: CsvAiProposal) => void;
  onImportAsText: () => void;
  onRestoreDetectedTypes: () => void;
  onReplaceFile: (next: File) => void;
  onUseSuggestion: (suggestion: CsvTypeSuggestion) => void;
}) {
  const replaceInputId = useId();
  const replaceRef = useRef<HTMLInputElement>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [choice, setChoice] = useState<ValidationChoice | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const previousIssueCount = useRef(summary.issues.length);
  const previousProposalCount = useRef(0);
  const choiceFileRef = useRef(file.id);

  useEffect(() => {
    const remembered = validationChoiceMemory.has(file.id)
      ? validationChoiceMemory.get(file.id) ?? null
      : (file.aiProposals ?? []).length > 0
        ? "ai"
        : null;
    choiceFileRef.current = file.id;
    setManualOpen(remembered === "manual");
    setChoice(remembered);
    setEditingKey(null);
    setDraft("");
    setEditError(null);
    previousProposalCount.current = (file.aiProposals ?? []).length;
  }, [file.id]);

  useEffect(() => {
    if (choiceFileRef.current !== file.id) return;
    validationChoiceMemory.set(file.id, choice);
  }, [choice, file.id]);

  useEffect(() => {
    const count = (file.aiProposals ?? []).length;
    if (previousProposalCount.current === 0 && count > 0) setChoice("ai");
    previousProposalCount.current = count;
  }, [file.aiProposals]);

  useEffect(() => {
    if (summary.issues.length < previousIssueCount.current) {
      const next = document.querySelector<HTMLElement>("[data-csv-validation-edit]");
      (next ?? document.getElementById(`csv-validation-summary-${file.id}`))?.focus();
    }
    previousIssueCount.current = summary.issues.length;
  }, [summary.issues.length, file.aiProposals.length]);

  if (!file.validationRan || file.validationStale) {
    return (
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
        {file.validationStale ? "Check this file again after parsing or type changes." : "Checking this file…"}
      </p>
    );
  }

  const issues = summary.issues;
  const groups = groupIssues(file, issues);
  const repairable = issues.some((issue) => {
    const column = file.columns.find((item) => item.id === issue.columnId);
    const examples = column?.examples ?? [];
    return Boolean(suggestedRepairValue(issue.value, issue.expected, examples));
  });
  const proposals = file.aiProposals ?? [];
  const proposalsFor = (columnId: string) => proposals.filter((item) => item.columnId === columnId);
  const skippedRows = [...new Set(file.skipped)].sort((a, b) => a - b);

  function startEdit(issue: CsvValidationIssue) {
    setManualOpen(true);
    setEditingKey(`${issue.rowNumber}:${issue.columnId}`);
    setDraft(issue.value);
    setEditError(null);
  }

  function saveEdit(issue: CsvValidationIssue) {
    const message = onSaveFix(issue, draft);
    if (message) {
      setEditError(message);
      return;
    }
    setEditingKey(null);
    setDraft("");
    setEditError(null);
  }

  if (issues.length === 0) {
    const resolved = file.importAsText || skippedRows.length > 0 || summary.resolvedRows > 0;
    const resolvedLine = [
      `${summary.readyRows.toLocaleString()} ready`,
      summary.skippedRows > 0 ? `${summary.skippedRows.toLocaleString()} excluded` : "",
      summary.resolvedRows > 0 ? `${summary.resolvedRows.toLocaleString()} fixed` : "",
    ].filter(Boolean).join(" · ");
    return (
      <div id={`csv-validation-summary-${file.id}`} className="space-y-2" role="status" tabIndex={-1}>
        <ValidationFileHeading
          fileName={file.fileName}
          detail={resolved ? "Resolved" : "No issues"}
          tone="ok"
        />
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          {resolved
            ? resolvedLine
            : summary.totalRows === 1
              ? "The row can be imported as it is."
              : `All ${summary.totalRows.toLocaleString()} rows can be imported as they are.`}
        </p>
        {file.importAsText ? (
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            All columns will be imported as Text.
          </p>
        ) : null}
        {file.typeSuggestions.length > 0 ? <TypeSuggestions file={file} onUseSuggestion={onUseSuggestion} /> : null}
        {skippedRows.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="compact" onClick={onUndoAllSkipped}>
              Undo
            </Button>
            {skippedRows.slice(0, 8).map((rowNumber) => (
              <Button
                key={rowNumber}
                type="button"
                variant="outline"
                size="compact"
                aria-label={`Restore row ${rowNumber}`}
                onClick={() => onUndoSkip(rowNumber)}
              >
                {`Restore row ${rowNumber}`}
              </Button>
            ))}
          </div>
        ) : null}
        {file.importAsText ? (
          <Button type="button" variant="outline" size="compact" onClick={onRestoreDetectedTypes}>
            Restore detected types
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div id={`csv-validation-summary-${file.id}`} className="space-y-4" tabIndex={-1}>
      <div role="status">
        <ValidationFileHeading
          fileName={file.fileName}
          detail={`${issues.length.toLocaleString()} cell${issues.length === 1 ? "" : "s"} · ${summary.invalidRows.toLocaleString()} row${summary.invalidRows === 1 ? "" : "s"}`}
          tone="attention"
        />
      </div>
      <div className="luxia-settings-table-surface overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <thead>
            <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              <th scope="col" className="px-3 py-2 font-normal">Column</th>
              <th scope="col" className="px-3 py-2 font-normal">Affected</th>
              <th scope="col" className="px-3 py-2 font-normal">Example lines</th>
              <th scope="col" className="px-3 py-2 font-normal">Problem</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr
                key={group.columnId}
                className="border-t align-top luxia-type-caption"
                style={{ borderColor: "var(--luxia-settings-row-divider)", color: "var(--luxia-text-secondary)" }}
              >
                <th scope="row" className="px-3 py-2 font-normal" style={{ color: "var(--luxia-text-primary)" }}>
                  {group.columnName}
                </th>
                <td className="px-3 py-2 tabular-nums">{group.affected.toLocaleString()}</td>
                <td className="px-3 py-2">
                  {group.examples.map((example) => (
                    <p key={example}>{example}</p>
                  ))}
                </td>
                <td className="px-3 py-2">{group.problem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <fieldset className="luxia-csv-resolution">
        <legend className="sr-only">Ways to resolve these issues</legend>
        <div role="radiogroup" aria-label="Ways to resolve these issues" className="space-y-2">
          <ResolutionOption
            name={`csv-resolution-${file.id}`}
            checked={choice === "skip"}
            label="Skip the affected rows"
            hint="Those rows stay out of the import. You can restore them later."
            onSelect={() => {
              setChoice("skip");
              onSkipAffected();
            }}
          />
          {repairable || proposals.length > 0 ? (
            <ResolutionOption
              name={`csv-resolution-${file.id}`}
              checked={choice === "ai"}
              label="Let AI propose fixes"
              hint="Review each suggestion before it changes a value."
              onSelect={() => setChoice("ai")}
            />
          ) : null}
          <ResolutionOption
            name={`csv-resolution-${file.id}`}
            checked={choice === "manual"}
            label="Fix manually"
            hint="Edit a value, then save and validate it."
            onSelect={() => {
              setChoice("manual");
              setManualOpen(true);
            }}
          />
          <ResolutionOption
            name={`csv-resolution-${file.id}`}
            checked={choice === "reupload"}
            label="Fix the file myself and re-upload"
            hint="Replace this file and check it again."
            onSelect={() => setChoice("reupload")}
          />
          <ResolutionOption
            name={`csv-resolution-${file.id}`}
            checked={choice === "text"}
            label="Import everything as text"
            hint="Every column in this file will be imported as Text."
            onSelect={() => {
              setChoice("text");
              onImportAsText();
            }}
          />
        </div>
      </fieldset>

      {choice === "ai" ? (
        <div className="space-y-3" aria-live="polite">
          <Button type="button" variant="secondary" size="compact" disabled={proposing || !repairable} aria-busy={proposing} onClick={onPropose}>
            {proposing ? "Preparing suggestions…" : "Propose fixes"}
          </Button>
          {proposeNotice ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
              {proposeNotice}
            </p>
          ) : null}
          {proposals.length > 0 ? (
            <div className="space-y-2">
              {groups.map((group) => {
                const columnProposals = proposalsFor(group.columnId);
                if (columnProposals.length === 0) return null;
                return (
                  <div key={group.columnId} className="space-y-2">
                    <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                      {`${group.columnName} suggestions`}
                    </p>
                    <ul className="space-y-2">
                      {columnProposals.map((proposal) => (
                        <li
                          key={`${proposal.rowNumber}:${proposal.columnId}`}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t py-2"
                          style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                        >
                          <p className="min-w-0 luxia-type-caption" style={{ color: "var(--luxia-text-primary)" }}>
                            <span style={{ color: "var(--luxia-text-muted)" }}>Current </span>
                            {proposal.currentValue || "empty"}
                            <span style={{ color: "var(--luxia-text-muted)" }}> · Suggested </span>
                            {proposal.suggestedValue}
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="compact"
                            aria-label={`Apply suggested value ${proposal.suggestedValue} for row ${proposal.rowNumber}`}
                            onClick={() => onApplyProposal(proposal)}
                          >
                            Apply
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="compact"
                            aria-label={`Reject suggested value for row ${proposal.rowNumber}`}
                            onClick={() => onRejectProposal(proposal)}
                          >
                            Reject
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {proposals.length > 1 ? (
                <Button type="button" variant="secondary" size="compact" onClick={onApplyAll}>
                  Apply all suggestions
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {choice === "manual" ? (
        <ul className="space-y-2">
          {issues.map((issue) => {
            const key = `${issue.rowNumber}:${issue.columnId}`;
            const editing = editingKey === key;
            const column = file.columns.find((item) => item.id === issue.columnId);
            const expected = column ? csvColumnTypeLabel(selectedColumnType(column)) : csvColumnTypeLabel(issue.expected);
            return (
              <li key={key} className="border-t py-2" style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="luxia-type-caption" style={{ color: "var(--luxia-text-primary)" }}>
                    {`Row ${issue.rowNumber.toLocaleString()} · ${issue.columnName} · ${issue.value || "empty"}`}
                  </p>
                  {editing ? null : (
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      data-csv-validation-edit=""
                      aria-label={`Edit row ${issue.rowNumber}, ${issue.columnName}`}
                      onClick={() => startEdit(issue)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {editing ? (
                  <div className="mt-2 space-y-2">
                    <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                      {`Expected: ${expected}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={draft}
                        onChange={(event) => {
                          setDraft(event.target.value);
                          setEditError(null);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            saveEdit(issue);
                          }
                          if (event.key === "Escape") {
                            event.preventDefault();
                            setEditingKey(null);
                          }
                        }}
                        aria-label={`Value for row ${issue.rowNumber}, ${issue.columnName}`}
                        aria-invalid={Boolean(editError)}
                        autoFocus
                        className="h-9 min-h-9 min-w-[12rem] flex-1"
                      />
                      <Button type="button" variant="outline" size="compact" onClick={() => setEditingKey(null)}>
                        Cancel
                      </Button>
                      <Button type="button" variant="primary" size="compact" onClick={() => saveEdit(issue)}>
                        Save & validate
                      </Button>
                    </div>
                    {editError ? (
                      <p className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }} role="alert">
                        {editError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {choice === "reupload" ? (
        <div>
          <Button
            type="button"
            variant="secondary"
            size="compact"
            aria-label={`Replace ${file.fileName}`}
            onClick={() => replaceRef.current?.click()}
          >
            Replace this file
          </Button>
          <input
            ref={replaceRef}
            id={replaceInputId}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label={`Replace ${file.fileName}`}
            onChange={(event) => {
              const next = event.target.files?.[0];
              event.target.value = "";
              if (next) onReplaceFile(next);
            }}
          />
        </div>
      ) : null}

      {choice === "text" ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-warning-90)" }} role="status">
          Every column in this file will be stored as Text.
        </p>
      ) : null}

      {choice === "skip" ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
          {`${summary.invalidRows.toLocaleString()} row${summary.invalidRows === 1 ? "" : "s"} will be skipped.`}
        </p>
      ) : null}

      {file.typeSuggestions.length > 0 ? <TypeSuggestions file={file} onUseSuggestion={onUseSuggestion} /> : null}
    </div>
  );
}

function ValidationFileHeading({
  fileName,
  detail,
  tone,
}: {
  fileName: string;
  detail: string;
  tone: "ok" | "attention";
}) {
  return (
    <div className="luxia-csv-file-heading">
      <CsvFileGlyph />
      <div className="min-w-0">
        <h3 className="truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }} title={fileName}>
          {fileName}
        </h3>
        <p
          className="mt-0.5 luxia-type-caption"
          style={{ color: tone === "ok" ? "var(--luxia-success-70)" : "var(--luxia-text-secondary)" }}
        >
          {detail}
        </p>
      </div>
    </div>
  );
}

function ResolutionOption({
  name,
  checked,
  label,
  hint,
  onSelect,
}: {
  name: string;
  checked: boolean;
  label: string;
  hint: string;
  onSelect: () => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="luxia-csv-resolution-option">
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
      />
      <span>
        <span className="block" style={{ color: "var(--luxia-text-primary)" }}>{label}</span>
        <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{hint}</span>
      </span>
    </label>
  );
}

function TypeSuggestions({
  file,
  onUseSuggestion,
}: {
  file: CsvImportFileDraft;
  onUseSuggestion: (suggestion: CsvTypeSuggestion) => void;
}) {
  return (
    <ul className="space-y-1">
      {file.typeSuggestions.map((suggestion) => (
        <li key={suggestion.columnId} className="flex flex-wrap items-center gap-2">
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            {`${suggestion.columnName} now looks like ${csvColumnTypeLabel(suggestion.suggestedType)}.`}
          </p>
          <Button
            type="button"
            variant="outline"
            size="compact"
            onClick={() => onUseSuggestion(suggestion)}
          >
            {`Use ${csvColumnTypeLabel(suggestion.suggestedType)}`}
          </Button>
        </li>
      ))}
    </ul>
  );
}
