import { workItemToHeroContent } from "./data";
import type { HomeEntityKey } from "./homeEntityKeys";
import { parseEntityKey, workItemEntityKey } from "./homeEntityKeys";
import type { HomeHeroContent, HomeProjectCard, HomeRecentWorkItem } from "./types";

export type HomePrimaryMode = "automatic" | "manual";

export interface HomePrimaryPreference {
  mode: HomePrimaryMode;
  entityKey: HomeEntityKey | null;
}

const STORAGE_KEY = "luxia-home-primary-preference";

const AUTOMATIC_PREFERENCE: HomePrimaryPreference = {
  mode: "automatic",
  entityKey: null,
};

/** Sole guard for manual Home-focus preference (internal; not a user-facing mode label). */
export function isManualHomeFocus(preference: HomePrimaryPreference): boolean {
  return preference.mode === "manual";
}

/**
 * Normalize stored preference against the live Chat/Galaxy work collection.
 * Invalid or inaccessible manual keys fall back to the internal resolver — UI and persistence stay aligned.
 */
export function normalizeHomePrimaryPreference(
  preference: HomePrimaryPreference,
  workItems: HomeRecentWorkItem[],
  dismissedKeys: readonly HomeEntityKey[] = [],
): HomePrimaryPreference {
  if (preference.mode !== "manual") {
    return AUTOMATIC_PREFERENCE;
  }

  const key = preference.entityKey;
  if (!key) return AUTOMATIC_PREFERENCE;

  const parsed = parseEntityKey(key);
  if (!parsed) return AUTOMATIC_PREFERENCE;

  if (dismissedKeys.includes(key)) return AUTOMATIC_PREFERENCE;

  const match = workItems.find((item) => {
    if (item.kind !== "chat" && item.kind !== "galaxySession") return false;
    return workItemEntityKey(item) === key;
  });

  if (!match) return AUTOMATIC_PREFERENCE;
  if (parsed.kind === "chat" && match.kind !== "chat") return AUTOMATIC_PREFERENCE;
  if (parsed.kind === "galaxy" && match.kind !== "galaxySession") return AUTOMATIC_PREFERENCE;

  return { mode: "manual", entityKey: key };
}

export function homePrimaryPreferencesEqual(
  a: HomePrimaryPreference,
  b: HomePrimaryPreference,
): boolean {
  return a.mode === b.mode && a.entityKey === b.entityKey;
}

export function readHomePrimaryPreference(): HomePrimaryPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return AUTOMATIC_PREFERENCE;
    const parsed = JSON.parse(raw) as Partial<HomePrimaryPreference>;
    if (parsed.mode === "manual") {
      return {
        mode: "manual",
        entityKey: typeof parsed.entityKey === "string" ? parsed.entityKey : null,
      };
    }
    return AUTOMATIC_PREFERENCE;
  } catch {
    return AUTOMATIC_PREFERENCE;
  }
}

export function writeHomePrimaryPreference(pref: HomePrimaryPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
  } catch {
    /* ignore */
  }
}

const DISMISSED_KEY = "luxia-home-dismissed-continue";

/** Prototype seed: one non-focus item hidden for Hide/Restore testing. */
export const DEFAULT_DISMISSED_CONTINUE_KEYS: HomeEntityKey[] = ["chat:chat-07"];

export function readDismissedContinueKeys(): HomeEntityKey[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return [...DEFAULT_DISMISSED_CONTINUE_KEYS];
    return JSON.parse(raw) as HomeEntityKey[];
  } catch {
    return [...DEFAULT_DISMISSED_CONTINUE_KEYS];
  }
}

export function writeDismissedContinueKeys(keys: HomeEntityKey[]): void {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

function rankWorkItem(item: HomeRecentWorkItem, pinnedOrder: HomeEntityKey[]): number {
  const key = workItemEntityKey(item);
  const pinIndex = pinnedOrder.indexOf(key);
  const pinBoost = pinIndex >= 0 ? (pinnedOrder.length - pinIndex) * 1_000_000 : 0;
  const recency = item.lastOpenedAt ?? 0;
  return pinBoost + recency;
}

export function rankContinueWorkingPool(
  items: HomeRecentWorkItem[],
  pinnedOrder: HomeEntityKey[],
  dismissed: HomeEntityKey[],
): HomeRecentWorkItem[] {
  return items
    .filter((item) => !dismissed.includes(workItemEntityKey(item)))
    .slice()
    .sort((a, b) => rankWorkItem(b, pinnedOrder) - rankWorkItem(a, pinnedOrder));
}

export function resolveHomeHero(options: {
  recentWork: HomeRecentWorkItem[];
  primaryPreference: HomePrimaryPreference;
  pinnedWorkIds: Set<string>;
  pinnedOrder: HomeEntityKey[];
  dismissed: HomeEntityKey[];
  projects?: readonly HomeProjectCard[];
}): { hero: HomeHeroContent; heroEntityKey: HomeEntityKey | null; eligiblePrimaryItems: HomeRecentWorkItem[] } {
  const preference = normalizeHomePrimaryPreference(
    options.primaryPreference,
    options.recentWork,
    options.dismissed,
  );

  const pool = rankContinueWorkingPool(
    options.recentWork,
    options.pinnedOrder,
    options.dismissed,
  );
  const visiblePrimaryItems = pool.filter(
    (item) => item.kind === "chat" || item.kind === "galaxySession",
  );

  // Choose Home focus always lists every Chat/Galaxy (hidden + visible).
  const allPrimaryItems = options.recentWork
    .filter((item) => item.kind === "chat" || item.kind === "galaxySession")
    .slice()
    .sort(
      (a, b) => rankWorkItem(b, options.pinnedOrder) - rankWorkItem(a, options.pinnedOrder),
    );

  if (visiblePrimaryItems.length === 0) {
    if (allPrimaryItems.length > 0) {
      return {
        hero: {
          kind: "empty",
          title: "Nothing is shown on Home",
          context: "Your Chats and Galaxies are still available in Your work.",
          primaryLabel: "Choose Home focus",
          secondaryLabel: "View Your work",
          secondaryAction: "viewYourWork",
          emptyReason: "allHidden",
        },
        heroEntityKey: null,
        eligiblePrimaryItems: allPrimaryItems,
      };
    }

    return {
      hero: {
        kind: "empty",
        title: "No Chats or Galaxies yet",
        context: "Start a Chat or open a Project Galaxy to see your work here.",
        primaryLabel: "New Chat",
        secondaryLabel: "New Project",
        secondaryAction: "newProject",
        emptyReason: "none",
      },
      heroEntityKey: null,
      eligiblePrimaryItems: [],
    };
  }

  let selected: HomeRecentWorkItem | undefined;

  if (isManualHomeFocus(preference) && preference.entityKey) {
    selected = visiblePrimaryItems.find(
      (item) => workItemEntityKey(item) === preference.entityKey,
    );
  }

  if (!selected) {
    selected = visiblePrimaryItems[0];
  }

  const hero = workItemToHeroContent(selected, options.pinnedWorkIds, options.projects);
  hero.selectedByYou = isManualHomeFocus(preference)
    && preference.entityKey === workItemEntityKey(selected);

  return {
    hero,
    heroEntityKey: workItemEntityKey(selected),
    eligiblePrimaryItems: allPrimaryItems,
  };
}
