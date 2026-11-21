import { useCallback, useRef } from "react";

/**
 * Focus return for sheets opened from a button without a Radix trigger: the element focused when
 * the sheet opened gets focus back when it closes (Escape, Close button or outside click), instead
 * of the document body. Pass the result as `onCloseAutoFocus` on the sheet content.
 */
export function useReturnFocus(open: boolean) {
  const openerRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  // Captured during render, before the sheet moves focus inside itself.
  if (open && !wasOpen.current && typeof document !== "undefined") {
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }
  wasOpen.current = open;

  return useCallback((event: Event) => {
    const opener = openerRef.current;
    if (!opener) return;
    event.preventDefault();
    window.requestAnimationFrame(() => {
      if (opener.isConnected) opener.focus();
    });
  }, []);
}
