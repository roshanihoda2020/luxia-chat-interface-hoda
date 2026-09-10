import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { DemoUserAvatar } from "@/app/features/permissions/demoUserAvatar";
import { formatOrganizationRoleLabel } from "@/app/features/permissions/currentUser";
import type {
  OrganizationUser,
  PrototypeMfaMethod,
} from "@/app/features/permissions/types";
import type { VidgetRecord } from "@/app/features/vidgets/types";
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
import { OrganizationAnalyticsSection } from "./analytics";
import type { AnalyticsSessionState } from "./analytics/sessionState";
import {
  CompactInfoRow,
  CompactManagerCard,
  CompactMetricTile,
  SettingsDialogSectionHeader,
  SettingsDialogSurface,
} from "./SettingsDialogBlocks";
import {
  formatPrototypeMfaMethodLabel,
  ProfileSecurityMfaDialogs,
  type ProfileMfaDialogView,
} from "./ProfileSecurityMfaDialogs";

interface OrganizationMemberSummary {
  total: number;
  active: number;
  invited: number;
}

export interface ProfilePersonalDraft {
  name: string;
  jobTitle: string;
  mobile: string;
}

export interface ProfileMfaState {
  mfaEnabled: boolean;
  mfaMethod: PrototypeMfaMethod | null;
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
  onUpdateProfile?: (userId: string, draft: ProfilePersonalDraft) => void;
  onUpdateProfileMfa?: (userId: string, next: ProfileMfaState) => void;
  analyticsSession: AnalyticsSessionState;
  onAnalyticsSessionChange: (next: AnalyticsSessionState) => void;
  directoryUsers?: OrganizationUser[];
  vidgets?: VidgetRecord[];
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
  onUpdateProfile,
  onUpdateProfileMfa,
  analyticsSession,
  onAnalyticsSessionChange,
  directoryUsers,
  vidgets,
}: AccountSettingsContentProps) {
  const orgRoleLabel = formatOrganizationRoleLabel(user.orgRole);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState(user.name);
  const [draftJobTitle, setDraftJobTitle] = useState(user.jobTitle);
  const [draftMobile, setDraftMobile] = useState(user.mobile);
  const [mfaDialogView, setMfaDialogView] = useState<ProfileMfaDialogView>("closed");
  const trimmedDraftName = draftName.trim();
  const canEditProfile = typeof onUpdateProfile === "function";
  const canManageMfa = typeof onUpdateProfileMfa === "function";
  const mfaEnabled = Boolean(user.mfaEnabled && user.mfaMethod);
  const mfaMethod = mfaEnabled ? user.mfaMethod : null;

  useEffect(() => {
    setDraftName(user.name);
    setDraftJobTitle(user.jobTitle);
    setDraftMobile(user.mobile);
    setIsEditingProfile(false);
    setMfaDialogView("closed");
  }, [user.id, user.name, user.jobTitle, user.mobile]);

  const profileDirty =
    trimmedDraftName !== user.name ||
    draftJobTitle.trim() !== user.jobTitle ||
    draftMobile.trim() !== user.mobile;

  function handleCancelProfileEdit() {
    setDraftName(user.name);
    setDraftJobTitle(user.jobTitle);
    setDraftMobile(user.mobile);
    setIsEditingProfile(false);
  }

  function handleSaveProfile() {
    if (!canEditProfile || trimmedDraftName.length === 0) {
      handleCancelProfileEdit();
      return;
    }
    if (!profileDirty) {
      setIsEditingProfile(false);
      return;
    }
    onUpdateProfile(user.id, {
      name: trimmedDraftName,
      jobTitle: draftJobTitle.trim(),
      mobile: draftMobile.trim(),
    });
    setIsEditingProfile(false);
  }

  function handleConfirmEnableMfa(method: PrototypeMfaMethod) {
    if (!canManageMfa) return;
    onUpdateProfileMfa(user.id, { mfaEnabled: true, mfaMethod: method });
    setMfaDialogView("closed");
  }

  function handleConfirmDisableMfa() {
    if (!canManageMfa) return;
    onUpdateProfileMfa(user.id, { mfaEnabled: false, mfaMethod: null });
    setMfaDialogView("closed");
  }

  switch (activeSection) {
    case "profile":
      return (
        <>
          <SettingsDialogSectionHeader
            title="Profile"
            description="Your personal Luxia information."
          />
          <div className="flex min-w-0 flex-col gap-4">
            <SettingsDialogSurface className="px-4 py-4">
              <div className="flex min-w-0 items-start justify-between gap-4">
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
                {canEditProfile && !isEditingProfile ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    className="shrink-0"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Edit profile
                  </Button>
                ) : null}
              </div>
            </SettingsDialogSurface>

            <SettingsDialogSurface className="px-4 py-4">
              <ProfileSectionIntro title="Personal information" />
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid gap-4 @min-[720px]:grid-cols-2">
                    <ProfileEditableField
                      label="Full name"
                      htmlFor="settings-profile-full-name"
                      value={draftName}
                      onChange={setDraftName}
                    />
                    <ProfileReadOnlyField label="Email" value={user.email} />
                    <ProfileEditableField
                      label="Job title"
                      htmlFor="settings-profile-job-title"
                      value={draftJobTitle}
                      onChange={setDraftJobTitle}
                    />
                    <ProfileEditableField
                      label="Mobile number"
                      htmlFor="settings-profile-mobile"
                      value={draftMobile}
                      onChange={setDraftMobile}
                    />
                  </div>
                  <div
                    className="flex flex-wrap justify-end gap-2 border-t pt-4"
                    style={{ borderColor: "var(--luxia-border-default)" }}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="compact"
                      onClick={handleCancelProfileEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="compact"
                      onClick={handleSaveProfile}
                      disabled={trimmedDraftName.length === 0 || !profileDirty}
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              ) : (
                <dl className="grid gap-4 @min-[720px]:grid-cols-2">
                  <ProfileReadOnlyField label="Full name" value={user.name} />
                  <ProfileReadOnlyField label="Email" value={user.email} />
                  <ProfileReadOnlyField
                    label="Job title"
                    value={user.jobTitle || "—"}
                  />
                  <ProfileReadOnlyField
                    label="Mobile number"
                    value={user.mobile || "—"}
                  />
                </dl>
              )}
            </SettingsDialogSurface>

            <SettingsDialogSurface className="px-4 py-4">
              <ProfileSectionIntro title="Organization" />
              <dl className="grid gap-4 @min-[720px]:grid-cols-2">
                <ProfileReadOnlyField
                  label="Organization"
                  value={ORGANIZATION_SETTINGS_GUIDANCE.organizationDisplayName}
                />
                <ProfileReadOnlyField label="Organization role" value={orgRoleLabel} />
              </dl>
            </SettingsDialogSurface>

            <SettingsDialogSurface className="px-4 py-4">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3
                    className="luxia-type-body-dense-strong mb-1"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    Security
                  </h3>
                  <p
                    className="luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    Multi-factor authentication
                  </p>
                  <p
                    className="mt-1 luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    Add an extra verification step when signing in.
                  </p>
                  <dl className="mt-4 grid gap-4 @min-[520px]:grid-cols-2">
                    <ProfileReadOnlyField
                      label="Status"
                      value={mfaEnabled ? "On" : "Off"}
                    />
                    {mfaEnabled && mfaMethod ? (
                      <ProfileReadOnlyField
                        label="Verification method"
                        value={formatPrototypeMfaMethodLabel(mfaMethod)}
                      />
                    ) : null}
                  </dl>
                </div>
                {canManageMfa ? (
                  mfaEnabled ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      className="shrink-0 self-start"
                      onClick={() => setMfaDialogView("manage")}
                    >
                      Manage MFA
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      className="shrink-0 self-start"
                      onClick={() => setMfaDialogView("choose-method")}
                    >
                      Enable MFA
                    </Button>
                  )
                ) : null}
              </div>
            </SettingsDialogSurface>
          </div>

          <ProfileSecurityMfaDialogs
            view={mfaDialogView}
            email={user.email}
            currentMethod={mfaMethod}
            onClose={() => setMfaDialogView("closed")}
            onSelectMethod={(method) =>
              setMfaDialogView(method === "email-otp" ? "email-otp" : "authenticator")
            }
            onConfirmEnable={handleConfirmEnableMfa}
            onRequestDisable={() => setMfaDialogView("disable-confirm")}
            onConfirmDisable={handleConfirmDisableMfa}
            onCancelDisable={() => setMfaDialogView("manage")}
            onSwitchMethod={() => setMfaDialogView("choose-method")}
          />
        </>
      );

    case "my-data":
      return (
        <>
          <SettingsDialogSectionHeader
            compact
            title="My Data"
            description="Private Data Sources owned by you."
          />
          <SettingsDialogSurface className="flex max-w-[32rem] flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
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
            compact
            title="General"
            description="Organization information and your access."
          />
          <SettingsDialogSurface className="max-w-[32rem] px-4">
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
            compact
            title="Members"
            description="Organization members and invitations."
          />
          <SettingsDialogSurface className="max-w-[40rem] overflow-hidden">
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
            compact
            title="Access & Data"
            description="Organization Data Sources and access rules."
          />
          <div className="grid min-w-0 max-w-[40rem] items-stretch gap-4 @min-[700px]:grid-cols-2">
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

    case "analytics":
      return (
        <OrganizationAnalyticsSection
          session={analyticsSession}
          onSessionChange={onAnalyticsSessionChange}
          directoryUsers={directoryUsers}
          vidgets={vidgets}
        />
      );

    case "usage":
      return (
        <>
          <SettingsDialogSectionHeader
            compact
            title="Usage"
            description="Current organization activity and resource counts."
          />
          <div className="grid min-w-0 max-w-[40rem] grid-cols-2 gap-3 @min-[560px]:grid-cols-3">
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

function ProfileSectionIntro({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 min-w-0">
      <h3
        className="luxia-type-body-dense-strong mb-1"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {title}
      </h3>
      {description ? (
        <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ProfileReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt
        className="mb-1 luxia-type-label-small"
        style={{ color: "var(--luxia-text-muted)" }}
      >
        {label}
      </dt>
      <dd
        className="break-words luxia-type-body-dense-strong"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {value}
      </dd>
    </div>
  );
}

function ProfileEditableField({
  label,
  htmlFor,
  value,
  onChange,
}: {
  label: string;
  htmlFor: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0" htmlFor={htmlFor}>
      <span
        className="mb-1 block luxia-type-label-small"
        style={{ color: "var(--luxia-text-muted)" }}
      >
        {label}
      </span>
      <Input id={htmlFor} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
