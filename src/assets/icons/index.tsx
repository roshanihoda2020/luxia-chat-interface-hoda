import type { CSSProperties, HTMLAttributes } from "react";

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

/**
 * Inline Pipeline icon — exact geometry from former Pipeline.svg.
 * Self-contained for Figma Make (no SVG URL / asset import).
 */
export function LuxiaPipelineIcon({
  size = 20,
  color,
  className,
  style,
  title,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
  role,
  ...rest
}: LuxiaIconProps) {
  const resolvedColor = color ?? style?.color ?? "currentColor";
  const isDecorative =
    ariaHidden === true || ariaHidden === "true" || (!ariaLabel && !title && !role);

  return (
    <span
      className={className}
      role={isDecorative ? undefined : (role ?? (ariaLabel || title ? "img" : undefined))}
      aria-hidden={isDecorative ? true : ariaHidden}
      aria-label={isDecorative ? undefined : ariaLabel}
      title={title}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        color: resolvedColor,
        lineHeight: 0,
        ...(style as CSSProperties | undefined),
      }}
      {...rest}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 25 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        <rect
          x="2.02"
          y="7.25"
          width="5.5"
          height="5.5"
          rx="1.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="17.48"
          y="1.65"
          width="5.5"
          height="5.5"
          rx="1.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="17.48"
          y="12.85"
          width="5.5"
          height="5.5"
          rx="1.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.52 10H12.1L17.48 4.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.1 10L17.48 15.6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
LuxiaPipelineIcon.displayName = "LuxiaPipelineIcon";

export const PipelineIcon = LuxiaPipelineIcon;

/**
 * Writing Assistant feature icon — document/page + small AI sparkle.
 * Canonical mark for Tools, page identity, and the right-side assistant panel.
 */
export function LuxiaWritingAssistantIcon({
  size = 20,
  color,
  accentColor,
  className,
  style,
  title,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
  role,
  ...rest
}: LuxiaIconProps & { accentColor?: string }) {
  const resolvedColor = color ?? style?.color ?? "currentColor";
  const sparkleColor = accentColor ?? "var(--luxia-purple-50, #8B5CF6)";
  const isDecorative =
    ariaHidden === true || ariaHidden === "true" || (!ariaLabel && !title && !role);

  return (
    <span
      className={className}
      role={isDecorative ? undefined : (role ?? (ariaLabel || title ? "img" : undefined))}
      aria-hidden={isDecorative ? true : ariaHidden}
      aria-label={isDecorative ? undefined : ariaLabel}
      title={title}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        color: resolvedColor,
        lineHeight: 0,
        ...(style as CSSProperties | undefined),
      }}
      {...rest}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Document / page */}
        <path
          d="M6.25 3.75h7.1L17.75 8.1v11.15c0 .83-.67 1.5-1.5 1.5H6.25c-.83 0-1.5-.67-1.5-1.5V5.25c0-.83.67-1.5 1.5-1.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.35 3.75V7.6c0 .55.45 1 1 1h3.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.1 12.25h6.3M8.1 15.5h4.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* AI sparkle accent (Luxia 4-point star language) */}
        <path
          d="M19.1 2.35 19.85 4.05 21.55 4.8 19.85 5.55 19.1 7.25 18.35 5.55 16.65 4.8 18.35 4.05Z"
          fill={sparkleColor}
          stroke={sparkleColor}
          strokeWidth="0.4"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
LuxiaWritingAssistantIcon.displayName = "LuxiaWritingAssistantIcon";

export const WritingAssistantIcon = LuxiaWritingAssistantIcon;

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

