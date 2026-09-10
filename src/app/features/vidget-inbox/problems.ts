import type { VidgetInboxAssistantTurn, VidgetInboxSession, VidgetInboxTurn } from "./types";

/**
 * Problem contract for Inbox review.
 *
 * A session is problematic when at least one assistant interaction has:
 * - negative visitor feedback, or
 * - Response Confidence presentation Warning, Error, or Block.
 *
 * Normal presentation + no negative feedback = no problem.
 * No extra scoring, sentiment, or generated confidence.
 */
export function assistantTurnIsProblematic(turn: VidgetInboxTurn): boolean {
  if (turn.role !== "assistant") return false;
  return assistantTurnHasProblem(turn);
}

export function assistantTurnHasProblem(turn: VidgetInboxAssistantTurn): boolean {
  if (turn.feedback === "negative") return true;
  return (
    turn.presentation === "warning"
    || turn.presentation === "error"
    || turn.presentation === "block"
  );
}

export function countSessionProblems(session: Pick<VidgetInboxSession, "turns">): number {
  return session.turns.filter(assistantTurnIsProblematic).length;
}

export function summarizeSessionProblems(session: Pick<VidgetInboxSession, "turns">): {
  negativeFeedback: number;
  lowConfidence: number;
} {
  let negativeFeedback = 0;
  let lowConfidence = 0;
  for (const turn of session.turns) {
    if (turn.role !== "assistant") continue;
    if (turn.feedback === "negative") negativeFeedback += 1;
    if (
      turn.presentation === "warning"
      || turn.presentation === "error"
      || turn.presentation === "block"
    ) {
      lowConfidence += 1;
    }
  }
  return { negativeFeedback, lowConfidence };
}

export function formatProblemCount(count: number): string {
  if (count <= 0) return "0";
  return count === 1 ? "1 issue" : `${count} issues`;
}

export function formatProblemSummary(session: Pick<VidgetInboxSession, "turns">): string | null {
  const { negativeFeedback, lowConfidence } = summarizeSessionProblems(session);
  if (negativeFeedback === 0 && lowConfidence === 0) return null;
  const parts: string[] = [];
  if (negativeFeedback > 0) {
    parts.push(
      `${negativeFeedback} negative feedback`,
    );
  }
  if (lowConfidence > 0) {
    parts.push(
      `${lowConfidence} low confidence`,
    );
  }
  return parts.join(" · ");
}
