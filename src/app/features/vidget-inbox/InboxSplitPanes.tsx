import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoveHorizontal } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/app/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import type {
  ImperativePanelGroupHandle,
  PanelGroupStorage,
} from "react-resizable-panels";

export const INBOX_SPLIT_STORAGE_KEY = "luxia.vidget-inbox.split.v1";
export const INBOX_SPLIT_DEFAULT_LEFT = 40;
export const INBOX_SPLIT_DEFAULT_RIGHT = 60;

const LEFT_MIN_PERCENT = 30;
const LEFT_MAX_PERCENT = 60;
const LEFT_MIN_PX = 440;
const RIGHT_MIN_PX = 560;
const RESIZE_TIP_DELAY_MS = 400;

const INBOX_WORKSPACE_PANEL_CLASS =
  "box-border flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-[var(--luxia-radius-12)] border border-[var(--luxia-settings-panel-border)] bg-[var(--luxia-settings-panel-bg)] p-3 shadow-[var(--luxia-shadow-xs)]";

export const inboxSplitStorage: PanelGroupStorage = {
  getItem() {
    try {
      return window.localStorage.getItem(INBOX_SPLIT_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  setItem(_name, value) {
    try {
      window.localStorage.setItem(INBOX_SPLIT_STORAGE_KEY, value);
    } catch {
      /* ignore quota / private-mode failures */
    }
  },
};

export function computeInboxSplitConstraints(groupWidth: number): {
  minSize: number;
  maxSize: number;
} {
  const fallback = { minSize: LEFT_MIN_PERCENT, maxSize: LEFT_MAX_PERCENT };
  if (!Number.isFinite(groupWidth) || groupWidth <= 0) return fallback;

  const leftMinFromPx = (LEFT_MIN_PX / groupWidth) * 100;
  const rightMinFromPx = (RIGHT_MIN_PX / groupWidth) * 100;
  const minSize = Math.max(LEFT_MIN_PERCENT, leftMinFromPx);
  const maxSize = Math.min(LEFT_MAX_PERCENT, 100 - rightMinFromPx);

  if (minSize <= maxSize) {
    return {
      minSize: roundPercent(minSize),
      maxSize: roundPercent(maxSize),
    };
  }

  return fallback;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function InboxSplitPanes({
  list,
  review,
  resizeDisabled = false,
}: {
  list: ReactNode;
  review: ReactNode;
  resizeDisabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<ImperativePanelGroupHandle>(null);
  const resizeTipTimerRef = useRef(0);
  const [resizeTipOpen, setResizeTipOpen] = useState(false);
  const [constraints, setConstraints] = useState(() =>
    computeInboxSplitConstraints(0),
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const next = computeInboxSplitConstraints(node.getBoundingClientRect().width);
      setConstraints((current) =>
        current.minSize === next.minSize && current.maxSize === next.maxSize
          ? current
          : next,
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(resizeTipTimerRef.current);
  }, []);

  useEffect(() => {
    if (!resizeDisabled) return;
    window.clearTimeout(resizeTipTimerRef.current);
    setResizeTipOpen(false);
  }, [resizeDisabled]);

  function scheduleResizeTip() {
    window.clearTimeout(resizeTipTimerRef.current);
    resizeTipTimerRef.current = window.setTimeout(() => {
      setResizeTipOpen(true);
    }, RESIZE_TIP_DELAY_MS);
  }

  function hideResizeTip() {
    window.clearTimeout(resizeTipTimerRef.current);
    setResizeTipOpen(false);
  }

  const rightMinSize = roundPercent(100 - constraints.maxSize);
  const rightMaxSize = roundPercent(100 - constraints.minSize);

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
    >
      <div className="absolute inset-0 min-h-0 min-w-0 overflow-hidden">
        <ResizablePanelGroup
          ref={groupRef}
          direction="horizontal"
          autoSaveId={INBOX_SPLIT_STORAGE_KEY}
          storage={inboxSplitStorage}
          className="h-full w-full min-h-0 min-w-0 overflow-hidden"
          id="vidget-inbox-split"
        >
          <ResizablePanel
            id="inbox-queue"
            defaultSize={INBOX_SPLIT_DEFAULT_LEFT}
            minSize={constraints.minSize}
            maxSize={constraints.maxSize}
            className="min-h-0 min-w-0 overflow-hidden"
          >
            <div className={INBOX_WORKSPACE_PANEL_CLASS}>
              {list}
            </div>
          </ResizablePanel>
          <ResizableHandle
            disabled={resizeDisabled}
            tabIndex={resizeDisabled ? -1 : 0}
            aria-hidden={resizeDisabled}
            aria-label={resizeDisabled ? undefined : "Resize Inbox panels"}
            aria-orientation={resizeDisabled ? undefined : "vertical"}
            className={
              resizeDisabled
                ? "relative z-10 flex w-4 shrink-0 cursor-default items-center justify-center !bg-transparent before:absolute before:inset-y-0 before:left-1/2 before:z-0 before:w-px before:-translate-x-1/2 before:bg-[var(--luxia-border-subtle)] after:absolute after:inset-y-0 after:left-1/2 after:z-10 after:w-4 after:-translate-x-1/2 after:bg-transparent"
                : "group relative z-10 flex w-4 shrink-0 cursor-col-resize items-center justify-center !bg-transparent before:absolute before:inset-y-0 before:left-1/2 before:z-0 before:w-px before:-translate-x-1/2 before:bg-[var(--luxia-border-subtle)] after:absolute after:inset-y-0 after:left-1/2 after:z-10 after:w-4 after:-translate-x-1/2 after:bg-transparent hover:before:bg-[var(--luxia-border-default)] focus-visible:before:bg-[var(--luxia-border-default)] focus-visible:ring-1 focus-visible:ring-[var(--luxia-border-focus)] data-[resize-handle-state=drag]:before:bg-[var(--luxia-border-default)] data-[resize-handle-state=hover]:before:bg-[var(--luxia-border-default)]"
            }
            style={{ cursor: resizeDisabled ? "default" : "col-resize" }}
            onPointerEnter={resizeDisabled ? undefined : scheduleResizeTip}
            onPointerLeave={resizeDisabled ? undefined : hideResizeTip}
            onPointerDown={resizeDisabled ? undefined : hideResizeTip}
            onFocus={resizeDisabled ? undefined : scheduleResizeTip}
            onBlur={resizeDisabled ? undefined : hideResizeTip}
            onDoubleClick={
              resizeDisabled
                ? undefined
                : () => {
                    groupRef.current?.setLayout([
                      INBOX_SPLIT_DEFAULT_LEFT,
                      INBOX_SPLIT_DEFAULT_RIGHT,
                    ]);
                  }
            }
          >
            {resizeDisabled ? null : (
              <Tooltip open={resizeTipOpen}>
                <TooltipTrigger asChild>
                  <span
                    aria-hidden
                    className="pointer-events-none z-20 flex h-7 w-7 items-center justify-center rounded-[var(--luxia-radius-8)] border border-[var(--luxia-border-subtle)] bg-[var(--luxia-settings-panel-bg)] text-[var(--luxia-text-muted)] group-hover:border-[var(--luxia-border-default)] group-hover:text-[var(--luxia-text-secondary)] group-data-[resize-handle-state=drag]:border-[var(--luxia-border-default)] group-data-[resize-handle-state=drag]:text-[var(--luxia-text-secondary)] group-data-[resize-handle-state=hover]:border-[var(--luxia-border-default)] group-data-[resize-handle-state=hover]:text-[var(--luxia-text-secondary)]"
                  >
                    <MoveHorizontal size={14} strokeWidth={1.75} />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Drag to resize panels
                </TooltipContent>
              </Tooltip>
            )}
          </ResizableHandle>
          <ResizablePanel
            id="inbox-review"
            defaultSize={INBOX_SPLIT_DEFAULT_RIGHT}
            minSize={rightMinSize}
            maxSize={rightMaxSize}
            className="min-h-0 min-w-0 overflow-hidden"
          >
            <div className={INBOX_WORKSPACE_PANEL_CLASS}>
              {review}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export { InboxSplitPanes };
