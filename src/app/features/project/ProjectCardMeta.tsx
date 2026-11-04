import type { ReactNode } from "react";
import { Clock, Users } from "lucide-react";
import { LuxiaConstellationIcon, LuxiaDatasourceIcon } from "@/assets/icons";
import { LuxiaPageEntityUpdatedMeta } from "@/app/components/LuxiaPageHeader";
import { NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import type { HomeProjectCard } from "./types";

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function ProjectStatGroup({
  icon,
  iconColor,
  count,
  singular,
  plural,
}: {
  icon: ReactNode;
  iconColor: string;
  count: number;
  singular: string;
  plural: string;
}) {
  const label = pluralize(count, singular, plural);
  return (
    <span
      className="inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-[8px] px-2 py-1"
      style={{
        background: "var(--project-card-chip-bg, var(--luxia-opacity-brand-primary-04))",
      }}
      aria-label={`${count} ${label}`}
    >
      <span className="inline-flex shrink-0" style={{ color: iconColor }} aria-hidden>
        {icon}
      </span>
      <span
        className="luxia-type-body-dense-strong tabular-nums"
        style={{ color: "var(--project-card-text, var(--luxia-text-primary))", fontSize: 14, lineHeight: 1.3 }}
      >
        {count}
      </span>
      <span
        className="luxia-type-body-dense"
        style={{ color: "var(--project-card-text-secondary, var(--luxia-text-secondary))", fontSize: 13, lineHeight: 1.3 }}
      >
        {label}
      </span>
    </span>
  );
}

export function ProjectUpdatedMeta({
  updatedAt,
  className = "",
  density = "supporting",
}: {
  updatedAt: string;
  className?: string;
  density?: "featured" | "supporting";
}) {
  const isFeatured = density === "featured";

  return (
    <p
      className={`inline-flex min-w-0 shrink-0 items-center gap-1 ${
        isFeatured ? "luxia-type-body-dense" : "luxia-type-caption"
      } ${className}`}
      style={{ color: "var(--project-card-text-muted, var(--luxia-neutral-500, #64748B))" }}
      aria-label={`Updated ${updatedAt}`}
    >
      <Clock
        size={isFeatured ? 14 : 13}
        strokeWidth={1.75}
        aria-hidden="true"
        className="shrink-0"
      />
      <span className="truncate">Updated {updatedAt}</span>
    </p>
  );
}

interface ProjectCardMetaProps {
  project: HomeProjectCard;
  density?: "featured" | "supporting";
  showUpdated?: boolean;
  className?: string;
}

export function ProjectCardMeta({
  project,
  density = "supporting",
  showUpdated = true,
  className,
}: ProjectCardMetaProps) {
  const isFeatured = density === "featured";
  const iconSize = 14;
  const showViewerRole = project.viewerProjectRole !== undefined;
  const viewerRoleLabel = project.viewerProjectRole ?? NO_PROJECT_ROLE_LABEL;

  return (
    <div
      className={
        className
          ?? `relative z-[1] min-w-0 ${isFeatured ? "mb-4 mt-3" : "mb-3.5 mt-2.5"}`
      }
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <ProjectStatGroup
          icon={<LuxiaConstellationIcon size={iconSize} />}
          iconColor="var(--project-card-icon-constellation, var(--luxia-purple-60))"
          count={project.constellationCount}
          singular="Constellation"
          plural="Constellations"
        />
        <ProjectStatGroup
          icon={<LuxiaDatasourceIcon size={iconSize} />}
          iconColor="var(--project-card-icon-source, var(--luxia-blue-60))"
          count={project.sourceCount ?? 0}
          singular="Source"
          plural="Sources"
        />
        <ProjectStatGroup
          icon={<Users size={iconSize} strokeWidth={1.75} />}
          iconColor="var(--project-card-icon-members, var(--luxia-text-muted))"
          count={project.memberCount}
          singular="member"
          plural="members"
        />
        {showUpdated ? (
          <LuxiaPageEntityUpdatedMeta updatedAt={project.updatedAt} />
        ) : null}
      </div>
      {showViewerRole ? (
        <p
          className={`min-w-0 truncate ${isFeatured ? "mt-2 luxia-type-body-dense" : "mt-1.5 luxia-type-caption"}`}
          style={{ color: "var(--project-card-text-muted, var(--luxia-text-muted))" }}
          title={`Your role: ${viewerRoleLabel}`}
        >
          Your role · {viewerRoleLabel}
        </p>
      ) : null}
    </div>
  );
}

export function ProjectCardFooter({
  actions,
  updatedAt,
  density = "supporting",
}: {
  actions: ReactNode;
  updatedAt: string;
  density?: "featured" | "supporting";
}) {
  return (
    <div className="relative z-[1] mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {actions}
      </div>
      <ProjectUpdatedMeta updatedAt={updatedAt} density={density} className="ml-auto" />
    </div>
  );
}
