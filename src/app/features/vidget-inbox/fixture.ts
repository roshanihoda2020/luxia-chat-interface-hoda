import { RESPONSE_CONFIDENCE_PLACEHOLDER_COPY } from "@/app/features/constellation-settings/responseConfidence/defaults";
import type { LuxiaResponsePresentation } from "@/app/features/chat/LuxiaResponseCard";
import type { VidgetChannel } from "@/app/features/vidgets/types";
import { countSessionProblems } from "./problems";
import { getCapturedVidgetInboxSessionById, listCapturedVidgetInboxSessions } from "./sessionStore";
import type {
  VidgetInboxAssistantTurn,
  VidgetInboxFeedback,
  VidgetInboxSession,
  VidgetInboxTurn,
  VidgetInboxVisitorTurn,
} from "./types";

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function visitor(
  id: string,
  startedAt: string,
  offsetMin: number,
  content: string,
): VidgetInboxVisitorTurn {
  const timestamp = new Date(new Date(startedAt).getTime() + offsetMin * 60_000).toISOString();
  return {
    id,
    role: "visitor",
    content,
    timestamp: clock(timestamp),
  };
}

function assistant(
  id: string,
  startedAt: string,
  offsetMin: number,
  content: string,
  options?: {
    presentation?: LuxiaResponsePresentation;
    notice?: string;
    sources?: { id: string; label: string }[];
    feedback?: VidgetInboxFeedback;
    constellationId?: string | null;
  },
): VidgetInboxAssistantTurn {
  const timestamp = new Date(new Date(startedAt).getTime() + offsetMin * 60_000).toISOString();
  const presentation = options?.presentation ?? "normal";
  return {
    id,
    role: "assistant",
    content,
    timestamp: clock(timestamp),
    presentation,
    notice: options?.notice,
    sources: options?.sources,
    feedback: options?.feedback ?? "none",
    constellationId: options?.constellationId ?? null,
  };
}

function buildSession(input: {
  id: string;
  projectId: string;
  vidgetId: string;
  channel: VidgetChannel;
  locale: string;
  startedAt: string;
  durationMin: number;
  turns: VidgetInboxTurn[];
}): VidgetInboxSession {
  const lastAssistant = [...input.turns]
    .reverse()
    .find((turn): turn is VidgetInboxAssistantTurn => turn.role === "assistant");
  const problemCount = countSessionProblems({ turns: input.turns });

  return {
    id: input.id,
    projectId: input.projectId,
    vidgetId: input.vidgetId,
    channel: input.channel,
    locale: input.locale,
    startedAt: input.startedAt,
    endedAt: new Date(
      new Date(input.startedAt).getTime() + input.durationMin * 60_000,
    ).toISOString(),
    messageCount: input.turns.length,
    constellationId: lastAssistant?.constellationId ?? null,
    problemCount,
    turns: input.turns,
  };
}

const SRC_POLICY = [{ id: "src-policy", label: "Policy handbook" }];
const SRC_HOURS = [{ id: "src-hours", label: "Service hours" }];
const SRC_ONBOARD = [{ id: "src-onboard", label: "Onboarding guide" }];

/**
 * Isolated Inbox fixture. Not a production capture store.
 * Channel variants follow existing Vidget records; they do not imply live capture.
 * Captured prototype sessions are merged on read and never overwritten by these seeds.
 */
export const VIDGET_INBOX_FIXTURE_SESSIONS: VidgetInboxSession[] = [
  buildSession({
    id: "vsess-01",
    projectId: "project-01",
    vidgetId: "vidget-01",
    channel: "web",
    locale: "en-US",
    startedAt: hoursAgo(2),
    durationMin: 6,
    turns: [
      visitor("vsess-01-t1", hoursAgo(2), 0, "What are your service hours?"),
      assistant(
        "vsess-01-t2",
        hoursAgo(2),
        1,
        "Support is available weekdays from 9:00 to 18:00 local time. After hours, submit a request and a specialist will follow up the next business day.",
        { sources: SRC_HOURS, constellationId: "con1", feedback: "positive" },
      ),
      visitor("vsess-01-t3", hoursAgo(2), 3, "Can I change an existing request?"),
      assistant(
        "vsess-01-t4",
        hoursAgo(2),
        4,
        "Yes. Open the original request and use Update details before it is assigned. After assignment, add a comment so the specialist sees the change.",
        { sources: SRC_ONBOARD, constellationId: "con1" },
      ),
      visitor("vsess-01-t5", hoursAgo(2), 5, "Thanks, that helps."),
      assistant(
        "vsess-01-t6",
        hoursAgo(2),
        6,
        "You’re welcome. Ask if you need anything else.",
        { constellationId: "con1" },
      ),
    ],
  }),
  buildSession({
    id: "vsess-02",
    projectId: "project-01",
    vidgetId: "vidget-01",
    channel: "web",
    locale: "it-IT",
    startedAt: hoursAgo(5),
    durationMin: 4,
    turns: [
      visitor("vsess-02-t1", hoursAgo(5), 0, "Quanto tempo ci vuole per una risposta?"),
      assistant(
        "vsess-02-t2",
        hoursAgo(5),
        1,
        "Le richieste standard ricevono una prima risposta entro un giorno lavorativo. I casi urgenti sono presi in carico più rapidamente.",
        { sources: SRC_HOURS, constellationId: "con3", feedback: "negative" },
      ),
      visitor("vsess-02-t3", hoursAgo(5), 3, "Questo non corrisponde a quello che mi hanno detto ieri."),
      assistant(
        "vsess-02-t4",
        hoursAgo(5),
        4,
        "I tempi dipendono dal tipo di richiesta. Se hai un riferimento del caso, un operatore può verificarlo sul ticket.",
        { sources: SRC_ONBOARD, constellationId: "con3", feedback: "negative" },
      ),
    ],
  }),
  buildSession({
    id: "vsess-03",
    projectId: "project-01",
    vidgetId: "vidget-01",
    channel: "web",
    locale: "en-US",
    startedAt: hoursAgo(28),
    durationMin: 8,
    turns: [
      visitor("vsess-03-t1", hoursAgo(28), 0, "Which policy covers visitor access after 18:00?"),
      assistant(
        "vsess-03-t2",
        hoursAgo(28),
        1,
        "After-hours visitor access is described in the site access policy. Reception must log the visit and a host has to remain on site.",
        {
          presentation: "warning",
          notice: RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.warningMessage,
          sources: SRC_POLICY,
          constellationId: "con4",
        },
      ),
      visitor("vsess-03-t3", hoursAgo(28), 4, "Do contractors use the same process?"),
      assistant(
        "vsess-03-t4",
        hoursAgo(28),
        5,
        "Contractors follow the same after-hours process, with an additional check against the approved supplier list.",
        { sources: SRC_POLICY, constellationId: "con4" },
      ),
    ],
  }),
  buildSession({
    id: "vsess-04",
    projectId: "project-01",
    vidgetId: "vidget-01",
    channel: "web",
    locale: "fr-FR",
    startedAt: hoursAgo(120),
    durationMin: 5,
    turns: [
      visitor("vsess-04-t1", hoursAgo(120), 0, "Pouvez-vous confirmer le plafond de remboursement ?"),
      assistant(
        "vsess-04-t2",
        hoursAgo(120),
        1,
        "Le plafond dépend de la catégorie de dépense et de l’approbation en cours. Les montants exacts doivent être vérifiés dans la politique financière.",
        {
          presentation: "error",
          notice: RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.errorMessage,
          sources: SRC_POLICY,
          constellationId: "con1",
        },
      ),
      visitor("vsess-04-t3", hoursAgo(120), 3, "Et pour un déplacement international ?"),
      assistant(
        "vsess-04-t4",
        hoursAgo(120),
        4,
        "Les déplacements internationaux ont des règles distinctes. Un responsable doit les confirmer avant la réservation.",
        {
          presentation: "error",
          notice: RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.errorMessage,
          constellationId: "con1",
        },
      ),
    ],
  }),
  buildSession({
    id: "vsess-05",
    projectId: "project-01",
    vidgetId: "vidget-01",
    channel: "web",
    locale: "en-US",
    startedAt: hoursAgo(26),
    durationMin: 2,
    turns: [
      visitor(
        "vsess-05-t1",
        hoursAgo(26),
        0,
        "What is the unpublished exception process for blocked vendors?",
      ),
      assistant(
        "vsess-05-t2",
        hoursAgo(26),
        1,
        RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.blockDefaultAnswer,
        { presentation: "block", constellationId: "con3" },
      ),
    ],
  }),
  buildSession({
    id: "vsess-06",
    projectId: "project-01",
    vidgetId: "vidget-02",
    channel: "whatsapp",
    locale: "en-US",
    startedAt: hoursAgo(72),
    durationMin: 7,
    turns: [
      visitor("vsess-06-t1", hoursAgo(72), 0, "Can I send documents on this channel?"),
      assistant(
        "vsess-06-t2",
        hoursAgo(72),
        1,
        "Yes. Send one file per message. PDF and images are accepted. Do not send passwords in the same thread.",
        { sources: SRC_ONBOARD, constellationId: "con2" },
      ),
      visitor("vsess-06-t3", hoursAgo(72), 4, "How large can the file be?"),
      assistant(
        "vsess-06-t4",
        hoursAgo(72),
        5,
        "Keep files under 20 MB. Larger packs should be split or shared through the approved document link.",
        { sources: SRC_ONBOARD, constellationId: "con2", feedback: "positive" },
      ),
    ],
  }),
  buildSession({
    id: "vsess-07",
    projectId: "project-01",
    vidgetId: "vidget-02",
    channel: "whatsapp",
    locale: "ar-SA",
    startedAt: hoursAgo(8),
    durationMin: 6,
    turns: [
      visitor("vsess-07-t1", hoursAgo(8), 0, "هل يمكنني تحديث رقم الهاتف من هنا؟"),
      assistant(
        "vsess-07-t2",
        hoursAgo(8),
        1,
        "يمكن طلب تحديث رقم الهاتف من خلال محادثة الدعم. سيُطلب تأكيد الهوية قبل حفظ التغيير.",
        {
          presentation: "warning",
          notice: RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.warningMessage,
          constellationId: "con2",
          feedback: "negative",
        },
      ),
      visitor("vsess-07-t3", hoursAgo(8), 4, "كم يستغرق ذلك؟"),
      assistant(
        "vsess-07-t4",
        hoursAgo(8),
        5,
        "عادةً خلال يوم عمل واحد بعد تأكيد الهوية.",
        { constellationId: "con2" },
      ),
    ],
  }),
  buildSession({
    id: "vsess-08",
    projectId: "project-01",
    vidgetId: "vidget-03",
    channel: "voip",
    locale: "en-US",
    startedAt: hoursAgo(12),
    durationMin: 4,
    turns: [
      visitor("vsess-08-t1", hoursAgo(12), 0, "I need the opening hours for the help desk."),
      assistant(
        "vsess-08-t2",
        hoursAgo(12),
        1,
        "The help desk is open weekdays from 8:30 to 17:30. Voice messages left after hours are returned the next morning.",
        { sources: SRC_HOURS, constellationId: "con1" },
      ),
      visitor("vsess-08-t3", hoursAgo(12), 3, "Is Saturday covered?"),
      assistant(
        "vsess-08-t4",
        hoursAgo(12),
        4,
        "Saturday is on-call only for priority incidents. Standard questions wait until Monday.",
        { sources: SRC_HOURS, constellationId: "con1" },
      ),
    ],
  }),
  buildSession({
    id: "vsess-09",
    projectId: "project-01",
    vidgetId: "vidget-01",
    channel: "web",
    locale: "de-DE",
    startedAt: hoursAgo(1),
    durationMin: 3,
    turns: [
      visitor("vsess-09-t1", hoursAgo(1), 0, "Wo finde ich die aktuelle Datenschutzhinweise?"),
      assistant(
        "vsess-09-t2",
        hoursAgo(1),
        1,
        "Die aktuelle Datenschutzerklärung liegt in den veröffentlichten Richtlinien. Sie gilt für Web- und Messaging-Kanäle dieses Assistenten.",
        { sources: SRC_POLICY, constellationId: "con1", feedback: "positive" },
      ),
    ],
  }),
  buildSession({
    id: "vsess-10",
    projectId: "project-01",
    vidgetId: "vidget-01",
    channel: "web",
    locale: "en-US",
    startedAt: hoursAgo(40 * 24),
    durationMin: 9,
    turns: [
      visitor("vsess-10-t1", hoursAgo(40 * 24), 0, "Can Galaxy answer across more than one Constellation?"),
      assistant(
        "vsess-10-t2",
        hoursAgo(40 * 24),
        1,
        "Yes. This Vidget uses Galaxy and routes each question to the most relevant scoped Constellation.",
        { constellationId: "con1" },
      ),
      visitor("vsess-10-t3", hoursAgo(40 * 24), 4, "Which one handled supplier onboarding?"),
      assistant(
        "vsess-10-t4",
        hoursAgo(40 * 24),
        5,
        "Supplier onboarding questions are usually answered from the onboarding Constellation in this Project’s Galaxy scope.",
        {
          presentation: "warning",
          notice: RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.warningMessage,
          constellationId: "con4",
        },
      ),
    ],
  }),
  buildSession({
    id: "vsess-p2-01",
    projectId: "project-02",
    vidgetId: "vidget-p2-01",
    channel: "web",
    locale: "en-US",
    startedAt: hoursAgo(6),
    durationMin: 4,
    turns: [
      visitor("vsess-p2-01-t1", hoursAgo(6), 0, "Where is the kiosk restart guide?"),
      assistant(
        "vsess-p2-01-t2",
        hoursAgo(6),
        1,
        "The totem restart steps are in the local operations pack. Hold the rear power button for four seconds, then wait for the welcome screen.",
        {
          presentation: "warning",
          notice: RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.warningMessage,
          constellationId: "con6",
        },
      ),
    ],
  }),
];

function mergeInboxSessions(
  fixtures: readonly VidgetInboxSession[] = VIDGET_INBOX_FIXTURE_SESSIONS,
  captured: readonly VidgetInboxSession[] = listCapturedVidgetInboxSessions(),
): VidgetInboxSession[] {
  const capturedIds = new Set(captured.map((session) => session.id));
  return [
    ...captured,
    ...fixtures.filter((session) => !capturedIds.has(session.id)),
  ];
}

export function getVidgetInboxSessionsForProject(
  projectId: string,
  vidgetIds: ReadonlySet<string>,
  sessions: readonly VidgetInboxSession[] = mergeInboxSessions(),
): VidgetInboxSession[] {
  return sessions
    .filter((session) => session.projectId === projectId && vidgetIds.has(session.vidgetId))
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getVidgetInboxSessionById(
  sessionId: string,
  sessions: readonly VidgetInboxSession[] = mergeInboxSessions(),
): VidgetInboxSession | undefined {
  return getCapturedVidgetInboxSessionById(sessionId)
    ?? sessions.find((session) => session.id === sessionId);
}
