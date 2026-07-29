import type { ReactNode } from "react";
import { ChatIcon, GalaxyIcon, ProjectIcon } from "@/app/components/icons";
import { HS } from "./homeSurfaces";
import type { HomeHeroContent, HomeShortcutEntityType } from "./types";

export type HomeEntityType = "chat" | "galaxy" | "project";
export type EntityIdentityKind = HomeShortcutEntityType | HomeHeroContent["kind"];
export type EntityIdentitySize = "hero" | "standard" | "compact" | "row";

const IDENTITY_SIZE = {
  hero: { icon: 20, labelClass: "luxia-type-body-dense-strong" },
  standard: { icon: 20, labelClass: "luxia-type-caption" },
  compact: { icon: 18, labelClass: "luxia-type-caption" },
  row: { icon: 18, labelClass: "luxia-type-caption" },
} as const;

export function toEntityType(kind: EntityIdentityKind): HomeShortcutEntityType | null {
  if (kind === "galaxySession" || kind === "galaxy-conversation") return "galaxy-conversation";
  if (kind === "chat") return "chat";
  if (kind === "project") return "project";
  return null;
}

export function getEntityTypeLabel(entityType: HomeShortcutEntityType | HomeEntityType): string {
  if (entityType === "project") return "PROJECT";
  if (entityType === "chat") return "CHAT";
  return "GALAXY";
}

export function getEntityIconAccessibleName(entityType: HomeShortcutEntityType | HomeEntityType): string {
  if (entityType === "project") return "Project";
  if (entityType === "chat") return "Chat";
  return "Galaxy";
}

interface EntityIconProps {
  entityType: HomeShortcutEntityType;
  size?: number;
  color?: string;
  className?: string;
}

export function EntityIcon({
  entityType,
  size = 20,
  color = "currentColor",
  className,
}: EntityIconProps) {
  const label = getEntityIconAccessibleName(entityType);
  const style = { color };

  if (entityType === "project") {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center ${className ?? ""}`.trim()} role="img" aria-label={label}>
        <ProjectIcon size={size} style={style} />
      </span>
    );
  }
  if (entityType === "chat") {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center ${className ?? ""}`.trim()} role="img" aria-label={label}>
        <ChatIcon size={size} style={style} />
      </span>
    );
  }
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className ?? ""}`.trim()} role="img" aria-label={label}>
      <GalaxyIcon size={size} style={style} />
    </span>
  );
}

interface EntityIdentityRowProps {
  entityType: HomeShortcutEntityType;
  iconColor: string;
  tone?: "light" | "dark";
  quiet?: boolean;
  size?: EntityIdentitySize;
  iconSize?: number;
  /** When true, keep the PROJECT/CHAT/GALAXY label without a second inline icon. */
  hideIcon?: boolean;
  className?: string;
}

export function EntityIdentityRow({
  entityType,
  iconColor,
  tone = "light",
  quiet = false,
  size = "standard",
  iconSize,
  hideIcon = false,
  className = "",
}: EntityIdentityRowProps) {
  const preset = IDENTITY_SIZE[size];
  const resolvedIconSize = iconSize ?? preset.icon;
  const labelClass = preset.labelClass;
  const labelColor = tone === "dark"
    ? (quiet ? "rgba(255,255,255,0.92)" : HS.heroText)
    : iconColor;

  return (
    <div className={`flex min-w-0 items-center gap-1.5 ${className}`.trim()}>
      {!hideIcon ? (
        <EntityIcon entityType={entityType} size={resolvedIconSize} color={iconColor} />
      ) : null}
      <span
        className={`truncate ${labelClass}`}
        style={{ color: labelColor, letterSpacing: "0.06em", fontWeight: 700 }}
      >
        {getEntityTypeLabel(entityType)}
      </span>
    </div>
  );
}
