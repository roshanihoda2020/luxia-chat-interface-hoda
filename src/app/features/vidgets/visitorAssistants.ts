import { normalizeGalaxyConstellationIds } from "./data";
import type { VidgetRecord } from "./types";

export type VidgetVisitorAssistantOption = {
  id: string;
  /** Visitor-facing assistant name (no admin Constellation jargon where avoidable). */
  name: string;
  description: string;
};

/** Soften prototype Constellation labels for visitor-facing UI. */
export function toVisitorAssistantLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Assistant";
  const cleaned = trimmed
    .replace(/^Constellation\s+name\s+/i, "Assistant ")
    .replace(/^Constellation\s+/i, "")
    .replace(/\b(DB|PDF|CSV)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || "Assistant";
}

export function toVisitorAssistantDescription(description: string | undefined): string {
  const trimmed = description?.trim() ?? "";
  if (!trimmed) return "Available for this conversation.";
  const cleaned = trimmed
    .replace(/Constellation/gi, "assistant")
    .replace(/\b(DB|PDF|CSV)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
  return cleaned || "Available for this conversation.";
}

/**
 * Eligible visitor assistants = Knowledge scope ∩ available project constellations.
 * Never expands beyond galaxyConstellationIds.
 */
export function buildVisitorAssistantOptions(
  record: Pick<VidgetRecord, "sourceType" | "galaxyConstellationIds">,
  constellations: { id: string; name: string; description?: string }[],
): VidgetVisitorAssistantOption[] {
  if (record.sourceType !== "galaxy") return [];
  const scope = new Set(normalizeGalaxyConstellationIds(record.galaxyConstellationIds));
  if (scope.size === 0) return [];
  const byId = new Map(constellations.map((item) => [item.id, item]));
  const options: VidgetVisitorAssistantOption[] = [];
  for (const id of scope) {
    const match = byId.get(id);
    if (!match) continue;
    options.push({
      id,
      name: toVisitorAssistantLabel(match.name),
      description: toVisitorAssistantDescription(match.description),
    });
  }
  return options;
}

export function isVisitorAssistantStillEligible(
  selectedId: string | null | undefined,
  options: VidgetVisitorAssistantOption[],
): boolean {
  if (!selectedId?.trim()) return false;
  return options.some((item) => item.id === selectedId);
}
