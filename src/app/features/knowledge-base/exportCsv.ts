import { KB_RESPONSE_TYPES, type KnowledgeBaseEntry } from "./data";

const CSV_HEADERS = ["Question", "Answer", "Response Type"] as const;

export const KNOWLEDGE_BASE_EXPORT_FILENAME = "knowledge-base.csv";

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function responseTypeLabel(responseType: string | undefined): string {
  if (!responseType) return "";
  return KB_RESPONSE_TYPES.find((type) => type.id === responseType)?.label ?? responseType;
}

/** Build a UTF-8 CSV string for all draft Knowledge Base entries. */
export function buildKnowledgeBaseCsv(entries: readonly KnowledgeBaseEntry[]): string {
  const lines = [
    CSV_HEADERS.join(","),
    ...entries.map((entry) =>
      [
        escapeCsvCell(entry.question ?? ""),
        escapeCsvCell(entry.answer ?? ""),
        escapeCsvCell(responseTypeLabel(entry.responseType)),
      ].join(","),
    ),
  ];
  return lines.join("\r\n");
}

/** Trigger a browser download of the Knowledge Base CSV. */
export function downloadKnowledgeBaseCsv(
  entries: readonly KnowledgeBaseEntry[],
  filename: string = KNOWLEDGE_BASE_EXPORT_FILENAME,
): void {
  const csv = buildKnowledgeBaseCsv(entries);
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
