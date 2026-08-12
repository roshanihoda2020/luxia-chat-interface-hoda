export type {
  VidgetBubbleSize,
  VidgetChannel,
  VidgetCreateDraft,
  VidgetCreateSourcePreset,
  VidgetExperienceMode,
  VidgetPreviewDevice,
  VidgetRecord,
  VidgetSourceType,
  VidgetStatus,
  VidgetWebPresentation,
} from "./types";
export {
  VIDGET_AVATARS,
  VIDGET_CHANNEL_GROUP_LABELS,
  VIDGET_CHANNEL_LABELS,
  VIDGET_EXPERIENCE_MODE_LABELS,
  VIDGET_LANGUAGES,
  VIDGET_STATUS_LABELS,
  VIDGET_THEMES,
  VIDGET_WEB_PRESENTATION_LABELS,
} from "./types";

export {
  SEED_VIDGETS,
  VIDGET_SOURCE_UNAVAILABLE_LABEL,
  buildEmptyVidget,
  cloneVidget,
  formatVidgetUpdatedAt,
  getVidgetById,
  getVidgetForProject,
  getVidgetsForProject,
  isValidVidgetSource,
  normalizeVidgetSource,
  normalizeGalaxyConstellationIds,
  resolveVidgetSourceDisplay,
  withLockedVidgetSource,
  duplicateVidget,
  buildVidgetDeploymentFields,
  applyVidgetWebPublish,
  isVidgetDeploymentActive,
  validateVidgetScopeForProject,
  resolveVidgetCreateSource,
  galaxyConstellationIdsEqual,
  applyVidgetChannelChange,
  isVidgetChannelDeploymentReady,
} from "./data";
export type { VidgetSourceContext, VidgetSourceDisplay, VidgetScopeItem, VidgetCreateSourceInput, VidgetCreateSourceContext } from "./data";

export {
  VIDGET_MANAGE_DENIED_MESSAGE,
  canManageVidgets,
} from "./access";

export {
  VIDGETS_GUIDANCE,
  VIDGET_SETTINGS_SECTIONS,
  parseVidgetSettingsTabFromSearch,
  vidgetSettingsSectionToTab,
  normalizeVidgetSettingsSection,
} from "./ia";
export type { VidgetSettingsSectionId } from "./ia";

export { VidgetsPage } from "./VidgetsPage";
export type { VidgetsPageProps } from "./VidgetsPage";

export { VidgetSettingsPage } from "./VidgetSettingsPage";
export type { VidgetSettingsPageProps } from "./VidgetSettingsPage";

export { CreateVidgetDialog } from "./CreateVidgetDialog";
export type {
  CreateVidgetDialogProps,
  CreateVidgetSubmitPayload,
} from "./CreateVidgetDialog";

export { VidgetLivePreview } from "./VidgetLivePreview";
