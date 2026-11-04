import type { VidgetSourceType } from "@/app/features/vidgets/types";
import type {
  VidgetInboxAssistantTurn,
  VidgetInboxTurn,
  VidgetInboxVisitorTurn,
} from "./types";

export interface VidgetInboxInteraction {
  id: string;
  visitor: VidgetInboxVisitorTurn | null;
  assistant: VidgetInboxAssistantTurn | null;
}

/** Pair visitor question + following assistant answer as one reviewable interaction. */
export function groupInboxInteractions(
  turns: readonly VidgetInboxTurn[],
): VidgetInboxInteraction[] {
  const groups: VidgetInboxInteraction[] = [];
  let pendingVisitor: VidgetInboxVisitorTurn | null = null;

  for (const turn of turns) {
    if (turn.role === "visitor") {
      if (pendingVisitor) {
        groups.push({
          id: pendingVisitor.id,
          visitor: pendingVisitor,
          assistant: null,
        });
      }
      pendingVisitor = turn;
      continue;
    }
    groups.push({
      id: turn.id,
      visitor: pendingVisitor,
      assistant: turn,
    });
    pendingVisitor = null;
  }

  if (pendingVisitor) {
    groups.push({
      id: pendingVisitor.id,
      visitor: pendingVisitor,
      assistant: null,
    });
  }

  return groups;
}

export function buildInteractionCopyText(interaction: VidgetInboxInteraction): string {
  const question = interaction.visitor?.content.trim() ?? "";
  const answer = interaction.assistant?.content.trim() ?? "";
  if (question && answer) return `Question\n${question}\n\nAnswer\n${answer}`;
  if (question) return question;
  return answer;
}

/**
 * Refine target: Constellation Vidget → that Constellation.
 * Galaxy Vidget → matched Constellation on the interaction.
 * Do not guess.
 */
export function resolveRefineConstellationId(input: {
  vidgetSourceType: VidgetSourceType | null;
  vidgetConstellationId: string | null | undefined;
  interactionConstellationId: string | null | undefined;
}): string | null {
  if (input.vidgetSourceType === "constellation") {
    return input.vidgetConstellationId?.trim() || null;
  }
  if (input.vidgetSourceType === "galaxy") {
    return input.interactionConstellationId?.trim() || null;
  }
  return null;
}
