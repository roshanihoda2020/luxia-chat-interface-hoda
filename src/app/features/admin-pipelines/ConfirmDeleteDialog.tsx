import type { ReactNode } from "react";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";

/**
 * Thin wrapper around the shared ConfirmDialog for admin-pipeline deletes.
 * Prefer importing ConfirmDialog directly in new call sites.
 */
export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      tone="destructive"
      busy={busy}
      busyLabel="Deleting…"
      onConfirm={onConfirm}
    />
  );
}
