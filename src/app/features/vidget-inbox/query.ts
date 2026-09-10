import type { VidgetChannel } from "@/app/features/vidgets/types";
import { EMPTY_VIDGET_INBOX_QUERY } from "./filters";
import type {
  VidgetInboxDateFilter,
  VidgetInboxProblemsFilter,
  VidgetInboxQuery,
} from "./types";

function isChannel(value: string | null): value is VidgetChannel {
  return value === "web" || value === "whatsapp" || value === "voip";
}

function isDate(value: string | null): value is VidgetInboxDateFilter {
  return value === "all" || value === "today" || value === "7d" || value === "30d";
}

function isProblems(value: string | null): value is VidgetInboxProblemsFilter {
  return value === "all" || value === "problems" || value === "none";
}

export function parseVidgetInboxQueryFromSearch(search: string): VidgetInboxQuery {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const channel = params.get("channel");
  const date = params.get("date");
  const status = params.get("status") ?? params.get("problems");
  return {
    q: params.get("q")?.trim() ?? "",
    vidgetId: params.get("vidget")?.trim() ?? "",
    channel: isChannel(channel) ? channel : "all",
    locale: params.get("locale")?.trim() ?? "",
    date: isDate(date) && date !== "all" ? date : "all",
    problems: isProblems(status) && status !== "all" ? status : "all",
    constellationId: params.get("constellation")?.trim() ?? "",
    sessionId: params.get("session")?.trim() ?? "",
  };
}

export function serializeVidgetInboxQuery(query: VidgetInboxQuery): string {
  const params = new URLSearchParams();
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.vidgetId) params.set("vidget", query.vidgetId);
  if (query.channel !== "all") params.set("channel", query.channel);
  if (query.locale) params.set("locale", query.locale);
  if (query.date !== "all") params.set("date", query.date);
  if (query.problems !== "all") params.set("status", query.problems);
  if (query.constellationId) params.set("constellation", query.constellationId);
  if (query.sessionId.trim()) params.set("session", query.sessionId.trim());
  return params.toString();
}

export function vidgetInboxQueryFromPartial(
  partial?: Partial<VidgetInboxQuery> | null,
): VidgetInboxQuery {
  return {
    ...EMPTY_VIDGET_INBOX_QUERY,
    ...partial,
    q: partial?.q ?? "",
    vidgetId: partial?.vidgetId ?? "",
    channel: partial?.channel ?? "all",
    locale: partial?.locale ?? "",
    date: partial?.date ?? "all",
    problems: partial?.problems ?? "all",
    constellationId: partial?.constellationId ?? "",
    sessionId: partial?.sessionId ?? "",
  };
}

export function withVidgetInboxSession(
  query: VidgetInboxQuery,
  sessionId: string | null | undefined,
): VidgetInboxQuery {
  return {
    ...query,
    sessionId: sessionId?.trim() || "",
  };
}
