import { useRef } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import { VerifySetupPanel } from "./setup/VerifySetupPanel";
import type { VerifaiLaunchContext, VerifaiLaunchOrigin, VerifaiStartInput } from "./types";
import "./verifai.css";

function focusComposer() {
  window.requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>("textarea[aria-label=Message]")?.focus());
}

/** Verify Review as a dialog (Chat's @verifai). The setup itself is the shared VerifySetupPanel. */
export function VerifyReviewModal({
  open,
  context,
  onOpenChange,
  onStart,
}: {
  open: boolean;
  context: VerifaiLaunchContext | null;
  onOpenChange: (open: boolean) => void;
  onStart: (input: VerifaiStartInput) => void;
}) {
  // The context is cleared as the dialog closes; remember where it was opened from for focus return.
  const lastOriginRef = useRef<VerifaiLaunchOrigin | null>(null);
  if (context) lastOriginRef.current = context.origin;
  // The control that opened the dialog (captured while rendering the opening, before focus moves in).
  const openerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  if (open && !wasOpenRef.current && typeof document !== "undefined") {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  wasOpenRef.current = open;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="lx-vfy-modal"
        aria-describedby="lx-vfy-modal-desc"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>("[role=tab][aria-selected=true]")?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          // From a Chat, focus returns to its message field; elsewhere to the control that opened it.
          if (lastOriginRef.current?.kind === "chat") {
            focusComposer();
            return;
          }
          const opener = openerRef.current;
          if (opener && opener.isConnected) window.requestAnimationFrame(() => opener.focus());
        }}
      >
        <div className="lx-vfy-modal__header">
          <span className="lx-vfy-modal__logo" aria-hidden><LuxiaStarLogo size={22} /></span>
          <div className="min-w-0">
            <DialogTitle className="lx-vfy-modal__title">Verify Review</DialogTitle>
            <DialogDescription id="lx-vfy-modal-desc" className="lx-vfy-modal__subtitle">
              Review a document against a checklist of requirements.
            </DialogDescription>
          </div>
          <button type="button" className="lx-vfy-icon-btn lx-vfy-modal__close" aria-label="Close Verify Review" onClick={() => onOpenChange(false)}>
            <X size={16} aria-hidden />
          </button>
        </div>

        <VerifySetupPanel active={open} context={context} onStart={onStart} />
      </DialogContent>
    </Dialog>
  );
}
