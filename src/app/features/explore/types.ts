/**
 * Explore Luxia content model: one shape for every entry, whatever the source.
 *
 * `publication` separates real content from illustration:
 * - "published": approved, real content (shown to every user).
 * - "concept": internal Concept Demo content. Only rendered in Concept Demo
 *   mode, always labelled, never presented as a release, result or feature.
 */
export type ExploreSectionId =
  | "overview"
  | "whats-new"
  | "products"
  | "learn"
  | "ideas"
  | "stories"
  | "services";

/** Sections that hold entries (Overview is composed from the others). */
export type ExploreContentSectionId = Exclude<ExploreSectionId, "overview">;

export type ExplorePublication = "published" | "concept";

export type ExploreUpdateKind = "release-note" | "announcement" | "news";

export type ExploreAvailability = "available" | "on-request" | "coming-soon";

/** Real places an entry may link to. Internal routes are resolved by the app, never invented. */
export type ExploreRoute = "writing-assistant" | "data-sources" | "projects" | "home" | "tools";

export type ExploreAction =
  | { label: string; kind: "route"; route: ExploreRoute }
  | { label: string; kind: "url"; href: string };

/**
 * Typed content blocks for full-page details. Every section uses the same page
 * template; section-specific content is blocks, not new layouts. Blocks that
 * illustrate (sample conversation, dossier, code) always carry a visible label.
 */
export type ExploreBlock =
  | { type: "paragraphs"; title?: string; items: string[] }
  | { type: "steps"; title: string; items: Array<{ title: string; text: string }> }
  | { type: "list"; title: string; items: string[] }
  | { type: "faq"; title: string; items: Array<{ q: string; a: string }> }
  | { type: "facts"; title: string; items: Array<{ label: string; value: string }> }
  | { type: "example"; title: string; label: string; inputs: string[]; outputs: string[] }
  | { type: "dossier"; title: string; label: string; heading: string; fields: Array<{ label: string; value: string }>; note: string }
  | { type: "conversation"; title: string; label: string; turns: Array<{ from: "user" | "agent"; text: string }> }
  | { type: "code"; title: string; label: string; language: string; code: string; preview: { name: string; role: string; capabilities: string[] } }
  | { type: "compare"; title: string; label?: string; columns: Array<{ title: string; items: string[] }> }
  | { type: "proposal"; title: string; label: string; prompts: string[] };

/** Conceptual visual identity (not Margherita's approved artwork). */
export interface ExploreIdentity {
  icon: "credit" | "data" | "document" | "gpt" | "humanoid" | "verify" | "writing" | "code" | "registry";
  /** Accent hue for the identity mark. */
  hue: "violet" | "indigo" | "teal" | "blue" | "rose" | "amber" | "slate";
}

interface ExploreEntryBase {
  /** Stable slug: the page lives at /explore/<section>/<id>. */
  id: string;
  publication: ExplorePublication;
  title: string;
  summary: string;
  action?: ExploreAction;
  /** Full-page content. */
  blocks?: ExploreBlock[];
  /** Ids of related entries (any section), shown at the end of the page. */
  related?: string[];
}

export interface ExploreUpdate extends ExploreEntryBase {
  section: "whats-new";
  /** The larger lead item at the top of What's New. */
  featured?: boolean;
  kind: ExploreUpdateKind;
  /** ISO date (yyyy-mm-dd) the update was published. */
  date: string;
  /** Short label shown with the date ("Home", "Data Sources"). */
  area: string;
  body: string[];
  /** Product-approved for one Home notice (major releases only, never marketing). */
  proactive?: boolean;
}

export interface ExploreProduct extends ExploreEntryBase {
  section: "products";
  availability: ExploreAvailability;
  /** "Tool", "Capability", "Agent", "Platform", "Governance". */
  category: string;
  /** One-line role shown under the name in the gallery. */
  role?: string;
  /** Overview's single featured slot. */
  featured?: boolean;
  /** One of Margherita's seven agent concepts (shown in the Agent Gallery). */
  agent?: boolean;
  identity?: ExploreIdentity;
}

export interface ExploreLearnItem extends ExploreEntryBase {
  section: "learn";
  track: "getting-started" | "guides" | "lia" | "tutorials";
  format: "Guide" | "Article" | "Tutorial";
}

export type ExploreIdeaCategory =
  | "Administration"
  | "HR"
  | "Commercial and Sales"
  | "Operations"
  | "Legal and Compliance"
  | "Public Administration"
  | "Credit and Finance";

export interface ExploreIdea extends ExploreEntryBase {
  section: "ideas";
  area: ExploreIdeaCategory;
  /** The problem, in one or two sentences. */
  problem: string;
  /** How a workflow could work. */
  steps: string[];
  /** Related agent product ids. */
  agents: string[];
}

export interface ExploreStory extends ExploreEntryBase {
  section: "stories";
  industry: "Manufacturing" | "Construction" | "Banking" | "Public Administration" | "Marketing" | string;
  customer: string;
  challenge: string;
  approach?: string;
  value: string;
  /** Related capability (product) ids. */
  capabilities?: string[];
  /** Link to verified details; without it no "Read the story" action is offered. */
  detailsUrl?: string;
}

export interface ExploreService extends ExploreEntryBase {
  section: "services";
  /** One-line "who it's for". */
  forWho?: string;
  /** A real contact destination; without it no contact action is offered. */
  contactUrl?: string;
}

export type ExploreEntry =
  | ExploreUpdate
  | ExploreProduct
  | ExploreLearnItem
  | ExploreIdea
  | ExploreStory
  | ExploreService;

/** Where each early product idea lives (internal Concept Demo map). */
export interface ExploreConceptMapRow {
  idea: string;
  home: string;
  explore: string;
  elsewhere: string;
}

/** Where a detail page was opened from, so its Back link returns there. */
export type ExploreReturnTo = "home" | ExploreSectionId;
