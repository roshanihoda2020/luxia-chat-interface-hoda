import { useId } from "react";
import { CircleHelp } from "lucide-react";
import {
  LuxiaGalaxyIcon,
  LuxiaSettingsIcon,
  LuxiaVirtualAssistantIcon,
} from "@/assets/icons";
import { galaxyHeliosCapabilityCount } from "@/app/features/galaxy-settings/data";
import { GALAXY_DEFAULT_INSTRUCTION } from "@/app/features/galaxy/constants";
import type { HomeProjectCard } from "@/app/features/project/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { Button } from "@/app/components/ui/button";
import { ProjectDomainMarker } from "./ProjectDomainMarker";
import { PROJECT_OVERVIEW_GALAXY_SHADOW } from "./ProjectModuleShared";

interface ProjectGalaxyCardProps {
  project: HomeProjectCard;
  /** Preserved for identity/routing; not shown on Overview in the single-Galaxy phase. */
  galaxyName: string;
  galaxyInstruction?: string;
  usableConstellationCount: number;
  onOpenGalaxy: () => void;
  onOpenGalaxySettings: () => void;
  onCreateVidget?: () => void;
  canCreateVidget?: boolean;
}

function GalaxyHeliosInfo() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Learn about Galaxy and Helios"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
              style={{ color: "rgba(198,177,245,0.72)", background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.95)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(198,177,245,0.72)";
              }}
            >
              <CircleHelp size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="luxia-type-caption">
          About Galaxy and Helios
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(100vw-2rem,19.5rem)] border p-3.5 shadow-lg"
        style={{
          background: "#241836",
          borderColor: "rgba(198,177,245,0.22)",
          color: "rgba(255,255,255,0.9)",
        }}
      >
        <p className="luxia-type-overline-data" style={{ color: "var(--luxia-purple-40)" }}>
          About Galaxy and Helios
        </p>
        <p className="mt-2 luxia-type-body-small" style={{ color: "rgba(255,255,255,0.82)" }}>
          Galaxy is configured orchestration across selected Project knowledge, instructions
          and tools. Helios manages routing and coordination within that Galaxy.
        </p>
      </PopoverContent>
    </Popover>
  );
}

function summarizeInstruction(value: string): string {
  const line = value.split("\n").map((entry) => entry.trim()).find(Boolean);
  return line ?? value;
}

function ConfigurationMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p
        className="luxia-type-overline-data"
        style={{ color: "var(--luxia-purple-40)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 luxia-type-body-default-strong"
        style={{ color: "rgba(255,255,255,0.94)" }}
      >
        {value}
      </p>
    </div>
  );
}

export function ProjectGalaxyCard({
  project: _project,
  galaxyName: _galaxyName,
  galaxyInstruction,
  usableConstellationCount,
  onOpenGalaxy,
  onOpenGalaxySettings,
  onCreateVidget,
  canCreateVidget = false,
}: ProjectGalaxyCardProps) {
  const resolvedInstruction = galaxyInstruction ?? GALAXY_DEFAULT_INSTRUCTION;
  const capabilityCount = galaxyHeliosCapabilityCount();
  const constellationValue =
    usableConstellationCount === 1
      ? "1 Constellation"
      : `${usableConstellationCount} Constellations`;
  const toolsValue =
    capabilityCount === 1 ? "1 Tool" : `${capabilityCount} Tools`;
  const actionsLabelId = useId();
  const configurationLabelId = useId();
  const showCreateVidget = Boolean(canCreateVidget && onCreateVidget);

  return (
    <section
      className="relative flex min-w-0 flex-col overflow-hidden rounded-[var(--luxia-radius-16)] px-5 py-6 sm:px-6 sm:py-7"
      style={{
        background: "var(--luxia-galaxy-hero-surface)",
        boxShadow: PROJECT_OVERVIEW_GALAXY_SHADOW,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      aria-labelledby="project-galaxy-heading"
    >
      <ProjectDomainMarker
        tone="galaxy"
        size="galaxy"
        icon={<LuxiaGalaxyIcon size={28} aria-hidden color="currentColor" />}
      />

      <div className="relative z-[2] grid min-w-0 w-full gap-7 pr-12 sm:pr-14 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start lg:gap-5 xl:gap-6 lg:pr-[4.25rem]">
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2
              id="project-galaxy-heading"
              className="luxia-type-display-h1"
              style={{ color: "var(--luxia-text-inverse)" }}
            >
              Galaxy
            </h2>
            <GalaxyHeliosInfo />
          </div>

          <p
            className="mt-3 min-w-0 luxia-type-body-large"
            style={{ color: "rgba(255,255,255,0.88)" }}
          >
            Configured orchestration across selected Project knowledge, instructions and tools.
          </p>

          <div className="mt-6 min-w-0">
            <p
              className="mb-2 luxia-type-overline-form"
              style={{ color: "var(--luxia-purple-40)" }}
            >
              Helios
            </p>
            <p
              className="luxia-type-body-default"
              style={{ color: "rgba(198,177,245,0.86)" }}
            >
              Manages routing and coordination within this Galaxy.
            </p>
          </div>

          <div className="mt-6 min-w-0">
            <p
              className="mb-2 luxia-type-overline-form"
              style={{ color: "var(--luxia-purple-40)" }}
            >
              Instruction
            </p>
            <p
              className="line-clamp-3 luxia-type-body-default-strong whitespace-pre-line"
              style={{ color: "rgba(255,255,255,0.92)", overflowWrap: "anywhere" }}
              title={resolvedInstruction}
            >
              {summarizeInstruction(resolvedInstruction)}
            </p>
          </div>

          <div
            className="mt-7 flex max-w-full flex-wrap items-center gap-2.5"
            aria-labelledby={actionsLabelId}
          >
            <span id={actionsLabelId} className="sr-only">
              Galaxy actions
            </span>
            <Button
              type="button"
              variant="primary"
              size="compact"
              onClick={onOpenGalaxy}
              aria-label="Open Galaxy"
              className="luxia-button--on-dark h-10 min-h-10 gap-2 px-3.5"
            >
              <LuxiaGalaxyIcon size={16} aria-hidden color="currentColor" />
              Open Galaxy
            </Button>

            {showCreateVidget ? (
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={onCreateVidget}
                aria-label="Create Vidget"
                className="luxia-button--on-dark h-10 min-h-10 gap-2 px-3.5"
              >
                <LuxiaVirtualAssistantIcon size={16} aria-hidden color="currentColor" />
                Create Vidget
              </Button>
            ) : null}

            <Button
              type="button"
              variant="secondary"
              size="compact"
              onClick={onOpenGalaxySettings}
              aria-label="Galaxy Settings"
              className="luxia-button--on-dark h-10 min-h-10 gap-2 px-3.5"
            >
              <LuxiaSettingsIcon size={16} aria-hidden color="currentColor" />
              Settings
            </Button>
          </div>
        </div>

        <aside
          className="min-w-0 border-t pt-6 lg:border-t-0 lg:pt-12 lg:pl-1"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
          aria-labelledby={configurationLabelId}
        >
          <p
            id={configurationLabelId}
            className="mb-3.5 luxia-type-overline-form"
            style={{ color: "var(--luxia-purple-40)" }}
          >
            Configuration
          </p>
          <div className="flex flex-col gap-3.5">
            <ConfigurationMetric
              label="Knowledge scope"
              value={constellationValue}
            />
            <ConfigurationMetric
              label="Capabilities"
              value={toolsValue}
            />
            <ConfigurationMetric
              label="Routing"
              value="Best-match"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
