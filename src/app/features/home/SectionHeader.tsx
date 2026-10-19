import type { ReactNode } from "react";
import { HS, HI } from "./homeSurfaces";
import { ViewAllAction } from "./ViewAllAction";

interface SectionHeaderProps {
  title: string;
  titleId?: string;
  icon: ReactNode;
  iconColor: string;
  /** Optional subtle total beside the title, e.g. "Recent projects · 9". */
  count?: number;
  countSingular?: string;
  countPlural?: string;
  /** Optional subtle helper under the title. */
  description?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  viewAllAriaLabel?: string;
  /** Optional trailing controls shown before View all. */
  actions?: ReactNode;
}

export function SectionHeader({
  title,
  titleId,
  icon,
  iconColor,
  count,
  countSingular = "item",
  countPlural = "items",
  description,
  onViewAll,
  viewAllLabel = "View all",
  viewAllAriaLabel,
  actions,
}: SectionHeaderProps) {
  const hasTrailing = Boolean(actions) || Boolean(onViewAll);
  const showCount = typeof count === "number" && count >= 0;
  const headingLabel = showCount
    ? `${title}, ${count} ${count === 1 ? countSingular : countPlural}`
    : undefined;

  return (
    <div className={`${HI.sectionHeadingGap} flex flex-wrap items-center justify-between gap-x-4 gap-y-2`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center" style={{ color: iconColor }} aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          <h2
            id={titleId}
            className="luxia-type-heading-h3"
            style={{ color: HS.sectionHeading, letterSpacing: "-0.02em" }}
            aria-label={headingLabel}
          >
            {title}
            {showCount ? (
              <span
                className="font-normal tabular-nums"
                style={{ color: "var(--luxia-text-secondary)" }}
                aria-hidden
              >
                {` · ${count}`}
              </span>
            ) : null}
          </h2>
          {description ? (
            <p
              className="mt-0.5 luxia-type-caption"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {hasTrailing ? (
        <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-2">
          {actions}
          {onViewAll ? (
            <ViewAllAction
              label={viewAllLabel}
              ariaLabel={viewAllAriaLabel ?? `${viewAllLabel} — ${title}`}
              onClick={onViewAll}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
