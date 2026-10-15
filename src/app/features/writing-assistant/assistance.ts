import {
  WRITING_ASSISTANT_ERRORS,
  type WritingAssistantActionId,
} from "./types";

const ASSISTANCE_DELAY_MS = 700;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function bulletize(text: string): string {
  const parts = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return `- ${collapseWhitespace(text)}`;
  }
  return parts.map((part) => `- ${part.replace(/^[-•*]\s+/, "")}`).join("\n");
}

function summarize(text: string): string {
  const compact = collapseWhitespace(text);
  if (compact.length <= 160) {
    return compact;
  }
  const cut = compact.slice(0, 157);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function makeFormal(text: string): string {
  const compact = collapseWhitespace(text);
  return compact
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bwon't\b/gi, "will not")
    .replace(/\bdon't\b/gi, "do not")
    .replace(/\bisn't\b/gi, "is not")
    .replace(/\baren't\b/gi, "are not")
    .replace(/\bI'm\b/g, "I am")
    .replace(/\bwe're\b/gi, "we are")
    .replace(/\byou're\b/gi, "you are")
    .replace(/\bthat's\b/gi, "that is")
    .replace(/\b!\b/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function rewrite(text: string): string {
  const compact = collapseWhitespace(text);
  if (!compact) return compact;
  const sentences = compact
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (sentences.length === 0) return compact;
  return sentences
    .map((sentence) => {
      const trimmed = sentence.replace(/\s+/g, " ").trim();
      if (!trimmed) return trimmed;
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    })
    .join(" ");
}

function translate(text: string, languageLabel: string): string {
  const compact = collapseWhitespace(text);
  return `[Translated to ${languageLabel}] ${compact}`;
}

function matchReference(text: string, referenceName: string): string {
  const compact = collapseWhitespace(text);
  const name = collapseWhitespace(referenceName) || "the reference document";
  return `Rewritten to match the tone and writing style of ${name}: ${compact}`;
}

function applyCustom(text: string, question: string): string {
  const compact = collapseWhitespace(text);
  const instruction = collapseWhitespace(question);
  return `${compact}\n\n(${instruction})`;
}

export function suggestionToHtml(suggestion: string): string {
  const lines = suggestion.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(`<ul>${listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bullet = line.match(/^[-•*]\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      continue;
    }
    flushList();
    if (!line) continue;
    blocks.push(`<p>${escapeHtml(line)}</p>`);
  }
  flushList();

  if (blocks.length === 0) {
    return `<p>${escapeHtml(suggestion)}</p>`;
  }
  return blocks.join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type AssistanceRequest =
  | {
    kind: "action";
    actionId: WritingAssistantActionId;
    targetLanguage?: string;
    targetLanguageLabel?: string;
    referenceFileName?: string;
  }
  | { kind: "question"; question: string };

export type AssistanceResult =
  | { ok: true; suggestion: string }
  | { ok: false; error: string };

export async function runLocalAssistance(
  selectedText: string,
  request: AssistanceRequest,
): Promise<AssistanceResult> {
  await delay(ASSISTANCE_DELAY_MS);

  const text = selectedText.trim();
  if (!text) {
    return { ok: false, error: WRITING_ASSISTANT_ERRORS.selectAndQuery };
  }

  if (request.kind === "question") {
    const question = request.question.trim();
    if (!question) {
      return { ok: false, error: WRITING_ASSISTANT_ERRORS.selectAndQuery };
    }
    return { ok: true, suggestion: applyCustom(text, question) };
  }

  switch (request.actionId) {
    case "translate": {
      const label = request.targetLanguageLabel?.trim();
      if (!request.targetLanguage || !label) {
        return { ok: false, error: WRITING_ASSISTANT_ERRORS.selectLanguage };
      }
      return { ok: true, suggestion: translate(text, label) };
    }
    case "rewrite":
      return { ok: true, suggestion: rewrite(text) };
    case "make-formal":
      return { ok: true, suggestion: makeFormal(text) };
    case "bulletize":
      return { ok: true, suggestion: bulletize(text) };
    case "summarize":
      return { ok: true, suggestion: summarize(text) };
    case "match-reference": {
      const referenceName = request.referenceFileName?.trim();
      if (!referenceName) {
        return { ok: false, error: WRITING_ASSISTANT_ERRORS.selectReference };
      }
      return { ok: true, suggestion: matchReference(text, referenceName) };
    }
    default:
      return { ok: false, error: WRITING_ASSISTANT_ERRORS.invalidResponse };
  }
}

export function rangesReferToSameSelection(
  a: Range | null | undefined,
  b: Range | null | undefined,
): boolean {
  if (!a || !b) return false;
  try {
    return (
      a.startContainer === b.startContainer
      && a.endContainer === b.endContainer
      && a.startOffset === b.startOffset
      && a.endOffset === b.endOffset
    );
  } catch {
    return false;
  }
}

export function isRangeInNode(range: Range, root: Node): boolean {
  try {
    return root.contains(range.commonAncestorContainer);
  } catch {
    return false;
  }
}

export function replaceRangeWithHtml(range: Range, html: string): void {
  range.deleteContents();
  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  const last = fragment.lastChild;
  range.insertNode(fragment);
  if (last) {
    const next = document.createRange();
    next.setStartAfter(last);
    next.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(next);
  }
}
