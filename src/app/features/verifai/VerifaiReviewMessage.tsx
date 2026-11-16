import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, BookOpenCheck, Check, CheckCircle2, ChevronDown, CircleHelp, Copy, Download, Eye,
  FileSearch, FileText, GitCompareArrows, Info, ListChecks, Loader2, MessageSquare, NotebookPen,
  RotateCcw, ScrollText, Sparkles, X, XCircle,
} from "lucide-react";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import { Button } from "@/app/components/ui/button";
import { ResponseActionsFooter } from "@/app/features/chat/ResponseActionsFooter";
import { VERIFAI_SEVERITY_LABEL } from "./mockData";
import { countBySeverity, toggleVerifaiReportFinding, useVerifaiReview } from "./verifaiStore";
import { reviewExplanation, reviewReportFileName, reviewReportMarkdown, reviewSummary } from "./reviewText";
import type { VerifaiFinding, VerifaiReview, VerifaiStage } from "./types";
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

function formatClock(ms?: number) {
  return ms ? new Date(ms).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
}

function copyText(text: string, label: string) {
  if (!navigator.clipboard) {
    toast.error("Couldn't copy to the clipboard. Select the text to copy it.");
    return;
  }
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Couldn't copy to the clipboard. Select the text to copy it."),
  );
}

function downloadReport(review: VerifaiReview) {
  const blob = new Blob([reviewReportMarkdown(review)], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = reviewReportFileName(review);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success("Report exported", { description: reviewReportFileName(review) });
}

function StageIcon({ status }: { status: VerifaiStage["status"] }) {
  if (status === "done") return <span className="lx-vfy-stage-icon" data-status="done"><Check size={12} strokeWidth={3} aria-hidden /></span>;
  if (status === "failed") return <span className="lx-vfy-stage-icon" data-status="failed"><X size={12} strokeWidth={3} aria-hidden /></span>;
  if (status === "active") return <span className="lx-vfy-stage-icon" data-status="active"><Loader2 size={13} className="lx-vfy-spin" aria-hidden /></span>;
  return <span className="lx-vfy-stage-icon" data-status="pending" aria-hidden />;
}

function stageStatusLabel(status: VerifaiStage["status"]) {
  return status === "done" ? "Completed" : status === "failed" ? "Failed" : status === "active" ? "In progress" : "Waiting";
}

function ReviewContextLine({ review }: { review: VerifaiReview }) {
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

function StageList({ review }: { review: VerifaiReview }) {
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

function FailedBody({ review, actions }: { review: VerifaiReview; actions: VerifaiChatActions | null }) {
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
      {actions ? (
        <div className="lx-vfy-row lx-vfy-row--buttons">
          <Button type="button" variant="secondary" size="sm" onClick={() => actions.startNewReview(review)} data-vfy-retry="">
            <RotateCcw size={14} aria-hidden /> Start a new review
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type FindingAction = "why" | "clause" | "compare" | "report";

function FindingCard({
  review,
  finding,
  defaultOpen,
  onAsk,
}: {
  review: VerifaiReview;
  finding: VerifaiFinding;
  defaultOpen: boolean;
  onAsk?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
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
    { id: "evidence", label: evidenceOpen ? "Hide Evidence" : "Show Evidence", icon: FileSearch, pressed: evidenceOpen, onClick: () => setEvidenceOpen((v) => !v) },
    { id: "clause", label: "Generate Clause", icon: Sparkles, pressed: action === "clause", onClick: () => toggleAction("clause") },
    { id: "compare", label: "Compare Requirement", icon: GitCompareArrows, pressed: action === "compare", onClick: () => toggleAction("compare") },
    { id: "report", label: inReport ? "Added to report" : "Add to report", icon: inReport ? Check : NotebookPen, pressed: inReport, onClick: handleReport },
  ];
  if (onAsk) actions.push({ id: "ask", label: "Ask Luxia", icon: MessageSquare, onClick: onAsk });

  return (
    <li className="lx-vfy-finding" data-severity={finding.severity} data-vfy-finding={finding.requirementId}>
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
            <div><dt>Evidence</dt><dd>{finding.evidence.section} · Page {finding.evidence.page}</dd></div>
            <div><dt>Suggested fix</dt><dd>{finding.suggestedFix}</dd></div>
          </dl>

          {evidenceOpen ? (
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

function ActivitySection({ review }: { review: VerifaiReview }) {
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

function CompleteBody({ review, actions }: { review: VerifaiReview; actions: VerifaiChatActions | null }) {
  const [findingsOpen, setFindingsOpen] = useState(false);
  const counts = countBySeverity(review.findings);
  const listId = `${review.id}-findings`;
  const metrics: Array<{ key: "major" | "minor" | "review"; icon: typeof AlertTriangle }> = [
    { key: "major", icon: AlertTriangle },
    { key: "minor", icon: Info },
    { key: "review", icon: Eye },
  ];
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

      <div className="lx-vfy-metrics" role="list" aria-label="Findings by severity">
        {metrics.map(({ key, icon: Icon }) => (
          <div key={key} role="listitem" className="lx-vfy-metric" data-severity={key} data-vfy-metric={key} data-empty={counts[key] === 0 || undefined}>
            <Icon size={14} aria-hidden />
            <span className="lx-vfy-metric__value">{counts[key]}</span>
            <span className="lx-vfy-metric__label">{VERIFAI_SEVERITY_LABEL[key]}</span>
          </div>
        ))}
      </div>

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
        <div className="lx-vfy-card" data-vfy-status={review?.status}>
          {!review ? (
            <div className="lx-vfy-card__inner"><p className="lx-vfy-text lx-vfy-text--muted">This review is no longer available in this session.</p></div>
          ) : review.status === "running" ? (
            <ProgressBody review={review} />
          ) : review.status === "failed" ? (
            <FailedBody review={review} actions={actions} />
          ) : (
            <>
              <CompleteBody review={review} actions={actions} />
              <ResponseActionsFooter content={`${reviewSummary(review)}\n\n${reviewExplanation(review)}`} variant="copy-only" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
