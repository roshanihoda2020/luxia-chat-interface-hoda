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
import {
  LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
  STRUCTURED_MODAL_DARK_CHROME_STYLE,
} from "@/app/features/shared/structuredModalChrome";
import { cn } from "@/app/components/ui/utils";

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

export function LuxiaDataSourcesGuide({
  triggerLabel = "Data Sources guide",
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
        <header
          className="flex items-start justify-between gap-3 px-5 py-4"
          style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
        >
          <div className="min-w-0 space-y-1">
            <DialogTitle className="luxia-type-title-section text-[var(--luxia-text-inverse)]">
              Data Sources guide
            </DialogTitle>
            <DialogDescription className="luxia-type-body-dense text-[var(--luxia-purple-10)]">
              Ownership, access, and Data Source permissions.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("shrink-0", LUXIA_DIALOG_CLOSE_ON_DARK_CLASS)}
              aria-label="Close"
            >
              <XIcon size={16} strokeWidth={2} aria-hidden />
            </Button>
          </DialogClose>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <GuideSection title="Ownership">
            <div className="space-y-3">
              <GuideRow
                label="Organizational"
                description="Managed by the organization. Access is granted through Access Levels."
              />
              <GuideRow
                label="Private"
                description="Owned by one user. The owner receives Manage on their source."
              />
            </div>
          </GuideSection>

          <GuideSection title="Private source access">
            <p
              className="luxia-type-body-dense"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              Other users, including Organization Admins, receive access to a
              private Data Source only through explicit Access Level grants.
              Organization Admins do not automatically Manage another user&apos;s
              private source.
            </p>
          </GuideSection>

          <GuideSection title="Permissions">
            <div className="space-y-3">
              <GuideRow
                label="View"
                description="See source metadata and available information."
              />
              <GuideRow
                label="Use"
                description="Work with the underlying Data Source where access is required. Includes View."
              />
              <GuideRow
                label="Manage"
                description="Manage the Data Source and its access. Includes Use and View."
              />
            </div>
          </GuideSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}
