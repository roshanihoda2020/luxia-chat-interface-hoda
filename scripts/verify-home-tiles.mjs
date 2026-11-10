/**
 * Functional verification for Home Tiles: guards the data rules the tiles rely
 * on and confirms the Home Builder foundation (grid, sizes, layouts) is unchanged.
 * Run: npx --yes tsx scripts/verify-home-tiles.mjs
 */
import { monogramOf, knowledgeKindOf } from "../src/app/features/home/homeBuilder/homeTileIdentity.ts";
import {
  formatHomeDataSourceContent,
  listHomeDataSourceContents,
  selectDashboards,
  selectRecentChats,
} from "../src/app/features/home/homeBuilder/collections.ts";
import { HOME_TILE_DEFINITIONS } from "../src/app/features/home/homeBuilder/registry.ts";
import { HOME_TILE_GRID, HOME_TILE_SIZE_PRESETS, homeTileBodyHeightPx } from "../src/app/features/home/homeBuilder/grid.ts";
import { createDefaultHomeLayout } from "../src/app/features/home/homeBuilder/defaultLayout.ts";
import { parseHomeLayout } from "../src/app/features/home/homeBuilder/validation.ts";
import { migrateHomeLayoutData } from "../src/app/features/home/homeBuilder/migration.ts";
import { DATA_SOURCE_CATALOG } from "../src/app/features/permissions/data.ts";

let checks = 0;
function assert(condition, message) {
  checks += 1;
  if (!condition) throw new Error(message);
}
function equal(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// Identity marks come from the real name
equal(monogramOf("Project name 07"), "P07", "numbered name keeps its digits");
equal(monogramOf("Project name 123"), "P23", "long numbers keep two digits");
equal(monogramOf("Market Analysis"), "MA", "two words give initials");
equal(monogramOf("Finance"), "F", "one word gives one letter");
equal(monogramOf("   "), "?", "blank name has a neutral mark");

equal(knowledgeKindOf("database"), "database", "database type");
equal(knowledgeKindOf("Database"), "database", "type labels are case-insensitive");
equal(knowledgeKindOf("PDF"), "pdf", "PDF type");
equal(knowledgeKindOf("csv"), "csv", "CSV type");
equal(knowledgeKindOf("googlesheet"), "sheet", "Google Sheets connector");
equal(knowledgeKindOf("File"), "file", "File type");
equal(knowledgeKindOf(undefined), "database", "unknown falls back to database glyph");

// Data Source content facts: real, and never credentials
const SECRET_FIELDS = ["username", "password", "role", "warehouse", "port"];
for (const source of DATA_SOURCE_CATALOG) {
  const detail = formatHomeDataSourceContent(source.contentSummary);
  const contents = listHomeDataSourceContents(source.contentSummary);
  assert(detail === undefined || (typeof detail === "string" && detail.length > 0), `${source.id}: detail is a string or undefined`);
  for (const entry of contents) {
    assert(entry.value && entry.label, `${source.id}: every content entry has a label and value`);
    for (const field of SECRET_FIELDS) {
      const secret = source.contentSummary?.[field];
      if (typeof secret === "string" && secret.length > 0) {
        assert(entry.value !== secret, `${source.id}: ${field} must never be shown`);
      }
    }
  }
}
equal(formatHomeDataSourceContent({ kind: "file", fileNames: ["a.pdf", "b.pdf", "c.pdf"] }), "3 files", "file count");
equal(formatHomeDataSourceContent({ kind: "csv", csvTables: [{ importedRows: 1200 }] }), "1,200 rows", "single CSV table rows");
equal(formatHomeDataSourceContent({ kind: "csv", csvTables: [{}, {}] }), "2 tables", "multi-table CSV");
equal(formatHomeDataSourceContent({ kind: "database", database: "analytics", username: "x" }), "analytics database", "database name only");
equal(formatHomeDataSourceContent(undefined), undefined, "no snapshot, no detail");
equal(
  listHomeDataSourceContents({ kind: "database", database: "analytics", host: "db.internal", username: "reader" }),
  [{ label: "Database", value: "analytics" }, { label: "Host", value: "db.internal" }],
  "database contents list database and host only",
);

// Collections keep their existing ordering rules
const work = [
  { id: "a", kind: "chat", lastOpenedAt: 10 },
  { id: "g", kind: "galaxySession", lastOpenedAt: 99 },
  { id: "b", kind: "chat", lastOpenedAt: 30 },
  { id: "c", kind: "chat" },
];
equal(selectRecentChats(work).map((item) => item.id), ["b", "a", "c"], "Chats: most recently opened first, Galaxy sessions excluded");

const projects = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];
const outputs = { p1: [{ updatedAtTimestamp: 5 }], p2: [], p3: [{ updatedAtTimestamp: 9 }, { updatedAtTimestamp: 1 }] };
equal(
  selectDashboards(projects, (id) => outputs[id]).map((entry) => entry.project.id),
  ["p3", "p1"],
  "Dashboards: only with outputs, newest output first",
);

// Home Builder foundation unchanged
equal(HOME_TILE_GRID, { columns: 12, gapPx: 16, rowUnitPx: 60, rowGapPx: 32, stackBelowPx: 900 }, "grid geometry");
equal(
  Object.fromEntries(Object.entries(HOME_TILE_SIZE_PRESETS).map(([id, preset]) => [id, [preset.w, preset.h]])),
  { small: [3, 2], medium: [4, 4], large: [6, 4], wide: [12, 4], "wide-tall": [12, 8] },
  "size presets",
);
equal(homeTileBodyHeightPx(2, true), 136, "Small card height");
equal(homeTileBodyHeightPx(4, true), 370, "Medium / Large card height");

const EXPECTED_SIZES = {
  "projects-collection": ["small", "medium", "large", "wide-tall"],
  "chats-collection": ["small", "medium", "large", "wide"],
  "galaxies-collection": ["small", "medium", "large", "wide"],
  "constellations-collection": ["small", "medium", "large", "wide"],
  "data-sources-collection": ["small", "medium", "large", "wide"],
  "dashboards-collection": ["small", "medium", "large", "wide"],
  "your-focus": ["small", "medium", "large", "wide"],
  project: ["small", "medium", "large"],
  chat: ["small", "medium"],
  galaxy: ["small", "medium"],
  constellation: ["small", "medium"],
  "data-source": ["small", "medium"],
  dashboard: ["small", "medium", "large"],
  tool: ["small", "medium"],
};
for (const [type, sizes] of Object.entries(EXPECTED_SIZES)) {
  equal([...HOME_TILE_DEFINITIONS[type].allowedSizes], sizes, `${type} allowed sizes`);
}

// Saved layouts stay valid: every type at every allowed size
const TARGETS = {
  project: { scope: "project", entityId: "project-01" },
  chat: { scope: "chat", entityId: "chat-01", projectId: "project-01" },
  galaxy: { scope: "galaxy", entityId: "project-01", projectId: "project-01" },
  constellation: { scope: "constellation", entityId: "con1" },
  "data-source": { scope: "data-source", entityId: "ds-db-01" },
  dashboard: { scope: "dashboard", entityId: "project-01", projectId: "project-01" },
  tool: { scope: "tool", entityId: "writing-assistant" },
};
let y = 0;
const tiles = [];
for (const [type, definition] of Object.entries(HOME_TILE_DEFINITIONS)) {
  for (const size of definition.allowedSizes) {
    if (type === "your-focus" && tiles.some((tile) => tile.type === "your-focus")) continue;
    const preset = HOME_TILE_SIZE_PRESETS[size];
    for (const surface of ["featured", "soft", "default"]) {
      tiles.push({
        id: `${type}-${size}-${surface}`,
        type,
        x: 0,
        y,
        w: preset.w,
        h: preset.h,
        config: { surface },
        ...(TARGETS[type] ? { target: TARGETS[type] } : {}),
      });
      y += preset.h;
      if (type === "your-focus") break;
    }
  }
}
// Layouts hold at most 48 tiles: validate the full set in layout-sized chunks.
for (let start = 0; start < tiles.length; start += 48) {
  const chunk = tiles.slice(start, start + 48).map((tile, index) => ({ ...tile, y: index * 8 }));
  const parsed = parseHomeLayout({ schemaVersion: 2, tiles: chunk });
  assert(parsed.ok, `layout chunk ${start / 48 + 1} is valid: ${parsed.ok ? "" : parsed.error}`);
}
assert(tiles.length > 48, "every type, size and surface was covered");
assert(parseHomeLayout(createDefaultHomeLayout()).ok, "default layout is valid");
for (const stage of ["guided", "returning"]) {
  const layout = createDefaultHomeLayout(stage);
  assert(parseHomeLayout(layout).ok, `${stage} default layout is valid`);
  const cells = new Set();
  let overlap = false;
  for (const tile of layout.tiles) {
    for (let x = tile.x; x < tile.x + tile.w; x += 1) {
      for (let y = tile.y; y < tile.y + tile.h; y += 1) {
        if (cells.has(`${x},${y}`)) overlap = true;
        cells.add(`${x},${y}`);
      }
    }
  }
  assert(!overlap, `${stage} default tiles do not overlap`);
  const width = Math.max(...layout.tiles.map((tile) => tile.x + tile.w));
  assert(width === 12, `${stage} default spans the 12 columns`);
  assert(layout.tiles[0].type === "try-example" && layout.tiles[0].w === 12 && layout.tiles[0].config.surface === "featured", `${stage} default opens with Discover, Full width, Featured`);
  assert(!layout.tiles.some((tile) => tile.type === "data-sources-collection" || tile.type === "constellations-collection"), `${stage} default leaves Data Sources and Constellations to Add Tile`);
  assert(layout.tiles.filter((tile) => tile.config.surface === "featured").length === 1, `${stage} default uses Featured once`);
}
assert(createDefaultHomeLayout("guided").tiles[0].type === "try-example", "guided default opens with Discover");
assert(createDefaultHomeLayout("guided").tiles.some((tile) => tile.type === "get-started"), "guided default includes Get started");
assert(!createDefaultHomeLayout("returning").tiles.some((tile) => tile.type === "get-started"), "returning default leaves Get started out");
equal(createDefaultHomeLayout("returning").tiles.map((tile) => tile.type).join(","), "try-example,tool,projects-collection,dashboards-collection", "returning default: Discover, then Writing Assistant, Projects, Dashboards");
const returningDashboards = createDefaultHomeLayout("returning").tiles.find((tile) => tile.type === "dashboards-collection");
assert(returningDashboards.w === 4 && returningDashboards.h === 4 && returningDashboards.config.surface === "default", "returning default keeps Dashboards Medium and plain");
equal(createDefaultHomeLayout("guided").tiles.map((tile) => tile.type).join(","), "try-example,get-started,tool,projects-collection", "guided default: Discover, Get started, Writing Assistant, Projects");
assert(createDefaultHomeLayout("guided").tiles.filter((tile) => tile.y === 8).every((tile) => tile.w === 3 && tile.h === 2), "guided default keeps Writing Assistant and Projects Small");
equal(createDefaultHomeLayout("guided").tiles.filter((tile) => tile.y === 8).map((tile) => tile.x).join(","), "3,6", "guided default centres the Small pair");

const v1 = { schemaVersion: 1, tiles: [{ id: "old", type: "pinned-projects", x: 0, y: 0, w: 12, h: 8, config: {} }] };
const migrated = migrateHomeLayoutData(v1, {});
const migratedParse = parseHomeLayout(migrated.data);
assert(migrated.migratedFrom === 1 && migratedParse.ok, "version 1 layouts still migrate");
equal(migratedParse.ok && migratedParse.layout.tiles[0].type, "projects-collection", "legacy Pinned projects becomes the Projects collection");

console.log(`verify-home-tiles: ${checks} checks passed`);
