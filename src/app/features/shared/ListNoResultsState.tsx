import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";

export type ListNoResultsStateProps = {
  /** No-match headline, e.g. "No entries match your search." */
  title: string;
  description?: ReactNode;
  /** Optional clear/reset; caller owns filter/search state. */
  onClear?: () => void;
  /** Accessible clear control label. Default: "Clear filters" */
  clearLabel?: string;
  className?: string;
};

/**
 * Quiet list/table region when data exists but search/filters match nothing.
 * Not for true-empty collections — use ListEmptyState.
 */
export function ListNoResultsState({
  title,
  description,
  onClear,
  clearLabel = "Clear filters",
  className,
}: ListNoResultsStateProps) {
  return (
    <div
      data-slot="luxia-list-no-results-state"
      className={cn(
        "rounded-[12px] border px-4 py-5 text-center",
        className,
      )}
      style={{
        borderColor: "var(--luxia-border-default)",
        background: "var(--luxia-surface-subtle)",
      }}
    >
      <p
        className="luxia-type-body-default-strong"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {title}
      </p>
      {description != null && description !== "" ? (
        <div
          className="mt-1 luxia-type-body-dense"
          style={{ color: "var(--luxia-text-secondary)" }}
        >
          {description}
        </div>
      ) : null}
      {onClear ? (
        <Button
          type="button"
          variant="outline"
          size="compact"
          className="mt-3"
          onClick={onClear}
        >
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}
