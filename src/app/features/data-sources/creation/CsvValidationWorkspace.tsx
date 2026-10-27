import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, ChevronDown, CircleAlert, Pencil, SkipForward, Type, Upload } from "lucide-react";
import { LuxiaAiIcon } from "@/assets/icons";
import { CsvAiOriginBadge } from "./CsvAiOriginBadge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  columnProblemCopy,
  csvColumnTypeLabel,
  csvFileOutcome,
  selectedColumnType,
  type CsvAiProposal,
  type CsvColumnType,
  type CsvFileOutcome,
  type CsvImportFileDraft,
  type CsvTypeSuggestion,
  type CsvValidationStrategy,
} from "./csv";
import type { CsvValidationIssue } from "./types";

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

function fileCorrections(file: CsvImportFileDraft) {
  const items: Array<{
    rowNumber: number;
    columnId: string;
    columnName: string;
    origin: "ai" | "manual";
    value: string;
  }> = [];
  for (const [rowKey, cells] of Object.entries(file.fixMeta ?? {})) {
    const rowNumber = Number(rowKey);
    for (const [columnId, meta] of Object.entries(cells)) {
      const value = file.overrides[rowNumber]?.[columnId];
      if (value === undefined) continue;
      const column = file.columns.find((item) => item.id === columnId);
      items.push({
        rowNumber,
        columnId,
        columnName: column?.name ?? columnId,
        origin: meta.origin,
        value,
      });
    }
  }
  return items.sort((left, right) => left.rowNumber - right.rowNumber || left.columnName.localeCompare(right.columnName));
}

function resultTitle(outcome: CsvFileOutcome): string {
  if (outcome.resolution === "resolved") return "Resolved";
  if (outcome.resolution === "needs-resolution") return "Needs resolution";
  return "Ready to import";
}

function resultDetail(file: CsvImportFileDraft, outcome: CsvFileOutcome): string {
  if (outcome.resolution === "no-issues") {
    const count = outcome.totalRows;
    return `${count.toLocaleString()} ${count === 1 ? "row" : "rows"} · No issues found`;
  }
  const parts = [`${outcome.importedRows.toLocaleString()} ${outcome.importedRows === 1 ? "row" : "rows"} ready`];
  if (outcome.skippedRows > 0) parts.push(`${outcome.skippedRows.toLocaleString()} skipped`);
  if (file.importAsText) parts.push("All columns as Text");
  return parts.join(" · ");
}

/** Fix counts only matter when types are enforced; import-as-text supersedes them. */
function resultFixes(file: CsvImportFileDraft, outcome: CsvFileOutcome): string | null {
  if (file.importAsText || outcome.resolution !== "resolved") return null;
  const parts: string[] = [];
  if (outcome.aiFixedRows > 0) parts.push(`${valueCount(outcome.aiFixedRows)} fixed by AI`);
  if (outcome.manuallyFixedRows > 0) parts.push(`${valueCount(outcome.manuallyFixedRows)} fixed manually`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function valueCount(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "value" : "values"}`;
}

function rowAttentionLabel(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "row needs" : "rows need"} attention`;
}

export function CsvValidationWorkspace({
  file,
  proposing,
  proposeNotice,
  onSelectStrategy,
  onUndoFix,
  onUndoSkip,
  onUndoAllSkipped,
  onSaveFix,
  onPropose,
  onApplyProposal,
  onApplyAll,
  onRejectProposal,
  onRestoreDetectedTypes,
  onReplaceFile,
  onUseSuggestion,
}: {
  file: CsvImportFileDraft;
  proposing: boolean;
  proposeNotice: string | null;
  onSelectStrategy: (strategy: CsvValidationStrategy) => void;
  onUndoFix: (rowNumber: number, columnId: string) => void;
  onUndoSkip: (rowNumber: number) => void;
  onUndoAllSkipped: () => void;
  onSaveFix: (issue: CsvValidationIssue, value: string) => string | null;
  onPropose: () => void;
  onApplyProposal: (proposal: CsvAiProposal) => void;
  onApplyAll: () => void;
  onRejectProposal: (proposal: CsvAiProposal) => void;
  onRestoreDetectedTypes: () => void;
  onReplaceFile: (next: File) => void;
  onUseSuggestion: (suggestion: CsvTypeSuggestion) => void;
}) {
  const replaceInputId = useId();
  const replaceRef = useRef<HTMLInputElement>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const outcome = csvFileOutcome(file);
  const summary = outcome.summary;
  const previousIssueCount = useRef(summary.issues.length);
  const choice = file.validationStrategy;

  useEffect(() => {
    setEditingKey(null);
    setDraft("");
    setEditError(null);
  }, [file.id]);

  useEffect(() => {
    if (summary.issues.length < previousIssueCount.current) {
      const next = document.querySelector<HTMLElement>("[data-csv-validation-edit]");
      (next ?? document.getElementById(`csv-validation-summary-${file.id}`))?.focus();
    }
    previousIssueCount.current = summary.issues.length;
  }, [summary.issues.length, file.aiProposals.length, file.id]);

  if (!outcome.fresh) {
    return (
      <div className="luxia-csv-validation-result" role="status">
        <span className="luxia-csv-validation-result-icon" data-tone="muted">
          <CircleAlert size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="luxia-csv-validation-title">{file.fileName}</p>
          <p className="luxia-csv-validation-meta">
            {file.validationStale ? "Check this file again after parsing or type changes." : "Checking this file…"}
          </p>
        </div>
      </div>
    );
  }

  const issues = summary.issues;
  const groups = groupIssues(file, issues);
  const proposals = (file.aiProposals ?? []).filter((item) => item.status === "proposed");
  const unrecoverable = (file.aiProposals ?? []).filter((item) => item.status === "unrecoverable");
  const proposalsFor = (columnId: string) => proposals.filter((item) => item.columnId === columnId);
  const corrections = fileCorrections(file);
  const rejected = (file.aiProposals ?? []).filter((proposal) =>
    proposal.status === "rejected"
    && !corrections.some((item) => item.rowNumber === proposal.rowNumber && item.columnId === proposal.columnId),
  );
  const skippedRows = [...new Set(file.skipped)].sort((a, b) => a - b);
  const skippedSet = new Set(skippedRows);
  const importedCorrections = corrections.filter((item) => !skippedSet.has(item.rowNumber));
  const calm = outcome.resolution === "no-issues" || outcome.resolution === "resolved";

  function startEdit(issue: CsvValidationIssue) {
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
    const fixes = resultFixes(file, outcome);
    // A fix inside a skipped row never reaches the import, so it is listed under that row instead.
    const aiFixes = importedCorrections.filter((item) => item.origin === "ai");
    const manualFixes = importedCorrections.filter((item) => item.origin === "manual");
    const hasDetails = aiFixes.length > 0 || manualFixes.length > 0 || skippedRows.length > 0;
    return (
      <div id={`csv-validation-summary-${file.id}`} className="space-y-2" tabIndex={-1}>
        <div className="luxia-csv-validation-result">
          <span className="luxia-csv-validation-result-icon" data-tone={calm ? "ok" : "attention"}>
            {calm ? <CheckCircle2 size={20} aria-hidden /> : <CircleAlert size={20} aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <div role="status">
              <p className="luxia-csv-validation-kicker">{file.fileName}</p>
              <p className="luxia-csv-validation-title">{resultTitle(outcome)}</p>
              <p className="luxia-csv-validation-meta">{resultDetail(file, outcome)}</p>
              {fixes ? <p className="luxia-csv-validation-outcome-facts">{fixes}</p> : null}
            </div>
            {file.importAsText ? (
              <div className="luxia-csv-validation-result-actions mt-2">
                <Button type="button" variant="outline" size="compact" onClick={onRestoreDetectedTypes}>
                  Restore detected types
                </Button>
              </div>
            ) : null}
            {hasDetails ? (
              <div className="luxia-csv-resolved-details">
                {aiFixes.length > 0 ? (
                  <ResolvedSection title="AI fixes" count={aiFixes.length}>
                    {aiFixes.map((item) => (
                      <FixRow
                        key={`${item.rowNumber}:${item.columnId}`}
                        item={item}
                        onUndo={() => onUndoFix(item.rowNumber, item.columnId)}
                      />
                    ))}
                  </ResolvedSection>
                ) : null}
                {manualFixes.length > 0 ? (
                  <ResolvedSection title="Manual fixes" count={manualFixes.length}>
                    {manualFixes.map((item) => (
                      <FixRow
                        key={`${item.rowNumber}:${item.columnId}`}
                        item={item}
                        onUndo={() => onUndoFix(item.rowNumber, item.columnId)}
                      />
                    ))}
                  </ResolvedSection>
                ) : null}
                {skippedRows.length > 0 ? (
                  <ResolvedSection title="Skipped rows" count={skippedRows.length}>
                    <SkippedRowItems
                      rows={skippedRows}
                      corrections={corrections}
                      onRestore={onUndoSkip}
                      onRestoreAll={onUndoAllSkipped}
                      onUndoFix={onUndoFix}
                    />
                  </ResolvedSection>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {file.typeSuggestions.length > 0 ? <TypeSuggestions file={file} onUseSuggestion={onUseSuggestion} /> : null}
      </div>
    );
  }

  return (
    <div id={`csv-validation-summary-${file.id}`} className="space-y-3" tabIndex={-1}>
      <div className="luxia-csv-validation-problem">
        <div className="luxia-csv-validation-issue-summary" role="status">
          <span className="luxia-csv-validation-result-icon" data-tone="attention">
            <CircleAlert size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="luxia-csv-validation-kicker">{file.fileName} · Needs resolution</p>
            <p className="luxia-csv-validation-title">{rowAttentionLabel(outcome.rejectedRows)}</p>
          </div>
        </div>

        <div className="luxia-settings-table-surface overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                <th scope="col" className="px-3 py-2 font-normal">Column</th>
                <th scope="col" className="px-3 py-2 font-normal">Problem</th>
                <th scope="col" className="px-3 py-2 font-normal">Example</th>
                <th scope="col" className="px-3 py-2 font-normal">Rows</th>
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
                  <td className="px-3 py-2">{group.problem}</td>
                  <td className="px-3 py-2">
                    {group.examples.map((example) => (
                      <p key={example} className="luxia-type-caption">{example}</p>
                    ))}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{group.affected.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <fieldset className="luxia-csv-resolution">
          <legend className="luxia-csv-resolution-legend">Resolution</legend>
          <div role="radiogroup" aria-label="Ways to resolve these issues" className="luxia-csv-resolution-options">
            <ResolutionOption
              name={`csv-resolution-${file.id}`}
              checked={choice === "skip"}
              icon={<SkipForward size={16} aria-hidden />}
              label="Skip affected rows"
              hint="Import the valid rows and leave the affected rows out."
              onSelect={() => onSelectStrategy("skip")}
            />
            <ResolutionOption
              name={`csv-resolution-${file.id}`}
              checked={choice === "ai"}
              icon={<LuxiaAiIcon size={16} aria-hidden />}
              label="Let AI propose fixes"
              hint="Review suggested corrections before applying them."
              onSelect={() => onSelectStrategy("ai")}
            />
            <ResolutionOption
              name={`csv-resolution-${file.id}`}
              checked={choice === "manual"}
              icon={<Pencil size={16} aria-hidden />}
              label="Fix manually"
              hint="Edit the affected values yourself."
              onSelect={() => onSelectStrategy("manual")}
            />
            <ResolutionOption
              name={`csv-resolution-${file.id}`}
              checked={choice === "reupload"}
              icon={<Upload size={16} aria-hidden />}
              label="Fix the file myself and re-upload"
              hint="Upload a corrected version of this CSV."
              onSelect={() => onSelectStrategy("reupload")}
            />
            <ResolutionOption
              name={`csv-resolution-${file.id}`}
              checked={choice === "text"}
              icon={<Type size={16} aria-hidden />}
              label="Import everything as text"
              hint="Keep all values without enforcing detected types."
              onSelect={() => onSelectStrategy("text")}
            />
          </div>
        </fieldset>

        {choice === "ai" ? (
          <div className="luxia-csv-resolution-detail" aria-live="polite">
            {!file.aiProposalsGenerated ? (
              <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
                No suggestions yet
              </p>
            ) : null}
            <Button type="button" variant="secondary" size="compact" disabled={proposing} aria-busy={proposing} onClick={onPropose}>
              <LuxiaAiIcon size={16} aria-hidden />
              {proposing ? "Preparing suggestions…" : "Propose fixes"}
            </Button>
            {proposeNotice ? (
              <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
                {proposeNotice}
              </p>
            ) : null}
            {unrecoverable.length > 0 ? (
              <ul className="space-y-1.5">
                {unrecoverable.map((proposal) => (
                  <li key={`${proposal.rowNumber}:${proposal.columnId}`} className="luxia-csv-validation-unrecoverable">
                    <p className="luxia-type-caption" style={{ color: "var(--luxia-text-primary)" }}>
                      {`${proposal.columnName} · Row ${proposal.rowNumber.toLocaleString()} · ${proposal.currentValue || "empty"}`}
                    </p>
                    <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                      Could not be repaired
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
            {proposals.length > 0 ? (
              <div className="space-y-2">
                {groups.map((group) => {
                  const columnProposals = proposalsFor(group.columnId);
                  if (columnProposals.length === 0) return null;
                  return (
                    <div key={group.columnId} className="space-y-2">
                      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        {`${group.columnName} · Suggested`}
                      </p>
                      <ul className="space-y-1.5">
                        {columnProposals.map((proposal) => (
                          <li key={`${proposal.rowNumber}:${proposal.columnId}`} className="luxia-csv-validation-row">
                            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-primary)" }}>
                              {`Row ${proposal.rowNumber.toLocaleString()} · ${proposal.currentValue || "empty"} → ${proposal.suggestedValue}`}
                              <CsvAiOriginBadge />
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
            <CorrectionUndoList
              items={corrections.filter((item) => item.origin === "ai")}
              statusLabel="Accepted"
              ai
              onUndoFix={onUndoFix}
            />
            {rejected.length > 0 ? (
              <ul className="space-y-1">
                {rejected.map((proposal) => (
                  <li key={`${proposal.rowNumber}:${proposal.columnId}`} className="luxia-type-caption luxia-csv-validation-settled">
                    {`${proposal.columnName} · Row ${proposal.rowNumber.toLocaleString()} · Rejected`}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {choice === "manual" ? (
          <div className="luxia-csv-resolution-detail">
            <ul className="space-y-1.5">
              {issues.map((issue) => {
                const key = `${issue.rowNumber}:${issue.columnId}`;
                const editing = editingKey === key;
                const column = file.columns.find((item) => item.id === issue.columnId);
                const expected = column ? csvColumnTypeLabel(selectedColumnType(column)) : csvColumnTypeLabel(issue.expected);
                return (
                  <li key={key} className="luxia-csv-validation-row">
                    <div className="min-w-0 flex-1">
                      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-primary)" }}>
                        {`${issue.columnName} · Row ${issue.rowNumber.toLocaleString()}`}
                      </p>
                      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        {`Current ${issue.value || "empty"} · Expected ${expected}`}
                      </p>
                      {editing ? (
                        <div className="mt-2 space-y-2">
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
                    </div>
                    {editing ? null : (
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        data-csv-validation-edit=""
                        aria-label={`Edit row ${issue.rowNumber}, ${issue.columnName}`}
                        onClick={() => startEdit(issue)}
                      >
                        <Pencil size={14} aria-hidden />
                        Edit
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            <CorrectionUndoList
              items={corrections.filter((item) => item.origin === "manual")}
              statusLabel="Saved"
              onUndoFix={onUndoFix}
            />
          </div>
        ) : null}

        {choice === "reupload" ? (
          <div className="luxia-csv-resolution-detail">
            <Button
              type="button"
              variant="secondary"
              size="compact"
              aria-label={`Replace ${file.fileName}`}
              onClick={() => replaceRef.current?.click()}
            >
              <Upload size={16} aria-hidden />
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
          <div className="luxia-csv-resolution-detail">
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
              All columns in this file will be imported as Text.
            </p>
            <Button type="button" variant="outline" size="compact" onClick={onRestoreDetectedTypes}>
              Restore detected types
            </Button>
          </div>
        ) : null}

        {choice === "skip" ? (
          <div className="luxia-csv-resolution-detail">
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} role="status">
              {`${outcome.skippedRows.toLocaleString()} ${outcome.skippedRows === 1 ? "row" : "rows"} will stay out of the import.`}
            </p>
            {skippedRows.length > 0 ? (
              <ul className="luxia-csv-resolved-list" data-flush="">
                <SkippedRowItems rows={skippedRows} corrections={corrections} onRestore={onUndoSkip} onRestoreAll={onUndoAllSkipped} onUndoFix={onUndoFix} />
              </ul>
            ) : null}
          </div>
        ) : null}
        {choice !== "skip" && skippedRows.length > 0 ? (
          <ResolvedSection title="Skipped rows" count={skippedRows.length}>
            <SkippedRowItems rows={skippedRows} corrections={corrections} onRestore={onUndoSkip} onRestoreAll={onUndoAllSkipped} onUndoFix={onUndoFix} />
          </ResolvedSection>
        ) : null}
      </div>

      {file.typeSuggestions.length > 0 ? <TypeSuggestions file={file} onUseSuggestion={onUseSuggestion} /> : null}
    </div>
  );
}

/** Matches the earlier cap on individual restore buttons; Restore all covers the rest. */
const SKIPPED_ROWS_LISTED = 8;
const RESOLVED_SECTION_OPEN_MAX = 3;

function ResolvedSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(count <= RESOLVED_SECTION_OPEN_MAX);
  return (
    <details
      className="luxia-csv-resolved-section"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="luxia-csv-resolved-summary">
        <ChevronDown size={14} strokeWidth={1.75} aria-hidden className="luxia-csv-resolved-chevron" />
        <span>{title}</span>
        <span className="luxia-csv-resolved-count">{`· ${count.toLocaleString()}`}</span>
      </summary>
      <ul className="luxia-csv-resolved-list">{children}</ul>
    </details>
  );
}

type CorrectionItem = ReturnType<typeof fileCorrections>[number];

function SkippedRowItems({
  rows,
  corrections,
  onRestore,
  onRestoreAll,
  onUndoFix,
}: {
  rows: number[];
  corrections: CorrectionItem[];
  onRestore: (rowNumber: number) => void;
  onRestoreAll: () => void;
  onUndoFix: (rowNumber: number, columnId: string) => void;
}) {
  return (
    <>
      {rows.slice(0, SKIPPED_ROWS_LISTED).map((rowNumber) => (
        <li key={rowNumber}>
          <div className="luxia-csv-resolved-row">
            <span className="luxia-csv-resolved-row-text">{`Row ${rowNumber.toLocaleString()}`}</span>
            <Button
              type="button"
              variant="tertiary"
              size="compact"
              aria-label={`Restore skipped row ${rowNumber}`}
              onClick={() => onRestore(rowNumber)}
            >
              Restore
            </Button>
          </div>
          {corrections.filter((item) => item.rowNumber === rowNumber).map((item) => (
            <div key={item.columnId} className="luxia-csv-resolved-row" data-nested="">
              <span className="luxia-csv-resolved-row-text" data-tone="muted" title={item.value}>
                {`${item.columnName} → ${item.value || "empty"}`}
                {item.origin === "ai" ? <CsvAiOriginBadge /> : null}
                {" · not imported while skipped"}
              </span>
              <Button
                type="button"
                variant="tertiary"
                size="compact"
                aria-label={`Undo ${item.origin === "ai" ? "AI" : "manual"} fix for row ${rowNumber}, ${item.columnName}`}
                onClick={() => onUndoFix(rowNumber, item.columnId)}
              >
                Undo
              </Button>
            </div>
          ))}
        </li>
      ))}
      {rows.length > 1 ? (
        <li className="luxia-csv-resolved-row">
          <span className="luxia-csv-resolved-row-text" data-tone="muted">
            {rows.length > SKIPPED_ROWS_LISTED
              ? `${(rows.length - SKIPPED_ROWS_LISTED).toLocaleString()} more skipped`
              : "All skipped rows"}
          </span>
          <Button
            type="button"
            variant="tertiary"
            size="compact"
            aria-label="Restore all skipped rows"
            onClick={onRestoreAll}
          >
            Restore all
          </Button>
        </li>
      ) : null}
    </>
  );
}

function FixRow({
  item,
  onUndo,
}: {
  item: CorrectionItem;
  onUndo: () => void;
}) {
  const ai = item.origin === "ai";
  return (
    <li className="luxia-csv-resolved-row">
      <span className="luxia-csv-resolved-row-text" title={item.value}>
        {`Row ${item.rowNumber.toLocaleString()} · ${item.columnName} → ${item.value || "empty"}`}
        {ai ? <CsvAiOriginBadge /> : null}
      </span>
      <Button
        type="button"
        variant="tertiary"
        size="compact"
        aria-label={`Undo ${ai ? "AI" : "manual"} fix for row ${item.rowNumber}, ${item.columnName}`}
        onClick={onUndo}
      >
        Undo
      </Button>
    </li>
  );
}

function CorrectionUndoList({
  items,
  statusLabel,
  ai = false,
  onUndoFix,
}: {
  items: Array<{ rowNumber: number; columnId: string; columnName: string; value: string }>;
  statusLabel?: string;
  ai?: boolean;
  onUndoFix: (rowNumber: number, columnId: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={`${item.rowNumber}:${item.columnId}`} className="luxia-csv-validation-row">
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-primary)" }}>
            {`${statusLabel ? `${statusLabel} · ` : ""}${item.columnName} · Row ${item.rowNumber.toLocaleString()} · ${item.value || "empty"}`}
            {ai ? <CsvAiOriginBadge /> : null}
          </p>
          <Button
            type="button"
            variant="outline"
            size="compact"
            aria-label={`Undo correction for row ${item.rowNumber}, ${item.columnName}`}
            onClick={() => onUndoFix(item.rowNumber, item.columnId)}
          >
            Undo
          </Button>
        </li>
      ))}
    </ul>
  );
}

function ResolutionOption({
  name,
  checked,
  icon,
  label,
  hint,
  onSelect,
}: {
  name: string;
  checked: boolean;
  icon: ReactNode;
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
      <span className="luxia-csv-resolution-icon">{icon}</span>
      <span className="min-w-0">
        <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{label}</span>
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
