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
  type: "PDF" | "DB";
};

export type GalaxyRelevance = "High relevance" | "Medium relevance" | "Low relevance";

export type GalaxyCandidate = {
  id: string;
  label: string;
  type: "PDF" | "DB";
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
  "Answer using official financial policy only.\nPrefer latest approved documentation.\nIgnore archived reports.";

export const GALAXY_DEFAULT_DESCRIPTION =
  "Routes questions across this project's knowledge to find the most relevant constellation and verified sources.";

export const GALAXY_EMPTY_PROMPTS = [
  "Which constellation contains our latest financial policy?",
  "Summarise the customer onboarding requirements.",
  "Where can I find information about supplier risk?",
] as const;

export const GALAXY_MOCK_MATCHED: GalaxyMatchedConstellation = {
  id: "con2",
  label: "Financial Documents",
  type: "PDF",
};

export const GALAXY_MOCK_CANDIDATES: GalaxyCandidate[] = [
  { id: "con2", label: "Financial Documents", type: "PDF", relevance: "High relevance" },
  { id: "con1", label: "Customer Records", type: "DB", relevance: "Medium relevance" },
  { id: "con3", label: "Operations Database", type: "DB", relevance: "Low relevance" },
];

export const GALAXY_MOCK_SOURCES: GalaxySource[] = [
  {
    id: "g-s1",
    label: "FY2026 Credit Policy.pdf",
    description: "Approval thresholds",
    pages: "Pages 8–13",
  },
  {
    id: "g-s2",
    label: "Risk Assessment Guidelines.pdf",
    description: "Executive Summary",
    pages: "Page 2",
  },
];

export const GALAXY_MOCK_ANSWER =
  "Based on the matched constellation, the latest financial policy guidance lives in Financial Documents.\n\nFY2026 Credit Policy.pdf defines approval thresholds, escalation paths, and documentation requirements. Risk Assessment Guidelines.pdf complements it with supplier and credit-risk controls used during review.\n\nFor policy questions across this project, Galaxy routes to Financial Documents because those PDFs are the strongest match for financial policy content.";

export const GALAXY_MOCK_CONSTELLATIONS_CHECKED = 24;

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
  type: "PDF" | "DB";
  projectName?: string;
};

export function buildGalaxyRouteCatalog(
  _projectName: string,
  _seeds: Array<{ id: string; label: string; type: "PDF" | "DB" }> = [],
  total = GALAXY_MOCK_ROUTE_OPTION_COUNT,
): GalaxyControlRouteOption[] {
  const out: GalaxyControlRouteOption[] = [];
  for (let i = 1; i <= total; i += 1) {
    out.push({
      id: `galaxy-mock-${i}`,
      label: `Constellation ${i}`,
      type: i % 3 === 0 ? "DB" : "PDF",
    });
  }
  return out;
}

export const GALAXY_MATCH_REASONS = [
  "Financial policies detected",
  "Credit approval workflow identified",
  "Historical reports available",
] as const;

export const GALAXY_CONFIDENCE = {
  label: "Very High",
  percent: 96,
} as const;

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
