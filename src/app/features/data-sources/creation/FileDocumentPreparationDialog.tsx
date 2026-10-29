import { Fragment, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import type { DataSourceDocumentRecord } from "@/app/features/data-sources/documents";
import { PDF_SAFE_DIALOG_CONTENT_CLASS } from "@/app/features/document-review";
import { FileDataSourceDocumentsPanel } from "@/app/features/document-tags";
import {
  runWithUnsavedNavigationGuard,
  type UnsavedNavigationGuard,
} from "@/app/features/shared/unsavedNavigationGuard";

const STEPS = ["Upload", "Extract", "Review", "Tag", "Create"] as const;

/**
 * File Data Source creation, step after Upload: Extract → Review → Tag, all
 * optional. Reuses the Tag & Extract Documents panel and Review workspace
 * against the draft's Data Source ID, so the same records carry over when the
 * source is created. Create is always available; nothing has to be extracted,
 * reviewed or approved first.
 */
export function FileDocumentPreparationDialog({
  open,
  sourceName,
  ownershipLabel,
  dataSourceId,
  documents,
  currentUserId,
  onBack,
  onCancel,
  onCreate,
  onDeleteDocument,
}: {
  open: boolean;
  sourceName: string;
  ownershipLabel: string;
  /** Draft ID, reused as the created Data Source's ID. */
  dataSourceId: string;
  documents: readonly DataSourceDocumentRecord[];
  currentUserId?: string;
  onBack: () => void;
  onCancel: () => void;
  onCreate: () => void;
  onDeleteDocument: (document: DataSourceDocumentRecord) => void;
}) {
  const guardRef = useRef<UnsavedNavigationGuard | null>(null);
  const [reviewHost, setReviewHost] = useState<HTMLDivElement | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const whenLeaveAllowed = (proceed: () => void) => runWithUnsavedNavigationGuard(guardRef.current, proceed);

  // Closing creation while Review is open (cancel / discard): pop the Review
  // history entry now, without waiting for the closed dialog to unmount, so
  // browser Back never lands on a stale Review. The panel's own popstate
  // listener then closes its Review state.
  const wasOpenRef = useRef(open);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    if (!wasOpen || open || !reviewing) return;
    const state: unknown = window.history.state;
    if (state && typeof state === "object" && "luxiaReviewDocumentId" in state) window.history.back();
  }, [open, reviewing]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) whenLeaveAllowed(onCancel);
      }}
    >
      <DialogContent className={`flex h-[min(92vh,60rem)] w-[min(96vw,100rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none ${PDF_SAFE_DIALOG_CONTENT_CLASS}`}>
        <DialogHeader className="shrink-0">
          <DialogTitle>Extract, review and tag</DialogTitle>
          <DialogDescription>
            File · {sourceName} · {ownershipLabel}
          </DialogDescription>
        </DialogHeader>

        <div ref={setReviewHost} className={reviewing ? "flex min-h-0 flex-1 flex-col" : "hidden"} />

        <div className={reviewing ? "hidden" : "min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5"}>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 luxia-type-caption" aria-label="Steps">
              {STEPS.map((step, index) => (
                <Fragment key={step}>
                  {index > 0 ? <li aria-hidden style={{ color: "var(--luxia-text-muted)" }}>›</li> : null}
                  <li
                    className="inline-flex items-center gap-1"
                    style={{ color: step === "Upload" ? "var(--luxia-text-secondary)" : "var(--luxia-text-primary)" }}
                    aria-current={step === "Extract" ? "step" : undefined}
                  >
                    {step === "Upload" ? <Check size={12} aria-hidden /> : null}
                    {step}
                    {step === "Extract" || step === "Review" || step === "Tag" ? (
                      <span style={{ color: "var(--luxia-text-muted)" }}>(optional)</span>
                    ) : null}
                  </li>
                </Fragment>
              ))}
            </ol>
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              You can create the Data Source now and finish later in Tag &amp; Extract.
            </p>
          </div>

          <FileDataSourceDocumentsPanel
            dataSourceId={dataSourceId}
            dataSourceName={sourceName}
            documents={documents}
            canEdit
            currentUserId={currentUserId}
            onDeleteDocument={onDeleteDocument}
            navigationGuardRef={guardRef}
            reviewPortalHost={reviewHost}
            onReviewActiveChange={setReviewing}
          />
        </div>

        {reviewing ? null : (
          <DialogFooter className="shrink-0 justify-between">
            <Button type="button" variant="secondary" size="compact" onClick={() => whenLeaveAllowed(onBack)}>
              Back
            </Button>
            <Button type="button" variant="primary" size="compact" onClick={() => whenLeaveAllowed(onCreate)}>
              Create Data Source
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
