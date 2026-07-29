import type { CSSProperties, FocusEvent, MouseEvent } from "react";

export const IC = {
  shell: "var(--luxia-galaxy-shell)",
  shellGradient: "var(--luxia-gradient-galaxy-panel)",
  header: "var(--luxia-galaxy-shell)",
  card: "var(--luxia-galaxy-surface)",
  cardQuiet: "var(--luxia-galaxy-surface)",
  nested: "var(--luxia-galaxy-surface)",
  raised: "var(--luxia-galaxy-surface-raised)",
  input: "var(--luxia-galaxy-surface-nested)",
  instructionField: "var(--luxia-galaxy-surface-nested)",
  inputBorder: "rgba(255, 255, 255, 0.12)",
  inputBorderHover: "rgba(255, 255, 255, 0.18)",
  inputBorderFocus: "rgba(142, 99, 235, 0.42)",
  inputIcon: "rgba(255, 255, 255, 0.45)",
  inputPlaceholder: "rgba(255, 255, 255, 0.40)",
  shellBorder: "rgba(255, 255, 255, 0.06)",
  border: "rgba(255, 255, 255, 0.10)",
  borderSubtle: "rgba(255, 255, 255, 0.06)",
  headerDivider: "rgba(255, 255, 255, 0.04)",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.70)",
  textMuted: "rgba(255, 255, 255, 0.55)",
  /** Align with DS `--luxia-inspector-subtitle` (galaxy / pdf) */
  textSubtitle: "rgba(150, 219, 251, 0.55)",
  /** Align with DS `--luxia-inspector-description` for PDF */
  textDescPdf: "rgba(150, 219, 251, 0.78)",
  /** Align with DS `--luxia-inspector-description` for Database */
  textDescDatabase: "rgba(198, 177, 245, 0.78)",
  icon: "rgba(255, 255, 255, 0.55)",
  iconAccent: "var(--luxia-purple-50)",
  /** Align with Galaxy / PDF badge accent */
  iconPdf: "var(--luxia-brand-tertiary)",
  /**
   * Section icons + titles + Read more — inherits `--luxia-inspector-accent`
   * from the constellation inspector root (PDF blue / Database purple).
   */
  iconSemantic: "var(--luxia-inspector-accent, var(--luxia-purple-50))",
  hover: "rgba(255, 255, 255, 0.06)",
  selected: "rgba(142, 99, 235, 0.14)",
  /** Non-input controls only; inputs use inputBorderFocus */
  focusRing: "0 0 0 2px rgba(142, 99, 235, 0.28)",
  shellShadow: "var(--luxia-galaxy-shell-shadow)",
  cardShadow: "0 2px 8px rgba(8, 5, 18, 0.14)",
  cardShadowRaised: "0 6px 16px rgba(8, 5, 18, 0.20)",
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

export function icInspectorDescriptionColor(type: "pdf" | "database"): string {
  if (type === "database") return IC.textDescDatabase;
  return IC.textDescPdf;
}

export function icInspectorAccent(type: "pdf" | "database"): string {
  return type === "pdf" ? IC.iconPdf : IC.iconAccent;
}

export function icInspectorTitleColor(type: "pdf" | "database" | "galaxy"): string {
  if (type === "galaxy") return "var(--luxia-text-inverse)";
  return IC.iconSemantic;
}

export function icInspectorAccentStyle(type: "pdf" | "database"): CSSProperties {
  const accent = icInspectorAccent(type);
  return {
    ["--luxia-inspector-accent" as string]: accent,
    ["--luxia-inspector-description" as string]: icInspectorDescriptionColor(type),
  };
}

export const IC_CARD: CSSProperties = {
  background: IC.card,
  border: `1px solid ${IC.borderSubtle}`,
  boxShadow: IC.cardShadow,
  borderRadius: IC.radiusCard,
  overflow: "hidden",
};

export const IC_CARD_OPEN: CSSProperties = {
  background: IC.card,
  border: `1px solid ${IC.border}`,
  boxShadow: IC.cardShadowRaised,
  borderRadius: IC.radiusCard,
  overflow: "hidden",
};

export function icCardStyle(expanded: boolean): CSSProperties {
  return expanded ? IC_CARD_OPEN : IC_CARD;
}

export const IC_SEARCH_SHELL =
  "flex items-center gap-1.5 px-2.5 h-[28px] rounded-[7px] mt-2 mb-1 transition-[border-color] duration-150";

export const IC_SEARCH_SHELL_STYLE: CSSProperties = {
  border: `1px solid ${IC.inputBorder}`,
  background: IC.input,
};

export const IC_INPUT_TEXT =
  "bg-transparent outline-none luxia-type-caption placeholder:text-[rgba(255,255,255,0.40)]";

export function icTextareaStyle(focused: boolean, opts?: { invalid?: boolean; disabled?: boolean }): CSSProperties {
  const border = opts?.invalid
    ? "rgba(247, 80, 80, 0.55)"
    : opts?.disabled
      ? IC.disabledBorder
      : focused
        ? IC.inputBorderFocus
        : IC.inputBorder;

  return {
    color: opts?.disabled ? IC.disabledText : IC.textPrimary,
    background: opts?.disabled ? IC.disabledSurface : IC.input,
    border: `1px solid ${border}`,
    boxShadow: "none",
  };
}

export function icSearchShellHoverOn(e: MouseEvent<HTMLElement>) {
  if (e.currentTarget.contains(document.activeElement)) return;
  e.currentTarget.style.borderColor = IC.inputBorderHover;
}

export function icSearchShellHoverOff(e: MouseEvent<HTMLElement>) {
  if (e.currentTarget.contains(document.activeElement)) return;
  e.currentTarget.style.borderColor = IC.inputBorder;
}

export function icSearchShellFocus(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  const shell = e.currentTarget.parentElement;
  if (shell) shell.style.borderColor = IC.inputBorderFocus;
}

export function icSearchShellBlur(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  const shell = e.currentTarget.parentElement;
  if (shell) shell.style.borderColor = IC.inputBorder;
}

export function icInputBorderHoverOn(e: MouseEvent<HTMLElement>, focused: boolean) {
  if (focused) return;
  e.currentTarget.style.borderColor = IC.inputBorderHover;
}

export function icInputBorderHoverOff(e: MouseEvent<HTMLElement>, focused: boolean) {
  if (focused) return;
  e.currentTarget.style.borderColor = IC.inputBorder;
}

export const IC_CARD_HEADER =
  "flex items-center gap-1.5 px-[14px] py-2";

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
