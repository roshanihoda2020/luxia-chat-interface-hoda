import { Check, FileText, ListChecks, Loader2, X } from "lucide-react";
import type { VerifaiReview, VerifaiStage } from "../types";
import "../verifai.css";

export function StageIcon({ status }: { status: VerifaiStage["status"] }) {
  if (status === "done") return <span className="lx-vfy-stage-icon" data-status="done"><Check size={12} strokeWidth={3} aria-hidden /></span>;
  if (status === "failed") return <span className="lx-vfy-stage-icon" data-status="failed"><X size={12} strokeWidth={3} aria-hidden /></span>;
  if (status === "active") return <span className="lx-vfy-stage-icon" data-status="active"><Loader2 size={13} className="lx-vfy-spin" aria-hidden /></span>;
  return <span className="lx-vfy-stage-icon" data-status="pending" aria-hidden />;
}

function stageStatusLabel(status: VerifaiStage["status"]) {
  return status === "done" ? "Completed" : status === "failed" ? "Failed" : status === "active" ? "In progress" : "Waiting";
}

/** Document · checklist · scope chips. */
export function ReviewContextLine({ review }: { review: VerifaiReview }) {
  return (
    <div className="lx-vfy-context">
      <span className="lx-vfy-chip" title={review.document.name}><FileText size={12} aria-hidden />{review.document.name}</span>
      <span className="lx-vfy-chip" title={review.checklist.name}><ListChecks size={12} aria-hidden />{review.checklist.name}</span>
      <span className="lx-vfy-chip lx-vfy-chip--scope" title={review.scope.constellationLabel}>
        {review.scope.kind === "galaxy" ? `Scope: ${review.scope.constellationLabel}` : review.scope.constellationLabel}
      </span>
    </div>
  );
}

/** The five review steps with their live status. */
export function StageList({ review }: { review: VerifaiReview }) {
  return (
    <ol className="lx-vfy-stages" aria-live="polite">
      {review.stages.map((stage, index) => (
        <li key={stage.id} className="lx-vfy-stage" data-status={stage.status}>
          <StageIcon status={stage.status} />
          <div className="min-w-0">
            <p className="lx-vfy-stage__label">
              <span className="sr-only">Step {index + 1}: </span>{stage.label}
              <span className="sr-only"> — {stageStatusLabel(stage.status)}</span>
            </p>
            {stage.status === "active" ? <p className="lx-vfy-stage__desc">{stage.description}</p> : null}
            {stage.status === "done" || stage.status === "failed" ? <p className="lx-vfy-stage__desc">{stage.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
