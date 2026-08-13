import { Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { DemoUserAvatar } from "@/app/features/permissions/demoUserAvatar";
import { formatOrganizationRoleLabel } from "@/app/features/permissions/currentUser";
import type { OrganizationUser } from "@/app/features/permissions/types";
import {
  LuxiaArrowRightIcon,
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaDatasourceIcon,
  LuxiaProjectsIcon,
  LuxiaUserPermissionsIcon,
  LuxiaVirtualAssistantIcon,
} from "@/assets/icons";
import {
  ORGANIZATION_SETTINGS_GUIDANCE,
  type AccountSettingsSectionId,
  type OrganizationUsageMetrics,
} from "./ia";
import {
  CompactInfoRow,
  CompactManagerCard,
  CompactMetricTile,
  SettingsDialogSectionHeader,
  SettingsDialogSurface,
} from "./SettingsDialogBlocks";

interface OrganizationMemberSummary {
  total: number;
  active: number;
  invited: number;
}

export interface AccountSettingsContentProps {
  user: OrganizationUser;
  activeSection: AccountSettingsSectionId;
  privateDataSourceCount: number;
  memberSummary: OrganizationMemberSummary;
  accessLevelCount: number;
  organizationalDataSourceCount: number;
  usageMetrics: OrganizationUsageMetrics;
  onOpenDataSources: () => void;
  onOpenUsers: () => void;
  onOpenAccessLevels: () => void;
}

export function AccountSettingsContent({
  user,
  activeSection,
  privateDataSourceCount,
  memberSummary,
  accessLevelCount,
  organizationalDataSourceCount,
  usageMetrics,
  onOpenDataSources,
  onOpenUsers,
  onOpenAccessLevels,
}: AccountSettingsContentProps) {
  const orgRoleLabel = formatOrganizationRoleLabel(user.orgRole);

  switch (activeSection) {
    case "profile":
      return (
        <>
          <SettingsDialogSectionHeader
            title="Profile"
            description="Your personal Luxia information."
          />
          <SettingsDialogSurface className="px-4 py-4">
            <div className="flex min-w-0 items-center gap-4">
              <DemoUserAvatar userId={user.id} size="lg" aria-hidden={false} />
              <div className="min-w-0 flex-1">
                <p
                  className="luxia-type-body-default-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  {user.name}
                </p>
                <p
                  className="luxia-type-body-dense"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  {user.email}
                </p>
              </div>
            </div>
            <div
              className="mt-4 flex min-w-0 items-baseline justify-between gap-6 border-t pt-4"
              style={{ borderColor: "var(--luxia-border-default)" }}
            >
              <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
                Organization role
              </p>
              <p
                className="luxia-type-body-dense-strong"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                {orgRoleLabel}
              </p>
            </div>
          </SettingsDialogSurface>
        </>
      );

    case "my-data":
      return (
        <>
          <SettingsDialogSectionHeader
            title="My Data"
            description="Private Data Sources owned by you."
          />
          <SettingsDialogSurface className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--luxia-radius-8)] text-[var(--luxia-text-muted)]"
                style={{ background: "var(--luxia-surface)" }}
                aria-hidden
              >
                <LuxiaDatasourceIcon size={16} color="currentColor" />
              </span>
              <p
                className="min-w-0 flex-1 luxia-type-body-dense-strong"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Private Data Sources
              </p>
              <p
                className="shrink-0 luxia-type-title-card tabular-nums leading-none"
                style={{ color: "var(--luxia-purple-70)" }}
              >
                {privateDataSourceCount}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="compact"
              className="shrink-0 self-start sm:self-center"
              onClick={onOpenDataSources}
            >
              Open Data Sources
              <LuxiaArrowRightIcon size={14} aria-hidden />
            </Button>
          </SettingsDialogSurface>
        </>
      );

    case "general":
      return (
        <>
          <SettingsDialogSectionHeader
            title="General"
            description="Organization information and your access."
          />
          <SettingsDialogSurface className="px-4">
            <dl className="divide-y divide-[var(--luxia-border-default)]">
              <CompactInfoRow
                label="Organization"
                value={ORGANIZATION_SETTINGS_GUIDANCE.organizationDisplayName}
              />
              <CompactInfoRow label="Your organization role" value={orgRoleLabel} />
            </dl>
          </SettingsDialogSurface>
        </>
      );

    case "members":
      return (
        <>
          <SettingsDialogSectionHeader
            title="Members"
            description="Organization members and invitations."
          />
          <SettingsDialogSurface className="overflow-hidden">
            <div className="grid min-w-0 grid-cols-3 divide-x divide-[var(--luxia-border-default)]">
              <MemberMetric label="Total members" value={memberSummary.total} />
              <MemberMetric label="Active" value={memberSummary.active} />
              <MemberMetric label="Invited" value={memberSummary.invited} />
            </div>
            <div
              className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: "var(--luxia-border-default)" }}
            >
              <div className="min-w-0">
                <p
                  className="luxia-type-body-dense-strong mb-0.5"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  Organization users
                </p>
                <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                  View members, roles, and invitations.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="compact"
                className="shrink-0 self-start sm:self-center"
                onClick={onOpenUsers}
              >
                Open Users
                <LuxiaArrowRightIcon size={14} aria-hidden />
              </Button>
            </div>
          </SettingsDialogSurface>
        </>
      );

    case "access-data":
      return (
        <>
          <SettingsDialogSectionHeader
            title="Access & Data"
            description="Organization Data Sources and access rules."
          />
          <div className="grid min-w-0 items-stretch gap-4 @min-[700px]:grid-cols-2">
            <CompactManagerCard
              title="Access Levels"
              metric={accessLevelCount}
              description="Control how organization Data Sources can be viewed, used, or managed."
              actionLabel="Open Access Levels"
              onAction={onOpenAccessLevels}
              icon={<LuxiaUserPermissionsIcon size={16} color="currentColor" />}
            />
            <CompactManagerCard
              title="Data Sources"
              metric={organizationalDataSourceCount}
              description="Organization-managed and accessible data used across Luxia."
              actionLabel="Open Data Sources"
              onAction={onOpenDataSources}
              icon={<LuxiaDatasourceIcon size={16} color="currentColor" />}
            />
          </div>
        </>
      );

    case "usage":
      return (
        <>
          <SettingsDialogSectionHeader
            title="Usage"
            description="Current organization activity and resource counts."
          />
          <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            <CompactMetricTile label="Projects" value={usageMetrics.projects} icon={<LuxiaProjectsIcon size={15} color="currentColor" />} />
            <CompactMetricTile label="Users" value={usageMetrics.users} icon={<Users size={15} />} />
            <CompactMetricTile label="Data Sources" value={usageMetrics.dataSources} icon={<LuxiaDatasourceIcon size={15} color="currentColor" />} />
            <CompactMetricTile label="Access Levels" value={usageMetrics.accessLevels} icon={<LuxiaUserPermissionsIcon size={15} color="currentColor" />} />
            <CompactMetricTile label="Constellations" value={usageMetrics.constellations} icon={<LuxiaConstellationIcon size={15} color="currentColor" />} />
            <CompactMetricTile label="Chats" value={usageMetrics.chats} icon={<LuxiaChatIcon size={15} color="currentColor" />} />
            <CompactMetricTile label="Dashboard outputs" value={usageMetrics.dashboardOutputs} icon={<LuxiaDashboardIcon size={15} color="currentColor" />} />
            <CompactMetricTile label="Vidgets" value={usageMetrics.vidgets} icon={<LuxiaVirtualAssistantIcon size={15} color="currentColor" />} />
          </div>
        </>
      );

    default:
      return null;
  }
}

function MemberMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0 px-4 py-4 sm:px-5">
      <p className="mb-1.5 luxia-type-label-small" style={{ color: "var(--luxia-text-secondary)" }}>
        {label}
      </p>
      <p
        className="luxia-type-title-card tabular-nums leading-none"
        style={{ color: "var(--luxia-purple-70)" }}
      >
        {value}
      </p>
    </div>
  );
}
