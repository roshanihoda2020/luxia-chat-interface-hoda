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

/** @deprecated Custom content overrides are no longer used; kept for API compatibility. */
export interface LuxiaAccessGuideContent {
  title?: string;
  sections?: { heading: string; body: string }[];
}

export interface LuxiaAccessGuideProps {
  content?: LuxiaAccessGuideContent;
  triggerLabel?: string;
  className?: string;
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
        className="shrink-0 luxia-type-body-dense-strong sm:w-[8.5rem]"
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

function GuideDivider() {
  return (
    <div
      role="separator"
      aria-hidden
      className="h-px w-full"
      style={{ background: "var(--luxia-border-subtle)" }}
    />
  );
}

export function LuxiaAccessGuide({
  triggerLabel = "Access guide",
  className,
}: LuxiaAccessGuideProps) {
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
        hideCloseButton
        aria-describedby="luxia-access-guide-description"
        className="flex max-h-[calc(100vh-80px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[680px]"
      >
        <header
          className="relative shrink-0 border-b px-6 pb-4 pt-6 pr-14"
          style={{ borderColor: "var(--luxia-border-subtle)" }}
        >
          <DialogTitle className="select-none">Access guide</DialogTitle>
          <DialogDescription
            id="luxia-access-guide-description"
            className="mt-1.5"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            Understand how roles, ownership, and Data Source permissions work together.
          </DialogDescription>
          <DialogClose
            type="button"
            className="luxia-button luxia-button--ghost luxia-button--icon-compact absolute top-4 right-4 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            aria-label="Close Access guide"
          >
            <XIcon aria-hidden />
          </DialogClose>
        </header>

        <div
          tabIndex={0}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--luxia-border-focus)]"
          aria-label="Access guide content"
        >
          <div className="space-y-6">
            <div
              className="rounded-[var(--luxia-radius-12)] px-3.5 py-3"
              style={{
                background: "var(--luxia-neutral-surface-subtle, #F8FAFC)",
                border: "1px solid var(--luxia-border-subtle)",
              }}
            >
              <p
                className="luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Access in Luxia is determined by Organization role, Project role,
                Data Source ownership, and Data Source permissions.
              </p>
            </div>

            <GuideSection title="Access Levels">
              <p
                className="luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Access Levels group organization members and grant View, Use, or Manage
                permission on selected Data Sources.
              </p>
              <p
                className="luxia-type-body-dense-strong"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Access Levels apply to Data Sources only.
              </p>
              <p
                className="luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                They do not assign Project membership or directly assign Constellations.
              </p>
              <p
                className="luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                Only Organization Admins can create or edit Access Levels.
              </p>
            </GuideSection>

            <GuideDivider />

            <GuideSection title="Data Source permissions">
              <p
                className="luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
                aria-label="Permission hierarchy: Manage includes Use, Use includes View"
              >
                Manage → Use → View
              </p>
              <div className="space-y-3">
                <GuideRow
                  label="View"
                  description="See source metadata and available information."
                />
                <GuideRow
                  label="Use"
                  description="Work with the underlying Data Source where Data Source access is required. Includes View."
                />
                <GuideRow
                  label="Manage"
                  description="Manage the Data Source and its access. Includes Use and View."
                />
              </div>
            </GuideSection>

            <GuideDivider />

            <GuideSection title="Data Source ownership">
              <div className="space-y-3">
                <GuideRow
                  label="Organizational"
                  description="Managed by the organization. Access is granted through Access Levels. Organization Admins may Manage organizational sources."
                />
                <GuideRow
                  label="Private"
                  description="Owned by one user. The owner receives Manage. Other users, including Organization Admins, receive access only through explicit Access Level grants."
                />
              </div>
            </GuideSection>

            <GuideDivider />

            <GuideSection title="Project roles">
              <div className="space-y-3">
                <GuideRow
                  label="Project Owner"
                  description="Same Project operational control as Manager, plus Delete Project and ownership control."
                />
                <GuideRow
                  label="Project Manager"
                  description="Same Project operational control as Owner, except Delete Project and ownership control."
                />
                <GuideRow
                  label="Analyst"
                  description="Chats with Project Constellations and can edit Knowledge Base, Instructions, and Crawler."
                />
                <GuideRow
                  label="Member"
                  description="Chats with Project Constellations without configuration or member-management access."
                />
              </div>
            </GuideSection>

            <GuideDivider />

            <GuideSection title="Constellation access">
              <div
                className="rounded-[var(--luxia-radius-12)] px-3.5 py-3"
                style={{
                  background: "var(--luxia-neutral-surface-subtle, #F8FAFC)",
                  border: "1px solid var(--luxia-border-default)",
                }}
              >
                <p
                  className="luxia-type-body-dense-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  Active Project membership
                </p>
                <p
                  className="mt-1 luxia-type-caption"
                  style={{ color: "var(--luxia-text-muted)" }}
                  aria-hidden
                >
                  =
                </p>
                <p
                  className="luxia-type-body-dense-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  Existing Constellations visible and Chat available
                </p>
                <p className="sr-only">
                  Active Project membership equals existing Constellations visible and Chat available.
                </p>
              </div>
              <p
                className="luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Data Source View, Use, or Manage is not required for basic Chat with an existing
                Project Constellation. Those permissions govern the underlying Data Source and
                operations that require it.
              </p>
              <p
                className="luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                Constellations are not assigned directly through Access Levels.
              </p>
            </GuideSection>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
