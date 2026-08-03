import type { ReactNode, SelectHTMLAttributes } from "react";
import { useId } from "react";
import { Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
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

export const BROWSER_COLLECTION_GRID =
  "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18.5rem),1fr))] items-stretch";

export const WORK_ARCHIVE_GRID =
  "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:items-stretch";

const FILTER_LABEL_CLASS = "luxia-type-caption";
const FILTER_LABEL_STYLE = {
  color: "var(--luxia-text-muted)",
  letterSpacing: "0.04em",
} as const;

interface BrowserShellProps {
  title: string;
  description?: string;
  archiveId?: string;
  onBack: () => void;
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
  controlsSpacing?: "default" | "compact";
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
  controlsSpacing = "default",
}: BrowserShellProps) {
  const crumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onBack,
  };
  const controlsClass = controlsSpacing === "compact"
    ? "mb-4 space-y-4"
    : "mb-4 space-y-4";

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

      <div className={controlsClass}>
        <label className="block w-full max-w-full">
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
              className="h-10 w-full pl-9"
              style={{
                background: HS.searchBg,
                borderColor: HS.searchBorder,
              }}
            />
          </div>
        </label>

        {filters}

        {(sortControls || resultSummary) ? (
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
            <div className="min-w-0">{sortControls}</div>
            {resultSummary ? (
              <div className="min-w-0 shrink-0 sm:ml-auto">{resultSummary}</div>
            ) : null}
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
  className?: string;
}

export function FilterChip({ active, onClick, children, className = "" }: FilterChipProps) {
  return (
    <button
      type="button"
      className={`h-8 rounded-[6px] px-2.5 luxia-type-body-dense-strong outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] ${className}`.trim()}
      style={{
        color: active ? "var(--luxia-purple-70)" : "var(--luxia-text-secondary)",
        background: active ? "var(--luxia-opacity-brand-primary-08)" : "transparent",
      }}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function FilterField({
  label,
  children,
  className = "",
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`.trim()}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={FILTER_LABEL_CLASS} style={FILTER_LABEL_STYLE}>
          {label}
        </label>
      ) : (
        <span className={FILTER_LABEL_CLASS} style={FILTER_LABEL_STYLE}>
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

interface FilterGroupProps {
  label: string;
  showLabel?: boolean;
  children: ReactNode;
}

export function FilterGroup({ label, showLabel = false, children }: FilterGroupProps) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-1"
      role="group"
      aria-label={label}
    >
      {showLabel ? (
        <span className={`mr-1 shrink-0 ${FILTER_LABEL_CLASS}`} style={FILTER_LABEL_STYLE}>
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}

export function SegmentedFilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="inline-flex h-8 max-w-full flex-wrap items-center gap-0.5 rounded-[8px] p-0.5"
      role="group"
      aria-label={label}
      style={{
        background: "var(--luxia-surface-subtle)",
        border: "1px solid var(--luxia-border-default)",
      }}
    >
      {children}
    </div>
  );
}

export function CollectionFilterBar({
  children,
  trailing,
  className = "",
}: {
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end gap-x-4 gap-y-3 ${className}`.trim()}>
      {children}
      {trailing ? (
        <div className="ml-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 self-end">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

export function FilterToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

export function FilterToolbarRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end gap-x-4 gap-y-3 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function CompactFilterToolbar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end gap-x-4 gap-y-3 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function ResultsCount({ children }: { children: ReactNode }) {
  return (
    <p
      className="luxia-type-body-small"
      style={{ color: "var(--luxia-text-muted)" }}
      aria-live="polite"
    >
      {children}
    </p>
  );
}

export function FilteredEmptyState({
  title,
  description = "Try another search term or filter combination.",
  onClear,
}: {
  title: string;
  description?: string;
  onClear?: () => void;
}) {
  return (
    <div
      className="rounded-[12px] border px-4 py-5 text-center"
      style={{
        borderColor: "var(--luxia-border-default)",
        background: "var(--luxia-surface-subtle)",
      }}
    >
      <p className="luxia-type-body-default-strong" style={{ color: "var(--luxia-text-primary)" }}>
        {title}
      </p>
      <p className="mt-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
        {description}
      </p>
      {onClear ? (
        <Button
          type="button"
          variant="outline"
          size="compact"
          className="mt-3"
          onClick={onClear}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

const FILTER_SELECT_CLASS =
  "h-8 w-full min-w-[9.5rem] max-w-full rounded-[8px] border px-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

const FILTER_SELECT_STYLE = {
  borderColor: "var(--luxia-border-default)",
  background: "var(--luxia-surface)",
  color: "var(--luxia-text-primary)",
} as const;

interface BrowserFilterSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  label: string;
  labelVisible?: boolean;
}

export function BrowserFilterSelect({
  label,
  labelVisible = true,
  children,
  id,
  ...props
}: BrowserFilterSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className={labelVisible ? FILTER_LABEL_CLASS : "sr-only"}
        style={labelVisible ? FILTER_LABEL_STYLE : undefined}
      >
        {label}
      </label>
      <select
        {...props}
        id={selectId}
        aria-label={props["aria-label"] ?? label}
        className={FILTER_SELECT_CLASS}
        style={FILTER_SELECT_STYLE}
      >
        {children}
      </select>
    </div>
  );
}

interface BrowserSortSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  "aria-label": string;
  labelVisible?: boolean;
  label?: string;
}

export function BrowserSortSelect({
  labelVisible = true,
  label = "Sort",
  children,
  id,
  ...props
}: BrowserSortSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className={labelVisible ? FILTER_LABEL_CLASS : "sr-only"}
        style={labelVisible ? FILTER_LABEL_STYLE : undefined}
      >
        {labelVisible ? label : props["aria-label"]}
      </label>
      <select
        {...props}
        id={selectId}
        className={FILTER_SELECT_CLASS}
        style={FILTER_SELECT_STYLE}
      >
        {children}
      </select>
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
