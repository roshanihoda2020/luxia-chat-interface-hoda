/**
 * Organization Analytics prototype adapter.
 *
 * There is no analytics backend, telemetry API, heartbeat service, or
 * session tracker in this repository. `getOrganizationAnalyticsSnapshot`
 * is a deterministic UX preview for the internal Analytics filters.
 * Do not treat these values as production metrics or as a client API.
 */
import { format, subDays } from "date-fns";
import { ORGANIZATION_USERS } from "@/app/features/permissions/data";
import type { OrganizationUser } from "@/app/features/permissions/types";
import { SEED_VIDGETS } from "@/app/features/vidgets/data";
import type { VidgetRecord } from "@/app/features/vidgets/types";
import { VIDGET_AVATARS, VIDGET_EXPERIENCE_MODE_LABELS } from "@/app/features/vidgets/types";
import {
  ANALYTICS_ALL_SCOPE_ID,
  ANALYTICS_ORGANIZATIONS,
  analyticsScopeMatches,
  analyticsScopeScale,
} from "./scope";
import type {
  ActiveSessionRow,
  DailyAvatarMinutesPoint,
  DailyPresencePoint,
  LiveAvatarSessionRow,
  OrganizationAnalyticsSnapshot,
  VidgetAvatarBreakdownRow,
} from "./types";

export const ORGANIZATION_ANALYTICS_INTEGRATION = {
  available: false,
  source: "prototype" as const,
  missing:
    "No organization analytics API, telemetry store, or avatar session tracker exists in this repository.",
};

export interface AnalyticsSnapshotInput {
  users?: OrganizationUser[];
  vidgets?: VidgetRecord[];
  tenantId?: string;
  organizationId?: string;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function wave(seed: number, amplitude: number, floor: number): number {
  const value = floor + Math.round((Math.sin(seed) * 0.5 + 0.5) * amplitude);
  return Math.max(0, value);
}

function buildDailyPresence(today: Date): DailyPresencePoint[] {
  const points: DailyPresencePoint[] = [];
  for (let offset = 89; offset >= 0; offset -= 1) {
    const day = subDays(today, offset);
    const empty = offset >= 78;
    points.push({
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "MMM d"),
      online: empty ? 0 : wave(offset * 0.37 + 1.2, 3, offset < 2 ? 2 : 1),
      idle: empty ? 0 : wave(offset * 0.51 + 2.4, 2, offset === 0 ? 1 : 0),
    });
  }
  return points;
}

function buildDailyAvatarMinutes(today: Date): DailyAvatarMinutesPoint[] {
  const points: DailyAvatarMinutesPoint[] = [];
  for (let offset = 89; offset >= 0; offset -= 1) {
    const day = subDays(today, offset);
    const empty = offset >= 78;
    points.push({
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "MMM d"),
      minutes: empty ? 0 : wave(offset * 0.29 + 0.8, 420, offset < 1 ? 60 : 80),
    });
  }
  return points;
}

function avatarLabel(avatarId: string | undefined): string {
  return VIDGET_AVATARS.find((item) => item.id === avatarId)?.name ?? "Avatar";
}

function resolveUserName(roster: OrganizationUser[], userId: string, fallback: string): string {
  return roster.find((user) => user.id === userId)?.name ?? fallback;
}

function scaleCount(value: number, scale: number): number {
  if (value === 0) return 0;
  return Math.max(0, Math.round(value * scale));
}

const USER_ANALYTICS_SCOPE: Record<string, { tenantId: string; organizationId: string }> = {
  "user-01": { tenantId: "tenant-luxia", organizationId: "org-luxia-demo" },
  "user-02": { tenantId: "tenant-northwind", organizationId: "org-northwind-analytics" },
  "user-03": { tenantId: "tenant-luxia", organizationId: "org-luxia-ops" },
  "user-04": { tenantId: "tenant-northwind", organizationId: "org-northwind-support" },
  "user-05": { tenantId: "tenant-luxia", organizationId: "org-luxia-demo" },
};

const VIDGET_ANALYTICS_SCOPE: Record<string, { tenantId: string; organizationId: string }> = {
  "vidget-01": { tenantId: "tenant-luxia", organizationId: "org-luxia-demo" },
  "vidget-02": { tenantId: "tenant-luxia", organizationId: "org-luxia-ops" },
  "vidget-03": { tenantId: "tenant-northwind", organizationId: "org-northwind-support" },
  "vidget-p2-01": { tenantId: "tenant-northwind", organizationId: "org-northwind-analytics" },
  "vidget-p3-01": { tenantId: "tenant-luxia", organizationId: "org-luxia-ops" },
};

function userScope(userId: string): { tenantId: string; organizationId: string } {
  return USER_ANALYTICS_SCOPE[userId] ?? {
    tenantId: "tenant-luxia",
    organizationId: "org-luxia-demo",
  };
}

function vidgetScope(vidgetId: string, index: number): { tenantId: string; organizationId: string } {
  const mapped = VIDGET_ANALYTICS_SCOPE[vidgetId];
  if (mapped) return mapped;
  const organization = ANALYTICS_ORGANIZATIONS[index % ANALYTICS_ORGANIZATIONS.length]!;
  return { tenantId: organization.tenantId, organizationId: organization.id };
}

export function getOrganizationAnalyticsSnapshot(
  input: AnalyticsSnapshotInput = {},
): OrganizationAnalyticsSnapshot {
  const tenantId = input.tenantId ?? ANALYTICS_ALL_SCOPE_ID;
  const organizationId = input.organizationId ?? ANALYTICS_ALL_SCOPE_ID;
  const scale = analyticsScopeScale(tenantId, organizationId);
  const today = startOfLocalDay(new Date());
  const roster = input.users?.length ? input.users : ORGANIZATION_USERS;
  const catalog = input.vidgets?.length ? input.vidgets : SEED_VIDGETS;
  const activeUsers = roster.filter((user) => user.status === "active");

  const allSessions: ActiveSessionRow[] = [
    {
      userId: "user-05",
      name: resolveUserName(activeUsers, "user-05", "User name 05"),
      status: "online",
      lastSeen: isoMinutesAgo(1),
      ...userScope("user-05"),
    },
    {
      userId: "user-01",
      name: resolveUserName(activeUsers, "user-01", "User name 01"),
      status: "online",
      lastSeen: isoMinutesAgo(6),
      ...userScope("user-01"),
    },
    {
      userId: "user-03",
      name: resolveUserName(activeUsers, "user-03", "User name 03"),
      status: "idle",
      lastSeen: isoMinutesAgo(18),
      ...userScope("user-03"),
    },
    {
      userId: "user-02",
      name: resolveUserName(activeUsers, "user-02", "User name 02"),
      status: "online",
      lastSeen: isoMinutesAgo(9),
      ...userScope("user-02"),
    },
    {
      userId: "user-04",
      name: resolveUserName(activeUsers, "user-04", "User name 04"),
      status: "idle",
      lastSeen: isoMinutesAgo(22),
      ...userScope("user-04"),
    },
  ];
  const sessions = allSessions.filter((row) => analyticsScopeMatches(row, tenantId, organizationId));

  const liveAvatarSessions: LiveAvatarSessionRow[] = catalog
    .map((vidget, index) => ({
      vidgetId: vidget.id,
      vidgetName: vidget.name,
      avatarType: VIDGET_EXPERIENCE_MODE_LABELS[vidget.experienceMode],
      lastHeartbeat: isoMinutesAgo([2, 11, 17, 8, 25][index] ?? 14),
      ...vidgetScope(vidget.id, index),
    }))
    .filter((row) => analyticsScopeMatches(row, tenantId, organizationId));

  const vidgetBreakdown: VidgetAvatarBreakdownRow[] = catalog
    .map((vidget, index) => ({
      vidgetId: vidget.id,
      vidgetName: vidget.name,
      avatarName: avatarLabel(vidget.avatarId),
      avatarType: VIDGET_EXPERIENCE_MODE_LABELS[vidget.experienceMode],
      totalMinutes: [4820, 2104, 1688, 3901, 1240][index] ?? 1200,
      ...vidgetScope(vidget.id, index),
    }))
    .filter((row) => analyticsScopeMatches(row, tenantId, organizationId));

  const online = sessions.filter((row) => row.status === "online").length;
  const idle = sessions.filter((row) => row.status === "idle").length;
  const totalRegistered = Math.max(sessions.length, scaleCount(roster.length, scale));
  const offline = Math.max(0, totalRegistered - online - idle);

  return {
    presence: {
      online,
      idle,
      offline,
      totalRegistered,
    },
    organizationUsage: {
      lastHour: Math.max(online, scaleCount(2, scale)),
      today: Math.max(sessions.length, scaleCount(4, scale)),
      thisWeek: Math.max(sessions.length, scaleCount(5, scale)),
      thisMonth: Math.max(sessions.length, scaleCount(5, scale)),
    },
    dailyPresence: buildDailyPresence(today).map((point) => ({
      ...point,
      online: scaleCount(point.online, scale),
      idle: scaleCount(point.idle, scale),
    })),
    activeSessions: sessions,
    liveAvatarSessions,
    avatarMinutes: {
      lastHour: scaleCount(60, scale),
      today: scaleCount(311, scale),
      thisWeek: scaleCount(2971, scale),
      thisMonth: scaleCount(12104, scale),
    },
    dailyAvatarMinutes: buildDailyAvatarMinutes(today).map((point) => ({
      ...point,
      minutes: scaleCount(point.minutes, scale),
    })),
    vidgetBreakdown,
  };
}

export function filterPointsByRange<T extends { date: string }>(
  points: T[],
  start: Date,
  end: Date,
): T[] {
  const startKey = format(startOfLocalDay(start), "yyyy-MM-dd");
  const endKey = format(startOfLocalDay(end), "yyyy-MM-dd");
  return points.filter((point) => point.date >= startKey && point.date <= endKey);
}

export function rangeHasActivity(
  points: Array<{ online?: number; idle?: number; minutes?: number }>,
): boolean {
  return points.some((point) => (point.online ?? 0) + (point.idle ?? 0) + (point.minutes ?? 0) > 0);
}

export function resolveAnalyticsRange(
  preset: "7d" | "30d" | "90d" | "custom",
  customStart: string,
  customEnd: string,
): { start: Date; end: Date } {
  const end = startOfLocalDay(new Date());
  if (preset === "7d") return { start: subDays(end, 6), end };
  if (preset === "30d") return { start: subDays(end, 29), end };
  if (preset === "90d") return { start: subDays(end, 89), end };
  const startDate = customStart ? startOfLocalDay(new Date(`${customStart}T00:00:00`)) : subDays(end, 6);
  const endDate = customEnd ? startOfLocalDay(new Date(`${customEnd}T00:00:00`)) : end;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { start: subDays(end, 6), end };
  }
  return startDate <= endDate ? { start: startDate, end: endDate } : { start: endDate, end: startDate };
}
