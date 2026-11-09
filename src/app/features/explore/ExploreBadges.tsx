import { FlaskConical } from "lucide-react";
import { EXPLORE_UPDATE_KIND_LABELS } from "./exploreFeed";
import type { ExploreAvailability, ExploreEntry, ExploreUpdate } from "./types";
import "./explore.css";

/** Marks internal illustration. Rendered on every Concept Demo entry, with no exceptions. */
export function ConceptDemoChip() {
  return (
    <span className="luxia-explore-chip luxia-explore-chip--concept" data-explore-concept="">
      <FlaskConical size={11} strokeWidth={2.25} aria-hidden />
      Concept Demo
    </span>
  );
}

export function ConceptLabel({ entry }: { entry: Pick<ExploreEntry, "publication"> }) {
  return entry.publication === "concept" ? <ConceptDemoChip /> : null;
}

export function NewChip() {
  return <span className="luxia-explore-chip luxia-explore-chip--new">New</span>;
}

export function KindChip({ kind }: { kind: ExploreUpdate["kind"] }) {
  return <span className="luxia-explore-chip">{EXPLORE_UPDATE_KIND_LABELS[kind]}</span>;
}

export const EXPLORE_AVAILABILITY_LABELS: Record<ExploreAvailability, string> = {
  available: "Available",
  "on-request": "Available on request",
  "coming-soon": "Coming soon",
};

export function AvailabilityBadge({ availability }: { availability: ExploreAvailability }) {
  return (
    <span className={`luxia-explore-chip luxia-explore-chip--${availability}`}>
      {availability === "available" ? <span className="luxia-explore-dot" aria-hidden /> : null}
      {EXPLORE_AVAILABILITY_LABELS[availability]}
    </span>
  );
}
