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
import { useEffect, useMemo, useRef, useState, forwardRef, type CSSProperties, type HTMLAttributes } from "react";
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
import { IC_BTN_OPEN, IC, icHoverOff, icHoverOn, icInputBorderHoverOff, icInputBorderHoverOn, icOpenActiveOn, icTextareaStyle } from "@/app/features/active-data-tables/inspectorTheme";
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
  labelGap: 10,
  stack: 14,
  groupPadTop: 26,
} as const;

const GC = {
  shell: "var(--luxia-galaxy-shell)",
  shellGradient: "var(--luxia-gradient-galaxy-panel)",
  shellBorder: "rgba(255, 255, 255, 0.06)",
  shellShadow: "var(--luxia-galaxy-shell-shadow)",

  header: "var(--luxia-galaxy-shell)",
  headerDivider: "rgba(255, 255, 255, 0.04)",

  page: "transparent",
  card: "var(--luxia-galaxy-surface)",
  cardBorder: "rgba(255, 255, 255, 0.06)",
  cardBorderStrong: "rgba(255, 255, 255, 0.10)",
  cardShadow: "0 2px 8px rgba(8, 5, 18, 0.14)",
  cardShadowRaised: "0 6px 16px rgba(8, 5, 18, 0.20)",

  insightsOuter: "var(--luxia-galaxy-surface)",
  insightsBorder: "rgba(255, 255, 255, 0.06)",
  insightsBorderOpen: "rgba(255, 255, 255, 0.10)",
  insightsHeader: "transparent",
  insightsCollapsed: "transparent",
  insightsHover: "rgba(255, 255, 255, 0.06)",

  routing: "transparent",
  segmentTrack: "rgba(255, 255, 255, 0.06)",
  selected: "var(--luxia-purple-50)",

  trigger: "var(--luxia-galaxy-surface)",
  triggerBorder: "rgba(255, 255, 255, 0.07)",
  dropdown: "var(--luxia-galaxy-shell)",
  searchField: IC.input,
  searchBorder: IC.inputBorder,
  searchBorderHover: IC.inputBorderHover,
  searchBorderFocus: IC.inputBorderFocus,
  rowHover: "rgba(255, 255, 255, 0.06)",
  rowSelected: "rgba(142, 99, 235, 0.14)",

  activity: "transparent",
  activityBorder: "rgba(255, 255, 255, 0.06)",
  activityRow: "rgba(255, 255, 255, 0.04)",
  activityRowHover: "rgba(255, 255, 255, 0.08)",

  bestMatch: "var(--luxia-galaxy-surface)",
  bestMatchBorder: "rgba(255, 255, 255, 0.16)",
  bestMatchShadow: "none",

  sources: "transparent",
  sourcesBorder: "rgba(255, 255, 255, 0.04)",
  sourceRowHover: "rgba(255, 255, 255, 0.05)",
  stepComplete: "var(--luxia-purple-50)",
  sectionDivider: "rgba(255, 255, 255, 0.05)",
  stepDoneLabel: "rgba(255, 255, 255, 0.42)",
  stepDetail: "rgba(255, 255, 255, 0.55)",

  instruction: "var(--luxia-galaxy-surface)",
  instructionBorder: "rgba(255, 255, 255, 0.06)",
  instructionShadow: "0 2px 8px rgba(8, 5, 18, 0.14)",
  instructionTitle: "#FFFFFF",
  instructionIcon: "#FFFFFF",
  instructionHelper: "rgba(255, 255, 255, 0.62)",
  instructionField: IC.input,
  instructionFieldBorder: IC.inputBorder,
  instructionFieldHoverBorder: IC.inputBorderHover,
  instructionFieldFocusBorder: IC.inputBorderFocus,
  textarea: IC.input,
  textareaBorder: IC.inputBorder,
  textareaHoverBorder: IC.inputBorderHover,
  textareaFocusBorder: IC.inputBorderFocus,

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
  textSubtitle: IC.textSubtitle,
  textQuietTitle: "#FFFFFF",
  textSourceTitle: "rgba(255, 255, 255, 0.78)",
  textSourceMeta: "rgba(255, 255, 255, 0.48)",
  textSourcePages: "rgba(255, 255, 255, 0.36)",
  chevron: "rgba(255, 255, 255, 0.55)",
  iconSection: "#FFFFFF",
  iconSectionActive: "var(--luxia-purple-50)",
  iconSectionHover: "rgba(255, 255, 255, 0.78)",
  iconSectionQuiet: "rgba(255, 255, 255, 0.40)",

  interactivePurple: "var(--luxia-purple-30)",
  interactiveBlue: "var(--luxia-brand-tertiary)",
  purple: "var(--luxia-purple-50)",
  success: "var(--luxia-success)",
  processing: "var(--luxia-brand-tertiary)",
  idle: "var(--luxia-purple-50)",

  pdfBadgeBg: "rgba(150, 219, 251, 0.12)",
  pdfBadgeText: IC.iconPdf,
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
  outerBorderOpen: GC.insightsBorderOpen,
  header: GC.insightsHeader,
  collapsed: GC.insightsCollapsed,
  hover: GC.insightsHover,
  overview: "transparent",
  activity: GC.activity,
  activityBorder: GC.activityBorder,
  bestMatch: GC.bestMatch,
  bestMatchBorder: GC.bestMatchBorder,
  sources: GC.sources,
} as const;

function SectionLabel({
  children,
  icon: Icon,
  tone = "default",
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "secondary";
}) {
  const labelColor =
    tone === "primary" ? GC.textSecondary : tone === "secondary" ? "rgba(255, 255, 255, 0.42)" : GC.textMuted;
  const iconColor =
    tone === "primary" ? GC.iconSectionActive : tone === "secondary" ? GC.iconSectionQuiet : GC.iconSection;

  return (
    <p
      className="flex items-center gap-1.5 luxia-type-metadata"
      style={{
        marginBottom: SPACE.labelGap,
        color: labelColor,
        fontWeight: 600,
        letterSpacing: "0.08em",
        fontSize: 10,
        textTransform: "uppercase" as const,
      }}
    >
      {Icon ? (
        <Icon size={12} strokeWidth={2} aria-hidden className="flex-shrink-0" style={{ color: iconColor }} />
      ) : null}
      {children}
    </p>
  );
}

const InsightsGroup = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { divided?: boolean }
>(function InsightsGroup({ children, divided = false, className, style, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(divided
          ? {
              borderTop: `1px solid ${GC.sectionDivider}`,
              paddingTop: SPACE.groupPadTop,
            }
          : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});

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
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const activityRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);
  const instructionRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectorTriggerRef = useRef<HTMLButtonElement>(null);
  const selectorPanelRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!selectorOpen) return;
    const option = selectorPanelRef.current?.querySelector<HTMLElement>(
      `[role="option"][data-galaxy-option-index="${focusIndex}"]`,
    );
    option?.scrollIntoView({ block: "nearest" });
  }, [focusIndex, selectorOpen]);

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
      setSelectorOpen(false);
    }
  }, [isManualMode]);

  useEffect(() => {
    if (!selectorOpen) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [selectorOpen]);

  useEffect(() => {
    if (!selectorOpen) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (selectorTriggerRef.current?.contains(target)) return;
      if (selectorPanelRef.current?.contains(target)) return;
      // Keep clear control inside the closed field from treating as outside
      const field = (e.target as HTMLElement | null)?.closest?.("[data-galaxy-selected-trigger]");
      if (field) return;
      setSelectorOpen(false);
      setQuery("");
      setFocusIndex(0);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setSelectorOpen(false);
      setQuery("");
      setFocusIndex(0);
      window.requestAnimationFrame(() => selectorTriggerRef.current?.focus());
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectorOpen]);

  function closeConstellationSelector(restoreFocus = true) {
    setSelectorOpen(false);
    setQuery("");
    setFocusIndex(0);
    if (restoreFocus) {
      window.requestAnimationFrame(() => selectorTriggerRef.current?.focus());
    }
  }

  function toggleConstellationSelector() {
    setSelectorOpen((open) => {
      if (open) {
        setQuery("");
        setFocusIndex(0);
        return false;
      }
      return true;
    });
  }

  function selectConstellationOption(option: GalaxyControlRouteOption) {
    onSelectManual(option);
    closeConstellationSelector(true);
  }

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
          <div className="min-w-0 flex-1 text-left">
            <h2
              className="luxia-type-heading-h4 text-left"
              data-galaxy-title="true"
              style={{
                color: "var(--luxia-text-inverse)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                flex: "0 1 auto",
                lineHeight: 1.15,
                whiteSpace: "normal",
                opacity: 1,
                margin: 0,
                textAlign: "left",
              }}
            >
              <span style={{ display: "block" }}>Galaxy</span>
              <span style={{ display: "block" }}>Intelligence</span>
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
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical galaxy-panel-scroll px-5"
          style={{
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
                  className="luxia-type-title-component"
                  style={{ color: GC.textPrimary, fontWeight: 700, letterSpacing: "-0.01em" }}
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
                  className="w-full resize-none overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical galaxy-panel-scroll p-3 outline-none luxia-type-caption focus:outline-none focus-visible:outline-none placeholder:text-[rgba(255,255,255,0.40)]"
                  style={{
                    minHeight: 72,
                    maxHeight: 112,
                    fontWeight: 400,
                    lineHeight: 1.55,
                    borderRadius: R.nested,
                    ...icTextareaStyle(true, { invalid: descriptionInvalid }),
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
                  color: GC.textPrimary,
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
                border: `1px solid ${transparencyOpen ? SURF.outerBorderOpen : SURF.outerBorder}`,
                boxShadow: transparencyOpen ? GC.cardShadowRaised : GC.cardShadow,
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
                    className="luxia-type-title-component"
                    style={{ color: GC.textPrimary, fontWeight: 700, letterSpacing: "-0.01em" }}
                  >
                    Galaxy Insights
                  </p>
                  {transparencyOpen ? (
                    <p className="mt-1 luxia-type-caption" style={{ color: GC.textDesc, fontWeight: 400 }}>
                      Routing, matches, and answer provenance
                    </p>
                  ) : null}
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
                <div className="min-h-0 overflow-hidden" style={{ background: "transparent" }}>
                  <div
                    className="flex flex-col px-4"
                    style={{
                      gap: SPACE.stack,
                      paddingTop: transparencyOpen ? SPACE.nestPad : 0,
                      paddingBottom: transparencyOpen ? SPACE.nestPad : 0,
                    }}
                  >
                    <InsightsGroup>
                      <SectionLabel>Routing</SectionLabel>
                      <div
                        className="p-2.5"
                        style={{
                          borderRadius: R.nested,
                          background: GC.routing,
                          border: `1px solid ${GC.cardBorder}`,
                          boxShadow: "none",
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

                            <div
                              className="flex min-w-0 items-stretch overflow-hidden rounded-[10px]"
                              style={{
                                background: GC.trigger,
                                border: `1px solid ${selectorOpen ? GC.cardBorderStrong : GC.triggerBorder}`,
                              }}
                              data-galaxy-selected-trigger="true"
                            >
                              <button
                                ref={selectorTriggerRef}
                                type="button"
                                aria-expanded={selectorOpen}
                                aria-haspopup="listbox"
                                aria-controls="galaxy-constellation-listbox"
                                aria-label={
                                  pendingManual
                                    ? `Selected constellation: ${pendingManual.label}. Change constellation`
                                    : "Choose a constellation"
                                }
                                title={pendingManual?.label}
                                onClick={toggleConstellationSelector}
                                onKeyDown={(e) => {
                                  if (e.key === "ArrowDown" && !selectorOpen) {
                                    e.preventDefault();
                                    setSelectorOpen(true);
                                  } else if (e.key === "Escape" && selectorOpen) {
                                    e.preventDefault();
                                    closeConstellationSelector(true);
                                  }
                                }}
                                className="flex min-w-0 flex-1 items-center gap-2 px-3.5 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(142,99,235,0.35)]"
                              >
                                <span
                                  className="min-w-0 flex-1 truncate luxia-type-caption"
                                  style={{
                                    color: pendingManual ? GC.textPrimary : GC.textSecondary,
                                    fontWeight: pendingManual ? 600 : 500,
                                  }}
                                >
                                  {pendingManual ? pendingManual.label : "Choose a constellation"}
                                </span>
                                <ChevronDown
                                  size={14}
                                  className="flex-shrink-0"
                                  aria-hidden
                                  style={{
                                    color: GC.textSecondary,
                                    transform: selectorOpen ? "rotate(180deg)" : "none",
                                    transition: reduceMotion ? "none" : "transform 160ms ease",
                                  }}
                                />
                              </button>
                              {pendingManual ? (
                                <button
                                  type="button"
                                  aria-label="Clear constellation selection"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onClearManual();
                                    closeConstellationSelector(false);
                                  }}
                                  className="flex w-9 flex-shrink-0 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(142,99,235,0.35)]"
                                  style={{ borderLeft: `1px solid ${GC.triggerBorder}` }}
                                >
                                  <X size={12} style={{ color: GC.textSecondary }} />
                                </button>
                              ) : null}
                            </div>

                            {selectorOpen ? (
                              <div
                                ref={selectorPanelRef}
                                className="mt-2 min-w-0 overflow-hidden rounded-[10px]"
                                style={{
                                  border: `1px solid ${GC.triggerBorder}`,
                                  background: GC.dropdown,
                                }}
                                data-galaxy-constellation-dropdown="true"
                              >
                                <div
                                  className="relative min-w-0 px-3 pt-3 pb-2"
                                  style={{ borderBottom: `1px solid ${GC.triggerBorder}` }}
                                >
                                  <div
                                    className="relative flex items-center rounded-[8px] transition-[border-color] duration-150"
                                    style={{
                                      background: IC.input,
                                      border: `1px solid ${IC.inputBorder}`,
                                    }}
                                    onMouseEnter={(e) => {
                                      if (e.currentTarget.contains(document.activeElement)) return;
                                      e.currentTarget.style.borderColor = IC.inputBorderHover;
                                    }}
                                    onMouseLeave={(e) => {
                                      if (e.currentTarget.contains(document.activeElement)) return;
                                      e.currentTarget.style.borderColor = IC.inputBorder;
                                    }}
                                  >
                                    <Search
                                      size={12}
                                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                                      style={{ color: IC.inputIcon }}
                                    />
                                    <input
                                      ref={searchRef}
                                      value={query}
                                      onChange={(e) => {
                                        setQuery(e.target.value);
                                        setFocusIndex(0);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "ArrowDown") {
                                          e.preventDefault();
                                          setFocusIndex((i) =>
                                            Math.min(i + 1, Math.max(visibleResults.length - 1, 0)),
                                          );
                                        } else if (e.key === "ArrowUp") {
                                          e.preventDefault();
                                          setFocusIndex((i) => Math.max(i - 1, 0));
                                        } else if (e.key === "Enter" && visibleResults[focusIndex]) {
                                          e.preventDefault();
                                          selectConstellationOption(visibleResults[focusIndex]);
                                        } else if (e.key === "Escape") {
                                          e.preventDefault();
                                          closeConstellationSelector(true);
                                        }
                                      }}
                                      onFocus={(e) => {
                                        const shell = e.currentTarget.parentElement;
                                        if (shell) shell.style.borderColor = IC.inputBorderFocus;
                                      }}
                                      onBlur={(e) => {
                                        const shell = e.currentTarget.parentElement;
                                        if (shell) shell.style.borderColor = IC.inputBorder;
                                      }}
                                      placeholder="Search constellations…"
                                      aria-label="Search constellations"
                                      aria-controls="galaxy-constellation-listbox"
                                      aria-autocomplete="list"
                                      className="h-9 w-full min-w-0 rounded-[8px] bg-transparent py-2 pl-8 pr-3 outline-none luxia-type-caption placeholder:text-[rgba(255,255,255,0.40)]"
                                      style={{ color: IC.textPrimary }}
                                    />
                                  </div>
                                </div>

                                <div
                                  id="galaxy-constellation-listbox"
                                  className="max-h-[180px] overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical galaxy-panel-scroll px-2 py-2"
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
                                    visibleResults.map((option, index) => {
                                      const selected = pendingManual?.id === option.id;
                                      const highlighted = index === focusIndex;
                                      return (
                                        <button
                                          key={option.id}
                                          type="button"
                                          role="option"
                                          aria-selected={selected}
                                          data-galaxy-option-index={index}
                                          title={option.label}
                                          className="flex w-full min-w-0 items-start gap-2 overflow-hidden rounded-[8px] px-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(142,99,235,0.28)]"
                                          style={{
                                            minHeight: 44,
                                            paddingTop: 8,
                                            paddingBottom: 8,
                                            background: selected
                                              ? GC.rowSelected
                                              : highlighted
                                                ? GC.rowHover
                                                : "transparent",
                                            transition: TRANSITION,
                                          }}
                                          onMouseEnter={() => setFocusIndex(index)}
                                          onClick={() => selectConstellationOption(option)}
                                        >
                                          <div className="min-w-0 flex-1 overflow-hidden" style={{ minWidth: 0 }}>
                                            <p
                                              className="luxia-type-caption"
                                              style={{
                                                color: GC.textResult,
                                                fontWeight: selected ? 600 : 500,
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
                                            <Check
                                              size={12}
                                              className="mt-0.5 flex-shrink-0"
                                              style={{ color: GC.purple }}
                                            />
                                          ) : null}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </InsightsGroup>

                    <InsightsGroup
                      divided
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
                          boxShadow: "none",
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
                                <Check size={12} style={{ color: GC.stepComplete }} strokeWidth={2.5} />
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
                                      <Check size={12} style={{ color: GC.stepComplete }} strokeWidth={2.5} />
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
                                        style={{
                                          color: GC.textPrimary,
                                          fontWeight: 600,
                                        }}
                                      >
                                        {step.title}
                                      </p>
                                      {(done && !active) || active ? (
                                        <span
                                          className="flex-shrink-0 luxia-type-caption"
                                          style={{
                                            color: done && !active ? GC.stepDoneLabel : GC.textSecondary,
                                            fontWeight: 400,
                                          }}
                                        >
                                          {done && !active ? "Done" : step.stateLabel}
                                        </span>
                                      ) : null}
                                    </div>
                                    <p
                                      className="mt-0.5 luxia-type-caption"
                                      style={{ color: GC.stepDetail, fontWeight: 400 }}
                                    >
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
                    </InsightsGroup>

                    {showCandidates ? (
                      <InsightsGroup divided>
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
                      </InsightsGroup>
                    ) : null}

                    {showSelected && session.selected ? (
                      <InsightsGroup
                        divided
                        ref={selectedRef}
                        tabIndex={-1}
                        className="outline-none"
                        aria-label="Best match"
                      >
                        <SectionLabel icon={Crosshair} tone="primary">Best Match</SectionLabel>
                        <div
                          style={{
                            borderRadius: R.card,
                            padding: "22px 22px",
                            background: SURF.bestMatch,
                            border: `1px solid ${SURF.bestMatchBorder}`,
                            boxShadow: "none",
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
                      </InsightsGroup>
                    ) : null}

                    {showSources ? (
                      <InsightsGroup
                        divided
                        ref={sourcesRef}
                        tabIndex={-1}
                        className="outline-none"
                        aria-label="Sources used"
                      >
                        <SectionLabel icon={Files} tone="secondary">Sources</SectionLabel>
                        <div
                          className="px-1 py-1"
                          style={{
                            borderRadius: R.nested,
                            background: SURF.sources,
                            border: `1px solid ${GC.sourcesBorder}`,
                            boxShadow: "none",
                          }}
                        >
                          <ul className="flex flex-col gap-0.5">
                            {session.sources.map((source) => {
                              const name = source.label.replace(/\.pdf$/i, "");
                              return (
                                <li
                                  key={source.id}
                                  className="flex items-start gap-2.5 px-2 py-2"
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
                                    style={{ color: GC.iconSectionQuiet, opacity: 0.9 }}
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
                      </InsightsGroup>
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
                    className="min-w-0 flex-1 luxia-type-title-component"
                    style={{ color: GC.instructionTitle, fontWeight: 700, letterSpacing: "-0.01em" }}
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
                className="w-full resize-none overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical galaxy-panel-scroll p-3.5 outline-none luxia-type-metadata focus:outline-none focus-visible:outline-none placeholder:text-[rgba(255,255,255,0.40)]"
                style={{
                  minHeight: 104,
                  maxHeight: 140,
                  fontWeight: 400,
                  lineHeight: 1.55,
                  borderRadius: "var(--luxia-radius-12)",
                  ...icTextareaStyle(focused),
                  transition: TRANSITION,
                }}
                onMouseEnter={(e) => icInputBorderHoverOn(e, focused)}
                onMouseLeave={(e) => icInputBorderHoverOff(e, focused)}
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
