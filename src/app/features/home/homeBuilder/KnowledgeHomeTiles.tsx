import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { LuxiaConstellationIcon, LuxiaDatasourceIcon, LuxiaProjectsIcon } from "@/assets/icons";
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
  HOME_TILE_ROW,
  KnowledgeGlyph,
  KnowledgeIcon,
  Monogram,
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

export interface HomeDataSourceTileItem {
  id: string;
  name: string;
  kind: HomeKnowledgeKind;
  /** "Database" | "PDF" | "CSV" | "File". */
  typeLabel: string;
  /** Connector name when it adds to the type ("PostgreSQL", "Snowflake"). */
  connectorLabel?: string;
  /** "Organizational" | "Private". */
  access?: string;
  /** Status when not active ("Inactive", "Archived"). */
  status?: string;
  /** One real content fact ("analytics database", "3 files", "1,240 rows"). */
  contentDetail?: string;
  /** What it contains (files, tables, database and host), for the Medium tile. */
  contents?: ReadonlyArray<{ label: string; value: string }>;
  openLabel: string;
  onOpen: () => void;
}

const SOURCE_OFFER: Record<HomeCollectionDensity, number> = { small: 2, medium: 9, large: 10, wide: 6 };

/** The source's identity line: connector (or type), access, and status when not active. */
function sourceLine(item: HomeDataSourceTileItem, withType = false): string {
  return [withType ? item.typeLabel : null, item.connectorLabel, item.access, item.status].filter(Boolean).join(" · ");
}

function DataSourceRow({ item, dense = false }: { item: HomeDataSourceTileItem; dense?: boolean }) {
  const line = sourceLine(item);
  return (
    <button type="button" onClick={item.onOpen} aria-label={item.openLabel} className={`${HOME_TILE_ROW} ${dense ? "py-1" : ""}`}>
      <KnowledgeGlyph kind={item.kind} size={dense ? 20 : 26} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={item.name}>{item.name}</span>
          {item.status ? <HomeTileStatus>{item.status}</HomeTileStatus> : null}
        </span>
        {!dense && line ? <span className="block truncate luxia-type-caption" style={{ color: HT.secondary }} title={line}>{line}</span> : null}
      </span>
      {dense && item.connectorLabel ? (
        <span className="shrink-0 truncate luxia-type-caption" style={{ color: HT.muted, maxWidth: "42%" }}>{item.connectorLabel}</span>
      ) : null}
    </button>
  );
}

/** One chip per type: its glyph and how many sources (an inventory you can read at a glance). */
function TypeTally({ groups, size = "small" }: { groups: Array<{ kind: HomeKnowledgeKind; count: number }>; size?: "small" | "large" }) {
  return (
    <ul className="flex min-w-0 flex-wrap gap-1.5" aria-label="Data Sources by type">
      {groups.map((group) => {
        const label = group.count === 1 ? KIND_LABEL[group.kind].one : KIND_LABEL[group.kind].many;
        return (
          <li
            key={group.kind}
            className={`inline-flex items-center gap-1.5 rounded-[8px] ${size === "large" ? "py-1 pl-1 pr-2.5" : "py-0.5 pl-0.5 pr-2"}`}
            style={{ background: HT.panel }}
            title={`${group.count} ${label}`}
          >
            <GlyphChip size={size === "large" ? 24 : 20}><KnowledgeIcon kind={group.kind} size={size === "large" ? 12 : 11} /></GlyphChip>
            <span className="luxia-type-body-dense-strong tabular-nums" style={{ color: HT.text }}>{group.count}</span>
            {size === "large" ? <span className="luxia-type-caption" style={{ color: HT.secondary }}>{label}</span> : <span className="sr-only">{label}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function groupsOf(items: readonly HomeDataSourceTileItem[]) {
  const order: HomeKnowledgeKind[] = ["database", "sheet", "csv", "pdf", "file"];
  return order
    .map((kind) => ({ kind, items: items.filter((item) => item.kind === kind) }))
    .filter((group) => group.items.length > 0);
}

type SourceEntry =
  | { kind: "group"; key: string; label: string; count: number }
  | { kind: "item"; key: string; item: HomeDataSourceTileItem };

export interface DataSourcesCollectionHomeTileProps {
  density: HomeCollectionDensity;
  /** Accessible Data Sources, already ordered (A–Z). */
  items: readonly HomeDataSourceTileItem[];
  label: string;
  empty: HomeCollectionEmptyState;
}

/**
 * Small — an inventory tally by type, then the first sources.
 * Medium / Large — the sources grouped by type, with connector and access.
 * Full width — one column per type, each with its sources.
 */
export function DataSourcesCollectionHomeTile({ density, items, label, empty }: DataSourcesCollectionHomeTileProps) {
  const groups = groupsOf(items);
  const entries: SourceEntry[] = density === "small"
    ? items.map((item) => ({ kind: "item", key: item.id, item }))
    : groups.flatMap((group) => [
      { kind: "group" as const, key: `group-${group.kind}`, label: KIND_LABEL[group.kind].many, count: group.items.length },
      ...group.items.map((item) => ({ kind: "item" as const, key: item.id, item })),
    ]);
  const wide = density === "wide";
  const candidate = wide ? 0 : Math.min(entries.length, SOURCE_OFFER[density] + (density === "small" ? 0 : groups.length));
  const { areaRef, listRef, count } = useFittingCount(candidate, `sources|${density}|${items.map((item) => item.id).join(",")}`);

  if (items.length === 0) {
    return <CollectionHomeTile density={density} label={label} icon={dataSourceIcon} items={[]} summary="" empty={empty} />;
  }

  const tally = groups.map((group) => ({ kind: group.kind, count: group.items.length }));
  const summary = `${plural(items.length, "Data Source")} · A–Z by type`;

  if (density === "small") {
    const shown = items.slice(0, count);
    return (
      <HomeTileSurface density="small" label={label} corner={DATA_SOURCE_CORNER}>
        <div className={`flex min-w-0 items-center gap-2 ${HOME_TILE_CORNER_CLEARANCE.small}`}>
          <span className="shrink-0 luxia-type-body-dense-strong" style={{ color: HT.text }}>{plural(items.length, "Data Source")}</span>
        </div>
        <div className="mt-1.5"><TypeTally groups={tally} /></div>
        <div ref={areaRef} className="mt-1 min-h-0 flex-1 overflow-hidden">
          <ul ref={listRef} className="-mx-1.5 min-w-0" aria-label={label}>
            {shown.map((item) => <li key={item.id} className="min-w-0"><DataSourceRow item={item} dense /></li>)}
          </ul>
        </div>
      </HomeTileSurface>
    );
  }

  if (wide) {
    return (
      <HomeTileSurface density="large" label={label} corner={DATA_SOURCE_CORNER} className="@container">
        <TileSummaryRow summary={summary} clearance={HOME_TILE_CORNER_CLEARANCE.large} />
        <ul
          className="mt-3 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 overflow-hidden @md:grid-cols-2 @3xl:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]"
          aria-label={label}
          data-home-sources-layout="wide"
        >
          {groups.map((group) => {
            const shown = group.items.slice(0, SOURCE_OFFER.wide);
            return (
              <li key={group.kind} className="flex min-h-0 min-w-0 flex-col rounded-[10px] p-3" style={{ background: HT.panel }}>
                <p className="flex min-w-0 items-center gap-2">
                  <KnowledgeGlyph kind={group.kind} size={26} tone="strong" />
                  <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: HT.text }}>{KIND_LABEL[group.kind].many}</span>
                  <span className="shrink-0 luxia-type-caption tabular-nums" style={{ color: HT.muted }}>{group.items.length}</span>
                </p>
                <ul className="-mx-1.5 mt-1.5 min-h-0 min-w-0 flex-1 overflow-hidden" aria-label={KIND_LABEL[group.kind].many}>
                  {shown.map((item) => (
                    <li key={item.id} className="min-w-0">
                      <button type="button" onClick={item.onOpen} aria-label={item.openLabel} className={`${HOME_TILE_ROW} py-1`}>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={item.name}>{item.name}</span>
                          <span className="block truncate luxia-type-caption" style={{ color: HT.muted }} title={sourceLine(item)}>
                            {[item.connectorLabel, item.contentDetail, item.access === "Private" ? "Private" : null, item.status].filter(Boolean).join(" · ") || item.access}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {group.items.length > shown.length ? (
                  <p className="pt-1 luxia-type-caption" style={{ color: HT.muted }}>{`+${group.items.length - shown.length} more`}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </HomeTileSurface>
    );
  }

  const shown = trimTrailingGroups(entries.slice(0, count));
  const hidden = items.length - shown.filter((entry) => entry.kind === "item").length;
  const large = density === "large";

  return (
    <HomeTileSurface density={density} label={label} corner={DATA_SOURCE_CORNER} className="@container">
      <TileSummaryRow summary={summary} clearance={HOME_TILE_CORNER_CLEARANCE[density]} />
      {large ? <div className="mt-2.5"><TypeTally groups={tally} size="large" /></div> : null}
      <div ref={areaRef} className="mt-2 min-h-0 flex-1 overflow-hidden" data-home-sources-layout={density}>
        <ul ref={listRef} className={`-mx-1.5 min-w-0 ${large ? "grid grid-cols-1 gap-x-4 @sm:grid-cols-2" : "flex flex-col"}`} aria-label={label}>
          {shown.map((entry) => (entry.kind === "group" ? (
            <li key={entry.key} className={`min-w-0 px-1.5 pt-1.5 ${large ? "@sm:col-span-2" : ""}`}>
              <GroupLabel aside={entry.count}>{entry.label}</GroupLabel>
            </li>
          ) : (
            <li key={entry.key} className="min-w-0"><DataSourceRow item={entry.item} dense={!large} /></li>
          )))}
        </ul>
      </div>
      {hidden > 0 ? <p className="pt-1.5 luxia-type-caption" style={{ color: HT.muted }}>{`+${hidden} more`}</p> : null}
    </HomeTileSurface>
  );
}

// Specific Data Source

/**
 * Small — the source's glyph beside its name, connector and access.
 * Medium — identity, a facts panel (type, connector, access, status) and what
 *   it contains when known, with Open Data Source.
 */
export function DataSourceHomeTile({ density, item }: { density: "small" | "medium"; item: HomeDataSourceTileItem }) {
  const label = `Data Source ${item.name}`;
  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={label} corner={DATA_SOURCE_CORNER}>
        <div className="flex min-h-0 min-w-0 flex-1 items-center gap-3">
          <KnowledgeGlyph kind={item.kind} size={44} tone="strong" />
          <div className="min-w-0 flex-1">
            <div className={HOME_TILE_CORNER_CLEARANCE.small}>
              <HomeTileTitleAction title={item.name} onOpen={item.onOpen} ariaLabel={item.openLabel} stretched size="dense" lines={2} />
            </div>
            <p className="truncate luxia-type-caption" style={{ color: HT.secondary }} title={sourceLine(item, true)}>
              {item.connectorLabel ?? item.typeLabel}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate luxia-type-caption" style={{ color: HT.muted }}>
            {[item.status, item.access, item.contentDetail].filter(Boolean).join(" · ")}
          </span>
          <CardArrow />
        </div>
      </HomeTileSurface>
    );
  }
  const facts: Array<{ label: string; value: string }> = [
    { label: "Type", value: item.typeLabel },
    ...(item.connectorLabel ? [{ label: "Connector", value: item.connectorLabel }] : []),
    ...(item.access ? [{ label: "Access", value: item.access }] : []),
    { label: "Status", value: item.status ?? "Active" },
  ];
  return (
    <HomeTileSurface density="medium" label={label} corner={DATA_SOURCE_CORNER}>
      <div className="flex min-h-0 flex-1 flex-col gap-3" data-home-source-layout="medium">
        <div className={`flex min-w-0 items-center gap-3 ${HOME_TILE_CORNER_CLEARANCE.medium}`}>
          <KnowledgeGlyph kind={item.kind} size={40} tone="strong" />
          <div className="min-w-0">
            <HomeTileTitleAction title={item.name} onOpen={item.onOpen} ariaLabel={item.openLabel} lines={2} />
            <p className="truncate luxia-type-caption" style={{ color: HT.secondary }}>{sourceLine(item, true)}</p>
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

