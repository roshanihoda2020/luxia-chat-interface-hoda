import type { ReactNode } from "react";
import { Database, FileSpreadsheet, FileText, Sheet } from "lucide-react";
import { LuxiaArrowRightIcon } from "@/assets/icons";
import type { ProjectDashboardOutputType } from "@/app/features/project-overview/types";
import { DashboardOutputPreviewGraphic, outputTypeLabel } from "@/app/features/project-overview/DashboardOutputPreviews";
import { HT } from "./HomeTileSurface";
import { knowledgeKindOf, monogramOf, type HomeKnowledgeKind } from "./homeTileIdentity";

export { knowledgeKindOf, monogramOf };
export type { HomeKnowledgeKind };

/**
 * Home Tile visual primitives. A small shared vocabulary — identity marks,
 * one real-data distribution bar, output thumbnails and the inline open cue —
 * that the category tiles compose differently. Every colour comes from the
 * surface tokens (--home-tile-*, homeTileSurfaces.css), so each primitive
 * works on Featured, Soft and Default. Nothing here invents data.
 */

export const HOME_TILE_FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// Identity marks

/** Square identity mark for a Project (its monogram). */
export function Monogram({ name, size = 32, className = "" }: { name: string; size?: number; className?: string }) {
  const mark = monogramOf(name);
  return (
    <span
      aria-hidden
      className={`luxia-home-monogram inline-flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        fontSize: size >= 40 ? 14 : size >= 28 ? 12 : 10,
        letterSpacing: mark.length > 2 ? "-0.02em" : "0.02em",
      }}
    >
      {mark}
    </span>
  );
}

export function KnowledgeIcon({ kind, size }: { kind: HomeKnowledgeKind; size: number }) {
  const props = { size, strokeWidth: 1.9, "aria-hidden": true } as const;
  if (kind === "pdf" || kind === "file") return <FileText {...props} />;
  if (kind === "csv") return <Sheet {...props} />;
  if (kind === "sheet") return <FileSpreadsheet {...props} />;
  return <Database {...props} />;
}

/** Rounded identity chip holding one icon (knowledge type, tool, item kind). */
export function GlyphChip({
  children,
  size = 32,
  tone = "default",
  className = "",
  title,
}: {
  children: ReactNode;
  size?: number;
  /** "strong" uses the surface's emphasised glyph colours (lead items, single-item tiles). */
  tone?: "default" | "strong";
  className?: string;
  title?: string;
}) {
  return (
    <span
      aria-hidden={title ? undefined : true}
      title={title}
      className={`luxia-home-glyph inline-flex shrink-0 items-center justify-center ${className}`}
      data-tone={tone}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}
    >
      {children}
    </span>
  );
}

export function KnowledgeGlyph({ kind, size = 28, tone }: { kind: HomeKnowledgeKind; size?: number; tone?: "default" | "strong" }) {
  return (
    <GlyphChip size={size} tone={tone}>
      <KnowledgeIcon kind={kind} size={Math.round(size * 0.5)} />
    </GlyphChip>
  );
}

/**
 * Overlapping knowledge glyphs (e.g. the types of a Galaxy's Constellations),
 * one per item up to `max`, then "+N". Purely descriptive; the label carries
 * the same information for screen readers.
 */
export function KnowledgeStack({
  kinds,
  total,
  max = 3,
  size = 22,
  label,
  showMore = true,
}: {
  kinds: readonly HomeKnowledgeKind[];
  total: number;
  max?: number;
  size?: number;
  label: string;
  /** False when the caller already writes the total out. */
  showMore?: boolean;
}) {
  const shown = kinds.slice(0, max);
  const more = Math.max(0, total - shown.length);
  if (total === 0) return null;
  return (
    <span className="inline-flex shrink-0 items-center" role="img" aria-label={label} title={label}>
      {shown.map((kind, index) => (
        <span key={index} className="luxia-home-stack-item" style={{ marginLeft: index === 0 ? 0 : 3 }}>
          <KnowledgeGlyph kind={kind} size={size} />
        </span>
      ))}
      {more > 0 && showMore ? (
        <span className="ml-1.5 luxia-type-caption tabular-nums" style={{ color: HT.muted }}>{`+${more}`}</span>
      ) : null}
    </span>
  );
}

// Numbers and distributions

/** A real count set as a quiet display figure with its label (never on its own as a tile's only content). */
export function TileStat({ value, label, size = "md" }: { value: number; label: string; size?: "sm" | "md" }) {
  return (
    <p className="flex min-w-0 items-baseline gap-1.5">
      <span className={`luxia-home-stat ${size === "sm" ? "luxia-home-stat-sm" : ""}`}>{value}</span>
      <span className="min-w-0 truncate luxia-type-caption" style={{ color: HT.secondary }}>{label}</span>
    </p>
  );
}

export interface MixSegment {
  key: string;
  label: string;
  count: number;
}

/**
 * How a real total splits by type (e.g. 10 Database · 9 PDF · 7 CSV).
 * Every segment is also written out with its count, so colour is never the
 * only cue. Only for distributions that help (not decoration).
 */
export function TypeMixBar({
  segments,
  label,
  legend = "full",
}: {
  segments: readonly MixSegment[];
  label: string;
  legend?: "full" | "none";
}) {
  const visible = segments.filter((segment) => segment.count > 0);
  const total = visible.reduce((sum, segment) => sum + segment.count, 0);
  if (total === 0) return null;
  const description = visible.map((segment) => `${segment.count} ${segment.label}`).join(" · ");
  return (
    <div className="min-w-0" role="img" aria-label={`${label}: ${description}`}>
      <div className="flex h-1.5 w-full min-w-0 gap-[3px] overflow-hidden rounded-full" aria-hidden>
        {visible.map((segment, index) => (
          <span
            key={segment.key}
            className="h-full rounded-full"
            style={{ flexGrow: segment.count, flexBasis: 0, background: `var(--home-tile-mix-${(index % 3) + 1})` }}
          />
        ))}
      </div>
      {legend === "full" ? (
        <ul className="mt-1.5 flex min-w-0 flex-wrap gap-x-3 gap-y-0.5" aria-hidden>
          {visible.map((segment, index) => (
            <li key={segment.key} className="inline-flex items-center gap-1.5 luxia-type-caption" style={{ color: HT.secondary }}>
              <span className="size-2 shrink-0 rounded-[3px]" style={{ background: `var(--home-tile-mix-${(index % 3) + 1})` }} />
              <span className="tabular-nums" style={{ color: HT.text }}>{segment.count}</span>
              <span>{segment.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// Saved outputs

/**
 * The existing symbolic output picture, sized for tiles. It shows the output's
 * type only — outputs carry no values, so it is never presented as data.
 */
export function OutputThumb({ type, height = 56, className = "" }: { type: ProjectDashboardOutputType; height?: number; className?: string }) {
  return (
    <span className={`luxia-home-output-thumb block min-w-0 ${className}`} style={{ ["--thumb-h" as string]: `${height}px` }} title={`${outputTypeLabel(type)} output`}>
      <DashboardOutputPreviewGraphic variant={type} />
    </span>
  );
}

// Actions

/** Inline text action ("View all", "Open") — the one link style every tile uses. */
export function OpenCue({
  label,
  onClick,
  ariaLabel,
  className = "",
}: {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`group/cue relative z-[1] inline-flex shrink-0 items-center gap-1 rounded-[6px] px-1 luxia-type-label-small hover:underline ${HOME_TILE_FOCUS_RING} ${className}`}
      style={{ color: HT.link }}
    >
      {label}
      <LuxiaArrowRightIcon size={12} color="currentColor" aria-hidden className="transition-transform duration-150 group-hover/cue:translate-x-0.5" />
    </button>
  );
}

/** Decorative arrow for whole-card links (Small item tiles). */
export function CardArrow() {
  return (
    <span
      aria-hidden
      className="luxia-home-card-arrow inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-transform duration-150 group-hover/tile:translate-x-0.5"
    >
      <LuxiaArrowRightIcon size={12} color="currentColor" />
    </span>
  );
}

/** A collection's first line: what it is and how it's ordered, with its optional "View all", clear of the corner. */
export function TileSummaryRow({
  summary,
  clearance,
  action,
}: {
  summary: string;
  /** HOME_TILE_CORNER_CLEARANCE value for the tile's density. */
  clearance: string;
  action?: { label: string; ariaLabel?: string; onClick: () => void };
}) {
  return (
    <div className={`flex min-w-0 items-center justify-between gap-3 ${clearance}`}>
      <p className="min-w-0 truncate luxia-type-caption" style={{ color: HT.muted }} title={summary}>{summary}</p>
      {action ? <OpenCue label={action.label} ariaLabel={action.ariaLabel} onClick={action.onClick} /> : null}
    </div>
  );
}

/** Small uppercase label above a group ("DATABASES", "PROJECT NAME 01"). */
export function GroupLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <p className="flex min-w-0 items-center justify-between gap-2 luxia-type-overline-data" style={{ color: HT.muted }}>
      <span className="min-w-0 truncate">{children}</span>
      {aside ? <span className="shrink-0 tabular-nums">{aside}</span> : null}
    </p>
  );
}

/** Row button shared by list compositions. */
export const HOME_TILE_ROW =
  `flex w-full min-w-0 items-center gap-2.5 rounded-[8px] px-1.5 py-1.5 text-left transition-colors hover:bg-[var(--home-tile-row-hover)] ${HOME_TILE_FOCUS_RING}`;

/** Panel-card button shared by card compositions (background as a class so hover can replace it). */
export const HOME_TILE_PANEL_BUTTON =
  `flex w-full min-w-0 rounded-[10px] bg-[var(--home-tile-panel)] text-left transition-colors hover:bg-[var(--home-tile-panel-hover)] ${HOME_TILE_FOCUS_RING}`;
