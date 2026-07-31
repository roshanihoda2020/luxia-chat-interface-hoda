export const HS = {
  pageBg: "var(--luxia-surface-subtle)",
  contentMax: "1240px",
  overviewContentMax: "1480px",
  libraryContentMax: "1480px",
  sectionMax: "1240px",
  /** @deprecated alias of sectionMax — keep for existing call sites */
  heroSectionMax: "1240px",
  pagePadInline: "clamp(var(--luxia-spacing-24), 3vw, var(--luxia-spacing-48))",
  workspacePadInline: "clamp(var(--luxia-spacing-24), 2vw, 40px)",

  heroSurface: "var(--luxia-gradient-galaxy-panel)",
  heroBorder: "var(--luxia-galaxy-btn-secondary-border)",
  heroShadow: "var(--luxia-galaxy-shell-shadow)",
  heroText: "var(--luxia-text-inverse)",
  heroMuted: "var(--luxia-opacity-white-64)",
  heroSoft: "var(--luxia-opacity-white-48)",
  heroDescription: "rgba(255, 255, 255, 0.76)",
  heroContextValue: "rgba(255, 255, 255, 0.88)",
  heroAccent: "var(--luxia-brand-tertiary)",
  heroRadius: "var(--luxia-radius-16)",
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
  projectTitle: "var(--luxia-text-project-title)",
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
    title: HS.projectTitle,
    primary: "var(--luxia-text-secondary)",
    secondary: "var(--luxia-text-muted)",
    accent: HS.accentProject,
  };
}

export function getSourceAccentColor(
  source?: "database" | "csv" | "pdf",
  emphasis: "default" | "soft" = "default",
): string | undefined {
  if (source === "database") {
    return emphasis === "soft" ? HS.sourceDatabaseSoft : HS.sourceDatabase;
  }
  if (source === "csv" || source === "pdf") {
    return emphasis === "soft" ? HS.sourcePdfSoft : HS.sourcePdf;
  }
  return undefined;
}
