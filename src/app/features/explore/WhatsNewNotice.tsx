import { createElement, useId, useState } from "react";
import { ArrowRight, ChevronDown, Undo2, X } from "lucide-react";
import { getExplorePath } from "@/app/features/project/projectPaths";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { ConceptLabel, NewChip } from "./ExploreBadges";
import {
  dismissExploreEntry,
  getSessionNoticeId,
  restoreExploreEntry,
  setExplorePreference,
  setSessionNoticeId,
} from "./exploreState";
import { EXPLORE_UPDATE_KIND_LABELS, sessionNoticeUpdate } from "./exploreFeed";
import { useExploreFeed } from "./useExploreFeed";

/**
 * One-line What's New notice on Home, between Global Search and the tiles.
 * Shown only for an important (product-approved, proactive) update the user
 * hasn't read or dismissed, one at a time, and never while customizing.
 * Read more goes to the update's page in Explore Luxia (which marks it read).
 * × hides it for this page session only: it never marks it read, the update
 * stays in What's New, and after a reload the notice may show again while it
 * is unread. Renders nothing (no gap) when there is nothing to show.
 */
export function WhatsNewNotice({ userId, onOpenUpdate }: { userId: string; onOpenUpdate: (updateId: string) => void }) {
  const { notice, updates, state } = useExploreFeed(userId);
  // Collapsed by default; expanding is local to this view (a refresh starts collapsed again).
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  if (notice) setSessionNoticeId(userId, notice.id);
  const update = sessionNoticeUpdate(getSessionNoticeId(userId), updates, state);
  if (!update) return null;

  function dismiss() {
    if (!update) return;
    dismissExploreEntry(userId, update);
    const toastId = `explore-dismiss-${update.id}`;
    luxiaToast.info({
      id: toastId,
      title: "Notice hidden",
      description: (
        <span>
          The update stays in Explore Luxia › What's New.{" "}
          <button
            type="button"
            className="luxia-explore-toast-link"
            onClick={() => {
              setExplorePreference(userId, "hideHomeNotices", true);
              luxiaToast.dismiss(toastId);
            }}
          >
            Turn off update notices on Home
          </button>
        </span>
      ),
      duration: 8000,
      position: "bottom-right",
      className: "luxia-home-undo-toast",
      icon: createElement(Undo2, { size: 16, strokeWidth: 2.25, "aria-hidden": true }),
      action: { label: "Undo", onClick: () => restoreExploreEntry(userId, update) },
    });
  }

  return (
    <div
      role="status"
      aria-label="Product update"
      className="luxia-explore-notice mb-5 min-w-0 rounded-[var(--luxia-radius-12)] border"
      data-explore-notice={update.id}
      data-expanded={expanded ? "" : undefined}
    >
      {/* Collapsed row (always shown): New · title · summary · expand · close. */}
      <div className="flex min-w-0 items-center gap-2.5 py-1.5 pl-3.5 pr-1.5">
        <span className="flex shrink-0 items-center gap-1.5">
          <NewChip />
          <ConceptLabel entry={update} />
        </span>
        <p className="min-w-0 flex-1 truncate luxia-type-body-dense max-sm:whitespace-normal" style={{ color: "var(--luxia-text-secondary)" }} title={`${update.title} · ${update.summary}`}>
          <span className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{update.title}</span>
          {!expanded ? <span className="max-sm:hidden">{` · ${update.summary}`}</span> : null}
        </p>
        <span className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="luxia-explore-notice-icon"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={expanded ? "Collapse update details" : "Expand update details"}
            title={expanded ? "Collapse" : "Expand"}
            data-explore-notice-toggle=""
          >
            <ChevronDown size={16} strokeWidth={2} aria-hidden className="luxia-explore-notice-chevron" />
          </button>
          <button
            type="button"
            className="luxia-explore-notice-icon"
            onClick={dismiss}
            aria-label="Dismiss update from Home"
            title="Dismiss"
            data-explore-notice-dismiss=""
          >
            <X size={15} strokeWidth={2} aria-hidden />
          </button>
        </span>
      </div>
      {/* Expanded details, inline (no overlay): category, a short description and Read more. */}
      <div id={detailsId} className="luxia-explore-notice-details" hidden={!expanded} data-explore-notice-details="">
        <div className="border-t px-3.5 pb-3 pt-2.5" style={{ borderColor: "var(--luxia-opacity-brand-secondary-24)" }}>
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            {`${EXPLORE_UPDATE_KIND_LABELS[update.kind]} · ${update.area}`}
          </p>
          <p className="mt-1 line-clamp-3 max-w-[90ch] luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
            {update.body[0] ?? update.summary}
          </p>
          <a
            href={getExplorePath("whats-new", update.id)}
            className="luxia-explore-notice-link mt-1.5 -ml-1.5 inline-flex items-center gap-1"
            onClick={(event) => {
              event.preventDefault();
              onOpenUpdate(update.id);
            }}
            aria-label={`Read more: ${update.title}`}
          >
            Read more
            <ArrowRight size={13} strokeWidth={2.25} aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}
