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

/**
 * Prototype external review share.
 * Not a production token/ACL API — local UI mock only.
 */
export type VidgetInboxShareExpiryDays = 7 | 30 | null;

export interface VidgetInboxReviewShare {
  id: string;
  projectId: string;
  vidgetId: string | null;
  sessionIds: string[];
  scopeType: VidgetInboxReviewShareScope["type"];
  anonymous: boolean;
  createdAt: string;
  /** ISO timestamp, or null when the link does not expire. */
  expiresAt: string | null;
  /** ISO timestamp when revoked; null while active. */
  revokedAt: string | null;
  createdBy?: string | null;
}

export type VidgetInboxShareAccess =
  | { status: "active"; share: VidgetInboxReviewShare }
  | { status: "not-found" }
  | { status: "expired"; share: VidgetInboxReviewShare }
  | { status: "revoked"; share: VidgetInboxReviewShare };

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
