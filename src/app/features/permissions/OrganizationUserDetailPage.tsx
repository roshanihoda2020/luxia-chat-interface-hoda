import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { HS } from "@/app/features/home/homeSurfaces";
import { getProjectNameById } from "@/app/features/project/data";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { DemoUserAvatar } from "./demoUserAvatar";
import { formatOrganizationRoleLabel } from "./currentUser";
import { INVITABLE_PROJECT_ROLES } from "./data";
import { ORGANIZATION_USERS_GUIDANCE } from "./ia";
import type {
  AccessLevelRecord,
  DataSourceCatalogItem,
  OrganizationUser,
  ProjectMembership,
  ProjectRole,
} from "./types";

const SURFACE_CLASS = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

export interface OrganizationUserDetailPageProps {
  user: OrganizationUser;
  memberships: ProjectMembership[];
  accessLevels: AccessLevelRecord[];
  dataSources: DataSourceCatalogItem[];
  projectOptions: { id: string; name: string }[];
  onNavigateHome: () => void;
  onNavigateUsers: () => void;
  onOpenProject?: (projectId: string) => void;
  onOpenProjectMembers?: (projectId: string) => void;
  onOpenAccessLevel: (accessLevelId: string) => void;
  onUpdateProjectRole?: (
    membershipId: string,
    projectRole: ProjectRole,
  ) => void;
  canEditProjectRoles?: boolean;
}

export function OrganizationUserDetailPage({
  user,
  memberships,
  accessLevels,
  dataSources,
  projectOptions,
  onNavigateHome,
  onNavigateUsers,
  onOpenProject,
  onOpenProjectMembers,
  onOpenAccessLevel,
  onUpdateProjectRole,
  canEditProjectRoles = false,
}: OrganizationUserDetailPageProps) {
  const [roleDraftByMembership, setRoleDraftByMembership] = useState<
    Record<string, ProjectRole>
  >({});

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "organization-users",
      label: "Users",
      destination: { kind: "organization-users" },
    },
    {
      id: "organization-user",
      label: user.name,
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onOrganizationUsers: onNavigateUsers,
  };

  const userMemberships = useMemo(() => {
    return memberships
      .filter((membership) => membership.userId === user.id)
      .slice()
      .sort((a, b) => {
        const nameA = getProjectNameById(a.projectId) ?? a.projectId;
        const nameB = getProjectNameById(b.projectId) ?? b.projectId;
        return nameA.localeCompare(nameB);
      });
  }, [memberships, user.id]);

  const userAccessLevels = useMemo(() => {
    return accessLevels
      .filter((level) => level.memberUserIds.includes(user.id))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accessLevels, user.id]);

  const ownedPrivateSources = useMemo(() => {
    return dataSources
      .filter(
        (source) =>
          source.ownership === "private"
          && source.ownerUserId === user.id,
      )
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dataSources, user.id]);

  const projectNameById = useMemo(() => {
    const map = new Map(projectOptions.map((project) => [project.id, project.name]));
    return map;
  }, [projectOptions]);

  return (
    <LuxiaPageFrame variant={ORGANIZATION_USERS_GUIDANCE.pageVariant}>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="ORGANIZATION"
        title={user.name}
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={user.email}
        context={
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <DemoUserAvatar userId={user.id} size="lg" aria-hidden />
            <div className="min-w-0 space-y-1">
              <div
                className="flex flex-wrap gap-x-4 gap-y-1 luxia-type-caption"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                <span>{formatOrganizationRoleLabel(user.orgRole)}</span>
                <span style={{ textTransform: "capitalize" }}>
                  {user.status === "pending" ? "Pending" : "Active"}
                </span>
              </div>
              <p
                className="luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                Organization role is global. Project roles below come from each
                Project membership.
              </p>
            </div>
          </div>
        }
        primaryAction={
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.secondary}
            onClick={onNavigateUsers}
          >
            Back to Users
          </Button>
        }
      />

      <LuxiaPageBody className="space-y-8">
        <section className="space-y-3" aria-labelledby="user-projects-roles">
          <div className="space-y-1">
            <h2
              id="user-projects-roles"
              className="luxia-type-title-section"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              Projects & Roles
            </h2>
            <p
              className="luxia-type-body-dense"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              Project role belongs to this user and each Project membership —
              not a single global Project role.
            </p>
          </div>

          {userMemberships.length === 0 ? (
            <p
              className="luxia-type-body-dense"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              No Project memberships for this user.
            </p>
          ) : (
            <div className={SURFACE_CLASS}>
              <ul>
                {userMemberships.map((membership) => {
                  const projectName =
                    projectNameById.get(membership.projectId)
                    ?? getProjectNameById(membership.projectId)
                    ?? membership.projectId;
                  const draftRole =
                    roleDraftByMembership[membership.id] ?? membership.projectRole;
                  const canEditThisRole =
                    canEditProjectRoles
                    && membership.projectRole !== "Project Owner"
                    && Boolean(onUpdateProjectRole);
                  return (
                    <li
                      key={membership.id}
                      className="luxia-settings-row flex flex-wrap items-center gap-3 px-4 py-4"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p
                          className="luxia-type-body-dense-strong"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          {projectName}
                        </p>
                        <div
                          className="flex flex-wrap gap-x-3 gap-y-1 luxia-type-caption"
                          style={{ color: "var(--luxia-text-muted)" }}
                        >
                          <span style={{ textTransform: "capitalize" }}>
                            {membership.status}
                          </span>
                          {!canEditThisRole ? (
                            <span>{membership.projectRole}</span>
                          ) : null}
                        </div>
                      </div>

                      {canEditThisRole ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={draftRole}
                            onValueChange={(value) => {
                              const next = value as ProjectRole;
                              setRoleDraftByMembership((prev) => ({
                                ...prev,
                                [membership.id]: next,
                              }));
                              onUpdateProjectRole?.(membership.id, next);
                            }}
                          >
                            <SelectTrigger
                              className="w-[11.5rem]"
                              aria-label={`Project role for ${projectName}`}
                            >
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
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        {onOpenProject ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="compact"
                            onClick={() => onOpenProject(membership.projectId)}
                          >
                            Open Project
                            <ExternalLink size={14} strokeWidth={2} aria-hidden />
                          </Button>
                        ) : null}
                        {onOpenProjectMembers ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="compact"
                            onClick={() =>
                              onOpenProjectMembers(membership.projectId)
                            }
                          >
                            Members & Roles
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <section className="space-y-3" aria-labelledby="user-access-levels">
          <div className="space-y-1">
            <h2
              id="user-access-levels"
              className="luxia-type-title-section"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              Access Levels
            </h2>
            <p
              className="luxia-type-body-dense"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              Access Levels grant Data Source permissions only. They do not
              assign Project membership.
            </p>
          </div>

          {userAccessLevels.length === 0 ? (
            <p
              className="luxia-type-body-dense"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              No Access Levels assigned to this user.
            </p>
          ) : (
            <div className={SURFACE_CLASS}>
              <ul>
                {userAccessLevels.map((level) => (
                  <li
                    key={level.id}
                    className="luxia-settings-row is-interactive flex flex-wrap items-center gap-3 px-4 py-4"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] rounded-[6px]"
                      onClick={() => onOpenAccessLevel(level.id)}
                    >
                      <p
                        className="luxia-type-body-dense-strong"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {level.name}
                      </p>
                      <div
                        className="mt-1 flex flex-wrap gap-x-4 gap-y-1 luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        <span style={{ textTransform: "capitalize" }}>
                          {level.status}
                        </span>
                        <span>
                          {level.sourceGrants.length} Data Source grant
                          {level.sourceGrants.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      onClick={() => onOpenAccessLevel(level.id)}
                    >
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {ownedPrivateSources.length > 0 ? (
          <section className="space-y-3" aria-labelledby="user-owned-sources">
            <div className="space-y-1">
              <h2
                id="user-owned-sources"
                className="luxia-type-title-section"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Owned Data Sources
              </h2>
              <p
                className="luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Private Data Sources owned by this user. Organization Admin does
              not automatically Manage another user's private sources.
            </p>
          </div>
          <div className={SURFACE_CLASS}>
            <ul>
              {ownedPrivateSources.map((source) => (
                <li
                  key={source.id}
                  className="luxia-settings-row flex flex-wrap items-center gap-3 px-4 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="luxia-type-body-dense-strong"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      {source.name}
                    </p>
                    <div
                      className="mt-1 flex flex-wrap gap-x-4 gap-y-1 luxia-type-caption"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      <span>{source.type}</span>
                      <span>Private</span>
                      <span style={{ textTransform: "capitalize" }}>
                        {source.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
