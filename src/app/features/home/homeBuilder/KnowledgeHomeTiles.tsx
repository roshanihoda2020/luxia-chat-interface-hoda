import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon, LuxiaConstellationIcon, LuxiaDatasourceIcon, LuxiaProjectsIcon } from "@/assets/icons";
import { allocateGroupRows } from "./collections";
import {
  CollectionHomeTile,
  useFittingCount,
  type HomeCollectionDensity,
  type HomeCollectionEmptyState,
} from "./CollectionHomeTile";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileStatus,
  HomeTileSurface,
  HomeTileTitleAction,
} from "./HomeTileSurface";
import {
  CardArrow,
  GlyphChip,
  GroupLabel,
  HOME_TILE_FOCUS_RING,
  HOME_TILE_ROW,
  KnowledgeGlyph,
  KnowledgeIcon,
  Monogram,
  OpenCue,
  TypeMixBar,
  TileSummaryRow,
  plural,
  type HomeKnowledgeKind,
  type MixSegment,
} from "./homeTileVisuals";

/**
 * Knowledge Home Tiles: Constellations (the knowledge Chats answer from) and
 * Data Sources (the information Luxia can access). Both lead with the kind of
 * knowledge — its type glyph — but compose differently: Constellations are
 * grouped by the Project they belong to, Data Sources form an inventory by
 * type and connector. Every value comes from the caller's real records.
 */

const constellationIcon = (size: number) => <LuxiaConstellationIcon size={size} color="currentColor" />;
const dataSourceIcon = (size: number) => <LuxiaDatasourceIcon size={size} color="currentColor" />;
const CONSTELLATION_CORNER = { icon: constellationIcon };
const DATA_SOURCE_CORNER = { icon: dataSourceIcon };

/** Group headers can't end a fitted list: drop any that lost all their rows. */
function trimTrailingGroups<T extends { kind: "group" | "item" }>(entries: readonly T[]): T[] {
  const out = [...entries];
  while (out.length > 0 && out[out.length - 1].kind === "group") out.pop();
  return out;
}

const KIND_LABEL: Record<HomeKnowledgeKind, { one: string; many: string }> = {
  database: { one: "Database", many: "Databases" },
  pdf: { one: "PDF", many: "PDFs" },
  csv: { one: "CSV", many: "CSVs" },
  sheet: { one: "Sheet", many: "Sheets" },
  file: { one: "File", many: "Files" },
};

function mixOf<T>(items: readonly T[], kindOf: (item: T) => HomeKnowledgeKind): MixSegment[] {
  const counts = new Map<HomeKnowledgeKind, number>();
  for (const item of items) counts.set(kindOf(item), (counts.get(kindOf(item)) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kind, count]) => ({ key: kind, label: KIND_LABEL[kind].one, count }));
}

// Constellations collection

export interface HomeConstellationTileItem {
  id: string;
  title: string;
  kind: HomeKnowledgeKind;
  /** "Database" | "PDF" | "CSV". */
  typeLabel: string;
  projectId: string;
  projectName?: string;
  openLabel: string;
  onOpen: () => void;
}

const CONSTELLATION_OFFER: Record<HomeCollectionDensity, number> = { small: 2, medium: 8, large: 10, wide: 6 };

function ConstellationRow({ item, showProject, dense = false }: { item: HomeConstellationTileItem; showProject: boolean; dense?: boolean }) {
  return (
    <button type="button" onClick={item.onOpen} aria-label={item.openLabel} className={`${HOME_TILE_ROW} ${dense ? "py-1" : ""}`}>
      <KnowledgeGlyph kind={item.kind} size={dense ? 20 : 24} />
      <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={item.title}>{item.title}</span>
      <span className="shrink-0 truncate luxia-type-caption" style={{ color: HT.muted, maxWidth: "45%" }} title={showProject ? item.projectName : item.typeLabel}>
        {showProject ? item.projectName : item.typeLabel}
      </span>
    </button>
  );
}

type ConstellationEntry =
  | { kind: "group"; key: string; projectName: string; count: number }
  | { kind: "item"; key: string; item: HomeConstellationTileItem };

/** Items already grouped by Project (the caller sorts by Project, then name). */
function groupByProject(items: readonly HomeConstellationTileItem[]): ConstellationEntry[] {
  const entries: ConstellationEntry[] = [];
  let current: string | undefined;
  for (const item of items) {
    if (item.projectId !== current) {
      current = item.projectId;
      entries.push({
        kind: "group",
        key: `group-${item.projectId}`,
        projectName: item.projectName ?? "Project",
        count: items.filter((entry) => entry.projectId === item.projectId).length,
      });
    }
    entries.push({ kind: "item", key: item.id, item });
  }
  return entries;
}

export interface ConstellationsCollectionHomeTileProps {
  density: HomeCollectionDensity;
  items: readonly HomeConstellationTileItem[];
  label: string;
  empty: HomeCollectionEmptyState;
}

/**
 * Small — how many, how they split by type, and the first ones by name.
 * Medium / Large — the type split, then the Constellations grouped under their Project.
 * Full width — one column per Project: its monogram, name and Constellations.
 */
export function ConstellationsCollectionHomeTile({ density, items, label, empty }: ConstellationsCollectionHomeTileProps) {
  const wide = density === "wide";
  const grouped = groupByProject(items);
  const listEntries = density === "small" ? items.map((item) => ({ kind: "item" as const, key: item.id, item })) : grouped;
  const candidate = wide ? 0 : Math.min(listEntries.length, CONSTELLATION_OFFER[density] + (density === "small" ? 0 : 4));
  const { areaRef, listRef, count } = useFittingCount(candidate, `constellations|${density}|${items.map((item) => item.id).join(",")}`);

  if (items.length === 0) {
    return <CollectionHomeTile density={density} label={label} icon={constellationIcon} items={[]} summary="" empty={empty} />;
  }

  const mix = mixOf(items, (item) => item.kind);
  const projectCount = new Set(items.map((item) => item.projectId)).size;
  const summary = `${plural(items.length, "Constellation")} · ${plural(projectCount, "Project")}`;

  if (density === "small") {
    const shown = items.slice(0, count);
    return (
      <HomeTileSurface density="small" label={label} corner={CONSTELLATION_CORNER}>
        <p className={`truncate luxia-type-body-dense-strong ${HOME_TILE_CORNER_CLEARANCE.small}`} style={{ color: HT.text }} title={summary}>
          {plural(items.length, "Constellation")}
        </p>
        <div className="mt-1.5"><TypeMixBar segments={mix} label="Constellations by type" /></div>
        <div ref={areaRef} className="mt-1 min-h-0 flex-1 overflow-hidden">
          <ul ref={listRef} className="-mx-1.5 min-w-0" aria-label={label}>
            {shown.map((item) => <li key={item.id} className="min-w-0"><ConstellationRow item={item} showProject={false} dense /></li>)}
          </ul>
        </div>
      </HomeTileSurface>
    );
  }

  if (wide) {
    const projects = [...new Map(items.map((item) => [item.projectId, item.projectName ?? "Project"])).entries()];
    const columns = projects.slice(0, 4);
    const moreProjects = projects.length - columns.length;
    return (
      <HomeTileSurface density="large" label={label} corner={CONSTELLATION_CORNER} className="@container">
        <div className={`flex min-w-0 items-center gap-6 ${HOME_TILE_CORNER_CLEARANCE.large}`}>
          <p className="shrink-0 truncate luxia-type-caption" style={{ color: HT.muted }} title={summary}>{summary}</p>
          <div className="min-w-0 max-w-[420px] flex-1"><TypeMixBar segments={mix} label="Constellations by type" /></div>
        </div>
        <ul
          className="mt-3 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 overflow-hidden @md:grid-cols-2 @3xl:grid-cols-4"
          aria-label={label}
          data-home-constellations-layout="wide"
        >
          {columns.map(([projectId, projectName]) => {
            const own = items.filter((item) => item.projectId === projectId);
            const shown = own.slice(0, CONSTELLATION_OFFER.wide);
            return (
              <li key={projectId} className="flex min-h-0 min-w-0 flex-col rounded-[10px] p-3" style={{ background: HT.panel }}>
                <p className="flex min-w-0 items-center gap-2">
                  <Monogram name={projectName} size={24} />
                  <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: HT.text }} title={projectName}>{projectName}</span>
                  <span className="shrink-0 luxia-type-caption tabular-nums" style={{ color: HT.muted }}>{own.length}</span>
                </p>
                <ul className="-mx-1.5 mt-1.5 min-h-0 min-w-0 flex-1 overflow-hidden" aria-label={`Constellations in ${projectName}`}>
                  {shown.map((item) => <li key={item.id} className="min-w-0"><ConstellationRow item={item} showProject={false} dense /></li>)}
                </ul>
                {own.length > shown.length ? (
                  <p className="pt-1 luxia-type-caption" style={{ color: HT.muted }}>{`+${own.length - shown.length} more`}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
        {moreProjects > 0 ? (
          <p className="pt-2 luxia-type-caption" style={{ color: HT.muted }}>
            {`+${plural(items.filter((item) => !columns.some(([id]) => id === item.projectId)).length, "Constellation")} in ${plural(moreProjects, "more Project")}`}
          </p>
        ) : null}
      </HomeTileSurface>
    );
  }

  const shown = trimTrailingGroups(listEntries.slice(0, count));
  const shownItems = shown.filter((entry) => entry.kind === "item").length;
  const hidden = items.length - shownItems;
  const large = density === "large";

  return (
    <HomeTileSurface density={density} label={label} corner={CONSTELLATION_CORNER} className="@container">
      <TileSummaryRow summary={summary} clearance={HOME_TILE_CORNER_CLEARANCE[density]} />
      <div className="mt-2.5 rounded-[10px] px-3 py-2.5" style={{ background: HT.panel }}>
        <TypeMixBar segments={mix} label="Constellations by type" />
      </div>
      <div ref={areaRef} className="mt-2 min-h-0 flex-1 overflow-hidden" data-home-constellations-layout={density}>
        <ul ref={listRef} className={`-mx-1.5 min-w-0 ${large ? "grid grid-cols-1 gap-x-4 @sm:grid-cols-2" : "flex flex-col"}`} aria-label={label}>
          {shown.map((entry) => (entry.kind === "group" ? (
            <li key={entry.key} className={`min-w-0 px-1.5 pt-1.5 ${large ? "@sm:col-span-2" : ""}`}>
              <GroupLabel aside={entry.count}>{entry.projectName}</GroupLabel>
            </li>
          ) : (
            <li key={entry.key} className="min-w-0"><ConstellationRow item={entry.item} showProject={false} dense={!large} /></li>
          )))}
        </ul>
      </div>
      {hidden > 0 ? <p className="pt-1.5 luxia-type-caption" style={{ color: HT.muted }}>{`+${hidden} more`}</p> : null}
    </HomeTileSurface>
  );
}

// Specific Constellation

export interface ConstellationHomeTileProps {
  density: "small" | "medium";
  item: HomeConstellationTileItem;
  description?: string;
  /** How many of the user's recent Chats use it. */
  recentChatCount: number;
  /** Data Sources the Constellation draws on, when known. */
  sourceCount?: number;
  continueChat?: { label: string; ariaLabel: string; onClick: () => void };
  /** The user's recent Chats that answer from it, newest first. */
  recentChats?: ReadonlyArray<{ id: string; title: string; when?: string; openLabel: string; onOpen: () => void }>;
}

/**
 * Small — the knowledge type leads (glyph and label), the name and Project follow.
 * Medium — identity, the Constellation's own description, its facts and actions.
 */
export function ConstellationHomeTile({ density, item, description, recentChatCount, sourceCount, continueChat, recentChats = [] }: ConstellationHomeTileProps) {
  const label = `Constellation ${item.title}`;
  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={label} corner={CONSTELLATION_CORNER}>
        <p className={`flex min-w-0 items-center gap-2 ${HOME_TILE_CORNER_CLEARANCE.small}`}>
          <KnowledgeGlyph kind={item.kind} size={26} tone="strong" />
          <span className="truncate luxia-type-overline-data" style={{ color: HT.muted }}>{item.typeLabel}</span>
        </p>
        <div className="mt-auto flex min-w-0 items-end gap-2">
          <div className="min-w-0 flex-1">
            <HomeTileTitleAction title={item.title} onOpen={item.onOpen} ariaLabel={item.openLabel} stretched size="dense" lines={2} />
            {item.projectName ? (
              <p className="flex min-w-0 items-center gap-1 truncate luxia-type-caption" style={{ color: HT.secondary }} title={item.projectName}>
                <LuxiaProjectsIcon size={11} color="currentColor" aria-hidden />
                <span className="truncate">{item.projectName}</span>
              </p>
            ) : null}
          </div>
          <CardArrow />
        </div>
      </HomeTileSurface>
    );
  }
  const facts = [
    { label: "Type", value: item.typeLabel },
    ...(typeof sourceCount === "number" ? [{ label: sourceCount === 1 ? "Data Source" : "Data Sources", value: String(sourceCount) }] : []),
    { label: "Recent Chats", value: String(recentChatCount) },
  ];
  return (
    <HomeTileSurface density="medium" label={label} corner={CONSTELLATION_CORNER}>
      <div className="flex min-h-0 flex-1 flex-col gap-3" data-home-constellation-layout="medium">
        <div className={`flex min-w-0 items-center gap-3 ${HOME_TILE_CORNER_CLEARANCE.medium}`}>
          <KnowledgeGlyph kind={item.kind} size={40} tone="strong" />
          <div className="min-w-0">
            <HomeTileTitleAction title={item.title} onOpen={item.onOpen} ariaLabel={item.openLabel} lines={2} />
            {item.projectName ? (
              <p className="flex min-w-0 items-center gap-1.5 luxia-type-caption" style={{ color: HT.secondary }}>
                <LuxiaProjectsIcon size={12} color="currentColor" aria-hidden />
                <span className="sr-only">Project: </span>
                <span className="truncate" title={item.projectName}>{item.projectName}</span>
              </p>
            ) : null}
          </div>
        </div>
        {description ? (
          <p className={`${recentChats.length > 0 ? "line-clamp-2" : "line-clamp-4"} luxia-type-body-dense`} style={{ color: HT.secondary, overflowWrap: "anywhere" }} title={description}>{description}</p>
        ) : null}
        {recentChats.length > 0 ? (
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <GroupLabel>Your recent Chats</GroupLabel>
            <ul className="-mx-1.5 mt-0.5 min-w-0" aria-label={`Recent Chats with ${item.title}`}>
              {recentChats.slice(0, 3).map((chat) => (
                <li key={chat.id} className="min-w-0">
                  <button type="button" onClick={chat.onOpen} aria-label={chat.openLabel} className={`${HOME_TILE_ROW} py-1`}>
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: HT.accent }} />
                    <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={chat.title}>{chat.title}</span>
                    {chat.when ? <span className="shrink-0 luxia-type-caption" style={{ color: HT.muted }}>{chat.when}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <dl className="mt-auto grid min-w-0 gap-2 rounded-[10px] px-3.5 py-3" style={{ background: HT.panel, gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}>
          {facts.map((fact) => (
            <div key={fact.label} className="flex min-w-0 flex-col-reverse">
              <dt className="truncate luxia-type-caption" style={{ color: HT.muted }}>{fact.label}</dt>
              <dd className="truncate luxia-type-body-dense-strong tabular-nums" style={{ color: HT.text, fontSize: 15 }} title={fact.value}>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button type="button" variant="primary" size="compact" onClick={item.onOpen} aria-label={item.openLabel}>Open Constellation</Button>
          {continueChat ? (
            <Button type="button" variant="secondary" size="compact" onClick={continueChat.onClick} aria-label={continueChat.ariaLabel}>{continueChat.label}</Button>
          ) : null}
        </div>
      </div>
    </HomeTileSurface>
  );
}

// Data Sources

/** The Data Sources library's categories, in its order (Google Sheets count as CSV, PDFs as Files). */
export type HomeDataSourceCategory = "database" | "csv" | "file";

const SOURCE_CATEGORIES: ReadonlyArray<{ key: HomeDataSourceCategory; one: string; many: string; kind: HomeKnowledgeKind }> = [
  { key: "database", one: "Database", many: "Databases", kind: "database" },
  { key: "csv", one: "CSV", many: "CSV", kind: "csv" },
  { key: "file", one: "File", many: "Files", kind: "file" },
];

export interface HomeDataSourceTileItem {
  id: string;
  name: string;
  /** Its own glyph (database, CSV, Google Sheet, document). */
  kind: HomeKnowledgeKind;
  /** The library category it is listed under. */
  category: HomeDataSourceCategory;
  /** Connector or file type ("PostgreSQL", "CSV", "PDF"). */
  typeDetail: string;
  isPrivate: boolean;
  /** The user's access, in the library's words ("Owner", "Manage", "Use", "View"). */
  myAccess?: string;
  /** The library's status ("Connected", "Ready", "Needs attention", "Failed", "Archived"). */
  statusLabel: string;
  /** Constellations the user can access that use it. */
  usedBy?: number;
  /** One real content fact ("analytics database", "3 files", "1,240 rows"). */
  contentDetail?: string;
  /** What it contains (files, tables, database and host), for the Medium tile. */
  contents?: ReadonlyArray<{ label: string; value: string }>;
  openLabel: string;
  onOpen: () => void;
}

/** Most rows a collection offers per size, before fitting to the space. */
const SOURCE_OFFER = { medium: 9, large: 10, wide: 8 } as const;

function categoryInfo(key: HomeDataSourceCategory) {
  return SOURCE_CATEGORIES.find((category) => category.key === key) ?? SOURCE_CATEGORIES[0];
}

function categoryCount(count: number, key: HomeDataSourceCategory): string {
  const info = categoryInfo(key);
  return `${count} ${count === 1 ? info.one : info.many}`;
}

/** Connected / Ready is the normal state; only other states are worth a badge. */
function notableStatus(item: HomeDataSourceTileItem): string | undefined {
  return item.statusLabel === "Connected" || item.statusLabel === "Ready" ? undefined : item.statusLabel;
}

function sourceSummary(item: HomeDataSourceTileItem): string {
  return [
    item.name,
    item.typeDetail,
    item.isPrivate ? "Private" : null,
    item.myAccess ? `Your access: ${item.myAccess}` : null,
    notableStatus(item),
    item.usedBy ? `Used by ${plural(item.usedBy, "Constellation")} you can access` : null,
  ].filter(Boolean).join(" · ");
}

function sourceAriaLabel(item: HomeDataSourceTileItem): string {
  return [item.openLabel, item.isPrivate ? "Private" : null, notableStatus(item)].filter(Boolean).join(", ");
}

function PrivateMark() {
  return (
    <span className="inline-flex shrink-0" style={{ color: HT.muted }} title="Private">
      <Lock size={12} strokeWidth={2} aria-hidden />
    </span>
  );
}

/** "usage": two lines plus "Used by N" on the right (Full width only, where there is room). */
function SourceRow({ item, detail }: { item: HomeDataSourceTileItem; detail: "dense" | "full" | "usage" }) {
  const status = notableStatus(item);
  const meta = [item.typeDetail, item.contentDetail].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={item.onOpen}
      aria-label={sourceAriaLabel(item)}
      title={sourceSummary(item)}
      className={`${HOME_TILE_ROW} ${detail === "dense" ? "py-1" : ""}`}
    >
      <KnowledgeGlyph kind={item.kind} size={detail === "dense" ? 20 : 26} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: HT.title }}>{item.name}</span>
          {item.isPrivate ? <PrivateMark /> : null}
          {status ? <HomeTileStatus>{status}</HomeTileStatus> : null}
        </span>
        {detail !== "dense" && meta ? (
          <span className="block truncate luxia-type-caption" style={{ color: HT.secondary }}>{meta}</span>
        ) : null}
      </span>
      {detail === "dense" ? (
        <span className="shrink-0 truncate luxia-type-caption" style={{ color: HT.muted, maxWidth: "42%" }}>{item.typeDetail}</span>
      ) : detail === "usage" && item.usedBy ? (
        <span className="shrink-0 luxia-type-caption tabular-nums" style={{ color: HT.muted }}>{`Used by ${item.usedBy}`}</span>
      ) : null}
    </button>
  );
}

/**
 * Most rows that fit `areaRef` (never below `min`), re-measured when the
 * observed bounds change size. Rows are dropped until the content fits.
 */
function useFittingCapacity(max: number, min: number, resetKey: string, boundsRef?: RefObject<HTMLElement | null>) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(max);

  useLayoutEffect(() => {
    setCapacity(max);
  }, [max, resetKey]);

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area || capacity <= min) return;
    if (area.scrollHeight > area.clientHeight + 1) setCapacity(capacity - 1);
  });

  useEffect(() => {
    const target = boundsRef?.current ?? areaRef.current;
    if (!target || typeof ResizeObserver === "undefined") return;
    let width = target.clientWidth;
    let height = target.clientHeight;
    const observer = new ResizeObserver(() => {
      if (Math.abs(target.clientWidth - width) < 1 && Math.abs(target.clientHeight - height) < 1) return;
      width = target.clientWidth;
      height = target.clientHeight;
      setCapacity(max);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [max, boundsRef]);

  return { areaRef, capacity: Math.min(capacity, max) };
}

type SourceGroup = { key: HomeDataSourceCategory; items: readonly HomeDataSourceTileItem[] };

function groupsOf(items: readonly HomeDataSourceTileItem[]): SourceGroup[] {
  return SOURCE_CATEGORIES
    .map((category) => ({ key: category.key, items: items.filter((item) => item.category === category.key) }))
    .filter((group) => group.items.length > 0);
}

/** "+N more": opens the Data Sources library (which lists every category). */
function MoreSources({ count, category, onOpenAll }: { count: number; category: HomeDataSourceCategory; onOpenAll?: () => void }) {
  const text = `+${count} more`;
  if (!onOpenAll) {
    return <p className="px-1.5 pt-0.5 luxia-type-caption" style={{ color: HT.muted }}>{text}</p>;
  }
  return (
    <button
      type="button"
      onClick={onOpenAll}
      aria-label={`${count} more ${categoryInfo(category).many} — open the Data Sources library`}
      className={`group/more mt-0.5 inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 luxia-type-label-small hover:underline ${HOME_TILE_FOCUS_RING}`}
      style={{ color: HT.link }}
      data-home-sources-more={category}
    >
      {text}
      <LuxiaArrowRightIcon size={11} color="currentColor" aria-hidden className="transition-transform duration-150 group-hover/more:translate-x-0.5" />
    </button>
  );
}

function PanelHeading({ group }: { group: SourceGroup }) {
  const info = categoryInfo(group.key);
  return (
    <p className="flex min-w-0 items-center gap-2 px-0.5">
      <GlyphChip size={24}><KnowledgeIcon kind={info.kind} size={12} /></GlyphChip>
      <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: HT.text }}>{info.many}</span>
      <span className="shrink-0 luxia-type-caption tabular-nums" style={{ color: HT.muted }}>{group.items.length}</span>
    </p>
  );
}

/**
 * Categories stacked in library order. Every category keeps a heading and at
 * least one row; the rows that fit are shared between them, and each trimmed
 * category ends with "+N more". Whole rows only, no inner scrolling.
 */
function SourceGroupStack({
  groups,
  max,
  detail,
  heading,
  onOpenAll,
  boundsRef,
  className = "",
}: {
  groups: readonly SourceGroup[];
  max: number;
  detail: "dense" | "full" | "usage";
  heading: "label" | "panel";
  onOpenAll?: () => void;
  boundsRef?: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const sizes = groups.map((group) => group.items.length);
  const total = sizes.reduce((sum, size) => sum + size, 0);
  const resetKey = groups.map((group) => `${group.key}:${group.items.map((item) => item.id).join(",")}`).join("|");
  const { areaRef, capacity } = useFittingCapacity(Math.min(total, max), Math.min(groups.length, total), resetKey, boundsRef);
  const rows = allocateGroupRows(sizes, capacity);

  return (
    <div ref={areaRef} className={`min-h-0 min-w-0 overflow-hidden ${className}`}>
      {groups.map((group, index) => (
        <section key={group.key} aria-label={categoryCount(group.items.length, group.key)} className={index > 0 ? "mt-2" : ""}>
          {heading === "panel" ? (
            <PanelHeading group={group} />
          ) : (
            <div className="px-1.5"><GroupLabel aside={group.items.length}>{categoryInfo(group.key).many}</GroupLabel></div>
          )}
          {rows[index] > 0 ? (
            <ul className="mt-0.5 min-w-0" aria-label={categoryInfo(group.key).many}>
              {group.items.slice(0, rows[index]).map((item) => (
                <li key={item.id} className="min-w-0"><SourceRow item={item} detail={detail} /></li>
              ))}
            </ul>
          ) : null}
          {group.items.length > rows[index] ? (
            <MoreSources count={group.items.length - rows[index]} category={group.key} onOpenAll={onOpenAll} />
          ) : null}
        </section>
      ))}
    </div>
  );
}

export interface DataSourcesCollectionHomeTileProps {
  density: HomeCollectionDensity;
  /** Accessible Data Sources, already ordered (A–Z). */
  items: readonly HomeDataSourceTileItem[];
  label: string;
  empty: HomeCollectionEmptyState;
  /** Opens the Data Sources library (View all and "+N more"). */
  onOpenAll?: () => void;
}

/**
 * Grouped as the Data Sources library groups them: Databases, CSV, Files.
 * Small — the total and a labelled count per category, with View all.
 * Medium — every category with its fitted rows.
 * Large — Databases on the left, CSV and Files on the right.
 * Full width — one panel per category in equal columns, each sized to its content.
 */
export function DataSourcesCollectionHomeTile({ density, items, label, empty, onOpenAll }: DataSourcesCollectionHomeTileProps) {
  const boundsRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) {
    return <CollectionHomeTile density={density} label={label} icon={dataSourceIcon} items={[]} summary="" empty={empty} />;
  }

  const groups = groupsOf(items);
  const total = plural(items.length, "Data Source");
  const viewAll = onOpenAll ? { label: "View all", ariaLabel: "View all Data Sources", onClick: onOpenAll } : undefined;

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={label} corner={DATA_SOURCE_CORNER}>
        <p className={`truncate luxia-type-body-dense-strong ${HOME_TILE_CORNER_CLEARANCE.small}`} style={{ color: HT.text }}>{total}</p>
        <ul
          className="mt-2 grid min-w-0 gap-1"
          style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}
          aria-label="Data Sources by category"
          data-home-sources-tally=""
        >
          {groups.map((group) => {
            const info = categoryInfo(group.key);
            return (
              <li key={group.key} className="flex min-w-0 flex-col rounded-[8px] px-1.5 py-1.5" style={{ background: HT.panel }} title={categoryCount(group.items.length, group.key)}>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="inline-flex shrink-0" style={{ color: HT.icon }}><KnowledgeIcon kind={info.kind} size={13} /></span>
                  <span className="luxia-type-body-dense-strong tabular-nums" style={{ color: HT.text }}>{group.items.length}</span>
                </span>
                <span className="truncate luxia-type-caption" style={{ color: HT.secondary }}>{group.items.length === 1 ? info.one : info.many}</span>
              </li>
            );
          })}
        </ul>
        {viewAll ? (
          <div className="mt-auto flex justify-end pt-1">
            <OpenCue label={viewAll.label} ariaLabel={viewAll.ariaLabel} onClick={viewAll.onClick} />
          </div>
        ) : null}
      </HomeTileSurface>
    );
  }

  const summary = `${total} · A–Z by type`;

  if (density === "medium") {
    return (
      <HomeTileSurface density="medium" label={label} corner={DATA_SOURCE_CORNER}>
        <TileSummaryRow summary={summary} clearance={HOME_TILE_CORNER_CLEARANCE.medium} action={viewAll} />
        <SourceGroupStack
          groups={groups}
          max={SOURCE_OFFER.medium}
          detail="dense"
          heading="label"
          onOpenAll={onOpenAll}
          className="mt-2 flex-1"
        />
      </HomeTileSurface>
    );
  }

  const wide = density === "wide";
  const database = groups.filter((group) => group.key === "database");
  const others = groups.filter((group) => group.key !== "database");
  const panel = "luxia-home-source-panel flex max-h-full min-h-0 min-w-0 flex-col self-start";

  return (
    <HomeTileSurface density="large" label={label} corner={DATA_SOURCE_CORNER} className="@container">
      <TileSummaryRow summary={summary} clearance={HOME_TILE_CORNER_CLEARANCE.large} action={viewAll} />
      {wide ? (
        <>
          {/* Equal columns, one per category; each panel fits its content. */}
          <div
            ref={boundsRef}
            className="mt-3 hidden min-h-0 flex-1 gap-3 @2xl:grid"
            style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))`, gridTemplateRows: "minmax(0, 1fr)" }}
            data-home-sources-layout="wide"
          >
            {groups.map((group) => (
              <div key={group.key} className={panel}>
                <SourceGroupStack groups={[group]} max={SOURCE_OFFER.wide} detail="usage" heading="panel" onOpenAll={onOpenAll} boundsRef={boundsRef} />
              </div>
            ))}
          </div>
          {/* Narrow containers: the categories stacked, as at Medium. */}
          <SourceGroupStack
            groups={groups}
            max={SOURCE_OFFER.wide}
            detail="usage"
            heading="label"
            onOpenAll={onOpenAll}
            className="mt-2 flex-1 @2xl:hidden"
          />
        </>
      ) : database.length > 0 && others.length > 0 ? (
        <div ref={boundsRef} className="mt-2.5 grid min-h-0 flex-1 grid-cols-2 gap-2.5" style={{ gridTemplateRows: "minmax(0, 1fr)" }} data-home-sources-layout="large">
          <div className={panel}>
            <SourceGroupStack groups={database} max={SOURCE_OFFER.large} detail="full" heading="panel" onOpenAll={onOpenAll} boundsRef={boundsRef} />
          </div>
          <div className={panel}>
            <SourceGroupStack groups={others} max={SOURCE_OFFER.large} detail="full" heading="panel" onOpenAll={onOpenAll} boundsRef={boundsRef} />
          </div>
        </div>
      ) : (
        <SourceGroupStack
          groups={groups}
          max={SOURCE_OFFER.large}
          detail="full"
          heading="label"
          onOpenAll={onOpenAll}
          className="mt-2 flex-1"
        />
      )}
    </HomeTileSurface>
  );
}

// Specific Data Source

/**
 * Small — the source's glyph beside its name, connector or file type, and status.
 * Medium — identity, what it contains when known, the library facts (type,
 *   format, your access, status, Constellations you can access using it) and Open Data Source.
 */
export function DataSourceHomeTile({ density, item }: { density: "small" | "medium"; item: HomeDataSourceTileItem }) {
  const label = `Data Source ${item.name}`;
  const category = categoryInfo(item.category);
  const identity = [category.one, item.typeDetail !== category.one ? item.typeDetail : null, item.isPrivate ? "Private" : null]
    .filter(Boolean).join(" · ");
  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={label} corner={DATA_SOURCE_CORNER}>
        <div className="flex min-h-0 min-w-0 flex-1 items-center gap-3">
          <KnowledgeGlyph kind={item.kind} size={44} tone="strong" />
          <div className="min-w-0 flex-1">
            <div className={HOME_TILE_CORNER_CLEARANCE.small}>
              <HomeTileTitleAction title={item.name} onOpen={item.onOpen} ariaLabel={item.openLabel} stretched size="dense" lines={2} />
            </div>
            <p className="truncate luxia-type-caption" style={{ color: HT.secondary }} title={sourceSummary(item)}>{identity}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate luxia-type-caption" style={{ color: HT.muted }}>
            {[notableStatus(item), item.contentDetail].filter(Boolean).join(" · ")}
          </span>
          <CardArrow />
        </div>
      </HomeTileSurface>
    );
  }
  const facts: Array<{ label: string; value: string }> = [
    { label: "Type", value: category.one },
    ...(item.typeDetail !== category.one ? [{ label: item.category === "database" ? "Connector" : "Format", value: item.typeDetail }] : []),
    ...(item.myAccess ? [{ label: "Your access", value: item.myAccess }] : []),
    { label: "Status", value: item.statusLabel },
    ...(item.usedBy ? [{ label: "Used by", value: plural(item.usedBy, "Constellation") }] : []),
  ];
  return (
    <HomeTileSurface density="medium" label={label} corner={DATA_SOURCE_CORNER}>
      <div className="flex min-h-0 flex-1 flex-col gap-3" data-home-source-layout="medium">
        <div className={`flex min-w-0 items-center gap-3 ${HOME_TILE_CORNER_CLEARANCE.medium}`}>
          <KnowledgeGlyph kind={item.kind} size={40} tone="strong" />
          <div className="min-w-0">
            <HomeTileTitleAction title={item.name} onOpen={item.onOpen} ariaLabel={item.openLabel} lines={2} />
            <p className="truncate luxia-type-caption" style={{ color: HT.secondary }}>{identity}</p>
          </div>
        </div>
        {item.contents && item.contents.length > 0 ? (
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <GroupLabel aside={item.contentDetail}>Contains</GroupLabel>
            <ul className="mt-1 min-w-0 divide-y divide-[var(--home-tile-divider)]" aria-label={`What ${item.name} contains`}>
              {item.contents.slice(0, 4).map((entry) => (
                <li key={`${entry.label}-${entry.value}`} className="flex min-w-0 items-baseline justify-between gap-3 py-1.5">
                  <span className="min-w-0 truncate luxia-type-body-dense" style={{ color: HT.text }} title={entry.value}>{entry.value}</span>
                  <span className="shrink-0 luxia-type-caption" style={{ color: HT.muted }}>{entry.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : item.contentDetail ? (
          <ContentNote>{item.contentDetail}</ContentNote>
        ) : null}
        <dl className="mt-auto grid min-w-0 grid-cols-2 gap-x-4 gap-y-2.5 rounded-[10px] px-3.5 py-3" style={{ background: HT.panel }}>
          {facts.map((fact) => (
            <div key={fact.label} className="flex min-w-0 flex-col-reverse">
              <dt className="truncate luxia-type-caption" style={{ color: HT.muted }}>{fact.label}</dt>
              <dd className="truncate luxia-type-body-dense-strong" style={{ color: HT.text }} title={fact.value}>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div>
          <Button type="button" variant="primary" size="compact" onClick={item.onOpen} aria-label={item.openLabel}>Open Data Source</Button>
        </div>
      </div>
    </HomeTileSurface>
  );
}

function ContentNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex min-w-0 items-center gap-2 luxia-type-body-dense" style={{ color: HT.text }}>
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: HT.accent }} aria-hidden />
      <span className="min-w-0 truncate">{children}</span>
    </p>
  );
}

