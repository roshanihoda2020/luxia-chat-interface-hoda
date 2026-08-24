export type AccessLevelPermission = "View" | "Use" | "Manage";

export type AccessLevelStatus = "active" | "inactive";

export type DataSourceStatus = "active" | "inactive" | "archived";

export type DataSourceTypeLabel = "Database" | "PDF" | "CSV" | "File";

/** Connector subtype for library/Settings display. Optional for legacy seed rows. */
export type DataSourceConnector =
  | "postgres"
  | "mysql"
  | "mssql"
  | "snowflake"
  | "redshift"
  | "bigquery"
  | "csv"
  | "file";

/** Local Settings Profile MFA UI only — not real authentication enrollment. */
export type PrototypeMfaMethod = "email-otp" | "authenticator";

export interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  orgRole: "Admin" | "Member";
  /** Organization invitation/account status — not a Project membership status. */
  status: "active" | "pending";
  /** Profile personal fields (prototype-editable in Settings). */
  jobTitle: string;
  mobile: string;
  /**
   * Per-demo-user MFA UI state for Settings → Profile → Security.
   * Local prototype only — not wired to auth APIs.
   */
  mfaEnabled: boolean;
  mfaMethod: PrototypeMfaMethod | null;
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
  | "Member";

export interface ProjectMembership {
  id: string;
  projectId: string;
  userId: string;
  projectRole: ProjectRole;
  status: "active" | "pending";
  joinedOrInvitedAt: string;
}

export interface DataSourceContentSummary {
  /** Non-secret connection/content snapshot for Settings (no passwords). */
  kind: "database" | "csv" | "file";
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  account?: string;
  warehouse?: string;
  role?: string;
  projectId?: string;
  dataset?: string;
  ssl?: boolean;
  fileName?: string;
  tableName?: string;
  tableDescription?: string;
  delimiter?: string;
  importedRows?: number;
  skippedRows?: number;
  fileNames?: string[];
}

export interface DataSourceCatalogItem {
  id: string;
  name: string;
  type: DataSourceTypeLabel | string;
  /** Optional connector subtype (e.g. postgres). */
  connector?: DataSourceConnector;
  ownership: "organizational" | "private";
  ownerUserId: string;
  status: DataSourceStatus;
  /** Optional non-secret creation snapshot for Settings Content. */
  contentSummary?: DataSourceContentSummary;
}
