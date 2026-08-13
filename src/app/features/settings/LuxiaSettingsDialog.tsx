import {
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
  ACCOUNT_SETTINGS_NAV_GROUPS,
  type AccountSettingsSectionId,
} from "./ia";
import {
  AccountSettingsContent,
  type AccountSettingsContentProps,
} from "./AccountSettingsContent";

const SECTION_ICONS: Record<AccountSettingsSectionId, typeof User> = {
  profile: User,
  "my-data": Database,
  general: Building2,
  members: Users,
  "access-data": Shield,
  usage: BarChart3,
};

/** Same surface as Project Overview Galaxy hero body (`ProjectGalaxyCard`). */
const SETTINGS_DARK_SURFACE = "var(--luxia-galaxy-hero-surface)";

interface LuxiaSettingsDialogProps extends Omit<AccountSettingsContentProps, "activeSection"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSection: AccountSettingsSectionId;
  onSectionChange: (section: AccountSettingsSectionId) => void;
  user: OrganizationUser;
}

export function LuxiaSettingsDialog({
  open,
  onOpenChange,
  user,
  activeSection,
  onSectionChange,
  ...contentProps
}: LuxiaSettingsDialogProps) {
  const identityLine = `${user.name} · ${user.email}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        overlayClassName="bg-[var(--luxia-opacity-black-40)]"
        className="z-[70] flex min-h-[min(540px,82vh)] max-h-[min(82vh,760px)] w-[min(1024px,92vw)] max-w-[min(1024px,92vw)] flex-col gap-0 overflow-hidden p-0 shadow-[var(--luxia-shadow-lg)] sm:max-w-[min(1024px,92vw)] max-md:max-h-[min(92vh,760px)]"
      >
        <div
          className="flex shrink-0 items-start justify-between gap-4 px-7 py-4"
          style={{
            backgroundColor: "var(--luxia-brand-primary-dark)",
            backgroundImage: SETTINGS_DARK_SURFACE,
          }}
        >
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

        {/* Desktop: stable nav + scrolling content. Below lg: nav above content, one body scroll. */}
        <div className="luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical flex min-h-0 flex-1 flex-col overflow-hidden max-lg:overflow-y-auto lg:flex-row lg:items-stretch">
          <nav
            className="luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical w-full shrink-0 max-lg:relative max-lg:z-[1] max-lg:shadow-[0_2px_6px_var(--luxia-opacity-black-08)] lg:flex lg:min-h-0 lg:w-[var(--luxia-account-settings-nav-width)] lg:min-w-[var(--luxia-account-settings-nav-width)] lg:max-w-[var(--luxia-account-settings-nav-width)] lg:flex-col lg:self-stretch lg:overflow-y-auto lg:shadow-none"
            aria-label="Settings sections"
            style={{
              backgroundColor: "var(--luxia-brand-primary-dark)",
              backgroundImage: SETTINGS_DARK_SURFACE,
              ["--luxia-account-settings-nav-width" as string]: LUXIA_PAGE_LAYOUT.settingsNavWidth,
            }}
          >
            <div className="flex h-full flex-wrap gap-x-4 gap-y-5 px-4 py-4 lg:block lg:gap-0 lg:py-6">
              {ACCOUNT_SETTINGS_NAV_GROUPS.map((group) => (
                <div
                  key={group.label}
                  className="min-w-0 lg:mb-6 lg:last:mb-0"
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
                  <ul className="flex min-w-0 flex-wrap gap-1 lg:block lg:space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = SECTION_ICONS[item.id];
                      const isActive = activeSection === item.id;
                      return (
                        <li key={item.id} className="shrink-0 lg:shrink">
                          <button
                            type="button"
                            aria-current={isActive ? "page" : undefined}
                            className={`flex w-full items-center gap-2.5 rounded-[var(--luxia-radius-8)] px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-opacity-white-32)] ${
                              isActive
                                ? "bg-[var(--luxia-opacity-white-16)] text-[var(--luxia-text-inverse)]"
                                : "text-[var(--luxia-opacity-white-80)] hover:bg-[var(--luxia-opacity-white-08)]"
                            }`}
                            onClick={() => onSectionChange(item.id)}
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
                            <span className="truncate luxia-type-body-dense whitespace-nowrap lg:whitespace-normal">
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
            className="@container min-w-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:shadow-[inset_4px_4px_6px_-3px_var(--luxia-opacity-black-08)] luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical"
            style={{
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
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
