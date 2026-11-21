import { useSyncExternalStore } from "react";
import {
  answerLuxiaAssistant,
  type LuxiaAssistantAbilities,
  type LuxiaAssistantMessage,
} from "@/app/features/home/luxiaAssistant";

/**
 * Luxia AI conversations: the standalone assistant's own history, per prototype user.
 *
 * Separate from Project, Galaxy and Constellation Chats (which belong to a Project) and from tool
 * histories (Writing Assistant documents, VerifAI reviews). Kept in this browser's localStorage,
 * like every other per-user prototype state. Answers are the demo answers of `luxiaAssistant.ts`.
 *
 * Home and the Luxia AI workspace read the same store, so a conversation continued in one place
 * is the same conversation in the other.
 */

export interface LuxiaAiConversation {
  id: string;
  title: string;
  /** True once the user renamed it; the title then no longer follows the first question. */
  titleEdited?: boolean;
  createdAt: number;
  updatedAt: number;
  messages: LuxiaAssistantMessage[];
}

export interface LuxiaAiConversationsSnapshot {
  /** Most recently updated first. */
  conversations: readonly LuxiaAiConversation[];
  /** The conversation open in the Home Ask Luxia box this browser session (null = a fresh box). */
  homeConversationId: string | null;
  /** Conversations waiting for an answer. */
  pendingIds: ReadonlySet<string>;
}

const STORAGE_PREFIX = "luxia-ai-conversations:v1:";
/** How long a demo answer takes to appear, so the exchange reads as a conversation. */
export const LUXIA_AI_ANSWER_DELAY_MS = 600;
const TITLE_MAX = 60;
const MAX_CONVERSATIONS = 100;

export function getLuxiaAiStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

const listeners = new Set<() => void>();
const snapshots = new Map<string, LuxiaAiConversationsSnapshot>();
const cache = new Map<string, LuxiaAiConversation[]>();
/** Session-only: which conversation each user's Home box shows. A new page load starts with a fresh box. */
const homeConversation = new Map<string, string | null>();
const pending = new Map<string, Set<string>>();
const timers = new Map<string, number>();

function isMessage(value: unknown): value is LuxiaAssistantMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<LuxiaAssistantMessage>;
  return typeof message.id === "string"
    && (message.role === "user" || message.role === "assistant")
    && typeof message.text === "string";
}

function isConversation(value: unknown): value is LuxiaAiConversation {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<LuxiaAiConversation>;
  return typeof entry.id === "string"
    && typeof entry.title === "string"
    && typeof entry.createdAt === "number"
    && typeof entry.updatedAt === "number"
    && Array.isArray(entry.messages)
    && entry.messages.every(isMessage);
}

function load(userId: string): LuxiaAiConversation[] {
  const cached = cache.get(userId);
  if (cached) return cached;
  let loaded: LuxiaAiConversation[] = [];
  try {
    const raw = window.localStorage.getItem(getLuxiaAiStorageKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) loaded = parsed.filter(isConversation);
  } catch {
    loaded = [];
  }
  loaded.sort((a, b) => b.updatedAt - a.updatedAt);
  cache.set(userId, loaded);
  return loaded;
}

function emit(userId: string) {
  snapshots.delete(userId);
  listeners.forEach((listener) => listener());
}

function save(userId: string, conversations: LuxiaAiConversation[]) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
  cache.set(userId, sorted);
  try {
    if (sorted.length === 0) window.localStorage.removeItem(getLuxiaAiStorageKey(userId));
    else window.localStorage.setItem(getLuxiaAiStorageKey(userId), JSON.stringify(sorted));
  } catch {
    // Storage unavailable (private window, quota): the conversation still works for this page.
  }
  emit(userId);
}

function readSnapshot(userId: string): LuxiaAiConversationsSnapshot {
  const existing = snapshots.get(userId);
  if (existing) return existing;
  const conversations = load(userId);
  const homeId = homeConversation.get(userId) ?? null;
  const snapshot: LuxiaAiConversationsSnapshot = {
    conversations,
    homeConversationId: homeId && conversations.some((entry) => entry.id === homeId) ? homeId : null,
    pendingIds: new Set(pending.get(userId) ?? []),
  };
  snapshots.set(userId, snapshot);
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Another tab changed this browser's storage: drop the cache so the next read reloads it. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (!event.key?.startsWith(STORAGE_PREFIX)) return;
    const userId = event.key.slice(STORAGE_PREFIX.length);
    cache.delete(userId);
    emit(userId);
  });
}

export function useLuxiaAiConversations(userId: string): LuxiaAiConversationsSnapshot {
  return useSyncExternalStore(subscribe, () => readSnapshot(userId), () => readSnapshot(userId));
}

export function getLuxiaAiConversation(userId: string, conversationId: string): LuxiaAiConversation | undefined {
  return load(userId).find((entry) => entry.id === conversationId);
}

/** A title from the first question: one line, trimmed to a readable length. */
export function titleFromQuestion(question: string): string {
  const line = question.replace(/\s+/g, " ").trim();
  return line.length > TITLE_MAX ? `${line.slice(0, TITLE_MAX - 1).trimEnd()}…` : line || "New conversation";
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Sends a question. Without a conversation id a new conversation starts with this question as its
 * title. Returns the conversation id. `forHome` makes it the conversation of the Home box.
 */
export function askLuxiaAi(
  userId: string,
  conversationId: string | null,
  question: string,
  abilities: LuxiaAssistantAbilities,
  options: { forHome?: boolean } = {},
): string | null {
  const text = question.trim();
  if (!text) return null;
  if (conversationId && pending.get(userId)?.has(conversationId)) return conversationId;
  const now = Date.now();
  const asked: LuxiaAssistantMessage = { id: newId("u"), role: "user", text };
  const conversations = load(userId);
  const existing = conversationId ? conversations.find((entry) => entry.id === conversationId) : undefined;
  const conversation: LuxiaAiConversation = existing
    ? { ...existing, updatedAt: now, messages: [...existing.messages, asked] }
    : { id: newId("lxai"), title: titleFromQuestion(text), createdAt: now, updatedAt: now, messages: [asked] };
  if (options.forHome) homeConversation.set(userId, conversation.id);
  const ids = pending.get(userId) ?? new Set<string>();
  ids.add(conversation.id);
  pending.set(userId, ids);
  save(userId, [conversation, ...conversations.filter((entry) => entry.id !== conversation.id)]);

  const timer = window.setTimeout(() => {
    timers.delete(conversation.id);
    pending.get(userId)?.delete(conversation.id);
    const current = load(userId);
    const target = current.find((entry) => entry.id === conversation.id);
    if (!target) {
      emit(userId);
      return;
    }
    const answer: LuxiaAssistantMessage = { id: newId("a"), role: "assistant", ...answerLuxiaAssistant(text, abilities) };
    save(userId, current.map((entry) =>
      entry.id === target.id ? { ...entry, updatedAt: Date.now(), messages: [...entry.messages, answer] } : entry));
  }, LUXIA_AI_ANSWER_DELAY_MS);
  timers.set(conversation.id, timer);
  return conversation.id;
}

/** Which conversation the Home box shows (null = a fresh box; the previous one stays in history). */
export function setHomeLuxiaAiConversation(userId: string, conversationId: string | null) {
  homeConversation.set(userId, conversationId);
  emit(userId);
}

export function renameLuxiaAiConversation(userId: string, conversationId: string, title: string) {
  const next = title.replace(/\s+/g, " ").trim();
  if (!next) return;
  const conversations = load(userId);
  if (!conversations.some((entry) => entry.id === conversationId)) return;
  save(userId, conversations.map((entry) =>
    entry.id === conversationId ? { ...entry, title: next.slice(0, 120), titleEdited: true } : entry));
}

export function deleteLuxiaAiConversation(userId: string, conversationId: string) {
  const timer = timers.get(conversationId);
  if (timer !== undefined) window.clearTimeout(timer);
  timers.delete(conversationId);
  pending.get(userId)?.delete(conversationId);
  if (homeConversation.get(userId) === conversationId) homeConversation.set(userId, null);
  save(userId, load(userId).filter((entry) => entry.id !== conversationId));
}

/** Search over titles and message text. */
export function matchesLuxiaAiConversation(conversation: LuxiaAiConversation, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (conversation.title.toLowerCase().includes(q)) return true;
  return conversation.messages.some((message) => message.text.toLowerCase().includes(q));
}

export function lastLuxiaAiMessagePreview(conversation: LuxiaAiConversation): string {
  const last = conversation.messages[conversation.messages.length - 1];
  return last ? last.text.replace(/\s+/g, " ").trim() : "";
}
