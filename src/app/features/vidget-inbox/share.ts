import type { VidgetInboxReviewShare, VidgetInboxReviewShareScope, VidgetInboxSession } from "./types";

let shareCounter = 0;
const createdShares: VidgetInboxReviewShare[] = [];

export function sessionIdsForShareScope(scope: VidgetInboxReviewShareScope): string[] {
  return Array.from(new Set(scope.sessionIds.filter(Boolean)));
}

/** Independent of Inbox UI filters and visible rows. */
export function reviewSessionsForVidget(
  sessions: readonly VidgetInboxSession[],
  vidgetId: string,
): VidgetInboxSession[] {
  return sessions.filter((session) => session.vidgetId === vidgetId);
}

export function conversationShareScope(
  sessionId: string,
): Extract<VidgetInboxReviewShareScope, { type: "conversation" }> {
  return { type: "conversation", sessionIds: [sessionId] };
}

export function selectedShareScope(
  sessionIds: string[],
): Extract<VidgetInboxReviewShareScope, { type: "selected" }> {
  return { type: "selected", sessionIds: Array.from(new Set(sessionIds.filter(Boolean))) };
}

export function vidgetShareScope(
  vidgetId: string,
  sessions: readonly VidgetInboxSession[],
): Extract<VidgetInboxReviewShareScope, { type: "vidget" }> {
  return {
    type: "vidget",
    vidgetId,
    sessionIds: reviewSessionsForVidget(sessions, vidgetId).map((session) => session.id),
  };
}

/**
 * Frontend-only review share record.
 * Scope is exactly the session IDs on the explicit share intent.
 */
export function createVidgetInboxReviewShare(input: {
  projectId: string;
  scope: VidgetInboxReviewShareScope;
  anonymous: boolean;
  vidgetId?: string | null;
}): VidgetInboxReviewShare | null {
  const sessionIds = sessionIdsForShareScope(input.scope);
  if (sessionIds.length === 0) return null;
  shareCounter += 1;
  const share: VidgetInboxReviewShare = {
    id: `vshare-${Date.now()}-${shareCounter}`,
    projectId: input.projectId,
    vidgetId: input.scope.type === "vidget"
      ? input.scope.vidgetId
      : input.vidgetId?.trim() || null,
    sessionIds,
    scopeType: input.scope.type,
    anonymous: input.anonymous,
    createdAt: new Date().toISOString(),
  };
  createdShares.push(share);
  return share;
}

export function listVidgetInboxReviewShares(): readonly VidgetInboxReviewShare[] {
  return createdShares;
}

export function describeShareScope(input: {
  sessionCount: number;
  vidgetNames: string[];
}): string {
  const sessionLabel = input.sessionCount === 1
    ? "1 conversation"
    : `${input.sessionCount} conversations`;
  if (input.vidgetNames.length === 1) {
    return `${sessionLabel} from ${input.vidgetNames[0]}`;
  }
  if (input.vidgetNames.length > 1) {
    return `${sessionLabel} across ${input.vidgetNames.length} Vidgets`;
  }
  return sessionLabel;
}

export function shareDialogCopy(
  scope: VidgetInboxReviewShareScope,
  vidgetName?: string | null,
): {
  title: string;
  helper: string;
  doneTitle: string;
} {
  if (scope.type === "conversation") {
    return {
      title: "Share this conversation",
      helper: "Share this conversation for review.",
      doneTitle: "Conversation shared",
    };
  }
  if (scope.type === "vidget") {
    const name = vidgetName?.trim();
    return {
      title: "Share this Vidget’s conversations",
      helper: name
        ? `Share the review conversations for ${name}.`
        : "Share the review conversations for this Vidget.",
      doneTitle: "Conversations shared",
    };
  }
  return {
    title: "Share selected conversations",
    helper: "Share only the conversations you selected.",
    doneTitle: "Conversations shared",
  };
}
