import { useState, type ReactNode } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";

function GuideRow({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-4">
      <p
        className="shrink-0 luxia-type-body-dense-strong sm:w-[9.5rem]"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {label}
      </p>
      <p
        className="min-w-0 luxia-type-body-dense"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {description}
      </p>
    </div>
  );
}

function GuideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h3
        className="luxia-type-body-dense-strong"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Compact Users guide — Organization role vs Project role vs Access Level. */
export function LuxiaUsersGuide({
  triggerLabel = "Users guide",
  className,
}: {
  triggerLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          {...LUXIA_PAGE_HEADER_ACTION.tertiary}
          className={className}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[min(90vh,36rem)] w-[min(100%,28rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        hideCloseButton
      >
        <div
          className="flex items-start justify-between gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--luxia-border-subtle)" }}
        >
          <div className="min-w-0 space-y-1">
            <DialogTitle className="luxia-type-title-section">
              Users guide
            </DialogTitle>
            <DialogDescription className="luxia-type-body-dense">
              How organization access concepts relate.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Close"
            >
              <XIcon size={16} strokeWidth={2} aria-hidden />
            </Button>
          </DialogClose>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <GuideSection title="Access concepts">
            <div className="space-y-3">
              <GuideRow
                label="Organization role"
                description="Organization-level authority (Admin or Member) for this user."
              />
              <GuideRow
                label="Project role"
                description="What a user can do in a specific Project. The same user can have different roles in different Projects."
              />
              <GuideRow
                label="Access Level"
                description="Data Source permissions (View, Use, Manage). Does not assign Projects or Constellations."
              />
            </div>
          </GuideSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}
