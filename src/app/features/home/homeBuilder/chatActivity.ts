/**
 * Activity wording for Chat Home Tiles, from the Chat's real record only:
 * `lastOpenedAt` (the timestamp the Chats collection is ordered by) or, when a
 * record has none, its `updatedAt` label. Nothing is estimated or invented.
 */
export interface HomeChatActivity {
  /** Compact form for rows and cards (e.g. "2d ago"). */
  short: string;
  /** Sentence form for roomier layouts (e.g. "Opened 2 days ago"). */
  long: string;
  /** Exact date and time, for a tooltip; only when a timestamp exists. */
  exact?: string;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function unit(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function formatHomeChatActivity(
  lastOpenedAt: number | undefined,
  updatedAt: string | undefined,
  now: number = Date.now(),
): HomeChatActivity | undefined {
  if (typeof lastOpenedAt === "number" && Number.isFinite(lastOpenedAt) && lastOpenedAt > 0) {
    const ms = Math.max(0, now - lastOpenedAt);
    const exact = new Date(lastOpenedAt).toLocaleString(undefined, {
      day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
    });
    if (ms < MINUTE_MS) return { short: "Just now", long: "Opened just now", exact };
    if (ms < HOUR_MS) {
      const minutes = Math.floor(ms / MINUTE_MS);
      return { short: `${minutes}m ago`, long: `Opened ${unit(minutes, "minute")} ago`, exact };
    }
    if (ms < DAY_MS) {
      const hours = Math.floor(ms / HOUR_MS);
      return { short: `${hours}h ago`, long: `Opened ${unit(hours, "hour")} ago`, exact };
    }
    const days = Math.floor(ms / DAY_MS);
    if (days === 1) return { short: "Yesterday", long: "Opened yesterday", exact };
    if (days < 7) return { short: `${days}d ago`, long: `Opened ${days} days ago`, exact };
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return { short: `${weeks}w ago`, long: `Opened ${unit(weeks, "week")} ago`, exact };
    }
    const date = new Date(lastOpenedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" });
    return { short: date, long: `Opened ${date}`, exact };
  }
  const label = updatedAt?.trim();
  if (!label) return undefined;
  return { short: label, long: `Updated ${label.charAt(0).toLowerCase()}${label.slice(1)}` };
}
