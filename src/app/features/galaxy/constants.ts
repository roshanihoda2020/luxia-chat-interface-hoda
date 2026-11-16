export type GalaxyActivityStatus = "ready" | "searching" | "matching" | "answering" | "complete";

export const GALAXY_PANEL_OUTER_GAP = 14;
export const GALAXY_COLLAPSED_WIDTH = 52;

export type GalaxyRouteMode = "auto" | "manual";

export type GalaxyRoutingPhase =
  | "searching"
  | "finding"
  | "matched"
  | "answering"
  | "complete";

export type GalaxyMatchedConstellation = {
  id: string;
  label: string;
  type: "PDF" | "CSV" | "DB";
};

export type GalaxyRelevance = "High relevance" | "Medium relevance" | "Low relevance";

export type GalaxyCandidate = {
  id: string;
  label: string;
  type: "PDF" | "CSV" | "DB";
  relevance: GalaxyRelevance;
};

export type GalaxySource = {
  id: string;
  label: string;
  description?: string;
  pages?: string;
};

export type GalaxyRoutingMeta = {
  projectName: string;
  phase: GalaxyRoutingPhase;
  matched: GalaxyMatchedConstellation;
  selectionSource: "auto" | "manual";
  constellationsChecked: number;
};

export type GalaxySessionState = {
  status: GalaxyActivityStatus;
  activityLabel: string;
  routeMode: GalaxyRouteMode;
  pendingManualId: string | null;
  projectName: string;
  candidates: GalaxyCandidate[];
  selected: GalaxyMatchedConstellation | null;
  selectionSource: "auto" | "manual" | null;
  sources: GalaxySource[];
  focusSection: "activity" | "selected" | "sources" | "instruction" | null;
  expandSignal: number;
};

export const GALAXY_DEFAULT_INSTRUCTION =
  "Prioritize approved Project knowledge and provide concise, grounded responses.";

export const GALAXY_DEFAULT_DESCRIPTION =
  "Routes questions across this project's knowledge to find the most relevant constellation and verified sources.";

export const GALAXY_EMPTY_PROMPTS = [
  "Which constellation contains our latest financial policy?",
  "Summarise the customer onboarding requirements.",
  "Where can I find information about supplier risk?",
] as const;

export const GALAXY_ROUTE_RESULT_LIMIT = 50;
export const GALAXY_MOCK_ROUTE_OPTION_COUNT = 1000;

export const GALAXY_OVERVIEW_SCOPE: {
  pdfs: number;
  databases: number;
  constellations: number;
  connectedResources: number;
} = {
  pdfs: 42,
  databases: 8,
  constellations: GALAXY_MOCK_ROUTE_OPTION_COUNT,
  connectedResources: 42,
};

export type GalaxyControlRouteOption = {
  id: string;
  label: string;
  type: "PDF" | "CSV" | "DB";
  projectName?: string;
};

export function buildGalaxyRouteCatalog(
  _projectName: string,
  seeds: Array<{ id: string; label: string; type: "PDF" | "CSV" | "DB" }> = [],
  total = GALAXY_MOCK_ROUTE_OPTION_COUNT,
): GalaxyControlRouteOption[] {
  if (seeds.length > 0) {
    return seeds.map((seed) => ({
      id: seed.id,
      label: seed.label,
      type: seed.type,
    }));
  }

  const out: GalaxyControlRouteOption[] = [];
  for (let i = 1; i <= total; i += 1) {
    out.push({
      id: `galaxy-mock-${i}`,
      label: `Constellation ${i}`,
      type: i % 3 === 0 ? "DB" : i % 3 === 1 ? "CSV" : "PDF",
    });
  }
  return out;
}

export function createIdleGalaxySession(projectName: string): GalaxySessionState {
  return {
    status: "ready",
    activityLabel: "Ready to search",
    routeMode: "auto",
    pendingManualId: null,
    projectName,
    candidates: [],
    selected: null,
    selectionSource: null,
    sources: [],
    focusSection: null,
    expandSignal: 0,
  };
}
