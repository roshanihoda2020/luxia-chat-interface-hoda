import { ExternalLink } from "lucide-react";
import { LX } from "@/app/features/active-data-tables/tokens";
import type { GalaxyRoutingMeta } from "./constants";

export function GalaxyProvenanceRow({
  meta,
  onViewActivity,
  onOpenConstellation,
}: {
  meta: GalaxyRoutingMeta;
  onViewActivity?: () => void;
  onOpenConstellation?: () => void;
}) {
  if (meta.phase !== "complete") {
    const status =
      meta.phase === "searching"
        ? `Searching ${meta.projectName}…`
        : meta.phase === "finding"
          ? "Finding the most relevant constellation…"
          : meta.phase === "matched"
            ? `Matched ${meta.matched.label} · ${meta.matched.type}`
            : `Answering from ${meta.matched.label}`;

    return (
      <div className="mb-3">
        <p className="sr-only" aria-live="polite">{status}</p>
        <p className="luxia-type-caption" style={{ color: LX.textMuted }}>
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full motion-safe:animate-pulse align-middle"
            style={{ background: LX.secondary }}
          />
          {status}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 pt-3.5" style={{ borderTop: `1px solid ${LX.borderSubtle}` }}>
      <p className="luxia-type-caption" style={{ color: LX.textMuted }}>
        Answered from{" "}
        <span style={{ color: LX.primary, fontWeight: 600 }}>
          {meta.matched.label} · {meta.matched.type}
        </span>
      </p>
      {onViewActivity ? (
        <button
          type="button"
          onClick={onViewActivity}
          className="luxia-type-caption outline-none transition-opacity hover:opacity-80"
          style={{ color: LX.secondary }}
        >
          View activity
        </button>
      ) : null}
      {onOpenConstellation ? (
        <button
          type="button"
          onClick={onOpenConstellation}
          className="inline-flex items-center gap-1 luxia-type-caption outline-none transition-opacity hover:opacity-80"
          style={{ color: LX.secondary }}
        >
          <ExternalLink size={11} />
          Open constellation
        </button>
      ) : null}
    </div>
  );
}
