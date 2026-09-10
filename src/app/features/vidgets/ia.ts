export type VidgetSettingsSectionId =
  | "general"
  | "knowledge"
  | "interface"
  | "publish";

export const VIDGET_SETTINGS_SECTIONS: {
  id: VidgetSettingsSectionId;
  label: string;
}[] = [
  { id: "general", label: "General" },
  { id: "knowledge", label: "Knowledge" },
  { id: "interface", label: "Interface" },
  { id: "publish", label: "Publish" },
];

export type VidgetsCollectionViewId = "all" | "inbox";

export const VIDGETS_COLLECTION_VIEWS: {
  id: VidgetsCollectionViewId;
  label: string;
}[] = [
  { id: "all", label: "All Vidgets" },
  { id: "inbox", label: "Inbox" },
];

export const VIDGETS_GUIDANCE = {
  listPageDescription:
    "Create and manage AI experiences connected to this Project.",
  listPageRule:
    "A Vidget uses this Project’s Galaxy or one Constellation as its AI source.",
  settingsPageDescription:
    "Configure how this external Luxia experience looks and behaves.",
  inboxPageDescription:
    "Review, share, and refine Vidget conversations.",
  pageVariant: "wide" as const,
  listPageVariant: "standard" as const,
} as const;

const LEGACY_TAB_ALIASES: Record<string, VidgetSettingsSectionId> = {
  appearance: "interface",
  experience: "interface",
};

export function parseVidgetSettingsTabFromSearch(
  search: string,
): VidgetSettingsSectionId {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const tab = params.get("tab");
  if (
    tab === "general"
    || tab === "knowledge"
    || tab === "interface"
    || tab === "publish"
  ) {
    return tab;
  }
  if (tab && LEGACY_TAB_ALIASES[tab]) {
    return LEGACY_TAB_ALIASES[tab];
  }
  return "general";
}

export function vidgetSettingsSectionToTab(section: VidgetSettingsSectionId): string {
  return section;
}

export function normalizeVidgetSettingsSection(
  section: string | null | undefined,
): VidgetSettingsSectionId {
  if (
    section === "general"
    || section === "knowledge"
    || section === "interface"
    || section === "publish"
  ) {
    return section;
  }
  if (section && LEGACY_TAB_ALIASES[section]) {
    return LEGACY_TAB_ALIASES[section];
  }
  return "general";
}
