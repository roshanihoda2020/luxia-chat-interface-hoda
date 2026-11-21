import { createContext, useContext, useState } from "react";
import { CheckCircle2, Download, ListChecks, Loader2, MessageSquare, RotateCcw, XCircle } from "lucide-react";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import { Button } from "@/app/components/ui/button";
import { ResponseActionsFooter } from "@/app/features/chat/ResponseActionsFooter";
import { useVerifaiReview } from "./verifaiStore";
import { reviewExplanation, reviewSummary } from "./reviewText";
import { ActivitySection } from "./components/ActivitySection";
import { FindingCard } from "./components/FindingCard";
import { ReviewContextLine, StageList } from "./components/ReviewParts";
import { ReviewMetrics } from "./components/ReviewMetrics";
import { downloadReport } from "./components/reviewActions";
import type { VerifaiFinding, VerifaiReview } from "./types";
import "./verifai.css";

/** Chat-level handlers. Without a provider (e.g. Home), follow-up controls are not shown. */
export type VerifaiChatActions = {
  askAboutFinding: (review: VerifaiReview, finding: VerifaiFinding) => void;
  askAboutReview: (review: VerifaiReview) => void;
  askFollowUp: (review: VerifaiReview, question: string) => void;
  startNewReview: (review: VerifaiReview) => void;
};
export const VerifaiChatActionsContext = createContext<VerifaiChatActions | null>(null);

const FOLLOW_UP_PROMPTS = ["Which finding should I fix first?", "Summarize this review for legal"];

function ProgressBody({ review }: { review: VerifaiReview }) {
  const active = review.stages.find((s) => s.status === "active");
  return (
    <div className="lx-vfy-card__inner" data-vfy-state="running">
      <div className="lx-vfy-card__head">
        <span className="lx-vfy-head-icon lx-vfy-head-icon--running" aria-hidden><Loader2 size={18} className="lx-vfy-spin" /></span>
        <div className="min-w-0">
          <p className="lx-vfy-card__title">VerifAI Review In Progress</p>
          <p className="lx-vfy-card__subtitle">Document against checklist</p>
        </div>
        <span className="lx-vfy-percent" aria-hidden>{review.progress}%</span>
      </div>
      <ReviewContextLine review={review} />
      <div
        className="lx-vfy-bar lx-vfy-bar--lg"
        role="progressbar"
        aria-label="Verification progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={review.progress}
        aria-valuetext={active ? `${review.progress}% · ${active.label}` : `${review.progress}%`}
      >
        <span style={{ width: `${review.progress}%` }} />
      </div>
      <StageList review={review} />
    </div>
  );
}

function FailedBody({ review, onStartNewReview }: { review: VerifaiReview; onStartNewReview?: () => void }) {
  return (
    <div className="lx-vfy-card__inner" data-vfy-state="failed">
      <div className="lx-vfy-card__head">
        <span className="lx-vfy-head-icon lx-vfy-head-icon--failed" aria-hidden><XCircle size={20} /></span>
        <div className="min-w-0">
          <p className="lx-vfy-card__title">{review.failure?.title ?? "VerifAI Review Failed"}</p>
          <p className="lx-vfy-card__subtitle">Document against checklist</p>
        </div>
      </div>
      <ReviewContextLine review={review} />
      <p className="lx-vfy-failure" role="alert">{review.failure?.message}</p>
      <StageList review={review} />
      {onStartNewReview ? (
        <div className="lx-vfy-row lx-vfy-row--buttons">
          <Button type="button" variant="secondary" size="sm" onClick={onStartNewReview} data-vfy-retry="">
            <RotateCcw size={14} aria-hidden /> Start a new review
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function CompleteBody({
  review,
  actions,
  defaultFindingsOpen = false,
}: {
  review: VerifaiReview;
  actions: VerifaiChatActions | null;
  defaultFindingsOpen?: boolean;
}) {
  const [findingsOpen, setFindingsOpen] = useState(defaultFindingsOpen);
  const listId = `${review.id}-findings`;
  return (
    <div className="lx-vfy-card__inner" data-vfy-state="complete">
      <div className="lx-vfy-card__head">
        <span className="lx-vfy-head-icon lx-vfy-head-icon--done" aria-hidden><CheckCircle2 size={20} /></span>
        <div className="min-w-0">
          <p className="lx-vfy-card__title">VerifAI Review Complete</p>
          <p className="lx-vfy-card__subtitle">Document against checklist</p>
        </div>
      </div>
      <ReviewContextLine review={review} />

      <ReviewMetrics review={review} />

      <p className="lx-vfy-summary">{reviewSummary(review)}</p>
      <p className="lx-vfy-text lx-vfy-text--muted">{reviewExplanation(review)}</p>

      <div className="lx-vfy-row lx-vfy-row--buttons">
        {review.findings.length > 0 ? (
          <Button type="button" variant="primary" size="sm" aria-expanded={findingsOpen} aria-controls={listId} onClick={() => setFindingsOpen((v) => !v)} data-vfy-review-findings="">
            <ListChecks size={14} aria-hidden /> {findingsOpen ? "Hide Findings" : "Review Findings"}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" size="sm" onClick={() => downloadReport(review)} data-vfy-export="">
          <Download size={14} aria-hidden /> Export
        </Button>
        {review.reportFindingIds.length ? (
          <span className="lx-vfy-hint">{review.reportFindingIds.length} added to report</span>
        ) : null}
      </div>

      {findingsOpen ? (
        <ul id={listId} className="lx-vfy-findings" aria-label="Review Findings">
          {review.findings.map((finding, index) => (
            <FindingCard
              key={finding.id}
              review={review}
              finding={finding}
              defaultOpen={index === 0}
              onAsk={actions ? () => actions.askAboutFinding(review, finding) : undefined}
            />
          ))}
        </ul>
      ) : null}

      <ActivitySection review={review} />

      {actions ? (
        <div className="lx-vfy-followups" aria-label="Ask about this review">
          <button type="button" className="lx-vfy-followup lx-vfy-followup--primary" onClick={() => actions.askAboutReview(review)} data-vfy-ask-review="">
            <MessageSquare size={12} aria-hidden />Ask about this review
          </button>
          {review.findings.length > 0 ? FOLLOW_UP_PROMPTS.map((prompt) => (
            <button key={prompt} type="button" className="lx-vfy-followup" onClick={() => actions.askFollowUp(review, prompt)} data-vfy-suggestion="">
              {prompt}
            </button>
          )) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The review card itself (running, failed or complete), shared by the Chat message and the
 * VerifAI Tool. Chat passes its actions; elsewhere follow-up controls are not shown.
 */
export function VerifaiReviewCard({
  review,
  actions = null,
  onStartNewReview,
  defaultFindingsOpen = false,
}: {
  review: VerifaiReview;
  actions?: VerifaiChatActions | null;
  onStartNewReview?: () => void;
  defaultFindingsOpen?: boolean;
}) {
  return (
    <div className="lx-vfy-card" data-vfy-status={review.status}>
      {review.status === "running" ? (
        <ProgressBody review={review} />
      ) : review.status === "failed" ? (
        <FailedBody review={review} onStartNewReview={onStartNewReview ?? (actions ? () => actions.startNewReview(review) : undefined)} />
      ) : (
        <>
          <CompleteBody review={review} actions={actions} defaultFindingsOpen={defaultFindingsOpen} />
          <ResponseActionsFooter content={`${reviewSummary(review)}\n\n${reviewExplanation(review)}`} variant="copy-only" />
        </>
      )}
    </div>
  );
}

export function VerifaiReviewMessage({ reviewId, timestamp }: { reviewId: string; timestamp?: string }) {
  const review = useVerifaiReview(reviewId);
  const actions = useContext(VerifaiChatActionsContext);
  return (
    <div className="flex items-start gap-3 min-w-0 max-w-full mb-7" data-vfy-review={reviewId}>
      <div className="flex-shrink-0 w-8 flex items-start justify-center"><LuxiaStarLogo size={24} /></div>
      <div className="flex-1 min-w-0 max-w-[760px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="luxia-type-body-dense font-bold" style={{ color: "var(--luxia-purple-70)" }}>Luxia</span>
          <span className="lx-vfy-tag">VerifAI</span>
          {timestamp ? <span className="luxia-type-caption" style={{ color: "var(--luxia-neutral-300)" }}>{timestamp}</span> : null}
        </div>
        {review ? (
          <VerifaiReviewCard review={review} actions={actions} />
        ) : (
          <div className="lx-vfy-card">
            <div className="lx-vfy-card__inner"><p className="lx-vfy-text lx-vfy-text--muted">This review is no longer available in this session.</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
