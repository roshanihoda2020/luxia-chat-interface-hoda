import { useEffect, useMemo, useState } from "react";
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
  buildSourceReadinessSummary,
  CURRENT_USER_ID,
  getOrganizationUserById,
  INVITABLE_PROJECT_ROLES,
  PROJECT_ROLE_DEFINITIONS,
} from "./data";
import { PROJECT_MEMBERS_GUIDANCE } from "./ia";
import { LuxiaAccessGuide } from "./LuxiaAccessGuide";
import type {
  AccessLevelRecord,
  DataSourceCatalogItem,
  OrganizationUser,
  ProjectMembership,
  ProjectRole,
} from "./types";

const PARENT_SURFACE_STYLE = {
  background: "var(--luxia-surface)",
  border: "1px solid var(--luxia-border-default)",
  borderRadius: "var(--luxia-radius-12)",
} as const;

const ROW_DIVIDER = {
  borderTop: "1px solid var(--luxia-border-subtle)",
} as const;

function formatMembershipDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface ProjectMembersPageProps {
  project: { id: string; name: string };
  memberships: ProjectMembership[];
  accessLevels: AccessLevelRecord[];
  organizationUsers: OrganizationUser[];
  dataSources: DataSourceCatalogItem[];
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
    if (!inviteUserId) return;
    const next: ProjectMembership = {
      id: `pm-${project.id}-${Date.now()}`,
      projectId: project.id,
      userId: inviteUserId,
      projectRole: inviteRole,
      status: "pending",
      joinedOrInvitedAt: new Date().toISOString(),
    };
    persist([...memberships, next]);
    setInviteOpen(false);
    setInviteUserId("");
    setInviteRole("Member");
    setInviteMessage("");
  }

  function confirmRemove() {
    if (!removeMembershipId) return;
    persist(memberships.filter((m) => m.id !== removeMembershipId));
    setRemoveMembershipId(null);
  }

  function confirmTransfer() {
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

  function buildAccessSummary(userId: string): string {
    const user = getOrganizationUserById(userId);
    const readiness = buildSourceReadinessSummary(
      userId,
      accessLevels,
      dataSources,
    );
    const levels = accessLevels.filter((level) =>
      level.memberUserIds.includes(userId),
    );
    const levelNames =
      levels.length > 0
        ? levels.map((l) => l.name).join(", ")
        : "None assigned";

    return `${user?.name ?? userId}: ${readiness}. Access Levels: ${levelNames}.`;
  }

  const inviteReadinessNote = inviteUserId
    ? buildSourceReadinessSummary(inviteUserId, accessLevels, dataSources)
    : "Select a user to preview Data Source readiness.";

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
    if (!roleChangeMembershipId) return;
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
        guide={
          <div className="space-y-1">
            <p>{PROJECT_MEMBERS_GUIDANCE.pageDescription}</p>
            <p className="luxia-type-caption" style={{ color: "var(--luxia-blue-60)" }}>
              {PROJECT_MEMBERS_GUIDANCE.pageRule}
            </p>
          </div>
        }
        secondaryAction={
          <>
            <LuxiaAccessGuide
              content={{
                title: "Project access guide",
                sections: [
                  {
                    heading: "Members & Roles",
                    body: PROJECT_MEMBERS_GUIDANCE.pageDescription,
                  },
                  {
                    heading: "Scope",
                    body: PROJECT_MEMBERS_GUIDANCE.pageRule,
                  },
                ],
              }}
            />
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.secondary}
              onClick={() => setRolesOpen(true)}
            >
              Compare roles
            </Button>
          </>
        }
        primaryAction={
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.primary}
            onClick={() => setInviteOpen(true)}
            disabled={!canInvite}
          >
            Invite Member
          </Button>
        }
      />

      <LuxiaPageBody>
        <div style={PARENT_SURFACE_STYLE}>
          <ul>
            {sortedMemberships.map((membership, index) => {
              const user = getOrganizationUserById(membership.userId);
              const isOwner = membership.projectRole === "Project Owner";
              const isPending = membership.status === "pending";
              const readiness = buildSourceReadinessSummary(
                membership.userId,
                accessLevels,
                dataSources,
              );

              return (
                <li
                  key={membership.id}
                  className="px-4 py-4"
                  style={index > 0 ? ROW_DIVIDER : undefined}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className="luxia-type-body-dense-strong"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {user?.name ?? membership.userId}
                      </p>
                      <div
                        className="mt-1 flex flex-wrap gap-x-3 gap-y-1 luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        <span>{membership.projectRole}</span>
                        <span style={{ textTransform: "capitalize" }}>
                          {membership.status}
                        </span>
                      </div>
                      <p
                        className="mt-2 luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        {user?.orgRole ?? "—"} org role ·{" "}
                        {isPending ? "Invited" : "Joined"}{" "}
                        {formatMembershipDate(membership.joinedOrInvitedAt)}
                      </p>
                      <p
                        className="mt-1 luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        {readiness}
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
                          View access summary
                        </Button>
                        {isCurrentUserOwner ? (
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
                      <LuxiaEntityOptionsMenu
                        entityLabel={user?.name ?? membership.userId}
                        entityType="Member"
                        items={[
                          {
                            id: "change-role",
                            label: "Change role",
                            onSelect: () => openRoleChange(membership),
                            disabled: !isCurrentUserOwner
                              && currentUserMembership?.projectRole !== "Project Manager",
                          },
                          {
                            id: "access-summary",
                            label: "View access summary",
                            onSelect: () =>
                              setAccessSummaryUserId(membership.userId),
                          },
                          {
                            id: "remove",
                            label: "Remove",
                            destructive: true,
                            separatorBefore: true,
                            onSelect: () =>
                              setRemoveMembershipId(membership.id),
                            disabled: !isCurrentUserOwner,
                          },
                        ]}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
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
              access is managed via Access Levels.
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
                  {inviteCandidates.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Role" htmlFor="invite-role">
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
                background: "var(--luxia-surface-subtle)",
              }}
            >
              Data Source readiness: {inviteReadinessNote}
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
              Access summary
            </DialogTitle>
            <DialogDescription>
              Effective Data Source access from Access Levels (prototype).
            </DialogDescription>
          </DialogHeader>
          {accessSummaryUserId ? (
            <div className="space-y-3">
              <p
                className="luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                {buildAccessSummary(accessSummaryUserId)}
              </p>
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
              {onOpenDataSourceSettings && dataSources.length > 0 ? (
                <ul className="space-y-2">
                  {dataSources.slice(0, 4).map((source) => (
                    <li key={source.id}>
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        onClick={() => onOpenDataSourceSettings(source.id)}
                      >
                        Open {source.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
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
                    return (
                      <SelectItem key={membership.id} value={membership.userId}>
                        {user?.name ?? membership.userId}
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
          <FilterField label="Role" htmlFor="change-role">
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
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the user from the Project. Data Source access via
              Access Levels is unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep member</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LuxiaPageFrame>
  );
}
