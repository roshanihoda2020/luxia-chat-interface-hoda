/**
 * Shared Luxia page layout tokens.
 * All branded pages must share identical outer gutters and top offset.
 * Only max-width differs by variant.
 */
export type LuxiaPageVariant = "standard" | "wide" | "workspace";

export type LuxiaPageFrameVariant =
  | LuxiaPageVariant
  | "default"
  | "full";

function resolveVariant(variant: LuxiaPageFrameVariant): LuxiaPageVariant {
  if (variant === "default") return "standard";
  if (variant === "full") return "workspace";
  return variant;
}

/**
 * Generous enterprise caps so reduced browser zoom does not leave a tiny
 * left-aligned column. Content stays centered with balanced whitespace.
 */
export const LUXIA_PAGE_LAYOUT = {
  gutter: "clamp(var(--luxia-spacing-24, 24px), 3vw, var(--luxia-spacing-48, 48px))",
  padTop: "2rem",
  padBlockEnd: "2rem",
  maxWidth: {
    /** Home, Project Overview, Access Levels list, Members, Data Sources, archives. */
    standard: "1920px",
    /** Constellation Settings, capability management, Access Level editor, dense editors. */
    wide: "2240px",
    /** Chat / Galaxy — no content max; full available width. */
    workspace: "none",
  },
  /** Settings nav column width when a side nav is used. */
  settingsNavWidth: "13.5rem",
  settingsColumnGap: "1.75rem",
} as const;

export function getLuxiaPageMaxWidth(
  variant: LuxiaPageFrameVariant = "standard",
): string {
  const resolved = resolveVariant(variant);
  return LUXIA_PAGE_LAYOUT.maxWidth[resolved];
}

export function getLuxiaPageFrameStyle(
  variant: LuxiaPageFrameVariant = "standard",
): {
  width: string;
  maxWidth: string;
  marginInline: string;
  paddingInline: string;
  boxSizing: "border-box";
} {
  const maxWidth = getLuxiaPageMaxWidth(variant);
  return {
    width: "100%",
    maxWidth: maxWidth === "none" ? "100%" : maxWidth,
    marginInline: "auto",
    paddingInline: LUXIA_PAGE_LAYOUT.gutter,
    boxSizing: "border-box",
  };
}

/**
 * Heading region width for pages whose body uses the wide frame.
 * Keeps eyebrow/title/breadcrumb/actions aligned with standard pages.
 */
export function getLuxiaPageHeadingRegionStyle(): {
  width: string;
  maxWidth: string;
  marginInline: string;
  boxSizing: "border-box";
} {
  return {
    width: "100%",
    maxWidth: LUXIA_PAGE_LAYOUT.maxWidth.standard,
    marginInline: "auto",
    boxSizing: "border-box",
  };
}

export type { LuxiaPageVariant as LuxiaPageLayoutVariant };
