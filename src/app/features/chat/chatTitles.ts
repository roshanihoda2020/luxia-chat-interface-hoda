/**
 * Chat titles (frontend, deterministic — no AI or backend title service).
 *
 * - A new chat is called "New chat" until its first question is sent.
 * - The first question then becomes the title: whitespace collapsed, cut at a word boundary
 *   near 40 characters (with "…"), original language and wording kept.
 * - Titles are unique, case-insensitively, among the titles passed in (the caller passes the
 *   current user's chats; see the ownership limitation in App). Duplicates get " (2)", " (3)"…
 * - Manually renamed chats are never re-titled (the caller tracks that).
 */
export const NEW_CHAT_TITLE = "New chat";
export const CHAT_TITLE_MAX = 80;
const TARGET = 40;
const FALLBACK = "Untitled chat";

const norm = (value: string) => value.trim().toLocaleLowerCase();

/** A concise title from the first question; a generic fallback when it has no words. */
export function titleFromQuestion(question: string): string {
  const clean = question.replace(/\s+/g, " ").trim().replace(/^["'“”‘’«»]+|["'“”‘’«»]+$/g, "").trim();
  // Needs at least two letters/digits in any script to be meaningful.
  if ((clean.match(/[\p{L}\p{N}]/gu) ?? []).length < 2) return FALLBACK;
  if (clean.length <= TARGET) return clean;
  const cut = clean.slice(0, TARGET + 1);
  const lastSpace = cut.lastIndexOf(" ");
  // Prefer a word boundary; fall back to a hard cut for scripts/words without spaces.
  const base = (lastSpace >= TARGET * 0.6 ? cut.slice(0, lastSpace) : clean.slice(0, TARGET)).replace(/[\s,;:.\-–—]+$/u, "");
  return `${base}…`;
}

/** `base`, or `base (2)`, `base (3)`… — whichever is not taken (case-insensitive). */
export function uniqueTitle(base: string, taken: Iterable<string>): string {
  const used = new Set(Array.from(taken, norm));
  const root = base.slice(0, CHAT_TITLE_MAX).trim() || FALLBACK;
  if (!used.has(norm(root))) return root;
  for (let n = 2; n < 1000; n += 1) {
    const suffix = ` (${n})`;
    const candidate = `${root.slice(0, CHAT_TITLE_MAX - suffix.length).trimEnd()}${suffix}`;
    if (!used.has(norm(candidate))) return candidate;
  }
  return `${root.slice(0, CHAT_TITLE_MAX - 14)} (${Date.now()})`;
}

/** Rename validation; returns a user-facing error, or null when valid. */
export function validateChatTitle(value: string, otherTitles: Iterable<string>): string | null {
  const title = value.trim();
  if (!title) return "Enter a chat name.";
  if (title.length > CHAT_TITLE_MAX) return `Use ${CHAT_TITLE_MAX} characters or fewer.`;
  const lower = norm(title);
  for (const other of otherTitles) if (norm(other) === lower) return `You already have a chat named “${title}”.`;
  return null;
}
