import type { CSSProperties, HTMLAttributes } from "react";

/**
 * Canonical Luxia icons — imports SVG files from this folder by exact filename.
 */
import aiUrl from "./Ai.svg";
import arrowRightUrl from "./arrow-right.svg";
import chatUrl from "./chat.svg";
import constellationUrl from "./constellation.svg";
import dashboardUrl from "./Dashboard.svg";
import datasourceUrl from "./Datasource.svg";
import galaxyUrl from "./Galaxy.svg";
import homePageUrl from "./Home page.svg";
import notificationsUrl from "./Notifications.svg";
import projectsUrl from "./Projects.svg";
import settingsUrl from "./Settings.svg";
import supportUrl from "./Support.svg";
import toolsGalleryUrl from "./Tools gallery.svg";
import userPermissionsUrl from "./User & permission.svg";
import virtualAssistantUrl from "./Virtual assisstance.svg";

export interface LuxiaIconProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color" | "children"> {
  size?: number;
  /** Lucide-compatible color prop for shared call sites. */
  color?: string;
  title?: string;
}

function LuxiaIcon({
  src,
  size = 20,
  color,
  className,
  style,
  title,
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  role,
  ...rest
}: LuxiaIconProps & { src: string }) {
  const resolvedColor = color ?? style?.color ?? "currentColor";
  const isDecorative = ariaHidden === true || ariaHidden === "true" || (!ariaLabel && !title && !role);

  return (
    <span
      className={className}
      role={isDecorative ? undefined : (role ?? (ariaLabel || title ? "img" : undefined))}
      aria-hidden={isDecorative ? true : ariaHidden}
      aria-label={isDecorative ? undefined : ariaLabel}
      title={title}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: resolvedColor,
        color: resolvedColor,
        maskImage: `url("${src}")`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url("${src}")`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        ...(style as CSSProperties | undefined),
      }}
      {...rest}
    />
  );
}

function createLuxiaIcon(src: string, displayName: string) {
  function Icon(props: LuxiaIconProps) {
    return <LuxiaIcon src={src} aria-hidden {...props} />;
  }
  Icon.displayName = displayName;
  return Icon;
}

export const LuxiaHomeIcon = createLuxiaIcon(homePageUrl, "LuxiaHomeIcon");
export const LuxiaNotificationsIcon = createLuxiaIcon(notificationsUrl, "LuxiaNotificationsIcon");
export const LuxiaProjectsIcon = createLuxiaIcon(projectsUrl, "LuxiaProjectsIcon");
export const LuxiaSettingsIcon = createLuxiaIcon(settingsUrl, "LuxiaSettingsIcon");
export const LuxiaSupportIcon = createLuxiaIcon(supportUrl, "LuxiaSupportIcon");
export const LuxiaToolsGalleryIcon = createLuxiaIcon(toolsGalleryUrl, "LuxiaToolsGalleryIcon");
export const LuxiaUserPermissionsIcon = createLuxiaIcon(userPermissionsUrl, "LuxiaUserPermissionsIcon");
export const LuxiaVirtualAssistantIcon = createLuxiaIcon(virtualAssistantUrl, "LuxiaVirtualAssistantIcon");
export const LuxiaAiIcon = createLuxiaIcon(aiUrl, "LuxiaAiIcon");
export const LuxiaArrowRightIcon = createLuxiaIcon(arrowRightUrl, "LuxiaArrowRightIcon");
export const LuxiaChatIcon = createLuxiaIcon(chatUrl, "LuxiaChatIcon");
export const LuxiaConstellationIcon = createLuxiaIcon(constellationUrl, "LuxiaConstellationIcon");
export const LuxiaGalaxyIcon = createLuxiaIcon(galaxyUrl, "LuxiaGalaxyIcon");
export const LuxiaDashboardIcon = createLuxiaIcon(dashboardUrl, "LuxiaDashboardIcon");
export const LuxiaDatasourceIcon = createLuxiaIcon(datasourceUrl, "LuxiaDatasourceIcon");

export const LUXIA_ICON_URLS = {
  ai: aiUrl,
  arrowRight: arrowRightUrl,
  chat: chatUrl,
  constellation: constellationUrl,
  dashboard: dashboardUrl,
  datasource: datasourceUrl,
  galaxy: galaxyUrl,
  homePage: homePageUrl,
  notifications: notificationsUrl,
  projects: projectsUrl,
  settings: settingsUrl,
  support: supportUrl,
  toolsGallery: toolsGalleryUrl,
  userPermissions: userPermissionsUrl,
  virtualAssistant: virtualAssistantUrl,
} as const;
