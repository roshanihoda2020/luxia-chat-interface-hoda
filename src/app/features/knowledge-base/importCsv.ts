import { parseCsvTable } from "@/app/features/data-sources/creation/csv";
import { KB_RESPONSE_TYPES, type KnowledgeBaseEntry } from "./data";

/** Filename sentinel for prototype failure path (not shown in UI). */
export const KB_IMPORT_FAIL_FILENAME_TOKEN = "__import_fail";

export type KbImportCounts = {
  created: number;
  skipped: number;
  empty: number;
  invalid: number;
};

export type KbImportInvalidRow = {
  rowNumber: number;
  question: string;
  answer: string;
  responseType: string;
  reason: string;
};

export type KbImportParseResult = {
  counts: KbImportCounts;
  createdEntries: KnowledgeBaseEntry[];
  invalidRows: KbImportInvalidRow[];
};

export type KbImportRunOutcome =
  | { status: "completed"; result: KbImportParseResult }
  | { status: "cancelled" }
  | { status: "failed"; error: string };

export type KbImportCancelHandle = {
  cancel: () => void;
};

const REQUIRED_HEADERS = ["question", "answer", "response type"] as const;

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

function normalizeHeader(value: string): string {
  return stripBom(value).trim().toLowerCase();
}

function resolveResponseTypeId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "narrative";
  const lowered = trimmed.toLowerCase();
  const byId = KB_RESPONSE_TYPES.find((type) => type.id === lowered);
  if (byId) return byId.id;
  const byLabel = KB_RESPONSE_TYPES.find((type) => type.label.toLowerCase() === lowered);
  if (byLabel) return byLabel.id;
  return null;
}

export function shouldMockKbImportFail(fileName: string): boolean {
  return fileName.toLowerCase().includes(KB_IMPORT_FAIL_FILENAME_TOKEN);
}

/**
 * Parse a Knowledge Base CSV (Question / Answer / Response Type) into
 * created / skipped / empty / invalid buckets for the prototype import flow.
 */
export function parseKnowledgeBaseCsvImport(
  text: string,
  existingEntries: readonly KnowledgeBaseEntry[],
): KbImportParseResult {
  const parsed = parseCsvTable(stripBom(text), "comma");
  const headerMap = new Map(parsed.headers.map((header, index) => [normalizeHeader(header), index]));

  for (const required of REQUIRED_HEADERS) {
    if (!headerMap.has(required)) {
      throw new Error(
        "This CSV is missing required columns. Expected: Question, Answer, Response Type.",
      );
    }
  }

  const questionIndex = headerMap.get("question")!;
  const answerIndex = headerMap.get("answer")!;
  const responseTypeIndex = headerMap.get("response type")!;

  const seenQuestions = new Set(
    existingEntries.map((entry) => entry.question.trim().toLowerCase()).filter(Boolean),
  );

  const createdEntries: KnowledgeBaseEntry[] = [];
  const invalidRows: KbImportInvalidRow[] = [];
  let skipped = 0;
  let empty = 0;

  const stamp = Date.now();

  for (const record of parsed.records) {
    const question = (record.fields[questionIndex] ?? "").trim();
    const answer = (record.fields[answerIndex] ?? "").trim();
    const responseTypeRaw = (record.fields[responseTypeIndex] ?? "").trim();

    if (!question && !answer && !responseTypeRaw) {
      empty += 1;
      continue;
    }

    if (!question || !answer) {
      invalidRows.push({
        rowNumber: record.rowNumber,
        question,
        answer,
        responseType: responseTypeRaw,
        reason: !question && !answer
          ? "Missing Question and Answer"
          : !question
            ? "Missing Question"
            : "Missing Answer",
      });
      continue;
    }

    const responseTypeId = resolveResponseTypeId(responseTypeRaw);
    if (responseTypeId === null) {
      invalidRows.push({
        rowNumber: record.rowNumber,
        question,
        answer,
        responseType: responseTypeRaw,
        reason: `Invalid Response Type "${responseTypeRaw}"`,
      });
      continue;
    }

    const questionKey = question.toLowerCase();
    if (seenQuestions.has(questionKey)) {
      skipped += 1;
      continue;
    }

    seenQuestions.add(questionKey);
    createdEntries.push({
      id: `kb-import-${stamp}-${createdEntries.length + 1}`,
      question,
      answer,
      responseType: responseTypeId,
    });
  }

  return {
    counts: {
      created: createdEntries.length,
      skipped,
      empty,
      invalid: invalidRows.length,
    },
    createdEntries,
    invalidRows,
  };
}

export function buildKbImportErrorCsv(invalidRows: readonly KbImportInvalidRow[]): string {
  const header = ["Row", "Question", "Answer", "Response Type", "Reason"];
  const escape = (value: string) => {
    if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };
  const lines = [
    header.join(","),
    ...invalidRows.map((row) =>
      [
        String(row.rowNumber),
        escape(row.question),
        escape(row.answer),
        escape(row.responseType),
        escape(row.reason),
      ].join(","),
    ),
  ];
  return lines.join("\r\n");
}

export function downloadKbImportErrorCsv(
  invalidRows: readonly KbImportInvalidRow[],
  filename = "knowledge-base-import-errors.csv",
): void {
  const csv = buildKbImportErrorCsv(invalidRows);
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

/**
 * Local mock async import: advances progress over time, then completes / fails / cancels.
 * No network, sockets, or polling.
 */
export function runMockKbCsvImport(options: {
  file: File;
  existingEntries: readonly KnowledgeBaseEntry[];
  onProgress: (percent: number) => void;
}): { promise: Promise<KbImportRunOutcome>; handle: KbImportCancelHandle } {
  let cancelled = false;
  const timers: number[] = [];

  const clearTimers = () => {
    for (const id of timers) window.clearTimeout(id);
    timers.length = 0;
  };

  const handle: KbImportCancelHandle = {
    cancel: () => {
      cancelled = true;
      clearTimers();
    },
  };

  const promise = (async (): Promise<KbImportRunOutcome> => {
    options.onProgress(4);

    let text: string;
    try {
      text = await options.file.text();
    } catch {
      return {
        status: "failed",
        error: "Could not read the selected CSV file. Try choosing the file again.",
      };
    }

    if (cancelled) return { status: "cancelled" };

    const forceFail = shouldMockKbImportFail(options.file.name);

    let parseResult: KbImportParseResult | null = null;
    let parseError: string | null = null;

    if (!forceFail) {
      try {
        parseResult = parseKnowledgeBaseCsvImport(text, options.existingEntries);
      } catch (error) {
        parseError = error instanceof Error ? error.message : "The CSV could not be imported.";
      }
    }

    const steps = [12, 28, 46, 64, 78, 90, 100];
    const stepDelayMs = 220;

    for (let index = 0; index < steps.length; index += 1) {
      if (cancelled) return { status: "cancelled" };

      await new Promise<void>((resolve) => {
        const id = window.setTimeout(resolve, stepDelayMs);
        timers.push(id);
      });

      if (cancelled) return { status: "cancelled" };
      options.onProgress(steps[index]!);

      if (forceFail && steps[index]! >= 46) {
        return {
          status: "failed",
          error: "Import failed while processing the CSV. You can retry with the same file.",
        };
      }
    }

    if (cancelled) return { status: "cancelled" };

    if (parseError) {
      return { status: "failed", error: parseError };
    }

    return {
      status: "completed",
      result: parseResult ?? {
        counts: { created: 0, skipped: 0, empty: 0, invalid: 0 },
        createdEntries: [],
        invalidRows: [],
      },
    };
  })().finally(() => {
    clearTimers();
  });

  return { promise, handle };
}
