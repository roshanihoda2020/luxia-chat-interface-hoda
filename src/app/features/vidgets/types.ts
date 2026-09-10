export type VidgetChannel = "web" | "voip" | "whatsapp";

export type VidgetSourceType = "galaxy" | "constellation";

export type VidgetStatus = "draft" | "published" | "paused";

export type VidgetWebPresentation = "embedded" | "hosted" | "totem";

export type VidgetExperienceMode = "avatar" | "voice-only" | "no-avatar";

export type VidgetPreviewDevice = "desktop" | "mobile" | "totem";

export type VidgetBubbleSize = "sm" | "md" | "lg";

/**
 * Vidget intelligence source:
 * - Constellation Vidget: one Constellation only (galaxyId null, scope empty)
 * - Galaxy Vidget: Project Galaxy orchestrator + one or more scoped Constellations
 */
export interface VidgetRecord {
  id: string;
  projectId: string;
  name: string;
  channel: VidgetChannel;
  sourceType: VidgetSourceType;
  galaxyId: string | null;
  constellationId: string | null;
  galaxyConstellationIds: string[];
  status: VidgetStatus;
  updatedAt: string;
  assistantName: string;
  language: string;
  welcomeMessage: string;
  themeId: string;
  avatarId: string;
  experienceMode: VidgetExperienceMode;
  microphoneEnabled: boolean;
  chatHistoryEnabled: boolean;
  qrEnabled: boolean;
  bubbleSize: VidgetBubbleSize;
  tooltipText: string;
  webPresentation: VidgetWebPresentation;
  companyLogoName: string | null;
  backgroundImageName: string | null;
  chatBubbleLogoName: string | null;
  privacyPolicyFileName: string | null;
  privacyPolicyUrl: string | null;
  /** Optional Vidget-specific presentation behavior — does not overwrite source instructions. */
  vidgetInstruction: string;
  hostedUrl: string | null;
  embedSnippet: string | null;
  lastPublishedAt: string | null;
}

export type VidgetCreateSourcePreset =
  | { kind: "choose" }
  | { kind: "galaxy"; galaxyId?: string }
  | { kind: "constellation"; constellationId: string };

export interface VidgetCreateDraft {
  name: string;
  sourceType: VidgetSourceType;
  galaxyId: string | null;
  constellationId: string | null;
  galaxyConstellationIds: string[];
  channel: VidgetChannel;
}

export const VIDGET_CHANNEL_LABELS: Record<VidgetChannel, string> = {
  web: "Landing Page",
  voip: "VoIP",
  whatsapp: "WhatsApp",
};

export const VIDGET_CHANNEL_GROUP_LABELS: Record<VidgetChannel, string> = {
  web: "Web",
  voip: "Voice",
  whatsapp: "Messaging",
};

export const VIDGET_STATUS_LABELS: Record<VidgetStatus, string> = {
  draft: "Draft",
  published: "Published",
  paused: "Paused",
};

export const VIDGET_WEB_PRESENTATION_LABELS: Record<VidgetWebPresentation, string> = {
  embedded: "Embedded assistant",
  hosted: "Hosted page",
  totem: "Full-screen / Totem",
};

export const VIDGET_EXPERIENCE_MODE_LABELS: Record<VidgetExperienceMode, string> = {
  avatar: "Avatar",
  "voice-only": "Voice only",
  "no-avatar": "No avatar",
};

export const VIDGET_THEMES = [
  { id: "theme-default", name: "Default" },
  { id: "theme-01", name: "Theme name 01" },
  { id: "theme-02", name: "Theme name 02" },
] as const;

export const VIDGET_AVATARS = [
  { id: "avatar-01", name: "Avatar 01", color: "#5B3FA6" },
  { id: "avatar-02", name: "Avatar 02", color: "#2F6FED" },
  { id: "avatar-03", name: "Avatar 03", color: "#0F766E" },
  { id: "avatar-04", name: "Avatar 04", color: "#B45309" },
  { id: "avatar-05", name: "Avatar 05", color: "#9F1239" },
  { id: "avatar-06", name: "Avatar 06", color: "#334155" },
] as const;

export const VIDGET_LANGUAGES = [
  "English",
  "Italian",
  "French",
  "German",
  "Spanish",
  "Arabic",
  "Chinese",
] as const;
