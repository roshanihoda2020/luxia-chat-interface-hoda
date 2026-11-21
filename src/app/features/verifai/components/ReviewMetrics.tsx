import { AlertTriangle, Eye, Info } from "lucide-react";
import { VERIFAI_SEVERITY_LABEL } from "../mockData";
import { countBySeverity } from "../verifaiStore";
import type { VerifaiReview } from "../types";
import "../verifai.css";

const METRICS: Array<{ key: "major" | "minor" | "review"; icon: typeof AlertTriangle }> = [
  { key: "major", icon: AlertTriangle },
  { key: "minor", icon: Info },
  { key: "review", icon: Eye },
];

/** Major / Minor / Need Review counts. */
export function ReviewMetrics({ review }: { review: VerifaiReview }) {
  const counts = countBySeverity(review.findings);
  return (
    <div className="lx-vfy-metrics" role="list" aria-label="Findings by severity">
      {METRICS.map(({ key, icon: Icon }) => (
        <div key={key} role="listitem" className="lx-vfy-metric" data-severity={key} data-vfy-metric={key} data-empty={counts[key] === 0 || undefined}>
          <Icon size={14} aria-hidden />
          <span className="lx-vfy-metric__value">{counts[key]}</span>
          <span className="lx-vfy-metric__label">{VERIFAI_SEVERITY_LABEL[key]}</span>
        </div>
      ))}
    </div>
  );
}
