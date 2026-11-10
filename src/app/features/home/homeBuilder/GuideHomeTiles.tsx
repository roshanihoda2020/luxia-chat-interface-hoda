import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, CircleCheck, Clock3, EyeOff, ListChecks, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon } from "@/assets/icons";
import { DiscoverScene, type DiscoverSceneKind } from "../DiscoverScene";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileSurface,
  type HomeTileDensity,
} from "./HomeTileSurface";
import { HOME_TILE_FOCUS_RING } from "./homeTileVisuals";

export interface HomeGuideStep {
  id: string;
  title: string;
  detail: string;
  /** Reflects the user's real data (e.g. they already have a Project). */
  done: boolean;
  action?: { label: string; ariaLabel?: string; onClick: () => void };
  /** Not done yet and not fully in the user's hands: waiting for an earlier step, or for an admin. */
  note?: { kind: "waiting" | "admin"; text: string };
}

export interface HomeGuideExample {
  id: string;
  /** The outcome, in plain words ("Ask questions about a Project"). */
  title: string;
  /** A shorter title for the compact cards ("Ask a Project"). */
  chipLabel?: string;
  /** One short line on what you get ("Answers with their sources"). */
  outcome: string;
  /** The action's name ("Try it", "See Vidgets"). */
  actionLabel: string;
  /** Where the example leads, for the accessible name ("Opens New Chat"). */
  opens: string;
  art: DiscoverSceneKind;
  onTry?: () => void;
  /** Shown instead of the action when the user can't use this example. */
  unavailable?: string;
}

/**
 * How Discover presents itself. The illustration leads at every size:
 * - cards: Full width, first visit. Large illustrated cards, two per row on narrow screens, four on wide ones.
 * - compact: Full width once setup is done. Shorter cards, illustration still first.
 * - grid: Large. Two by two, the illustration filling half of each card.
 * - carousel: Medium. One capability at a time, with previous / next and dots.
 * - mini: Small. One capability at a time beside its illustration.
 */
export type HomeDiscoverLayout = "cards" | "compact" | "grid" | "carousel" | "mini";

function HideGuideButton({ label, onHide }: { label: string; onHide: () => void }) {
  return (
    <Button
      type="button"
      variant="tertiary"
      size="compact"
      onClick={onHide}
      aria-label={`Hide ${label}`}
      data-home-guide-hide=""
      className="luxia-home-touch-target shrink-0"
    >
      <EyeOff size={14} strokeWidth={2} aria-hidden />
      Hide
    </Button>
  );
}

function SetupProgressIcon({ complete }: { complete: boolean }) {
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
      style={{ background: "var(--luxia-opacity-brand-secondary-12)", color: "var(--luxia-purple-60)" }}
    >
      {complete ? <CircleCheck size={18} strokeWidth={2} /> : <ListChecks size={18} strokeWidth={2} />}
    </span>
  );
}

function SetupProgress({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3" data-home-guide-progress={done}>
      <SetupProgressIcon complete={false} />
      <div className="min-w-0 w-full max-w-[320px]">
        <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{done} of {total} completed</p>
        <div
          role="progressbar"
          aria-label="Get started progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${done} of ${total} steps completed`}
          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "var(--luxia-opacity-brand-secondary-16)" }}
        >
          <div
            className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300"
            style={{ width: `${percent}%`, background: "var(--luxia-purple-60)" }}
          />
        </div>
      </div>
    </div>
  );
}

export function GetStartedHomeTile({
  density,
  steps,
  onHide,
}: {
  density: HomeTileDensity;
  steps: HomeGuideStep[];
  onHide: () => void;
}) {
  const done = steps.filter((step) => step.done).length;
  if (steps.length > 0 && done === steps.length) {
    return (
      <HomeTileSurface
        density={density}
        label="Get started with Luxia"
        corner={{ icon: (size) => <ListChecks size={size} strokeWidth={2} /> }}
      >
        <div className={`flex min-w-0 flex-wrap items-center gap-3 ${HOME_TILE_CORNER_CLEARANCE[density]}`} data-home-guide-complete="">
          <SetupProgressIcon complete />
          <p className="min-w-[12rem] flex-1 luxia-type-body-dense" style={{ color: HT.secondary }}>
            <span className="font-semibold" style={{ color: "var(--luxia-purple-70)" }}>You've covered the basics.</span>{" "}
            Your data, a Project, a Constellation and a Chat are all set up.
          </p>
          <HideGuideButton label="Get started" onHide={onHide} />
        </div>
      </HomeTileSurface>
    );
  }
  return (
    <HomeTileSurface
      density={density}
      label="Get started with Luxia"
      corner={{ icon: (size) => <ListChecks size={size} strokeWidth={2} /> }}
    >
      <div className={`flex min-w-0 items-center justify-between gap-3 ${HOME_TILE_CORNER_CLEARANCE[density]}`}>
        <SetupProgress done={done} total={steps.length} />
        <HideGuideButton label="Get started" onHide={onHide} />
      </div>
      <ol className="mt-3 grid min-w-0 gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {steps.map((step, index) => (
          <li
            key={step.id}
            data-home-guide-step={step.id}
            className="flex min-w-0 flex-col gap-1.5 rounded-[var(--luxia-radius-12)] border px-3.5 py-3"
            style={{ background: "var(--luxia-surface)", borderColor: "var(--luxia-border-default)" }}
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full luxia-type-caption font-bold"
                style={step.done
                  ? { background: "var(--luxia-success)", color: "var(--luxia-text-inverse)" }
                  : { border: "2px solid var(--luxia-purple-20)", color: "var(--luxia-purple-60)" }}
              >
                {step.done ? <Check size={14} strokeWidth={3} /> : index + 1}
              </span>
              <span className="sr-only">{step.done ? "Done:" : `Step ${index + 1}:`}</span>
              <span className="min-w-0 luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>
                {step.title}
              </span>
            </span>
            <span className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{step.detail}</span>
            {!step.done && step.note ? (
              <span
                className="inline-flex items-start gap-1.5 luxia-type-caption"
                style={{ color: step.note.kind === "admin" ? "var(--luxia-purple-60)" : "var(--luxia-text-muted)" }}
                data-home-guide-note={step.note.kind}
              >
                {step.note.kind === "admin"
                  ? <ShieldCheck size={13} strokeWidth={2.25} aria-hidden className="mt-0.5 shrink-0" />
                  : <Clock3 size={13} strokeWidth={2.25} aria-hidden className="mt-0.5 shrink-0" />}
                <span><span className="font-semibold">{step.note.kind === "admin" ? "Needs an admin: " : "Waiting: "}</span>{step.note.text}</span>
              </span>
            ) : null}
            {step.action ? (
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={step.action.onClick}
                aria-label={step.action.ariaLabel ?? step.action.label}
                className="mt-auto self-start"
              >
                {step.action.label}
              </Button>
            ) : null}
          </li>
        ))}
      </ol>
    </HomeTileSurface>
  );
}

function exampleLabel(example: HomeGuideExample) {
  return example.unavailable
    ? `${example.title}. ${example.outcome} ${example.unavailable}`
    : `${example.actionLabel}: ${example.title}. ${example.outcome} ${example.opens}`;
}

function ActionLabel({ example }: { example: HomeGuideExample }) {
  const disabled = !example.onTry || Boolean(example.unavailable);
  return (
    <span className="inline-flex items-center gap-1 luxia-type-label-small" style={{ color: disabled ? HT.secondary : HT.link }}>
      {disabled ? <Lock size={12} strokeWidth={2.25} aria-hidden /> : null}
      {disabled ? example.unavailable ?? "Not available yet" : example.actionLabel}
      {disabled ? null : (
        <LuxiaArrowRightIcon size={12} color="currentColor" aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5" />
      )}
    </span>
  );
}

/** One capability as an illustrated preview: the picture first, one title, one action. The whole card is the action. */
function DiscoverCard({
  example,
  shape,
}: {
  example: HomeGuideExample;
  /** stacked: picture above the words. side: picture beside them. */
  shape:
    | { kind: "stacked"; art: string; showOutcome: boolean; short?: boolean; artFills?: boolean }
    | { kind: "side"; art: string; textClass?: string; short?: boolean };
}) {
  const disabled = !example.onTry || Boolean(example.unavailable);
  const title = shape.short ? example.chipLabel ?? example.title : example.title;
  return (
    <button
      type="button"
      onClick={disabled ? undefined : example.onTry}
      aria-disabled={disabled || undefined}
      aria-label={exampleLabel(example)}
      title={example.unavailable ?? example.opens}
      data-home-guide-example={example.id}
      className={`group flex h-full w-full min-w-0 rounded-[14px] p-2 text-left transition-colors ${HOME_TILE_FOCUS_RING} ${
        shape.kind === "stacked" ? "flex-col gap-2.5" : "items-stretch gap-3"
      } ${disabled ? "cursor-default" : "hover:bg-[var(--home-tile-panel-hover)]"}`}
      style={{ background: HT.panel, border: `1px solid ${HT.chipBorder}` }}
    >
      <DiscoverScene kind={example.art} className={shape.art} />
      <span
        className={`flex min-w-0 flex-col ${
          shape.kind === "stacked"
            ? `gap-1 px-1.5 pb-1.5 ${shape.artFills ? "shrink-0" : "flex-1"}`
            : `flex-1 justify-center gap-1.5 py-1 pr-1 ${shape.textClass ?? ""}`
        }`}
      >
        <span className="line-clamp-2 luxia-type-body-dense-strong" style={{ color: HT.title }}>{title}</span>
        {(shape.kind === "side" || shape.showOutcome) && !example.unavailable ? (
          <span
            className={`luxia-type-caption ${shape.kind === "side" ? (shape.short ? "hidden @[210px]:block" : "hidden @[460px]:block") : ""}`}
            style={{ color: HT.muted }}
            data-home-guide-description=""
          >
            {example.outcome}
          </span>
        ) : null}
        <span className={shape.kind === "stacked" ? "mt-auto pt-1" : ""}><ActionLabel example={example} /></span>
      </span>
    </button>
  );
}

/** Medium and Small: one capability at a time, with previous / next and a dot for each. */
function DiscoverCarousel({ examples, size, onHide }: { examples: HomeGuideExample[]; size: "medium" | "small"; onHide?: () => void }) {
  const [index, setIndex] = useState(0);
  const count = examples.length;
  const current = examples[Math.min(index, count - 1)];
  if (!current) return null;
  const go = (step: number) => setIndex((value) => (value + step + count) % count);
  const navButton = `inline-flex size-7 items-center justify-center rounded-full transition-colors hover:bg-[var(--home-tile-row-hover)] ${HOME_TILE_FOCUS_RING}`;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2" data-home-discover-carousel="">
      <div className="min-h-0 flex-1" aria-live="polite">
        <DiscoverCard
          key={current.id}
          example={current}
          shape={size === "medium"
            ? { kind: "stacked", art: "min-h-0 w-full flex-1", showOutcome: true, artFills: true }
            : { kind: "side", art: "h-full w-[48%] shrink-0", textClass: HOME_TILE_CORNER_CLEARANCE.small, short: true }}
        />
      </div>
      {count > 1 ? (
        <div className="flex shrink-0 items-center justify-between gap-2">
          <span className="flex items-center gap-1.5" role="group" aria-label="Choose a capability">
            {examples.map((example, position) => (
              <button
                key={example.id}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Show ${example.title}`}
                aria-current={position === index ? "true" : undefined}
                className={`h-2 rounded-full transition-all ${HOME_TILE_FOCUS_RING} ${position === index ? "w-5" : "w-2"}`}
                style={{ background: position === index ? HT.link : HT.chipBorder }}
              />
            ))}
          </span>
          <span className="flex items-center gap-0.5">
            <button type="button" onClick={() => go(-1)} aria-label="Previous capability" className={navButton} style={{ color: HT.link }}>
              <ChevronLeft size={16} strokeWidth={2.25} aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next capability" className={navButton} style={{ color: HT.link }}>
              <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
            </button>
            {onHide ? (
              <button
                type="button"
                onClick={onHide}
                aria-label="Hide Discover"
                title="Hide"
                data-home-guide-hide=""
                className={navButton}
                style={{ color: HT.muted }}
              >
                <EyeOff size={15} strokeWidth={2} aria-hidden />
              </button>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Discover what Luxia can do: the capabilities that work today as illustrated
 * previews, each opening the real feature. A Home Tile like any other: it can
 * be moved, resized, restyled, hidden and removed.
 */
export function TryExampleHomeTile({
  density,
  examples,
  onHide,
  layout = "grid",
}: {
  density: HomeTileDensity;
  examples: HomeGuideExample[];
  onHide: () => void;
  layout?: HomeDiscoverLayout;
}) {
  const corner = { icon: (size: number) => <Sparkles size={size} strokeWidth={2} /> };
  const carousel = layout === "carousel" || layout === "mini";
  return (
    <HomeTileSurface density={density} label="Discover what Luxia can do" corner={corner} className="@container">
      {layout === "mini" ? null : (
        <div className={`flex min-w-0 items-center justify-between gap-3 ${HOME_TILE_CORNER_CLEARANCE[density]}`}>
          <p className="min-w-0 truncate luxia-type-caption font-semibold" style={{ color: HT.secondary }}>
            Each one opens the real feature.
          </p>
          <HideGuideButton label="Discover" onHide={onHide} />
        </div>
      )}
      {carousel ? (
        <div className={`${layout === "mini" ? "" : "mt-3"} flex min-h-0 min-w-0 flex-1 flex-col`} data-home-discover-layout={layout}>
          <DiscoverCarousel examples={examples} size={layout === "carousel" ? "medium" : "small"} onHide={layout === "mini" ? onHide : undefined} />
        </div>
      ) : (
        <ul
          className={`mt-3 grid min-w-0 gap-3 ${
            layout === "grid" ? "min-h-0 flex-1 grid-cols-2 grid-rows-2" : examples.length === 3 ? "grid-cols-1 @lg:grid-cols-3" : "grid-cols-2 @3xl:grid-cols-4"
          }`}
          aria-label="Discover what Luxia can do"
          data-home-discover-layout={layout}
        >
          {examples.map((example) => (
            <li key={example.id} className="min-h-0 min-w-0">
              <DiscoverCard
                example={example}
                shape={layout === "grid"
                  ? { kind: "side", art: "h-full w-[56%] shrink-0" }
                  : layout === "compact"
                    ? { kind: "stacked", art: "aspect-[2/1] w-full", showOutcome: true, short: true }
                    : { kind: "stacked", art: "aspect-[3/2] w-full", showOutcome: true }}
              />
            </li>
          ))}
        </ul>
      )}
    </HomeTileSurface>
  );
}

/** A hidden Guide tile, in its own place. Hiding is not removing: Show brings the tile back here. */
export function HiddenGuideBar({ label, showLabel, onShow }: { label: string; showLabel: string; onShow: () => void }) {
  return (
    <div
      data-home-guide-hidden=""
      className="flex min-w-0 flex-wrap items-center gap-3 rounded-[var(--luxia-radius-12)] border border-dashed px-4 py-2.5"
      style={{ background: "var(--luxia-surface)", borderColor: "var(--luxia-opacity-brand-secondary-32)" }}
    >
      <EyeOff size={16} strokeWidth={2} aria-hidden style={{ color: "var(--luxia-purple-60)" }} />
      <p className="min-w-0 flex-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
        <span className="font-semibold" style={{ color: "var(--luxia-purple-70)" }}>{label} is hidden.</span>{" "}
        Your other tiles stay where they are.
      </p>
      <Button type="button" variant="secondary" size="compact" onClick={onShow}>
        {showLabel}
      </Button>
    </div>
  );
}
