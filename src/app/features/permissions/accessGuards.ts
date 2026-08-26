import type { AccessLevelRecord, DataSourceCatalogItem, ProjectMembership, ProjectRole } from "./types";
import {
  CURRENT_USER_ID,
  DATA_SOURCE_CATALOG,
  getOrganizationUserById,
  getProjectMemberships,
  isDataSourceUsable,
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

/** Organization Settings → Analytics nav visibility.
 * Prototype only: the internal/admin demo identity (current Org Admin user).
 * Members do not see Analytics. This is not a product rule that Org Admin
 * has cross-tenant visibility — swap this mapping when the model is confirmed.
 */
export function canViewOrganizationAnalytics(userId: string = CURRENT_USER_ID): boolean {
  return isOrganizationAdmin(userId);
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

/**
 * Normal Project UX requires an explicit active Project membership.
 * Org Admin is not automatic Project access.
 */
export function canAccessProject(
  projectId: string,
  memberships: ProjectMembership[],
  userId: string = CURRENT_USER_ID,
): boolean {
  return Boolean(getActiveProjectMembership(projectId, memberships, userId));
}

/**
 * Project / Constellation / Galaxy structural configuration.
 * Explicit Project role only — Org Admin does not bypass.
 */
export function canAdministerProjectConfiguration(
  _userId: string = CURRENT_USER_ID,
  projectRole: ProjectRole | null | undefined = null,
): boolean {
  return canConfigureConstellation(projectRole);
}

export function canAccessProjectSettingsForUser(
  _userId: string = CURRENT_USER_ID,
  projectRole: ProjectRole | null | undefined = null,
): boolean {
  return canAccessProjectSettings(projectRole);
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
  // Same operational lifecycle as Owner — Delete Project is the Owner-only delete rule.
  return role === "Project Owner" || role === "Project Manager";
}

export function canConfigureConstellation(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner" || role === "Project Manager";
}

/**
 * Galaxy Settings edit permission — follows Project role only.
 * No separate Galaxy roles. No Org Admin bypass.
 * Owner / Manager → edit; Analyst / Member → read-only.
 */
export function canEditGalaxySettings(
  projectRole: ProjectRole | null | undefined,
): boolean {
  return canConfigureConstellation(projectRole);
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

export function canAccessProjectSettings(
  role: ProjectRole | null | undefined,
): boolean {
  return role === "Project Owner" || role === "Project Manager";
}

export const CONSTELLATION_CONFIGURE_DENIED_MESSAGE =
  "You do not have permission to configure this Constellation.";

export const CONSTELLATION_KNOWLEDGE_DENIED_MESSAGE =
  "You do not have permission to edit Knowledge Base, Instructions, or Crawler for this Constellation.";

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

/**
 * Basic Constellation visibility / Chat eligibility for an existing Constellation.
 * Active Project membership is sufficient. Data Source View/Use/Manage is NOT required.
 */
export function evaluateConstellationUseAccess(input: {
  userId?: string;
  projectRole: ProjectRole | null | undefined;
  membershipStatus?: ProjectMembership["status"];
  connectedSourceIds: string[];
  accessLevels: AccessLevelRecord[];
  dataSources?: DataSourceCatalogItem[];
}): ConstellationUseAccessResult {
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
 * Working-surface Chat visibility: active Project membership required.
 * Galaxy and Constellation chats do not require Data Source Use.
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
  if (input.chatType === "galaxy") return true;
  const membership = getActiveProjectMembership(
    input.projectId,
    input.memberships,
    userId,
  );
  if (!membership) return false;
  if (!input.constellationId) return false;
  return evaluateConstellationUseAccess({
    userId,
    projectRole: membership.projectRole,
    membershipStatus: membership.status,
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
