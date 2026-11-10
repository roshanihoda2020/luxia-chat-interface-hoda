import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { createDefaultHomeLayout, type HomeDefaultStage } from "./defaultLayout";
import { addHomeTile, configureHomeTile, removeHomeTile, setHomeTileConfig } from "./layoutOps";
import { isHomeGuideTile, isHomeTileCollapsed } from "./registry";
import {
  clearHomeLayout,
  readHomeLayout,
  readHomeMyDefault,
  writeHomeLayout,
  writeHomeMyDefault,
  type HomeMyDefault,
} from "./storage";
import type {
  HomeLayout,
  HomeTile,
  HomeTileConfig,
  HomeTileConfigValue,
  HomeTileSurfaceStyle,
  HomeTileTarget,
  HomeTileType,
} from "./types";

/** The user's saved Home Layout, or null when they have none (they then follow the Luxia default). */
function readSavedLayout(userId: string): HomeLayout | null {
  const result = readHomeLayout(userId);
  return result.source === "saved" ? result.layout : null;
}

/** Undo stays on screen long enough to read and reach (Sonner's default is 4s). */
const UNDO_TOAST_DURATION_MS = 8000;

let undoToastSequence = 0;

/**
 * A fresh toast id per Undo offer. Sonner delivers `dismiss(id)` on the next
 * animation frame, so reusing one id let the dismissal of the previous Undo
 * remove the toast created right after it. With unique ids, dismissing an
 * older Undo can never reach a newer one.
 */
function nextUndoToastId(): string {
  undoToastSequence += 1;
  return `home-builder-undo-${undoToastSequence}`;
}

/**
 * The current user's Home Layout plus Home Builder actions. Every change is
 * saved immediately for that user only. State remembers its owner, so the
 * first render after a user switch already shows the new user's layout.
 * Only the most recent change can be undone.
 *
 * A user with no saved layout follows the Luxia default for their setup stage;
 * a saved layout is never replaced by it.
 */
export function useHomeLayout(userId: string, stage: HomeDefaultStage = "returning") {
  const [state, setState] = useState(() => ({ userId, layout: readSavedLayout(userId) }));
  const storedLayout = useMemo(() => readSavedLayout(userId), [userId]);
  const savedLayout = state.userId === userId ? state.layout : storedLayout;
  const defaultLayout = useMemo(() => createDefaultHomeLayout(stage), [stage]);
  const layout = savedLayout ?? defaultLayout;

  const [myDefaultState, setMyDefaultState] = useState(() => ({ userId, value: readHomeMyDefault(userId) }));
  const storedMyDefault = useMemo(() => readHomeMyDefault(userId), [userId]);
  const myDefault: HomeMyDefault | null = myDefaultState.userId === userId ? myDefaultState.value : storedMyDefault;

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const editing = editingUserId === userId;

  /** The Undo currently offered (toast id and the user whose layout it restores). */
  const activeUndoRef = useRef<{ toastId: string; userId: string } | null>(null);

  /** Closes the current Undo, if any. Only that toast's id is dismissed. */
  function retireUndo() {
    const active = activeUndoRef.current;
    if (!active) return;
    activeUndoRef.current = null;
    luxiaToast.dismiss(active.toastId);
  }

  // Another user's Undo must never apply to this user's Home.
  useEffect(() => retireUndo, [userId]);

  function commit(next: HomeLayout): boolean {
    if (!writeHomeLayout(userId, next)) {
      luxiaToast.error("Couldn't save your Home layout");
      return false;
    }
    // Any newer change makes an earlier Undo stale.
    retireUndo();
    setState({ userId, layout: next });
    return true;
  }

  function offerUndo(title: string, description: string, previous: HomeLayout) {
    retireUndo();
    const toastId = nextUndoToastId();
    const owner = userId;
    activeUndoRef.current = { toastId, userId: owner };
    luxiaToast.info({
      id: toastId,
      title,
      description,
      duration: UNDO_TOAST_DURATION_MS,
      // Presentation only: Luxia-styled, bottom right so it never covers the Customize toolbar.
      position: "bottom-right",
      className: "luxia-home-undo-toast",
      icon: createElement(Undo2, { size: 16, strokeWidth: 2.25, "aria-hidden": true }),
      action: {
        label: "Undo",
        onClick: () => {
          // Ignore an Undo that a newer change, or a user switch, has replaced.
          const active = activeUndoRef.current;
          if (!active || active.toastId !== toastId || active.userId !== owner) return;
          commit(previous);
        },
      },
    });
  }

  function addTile(type: HomeTileType, target?: HomeTileTarget, config?: HomeTileConfig): HomeTile | null {
    const result = addHomeTile(layout, type, target, config);
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

/**
   * Configure Tile: a different item and/or card style, saved together so one
   * Undo restores both. Place and size never change.
   */
  function configureTile(
    tile: HomeTile,
    changes: {
      target?: HomeTileTarget;
      surface?: HomeTileSurfaceStyle;
      config?: Record<string, HomeTileConfigValue>;
    },
    labels: { before: string; after: string; surface?: string; setting?: string },
  ) {
    const previous = layout;
    const next = configureHomeTile(layout, tile.id, changes);
    if (next === layout || !commit(next)) return;
    const updated = next.tiles.find((entry) => entry.id === tile.id);
    const itemChanged = updated?.target?.entityId !== tile.target?.entityId;
    const settingsChanged = JSON.stringify({ ...updated?.config, surface: null })
      !== JSON.stringify({ ...tile.config, surface: null });
    if (itemChanged) {
      offerUndo(
        `Tile changed to ${labels.after}${labels.surface ? ` · ${labels.surface} style` : ""}`,
        `It was ${labels.before}. Its place and size on your Home stay the same.`,
        previous,
      );
    } else if (settingsChanged) {
      offerUndo(
        `${labels.before} now shows ${labels.setting ?? "different items"}${labels.surface ? ` · ${labels.surface} style` : ""}`,
        "Its place and size on your Home stay the same.",
        previous,
      );
    } else {
      offerUndo(
        `${labels.after} is now ${labels.surface ?? "restyled"}`,
        "Only how this tile looks changed. It keeps its place, size and item.",
        previous,
      );
    }
  }

  /**
   * Hides or shows a Guide tile in place. Unlike Remove, the tile stays in the
   * layout (its slot, size and order are unchanged), so other tiles never move.
   */
  function setGuideHidden(tile: HomeTile, hidden: boolean, label: string) {
    if (!isHomeGuideTile(tile) || isHomeTileCollapsed(tile) === hidden) return;
    const previous = layout;
    const next = setHomeTileConfig(layout, tile.id, { hidden });
    if (next === layout || !commit(next)) return;
    offerUndo(
      hidden ? `${label} hidden` : `${label} shown`,
      hidden
        ? "Show it again from the bar in its place, or from Layout in Customize Home."
        : "It's back in the same place on your Home.",
      previous,
    );
  }

  /** Shows every hidden Guide tile; adds Get started back if it was removed. */
  function showGuidance() {
    const previous = layout;
    const hiddenGuides = layout.tiles.filter((tile) => isHomeTileCollapsed(tile));
    let next = layout;
    if (hiddenGuides.length > 0) {
      next = hiddenGuides.reduce((current, tile) => setHomeTileConfig(current, tile.id, { hidden: false }), layout);
    } else if (!layout.tiles.some((tile) => tile.type === "get-started")) {
      next = addHomeTile(layout, "get-started").layout;
    }
    if (next === layout || !commit(next)) return;
    offerUndo("Getting started is shown", "You can hide it again any time.", previous);
  }

  /** Replaces the current Home with the original Luxia default. The saved layout is kept. */
  function resetToDefault() {
    const previous = layout;
    clearHomeLayout(userId);
    setState({ userId, layout: null });
    offerUndo(
      "Home reset to the Luxia default",
      myDefault ? "Your saved layout is still available." : "You can undo this.",
      previous,
    );
  }

  /** Keeps a copy of the current Home as the saved layout. The current Home itself doesn't change. */
  function saveAsMyDefault() {
    const saved = writeHomeMyDefault(userId, layout);
    if (!saved) {
      luxiaToast.error("Couldn't save your layout");
      return;
    }
    const replaced = myDefault !== null;
    setMyDefaultState({ userId, value: saved });
    luxiaToast.success({
      title: replaced ? "Saved layout updated" : "Layout saved",
      description: "Restore it anytime from Layout.",
      position: "bottom-right",
    });
  }

  /** Replaces the current Home with a copy of the saved layout, which itself doesn't change. */
  function restoreMyDefault() {
    if (!myDefault) return;
    const previous = layout;
    if (!commit(myDefault.layout)) return;
    offerUndo(
      "Saved layout restored",
      "Your saved layout is unchanged.",
      previous,
    );
  }

  const layoutJson = JSON.stringify(layout);

  return {
    layout,
    editing,
    startEditing: () => setEditingUserId(userId),
    stopEditing: () => setEditingUserId(null),
    addTile,
    removeTile,
    configureTile,
    setGuideHidden,
    showGuidance,
    /** Every Guide tile is visible already (nothing for Show getting started to do). */
    guidanceShown: layout.tiles.some((tile) => tile.type === "get-started")
      && !layout.tiles.some((tile) => isHomeTileCollapsed(tile)),
    resetToDefault,
    myDefault,
    saveAsMyDefault,
    restoreMyDefault,
    /**
     * Saves a rearranged or resized layout (drag, keyboard move, size change).
     * With `undo`, also offers Undo (e.g. a tile shrunk to fit while dragging).
     */
    /**
     * Saves a tile's own display settings changed in place on Home (e.g. a
     * Full-width list's Show 3 / 6 / 9 / All or Grid / List). Like those
     * controls before, this offers no Undo.
     */
    updateTileConfig: (tile: HomeTile, patch: Record<string, HomeTileConfigValue>) => {
      const next = setHomeTileConfig(layout, tile.id, patch);
      if (next !== layout) commit(next);
    },
    updateLayout: (next: HomeLayout, undo?: { title: string; description: string }) => {
      const previous = layout;
      if (commit(next) && undo) offerUndo(undo.title, undo.description, previous);
    },
    isDefaultLayout: layoutJson === JSON.stringify(defaultLayout),
    /** True when the current Home matches the saved layout. */
    isMyDefaultLayout: myDefault !== null && layoutJson === JSON.stringify(myDefault.layout),
  };
}
