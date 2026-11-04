import {
  filterActiveProjects,
  rankProjectsByRecency,
  rankProjectsForPreview,
} from "../../project/data";
import type { HomeProjectCard } from "../../project/types";
import {
  HOME_RECENT_PREVIEW_COUNT_DEFAULT,
  parseHomeRecentPreviewCount,
  type HomeRecentPreviewCount,
} from "../homeRecentPreviewCount";
import type { HomeRecentWorkItem } from "../types";
import { isHomeProjectsView, type HomeProjectsView, type HomeTile } from "./types";

/**
 * Collection tiles: settings and item ordering. Pure functions over data the
 * caller has already filtered to what the current user may access — nothing
 * here adds items, reads storage or checks permissions.
 */

export const HOME_PROJECTS_VIEW_COPY: Record<
  HomeProjectsView,
  {
    label: string;
    hint: string;
    title: string;
    subtitle: string;
    /** How the list is ordered, as a sentence start and mid-sentence. */
    order: string;
    orderInline: string;
  }
> = {
  pinned: {
    label: "Pinned",
    hint: "The Projects you pinned, in your order.",
    title: "Pinned projects",
    subtitle: "The Projects you pinned.",
    order: "In your pin order",
    orderInline: "Your order",
  },
  updated: {
    label: "Recently updated",
    hint: "Projects with the latest activity first.",
    title: "Recently updated projects",
    subtitle: "Projects with the most recent activity.",
    order: "Most recently updated first",
    orderInline: "Newest first",
  },
  name: {
    label: "All, A–Z",
    hint: "Every Project you can access, by name.",
    title: "All projects",
    subtitle: "Every Project you can access.",
    order: "A–Z",
    orderInline: "A–Z",
  },
};

/** The tile's Projects view; a missing or unknown value uses the Pinned view. */
export function getHomeProjectsView(tile: Pick<HomeTile, "config">): HomeProjectsView {
  return isHomeProjectsView(tile.config.view) ? tile.config.view : "pinned";
}

/** Full-width list length for this tile (Show 3 / 6 / 9 / All); invalid values use the default. */
export function getHomeTileListLimit(tile: Pick<HomeTile, "config">): HomeRecentPreviewCount {
  return parseHomeRecentPreviewCount(tile.config.limit) ?? HOME_RECENT_PREVIEW_COUNT_DEFAULT;
}

export type HomeCollectionDisplay = "grid" | "list";

/** Full-width list layout chosen on this tile, or null to use the section's own default. */
export function getHomeTileListDisplay(tile: Pick<HomeTile, "config">): HomeCollectionDisplay | null {
  const value = tile.config.display;
  return value === "grid" || value === "list" ? value : null;
}

function byName(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** Active Projects for a view, in that view's order (all of them; the tile decides how many to show). */
export function selectHomeProjects(
  projects: readonly HomeProjectCard[],
  pinnedOrder: readonly string[],
  view: HomeProjectsView,
): HomeProjectCard[] {
  if (view === "pinned") {
    return rankProjectsForPreview([...projects], pinnedOrder).filter(
      (project) => pinnedOrder.includes(project.id) || Boolean(project.isPinned),
    );
  }
  if (view === "updated") return rankProjectsByRecency([...projects]);
  return filterActiveProjects(projects).sort((a, b) => byName(a.name, b.name));
}

/** Chats from the user's recent work, most recently opened first (ties keep their order). */
export function selectRecentChats(work: readonly HomeRecentWorkItem[]): HomeRecentWorkItem[] {
  return work
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.kind === "chat")
    .sort((a, b) => (b.item.lastOpenedAt ?? 0) - (a.item.lastOpenedAt ?? 0) || a.index - b.index)
    .map(({ item }) => item);
}

/** First occurrence of each id, keeping order. */
export function uniqueById<T extends { id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}

/** Items sorted by a name, numbers compared naturally ("name 2" before "name 10"). */
export function sortByName<T>(items: readonly T[], name: (item: T) => string): T[] {
  return [...items].sort((a, b) => byName(name(a), name(b)));
}

/**
 * @deprecated One-Dashboard-per-Project model. The Dashboards collection now
 * lists named Dashboards (projectDashboardStore); kept for older callers/tests.
 * Projects whose saved outputs exist, newest output first.
 */
export function selectDashboards<O extends { updatedAtTimestamp: number }>(
  projects: readonly HomeProjectCard[],
  outputsFor: (projectId: string) => readonly O[],
): Array<{ project: HomeProjectCard; outputs: readonly O[] }> {
  return projects
    .map((project) => ({ project, outputs: outputsFor(project.id) }))
    .filter((entry) => entry.outputs.length > 0)
    .sort(
      (a, b) =>
        Math.max(...b.outputs.map((output) => output.updatedAtTimestamp))
        - Math.max(...a.outputs.map((output) => output.updatedAtTimestamp)),
    );
}

/**
 * One real, non-secret fact about what a Data Source holds, from its content
 * snapshot: its database, how many files or tables, or how many rows were
 * imported. Undefined when the snapshot has nothing worth showing.
 */
export function formatHomeDataSourceContent(summary: {
  kind?: string;
  database?: string;
  dataset?: string;
  tableName?: string;
  importedRows?: number;
  fileNames?: readonly string[];
  documents?: readonly unknown[];
  csvTables?: ReadonlyArray<{ importedRows?: number }>;
} | undefined): string | undefined {
  if (!summary) return undefined;
  const count = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;
  if (summary.kind === "file") {
    const files = summary.documents?.length ?? summary.fileNames?.length ?? 0;
    return files > 0 ? count(files, "file") : undefined;
  }
  if (summary.kind === "csv") {
    const tables = summary.csvTables ?? [];
    if (tables.length > 1) return count(tables.length, "table");
    const rows = tables[0]?.importedRows ?? summary.importedRows;
    if (typeof rows === "number" && rows > 0) return count(rows, "row");
    return summary.tableName ? `Table ${summary.tableName}` : undefined;
  }
  const database = summary.database ?? summary.dataset;
  return database ? `${database} database` : undefined;
}

/**
 * What a Data Source contains, as a few labelled entries from its content
 * snapshot: file names, imported tables with row counts, or the database and
 * host it connects to. Never credentials (no username, password or role).
 */
export function listHomeDataSourceContents(summary: {
  kind?: string;
  host?: string;
  database?: string;
  dataset?: string;
  account?: string;
  tableName?: string;
  importedRows?: number;
  fileNames?: readonly string[];
  csvTables?: ReadonlyArray<{ tableName: string; importedRows?: number }>;
} | undefined): Array<{ label: string; value: string }> {
  if (!summary) return [];
  if (summary.kind === "file") {
    return (summary.fileNames ?? []).map((name) => ({ label: "File", value: name }));
  }
  if (summary.kind === "csv") {
    const tables = summary.csvTables && summary.csvTables.length > 0
      ? summary.csvTables
      : summary.tableName ? [{ tableName: summary.tableName, importedRows: summary.importedRows }] : [];
    return tables.map((table) => ({
      label: typeof table.importedRows === "number" ? `${table.importedRows.toLocaleString()} rows` : "Table",
      value: table.tableName,
    }));
  }
  return [
    ...(summary.database ?? summary.dataset ? [{ label: "Database", value: (summary.database ?? summary.dataset) as string }] : []),
    ...(summary.host ? [{ label: "Host", value: summary.host }] : []),
    ...(summary.account ? [{ label: "Account", value: summary.account }] : []),
  ];
}

/**
 * Splits `capacity` rows across groups (in order) so every non-empty group
 * gets at least one row when there is room, then shares the rest one at a
 * time. Never gives a group more rows than it has.
 */
export function allocateGroupRows(sizes: readonly number[], capacity: number): number[] {
  const rows = sizes.map(() => 0);
  let left = Math.max(0, Math.floor(capacity));
  let progressed = true;
  while (left > 0 && progressed) {
    progressed = false;
    for (let index = 0; index < sizes.length && left > 0; index += 1) {
      if (rows[index] < sizes[index]) {
        rows[index] += 1;
        left -= 1;
        progressed = true;
      }
    }
  }
  return rows;
}
