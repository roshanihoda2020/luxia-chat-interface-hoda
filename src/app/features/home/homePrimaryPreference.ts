import { workItemToHeroContent } from "./data";
import { readUserHomePreference, writeUserHomePreference } from "./homePreferenceScope";
import type { HomeEntityKey } from "./homeEntityKeys";
import { parseEntityKey, workItemEntityKey } from "./homeEntityKeys";
import type { HomeHeroContent, HomeProjectCard, HomeRecentWorkItem } from "./types";

export type HomePrimaryMode = "automatic" | "manual";

export interface HomePrimaryPreference {
  mode: HomePrimaryMode;
  entityKey: HomeEntityKey | null;
}

/** Base key; each user's choice is saved under their own key (see homePreferenceScope). */
const STORAGE_KEY = "luxia-home-primary-preference";

const AUTOMATIC_PREFERENCE: HomePrimaryPreference = {
  mode: "automatic",
  entityKey: null,
};

export function isManualHomeFocus(preference: HomePrimaryPreference): boolean {
  return preference.mode === "manual";
}

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

export function readHomePrimaryPreference(userId: string): HomePrimaryPreference {
  try {
    const raw = readUserHomePreference(STORAGE_KEY, userId);
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

export function writeHomePrimaryPreference(userId: string, pref: HomePrimaryPreference): void {
  writeUserHomePreference(STORAGE_KEY, userId, pref);
}

const DISMISSED_KEY = "luxia-home-dismissed-continue";

export const DEFAULT_DISMISSED_CONTINUE_KEYS: HomeEntityKey[] = ["chat:chat-07"];

export function readDismissedContinueKeys(userId: string): HomeEntityKey[] {
  try {
    const raw = readUserHomePreference(DISMISSED_KEY, userId);
    if (!raw) return [...DEFAULT_DISMISSED_CONTINUE_KEYS];
    return JSON.parse(raw) as HomeEntityKey[];
  } catch {
    return [...DEFAULT_DISMISSED_CONTINUE_KEYS];
  }
}

export function writeDismissedContinueKeys(userId: string, keys: HomeEntityKey[]): void {
  writeUserHomePreference(DISMISSED_KEY, userId, keys);
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

export function filterWorkItemsToAssignedProjects(
  items: readonly HomeRecentWorkItem[],
  allowedProjectIds: ReadonlySet<string>,
): HomeRecentWorkItem[] {
  return items.filter((item) => allowedProjectIds.has(item.projectId));
}

export function resolveHomeHero(options: {
  recentWork: HomeRecentWorkItem[];
  primaryPreference: HomePrimaryPreference;
  pinnedWorkIds: Set<string>;
  pinnedOrder: HomeEntityKey[];
  dismissed: HomeEntityKey[];
  projects?: readonly HomeProjectCard[];
  /** Hard gate: only these Project IDs may supply focus content. */
  allowedProjectIds?: ReadonlySet<string>;
}): { hero: HomeHeroContent; heroEntityKey: HomeEntityKey | null; eligiblePrimaryItems: HomeRecentWorkItem[] } {
  const scopedRecentWork = options.allowedProjectIds
    ? filterWorkItemsToAssignedProjects(options.recentWork, options.allowedProjectIds)
    : options.recentWork;

  if (options.allowedProjectIds && options.allowedProjectIds.size === 0) {
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

  const preference = normalizeHomePrimaryPreference(
    options.primaryPreference,
    scopedRecentWork,
    options.dismissed,
  );

  const pool = rankContinueWorkingPool(
    scopedRecentWork,
    options.pinnedOrder,
    options.dismissed,
  );
  const visiblePrimaryItems = pool.filter(
    (item) => item.kind === "chat" || item.kind === "galaxySession",
  );

  const allPrimaryItems = scopedRecentWork
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
