import { useMemo, useState } from "react";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { createDefaultHomeLayout } from "./defaultLayout";
import { addHomeTile, removeHomeTile } from "./layoutOps";
import { clearHomeLayout, readHomeLayout, writeHomeLayout } from "./storage";
import type { HomeLayout, HomeTile, HomeTileTarget, HomeTileType } from "./types";

const DEFAULT_LAYOUT_JSON = JSON.stringify(createDefaultHomeLayout());

/** One shared toast id: only the most recent change can be undone. */
const UNDO_TOAST_ID = "home-builder-undo";

/**
 * The current user's Home Layout plus Home Builder actions. Every change is
 * saved immediately for that user only. State remembers its owner, so the
 * first render after a user switch already shows the new user's layout.
 */
export function useHomeLayout(userId: string) {
  const [state, setState] = useState(() => ({ userId, layout: readHomeLayout(userId).layout }));
  const storedLayout = useMemo(() => readHomeLayout(userId).layout, [userId]);
  const layout = state.userId === userId ? state.layout : storedLayout;

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const editing = editingUserId === userId;

  function commit(next: HomeLayout): boolean {
    if (!writeHomeLayout(userId, next)) {
      luxiaToast.error("Couldn't save your Home layout");
      return false;
    }
    // Any newer change makes an earlier Undo stale.
    luxiaToast.dismiss(UNDO_TOAST_ID);
    setState({ userId, layout: next });
    return true;
  }

  function offerUndo(title: string, description: string, previous: HomeLayout) {
    luxiaToast.info({
      id: UNDO_TOAST_ID,
      title,
      description,
      action: { label: "Undo", onClick: () => commit(previous) },
    });
  }

  function addTile(type: HomeTileType, target?: HomeTileTarget): HomeTile | null {
    const result = addHomeTile(layout, type, target);
    return commit(result.layout) ? result.tile : null;
  }

  function removeTile(tile: HomeTile, label: string) {
    const previous = layout;
    if (!commit(removeHomeTile(layout, tile.id))) return;
    offerUndo(
      `${label} removed from Home`,
      "Nothing else in Luxia was changed. You can add it again from Add Tile.",
      previous,
    );
  }

  function resetToDefault() {
    const previous = layout;
    clearHomeLayout(userId);
    setState({ userId, layout: createDefaultHomeLayout() });
    offerUndo(
      "Home reset to default",
      "Your Home Tiles are back to Your focus, Pinned projects and Recent projects.",
      previous,
    );
  }

  return {
    layout,
    editing,
    startEditing: () => setEditingUserId(userId),
    stopEditing: () => setEditingUserId(null),
    addTile,
    removeTile,
    resetToDefault,
    /** Saves a rearranged or resized layout (drag, keyboard move, size change). */
    updateLayout: (next: HomeLayout) => {
      commit(next);
    },
    isDefaultLayout: JSON.stringify(layout) === DEFAULT_LAYOUT_JSON,
  };
}
