import { EXPLORE_ENTRIES } from "./content";
import { getConceptEntries } from "./demoMode";
import type { ExploreUserState as ExploreState } from "./exploreState";
import type {
  ExploreContentSectionId,
  ExploreEntry,
  ExploreSectionId,
  ExploreUpdate,
} from "./types";

/**
 * Read-only adapter over the content source. Today it reads the prototype
 * file; the real news / highlights feed replaces this function only.
 * Concept entries are returned only in Concept Demo mode.
 */
export function loadExploreEntries(conceptDemo: boolean): ExploreEntry[] {
  const published = EXPLORE_ENTRIES.filter((entry) => entry.publication === "published");
  return conceptDemo ? [...published, ...getConceptEntries()] : published;
}

/** One entry by its slug, if it's visible in the current mode. */
export function findExploreEntry(entries: readonly ExploreEntry[], section: ExploreContentSectionId, slug: string): ExploreEntry | undefined {
  return entries.find((entry) => entry.section === section && entry.id === slug);
}

/**
 * Sections live for customers. A section appears only once it is listed here
 * AND has published entries. Launch: What's New only; add sections here as
 * product approves their content.
 */
export const EXPLORE_LIVE_SECTIONS: readonly ExploreContentSectionId[] = ["whats-new"];

export const EXPLORE_SECTION_ORDER: readonly ExploreContentSectionId[] = [
  "whats-new",
  "products",
  "learn",
  "ideas",
  "stories",
  "services",
];

export const EXPLORE_SECTION_LABELS: Record<ExploreSectionId, string> = {
  overview: "Overview",
  "whats-new": "What's New",
  products: "Products & Agents",
  learn: "Learn",
  ideas: "Ideas",
  stories: "Customer Stories",
  services: "Services",
};

/**
 * The sections to show. Customers see only live sections with content (What's
 * New is always present so its empty state can explain itself). Concept Demo
 * shows every section that has entries. Overview appears once two or more
 * content sections are visible.
 */
export function visibleExploreSections(entries: readonly ExploreEntry[], conceptDemo: boolean): ExploreSectionId[] {
  const content = EXPLORE_SECTION_ORDER.filter((section) => {
    if (section === "whats-new") return true;
    const has = entries.some((entry) => entry.section === section);
    return has && (conceptDemo || EXPLORE_LIVE_SECTIONS.includes(section));
  });
  return content.length >= 2 ? ["overview", ...content] : content;
}

export function exploreUpdates(entries: readonly ExploreEntry[]): ExploreUpdate[] {
  return entries
    .filter((entry): entry is ExploreUpdate => entry.section === "whats-new")
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

/** How long a proactive update may appear on Home after it is published. */
const NOTICE_WINDOW_DAYS = 30;

function daysSince(isoDate: string, now: Date): number {
  return (now.getTime() - new Date(`${isoDate}T00:00:00`).getTime()) / 86_400_000;
}

/**
 * Unread means not opened. Dismissing a Home notice does not change it:
 * reading and dismissal are separate states.
 */
export function unreadUpdates(updates: readonly ExploreUpdate[], state: ExploreState): ExploreUpdate[] {
  return updates.filter((update) => !state.read.includes(update.id));
}

/**
 * Important unread updates: published (never Concept Demo), proactive
 * (product-approved major releases), recent, and not yet opened. Hiding a Home
 * notice doesn't change this, so the Explore Luxia dot stays until each is read.
 */
export function importantUnreadUpdates(updates: readonly ExploreUpdate[], state: ExploreState, now = new Date()): ExploreUpdate[] {
  return unreadUpdates(updates, state).filter(
    (update) => update.publication === "published"
      && update.proactive === true
      && daysSince(update.date, now) <= NOTICE_WINDOW_DAYS
      && daysSince(update.date, now) >= -1,
  );
}

/** The Home notice candidate: the newest important unread update not hidden this session, unless notices are off. */
export function homeNoticeUpdate(updates: readonly ExploreUpdate[], state: ExploreState, now = new Date()): ExploreUpdate | null {
  if (state.hideHomeNotices) return null;
  return importantUnreadUpdates(updates, state, now).find((update) => !state.dismissed.includes(update.id)) ?? null;
}

/**
 * At most one notice per page session: once an update has been shown, only it
 * can be shown again this session (never a replacement after ×). Returns the
 * update to show, or null.
 */
export function sessionNoticeUpdate(
  shownId: string | undefined,
  updates: readonly ExploreUpdate[],
  state: ExploreState,
  now = new Date(),
): ExploreUpdate | null {
  if (state.hideHomeNotices) return null;
  const id = shownId ?? homeNoticeUpdate(updates, state, now)?.id;
  if (!id) return null;
  const eligible = importantUnreadUpdates(updates, state, now).find((update) => update.id === id);
  return eligible && !state.dismissed.includes(id) ? eligible : null;
}

/**
 * Updates the Home notice may show: published, recent, unread, not dismissed,
 * and relevant to this user (the caller decides, from what the user can use).
 * Proactive updates qualify, and so does any update with an action the user
 * can take. Nothing qualifies while Home notices are turned off.
 */
export function homeNoticeUpdates(
  updates: readonly ExploreUpdate[],
  state: ExploreState,
  isRelevant: (update: ExploreUpdate) => boolean,
  now = new Date(),
): ExploreUpdate[] {
  if (state.hideHomeNotices) return [];
  return unreadUpdates(updates, state).filter(
    (update) => update.publication === "published"
      && daysSince(update.date, now) <= NOTICE_WINDOW_DAYS
      && daysSince(update.date, now) >= -1
      && !state.dismissed.includes(update.id)
      && (update.proactive === true || Boolean(update.action))
      && isRelevant(update),
  );
}

/**
 * The relevant update to show this page session: the one already shown while it
 * still qualifies, otherwise the newest that does. After × the session shows
 * none (never a replacement), as with the notice before.
 */
export function sessionRelevantNotice(
  shownId: string | undefined,
  updates: readonly ExploreUpdate[],
  state: ExploreState,
  isRelevant: (update: ExploreUpdate) => boolean,
  now = new Date(),
): ExploreUpdate | null {
  if (state.hideHomeNotices) return null;
  if (shownId) {
    if (state.dismissed.includes(shownId)) return null;
    const shown = homeNoticeUpdates(updates, state, isRelevant, now).find((update) => update.id === shownId);
    if (shown) return shown;
  }
  return homeNoticeUpdates(updates, state, isRelevant, now)[0] ?? null;
}

export const EXPLORE_UPDATE_KIND_LABELS: Record<ExploreUpdate["kind"], string> = {
  "release-note": "Release note",
  announcement: "Announcement",
  news: "News & highlights",
};

export function formatExploreDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function exploreMonthLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
