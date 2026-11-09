import type { ExploreEntry } from "./types";

/**
 * Prototype content source for Explore Luxia.
 *
 * Luxia has no news / highlights feed wired into this prototype yet, so this
 * file stands in for it behind `loadExploreEntries` (exploreFeed.ts). Replacing
 * that loader with the real feed keeps every screen unchanged; no CMS is built.
 *
 * Only published content lives here: features that exist in this prototype,
 * dated by when they were added. They still need product approval (Q2).
 * Concept Demo material is in content.concept.ts, loaded only in internal builds.
 */
export const EXPLORE_ENTRIES: readonly ExploreEntry[] = [
  // What's New: real release notes
  {
    id: "update-customizable-home",
    section: "whats-new",
    publication: "published",
    kind: "release-note",
    date: "2026-11-04",
    area: "Home",
    proactive: true,
    title: "Make Home yours",
    summary: "Add, move and resize tiles, and save a layout to come back to.",
    body: [
      "Home is now customizable. Choose Customize Home to add tiles for the Projects, Chats, Dashboards, Data Sources and tools you use most, then drag to move them and pick a size and style for each.",
      "Every change saves automatically. Use Layout › Save current layout to keep an arrangement you like, restore it later, or reset to the Luxia default at any time.",
      "Your Projects, Chats and other work are never changed by customizing Home.",
    ],
    action: { label: "Go to Home", kind: "route", route: "home" },
  },
  {
    id: "update-tag-extract",
    section: "whats-new",
    publication: "published",
    kind: "release-note",
    date: "2026-10-29",
    area: "Data Sources",
    title: "Tag & Extract for file Data Sources",
    summary: "Extract, review and tag documents before using them in Constellations.",
    body: [
      "File Data Sources can now prepare their documents: extract the text, review each page beside its Markdown, approve it, and add tags.",
      "Find it when creating a File Data Source, and later in Data Source settings › Tag & Extract. Review is optional and never blocks creating the Data Source.",
    ],
    action: { label: "Open Data Sources", kind: "route", route: "data-sources" },
  },
  {
    id: "update-csv-import",
    section: "whats-new",
    publication: "published",
    kind: "release-note",
    date: "2026-10-28",
    area: "Data Sources",
    title: "A clearer CSV import",
    summary: "Validation and column descriptions while you import a CSV.",
    body: [
      "Importing a CSV now validates the file as you go and lets you describe its columns, so the data is ready to use when the import finishes.",
    ],
    action: { label: "Open Data Sources", kind: "route", route: "data-sources" },
  },

  // Products & Agents: real, available features
  {
    id: "writing-assistant",
    section: "products",
    publication: "published",
    availability: "available",
    category: "Tool",
    title: "Writing Assistant",
    summary: "Write, edit and improve documents with AI.",
    action: { label: "Open Writing Assistant", kind: "route", route: "writing-assistant" },
  },
  {
    id: "tag-extract",
    section: "products",
    publication: "published",
    availability: "available",
    category: "Capability",
    title: "Tag & Extract",
    summary: "Prepare and tag documents in file Data Sources.",
    action: { label: "Open Data Sources", kind: "route", route: "data-sources" },
  },
  {
    id: "galaxy",
    section: "products",
    publication: "published",
    availability: "available",
    category: "Capability",
    title: "Galaxy",
    summary: "Ask across all of a Project's Constellations at once.",
    action: { label: "Go to Projects", kind: "route", route: "projects" },
  },

];
