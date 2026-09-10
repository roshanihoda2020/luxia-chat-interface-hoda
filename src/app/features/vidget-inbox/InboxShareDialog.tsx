import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Switch } from "@/app/components/ui/switch";
import { describeShareScope, sessionIdsForShareScope, shareDialogCopy } from "./share";
import type { VidgetInboxReviewShareScope } from "./types";

export function InboxShareDialog({
  open,
  onOpenChange,
  scope,
  vidgetNames,
  vidgetName,
  onShare,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: VidgetInboxReviewShareScope | null;
  vidgetNames: string[];
  vidgetName?: string | null;
  onShare: (anonymous: boolean) => void;
}) {
  const [anonymous, setAnonymous] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAnonymous(false);
    setDone(false);
  }, [open]);

  const sessionCount = scope ? sessionIdsForShareScope(scope).length : 0;
  const copy = scope
    ? shareDialogCopy(scope, vidgetName)
    : { title: "Share", helper: "", doneTitle: "Shared" };
  const summary = describeShareScope({ sessionCount, vidgetNames });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(92vw,440px)] rounded-[16px]">
        <DialogHeader>
          <DialogTitle>
            {done ? copy.doneTitle : copy.title}
          </DialogTitle>
          {!done ? (
            <DialogDescription className="text-[var(--luxia-text-secondary)]">
              {copy.helper}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="space-y-4 px-6 py-4">
          {done ? (
            <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
              {summary} {anonymous ? "shared without visitor identity." : "shared."}
            </p>
          ) : (
            <>
              <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                {summary} will be included.
              </p>
              <label className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                    Share anonymously
                  </span>
                  <span className="mt-1 block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    Visitor identity is omitted from the shared review.
                  </span>
                </span>
                <Switch
                  checked={anonymous}
                  onCheckedChange={setAnonymous}
                  aria-label="Share anonymously"
                />
              </label>
            </>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          {done ? (
            <Button type="button" variant="primary" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={sessionCount === 0}
                onClick={() => {
                  onShare(anonymous);
                  setDone(true);
                }}
              >
                Share
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
