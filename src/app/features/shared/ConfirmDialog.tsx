import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { BusyButton } from "./Loading";

/**
 * Canonical Luxia confirmation dialog.
 *
 * - `tone="neutral"` — non-destructive confirm (primary action)
 * - `tone="destructive"` — delete/remove/irreversible (destructive action)
 * - `chrome="standard"` — dark structured header (default)
 * - `chrome="compact"` — light title/body surface for nested confirms over an open feature modal
 *
 * Optional `impact` for dependency/consequence callouts.
 * Migrate page-specific confirms gradually; do not fork visual variants.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  impact,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "neutral",
  chrome = "standard",
  busy = false,
  busyLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** Optional consequence / dependency block under the description. */
  impact?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "neutral" | "destructive";
  /**
   * `standard` — dark header band (feature confirms).
   * `compact` — title + body on the light surface (lightweight nested discard/confirm).
   */
  chrome?: "standard" | "compact";
  busy?: boolean;
  busyLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const destructive = tone === "destructive";
  const compact = chrome === "compact";
  /** When impact is present, primary copy + impact sit in the light body for scan hierarchy. */
  const bodyWithImpact = Boolean(impact) && !compact;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (busy && !next) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className={compact ? "sm:max-w-md" : undefined}>
        {compact ? (
          <div className="space-y-2 bg-[var(--luxia-surface)] px-6 pt-5 pb-4">
            <AlertDialogTitle className="text-[var(--luxia-text-primary)]">
              {title}
            </AlertDialogTitle>
            {description ? (
              <AlertDialogDescription asChild>
                <div className="space-y-2 luxia-type-body-dense text-[var(--luxia-text-secondary)]">
                  {description}
                </div>
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription className="sr-only">{title}</AlertDialogDescription>
            )}
          </div>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              {!bodyWithImpact && description ? (
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-[var(--luxia-purple-10)]">
                    {description}
                  </div>
                </AlertDialogDescription>
              ) : !bodyWithImpact ? (
                <AlertDialogDescription className="sr-only">
                  {title}
                </AlertDialogDescription>
              ) : null}
            </AlertDialogHeader>
            {bodyWithImpact ? (
              <AlertDialogDescription asChild>
                <div className="space-y-3 border-t border-[var(--luxia-border-default)] bg-[var(--luxia-surface)] px-6 py-4">
                  {description ? (
                    <div className="space-y-1.5 luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {description}
                    </div>
                  ) : null}
                  <div className="space-y-1.5">{impact}</div>
                </div>
              </AlertDialogDescription>
            ) : null}
          </>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <BusyButton
            type="button"
            variant={destructive ? "destructive" : "primary"}
            busy={busy}
            busyLabel={busyLabel ?? confirmLabel}
            busyText={busyLabel ?? (destructive ? "Working…" : "Working…")}
            onClick={() => {
              void onConfirm();
            }}
          >
            {confirmLabel}
          </BusyButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
