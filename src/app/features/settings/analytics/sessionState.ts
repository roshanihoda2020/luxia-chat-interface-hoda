import { ANALYTICS_ALL_SCOPE_ID } from "./scope";
import type { AnalyticsDatePreset, SessionStatusFilter } from "./types";

export type AnalyticsTabId = "presence" | "avatar";

export interface AnalyticsSessionState {
  tab: AnalyticsTabId;
  tenantId: string;
  organizationId: string;
  presencePreset: AnalyticsDatePreset;
  avatarPreset: AnalyticsDatePreset;
  presenceStart: string;
  presenceEnd: string;
  avatarStart: string;
  avatarEnd: string;
  sessionFilter: SessionStatusFilter;
  sessionQuery: string;
  pageSize: number;
  page: number;
}

export function createAnalyticsSession(): AnalyticsSessionState {
  return {
    tab: "presence",
    tenantId: ANALYTICS_ALL_SCOPE_ID,
    organizationId: ANALYTICS_ALL_SCOPE_ID,
    presencePreset: "7d",
    avatarPreset: "7d",
    presenceStart: "",
    presenceEnd: "",
    avatarStart: "",
    avatarEnd: "",
    sessionFilter: "all",
    sessionQuery: "",
    pageSize: 5,
    page: 0,
  };
}
