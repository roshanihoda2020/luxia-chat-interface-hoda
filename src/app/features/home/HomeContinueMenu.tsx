import { Fragment } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { COMPACT_CONTROL_HIT } from "./PinButton";
import { HS } from "./homeSurfaces";

export interface ContinueMenuItem {
  id: string;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  muted?: boolean;
  separatorBefore?: boolean;
}

interface HomeContinueMenuProps {
  label: string;
  tone?: "light" | "dark";
  controlSize?: "default" | "hero";
  items: ContinueMenuItem[];
}

const MENU_ITEM_BASE =
  "min-h-[36px] cursor-pointer whitespace-nowrap rounded-[8px] px-2.5 luxia-type-body-dense-strong";

export function HomeContinueMenu({
  label,
  tone = "light",
  controlSize = "default",
  items,
}: HomeContinueMenuProps) {
  void controlSize;
  const idleColor = tone === "dark"
    ? "rgba(255, 255, 255, 0.72)"
    : "var(--luxia-text-muted)";
  const hoverBg = tone === "dark" ? "var(--luxia-opacity-white-08)" : HS.menuHover;

  if (!items.length) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`More actions for ${label}`}
          aria-haspopup="menu"
          className={COMPACT_CONTROL_HIT}
          style={{ color: idleColor, background: "transparent" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = hoverBg;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <MoreHorizontal size={14} strokeWidth={1.75} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={4}
        collisionPadding={12}
        className="w-[216px] min-w-[216px] max-w-[220px] p-1.5"
        style={{
          borderRadius: HS.menuRadius,
          borderColor: HS.menuBorder,
          boxShadow: HS.menuShadow,
        }}
      >
        {items.map((item) => (
          <Fragment key={item.id}>
            {item.separatorBefore ? <DropdownMenuSeparator className="my-1" /> : null}
            <DropdownMenuItem
              aria-label={item.ariaLabel}
              className={`${MENU_ITEM_BASE} ${item.muted ? "!text-[var(--luxia-text-muted)] font-normal luxia-type-body-dense" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
            >
              {item.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type ContinueVisibilityAction = "hide" | "show" | "none";

export function buildContinueFocusMenuItems(options: {
  title: string;
  focusAction: "change" | "set";
  visibilityAction: ContinueVisibilityAction;
  onChangePrimary: () => void;
  onSetAsFocus?: () => void;
  onHide?: () => void;
  onShow?: () => void;
}): ContinueMenuItem[] {
  const items: ContinueMenuItem[] = [];

  if (options.focusAction === "set" && options.onSetAsFocus) {
    items.push({
      id: "set-primary",
      label: "Set as Home focus",
      ariaLabel: `Set ${options.title} as Home focus`,
      onClick: options.onSetAsFocus,
    });
  } else {
    items.push({
      id: "change-primary",
      label: "Change Home focus",
      ariaLabel: `Change Home focus for ${options.title}`,
      onClick: options.onChangePrimary,
    });
  }

  if (options.visibilityAction === "show" && options.onShow) {
    items.push({
      id: "restore",
      label: "Show on Home",
      ariaLabel: `Show ${options.title} on Home`,
      onClick: options.onShow,
      separatorBefore: true,
    });
  } else if (options.visibilityAction === "hide" && options.onHide) {
    items.push({
      id: "hide",
      label: "Hide from Home",
      ariaLabel: `Hide ${options.title} from Home`,
      onClick: options.onHide,
      muted: true,
      separatorBefore: true,
    });
  }

  return items;
}
