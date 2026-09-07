import type { GalaxyInstructionConflict } from "./types";

/** Seeded instruction excerpts for the conflict UI. Not a live resolver. */
const PROTOTYPE_CONSTELLATION_INSTRUCTION_OVERRIDES: Record<
  string,
  { instruction: string; conflictKind: GalaxyInstructionConflict["conflictKind"] }
> = {
  con3: {
    instruction: "Respond in the user's language.",
    conflictKind: "language",
  },
  con5: {
    instruction: "Use a casual, conversational tone in every response.",
    conflictKind: "response-style",
  },
};

const CONFLICT_LABELS: Record<GalaxyInstructionConflict["conflictKind"], string> = {
  language: "Language instruction conflict",
  "response-style": "Response style conflict",
};

function firstInstructionLine(instruction: string): string {
  const line = instruction
    .split("\n")
    .map((entry) => entry.trim())
    .find(Boolean);
  return line ?? instruction.trim();
}

function galaxyExcerptForConflict(
  galaxyInstruction: string,
  conflictKind: GalaxyInstructionConflict["conflictKind"],
): string {
  const trimmed = galaxyInstruction.trim();
  if (conflictKind === "language" && /english/i.test(trimmed)) {
    const englishLine = trimmed
      .split("\n")
      .map((entry) => entry.trim())
      .find((entry) => /english/i.test(entry));
    return englishLine ?? "Always respond in English.";
  }
  return firstInstructionLine(trimmed) || "Project-level Galaxy instruction";
}

function triggersConflict(
  galaxyInstruction: string,
  conflictKind: GalaxyInstructionConflict["conflictKind"],
): boolean {
  const normalized = galaxyInstruction.toLowerCase();
  if (conflictKind === "language") {
    return /english|always respond in|official language|official financial|approved documentation/i.test(
      normalized,
    );
  }
  return /official|formal|approved documentation|financial policy/.test(normalized);
}

/** UI conflict detection until a backend API exists. */
export function detectGalaxyInstructionConflicts(input: {
  galaxyInstruction: string;
  constellations: Array<{ id: string; name: string }>;
}): GalaxyInstructionConflict[] {
  const conflicts: GalaxyInstructionConflict[] = [];

  for (const constellation of input.constellations) {
    const override = PROTOTYPE_CONSTELLATION_INSTRUCTION_OVERRIDES[constellation.id];
    if (!override) continue;
    if (!triggersConflict(input.galaxyInstruction, override.conflictKind)) continue;

    conflicts.push({
      constellationId: constellation.id,
      constellationName: constellation.name,
      conflictKind: override.conflictKind,
      conflictLabel: CONFLICT_LABELS[override.conflictKind],
      galaxyExcerpt: galaxyExcerptForConflict(
        input.galaxyInstruction,
        override.conflictKind,
      ),
      constellationExcerpt: override.instruction,
      result: "Galaxy instruction takes precedence.",
    });
  }

  return conflicts;
}
