import { CANONICAL_CONSTELLATIONS } from "@/app/features/constellation/catalog";
import { getProjectNameById } from "@/app/features/project/data";
import type {
  AccessLevelPermission,
  AccessLevelRecord,
  DataSourceCatalogItem,
  DataSourceStatus,
  OrganizationUser,
  ProjectMembership,
  ProjectRole,
} from "./types";
import { CURRENT_USER_ID } from "./currentUser";

export {
  CURRENT_USER_ID,
  setPrototypeCurrentUserId,
  formatOrganizationRoleLabel,
  formatDemoIdentityContextLabel,
  NO_PROJECT_ROLE_LABEL,
} from "./currentUser";

/**
 * Demo personas (not auth). Seed roster for UX preview — see ./currentUser.ts.
 * Org roles are user-level; Project roles vary per membership (see PROJECT_MEMBERSHIPS).
 * user-01…04 Org Member; user-05 Org Admin.
 */
export const ORGANIZATION_USERS: OrganizationUser[] = [
  {
    id: "user-01",
    name: "User name 01",
    email: "user01@luxia.example",
    orgRole: "Member",
    status: "active",
    jobTitle: "Analyst",
    mobile: "+1 555 0101",
    mfaEnabled: false,
    mfaMethod: null,
  },
  {
    id: "user-02",
    name: "User name 02",
    email: "user02@luxia.example",
    orgRole: "Member",
    status: "active",
    jobTitle: "Product designer",
    mobile: "+1 555 0102",
    mfaEnabled: false,
    mfaMethod: null,
  },
  {
    id: "user-03",
    name: "User name 03",
    email: "user03@luxia.example",
    orgRole: "Member",
    status: "active",
    jobTitle: "Data engineer",
    mobile: "+1 555 0103",
    mfaEnabled: false,
    mfaMethod: null,
  },
  {
    id: "user-04",
    name: "User name 04",
    email: "user04@luxia.example",
    orgRole: "Member",
    status: "active",
    jobTitle: "Operations lead",
    mobile: "+1 555 0104",
    mfaEnabled: false,
    mfaMethod: null,
  },
  {
    id: "user-05",
    name: "User name 05",
    email: "user05@luxia.example",
    orgRole: "Admin",
    status: "active",
    jobTitle: "Organization admin",
    mobile: "+1 555 0105",
    mfaEnabled: false,
    mfaMethod: null,
  },
  {
    id: "user-06",
    name: "User name 06",
    email: "user06@luxia.example",
    orgRole: "Member",
    status: "pending",
    jobTitle: "",
    mobile: "",
    mfaEnabled: false,
    mfaMethod: null,
  },
];

export const DATA_SOURCE_CATALOG: DataSourceCatalogItem[] = [
  {
    id: "ds-db-01",
    name: "Data source name 01",
    type: "Database",
    connector: "postgres",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "database",
      host: "db.example.internal",
      port: "5432",
      database: "analytics",
      username: "luxia_reader",
      ssl: true,
    },
  },
  {
    id: "ds-pdf-01",
    name: "Data source name 02",
    type: "PDF",
    connector: "file",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "file",
      fileNames: ["master-services-agreement.pdf"],
    },
  },
  {
    id: "ds-csv-01",
    name: "Data source name 03",
    type: "CSV",
    connector: "csv",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "csv",
      fileName: "orders.csv",
      tableName: "finance_orders",
      tableDescription: "Order-level extract used for revenue and fulfillment analysis.",
      delimiter: "comma",
      importedRows: 1200,
      skippedRows: 0,
      csvTables: [
        {
          id: "tbl-finance-orders",
          fileName: "orders.csv",
          tableName: "finance_orders",
          tableDescription: "Order-level extract used for revenue and fulfillment analysis.",
          importedRows: 1200,
          skippedRows: 0,
        },
      ],
    },
  },
  {
    id: "ds-db-02",
    name: "Data source name 04",
    type: "Database",
    connector: "snowflake",
    ownership: "private",
    ownerUserId: "user-03",
    status: "active",
    contentSummary: {
      kind: "database",
      account: "org-account",
      username: "analyst_03",
      warehouse: "COMPUTE_WH",
      database: "ANALYTICS",
    },
  },
  {
    id: "ds-pdf-02",
    name: "Data source name 05",
    type: "PDF",
    connector: "file",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "file",
      fileNames: ["employee-handbook.pdf"],
    },
  },
  {
    id: "ds-pdf-03",
    name: "Data source name 11",
    type: "PDF",
    connector: "file",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "file",
      fileNames: ["runbook.pdf"],
    },
  },
  {
    id: "ds-csv-02",
    name: "Data source name 06",
    type: "CSV",
    connector: "csv",
    ownership: "private",
    ownerUserId: "user-02",
    status: "active",
    contentSummary: {
      kind: "csv",
      fileName: "sample_data.csv",
      tableName: "Table name 02",
      importedRows: 840,
      skippedRows: 12,
    },
  },
  {
    id: "ds-csv-03",
    name: "Data source name 12",
    type: "CSV",
    connector: "csv",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "csv",
      fileName: "operations.csv",
      tableName: "operations_shipments",
      tableDescription: "Fulfillment and shipment events for operations reporting.",
      delimiter: "comma",
      importedRows: 640,
      skippedRows: 4,
      csvTables: [
        {
          id: "tbl-ops-shipments",
          fileName: "operations.csv",
          tableName: "operations_shipments",
          tableDescription: "Fulfillment and shipment events for operations reporting.",
          importedRows: 640,
          skippedRows: 4,
        },
      ],
    },
  },
  {
    id: "ds-csv-04",
    name: "Data source name 13",
    type: "CSV",
    connector: "csv",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "csv",
      fileName: "customers.csv",
      tableName: "customer_metrics",
      tableDescription: "Customer activity metrics used for analytics dashboards.",
      delimiter: "comma",
      importedRows: 2100,
      skippedRows: 18,
      csvTables: [
        {
          id: "tbl-customer-metrics",
          fileName: "customers.csv",
          tableName: "customer_metrics",
          tableDescription: "Customer activity metrics used for analytics dashboards.",
          importedRows: 2100,
          skippedRows: 18,
        },
      ],
    },
  },
  {
    id: "ds-db-03",
    name: "Data source name 07",
    type: "Database",
    connector: "mysql",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "database",
      host: "mysql.example.internal",
      port: "3306",
      database: "operations",
      username: "luxia_ro",
      ssl: true,
    },
  },
  {
    id: "ds-db-04",
    name: "Data source name 08",
    type: "Database",
    connector: "mssql",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "database",
      host: "sql.example.internal",
      port: "1433",
      database: "crm",
      username: "luxia_reader",
      ssl: true,
    },
  },
  {
    id: "ds-db-05",
    name: "Data source name 09",
    type: "Database",
    connector: "redshift",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "database",
      host: "redshift.example.internal",
      port: "5439",
      database: "warehouse",
      username: "analytics_user",
      ssl: true,
    },
  },
  {
    id: "ds-db-06",
    name: "Data source name 10",
    type: "Database",
    connector: "bigquery",
    ownership: "organizational",
    ownerUserId: "",
    status: "active",
    contentSummary: {
      kind: "database",
      projectId: "luxia-analytics",
      dataset: "core",
      username: "sa-reader@luxia-analytics.iam.gserviceaccount.com",
    },
  },
];

export const ACCESS_LEVELS: AccessLevelRecord[] = [
  {
    id: "al-analysts",
    name: "Access level name 01",
    description: "Use organizational databases and view selected documents.",
    status: "active",
    memberUserIds: ["user-02", "user-03", "user-04"],
    sourceGrants: [
      { dataSourceId: "ds-db-01", permission: "Use" },
      { dataSourceId: "ds-db-03", permission: "Use" },
      { dataSourceId: "ds-db-04", permission: "View" },
      { dataSourceId: "ds-db-05", permission: "Use" },
      { dataSourceId: "ds-db-06", permission: "View" },
      { dataSourceId: "ds-pdf-01", permission: "Use" },
      { dataSourceId: "ds-pdf-02", permission: "Use" },
      { dataSourceId: "ds-pdf-03", permission: "Use" },
      { dataSourceId: "ds-csv-01", permission: "Use" },
      { dataSourceId: "ds-csv-03", permission: "Use" },
      { dataSourceId: "ds-csv-04", permission: "Use" },
    ],
    updatedAt: "2026-07-28T14:22:00.000Z",
  },
  {
    id: "al-managers",
    name: "Access level name 02",
    description: "Manage core organizational sources used by active Projects.",
    status: "active",
    memberUserIds: ["user-01"],
    sourceGrants: [
      { dataSourceId: "ds-db-01", permission: "Manage" },
      { dataSourceId: "ds-db-03", permission: "Manage" },
      { dataSourceId: "ds-db-04", permission: "Manage" },
      { dataSourceId: "ds-db-05", permission: "Manage" },
      { dataSourceId: "ds-db-06", permission: "Manage" },
      { dataSourceId: "ds-pdf-01", permission: "Manage" },
      { dataSourceId: "ds-pdf-02", permission: "Manage" },
      { dataSourceId: "ds-pdf-03", permission: "Manage" },
      { dataSourceId: "ds-csv-01", permission: "Manage" },
      { dataSourceId: "ds-csv-03", permission: "Manage" },
      { dataSourceId: "ds-csv-04", permission: "Manage" },
    ],
    updatedAt: "2026-08-01T09:10:00.000Z",
  },
  {
    id: "al-limited-view",
    name: "Access level name 03",
    description: "View-only access for limited collaborators.",
    status: "inactive",
    memberUserIds: ["user-04"],
    sourceGrants: [{ dataSourceId: "ds-pdf-01", permission: "View" }],
    updatedAt: "2026-06-15T11:00:00.000Z",
  },
  {
    id: "al-view-only",
    name: "Access level name 04",
    description: "View metadata without Use permission on connected sources.",
    status: "active",
    memberUserIds: ["user-04"],
    sourceGrants: [
      { dataSourceId: "ds-db-02", permission: "View" },
    ],
    updatedAt: "2026-07-20T10:00:00.000Z",
  },
];

export const PROJECT_MEMBERSHIPS: ProjectMembership[] = [
  // project-01 — Owner: user-01
  {
    id: "pm-01-01",
    projectId: "project-01",
    userId: "user-01",
    projectRole: "Project Owner",
    status: "active",
    joinedOrInvitedAt: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "pm-01-02",
    projectId: "project-01",
    userId: "user-02",
    projectRole: "Project Manager",
    status: "active",
    joinedOrInvitedAt: "2026-02-14T10:30:00.000Z",
  },
  {
    id: "pm-01-03",
    projectId: "project-01",
    userId: "user-03",
    projectRole: "Analyst",
    status: "active",
    joinedOrInvitedAt: "2026-03-01T16:45:00.000Z",
  },
  {
    id: "pm-01-04",
    projectId: "project-01",
    userId: "user-04",
    projectRole: "Member",
    status: "active",
    joinedOrInvitedAt: "2026-04-20T13:15:00.000Z",
  },
  {
    id: "pm-01-05",
    projectId: "project-01",
    userId: "user-05",
    projectRole: "Analyst",
    status: "active",
    joinedOrInvitedAt: "2026-05-01T10:00:00.000Z",
  },
  // project-02 — Owner: user-03
  {
    id: "pm-02-03",
    projectId: "project-02",
    userId: "user-03",
    projectRole: "Project Owner",
    status: "active",
    joinedOrInvitedAt: "2026-01-05T09:00:00.000Z",
  },
  {
    id: "pm-02-01",
    projectId: "project-02",
    userId: "user-01",
    projectRole: "Analyst",
    status: "active",
    joinedOrInvitedAt: "2026-02-10T09:00:00.000Z",
  },
  {
    id: "pm-02-02",
    projectId: "project-02",
    userId: "user-02",
    projectRole: "Member",
    status: "active",
    joinedOrInvitedAt: "2026-04-20T13:15:00.000Z",
  },
  {
    id: "pm-02-05",
    projectId: "project-02",
    userId: "user-05",
    projectRole: "Member",
    status: "active",
    joinedOrInvitedAt: "2026-05-02T10:00:00.000Z",
  },
  // project-03 — Owner: user-02
  {
    id: "pm-03-02",
    projectId: "project-03",
    userId: "user-02",
    projectRole: "Project Owner",
    status: "active",
    joinedOrInvitedAt: "2026-02-01T09:00:00.000Z",
  },
  {
    id: "pm-03-01",
    projectId: "project-03",
    userId: "user-01",
    projectRole: "Member",
    status: "active",
    joinedOrInvitedAt: "2026-02-15T09:00:00.000Z",
  },
  {
    id: "pm-03-04",
    projectId: "project-03",
    userId: "user-04",
    projectRole: "Project Manager",
    status: "active",
    joinedOrInvitedAt: "2026-03-10T09:00:00.000Z",
  },
  {
    id: "pm-03-05",
    projectId: "project-03",
    userId: "user-05",
    projectRole: "Project Manager",
    status: "active",
    joinedOrInvitedAt: "2026-05-03T10:00:00.000Z",
  },
  // project-04 — Owner: user-04
  {
    id: "pm-04-04",
    projectId: "project-04",
    userId: "user-04",
    projectRole: "Project Owner",
    status: "active",
    joinedOrInvitedAt: "2026-02-08T09:00:00.000Z",
  },
  {
    id: "pm-04-02",
    projectId: "project-04",
    userId: "user-02",
    projectRole: "Analyst",
    status: "active",
    joinedOrInvitedAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "pm-04-03",
    projectId: "project-04",
    userId: "user-03",
    projectRole: "Project Manager",
    status: "active",
    joinedOrInvitedAt: "2026-03-12T09:00:00.000Z",
  },
  // project-05 — Owner: user-05
  {
    id: "pm-05-05",
    projectId: "project-05",
    userId: "user-05",
    projectRole: "Project Owner",
    status: "active",
    joinedOrInvitedAt: "2026-02-12T09:00:00.000Z",
  },
  {
    id: "pm-05-01",
    projectId: "project-05",
    userId: "user-01",
    projectRole: "Project Manager",
    status: "active",
    joinedOrInvitedAt: "2026-02-12T10:00:00.000Z",
  },
  {
    id: "pm-05-04",
    projectId: "project-05",
    userId: "user-04",
    projectRole: "Analyst",
    status: "active",
    joinedOrInvitedAt: "2026-03-18T09:00:00.000Z",
  },
  // project-06 — Owner: user-04
  {
    id: "pm-06-04",
    projectId: "project-06",
    userId: "user-04",
    projectRole: "Project Owner",
    status: "active",
    joinedOrInvitedAt: "2026-02-18T09:00:00.000Z",
  },
  {
    id: "pm-06-03",
    projectId: "project-06",
    userId: "user-03",
    projectRole: "Member",
    status: "active",
    joinedOrInvitedAt: "2026-05-04T10:00:00.000Z",
  },
  {
    id: "pm-06-05",
    projectId: "project-06",
    userId: "user-05",
    projectRole: "Member",
    status: "active",
    joinedOrInvitedAt: "2026-05-05T10:00:00.000Z",
  },
];

const PERMISSION_RANK: Record<AccessLevelPermission, number> = {
  View: 1,
  Use: 2,
  Manage: 3,
};

export function permissionRank(permission: AccessLevelPermission): number {
  return PERMISSION_RANK[permission];
}

export function highestPermission(
  permissions: AccessLevelPermission[],
): AccessLevelPermission | null {
  if (permissions.length === 0) return null;
  return permissions.reduce((best, current) =>
    permissionRank(current) > permissionRank(best) ? current : best,
  );
}

export function getAccessLevelById(id: string): AccessLevelRecord | undefined {
  return ACCESS_LEVELS.find((level) => level.id === id);
}

export function cloneAccessLevel(record: AccessLevelRecord): AccessLevelRecord {
  return {
    ...record,
    memberUserIds: [...record.memberUserIds],
    sourceGrants: record.sourceGrants.map((grant) => ({ ...grant })),
  };
}

let accessLevelCounter = 0;

export function buildEmptyAccessLevel(): AccessLevelRecord {
  accessLevelCounter += 1;
  return {
    id: `al-new-${Date.now()}-${accessLevelCounter}`,
    name: "",
    description: "",
    status: "active",
    memberUserIds: [],
    sourceGrants: [],
    updatedAt: new Date().toISOString(),
    isNew: true,
  };
}

/** Mutable prototype roster so invite/edit flows stay consistent with guards. */
let organizationUsersRuntime: OrganizationUser[] = ORGANIZATION_USERS.map((user) => ({
  ...user,
}));

export function getOrganizationUsers(): OrganizationUser[] {
  return organizationUsersRuntime;
}

export function setOrganizationUsersRuntime(users: OrganizationUser[]): void {
  organizationUsersRuntime = users.map((user) => ({ ...user }));
}

export function getOrganizationUserById(
  userId: string,
): OrganizationUser | undefined {
  return organizationUsersRuntime.find((user) => user.id === userId);
}

export function getDataSourceById(
  dataSourceId: string,
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
): DataSourceCatalogItem | undefined {
  return dataSources.find((source) => source.id === dataSourceId);
}

export function formatDataSourceType(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (normalized.includes("csv")) return "CSV";
  if (normalized.includes("pdf") || normalized === "file") return "File";
  if (normalized.includes("database") || normalized === "db") return "Database";
  return type;
}

export const DATA_SOURCE_CONNECTOR_LABELS: Record<string, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mssql: "Microsoft SQL Server",
  snowflake: "Snowflake",
  redshift: "Redshift",
  bigquery: "BigQuery",
  csv: "CSV",
  file: "File",
};

export function formatDataSourceConnectorLabel(
  connector: string | undefined,
): string | null {
  if (!connector) return null;
  return DATA_SOURCE_CONNECTOR_LABELS[connector] ?? connector;
}

export function isDataSourceUsable(status: DataSourceStatus | string): boolean {
  return status === "active";
}

export function getProjectMemberships(
  projectId: string,
): ProjectMembership[] {
  return PROJECT_MEMBERSHIPS.filter(
    (membership) => membership.projectId === projectId,
  );
}

export function getActiveProjectOwners(
  projectId: string,
  memberships: ProjectMembership[] = PROJECT_MEMBERSHIPS,
): ProjectMembership[] {
  return memberships.filter(
    (membership) =>
      membership.projectId === projectId
      && membership.status === "active"
      && membership.projectRole === "Project Owner",
  );
}

/** Unique Data Source IDs required by a Project via its active Constellations. */
export function getProjectRequiredDataSourceIds(projectId: string): string[] {
  const ids = new Set<string>();
  for (const item of CANONICAL_CONSTELLATIONS) {
    if (item.projectId !== projectId || item.status === "archived") continue;
    for (const sourceId of item.dataSourceIds) {
      if (sourceId) ids.add(sourceId);
    }
  }
  return [...ids];
}

export function getProjectConstellationsForAccess(projectId: string) {
  return CANONICAL_CONSTELLATIONS.filter(
    (item) => item.projectId === projectId && item.status !== "archived",
  ).map((item) => ({
    id: item.id,
    name: item.name,
    projectId: item.projectId,
    dataSourceIds: [...item.dataSourceIds],
  }));
}

export type ResolvedDataSourceAccess = {
  permission: AccessLevelPermission | null;
  accessLevelNames: string[];
  viaOwner: boolean;
  sourceStatus: DataSourceStatus | string | null;
  sourceUsable: boolean;
};

export function formatAccessLevelNames(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return names[0] ?? null;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.length} Access Levels`;
}

export function resolveUserDataSourceAccess(
  userId: string,
  dataSourceId: string,
  accessLevels: AccessLevelRecord[],
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
): ResolvedDataSourceAccess {
  const source = dataSources.find((item) => item.id === dataSourceId) ?? null;
  const sourceStatus = source?.status ?? null;
  const sourceUsable = source ? isDataSourceUsable(source.status) : false;

  // Private owner always receives Manage (including Org Admin owning their own private source).
  if (source?.ownership === "private" && source.ownerUserId === userId) {
    return {
      permission: "Manage",
      accessLevelNames: [],
      viaOwner: true,
      sourceStatus,
      sourceUsable,
    };
  }

  // Organizational sources: Org Admin has organization-level Manage.
  // Private sources: Org Admin does NOT auto-Manage — only owner or Access Level grants.
  if (
    source?.ownership === "organizational"
    && getOrganizationUserById(userId)?.orgRole === "Admin"
  ) {
    return {
      permission: "Manage",
      accessLevelNames: [],
      viaOwner: false,
      sourceStatus,
      sourceUsable,
    };
  }

  const matched: { permission: AccessLevelPermission; levelName: string }[] = [];
  for (const level of accessLevels) {
    if (level.status !== "active" || !level.memberUserIds.includes(userId)) continue;
    const grant = level.sourceGrants.find((item) => item.dataSourceId === dataSourceId);
    if (grant) {
      matched.push({ permission: grant.permission, levelName: level.name });
    }
  }

  if (matched.length === 0) {
    return {
      permission: null,
      accessLevelNames: [],
      viaOwner: false,
      sourceStatus,
      sourceUsable,
    };
  }

  const best = highestPermission(matched.map((item) => item.permission));
  const contributing = matched
    .filter((item) => item.permission === best)
    .map((item) => item.levelName);

  return {
    permission: best,
    accessLevelNames: [...new Set(contributing)],
    viaOwner: false,
    sourceStatus,
    sourceUsable,
  };
}

export type ProjectDataReadinessResult = {
  label: string;
  detail: string;
  missingSourceIds: string[];
  requiredSourceIds: string[];
};

/**
 * Project-specific readiness: required sources come from the Project's Constellations only.
 */
export function buildProjectDataReadiness(input: {
  userId: string;
  projectRole: ProjectRole;
  membershipStatus: ProjectMembership["status"];
  requiredSourceIds: string[];
  accessLevels: AccessLevelRecord[];
  dataSources?: DataSourceCatalogItem[];
}): ProjectDataReadinessResult {
  const {
    userId,
    projectRole,
    membershipStatus,
    requiredSourceIds,
    accessLevels,
    dataSources = DATA_SOURCE_CATALOG,
  } = input;

  if (membershipStatus === "pending") {
    return {
      label: "Pending invitation",
      detail: "Project access starts after the invitation is accepted.",
      missingSourceIds: [],
      requiredSourceIds,
    };
  }

  if (requiredSourceIds.length === 0) {
    return {
      label: "No connected Data Sources",
      detail: "This Project has no Data Sources connected through Constellations yet.",
      missingSourceIds: [],
      requiredSourceIds,
    };
  }

  const missingSourceIds: string[] = [];
  let viewOnlyCount = 0;
  let inactiveCount = 0;

  for (const sourceId of requiredSourceIds) {
    const resolved = resolveUserDataSourceAccess(
      userId,
      sourceId,
      accessLevels,
      dataSources,
    );
    if (!resolved.sourceUsable) {
      inactiveCount += 1;
      missingSourceIds.push(sourceId);
      continue;
    }
    if (!resolved.permission) {
      missingSourceIds.push(sourceId);
      continue;
    }
    if (permissionRank(resolved.permission) < permissionRank("Use")) {
      viewOnlyCount += 1;
      missingSourceIds.push(sourceId);
    }
  }

  if (missingSourceIds.length === 0) {
    return {
      label: "Ready",
      detail: `Use or Manage available for all ${requiredSourceIds.length} Project Data Sources.`,
      missingSourceIds: [],
      requiredSourceIds,
    };
  }

  if (inactiveCount > 0 && inactiveCount === missingSourceIds.length) {
    return {
      label: "Inactive Data Source",
      detail: `${inactiveCount} required Data Source${inactiveCount === 1 ? " is" : "s are"} inactive or archived.`,
      missingSourceIds,
      requiredSourceIds,
    };
  }

  if (viewOnlyCount > 0 && viewOnlyCount === missingSourceIds.length) {
    return {
      label: "Use permission needed for configuration",
      detail: `${viewOnlyCount} connected Data Source${viewOnlyCount === 1 ? "" : "s"} grant View only. Use permission is required for Data Source configuration and construction — not for basic Constellation Chat.`,
      missingSourceIds,
      requiredSourceIds,
    };
  }

  const count = missingSourceIds.length;
  return {
    label: `Missing Data Source access (${count})`,
    detail: "One or more Project-connected Data Sources are unavailable for configuration or construction. This does not block basic Chat with existing Constellations.",
    missingSourceIds,
    requiredSourceIds,
  };
}

export type AccessLevelImpactPreview = {
  dataSources: Array<{ id: string; name: string; permission: AccessLevelPermission }>;
  constellations: Array<{ id: string; name: string; projectId: string; projectName: string }>;
  projects: Array<{ id: string; name: string }>;
  members: Array<{ id: string; name: string }>;
};

export function buildAccessLevelImpactPreview(
  level: AccessLevelRecord,
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
): AccessLevelImpactPreview {
  const dataSourceRows = level.sourceGrants
    .map((grant) => {
      const source = dataSources.find((item) => item.id === grant.dataSourceId);
      if (!source) return null;
      return {
        id: source.id,
        name: source.name,
        permission: grant.permission,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const sourceIdSet = new Set(dataSourceRows.map((row) => row.id));
  const constellationMap = new Map<string, {
    id: string;
    name: string;
    projectId: string;
    projectName: string;
  }>();
  const projectMap = new Map<string, { id: string; name: string }>();

  for (const item of CANONICAL_CONSTELLATIONS) {
    if (item.status === "archived") continue;
    const usesGrant = item.dataSourceIds.some((id) => sourceIdSet.has(id));
    if (!usesGrant) continue;
    constellationMap.set(item.id, {
      id: item.id,
      name: item.name,
      projectId: item.projectId,
      projectName: getProjectNameById(item.projectId),
    });
    projectMap.set(item.projectId, {
      id: item.projectId,
      name: getProjectNameById(item.projectId),
    });
  }

  const members = level.memberUserIds
    .map((userId) => {
      const user = getOrganizationUserById(userId);
      return user ? { id: user.id, name: user.name } : null;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return {
    dataSources: dataSourceRows,
    constellations: [...constellationMap.values()],
    projects: [...projectMap.values()],
    members,
  };
}

export const PROJECT_ROLE_DEFINITIONS: {
  role: ProjectMembership["projectRole"];
  summary: string;
}[] = [
  {
    role: "Project Owner",
    summary: "Full Project control, including Delete Project and ownership transfer.",
  },
  {
    role: "Project Manager",
    summary: "Same Project operational control as Owner, except Delete Project and ownership control.",
  },
  {
    role: "Analyst",
    summary: "Chat with Project Constellations and edit Knowledge Base, Instructions, and Crawler. Cannot create Constellations or manage Project members.",
  },
  {
    role: "Member",
    summary: "Chat with Project Constellations. Cannot edit configuration or manage Project access.",
  },
];

export const INVITABLE_PROJECT_ROLES = [
  "Project Manager",
  "Analyst",
  "Member",
] as const satisfies readonly ProjectMembership["projectRole"][];
