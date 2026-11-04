import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { HS } from "../homeSurfaces";
import { HOME_TILE_SECTION_HEADER } from "./grid";

export interface HomeTileSection {
  title: string;
  /** Shorter heading used when the full title doesn't fit; the full title stays its accessible name. */
  shortTitle?: string;
  subtitle?: string;
  /** Shorter subtitle used when the full one doesn't fit; the full one stays as its tooltip. */
  shortSubtitle?: string;
  icon: ReactNode;
  /** Defaults to the Home Projects section icon colour. */
  iconColor?: string;
}

/** True when an element's text is wider than the element (single-line truncation). */
function overflows(element: HTMLElement | null): boolean {
  return Boolean(element && element.scrollWidth > element.clientWidth + 1);
}

/**
 * Outer section heading above a Home Tile, matching the existing Home
 * SectionHeader ("Your focus", "Pinned projects"): icon box, heading-h3 title,
 * caption subtitle. Fixed height so cards in a row stay aligned. When the full
 * title or subtitle doesn't fit the tile's width, its short version is shown
 * instead (measured, so it works at any width and font); on very narrow
 * headings the icon gives its room to the name (the card's purple corner
 * already shows the category). Full texts stay as accessible name and tooltip.
 */
export function HomeTileSectionHeader({
  section,
  id,
  compact = false,
}: {
  section: HomeTileSection;
  id?: string;
  /** Always use the short title, if any (no measuring). */
  compact?: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const [short, setShort] = useState({ title: false, subtitle: false });
  const textKey = `${section.title}|${section.subtitle ?? ""}`;

  // Measure with the full texts; switch to the short ones only where the full ones overflow.
  useLayoutEffect(() => {
    const measure = () => {
      setShort({ title: false, subtitle: false });
    };
    measure();
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined") return;
    let width = row.clientWidth;
    const observer = new ResizeObserver(() => {
      if (Math.abs(row.clientWidth - width) < 1) return;
      width = row.clientWidth;
      measure();
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, [textKey]);

  useLayoutEffect(() => {
    const title = !short.title && section.shortTitle && overflows(titleRef.current);
    const subtitle = !short.subtitle && section.shortSubtitle && overflows(subtitleRef.current);
    if (title || subtitle) setShort({ title: short.title || Boolean(title), subtitle: short.subtitle || Boolean(subtitle) });
  });

  const shownTitle = (compact || short.title) && section.shortTitle ? section.shortTitle : section.title;
  const shownSubtitle = short.subtitle && section.shortSubtitle ? section.shortSubtitle : section.subtitle;
  return (
    <div
      ref={rowRef}
      className="luxia-home-tile-heading flex min-w-0 shrink-0 items-start gap-3"
      style={{ height: HOME_TILE_SECTION_HEADER.heightPx, marginBottom: HOME_TILE_SECTION_HEADER.gapPx }}
    >
      <span
        className="luxia-home-tile-heading-icon mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center"
        style={{ color: section.iconColor ?? HS.sectionIconProjects }}
        aria-hidden
      >
        {section.icon}
      </span>
      <div className="min-w-0">
        <h2
          ref={titleRef}
          id={id}
          className="truncate luxia-type-heading-h3"
          style={{ color: HS.sectionHeading, letterSpacing: "-0.02em" }}
          title={section.title}
          aria-label={shownTitle !== section.title ? section.title : undefined}
        >
          {shownTitle}
        </h2>
        {shownSubtitle ? (
          <p
            ref={subtitleRef}
            className="mt-0.5 truncate luxia-type-caption"
            style={{ color: "var(--luxia-text-secondary)" }}
            title={section.subtitle}
          >
            {shownSubtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
