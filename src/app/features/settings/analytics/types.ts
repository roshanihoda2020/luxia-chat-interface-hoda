export type PresenceStatus = "online" | "idle" | "offline";

export type AnalyticsDatePreset = "7d" | "30d" | "90d" | "custom";

export type SessionStatusFilter = "all" | "online" | "idle";

export interface DailyPresencePoint {
  date: string;
  label: string;
  online: number;
  idle: number;
}

export interface ActiveSessionRow {
  userId: string;
  name: string;
  status: Exclude<PresenceStatus, "offline">;
  lastSeen: string;
  tenantId: string;
  organizationId: string;
}

export interface LiveAvatarSessionRow {
  vidgetId: string;
  vidgetName: string;
  projectName: string | null;
  sourceType: "galaxy" | "constellation" | null;
  knowledgeScopeLabel: string | null;
  knowledgeScopeNames: string[];
  avatarName: string | null;
  avatarType: string | null;
  channelLabel: string | null;
  status: Exclude<PresenceStatus, "offline"> | null;
  lastHeartbeat: string;
  tenantId: string;
  organizationId: string;
  tenantName: string;
  organizationName: string;
  galaxyId: string | null;
  galaxyName: string | null;
  constellationIds: string[];
}

export interface VidgetAvatarBreakdownRow {
  vidgetId: string;
  vidgetName: string;
  avatarName: string;
  avatarType: string;
  totalMinutes: number;
  tenantId: string;
  organizationId: string;
}

export interface DailyAvatarMinutesPoint {
  date: string;
  label: string;
  minutes: number;
}

export interface OrganizationAnalyticsSnapshot {
  presence: {
    online: number;
    idle: number;
    offline: number;
    totalRegistered: number;
  };
  organizationUsage: {
    lastHour: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  dailyPresence: DailyPresencePoint[];
  activeSessions: ActiveSessionRow[];
  liveAvatarSessions: LiveAvatarSessionRow[];
  avatarMinutes: {
    lastHour: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  dailyAvatarMinutes: DailyAvatarMinutesPoint[];
  vidgetBreakdown: VidgetAvatarBreakdownRow[];
}
