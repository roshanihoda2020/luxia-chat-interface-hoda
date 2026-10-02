import type { PipelineTaskRecord } from "./types";

export type TaskGraphLayoutNode = {
  task: PipelineTaskRecord;
  column: number;
  row: number;
  x: number;
  y: number;
};

export type TaskGraphLayoutEdge = {
  fromKey: string;
  toKey: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type TaskGraphLayout = {
  nodes: TaskGraphLayoutNode[];
  edges: TaskGraphLayoutEdge[];
  width: number;
  height: number;
};

/** Compact operational cards — readable size stays fixed as the DAG grows. */
const NODE_WIDTH = 168;
const NODE_HEIGHT = 56;
const COL_GAP = 48;
const ROW_GAP = 32;
const PAD = 20;
/** Keep edges from sitting flush against the node border. */
const EDGE_INSET = 0;

/**
 * Layered DAG layout from structured task upstream relationships.
 * Columns are depth-based; rows within a column are vertically centered
 * so parallel branches read as a balanced composition.
 * Replaceable later with React Flow + Dagre using the same task/edge data.
 */
export function layoutTaskGraph(tasks: PipelineTaskRecord[]): TaskGraphLayout {
  const byKey = new Map(tasks.map((task) => [task.taskKey, task]));
  const depth = new Map<string, number>();

  function resolveDepth(key: string, visiting: Set<string>): number {
    const cached = depth.get(key);
    if (cached != null) return cached;
    if (visiting.has(key)) return 0;
    visiting.add(key);
    const task = byKey.get(key);
    const upstream = task?.upstreamKeys ?? [];
    const value =
      upstream.length === 0
        ? 0
        : Math.max(...upstream.map((up) => resolveDepth(up, visiting))) + 1;
    visiting.delete(key);
    depth.set(key, value);
    return value;
  }

  for (const task of tasks) resolveDepth(task.taskKey, new Set());

  const columns = new Map<number, string[]>();
  for (const task of tasks) {
    const col = depth.get(task.taskKey) ?? 0;
    const list = columns.get(col) ?? [];
    list.push(task.taskKey);
    columns.set(col, list);
  }

  const orderedColumns = [...columns.keys()].sort((a, b) => a - b);
  const maxCol = Math.max(0, ...orderedColumns);
  const maxRowsInCol = Math.max(
    1,
    ...orderedColumns.map((col) => (columns.get(col) ?? []).length),
  );
  const contentHeight =
    maxRowsInCol * NODE_HEIGHT + (maxRowsInCol - 1) * ROW_GAP;

  const positions = new Map<string, { column: number; row: number; y: number }>();
  for (const col of orderedColumns) {
    const keys = columns.get(col) ?? [];
    const blockHeight =
      keys.length * NODE_HEIGHT + Math.max(0, keys.length - 1) * ROW_GAP;
    const offsetY = (contentHeight - blockHeight) / 2;
    keys.forEach((key, row) => {
      positions.set(key, {
        column: col,
        row,
        y: PAD + offsetY + row * (NODE_HEIGHT + ROW_GAP),
      });
    });
  }

  const nodes: TaskGraphLayoutNode[] = tasks.map((task) => {
    const pos = positions.get(task.taskKey) ?? {
      column: 0,
      row: 0,
      y: PAD,
    };
    return {
      task,
      column: pos.column,
      row: pos.row,
      x: PAD + pos.column * (NODE_WIDTH + COL_GAP),
      y: pos.y,
    };
  });

  const nodeByKey = new Map(nodes.map((node) => [node.task.taskKey, node]));
  const edges: TaskGraphLayoutEdge[] = [];
  for (const task of tasks) {
    for (const up of task.upstreamKeys) {
      const from = nodeByKey.get(up);
      const to = nodeByKey.get(task.taskKey);
      if (!from || !to) continue;
      edges.push({
        fromKey: up,
        toKey: task.taskKey,
        x1: from.x + NODE_WIDTH - EDGE_INSET,
        y1: from.y + NODE_HEIGHT / 2,
        x2: to.x + EDGE_INSET,
        y2: to.y + NODE_HEIGHT / 2,
      });
    }
  }

  return {
    nodes,
    edges,
    width: PAD * 2 + (maxCol + 1) * NODE_WIDTH + maxCol * COL_GAP,
    height: PAD * 2 + contentHeight,
  };
}

export const TASK_GRAPH_NODE_SIZE = {
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
} as const;
