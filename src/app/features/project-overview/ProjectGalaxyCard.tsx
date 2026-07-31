import type { ReactNode } from "react";
import { History, Route } from "lucide-react";
import {
  LuxiaDatasourceIcon,
  LuxiaGalaxyIcon,
  LuxiaSettingsIcon,
  LuxiaVirtualAssistantIcon,
} from "@/assets/icons";
import type { HomeProjectCard } from "@/app/features/project/types";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { ProjectDomainMarker } from "./ProjectDomainMarker";

export const PROJECT_GALAXY_VALUE = "Search across Project knowledge";

export const PROJECT_GALAXY_DESCRIPTION =
  "Ask a Project-level question and let Galaxy identify the most relevant Constellation for the response.";

/**
 * Product-level capabilities. Widget creation is informational only.
 * Grid order (2-col): Source-backed | Routing / History | Widget
 */
const CAPABILITIES: { icon: ReactNode; label: string; description?: string }[] = [
  {
    icon: <LuxiaDatasourceIcon size={16} aria-hidden color="currentColor" />,
    label: "Source-backed answers",
  },
  {
    icon: <Route size={16} strokeWidth={1.75} aria-hidden />,
    label: "Auto or manual routing",
    description:
      "Let Galaxy select the most relevant Constellation automatically, or choose one manually.",
  },
  {
    icon: <History size={16} strokeWidth={1.75} aria-hidden />,
    label: "Galaxy history",
  },
  {
    icon: <LuxiaVirtualAssistantIcon size={16} aria-hidden color="currentColor" />,
    label: "Create a Galaxy Widget",
  },
];

/**
 * Galaxy card Options — visual management model only.
 * Rename / Edit details have no Overview persistence yet (no mutations).
 * Delete / Archive Galaxy omitted: every Project retains exactly one Galaxy.
 * Widget / history management omitted until those flows are implemented.
 */
const GALAXY_CARD_OPTIONS = [
  { id: "rename", label: "Rename Galaxy", disabled: true as const },
  { id: "edit-details", label: "Edit Galaxy details", disabled: true as const },
];

interface ProjectGalaxyCardProps {
  project: HomeProjectCard;
  galaxyName: string;
  lastOpened?: string;
  onOpenGalaxy: () => void;
  onOpenGalaxySettings: () => void;
}

export function ProjectGalaxyCard({
  project,
  galaxyName,
  lastOpened = "Recently",
  onOpenGalaxy,
  onOpenGalaxySettings,
}: ProjectGalaxyCardProps) {
  const constellationLabel = `${project.constellationCount} searchable ${
    project.constellationCount === 1 ? "Constellation" : "Constellations"
  }`;
  const sourceLabel =
    typeof project.sourceCount === "number"
      ? `${project.sourceCount} connected ${project.sourceCount === 1 ? "source" : "sources"}`
      : null;

  return (
    <section
      className="relative flex min-w-0 flex-col overflow-hidden rounded-[var(--luxia-radius-16)] p-5 sm:p-6"
      style={{
        background: "linear-gradient(165deg, #281B41 0%, #1C1336 100%)",
        boxShadow: "var(--luxia-galaxy-shell-shadow)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      aria-labelledby="project-galaxy-heading"
    >
      <ProjectDomainMarker
        tone="galaxy"
        size="galaxy"
        icon={<LuxiaGalaxyIcon size={28} aria-hidden color="currentColor" />}
      />

      <div
        className="absolute z-[2] flex shrink-0 items-center"
        style={{ top: 10, right: 68 }}
      >
        <LuxiaEntityOptionsMenu
          entityType="Galaxy"
          entityLabel={galaxyName}
          ariaLabel="Galaxy options"
          tone="onDark"
          items={GALAXY_CARD_OPTIONS}
        />
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
        <div className="min-w-0 pr-14 sm:pr-16">
          <p
            className="mb-2.5 luxia-type-overline-data"
            style={{ color: "var(--luxia-purple-40)" }}
          >
            GALAXY
          </p>

          <h2
            id="project-galaxy-heading"
            className="min-w-0 line-clamp-2 luxia-type-heading-h3"
            style={{ color: "var(--luxia-text-inverse)", overflowWrap: "anywhere" }}
            title={galaxyName}
          >
            {galaxyName}
          </h2>

          <p
            className="mt-2.5 luxia-type-title-panel"
            style={{ color: "var(--luxia-purple-20)", overflowWrap: "anywhere" }}
          >
            {PROJECT_GALAXY_VALUE}
          </p>

          <p
            className="mt-2 max-w-[42rem] luxia-type-body-dense"
            style={{ color: "rgba(198,177,245,0.88)", overflowWrap: "anywhere" }}
          >
            {PROJECT_GALAXY_DESCRIPTION}
          </p>

          <div className="mt-5">
            <p
              className="mb-2 luxia-type-overline-data"
              style={{ color: "rgba(198,177,245,0.55)" }}
            >
              Capabilities
            </p>
            <ul
              className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2"
              aria-label="Galaxy capabilities"
            >
              {CAPABILITIES.map((item) => (
                <li
                  key={item.label}
                  className="inline-flex min-w-0 items-center gap-2 luxia-type-caption"
                  style={{ color: "rgba(255,255,255,0.78)" }}
                  title={item.description}
                >
                  <span
                    className="inline-flex shrink-0"
                    style={{ color: "var(--luxia-purple-30)" }}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    {item.label}
                    {item.description ? (
                      <span className="sr-only">. {item.description}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="flex min-w-0 flex-col border-t pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div>
            <p
              className="mb-2 luxia-type-overline-data"
              style={{ color: "rgba(198,177,245,0.55)" }}
            >
              Project scope
            </p>
            <div className="space-y-1.5">
              <p className="luxia-type-caption" style={{ color: "rgba(255,255,255,0.68)" }}>
                {project.name}
              </p>
              <p className="luxia-type-caption" style={{ color: "rgba(255,255,255,0.62)" }}>
                {constellationLabel}
              </p>
              {sourceLabel ? (
                <p className="luxia-type-caption" style={{ color: "rgba(255,255,255,0.58)" }}>
                  {sourceLabel}
                </p>
              ) : null}
              <p className="luxia-type-caption" style={{ color: "rgba(255,255,255,0.52)" }}>
                Last opened {lastOpened}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p
              className="mb-1.5 luxia-type-overline-data"
              style={{ color: "rgba(198,177,245,0.55)" }}
            >
              Open and configure
            </p>
            <p
              className="mb-3 luxia-type-caption"
              style={{ color: "rgba(255,255,255,0.58)" }}
            >
              Open the Project-level Chat or configure Galaxy.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenGalaxy}
                aria-label={`Open Galaxy for ${project.name}`}
                className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[8px] px-4 luxia-type-body-dense-strong outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                style={{
                  color: "var(--luxia-text-inverse)",
                  background: "linear-gradient(87.081deg, #30214E 45.623%, #8E63EB 112.38%)",
                  boxShadow: "var(--luxia-shadow-sm)",
                  border: "1px solid rgba(198,177,245,0.28)",
                }}
              >
                <LuxiaGalaxyIcon size={16} aria-hidden color="currentColor" />
                Open Galaxy
              </button>

              <button
                type="button"
                onClick={onOpenGalaxySettings}
                aria-label={`Open Galaxy Settings for ${project.name}`}
                className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[8px] px-3 luxia-type-body-dense-strong outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                style={{
                  color: "rgba(198,177,245,0.95)",
                  background: "transparent",
                  border: "1px solid rgba(198,177,245,0.36)",
                }}
              >
                <LuxiaSettingsIcon size={16} aria-hidden color="currentColor" />
                Galaxy Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
