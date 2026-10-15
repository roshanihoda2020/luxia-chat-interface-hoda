import { markdownToHtml, sanitizeImportedHtml, textToHtml } from "./documentIo";

export type WritingAssistantHandoff = {
  title: string;
  html: string;
  source: "chat";
  /** Originating Chat's Project when available. */
  projectId: string | null;
};

let pendingHandoff: WritingAssistantHandoff | null = null;

export function isEligibleWritingAssistantContent(content: string): boolean {
  const text = content.replace(/\s+/g, " ").trim();
  return text.length >= 24;
}

function looksLikeMarkdown(content: string): boolean {
  return /(?:^|\n)\s{0,3}#{1,3}\s+\S|(?:^|\n)\s*[-*]\s+\S|(?:^|\n)\s*\d+\.\s+\S|\*\*[^*]+\*\*|```/.test(
    content,
  );
}

export function chatContentToDocumentHtml(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "<p></p>";
  const html = looksLikeMarkdown(trimmed) ? markdownToHtml(trimmed) : textToHtml(trimmed);
  return sanitizeImportedHtml(html);
}

function cleanSuggestedTitle(raw: string): string {
  return raw
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/^\*\*(.+?)\*\*$/, "$1")
    .replace(/^__(.+?)__$/, "$1")
    .replace(/^Chat\s+Response\s*[-–—:]\s*/i, "")
    .replace(/^Chat\s+Response\b/i, "")
    .replace(/[*_`#]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateTitle(value: string, max = 64): string {
  if (value.length <= max) return value;
  const sliced = value.slice(0, max - 1).trim();
  const boundary = Math.max(sliced.lastIndexOf(" "), sliced.lastIndexOf("-"));
  const base = boundary >= 24 ? sliced.slice(0, boundary) : sliced;
  return `${base.trim()}…`;
}

export function suggestChatDocumentTitle(content: string): string {
  const lines = content
    .trim()
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 10)) {
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading?.[1]) {
      const fromHeading = cleanSuggestedTitle(heading[1]);
      if (fromHeading) return truncateTitle(fromHeading);
    }
  }

  const firstLine = lines[0];
  if (!firstLine) return "From Chat";

  let cleaned = cleanSuggestedTitle(firstLine);
  if (!cleaned) return "From Chat";

  // Prefer a concise phrase from the opening sentence when the line is long.
  if (cleaned.length > 64) {
    const sentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
    cleaned = cleanSuggestedTitle(sentence) || cleaned;
  }

  return truncateTitle(cleaned) || "From Chat";
}

export function queueWritingAssistantHandoff(
  content: string,
  options?: { projectId?: string | null },
): WritingAssistantHandoff | null {
  if (!isEligibleWritingAssistantContent(content)) return null;
  const projectId =
    typeof options?.projectId === "string" && options.projectId.trim()
      ? options.projectId.trim()
      : null;
  const handoff: WritingAssistantHandoff = {
    title: suggestChatDocumentTitle(content),
    html: chatContentToDocumentHtml(content),
    source: "chat",
    projectId,
  };
  pendingHandoff = handoff;
  return handoff;
}

export function consumeWritingAssistantHandoff(): WritingAssistantHandoff | null {
  const next = pendingHandoff;
  pendingHandoff = null;
  return next;
}
