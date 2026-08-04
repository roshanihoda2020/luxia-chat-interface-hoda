/**
 * Shared action placement + dirty-state conventions.
 * Pages should follow this model; do not invent per-page action layouts.
 */

export const LUXIA_ACTION_PLACEMENT = {
  pageHeader: {
    /** LTR cluster: secondary/tertiary/back → misc → primary → options menu */
    order: ["secondary", "actions", "primary", "options"] as const,
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
  dangerZone: {
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
    hideDangerUntilSaved: true,
    doNotAssignPlaceholderTitleBeforeCreate: true,
  },
} as const;
