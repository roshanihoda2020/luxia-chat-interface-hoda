/**
 * Pure identity helpers for Home Tiles (no React, no styles), so they can be
 * verified in Node (scripts/verify-home-tiles.mjs).
 */

/**
 * Short mark from a real name: a trailing number keeps its digits
 * ("Project name 07" → "P07"), otherwise the first letters of two words
 * ("Market Analysis" → "MA").
 */
export function monogramOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const last = words[words.length - 1];
  if (words.length > 1 && /^\d+$/.test(last)) return `${words[0][0]}${last.slice(-2)}`.toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

/** Knowledge type of a Constellation or Data Source ("database" | "pdf" | "csv" | "file" | connector ids). */
export type HomeKnowledgeKind = "database" | "pdf" | "csv" | "sheet" | "file";

export function knowledgeKindOf(typeOrConnector: string | undefined): HomeKnowledgeKind {
  const value = (typeOrConnector ?? "").toLowerCase();
  if (value === "pdf") return "pdf";
  if (value === "csv") return "csv";
  if (value === "googlesheet") return "sheet";
  if (value === "file") return "file";
  return "database";
}

