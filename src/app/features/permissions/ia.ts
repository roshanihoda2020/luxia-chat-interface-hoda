/** Access Levels + Members & Roles IA: page description, compact rule, optional Help. */

export type AccessLevelEditorSectionId =
  | "general"
  | "members"
  | "sources-permissions"
  | "impact"
  | "lifecycle";

export const ACCESS_LEVEL_EDITOR_SECTIONS: {
  id: AccessLevelEditorSectionId;
  label: string;
}[] = [
  { id: "general", label: "General" },
  { id: "members", label: "Members" },
  { id: "sources-permissions", label: "Data Sources & Permissions" },
  { id: "impact", label: "Impact" },
  { id: "lifecycle", label: "Lifecycle" },
];

export const ACCESS_LEVELS_GUIDANCE = {
  listPageDescription:
    "Group members and control which Data Sources they can View, Use, or Manage.",
  listPageRule:
    "Access Levels apply to Data Sources, not Projects or Constellations.",
  editorPageDescription:
    "Choose the members and Data Source permissions included in this Access Level.",
  sourcesPermissionsDescription:
    "Select Data Sources and set one permission per source.",
  sourcesPermissionHierarchy:
    "Manage includes Use and View. Use includes View.",
  membersLabel: "Members",
  /** Groups only when a real Group selector exists; otherwise use Members. */
  useGroupsLabel: false,
  createTitle: "Create Access Level",
  createPrimaryAction: "Create Access Level",
  pageVariant: "wide" as const,
  listPageVariant: "standard" as const,
} as const;

export type ProjectMembersSectionFocus =
  | "membership"
  | "role"
  | "status"
  | "source-readiness";

export const PROJECT_MEMBERS_GUIDANCE = {
  pageDescription:
    "Manage Project membership and what each person can do inside this Project.",
  pageRule:
    "Data Source access is managed separately through Access Levels.",
  /** Do not place Data Source permission checkboxes on this page. */
  allowSourcePermissionCheckboxes: false,
  pageVariant: "standard" as const,
} as const;

export const PERMISSION_HIERARCHY_COPY = {
  manage: "Manage includes Use and View.",
  use: "Use includes View.",
  constellationAccess:
    "Effective Constellation access requires both an allowed Project role and access to connected Data Sources.",
} as const;
