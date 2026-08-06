/**
 * Shared action placement + dirty-state conventions.
 * Pages should follow this model; do not invent per-page action layouts.
 */

export const LUXIA_ACTION_PLACEMENT = {
  pageHeader: {
    /**
     * LTR cluster (right-aligned): Primary → Secondary → Tertiary/misc → options.
     * Keyboard and DOM order must match this visual sequence.
     */
    order: ["primary", "secondary", "actions", "options"] as const,
    help: "tertiary",
    navigation: "secondary",
    creation: "primary",
    saveWhenDirty: "primary",
    cancelWhenDirty: "secondary",
    settings: "secondary",
    menu: "options",
  },
  sectionHeader: {
    oneSectionAction: true,
  },
  row: {
    frequentVisible: true,
    secondaryInMenu: true,
  },
  lifecycleSection: {
    destructiveBesideItem: true,
  },
} as const;

export const LUXIA_DIRTY_STATE_COPY = {
  unsaved: "Unsaved changes",
  save: "Save changes",
  cancel: "Cancel",
  leaveTitle: "Leave without saving?",
  leaveDescription: "You have unsaved changes. Leaving discards this draft for the current session.",
  saveSuccess: "Changes saved for this session (prototype).",
} as const;

export const LUXIA_CREATE_VS_EDIT = {
  accessLevel: {
    createTitle: "Create Access Level",
    createPrimary: "Create Access Level",
    hideLifecycleUntilSaved: true,
    doNotAssignPlaceholderTitleBeforeCreate: true,
  },
} as const;

/** Shared Constellation Settings / Access Level editor tab list surface. */
export const LUXIA_SETTINGS_TABLIST_CLASS =
  "luxia-settings-tablist grid h-11 w-full min-w-[44rem] grid-cols-5 gap-1 overflow-visible rounded-[var(--luxia-radius-12)] border border-[var(--luxia-settings-tablist-border)] bg-[var(--luxia-settings-tablist-bg)] p-1 text-[var(--luxia-text-primary)] sm:min-w-0";

export const LUXIA_SETTINGS_TAB_TRIGGER_CLASS =
  "box-border h-9 min-h-9 min-w-0 w-full shrink-0 justify-center gap-0 overflow-hidden rounded-[var(--luxia-radius-8)] border border-transparent px-2 py-1 luxia-type-body-small font-normal whitespace-nowrap shadow-none";

export const LUXIA_SETTINGS_TAB_PANEL_CLASS = "m-0 w-full p-0 outline-none";

/** Level-2 primary settings panel (white surface + visible border). */
export const LUXIA_SETTINGS_CONTENT_SURFACE_CLASS = "luxia-settings-content-surface";

/** Level-3 grouped section / summary shell. */
export const LUXIA_SETTINGS_SECTION_SURFACE_CLASS = "luxia-settings-section-surface";

/** Level-3 list / table container. */
export const LUXIA_SETTINGS_LIST_SURFACE_CLASS = "luxia-settings-list-surface";

/** Shared row divider for settings lists (visible against white panels). */
export const LUXIA_SETTINGS_ROW_DIVIDER = {
  borderTop: "1px solid var(--luxia-settings-row-divider)",
} as const;

/** @deprecated Prefer LUXIA_SETTINGS_CONTENT_SURFACE_CLASS */
export const LUXIA_SETTINGS_PARENT_SURFACE_STYLE = {
  background: "var(--luxia-settings-panel-bg)",
  border: "1px solid var(--luxia-settings-panel-border)",
  borderRadius: "var(--luxia-radius-12)",
  boxShadow: "var(--luxia-shadow-xs)",
  padding: "var(--luxia-spacing-24)",
  boxSizing: "border-box" as const,
} as const;