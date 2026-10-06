/**
 * Optional MFA nudge shown inside the app after sign-in.
 * Local snooze only — future: mfaReminderSnoozedUntil from backend.
 */
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

export function MfaInAppNudge({
  open,
  onSetup,
  onRemindLater,
}: {
  open: boolean;
  onSetup: () => void;
  onRemindLater: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onRemindLater();
      }}
    >
      <DialogContent
        hideCloseButton
        overlayClassName="z-[80] bg-[var(--luxia-opacity-black-40)]"
        className="z-[80] flex max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeader className="shrink-0 space-y-1 px-5 pt-5 text-left">
          <DialogTitle className="luxia-type-title-modal text-left">
            Secure your account
          </DialogTitle>
          <DialogDescription className="luxia-type-body-dense text-left">
            Add multi-factor authentication for an extra layer of protection when you sign in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-col sm:space-x-0">
          <Button type="button" variant="primary" className="w-full" onClick={onSetup}>
            Set up MFA
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onRemindLater}>
            Remind me later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
