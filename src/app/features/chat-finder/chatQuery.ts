/**
 * Shared chat discovery logic (Chat Finder; reusable by the Project Chats page).
 *
 * The caller passes the Project's ACCESSIBLE chats (the same collection as the sidebar's
 * Chats list), so counts agree everywhere. Closed chats stay in the collection (they are only
 * hidden from the open tabs); deleted chats are not part of it.
 */
export type ChatSource = "pdf" | "csv" | "database";

export interface FinderChat {
  id: string;
  label: string;
  chatType: "galaxy" | "constellation";
  constellationId?: string;
  constellationLabel?: string;
  source?: ChatSource;
  pinned?: boolean;
  /** Hidden from the open tabs (Close tab); reopening keeps everything. */
  closed?: boolean;
  lastOpenedTimestamp: number;
}

export interface ChatFilter {
  query: string;
  type: "all" | "galaxy" | "constellation";
  constellationId: "all" | string;
  source: "all" | ChatSource;
  pinnedOnly: boolean;
}

export const EMPTY_CHAT_FILTER: ChatFilter = { query: "", type: "all", constellationId: "all", source: "all", pinnedOnly: false };

/** Number of active ADVANCED filters (Constellation, Source, Pinned only). */
export function advancedFilterCount(f: ChatFilter): number {
  return (f.constellationId !== "all" ? 1 : 0) + (f.source !== "all" ? 1 : 0) + (f.pinnedOnly ? 1 : 0);
}

export function isFilterActive(f: ChatFilter): boolean {
  return Boolean(f.query.trim()) || f.type !== "all" || advancedFilterCount(f) > 0;
}

/** Case-insensitive name search (Galaxy chats also match "galaxy"; Constellation name too). */
export function matchChat(chat: FinderChat, f: ChatFilter): boolean {
  const q = f.query.trim().toLowerCase();
  if (q) {
    const haystack = `${chat.chatType === "galaxy" ? "galaxy " : ""}${chat.label} ${chat.constellationLabel ?? ""}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.type !== "all" && chat.chatType !== f.type) return false;
  if (f.constellationId !== "all" && chat.constellationId !== f.constellationId) return false;
  if (f.source !== "all" && chat.source !== f.source) return false;
  if (f.pinnedOnly && !chat.pinned) return false;
  return true;
}

/** Filter + order: most recently opened first (stable by name). */
export function findChats(chats: readonly FinderChat[], f: ChatFilter): FinderChat[] {
  return chats
    .filter((chat) => matchChat(chat, f))
    .sort((a, b) => (b.lastOpenedTimestamp - a.lastOpenedTimestamp) || a.label.localeCompare(b.label));
}
