import type { CSSProperties } from "react";

export const IC = {
  shell: "var(--luxia-galaxy-shell)",
  shellGradient: "var(--luxia-gradient-galaxy-panel)",
  header: "var(--luxia-galaxy-header)",
  card: "var(--luxia-galaxy-surface)",
  cardQuiet: "var(--luxia-galaxy-surface-quiet)",
  nested: "var(--luxia-galaxy-surface-nested)",
  raised: "var(--luxia-galaxy-surface-raised)",
  input: "var(--luxia-galaxy-surface-input)",
  instructionField: "var(--luxia-galaxy-surface-instruction-field)",
  shellBorder: "rgba(255, 255, 255, 0.06)",
  border: "rgba(255, 255, 255, 0.08)",
  borderSubtle: "rgba(255, 255, 255, 0.06)",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.70)",
  textMuted: "rgba(255, 255, 255, 0.55)",
  icon: "rgba(255, 255, 255, 0.55)",
  iconAccent: "var(--luxia-purple-50)",
  hover: "rgba(255, 255, 255, 0.06)",
  selected: "rgba(142, 99, 235, 0.14)",
  focusRing: "0 0 0 2px rgba(142, 99, 235, 0.28)",
  shellShadow: "var(--luxia-galaxy-shell-shadow)",
  cardShadow: "0 2px 8px rgba(8, 5, 18, 0.14)",
  radiusShell: "var(--luxia-radius-24)",
  radiusCard: 14,
  radiusNested: 12,
  radiusControl: 10,
  disabledSurface: "var(--luxia-galaxy-disabled-surface)",
  disabledBorder: "var(--luxia-galaxy-disabled-border)",
  disabledText: "var(--luxia-galaxy-disabled-text)",
  saveEnabled: "var(--luxia-gradient-button)",
  gap: 14,
  scrollThumb: "rgba(255, 255, 255, 0.14)",
  controlBg: "rgba(255, 255, 255, 0.06)",
} as const;

export const IC_CARD: CSSProperties = {
  background: IC.card,
  border: `1px solid ${IC.border}`,
  boxShadow: IC.cardShadow,
  borderRadius: IC.radiusCard,
  overflow: "hidden",
};

export const IC_BTN_ICON =
  "w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors outline-none flex-shrink-0";

export const IC_BTN_OPEN =
  "h-7 w-7 flex items-center justify-center rounded-full border-0 bg-transparent outline-none flex-shrink-0 cursor-pointer transition-[background-color] duration-150";

export const IC_OPEN_ACTIVE = "rgba(255, 255, 255, 0.10)";

export function icHoverOn(e: { currentTarget: EventTarget | null }) {
  (e.currentTarget as HTMLElement).style.background = IC.hover;
}

export function icHoverOff(e: { currentTarget: EventTarget | null }) {
  (e.currentTarget as HTMLElement).style.background = "transparent";
}

export function icOpenActiveOn(e: { currentTarget: EventTarget | null }) {
  (e.currentTarget as HTMLElement).style.background = IC_OPEN_ACTIVE;
}
