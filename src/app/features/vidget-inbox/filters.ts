import type { VidgetChannel } from "@/app/features/vidgets/types";
import type {
  VidgetInboxDateFilter,
  VidgetInboxQuery,
  VidgetInboxSession,
} from "./types";
import { assistantTurnIsProblematic } from "./problems";

export const EMPTY_VIDGET_INBOX_QUERY: VidgetInboxQuery = {
  q: "",
  vidgetId: "",
  channel: "all",
  locale: "",
  date: "all",
  problems: "all",
  constellationId: "",
  sessionId: "",
};

function startOfLocalDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

function matchesDate(startedAt: string, date: VidgetInboxDateFilter, now: Date): boolean {
  if (date === "all") return true;
  const started = new Date(startedAt);
  if (Number.isNaN(started.getTime())) return false;
  const startToday = startOfLocalDay(now);
  if (date === "today") {
    return started.getTime() >= startToday;
  }
  const days = date === "7d" ? 7 : 30;
  return started.getTime() >= now.getTime() - days * 86_400_000;
}

export function sessionMatchesInboxQuery(
  session: VidgetInboxSession,
  query: VidgetInboxQuery,
  context: {
    now?: Date;
    vidgetName?: string;
  } = {},
): boolean {
  const now = context.now ?? new Date();
  if (query.vidgetId && session.vidgetId !== query.vidgetId) return false;
  if (query.channel !== "all" && session.channel !== query.channel) return false;
  if (query.locale && session.locale !== query.locale) return false;
  if (query.constellationId) {
    const inSession = session.constellationId === query.constellationId
      || session.turns.some(
        (turn) => turn.role === "assistant" && turn.constellationId === query.constellationId,
      );
    if (!inSession) return false;
  }
  if (query.problems === "problems" && session.problemCount === 0) return false;
  if (query.problems === "none" && session.problemCount > 0) return false;
  if (!matchesDate(session.startedAt, query.date, now)) return false;

  const needle = query.q.trim().toLowerCase();
  if (!needle) return true;

  if (session.id.toLowerCase().includes(needle)) return true;
  if (session.locale.toLowerCase().includes(needle)) return true;
  if (session.channel.toLowerCase().includes(needle)) return true;
  if (context.vidgetName?.toLowerCase().includes(needle)) return true;
  return session.turns.some((turn) => turn.content.toLowerCase().includes(needle));
}

export function filterVidgetInboxSessions(
  sessions: readonly VidgetInboxSession[],
  query: VidgetInboxQuery,
  context: {
    now?: Date;
    vidgetNameById?: Record<string, string>;
  } = {},
): VidgetInboxSession[] {
  return sessions.filter((session) =>
    sessionMatchesInboxQuery(session, query, {
      now: context.now,
      vidgetName: context.vidgetNameById?.[session.vidgetId],
    }),
  );
}

export function inboxQueryHasActiveFilters(query: VidgetInboxQuery): boolean {
  return (
    query.q.trim().length > 0
    || query.vidgetId !== ""
    || query.channel !== "all"
    || query.locale !== ""
    || query.date !== "all"
    || query.problems !== "all"
    || query.constellationId !== ""
  );
}

export function uniqueInboxChannels(
  sessions: readonly VidgetInboxSession[],
): VidgetChannel[] {
  const seen = new Set<VidgetChannel>();
  for (const session of sessions) seen.add(session.channel);
  const order: VidgetChannel[] = ["web", "whatsapp", "voip"];
  return order.filter((channel) => seen.has(channel));
}

export function uniqueInboxConstellationIds(
  sessions: readonly VidgetInboxSession[],
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const session of sessions) {
    for (const turn of session.turns) {
      if (turn.role !== "assistant" || !turn.constellationId) continue;
      if (seen.has(turn.constellationId)) continue;
      seen.add(turn.constellationId);
      ids.push(turn.constellationId);
    }
    if (session.constellationId && !seen.has(session.constellationId)) {
      seen.add(session.constellationId);
      ids.push(session.constellationId);
    }
  }
  return ids;
}

export function uniqueInboxLocales(
  sessions: readonly VidgetInboxSession[],
): string[] {
  const seen = new Set<string>();
  const locales: string[] = [];
  for (const session of sessions) {
    if (!session.locale || seen.has(session.locale)) continue;
    seen.add(session.locale);
    locales.push(session.locale);
  }
  return locales.sort((a, b) => a.localeCompare(b));
}

export { assistantTurnIsProblematic };
