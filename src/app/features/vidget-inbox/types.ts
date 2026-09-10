import type { LuxiaResponsePresentation } from "@/app/features/chat/LuxiaResponseCard";
import type { VidgetChannel } from "@/app/features/vidgets/types";

export type VidgetInboxFeedback = "positive" | "negative" | "none";

export type VidgetInboxProblemsFilter = "all" | "problems" | "none";

export type VidgetInboxDateFilter = "all" | "today" | "7d" | "30d";

export type VidgetInboxTurnRole = "visitor" | "assistant";

export interface VidgetInboxVisitorTurn {
  id: string;
  role: "visitor";
  content: string;
  timestamp: string;
}

export interface VidgetInboxAssistantTurn {
  id: string;
  role: "assistant";
  content: string;
  timestamp: string;
  presentation: LuxiaResponsePresentation;
  notice?: string;
  sources?: { id: string; label: string }[];
  feedback: VidgetInboxFeedback;
  constellationId: string | null;
}

export type VidgetInboxTurn = VidgetInboxVisitorTurn | VidgetInboxAssistantTurn;

/** Captured prototype chats and development fixtures share this shape. */
export interface VidgetInboxSession {
  id: string;
  projectId: string;
  vidgetId: string;
  channel: VidgetChannel;
  locale: string;
  startedAt: string;
  endedAt: string;
  messageCount: number;
  constellationId: string | null;
  problemCount: number;
  turns: VidgetInboxTurn[];
}

export interface VidgetInboxQuery {
  q: string;
  vidgetId: string;
  channel: "all" | VidgetChannel;
  locale: string;
  date: VidgetInboxDateFilter;
  problems: VidgetInboxProblemsFilter;
  constellationId: string;
  /** Selected conversation in the Inbox workspace. Not a filter. */
  sessionId: string;
}

/**
 * Explicit review-share intent. The dialog renders copy from `type`,
 * and the payload is exactly `sessionIds` — never inferred from filters.
 */
export type VidgetInboxReviewShareScope =
  | {
      type: "conversation";
      sessionIds: [string];
    }
  | {
      type: "selected";
      sessionIds: string[];
    }
  | {
      type: "vidget";
      vidgetId: string;
      sessionIds: string[];
    };

/** Not a public token API. */
export interface VidgetInboxReviewShare {
  id: string;
  projectId: string;
  vidgetId: string | null;
  sessionIds: string[];
  scopeType: VidgetInboxReviewShareScope["type"];
  anonymous: boolean;
  createdAt: string;
}

export interface VidgetInboxRefinePayload {
  projectId: string;
  constellationId: string;
  question: string;
  answer: string;
  presentation: LuxiaResponsePresentation;
  notice?: string;
  sources?: { id: string; label: string }[];
  feedback: VidgetInboxFeedback;
}
