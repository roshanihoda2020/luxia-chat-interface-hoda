import type {
  AccessLevelPermission,
  AccessLevelRecord,
  DataSourceCatalogItem,
  OrganizationUser,
  ProjectMembership,
} from "./types";

export const CURRENT_USER_ID = "user-01";

export const ORGANIZATION_USERS: OrganizationUser[] = [
  {
    id: "user-01",
    name: "Hoda Rahmani",
    email: "hoda.rahmani@luxia.example",
    orgRole: "Admin",
  },
  {
    id: "user-02",
    name: "Alex Chen",
    email: "alex.chen@luxia.example",
    orgRole: "Member",
  },
  {
    id: "user-03",
    name: "Samira Patel",
    email: "samira.patel@luxia.example",
    orgRole: "Member",
  },
  {
    id: "user-04",
    name: "Jordan Lee",
    email: "jordan.lee@luxia.example",
    orgRole: "Member",
  },
  {
    id: "user-05",
    name: "Morgan Blake",
    email: "morgan.blake@luxia.example",
    orgRole: "Admin",
  },
];

export const DATA_SOURCE_CATALOG: DataSourceCatalogItem[] = [
  {
    id: "ds-db-01",
    name: "Enterprise Warehouse",
    type: "Database",
    ownership: "organizational",
    ownerUserId: "user-01",
    ownerName: "Hoda Rahmani",
    status: "active",
  },
  {
    id: "ds-pdf-01",
    name: "Policy Documents",
    type: "PDF Library",
    ownership: "organizational",
    ownerUserId: "user-05",
    ownerName: "Morgan Blake",
    status: "active",
  },
  {
    id: "ds-csv-01",
    name: "Sales Exports",
    type: "CSV",
    ownership: "private",
    ownerUserId: "user-02",
    ownerName: "Alex Chen",
    status: "active",
  },
  {
    id: "ds-db-02",
    name: "Research Sandbox",
    type: "Database",
    ownership: "private",
    ownerUserId: "user-03",
    ownerName: "Samira Patel",
    status: "active",
  },
  {
    id: "ds-pdf-02",
    name: "Archived Reports",
    type: "PDF Library",
    ownership: "organizational",
    ownerUserId: "user-01",
    ownerName: "Hoda Rahmani",
    status: "inactive",
  },
];

export const ACCESS_LEVELS: AccessLevelRecord[] = [
  {
    id: "al-analysts",
    name: "Analysts",
    description: "Read and use organizational databases and policy documents.",
    status: "active",
    memberUserIds: ["user-02", "user-03", "user-04"],
    sourceGrants: [
      { dataSourceId: "ds-db-01", permission: "Use" },
      { dataSourceId: "ds-pdf-01", permission: "View" },
    ],
    updatedAt: "2026-07-28T14:22:00.000Z",
  },
  {
    id: "al-managers",
    name: "Data Managers",
    description: "Full manage access to core organizational sources.",
    status: "active",
    memberUserIds: ["user-01", "user-05"],
    sourceGrants: [
      { dataSourceId: "ds-db-01", permission: "Manage" },
      { dataSourceId: "ds-pdf-01", permission: "Manage" },
      { dataSourceId: "ds-pdf-02", permission: "View" },
    ],
    updatedAt: "2026-08-01T09:10:00.000Z",
  },
  {
    id: "al-guest-read",
    name: "Guest Read-only",
    description: "Limited view access for external collaborators.",
    status: "inactive",
    memberUserIds: ["user-04"],
    sourceGrants: [{ dataSourceId: "ds-pdf-01", permission: "View" }],
    updatedAt: "2026-06-15T11:00:00.000Z",
  },
];

export const PROJECT_MEMBERSHIPS: ProjectMembership[] = [
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
    projectRole: "Analyst",
    status: "active",
    joinedOrInvitedAt: "2026-02-14T10:30:00.000Z",
  },
  {
    id: "pm-01-03",
    projectId: "project-01",
    userId: "user-03",
    projectRole: "Project Manager",
    status: "active",
    joinedOrInvitedAt: "2026-03-01T16:45:00.000Z",
  },
  {
    id: "pm-01-04",
    projectId: "project-01",
    userId: "user-04",
    projectRole: "Guest",
    status: "pending",
    joinedOrInvitedAt: "2026-08-02T12:00:00.000Z",
  },
  {
    id: "pm-02-01",
    projectId: "project-02",
    userId: "user-05",
    projectRole: "Project Owner",
    status: "active",
    joinedOrInvitedAt: "2026-01-05T09:00:00.000Z",
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
    id: "pm-02-03",
    projectId: "project-02",
    userId: "user-03",
    projectRole: "Analyst",
    status: "pending",
    joinedOrInvitedAt: "2026-07-30T08:30:00.000Z",
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

export function getOrganizationUserById(
  userId: string,
): OrganizationUser | undefined {
  return ORGANIZATION_USERS.find((user) => user.id === userId);
}

export function getDataSourceById(
  dataSourceId: string,
): DataSourceCatalogItem | undefined {
  return DATA_SOURCE_CATALOG.find((source) => source.id === dataSourceId);
}

export function getProjectMemberships(
  projectId: string,
): ProjectMembership[] {
  return PROJECT_MEMBERSHIPS.filter(
    (membership) => membership.projectId === projectId,
  );
}

/** Mock dependent entities for impact previews. */
export const MOCK_ACCESS_LEVEL_IMPACT = {
  constellations: [
    { id: "const-01", name: "Revenue Insights", projectName: "Northstar Analytics" },
    { id: "const-02", name: "Policy Review", projectName: "Compliance Hub" },
  ],
  projects: [
    { id: "project-01", name: "Northstar Analytics" },
    { id: "project-02", name: "Compliance Hub" },
  ],
} as const;

export const PROJECT_ROLE_DEFINITIONS: {
  role: ProjectMembership["projectRole"];
  summary: string;
}[] = [
  {
    role: "Project Owner",
    summary: "Full project control including ownership transfer and member management.",
  },
  {
    role: "Project Manager",
    summary: "Manage project settings, members, and constellations except ownership transfer.",
  },
  {
    role: "Analyst",
    summary: "Create and edit constellations, run analyses, and view project content.",
  },
  {
    role: "Member",
    summary: "Use existing constellations and view shared project outputs.",
  },
  {
    role: "Guest",
    summary: "Limited view access to explicitly shared project areas.",
  },
];

export const INVITABLE_PROJECT_ROLES = [
  "Project Manager",
  "Analyst",
  "Member",
  "Guest",
] as const satisfies readonly ProjectMembership["projectRole"][];

export function buildSourceReadinessSummary(
  userId: string,
  accessLevels: AccessLevelRecord[],
  dataSources: DataSourceCatalogItem[],
): string {
  const userLevels = accessLevels.filter(
    (level) =>
      level.status === "active" && level.memberUserIds.includes(userId),
  );

  if (userLevels.length === 0) {
    return "No active Access Level assignments";
  }

  const grantedSourceIds = new Set<string>();
  for (const level of userLevels) {
    for (const grant of level.sourceGrants) {
      grantedSourceIds.add(grant.dataSourceId);
    }
  }

  const activeSources = dataSources.filter(
    (source) => source.status === "active",
  );
  const covered = activeSources.filter((source) =>
    grantedSourceIds.has(source.id),
  ).length;
  const privateOwned = activeSources.filter(
    (source) =>
      source.ownership === "private" && source.ownerUserId === userId,
  ).length;

  const totalReach = new Set([
    ...grantedSourceIds,
    ...activeSources
      .filter(
        (source) =>
          source.ownership === "private" && source.ownerUserId === userId,
      )
      .map((source) => source.id),
  ]).size;

  if (totalReach === 0) {
    return "No Data Source access via Access Levels";
  }

  return `${totalReach} of ${activeSources.length} active sources reachable (${covered} via Access Levels${privateOwned > 0 ? `, ${privateOwned} private owned` : ""})`;
}
