import { Fragment, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, RefreshCw } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/app/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/components/ui/chart";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { SearchableCombobox } from "@/app/components/ui/searchable-combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { DemoUserAvatar } from "@/app/features/permissions/demoUserAvatar";
import type { OrganizationUser } from "@/app/features/permissions/types";
import type { VidgetRecord } from "@/app/features/vidgets/types";
import {
  LUXIA_SETTINGS_TAB_TRIGGER_CLASS,
  LUXIA_SETTINGS_TABLIST_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import {
  CompactMetricTile,
  SETTINGS_FLOATING_Z_CLASS,
  SettingsDialogSectionHeader,
  SettingsDialogSurface,
} from "../SettingsDialogBlocks";
import {
  filterPointsByRange,
  getOrganizationAnalyticsSnapshot,
  rangeHasActivity,
  resolveAnalyticsRange,
} from "./prototypeState";
import {
  ANALYTICS_ALL_SCOPE_ID,
  ANALYTICS_TENANTS,
  organizationsForTenant,
} from "./scope";
import type { AnalyticsSessionState } from "./sessionState";
import type {
  AnalyticsDatePreset,
  LiveAvatarSessionRow,
  PresenceStatus,
  SessionStatusFilter,
} from "./types";

const PRESENCE_CHART_CONFIG = {
  online: { label: "Online", color: "var(--luxia-success)" },
  idle: { label: "Idle", color: "var(--luxia-warning-50)" },
} satisfies ChartConfig;

const MINUTES_CHART_CONFIG = {
  minutes: { label: "Minutes", color: "var(--luxia-purple-60)" },
} satisfies ChartConfig;

const DATE_PRESETS: Array<{ id: AnalyticsDatePreset; label: string }> = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "custom", label: "Custom" },
];

const SESSION_FILTERS: Array<{ id: SessionStatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "online", label: "Online" },
  { id: "idle", label: "Idle" },
];

const PAGE_SIZES = ["5", "10", "25"] as const;

function statusTone(status: PresenceStatus): { color: string; label: string } {
  if (status === "online") return { color: "var(--luxia-success-70)", label: "Online" };
  if (status === "idle") return { color: "var(--luxia-warning-90)", label: "Idle" };
  return { color: "var(--luxia-text-muted)", label: "Offline" };
}

function formatMinutes(value: number): string {
  return `${value.toLocaleString()} min`;
}

function formatLastSeen(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function sourceTypeLabel(sourceType: LiveAvatarSessionRow["sourceType"]): string {
  if (sourceType === "galaxy") return "Galaxy";
  if (sourceType === "constellation") return "Constellation";
  return "—";
}

function StackedCell({
  primary,
  secondary,
  title,
}: {
  primary: string;
  secondary?: string | null;
  title?: string;
}) {
  return (
    <td className="min-w-0 px-3 py-2.5 align-top">
      <span
        className="block min-w-0 truncate luxia-type-body-dense"
        style={{ color: "var(--luxia-text-primary)" }}
        title={title ?? (primary === "—" ? undefined : primary)}
      >
        {primary}
      </span>
      {secondary ? (
        <span
          className="block min-w-0 truncate luxia-type-caption"
          style={{ color: "var(--luxia-text-muted)" }}
          title={secondary}
        >
          {secondary}
        </span>
      ) : null}
    </td>
  );
}

function TruncateCell({
  value,
  title,
  nowrap,
}: {
  value: string;
  title?: string;
  nowrap?: boolean;
}) {
  const tip = title ?? (value === "—" ? undefined : value);
  return (
    <td className={`min-w-0 px-3 py-2.5 align-top ${nowrap ? "whitespace-nowrap" : ""}`}>
      <span
        className="block min-w-0 truncate luxia-type-caption"
        style={{ color: "var(--luxia-text-secondary)" }}
        title={tip}
      >
        {value}
      </span>
    </td>
  );
}

function avatarSessionPrimary(row: LiveAvatarSessionRow): string {
  if (row.avatarName?.trim()) return row.avatarName.trim();
  return displayValue(row.avatarType ?? "No avatar");
}

function avatarSessionSecondary(row: LiveAvatarSessionRow): string | null {
  return row.avatarName?.trim() ? row.avatarType : null;
}

function SessionDetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
        {label}
      </p>
      <p
        className="truncate luxia-type-caption"
        style={{ color: "var(--luxia-text-secondary)" }}
        title={value === "—" ? undefined : value}
      >
        {value}
      </p>
    </div>
  );
}

function LiveAvatarSessionDetails({ row }: { row: LiveAvatarSessionRow }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-3 py-2.5 @min-[640px]:grid-cols-3">
      <SessionDetailField label="Tenant" value={displayValue(row.tenantName)} />
      <SessionDetailField label="Organization" value={displayValue(row.organizationName)} />
      <SessionDetailField label="Last heartbeat" value={formatLastSeen(row.lastHeartbeat)} />
      <SessionDetailField label="Tenant ID" value={displayValue(row.tenantId)} />
      <SessionDetailField label="Vidget ID" value={displayValue(row.vidgetId)} />
      {row.sourceType === "galaxy" ? (
        <SessionDetailField label="Galaxy ID" value={displayValue(row.galaxyId)} />
      ) : null}
      {row.sourceType === "galaxy" && row.galaxyName ? (
        <SessionDetailField label="Galaxy" value={row.galaxyName} />
      ) : null}
      {row.constellationIds.length > 0 ? (
        <SessionDetailField
          label={row.constellationIds.length > 1 ? "Constellation IDs" : "Constellation ID"}
          value={row.constellationIds.join(" · ")}
        />
      ) : null}
    </div>
  );
}

function DateRangeControls({
  preset,
  customStart,
  customEnd,
  onPreset,
  onCustomStart,
  onCustomEnd,
  idPrefix,
}: {
  preset: AnalyticsDatePreset;
  customStart: string;
  customEnd: string;
  onPreset: (value: AnalyticsDatePreset) => void;
  onCustomStart: (value: string) => void;
  onCustomEnd: (value: string) => void;
  idPrefix: string;
}) {
  const startId = `${idPrefix}-start-date`;
  const endId = `${idPrefix}-end-date`;
  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="flex flex-nowrap items-center gap-1" role="group" aria-label="Date range">
        {DATE_PRESETS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="compact"
            variant={preset === item.id ? "secondary" : "tertiary"}
            aria-pressed={preset === item.id}
            onClick={() => onPreset(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {preset === "custom" ? (
        <div className="flex flex-nowrap items-end justify-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={startId} className="luxia-type-caption">
              Start Date
            </Label>
            <Input
              id={startId}
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(event) => onCustomStart(event.target.value)}
              className="h-8 min-h-8 w-[10.5rem]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={endId} className="luxia-type-caption">
              End Date
            </Label>
            <Input
              id={endId}
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(event) => onCustomEnd(event.target.value)}
              className="h-8 min-h-8 w-[10.5rem]"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div
      className="flex h-52 items-center justify-center rounded-[var(--luxia-radius-12)] border border-[var(--luxia-settings-section-border)] bg-[var(--luxia-settings-section-bg)] px-4"
      role="status"
    >
      <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
        {message}
      </p>
    </div>
  );
}

function TableEmpty({ message }: { message: string }) {
  return (
    <p className="px-3 py-6 text-center luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }} role="status">
      {message}
    </p>
  );
}

function AnalyticsScopeFilters({
  tenantId,
  organizationId,
  onTenantChange,
  onOrganizationChange,
  onResetFilters,
}: {
  tenantId: string;
  organizationId: string;
  onTenantChange: (value: string) => void;
  onOrganizationChange: (value: string) => void;
  onResetFilters: () => void;
}) {
  const organizationOptions = organizationsForTenant(tenantId);
  const filtersActive =
    tenantId !== ANALYTICS_ALL_SCOPE_ID || organizationId !== ANALYTICS_ALL_SCOPE_ID;
  return (
    <SettingsDialogSurface className="mb-3 min-w-0 px-3 pt-3 pb-2">
      <div className="flex min-w-0 flex-col gap-3 @min-[720px]:flex-row @min-[720px]:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-3 @min-[560px]:flex-row @min-[560px]:items-end">
          <span
            className="shrink-0 luxia-type-label-small uppercase tracking-[0.06em] @min-[560px]:mb-2.5"
            style={{ color: "var(--luxia-text-muted)" }}
          >
            FILTERS:
          </span>
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 @min-[560px]:grid-cols-2">
            <SearchableCombobox
              id="analytics-filter-tenant"
              label="Tenant"
              value={tenantId}
              onValueChange={onTenantChange}
              clearValue={ANALYTICS_ALL_SCOPE_ID}
              emptyText="No tenants found"
              className="w-full min-w-0"
              options={[
                { value: ANALYTICS_ALL_SCOPE_ID, label: "All Tenants" },
                ...ANALYTICS_TENANTS.map((tenant) => ({
                  value: tenant.id,
                  label: tenant.name,
                })),
              ]}
            />
            <SearchableCombobox
              id="analytics-filter-organization"
              label="Organization"
              value={organizationId}
              onValueChange={onOrganizationChange}
              clearValue={ANALYTICS_ALL_SCOPE_ID}
              emptyText="No organizations found"
              className="w-full min-w-0"
              options={[
                { value: ANALYTICS_ALL_SCOPE_ID, label: "All Organizations" },
                ...organizationOptions.map((organization) => ({
                  value: organization.id,
                  label: organization.name,
                })),
              ]}
            />
          </div>
        </div>
        {filtersActive ? (
          <Button
            type="button"
            variant="secondary"
            size="compact"
            className="shrink-0"
            onClick={onResetFilters}
          >
            Reset filters
          </Button>
        ) : null}
      </div>
    </SettingsDialogSurface>
  );
}

export function OrganizationAnalyticsSection({
  session,
  onSessionChange,
  directoryUsers,
  vidgets,
}: {
  session: AnalyticsSessionState;
  onSessionChange: (next: AnalyticsSessionState) => void;
  directoryUsers?: OrganizationUser[];
  vidgets?: VidgetRecord[];
}) {
  const [refreshEpoch, setRefreshEpoch] = useState(0);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const snapshot = useMemo(
    () =>
      getOrganizationAnalyticsSnapshot({
        users: directoryUsers,
        vidgets,
        tenantId: session.tenantId,
        organizationId: session.organizationId,
      }),
    [directoryUsers, vidgets, session.tenantId, session.organizationId, refreshEpoch],
  );
  const {
    tab,
    tenantId,
    organizationId,
    presencePreset,
    avatarPreset,
    presenceStart,
    presenceEnd,
    avatarStart,
    avatarEnd,
    sessionFilter,
    sessionQuery,
    pageSize,
    page,
  } = session;

  const presenceRange = resolveAnalyticsRange(presencePreset, presenceStart, presenceEnd);
  const avatarRange = resolveAnalyticsRange(avatarPreset, avatarStart, avatarEnd);
  const presencePoints = filterPointsByRange(snapshot.dailyPresence, presenceRange.start, presenceRange.end);
  const avatarPoints = filterPointsByRange(snapshot.dailyAvatarMinutes, avatarRange.start, avatarRange.end);
  const presenceActive = rangeHasActivity(presencePoints);
  const avatarActive = rangeHasActivity(avatarPoints);

  const filteredSessions = snapshot.activeSessions.filter((row) => {
    if (sessionFilter !== "all" && row.status !== sessionFilter) return false;
    const query = sessionQuery.trim().toLowerCase();
    if (!query) return true;
    return row.name.toLowerCase().includes(query) || row.userId.toLowerCase().includes(query);
  });
  const pageCount = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pagedSessions = filteredSessions.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function patchSession(next: Partial<AnalyticsSessionState>) {
    onSessionChange({ ...session, ...next });
  }

  function handleTenantChange(nextTenantId: string) {
    const orgStillValid =
      organizationId === ANALYTICS_ALL_SCOPE_ID ||
      organizationsForTenant(nextTenantId).some((item) => item.id === organizationId);
    patchSession({
      tenantId: nextTenantId,
      organizationId: orgStillValid ? organizationId : ANALYTICS_ALL_SCOPE_ID,
      page: 0,
    });
  }

  function handleResetFilters() {
    patchSession({
      tenantId: ANALYTICS_ALL_SCOPE_ID,
      organizationId: ANALYTICS_ALL_SCOPE_ID,
      page: 0,
    });
  }

  function handleRefresh() {
    setRefreshEpoch((current) => current + 1);
  }

  function handlePresenceStart(value: string) {
    if (presenceEnd && value && value > presenceEnd) {
      patchSession({ presenceStart: presenceEnd, presenceEnd: value });
      return;
    }
    patchSession({ presenceStart: value });
  }

  function handlePresenceEnd(value: string) {
    if (presenceStart && value && value < presenceStart) {
      patchSession({ presenceStart: value, presenceEnd: presenceStart });
      return;
    }
    patchSession({ presenceEnd: value });
  }

  function handleAvatarStart(value: string) {
    if (avatarEnd && value && value > avatarEnd) {
      patchSession({ avatarStart: avatarEnd, avatarEnd: value });
      return;
    }
    patchSession({ avatarStart: value });
  }

  function handleAvatarEnd(value: string) {
    if (avatarStart && value && value < avatarStart) {
      patchSession({ avatarStart: value, avatarEnd: avatarStart });
      return;
    }
    patchSession({ avatarEnd: value });
  }

  function handlePresencePreset(next: AnalyticsDatePreset) {
    if (next === "custom" && !presenceStart && !presenceEnd) {
      const range = resolveAnalyticsRange("7d", "", "");
      patchSession({
        presencePreset: next,
        presenceStart: range.start.toISOString().slice(0, 10),
        presenceEnd: range.end.toISOString().slice(0, 10),
      });
      return;
    }
    patchSession({ presencePreset: next });
  }

  function handleAvatarPreset(next: AnalyticsDatePreset) {
    if (next === "custom" && !avatarStart && !avatarEnd) {
      const range = resolveAnalyticsRange("7d", "", "");
      patchSession({
        avatarPreset: next,
        avatarStart: range.start.toISOString().slice(0, 10),
        avatarEnd: range.end.toISOString().slice(0, 10),
      });
      return;
    }
    patchSession({ avatarPreset: next });
  }

  return (
    <>
      <SettingsDialogSectionHeader
        title="Analytics"
        description="Platform-wide user activity and usage telemetry."
        compact
        action={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="iconCompact"
                aria-label="Refresh analytics"
                onClick={handleRefresh}
              >
                <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6} className={SETTINGS_FLOATING_Z_CLASS}>
              Refresh analytics
            </TooltipContent>
          </Tooltip>
        }
      />
      <AnalyticsScopeFilters
        tenantId={tenantId}
        organizationId={organizationId}
        onTenantChange={handleTenantChange}
        onOrganizationChange={(value) => patchSession({ organizationId: value, page: 0 })}
        onResetFilters={handleResetFilters}
      />
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (value === "presence" || value === "avatar") patchSession({ tab: value });
        }}
        className="w-full min-w-0 gap-3"
      >
        <TabsList
          aria-label="Analytics views"
          className={`${LUXIA_SETTINGS_TABLIST_CLASS} !min-w-0`}
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          <TabsTrigger value="presence" className={LUXIA_SETTINGS_TAB_TRIGGER_CLASS}>
            User Presence
          </TabsTrigger>
          <TabsTrigger value="avatar" className={LUXIA_SETTINGS_TAB_TRIGGER_CLASS}>
            Avatar Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presence" className="m-0 space-y-3 outline-none">
          <section className="space-y-1.5">
            <h3 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
              Real-Time Presence
            </h3>
            <div className="grid min-w-0 grid-cols-2 gap-2.5 @min-[720px]:grid-cols-4">
              <CompactMetricTile label="Online" value={snapshot.presence.online} swatchColor="var(--luxia-success-70)" />
              <CompactMetricTile label="Idle" value={snapshot.presence.idle} swatchColor="var(--luxia-warning-90)" />
              <CompactMetricTile label="Offline" value={snapshot.presence.offline} swatchColor="var(--luxia-text-muted)" />
              <CompactMetricTile label="Total Registered" value={snapshot.presence.totalRegistered} />
            </div>
          </section>

          <section className="space-y-1.5">
            <h3 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
              Platform Usage
            </h3>
            <div className="grid min-w-0 grid-cols-2 gap-2.5 @min-[720px]:grid-cols-4">
              <CompactMetricTile label="Active Last Hour" value={snapshot.organizationUsage.lastHour} />
              <CompactMetricTile label="Active Today" value={snapshot.organizationUsage.today} />
              <CompactMetricTile label="Active This Week" value={snapshot.organizationUsage.thisWeek} />
              <CompactMetricTile label="Active This Month" value={snapshot.organizationUsage.thisMonth} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h3 className="min-w-0 luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                Daily Active Users
              </h3>
              <DateRangeControls
                idPrefix="analytics-presence"
                preset={presencePreset}
                customStart={presenceStart}
                customEnd={presenceEnd}
                onPreset={handlePresencePreset}
                onCustomStart={handlePresenceStart}
                onCustomEnd={handlePresenceEnd}
              />
            </div>
            {!presenceActive ? (
              <ChartEmpty message="No data available for this period." />
            ) : (
              <div className="luxia-settings-table-surface px-3 py-3">
                <ChartContainer config={PRESENCE_CHART_CONFIG} className="aspect-auto h-52 w-full">
                  <BarChart data={presencePoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--luxia-border-subtle)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="online" stackId="presence" fill="var(--color-online)" maxBarSize={18} />
                    <Bar dataKey="idle" stackId="presence" fill="var(--color-idle)" maxBarSize={18} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                  Active Sessions
                </h3>
                <p className="mt-0.5 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                  {filteredSessions.length.toLocaleString()} live
                </p>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {SESSION_FILTERS.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      size="compact"
                      variant={sessionFilter === item.id ? "secondary" : "tertiary"}
                      aria-pressed={sessionFilter === item.id}
                      onClick={() => {
                        patchSession({ sessionFilter: item.id, page: 0 });
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <Input
                  value={sessionQuery}
                  onChange={(event) => {
                    patchSession({ sessionQuery: event.target.value, page: 0 });
                  }}
                  placeholder="Search users"
                  aria-label="Search users"
                  className="h-8 min-h-8 w-[12rem]"
                />
              </div>
            </div>
            <div className="luxia-settings-table-surface overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                    <th className="px-3 py-2 font-normal">User</th>
                    <th className="px-3 py-2 font-normal">Status</th>
                    <th className="px-3 py-2 font-normal">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedSessions.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <TableEmpty
                          message={sessionFilter === "all" ? "No active users found" : "No active users found"}
                        />
                      </td>
                    </tr>
                  ) : (
                    pagedSessions.map((row) => {
                      const tone = statusTone(row.status);
                      return (
                        <tr
                          key={row.userId}
                          className="border-t"
                          style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                        >
                          <td className="px-3 py-2.5">
                            <span className="flex min-w-0 items-center gap-2.5">
                              <DemoUserAvatar userId={row.userId} />
                              <span className="min-w-0">
                                <span className="block truncate luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
                                  {row.name}
                                </span>
                                <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                                  {row.userId}
                                </span>
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1.5 luxia-type-caption" style={{ color: tone.color }}>
                              <span className="size-1.5 shrink-0 rounded-full" style={{ background: tone.color }} aria-hidden />
                              {tone.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                            {formatLastSeen(row.lastSeen)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div
                className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2"
                style={{ borderColor: "var(--luxia-settings-row-divider)" }}
              >
                <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                  {filteredSessions.length === 0
                    ? "0 rows"
                    : `${safePage * pageSize + 1}–${Math.min(filteredSessions.length, safePage * pageSize + pageSize)} of ${filteredSessions.length}`}
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      patchSession({ pageSize: Number(value), page: 0 });
                    }}
                  >
                    <SelectTrigger size="sm" aria-label="Rows per page" className="h-8 min-h-8 w-[5.5rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={SETTINGS_FLOATING_Z_CLASS}>
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="compact"
                    disabled={safePage <= 0}
                    onClick={() => patchSession({ page: Math.max(0, safePage - 1) })}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="compact"
                    disabled={safePage >= pageCount - 1}
                    onClick={() => patchSession({ page: Math.min(pageCount - 1, safePage + 1) })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="avatar" className="m-0 space-y-3 outline-none">
          <section className="space-y-1.5">
            <h3 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
              Live Active Sessions
            </h3>
            <div className="luxia-settings-table-surface min-w-0 overflow-x-auto">
              <table className="w-full min-w-0 table-fixed border-collapse text-left">
                <colgroup>
                  <col />
                  <col />
                  <col className="w-[6.25rem]" />
                  <col />
                  <col />
                  <col />
                  <col className="w-[5rem]" />
                  <col className="w-[5.75rem]" />
                </colgroup>
                <thead>
                  <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                    <th className="px-3 py-2 font-normal">Vidget</th>
                    <th className="px-3 py-2 font-normal">Project</th>
                    <th className="px-3 py-2 font-normal">Source</th>
                    <th className="px-3 py-2 font-normal">Knowledge scope</th>
                    <th className="px-3 py-2 font-normal">Avatar</th>
                    <th className="px-3 py-2 font-normal">Channel</th>
                    <th className="px-3 py-2 font-normal">Status</th>
                    <th className="px-3 py-2 font-normal">
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.liveAvatarSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <TableEmpty message="No avatar usage data found" />
                      </td>
                    </tr>
                  ) : (
                    snapshot.liveAvatarSessions.map((row) => {
                      const expanded = expandedSessionId === row.vidgetId;
                      const status = row.status ? statusTone(row.status) : null;
                      const scopeLabel = displayValue(row.knowledgeScopeLabel);
                      const showScopeTooltip = row.knowledgeScopeNames.length > 1;
                      return (
                        <Fragment key={row.vidgetId}>
                          <tr
                            className="border-t"
                            style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                          >
                            <StackedCell primary={displayValue(row.vidgetName)} />
                            <StackedCell primary={displayValue(row.projectName)} />
                            <TruncateCell value={sourceTypeLabel(row.sourceType)} nowrap />
                            <td className="min-w-0 px-3 py-2.5 align-top">
                              {showScopeTooltip ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="block min-w-0 max-w-full truncate text-left luxia-type-caption outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                                      style={{ color: "var(--luxia-text-secondary)" }}
                                    >
                                      {scopeLabel}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className={`${SETTINGS_FLOATING_Z_CLASS} max-w-[16rem]`}>
                                    <ul className="space-y-1">
                                      {row.knowledgeScopeNames.map((name) => (
                                        <li key={name}>{name}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span
                                  className="block min-w-0 truncate luxia-type-caption"
                                  style={{ color: "var(--luxia-text-secondary)" }}
                                  title={scopeLabel === "—" ? undefined : scopeLabel}
                                >
                                  {scopeLabel}
                                </span>
                              )}
                            </td>
                            <StackedCell
                              primary={avatarSessionPrimary(row)}
                              secondary={avatarSessionSecondary(row)}
                            />
                            <TruncateCell value={displayValue(row.channelLabel)} title={row.channelLabel || undefined} />
                            <td className="whitespace-nowrap px-2 py-2.5 align-top luxia-type-caption" style={{ color: status?.color ?? "var(--luxia-text-muted)" }}>
                              {status?.label ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <button
                                type="button"
                                className="inline-flex max-w-full items-center gap-1 luxia-type-caption outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                                style={{ color: "var(--luxia-text-secondary)" }}
                                aria-expanded={expanded}
                                aria-label={expanded ? "Hide details" : "View details"}
                                onClick={() =>
                                  setExpandedSessionId((current) => (current === row.vidgetId ? null : row.vidgetId))
                                }
                              >
                                <ChevronDown
                                  size={14}
                                  strokeWidth={1.75}
                                  className={`shrink-0 ${expanded ? "rotate-180" : ""}`}
                                  aria-hidden
                                />
                                <span className="min-w-0 truncate">{expanded ? "Hide" : "Details"}</span>
                              </button>
                            </td>
                          </tr>
                          {expanded ? (
                            <tr style={{ background: "var(--luxia-settings-section-bg)" }}>
                              <td colSpan={8} className="border-t px-0 py-0" style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
                                <LiveAvatarSessionDetails row={row} />
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
              Avatar Session Time
            </h3>
            <div className="grid min-w-0 grid-cols-2 gap-2.5 @min-[720px]:grid-cols-4">
              <CompactMetricTile label="Last Hour" value={formatMinutes(snapshot.avatarMinutes.lastHour)} />
              <CompactMetricTile label="Today" value={formatMinutes(snapshot.avatarMinutes.today)} />
              <CompactMetricTile label="This Week" value={formatMinutes(snapshot.avatarMinutes.thisWeek)} />
              <CompactMetricTile label="This Month" value={formatMinutes(snapshot.avatarMinutes.thisMonth)} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h3 className="min-w-0 luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                Avatar Minutes Over Time
              </h3>
              <DateRangeControls
                idPrefix="analytics-avatar"
                preset={avatarPreset}
                customStart={avatarStart}
                customEnd={avatarEnd}
                onPreset={handleAvatarPreset}
                onCustomStart={handleAvatarStart}
                onCustomEnd={handleAvatarEnd}
              />
            </div>
            {!avatarActive ? (
              <ChartEmpty message="No data available for this period." />
            ) : (
              <div className="luxia-settings-table-surface px-3 py-3">
                <ChartContainer config={MINUTES_CHART_CONFIG} className="aspect-auto h-52 w-full">
                  <AreaChart data={avatarPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--luxia-border-subtle)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="var(--color-minutes)"
                      fill="var(--color-minutes)"
                      fillOpacity={0.16}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
              Vidget Avatar Breakdown
            </h3>
            <div className="luxia-settings-table-surface overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <thead>
                  <tr className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                    <th className="px-3 py-2 font-normal">Vidget</th>
                    <th className="px-3 py-2 font-normal">Avatar Name</th>
                    <th className="px-3 py-2 font-normal">Avatar Type</th>
                    <th className="px-3 py-2 font-normal">Total Minutes</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.vidgetBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <TableEmpty message="No avatar usage data found" />
                      </td>
                    </tr>
                  ) : (
                    snapshot.vidgetBreakdown.map((row) => (
                      <tr
                        key={row.vidgetId}
                        className="border-t"
                        style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                      >
                        <td className="px-3 py-2.5">
                          <span className="block truncate luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
                            {row.vidgetName}
                          </span>
                          <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                            {row.vidgetId}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
                          {row.avatarName}
                        </td>
                        <td className="px-3 py-2.5 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                          {row.avatarType}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
                          {row.totalMinutes.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </>
  );
}
