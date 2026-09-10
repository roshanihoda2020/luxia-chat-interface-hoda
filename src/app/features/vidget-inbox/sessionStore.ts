import type { LuxiaResponsePresentation } from "@/app/features/chat/LuxiaResponseCard";
import type { VidgetChannel, VidgetRecord } from "@/app/features/vidgets/types";
import { countSessionProblems } from "./problems";
import type {
  VidgetInboxAssistantTurn,
  VidgetInboxFeedback,
  VidgetInboxSession,
  VidgetInboxTurn,
  VidgetInboxVisitorTurn,
} from "./types";

const STORAGE_KEY = "luxia.vidget-conversation-sessions.v1";

const LANGUAGE_LOCALE: Record<string, string> = {
  English: "en-US",
  Italian: "it-IT",
  French: "fr-FR",
  German: "de-DE",
  Spanish: "es-ES",
  Arabic: "ar-SA",
  Chinese: "zh-CN",
};

const PRESENTATIONS = new Set<LuxiaResponsePresentation>([
  "normal",
  "warning",
  "error",
  "block",
]);
const CHANNELS = new Set<VidgetChannel>(["web", "whatsapp", "voip"]);
const FEEDBACK = new Set<VidgetInboxFeedback>(["positive", "negative", "none"]);

type CaptureFile = {
  sessions: VidgetInboxSession[];
  activeByVidgetId: Record<string, string>;
};

let captureCounter = 0;
let storeVersion = 0;
let cachedFile: CaptureFile | null = null;
const listeners = new Set<() => void>();

function emit() {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
}

function emptyFile(): CaptureFile {
  return { sessions: [], activeByVidgetId: {} };
}

function clockNow(): string {
  return new Date().toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nextCapturedSessionId(): string {
  captureCounter += 1;
  return `vcapt-${Date.now()}-${captureCounter}`;
}

/** Unknown language values stay as-is. */
export function localeFromVidgetLanguage(language: string | undefined): string {
  const trimmed = language?.trim() ?? "";
  if (!trimmed) return "en-US";
  return LANGUAGE_LOCALE[trimmed] ?? trimmed;
}

function deriveSession(
  session: VidgetInboxSession,
  touchEndedAt = false,
): VidgetInboxSession {
  const lastAssistant = [...session.turns]
    .reverse()
    .find((turn): turn is VidgetInboxAssistantTurn => turn.role === "assistant");
  return {
    ...session,
    endedAt: touchEndedAt ? new Date().toISOString() : session.endedAt,
    messageCount: session.turns.length,
    constellationId: lastAssistant?.constellationId ?? session.constellationId,
    problemCount: countSessionProblems(session),
  };
}

function sanitizeTurn(raw: unknown): VidgetInboxTurn | null {
  if (!raw || typeof raw !== "object") return null;
  const turn = raw as Partial<VidgetInboxTurn> & { role?: string };
  if (typeof turn.id !== "string" || !turn.id.trim()) return null;
  if (typeof turn.content !== "string") return null;
  if (typeof turn.timestamp !== "string") return null;
  if (turn.role === "visitor") {
    return {
      id: turn.id,
      role: "visitor",
      content: turn.content,
      timestamp: turn.timestamp,
    };
  }
  if (turn.role !== "assistant") return null;
  const presentation = PRESENTATIONS.has(turn.presentation as LuxiaResponsePresentation)
    ? (turn.presentation as LuxiaResponsePresentation)
    : "normal";
  const feedback = FEEDBACK.has(turn.feedback as VidgetInboxFeedback)
    ? (turn.feedback as VidgetInboxFeedback)
    : "none";
  const sources = Array.isArray(turn.sources)
    ? turn.sources
      .filter((source): source is { id: string; label: string } => (
        Boolean(source)
        && typeof source === "object"
        && typeof source.id === "string"
        && typeof source.label === "string"
      ))
    : undefined;
  return {
    id: turn.id,
    role: "assistant",
    content: turn.content,
    timestamp: turn.timestamp,
    presentation,
    notice: typeof turn.notice === "string" ? turn.notice : undefined,
    sources,
    feedback,
    constellationId: typeof turn.constellationId === "string"
      ? turn.constellationId
      : null,
  };
}

function sanitizeSession(raw: unknown): VidgetInboxSession | null {
  if (!raw || typeof raw !== "object") return null;
  const session = raw as Partial<VidgetInboxSession>;
  if (typeof session.id !== "string" || !session.id.trim()) return null;
  if (typeof session.projectId !== "string" || typeof session.vidgetId !== "string") return null;
  if (!CHANNELS.has(session.channel as VidgetChannel)) return null;
  if (typeof session.locale !== "string" || typeof session.startedAt !== "string") return null;
  if (!Array.isArray(session.turns)) return null;
  const turns = session.turns
    .map(sanitizeTurn)
    .filter((turn): turn is VidgetInboxTurn => Boolean(turn));
  const next: VidgetInboxSession = {
    id: session.id,
    projectId: session.projectId,
    vidgetId: session.vidgetId,
    channel: session.channel as VidgetChannel,
    locale: session.locale,
    startedAt: session.startedAt,
    endedAt: typeof session.endedAt === "string" ? session.endedAt : session.startedAt,
    messageCount: turns.length,
    constellationId: typeof session.constellationId === "string"
      ? session.constellationId
      : null,
    problemCount: 0,
    turns,
  };
  return deriveSession(next);
}

function sanitizeActive(
  raw: unknown,
  sessions: readonly VidgetInboxSession[],
): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const ids = new Set(sessions.map((session) => session.id));
  const next: Record<string, string> = {};
  for (const [vidgetId, sessionId] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof sessionId === "string" && ids.has(sessionId)) {
      next[vidgetId] = sessionId;
    }
  }
  return next;
}

function sanitizeSessionList(raw: unknown): VidgetInboxSession[] {
  if (!Array.isArray(raw)) return [];
  const sessions: VidgetInboxSession[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const session = sanitizeSession(item);
    if (!session || seen.has(session.id)) continue;
    seen.add(session.id);
    sessions.push(session);
  }
  return sessions;
}

function readFile(): CaptureFile {
  if (typeof window === "undefined") return emptyFile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyFile();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { sessions: sanitizeSessionList(parsed), activeByVidgetId: {} };
    }
    if (!parsed || typeof parsed !== "object") return emptyFile();
    const record = parsed as { sessions?: unknown; activeByVidgetId?: unknown };
    const sessions = sanitizeSessionList(record.sessions);
    return {
      sessions,
      activeByVidgetId: sanitizeActive(record.activeByVidgetId, sessions),
    };
  } catch {
    return emptyFile();
  }
}

function writeFile(file: CaptureFile) {
  cachedFile = file;
  if (typeof window === "undefined") {
    emit();
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
  } catch {
    // localStorage write is best-effort.
  }
  emit();
}

function loadFile(): CaptureFile {
  if (!cachedFile) cachedFile = readFile();
  return cachedFile;
}

function loadSessions(): VidgetInboxSession[] {
  return loadFile().sessions;
}

function patchSession(
  sessionId: string,
  updater: (session: VidgetInboxSession) => VidgetInboxSession | null,
): VidgetInboxSession | null {
  const file = loadFile();
  const index = file.sessions.findIndex((session) => session.id === sessionId);
  if (index < 0) return null;
  const nextSession = updater(file.sessions[index]!);
  if (!nextSession) return file.sessions[index]!;
  const sessions = file.sessions.slice();
  sessions[index] = deriveSession(nextSession, true);
  writeFile({ ...file, sessions });
  return sessions[index]!;
}

export function subscribeVidgetInboxCapture(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVidgetInboxCaptureVersion(): number {
  return storeVersion;
}

export function listCapturedVidgetInboxSessions(): readonly VidgetInboxSession[] {
  return loadSessions();
}

export function getCapturedVidgetInboxSessionById(
  sessionId: string,
): VidgetInboxSession | undefined {
  return loadSessions().find((session) => session.id === sessionId);
}

export function createCapturedVidgetInboxSession(input: {
  record: Pick<VidgetRecord, "id" | "projectId" | "channel" | "language" | "constellationId">;
}): VidgetInboxSession {
  const now = new Date().toISOString();
  const session: VidgetInboxSession = {
    id: nextCapturedSessionId(),
    projectId: input.record.projectId,
    vidgetId: input.record.id,
    channel: input.record.channel,
    locale: localeFromVidgetLanguage(input.record.language),
    startedAt: now,
    endedAt: now,
    messageCount: 0,
    constellationId: input.record.constellationId?.trim() || null,
    problemCount: 0,
    turns: [],
  };
  writeFile({
    sessions: [session, ...loadFile().sessions],
    activeByVidgetId: {
      ...loadFile().activeByVidgetId,
      [input.record.id]: session.id,
    },
  });
  return session;
}

export function getActiveCapturedSessionId(vidgetId: string): string | null {
  const file = loadFile();
  const sessionId = file.activeByVidgetId[vidgetId];
  if (!sessionId) return null;
  return file.sessions.some((session) => session.id === sessionId) ? sessionId : null;
}

export function clearActiveCapturedSession(vidgetId: string): void {
  const file = loadFile();
  if (!file.activeByVidgetId[vidgetId]) return;
  const activeByVidgetId = { ...file.activeByVidgetId };
  delete activeByVidgetId[vidgetId];
  writeFile({ ...file, activeByVidgetId });
}

export function appendCapturedVisitorTurn(
  sessionId: string,
  turn: Omit<VidgetInboxVisitorTurn, "timestamp" | "role"> & { timestamp?: string },
): void {
  patchSession(sessionId, (session) => {
    if (session.turns.some((item) => item.id === turn.id)) return null;
    const nextTurn: VidgetInboxVisitorTurn = {
      id: turn.id,
      role: "visitor",
      content: turn.content,
      timestamp: turn.timestamp ?? clockNow(),
    };
    return { ...session, turns: [...session.turns, nextTurn] };
  });
}

export function appendCapturedAssistantTurn(
  sessionId: string,
  turn: Omit<VidgetInboxAssistantTurn, "timestamp" | "presentation" | "feedback" | "role"> & {
    timestamp?: string;
    presentation?: LuxiaResponsePresentation;
    feedback?: VidgetInboxFeedback;
  },
): void {
  patchSession(sessionId, (session) => {
    if (session.turns.some((item) => item.id === turn.id)) return null;
    const nextTurn: VidgetInboxAssistantTurn = {
      id: turn.id,
      role: "assistant",
      content: turn.content,
      timestamp: turn.timestamp ?? clockNow(),
      presentation: turn.presentation ?? "normal",
      notice: turn.notice,
      sources: turn.sources,
      feedback: turn.feedback ?? "none",
      constellationId: turn.constellationId ?? null,
    };
    return { ...session, turns: [...session.turns, nextTurn] };
  });
}

export function updateCapturedAssistantFeedback(
  sessionId: string,
  turnId: string,
  feedback: VidgetInboxFeedback,
): void {
  patchSession(sessionId, (session) => {
    let changed = false;
    const turns = session.turns.map((turn) => {
      if (turn.role !== "assistant" || turn.id !== turnId) return turn;
      if (turn.feedback === feedback) return turn;
      changed = true;
      return { ...turn, feedback };
    });
    if (!changed) return null;
    return { ...session, turns };
  });
}
