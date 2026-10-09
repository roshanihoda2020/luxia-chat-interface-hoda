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
  busy?: boolean;
  busyLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const destructive = tone === "destructive";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (busy && !next) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-[var(--luxia-purple-10)]">
                {description}
              </div>
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription className="sr-only">
              {title}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {impact ? (
          <div className="border-t border-[var(--luxia-border-default)] bg-[var(--luxia-surface)] px-6 py-3">
            <div className="luxia-type-caption text-[var(--luxia-text-secondary)]">
              {impact}
            </div>
          </div>
        ) : null}
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
