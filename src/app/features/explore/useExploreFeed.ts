import { useMemo } from "react";
import { useExploreConceptDemo } from "./demoMode";
import {
  exploreUpdates,
  homeNoticeUpdate,
  importantUnreadUpdates,
  loadExploreEntries,
  unreadUpdates,
  visibleExploreSections,
} from "./exploreFeed";
import { useExploreUserState } from "./exploreState";

/** Everything Explore surfaces need for one user: content, sections, read state and the Home notice. */
export function useExploreFeed(userId: string) {
  const conceptDemo = useExploreConceptDemo();
  const state = useExploreUserState(userId);
  const entries = useMemo(() => loadExploreEntries(conceptDemo), [conceptDemo]);
  const updates = useMemo(() => exploreUpdates(entries), [entries]);
  return {
    conceptDemo,
    state,
    entries,
    updates,
    sections: visibleExploreSections(entries, conceptDemo),
    unread: unreadUpdates(updates, state),
    important: importantUnreadUpdates(updates, state),
    notice: homeNoticeUpdate(updates, state),
  };
}
