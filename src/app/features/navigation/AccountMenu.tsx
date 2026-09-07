import {
  Check,
  ChevronDown,
  CircleHelp,
  Settings,
  UserRoundCog,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { DemoUserAvatar } from "@/app/features/permissions/demoUserAvatar";

export interface DemoPrototypeUser {
  id: string;
  name: string;
  contextLabel: string;
}

const SUPPORT_UNAVAILABLE_MESSAGE = "Support is currently unavailable.";

interface AccountMenuProps {
  collapsed?: boolean;
  profileName: string;
  profileEmail: string;
  orgRoleLabel: string;
  profileAria: string;
  prototypeUserId?: string;
  prototypeUsers?: DemoPrototypeUser[];
  onPrototypeUserChange?: (userId: string) => void;
  onSettingsClick?: () => void;
  onSupportHelpClick?: () => void;
}

export function AccountMenu({
  collapsed = false,
  profileName,
  profileEmail,
  orgRoleLabel,
  profileAria,
  prototypeUserId,
  prototypeUsers,
  onPrototypeUserChange,
  onSettingsClick,
  onSupportHelpClick,
}: AccountMenuProps) {
  const showPrototypeTools = Boolean(prototypeUsers?.length && onPrototypeUserChange);

  function handleSupportHelp() {
    if (onSupportHelpClick) {
      onSupportHelpClick();
      return;
    }
    toast.message(SUPPORT_UNAVAILABLE_MESSAGE);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${profileName}`}
          className={`group flex w-full min-w-0 items-center rounded-[10px] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)] ${
            collapsed
              ? "justify-center px-0 py-1"
              : "gap-2.5 px-2 py-1.5 hover:bg-[rgba(255,255,255,0.06)]"
          }`}
        >
          {prototypeUserId ? (
            <DemoUserAvatar userId={prototypeUserId} aria-hidden={false} />
          ) : (
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] text-white luxia-type-caption"
              style={{ background: "var(--luxia-neutral-600)" }}
              aria-hidden
            >
              ?
            </div>
          )}
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-white luxia-type-profile-secondary leading-tight">
                  {profileName}
                </span>
                <span
                  className="block truncate luxia-type-profile-secondary leading-tight"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {orgRoleLabel}
                </span>
              </span>
              <ChevronDown
                size={16}
                className="flex-shrink-0 text-[rgba(255,255,255,0.45)] transition-colors group-hover:text-[rgba(255,255,255,0.72)]"
                aria-hidden
              />
            </>
          ) : null}
          {collapsed ? <span className="sr-only">{profileAria}</span> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align={collapsed ? "center" : "start"}
        sideOffset={8}
        className="z-[60] w-[15.5rem] min-w-[15rem] max-w-[min(18rem,calc(100vw-1rem))] p-0"
      >
        <div
          className="flex items-start gap-2.5 border-b border-[var(--luxia-border-default)] px-3 py-2.5"
          role="presentation"
        >
          {prototypeUserId ? (
            <DemoUserAvatar userId={prototypeUserId} aria-hidden={false} />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
              {profileName}
            </p>
            {profileEmail ? (
              <p
                className="truncate luxia-type-caption"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                {profileEmail}
              </p>
            ) : null}
            <p
              className="truncate luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              {orgRoleLabel}
            </p>
          </div>
        </div>

        <div className="p-1">
          <DropdownMenuItem onSelect={() => onSettingsClick?.()}>
            <Settings aria-hidden />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSupportHelp}>
            <CircleHelp aria-hidden />
            Support & Help
          </DropdownMenuItem>

          {showPrototypeTools ? (
            <>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuLabel
                className="px-2 py-1 luxia-type-caption font-normal uppercase tracking-wide"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                Prototype tools
              </DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <UserRoundCog aria-hidden />
                  Switch demo identity
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="z-[70] min-w-[15rem]">
                  {prototypeUsers!.map((user) => {
                    const selected = user.id === prototypeUserId;
                    return (
                      <DropdownMenuItem
                        key={user.id}
                        onSelect={() => onPrototypeUserChange!(user.id)}
                        className="gap-2"
                      >
                        <DemoUserAvatar userId={user.id} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{user.name}</span>
                          <span
                            className="block truncate luxia-type-caption"
                            style={{ color: "var(--luxia-text-muted)" }}
                          >
                            {user.contextLabel}
                          </span>
                        </span>
                        {selected ? (
                          <Check size={14} className="ml-auto shrink-0" aria-hidden />
                        ) : null}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          ) : null}

          {/*
            Reserved production slot (final item after a divider):
            Settings / Support & Help / Prototype tools → Log out.
            TODO(auth): Add the final account-menu "Log out" action when the real Luxia authentication/session logout handler is available.
          */}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
