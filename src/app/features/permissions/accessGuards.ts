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

export function isOrganizationAdmin(userId: string = CURRENT_USER_ID): boolean {
  return getOrganizationUserById(userId)?.orgRole === "Admin";
}

export function canAdministerAccessLevels(userId: string = CURRENT_USER_ID): boolean {
  return isOrganizationAdmin(userId);
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

  if (input.projectRole === "Guest") {
    return {
      available: false,
      reason: "Guest access is limited to explicitly shared content.",
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
  const memberships = input.memberships ?? getProjectMemberships(input.projectId);
  const membership = getActiveProjectMembership(
    input.projectId,
    memberships,
    input.userId,
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

export function isDataSourceActiveInCatalog(
  sourceId: string,
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
): boolean {
  const source = dataSources.find((item) => item.id === sourceId);
  return source ? isDataSourceUsable(source.status) : false;
}
