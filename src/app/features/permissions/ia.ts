/** Access Levels + Members & Roles IA. */

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
    "Group members and control Data Source permissions.",
  editorPageDescriptionEditable:
    "Manage members and Data Source permissions.",
  editorPageDescriptionReadOnly:
    "Review members and Data Source permissions.",
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
  pageDescription: "Manage Project membership and roles.",
  /** Do not place Data Source permission checkboxes on this page. */
  allowSourcePermissionCheckboxes: false,
  pageVariant: "standard" as const,
} as const;

export const PERMISSION_HIERARCHY_COPY = {
  manage: "Manage includes Use and View.",
  use: "Use includes View.",
  constellationAccess:
    "Active Project membership makes existing Project Constellations visible and available for Chat. Data Source permissions govern the underlying Data Source, not basic Chat.",
} as const;

export const ORGANIZATION_USERS_GUIDANCE = {
  listPageDescription: "Manage organization users and review their access.",
  pageVariant: "standard" as const,
} as const;
