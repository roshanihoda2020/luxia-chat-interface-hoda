import {
  BarChart3,
  Database,
  FileOutput,
  FileSearch,
  GitMerge,
  Link2,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PipelineTaskStatus } from "./types";

export type TaskFlowNodeVisual = {
  accent: string;
  border: string;
  background: string;
  iconSurface: string;
  iconColor: string;
};

export type TaskFlowSelectedVisual = {
  background: string;
  border: string;
  accent: string;
  elevation: string;
};

const NODE_BASE =
  "color-mix(in srgb, var(--luxia-neutral-50) 70%, var(--luxia-surface))";

/**
 * Soft status-tinted node surfaces — Luxia semantic tokens only.
 * Status also communicates via badge text/icon; color is never the sole cue.
 */
export function taskFlowNodeVisual(
  status: PipelineTaskStatus,
): TaskFlowNodeVisual {
  switch (status) {
    case "success":
      return {
        accent: "var(--luxia-success)",
        border:
          "color-mix(in srgb, var(--luxia-success) 36%, var(--luxia-border-strong))",
        background: `color-mix(in srgb, var(--luxia-success-10) 48%, ${NODE_BASE})`,
        iconSurface: "var(--luxia-opacity-success-12)",
        iconColor: "var(--luxia-success-70)",
      };
    case "failed":
      return {
        accent: "var(--luxia-error)",
        border:
          "color-mix(in srgb, var(--luxia-error) 40%, var(--luxia-border-strong))",
        background: `color-mix(in srgb, var(--luxia-error-10) 52%, ${NODE_BASE})`,
        iconSurface: "var(--luxia-opacity-error-12)",
        iconColor: "var(--luxia-error-70)",
      };
    case "upstream_failed":
      return {
        accent:
          "color-mix(in srgb, var(--luxia-error) 58%, var(--luxia-neutral-400))",
        border:
          "color-mix(in srgb, var(--luxia-error) 26%, var(--luxia-border-strong))",
        background: `color-mix(in srgb, var(--luxia-error-10) 34%, ${NODE_BASE})`,
        iconSurface: "var(--luxia-opacity-error-08)",
        iconColor:
          "color-mix(in srgb, var(--luxia-error-70) 70%, var(--luxia-neutral-500))",
      };
    case "running":
      return {
        accent: "var(--luxia-blue-60)",
        border:
          "color-mix(in srgb, var(--luxia-blue-60) 38%, var(--luxia-border-strong))",
        background: `color-mix(in srgb, var(--luxia-blue-10) 55%, ${NODE_BASE})`,
        iconSurface: "color-mix(in srgb, var(--luxia-blue-20) 55%, transparent)",
        iconColor: "var(--luxia-blue-70)",
      };
    case "queued":
      return {
        accent:
          "color-mix(in srgb, var(--luxia-purple-40) 50%, var(--luxia-neutral-400))",
        border:
          "color-mix(in srgb, var(--luxia-purple-30) 26%, var(--luxia-border-strong))",
        background: `color-mix(in srgb, var(--luxia-opacity-brand-secondary-08) 75%, ${NODE_BASE})`,
        iconSurface: "var(--luxia-opacity-brand-secondary-12)",
        iconColor: "var(--luxia-purple-60)",
      };
    case "skipped":
      return {
        accent: "var(--luxia-warning-50)",
        border:
          "color-mix(in srgb, var(--luxia-warning-50) 36%, var(--luxia-border-strong))",
        background: `color-mix(in srgb, var(--luxia-warning-10) 55%, ${NODE_BASE})`,
        iconSurface: "var(--luxia-opacity-warning-12)",
        iconColor: "var(--luxia-warning-90)",
      };
    default:
      return {
        accent: "var(--luxia-neutral-400)",
        border: "var(--luxia-border-strong)",
        background: NODE_BASE,
        iconSurface: "var(--luxia-neutral-100)",
        iconColor: "var(--luxia-neutral-600)",
      };
  }
}

export function resolveTaskTypeIcon(
  taskKey: string,
  name: string,
): LucideIcon {
  const hay = `${taskKey} ${name}`.toLowerCase();

  if (/(extract|ingest|source|profile)/.test(hay)) return Database;
  if (/(normalize|clean|standard)/.test(hay)) return Sparkles;
  if (/(match|join|merge|link)/.test(hay)) return Link2;
  if (/(score|quality|metric|chart)/.test(hay)) return BarChart3;
  if (/(write|publish|deliver|export|output|upload)/.test(hay)) return FileOutput;
  if (/(validate|check|shield|verify)/.test(hay)) return ShieldCheck;
  if (/(transform|map|convert)/.test(hay)) return Wand2;
  if (/(enrich|augment)/.test(hay)) return GitMerge;
  if (/(prepare|assemble|file|search)/.test(hay)) return FileSearch;
  if (/(upload)/.test(hay)) return Upload;

  return Workflow;
}

export const TASK_FLOW_NODE_SHADOW =
  "0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)";

export const TASK_FLOW_CANVAS_DOT =
  "radial-gradient(circle, color-mix(in srgb, var(--luxia-neutral-300) 55%, transparent) 0.85px, transparent 1px)";

/**
 * Selected treatment reinforces the task's semantic status.
 * Soft tint + stronger semantic border + subtle colored elevation.
 * No left-edge inset/stroke — selection is full-frame only.
 */
export function taskFlowSelectedVisual(
  status: PipelineTaskStatus,
): TaskFlowSelectedVisual {
  const base = taskFlowNodeVisual(status);

  switch (status) {
    case "success":
      return {
        background: `color-mix(in srgb, var(--luxia-success-10) 72%, var(--luxia-surface))`,
        border:
          "color-mix(in srgb, var(--luxia-success) 55%, var(--luxia-border-strong))",
        accent: "var(--luxia-success)",
        elevation:
          "0 2px 10px var(--luxia-opacity-success-16), 0 0 0 1.5px color-mix(in srgb, var(--luxia-success) 45%, transparent)",
      };
    case "failed":
      return {
        background: `color-mix(in srgb, var(--luxia-error-10) 74%, var(--luxia-surface))`,
        border:
          "color-mix(in srgb, var(--luxia-error) 55%, var(--luxia-border-strong))",
        accent: "var(--luxia-error)",
        elevation:
          "0 2px 10px var(--luxia-opacity-error-16), 0 0 0 1.5px color-mix(in srgb, var(--luxia-error) 42%, transparent)",
      };
    case "upstream_failed":
      return {
        background: `color-mix(in srgb, var(--luxia-error-10) 55%, var(--luxia-surface))`,
        border:
          "color-mix(in srgb, var(--luxia-error) 38%, var(--luxia-border-strong))",
        accent:
          "color-mix(in srgb, var(--luxia-error) 62%, var(--luxia-neutral-400))",
        elevation:
          "0 2px 10px var(--luxia-opacity-error-12), 0 0 0 1.5px color-mix(in srgb, var(--luxia-error) 30%, transparent)",
      };
    case "running":
      return {
        background: `color-mix(in srgb, var(--luxia-blue-10) 78%, var(--luxia-surface))`,
        border:
          "color-mix(in srgb, var(--luxia-blue-60) 52%, var(--luxia-border-strong))",
        accent: "var(--luxia-blue-60)",
        elevation:
          "0 2px 10px color-mix(in srgb, var(--luxia-blue-50) 28%, transparent), 0 0 0 1.5px color-mix(in srgb, var(--luxia-blue-60) 40%, transparent)",
      };
    case "queued":
      return {
        background: `color-mix(in srgb, var(--luxia-opacity-brand-secondary-08) 85%, var(--luxia-surface))`,
        border:
          "color-mix(in srgb, var(--luxia-purple-40) 42%, var(--luxia-border-strong))",
        accent:
          "color-mix(in srgb, var(--luxia-purple-40) 55%, var(--luxia-neutral-400))",
        elevation:
          "0 2px 10px var(--luxia-opacity-brand-secondary-12), 0 0 0 1.5px color-mix(in srgb, var(--luxia-purple-40) 35%, transparent)",
      };
    case "skipped":
      return {
        background: `color-mix(in srgb, var(--luxia-warning-10) 48%, var(--luxia-neutral-50))`,
        border:
          "color-mix(in srgb, var(--luxia-warning-90) 28%, var(--luxia-border-strong))",
        accent:
          "color-mix(in srgb, var(--luxia-warning-90) 45%, var(--luxia-neutral-400))",
        elevation:
          "0 2px 8px var(--luxia-opacity-warning-12), 0 0 0 1.5px color-mix(in srgb, var(--luxia-warning-50) 35%, transparent)",
      };
    default:
      return {
        background: base.background,
        border: base.border,
        accent: base.accent,
        elevation: TASK_FLOW_NODE_SHADOW,
      };
  }
}
