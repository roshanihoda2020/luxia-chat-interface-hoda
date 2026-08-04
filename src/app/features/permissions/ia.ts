/**
 * Access Levels + Members & Roles information architecture.
 * Progressive disclosure: one page description + one compact rule + optional Help drawer.
 */

export type AccessLevelEditorSectionId =
  | "general"
  | "members"
  | "sources-permissions"
  | "impact"
  | "danger";

export const ACCESS_LEVEL_EDITOR_SECTIONS: {
  id: AccessLevelEditorSectionId;
  label: string;
}[] = [
  { id: "general", label: "General" },
  { id: "members", label: "Members" },
  { id: "sources-permissions", label: "Data Sources & Permissions" },
  { id: "impact", label: "Impact" },
  { id: "danger", label: "Danger Zone" },
];

export const ACCESS_LEVELS_GUIDANCE = {
  listPageDescription: "Control Data Source access for users and groups.",
  listPageRule:
    "Access Levels apply to Data Sources only—not Project roles or Constellations.",
  editorPageDescription:
    "Define who belongs to this Access Level and which Data Source permissions they receive.",
  sourcesPermissionsDescription:
    "Select Data Sources and set one permission per source. Manage includes Use and View; Use includes View.",
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
  pageDescription: "Manage who can access this Project and what they can do.",
  pageRule:
    "Project roles control Project actions. Data Source access is managed separately.",
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
