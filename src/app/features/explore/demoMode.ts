import { useSyncExternalStore } from "react";
import type { ExploreConceptMapRow, ExploreEntry } from "./types";

/**
 * Concept Demo: internal presentation of how Explore Luxia could grow.
 *
 * Two locks, both required:
 * 1. Build: only builds made with VITE_EXPLORE_CONCEPT_DEMO=true contain the
 *    demo. In any other build this flag is false at build time, the concept
 *    content module is never bundled, and nothing below can turn it on.
 * 2. Activation: in an internal build, open the app with ?explore-demo=concept.
 *
 * Once on, it stays on for this browser tab (sessionStorage) so a refresh keeps
 * the presentation going. It is never saved to user preferences, and
 * "Exit Concept Demo" turns it off.
 */
export const EXPLORE_CONCEPT_DEMO_PARAM = "explore-demo";
const SESSION_KEY = "luxia-explore-concept-demo";

/** True only in internal builds (VITE_EXPLORE_CONCEPT_DEMO=true). */
export const EXPLORE_CONCEPT_DEMO_BUILD = import.meta.env.VITE_EXPLORE_CONCEPT_DEMO === "true";

let active = false;
let conceptEntries: readonly ExploreEntry[] = [];
let conceptMap: readonly ExploreConceptMapRow[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

if (EXPLORE_CONCEPT_DEMO_BUILD) {
  let requested = false;
  try {
    requested = new URLSearchParams(window.location.search).get(EXPLORE_CONCEPT_DEMO_PARAM) === "concept"
      || window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    requested = false;
  }
  if (requested) {
    void import("./content.concept").then((module) => {
      conceptEntries = module.EXPLORE_CONCEPT_ENTRIES;
      conceptMap = module.EXPLORE_CONCEPT_MAP;
      active = true;
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* the demo still works for this page */
      }
      emit();
    });
  }
}

export function isExploreConceptDemo(): boolean {
  return active;
}

export function getConceptEntries(): readonly ExploreEntry[] {
  return active ? conceptEntries : [];
}

export function getConceptMap(): readonly ExploreConceptMapRow[] {
  return active ? conceptMap : [];
}

/** Leaves Concept Demo for this tab; it can only come back through the URL in an internal build. */
export function exitExploreConceptDemo(): void {
  if (!active) return;
  active = false;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function useExploreConceptDemo(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    isExploreConceptDemo,
    () => false,
  );
}
