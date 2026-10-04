import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import {
  formatTaskDuration,
  formatTaskStatusLabel,
  PIPELINE_COMPACT_STATUS_BADGE_CLASS,
  pipelineStatusBadgeVariant,
  pipelineTaskStatusBadgeClass,
} from "./format";
import {
  TASK_FLOW_CANVAS_DOT,
  TASK_FLOW_NODE_SHADOW,
  resolveTaskTypeIcon,
  taskFlowNodeVisual,
  taskFlowSelectedVisual,
} from "./taskFlowNodeVisuals";
import {
  layoutTaskGraph,
  TASK_GRAPH_NODE_SIZE,
} from "./taskGraphLayout";
import { PipelineTaskStatusBadgeIcon } from "./taskStatusIcons";
import type { PipelineTaskRecord, PipelineTaskStatus } from "./types";

export interface TaskFlowGraphProps {
  tasks: PipelineTaskRecord[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.75;
const FIT_MIN_ZOOM = 0.62;
const FIT_MAX_ZOOM = 1.45;
const ZOOM_STEP = 1.15;
const PAN_CLICK_THRESHOLD_PX = 5;
const VIEWPORT_MIN_PX = 176;
const VIEWPORT_MAX_CSS = "min(30rem, 54vh)";
const VIEWPORT_GRAPH_PAD_PX = 36;
const VIEWPORT_CONTROLS_RESERVE_PX = 40;

const EDGE_STROKE = "var(--luxia-neutral-600)";
const EDGE_STROKE_FAILED =
  "color-mix(in srgb, var(--luxia-error) 22%, var(--luxia-neutral-600))";

type PanState = { x: number; y: number };

export function TaskFlowGraph({
  tasks,
  selectedTaskId,
  onSelectTask,
}: TaskFlowGraphProps) {
  const layout = layoutTaskGraph(tasks);
  const { width: nw, height: nh } = TASK_GRAPH_NODE_SIZE;
  const canvasW = Math.max(layout.width, 280);
  const canvasH = Math.max(layout.height, 96);

  const statusByKey = useMemo(() => {
    const map = new Map<string, PipelineTaskStatus>();
    for (const task of tasks) map.set(task.taskKey, task.status);
    return map;
  }, [tasks]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [viewportPx, setViewportPx] = useState<number>(224);
  const userAdjustedRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const measureViewportHeight = useCallback(() => {
    const maxPx = Math.min(28 * 16, Math.round(window.innerHeight * 0.52));
    const padY = VIEWPORT_GRAPH_PAD_PX + VIEWPORT_CONTROLS_RESERVE_PX;
    const contentSized = canvasH + padY;
    const widthGuess =
      viewportRef.current?.clientWidth
      ?? Math.min(window.innerWidth - 64, 1200);
    const widthDrivenZoom = Math.min(
      FIT_MAX_ZOOM,
      Math.max(1, (widthGuess - 48) / Math.max(canvasW, 1)),
    );
    const widthDrivenH = Math.round(canvasH * widthDrivenZoom + padY);
    const next = Math.min(
      maxPx,
      Math.max(VIEWPORT_MIN_PX, contentSized, Math.min(widthDrivenH, maxPx)),
    );
    setViewportPx(next);
  }, [canvasH, canvasW]);

  const applyFit = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const padX = 20;
    const padTop = 16;
    const padBottom = 16 + VIEWPORT_CONTROLS_RESERVE_PX;
    const availW = Math.max(80, viewport.clientWidth - padX * 2);
    const availH = Math.max(80, viewport.clientHeight - padTop - padBottom);

    let nextZoom = Math.min(availW / canvasW, availH / canvasH);
    if (nextZoom >= 1) {
      nextZoom = Math.min(nextZoom, FIT_MAX_ZOOM);
    } else if (canvasW < 520 && canvasH < 320) {
      nextZoom = Math.max(0.82, nextZoom);
    } else {
      nextZoom = Math.max(FIT_MIN_ZOOM, nextZoom);
    }
    nextZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);

    const contentW = canvasW * nextZoom;
    const contentH = canvasH * nextZoom;
    userAdjustedRef.current = false;
    setZoom(nextZoom);
    const usableH = viewport.clientHeight - VIEWPORT_CONTROLS_RESERVE_PX;
    setPan({
      x: (viewport.clientWidth - contentW) / 2,
      y: Math.max(padTop, (usableH - contentH) / 2),
    });
  }, [canvasW, canvasH]);

  const resetZoom = useCallback(() => {
    const viewport = viewportRef.current;
    userAdjustedRef.current = true;
    if (!viewport) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    setZoom(1);
    const usableH = viewport.clientHeight - VIEWPORT_CONTROLS_RESERVE_PX;
    setPan({
      x: (viewport.clientWidth - canvasW) / 2,
      y: Math.max(12, (usableH - canvasH) / 2),
    });
  }, [canvasW, canvasH]);

  const zoomBy = useCallback((factor: number) => {
    const viewport = viewportRef.current;
    userAdjustedRef.current = true;
    setZoom((prev) => {
      const next = clamp(prev * factor, MIN_ZOOM, MAX_ZOOM);
      if (!viewport || next === prev) return next;
      const cx = viewport.clientWidth / 2;
      const cy = viewport.clientHeight / 2;
      setPan((p) => {
        const worldX = (cx - p.x) / prev;
        const worldY = (cy - p.y) / prev;
        return {
          x: cx - worldX * next,
          y: cy - worldY * next,
        };
      });
      return next;
    });
  }, []);

  useEffect(() => {
    measureViewportHeight();
  }, [measureViewportHeight, tasks]);

  useEffect(() => {
    applyFit();
  }, [applyFit, tasks, viewportPx]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (userAdjustedRef.current) return;
      applyFit();
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [applyFit, viewportPx]);

  useEffect(() => {
    function onResize() {
      measureViewportHeight();
      if (!userAdjustedRef.current) applyFit();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureViewportHeight, applyFit]);

  const prevSelectedTaskRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedTaskId === prevSelectedTaskRef.current) return;
    prevSelectedTaskRef.current = selectedTaskId;

    const node = layout.nodes.find((item) => item.task.id === selectedTaskId);
    const viewport = viewportRef.current;
    if (!node || !viewport) return;

    const pad = 20;
    setPan((p) => {
      const left = p.x + node.x * zoom;
      const top = p.y + node.y * zoom;
      const right = left + nw * zoom;
      const bottom = top + nh * zoom;

      let dx = 0;
      let dy = 0;
      if (right > viewport.clientWidth - pad) {
        dx = viewport.clientWidth - pad - right;
      }
      if (left + dx < pad) {
        dx = pad - left;
      }
      if (bottom > viewport.clientHeight - pad) {
        dy = viewport.clientHeight - pad - bottom;
      }
      if (top + dy < pad) {
        dy = pad - top;
      }
      if (dx === 0 && dy === 0) return p;
      return { x: p.x + dx, y: p.y + dy };
    });
  }, [selectedTaskId, layout.nodes, zoom, nw, nh]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, textarea, select")) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) >= PAN_CLICK_THRESHOLD_PX) {
      userAdjustedRef.current = true;
    }
    setPan({
      x: drag.originX + dx,
      y: drag.originY + dy,
    });
  }

  function endPan(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsPanning(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;
    userAdjustedRef.current = true;
    const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    const rect = viewport.getBoundingClientRect();
    const cx = event.clientX - rect.left;
    const cy = event.clientY - rect.top;
    setZoom((prev) => {
      const next = clamp(prev * factor, MIN_ZOOM, MAX_ZOOM);
      if (next === prev) return prev;
      setPan((p) => {
        const worldX = (cx - p.x) / prev;
        const worldY = (cy - p.y) / prev;
        return {
          x: cx - worldX * next,
          y: cy - worldY * next,
        };
      });
      return next;
    });
  }

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      className="relative w-full max-w-full rounded-[var(--luxia-radius-16)] border"
      style={{
        height: viewportPx,
        maxHeight: VIEWPORT_MAX_CSS,
        borderColor: "var(--luxia-border-default)",
        backgroundColor:
          "color-mix(in srgb, var(--luxia-neutral-50) 80%, var(--luxia-surface))",
        backgroundImage: TASK_FLOW_CANVAS_DOT,
        backgroundSize: "14px 14px",
        boxShadow: "var(--luxia-shadow-xs)",
        // Prevent transformed canvas from expanding ancestor scrollHeight.
        contain: "paint",
        overflow: "clip",
      }}
      role="group"
      aria-label="Task dependency graph. Drag empty space to pan. Use controls to zoom."
    >
      <div
        ref={viewportRef}
        className={`absolute inset-0 touch-none overflow-hidden ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onWheel={handleWheel}
      >
        <svg
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
          aria-hidden
        >
          <defs>
            <marker
              id="pipelines-task-arrow"
              markerWidth="9"
              markerHeight="9"
              refX="7.5"
              refY="4.5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M0.5,0.6 L7.2,4.5 L0.5,8.4 Z"
                fill={EDGE_STROKE}
                fillOpacity={0.95}
              />
            </marker>
            <marker
              id="pipelines-task-arrow-failed"
              markerWidth="9"
              markerHeight="9"
              refX="7.5"
              refY="4.5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M0.5,0.6 L7.2,4.5 L0.5,8.4 Z"
                fill={EDGE_STROKE_FAILED}
                fillOpacity={0.95}
              />
            </marker>
          </defs>
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {layout.edges.map((edge) => {
              const targetStatus = statusByKey.get(edge.toKey);
              const failedBranch =
                targetStatus === "failed"
                || targetStatus === "upstream_failed";
              return (
                <path
                  key={`${edge.fromKey}-${edge.toKey}`}
                  d={edgePath(edge.x1, edge.y1, edge.x2, edge.y2)}
                  fill="none"
                  stroke={failedBranch ? EDGE_STROKE_FAILED : EDGE_STROKE}
                  strokeWidth={2 / zoom}
                  strokeOpacity={failedBranch ? 0.9 : 0.86}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd={
                    failedBranch
                      ? "url(#pipelines-task-arrow-failed)"
                      : "url(#pipelines-task-arrow)"
                  }
                />
              );
            })}
          </g>
        </svg>

        {layout.nodes.map((node) => {
          const selected = node.task.id === selectedTaskId;
          const statusLabel = formatTaskStatusLabel(node.task.status);
          const TaskTypeIcon = resolveTaskTypeIcon(
            node.task.taskKey,
            node.task.name,
          );
          const visual = taskFlowNodeVisual(node.task.status);
          const selectedVisual = taskFlowSelectedVisual(node.task.status);
          const duration =
            node.task.status === "running" && node.task.durationSeconds == null
              ? "…"
              : (() => {
                  const label = formatTaskDuration(
                    node.task.durationSeconds,
                    node.task.status,
                  );
                  return label === "—" ? null : label;
                })();
          const ariaParts = [
            node.task.name,
            statusLabel,
            duration && duration !== "…" ? duration : null,
          ].filter(Boolean);
          const nodeW = nw * zoom;
          const nodeH = nh * zoom;
          const idleBorder = visual.border;
          const selectedBorder = selectedVisual.border;
          const idleShadow = TASK_FLOW_NODE_SHADOW;
          const nodeStyle: CSSProperties = {
            background: selected ? selectedVisual.background : visual.background,
            borderColor: selected ? selectedBorder : idleBorder,
            borderWidth: selected ? 2 : 1,
            boxShadow: selected ? selectedVisual.elevation : idleShadow,
          };

          return (
            <div
              key={node.task.id}
              className="pointer-events-auto absolute"
              style={{
                left: pan.x + node.x * zoom,
                top: pan.y + node.y * zoom,
                width: nodeW,
                height: nodeH,
              }}
            >
              <button
                type="button"
                className="box-border flex h-full w-full min-w-0 cursor-pointer items-center gap-2 rounded-[10px] border px-2 py-1.5 text-left outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] focus-visible:ring-offset-1"
                style={nodeStyle}
                aria-pressed={selected}
                aria-label={ariaParts.join(", ")}
                onClick={() => onSelectTask(node.task.id)}
                onMouseEnter={(event) => {
                  if (selected) return;
                  event.currentTarget.style.borderColor =
                    "var(--luxia-neutral-400)";
                  event.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(15, 23, 42, 0.08)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.borderColor = selected
                    ? selectedBorder
                    : idleBorder;
                  event.currentTarget.style.boxShadow = selected
                    ? selectedVisual.elevation
                    : idleShadow;
                }}
              >
                <span
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-[8px]"
                  style={{
                    background: visual.iconSurface,
                    color: visual.iconColor,
                  }}
                  aria-hidden
                >
                  <TaskTypeIcon size={14} strokeWidth={2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex min-w-0 items-start justify-between gap-2">
                    <span
                      className="min-w-0 truncate luxia-type-body-dense-strong"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      {node.task.name}
                    </span>
                    {duration ? (
                      <span
                        className="shrink-0 pt-0.5 tabular-nums luxia-type-caption"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        {duration}
                      </span>
                    ) : null}
                  </span>
                  <Badge
                    variant={pipelineStatusBadgeVariant(node.task.status)}
                    className={cn(
                      "w-fit max-w-full",
                      PIPELINE_COMPACT_STATUS_BADGE_CLASS,
                      pipelineTaskStatusBadgeClass(node.task.status),
                    )}
                  >
                    <PipelineTaskStatusBadgeIcon status={node.task.status} />
                    <span className="truncate">{statusLabel}</span>
                  </Badge>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div
        className="absolute bottom-2.5 right-2.5 z-10 flex h-8 items-center gap-0.5 rounded-[var(--luxia-radius-8)] border px-0.5 backdrop-blur-[2px]"
        style={{
          borderColor: "var(--luxia-border-default)",
          background:
            "color-mix(in srgb, var(--luxia-surface) 88%, transparent)",
          boxShadow: "var(--luxia-shadow-xs)",
        }}
        role="toolbar"
        aria-label="Graph navigation"
      >
        <GraphControlButton
          label="Zoom out"
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          disabled={zoom <= MIN_ZOOM + 0.001}
        >
          <Minus size={14} strokeWidth={2} aria-hidden />
        </GraphControlButton>
        <span
          className="min-w-[2.75rem] select-none text-center tabular-nums luxia-type-caption"
          style={{ color: "var(--luxia-text-secondary)" }}
          aria-live="polite"
        >
          {zoomPercent}%
        </span>
        <GraphControlButton
          label="Zoom in"
          onClick={() => zoomBy(ZOOM_STEP)}
          disabled={zoom >= MAX_ZOOM - 0.001}
        >
          <Plus size={14} strokeWidth={2} aria-hidden />
        </GraphControlButton>
        <span
          className="mx-0.5 h-4 w-px shrink-0"
          style={{ background: "var(--luxia-border-default)" }}
          aria-hidden
        />
        <GraphControlButton label="Fit to view" onClick={applyFit}>
          <Maximize2 size={13} strokeWidth={2} aria-hidden />
        </GraphControlButton>
        <GraphControlButton label="Reset view" onClick={resetZoom}>
          <RotateCcw size={13} strokeWidth={2} aria-hidden />
        </GraphControlButton>
      </div>
    </div>
  );
}

function GraphControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="iconCompact"
          className="pointer-events-auto size-7 shrink-0 text-[var(--luxia-text-secondary)] hover:bg-[var(--luxia-neutral-100)] hover:text-[var(--luxia-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Orthogonal-ish dependency path: horizontal → vertical → horizontal,
 * so parallel branches and convergence stay readable.
 */
function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  // Hold the vertical jog near mid-gap so fan-out / join stems align cleanly.
  const midX = x1 + Math.max(24, dx * 0.5);
  if (Math.abs(y2 - y1) < 1) {
    return `M ${x1} ${y1} H ${x2}`;
  }
  const r = Math.min(12, Math.abs(y2 - y1) / 2, Math.abs(x2 - midX) / 2);
  if (y2 > y1) {
    return [
      `M ${x1} ${y1}`,
      `H ${midX - r}`,
      `Q ${midX} ${y1} ${midX} ${y1 + r}`,
      `V ${y2 - r}`,
      `Q ${midX} ${y2} ${midX + r} ${y2}`,
      `H ${x2}`,
    ].join(" ");
  }
  return [
    `M ${x1} ${y1}`,
    `H ${midX - r}`,
    `Q ${midX} ${y1} ${midX} ${y1 - r}`,
    `V ${y2 + r}`,
    `Q ${midX} ${y2} ${midX + r} ${y2}`,
    `H ${x2}`,
  ].join(" ");
}
