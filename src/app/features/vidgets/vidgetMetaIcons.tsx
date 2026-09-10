import { Globe, MessageCircle, Phone } from "lucide-react";
import { LuxiaConstellationIcon, LuxiaGalaxyIcon } from "@/assets/icons";
import type { VidgetChannel, VidgetSourceType } from "./types";

export const VIDGET_CHANNEL_META_ICON_PROPS = {
  size: 14,
  "aria-hidden": true as const,
  color: "currentColor",
  className: "shrink-0",
  strokeWidth: 2,
};

export const VIDGET_SOURCE_META_ICON_PROPS = {
  size: 14,
  "aria-hidden": true as const,
  color: "currentColor",
  className: "shrink-0",
};

export function VidgetChannelMetaIcon({ channel }: { channel: VidgetChannel }) {
  switch (channel) {
    case "web":
      return <Globe {...VIDGET_CHANNEL_META_ICON_PROPS} />;
    case "whatsapp":
      return <MessageCircle {...VIDGET_CHANNEL_META_ICON_PROPS} />;
    case "voip":
      return <Phone {...VIDGET_CHANNEL_META_ICON_PROPS} />;
  }
}

export function VidgetSourceMetaIcon({ sourceType }: { sourceType: VidgetSourceType }) {
  if (sourceType === "galaxy") {
    return <LuxiaGalaxyIcon {...VIDGET_SOURCE_META_ICON_PROPS} />;
  }
  return <LuxiaConstellationIcon {...VIDGET_SOURCE_META_ICON_PROPS} />;
}
