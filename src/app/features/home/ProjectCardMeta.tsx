import type { ReactNode } from "react";
import { Clock, Users } from "lucide-react";
import { LuxiaConstellationIcon, LuxiaDatasourceIcon } from "@/assets/icons";
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
        background: "var(--luxia-opacity-brand-primary-04)",
      }}
      aria-label={`${count} ${label}`}
    >
      <span className="inline-flex shrink-0" style={{ color: iconColor }} aria-hidden>
        {icon}
      </span>
      <span
        className="luxia-type-body-dense-strong tabular-nums"
        style={{ color: "var(--luxia-text-primary)", fontSize: 14, lineHeight: 1.3 }}
      >
        {count}
      </span>
      <span
        className="luxia-type-body-dense"
        style={{ color: "var(--luxia-text-secondary)", fontSize: 13, lineHeight: 1.3 }}
      >
        {label}
      </span>
    </span>
  );
}

interface ProjectCardMetaProps {
  project: HomeProjectCard;
  /** Featured allows a slightly roomier stack; supporting stays compact. */
  density?: "featured" | "supporting";
}

export function ProjectCardMeta({
  project,
  density = "supporting",
}: ProjectCardMetaProps) {
  const isFeatured = density === "featured";
  const iconSize = 14;

  return (
    <div
      className={`relative z-[1] min-w-0 ${isFeatured ? "mb-4 mt-3" : "mb-3.5 mt-2.5"}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <ProjectStatGroup
          icon={<LuxiaConstellationIcon size={iconSize} />}
          iconColor="var(--luxia-purple-60)"
          count={project.constellationCount}
          singular="Constellation"
          plural="Constellations"
        />
        {typeof project.sourceCount === "number" ? (
          <ProjectStatGroup
            icon={<LuxiaDatasourceIcon size={iconSize} />}
            iconColor="var(--luxia-blue-60)"
            count={project.sourceCount}
            singular="Source"
            plural="Sources"
          />
        ) : null}
        <ProjectStatGroup
          icon={<Users size={iconSize} strokeWidth={1.75} />}
          iconColor="var(--luxia-text-muted)"
          count={project.memberCount}
          singular="member"
          plural="members"
        />
      </div>

      <p
        className="mt-1.5 inline-flex min-w-0 items-center gap-1.5 luxia-type-body-dense"
        style={{ color: "var(--luxia-text-muted)", fontSize: 13, lineHeight: 1.35 }}
        aria-label={`Updated ${project.updatedAt}`}
      >
        <Clock size={14} strokeWidth={1.75} aria-hidden className="shrink-0" />
        <span>Updated {project.updatedAt}</span>
      </p>
    </div>
  );
}
