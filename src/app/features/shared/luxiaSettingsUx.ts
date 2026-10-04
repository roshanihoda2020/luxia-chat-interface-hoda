/**
 * Shared action placement + dirty-state conventions.
 * Pages should follow this model; do not invent per-page action layouts.
 *
 * ## Luxia Button & Action Placement Standard (validated)
 *
 * PAGE HEADER — identity, breadcrumb, metadata, page/entity/NAVIGATION actions only.
 *   Do not put section FORM Save/Cancel in the page header when the Settings surface
 *   uses per-tab FORM drafts (Galaxy, Constellation General).
 *
 * SETTINGS FORM (FORM_DRAFT) — Cancel | Save changes inside the Settings content frame
 *   (bottom-right of the current form section). Save primary, rightmost.
 *
 * SETTINGS MANAGER (IMMEDIATE) — row/section item actions; no redundant global Save.
 *
 * READ_ONLY — no Save/Cancel.
 *
 * DANGER / LIFECYCLE — destructive beside item + confirm dialog.
 *
 * CREATION FLOW — Exit / Previous / Next / Create in flow footer (not Settings Save).
 *
 * DIALOG — Cancel | Confirm (confirm/destructive rightmost).
 *
 * SIDEBAR — navigation/disclosure only.
 *
 * EXCEPTION — Access Level editor historically used header Save/Cancel for a
 *   multi-tab page draft. That exception is retired: use local LuxiaSettingsFormActions
 *   inside the Settings content frame like Galaxy / Constellation / Data Source.
 *   Nested capability managers keep content Save.
 */

export const LUXIA_ACTION_PLACEMENT = {
  pageHeader: {
    /**
     * LTR cluster (right-aligned): Primary → Secondary → Tertiary/misc → options.
     * Keyboard and DOM order must match this visual sequence.
     * Header primary is for page-scoped create/invite/nav — not Settings section Save
     * when local form actions are used.
     */
    order: ["primary", "secondary", "actions", "options"] as const,
    help: "tertiary",
    navigation: "secondary",
    creation: "primary",
    /**
     * Settings FORM drafts must use LuxiaSettingsFormActions in the content frame.
     * Do not place Save/Cancel in the page header for Settings pages.
     */
    saveWhenDirty: "never" as const,
    cancelWhenDirty: "never" as const,
    settings: "secondary",
    menu: "options",
  },
  settingsForm: {
    /** Inside Settings content frame: Cancel (when dirty) then Save (primary, rightmost). */
    order: ["cancel", "save"] as const,
    location: "contentFooter" as const,
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
  dialog: {
    order: ["cancel", "confirm"] as const,
    destructiveRightmost: true,
  },
} as const;

export const LUXIA_DIRTY_STATE_COPY = {
  unsaved: "Unsaved changes",
  save: "Save changes",
  cancel: "Cancel",
  leaveTitle: "Leave without saving?",
  leaveDescription: "You have unsaved changes. Leaving discards this draft for the current session.",
  saveSuccess: "Changes saved.",
} as const;

/**
 * Do not render “Unsaved changes” as a header row — it shifts tabs/content.
 * Prefer Cancel + enabled Save to communicate dirty state for FORM drafts.
 */
export const LUXIA_DIRTY_INLINE_STATUS_CLASS =
  "luxia-type-caption whitespace-nowrap shrink-0";

/**
 * Default FORM Save|Cancel footer for padded settings content surfaces
 * (parent already supplies horizontal + bottom inset via surface padding).
 */
export const LUXIA_SETTINGS_FORM_ACTIONS_CLASS =
  "luxia-settings-form-actions mt-6 flex min-h-10 flex-nowrap items-center justify-end gap-2 pt-4";

/**
 * Flush list/settings cards (`is-flush`) zero out surface padding, so the footer
 * must carry its own inset — match row `px-4 sm:px-5`, keep `pt-4` from the base
 * class, add bottom padding, and drop the large pre-divider `mt-6` band.
 */
export const LUXIA_SETTINGS_FORM_ACTIONS_FLUSH_CLASS =
  "luxia-settings-form-actions--flush mt-0 px-4 pb-4 sm:px-5";

export const LUXIA_CREATE_VS_EDIT = {
  accessLevel: {
    createTitle: "Create Access Level",
    createPrimary: "Create Access Level",
    hideLifecycleUntilSaved: true,
    doNotAssignPlaceholderTitleBeforeCreate: true,
  },
} as const;

export const LUXIA_SETTINGS_TABLIST_CLASS =
  "luxia-settings-tablist grid h-11 w-full min-w-[44rem] grid-cols-5 gap-1 overflow-visible rounded-[var(--luxia-radius-12)] border border-[var(--luxia-settings-tablist-border)] bg-[var(--luxia-settings-tablist-bg)] p-1 text-[var(--luxia-text-primary)] sm:min-w-0";

export const LUXIA_SETTINGS_TAB_TRIGGER_CLASS =
  "box-border h-9 min-h-9 min-w-0 w-full shrink-0 justify-center gap-0 overflow-hidden rounded-[var(--luxia-radius-8)] border border-transparent px-2 py-1 luxia-type-body-small font-normal whitespace-nowrap shadow-none";

export const LUXIA_SETTINGS_TAB_PANEL_CLASS = "m-0 w-full p-0 outline-none";

export const LUXIA_SETTINGS_CONTENT_SURFACE_CLASS = "luxia-settings-content-surface";

export const LUXIA_SETTINGS_SECTION_SURFACE_CLASS = "luxia-settings-section-surface";

export const LUXIA_SETTINGS_LIST_SURFACE_CLASS = "luxia-settings-list-surface";

export const LUXIA_SETTINGS_TABLE_SURFACE_CLASS = "luxia-settings-table-surface";

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
