import { getSharedReviewPath as buildSharedReviewPath } from "@/app/features/project/projectPaths";
import type {
  VidgetInboxReviewShare,
  VidgetInboxReviewShareScope,
  VidgetInboxSession,
  VidgetInboxShareAccess,
  VidgetInboxShareExpiryDays,
} from "./types";

const SHARE_STORAGE_KEY = "luxia.vidget-inbox.review-shares.v1";

let shareCounter = 0;
let createdShares: VidgetInboxReviewShare[] = loadSharesFromStorage();

function loadSharesFromStorage(): VidgetInboxReviewShare[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeShare)
      .filter((share): share is VidgetInboxReviewShare => Boolean(share));
  } catch {
    return [];
  }
}

function persistShares(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(createdShares));
  } catch {
    /* ignore quota / privacy mode */
  }
}

function normalizeShare(raw: unknown): VidgetInboxReviewShare | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.projectId !== "string") return null;
  if (!Array.isArray(record.sessionIds)) return null;
  const sessionIds = record.sessionIds.filter((id): id is string => typeof id === "string" && Boolean(id));
  if (sessionIds.length === 0) return null;
  const scopeType =
    record.scopeType === "conversation"
    || record.scopeType === "selected"
    || record.scopeType === "vidget"
      ? record.scopeType
      : "selected";
  return {
    id: record.id,
    projectId: record.projectId,
    vidgetId: typeof record.vidgetId === "string" ? record.vidgetId : null,
    sessionIds,
    scopeType,
    anonymous: Boolean(record.anonymous),
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
    expiresAt: typeof record.expiresAt === "string" ? record.expiresAt : null,
    revokedAt: typeof record.revokedAt === "string" ? record.revokedAt : null,
    createdBy: typeof record.createdBy === "string" ? record.createdBy : null,
  };
}

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

export function getSharedReviewPath(shareId: string): string {
  return buildSharedReviewPath(shareId);
}

export function absoluteSharedReviewUrl(shareId: string): string {
  const path = buildSharedReviewPath(shareId);
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function computeExpiresAt(
  expiresInDays: VidgetInboxShareExpiryDays,
  from = new Date(),
): string | null {
  if (expiresInDays == null) return null;
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + expiresInDays);
  return next.toISOString();
}

/**
 * Frontend-only review share record for external link review.
 * Scope is exactly the session IDs on the explicit share intent.
 */
export function createVidgetInboxReviewShare(input: {
  projectId: string;
  scope: VidgetInboxReviewShareScope;
  anonymous: boolean;
  expiresInDays?: VidgetInboxShareExpiryDays;
  vidgetId?: string | null;
  createdBy?: string | null;
}): VidgetInboxReviewShare | null {
  const sessionIds = sessionIdsForShareScope(input.scope);
  if (sessionIds.length === 0) return null;
  shareCounter += 1;
  const createdAt = new Date().toISOString();
  const expiresInDays = input.expiresInDays === undefined ? 7 : input.expiresInDays;
  const share: VidgetInboxReviewShare = {
    id: `vshare-${Date.now()}-${shareCounter}`,
    projectId: input.projectId,
    vidgetId: input.scope.type === "vidget"
      ? input.scope.vidgetId
      : input.vidgetId?.trim() || null,
    sessionIds,
    scopeType: input.scope.type,
    anonymous: input.anonymous,
    createdAt,
    expiresAt: computeExpiresAt(expiresInDays, new Date(createdAt)),
    revokedAt: null,
    createdBy: input.createdBy ?? null,
  };
  createdShares = [share, ...createdShares];
  persistShares();
  return share;
}

export function getVidgetInboxReviewShareById(
  shareId: string,
): VidgetInboxReviewShare | null {
  const id = shareId.trim();
  if (!id) return null;
  return createdShares.find((share) => share.id === id) ?? null;
}

export function resolveVidgetInboxShareAccess(
  shareId: string,
  now = Date.now(),
): VidgetInboxShareAccess {
  const share = getVidgetInboxReviewShareById(shareId);
  if (!share) return { status: "not-found" };
  if (share.revokedAt) return { status: "revoked", share };
  if (share.expiresAt && Date.parse(share.expiresAt) <= now) {
    return { status: "expired", share };
  }
  return { status: "active", share };
}

export function revokeVidgetInboxReviewShare(shareId: string): VidgetInboxReviewShare | null {
  const index = createdShares.findIndex((share) => share.id === shareId);
  if (index < 0) return null;
  const current = createdShares[index];
  if (current.revokedAt) return current;
  const updated: VidgetInboxReviewShare = {
    ...current,
    revokedAt: new Date().toISOString(),
  };
  createdShares = [
    ...createdShares.slice(0, index),
    updated,
    ...createdShares.slice(index + 1),
  ];
  persistShares();
  return updated;
}

export function listVidgetInboxReviewShares(): readonly VidgetInboxReviewShare[] {
  return createdShares;
}

export function listRecentVidgetInboxReviewShares(
  projectId: string,
  limit = 5,
): VidgetInboxReviewShare[] {
  return createdShares
    .filter((share) => share.projectId === projectId)
    .slice(0, Math.max(0, limit));
}

/** Sessions included in a share — never falls back to the full Inbox. */
export function sessionsForReviewShare(
  share: VidgetInboxReviewShare,
  lookup: (sessionId: string) => VidgetInboxSession | undefined,
): VidgetInboxSession[] {
  const allowed = new Set(share.sessionIds);
  const result: VidgetInboxSession[] = [];
  for (const id of share.sessionIds) {
    if (!allowed.has(id)) continue;
    const session = lookup(id);
    if (session && session.projectId === share.projectId) {
      result.push(session);
    }
  }
  return result;
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
      helper: "Create a read-only link for this conversation.",
      doneTitle: "Link created",
    };
  }
  if (scope.type === "vidget") {
    const name = vidgetName?.trim();
    return {
      title: "Share this Vidget’s conversations",
      helper: name
        ? `Create a read-only link for ${name} conversations.`
        : "Create a read-only link for this Vidget’s conversations.",
      doneTitle: "Link created",
    };
  }
  return {
    title: "Share selected conversations",
    helper: "Create a read-only link for the conversations you selected.",
    doneTitle: "Link created",
  };
}

export function formatShareExpiryLabel(expiresAt: string | null, now = Date.now()): string {
  if (!expiresAt) return "No expiry";
  const ms = Date.parse(expiresAt) - now;
  if (Number.isNaN(ms)) return "No expiry";
  if (ms <= 0) return "Expired";
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 1) return "Expires in 1 day";
  return `Expires in ${days} days`;
}

export function shareStatusLabel(share: VidgetInboxReviewShare, now = Date.now()): string {
  if (share.revokedAt) return "Revoked";
  if (share.expiresAt && Date.parse(share.expiresAt) <= now) return "Expired";
  return "Active";
}
