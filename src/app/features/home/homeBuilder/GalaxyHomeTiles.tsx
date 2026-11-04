import { Clock3 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon, LuxiaConstellationIcon, LuxiaGalaxyIcon, LuxiaProjectsIcon } from "@/assets/icons";
import type { HomeChatActivity } from "./chatActivity";
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
  GlyphChip,
  HOME_TILE_PANEL_BUTTON,
  HOME_TILE_ROW,
  KnowledgeGlyph,
  KnowledgeStack,
  knowledgeKindOf,
} from "./homeTileVisuals";

/**
 * Galaxy Home Tiles: one specific Galaxy (Small / Medium) and the Galaxies
 * collection (Small / Medium / Large / Full width). A Galaxy belongs to one
 * Project, so everything shown is that Project's real data — its name, counts,
 * the Constellations the user can access and the Project's last update — plus,
 * when the user's recent work has it, when they last opened the Galaxy itself.
 * Project activity is always labelled as Project activity.
 */
export interface HomeGalaxyTileItem {
  /** The Project id (one Galaxy per Project). */
  id: string;
  /** "<Project> Galaxy". */
  title: string;
  projectName: string;
  constellationCount: number;
  sourceCount: number;
  /** The Project's last update ("2h ago"). */
  projectUpdatedAt: string;
  /** Constellations of this Project the user can access (never invented). */
  constellations: ReadonlyArray<{ id: string; label: string; typeLabel?: string }>;
  /** When the user last opened this Galaxy, from their recent work; absent when unknown. */
  lastOpened?: HomeChatActivity;
  openLabel: string;
  onOpen: () => void;
}

const galaxyIcon = (size: number) => <LuxiaGalaxyIcon size={size} color="currentColor" />;
const CORNER = { icon: galaxyIcon };

function plural(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

/**
 * The Galaxy's size in one phrase. A Galaxy with no Constellations says so in
 * words instead of "0 Constellations · 0 Sources"; Sources show only when there are some.
 */
export function galaxyCountsLabel(galaxy: Pick<HomeGalaxyTileItem, "constellationCount" | "sourceCount">): string {
  const sources = galaxy.sourceCount > 0 ? plural(galaxy.sourceCount, "Source") : null;
  if (galaxy.constellationCount === 0) return ["No Constellations yet", sources].filter(Boolean).join(" · ");
  return [plural(galaxy.constellationCount, "Constellation"), sources].filter(Boolean).join(" · ");
}

/** `compact`: Constellations only (Sources stay in the tooltip), for narrow cards that also show a time. */
function CountsText({ galaxy, className = "", compact = false }: { galaxy: HomeGalaxyTileItem; className?: string; compact?: boolean }) {
  const label = galaxyCountsLabel(galaxy);
  const text = compact
    ? galaxy.constellationCount === 0 ? "No Constellations yet" : plural(galaxy.constellationCount, "Constellation")
    : label;
  return (
    <span
      className={`block truncate luxia-type-caption ${className}`}
      style={{ color: galaxy.constellationCount === 0 ? HT.muted : HT.secondary }}
      title={label}
    >
      {text}
    </span>
  );
}

/** The Project's last update, labelled as such for tooltips and screen readers. */
function ProjectUpdated({ galaxy, long = false }: { galaxy: HomeGalaxyTileItem; long?: boolean }) {
  return (
    <span className="shrink-0 luxia-type-caption" style={{ color: HT.muted }} title={`Project updated ${galaxy.projectUpdatedAt}`}>
      <span className={long ? "" : "sr-only"}>{"Project updated "}</span>
      {galaxy.projectUpdatedAt}
    </span>
  );
}

/**
 * What the Galaxy reasons over, as glyphs: one per accessible Constellation
 * (by type). When the Constellations exist but none is known to this user
 * yet, a single Constellation glyph with the count; nothing for an empty Galaxy.
 */
function GalaxyConstellationMarks({ galaxy, size = 20, max = 3, showMore = true }: { galaxy: HomeGalaxyTileItem; size?: number; max?: number; showMore?: boolean }) {
  const label = galaxyCountsLabel(galaxy);
  if (galaxy.constellationCount === 0) return null;
  if (galaxy.constellations.length === 0) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5" role="img" aria-label={label} title={label}>
        <GlyphChip size={size}><LuxiaConstellationIcon size={Math.round(size * 0.55)} color="currentColor" /></GlyphChip>
        <span className="luxia-type-caption tabular-nums" style={{ color: HT.muted }}>{galaxy.constellationCount}</span>
      </span>
    );
  }
  return (
    <KnowledgeStack
      kinds={galaxy.constellations.map((constellation) => knowledgeKindOf(constellation.typeLabel))}
      total={galaxy.constellationCount}
      max={max}
      size={size}
      label={label}
      showMore={showMore}
    />
  );
}

// Specific Galaxy

/** Medium shows up to this many accessible Constellations; the rest are counted. */
const MEDIUM_CONSTELLATIONS = 3;

export interface GalaxyHomeTileProps {
  density: "small" | "medium";
  galaxy: HomeGalaxyTileItem;
  openProject: { ariaLabel: string; onClick: () => void };
}

/**
 * Small — name and size; the whole card opens the Galaxy.
 * Medium — the Galaxy and its Project at the top; in the middle what the Galaxy
 * reasons over (its Constellations, with Constellation and Source counts); at
 * the bottom when it was last opened (or the Project's last update) and the actions.
 */
export function GalaxyHomeTile({ density, galaxy, openProject }: GalaxyHomeTileProps) {
  const label = `Galaxy ${galaxy.title}`;

  if (density === "small") {
    // The Galaxy and what it orchestrates: its Project's Constellations, by type.
    return (
      <HomeTileSurface density="small" label={label} corner={CORNER}>
        <div className={HOME_TILE_CORNER_CLEARANCE.small}>
          <HomeTileTitleAction title={galaxy.title} onOpen={galaxy.onOpen} ariaLabel={galaxy.openLabel} stretched size="dense" lines={2} />
          <p className="truncate luxia-type-caption" style={{ color: HT.muted }} title={galaxy.lastOpened ? galaxy.lastOpened.exact : `Project updated ${galaxy.projectUpdatedAt}`}>
            {galaxy.lastOpened ? galaxy.lastOpened.long : `Project updated ${galaxy.projectUpdatedAt}`}
          </p>
        </div>
        <div className="mt-auto flex min-w-0 items-center gap-2.5">
          <GalaxyConstellationMarks galaxy={galaxy} size={24} showMore={false} />
          <CountsText galaxy={galaxy} compact className="min-w-0 flex-1" />
          <CardArrow />
        </div>
      </HomeTileSurface>
    );
  }

  const shown = galaxy.constellations.slice(0, MEDIUM_CONSTELLATIONS);
  const more = Math.max(0, galaxy.constellationCount - shown.length);
  const activity = galaxy.lastOpened
    ? { text: galaxy.lastOpened.long, title: galaxy.lastOpened.exact }
    : { text: `Project updated ${galaxy.projectUpdatedAt}`, title: undefined };

  return (
    <HomeTileSurface density="medium" label={label} corner={CORNER}>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-3" data-home-galaxy-layout="medium">
        {/* The Galaxy and the Project it belongs to */}
        <div className={`min-w-0 space-y-1.5 ${HOME_TILE_CORNER_CLEARANCE.medium}`}>
          <HomeTileTitleAction title={galaxy.title} onOpen={galaxy.onOpen} ariaLabel={galaxy.openLabel} lines={2} />
          <p className="flex min-w-0 items-center gap-1.5 luxia-type-caption" style={{ color: HT.secondary }}>
            <span className="shrink-0" style={{ color: HT.icon }} aria-hidden>
              <LuxiaProjectsIcon size={13} color="currentColor" />
            </span>
            <span className="sr-only">Project: </span>
            <span className="min-w-0 truncate" title={galaxy.projectName}>{galaxy.projectName}</span>
          </p>
        </div>

        {/* What the Galaxy asks across: the Project's Constellations */}
        <div className="min-w-0 rounded-[10px] px-3.5 py-3" style={{ background: HT.panel }} data-home-galaxy-context="">
          <p className="truncate luxia-type-body-dense-strong" style={{ color: galaxy.constellationCount === 0 ? HT.secondary : HT.text }} title={galaxyCountsLabel(galaxy)}>
            {galaxyCountsLabel(galaxy)}
          </p>
          {shown.length > 0 ? (
            <ul className="mt-1.5 min-w-0 divide-y divide-[var(--home-tile-divider)]" aria-label={`Constellations in ${galaxy.title}`}>
              {shown.map((constellation) => (
                <li key={constellation.id} className="flex min-w-0 items-center gap-2 py-1">
                  <KnowledgeGlyph kind={knowledgeKindOf(constellation.typeLabel)} size={20} />
                  <span className="min-w-0 flex-1 truncate luxia-type-caption" style={{ color: HT.text }} title={constellation.label}>
                    {constellation.label}
                  </span>
                  {constellation.typeLabel ? (
                    <span className="shrink-0 luxia-type-caption" style={{ color: HT.muted }}>{constellation.typeLabel}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 luxia-type-caption" style={{ color: HT.muted }}>
              {galaxy.constellationCount === 0
                ? `Constellations added to ${galaxy.projectName} appear here.`
                : "You don't have access to this Project's Constellations yet."}
            </p>
          )}
          {shown.length > 0 && more > 0 ? (
            <p className="mt-1 luxia-type-caption" style={{ color: HT.muted }}>{`+${more} more`}</p>
          ) : null}
        </div>

        <div className="min-w-0 space-y-3">
          <p className="flex min-w-0 items-center gap-1.5 luxia-type-caption" style={{ color: HT.muted }} title={activity.title}>
            <Clock3 size={13} strokeWidth={2} aria-hidden className="shrink-0" />
            <span className="truncate">{activity.text}</span>
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button type="button" variant="primary" size="compact" onClick={galaxy.onOpen} aria-label={galaxy.openLabel}>
              Open Galaxy
            </Button>
            <Button type="button" variant="secondary" size="compact" onClick={openProject.onClick} aria-label={openProject.ariaLabel}>
              Open Project
            </Button>
          </div>
        </div>
      </div>
    </HomeTileSurface>
  );
}

// Galaxies collection

/** Most Galaxies each size offers; the tile shows only as many as fit its slot. */
const OFFER: Record<HomeCollectionDensity, number> = { small: 3, medium: 6, large: 8, wide: 8 };

/** Small / Medium: name, then when its Project changed; its Constellations as glyphs on the right. */
function GalaxyRow({ galaxy, dense = false }: { galaxy: HomeGalaxyTileItem; dense?: boolean }) {
  const empty = galaxy.constellationCount === 0;
  return (
    <button
      type="button"
      onClick={galaxy.onOpen}
      aria-label={galaxy.openLabel}
      className={`${HOME_TILE_ROW} ${dense ? "py-1" : ""}`}
      data-home-galaxy-empty={empty ? "" : undefined}
    >
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate ${dense ? "luxia-type-body-dense" : "luxia-type-body-dense-strong"}`}
          style={{ color: empty ? HT.secondary : HT.title }}
          title={galaxy.title}
        >
          {galaxy.title}
        </span>
        {dense ? null : (
          <span className="flex min-w-0 items-center gap-1.5 luxia-type-caption" style={{ color: HT.muted }}>
            {empty ? <span className="truncate">No Constellations yet</span> : <ProjectUpdated galaxy={galaxy} long />}
          </span>
        )}
      </span>
      {empty ? (
        <span className="shrink-0 luxia-type-caption" style={{ color: HT.muted }} aria-hidden>—</span>
      ) : dense ? (
        <span className="inline-flex shrink-0 items-center gap-1 luxia-type-caption tabular-nums" style={{ color: HT.secondary }} title={galaxyCountsLabel(galaxy)}>
          <LuxiaConstellationIcon size={12} color="currentColor" aria-hidden />
          {galaxy.constellationCount}
          <span className="sr-only"> Constellations</span>
        </span>
      ) : (
        <GalaxyConstellationMarks galaxy={galaxy} size={22} />
      )}
    </button>
  );
}

/** Large / Full width: an orchestration card — name, Constellation glyphs and counts, the Project's last update. */
function GalaxyCard({ galaxy }: { galaxy: HomeGalaxyTileItem }) {
  return (
    <button
      type="button"
      onClick={galaxy.onOpen}
      aria-label={galaxy.openLabel}
      className={`group/galaxy ${HOME_TILE_PANEL_BUTTON} h-full flex-col justify-between gap-2.5 px-3.5 py-3`}
    >
      <span className="block min-w-0">
        <span className="block min-w-0 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={galaxy.title}>{galaxy.title}</span>
        <ProjectUpdated galaxy={galaxy} long />
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <GalaxyConstellationMarks galaxy={galaxy} size={22} showMore={false} />
        <CountsText galaxy={galaxy} compact className="min-w-0 flex-1" />
        <LuxiaArrowRightIcon size={12} color={HT.link} aria-hidden className="shrink-0 transition-transform duration-150 group-hover/galaxy:translate-x-0.5" />
      </span>
    </button>
  );
}

export interface GalaxiesCollectionHomeTileProps {
  density: HomeCollectionDensity;
  /** Accessible Galaxies, already ordered (latest Project activity first). */
  galaxies: readonly HomeGalaxyTileItem[];
  label: string;
  /** Full count line (e.g. "48 Galaxies · latest Project activity first"). */
  summary: string;
  /** Count only (e.g. "48 Galaxies"). */
  count: string;
  empty: HomeCollectionEmptyState;
}

/**
 * Small — how many have Constellations, then the first Galaxies with their glyphs.
 * Medium — rows: name, the Project's last update and the Constellation glyphs.
 * Large — two columns of orchestration cards.
 * Full width — cards for the Galaxies with Constellations.
 * There is no all-Galaxies page, so the footer counts the rest instead of linking.
 */
export function GalaxiesCollectionHomeTile({ density, galaxies, label, summary, count, empty }: GalaxiesCollectionHomeTileProps) {
  const wide = density === "wide";
  const withConstellations = galaxies.filter((galaxy) => galaxy.constellationCount > 0);
  const primary = wide ? withConstellations : galaxies;
  const candidate = Math.min(primary.length, OFFER[density]);
  const { areaRef, listRef, count: fitting } = useFittingCount(candidate, `galaxies|${density}|${galaxies.map((galaxy) => galaxy.id).join(",")}`);

  if (galaxies.length === 0) {
    return <CollectionHomeTile density={density} label={label} icon={galaxyIcon} items={[]} summary={summary} empty={empty} />;
  }

  const shown = primary.slice(0, fitting);
  const readyLine = `${withConstellations.length} with Constellations`;

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={label} corner={CORNER}>
        <p className={`flex min-w-0 items-baseline gap-1.5 ${HOME_TILE_CORNER_CLEARANCE.small}`} title={summary}>
          <span className="shrink-0 luxia-type-body-dense-strong" style={{ color: HT.text }}>{count}</span>
          <span className="min-w-0 truncate luxia-type-caption" style={{ color: HT.muted }}>{readyLine}</span>
        </p>
        <div ref={areaRef} className="mt-1 min-h-0 flex-1 overflow-hidden">
          <ul ref={listRef} className="-mx-1.5 min-w-0" aria-label={label}>
            {shown.map((galaxy) => <li key={galaxy.id} className="min-w-0"><GalaxyRow galaxy={galaxy} dense /></li>)}
          </ul>
        </div>
      </HomeTileSurface>
    );
  }

  const surfaceDensity = wide ? "large" : density;
  const hidden = galaxies.length - shown.length;
  const header = (
    <p className={`truncate luxia-type-caption ${HOME_TILE_CORNER_CLEARANCE[surfaceDensity]}`} style={{ color: HT.muted }} title={summary}>
      {`${summary} · ${readyLine}`}
    </p>
  );

  if (wide) {
    const restHidden = Math.max(0, withConstellations.length - shown.length);
    return (
      <HomeTileSurface density="large" label={label} corner={CORNER} className="@container">
        {header}
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3" data-home-galaxies-layout="wide">
          <div ref={areaRef} className="min-h-0 flex-1 overflow-hidden">
            <ul ref={listRef} className="grid min-w-0 grid-cols-1 gap-2.5 @sm:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4" aria-label={`${label} with Constellations`}>
              {shown.map((galaxy) => <li key={galaxy.id} className="min-w-0"><GalaxyCard galaxy={galaxy} /></li>)}
            </ul>
          </div>
          {restHidden > 0 ? <p className="luxia-type-caption" style={{ color: HT.muted }}>{`+${restHidden} more with Constellations`}</p> : null}
        </div>
      </HomeTileSurface>
    );
  }

  const listClass = density === "medium"
    ? "-mx-1.5 flex min-w-0 flex-col"
    : "grid min-w-0 grid-cols-1 gap-2 @sm:grid-cols-2";

  return (
    <HomeTileSurface density={surfaceDensity} label={label} corner={CORNER} className="@container">
      {header}
      <div ref={areaRef} className="mt-2.5 min-h-0 flex-1 overflow-hidden" data-home-galaxies-layout={density}>
        <ul ref={listRef} className={listClass} aria-label={label}>
          {shown.map((galaxy) => (
            <li key={galaxy.id} className="min-w-0">
              {density === "large" ? <GalaxyCard galaxy={galaxy} /> : <GalaxyRow galaxy={galaxy} />}
            </li>
          ))}
        </ul>
      </div>
      {hidden > 0 ? (
        <p className="mt-auto pt-2 luxia-type-caption" style={{ color: HT.muted }}>{`+${hidden} more`}</p>
      ) : null}
    </HomeTileSurface>
  );
}
