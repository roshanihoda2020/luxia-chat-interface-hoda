/**
 * Shared Luxia modal / dialog dark chrome.
 * Reuses Galaxy hero surface + brand primary dark — do not invent colors.
 *
 * Used by:
 * - structured modals (Settings, Import CSV) for header + left rail
 * - simple Dialog / AlertDialog headers via ui primitives
 */
export const STRUCTURED_MODAL_DARK_SURFACE = "var(--luxia-galaxy-hero-surface)";

export const STRUCTURED_MODAL_DARK_BASE = "var(--luxia-brand-primary-dark)";

/** Inline style for dark modal chrome (header, left rail). */
export const STRUCTURED_MODAL_DARK_CHROME_STYLE = {
  backgroundColor: STRUCTURED_MODAL_DARK_BASE,
  backgroundImage: STRUCTURED_MODAL_DARK_SURFACE,
} as const;

/** @deprecated Prefer STRUCTURED_MODAL_DARK_CHROME_STYLE — same tokens. */
export const LUXIA_DIALOG_DARK_CHROME_STYLE = STRUCTURED_MODAL_DARK_CHROME_STYLE;

/**
 * Layout + typography hooks for a dark dialog header band.
 * Apply with STRUCTURED_MODAL_DARK_CHROME_STYLE (or rely on DialogHeader primitive).
 */
export const LUXIA_DIALOG_HEADER_CLASS =
  "luxia-dialog-header-dark flex shrink-0 flex-col gap-1.5 space-y-0 px-6 py-4 text-left " +
  "[&_[data-slot=dialog-title]]:text-[var(--luxia-text-inverse)] " +
  "[&_[data-slot=alert-dialog-title]]:text-[var(--luxia-text-inverse)] " +
  "[&_[data-slot=dialog-description]]:text-[var(--luxia-purple-10)] " +
  "[&_[data-slot=alert-dialog-description]]:text-[var(--luxia-purple-10)]";

/** Close control sitting on a dark header. Ghost-button color must not win over inverse text. */
export const LUXIA_DIALOG_CLOSE_ON_DARK_CLASS =
  "!text-[var(--luxia-text-inverse)] opacity-100 " +
  "hover:!opacity-100 hover:!bg-[var(--luxia-opacity-white-12)] hover:!text-[var(--luxia-text-inverse)] " +
  "focus-visible:ring-2 focus-visible:ring-[var(--luxia-opacity-white-32)]";
