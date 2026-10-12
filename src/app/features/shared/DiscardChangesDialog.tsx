import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { BusyButton } from "./Loading";
import { LUXIA_DIRTY_STATE_COPY } from "./luxiaSettingsUx";

/**
 * Canonical unsaved-changes / discard dialog.
 *
 * Actions (when all available):
 * - Keep editing — neutral (cancel)
 * - Save and close — primary (optional via onSave)
 * - Discard — destructive
 *
 * Only open when the surface is actually dirty.
 * Prefer this over per-feature Discard* clones.
 */
export function DiscardChangesDialog({
  open,
  onOpenChange,
  title = LUXIA_DIRTY_STATE_COPY.discardTitle,
  description = LUXIA_DIRTY_STATE_COPY.discardDescription,
  keepLabel = LUXIA_DIRTY_STATE_COPY.keepEditing,
  discardLabel = LUXIA_DIRTY_STATE_COPY.discard,
  saveLabel = LUXIA_DIRTY_STATE_COPY.saveAndClose,
  onDiscard,
  onSave,
  saving = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  keepLabel?: string;
  discardLabel?: string;
  saveLabel?: string;
  onDiscard: () => void;
  /** When provided, shows primary “Save and close”. */
  onSave?: () => void | Promise<void>;
  saving?: boolean;
}) {
  const hasSave = typeof onSave === "function";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (saving && !next) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={hasSave ? "sm:justify-between" : undefined}>
          <AlertDialogCancel disabled={saving}>{keepLabel}</AlertDialogCancel>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {hasSave ? (
              <BusyButton
                type="button"
                variant="primary"
                busy={saving}
                busyLabel={saveLabel}
                busyText="Saving…"
                onClick={() => {
                  void onSave();
                }}
              >
                {saveLabel}
              </BusyButton>
            ) : null}
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={() => {
                // Parent onDiscard closes the dialog. Do not call onOpenChange(false)
                // first — that path is reserved for Keep editing / dismiss so hosts
                // can tell abort apart from confirmed discard.
                onDiscard();
              }}
            >
              {discardLabel}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Alias matching product language from the foundation brief. */
export const UnsavedChangesDialog = DiscardChangesDialog;
