import { Check, EyeOff, ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LuxiaCharacter, type LuxiaCharacterRole } from "../LuxiaCharacter";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileSurface,
  type HomeTileDensity,
} from "./HomeTileSurface";
import { CardArrow } from "./homeTileVisuals";

export interface HomeGuideStep {
  id: string;
  title: string;
  detail: string;
  /** Reflects the user's real data (e.g. they already have a Project). */
  done: boolean;
  action?: { label: string; ariaLabel?: string; onClick: () => void };
}

export interface HomeGuideExample {
  id: string;
  title: string;
  detail: string;
  /** Where the example leads, in plain words ("Opens New Chat"). */
  opens: string;
  character: LuxiaCharacterRole;
  onTry?: () => void;
  /** Shown instead of Try it when the user can't use this example. */
  unavailable?: string;
}

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
          <LuxiaCharacter role="guide" size={44} />
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
        <div className="flex min-w-0 items-center gap-3">
          <LuxiaCharacter role="guide" size={44} />
          <p className="luxia-type-body-dense" style={{ color: HT.secondary }}>
            <span className="font-semibold" style={{ color: "var(--luxia-purple-70)" }}>{done} of {steps.length} done.</span>{" "}
            Each step opens the place where you do it.
          </p>
        </div>
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

export function TryExampleHomeTile({
  density,
  examples,
  onHide,
}: {
  density: HomeTileDensity;
  examples: HomeGuideExample[];
  onHide: () => void;
}) {
  return (
    <HomeTileSurface
      density={density}
      label="Try an example"
      corner={{ icon: (size) => <Sparkles size={size} strokeWidth={2} /> }}
    >
      <div className={`flex min-w-0 items-center justify-between gap-3 ${HOME_TILE_CORNER_CLEARANCE[density]}`}>
        <p className="luxia-type-caption font-semibold" style={{ color: HT.secondary }}>
          Learn by doing: each example opens the real feature.
        </p>
        <HideGuideButton label="Try an example" onHide={onHide} />
      </div>
      <ul className="mt-3 grid min-w-0 gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {examples.map((example) => (
          <li key={example.id} data-home-guide-example={example.id} className="min-w-0">
            <div
              className="flex h-full min-w-0 flex-wrap items-center gap-3 rounded-[var(--luxia-radius-12)] border px-3 py-3"
              style={{ background: "var(--luxia-surface)", borderColor: "var(--luxia-border-default)" }}
            >
              <LuxiaCharacter role={example.character} size={52} />
              <span className="min-w-[10rem] flex-1">
                <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>
                  {example.title}
                </span>
                <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                  {example.unavailable ?? `${example.detail} · ${example.opens}`}
                </span>
              </span>
              {example.onTry && !example.unavailable ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  onClick={example.onTry}
                  aria-label={`Try it: ${example.title}`}
                  className="shrink-0"
                >
                  Try it
                  <CardArrow />
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
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
