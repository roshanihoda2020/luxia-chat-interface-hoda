export const HS = {
  pageBg: "var(--luxia-surface-subtle)",
  /** Shared Home content max-width — center leftover space on wide CSS viewports */
  contentMax: "1240px",
  /** Alias of contentMax for section call sites */
  sectionMax: "1240px",
  /** @deprecated alias of sectionMax — keep for existing call sites */
  heroSectionMax: "1240px",
  /** Fluid Home page horizontal padding (viewport-based; not zoom detection) */
  pagePadInline: "clamp(var(--luxia-spacing-24), 3vw, var(--luxia-spacing-48))",

  heroSurface: "var(--luxia-gradient-galaxy-panel)",
  heroBorder: "var(--luxia-galaxy-btn-secondary-border)",
  heroShadow: "var(--luxia-galaxy-shell-shadow)",
  heroText: "var(--luxia-text-inverse)",
  heroMuted: "var(--luxia-opacity-white-64)",
  heroSoft: "var(--luxia-opacity-white-48)",
  /** Secondary body on Hero — ~76% on-dark contrast */
  heroDescription: "rgba(255, 255, 255, 0.76)",
  /** Context values on Hero — stronger than labels */
  heroContextValue: "rgba(255, 255, 255, 0.88)",
  heroAccent: "var(--luxia-brand-tertiary)",
  heroRadius: "var(--luxia-radius-16)",
  /** Internal Hero copy column — keeps title/description from stretching */
  heroInnerContentMax: "720px",
  heroDescriptionMax: "720px",

  searchBg: "var(--luxia-surface)",
  searchBorder: "var(--luxia-border-default)",
  searchFocus: "var(--luxia-opacity-brand-secondary-16)",

  sectionHeading: "var(--luxia-purple-70)",
  sourceDatabase: "var(--luxia-purple-50)",
  sourcePdf: "var(--luxia-blue-50)",
  sourceDatabaseSoft: "var(--luxia-purple-60)",
  sourcePdfSoft: "var(--luxia-blue-60)",
  accentGalaxy: "var(--luxia-purple-70)",
  accentGalaxySoft: "var(--luxia-opacity-brand-primary-08)",
  accentChat: "var(--luxia-blue-60)",
  accentProject: "var(--luxia-purple-70)",
  projectIcon: "var(--luxia-purple-50)",
  pinActive: "var(--luxia-purple-70)",
  recentHover: "var(--luxia-opacity-brand-primary-04)",
  menuBg: "var(--luxia-surface)",
  menuBorder: "var(--luxia-border-default)",
  menuShadow: "var(--luxia-shadow-md)",
  menuRadius: "var(--luxia-radius-12)",
  menuHover: "var(--luxia-opacity-brand-primary-08)",
  sectionIconContinue: "var(--luxia-brand-tertiary)",
  sectionIconProjects: "var(--luxia-purple-60)",
  viewAllBg: "transparent",
  viewAllHover: "var(--luxia-opacity-brand-primary-04)",
  viewAllText: "var(--luxia-purple-70)",
} as const;

export const HI = {
  sectionGap: "mb-7",
  sectionHeadingGap: "mb-4",
  cardPadFeatured: "p-6",
  cardPadSupporting: "p-5",
  cardStack: "flex flex-col",
} as const;

export type HomeCardVariant =
  | "featuredProject"
  | "supportingProject"
  | "emptyProject";

export interface HomeCardStyle {
  bg: string;
  border: string;
  hover: string;
  hoverBorder: string;
}

const HOME_CARD: Record<HomeCardVariant, HomeCardStyle> = {
  featuredProject: {
    bg: "var(--luxia-opacity-brand-primary-08)",
    border: "var(--luxia-opacity-brand-primary-16)",
    hover: "var(--luxia-opacity-brand-primary-12)",
    hoverBorder: "var(--luxia-opacity-brand-primary-24)",
  },
  supportingProject: {
    bg: "var(--luxia-surface)",
    border: "var(--luxia-border-default)",
    hover: "var(--luxia-opacity-brand-primary-04)",
    hoverBorder: "var(--luxia-opacity-brand-primary-12)",
  },
  emptyProject: {
    bg: "var(--luxia-surface)",
    border: "var(--luxia-border-default)",
    hover: "var(--luxia-surface)",
    hoverBorder: "var(--luxia-border-default)",
  },
};

export function getHomeCardStyle(variant: HomeCardVariant): HomeCardStyle {
  return HOME_CARD[variant];
}

export function getProjectCardTypography(style: HomeCardStyle) {
  return {
    title: "var(--luxia-purple-70)",
    primary: "var(--luxia-text-secondary)",
    secondary: "var(--luxia-text-muted)",
    accent: HS.accentProject,
  };
}

export function getSourceAccentColor(
  source?: "database" | "pdf",
  emphasis: "default" | "soft" = "default",
): string | undefined {
  if (source === "database") {
    return emphasis === "soft" ? HS.sourceDatabaseSoft : HS.sourceDatabase;
  }
  if (source === "pdf") {
    return emphasis === "soft" ? HS.sourcePdfSoft : HS.sourcePdf;
  }
  return undefined;
}
