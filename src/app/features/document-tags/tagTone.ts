import type { DocumentTagColorId } from "./types";

export interface DocumentTagTone {
  color: string;
  background: string;
  borderColor: string;
  swatch: string;
}

function wash(hue: string, strength: number): string {
  return `color-mix(in srgb, ${hue} ${strength}%, var(--luxia-neutral-white))`;
}

function tone(hue: string, text: string, fill: number, stroke: number): DocumentTagTone {
  return {
    color: text,
    background: wash(hue, fill),
    borderColor: wash(hue, stroke),
    swatch: hue,
  };
}

export const DOCUMENT_TAG_COLOR_IDS = [
  "blue",
  "teal",
  "green",
  "amber",
  "orange",
  "rose",
  "purple",
  "neutral",
] as const satisfies readonly DocumentTagColorId[];

export const DOCUMENT_TAG_COLOR_LABELS: Record<DocumentTagColorId, string> = {
  blue: "Blue",
  teal: "Teal",
  green: "Green",
  amber: "Amber",
  orange: "Orange",
  rose: "Rose",
  purple: "Purple",
  neutral: "Neutral",
};

/**
 * Approved tag palette. Chip fill is a restrained wash; swatches use the hue.
 * Index in DOCUMENT_TAG_COLOR_IDS is used only to suggest a default color.
 */
export const DOCUMENT_TAG_PALETTE: Record<DocumentTagColorId, DocumentTagTone> = {
  blue: tone("#1A6FBF", "#0D4A86", 32, 50),
  teal: tone("#0C8F8A", "#085E5A", 30, 48),
  green: tone("var(--luxia-success)", "var(--luxia-success-70)", 28, 46),
  amber: tone("var(--luxia-data-yellow)", "#5C4800", 46, 64),
  orange: tone("#E05616", "#8A300A", 30, 48),
  rose: tone("#D63D6B", "#8C2144", 26, 44),
  purple: tone("var(--luxia-purple-50)", "var(--luxia-purple-60)", 32, 52),
  neutral: tone("var(--luxia-neutral-500)", "var(--luxia-neutral-700)", 22, 40),
};

function hashNormalizedTag(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function isDocumentTagColorId(value: string): value is DocumentTagColorId {
  return (DOCUMENT_TAG_COLOR_IDS as readonly string[]).includes(value);
}

/** Default color suggestion for a new tag. Not used after the Tag is created. */
export function suggestTagColor(name: string): DocumentTagColorId {
  const key = name.trim().replace(/\s+/g, " ").toLowerCase() || name.toLowerCase();
  const index = hashNormalizedTag(key) % DOCUMENT_TAG_COLOR_IDS.length;
  return DOCUMENT_TAG_COLOR_IDS[index]!;
}

export function documentTagTone(color: DocumentTagColorId): DocumentTagTone {
  return DOCUMENT_TAG_PALETTE[color] ?? DOCUMENT_TAG_PALETTE.neutral;
}
