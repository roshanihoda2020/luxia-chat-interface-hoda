import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import {
  LuxiaBreadcrumb,
  buildHomeArchiveBreadcrumbItems,
  type LuxiaBreadcrumbHandlers,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { HS } from "./homeSurfaces";

export const BROWSER_PAGE_SIZE = 20;
export const BROWSER_CONTENT_MAX = "1200px";

interface BrowserShellProps {
  title: string;
  description?: string;
  /** Stable archive id for breadcrumb current segment. */
  archiveId?: string;
  onBack: () => void;
  /** Optional page-level action (e.g. New Project). */
  actions?: ReactNode;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: ReactNode;
  sortControls?: ReactNode;
  resultSummary?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  banner?: ReactNode;
}

export function BrowserShell({
  title,
  description,
  archiveId = "archive",
  onBack,
  actions,
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  sortControls,
  resultSummary,
  children,
  footer,
  banner,
}: BrowserShellProps) {
  const crumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onBack,
  };

  return (
    <div className="mx-auto min-w-0 w-full" style={{ maxWidth: BROWSER_CONTENT_MAX }}>
      <LuxiaPageHeader
        contentGap="page"
        title={title}
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={buildHomeArchiveBreadcrumbItems({
              archiveId,
              archiveLabel: title,
            })}
            handlers={crumbHandlers}
          />
        }
        description={
          description ? (
            <p className="luxia-type-body-small" style={{ color: "var(--luxia-neutral-600, #475569)" }}>
              {description}
            </p>
          ) : null
        }
        actions={actions}
      />

      {banner}

      <div className="mb-4 space-y-3">
        <label className="block">
          <span className="sr-only">{searchLabel}</span>
          <div className="relative">
            <Search
              size={16}
              strokeWidth={1.75}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              style={{ color: "var(--luxia-text-muted)" }}
            />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 pl-9"
              style={{
                background: HS.searchBg,
                borderColor: HS.searchBorder,
              }}
            />
          </div>
        </label>

        {filters}

        {(sortControls || resultSummary) ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {sortControls}
            {resultSummary}
          </div>
        ) : null}
      </div>

      {children}
      {footer}
    </div>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      className="rounded-[8px] px-2.5 py-1.5 luxia-type-body-dense-strong outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
      style={{
        color: active ? "var(--luxia-purple-70)" : "var(--luxia-text-muted)",
        background: active ? "var(--luxia-opacity-brand-primary-08)" : "transparent",
      }}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface FilterGroupProps {
  label: string;
  children: ReactNode;
}

export function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-0.5"
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  );
}

interface BrowserPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function BrowserPagination({ page, totalPages, onPageChange }: BrowserPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-[8px] px-3 py-1.5 luxia-type-body-dense-strong outline-none transition-colors enabled:hover:bg-[var(--luxia-opacity-brand-primary-04)] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
        style={{ color: HS.viewAllText }}
      >
        Previous
      </button>
      <span className="luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-[8px] px-3 py-1.5 luxia-type-body-dense-strong outline-none transition-colors enabled:hover:bg-[var(--luxia-opacity-brand-primary-04)] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
        style={{ color: HS.viewAllText }}
      >
        Next
      </button>
    </div>
  );
}
