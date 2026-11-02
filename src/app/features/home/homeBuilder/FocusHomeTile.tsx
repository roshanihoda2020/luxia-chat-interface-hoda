import type { ReactNode } from "react";
import { ChevronRight, History } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon, LuxiaChatIcon, LuxiaGalaxyIcon } from "@/assets/icons";
import { HS } from "../homeSurfaces";
import type { HomeHeroContent } from "../types";
import type { HomeTileDensity } from "./HomeTileSurface";

const SOURCE_LABEL: Record<string, string> = { database: "DB", csv: "CSV", pdf: "PDF" };

/** Same dark Galaxy panel as the full-width Your focus hero, so Focus is recognisable at every size. */
function FocusSurface({ density, children, label }: { density: HomeTileDensity; children: ReactNode; label: string }) {
  return (
    <article
      aria-label={label}
      className={`group/tile relative flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--luxia-radius-12)] border transition-shadow duration-150 hover:shadow-[var(--luxia-shadow-md)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--luxia-border-focus)] ${
        density === "small" ? "justify-center px-4 py-3.5" : "p-5"
      }`}
      style={{ background: HS.heroSurface, borderColor: HS.heroBorder, boxShadow: HS.heroShadow }}
    >
      {children}
    </article>
  );
}

function FocusIcon({ galaxy, size }: { galaxy: boolean; size: number }) {
  return (
    <span
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]"
      style={{ color: HS.heroText, background: "var(--luxia-opacity-white-08)" }}
      aria-hidden
    >
      {galaxy ? <LuxiaGalaxyIcon size={size} color="currentColor" /> : <LuxiaChatIcon size={size} color="currentColor" />}
    </span>
  );
}

function Overline({ children }: { children: ReactNode }) {
  return (
    <p className="truncate luxia-type-overline-data" style={{ color: HS.heroMuted }}>
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
  const typeLabel = empty ? "Your focus" : `Your focus · ${galaxy ? "Galaxy" : "Chat"}`;
  const project = hero.projectName ?? (empty ? undefined : hero.context);
  const source = hero.constellationSource ? SOURCE_LABEL[hero.constellationSource] : undefined;
  const contextLine = [project, !galaxy ? hero.constellationName : undefined].filter(Boolean).join(" · ");
  const status = [hero.selectedByYou ? "Selected by you" : null, hero.meta ?? null].filter(Boolean).join(" · ");

  if (density === "small") {
    return (
      <FocusSurface density="small" label={`Your focus: ${hero.title}`}>
        <div className="flex min-w-0 items-center gap-3">
          <FocusIcon galaxy={galaxy} size={18} />
          <div className="min-w-0 flex-1">
            <Overline>{typeLabel}</Overline>
            <button
              type="button"
              onClick={onPrimary}
              aria-label={`${hero.primaryLabel}: ${hero.title}`}
              title={hero.title}
              className="block max-w-full truncate text-left luxia-type-body-dense-strong outline-none after:absolute after:inset-0 after:content-['']"
              style={{ color: HS.heroText }}
            >
              {hero.title}
            </button>
            <p className="truncate luxia-type-caption" style={{ color: HS.heroContextValue }}>
              {empty ? hero.context : hero.primaryLabel}
            </p>
          </div>
          <ChevronRight
            size={16}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 transition-transform duration-150 group-hover/tile:translate-x-0.5"
            style={{ color: HS.heroAccent }}
          />
        </div>
      </FocusSurface>
    );
  }

  return (
    <FocusSurface density={density} label={`Your focus: ${hero.title}`}>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FocusIcon galaxy={galaxy} size={20} />
          <Overline>{typeLabel}</Overline>
        </div>
        <div className="min-w-0 space-y-1.5">
          <h3
            className={`${density === "large" ? "line-clamp-1" : "line-clamp-2"} luxia-type-title-card`}
            style={{
              color: HS.heroText,
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
            <p className="line-clamp-2 luxia-type-body-dense" style={{ color: HS.heroDescription }}>
              {hero.context}
            </p>
          ) : null}
          {!empty && contextLine ? (
            <p className="flex min-w-0 items-center gap-1.5 luxia-type-body-dense" style={{ color: HS.heroContextValue }}>
              <span className="truncate" title={contextLine}>{contextLine}</span>
              {source && !galaxy ? (
                <span
                  className="shrink-0 rounded-[6px] px-1.5 py-px luxia-type-caption"
                  style={{ color: HS.heroText, background: "var(--luxia-opacity-white-08)" }}
                >
                  {source}
                </span>
              ) : null}
            </p>
          ) : null}
          {density === "large" && hero.description ? (
            <p className="line-clamp-2 luxia-type-body-dense" style={{ color: HS.heroDescription, overflowWrap: "anywhere" }}>
              {hero.description}
            </p>
          ) : null}
          {status ? (
            <p className="flex min-w-0 items-center gap-1.5 luxia-type-caption" style={{ color: HS.heroSoft }}>
              <History size={13} strokeWidth={1.75} aria-hidden className="shrink-0" />
              <span className="truncate">{status}</span>
            </p>
          ) : null}
        </div>
      </div>
      <div
        className="mt-4 flex min-w-0 flex-wrap items-center gap-2 border-t pt-3"
        style={{ borderColor: HS.heroBorder }}
      >
        <Button type="button" variant="primary" size="compact" onClick={onPrimary}>
          {hero.primaryLabel}
        </Button>
        {hero.secondaryLabel && onSecondary ? (
          <Button
            type="button"
            variant="tertiary"
            size="compact"
            onClick={onSecondary}
            className="!border-[var(--luxia-opacity-white-24)] !text-[var(--luxia-opacity-white-80)] hover:!bg-[var(--luxia-opacity-white-08)]"
          >
            {hero.secondaryLabel}
            <LuxiaArrowRightIcon size={13} aria-hidden className="ml-0.5" />
          </Button>
        ) : null}
      </div>
    </FocusSurface>
  );
}
