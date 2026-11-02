import type { ReactNode } from "react";
import { HS } from "../homeSurfaces";
import { HOME_TILE_SECTION_HEADER } from "./grid";

export interface HomeTileSection {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  /** Defaults to the Home Projects section icon colour. */
  iconColor?: string;
}

/**
 * Outer section heading above a Home Tile, matching the existing Home
 * SectionHeader ("Your focus", "Pinned projects"): icon box, heading-h3 title,
 * caption subtitle. Fixed height and single-line truncation so narrow tiles
 * keep their cards aligned with neighbours in the same row.
 */
export function HomeTileSectionHeader({ section, id }: { section: HomeTileSection; id?: string }) {
  return (
    <div
      className="flex min-w-0 shrink-0 items-start gap-3"
      style={{ height: HOME_TILE_SECTION_HEADER.heightPx, marginBottom: HOME_TILE_SECTION_HEADER.gapPx }}
    >
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center"
        style={{ color: section.iconColor ?? HS.sectionIconProjects }}
        aria-hidden
      >
        {section.icon}
      </span>
      <div className="min-w-0">
        <h2
          id={id}
          className="truncate luxia-type-heading-h3"
          style={{ color: HS.sectionHeading, letterSpacing: "-0.02em" }}
          title={section.title}
        >
          {section.title}
        </h2>
        {section.subtitle ? (
          <p
            className="mt-0.5 truncate luxia-type-caption"
            style={{ color: "var(--luxia-text-secondary)" }}
            title={section.subtitle}
          >
            {section.subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
