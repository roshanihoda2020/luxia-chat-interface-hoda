import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { Check, CircleHelp, Pencil, X } from "lucide-react";
import {
  LuxiaGalaxyIcon,
  LuxiaSettingsIcon,
  LuxiaVirtualAssistantIcon,
} from "@/assets/icons";
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
  onOpenGalaxy: () => void;
  onOpenGalaxySettings: () => void;
  /** Renames the Project Galaxy (updates the Galaxy chat label). */
  onRenameGalaxy?: (name: string) => void;
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

const HELIOS_TOOL_NAMES = ["Verification", "Writing Assistant"] as const;
const HELIOS_TOOL_EXTRA_COUNT = 1;

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
    <div className="flex w-full min-w-0 flex-col items-stretch sm:w-[11.25rem] sm:items-start">
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

function DarkEditButton({
  label,
  onClick,
  buttonRef,
}: {
  label: string;
  onClick: () => void;
  buttonRef?: RefObject<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
      style={{ color: "rgba(198,177,245,0.75)", background: "transparent" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.color = "rgba(255,255,255,0.95)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "rgba(198,177,245,0.75)";
      }}
    >
      <Pencil size={14} strokeWidth={1.75} aria-hidden />
    </button>
  );
}

function DarkUtilityButton({
  label,
  onClick,
  disabled,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone: "emphasis" | "muted";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        color: tone === "emphasis" ? "var(--luxia-text-inverse)" : "rgba(198,177,245,0.75)",
        background: tone === "emphasis" ? "rgba(142,99,235,0.55)" : "transparent",
        border: tone === "emphasis" ? "1px solid rgba(198,177,245,0.35)" : "1px solid transparent",
      }}
    >
      {children}
    </button>
  );
}

function InlineNameEdit({
  value,
  onSave,
}: {
  value: string;
  onSave: (next: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [showEmptyError, setShowEmptyError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pencilRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipOutsideRef = useRef(false);
  const errorId = useId();
  const trimmed = draft.trim();
  const canSave = trimmed.length > 0;

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    function onPointerDown(event: PointerEvent) {
      if (skipOutsideRef.current) {
        skipOutsideRef.current = false;
        return;
      }
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setIsEditing(false);
      setDraft(value);
      setShowEmptyError(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isEditing, value]);

  function save() {
    if (!canSave) {
      setShowEmptyError(true);
      inputRef.current?.focus();
      return;
    }
    skipOutsideRef.current = true;
    if (trimmed !== value) onSave(trimmed);
    setIsEditing(false);
    setShowEmptyError(false);
    window.setTimeout(() => pencilRef.current?.focus(), 0);
  }

  function cancel() {
    setIsEditing(false);
    setDraft(value);
    setShowEmptyError(false);
    window.setTimeout(() => pencilRef.current?.focus(), 0);
  }

  if (isEditing) {
    return (
      <div ref={rootRef} className="w-fit max-w-full min-w-0">
        <div className="inline-flex w-fit max-w-full min-w-0 items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (showEmptyError && e.target.value.trim()) setShowEmptyError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            aria-label="Galaxy name"
            aria-invalid={showEmptyError || undefined}
            aria-describedby={showEmptyError ? errorId : undefined}
            className="min-w-0 shrink bg-transparent outline-none luxia-type-title-panel"
            style={{
              width: `min(100%, max(12rem, min(28rem, ${Math.max(draft.length, 8) + 2}ch)))`,
              border: "none",
              borderBottom: showEmptyError
                ? "2px solid var(--luxia-error)"
                : "2px solid var(--luxia-purple-40)",
              borderRadius: 0,
              paddingInline: "2px",
              color: "var(--luxia-text-inverse)",
            }}
          />
          <div className="inline-flex shrink-0 items-center gap-1">
            <DarkUtilityButton label="Save Galaxy name" onClick={save} disabled={!canSave} tone="emphasis">
              <Check size={14} strokeWidth={2} aria-hidden />
            </DarkUtilityButton>
            <DarkUtilityButton label="Cancel Galaxy rename" onClick={cancel} tone="muted">
              <X size={14} strokeWidth={2} aria-hidden />
            </DarkUtilityButton>
          </div>
        </div>
        {showEmptyError ? (
          <p id={errorId} className="mt-1 luxia-type-caption" style={{ color: "#FCA5A5" }} role="alert">
            Name cannot be empty.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="inline-flex max-w-full min-w-0 items-center gap-1.5">
      <p
        className="min-w-0 line-clamp-2 luxia-type-title-panel"
        style={{ color: "rgba(198,177,245,0.92)", overflowWrap: "anywhere" }}
        title={value}
      >
        {value}
      </p>
      <DarkEditButton
        buttonRef={pencilRef}
        label="Rename Galaxy"
        onClick={() => {
          setDraft(value);
          setShowEmptyError(false);
          setIsEditing(true);
        }}
      />
    </div>
  );
}

/**
 * Inline text edit with the pencil anchored to the content block
 * (top-right of the field), not floating between sections.
 */
function InlineTextEdit({
  value,
  onSave,
  editLabel,
  multiline = false,
  className,
  textStyle,
  maxLinesClass = "line-clamp-2",
  whitespacePreserve = false,
}: {
  value: string;
  onSave: (next: string) => void;
  editLabel: string;
  multiline?: boolean;
  className?: string;
  textStyle?: CSSProperties;
  maxLinesClass?: string;
  whitespacePreserve?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [expanded, setExpanded] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const pencilRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipOutsideRef = useRef(false);
  const trimmed = draft.trim();
  const canSave = trimmed.length > 0;
  const isLong = value.length > 120;

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const t = window.setTimeout(() => fieldRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    function onPointerDown(event: PointerEvent) {
      if (skipOutsideRef.current) {
        skipOutsideRef.current = false;
        return;
      }
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setIsEditing(false);
      setDraft(value);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isEditing, value]);

  function save() {
    if (!canSave) return;
    skipOutsideRef.current = true;
    if (trimmed !== value) onSave(trimmed);
    setIsEditing(false);
    window.setTimeout(() => pencilRef.current?.focus(), 0);
  }

  function cancel() {
    setIsEditing(false);
    setDraft(value);
    window.setTimeout(() => pencilRef.current?.focus(), 0);
  }

  if (isEditing) {
    return (
      <div ref={rootRef} className="w-full min-w-0">
        {multiline ? (
          <textarea
            ref={fieldRef as RefObject<HTMLTextAreaElement>}
            value={draft}
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                save();
              }
            }}
            aria-label={editLabel}
            className="w-full resize-none rounded-[8px] px-2.5 py-2 luxia-type-body-dense outline-none"
            style={{
              color: "var(--luxia-text-inverse)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(198,177,245,0.35)",
            }}
          />
        ) : (
          <input
            ref={fieldRef as RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            aria-label={editLabel}
            className="w-full rounded-[8px] px-2.5 py-2 luxia-type-body-dense outline-none"
            style={{
              color: "var(--luxia-text-inverse)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(198,177,245,0.35)",
            }}
          />
        )}
        <div className="mt-2 flex items-center gap-1">
          <DarkUtilityButton label="Save" onClick={save} disabled={!canSave} tone="emphasis">
            <Check size={14} strokeWidth={2} aria-hidden />
          </DarkUtilityButton>
          <DarkUtilityButton label="Cancel edit" onClick={cancel} tone="muted">
            <X size={14} strokeWidth={2} aria-hidden />
          </DarkUtilityButton>
          {multiline ? (
            <span className="ml-1 luxia-type-caption" style={{ color: "rgba(255,255,255,0.4)" }}>
              Ctrl+Enter to save
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 pr-8">
      <p
        className={`min-w-0 ${expanded ? "" : maxLinesClass} ${className ?? ""} ${
          whitespacePreserve ? "whitespace-pre-line" : ""
        }`}
        style={{ overflowWrap: "anywhere", ...textStyle }}
      >
        {value}
      </p>
      <div className="absolute top-0 right-0">
        <DarkEditButton
          buttonRef={pencilRef}
          label={editLabel}
          onClick={() => {
            setDraft(value);
            setIsEditing(true);
          }}
        />
      </div>
      {isLong && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: "var(--luxia-purple-30)" }}
        >
          Read more
        </button>
      ) : null}
      {isLong && expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-1 luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: "var(--luxia-purple-30)" }}
        >
          Show less
        </button>
      ) : null}
    </div>
  );
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

export function ProjectGalaxyCard({
  project,
  galaxyName,
  onOpenGalaxy,
  onOpenGalaxySettings,
  onRenameGalaxy,
}: ProjectGalaxyCardProps) {
  const constellationCount = project.constellationCount;
  const [instruction, setInstruction] = useState(DEFAULT_GALAXY_INSTRUCTION);
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
        {/* ~60% — Galaxy identity leads the card */}
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
            {onRenameGalaxy ? (
              <InlineNameEdit value={galaxyName} onSave={onRenameGalaxy} />
            ) : (
              <p
                className="luxia-type-title-panel"
                style={{ color: "rgba(198,177,245,0.92)", overflowWrap: "anywhere" }}
              >
                {galaxyName}
              </p>
            )}
          </div>

          {/* Instruction sits where the Galaxy description previously lived */}
          <div className="mt-4 max-w-[36rem]">
            <p
              className="mb-1.5 luxia-type-overline-data"
              style={{ color: "var(--luxia-purple-40)" }}
            >
              INSTRUCTION
            </p>
            <InlineTextEdit
              value={instruction}
              onSave={setInstruction}
              editLabel="Edit Galaxy instruction"
              multiline
              className="luxia-type-body-dense"
              textStyle={{ color: "rgba(255,255,255,0.82)" }}
              maxLinesClass="line-clamp-2"
              whitespacePreserve
            />
          </div>

          {/* Compact action family — fixed group widths, not distributed across the column */}
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
                onClick={onOpenGalaxy}
                aria-label="Open Galaxy"
                aria-describedby={openGalaxyDescId}
                className="luxia-button--on-dark w-full min-w-[9.75rem] sm:w-auto"
              >
                <LuxiaGalaxyIcon size={16} aria-hidden color="currentColor" />
                Open Galaxy
              </Button>
            </GalaxyActionGroup>

            <GalaxyActionGroup
              descriptionId={createWidgetDescId}
              helperId={createWidgetHelperId}
              description="Create an external AI assistant"
              helper="For website, totem, kiosk, or embedded experiences."
            >
              <Button
                type="button"
                variant="secondary"
                disabled
                aria-disabled="true"
                aria-label="Create Widget"
                aria-describedby={`${createWidgetDescId} ${createWidgetHelperId}`}
                className="luxia-button--on-dark w-full min-w-[9.75rem] sm:w-auto"
              >
                <LuxiaVirtualAssistantIcon size={16} aria-hidden color="currentColor" />
                Create Widget
              </Button>
            </GalaxyActionGroup>

            <GalaxyActionGroup
              descriptionId={galaxySettingsDescId}
              description="Manage Helios, Tools, and Instruction"
            >
              <Button
                type="button"
                variant="tertiary"
                onClick={onOpenGalaxySettings}
                aria-label="Open Galaxy Settings"
                aria-describedby={galaxySettingsDescId}
                className="luxia-button--on-dark w-full min-w-[9.75rem] sm:w-auto"
              >
                <LuxiaSettingsIcon size={16} aria-hidden color="currentColor" />
                Galaxy Settings
              </Button>
            </GalaxyActionGroup>
          </div>
        </div>

        {/*
          Helios is a subordinate subsection inside Galaxy — not a peer title.
          Desktop: starts lower (near Galaxy name / instruction). Mobile: stacks below.
        */}
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
              {`${constellationCount} ${constellationCount === 1 ? "Constellation" : "Constellations"}`}
            </HeliosChip>
            <HeliosChip>3 Tools</HeliosChip>
            <HeliosChip>Best-match routing</HeliosChip>
          </div>

          <div
            className="mt-4 flex flex-col gap-3"
            aria-label="Helios configuration summary"
          >
            <HeliosMetaRow label="Tools">
              <span>
                {HELIOS_TOOL_NAMES.join(" · ")}
                {` · +${HELIOS_TOOL_EXTRA_COUNT} more`}
              </span>
            </HeliosMetaRow>

            <HeliosMetaRow label="Instruction">
              Project Instruction active
            </HeliosMetaRow>

            <HeliosMetaRow label="Project access">
              {constellationCount === 1
                ? "All 1 Project Constellation"
                : `All ${constellationCount} Project Constellations`}
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
