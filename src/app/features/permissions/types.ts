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
  | "googlesheet"
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

export interface CsvImportedColumnValueContext {
  columnId: string;
  columnName: string;
  retrievalMethod: "distinct" | "frequency" | "sum";
  order: "asc" | "desc";
  limit: 10 | 25 | 50;
  aggregateColumnId: string | null;
  values: string[];
  origin: "retrieved" | "edited";
}

export interface CsvImportedColumnDescription {
  columnId: string;
  columnName: string;
  description: string;
  origin: "ai" | "edited";
}

/** Accepted schema at import time, so Settings can list every column, described or not. */
export interface CsvImportedColumn {
  id: string;
  name: string;
  type: string;
}

export interface CsvImportedTableSummary {
  id: string;
  fileName: string;
  tableName: string;
  tableDescription?: string;
  /** "ai" only while the saved text is an untouched AI result. Missing means written by a person. */
  tableDescriptionOrigin?: "ai" | "edited";
  delimiter?: string;
  encoding?: string;
  importedRows?: number;
  skippedRows?: number;
  valueContext?: CsvImportedColumnValueContext[];
  columns?: CsvImportedColumn[];
  columnDescriptions?: CsvImportedColumnDescription[];
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
  tableDescriptionOrigin?: "ai" | "edited";
  delimiter?: string;
  encoding?: string;
  importedRows?: number;
  skippedRows?: number;
  fileNames?: string[];
  /** Multi-table CSV snapshot. Legacy sources may only have the singular fields above. */
  csvTables?: CsvImportedTableSummary[];
  /**
   * Prototype: original Google Sheet URL when connector is googlesheet.
   * Stored for local identity only — not shown in Settings (v2 parity).
   */
  googleSheetLink?: string;
}

export interface DataSourceCatalogItem {
  id: string;
  name: string;
  type: DataSourceTypeLabel | string;
  connector?: DataSourceConnector;
  ownership: "organizational" | "private";
  ownerUserId: string;
  status: DataSourceStatus;
  /** Optional non-secret creation snapshot for Settings Content. */
  contentSummary?: DataSourceContentSummary;
}
