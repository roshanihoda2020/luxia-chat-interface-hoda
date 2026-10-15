import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { MessageSquare } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import {
  listCommentAnchors,
  type DocumentComment,
} from "./documentAnnotations";

const BADGE_SIZE = 26;
const CLUSTER_GAP_PX = 22;
const STACK_OFFSET_PX = 18;

type BadgeLayout = {
  id: string;
  body: string;
  top: number;
  stackIndex: number;
  clusterIds: string[];
};

type CommentMarginBadgesProps = {
  editorRoot: HTMLDivElement | null;
  canvasRef: RefObject<HTMLDivElement | null>;
  scrollParentRef: RefObject<HTMLDivElement | null>;
  comments: Record<string, DocumentComment>;
  activeCommentId: string | null;
  onOpenComment: (commentId: string) => void;
  onCloseComment: () => void;
  onEditComment: (comment: DocumentComment) => void;
  onDeleteComment: (commentId: string) => void;
  layoutEpoch: number;
};

function computeBadgeLayouts(editorRoot: HTMLDivElement, canvas: HTMLDivElement): BadgeLayout[] {
  const canvasRect = canvas.getBoundingClientRect();
  const anchors = listCommentAnchors(editorRoot);
  if (anchors.length === 0) return [];

  const raw = anchors.map((anchor) => {
    const rect = anchor.element.getBoundingClientRect();
    return {
      id: anchor.id,
      body: anchor.body,
      top: Math.max(0, rect.top - canvasRect.top),
    };
  });

  raw.sort((a, b) => a.top - b.top || a.id.localeCompare(b.id));

  const layouts: BadgeLayout[] = [];
  let cluster: typeof raw = [];

  const flushCluster = () => {
    if (cluster.length === 0) return;
    if (cluster.length === 1) {
      layouts.push({
        ...cluster[0],
        stackIndex: 0,
        clusterIds: [cluster[0].id],
      });
    } else {
      const head = cluster[0];
      layouts.push({
        id: head.id,
        body: head.body,
        top: head.top,
        stackIndex: 0,
        clusterIds: cluster.map((c) => c.id),
      });
      for (let i = 1; i < Math.min(cluster.length, 3); i += 1) {
        layouts.push({
          id: cluster[i].id,
          body: cluster[i].body,
          top: head.top + i * STACK_OFFSET_PX,
          stackIndex: i,
          clusterIds: [cluster[i].id],
        });
      }
    }
    cluster = [];
  };

  for (const item of raw) {
    if (cluster.length === 0) {
      cluster.push(item);
      continue;
    }
    const last = cluster[cluster.length - 1];
    if (item.top - last.top < CLUSTER_GAP_PX) {
      cluster.push(item);
    } else {
      flushCluster();
      cluster.push(item);
    }
  }
  flushCluster();
  return layouts;
}

export function CommentMarginBadges({
  editorRoot,
  canvasRef,
  scrollParentRef,
  comments,
  activeCommentId,
  onOpenComment,
  onCloseComment,
  onEditComment,
  onDeleteComment,
  layoutEpoch,
}: CommentMarginBadgesProps) {
  const [layouts, setLayouts] = useState<BadgeLayout[]>([]);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const measureRaf = useRef(0);

  const remeasure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!editorRoot || !canvas) {
      setLayouts([]);
      return;
    }
    setLayouts(computeBadgeLayouts(editorRoot, canvas));
  }, [canvasRef, editorRoot]);

  const scheduleRemeasure = useCallback(() => {
    cancelAnimationFrame(measureRaf.current);
    measureRaf.current = requestAnimationFrame(remeasure);
  }, [remeasure]);

  useLayoutEffect(() => {
    scheduleRemeasure();
  }, [scheduleRemeasure, layoutEpoch, comments, activeCommentId]);

  useEffect(() => {
    const scrollParent = scrollParentRef.current;
    const canvas = canvasRef.current;
    const onScrollOrResize = () => scheduleRemeasure();
    scrollParent?.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(onScrollOrResize)
      : null;
    if (canvas && ro) ro.observe(canvas);
    if (editorRoot && ro) ro.observe(editorRoot);

    return () => {
      scrollParent?.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      ro?.disconnect();
      cancelAnimationFrame(measureRaf.current);
    };
  }, [canvasRef, editorRoot, scheduleRemeasure, scrollParentRef]);

  useEffect(() => {
    if (!activeCommentId) {
      setEditing(false);
      setDraft("");
      return;
    }
    const comment = comments[activeCommentId];
    setDraft(comment?.body ?? "");
    setEditing(false);
  }, [activeCommentId, comments]);

  if (layouts.length === 0) return null;

  const activeComment = activeCommentId ? comments[activeCommentId] ?? null : null;

  return (
    <div
      className="wa-comment-gutter pointer-events-none absolute inset-y-0 right-0 z-[2] w-8 sm:w-9"
      aria-label="Document comments"
    >
      {layouts.map((badge) => {
        const isClusterHead = badge.clusterIds.length > 1 && badge.stackIndex === 0;
        const count = badge.clusterIds.length;
        const popoverOpen = Boolean(
          activeComment
          && activeCommentId
          && (
            activeCommentId === badge.id
            || (isClusterHead && badge.clusterIds.includes(activeCommentId))
          )
          && badge.stackIndex === 0,
        );
        // Non-head stacked badges also open their own popover when selected.
        const stackedOpen = Boolean(
          activeComment
          && activeCommentId === badge.id
          && badge.stackIndex > 0,
        );
        const open = popoverOpen || stackedOpen;

        return (
          <Popover
            key={`${badge.id}-${badge.stackIndex}`}
            open={open}
            onOpenChange={(next) => {
              if (!next) {
                onCloseComment();
                setEditing(false);
              }
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "pointer-events-auto absolute flex items-center justify-center rounded-[5px] border shadow-[0_1px_4px_rgba(15,23,42,0.1)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-brand-primary)] focus-visible:ring-offset-1",
                      open && "ring-1 ring-[var(--luxia-blue-50,#3BA8D9)]",
                    )}
                    style={{
                      top: badge.top,
                      right: 2 + badge.stackIndex * 2,
                      width: BADGE_SIZE,
                      height: BADGE_SIZE,
                      zIndex: 4 - badge.stackIndex,
                      color: "var(--luxia-blue-60, #1F8FBF)",
                      background: open
                        ? "color-mix(in srgb, var(--luxia-blue-50, #3BA8D9) 14%, white)"
                        : "var(--luxia-surface, #fff)",
                      borderColor:
                        "color-mix(in srgb, var(--luxia-blue-50, #3BA8D9) 45%, var(--luxia-border-default))",
                    }}
                    aria-label={isClusterHead ? `View ${count} comments` : "View comment"}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => {
                      onOpenComment(
                        isClusterHead ? badge.clusterIds[0] : badge.id,
                      );
                    }}
                  >
                    <MessageSquare size={12} strokeWidth={1.75} aria-hidden />
                    {isClusterHead ? (
                      <span
                        className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[9px] font-semibold leading-none text-white"
                        style={{ background: "var(--luxia-blue-60, #1F8FBF)" }}
                        aria-hidden
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="left">View comment</TooltipContent>
            </Tooltip>

            {open && activeComment ? (
              <PopoverContent
                side="left"
                align="start"
                sideOffset={8}
                className="w-[16.5rem] p-3"
                onOpenAutoFocus={(event) => event.preventDefault()}
              >
                <p
                  className="luxia-type-caption mb-1.5 font-semibold"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Comment
                </p>
                {editing ? (
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-[8px] border bg-white px-2.5 py-2 luxia-type-body-dense outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-brand-primary)]"
                    style={{ borderColor: "var(--luxia-border-default)" }}
                    aria-label="Edit comment"
                  />
                ) : (
                  <p
                    className="luxia-type-body-dense whitespace-pre-wrap break-words leading-snug"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {activeComment.body}
                  </p>
                )}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        className="luxia-button luxia-button--primary luxia-button--compact"
                        disabled={!draft.trim()}
                        onClick={() => {
                          onEditComment({ ...activeComment, body: draft.trim() });
                          setEditing(false);
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="luxia-button luxia-button--ghost luxia-button--compact"
                        onClick={() => {
                          setDraft(activeComment.body);
                          setEditing(false);
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="luxia-button luxia-button--secondary luxia-button--compact"
                        onClick={() => setEditing(true)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="luxia-button luxia-button--tertiary luxia-button--compact"
                        onClick={() => {
                          onDeleteComment(activeComment.id);
                          onCloseComment();
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
                {isClusterHead && count > 1 ? (
                  <div
                    className="mt-2 flex flex-wrap gap-1 border-t pt-2"
                    style={{ borderColor: "var(--luxia-border-subtle)" }}
                  >
                    {badge.clusterIds.map((id, index) => (
                      <button
                        key={id}
                        type="button"
                        className={cn(
                          "luxia-type-caption rounded-[6px] px-1.5 py-0.5",
                          id === activeCommentId
                            ? "bg-[var(--luxia-opacity-brand-primary-08)] text-[var(--luxia-brand-primary)]"
                            : "text-[var(--luxia-text-secondary)] hover:bg-[var(--luxia-neutral-surface-subtle,#FAFDFF)]",
                        )}
                        onClick={() => onOpenComment(id)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                ) : null}
              </PopoverContent>
            ) : null}
          </Popover>
        );
      })}
    </div>
  );
}
