import type { ReactNode } from "react";
import { ChevronRight, History } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon, LuxiaChatIcon, LuxiaGalaxyIcon } from "@/assets/icons";
import { getHeroCornerMarkerStyle } from "../HomeHero";
import type { HomeHeroContent } from "../types";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileCornerMarker,
  HomeTileSurface,
  type HomeTileDensity,
} from "./HomeTileSurface";

const SOURCE_LABEL: Record<string, string> = { database: "DB", csv: "CSV", pdf: "PDF" };

/**
 * The shared tile card. Your focus defaults to the Featured style — the same dark
 * Galaxy panel as the full-width hero — and follows Soft or Default when chosen.
 */
function FocusSurface({ density, children, label }: { density: HomeTileDensity; children: ReactNode; label: string }) {
  return (
    <HomeTileSurface density={density} label={label} className={density === "small" ? "justify-center" : ""}>
      {children}
    </HomeTileSurface>
  );
}

/** Same corner as the full-width hero: the focus item's icon in the hero's colour for that item. */
function FocusCorner({ hero, galaxy, density }: { hero: HomeHeroContent; galaxy: boolean; density: HomeTileDensity }) {
  return (
    <HomeTileCornerMarker
      density={density}
      tone={getHeroCornerMarkerStyle(hero, galaxy ? "galaxy-conversation" : "chat")}
      icon={(size) => (galaxy
        ? <LuxiaGalaxyIcon size={size} color="currentColor" />
        : <LuxiaChatIcon size={size} color="currentColor" />)}
    />
  );
}

function Overline({ children }: { children: ReactNode }) {
  return (
    <p className="truncate luxia-type-overline-data" style={{ color: HT.muted }}>
      {children}
    </p>
  );
}

/**
 * Your focus at Small / Medium / Large. Full width keeps the original HomeHero.
 * Uses the same resolved focus content (`HomeHeroContent`) and actions as the hero.
 */
export function FocusHomeTile({
  hero,
  density,
  onPrimary,
  onSecondary,
}: {
  hero: HomeHeroContent;
  density: HomeTileDensity;
  onPrimary: () => void;
  onSecondary?: () => void;
}) {
  const empty = hero.kind === "empty";
  const galaxy = hero.kind === "galaxySession";
  const kindLabel = empty ? undefined : galaxy ? "Galaxy" : "Chat";
  const project = hero.projectName ?? (empty ? undefined : hero.context);
  const source = hero.constellationSource ? SOURCE_LABEL[hero.constellationSource] : undefined;
  const contextLine = [project, !galaxy ? hero.constellationName : undefined].filter(Boolean).join(" · ");
  const status = [hero.selectedByYou ? "Selected by you" : null, hero.meta ?? null].filter(Boolean).join(" · ");

  if (density === "small") {
    return (
      <FocusSurface density="small" label={`Your focus: ${hero.title}`}>
        <FocusCorner hero={hero} galaxy={galaxy} density="small" />
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 flex-1">
            {kindLabel ? <Overline>{kindLabel}</Overline> : null}
            <button
              type="button"
              onClick={onPrimary}
              aria-label={`${hero.primaryLabel}: ${hero.title}`}
              title={hero.title}
              className="block max-w-full truncate text-left luxia-type-body-dense-strong outline-none after:absolute after:inset-0 after:content-['']"
              style={{ color: HT.title }}
            >
              {hero.title}
            </button>
            <p className="truncate luxia-type-caption" style={{ color: HT.text }}>
              {empty ? hero.context : hero.primaryLabel}
            </p>
          </div>
          <ChevronRight
            size={16}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 transition-transform duration-150 group-hover/tile:translate-x-0.5"
            style={{ color: HT.accent }}
          />
        </div>
      </FocusSurface>
    );
  }

  return (
    <FocusSurface density={density} label={`Your focus: ${hero.title}`}>
      <FocusCorner hero={hero} galaxy={galaxy} density={density} />
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {kindLabel ? (
          <div className={`flex min-h-6 min-w-0 items-center gap-3 ${HOME_TILE_CORNER_CLEARANCE[density]}`}>
            <Overline>{kindLabel}</Overline>
          </div>
        ) : null}
        <div className="min-w-0 space-y-1.5">
          <h3
            className={`${density === "large" ? "line-clamp-1" : "line-clamp-2"} luxia-type-title-card ${kindLabel ? "" : HOME_TILE_CORNER_CLEARANCE[density]}`}
            style={{
              color: HT.title,
              fontSize: density === "large" ? 22 : 18,
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
              overflowWrap: "anywhere",
            }}
            title={hero.title}
          >
            {hero.title}
          </h3>
          {empty ? (
            <p className="line-clamp-2 luxia-type-body-dense" style={{ color: HT.secondary }}>
              {hero.context}
            </p>
          ) : null}
          {!empty && contextLine ? (
            <p className="flex min-w-0 items-center gap-1.5 luxia-type-body-dense" style={{ color: HT.text }}>
              <span className="truncate" title={contextLine}>{contextLine}</span>
              {source && !galaxy ? (
                <span
                  className="shrink-0 rounded-[6px] px-1.5 py-px luxia-type-caption"
                  style={{ color: HT.text, background: HT.chipBg, border: `1px solid ${HT.chipBorder}` }}
                >
                  {source}
                </span>
              ) : null}
            </p>
          ) : null}
          {!empty && hero.description ? (
            <p
              className={`${density === "large" ? "line-clamp-3" : "line-clamp-2"} pt-0.5 luxia-type-body-dense`}
              style={{ color: HT.secondary, overflowWrap: "anywhere" }}
            >
              {hero.description}
            </p>
          ) : null}
          {status ? (
            <p className="flex min-w-0 items-center gap-1.5 luxia-type-caption" style={{ color: HT.muted }}>
              <History size={13} strokeWidth={1.75} aria-hidden className="shrink-0" />
              <span className="truncate">{status}</span>
            </p>
          ) : null}
        </div>
      </div>
      <div
        className="mt-4 flex min-w-0 flex-wrap items-center gap-2 border-t pt-3"
        style={{ borderColor: HT.divider }}
      >
        <Button type="button" variant="primary" size="compact" onClick={onPrimary}>
          {hero.primaryLabel}
        </Button>
        {hero.secondaryLabel && onSecondary ? (
          <Button type="button" variant="tertiary" size="compact" onClick={onSecondary}>
            {hero.secondaryLabel}
            <LuxiaArrowRightIcon size={13} aria-hidden className="ml-0.5" />
          </Button>
        ) : null}
      </div>
    </FocusSurface>
  );
}
