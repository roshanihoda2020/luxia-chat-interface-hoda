export type BlockStyle = "p" | "h1" | "h2" | "h3";

export type EditorCommand =
  | "undo"
  | "redo"
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "justifyFull"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "indent"
  | "outdent"
  | "removeFormat";

export const FONT_SIZE_OPTIONS = ["12", "14", "16", "18", "20", "24", "28", "32"] as const;

export type FontSizeOption = (typeof FONT_SIZE_OPTIONS)[number];

export type TextColorOption = {
  id: string;
  label: string;
  value: string | null;
};

export type HighlightColorOption = {
  id: string;
  label: string;
  value: string | null;
};

export const TEXT_COLOR_OPTIONS: TextColorOption[] = [
  { id: "default", label: "Default", value: null },
  { id: "dark-neutral", label: "Dark neutral", value: "#1C1917" },
  { id: "gray", label: "Gray", value: "#64748B" },
  { id: "luxia-purple", label: "Luxia purple", value: "#30214E" },
  { id: "blue", label: "Blue", value: "#1D4ED8" },
  { id: "green", label: "Green", value: "#15803D" },
  { id: "red", label: "Red", value: "#B91C1C" },
];

export const HIGHLIGHT_COLOR_OPTIONS: HighlightColorOption[] = [
  { id: "none", label: "Remove highlight", value: null },
  { id: "yellow", label: "Yellow", value: "#FEF08A" },
  { id: "light-blue", label: "Light blue", value: "#BFDBFE" },
  { id: "light-green", label: "Light green", value: "#BBF7D0" },
  { id: "light-purple", label: "Light purple", value: "#E9D5FF" },
];

export function isRangeInEditor(root: HTMLElement, range: Range | null | undefined): boolean {
  if (!range) return false;
  try {
    return root.contains(range.commonAncestorContainer);
  } catch {
    return false;
  }
}

export function restoreEditorRange(root: HTMLElement, range: Range | null): void {
  if (!range) return;
  try {
    if (!root.contains(range.commonAncestorContainer)) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  } catch {
    /* ignore stale ranges */
  }
}

export function captureEditorRange(root: HTMLElement): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  return range.cloneRange();
}

/**
 * Prefer the live editor selection when it is still valid.
 * Fall back to a preserved range only when the live selection was lost
 * (e.g. after opening a popover). Never apply formatting to a detached
 * Writing Assistant range when the user has a fresher live selection.
 */
export function resolveFormattingRange(
  root: HTMLElement,
  preserved: Range | null | undefined,
  options?: { allowCollapsed?: boolean },
): Range | null {
  const allowCollapsed = options?.allowCollapsed ?? true;
  const live = captureEditorRange(root);

  const usable = (range: Range | null | undefined): range is Range => {
    if (!range || !isRangeInEditor(root, range)) return false;
    if (!allowCollapsed && range.collapsed) return false;
    return true;
  };

  if (usable(live)) return live.cloneRange();
  if (usable(preserved)) return preserved.cloneRange();
  return null;
}

export function runEditorCommand(
  root: HTMLElement,
  command: EditorCommand,
  preferred?: Range | null,
): void {
  root.focus({ preventScroll: true });
  // focus() can drop the selection in some browsers — restore afterward.
  const range = preferred && isRangeInEditor(root, preferred)
    ? preferred
    : captureEditorRange(root);
  if (range) restoreEditorRange(root, range);
  document.execCommand(command);
}

export function applyBlockStyle(
  root: HTMLElement,
  style: BlockStyle,
  preferred?: Range | null,
): void {
  root.focus({ preventScroll: true });
  const range = preferred && isRangeInEditor(root, preferred)
    ? preferred
    : captureEditorRange(root);
  if (range) restoreEditorRange(root, range);
  document.execCommand("formatBlock", false, `<${style}>`);
}

function getWorkingRange(root: HTMLElement, preferred?: Range | null): Range | null {
  if (preferred) {
    try {
      if (root.contains(preferred.commonAncestorContainer) && !preferred.collapsed) {
        restoreEditorRange(root, preferred);
        return preferred.cloneRange();
      }
    } catch {
      /* stale preferred range */
    }
  }
  const captured = captureEditorRange(root);
  if (!captured || captured.collapsed) return null;
  restoreEditorRange(root, captured);
  return captured;
}

function selectNodeContents(node: Node): void {
  const selection = window.getSelection();
  if (!selection) return;
  const next = document.createRange();
  next.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(next);
}

function cleanupEmptyStyle(element: HTMLElement): void {
  if (!element.getAttribute("style")?.trim()) {
    element.removeAttribute("style");
  }
}

function clearCssPropertyInFragment(
  fragment: DocumentFragment,
  property: "color" | "backgroundColor",
): void {
  const nodes = [fragment, ...Array.from(fragment.querySelectorAll("*"))];
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    if (property === "color") {
      node.style.color = "";
      node.removeAttribute("color");
      if (node.tagName === "FONT") {
        node.removeAttribute("color");
      }
    } else {
      node.style.backgroundColor = "";
      node.style.background = "";
    }
    cleanupEmptyStyle(node);
  }
}

function wrapSelectionInSpan(
  root: HTMLElement,
  apply: (span: HTMLSpanElement) => void,
  preferred?: Range | null,
): void {
  const range = getWorkingRange(root, preferred);
  if (!range) return;
  root.focus();
  restoreEditorRange(root, range);

  const live = window.getSelection()?.getRangeAt(0) ?? range;
  if (live.collapsed || !root.contains(live.commonAncestorContainer)) return;

  const span = document.createElement("span");
  apply(span);

  try {
    live.surroundContents(span);
  } catch {
    const contents = live.extractContents();
    span.appendChild(contents);
    live.insertNode(span);
  }

  selectNodeContents(span);
}

function clearInlineStyleInSelection(
  root: HTMLElement,
  property: "color" | "backgroundColor",
  preferred?: Range | null,
): void {
  const range = getWorkingRange(root, preferred);
  if (!range) return;
  root.focus();
  restoreEditorRange(root, range);

  const live = window.getSelection()?.getRangeAt(0) ?? range;
  if (live.collapsed || !root.contains(live.commonAncestorContainer)) return;

  const contents = live.extractContents();
  clearCssPropertyInFragment(contents, property);
  live.insertNode(contents);

  // Also clear the property on ancestors that fully contain the restored selection
  // only when they are trivial style wrappers (span/font) — avoid stripping mark hosts.
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const selected = selection.getRangeAt(0);
    let node: Node | null = selected.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    while (node && node !== root) {
      if (node instanceof HTMLElement) {
        const tag = node.tagName;
        const isStyleWrapper = tag === "SPAN" || tag === "FONT";
        const isAnnotation =
          node.hasAttribute("data-wa-mark")
          || node.classList.contains("wa-mark-assist")
          || node.classList.contains("wa-mark-revision")
          || node.classList.contains("wa-mark-comment")
          || node.classList.contains("wa-has-comment");
        if (isStyleWrapper && !isAnnotation) {
          if (property === "color") {
            node.style.color = "";
            node.removeAttribute("color");
          } else {
            node.style.backgroundColor = "";
            node.style.background = "";
          }
          cleanupEmptyStyle(node);
        }
      }
      node = node.parentNode;
    }
  }
}

export function applyFontSize(root: HTMLElement, sizePx: FontSizeOption, preferred?: Range | null): void {
  wrapSelectionInSpan(
    root,
    (span) => {
      span.style.fontSize = `${sizePx}px`;
    },
    preferred,
  );
}

/**
 * Apply or clear text color on the exact restored selection.
 * Uses span wrapping instead of execCommand("foreColor"), which often no-ops
 * after toolbar/popover focus changes or across annotation hosts.
 */
export function applyTextColor(
  root: HTMLElement,
  color: string | null,
  preferred?: Range | null,
): void {
  if (color === null) {
    clearInlineStyleInSelection(root, "color", preferred);
    return;
  }
  wrapSelectionInSpan(
    root,
    (span) => {
      span.style.color = color;
    },
    preferred,
  );
}

/**
 * Apply or clear highlight on the exact restored selection.
 * Avoids hiliteColor/backColor, which can paint whole blocks or fail silently.
 */
export function applyHighlightColor(
  root: HTMLElement,
  color: string | null,
  preferred?: Range | null,
): void {
  if (color === null) {
    clearInlineStyleInSelection(root, "backgroundColor", preferred);
    return;
  }
  wrapSelectionInSpan(
    root,
    (span) => {
      span.style.backgroundColor = color;
    },
    preferred,
  );
}

export function insertImageDataUrl(root: HTMLElement, dataUrl: string, alt = "Inserted image"): void {
  root.focus();
  const safeAlt = alt.replace(/"/g, "&quot;");
  document.execCommand(
    "insertHTML",
    false,
    `<img src="${dataUrl}" alt="${safeAlt}" style="max-width:100%;height:auto;display:block;margin:0.75rem 0;" />`,
  );
}

export function detectBlockStyle(root: HTMLElement): BlockStyle {
  const selection = window.getSelection();
  let node: Node | null = selection?.anchorNode ?? null;
  while (node && node !== root) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName.toLowerCase();
      if (tag === "h1" || tag === "h2" || tag === "h3") {
        return tag;
      }
      if (tag === "p" || tag === "div") {
        return "p";
      }
    }
    node = node.parentNode;
  }
  return "p";
}

export function detectFontSize(root: HTMLElement): FontSizeOption | "" {
  const selection = window.getSelection();
  let node: Node | null = selection?.anchorNode ?? null;
  while (node && node !== root) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const size = element.style?.fontSize;
      if (size) {
        const px = String(Math.round(Number.parseFloat(size)));
        if ((FONT_SIZE_OPTIONS as readonly string[]).includes(px)) {
          return px as FontSizeOption;
        }
      }
    }
    node = node.parentNode;
  }
  return "";
}

function toHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "inherit" || trimmed === "transparent") return null;
  if (trimmed.startsWith("#")) {
    if (trimmed.length === 4) {
      const r = trimmed[1];
      const g = trimmed[2];
      const b = trimmed[3];
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    return trimmed.toUpperCase();
  }
  const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return null;
  const toHex = (n: string) => Number(n).toString(16).padStart(2, "0");
  return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`.toUpperCase();
}

function matchPaletteColor(
  value: string,
  options: { value: string | null }[],
): string | null {
  const hex = toHexColor(value);
  if (!hex) return null;
  const match = options.find(
    (option) => option.value && option.value.toUpperCase() === hex,
  );
  return match?.value ?? hex;
}

export function detectTextColor(root: HTMLElement): string | null {
  const selection = window.getSelection();
  let node: Node | null = selection?.anchorNode ?? null;
  while (node && node !== root) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const attrColor = element.getAttribute("color");
      if (attrColor) {
        return matchPaletteColor(attrColor, TEXT_COLOR_OPTIONS);
      }
      const inline = element.style?.color;
      if (inline && inline !== "inherit") {
        return matchPaletteColor(inline, TEXT_COLOR_OPTIONS);
      }
    }
    node = node.parentNode;
  }
  return null;
}

export function detectHighlightColor(root: HTMLElement): string | null {
  const selection = window.getSelection();
  let node: Node | null = selection?.anchorNode ?? null;
  while (node && node !== root) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const bg = element.style?.backgroundColor;
      if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
        return matchPaletteColor(bg, HIGHLIGHT_COLOR_OPTIONS);
      }
    }
    node = node.parentNode;
  }
  return null;
}

export function queryEditorState() {
  const safe = (command: string) => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };
  const enabled = (command: string) => {
    try {
      return document.queryCommandEnabled(command);
    } catch {
      return false;
    }
  };

  return {
    bold: safe("bold"),
    italic: safe("italic"),
    underline: safe("underline"),
    strikeThrough: safe("strikeThrough"),
    justifyLeft: safe("justifyLeft"),
    justifyCenter: safe("justifyCenter"),
    justifyRight: safe("justifyRight"),
    justifyFull: safe("justifyFull"),
    unordered: safe("insertUnorderedList"),
    ordered: safe("insertOrderedList"),
    canUndo: enabled("undo"),
    canRedo: enabled("redo"),
  };
}
