import type { ReactNode } from "react";
import { HS, HI } from "./homeSurfaces";
import { ViewAllAction } from "./ViewAllAction";

interface SectionHeaderProps {
  title: string;
  titleId?: string;
  icon: ReactNode;
  iconColor: string;
  onViewAll?: () => void;
  viewAllAriaLabel?: string;
}

export function SectionHeader({
  title,
  titleId,
  icon,
  iconColor,
  onViewAll,
  viewAllAriaLabel,
}: SectionHeaderProps) {
  return (
    <div className={`${HI.sectionHeadingGap} flex flex-wrap items-center justify-between gap-x-4 gap-y-2`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center" style={{ color: iconColor }} aria-hidden>
          {icon}
        </span>
        <h2
          id={titleId}
          className="luxia-type-heading-h3"
          style={{ color: HS.sectionHeading, letterSpacing: "-0.02em" }}
        >
          {title}
        </h2>
      </div>
      {onViewAll ? (
        <ViewAllAction
          label="View all"
          ariaLabel={viewAllAriaLabel ?? `View all ${title}`}
          onClick={onViewAll}
        />
      ) : null}
    </div>
  );
}
