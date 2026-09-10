export type PersonalSettingsSectionId = "profile" | "my-data";

export type OrganizationSettingsSectionId =
  | "general"
  | "members"
  | "access-data"
  | "analytics"
  | "usage";

/** Unified account Settings dialog sections (Personal + Organization). */
export type AccountSettingsSectionId =
  | PersonalSettingsSectionId
  | OrganizationSettingsSectionId;

export interface OrganizationUsageMetrics {
  projects: number;
  users: number;
  dataSources: number;
  accessLevels: number;
  constellations: number;
  chats: number;
  dashboardOutputs: number;
  vidgets: number;
}

export const ACCOUNT_SETTINGS_DEFAULT_SECTION: AccountSettingsSectionId = "profile";

export const PERSONAL_SETTINGS_SECTIONS: readonly {
  id: PersonalSettingsSectionId;
  label: string;
}[] = [
  { id: "profile", label: "Profile" },
  { id: "my-data", label: "My Data" },
];

export const ORGANIZATION_SETTINGS_SECTIONS: readonly {
  id: OrganizationSettingsSectionId;
  label: string;
}[] = [
  { id: "general", label: "General" },
  { id: "members", label: "Members" },
  { id: "access-data", label: "Access & Data" },
  { id: "usage", label: "Usage" },
  { id: "analytics", label: "Analytics" },
];

export const ACCOUNT_SETTINGS_NAV_GROUPS: readonly {
  label: string;
  items: readonly { id: AccountSettingsSectionId; label: string }[];
}[] = [
  {
    label: "Personal",
    items: PERSONAL_SETTINGS_SECTIONS,
  },
  {
    label: "Organization",
    items: ORGANIZATION_SETTINGS_SECTIONS,
  },
];

export const ORGANIZATION_SETTINGS_GUIDANCE = {
  organizationDisplayName: "Luxia organization",
} as const;

const PERSONAL_TAB_SET = new Set<string>(["profile", "my-data"]);
const ORGANIZATION_TAB_SET = new Set<string>([
  "general",
  "members",
  "access-data",
  "usage",
  "analytics",
]);

export function getAccountSettingsNavGroups(input: {
  canViewOrganizationAnalytics: boolean;
}): Array<{
  label: string;
  items: readonly { id: AccountSettingsSectionId; label: string }[];
}> {
  return ACCOUNT_SETTINGS_NAV_GROUPS.map((group) => {
    if (group.label !== "Organization") return group;
    return {
      ...group,
      items: group.items.filter(
        (item) => item.id !== "analytics" || input.canViewOrganizationAnalytics,
      ),
    };
  });
}

export function parsePersonalSettingsTabParam(
  raw: string | null | undefined,
): PersonalSettingsSectionId {
  if (!raw || !PERSONAL_TAB_SET.has(raw)) return "profile";
  return raw as PersonalSettingsSectionId;
}

export function parseOrganizationSettingsTabParam(
  raw: string | null | undefined,
): OrganizationSettingsSectionId {
  if (!raw || !ORGANIZATION_TAB_SET.has(raw)) return "general";
  return raw as OrganizationSettingsSectionId;
}

export function parsePersonalSettingsTabFromSearch(search: string): PersonalSettingsSectionId {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(normalized);
  return parsePersonalSettingsTabParam(params.get("tab"));
}

export function parseOrganizationSettingsTabFromSearch(
  search: string,
): OrganizationSettingsSectionId {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(normalized);
  return parseOrganizationSettingsTabParam(params.get("tab"));
}

export function personalSettingsSectionToAccountSection(
  section: PersonalSettingsSectionId,
): AccountSettingsSectionId {
  return section;
}

export function organizationSettingsSectionToAccountSection(
  section: OrganizationSettingsSectionId,
): AccountSettingsSectionId {
  return section;
}
