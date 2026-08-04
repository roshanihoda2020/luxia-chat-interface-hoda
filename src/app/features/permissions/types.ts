export type AccessLevelPermission = "View" | "Use" | "Manage";

export type AccessLevelStatus = "active" | "inactive";

export interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  orgRole: "Admin" | "Member";
}

export interface AccessLevelSourceGrant {
  dataSourceId: string;
  permission: AccessLevelPermission;
}

export interface AccessLevelRecord {
  id: string;
  name: string;
  description: string;
  status: AccessLevelStatus;
  memberUserIds: string[];
  sourceGrants: AccessLevelSourceGrant[];
  updatedAt: string;
  isNew?: boolean;
}

export type ProjectRole =
  | "Project Owner"
  | "Project Manager"
  | "Analyst"
  | "Member"
  | "Guest";

export interface ProjectMembership {
  id: string;
  projectId: string;
  userId: string;
  projectRole: ProjectRole;
  status: "active" | "pending";
  joinedOrInvitedAt: string;
}

export interface DataSourceCatalogItem {
  id: string;
  name: string;
  type: string;
  ownership: "organizational" | "private";
  ownerUserId: string;
  ownerName: string;
  status: string;
}
