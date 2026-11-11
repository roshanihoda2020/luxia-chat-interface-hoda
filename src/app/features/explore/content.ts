import type { ExploreConceptStep, ExploreEntry } from "./types";

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

  // Tools & Capabilities: real, available features
  {
    id: "project-chat",
    section: "products",
    publication: "published",
    availability: "available",
    scope: "project",
    category: "Capability",
    identity: { icon: "chat", hue: "violet" },
    title: "Chat in a Project",
    summary: "Ask questions about a Project's documents and data, and get answers with their sources.",
    benefit: "Answers stay within the knowledge your team chose, so you can check where each one comes from.",
    example: "“What changed in the supplier contract between 2025 and 2026?”",
    action: { label: "Go to Projects", kind: "route", route: "projects" },
    related: ["asking-questions-with-chat", "constellations-and-galaxies"],
    blocks: [
      { type: "paragraphs", items: ["A Chat in a Project answers from one of the Project's Constellations, so its answers stay within that knowledge. Every answer shows the sources it used."] },
      {
        type: "steps",
        title: "How to start",
        items: [
          { title: "Open a Project", text: "You see only the Projects you're a member of." },
          { title: "Choose a Constellation", text: "It decides which knowledge the Chat answers from." },
          { title: "Ask and check sources", text: "Open the sources in the answer to see where it came from." },
        ],
      },
    ],
  },
  {
    id: "galaxy",
    section: "products",
    publication: "published",
    availability: "available",
    scope: "project",
    category: "Capability",
    identity: { icon: "galaxy", hue: "indigo" },
    title: "Galaxy",
    summary: "Ask in a Project without choosing a Constellation first: Galaxy picks a suitable one for each question.",
    benefit: "Useful when you don't know which Constellation holds the answer.",
    example: "“Where is our onboarding checklist described?”",
    action: { label: "Go to Projects", kind: "route", route: "projects" },
    related: ["constellations-and-galaxies"],
    blocks: [
      { type: "paragraphs", items: ["Each Project has one Galaxy. For each question it picks a suitable Constellation from the ones you can use in that Project. Its settings can limit it to selected Constellations. To use it, choose Chat in a Project and pick Galaxy as the Chat type."] },
    ],
  },
  {
    id: "writing-assistant",
    section: "products",
    publication: "published",
    availability: "available",
    scope: "workspace",
    category: "Tool",
    identity: { icon: "writing", hue: "violet" },
    title: "Writing Assistant",
    summary: "Write, edit and improve documents with AI.",
    benefit: "Improve a selected part of a document without rewriting the rest.",
    example: "Select a paragraph and ask for a shorter, clearer version.",
    action: { label: "Open Writing Assistant", kind: "route", route: "writing-assistant" },
    blocks: [
      { type: "paragraphs", items: ["The Writing Assistant helps you write, edit and improve parts of a document with AI assistance. You'll find it under Tools in the sidebar."] },
    ],
  },
  {
    id: "tag-extract",
    section: "products",
    publication: "published",
    availability: "available",
    scope: "workspace",
    category: "Capability",
    identity: { icon: "datasource", hue: "teal" },
    title: "Tag & Extract",
    summary: "Prepare and tag documents in file Data Sources.",
    benefit: "Clean, tagged documents make the answers built on them easier to trust.",
    example: "Extract a contract, review each page beside its text, and tag it “Supplier”.",
    action: { label: "Open Data Sources", kind: "route", route: "data-sources" },
    related: ["understanding-data-sources"],
    blocks: [
      { type: "paragraphs", items: ["File Data Sources can prepare their documents: extract the text, review each page beside its Markdown, approve it and add tags. Find it when creating a File Data Source, and later in Data Source settings › Tag & Extract. Review is optional and never blocks creating the Data Source."] },
    ],
  },
  {
    id: "vidgets",
    section: "products",
    publication: "published",
    availability: "available",
    scope: "project",
    category: "Capability",
    identity: { icon: "vidget", hue: "rose" },
    title: "Vidgets",
    summary: "Customer-facing assistants built on a Project's knowledge.",
    benefit: "Answer customers' questions from the Project knowledge you choose, with a team inbox to review conversations.",
    example: "A website assistant that answers delivery questions from your policies.",
    action: { label: "Go to Projects", kind: "route", route: "projects" },
    blocks: [
      {
        type: "paragraphs",
        items: [
          "Vidgets belong to a Project. People who manage or review them find them in that Project under Vidgets.",
          "Project Owners and Managers create and configure Vidgets; Analysts can also review the inbox. Organization Admin doesn't change this: it follows your Project role.",
        ],
      },
    ],
  },

  // Learn: short guides to the product model
  {
    id: "getting-started",
    section: "learn",
    publication: "published",
    track: "getting-started",
    format: "Guide",
    readMinutes: 3,
    title: "Getting started with Luxia",
    summary: "Your first path: a Project, its knowledge, and a first question with sources.",
    action: { label: "Go to Projects", kind: "route", route: "projects" },
    related: ["what-is-a-project", "understanding-data-sources", "asking-questions-with-chat"],
    blocks: [
      { type: "paragraphs", items: ["Luxia lets your teams ask questions about their own documents and data and get answers with sources. Work is organised in Projects; inside a Project, Constellations hold the knowledge a Chat answers from."] },
      {
        type: "steps",
        title: "Your first steps",
        items: [
          { title: "Open a Project", text: "You see the Projects you're a member of. If you have none, someone with permission can create one and invite you." },
          { title: "Check its knowledge", text: "Make sure the Project has a Constellation: the knowledge its Chats answer from." },
          { title: "Ask a question", text: "Start a Chat in the Project and open the sources in the answer." },
          { title: "Bring your data", text: "If your data isn't in Luxia yet, it's added as a Data Source first. Admins add organizational ones." },
        ],
      },
      { type: "example", title: "Example", label: "Example", inputs: ["A Project “Supplier contracts”", "Its Constellation built on the contract documents"], outputs: ["A question: “Which contracts renew this quarter?”", "An answer that lists its sources"] },
    ],
  },
  {
    id: "what-is-a-project",
    section: "learn",
    publication: "published",
    track: "guides",
    format: "Guide",
    readMinutes: 2,
    title: "What is a Project?",
    summary: "A shared space for a team's knowledge, Chats and outputs.",
    action: { label: "Go to Projects", kind: "route", route: "projects" },
    related: ["constellations-and-galaxies", "asking-questions-with-chat"],
    blocks: [
      { type: "paragraphs", items: ["A Project is a shared space for a team's knowledge, Chats and outputs. You only see the Projects you're a member of. Every member can chat in their Project; your role decides what else you can manage there."] },
      { type: "list", title: "Inside a Project", items: ["Constellations: the knowledge Chats answer from", "One Galaxy: it picks a suitable Constellation for each question", "Chats, Dashboards and, where your role allows, Vidgets"] },
      { type: "paragraphs", title: "Roles", items: ["Access comes from your role in each Project. Being an Organization Admin doesn't make you a Project Owner."] },
    ],
  },
  {
    id: "understanding-data-sources",
    section: "learn",
    publication: "published",
    track: "guides",
    format: "Guide",
    readMinutes: 2,
    title: "Understanding Data Sources",
    summary: "Where data comes into Luxia: databases, CSV files and documents.",
    action: { label: "Open Data Sources", kind: "route", route: "data-sources" },
    related: ["tag-extract", "constellations-and-galaxies"],
    blocks: [
      { type: "paragraphs", items: ["Data Sources are where data comes into Luxia: databases, CSV files and documents. Projects use them through their Constellations."] },
      { type: "list", title: "Good to know", items: ["Organizational Data Sources are added by admins and shared through access levels", "A private Data Source is visible only to its owner and people given access", "File Data Sources can be prepared with Tag & Extract"] },
    ],
  },
  {
    id: "constellations-and-galaxies",
    section: "learn",
    publication: "published",
    track: "guides",
    format: "Guide",
    readMinutes: 2,
    title: "Constellations and Galaxies",
    summary: "The knowledge a Chat answers from, and how Galaxy picks it for you.",
    action: { label: "Go to Projects", kind: "route", route: "projects" },
    related: ["galaxy", "asking-questions-with-chat"],
    blocks: [
      { type: "paragraphs", items: ["A Constellation is the knowledge a Chat answers from, built on one or more Data Sources inside a Project. A Chat in a Project uses one Constellation, so its answers stay within that knowledge."] },
      { type: "paragraphs", title: "Galaxy", items: ["A Galaxy picks a suitable Constellation for each question, from the ones you can use in the Project. Its settings can limit it to selected Constellations. Each Project has one."] },
      { type: "example", title: "When to use which", label: "Example", inputs: ["Constellation: “What is our refund policy?”", "You know which knowledge holds the answer"], outputs: ["Galaxy: “Where do we describe our refund rules?”", "You don't know which Constellation holds the answer"] },
    ],
  },
  {
    id: "asking-questions-with-chat",
    section: "learn",
    publication: "published",
    track: "guides",
    format: "Guide",
    readMinutes: 2,
    title: "Asking questions with Chat",
    summary: "How to ask clear questions and check the sources in each answer.",
    action: { label: "Go to Projects", kind: "route", route: "projects" },
    related: ["project-chat", "constellations-and-galaxies"],
    blocks: [
      {
        type: "steps",
        title: "Ask well",
        items: [
          { title: "Be specific", text: "Name the document, period or topic you mean." },
          { title: "Check the sources", text: "Every answer shows where it came from." },
          { title: "Follow up", text: "Ask a narrower question in the same Chat to go deeper." },
        ],
      },
      { type: "paragraphs", title: "Where your Chats are", items: ["Project Chats and Galaxy conversations are listed in Chat history, most recent first. Luxia AI on Home is a separate helper for using Luxia, and doesn't answer from your Projects."] },
    ],
  },
];

/** "How Luxia works" on the Explore Overview, in the order data flows. */
export const EXPLORE_HOW_IT_WORKS: readonly ExploreConceptStep[] = [
  { id: "data-sources", title: "Data Sources", text: "Your databases, CSV files and documents come into Luxia here.", guide: "understanding-data-sources" },
  { id: "projects", title: "Projects", text: "Shared team spaces. You see the ones you're a member of.", guide: "what-is-a-project" },
  { id: "constellations", title: "Constellations", text: "The knowledge inside a Project that a Chat answers from.", guide: "constellations-and-galaxies" },
  { id: "galaxy", title: "Galaxy", text: "Picks a suitable Constellation in the Project for each question.", guide: "constellations-and-galaxies" },
  { id: "chats", title: "Chats", text: "Your questions and answers, each with its sources.", guide: "asking-questions-with-chat" },
];
