import {
  AlignLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Crosshair,
  ExternalLink,
  FileText,
  Files,
  History,
  Pencil,
  Route,
  Search,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  GALAXY_DEFAULT_DESCRIPTION,
  GALAXY_DEFAULT_INSTRUCTION,
  GALAXY_OVERVIEW_SCOPE,
  GALAXY_PANEL_OUTER_GAP,
  GALAXY_ROUTE_RESULT_LIMIT,
  type GalaxyControlRouteOption,
  type GalaxyMatchedConstellation,
  type GalaxySessionState,
} from "./constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { IC_BTN_OPEN, IC, icHoverOff, icHoverOn, icOpenActiveOn } from "@/app/features/active-data-tables/inspectorTheme";
import { InstructionManager } from "@/app/features/instruction/InstructionManager";
import { INSTRUCTION_MAX_CHARS } from "@/app/features/instruction/constants";

export type { GalaxyControlRouteOption };

type ActivityStep = {
  title: string;
  detail: string;
  stateLabel: string;
};

const AUTO_STEPS: ActivityStep[] = [
  {
    title: "Searching",
    detail: "Scanning connected knowledge sources",
    stateLabel: "In progress",
  },
  {
    title: "Reviewing",
    detail: "Comparing candidate constellations",
    stateLabel: "In progress",
  },
  {
    title: "Comparing",
    detail: "Ranking semantic relevance across matches",
    stateLabel: "In progress",
  },
  {
    title: "Selecting",
    detail: "Choosing highest semantic match",
    stateLabel: "In progress",
  },
  {
    title: "Generating",
    detail: "Preparing final response",
    stateLabel: "In progress",
  },
];

const OUTER_GAP = GALAXY_PANEL_OUTER_GAP;
const COLLAPSE_MS = 200;
const TRANSITION = "background-color 140ms ease, box-shadow 140ms ease, opacity 140ms ease, border-color 140ms ease";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const R = {
  panel: "var(--luxia-radius-24)",
  card: 14,
  nested: 12,
  control: 10,
  chip: 8,
  badge: 5,
} as const;
const SPACE = {
  section: 22,
  sectionLoose: 26,
  cardPadX: 16,
  cardPadY: 14,
  nestPad: 14,
  labelGap: 8,
  stack: 16,
} as const;

const GC = {
  shell: "var(--luxia-galaxy-shell)",
  shellGradient: "var(--luxia-gradient-galaxy-panel)",
  shellBorder: "rgba(255, 255, 255, 0.06)",
  shellShadow: "var(--luxia-galaxy-shell-shadow)",

  header: "var(--luxia-galaxy-header)",
  headerDivider: "rgba(255, 255, 255, 0.07)",

  page: "transparent",
  card: "var(--luxia-galaxy-surface)",
  cardBorder: "rgba(255, 255, 255, 0.06)",
  cardShadow: "0 2px 8px rgba(8, 5, 18, 0.14)",
  cardShadowRaised: "0 8px 20px rgba(8, 5, 18, 0.22)",

  insightsOuter: "var(--luxia-galaxy-surface-insights)",
  insightsBorder: "rgba(142, 99, 235, 0.14)",
  insightsHeader: "var(--luxia-galaxy-surface-elevated)",
  insightsCollapsed: "var(--luxia-galaxy-surface-insights)",
  insightsHover: "var(--luxia-galaxy-surface-insights-hover)",

  routing: "var(--luxia-galaxy-surface-raised)",
  segmentTrack: "rgba(255, 255, 255, 0.06)",
  selected: "var(--luxia-purple-50)",

  trigger: "var(--luxia-galaxy-surface)",
  triggerBorder: "rgba(255, 255, 255, 0.07)",
  dropdown: "var(--luxia-galaxy-header)",
  searchField: "var(--luxia-galaxy-surface-input)",
  searchBorder: "rgba(255, 255, 255, 0.07)",
  rowHover: "rgba(255, 255, 255, 0.06)",
  rowSelected: "rgba(142, 99, 235, 0.14)",

  activity: "var(--luxia-galaxy-surface-nested)",
  activityBorder: "rgba(255, 255, 255, 0.06)",
  activityRow: "var(--luxia-galaxy-surface-raised)",
  activityRowHover: "var(--luxia-galaxy-surface-insights)",

  bestMatch: "var(--luxia-galaxy-surface-elevated)",
  bestMatchBorder: "rgba(142, 99, 235, 0.18)",
  bestMatchShadow: "0 8px 22px rgba(8, 5, 18, 0.26), 0 1px 0 rgba(255, 255, 255, 0.06) inset",

  sources: "var(--luxia-galaxy-surface-nested)",
  sourcesBorder: "rgba(255, 255, 255, 0.06)",
  sourceRowHover: "var(--luxia-galaxy-surface-raised)",

  instruction: "var(--luxia-galaxy-surface-quiet)",
  instructionBorder: "rgba(255, 255, 255, 0.08)",
  instructionShadow: "none",
  instructionTitle: "rgba(255, 255, 255, 0.92)",
  instructionIcon: "var(--luxia-purple-30)",
  instructionHelper: "rgba(255, 255, 255, 0.62)",
  instructionField: "var(--luxia-galaxy-surface-instruction-field)",
  instructionFieldBorder: "rgba(255, 255, 255, 0.09)",
  instructionFieldHoverBorder: "rgba(255, 255, 255, 0.14)",
  textarea: "var(--luxia-galaxy-surface-input)",
  textareaBorder: "rgba(255, 255, 255, 0.08)",
  textareaHoverBorder: "rgba(255, 255, 255, 0.12)",

  textPrimary: "#FFFFFF",
  textHeading: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.70)",
  textMuted: "rgba(255, 255, 255, 0.55)",
  textLabel: "rgba(255, 255, 255, 0.55)",
  textDesc: "rgba(255, 255, 255, 0.70)",
  textMeta: "rgba(255, 255, 255, 0.55)",
  textInactiveTitle: "rgba(255, 255, 255, 0.70)",
  textInactiveDesc: "rgba(255, 255, 255, 0.55)",
  textResult: "rgba(255, 255, 255, 0.92)",
  textDisabled: "var(--luxia-galaxy-disabled-text)",
  textPlaceholder: "rgba(255, 255, 255, 0.40)",
  textHelper: "rgba(255, 255, 255, 0.70)",
  textSubtitle: "rgba(150, 219, 251, 0.55)",
  textQuietTitle: "rgba(255, 255, 255, 0.70)",
  textSourceTitle: "rgba(255, 255, 255, 0.92)",
  textSourceMeta: "rgba(255, 255, 255, 0.55)",
  textSourcePages: "rgba(255, 255, 255, 0.40)",
  chevron: "rgba(255, 255, 255, 0.55)",
  iconSection: "rgba(255, 255, 255, 0.55)",
  iconSectionActive: "var(--luxia-purple-50)",
  iconSectionHover: "rgba(255, 255, 255, 0.78)",

  interactivePurple: "var(--luxia-purple-30)",
  interactiveBlue: "var(--luxia-brand-tertiary)",
  purple: "var(--luxia-purple-50)",
  success: "var(--luxia-success)",
  processing: "var(--luxia-brand-tertiary)",
  idle: "var(--luxia-purple-50)",

  pdfBadgeBg: "rgba(150, 219, 251, 0.12)",
  pdfBadgeText: "var(--luxia-brand-tertiary)",
  dbBadgeBg: "rgba(142, 99, 235, 0.14)",
  dbBadgeText: "var(--luxia-purple-20)",

  focusRing: "0 0 0 2px rgba(142, 99, 235, 0.28)",
  scrollThumb: "rgba(255, 255, 255, 0.14)",
  scrollThumbHover: "rgba(255, 255, 255, 0.22)",
  saveEnabledBg: "var(--luxia-gradient-button)",
  disabledSurface: "var(--luxia-galaxy-disabled-surface)",
  disabledBorder: "var(--luxia-galaxy-disabled-border)",
  disabledText: "var(--luxia-galaxy-disabled-text)",
  /** @deprecated use disabledSurface */
  saveDisabledBg: "var(--luxia-galaxy-disabled-surface)",
  btnSecondarySurface: "var(--luxia-galaxy-btn-secondary-surface)",
  btnSecondaryBorder: "var(--luxia-galaxy-btn-secondary-border)",
  btnSecondaryText: "var(--luxia-galaxy-btn-secondary-text)",
  btnSecondaryHover: "var(--luxia-galaxy-btn-secondary-hover)",
  hoverSurface: "rgba(255, 255, 255, 0.06)",
  hoverLift: "none",
} as const;

const GALAXY_BTN_CLASS =
  "inline-flex h-8 flex-shrink-0 items-center justify-center px-3.5 luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[rgba(142,99,235,0.35)]";
const GALAXY_BTN_RADIUS = R.control;

function galaxyActionStyle(
  variant: "primary" | "secondary",
  enabled = true,
): CSSProperties {
  const base: CSSProperties = {
    borderRadius: GALAXY_BTN_RADIUS,
    fontWeight: 500,
    boxShadow: "none",
    opacity: 1,
    filter: "none",
    transition: TRANSITION,
  };

  if (variant === "secondary") {
    return {
      ...base,
      color: GC.btnSecondaryText,
      background: GC.btnSecondarySurface,
      border: `1px solid ${GC.btnSecondaryBorder}`,
      cursor: "pointer",
    };
  }

  if (!enabled) {
    return {
      ...base,
      color: "#FFFFFF",
      background: GC.saveEnabledBg,
      border: "1px solid transparent",
      boxShadow: "var(--luxia-shadow-sm)",
      opacity: 0.48,
      cursor: "not-allowed",
    };
  }

  return {
    ...base,
    color: "#FFFFFF",
    background: GC.saveEnabledBg,
    border: "1px solid transparent",
    boxShadow: "var(--luxia-shadow-sm)",
    cursor: "pointer",
  };
}

function applyGalaxySecondaryHover(el: HTMLElement, hovering: boolean) {
  el.style.background = hovering ? GC.btnSecondaryHover : GC.btnSecondarySurface;
}

function applyGalaxyPrimaryHover(el: HTMLElement, hovering: boolean, enabled: boolean) {
  if (!enabled) {
    el.style.filter = "none";
    return;
  }
  el.style.filter = hovering ? "brightness(1.05)" : "none";
}

const SURF = {
  outer: GC.insightsOuter,
  outerBorder: GC.insightsBorder,
  header: GC.insightsHeader,
  collapsed: GC.insightsCollapsed,
  hover: GC.insightsHover,
  overview: GC.card,
  activity: GC.activity,
  activityBorder: GC.activityBorder,
  bestMatch: GC.bestMatch,
  bestMatchBorder: GC.bestMatchBorder,
  sources: GC.sources,
} as const;

function SectionLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <p
      className="flex items-center gap-1.5 luxia-type-metadata"
      style={{
        marginBottom: SPACE.labelGap,
        color: GC.textMuted,
        fontWeight: 500,
        letterSpacing: "0.06em",
        fontSize: 10,
        textTransform: "uppercase" as const,
      }}
    >
      {Icon ? (
        <Icon size={12} strokeWidth={2} aria-hidden className="flex-shrink-0" style={{ color: GC.iconSection }} />
      ) : null}
      {children}
    </p>
  );
}

function transparencySummary(
  session: GalaxySessionState,
  isManualMode: boolean,
  pendingManual: GalaxyMatchedConstellation | null,
): string {
  const routing = isManualMode
    ? (pendingManual ? `Specific · ${pendingManual.label}` : "Specific Routing")
    : "Auto Routing";

  if (session.status === "ready") return `${routing} • Ready`;
  if (session.status === "searching") return `${routing} • Searching`;
  if (session.status === "matching") return `${routing} • Matching`;
  if (session.status === "answering") return `${routing} • Answering`;
  if (session.status === "complete" && session.selected) {
    return `Best Match: ${session.selected.label}`;
  }
  return `${routing} • Ready`;
}

export function GalaxyActivityPanel({
  session,
  width,
  routeOptions,
  routeOptionsLoading = false,
  pendingManual,
  onResizeStart,
  onOpenConstellation,
  onSelectAuto,
  onSelectManual,
  onEnterSpecific,
  onClearManual,
  onCollapse,
  contentOpacity = 1,
}: {
  session: GalaxySessionState;
  width: number;
  routeOptions: GalaxyControlRouteOption[];
  routeOptionsLoading?: boolean;
  pendingManual: GalaxyMatchedConstellation | null;
  onResizeStart: (e: React.MouseEvent) => void;
  onOpenConstellation?: () => void;
  onSelectAuto: () => void;
  onSelectManual: (option: GalaxyControlRouteOption) => void;
  onEnterSpecific: () => void;
  onClearManual: () => void;
  onCollapse?: () => void;
  contentOpacity?: number;
}) {
  const [instruction, setInstruction] = useState(GALAXY_DEFAULT_INSTRUCTION);
  const [savedInstruction, setSavedInstruction] = useState(GALAXY_DEFAULT_INSTRUCTION);
  const [instructionManagerOpen, setInstructionManagerOpen] = useState(false);
  const [savedDescription, setSavedDescription] = useState(GALAXY_DEFAULT_DESCRIPTION);
  const [draftDescription, setDraftDescription] = useState(GALAXY_DEFAULT_DESCRIPTION);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionInvalid, setDescriptionInvalid] = useState(false);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  const [transparencyOpen, setTransparencyOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const activityRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);
  const instructionRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const descriptionEditRef = useRef<HTMLButtonElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const dirty = instruction !== savedInstruction;
  const instructionEditorData = useMemo(
    () => ({ text: instruction, attachment: null as null }),
    [instruction],
  );
  const descriptionDirty = draftDescription !== savedDescription;
  const descriptionCanSave = draftDescription.trim().length > 0 && descriptionDirty;
  const isManualMode = session.routeMode === "manual";
  const animMs = reduceMotion ? 0 : COLLAPSE_MS;
  const showCandidates =
    !isManualMode &&
    session.selectionSource !== "manual" &&
    session.candidates.length > 0 &&
    session.status === "matching";
  const showSelected = Boolean(session.selected) && (
    session.status === "matching" ||
    session.status === "answering" ||
    session.status === "complete"
  );
  const showSources = session.status === "complete" && session.sources.length > 0;
  const isComplete = session.status === "complete";
  const isProcessing =
    session.status === "searching" ||
    session.status === "matching" ||
    session.status === "answering";

  const filteredAll = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return routeOptions;
    return routeOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [routeOptions, query]);

  const visibleResults = useMemo(
    () => filteredAll.slice(0, GALAXY_ROUTE_RESULT_LIMIT),
    [filteredAll],
  );

  useEffect(() => {
    setFocusIndex((i) => Math.min(i, Math.max(visibleResults.length - 1, 0)));
  }, [visibleResults.length]);

  const summary = transparencySummary(session, isManualMode, pendingManual);

  useEffect(() => {
    if (!session.focusSection) return;
    if (session.focusSection !== "instruction") {
      setTransparencyOpen(true);
    }
    const map = {
      activity: activityRef,
      selected: selectedRef,
      sources: sourcesRef,
      instruction: instructionRef,
    } as const;
    const target = map[session.focusSection]?.current;
    if (!target) return;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
      target.focus?.();
    });
  }, [session.expandSignal, session.focusSection, reduceMotion]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (session.status !== "complete") setProcessOpen(false);
  }, [session.status, session.expandSignal]);

  useEffect(() => {
    if (!isManualMode) {
      setQuery("");
      setFocusIndex(0);
      return;
    }
    if (!transparencyOpen) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isManualMode, transparencyOpen]);

  useEffect(() => {
    if (!editingDescription) return;
    const frame = window.requestAnimationFrame(() => {
      const el = descriptionTextareaRef.current;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editingDescription]);

  function beginEditDescription() {
    setDraftDescription(savedDescription);
    setDescriptionInvalid(false);
    setEditingDescription(true);
  }

  function cancelDescriptionEdit() {
    setDraftDescription(savedDescription);
    setDescriptionInvalid(false);
    setEditingDescription(false);
    window.requestAnimationFrame(() => descriptionEditRef.current?.focus());
  }

  function saveDescriptionEdit() {
    const next = draftDescription.trim();
    if (!next) {
      setDescriptionInvalid(true);
      descriptionTextareaRef.current?.focus();
      return;
    }
    if (!descriptionDirty) return;
    setSavedDescription(next);
    setDraftDescription(next);
    setDescriptionInvalid(false);
    setEditingDescription(false);
    window.requestAnimationFrame(() => descriptionEditRef.current?.focus());
  }

  function cancelInstructionEdit() {
    if (!dirty || saving) return;
    setInstruction(savedInstruction);
  }

  function saveInstruction() {
    if (!dirty || saving) return;
    setSaving(true);
    window.setTimeout(() => {
      setSavedInstruction(instruction);
      setSaving(false);
    }, 400);
  }

  function handleInstructionChange(value: string) {
    if (value.length > INSTRUCTION_MAX_CHARS) return;
    setInstruction(value);
  }

  const isManualFlow = session.selectionSource === "manual";
  const steps: ActivityStep[] = isManualFlow
    ? [
        {
          title: "Searching",
          detail: `Scanning ${session.selected?.label ?? "selected constellation"}`,
          stateLabel: "In progress",
        },
        {
          title: "Generating",
          detail: "Preparing final response",
          stateLabel: "In progress",
        },
      ]
    : AUTO_STEPS;

  const activeStepIndex = (() => {
    if (session.status === "ready") return -1;
    if (isManualFlow) {
      if (session.status === "searching" || session.status === "matching") return 0;
      if (session.status === "answering") return 1;
      return steps.length - 1;
    }
    if (session.status === "searching") return 0;
    if (session.status === "matching") {
      if (session.selected || session.activityLabel.toLowerCase().includes("best")) return 3;
      if (session.candidates.length > 0) return 2;
      return 1;
    }
    if (session.status === "answering") return 4;
    return steps.length - 1;
  })();

  const showStepList = isProcessing || (isComplete && processOpen);

  return (
    <div
      className="flex h-full min-h-0 flex-shrink-0 flex-col self-stretch"
      style={{
        width: width + OUTER_GAP * 2,
        padding: OUTER_GAP,
        boxSizing: "border-box",
        opacity: contentOpacity,
        transition: "opacity 160ms ease-out",
      }}
    >
      <aside
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{
          borderRadius: R.panel,
          backgroundColor: GC.shell,
          backgroundImage: GC.shellGradient,
          border: `1px solid ${GC.shellBorder}`,
          boxShadow: GC.shellShadow,
        }}
        aria-label="Galaxy Intelligence"
        data-galaxy-panel="intelligence"
      >
        <div
          className="absolute left-0 top-0 z-20 h-full w-[5px] cursor-col-resize group"
          onMouseDown={onResizeStart}
        >
          <div className="absolute inset-y-0 left-0 w-[3px] transition-colors group-hover:bg-[var(--luxia-brand-secondary)]/20" />
        </div>

        <header
          className="flex flex-shrink-0 items-start gap-2.5 px-5"
          style={{
            paddingTop: 17,
            paddingBottom: 15,
            background: GC.header,
            borderBottom: `1px solid ${GC.headerDivider}`,
          }}
        >
          <div className="min-w-0 flex-1">
            <h2
              className="truncate luxia-type-body-dense-strong"
              data-galaxy-title="true"
              style={{ color: GC.textPrimary, fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              Galaxy Intelligence
            </h2>
            <p
              className="mt-1 truncate luxia-type-caption"
              data-galaxy-subtitle="true"
              style={{ color: GC.textSubtitle, fontWeight: 400 }}
            >
              {session.projectName} · {GALAXY_OVERVIEW_SCOPE.constellations === 1
                ? "1 constellation"
                : `${GALAXY_OVERVIEW_SCOPE.constellations} constellations`}
            </p>
          </div>
          {onCollapse ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onCollapse}
                  aria-label="Collapse sidebar"
                  aria-expanded={true}
                  className="mt-px flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] outline-none focus-visible:outline-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    color: GC.chevron,
                    transition: TRANSITION,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = GC.hoverSurface;
                    el.style.boxShadow = GC.hoverLift;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "rgba(255, 255, 255, 0.05)";
                    el.style.boxShadow = "none";
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = GC.focusRing;
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                  data-galaxy-collapse="true"
                >
                  <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">Collapse sidebar</TooltipContent>
            </Tooltip>
          ) : null}
        </header>

        <div
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 galaxy-panel-scroll"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: `${GC.scrollThumb} transparent`,
            background: GC.page,
          }}
        >
          <section
            className="group/desc pt-5"
            style={{ paddingBottom: SPACE.sectionLoose }}
            aria-label="Description"
            data-galaxy-description="true"
          >
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <AlignLeft
                  size={15}
                  strokeWidth={2}
                  aria-hidden
                  className="flex-shrink-0"
                  style={{ color: GC.iconSection }}
                />
                <h3
                  className="luxia-type-body-dense-strong"
                  style={{ color: GC.textQuietTitle, fontWeight: 500, letterSpacing: "-0.01em" }}
                >
                  Description
                </h3>
              </div>
              {!editingDescription ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      ref={descriptionEditRef}
                      type="button"
                      onClick={beginEditDescription}
                      aria-label="Edit description"
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] outline-none opacity-0 transition-opacity duration-150 group-hover/desc:opacity-100 group-focus-within/desc:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[rgba(142,99,235,0.35)]"
                      style={{
                        background: "transparent",
                        color: GC.chevron,
                        transition: TRANSITION,
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = GC.hoverSurface;
                        el.style.color = GC.iconSectionHover;
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "transparent";
                        el.style.color = GC.chevron;
                      }}
                      data-galaxy-description-edit="true"
                    >
                      <Pencil size={13} strokeWidth={2.2} aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Edit description</TooltipContent>
                </Tooltip>
              ) : null}
            </div>

            {editingDescription ? (
              <div className="flex flex-col gap-2.5">
                <textarea
                  ref={descriptionTextareaRef}
                  id="galaxy-description-field"
                  value={draftDescription}
                  onChange={(e) => {
                    setDraftDescription(e.target.value);
                    if (descriptionInvalid && e.target.value.trim()) setDescriptionInvalid(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelDescriptionEdit();
                      return;
                    }
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      saveDescriptionEdit();
                    }
                  }}
                  rows={3}
                  aria-label="Galaxy description"
                  aria-invalid={descriptionInvalid}
                  aria-describedby={descriptionInvalid ? "galaxy-description-error" : undefined}
                  className="w-full resize-none overflow-y-auto p-3 outline-none luxia-type-caption focus:outline-none focus-visible:outline-none galaxy-panel-scroll"
                  style={{
                    minHeight: 72,
                    maxHeight: 112,
                    color: GC.textResult,
                    fontWeight: 400,
                    lineHeight: 1.55,
                    background: GC.textarea,
                    borderRadius: R.nested,
                    border: `1px solid ${descriptionInvalid ? "rgba(247, 80, 80, 0.55)" : GC.purple}`,
                    boxShadow: descriptionInvalid ? "none" : GC.focusRing,
                    scrollbarWidth: "thin",
                    scrollbarColor: `${GC.scrollThumb} transparent`,
                    transition: TRANSITION,
                  }}
                  data-galaxy-description-input="true"
                />
                {descriptionInvalid ? (
                  <p
                    id="galaxy-description-error"
                    className="luxia-type-caption"
                    role="alert"
                    style={{ color: "rgba(247, 80, 80, 0.9)", fontWeight: 400 }}
                  >
                    Enter a short description to save.
                  </p>
                ) : null}
                <div className="flex items-center justify-end gap-2">
                  {descriptionDirty ? (
                    <button
                      type="button"
                      onClick={cancelDescriptionEdit}
                      aria-label="Cancel description edit"
                      className={GALAXY_BTN_CLASS}
                      style={galaxyActionStyle("secondary")}
                      onMouseEnter={(e) => applyGalaxySecondaryHover(e.currentTarget, true)}
                      onMouseLeave={(e) => applyGalaxySecondaryHover(e.currentTarget, false)}
                      data-galaxy-description-cancel="true"
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={!descriptionCanSave}
                    onClick={saveDescriptionEdit}
                    aria-label="Save description"
                    className={`${GALAXY_BTN_CLASS} disabled:cursor-not-allowed`}
                    style={galaxyActionStyle("primary", descriptionCanSave)}
                    onMouseEnter={(e) => applyGalaxyPrimaryHover(e.currentTarget, true, descriptionCanSave)}
                    onMouseLeave={(e) => applyGalaxyPrimaryHover(e.currentTarget, false, descriptionCanSave)}
                    data-galaxy-description-save="true"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p
                className="luxia-type-caption"
                style={{
                  color: GC.textSecondary,
                  fontWeight: 400,
                  lineHeight: 1.55,
                  maxWidth: "100%",
                }}
                data-galaxy-description-text="true"
              >
                {savedDescription}
              </p>
            )}
          </section>

          <section className="pt-0.5" style={{ paddingBottom: SPACE.sectionLoose }} aria-label="Galaxy Insights">
            <div
              className="overflow-hidden"
              style={{
                borderRadius: R.card + 2,
                background: SURF.outer,
                border: `1px solid ${SURF.outerBorder}`,
                boxShadow: GC.cardShadowRaised,
              }}
            >
              <button
                type="button"
                aria-expanded={transparencyOpen}
                aria-controls="galaxy-transparency-panel"
                onClick={() => setTransparencyOpen((o) => !o)}
                className="flex w-full items-start gap-2.5 px-4 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(142,99,235,0.28)]"
                style={{
                  background: transparencyOpen ? SURF.header : SURF.collapsed,
                  transition: TRANSITION,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SURF.hover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = transparencyOpen ? SURF.header : SURF.collapsed; }}
              >
                <Route
                  size={15}
                  strokeWidth={2}
                  aria-hidden
                  className="mt-[3px] flex-shrink-0"
                  style={{ color: transparencyOpen ? GC.iconSectionActive : GC.iconSection }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="luxia-type-body-dense-strong"
                    style={{ color: GC.textPrimary, fontWeight: 600, letterSpacing: "-0.01em" }}
                  >
                    Galaxy Insights
                  </p>
                  {!transparencyOpen ? (
                    <p
                      className="mt-1 truncate luxia-type-caption"
                      data-transparency-summary="true"
                      style={{ color: GC.textSecondary, fontWeight: 400 }}
                    >
                      {summary}
                    </p>
                  ) : (
                    <p className="mt-1 luxia-type-caption" style={{ color: GC.textDesc, fontWeight: 400 }}>
                      Routing, matches, and answer provenance
                    </p>
                  )}
                </div>
                <ChevronDown
                  size={15}
                  className="mt-[3px] flex-shrink-0"
                  aria-hidden
                  style={{
                    color: GC.chevron,
                    transform: transparencyOpen ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: reduceMotion ? "none" : `transform ${animMs}ms ${EASE}`,
                  }}
                />
              </button>

              <div
                id="galaxy-transparency-panel"
                className="grid"
                data-transparency-open={transparencyOpen ? "true" : "false"}
                style={{
                  gridTemplateRows: transparencyOpen ? "1fr" : "0fr",
                  opacity: transparencyOpen ? 1 : 0,
                  transition: reduceMotion
                    ? "none"
                    : `grid-template-rows ${animMs}ms ${EASE}, opacity ${animMs}ms ${EASE}`,
                }}
              >
                <div className="min-h-0 overflow-hidden" style={{ background: GC.insightsOuter }}>
                  <div
                    className="flex flex-col px-4"
                    style={{
                      gap: SPACE.stack,
                      paddingTop: transparencyOpen ? SPACE.nestPad : 0,
                      paddingBottom: transparencyOpen ? SPACE.nestPad : 0,
                    }}
                  >
                    <div>
                      <SectionLabel>Routing</SectionLabel>
                      <div
                        className="p-2.5"
                        style={{
                          borderRadius: R.nested,
                          background: GC.routing,
                          border: `1px solid ${GC.cardBorder}`,
                          boxShadow: GC.cardShadow,
                        }}
                      >
                        <div
                          role="radiogroup"
                          aria-label="Routing mode"
                          className="grid grid-cols-2 gap-1 p-1"
                          style={{ borderRadius: R.control, background: GC.segmentTrack }}
                        >
                          <button
                            type="button"
                            role="radio"
                            aria-checked={!isManualMode}
                            onClick={onSelectAuto}
                            className="px-2.5 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[rgba(142,99,235,0.35)]"
                            style={{
                              borderRadius: R.chip,
                              background: !isManualMode ? GC.selected : "transparent",
                              color: !isManualMode ? "#FFFFFF" : GC.textInactiveTitle,
                              transition: TRANSITION,
                            }}
                            onMouseEnter={(e) => {
                              if (isManualMode) {
                                (e.currentTarget as HTMLElement).style.background = GC.hoverSurface;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isManualMode) {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }
                            }}
                          >
                            <span className="block luxia-type-body-dense-strong" style={{ fontWeight: 600 }}>Auto</span>
                            <span
                              className="mt-0.5 block luxia-type-caption"
                              style={{
                                color: !isManualMode ? "rgba(255,255,255,0.76)" : GC.textInactiveDesc,
                                fontWeight: 400,
                              }}
                            >
                              Best constellation
                            </span>
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={isManualMode}
                            onClick={onEnterSpecific}
                            className="px-2.5 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[rgba(142,99,235,0.35)]"
                            style={{
                              borderRadius: R.chip,
                              background: isManualMode ? GC.selected : "transparent",
                              color: isManualMode ? "#FFFFFF" : GC.textInactiveTitle,
                              transition: TRANSITION,
                            }}
                            onMouseEnter={(e) => {
                              if (!isManualMode) {
                                (e.currentTarget as HTMLElement).style.background = GC.hoverSurface;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isManualMode) {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }
                            }}
                          >
                            <span className="block luxia-type-body-dense-strong" style={{ fontWeight: 600 }}>Specific</span>
                            <span
                              className="mt-0.5 block luxia-type-caption"
                              style={{
                                color: isManualMode ? "rgba(255,255,255,0.76)" : GC.textInactiveDesc,
                                fontWeight: 400,
                              }}
                            >
                              Choose one
                            </span>
                          </button>
                        </div>

                        {isManualMode ? (
                          <div className="mt-3 min-w-0" data-galaxy-specific-selector="true">
                            <p className="mb-2 luxia-type-caption" style={{ color: GC.textSecondary, fontWeight: 500 }}>
                              Applies to the next question
                            </p>

                            {pendingManual ? (
                              <div
                                className="mb-2 flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden rounded-[10px] px-2.5 py-2"
                                data-galaxy-selected-trigger="true"
                                style={{
                                  background: GC.trigger,
                                  border: `1px solid ${GC.triggerBorder}`,
                                  minWidth: 0,
                                }}
                                title={pendingManual.label}
                                tabIndex={0}
                                aria-label={`Selected constellation: ${pendingManual.label}`}
                              >
                                <p
                                  className="min-w-0 flex-1 truncate luxia-type-caption"
                                  style={{
                                    color: GC.textPrimary,
                                    fontWeight: 600,
                                  }}
                                >
                                  {pendingManual.label}
                                </p>
                                <ChevronDown
                                  size={14}
                                  className="flex-shrink-0"
                                  style={{ color: GC.textSecondary }}
                                  aria-hidden
                                />
                                <button
                                  type="button"
                                  aria-label="Clear constellation selection"
                                  onClick={onClearManual}
                                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[6px] outline-none"
                                  style={{ background: GC.segmentTrack }}
                                >
                                  <X size={12} style={{ color: GC.textSecondary }} />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="mb-2 flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-[10px] px-2.5 py-2"
                                style={{
                                  background: GC.trigger,
                                  border: `1px solid ${GC.triggerBorder}`,
                                  minWidth: 0,
                                }}
                              >
                                <p
                                  className="min-w-0 flex-1 truncate luxia-type-caption"
                                  style={{ color: GC.textSecondary, fontWeight: 500 }}
                                >
                                  Choose a constellation
                                </p>
                                <ChevronDown
                                  size={14}
                                  className="flex-shrink-0"
                                  style={{ color: GC.textSecondary }}
                                  aria-hidden
                                />
                              </div>
                            )}

                            <div
                              className="min-w-0 overflow-hidden rounded-[10px]"
                              style={{ border: `1px solid ${GC.searchBorder}`, background: GC.dropdown }}
                            >
                              <div
                                className="relative min-w-0 px-2 py-1.5"
                                style={{
                                  borderBottom: `1px solid ${GC.searchBorder}`,
                                  background: GC.searchField,
                                }}
                              >
                                <Search
                                  size={12}
                                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                                  style={{ color: GC.textMuted }}
                                />
                                <input
                                  ref={searchRef}
                                  value={query}
                                  onChange={(e) => { setQuery(e.target.value); setFocusIndex(0); }}
                                  onKeyDown={(e) => {
                                    if (e.key === "ArrowDown") {
                                      e.preventDefault();
                                      setFocusIndex((i) => Math.min(i + 1, Math.max(visibleResults.length - 1, 0)));
                                    } else if (e.key === "ArrowUp") {
                                      e.preventDefault();
                                      setFocusIndex((i) => Math.max(i - 1, 0));
                                    } else if (e.key === "Enter" && visibleResults[focusIndex]) {
                                      e.preventDefault();
                                      onSelectManual(visibleResults[focusIndex]);
                                    }
                                  }}
                                  onFocus={(e) => {
                                    e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${GC.purple}`; e.currentTarget.parentElement && (e.currentTarget.parentElement.style.boxShadow = GC.focusRing);
                                  }}
                                  onBlur={(e) => {
                                    e.currentTarget.style.boxShadow = "none";
                                    if (e.currentTarget.parentElement) e.currentTarget.parentElement.style.boxShadow = "none";
                                  }}
                                  placeholder="Search constellations…"
                                  aria-label="Search constellations"
                                  className="h-8 w-full min-w-0 rounded-[7px] bg-transparent pl-7 pr-2 outline-none luxia-type-caption placeholder:text-[rgba(255,255,255,0.42)]"
                                  style={{ color: GC.textPrimary }}
                                />
                              </div>

                              <div
                                className="max-h-[180px] overflow-x-hidden overflow-y-auto p-1"
                                role="listbox"
                                aria-label="Project constellations"
                                data-galaxy-constellation-results="true"
                              >
                                {routeOptionsLoading ? (
                                  <p className="px-2 py-3 luxia-type-caption" style={{ color: GC.textSecondary }}>
                                    Loading constellations…
                                  </p>
                                ) : filteredAll.length === 0 ? (
                                  <p className="px-2 py-3 luxia-type-caption" style={{ color: GC.textSecondary }}>
                                    {query.trim() ? "No constellations found" : "No constellations available"}
                                  </p>
                                ) : (
                                  <>
                                    {visibleResults.map((option, index) => {
                                      const selected = pendingManual?.id === option.id;
                                      const highlighted = index === focusIndex;
                                      return (
                                        <button
                                          key={option.id}
                                          type="button"
                                          role="option"
                                          aria-selected={selected}
                                          title={option.label}
                                          className="flex w-full min-w-0 items-start gap-2 overflow-hidden rounded-[8px] px-2 py-2 text-left outline-none"
                                          style={{
                                            background: selected
                                              ? GC.rowSelected
                                              : highlighted
                                                ? GC.rowHover
                                                : "transparent",
                                            transition: TRANSITION,
                                          }}
                                          onMouseEnter={() => setFocusIndex(index)}
                                          onClick={() => onSelectManual(option)}
                                        >
                                          <div className="min-w-0 flex-1 overflow-hidden" style={{ minWidth: 0 }}>
                                            <p
                                              className="luxia-type-caption"
                                              style={{
                                                color: GC.textResult,
                                                fontWeight: 500,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {option.label}
                                            </p>
                                            <p
                                              className="mt-0.5 luxia-type-caption"
                                              style={{ color: GC.textSourceMeta, fontWeight: 400 }}
                                            >
                                              {option.type}
                                            </p>
                                          </div>
                                          {selected ? (
                                            <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: GC.interactiveBlue }} />
                                          ) : null}
                                        </button>
                                      );
                                    })}

                                    {(() => {
                                      let hint: string | null = null;
                                      if (!query.trim() && routeOptions.length > GALAXY_ROUTE_RESULT_LIMIT) {
                                        hint = `Type to narrow ${routeOptions.length.toLocaleString()} constellations`;
                                      } else if (filteredAll.length > visibleResults.length) {
                                        hint = `${visibleResults.length} of ${filteredAll.length.toLocaleString()} results shown — refine your search`;
                                      } else if (!query.trim() && routeOptions.length > 0) {
                                        hint = "Type to narrow results";
                                      }
                                      if (!hint) return null;
                                      return (
                                        <p
                                          className="px-2 py-2 luxia-type-caption"
                                          style={{ color: GC.textSecondary, fontWeight: 500 }}
                                          data-galaxy-results-hint="true"
                                        >
                                          {hint}
                                        </p>
                                      );
                                    })()}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div
                      ref={activityRef}
                      tabIndex={-1}
                      className="outline-none"
                      aria-label="Current activity"
                    >
                      <SectionLabel icon={History}>Activity</SectionLabel>
                      <div
                        className="px-3.5 py-3.5"
                        data-galaxy-activity="true"
                        style={{
                          borderRadius: R.nested,
                          background: SURF.activity,
                          border: `1px solid ${SURF.activityBorder}`,
                          boxShadow: GC.cardShadow,
                        }}
                      >
                        <p className="sr-only" aria-live="polite">{session.activityLabel}</p>

                        {session.status === "ready" ? (
                          <div className="flex items-start gap-2.5">
                            <span
                              className="mt-[3px] flex h-4 w-4 flex-shrink-0 items-center justify-center"
                              aria-hidden
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: GC.idle }}
                              />
                            </span>
                            <div className="min-w-0">
                              <p className="luxia-type-body-dense-strong" style={{ color: GC.textPrimary, fontWeight: 500 }}>
                                Ready to search
                              </p>
                              <p className="mt-1 luxia-type-caption" style={{ color: GC.textDesc, fontWeight: 400 }}>
                                Ask a question and Galaxy will search {session.projectName}.
                              </p>
                            </div>
                          </div>
                        ) : null}

                        {isComplete && !processOpen ? (
                          <div>
                            <div className="flex items-start gap-2.5">
                              <span
                                className="mt-[3px] flex h-4 w-4 flex-shrink-0 items-center justify-center"
                                aria-hidden
                              >
                                <Check size={12} style={{ color: GC.success }} strokeWidth={2.5} />
                              </span>
                              <div className="min-w-0">
                                <p className="luxia-type-body-dense-strong" style={{ color: GC.textPrimary, fontWeight: 500 }}>
                                  Answer ready
                                </p>
                                <p className="mt-1 luxia-type-caption" style={{ color: GC.textSecondary, fontWeight: 400 }}>
                                  Search completed in 1.8 s · {steps.length} steps completed
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProcessOpen(true)}
                              className="mt-3 ml-[26px] rounded-[6px] px-1.5 py-1 luxia-type-caption outline-none focus-visible:underline"
                              style={{ color: GC.interactivePurple, fontWeight: 500, transition: TRANSITION }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = GC.hoverSurface;
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }}
                            >
                              View process
                            </button>
                          </div>
                        ) : null}

                        {showStepList ? (
                          <ul className="flex flex-col" data-galaxy-activity-list="true" style={{ gap: 8 }}>
                            {steps.map((step, index) => {
                              const done = index < activeStepIndex || isComplete;
                              const active = index === activeStepIndex && !isComplete;
                              if (index > activeStepIndex && !isComplete) return null;
                              return (
                                <li
                                  key={`${step.title}-${index}`}
                                  className="flex items-start gap-2.5 rounded-[10px] px-2.5 py-2.5"
                                  data-galaxy-activity-row="true"
                                  style={{
                                    background: GC.activityRow,
                                    transition: TRANSITION,
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = GC.activityRowHover;
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = GC.activityRow;
                                  }}
                                >
                                  <span
                                    className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center"
                                    aria-hidden
                                  >
                                    {done ? (
                                      <Check size={12} style={{ color: GC.success }} strokeWidth={2.5} />
                                    ) : active ? (
                                      <span
                                        className="h-1.5 w-1.5 rounded-full motion-safe:animate-pulse"
                                        style={{ background: GC.idle }}
                                      />
                                    ) : (
                                      <span
                                        className="h-1.5 w-1.5 rounded-full"
                                        style={{ background: GC.textMuted }}
                                      />
                                    )}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-2">
                                      <p
                                        className="luxia-type-body-dense-strong"
                                        style={{ color: GC.textPrimary, fontWeight: active ? 600 : 500 }}
                                      >
                                        {step.title}
                                      </p>
                                      {(done && !active) || active ? (
                                        <span
                                          className="flex-shrink-0 luxia-type-caption"
                                          style={{
                                            color: done && !active ? GC.interactiveBlue : GC.textSecondary,
                                            fontWeight: 400,
                                          }}
                                        >
                                          {done && !active ? "Done" : step.stateLabel}
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="mt-0.5 luxia-type-caption" style={{ color: GC.textDesc, fontWeight: 400 }}>
                                      {step.detail}
                                    </p>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}

                        {isComplete && processOpen ? (
                          <button
                            type="button"
                            onClick={() => setProcessOpen(false)}
                            className="mt-3 rounded-[6px] px-1.5 py-1 luxia-type-caption outline-none focus-visible:underline"
                            style={{ color: GC.interactivePurple, fontWeight: 500, transition: TRANSITION }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = GC.hoverSurface;
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "transparent";
                            }}
                          >
                            Hide process
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {showCandidates ? (
                      <div>
                        <SectionLabel>Candidate matches</SectionLabel>
                        <div className="rounded-[12px] px-2.5 py-2" style={{ background: SURF.overview }}>
                          <ul className="flex flex-col gap-1">
                            {session.candidates.map((candidate) => {
                              const selected = session.selected?.id === candidate.id;
                              return (
                                <li
                                  key={candidate.id}
                                  className="rounded-[8px] px-2 py-1.5"
                                  style={{ background: selected ? GC.rowSelected : "transparent" }}
                                >
                                  <p className="luxia-type-caption" style={{ color: GC.textPrimary, fontWeight: 600 }}>
                                    {candidate.label}
                                  </p>
                                  <p className="mt-0.5 luxia-type-caption" style={{ color: GC.textSecondary, fontWeight: 500 }}>
                                    {candidate.relevance}
                                  </p>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    ) : null}

                    {showSelected && session.selected ? (
                      <div
                        ref={selectedRef}
                        tabIndex={-1}
                        className="outline-none"
                        aria-label="Best match"
                      >
                        <SectionLabel icon={Crosshair}>Best Match</SectionLabel>
                        <div
                          style={{
                            borderRadius: R.card,
                            padding: "18px 18px",
                            background: SURF.bestMatch,
                            border: `1px solid ${SURF.bestMatchBorder}`,
                            boxShadow: GC.bestMatchShadow,
                          }}
                        >
                          <p
                            className="luxia-type-body-dense-strong"
                            style={{
                              color: GC.textPrimary,
                              fontWeight: 600,
                              fontSize: 15,
                              letterSpacing: "-0.015em",
                              lineHeight: 1.3,
                            }}
                          >
                            {session.selected.label}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <span
                              className="inline-flex h-[18px] items-center px-1.5 luxia-type-badge"
                              style={{
                                borderRadius: R.badge,
                                color: session.selected.type === "PDF" ? GC.pdfBadgeText : GC.dbBadgeText,
                                background: session.selected.type === "PDF" ? GC.pdfBadgeBg : GC.dbBadgeBg,
                                fontWeight: 500,
                              }}
                            >
                              {session.selected.type}
                            </span>
                            <span className="luxia-type-caption" style={{ color: GC.textSecondary, fontWeight: 400 }}>
                              Best semantic match
                            </span>
                          </div>
                          <p className="mt-2 luxia-type-caption" style={{ color: GC.textMeta, fontWeight: 400 }}>
                            {session.selectionSource === "manual" ? "Selected by you" : "Selected automatically"}
                          </p>
                          {onOpenConstellation ? (
                            <button
                              type="button"
                              onClick={onOpenConstellation}
                              className="mt-3.5 inline-flex items-center gap-1.5 px-2 py-1.5 luxia-type-caption outline-none"
                              style={{
                                borderRadius: R.chip,
                                color: GC.interactiveBlue,
                                fontWeight: 500,
                                transition: TRANSITION,
                              }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = GC.hoverSurface;
                                el.style.boxShadow = GC.hoverLift;
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = "transparent";
                                el.style.boxShadow = "none";
                              }}
                            >
                              <ExternalLink size={12} className="relative top-px" />
                              Open constellation
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {showSources ? (
                      <div
                        ref={sourcesRef}
                        tabIndex={-1}
                        className="outline-none"
                        aria-label="Sources used"
                      >
                        <SectionLabel icon={Files}>Sources</SectionLabel>
                        <div
                          className="px-1.5 py-1.5"
                          style={{
                            borderRadius: R.nested,
                            background: SURF.sources,
                            border: `1px solid ${GC.sourcesBorder}`,
                            boxShadow: GC.cardShadow,
                          }}
                        >
                          <ul className="flex flex-col gap-0.5">
                            {session.sources.map((source) => {
                              const name = source.label.replace(/\.pdf$/i, "");
                              return (
                                <li
                                  key={source.id}
                                  className="flex items-start gap-2.5 px-2.5 py-2.5"
                                  style={{ borderRadius: R.control, transition: TRANSITION }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = GC.sourceRowHover;
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = "transparent";
                                  }}
                                >
                                  <FileText
                                    size={13}
                                    className="mt-[3px] flex-shrink-0"
                                    style={{ color: GC.interactiveBlue, opacity: 0.85 }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className="luxia-type-caption"
                                      style={{ color: GC.textSourceTitle, fontWeight: 500, lineHeight: 1.35 }}
                                    >
                                      {name}
                                    </p>
                                    {source.description ? (
                                      <p
                                        className="mt-1 luxia-type-caption"
                                        style={{ color: GC.textSourceMeta, fontWeight: 400, lineHeight: 1.35 }}
                                      >
                                        {source.description}
                                      </p>
                                    ) : null}
                                    {source.pages ? (
                                      <p
                                        className="mt-1 luxia-type-metadata"
                                        style={{
                                          color: GC.textSourcePages,
                                          fontWeight: 400,
                                          fontSize: 11,
                                          letterSpacing: "0.01em",
                                        }}
                                      >
                                        {source.pages}
                                      </p>
                                    ) : null}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            ref={instructionRef}
            tabIndex={-1}
            className="outline-none"
            style={{ paddingBottom: SPACE.sectionLoose }}
            aria-label="Instruction"
          >
            <div
              className="flex flex-col gap-3"
              data-galaxy-instruction="true"
              style={{
                borderRadius: R.card,
                padding: `${SPACE.cardPadY}px ${SPACE.cardPadX}px`,
                background: GC.instruction,
                border: `1px solid ${GC.instructionBorder}`,
                boxShadow: GC.instructionShadow,
                transition: TRANSITION,
              }}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal
                    size={15}
                    strokeWidth={2}
                    aria-hidden
                    className="flex-shrink-0"
                    style={{ color: GC.instructionIcon }}
                  />
                  <h3
                    className="min-w-0 flex-1 luxia-type-body-dense-strong"
                    style={{ color: GC.instructionTitle, fontWeight: 600, letterSpacing: "-0.01em" }}
                  >
                    Instruction
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={IC_BTN_OPEN}
                        aria-label="Open full editor"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInstructionManagerOpen(true);
                        }}
                        onMouseEnter={icHoverOn}
                        onMouseLeave={icHoverOff}
                        onMouseDown={icOpenActiveOn}
                        onMouseUp={icHoverOn}
                        data-galaxy-instruction-open="true"
                      >
                        <SquareArrowOutUpRight size={14} strokeWidth={2} style={{ color: IC.textMuted }} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>Open full editor</TooltipContent>
                  </Tooltip>
                </div>
                <p
                  className="luxia-type-caption"
                  style={{ marginTop: 8, color: GC.instructionHelper, fontWeight: 400, lineHeight: 1.45 }}
                >
                  This is how Galaxy has been instructed to behave.
                </p>
              </div>

              <textarea
                value={instruction}
                onChange={(e) => handleInstructionChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && dirty) {
                    e.preventDefault();
                    cancelInstructionEdit();
                  }
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && dirty && !saving) {
                    e.preventDefault();
                    saveInstruction();
                  }
                }}
                rows={4}
                aria-label="Galaxy instruction"
                className="w-full resize-none overflow-y-auto p-3.5 outline-none luxia-type-metadata focus:outline-none focus-visible:outline-none galaxy-panel-scroll"
                style={{
                  minHeight: 104,
                  maxHeight: 140,
                  color: GC.textResult,
                  fontWeight: 400,
                  lineHeight: 1.55,
                  background: GC.instructionField,
                  borderRadius: "var(--luxia-radius-12)",
                  border: `1px solid ${focused ? GC.purple : GC.instructionFieldBorder}`,
                  boxShadow: focused ? GC.focusRing : "none",
                  scrollbarWidth: "thin",
                  scrollbarColor: `${GC.scrollThumb} transparent`,
                  transition: TRANSITION,
                }}
                onMouseEnter={(e) => {
                  if (focused) return;
                  (e.currentTarget as HTMLElement).style.borderColor = GC.instructionFieldHoverBorder;
                }}
                onMouseLeave={(e) => {
                  if (focused) return;
                  (e.currentTarget as HTMLElement).style.borderColor = GC.instructionFieldBorder;
                }}
              />

              <div className="flex items-center justify-end gap-2 pt-0.5">
                {dirty ? (
                  <button
                    type="button"
                    onClick={cancelInstructionEdit}
                    disabled={saving}
                    aria-label="Cancel instruction edit"
                    className={`${GALAXY_BTN_CLASS} disabled:cursor-not-allowed`}
                    style={galaxyActionStyle("secondary")}
                    onMouseEnter={(e) => {
                      if (saving) return;
                      applyGalaxySecondaryHover(e.currentTarget, true);
                    }}
                    onMouseLeave={(e) => applyGalaxySecondaryHover(e.currentTarget, false)}
                    data-galaxy-instruction-cancel="true"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={!dirty || saving}
                  onClick={saveInstruction}
                  aria-label={saving ? "Saving instruction" : "Save instruction"}
                  className={`${GALAXY_BTN_CLASS} disabled:cursor-not-allowed`}
                  style={galaxyActionStyle("primary", dirty && !saving)}
                  onMouseEnter={(e) => applyGalaxyPrimaryHover(e.currentTarget, true, dirty && !saving)}
                  onMouseLeave={(e) => applyGalaxyPrimaryHover(e.currentTarget, false, dirty && !saving)}
                  data-galaxy-instruction-save="true"
                >
                  {saving ? "Saving…" : "Save instruction"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </aside>

      <InstructionManager
        open={instructionManagerOpen}
        data={instructionEditorData}
        showAttachment={false}
        onCommit={(next) => handleInstructionChange(next.text)}
        onCancel={() => setInstructionManagerOpen(false)}
      />
    </div>
  );
}
