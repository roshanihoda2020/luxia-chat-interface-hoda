import type { AccessLevelRecord, DataSourceCatalogItem, ProjectMembership, ProjectRole } from "./types";
import {
  CURRENT_USER_ID,
  DATA_SOURCE_CATALOG,
  getOrganizationUserById,
  getProjectMemberships,
  isDataSourceUsable,
  permissionRank,
  resolveUserDataSourceAccess,
} from "./data";

export const ACCESS_LEVEL_DENIED_MESSAGE =
  "You do not have permission to manage Access Levels.";

export const ACCESS_LEVEL_CREATE_DENIED_MESSAGE =
  "You do not have permission to create Access Levels.";

export const PROJECT_ACTION_DENIED_MESSAGE =
  "You do not have permission to perform this action on this Project.";

export const PROJECT_CREATE_DENIED_MESSAGE =
  "You do not have permission to create Projects in this Organization.";

export function isOrganizationAdmin(userId: string = CURRENT_USER_ID): boolean {
  return getOrganizationUserById(userId)?.orgRole === "Admin";
}

export function canAdministerAccessLevels(userId: string = CURRENT_USER_ID): boolean {
  return isOrganizationAdmin(userId);
}

/** Prototype rule: Organizational Data Sources may be created by Org Admins only. */
export function canCreateOrganizationalDataSource(
  userId: string = CURRENT_USER_ID,
): boolean {
  return isOrganizationAdmin(userId);
}

/** Organization-level capability — not gated by existing Project membership. */
export function canCreateProject(userId: string = CURRENT_USER_ID): boolean {
  const orgRole = getOrganizationUserById(userId)?.orgRole;
  return orgRole === "Admin" || orgRole === "Member";
}

export function getActiveProjectMembership(
  projectId: string,
  memberships: ProjectMembership[],
  userId: string = CURRENT_USER_ID,
): ProjectMembership | undefined {
  return memberships.find(
    (membership) =>
      membership.projectId === projectId
      && membership.userId === userId
      && membership.status === "active",
  );
}

/** Organization Admin bypasses explicit Project membership for visibility/access. */
export function canAccessProject(
  projectId: string,
  memberships: ProjectMembership[],
  userId: string = CURRENT_USER_ID,
): boolean {
  if (isOrganizationAdmin(userId)) return true;
  return Boolean(getActiveProjectMembership(projectId, memberships, userId));
}

/** Admin may configure Project/Constellation/Galaxy settings without a Project role row. */
export function canAdministerProjectConfiguration(
  userId: string = CURRENT_USER_ID,
  projectRole: ProjectRole | null | undefined = null,
): boolean {
  return isOrganizationAdmin(userId) || canConfigureConstellation(projectRole);
}

/** Admin may open Project Settings without an explicit Owner/Manager membership. */
export function canAccessProjectSettingsForUser(
  userId: string = CURRENT_USER_ID,
  projectRole: ProjectRole | null | undefined = null,
): boolean {
  return isOrganizationAdmin(userId) || canAccessProjectSettings(projectRole);
}

export function canInviteProjectMembers(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner" || role === "Project Manager";
}

export function canChangeProjectRole(
  actorRole: ProjectRole | null | undefined,
  nextRole: ProjectRole,
): boolean {
  if (!canInviteProjectMembers(actorRole)) return false;
  if (nextRole === "Project Owner") return false;
  return true;
}

export function canRemoveProjectMember(
  actorRole: ProjectRole | null | undefined,
  target: ProjectMembership,
): boolean {
  if (!canInviteProjectMembers(actorRole)) return false;
  if (target.projectRole === "Project Owner") return false;
  return true;
}

export function canTransferProjectOwnership(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner";
}

export function canArchiveConstellation(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner" || role === "Project Manager";
}

export function canDeleteConstellation(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner";
}

export function canConfigureConstellation(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner" || role === "Project Manager";
}

/**
 * Analyst-level editing: KB, Instructions, Crawler.
 * Owner and Manager also have this capability (superset).
 */
export function canEditConstellationKnowledge(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner" || role === "Project Manager" || role === "Analyst";
}

export function canArchiveProject(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner" || role === "Project Manager";
}

export function canDeleteProject(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner";
}

/** Project Settings destination — Owner/Manager when that surface exists. */
export function canAccessProjectSettings(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner" || role === "Project Manager";
}

export const CONSTELLATION_CONFIGURE_DENIED_MESSAGE =
  "You do not have permission to configure this Constellation.";

export function countProjectMembers(
  projectId: string,
  memberships: ProjectMembership[],
): number {
  return memberships.filter((membership) => membership.projectId === projectId).length;
}

export type ConstellationUseAccessResult = {
  available: boolean;
  reason: string;
  missingSourceIds: string[];
};

/*
 * Non-admin Org Members: Constellation use requires Use on every connected source.
 * Organization Admin: full Organization access — bypasses per-source Use grants.
 */
export function evaluateConstellationUseAccess(input: {
  userId?: string;
  projectRole: ProjectRole | null | undefined;
  membershipStatus?: ProjectMembership["status"];
  connectedSourceIds: string[];
  accessLevels: AccessLevelRecord[];
  dataSources?: DataSourceCatalogItem[];
}): ConstellationUseAccessResult {
  const userId = input.userId ?? CURRENT_USER_ID;
  const dataSources = input.dataSources ?? DATA_SOURCE_CATALOG;
  const missingSourceIds: string[] = [];

  if (isOrganizationAdmin(userId)) {
    return {
      available: true,
      reason: "Constellation available.",
      missingSourceIds: [],
    };
  }

  if (input.membershipStatus === "pending") {
    return {
      available: false,
      reason: "Project access starts after the invitation is accepted.",
      missingSourceIds: [],
    };
  }

  if (!input.projectRole) {
    return {
      available: false,
      reason: "You are not an active member of this Project.",
      missingSourceIds: [],
    };
  }

  if (input.connectedSourceIds.length === 0) {
    return {
      available: false,
      reason: "This Constellation does not have connected Data Sources yet.",
      missingSourceIds: [],
    };
  }

  for (const sourceId of input.connectedSourceIds) {
    const resolved = resolveUserDataSourceAccess(
      userId,
      sourceId,
      input.accessLevels,
      dataSources,
    );
    if (!resolved.sourceUsable) {
      missingSourceIds.push(sourceId);
      continue;
    }
    if (!resolved.permission) {
      missingSourceIds.push(sourceId);
      continue;
    }
    if (permissionRank(resolved.permission) < permissionRank("Use")) {
      missingSourceIds.push(sourceId);
    }
  }

  if (missingSourceIds.length > 0) {
    return {
      available: false,
      reason:
        "You need Use access to every connected Data Source before you can use this Constellation.",
      missingSourceIds,
    };
  }

  return {
    available: true,
    reason: "Constellation available.",
    missingSourceIds: [],
  };
}

export function getAccessibleConstellationIds(input: {
  projectId: string;
  constellationSourceMap: Array<{ id: string; dataSourceIds: string[] }>;
  memberships?: ProjectMembership[];
  accessLevels: AccessLevelRecord[];
  dataSources?: DataSourceCatalogItem[];
  userId?: string;
}): string[] {
  const userId = input.userId ?? CURRENT_USER_ID;
  const memberships = input.memberships ?? getProjectMemberships(input.projectId);

  if (!canAccessProject(input.projectId, memberships, userId)) {
    return [];
  }

  if (isOrganizationAdmin(userId)) {
    return input.constellationSourceMap.map((item) => item.id);
  }

  const membership = getActiveProjectMembership(
    input.projectId,
    memberships,
    userId,
  );

  return input.constellationSourceMap
    .filter((item) => {
      const result = evaluateConstellationUseAccess({
        userId: input.userId,
        projectRole: membership?.projectRole ?? null,
        membershipStatus: membership?.status,
        connectedSourceIds: item.dataSourceIds,
        accessLevels: input.accessLevels,
        dataSources: input.dataSources,
      });
      return result.available;
    })
    .map((item) => item.id);
}

/**
 * Working-surface Chat visibility: active Project membership required;
 * Galaxy chats need membership only; constellation chats also need Use on every connected source.
 */
export function isWorkingChatAccessible(input: {
  chatType: string;
  projectId: string;
  constellationId?: string | null;
  userId?: string;
  memberships: ProjectMembership[];
  accessLevels: AccessLevelRecord[];
  dataSources?: DataSourceCatalogItem[];
  connectedSourceIds?: string[];
}): boolean {
  const userId = input.userId ?? CURRENT_USER_ID;
  if (!canAccessProject(input.projectId, input.memberships, userId)) {
    return false;
  }
  const membership = getActiveProjectMembership(
    input.projectId,
    input.memberships,
    userId,
  );
  if (input.chatType === "galaxy") return true;
  if (!membership && !isOrganizationAdmin(userId)) return false;
  if (!input.constellationId) return false;
  return evaluateConstellationUseAccess({
    userId,
    projectRole: membership?.projectRole ?? null,
    membershipStatus: membership?.status,
    connectedSourceIds: input.connectedSourceIds ?? [],
    accessLevels: input.accessLevels,
    dataSources: input.dataSources,
  }).available;
}

export function isDataSourceActiveInCatalog(
  sourceId: string,
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
): boolean {
  const source = dataSources.find((item) => item.id === sourceId);
  return source ? isDataSourceUsable(source.status) : false;
}
