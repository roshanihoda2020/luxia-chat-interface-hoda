import { ChevronRight } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { StatusBadge } from "@/app/features/shared";
import { VERIFAI_SEVERITY_LABEL } from "../mockData";
import { countBySeverity } from "../verifaiStore";
import type { VerifaiReview } from "../types";

export function reviewStatusLabel(review: VerifaiReview) {
  return review.status === "running" ? "Running" : review.status === "complete" ? "Complete" : "Failed";
}

export function reviewOriginLabel(review: VerifaiReview, chatLabel: (chatId: string) => string | null) {
  if (review.origin === "tool") return "Tool";
  const label = review.chatId ? chatLabel(review.chatId) : null;
  return label ? `Chat · ${label}` : "Chat";
}

export function formatReviewDate(ms: number) {
  const date = new Date(ms);
  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

function findingsSummary(review: VerifaiReview) {
  if (review.status === "failed") return "Not assessed";
  const counts = countBySeverity(review.findings);
  const parts = (["major", "minor", "review"] as const)
    .filter((key) => counts[key] > 0)
    .map((key) => `${counts[key]} ${VERIFAI_SEVERITY_LABEL[key]}`);
  return parts.length ? parts.join(" · ") : "No findings";
}

function StatusCell({ review }: { review: VerifaiReview }) {
  const label = reviewStatusLabel(review);
  return (
    <StatusBadge
      tone={review.status === "complete" ? "success" : review.status === "failed" ? "error" : "info"}
      label={label}
      spinning={review.status === "running"}
    />
  );
}

function FindingsCell({ review }: { review: VerifaiReview }) {
  if (review.status === "running") {
    return (
      <div className="min-w-[7rem]" data-vfy-tool-progress={review.progress}>
        <span className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{review.progress}%</span>
        <div
          className="lx-vfy-bar"
          role="progressbar"
          aria-label={`Verification progress for ${review.document.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={review.progress}
        >
          <span style={{ width: `${review.progress}%` }} />
        </div>
      </div>
    );
  }
  return (
    <span className="luxia-type-body-dense" style={{ color: review.status === "failed" ? "var(--luxia-text-muted)" : "var(--luxia-text-primary)" }}>
      {findingsSummary(review)}
    </span>
  );
}

function DemoBadge() {
  return (
    <Badge
      variant="outline"
      className="min-h-0 h-auto shrink-0 px-1.5 py-0 luxia-type-caption font-normal"
      style={{ color: "var(--luxia-text-secondary)", borderColor: "var(--luxia-border-subtle)" }}
    >
      Demo
    </Badge>
  );
}

/**
 * Reviews of the selected Constellation. Desktop: a table; narrow screens: stacked rows.
 * Every row opens the review (same review id as in Chat).
 */
export function ReviewsList({
  reviews,
  chatLabel,
  onOpenReview,
}: {
  reviews: VerifaiReview[];
  chatLabel: (chatId: string) => string | null;
  onOpenReview: (reviewId: string) => void;
}) {
  return (
    <>
      <div className="hidden md:block" data-vfy-tool-table="">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target document</TableHead>
              <TableHead>Checklist</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Findings</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow
                key={review.id}
                className="cursor-pointer"
                data-vfy-tool-review={review.id}
                onClick={() => onOpenReview(review.id)}
              >
                <TableCell className="max-w-[18rem]">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      className="min-w-0 truncate text-left luxia-type-body-dense font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                      style={{ color: "var(--luxia-text-link, var(--luxia-purple-70))" }}
                      title={review.document.name}
                      onClick={(event) => { event.stopPropagation(); onOpenReview(review.id); }}
                    >
                      {review.document.name}
                    </button>
                    {review.isDemo ? <DemoBadge /> : null}
                  </div>
                </TableCell>
                <TableCell className="max-w-[14rem]">
                  <span className="block truncate luxia-type-body-dense" title={review.checklist.name} style={{ color: "var(--luxia-text-secondary)" }}>
                    {review.checklist.name}
                  </span>
                </TableCell>
                <TableCell><StatusCell review={review} /></TableCell>
                <TableCell><FindingsCell review={review} /></TableCell>
                <TableCell className="max-w-[12rem]">
                  <span className="block truncate luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                    {reviewOriginLabel(review, chatLabel)}
                  </span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                  {formatReviewDate(review.startedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden" aria-label="Reviews" data-vfy-tool-stack="">
        {reviews.map((review) => (
          <li key={review.id}>
            <button
              type="button"
              className="flex w-full min-w-0 items-start gap-3 rounded-[12px] border px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
              style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface, #fff)" }}
              data-vfy-tool-review={review.id}
              onClick={() => onOpenReview(review.id)}
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate luxia-type-body-dense font-medium" style={{ color: "var(--luxia-text-primary)" }}>
                    {review.document.name}
                  </span>
                  {review.isDemo ? <DemoBadge /> : null}
                </div>
                <p className="truncate luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{review.checklist.name}</p>
                <div className="flex flex-wrap items-center gap-2"><StatusCell review={review} /><FindingsCell review={review} /></div>
                <p className="truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                  {reviewOriginLabel(review, chatLabel)} · {formatReviewDate(review.startedAt)}
                </p>
              </div>
              <ChevronRight size={16} aria-hidden className="mt-1 shrink-0" style={{ color: "var(--luxia-text-muted)" }} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
