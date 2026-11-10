import { createElement, useId, useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, Undo2, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
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
import { EXPLORE_UPDATE_KIND_LABELS, formatExploreDate, sessionRelevantNotice } from "./exploreFeed";
import type { ExploreUpdate } from "./types";
import { useExploreFeed } from "./useExploreFeed";

/**
 * One-line What's New notice on Home, between Global Search and the tiles.
 * Shown only for a recent update that is relevant to this user (decided by the
 * caller) and that they haven't read or dismissed: one at a time, never while
 * customizing. Expanded, it shows the update with its own action and Read more
 * (which opens it in Explore Luxia and marks it read). × hides it for this page
 * session; the update stays in What's New. Renders nothing (no gap) when there
 * is nothing to show.
 */
export function WhatsNewNotice({
  userId,
  onOpenUpdate,
  isRelevant = () => true,
  actionFor,
  illustration,
}: {
  userId: string;
  onOpenUpdate: (updateId: string) => void;
  /** Whether an update concerns something this user can use on Home's side of Luxia. */
  isRelevant?: (update: ExploreUpdate) => boolean;
  /** The update's own action, when the user can take it here (e.g. Open Data Sources). */
  actionFor?: (update: ExploreUpdate) => (() => void) | undefined;
  /** A small picture of what the update is about, shown when expanded. */
  illustration?: (update: ExploreUpdate) => ReactNode;
}) {
  const { updates, state } = useExploreFeed(userId);
  // Collapsed by default; expanding is local to this view (a refresh starts collapsed again).
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const update = sessionRelevantNotice(getSessionNoticeId(userId), updates, state, isRelevant);
  if (update) setSessionNoticeId(userId, update.id);
  if (!update) return null;
  const runAction = actionFor?.(update);
  const picture = illustration?.(update);

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
      {/* Expanded details, inline (no overlay): a picture, what changed, its action and Read more. */}
      <div id={detailsId} className="luxia-explore-notice-details" hidden={!expanded} data-explore-notice-details="">
        <div
          className="flex min-w-0 flex-col gap-3 border-t px-3.5 pb-3 pt-3 sm:flex-row sm:items-center sm:gap-4"
          style={{ borderColor: "var(--luxia-opacity-brand-secondary-24)" }}
        >
          {picture ? <div className="shrink-0" data-explore-notice-picture="">{picture}</div> : null}
          <div className="min-w-0 flex-1">
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
              {`${EXPLORE_UPDATE_KIND_LABELS[update.kind]} · ${update.area} · ${formatExploreDate(update.date)}`}
            </p>
            <p className="mt-1 line-clamp-3 max-w-[90ch] luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
              {update.body[0] ?? update.summary}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {runAction && update.action ? (
                <Button type="button" variant="primary" size="compact" onClick={runAction} data-explore-notice-action="">
                  {update.action.label}
                </Button>
              ) : null}
              <a
                href={getExplorePath("whats-new", update.id)}
                className="luxia-explore-notice-link -ml-1.5 inline-flex items-center gap-1"
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
      </div>
    </div>
  );
}
