import type { ReactNode } from "react";
import { cn } from "@/app/components/ui/utils";
import { RetryAction } from "@/app/features/shared/RetryAction";

export type ListErrorStateProps = {
  /** Short failure headline for the list/table region. */
  title: string;
  /** Optional supporting detail. */
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  retryBusy?: boolean;
  className?: string;
};

/**
 * List/table content-region failure shell (not a full-page error, modal, or InlineAlert).
 * Pair with RetryAction for recoverable load/import failures.
 */
export function ListErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  retryBusy = false,
  className,
}: ListErrorStateProps) {
  return (
    <div
      role="alert"
      data-slot="luxia-list-error-state"
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
        style={{ color: "var(--luxia-error-70)" }}
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
      {onRetry ? (
        <div className="mt-3 flex justify-center">
          <RetryAction
            onRetry={onRetry}
            label={retryLabel}
            busy={retryBusy}
          />
        </div>
      ) : null}
    </div>
  );
}
