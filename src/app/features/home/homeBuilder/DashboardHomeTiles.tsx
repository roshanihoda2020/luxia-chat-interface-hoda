import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon, LuxiaDashboardIcon } from "@/assets/icons";
import { outputTypeLabel } from "@/app/features/project-overview/DashboardOutputPreviews";
import type { ProjectDashboardOutputType } from "@/app/features/project-overview/types";
import {
  CollectionHomeTile,
  useFittingCount,
  type HomeCollectionDensity,
  type HomeCollectionEmptyState,
} from "./CollectionHomeTile";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileSurface,
  HomeTileTitleAction,
} from "./HomeTileSurface";
import {
  CardArrow,
  HOME_TILE_PANEL_BUTTON,
  HOME_TILE_ROW,
  Monogram,
  OpenCue,
  OutputThumb,
  TileStat,
  TileSummaryRow,
  plural,
} from "./homeTileVisuals";

/**
 * Dashboard Home Tiles. A Project can have several named Dashboards, each an
 * ordered selection of the Project's saved outputs (All Outputs is separate
 * and never shown here). Outputs carry a name, type and where they came from,
 * but no values. Thumbnails are the Dashboard page's own symbolic pictures of
 * each output's type — they say "a chart", "a table", never what the data shows.
 * Dashboard names repeat across Projects, so the parent Project is always shown.
 */

export interface HomeDashboardOutput {
  id: string;
  name: string;
  type: ProjectDashboardOutputType;
  /** "2h ago". */
  updatedAt: string;
  source: "galaxy" | "constellation-chat";
}

export interface HomeDashboardTileItem {
  /** The Dashboard's stable id. */
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  /** In the Dashboard's own order. */
  outputs: readonly HomeDashboardOutput[];
  /** When the Dashboard last changed, e.g. "2h ago". */
  updatedAt: string;
  openLabel: string;
  onOpen: () => void;
}

/** "Project name 01 · 3 outputs" — the line that tells same-named Dashboards apart. */
function contextLine(item: HomeDashboardTileItem): string {
  return `${item.projectName} · ${item.outputs.length > 0 ? plural(item.outputs.length, "output") : "No outputs yet"}`;
}

/** Accessible name for a Dashboard link: openLabel already names the Project, so add only the output count. */
function openAria(item: HomeDashboardTileItem): string {
  return `${item.openLabel}, ${item.outputs.length > 0 ? plural(item.outputs.length, "output") : "no outputs yet"}`;
}

/** Stands in for a thumbnail when a Dashboard has no outputs yet. */
function EmptyThumb({ height, className = "" }: { height: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex items-center justify-center rounded-[8px] ${className}`}
      style={{ height, background: HT.panel, color: HT.muted }}
    >
      <LuxiaDashboardIcon size={Math.min(28, Math.round(height / 2.5))} color="currentColor" />
    </span>
  );
}

const dashboardIcon = (size: number) => <LuxiaDashboardIcon size={size} color="currentColor" />;
const CORNER = { icon: dashboardIcon };

/** The newest outputs, one per type, so a thumbnail strip shows what kinds of work the Dashboard holds. */
function distinctTypes(outputs: readonly HomeDashboardOutput[], max: number): HomeDashboardOutput[] {
  const seen = new Set<string>();
  const out: HomeDashboardOutput[] = [];
  for (const output of outputs) {
    if (seen.has(output.type)) continue;
    seen.add(output.type);
    out.push(output);
    if (out.length === max) break;
  }
  return out;
}

function ThumbStrip({ outputs, height, max }: { outputs: readonly HomeDashboardOutput[]; height: number; max: number }) {
  const shown = distinctTypes(outputs, max);
  if (shown.length === 0) return <EmptyThumb height={height} />;
  return (
    <span
      className="grid min-w-0 gap-1.5"
      style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`Output types: ${shown.map((output) => outputTypeLabel(output.type)).join(", ")}`}
    >
      {shown.map((output) => <OutputThumb key={output.id} type={output.type} height={height} />)}
    </span>
  );
}

function OutputMeta({ output }: { output: HomeDashboardOutput }) {
  return (
    <span className="block truncate luxia-type-caption" style={{ color: HT.muted }}>
      {`${outputTypeLabel(output.type)} · ${output.source === "galaxy" ? "from Galaxy" : "from a Chat"} · ${output.updatedAt}`}
    </span>
  );
}

// Dashboards collection

const OFFER: Record<HomeCollectionDensity, number> = { small: 3, medium: 6, large: 6, wide: 6 };

function DashboardRow({ item }: { item: HomeDashboardTileItem }) {
  return (
    <button type="button" onClick={item.onOpen} aria-label={openAria(item)} className={HOME_TILE_ROW}>
      <Monogram name={item.projectName} size={28} />
      <span className="min-w-0 flex-1">
        <span className="block truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={item.title}>{item.title}</span>
        <span className="block truncate luxia-type-caption" style={{ color: HT.secondary }} title={contextLine(item)}>
          {contextLine(item)}
        </span>
      </span>
    </button>
  );
}

/** The most recently updated Dashboard, as the collection's lead: its first output, name and Project. */
function LeadDashboard({ item, thumbHeight, layout }: { item: HomeDashboardTileItem; thumbHeight: number; layout: "row" | "stack" }) {
  const output = item.outputs[0];
  const thumbClass = layout === "row" ? "w-[38%] shrink-0" : "w-full";
  return (
    <button
      type="button"
      onClick={item.onOpen}
      aria-label={openAria(item)}
      className={`group/dash ${HOME_TILE_PANEL_BUTTON} h-full ${layout === "row" ? "items-center gap-3 p-2.5" : "flex-col gap-2.5 p-3"}`}
      data-home-dashboard-lead=""
    >
      {output
        ? <OutputThumb type={output.type} height={thumbHeight} className={thumbClass} />
        : <EmptyThumb height={thumbHeight} className={thumbClass} />}
      <span className="block min-w-0 flex-1">
        <span className="block truncate luxia-type-overline-data" style={{ color: HT.muted }}>{`Updated ${item.updatedAt}`}</span>
        <span className="block truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={item.title}>{item.title}</span>
        <span className="block truncate luxia-type-caption" style={{ color: HT.secondary }} title={item.projectName}>{item.projectName}</span>
        <span className="mt-1 inline-flex max-w-full items-center gap-1 luxia-type-label-small" style={{ color: HT.link }}>
          <span className="truncate">{item.outputs.length > 0 ? plural(item.outputs.length, "output") : "No outputs yet"}</span>
          <LuxiaArrowRightIcon size={12} color="currentColor" aria-hidden className="shrink-0 transition-transform duration-150 group-hover/dash:translate-x-0.5" />
        </span>
      </span>
    </button>
  );
}

/** Full width: a Dashboard as a preview card — its kinds of output, name and Project. */
function DashboardCard({ item }: { item: HomeDashboardTileItem }) {
  return (
    <button type="button" onClick={item.onOpen} aria-label={openAria(item)} className={`group/dash ${HOME_TILE_PANEL_BUTTON} h-full flex-col gap-2.5 p-3`}>
      <ThumbStrip outputs={item.outputs} height={58} max={3} />
      <span className="block min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={item.title}>{item.title}</span>
          <LuxiaArrowRightIcon size={12} color={HT.link} aria-hidden className="shrink-0 transition-transform duration-150 group-hover/dash:translate-x-0.5" />
        </span>
        <span className="block truncate luxia-type-caption" style={{ color: HT.secondary }} title={contextLine(item)}>
          {contextLine(item)}
        </span>
      </span>
    </button>
  );
}

export interface DashboardsCollectionHomeTileProps {
  density: HomeCollectionDensity;
  /** Named Dashboards in Projects the user can access, most recently updated first. */
  items: readonly HomeDashboardTileItem[];
  label: string;
  empty: HomeCollectionEmptyState;
}

/**
 * Small — the count, then the latest Dashboards by name with their Project's monogram.
 *   An entry point only: no output thumbnails (they are type symbols, not real charts).
 * Medium — that Dashboard as a lead, then the other Dashboards with their Projects.
 * Large — the lead large on the left, other Dashboards on the right.
 * Full width — one preview card per Dashboard: the kinds of output it holds.
 */
export function DashboardsCollectionHomeTile({ density, items, label, empty }: DashboardsCollectionHomeTileProps) {
  const wide = density === "wide";
  // Small and Full width list every Dashboard; Medium and Large lead with the first one.
  const rest = wide || density === "small" ? items : items.slice(1);
  const candidate = Math.min(rest.length, OFFER[density]);
  const { areaRef, listRef, count } = useFittingCount(candidate, `dashboards|${density}|${items.map((item) => item.id).join(",")}`);

  if (items.length === 0) {
    return <CollectionHomeTile density={density} label={label} icon={dashboardIcon} items={[]} summary="" empty={empty} />;
  }

  const lead = items[0];
  const projectCount = new Set(items.map((item) => item.projectId)).size;
  const summary = `${plural(items.length, "Dashboard")} · ${plural(projectCount, "Project")}`;
  const shown = rest.slice(0, count);
  const hidden = rest.length - shown.length;

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={label} corner={CORNER}>
        <div className={HOME_TILE_CORNER_CLEARANCE.small} title={`${summary} · recently updated first`}>
          <TileStat value={items.length} label={items.length === 1 ? "Dashboard" : "Dashboards"} size="sm" />
        </div>
        <div ref={areaRef} className="mt-1 min-h-0 flex-1 overflow-hidden" data-home-dashboards-layout="small">
          <ul ref={listRef} className="-mx-1.5 min-w-0" aria-label={label}>
            {shown.map((item) => (
              <li key={item.id} className="min-w-0">
                <button type="button" onClick={item.onOpen} aria-label={openAria(item)} className={`${HOME_TILE_ROW} py-1`}>
                  <Monogram name={item.projectName} size={24} />
                  {/* The Project monogram names the Project; its full name is in the title and accessible name. */}
                  <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={`${item.title} · ${item.projectName}`}>{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </HomeTileSurface>
    );
  }

  if (wide) {
    return (
      <HomeTileSurface density="large" label={label} corner={CORNER} className="@container">
        <TileSummaryRow summary={`${summary} · recently updated first`} clearance={HOME_TILE_CORNER_CLEARANCE.large} />
        <div ref={areaRef} className="mt-3 min-h-0 flex-1 overflow-hidden" data-home-dashboards-layout="wide">
          <ul ref={listRef} className="grid min-w-0 grid-cols-1 gap-3 @md:grid-cols-2 @3xl:grid-cols-3" aria-label={label}>
            {shown.map((item) => <li key={item.id} className="min-w-0"><DashboardCard item={item} /></li>)}
          </ul>
        </div>
        {hidden > 0 ? <p className="pt-2 luxia-type-caption" style={{ color: HT.muted }}>{`+${hidden} more`}</p> : null}
      </HomeTileSurface>
    );
  }

  const list = (
    <div ref={areaRef} className="min-h-0 flex-1 overflow-hidden">
      <ul ref={listRef} className="-mx-1.5 flex min-w-0 flex-col" aria-label={`More ${label.toLowerCase()}`}>
        {shown.map((item) => <li key={item.id} className="min-w-0"><DashboardRow item={item} /></li>)}
      </ul>
    </div>
  );
  const more = hidden > 0 ? <p className="pt-1 luxia-type-caption" style={{ color: HT.muted }}>{`+${hidden} more`}</p> : null;

  if (density === "large") {
    return (
      <HomeTileSurface density="large" label={label} corner={CORNER} className="@container">
        <TileSummaryRow summary={`${summary} · recently updated first`} clearance={HOME_TILE_CORNER_CLEARANCE.large} />
        <div className="mt-3 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 @sm:grid-cols-2" data-home-dashboards-layout="large">
          <div className="min-h-0 min-w-0"><LeadDashboard item={lead} thumbHeight={140} layout="stack" /></div>
          <div className="flex min-h-0 min-w-0 flex-col">{list}{more}</div>
        </div>
      </HomeTileSurface>
    );
  }

  return (
    <HomeTileSurface density="medium" label={label} corner={CORNER}>
      <TileSummaryRow summary={summary} clearance={HOME_TILE_CORNER_CLEARANCE.medium} />
      <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-2" data-home-dashboards-layout="medium">
        <div className="shrink-0"><LeadDashboard item={lead} thumbHeight={76} layout="row" /></div>
        {list}
        {more}
      </div>
    </HomeTileSurface>
  );
}

// Specific Dashboard

export interface DashboardHomeTileProps {
  density: "small" | "medium" | "large";
  item: HomeDashboardTileItem;
  openProject: { ariaLabel: string; onClick: () => void };
}

/**
 * One named Dashboard.
 * Small — the kinds of output it holds (thumbnail strip), then its name and Project.
 * Medium — its outputs in Dashboard order, each with thumbnail, name and type; actions.
 * Large — the Dashboard's facts (outputs, where they came from) beside a 2 × 2
 *   grid of its first outputs.
 */
export function DashboardHomeTile({ density, item, openProject }: DashboardHomeTileProps) {
  const label = `Dashboard ${item.title}`;
  const fit = useFittingCount(density === "medium" ? Math.min(item.outputs.length, 5) : 0, `dashboard|${item.id}|${density}`);

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={label} corner={CORNER}>
        <div className={HOME_TILE_CORNER_CLEARANCE.small}>
          {item.outputs.length > 0 ? <ThumbStrip outputs={item.outputs} height={44} max={3} /> : null}
        </div>
        <div className="mt-auto flex min-w-0 items-end gap-2">
          <div className="min-w-0 flex-1">
            <HomeTileTitleAction title={item.title} onOpen={item.onOpen} ariaLabel={item.openLabel} stretched size="dense" />
            <p className="truncate luxia-type-caption" style={{ color: HT.secondary }} title={contextLine(item)}>
              {contextLine(item)}
            </p>
          </div>
          <CardArrow />
        </div>
      </HomeTileSurface>
    );
  }

  const actions = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Button type="button" variant="primary" size="compact" onClick={item.onOpen} aria-label={item.openLabel}>Open Dashboard</Button>
      <Button type="button" variant="secondary" size="compact" onClick={openProject.onClick} aria-label={openProject.ariaLabel}>Open Project</Button>
    </div>
  );
  const titleBlock = (
    <div className={`flex min-w-0 items-center gap-3 ${density === "medium" ? HOME_TILE_CORNER_CLEARANCE.medium : ""}`}>
      <Monogram name={item.projectName} size={40} />
      <div className="min-w-0">
        <HomeTileTitleAction title={item.title} onOpen={item.onOpen} ariaLabel={item.openLabel} lines={2} />
        <p className="truncate luxia-type-caption" style={{ color: HT.secondary }} title={contextLine(item)}>{contextLine(item)}</p>
      </div>
    </div>
  );
  const empty = (
    <p className="rounded-[10px] px-3.5 py-3 luxia-type-body-dense" style={{ background: HT.panel, color: HT.secondary }}>
      No outputs on this Dashboard yet. Choose them from the Project's All Outputs.
    </p>
  );

  if (density === "medium") {
    const latest = item.outputs.slice(0, fit.count);
    return (
      <HomeTileSurface density="medium" label={label} corner={CORNER}>
        <div className="flex min-h-0 flex-1 flex-col gap-3" data-home-dashboard-layout="medium">
          {titleBlock}
          {latest.length === 0 ? empty : (
            <div ref={fit.areaRef} className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <ul ref={fit.listRef} className="flex min-w-0 flex-col gap-1.5" aria-label={`Outputs on ${item.title}`}>
              {latest.map((output) => (
                <li key={output.id} className="flex min-w-0 items-center gap-3 rounded-[10px] p-1.5" style={{ background: HT.panel }}>
                  <OutputThumb type={output.type} height={42} className="w-[72px] shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate luxia-type-body-dense-strong" style={{ color: HT.text }} title={output.name}>{output.name}</span>
                    <OutputMeta output={output} />
                  </span>
                </li>
              ))}
            </ul>
            </div>
          )}
          {actions}
        </div>
      </HomeTileSurface>
    );
  }

  const fromGalaxy = item.outputs.filter((output) => output.source === "galaxy").length;
  const facts = [
    { label: "Outputs", value: String(item.outputs.length) },
    { label: "From Galaxy", value: String(fromGalaxy) },
    { label: "From Chats", value: String(item.outputs.length - fromGalaxy) },
    { label: "Updated", value: item.updatedAt },
  ];
  const grid = item.outputs.slice(0, 4);
  return (
    <HomeTileSurface density="large" label={label} corner={CORNER} className="@container">
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 @sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" data-home-dashboard-layout="large">
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          {titleBlock}
          <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-2.5 rounded-[10px] px-3.5 py-3" style={{ background: HT.panel }}>
            {facts.map((fact) => (
              <div key={fact.label} className="flex min-w-0 flex-col-reverse">
                <dt className="truncate luxia-type-caption" style={{ color: HT.muted }}>{fact.label}</dt>
                <dd className="truncate luxia-type-body-dense-strong tabular-nums" style={{ color: HT.text, fontSize: 15 }}>{fact.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <Button type="button" variant="primary" size="compact" onClick={item.onOpen} aria-label={item.openLabel}>Open Dashboard</Button>
            <OpenCue label="Open Project" ariaLabel={openProject.ariaLabel} onClick={openProject.onClick} />
          </div>
        </div>
        {grid.length === 0 ? empty : (
          <ul className="grid min-h-0 min-w-0 grid-cols-2 content-end gap-x-2 gap-y-2.5 overflow-hidden @sm:pt-11" aria-label={`Outputs on ${item.title}`}>
            {grid.map((output) => (
              <li key={output.id} className="min-w-0">
                <OutputThumb type={output.type} height={74} />
                <p className="mt-1 truncate luxia-type-body-dense-strong" style={{ color: HT.text, fontSize: 12, lineHeight: "16px" }} title={output.name}>{output.name}</p>
                <p className="truncate luxia-type-caption" style={{ color: HT.muted }}>{outputTypeLabel(output.type)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HomeTileSurface>
  );
}
