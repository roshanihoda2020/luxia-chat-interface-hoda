import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  AlertCircle,
  Check,
  Circle,
  Clock,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  formatTaskDuration,
  formatTaskStatusLabel,
  pipelineStatusBadgeVariant,
  pipelineTaskStatusBadgeClass,
} from "./format";
import {
  layoutTaskGraph,
  TASK_GRAPH_NODE_SIZE,
} from "./taskGraphLayout";
import type { PipelineTaskRecord, PipelineTaskStatus } from "./types";

export interface TaskFlowGraphProps {
  tasks: PipelineTaskRecord[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

const STATUS_ICON: Record<PipelineTaskStatus, LucideIcon> = {
  success: Check,
  running: Circle,
  failed: TriangleAlert,
  queued: Clock,
  skipped: Minus,
  upstream_failed: AlertCircle,
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.75;
/** Lower bound when the graph exceeds the viewport on Fit (large DAGs). */
const FIT_MIN_ZOOM = 0.62;
const ZOOM_STEP = 1.15;
const PAN_CLICK_THRESHOLD_PX = 5;
const VIEWPORT_MIN_PX = 280;
const VIEWPORT_MAX_CSS = "min(36rem, 65vh)";

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
    const maxPx = Math.min(36 * 16, Math.round(window.innerHeight * 0.65));
    const padY = 40;
    const contentSized = canvasH * 1.05 + padY;
    const next = Math.min(Math.max(contentSized, VIEWPORT_MIN_PX), maxPx);
    setViewportPx(next);
  }, [canvasH]);

  const applyFit = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const pad = 20;
    const availW = Math.max(80, viewport.clientWidth - pad * 2);
    const availH = Math.max(80, viewport.clientHeight - pad * 2);

    const fits =
      canvasW <= availW && canvasH <= availH;
    let nextZoom = Math.min(availW / canvasW, availH / canvasH, 1);
    if (fits) {
      nextZoom = 1;
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
    setPan({
      x: (viewport.clientWidth - contentW) / 2,
      y: (viewport.clientHeight - contentH) / 2,
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
    setPan({
      x: (viewport.clientWidth - canvasW) / 2,
      y: (viewport.clientHeight - canvasH) / 2,
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
    } catch {
      // Already released.
    }
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
        background:
          "linear-gradient(180deg, var(--luxia-opacity-purple-04, rgba(118,82,196,0.04)) 0%, var(--luxia-surface) 48%)",
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
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M0,0.75 L6.5,4 L0,7.25 Z"
                fill="var(--luxia-text-muted, #6B7280)"
                fillOpacity={0.85}
              />
            </marker>
          </defs>
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {layout.edges.map((edge) => (
              <path
                key={`${edge.fromKey}-${edge.toKey}`}
                d={edgePath(edge.x1, edge.y1, edge.x2, edge.y2)}
                fill="none"
                stroke="var(--luxia-text-muted, #6B7280)"
                strokeWidth={1.5 / zoom}
                strokeOpacity={0.55}
                markerEnd="url(#pipelines-task-arrow)"
              />
            ))}
          </g>
        </svg>

        {layout.nodes.map((node) => {
          const selected = node.task.id === selectedTaskId;
          const statusLabel = formatTaskStatusLabel(node.task.status);
          const StatusIcon = STATUS_ICON[node.task.status];
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
                className="box-border flex h-full w-full cursor-pointer flex-col justify-center gap-1 rounded-[10px] border px-2.5 py-1.5 text-left outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] focus-visible:ring-offset-1"
                style={{
                  background: selected
                    ? "var(--luxia-opacity-purple-08)"
                    : "var(--luxia-surface)",
                  borderColor: selected
                    ? "var(--luxia-purple-40)"
                    : "var(--luxia-border-default)",
                  boxShadow: selected
                    ? "0 0 0 1px var(--luxia-purple-40)"
                    : "none",
                }}
                aria-pressed={selected}
                aria-label={ariaParts.join(", ")}
                onClick={() => onSelectTask(node.task.id)}
                onMouseEnter={(event) => {
                  if (selected) return;
                  event.currentTarget.style.borderColor =
                    "var(--luxia-border-strong)";
                }}
                onMouseLeave={(event) => {
                  if (selected) return;
                  event.currentTarget.style.borderColor =
                    "var(--luxia-border-default)";
                }}
              >
                <span
                  className="block truncate luxia-type-body-dense-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  {node.task.name}
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <Badge
                    variant={pipelineStatusBadgeVariant(node.task.status)}
                    className={`min-h-0 max-w-full gap-0.5 px-1.5 py-0 luxia-type-caption [&>svg]:size-[11px] ${
                      pipelineTaskStatusBadgeClass(node.task.status) ?? ""
                    }`}
                  >
                    <StatusIcon
                      aria-hidden
                      strokeWidth={2.25}
                      fill={
                        node.task.status === "running" ? "currentColor" : "none"
                      }
                    />
                    <span className="truncate">{statusLabel}</span>
                  </Badge>
                  {duration ? (
                    <span
                      className="shrink-0 tabular-nums luxia-type-caption"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      {duration}
                    </span>
                  ) : null}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--luxia-surface)] to-transparent opacity-70"
        aria-hidden
      />

      <div
        className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-[10px] border bg-[var(--luxia-surface)] p-1 shadow-[0_1px_2px_rgba(28,19,54,0.06)]"
        style={{ borderColor: "var(--luxia-border-default)" }}
        role="toolbar"
        aria-label="Graph navigation"
      >
        <GraphControlButton
          label="Zoom out"
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          disabled={zoom <= MIN_ZOOM + 0.001}
        >
          <Minus size={14} aria-hidden />
        </GraphControlButton>
        <span
          className="min-w-[2.75rem] text-center tabular-nums luxia-type-caption"
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
          <Plus size={14} aria-hidden />
        </GraphControlButton>
        <GraphControlButton label="Fit to view" onClick={applyFit}>
          <Maximize2 size={14} aria-hidden />
        </GraphControlButton>
        <GraphControlButton label="Reset to 100%" onClick={resetZoom}>
          <RotateCcw size={14} aria-hidden />
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
          className="pointer-events-auto size-7"
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
  const midX = x1 + Math.max(18, dx * 0.45);
  if (Math.abs(y2 - y1) < 1) {
    return `M ${x1} ${y1} H ${x2}`;
  }
  const r = Math.min(10, Math.abs(y2 - y1) / 2, Math.abs(x2 - midX) / 2);
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
