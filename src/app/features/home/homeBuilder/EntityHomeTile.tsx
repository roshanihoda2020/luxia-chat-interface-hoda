import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  HomeTileFacts,
  HomeTileIcon,
  HomeTileOverline,
  HomeTileSurface,
  HomeTileText,
  HomeTileTitleAction,
  type HomeTileDensity,
} from "./HomeTileSurface";

export interface EntityHomeTileAction {
  label: string;
  ariaLabel?: string;
  onClick: () => void;
}

export interface EntityHomeTileProps {
  density: HomeTileDensity;
  /** Renders the entity icon at the given pixel size. */
  icon: (size: number) => ReactNode;
  typeLabel: string;
  status?: string;
  title: string;
  /** Primary navigation; the whole card at Small, the title + first button otherwise. */
  primary: EntityHomeTileAction;
  secondary?: EntityHomeTileAction;
  /** One essential line at Small (e.g. "Project name 01 · DB"). */
  summary?: string;
  /** Context line under the title from Medium up (e.g. owning Project). */
  context?: string;
  /** Short descriptive text from Medium up; omitted when missing. */
  description?: string;
  /** Muted metadata line from Medium up (e.g. "Updated 2h ago"). */
  meta?: string;
  /** Small labelled chips (type, ownership, status). */
  chips?: string[];
  /** Real facts for the Large side panel. */
  facts?: Array<{ label: string; value: string }>;
  /** Real related content (e.g. latest outputs). Medium shows it under the text; Large beside it. */
  related?: ReactNode;
}

function Chips({ chips }: { chips: string[] }) {
  return (
    <ul className="flex min-w-0 flex-wrap gap-1.5" aria-label="Details">
      {chips.map((chip) => (
        <li
          key={chip}
          className="max-w-full truncate rounded-[6px] px-1.5 py-0.5 luxia-type-caption"
          style={{
            color: "var(--luxia-text-secondary)",
            background: "var(--luxia-opacity-brand-primary-04)",
            border: "1px solid var(--luxia-opacity-brand-primary-12)",
          }}
        >
          {chip}
        </li>
      ))}
    </ul>
  );
}

function Actions({ primary, secondary }: { primary: EntityHomeTileAction; secondary?: EntityHomeTileAction }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Button type="button" variant="primary" size="compact" onClick={primary.onClick} aria-label={primary.ariaLabel}>
        {primary.label}
      </Button>
      {secondary ? (
        <Button type="button" variant="secondary" size="compact" onClick={secondary.onClick} aria-label={secondary.ariaLabel}>
          {secondary.label}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Shared layout for specific-item Home Tiles (Galaxy, Chat, Constellation,
 * Data Source, Dashboard). Same structure at each size, content per entity:
 * Small — icon, type, name, one summary line; whole card navigates.
 * Medium — identity, name, context, description / chips, related, actions.
 * Large — Medium's text column plus a facts or related panel beside it.
 */
export function EntityHomeTile({
  density,
  icon,
  typeLabel,
  status,
  title,
  primary,
  secondary,
  summary,
  context,
  description,
  meta,
  chips,
  facts,
  related,
}: EntityHomeTileProps) {
  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={`${typeLabel} ${title}`} className="justify-center">
        <div className="flex min-w-0 items-center gap-3">
          <HomeTileIcon size="sm">{icon(18)}</HomeTileIcon>
          <div className="min-w-0 flex-1">
            <HomeTileOverline status={status}>{typeLabel}</HomeTileOverline>
            <HomeTileTitleAction
              title={title}
              onOpen={primary.onClick}
              ariaLabel={primary.ariaLabel ?? `${primary.label}: ${title}`}
              stretched
              size="dense"
            />
            {summary ? <HomeTileText>{summary}</HomeTileText> : null}
          </div>
          <ChevronRight
            size={16}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 transition-transform duration-150 group-hover/tile:translate-x-0.5"
            style={{ color: "var(--luxia-purple-60)" }}
          />
        </div>
      </HomeTileSurface>
    );
  }

  const header = (
    <div className="flex min-w-0 items-center gap-3">
      <HomeTileIcon>{icon(20)}</HomeTileIcon>
      <HomeTileOverline status={status}>{typeLabel}</HomeTileOverline>
    </div>
  );

  const text = (
    <div className="min-w-0 space-y-1.5">
      <HomeTileTitleAction
        title={title}
        onOpen={primary.onClick}
        ariaLabel={primary.ariaLabel ?? `${primary.label}: ${title}`}
        lines={density === "large" ? 1 : 2}
      />
      {context ? <HomeTileText>{context}</HomeTileText> : null}
      {description ? <HomeTileText lines={2}>{description}</HomeTileText> : null}
      {chips && chips.length > 0 ? <div className="pt-1"><Chips chips={chips} /></div> : null}
      {meta ? <HomeTileText tone="muted">{meta}</HomeTileText> : null}
    </div>
  );

  const aside = facts && facts.length > 0
    ? (
      <div className="min-w-0 self-start rounded-[10px] px-3.5 py-3" style={{ background: "var(--luxia-opacity-brand-primary-04)" }}>
        <HomeTileFacts facts={facts} />
      </div>
    )
    : related;

  return (
    <HomeTileSurface density={density} label={`${typeLabel} ${title}`} className="@container">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {header}
        {density === "large" && aside ? (
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 @md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] @md:gap-5">
            {text}
            {aside}
          </div>
        ) : (
          <>
            {text}
            {related ? <div className="min-w-0">{related}</div> : null}
          </>
        )}
      </div>
      <div className="mt-4">
        <Actions primary={primary} secondary={secondary} />
      </div>
    </HomeTileSurface>
  );
}
