import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  BrowserFilterSelect,
  CollectionFilterBar,
  FilteredEmptyState,
  FilterToolbar,
  FilterToolbarRow,
  ResultsCount,
} from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { DemoUserAvatar } from "./demoUserAvatar";
import { formatOrganizationRoleLabel } from "./currentUser";
import { ORGANIZATION_USERS_GUIDANCE } from "./ia";
import { LuxiaUsersGuide } from "./LuxiaUsersGuide";
import type {
  AccessLevelRecord,
  OrganizationUser,
  ProjectMembership,
} from "./types";

const PARENT_SURFACE_CLASS = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

type StatusFilter = "all" | OrganizationUser["status"];
type OrgRoleFilter = "all" | OrganizationUser["orgRole"];

export interface OrganizationUsersPageProps {
  users: OrganizationUser[];
  memberships: ProjectMembership[];
  accessLevels: AccessLevelRecord[];
  onOpenUser: (userId: string) => void;
  onInvite: () => void;
  onUpdateOrgRole: (userId: string, orgRole: OrganizationUser["orgRole"]) => void;
  onRemoveUser: (userId: string) => void;
  onResendInvitation: (userId: string) => void;
  onCancelInvitation: (userId: string) => void;
  onNavigateHome: () => void;
  canAdminister?: boolean;
}

export function OrganizationUsersPage({
  users,
  memberships,
  accessLevels,
  onOpenUser,
  onInvite,
  onUpdateOrgRole,
  onRemoveUser,
  onResendInvitation,
  onCancelInvitation,
  onNavigateHome,
  canAdminister = true,
}: OrganizationUsersPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [orgRoleFilter, setOrgRoleFilter] = useState<OrgRoleFilter>("all");
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [editRoleUserId, setEditRoleUserId] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] =
    useState<OrganizationUser["orgRole"]>("Member");

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "organization-users",
      label: "Users",
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
  };

  const projectCountByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const membership of memberships) {
      if (membership.status !== "active" && membership.status !== "pending") {
        continue;
      }
      map.set(membership.userId, (map.get(membership.userId) ?? 0) + 1);
    }
    return map;
  }, [memberships]);

  const accessLevelCountByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const level of accessLevels) {
      for (const userId of level.memberUserIds) {
        map.set(userId, (map.get(userId) ?? 0) + 1);
      }
    }
    return map;
  }, [accessLevels]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (statusFilter !== "all" && user.status !== statusFilter) return false;
      if (orgRoleFilter !== "all" && user.orgRole !== orgRoleFilter) return false;
      if (!q) return true;
      return (
        user.name.toLowerCase().includes(q)
        || user.email.toLowerCase().includes(q)
      );
    });
  }, [users, query, statusFilter, orgRoleFilter]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setOrgRoleFilter("all");
  }

  const pendingRemoveUser = pendingRemoveId
    ? users.find((user) => user.id === pendingRemoveId)
    : null;
  const pendingCancelUser = pendingCancelId
    ? users.find((user) => user.id === pendingCancelId)
    : null;
  const editRoleUser = editRoleUserId
    ? users.find((user) => user.id === editRoleUserId)
    : null;

  return (
    <LuxiaPageFrame variant={ORGANIZATION_USERS_GUIDANCE.pageVariant}>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="ORGANIZATION"
        title="Users"
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={ORGANIZATION_USERS_GUIDANCE.listPageDescription}
        context={
          <div className="space-y-1">
            <p
              className="luxia-type-caption"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              {ORGANIZATION_USERS_GUIDANCE.listPageRule}
            </p>
            {!canAdminister ? (
              <div
                className="space-y-0.5"
                role="status"
                aria-label="Read only. Only Organization Admins can invite or manage users."
              >
                <p
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Read only
                </p>
                <p
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  Only Organization Admins can invite or manage organization users.
                </p>
              </div>
            ) : null}
          </div>
        }
        actions={<LuxiaUsersGuide />}
        primaryAction={
          canAdminister ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.primary}
              aria-label="Invite user"
              onClick={onInvite}
            >
              <Plus size={16} strokeWidth={2} aria-hidden className="shrink-0" />
              Invite user
            </Button>
          ) : null
        }
      />

      <LuxiaPageBody>
        <FilterToolbar>
          <label className="block w-full max-w-full">
            <span className="sr-only">Search users</span>
            <div className="relative">
              <Search
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                style={{ color: "var(--luxia-text-muted)" }}
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email"
                aria-label="Search users"
                className="h-10 w-full pl-9"
                style={{
                  background: HS.searchBg,
                  borderColor: HS.searchBorder,
                }}
              />
            </div>
          </label>

          <FilterToolbarRow>
            <CollectionFilterBar>
              <BrowserFilterSelect
                label="Status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </BrowserFilterSelect>

              <BrowserFilterSelect
                label="Organization role"
                value={orgRoleFilter}
                onChange={(event) =>
                  setOrgRoleFilter(event.target.value as OrgRoleFilter)
                }
              >
                <option value="all">All</option>
                <option value="Admin">Admin</option>
                <option value="Member">Member</option>
              </BrowserFilterSelect>
            </CollectionFilterBar>
          </FilterToolbarRow>

          <ResultsCount>
            {filtered.length} user{filtered.length === 1 ? "" : "s"}
          </ResultsCount>
        </FilterToolbar>

        {users.length === 0 ? (
          <div className="flex flex-col items-start gap-4 py-10">
            <div className="space-y-1.5">
              <h2
                className="luxia-type-title-section"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                No users yet
              </h2>
              <p
                className="max-w-xl luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Invite people to join this organization.
              </p>
            </div>
            {canAdminister ? (
              <Button
                type="button"
                {...LUXIA_PAGE_HEADER_ACTION.primary}
                onClick={onInvite}
              >
                <Plus size={16} strokeWidth={2} aria-hidden className="shrink-0" />
                Invite user
              </Button>
            ) : null}
          </div>
        ) : filtered.length === 0 ? (
          <FilteredEmptyState title="No users match" onClear={clearFilters} />
        ) : (
          <div className={PARENT_SURFACE_CLASS}>
            <ul>
              {filtered.map((user) => {
                const projectCount = projectCountByUser.get(user.id) ?? 0;
                const accessLevelCount = accessLevelCountByUser.get(user.id) ?? 0;
                const isPending = user.status === "pending";
                return (
                  <li
                    key={user.id}
                    className="luxia-settings-row is-interactive flex flex-wrap items-start gap-3 px-4 py-4"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] rounded-[6px]"
                      onClick={() => onOpenUser(user.id)}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <DemoUserAvatar userId={user.id} aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p
                            className="luxia-type-body-dense-strong"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            {user.name}
                          </p>
                          <p
                            className="mt-0.5 truncate luxia-type-body-dense"
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            {user.email}
                          </p>
                          <div
                            className="mt-2 flex flex-wrap gap-x-4 gap-y-1 luxia-type-caption"
                            style={{ color: "var(--luxia-text-muted)" }}
                          >
                            <span>
                              {formatOrganizationRoleLabel(user.orgRole)}
                            </span>
                            <span style={{ textTransform: "capitalize" }}>
                              {user.status === "pending" ? "Pending" : "Active"}
                            </span>
                            <span>
                              {projectCount} Project{projectCount === 1 ? "" : "s"}
                            </span>
                            <span>
                              {accessLevelCount} Access Level
                              {accessLevelCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <LuxiaEntityOptionsMenu
                      entityLabel={user.name}
                      entityType="User"
                      ariaLabel={`Actions for ${user.name}`}
                      items={[
                        {
                          id: "view",
                          label: "View details",
                          onSelect: () => onOpenUser(user.id),
                        },
                        ...(canAdminister && !isPending
                          ? [
                              {
                                id: "edit-org-role",
                                label: "Edit Organization role",
                                onSelect: () => {
                                  setEditRoleUserId(user.id);
                                  setEditRoleValue(user.orgRole);
                                },
                              },
                              {
                                id: "remove",
                                label: "Remove from organization",
                                destructive: true as const,
                                separatorBefore: true,
                                onSelect: () => setPendingRemoveId(user.id),
                              },
                            ]
                          : []),
                        ...(canAdminister && isPending
                          ? [
                              {
                                id: "resend",
                                label: "Resend invitation",
                                onSelect: () => onResendInvitation(user.id),
                              },
                              {
                                id: "cancel",
                                label: "Cancel invitation",
                                destructive: true as const,
                                separatorBefore: true,
                                onSelect: () => setPendingCancelId(user.id),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </LuxiaPageBody>

      <AlertDialog
        open={Boolean(pendingRemoveId)}
        onOpenChange={(open) => !open && setPendingRemoveId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from organization?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoveUser
                ? `${pendingRemoveUser.name} will lose organization access, Project memberships, and Access Level assignments in this prototype.`
                : "This user will lose organization access in this prototype."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="luxia-button luxia-button--destructive"
              onClick={() => {
                if (pendingRemoveId) onRemoveUser(pendingRemoveId);
                setPendingRemoveId(null);
              }}
            >
              Remove user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pendingCancelId)}
        onOpenChange={(open) => !open && setPendingCancelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCancelUser
                ? `The invitation for ${pendingCancelUser.email} will be cancelled.`
                : "This invitation will be cancelled."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep invitation</AlertDialogCancel>
            <AlertDialogAction
              className="luxia-button luxia-button--destructive"
              onClick={() => {
                if (pendingCancelId) onCancelInvitation(pendingCancelId);
                setPendingCancelId(null);
              }}
            >
              Cancel invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(editRoleUserId)}
        onOpenChange={(open) => !open && setEditRoleUserId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Organization role</DialogTitle>
            <DialogDescription>
              Organization role is global for{" "}
              {editRoleUser?.name ?? "this user"}. It does not change Project
              roles or Access Levels.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              Organization role
            </label>
            <Select
              value={editRoleValue}
              onValueChange={(value) =>
                setEditRoleValue(value as OrganizationUser["orgRole"])
              }
            >
              <SelectTrigger aria-label="Organization role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditRoleUserId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (editRoleUserId) {
                  onUpdateOrgRole(editRoleUserId, editRoleValue);
                }
                setEditRoleUserId(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LuxiaPageFrame>
  );
}
