import { useEffect, type MutableRefObject } from "react";

/**
 * Shared unsaved-navigation contract (same shape as constellation-create guard).
 * Host surfaces register an implementation; App asks before leaving.
 */
export type UnsavedNavigationGuard = {
  isDirty: () => boolean;
  requestLeaveConfirmation: (onConfirmed: () => void) => void;
};

/** Keep a ref in sync with React dirty state for cross-tree guard reads. */
export function useSyncDirtyRef(
  dirtyRef: MutableRefObject<boolean> | undefined,
  dirty: boolean,
) {
  useEffect(() => {
    if (!dirtyRef) return;
    dirtyRef.current = dirty;
  }, [dirty, dirtyRef]);
}

/** Native browser refresh / tab-close prompt while dirty. */
export function useBeforeUnloadWhenDirty(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);
}

/** Register manager leave + dirty for page chrome / App navigation. */
export function useManagerLeaveRegistration({
  closeRef,
  dirtyRef,
  dirty,
  requestLeave,
}: {
  closeRef?: MutableRefObject<(() => void) | null>;
  dirtyRef?: MutableRefObject<boolean>;
  dirty: boolean;
  requestLeave: () => void;
}) {
  useSyncDirtyRef(dirtyRef, dirty);
  useBeforeUnloadWhenDirty(dirty);

  useEffect(() => {
    if (closeRef) closeRef.current = requestLeave;
    return () => {
      if (closeRef) closeRef.current = null;
    };
  });
}

export function runWithUnsavedNavigationGuard(
  guard: UnsavedNavigationGuard | null | undefined,
  proceed: () => void,
) {
  if (guard?.isDirty()) {
    guard.requestLeaveConfirmation(proceed);
    return;
  }
  proceed();
}
