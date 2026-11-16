/**
 * Knowledge for a new Chat started with "+" in a Project.
 *
 * `eligible` must already be the Project's ACCESSIBLE Constellations (permission guards are
 * applied by the caller, and again when the Chat is created). Resolution never picks an
 * arbitrary Constellation:
 *   1. the Constellation last chosen in this Project, if still eligible;
 *   2. otherwise the Project's only eligible Constellation;
 *   3. otherwise (none, or several) ask the user explicitly.
 */
export type NewChatKnowledge<T> =
  | { kind: "use"; constellation: T; reason: "remembered" | "only-option" }
  | { kind: "ask"; reason: "no-options" | "several-options" };

export function resolveNewChatKnowledge<T extends { id: string }>(
  eligible: readonly T[],
  rememberedId?: string | null,
): NewChatKnowledge<T> {
  const remembered = rememberedId ? eligible.find((item) => item.id === rememberedId) : undefined;
  if (remembered) return { kind: "use", constellation: remembered, reason: "remembered" };
  if (eligible.length === 1) return { kind: "use", constellation: eligible[0], reason: "only-option" };
  return { kind: "ask", reason: eligible.length === 0 ? "no-options" : "several-options" };
}
