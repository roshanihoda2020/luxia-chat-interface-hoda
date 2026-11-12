import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, PanelRightClose, PanelRightOpen } from "lucide-react";
import { ConstellationSidebar } from "@/app/app-sections/ConstellationSidebarSection";
import { ConstellationSourceBadge, type Constellation } from "@/app/app-sections/appSectionShared";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { IC, icInspectorAccentStyle } from "@/app/features/active-data-tables/inspectorTheme";
import { createSeedCapabilityBundle, type ConstellationCapabilityBundle } from "@/app/features/constellation-settings/capabilityState";
import { GALAXY_PANEL_OUTER_GAP, GalaxyActivityPanel, GalaxyCollapsedRail, buildGalaxyRouteCatalog, createIdleGalaxySession, type GalaxyMatchedConstellation } from "@/app/features/galaxy";
import { LuxiaConstellationIcon, LuxiaGalaxyIcon } from "@/assets/icons";
import { KnowledgeChoices } from "../shared";
import type { Scope } from "../model";
import "./lab.css";

export type KnowledgeMode = "A" | "B" | "C";
type Route = { mode: "auto" | "manual"; pending: GalaxyMatchedConstellation | null };

const PANEL_WIDTH = 340;
const ROUTE_TYPE = { pdf: "PDF", csv: "CSV", database: "DB" } as const;

/** Lab heading over the real inspector: interactive in A/C, read-only (+ link) in B. */
function KnowledgeHeading({
  mode,
  scope,
  constellations,
  hasMessages,
  chatLabel,
  open,
  onOpenChange,
  onChoose,
  onChangeInComposer,
  onCollapse,
  description,
}: {
  description?: string;
  mode: KnowledgeMode;
  scope: Scope | null;
  constellations: Constellation[];
  hasMessages: boolean;
  chatLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (scope: Scope) => void;
  onChangeInComposer: () => void;
  onCollapse?: () => void;
}) {
  const current = scope?.kind === "constellation" ? constellations.find((c) => c.id === scope.id) : null;
  const name = scope ? (current?.label ?? "Galaxy") : "Choose knowledge";
  const interactive = mode !== "B";
  const [hover, setHover] = useState(false);
  return (
    <div className="flex min-w-0 items-start gap-2" data-ux-panel-heading={interactive ? "interactive" : "read-only"}>
      <div className="min-w-0 flex-1">
        <p className="luxia-type-overline-data" style={{ color: IC.textMuted }}>Answers from</p>
        {interactive ? (
          <Popover open={open} onOpenChange={onOpenChange}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    className="mt-1 flex w-full min-w-0 items-center gap-2 rounded-[10px] border px-2.5 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-purple-50)]"
                    style={{ borderColor: hover || open ? IC.inputBorderHover : IC.border, background: hover || open ? IC.hover : IC.controlBg, color: IC.textPrimary }}
                    aria-label={`Answers from: ${name}. Change knowledge for this chat`}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    data-ux-panel-knowledge-trigger=""
                  >
                    {scope?.kind === "galaxy" ? <LuxiaGalaxyIcon size={15} color="currentColor" /> : <LuxiaConstellationIcon size={15} color="currentColor" />}
                    <span className="min-w-0 flex-1 truncate luxia-type-title-panel">{name}</span>
                    {current ? <ConstellationSourceBadge type={current.type} className="shrink-0" /> : null}
                    <ChevronDown size={15} strokeWidth={2.2} aria-hidden style={{ color: IC.textPrimary }} />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>Change knowledge for this chat</TooltipContent>
            </Tooltip>
            <PopoverContent align="start" className="w-[340px] p-2" onFocusOutside={(event) => event.preventDefault()}>
              <KnowledgeChoices scope={scope} constellations={constellations} onChoose={onChoose} hasMessages={hasMessages} chatLabel={chatLabel} />
            </PopoverContent>
          </Popover>
        ) : (
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex min-w-0 items-center gap-2" style={{ color: IC.textPrimary }}>
              {scope?.kind === "galaxy" ? <LuxiaGalaxyIcon size={15} color="currentColor" /> : <LuxiaConstellationIcon size={15} color="currentColor" />}
              <span className="min-w-0 truncate luxia-type-title-panel">{name}</span>
              {current ? <ConstellationSourceBadge type={current.type} /> : null}
            </span>
            <button type="button" onClick={onChangeInComposer} className="rounded-[6px] px-1 luxia-type-caption font-semibold underline-offset-2 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-purple-50)]" style={{ color: IC.textSubtitle }} data-ux-panel-change-link="">
              Change in composer
            </button>
          </div>
        )}
        {description ? <p className="mt-1.5 line-clamp-2 luxia-type-caption" style={{ color: "var(--luxia-inspector-description, rgba(255,255,255,0.7))" }}>{description}</p> : null}
      </div>
      {onCollapse ? (
        <button type="button" onClick={onCollapse} aria-label="Collapse Constellation inspector" className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-[7px] outline-none hover:bg-[rgba(255,255,255,0.06)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-purple-50)]" style={{ color: IC.textMuted }}>
          <PanelRightClose size={15} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export function LabRightPanel({
  mode,
  chatType,
  chatLabel,
  scope,
  hasMessages,
  projectId,
  projectName,
  constellations,
  canConfigure,
  canEditKnowledge,
  collapsed,
  onToggleCollapsed,
  menuOpen,
  onMenuOpenChange,
  onChoose,
  onChangeInComposer,
  onOpenSettings,
  route,
  onRouteChange,
}: {
  mode: KnowledgeMode;
  chatType: "galaxy" | "constellation";
  chatLabel: string;
  scope: Scope | null;
  hasMessages: boolean;
  projectId: string;
  projectName: string;
  constellations: Constellation[];
  canConfigure: boolean;
  canEditKnowledge: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onChoose: (scope: Scope) => void;
  onChangeInComposer: () => void;
  onOpenSettings: () => void;
  route: Route;
  onRouteChange: (route: Route) => void;
}) {
  const [bundles, setBundles] = useState<Record<string, ConstellationCapabilityBundle>>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number | undefined>(undefined);
  const current = scope?.kind === "constellation" ? constellations.find((c) => c.id === scope.id) ?? null : null;
  const bundle = useMemo(() => (current ? bundles[current.id] ?? createSeedCapabilityBundle(current.id, current.type) : null), [bundles, current]);
  const commit = <K extends keyof ConstellationCapabilityBundle>(key: K) => (next: ConstellationCapabilityBundle[K]) => {
    if (!current || !bundle) return;
    setBundles((map) => ({ ...map, [current.id]: { ...bundle, [key]: next } }));
  };
  useLayoutEffect(() => {
    const header = wrapRef.current?.querySelector<HTMLElement>('[data-luxia-inspector="capsule"] > aside > div:nth-child(2)');
    if (!header) return;
    const measure = () => setHeaderHeight(header.getBoundingClientRect().height);
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(header);
    return () => observer?.disconnect();
  });
  const heading = (
    <KnowledgeHeading
      description={current?.description}
      mode={mode}
      scope={scope}
      constellations={constellations}
      hasMessages={hasMessages}
      chatLabel={chatLabel}
      open={menuOpen}
      onOpenChange={onMenuOpenChange}
      onChoose={onChoose}
      onChangeInComposer={onChangeInComposer}
      onCollapse={onToggleCollapsed}
    />
  );

  // The REAL inspector, used for both states (sections depend on the Constellation's type/capabilities).
  const sidebarProps = current && bundle ? {
    width: PANEL_WIDTH,
    onResizeStart: () => undefined,
    onCollapse: onToggleCollapsed,
    constellation: current,
    allConstellations: constellations,
    onConstellationChange: (id: string) => onChoose({ kind: "constellation", id }),
    onOpenConstellationSettings: () => onOpenSettings(),
    projectId,
    allowConstellationChange: true,
    isGalaxyChat: false,
    canConfigure,
    canEditKnowledge,
    knowledgeBase: bundle.knowledgeBase,
    onCommitKnowledgeBase: commit("knowledgeBase"),
    views: bundle.views,
    onCommitViews: commit("views"),
    tables: bundle.tables,
    onCommitTables: commit("tables"),
    contextFiles: bundle.contextFiles,
    onCommitContextFiles: commit("contextFiles"),
    relationships: bundle.relationships,
    onCommitRelationships: commit("relationships"),
    metrics: bundle.metrics,
    onCommitMetrics: commit("metrics"),
    pdfFiles: bundle.pdfFiles,
    onCommitPdfFiles: commit("pdfFiles"),
    pdfFileTagSourceIds: [] as string[],
    crawler: bundle.crawler,
    onCommitCrawler: commit("crawler"),
  } : null;

  // Collapsed = the original Luxia narrow rails (no prototype floating box).
  if (collapsed) {
    if (chatType === "galaxy") {
      return <div className="flex h-full shrink-0" data-ux-lab-panel-collapsed="galaxy"><GalaxyCollapsedRail onExpand={onToggleCollapsed} /></div>;
    }
    if (sidebarProps) {
      return <div className="flex h-full shrink-0" data-ux-lab-panel-collapsed="constellation"><ConstellationSidebar key={current?.id} collapsed {...sidebarProps} /></div>;
    }
    // New chat without knowledge yet: no sections exist, so the same rail shell with only the expand control.
    return (
      <div className="flex h-full shrink-0 flex-col self-stretch" style={{ width: 56 + GALAXY_PANEL_OUTER_GAP * 2, padding: GALAXY_PANEL_OUTER_GAP, boxSizing: "border-box" }} data-ux-lab-panel-collapsed="unscoped">
        <aside className="relative flex min-h-0 flex-1 flex-col items-center overflow-hidden" style={{ width: 56, borderRadius: "var(--luxia-radius-24)", backgroundColor: IC.shell, backgroundImage: IC.shellGradient, border: `1px solid ${IC.shellBorder}`, boxShadow: IC.shellShadow }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={onToggleCollapsed} aria-label="Expand Constellation inspector" aria-expanded={false} className="mt-3 flex h-7 w-7 items-center justify-center rounded-[7px] outline-none hover:bg-[rgba(255,255,255,0.06)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-purple-50)]" style={{ color: IC.textMuted }}>
                <PanelRightOpen size={15} aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>Expand inspector</TooltipContent>
          </Tooltip>
        </aside>
      </div>
    );
  }

  if (chatType === "galaxy") {
    const options = buildGalaxyRouteCatalog(projectName, constellations.map((c) => ({ id: c.id, label: c.label, type: ROUTE_TYPE[c.type] })));
    return (
      <div className="flex h-full shrink-0 p-[14px]" style={{ width: PANEL_WIDTH + 28 }} data-ux-lab-galaxy-panel="">
        <GalaxyActivityPanel
          session={createIdleGalaxySession(projectName)}
          width={PANEL_WIDTH}
          routeOptions={options}
          pendingManual={route.pending}
          onResizeStart={() => undefined}
          onSelectAuto={() => onRouteChange({ mode: "auto", pending: null })}
          onSelectManual={(option) => onRouteChange({ mode: "manual", pending: option })}
          onEnterSpecific={() => undefined}
          onClearManual={() => onRouteChange({ mode: "auto", pending: null })}
          onCollapse={onToggleCollapsed}
        />
      </div>
    );
  }

  if (!current || !bundle) {
    return (
      <div className="flex h-full shrink-0 flex-col p-[14px]" style={{ width: PANEL_WIDTH + 28 }} data-ux-lab-panel-unscoped="">
        <div className="flex flex-1 flex-col rounded-[var(--luxia-radius-24)] px-5 pb-5 pt-3" style={{ backgroundColor: IC.shell, backgroundImage: IC.shellGradient, boxShadow: IC.shellShadow }}>
          {heading}
          <p className="mt-6 luxia-type-body-dense" style={{ color: IC.textSecondary }}>
            {mode === "B" ? "Choose what this chat answers from in the composer. The panel then shows that Constellation's knowledge." : "Choose what this chat answers from. The panel then shows that Constellation's knowledge."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="ux-lab-panel relative flex h-full shrink-0" data-ux-lab-panel="">
      <ConstellationSidebar key={current.id} collapsed={false} {...sidebarProps!} />
      <div className="pointer-events-none absolute left-[14px] right-[14px] top-[14px] overflow-hidden rounded-t-[var(--luxia-radius-24)] px-5 pb-2.5 pt-3" style={{ background: IC.header, height: headerHeight, ...icInspectorAccentStyle(current.type) }}>
        <div className="pointer-events-auto">{heading}</div>
      </div>
    </div>
  );
}
