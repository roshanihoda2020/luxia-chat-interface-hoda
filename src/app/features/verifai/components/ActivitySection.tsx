import { useState } from "react";
import { BookOpenCheck, ChevronDown } from "lucide-react";
import { StageIcon } from "./ReviewParts";
import { formatClock } from "./reviewActions";
import type { VerifaiReview } from "../types";
import "../verifai.css";

/** "Review Activity & Transparency": the step timeline with times and durations. */
export function ActivitySection({ review }: { review: VerifaiReview }) {
  const [open, setOpen] = useState(false);
  const total = review.completedAt ? ((review.completedAt - review.startedAt) / 1000).toFixed(1) : null;
  const doneCount = review.stages.filter((s) => s.status === "done").length;
  const id = `${review.id}-activity`;
  return (
    <div className="lx-vfy-activity">
      <button type="button" className="lx-vfy-activity__toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        <BookOpenCheck size={15} aria-hidden />
        <span>Review Activity &amp; Transparency</span>
        {total ? <span className="lx-vfy-activity__meta">{doneCount} of 5 steps · {total} s</span> : null}
        <ChevronDown size={15} aria-hidden className="lx-vfy-chevron" data-open={open || undefined} />
      </button>
      {open ? (
        <ol id={id} className="lx-vfy-timeline">
          {review.stages.map((stage) => (
            <li key={stage.id} className="lx-vfy-timeline__item" data-status={stage.status}>
              <StageIcon status={stage.status} />
              <div className="min-w-0">
                <p className="lx-vfy-stage__label">{stage.label}</p>
                <p className="lx-vfy-stage__desc">{stage.description}</p>
                <p className="lx-vfy-stage__detail">{stage.detail}</p>
              </div>
              <div className="lx-vfy-timeline__time">
                <span>{formatClock(stage.finishedAt)}</span>
                {stage.startedAt && stage.finishedAt ? <span>{((stage.finishedAt - stage.startedAt) / 1000).toFixed(1)} s</span> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
