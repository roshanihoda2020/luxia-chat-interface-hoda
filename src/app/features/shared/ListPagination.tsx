import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";

export type ListPaginationProps = {
  /** 1-based current page. */
  page: number;
  /** Total number of pages (minimum treated as 1). */
  pageCount: number;
  onPageChange: (page: number) => void;
  /** When set with pageSize, summary shows an item range (e.g. "1–10 of 42"). */
  totalItems?: number;
  pageSize?: number;
  /** Accessible name for the nav landmark. Default: "Pagination" */
  ariaLabel?: string;
  className?: string;
  /**
   * Optional controls rendered before Previous/Next (e.g. PageSizeSelect).
   * Parent owns page-reset when size changes.
   */
  children?: ReactNode;
};

function clampPage(page: number, pageCount: number): number {
  const max = Math.max(1, pageCount);
  if (!Number.isFinite(page)) return 1;
  return Math.min(max, Math.max(1, Math.trunc(page)));
}

function formatSummary(
  page: number,
  pageCount: number,
  totalItems: number | undefined,
  pageSize: number | undefined,
): string {
  if (totalItems != null && pageSize != null && pageSize > 0) {
    if (totalItems <= 0) return "0 of 0";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(totalItems, page * pageSize);
    return `${start.toLocaleString()}–${end.toLocaleString()} of ${totalItems.toLocaleString()}`;
  }
  return `Page ${page} of ${pageCount}`;
}

/**
 * Compact list/table pagination (1-based page API).
 * Previous / Next only — no numbered page strip or server fetching.
 */
export function ListPagination({
  page,
  pageCount,
  onPageChange,
  totalItems,
  pageSize,
  ariaLabel = "Pagination",
  className,
  children,
}: ListPaginationProps) {
  const safePageCount = Math.max(1, Math.trunc(pageCount) || 1);
  const safePage = clampPage(page, safePageCount);
  const hasRange = totalItems != null && pageSize != null;
  const showButtons = safePageCount > 1;

  if (!showButtons && !hasRange && children == null) {
    return null;
  }

  const summary = formatSummary(safePage, safePageCount, totalItems, pageSize);

  function goTo(next: number) {
    const clamped = clampPage(next, safePageCount);
    if (clamped !== page) onPageChange(clamped);
  }

  return (
    <nav
      aria-label={ariaLabel}
      data-slot="luxia-list-pagination"
      className={cn(
        "flex min-w-0 flex-wrap items-center justify-between gap-2",
        className,
      )}
    >
      <p
        className="luxia-type-caption"
        style={{ color: "var(--luxia-text-muted)" }}
      >
        {summary}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {showButtons ? (
          <>
            <Button
              type="button"
              variant="tertiary"
              size="compact"
              disabled={safePage <= 1}
              onClick={() => goTo(safePage - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="tertiary"
              size="compact"
              disabled={safePage >= safePageCount}
              onClick={() => goTo(safePage + 1)}
            >
              Next
            </Button>
          </>
        ) : null}
      </div>
    </nav>
  );
}
