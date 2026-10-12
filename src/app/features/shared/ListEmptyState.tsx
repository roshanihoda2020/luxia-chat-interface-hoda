import type { ReactNode } from "react";
import { cn } from "@/app/components/ui/utils";

export type ListEmptyStateProps = {
  /** True-empty collection headline, e.g. "No knowledge entries yet". */
  title: string;
  description?: ReactNode;
  /** Optional primary action (e.g. Add). Caller owns behavior. */
  action?: ReactNode;
  className?: string;
};

/**
 * Quiet list/table region for a genuinely empty collection.
 * Not for search/filter misses — use ListNoResultsState.
 */
export function ListEmptyState({
  title,
  description,
  action,
  className,
}: ListEmptyStateProps) {
  return (
    <div
      data-slot="luxia-list-empty-state"
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
      {action ? (
        <div className="mt-3 flex justify-center">{action}</div>
      ) : null}
    </div>
  );
}
