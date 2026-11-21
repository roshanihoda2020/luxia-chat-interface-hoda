import { useEffect, useRef, useState, type FormEvent } from "react";
import { FileSearch, Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { answerReviewFollowUp } from "../../reviewText";
import { appendVerifaiAssistantMessage, useVerifaiAssistantThread } from "../../verifaiStore";
import type { VerifaiReview } from "../../types";
import { REQUIREMENT_STATUS_TONE } from "./ChecklistNavigator";

const GENERAL_PROMPTS = ["Which finding should I fix first?", "Summarize this review for legal", "Which requirements need attention?"];

/**
 * Right panel: evidence for the selected requirement (text and page references only — the mock has
 * no PDF to navigate) and a review-specific assistant using the same answers as Chat follow-ups.
 */
export function EvidenceAssistantPanel({ review, selectedId }: { review: VerifaiReview; selectedId: string | null }) {
  const requirement = review.checklist.requirements.find((r) => r.id === selectedId) ?? null;
  const result = review.requirementResults.find((r) => r.requirementId === selectedId) ?? null;
  const finding = review.findings.find((f) => f.requirementId === selectedId) ?? null;
  const thread = useVerifaiAssistantThread(review.id);
  const [question, setQuestion] = useState("");
  const [answering, setAnswering] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { threadEndRef.current?.scrollIntoView({ block: "nearest" }); }, [thread.length, answering]);

  function ask(text: string) {
    const value = text.trim();
    if (!value || answering) return;
    appendVerifaiAssistantMessage(review.id, { role: "user", text: value, findingId: finding?.id });
    setQuestion("");
    setAnswering(true);
    const findingId = finding?.id;
    const requirementId = requirement?.id;
    window.setTimeout(() => {
      // The question decides the scope; the selection is only context for questions about "this" item.
      appendVerifaiAssistantMessage(review.id, { role: "assistant", text: answerReviewFollowUp(review, value, findingId, requirementId), findingId });
      setAnswering(false);
    }, 700);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(question);
  }

  const selectedPrompt = finding
    ? `Why is ${finding.requirementId} a problem and how do I fix it?`
    : requirement && result?.status === "Met"
      ? `Why is ${requirement.id} met?`
      : requirement && result?.status === "Not assessed"
        ? `Why was ${requirement.id} not assessed?`
        : null;
  const prompts = selectedPrompt ? [selectedPrompt, ...GENERAL_PROMPTS] : GENERAL_PROMPTS;

  return (
    <aside className="lx-vws-panel lx-vws-side" aria-label="Evidence and AI Assistant" data-vfy-evidence-panel="">
      <div className="lx-vws-panel__scroll">
        <section aria-labelledby="lx-vws-evidence-title" className="lx-vws-side__block">
          <h3 id="lx-vws-evidence-title" className="lx-vws-panel__title"><FileSearch size={15} aria-hidden /> Evidence</h3>
          {!requirement ? (
            <p className="lx-vws-empty">Select a requirement or finding to see its evidence.</p>
          ) : (
            <div data-vfy-evidence-for={requirement.id}>
              <p className="lx-vws-side__req">
                <span className="lx-vfy-req-id">{requirement.id}</span> {requirement.text}
              </p>
              {/* With a finding, its card already shows severity and status. */}
              {result && !finding ? (
                <p className="lx-vws-status-label" data-tone={REQUIREMENT_STATUS_TONE[result.status]}>{result.status}</p>
              ) : null}
              {finding ? (
                <>
                  <div className="lx-vfy-evidence">
                    <div className="lx-vfy-evidence__head">
                      <span>{review.document.name}</span>
                      <span className="lx-vfy-evidence__loc">Page {finding.evidence.page} · {finding.evidence.section}</span>
                    </div>
                    <blockquote className="lx-vfy-evidence__quote">“{finding.evidence.quote}”</blockquote>
                    <p className="lx-vfy-evidence__note">
                      {review.document.origin === "upload" ? "Simulated excerpt for an uploaded file. " : ""}Confirmed against the source text.
                    </p>
                  </div>
                  <p className="lx-vws-side__fix"><strong>Suggested fix:</strong> {finding.suggestedFix}</p>
                </>
              ) : (
                <p className="lx-vws-empty">
                  {result?.status === "Not assessed"
                    ? `Not assessed: no passage in ${review.document.name} addresses this requirement. Check it manually.`
                    : "No issue was found for this requirement in the document."}
                </p>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="lx-vws-assistant-title" className="lx-vws-side__block">
          <h3 id="lx-vws-assistant-title" className="lx-vws-panel__title"><MessageSquare size={15} aria-hidden /> Ask about this review</h3>
          <div className="lx-vws-thread" aria-live="polite" data-vfy-assistant-thread="">
            {thread.length === 0 ? <p className="lx-vws-empty">Ask a question about the findings. Answers use only this review.</p> : null}
            {thread.map((message) => (
              <div key={message.id} className="lx-vws-msg" data-role={message.role}>
                <p className="lx-vws-msg__who">{message.role === "user" ? "You" : "Luxia"}</p>
                <p className="lx-vws-msg__text">{message.text}</p>
              </div>
            ))}
            {answering ? <p className="lx-vfy-status" role="status"><Loader2 size={14} className="lx-vfy-spin" aria-hidden /> Answering…</p> : null}
            <div ref={threadEndRef} />
          </div>
          <div className="lx-vfy-followups" aria-label="Suggested questions">
            {prompts.map((prompt) => (
              <button key={prompt} type="button" className="lx-vfy-followup" onClick={() => ask(prompt)} disabled={answering} data-vfy-assistant-suggestion="">
                {prompt}
              </button>
            ))}
          </div>
          <form className="lx-vws-ask" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="lx-vws-ask-input">Ask about this review</label>
            <textarea
              id="lx-vws-ask-input"
              className="lx-vws-ask__input"
              rows={2}
              value={question}
              placeholder={finding ? `Ask about ${finding.requirementId}…` : "Ask about this review…"}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(question); } }}
            />
            <Button type="submit" variant="primary" size="sm" disabled={!question.trim() || answering} aria-label="Ask">
              <Send size={14} aria-hidden />
            </Button>
          </form>
        </section>
      </div>
    </aside>
  );
}
