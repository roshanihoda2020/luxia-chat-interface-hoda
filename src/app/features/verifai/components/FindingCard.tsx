import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check, ChevronDown, CircleHelp, Copy, FileSearch, GitCompareArrows, Loader2, MessageSquare, NotebookPen,
  ScrollText, Sparkles,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { VERIFAI_SEVERITY_LABEL } from "../mockData";
import { toggleVerifaiReportFinding } from "../verifaiStore";
import { copyText } from "./reviewActions";
import type { VerifaiFinding, VerifaiReview } from "../types";
import "../verifai.css";

type FindingAction = "why" | "clause" | "compare" | "report";

/**
 * One finding: requirement, evidence, suggested fix and its actions (Why?, Evidence, Generate
 * Clause, Compare Requirement, Add to report, and Ask Luxia when `onAsk` is given).
 */
export function FindingCard({
  review,
  finding,
  defaultOpen,
  onAsk,
  expanded,
  onExpandedChange,
  selected,
  evidenceInPanel = false,
}: {
  review: VerifaiReview;
  finding: VerifaiFinding;
  defaultOpen: boolean;
  onAsk?: () => void;
  /** Controlled expansion (Tool workspace); Chat leaves it uncontrolled. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Highlights the finding selected in the Tool workspace. */
  selected?: boolean;
  /**
   * Tool workspace only, when the Evidence panel is shown beside the findings: that panel owns the
   * evidence quote, location and suggested fix, so the card leaves them out. Chat never sets it.
   */
  evidenceInPanel?: boolean;
}) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = expanded ?? ownOpen;
  const setOpen = (next: boolean | ((value: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(open) : next;
    if (expanded === undefined) setOwnOpen(value);
    onExpandedChange?.(value);
  };
  const [action, setAction] = useState<FindingAction | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [clauseState, setClauseState] = useState<"idle" | "generating" | "ready">("idle");
  const evidenceRef = useRef<HTMLDivElement>(null);
  const inReport = review.reportFindingIds.includes(finding.id);
  const bodyId = `${review.id}-${finding.id}-body`;

  useEffect(() => {
    if (evidenceOpen) evidenceRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [evidenceOpen]);

  function toggleAction(next: FindingAction) {
    setAction((current) => (current === next ? null : next));
    if (next === "clause" && clauseState === "idle") {
      setClauseState("generating");
      window.setTimeout(() => setClauseState("ready"), 900);
    }
  }

  function handleReport() {
    toggleVerifaiReportFinding(review.id, finding.id);
    setAction("report");
    toast.success(inReport ? "Removed from report" : "Added to report", { description: `${finding.requirementId} · ${finding.title}` });
  }

  const actions: Array<{ id: string; label: string; icon: typeof CircleHelp; pressed?: boolean; onClick: () => void }> = [
    { id: "why", label: "Why?", icon: CircleHelp, pressed: action === "why", onClick: () => toggleAction("why") },
    ...(evidenceInPanel
      ? []
      : [{ id: "evidence", label: evidenceOpen ? "Hide Evidence" : "Show Evidence", icon: FileSearch, pressed: evidenceOpen, onClick: () => setEvidenceOpen((v) => !v) }]),
    { id: "clause", label: "Generate Clause", icon: Sparkles, pressed: action === "clause", onClick: () => toggleAction("clause") },
    { id: "compare", label: "Compare Requirement", icon: GitCompareArrows, pressed: action === "compare", onClick: () => toggleAction("compare") },
    { id: "report", label: inReport ? "Added to report" : "Add to report", icon: inReport ? Check : NotebookPen, pressed: inReport, onClick: handleReport },
  ];
  if (onAsk) actions.push({ id: "ask", label: "Ask Luxia", icon: MessageSquare, onClick: onAsk });

  return (
    <li className="lx-vfy-finding" data-severity={finding.severity} data-vfy-finding={finding.requirementId} data-selected={selected || undefined}>
      <button type="button" className="lx-vfy-finding__toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((v) => !v)}>
        <span className="lx-vfy-sev" data-severity={finding.severity}>{VERIFAI_SEVERITY_LABEL[finding.severity]}</span>
        <span className="lx-vfy-finding__status">{finding.status}</span>
        <span className="lx-vfy-req-id">{finding.requirementId}</span>
        <span className="lx-vfy-finding__title">{finding.title}</span>
        <ChevronDown size={16} aria-hidden className="lx-vfy-chevron" data-open={open || undefined} />
      </button>
      {open ? (
        <div id={bodyId} className="lx-vfy-finding__body">
          <p className="lx-vfy-text">{finding.description}</p>
          <dl className="lx-vfy-facts">
            <div><dt>Requirement</dt><dd><span className="lx-vfy-req-id">{finding.requirementId}</span> {finding.requirement}</dd></div>
            {evidenceInPanel ? null : (
              <>
                <div><dt>Evidence</dt><dd>{finding.evidence.section} · Page {finding.evidence.page}</dd></div>
                <div><dt>Suggested fix</dt><dd>{finding.suggestedFix}</dd></div>
              </>
            )}
          </dl>

          {evidenceOpen && !evidenceInPanel ? (
            <div ref={evidenceRef} className="lx-vfy-evidence" data-vfy-panel="evidence">
              <div className="lx-vfy-evidence__head">
                <FileSearch size={14} aria-hidden />
                <span>Evidence · {review.document.name}</span>
                <span className="lx-vfy-evidence__loc">Page {finding.evidence.page} · {finding.evidence.section}</span>
              </div>
              <blockquote className="lx-vfy-evidence__quote">“{finding.evidence.quote}”</blockquote>
              <p className="lx-vfy-evidence__note">
                {review.document.origin === "upload" ? "Simulated excerpt for an uploaded file. " : ""}Confirmed against the source text.
              </p>
            </div>
          ) : null}

          <div className="lx-vfy-actions" role="group" aria-label={`Actions for ${finding.requirementId}`}>
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  type="button"
                  className="lx-vfy-action"
                  aria-pressed={a.id === "ask" ? undefined : Boolean(a.pressed)}
                  data-vfy-action={a.id}
                  onClick={a.onClick}
                >
                  <Icon size={13} aria-hidden />{a.label}
                </button>
              );
            })}
          </div>

          {action === "why" ? (
            <div className="lx-vfy-result" data-vfy-panel="why">
              <p className="lx-vfy-result__title"><CircleHelp size={13} aria-hidden /> Why this is {finding.severity === "review" ? "marked Need Review" : `a ${VERIFAI_SEVERITY_LABEL[finding.severity].toLowerCase()} finding`}</p>
              <p className="lx-vfy-text">{finding.why}</p>
            </div>
          ) : null}
          {action === "clause" ? (
            <div className="lx-vfy-result" data-vfy-panel="clause">
              <p className="lx-vfy-result__title"><Sparkles size={13} aria-hidden /> Suggested clause</p>
              {clauseState === "generating" ? (
                <p className="lx-vfy-status" role="status"><Loader2 size={14} className="lx-vfy-spin" aria-hidden /> Drafting clause…</p>
              ) : (
                <>
                  <p className="lx-vfy-clause">{finding.clause}</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => copyText(finding.clause, "Clause")}>
                    <Copy size={13} aria-hidden /> Copy clause
                  </Button>
                </>
              )}
            </div>
          ) : null}
          {action === "compare" ? (
            <div className="lx-vfy-result" data-vfy-panel="compare">
              <p className="lx-vfy-result__title"><GitCompareArrows size={13} aria-hidden /> Requirement vs document</p>
              <div className="lx-vfy-compare">
                <div><span>Checklist requires</span><p>{finding.comparison.requirement}</p></div>
                <div><span>Document says</span><p>{finding.comparison.document}</p></div>
                <div data-gap=""><span>Gap</span><p>{finding.comparison.gap}</p></div>
              </div>
            </div>
          ) : null}
          {action === "report" ? (
            <div className="lx-vfy-result" data-vfy-panel="report">
              <p className="lx-vfy-result__title"><ScrollText size={13} aria-hidden /> {inReport ? "Added to report" : "Removed from report"}</p>
              <p className="lx-vfy-text">{finding.reportSection}</p>
              <p className="lx-vfy-hint">{review.reportFindingIds.length} section{review.reportFindingIds.length === 1 ? "" : "s"} included in the export.</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
