import {
  useId,
  type ReactNode,
} from "react";
import { CircleHelp } from "lucide-react";
import {
  LuxiaGalaxyIcon,
  LuxiaSettingsIcon,
  LuxiaVirtualAssistantIcon,
} from "@/assets/icons";
import {
  galaxyHeliosCapabilityCount,
  galaxyHeliosCapabilityLabels,
} from "@/app/features/galaxy-settings/data";
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

const DEFAULT_GALAXY_INSTRUCTION =
  "Answer using approved Project knowledge and route each request to the most relevant Constellation.";

interface ProjectGalaxyCardProps {
  project: HomeProjectCard;
  galaxyName: string;
  galaxyInstruction?: string;
  usableConstellationCount: number;
  onOpenGalaxy: () => void;
  onOpenGalaxySettings: () => void;
}

function HeliosChip({ children }: { children: string }) {
  return (
    <span
      className="inline-flex h-6 items-center rounded-[6px] px-2 luxia-type-caption"
      style={{
        color: "rgba(255,255,255,0.82)",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      {children}
    </span>
  );
}

function HeliosMetaRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p
        className="luxia-type-overline-data"
        style={{ color: "var(--luxia-purple-40)" }}
      >
        {label}
      </p>
      <div
        className="mt-1 luxia-type-caption"
        style={{ color: "rgba(255,255,255,0.82)", overflowWrap: "anywhere" }}
      >
        {children}
      </div>
    </div>
  );
}

function GalaxyActionGroup({
  descriptionId,
  helperId,
  description,
  helper,
  children,
}: {
  descriptionId: string;
  helperId?: string;
  description: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col items-stretch sm:w-[11.5rem] sm:items-stretch">
      {children}
      <p
        id={descriptionId}
        className="mt-2 luxia-type-caption"
        style={{ color: "rgba(198,177,245,0.72)", overflowWrap: "anywhere" }}
      >
        {description}
      </p>
      {helper ? (
        <p
          id={helperId}
          className="mt-1 luxia-type-caption"
          style={{ color: "rgba(198,177,245,0.48)", overflowWrap: "anywhere" }}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

const GALAXY_ACTION_BUTTON_CLASS =
  "luxia-button--on-dark h-10 min-h-10 w-full justify-center gap-2 px-3.5";

function GalaxyHeliosInfo() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Learn about Galaxy and Helios"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
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
              <CircleHelp size={16} strokeWidth={1.75} aria-hidden />
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
        <p className="mt-2 luxia-type-caption" style={{ color: "rgba(255,255,255,0.82)" }}>
          Galaxy is the Project-level intelligence layer that helps users work across the
          Project’s Constellations and knowledge.
        </p>
        <p className="mt-2 luxia-type-caption" style={{ color: "rgba(255,255,255,0.82)" }}>
          Helios is the single orchestrator inside Galaxy. It uses the Project’s Constellations,
          Tools, and Instructions to decide how requests should be handled and how answers
          should be produced.
        </p>
      </PopoverContent>
    </Popover>
  );
}

function summarizeInstruction(value: string): string {
  const line = value.split("\n").map((entry) => entry.trim()).find(Boolean);
  return line ?? value;
}

export function ProjectGalaxyCard({
  project: _project,
  galaxyName,
  galaxyInstruction,
  usableConstellationCount,
  onOpenGalaxy,
  onOpenGalaxySettings,
}: ProjectGalaxyCardProps) {
  const resolvedInstruction = galaxyInstruction ?? DEFAULT_GALAXY_INSTRUCTION;
  const capabilityCount = galaxyHeliosCapabilityCount();
  const capabilityLabels = galaxyHeliosCapabilityLabels();
  const openGalaxyDescId = useId();
  const createWidgetDescId = useId();
  const createWidgetHelperId = useId();
  const galaxySettingsDescId = useId();

  return (
    <section
      className="relative flex min-w-0 flex-col overflow-hidden rounded-[var(--luxia-radius-16)] p-5 sm:p-5 lg:p-5"
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

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col pr-14 sm:pr-16">
          <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-1">
            <h2
              id="project-galaxy-heading"
              className="luxia-type-heading-h3"
              style={{ color: "var(--luxia-text-inverse)" }}
            >
              Galaxy
            </h2>
            <GalaxyHeliosInfo />
          </div>

          <div className="mt-3 min-h-7 min-w-0">
            <p
              className="luxia-type-title-panel"
              style={{ color: "rgba(198,177,245,0.92)", overflowWrap: "anywhere" }}
            >
              {galaxyName}
            </p>
          </div>

          <div className="mt-4 max-w-[36rem]">
            <p
              className="mb-1.5 luxia-type-overline-data"
              style={{ color: "var(--luxia-purple-40)" }}
            >
              INSTRUCTION
            </p>
            <p
              className="line-clamp-2 luxia-type-body-dense whitespace-pre-line"
              style={{ color: "rgba(255,255,255,0.82)", overflowWrap: "anywhere" }}
              title={resolvedInstruction}
            >
              {summarizeInstruction(resolvedInstruction)}
            </p>
          </div>

          <div
            className="mt-5 flex max-w-full flex-wrap items-start gap-x-4 gap-y-4"
            aria-label="Galaxy actions"
          >
            <GalaxyActionGroup
              descriptionId={openGalaxyDescId}
              description="Ask across Project knowledge"
            >
              <Button
                type="button"
                variant="primary"
                size="compact"
                onClick={onOpenGalaxy}
                aria-label="Open Galaxy"
                aria-describedby={openGalaxyDescId}
                className={GALAXY_ACTION_BUTTON_CLASS}
              >
                <LuxiaGalaxyIcon size={16} aria-hidden color="currentColor" />
                Open Galaxy
              </Button>
            </GalaxyActionGroup>

            <GalaxyActionGroup
              descriptionId={createWidgetDescId}
              helperId={createWidgetHelperId}
              description="A configurable AI assistant powered by Galaxy."
              helper="For website, totem, kiosk, or embedded experiences."
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex w-full">
                    <Button
                      type="button"
                      variant="secondary"
                      size="compact"
                      disabled
                      aria-disabled="true"
                      aria-label="Create Vidget"
                      aria-describedby={`${createWidgetDescId} ${createWidgetHelperId}`}
                      className={GALAXY_ACTION_BUTTON_CLASS}
                    >
                      <LuxiaVirtualAssistantIcon size={16} aria-hidden color="currentColor" />
                      Create Vidget
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Vidget creation is not available in this prototype.
                </TooltipContent>
              </Tooltip>
            </GalaxyActionGroup>

            <GalaxyActionGroup
              descriptionId={galaxySettingsDescId}
              description="Manage Helios, Tools, and Instruction"
            >
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={onOpenGalaxySettings}
                aria-label="Galaxy Settings"
                aria-describedby={galaxySettingsDescId}
                className={GALAXY_ACTION_BUTTON_CLASS}
              >
                <LuxiaSettingsIcon size={16} aria-hidden color="currentColor" />
                Galaxy Settings
              </Button>
            </GalaxyActionGroup>
          </div>
        </div>

        <div className="flex min-w-0 flex-col pr-12 pt-1 sm:pr-14 lg:pt-7">
          <h3
            id="project-helios-heading"
            className="luxia-type-title-card"
            style={{ color: "var(--luxia-text-inverse)" }}
          >
            Helios
          </h3>

          <p
            className="mt-1 luxia-type-body-dense"
            style={{ color: "rgba(198,177,245,0.72)" }}
          >
            Project orchestrator
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Helios status">
            <HeliosChip>Active</HeliosChip>
            <HeliosChip>
              {`${usableConstellationCount} ${usableConstellationCount === 1 ? "Constellation" : "Constellations"}`}
            </HeliosChip>
            <HeliosChip>
              {`${capabilityCount} ${capabilityCount === 1 ? "Tool" : "Tools"}`}
            </HeliosChip>
            <HeliosChip>Best-match routing</HeliosChip>
          </div>

          <div
            className="mt-4 flex flex-col gap-3"
            aria-label="Helios configuration summary"
          >
            <HeliosMetaRow label="Tools">
              {capabilityLabels.join(" · ")}
            </HeliosMetaRow>

            <HeliosMetaRow label="Instruction">
              Project Instruction active
            </HeliosMetaRow>

            <HeliosMetaRow label="Project access">
              {usableConstellationCount === 0
                ? "No available Constellations"
                : usableConstellationCount === 1
                  ? "1 available Constellation"
                  : `${usableConstellationCount} available Constellations`}
            </HeliosMetaRow>
          </div>

          <p
            className="mt-3 max-w-[18rem] luxia-type-caption"
            style={{ color: "rgba(198,177,245,0.72)" }}
          >
            Routes each request to the most relevant Constellation.
          </p>
        </div>
      </div>
    </section>
  );
}
