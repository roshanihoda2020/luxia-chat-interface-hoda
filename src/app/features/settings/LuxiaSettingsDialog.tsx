import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  Database,
  Shield,
  User,
  Users,
  XIcon,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { LUXIA_PAGE_LAYOUT } from "@/app/components/luxiaPageLayout";
import type { OrganizationUser } from "@/app/features/permissions/types";
import {
  getAccountSettingsNavGroups,
  type AccountSettingsSectionId,
} from "./ia";
import { STRUCTURED_MODAL_DARK_CHROME_STYLE } from "@/app/features/shared/structuredModalChrome";
import {
  AccountSettingsContent,
  type AccountSettingsContentProps,
} from "./AccountSettingsContent";
import { createAnalyticsSession } from "./analytics/sessionState";

const SECTION_ICONS: Record<AccountSettingsSectionId, typeof User> = {
  profile: User,
  "my-data": Database,
  general: Building2,
  members: Users,
  "access-data": Shield,
  analytics: Activity,
  usage: BarChart3,
};

interface LuxiaSettingsDialogProps extends Omit<
  AccountSettingsContentProps,
  "activeSection" | "analyticsSession" | "onAnalyticsSessionChange"
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSection: AccountSettingsSectionId;
  onSectionChange: (section: AccountSettingsSectionId) => void;
  user: OrganizationUser;
  canViewOrganizationAnalytics?: boolean;
}

export function LuxiaSettingsDialog({
  open,
  onOpenChange,
  user,
  activeSection,
  onSectionChange,
  canViewOrganizationAnalytics = false,
  ...contentProps
}: LuxiaSettingsDialogProps) {
  const identityLine = `${user.name} · ${user.email}`;
  const contentViewportRef = useRef<HTMLDivElement>(null);
  const [analyticsSession, setAnalyticsSession] = useState(createAnalyticsSession);
  const navGroups = useMemo(
    () => getAccountSettingsNavGroups({ canViewOrganizationAnalytics }),
    [canViewOrganizationAnalytics],
  );

  useEffect(() => {
    if (!open) setAnalyticsSession(createAnalyticsSession());
  }, [open]);

  useEffect(() => {
    if (activeSection === "analytics" && !canViewOrganizationAnalytics) {
      onSectionChange("general");
    }
  }, [activeSection, canViewOrganizationAnalytics, onSectionChange]);

  useEffect(() => {
    contentViewportRef.current?.scrollTo({ top: 0, left: 0 });
  }, [activeSection, analyticsSession.tab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        overlayClassName="bg-[var(--luxia-opacity-black-40)]"
        className="z-[70] flex h-[min(82vh,760px)] min-h-[min(540px,82vh)] max-h-[min(82vh,760px)] w-[min(1024px,92vw)] max-w-[min(1024px,92vw)] flex-col gap-0 overflow-hidden p-0 shadow-[var(--luxia-shadow-lg)] sm:max-w-[min(1024px,92vw)]"
        style={{
          width: "min(1024px, 92vw)",
          maxWidth: "min(1024px, 92vw)",
          height: "min(82vh, 760px)",
          minHeight: "min(540px, 82vh)",
          maxHeight: "min(82vh, 760px)",
        }}
      >
        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 px-7 py-4">
            <div className="min-w-0 pr-2">
              <DialogTitle
                className="luxia-type-title-modal text-left"
                style={{ color: "var(--luxia-text-inverse)" }}
              >
                Settings
              </DialogTitle>
              <DialogDescription
                className="mt-1 luxia-type-body-dense text-left"
                style={{ color: "var(--luxia-purple-10)" }}
              >
                {identityLine}
              </DialogDescription>
            </div>
            <DialogClose className="luxia-button luxia-button--ghost luxia-button--icon-compact -mr-1 -mt-0.5 shrink-0 !text-[var(--luxia-opacity-white-80)] hover:!bg-[var(--luxia-opacity-white-08)] hover:!text-[var(--luxia-text-inverse)] focus:outline-hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row md:items-stretch">
            <nav
              className="luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical w-full shrink-0 overflow-x-auto overflow-y-hidden md:flex md:h-full md:w-[var(--luxia-account-settings-nav-width)] md:min-w-[var(--luxia-account-settings-nav-width)] md:max-w-[var(--luxia-account-settings-nav-width)] md:flex-col md:self-stretch md:overflow-x-hidden md:overflow-y-auto"
              aria-label="Settings sections"
              style={{
                ["--luxia-account-settings-nav-width" as string]: LUXIA_PAGE_LAYOUT.settingsNavWidth,
              }}
            >
            <div className="flex flex-wrap gap-x-4 gap-y-5 px-4 py-4 md:block md:h-full md:gap-0 md:py-6">
              {navGroups.map((group) => (
                <div
                  key={group.label}
                  className="min-w-0 md:mb-6 md:last:mb-0"
                >
                  <p
                    className="px-2.5 luxia-type-label-small uppercase tracking-[0.06em]"
                    style={{
                      paddingBottom: "var(--luxia-spacing-8)",
                      color:
                        "color-mix(in srgb, var(--luxia-purple-10) 70%, var(--luxia-text-inverse))",
                    }}
                  >
                    {group.label}
                  </p>
                  <ul className="flex min-w-0 flex-wrap gap-1 md:block md:space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = SECTION_ICONS[item.id];
                      const isActive = activeSection === item.id;
                      return (
                        <li key={item.id} className="shrink-0 md:shrink">
                          <button
                            type="button"
                            aria-current={isActive ? "page" : undefined}
                            className={`flex w-full items-center gap-2.5 rounded-[var(--luxia-radius-8)] px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-opacity-white-32)] ${
                              isActive
                                ? "bg-[var(--luxia-opacity-white-16)] text-[var(--luxia-text-inverse)]"
                                : "text-[var(--luxia-opacity-white-80)] hover:bg-[var(--luxia-opacity-white-08)]"
                            }`}
                            onClick={() => {
                              if (item.id === "analytics" && !canViewOrganizationAnalytics) return;
                              onSectionChange(item.id);
                            }}
                          >
                            <Icon
                              size={16}
                              className={`shrink-0 ${
                                isActive
                                  ? "text-[var(--luxia-text-inverse)]"
                                  : "text-[var(--luxia-purple-10)]"
                              }`}
                              aria-hidden
                            />
                            <span className="truncate luxia-type-body-dense whitespace-nowrap md:whitespace-normal">
                              {item.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <div
            ref={contentViewportRef}
            className="@container min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical"
            style={{
              background: "var(--luxia-surface)",
              paddingTop: "var(--luxia-spacing-24)",
              paddingLeft: "var(--luxia-spacing-32)",
              paddingRight: "var(--luxia-spacing-32)",
              paddingBottom: "var(--luxia-spacing-40)",
            }}
          >
            <AccountSettingsContent
              user={user}
              activeSection={activeSection}
              {...contentProps}
              analyticsSession={analyticsSession}
              onAnalyticsSessionChange={setAnalyticsSession}
            />
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
