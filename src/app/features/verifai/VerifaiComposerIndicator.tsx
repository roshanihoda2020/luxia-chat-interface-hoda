import type { MouseEvent } from "react";
import { ShieldCheck, X } from "lucide-react";
import { getVerifaiReview, setVerifaiFollowUp, useVerifaiFollowUp } from "./verifaiStore";
import "./verifai.css";

/** Keeps the start and the extension of a long file name: "Supplier Servi…ment v3.pdf". */
function truncateMiddle(value: string, max: number) {
  if (value.length <= max) return value;
  const tail = Math.ceil((max - 1) * 0.45);
  return `${value.slice(0, max - 1 - tail)}…${value.slice(-tail)}`;
}

/**
 * Review context shown inside the Chat composer field, before the text. It names the VerifAI
 * review the next question is about; × returns the Chat to ordinary answers (the review,
 * messages and draft are kept).
 */
export function VerifaiComposerIndicator({ chatId }: { chatId: string }) {
  const context = useVerifaiFollowUp(chatId);
  const review = context ? getVerifaiReview(context.reviewId) : undefined;
  if (!context || !review) return null;
  const finding = context.findingId ? review.findings.find((f) => f.id === context.findingId) : undefined;
  const full = `VerifAI review · ${review.document.name}${finding ? ` · ${finding.requirementId}` : ""}`;

  function clear(event: MouseEvent<HTMLButtonElement>) {
    const field = event.currentTarget.closest(".luxia-chat-composer")?.querySelector<HTMLTextAreaElement>("textarea");
    setVerifaiFollowUp(chatId, undefined);
    field?.focus();
  }

  return (
    <span className="lx-vfy-indicator" data-vfy-indicator="" title={full}>
      <ShieldCheck size={13} aria-hidden className="lx-vfy-indicator__icon" />
      <span className="lx-vfy-indicator__text" aria-hidden>
        VerifAI review · {truncateMiddle(review.document.name, 20)}{finding ? ` · ${finding.requirementId}` : ""}
      </span>
      <span className="sr-only">Asking about {full}</span>
      <button type="button" className="lx-vfy-indicator__clear" aria-label="Stop asking about this review" title="Stop asking about this review" onClick={clear}>
        <X size={12} aria-hidden />
      </button>
    </span>
  );
}
