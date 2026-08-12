import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LuxiaBreadcrumb,
  buildProjectOverviewBreadcrumbItems,
  type LuxiaBreadcrumbHandlers,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { FilterField } from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import {
  buildProjectDataReadiness,
  CURRENT_USER_ID,
  formatAccessLevelNames,
  getActiveProjectOwners,
  getOrganizationUserById,
  INVITABLE_PROJECT_ROLES,
  PROJECT_ROLE_DEFINITIONS,
  resolveUserDataSourceAccess,
} from "./data";
import {
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
  LUXIA_SETTINGS_ROW_DIVIDER,
} from "@/app/features/shared/luxiaSettingsUx";
import { PROJECT_MEMBERS_GUIDANCE } from "./ia";
import {
  canChangeProjectRole,
  canInviteProjectMembers,
  canRemoveProjectMember,
  canTransferProjectOwnership,
  PROJECT_ACTION_DENIED_MESSAGE,
} from "./accessGuards";
import { DemoUserAvatar, DemoUserIdentityRow } from "./demoUserAvatar";
import type {
  AccessLevelRecord,
  DataSourceCatalogItem,
  OrganizationUser,
  ProjectMembership,
  ProjectRole,
} from "./types";

const PARENT_SURFACE_CLASS = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;
const ROW_DIVIDER = LUXIA_SETTINGS_ROW_DIVIDER;

export interface ProjectMembersPageProps {
  project: { id: string; name: string };
  memberships: ProjectMembership[];
  accessLevels: AccessLevelRecord[];
  organizationUsers: OrganizationUser[];
  dataSources: DataSourceCatalogItem[];
  projectRequiredSourceIds: string[];
  onSaveMemberships: (memberships: ProjectMembership[]) => void;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenAccessLevels?: () => void;
  onOpenDataSourceSettings?: (dataSourceId: string) => void;
}

export function ProjectMembersPage({
  project,
  memberships: initialMemberships,
  accessLevels,
  organizationUsers,
  dataSources,
  projectRequiredSourceIds,
  onSaveMemberships,
  onNavigateHome,
  onOpenProject,
  onOpenAccessLevels,
  onOpenDataSourceSettings,
}: ProjectMembersPageProps) {
  const [memberships, setMemberships] = useState(initialMemberships);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [accessSummaryUserId, setAccessSummaryUserId] = useState<string | null>(
    null,
  );
  const [removeMembershipId, setRemoveMembershipId] = useState<string | null>(
    null,
  );
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTargetUserId, setTransferTargetUserId] = useState("");
  const [transferNewRole, setTransferNewRole] =
    useState<ProjectRole>("Project Manager");

  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] =
    useState<(typeof INVITABLE_PROJECT_ROLES)[number]>("Member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [roleChangeMembershipId, setRoleChangeMembershipId] = useState<
    string | null
  >(null);
  const [roleChangeValue, setRoleChangeValue] =
    useState<(typeof INVITABLE_PROJECT_ROLES)[number]>("Member");

  useEffect(() => {
    setMemberships(initialMemberships);
  }, [initialMemberships]);

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onProject: onOpenProject,
  };

  const currentUserMembership = memberships.find(
    (m) => m.userId === CURRENT_USER_ID && m.status === "active",
  );
  const isCurrentUserOwner =
    currentUserMembership?.projectRole === "Project Owner";

  const ownerMembership = memberships.find(
    (m) => m.projectRole === "Project Owner" && m.status === "active",
  );

  const activeOwners = useMemo(
    () => getActiveProjectOwners(project.id, memberships),
    [memberships, project.id],
  );
  const hasDuplicateOwners = activeOwners.length > 1;
  const hasMissingOwner = activeOwners.length === 0 && memberships.some((m) => m.status === "active");

  const requiredSources = useMemo(
    () =>
      projectRequiredSourceIds
        .map((id) => dataSources.find((source) => source.id === id))
        .filter((source): source is DataSourceCatalogItem => Boolean(source)),
    [projectRequiredSourceIds, dataSources],
  );

  function readinessFor(membership: ProjectMembership) {
    return buildProjectDataReadiness({
      userId: membership.userId,
      projectRole: membership.projectRole,
      membershipStatus: membership.status,
      requiredSourceIds: projectRequiredSourceIds,
      accessLevels,
      dataSources,
    });
  }

  const sortedMemberships = useMemo(() => {
    return [...memberships].sort((a, b) => {
      if (a.projectRole === "Project Owner") return -1;
      if (b.projectRole === "Project Owner") return 1;
      if (a.status !== b.status) {
        return a.status === "active" ? -1 : 1;
      }
      return a.joinedOrInvitedAt.localeCompare(b.joinedOrInvitedAt);
    });
  }, [memberships]);

  const inviteCandidates = useMemo(() => {
    const memberIds = new Set(memberships.map((m) => m.userId));
    return organizationUsers.filter((user) => !memberIds.has(user.id));
  }, [memberships, organizationUsers]);

  const transferCandidates = useMemo(() => {
    return memberships.filter(
      (m) =>
        m.status === "active"
        && m.projectRole !== "Project Owner"
        && m.userId !== ownerMembership?.userId,
    );
  }, [memberships, ownerMembership?.userId]);

  function persist(next: ProjectMembership[]) {
    setMemberships(next);
    onSaveMemberships(next);
  }

  function updateMembership(
    membershipId: string,
    patch: Partial<ProjectMembership>,
  ) {
    persist(
      memberships.map((m) =>
        m.id === membershipId ? { ...m, ...patch } : m,
      ),
    );
  }

  function handleInvite() {
    if (!canInviteProjectMembers(currentUserMembership?.projectRole)) {
      toast.error(PROJECT_ACTION_DENIED_MESSAGE);
      return;
    }
    if (!inviteUserId) return;
    const existing = memberships.find(
      (membership) =>
        membership.projectId === project.id && membership.userId === inviteUserId,
    );
    if (existing) {
      persist(
        memberships.map((membership) =>
          membership.id === existing.id
            ? {
              ...membership,
              projectRole: inviteRole,
              status: "active",
              joinedOrInvitedAt: new Date().toISOString(),
            }
            : membership,
        ),
      );
    } else {
      const next: ProjectMembership = {
        id: `pm-${project.id}-${Date.now()}`,
        projectId: project.id,
        userId: inviteUserId,
        projectRole: inviteRole,
        status: "active",
        joinedOrInvitedAt: new Date().toISOString(),
      };
      persist([...memberships, next]);
    }
    setInviteOpen(false);
    setInviteUserId("");
    setInviteRole("Member");
    setInviteMessage("");
  }

  function confirmRemove() {
    if (!removeMembershipId) return;
    const target = memberships.find((m) => m.id === removeMembershipId);
    if (
      !target
      || !canRemoveProjectMember(currentUserMembership?.projectRole, target)
    ) {
      toast.error(PROJECT_ACTION_DENIED_MESSAGE);
      setRemoveMembershipId(null);
      return;
    }
    persist(memberships.filter((m) => m.id !== removeMembershipId));
    setRemoveMembershipId(null);
  }

  function confirmTransfer() {
    if (!canTransferProjectOwnership(currentUserMembership?.projectRole)) {
      toast.error(PROJECT_ACTION_DENIED_MESSAGE);
      return;
    }
    if (!ownerMembership || !transferTargetUserId) return;
    persist(
      memberships.map((m) => {
        if (m.id === ownerMembership.id) {
          return { ...m, projectRole: transferNewRole };
        }
        if (m.userId === transferTargetUserId) {
          return { ...m, projectRole: "Project Owner" };
        }
        return m;
      }),
    );
    setTransferOpen(false);
    setTransferTargetUserId("");
    setTransferNewRole("Project Manager");
  }

  function permissionSourceLabel(
    resolved: ReturnType<typeof resolveUserDataSourceAccess>,
  ): string {
    if (resolved.viaOwner) return "Private source owner";
    const names = formatAccessLevelNames(resolved.accessLevelNames);
    if (resolved.permission && names) {
      return `${resolved.permission} via ${names}`;
    }
    if (resolved.permission) return resolved.permission;
    return "No Data Source permission";
  }

  function buildAccessSummaryDetails(userId: string) {
    const user = getOrganizationUserById(userId);
    const membership = memberships.find((m) => m.userId === userId);
    const readiness = membership
      ? readinessFor(membership)
      : buildProjectDataReadiness({
          userId,
          projectRole: "Member",
          membershipStatus: "active",
          requiredSourceIds: projectRequiredSourceIds,
          accessLevels,
          dataSources,
        });

    const sourceRows = requiredSources.map((source) => {
      const resolved = resolveUserDataSourceAccess(
        userId,
        source.id,
        accessLevels,
        dataSources,
      );
      return {
        source,
        resolved,
        label: permissionSourceLabel(resolved),
      };
    });

    return {
      user,
      membership,
      readiness,
      sourceRows,
    };
  }

  const invitePreview = inviteUserId
    ? buildProjectDataReadiness({
        userId: inviteUserId,
        projectRole: inviteRole,
        membershipStatus: "active",
        requiredSourceIds: projectRequiredSourceIds,
        accessLevels,
        dataSources,
      })
    : null;

  const inviteReadinessNote = inviteUserId
    ? `After add: ${invitePreview?.label ?? "—"}. Member is active in this Project immediately.`
    : "Select a user to preview connected Data Source access for this Project.";

  const roleChangeMembership = roleChangeMembershipId
    ? memberships.find((m) => m.id === roleChangeMembershipId)
    : undefined;

  function openRoleChange(membership: ProjectMembership) {
    if (
      membership.projectRole === "Project Owner"
      || !INVITABLE_PROJECT_ROLES.includes(
        membership.projectRole as (typeof INVITABLE_PROJECT_ROLES)[number],
      )
    ) {
      setRoleChangeValue("Member");
    } else {
      setRoleChangeValue(
        membership.projectRole as (typeof INVITABLE_PROJECT_ROLES)[number],
      );
    }
    setRoleChangeMembershipId(membership.id);
  }

  function confirmRoleChange() {
    if (!roleChangeMembershipId || !roleChangeMembership) return;
    if (
      !canChangeProjectRole(
        currentUserMembership?.projectRole,
        roleChangeValue,
      )
    ) {
      toast.error(PROJECT_ACTION_DENIED_MESSAGE);
      setRoleChangeMembershipId(null);
      return;
    }
    updateMembership(roleChangeMembershipId, { projectRole: roleChangeValue });
    setRoleChangeMembershipId(null);
  }

  const canInvite =
    currentUserMembership?.projectRole === "Project Owner"
    || currentUserMembership?.projectRole === "Project Manager";

  return (
    <LuxiaPageFrame variant={PROJECT_MEMBERS_GUIDANCE.pageVariant}>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="MEMBERS & ROLES"
        title="Members & Roles"
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={[
              ...buildProjectOverviewBreadcrumbItems({
                projectId: project.id,
                projectName: project.name,
              }),
              {
                id: "members",
                label: "Members & Roles",
                destination: { kind: "current" },
              },
            ]}
            handlers={breadcrumbHandlers}
          />
        }
        guide={PROJECT_MEMBERS_GUIDANCE.pageDescription}
        secondaryAction={
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.tertiary}
            onClick={() => setRolesOpen(true)}
          >
            Compare Project roles
          </Button>
        }
        primaryAction={
          canInvite ? (
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.primary}
            onClick={() => setInviteOpen(true)}
          >
            Invite Member
          </Button>
          ) : null
        }
      />

      <LuxiaPageBody>
        {hasDuplicateOwners ? (
          <div
            className="mb-4 luxia-settings-summary-surface"
            role="alert"
          >
            <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-error)" }}>
              Invalid membership seed
            </p>
            <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              This Project has {activeOwners.length} active Project Owners. Exactly one is required.
              Transfer ownership or fix the seed before continuing.
            </p>
          </div>
        ) : null}
        {hasMissingOwner ? (
          <div
            className="mb-4 luxia-settings-summary-surface"
            role="alert"
          >
            <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-error)" }}>
              Missing Project Owner
            </p>
            <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              This Project has active members but no Project Owner.
            </p>
          </div>
        ) : null}

        <div className={PARENT_SURFACE_CLASS}>
          {sortedMemberships.length === 0 ? (
            <p className="px-4 py-6 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
              This Project has no members yet.
            </p>
          ) : (
          <ul>
            {sortedMemberships.map((membership, index) => {
              const user = getOrganizationUserById(membership.userId);
              const isOwner = membership.projectRole === "Project Owner";
              const isPending = membership.status === "pending";
              const readiness = readinessFor(membership);

              return (
                <li
                  key={membership.id}
                  className="px-4 py-4"
                  style={index > 0 ? ROW_DIVIDER : undefined}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <DemoUserAvatar userId={membership.userId} aria-hidden={false} />
                    <div className="min-w-0 flex-1">
                      <p
                        className="luxia-type-body-dense-strong"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {user?.name ?? membership.userId}
                      </p>
                      <p
                        className="mt-1 luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {membership.projectRole}
                        <span
                          className="ms-2 luxia-type-caption"
                          style={{ color: "var(--luxia-text-muted)" }}
                        >
                          {membership.status === "pending"
                            ? "Pending invitation"
                            : "Active"}
                        </span>
                      </p>
                      <p
                        className="mt-2 luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        {user?.email ?? "—"}
                        {" · "}
                        Organization role: {user?.orgRole ?? "—"}
                      </p>
                      <p
                        className="mt-1 luxia-type-caption"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        Connected Data Source access: {readiness.label}
                      </p>
                    </div>

                    {isOwner ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="compact"
                          onClick={() =>
                            setAccessSummaryUserId(membership.userId)
                          }
                        >
                          Review Data Source access
                        </Button>
                        {isCurrentUserOwner && !hasDuplicateOwners ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="compact"
                            onClick={() => setTransferOpen(true)}
                          >
                            Transfer ownership
                          </Button>
                        ) : null}
                      </div>
                    ) : isPending ? (
                      canInvite ? (
                      <LuxiaEntityOptionsMenu
                        entityLabel={user?.name ?? membership.userId}
                        entityType="Member"
                        items={[
                          {
                            id: "resend",
                            label: "Resend invitation",
                            onSelect: () => {
                              /* prototype: simulated */
                            },
                          },
                          {
                            id: "change-role",
                            label: "Change intended role",
                            onSelect: () => openRoleChange(membership),
                          },
                          {
                            id: "cancel",
                            label: "Cancel invitation",
                            destructive: true,
                            separatorBefore: true,
                            onSelect: () =>
                              setRemoveMembershipId(membership.id),
                          },
                        ]}
                      />
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="compact"
                          onClick={() =>
                            setAccessSummaryUserId(membership.userId)
                          }
                        >
                          Review Data Source access
                        </Button>
                      )
                    ) : (
                      <LuxiaEntityOptionsMenu
                        entityLabel={user?.name ?? membership.userId}
                        entityType="Member"
                        items={[
                          ...(canInvite
                            ? [
                                {
                                  id: "change-role",
                                  label: "Change Project role",
                                  onSelect: () => openRoleChange(membership),
                                },
                              ]
                            : []),
                          {
                            id: "access-summary",
                            label: "Review Data Source access",
                            onSelect: () =>
                              setAccessSummaryUserId(membership.userId),
                          },
                          ...(canInvite
                            ? [
                                {
                                  id: "remove",
                                  label: "Remove from Project",
                                  destructive: true as const,
                                  separatorBefore: true,
                                  onSelect: () =>
                                    setRemoveMembershipId(membership.id),
                                },
                              ]
                            : []),
                        ]}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          )}
        </div>
      </LuxiaPageBody>

      <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
        <DialogContent className="max-h-[min(88vh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: "var(--luxia-purple-70)" }}>
              Compare roles
            </DialogTitle>
            <DialogDescription>
              Project roles control actions within this Project. Data Source
              access is managed separately through Access Levels and does not
              block basic Chat with existing Project Constellations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {PROJECT_ROLE_DEFINITIONS.map((def) => (
              <section key={def.role}>
                <h3
                  className="luxia-type-body-dense-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  {def.role}
                </h3>
                <p
                  className="mt-1 luxia-type-body-dense"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  {def.summary}
                </p>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: "var(--luxia-purple-70)" }}>
              Invite Member
            </DialogTitle>
            <DialogDescription>
              Invite an organization user to this Project. Ownership cannot be
              assigned via invite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FilterField label="User" htmlFor="invite-user">
              <Select value={inviteUserId} onValueChange={setInviteUserId}>
                <SelectTrigger id="invite-user" aria-label="User to invite">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {inviteCandidates.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      All organization users are already in this Project
                    </SelectItem>
                  ) : (
                    inviteCandidates.map((user) => (
                      <SelectItem key={user.id} value={user.id} textValue={user.name}>
                        <DemoUserIdentityRow
                          userId={user.id}
                          name={user.name}
                          secondary={user.email}
                        />
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Project role" htmlFor="invite-role">
              <Select
                value={inviteRole}
                onValueChange={(value) =>
                  setInviteRole(value as (typeof INVITABLE_PROJECT_ROLES)[number])
                }
              >
                <SelectTrigger id="invite-role" aria-label="Project role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITABLE_PROJECT_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Message (optional)" htmlFor="invite-message">
              <Textarea
                id="invite-message"
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
                placeholder="Add a note to the invitation"
                rows={3}
              />
            </FilterField>

            <p
              className="luxia-type-caption rounded-[8px] px-3 py-2"
              style={{
                color: "var(--luxia-text-secondary)",
                background: "var(--luxia-settings-section-bg)",
                border: "1px solid var(--luxia-settings-section-border)",
              }}
            >
              Data Source access: {inviteReadinessNote}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="compact"
              disabled={!inviteUserId}
              onClick={handleInvite}
            >
              Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(accessSummaryUserId)}
        onOpenChange={(open) => !open && setAccessSummaryUserId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: "var(--luxia-purple-70)" }}>
              Data Source access
            </DialogTitle>
            <DialogDescription>
              Project-required Data Sources for {project.name} (prototype preview).
            </DialogDescription>
          </DialogHeader>
          {accessSummaryUserId ? (() => {
            const details = buildAccessSummaryDetails(accessSummaryUserId);
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <DemoUserAvatar userId={accessSummaryUserId} aria-hidden={false} />
                  <p
                    className="luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {details.user?.name ?? accessSummaryUserId}
                  </p>
                </div>
                <dl className="space-y-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                  <div>
                    <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-muted)" }}>Organization role</dt>
                    <dd>{details.user?.orgRole ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-muted)" }}>Project role</dt>
                    <dd>{details.membership?.projectRole ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-muted)" }}>Membership</dt>
                    <dd>
                      {details.membership?.status === "pending"
                        ? "Pending invitation"
                        : "Active"}
                    </dd>
                  </div>
                  <div>
                    <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-muted)" }}>Data Source access</dt>
                    <dd>{details.readiness.label}</dd>
                  </div>
                </dl>

                {details.sourceRows.length === 0 ? (
                  <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    No connected Data Sources for this Project.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {details.sourceRows.map(({ source, label }) => (
                      <li
                        key={source.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] px-3 py-2"
                        style={{
                          background: "var(--luxia-settings-section-bg)",
                          border: "1px solid var(--luxia-settings-section-border)",
                        }}
                      >
                        <div className="min-w-0">
                          <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                            {source.name}
                          </p>
                          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                            {source.type} · {source.status} · {label}
                          </p>
                        </div>
                        {onOpenDataSourceSettings ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="compact"
                            onClick={() => onOpenDataSourceSettings(source.id)}
                          >
                            Open
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}

                {details.readiness.missingSourceIds.length > 0 ? (
                  <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    Missing or insufficient:{" "}
                    {details.readiness.missingSourceIds
                      .map((id) => dataSources.find((s) => s.id === id)?.name ?? id)
                      .join(", ")}
                  </p>
                ) : null}

                {onOpenAccessLevels ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    onClick={onOpenAccessLevels}
                  >
                    Open Access Levels
                  </Button>
                ) : null}
              </div>
            );
          })() : null}
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: "var(--luxia-purple-70)" }}>
              Transfer ownership
            </DialogTitle>
            <DialogDescription>
              Choose the new Project Owner. You will receive a different role on
              this Project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FilterField label="New owner" htmlFor="transfer-owner">
              <Select
                value={transferTargetUserId}
                onValueChange={setTransferTargetUserId}
              >
                <SelectTrigger id="transfer-owner" aria-label="New owner">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {transferCandidates.map((membership) => {
                    const user = getOrganizationUserById(membership.userId);
                    const label = user?.name ?? membership.userId;
                    return (
                      <SelectItem
                        key={membership.id}
                        value={membership.userId}
                        textValue={label}
                      >
                        <DemoUserIdentityRow userId={membership.userId} name={label} />
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Your new role" htmlFor="transfer-role">
              <Select
                value={transferNewRole}
                onValueChange={(value) =>
                  setTransferNewRole(value as ProjectRole)
                }
              >
                <SelectTrigger id="transfer-role" aria-label="Your new role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITABLE_PROJECT_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              onClick={() => setTransferOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="compact"
              disabled={!transferTargetUserId}
              onClick={confirmTransfer}
            >
              Transfer ownership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(roleChangeMembershipId)}
        onOpenChange={(open) => !open && setRoleChangeMembershipId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: "var(--luxia-purple-70)" }}>
              {roleChangeMembership?.status === "pending"
                ? "Change intended role"
                : "Change role"}
            </DialogTitle>
            <DialogDescription>
              Project roles cannot include Owner via this action.
            </DialogDescription>
          </DialogHeader>
          <FilterField label="Project role" htmlFor="change-role">
            <Select
              value={roleChangeValue}
              onValueChange={(value) =>
                setRoleChangeValue(
                  value as (typeof INVITABLE_PROJECT_ROLES)[number],
                )
              }
            >
              <SelectTrigger id="change-role" aria-label="Project role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_PROJECT_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              onClick={() => setRoleChangeMembershipId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="compact"
              onClick={confirmRoleChange}
            >
              Save role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(removeMembershipId)}
        onOpenChange={(open) => !open && setRemoveMembershipId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberships.find((m) => m.id === removeMembershipId)?.status === "pending"
                ? "Cancel invitation?"
                : "Remove from Project?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const membership = memberships.find((m) => m.id === removeMembershipId);
                const user = membership
                  ? getOrganizationUserById(membership.userId)
                  : undefined;
                if (membership?.status === "pending") {
                  return `Cancel the invitation for ${user?.name ?? "this user"}. Organization account, Access Levels, and Data Sources are unchanged.`;
                }
                return `Remove ${user?.name ?? "this user"} from this Project only. Organization account, Access Level membership, and private Data Source ownership are unchanged.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep member</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>
              {memberships.find((m) => m.id === removeMembershipId)?.status === "pending"
                ? "Cancel invitation"
                : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LuxiaPageFrame>
  );
}
