import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { VERIFAI_SEVERITY_LABEL } from "../../mockData";
import { reviewExplanation, reviewSummary } from "../../reviewText";
import { ActivitySection } from "../../components/ActivitySection";
import { FindingCard } from "../../components/FindingCard";
import { ReviewMetrics } from "../../components/ReviewMetrics";
import type { VerifaiFindingStatus, VerifaiReview, VerifaiSeverity } from "../../types";

type SeverityFilter = "all" | VerifaiSeverity;
type StatusFilter = "all" | VerifaiFindingStatus;

const SEVERITY_FILTERS: Array<{ id: SeverityFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "major", label: VERIFAI_SEVERITY_LABEL.major },
  { id: "minor", label: VERIFAI_SEVERITY_LABEL.minor },
  { id: "review", label: VERIFAI_SEVERITY_LABEL.review },
];
const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Any status" },
  { id: "Not met", label: "Not met" },
  { id: "Partially met", label: "Partially met" },
  { id: "Unclear", label: "Unclear" },
];

/** Centre panel: summary, severity metrics and the findings (shared FindingCard), synced with selection. */
export const FindingsPanel = forwardRef<HTMLHeadingElement, {
  review: VerifaiReview;
  selectedId: string | null;
  onSelect: (requirementId: string) => void;
  /** The Evidence panel is visible beside the findings (three- and two-panel layouts). */
  evidenceInPanel: boolean;
}>(function FindingsPanel({ review, selectedId, onSelect, evidenceInPanel }, headingRef) {
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => (review.findings[0] ? { [review.findings[0].id]: true } : {}));
  const listRef = useRef<HTMLUListElement>(null);

  const findings = useMemo(
    () => review.findings.filter((f) => (severity === "all" || f.severity === severity) && (status === "all" || f.status === status)),
    [review, severity, status],
  );

  // A requirement selected elsewhere opens its finding here and brings it into view.
  useEffect(() => {
    const finding = review.findings.find((f) => f.requirementId === selectedId);
    if (!finding) return;
    setExpanded((e) => (e[finding.id] ? e : { ...e, [finding.id]: true }));
    window.requestAnimationFrame(() => {
      listRef.current?.querySelector(`[data-vfy-finding="${CSS.escape(finding.requirementId)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, [selectedId, review]);

  // Interacting with a finding selects its requirement in the other panels.
  function selectFromEvent(event: { target: EventTarget | null }) {
    const id = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-vfy-finding]")?.dataset.vfyFinding;
    if (id && id !== selectedId) onSelect(id);
  }

  return (
    <section className="lx-vws-panel lx-vws-findings" aria-labelledby="lx-vws-findings-title" data-vfy-findings-panel="">
      <div className="lx-vws-panel__scroll lx-vws-panel__scroll--findings">
        <h2 id="lx-vws-findings-title" ref={headingRef} tabIndex={-1} className="lx-vws-panel__title lx-vws-panel__title--lg">Review Findings</h2>
        <ReviewMetrics review={review} />
        <p className="lx-vfy-summary">{reviewSummary(review)}</p>
        <p className="lx-vfy-text lx-vfy-text--muted">{reviewExplanation(review)}</p>

        {review.findings.length ? (
          <>
            <div className="lx-vws-filters">
              <div className="lx-vws-chips" role="group" aria-label="Severity">
                {SEVERITY_FILTERS.map((f) => (
                  <button key={f.id} type="button" className="lx-vws-chip" aria-pressed={severity === f.id} onClick={() => setSeverity(f.id)}>{f.label}</button>
                ))}
              </div>
              <div className="lx-vws-chips" role="group" aria-label="Status">
                {STATUS_FILTERS.map((f) => (
                  <button key={f.id} type="button" className="lx-vws-chip" aria-pressed={status === f.id} onClick={() => setStatus(f.id)}>{f.label}</button>
                ))}
              </div>
            </div>
            {findings.length ? (
              <ul
                ref={listRef}
                className="lx-vfy-findings"
                aria-label="Review Findings"
                onClickCapture={selectFromEvent}
                onFocusCapture={selectFromEvent}
              >
                {findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    review={review}
                    finding={finding}
                    defaultOpen={false}
                    expanded={Boolean(expanded[finding.id])}
                    onExpandedChange={(open) => setExpanded((e) => ({ ...e, [finding.id]: open }))}
                    selected={selectedId === finding.requirementId}
                    evidenceInPanel={evidenceInPanel}
                  />
                ))}
              </ul>
            ) : (
              <p className="lx-vws-empty">No findings match these filters.</p>
            )}
          </>
        ) : (
          <p className="lx-vws-empty">Every requirement in this checklist was met. There is nothing to fix.</p>
        )}

        <ActivitySection review={review} />
      </div>
    </section>
  );
});
