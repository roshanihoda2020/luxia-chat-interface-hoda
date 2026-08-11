/**
 * Luxia left sidebar with selective secondary rails.
 * Project switcher / Constellations / Chats open secondary rails;
 * other destinations stay direct. Primary collapse is independent of those rails.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import luxiaWordmarkUrl from "@/assets/brand/Luxia-Star.svg";
import sidebarStarLogoUrl from "@/assets/brand/Star.svg";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { LX } from "@/app/features/active-data-tables/luxiaTokens";
import type { ProjectNavSection } from "@/app/features/project-overview/types";
import { DemoUserAvatar } from "@/app/features/permissions/demoUserAvatar";
import { formatOrganizationRoleLabel, NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import {
  getAccessLevelsPath,
  getConstellationSettingsPath,
  getConstellationsPath,
  getDashboardPath,
  getDataSourcesPath,
  getGalaxyPath,
  getProjectChatsPath,
  getProjectMembersPath,
  getProjectPath,
  getChatPath,
  getConstellationChatPath,
} from "@/app/features/project/projectPaths";
import {
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaDatasourceIcon,
  LuxiaGalaxyIcon,
  LuxiaHomeIcon,
  LuxiaProjectsIcon,
  LuxiaSettingsIcon,
  LuxiaSupportIcon,
  LuxiaUserPermissionsIcon,
  type LuxiaIconProps,
} from "@/assets/icons";
import { canAccessProjectSettingsForUser } from "@/app/features/permissions/accessGuards";
import type { ProjectRole } from "@/app/features/permissions/types";

export const SIDEBAR_WIDTH_EXPANDED = 280;
export const SIDEBAR_WIDTH_COLLAPSED = 76;
/** Full-height Constellations / Chats secondary rail width (desktop). */
export const SIDEBAR_SECONDARY_WIDTH = 280;
export const LEFT_NAV_COLLAPSED_STORAGE_KEY = "luxia-left-nav-collapsed";
export const LEFT_NAV_MOBILE_BREAKPOINT = 768;

const SIDEBAR_TOGGLE_SIZE = 42;
const SIDEBAR_TOGGLE_INSET = SIDEBAR_TOGGLE_SIZE / 2;
const SIDEBAR_LOGO_WIDTH = 119.66;
const SIDEBAR_LOGO_HEIGHT = 46.64;
const SIDEBAR_BRAND_LEFT = 24;
const SIDEBAR_BRAND_TOP = 16;
const SIDEBAR_BRAND_BOTTOM = 12;
const SIDEBAR_STAR_WIDTH = 538.11;
const SIDEBAR_STAR_HEIGHT = 674.69;
const SIDEBAR_STAR_INTERSECTION_X = 174;
const SECONDARY_QUICK_LIMIT = 10;
const SECONDARY_SEARCH_RESULT_LIMIT = 12;
const PROJECT_SWITCHER_LIST_LIMIT = 50;

const SIDEBAR_PROFILE_NAME = "User name";
const SIDEBAR_PROFILE_INITIALS = "UN";

type NavIconComponent = (props: LuxiaIconProps) => ReactElement;
type FlyoutKind = "constellations" | "chats" | "projects";

export type LeftNavChatPreview = {
  id: string;
  label: string;
  chatSource: "galaxy" | "constellation";
  constellationId?: string;
  lastOpenedTimestamp: number;
  pinned?: boolean;
};

export type LeftNavConstellationPreview = {
  id: string;
  label: string;
  type?: string;
  updatedAtTimestamp: number;
  pinned?: boolean;
};

export type LeftNavProjectPreview = {
  id: string;
  label: string;
  projectRole?: ProjectRole | null;
};

type DemoPrototypeUser = {
  id: string;
  name: string;
  orgRole: string;
  projectRole: ProjectRole | null;
  contextLabel: string;
};

export type LeftNavProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isMobileDrawer?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  homeActive?: boolean;
  usersActive?: boolean;
  dataSourcesActive?: boolean;
  projectId?: string | null;
  projectLabel?: string | null;
  showProjectContext?: boolean;
  showGalaxy?: boolean;
  activeProjectSection?: ProjectNavSection | null;
  activeChatId?: string | null;
  activeConstellationId?: string | null;
  projectChats?: LeftNavChatPreview[];
  projectConstellations?: LeftNavConstellationPreview[];
  switchableProjects?: LeftNavProjectPreview[];
  chatTotalCount?: number;
  constellationTotalCount?: number;
  onHomeClick?: () => void;
  onUsersClick?: () => void;
  onDataSourcesClick?: () => void;
  onProjectSectionClick?: (section: ProjectNavSection) => void;
  onSwitchProject?: (projectId: string) => void;
  onOpenChat?: (chatId: string) => void;
  onOpenConstellation?: (projectId: string, constellationId: string) => void;
  prototypeUser?: { id: string; name: string; orgRole: string };
  prototypeProjectRole?: ProjectRole | null;
  activeProjectLabel?: string | null;
  onPrototypeUserChange?: (userId: string) => void;
  prototypeUsers?: DemoPrototypeUser[];
  /** Notifies shell when desktop secondary rail open state changes (for content width). */
  onSecondaryRailOpenChange?: (open: boolean) => void;
};

const NAV_TOP_ITEMS: {
  id: string;
  icon: NavIconComponent;
  label: string;
  available: boolean;
  unavailableHint?: string;
}[] = [
  { id: "home", icon: LuxiaHomeIcon, label: "Home", available: true },
  { id: "users", icon: LuxiaUserPermissionsIcon, label: "Access Levels", available: true },
  {
    id: "datasources",
    icon: LuxiaDatasourceIcon,
    label: "Data Sources",
    available: true,
  },
];

const NAV_BOTTOM_ITEMS: {
  id: string;
  icon: NavIconComponent;
  label: string;
  available: boolean;
  unavailableHint?: string;
}[] = [
  {
    id: "support",
    icon: LuxiaSupportIcon,
    label: "Support",
    available: false,
    unavailableHint: "Support is not available in this prototype.",
  },
];

/** Flip when a real Project Settings route/page exists in the prototype. */
const PROJECT_SETTINGS_DESTINATION_AVAILABLE = false;

function pickQuickFlyoutItems<T extends { id: string; pinned?: boolean }>(
  items: T[],
  activeId: string | null | undefined,
  limit: number,
  rank: (item: T) => number,
): T[] {
  if (items.length <= limit) {
    return [...items].sort((a, b) => {
      const pinA = a.pinned ? 1 : 0;
      const pinB = b.pinned ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      return rank(b) - rank(a);
    });
  }
  const active = activeId ? items.find((item) => item.id === activeId) : undefined;
  const rest = items
    .filter((item) => item.id !== active?.id)
    .sort((a, b) => {
      const pinA = a.pinned ? 1 : 0;
      const pinB = b.pinned ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      return rank(b) - rank(a);
    });
  if (active) return [active, ...rest.slice(0, limit - 1)];
  return rest.slice(0, limit);
}

function filterFlyoutSearch<T extends { label: string }>(
  items: T[],
  query: string,
  limit: number,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return items.filter((item) => item.label.toLowerCase().includes(q)).slice(0, limit);
}

function NavItem({
  icon: Icon,
  label,
  active,
  count,
  collapsed,
  disabled,
  href,
  onClick,
  tooltip,
  indent,
  ariaExpanded,
  ariaControls,
  buttonRef,
}: {
  icon: NavIconComponent;
  label: string;
  active?: boolean;
  count?: number;
  collapsed?: boolean;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  tooltip?: string;
  indent?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  const isDisabled = Boolean(disabled);
  const tip = tooltip ?? label;
  const className = `w-full flex items-center rounded-[10px] transition-colors group no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)] ${
    collapsed ? "justify-center h-[40px] px-0" : `gap-3 ${indent ? "pl-8 pr-3" : "px-3.5"} h-[40px] text-left`
  } ${isDisabled ? "cursor-not-allowed" : ""}`;
  const style = {
    background: active ? "rgba(255,255,255,0.12)" : "transparent",
    opacity: isDisabled && !active ? 0.48 : 1,
  } as const;
  const onMouseEnter = (e: ReactMouseEvent<HTMLElement>) => {
    if (!active && !isDisabled) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
  };
  const onMouseLeave = (e: ReactMouseEvent<HTMLElement>) => {
    if (!active) e.currentTarget.style.background = "transparent";
  };

  const content = (
    <>
      <span className="relative flex-shrink-0" aria-hidden>
        <Icon size={16} color={active ? "white" : "rgba(255,255,255,0.55)"} />
      </span>
      {!collapsed ? (
        <>
          <span
            className="flex-1 luxia-type-nav-sidebar truncate"
            style={{ color: active ? "white" : "rgba(255,255,255,0.7)" }}
            title={label}
          >
            {label}
          </span>
          {typeof count === "number" && count > 0 ? (
            <span
              className="luxia-type-caption tabular-nums"
              style={{ color: "rgba(255,255,255,0.4)" }}
              aria-label={`${count} total`}
            >
              {count}
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );

  const item = isDisabled ? (
    <button type="button" disabled aria-label={tip} aria-disabled className={className} style={style}>
      {content}
    </button>
  ) : href ? (
    <a
      href={href}
      aria-label={tip}
      aria-current={active ? "page" : undefined}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </a>
  ) : (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={tip}
      aria-current={active ? "page" : undefined}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {isDisabled ? <span className="block w-full">{item}</span> : item}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{tip}</TooltipContent>
      </Tooltip>
    );
  }

  return item;
}

function LuxiaLogo() {
  return (
    <img
      src={luxiaWordmarkUrl}
      alt="Luxia"
      width={SIDEBAR_LOGO_WIDTH}
      height={SIDEBAR_LOGO_HEIGHT}
      style={{ display: "block", objectFit: "contain", flexShrink: 0 }}
    />
  );
}

function CollapsedStarLogo() {
  return (
    <div aria-label="Luxia" role="img">
      <LuxiaStarLogo size={26} />
    </div>
  );
}

function SidebarStarDecoration() {
  const left = -(SIDEBAR_STAR_INTERSECTION_X - SIDEBAR_BRAND_LEFT);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      <img
        src={sidebarStarLogoUrl}
        alt=""
        width={SIDEBAR_STAR_WIDTH}
        height={SIDEBAR_STAR_HEIGHT}
        style={{
          position: "absolute",
          left,
          top: -80,
          opacity: 0.07,
          objectFit: "contain",
          maxWidth: "none",
        }}
      />
    </div>
  );
}

function SidebarCollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const logoCenterY = SIDEBAR_BRAND_TOP + SIDEBAR_LOGO_HEIGHT / 2 - SIDEBAR_TOGGLE_SIZE / 2;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      className="absolute z-[5] flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.55)]"
      style={{
        width: SIDEBAR_TOGGLE_SIZE,
        height: SIDEBAR_TOGGLE_SIZE,
        top: logoCenterY,
        right: -SIDEBAR_TOGGLE_INSET,
        background: "var(--luxia-surface, #fff)",
        border: "1px solid rgba(28, 19, 54, 0.12)",
        boxShadow: "0 4px 14px rgba(8, 5, 18, 0.18)",
        color: "var(--luxia-brand-primary, #5B3FA6)",
      }}
    >
      {collapsed ? <ChevronRight size={18} strokeWidth={2} /> : <ChevronLeft size={18} strokeWidth={2} />}
    </button>
  );
}

function ProjectDisclosureSection({
  label,
  icon: Icon,
  count,
  href,
  active,
  childActive = false,
  expanded,
  onToggleExpand,
  onNavigate,
  panelId,
  anchorRef,
  disclosureRef,
}: {
  label: string;
  icon: NavIconComponent;
  count: number;
  href?: string;
  active: boolean;
  childActive?: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onNavigate: () => void;
  panelId: string;
  anchorRef?: Ref<HTMLDivElement>;
  disclosureRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <div ref={anchorRef} className="space-y-px">
      <div className="flex items-stretch gap-0.5">
        <a
          href={href}
          aria-current={active && !childActive ? "page" : undefined}
          aria-label={label}
          className="min-w-0 flex-1 flex items-center gap-3 rounded-[10px] px-3.5 h-[40px] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]"
          style={{
            background: active || expanded ? "rgba(255,255,255,0.12)" : "transparent",
          }}
          onClick={(e) => {
            e.preventDefault();
            onNavigate();
          }}
          onMouseEnter={(e) => {
            if (!active && !expanded) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            if (!active && !expanded) e.currentTarget.style.background = "transparent";
          }}
        >
          <Icon
            size={16}
            color={active || expanded ? "white" : "rgba(255,255,255,0.55)"}
            aria-hidden
          />
          <span
            className="flex-1 luxia-type-nav-sidebar truncate"
            style={{ color: active || expanded ? "white" : "rgba(255,255,255,0.7)" }}
          >
            {label}
          </span>
          {count > 0 ? (
            <span className="luxia-type-caption tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>
              {count}
            </span>
          ) : null}
        </a>
        <button
          ref={disclosureRef}
          type="button"
          className="flex h-[40px] w-9 flex-shrink-0 items-center justify-center rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]"
          style={{
            color: expanded ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)",
            background: expanded ? "rgba(255,255,255,0.08)" : "transparent",
          }}
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={expanded ? `Close ${label} panel` : `Open ${label} panel`}
          onClick={onToggleExpand}
        >
          <ChevronDown
            size={16}
            strokeWidth={2}
            style={{
              transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 160ms ease",
            }}
          />
        </button>
      </div>
    </div>
  );
}

function FlyoutNavRow({
  icon: Icon,
  label,
  active,
  href,
  onClick,
}: {
  icon: NavIconComponent;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const activeBg = "rgba(255,255,255,0.07)";
  const idleHoverBg = "rgba(255,255,255,0.05)";
  const className =
    "w-full flex items-center gap-3 rounded-[10px] px-3.5 h-[40px] text-left no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]";
  const style = { background: active ? activeBg : "transparent" } as const;

  const content = (
    <>
      <span className="relative flex-shrink-0" aria-hidden>
        <Icon size={16} color={active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)"} />
      </span>
      <span
        className="min-w-0 flex-1 truncate luxia-type-nav-sidebar"
        style={{ color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.7)" }}
      >
        {label}
      </span>
    </>
  );

  const handlers = {
    onMouseEnter: (e: ReactMouseEvent<HTMLElement>) => {
      if (!active) e.currentTarget.style.background = idleHoverBg;
    },
    onMouseLeave: (e: ReactMouseEvent<HTMLElement>) => {
      e.currentTarget.style.background = active ? activeBg : "transparent";
    },
  };

  if (href) {
    return (
      <a
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={className}
        style={style}
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
        }}
        {...handlers}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={className}
      style={style}
      onClick={onClick}
      {...handlers}
    >
      {content}
    </button>
  );
}

function ProjectSwitcherRow({
  label,
  roleLabel,
  active,
  href,
  onClick,
}: {
  label: string;
  roleLabel: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const activeBg = "rgba(255,255,255,0.07)";
  const idleHoverBg = "rgba(255,255,255,0.05)";
  const className =
    "w-full flex items-center gap-3 rounded-[10px] px-3.5 h-[40px] text-left no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]";
  const style = { background: active ? activeBg : "transparent" } as const;
  const ariaLabel = active
    ? `${label}, current Project, ${roleLabel}`
    : `${label}, ${roleLabel}`;

  const content = (
    <>
      <span className="relative flex-shrink-0" aria-hidden>
        <LuxiaProjectsIcon
          size={16}
          color={active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)"}
        />
      </span>
      <span className="min-w-0 flex-1 truncate">
        <span
          className="block truncate luxia-type-nav-sidebar"
          style={{ color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.7)" }}
        >
          {label}
        </span>
      </span>
      <span
        className="flex-shrink-0 luxia-type-caption truncate"
        style={{ color: "rgba(255,255,255,0.4)", maxWidth: "42%" }}
        title={roleLabel}
        aria-hidden
      >
        {roleLabel}
      </span>
      {active ? (
        <Check
          size={14}
          strokeWidth={2}
          className="flex-shrink-0"
          style={{ color: "rgba(150,219,251,0.85)" }}
          aria-hidden
        />
      ) : null}
    </>
  );

  const handlers = {
    onMouseEnter: (e: ReactMouseEvent<HTMLElement>) => {
      if (!active) e.currentTarget.style.background = idleHoverBg;
    },
    onMouseLeave: (e: ReactMouseEvent<HTMLElement>) => {
      e.currentTarget.style.background = active ? activeBg : "transparent";
    },
  };

  if (href) {
    return (
      <a
        href={href}
        aria-label={ariaLabel}
        aria-current={active ? "page" : undefined}
        className={className}
        style={style}
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
        }}
        {...handlers}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={className}
      style={style}
      onClick={onClick}
      {...handlers}
    >
      {content}
    </button>
  );
}

function SidebarSecondaryRail({
  id,
  title,
  mode,
  searchPlaceholder,
  noMatchLabel,
  query,
  onQueryChange,
  rows,
  isEmptyList,
  onClose,
  closeLabel,
}: {
  id: string;
  title: string;
  mode: "desktop" | "mobile";
  searchPlaceholder: string;
  noMatchLabel: string;
  query: string;
  onQueryChange: (value: string) => void;
  rows: ReactNode;
  isEmptyList: boolean;
  /** Closes only the secondary rail — does not affect primary expand/collapse. */
  onClose: () => void;
  closeLabel: string;
}) {
  const searching = query.trim().length > 0;

  return (
    <div
      id={id}
      role="navigation"
      aria-label={title}
      className={
        mode === "desktop"
          ? "relative z-[1] flex h-full min-h-0 flex-shrink-0 flex-col overflow-hidden"
          : "relative z-[2] flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      }
      style={
        mode === "desktop"
          ? {
            width: SIDEBAR_SECONDARY_WIDTH,
            background:
              "linear-gradient(0deg, rgba(255,255,255,0.035), rgba(255,255,255,0.035)), " +
              LX.gradient.nav,
            borderLeft: "1px solid rgba(255,255,255,0.08)",
          }
          : { background: LX.gradient.nav }
      }
    >
      <div
        className="flex-shrink-0 px-3.5 pb-2.5 pt-3"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          // Keep title/X/search clear of the floating primary-collapse control
          // anchored on the outer nav shell when this rail is open.
          ...(mode === "desktop"
            ? { paddingRight: SIDEBAR_TOGGLE_SIZE }
            : null),
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <p
            className="min-w-0 flex-1 truncate luxia-type-nav-sidebar"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]"
            style={{ color: "rgba(255,255,255,0.62)" }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = "rgba(255,255,255,0.92)";
              event.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = "rgba(255,255,255,0.62)";
              event.currentTarget.style.background = "transparent";
            }}
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <label className="mt-2.5 block">
          <span className="sr-only">{searchPlaceholder}</span>
          <input
            type="search"
            value={query}
            placeholder={searchPlaceholder}
            onChange={(e) => onQueryChange(e.target.value)}
            className="h-9 w-full rounded-[8px] border px-3 luxia-type-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]"
            style={{
              borderColor: "rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.92)",
            }}
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical">
        {isEmptyList ? (
          <p className="px-3.5 py-2 luxia-type-caption" style={{ color: "rgba(255,255,255,0.4)" }}>
            {searching ? noMatchLabel : `No available ${title}`}
          </p>
        ) : (
          <div className="space-y-px">{rows}</div>
        )}
      </div>
    </div>
  );
}

function DemoIdentityControl({
  compact,
  profileName,
  orgRoleLabel,
  projectContextLine,
  profileAria,
  prototypeUserId,
  prototypeUsers,
  onPrototypeUserChange,
}: {
  compact?: boolean;
  profileName: string;
  orgRoleLabel: string;
  projectContextLine?: string | null;
  profileAria: string;
  prototypeUserId?: string;
  prototypeUsers: DemoPrototypeUser[];
  onPrototypeUserChange: (userId: string) => void;
}) {
  return (
    <div className={compact ? "block w-full min-w-0" : "block min-w-0"}>
      {!compact ? (
        <p
          className="mb-1 luxia-type-caption"
          style={{ color: "rgba(255,255,255,0.45)" }}
          id="luxia-demo-identity-label"
        >
          Demo identity
        </p>
      ) : null}
      <Select
        value={prototypeUserId ?? ""}
        onValueChange={onPrototypeUserChange}
      >
        <SelectTrigger
          size="sm"
          aria-labelledby={compact ? undefined : "luxia-demo-identity-label"}
          aria-label={compact ? "Demo identity" : "Demo identity"}
          className={
            compact
              ? "h-10 min-h-10 w-full border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus-visible:border-[rgba(150,219,251,0.55)] focus-visible:shadow-[0_0_0_3px_rgba(150,219,251,0.22)] [&_svg]:hidden"
              : "h-9 min-h-9 w-full min-w-0 border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-2.5 py-0 text-left text-[rgba(255,255,255,0.92)] hover:border-[rgba(255,255,255,0.28)] focus-visible:border-[rgba(150,219,251,0.55)] focus-visible:shadow-[0_0_0_3px_rgba(150,219,251,0.22)] [&_svg]:text-[rgba(255,255,255,0.55)]"
          }
        >
          {compact ? (
            <span className="flex w-full items-center justify-center" aria-label={profileAria}>
              {prototypeUserId ? (
                <DemoUserAvatar userId={prototypeUserId} aria-hidden={false} />
              ) : null}
            </span>
          ) : (
            <SelectValue placeholder="Select identity">
              <span className="flex min-w-0 items-center gap-2 text-left leading-tight">
                {prototypeUserId ? (
                  <DemoUserAvatar userId={prototypeUserId} />
                ) : null}
                <span className="min-w-0 flex flex-1 flex-col gap-0.5">
                  <span className="truncate luxia-type-caption">{profileName}</span>
                  <span
                    className="truncate luxia-type-caption"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {orgRoleLabel}
                  </span>
                </span>
              </span>
            </SelectValue>
          )}
        </SelectTrigger>
        <SelectContent
          position="popper"
          side="top"
          sideOffset={6}
          className="z-[60] min-w-[var(--radix-select-trigger-width)]"
        >
          {prototypeUsers.map((user) => {
            const accessibleName = `${user.name}, ${user.contextLabel}`;
            return (
              <SelectItem
                key={user.id}
                value={user.id}
                textValue={accessibleName}
                className="data-[state=checked]:bg-[var(--luxia-opacity-brand-secondary-08)]"
              >
                <span className="flex w-full min-w-0 items-center gap-2 py-0.5 pr-1">
                  <DemoUserAvatar userId={user.id} />
                  <span className="min-w-0 flex flex-1 flex-col gap-0.5">
                    <span className="truncate">{user.name}</span>
                    <span
                      className="truncate luxia-type-caption"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      {user.contextLabel}
                    </span>
                  </span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {!compact && projectContextLine ? (
        <p
          className="mt-1 min-w-0 truncate luxia-type-caption leading-tight"
          style={{ color: "rgba(255,255,255,0.38)" }}
          title={projectContextLine}
        >
          {projectContextLine}
        </p>
      ) : null}
      {!compact ? (
        <span
          className="mt-1 block luxia-type-caption leading-tight"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Prototype preview only
        </span>
      ) : null}
    </div>
  );
}

export function LeftNav({
  collapsed,
  onToggleCollapsed,
  isMobileDrawer = false,
  mobileOpen = false,
  onMobileClose,
  homeActive,
  usersActive,
  dataSourcesActive,
  projectId,
  projectLabel,
  showProjectContext = true,
  showGalaxy = true,
  activeProjectSection,
  activeChatId,
  activeConstellationId,
  projectChats = [],
  projectConstellations = [],
  switchableProjects = [],
  chatTotalCount,
  constellationTotalCount,
  onHomeClick,
  onUsersClick,
  onDataSourcesClick,
  onProjectSectionClick,
  onSwitchProject,
  onOpenChat,
  onOpenConstellation,
  prototypeUser,
  prototypeProjectRole,
  activeProjectLabel,
  onPrototypeUserChange,
  prototypeUsers,
  onSecondaryRailOpenChange,
}: LeftNavProps) {
  const reactId = useId();
  const constellationsPanelId = `${reactId}-constellations-rail`;
  const chatsPanelId = `${reactId}-chats-rail`;
  const projectsPanelId = `${reactId}-projects-rail`;

  const asideRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const constellationsAnchorRef = useRef<HTMLDivElement>(null);
  const chatsAnchorRef = useRef<HTMLDivElement>(null);
  const constellationsDisclosureRef = useRef<HTMLButtonElement>(null);
  const chatsDisclosureRef = useRef<HTMLButtonElement>(null);
  const collapsedConstellationsRef = useRef<HTMLButtonElement>(null);
  const collapsedChatsRef = useRef<HTMLButtonElement>(null);
  const projectSwitcherRef = useRef<HTMLButtonElement>(null);
  const collapsedProjectSwitcherRef = useRef<HTMLButtonElement>(null);
  const restoreFocusKindRef = useRef<FlyoutKind | null>(null);

  const [flyout, setFlyout] = useState<FlyoutKind | null>(null);
  const [constellationQuery, setConstellationQuery] = useState("");
  const [chatQuery, setChatQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");

  const showDemoIdentity = Boolean(prototypeUsers && onPrototypeUserChange);
  const navPadding = collapsed ? "px-2" : "px-3";
  const showProjectNav = Boolean(projectId && projectLabel && showProjectContext);
  const canSwitchProjects = switchableProjects.length > 1;
  const overviewHref = projectId ? getProjectPath(projectId) : undefined;
  const galaxyHref = projectId ? getGalaxyPath(projectId) : undefined;
  const dashboardHref = projectId ? getDashboardPath(projectId) : undefined;
  const constellationsHref = projectId ? getConstellationsPath(projectId) : undefined;
  const chatsHref = projectId ? getProjectChatsPath(projectId) : undefined;
  const membersHref = projectId ? getProjectMembersPath(projectId) : undefined;

  const profileName = prototypeUser?.name ?? SIDEBAR_PROFILE_NAME;
  const profileOrgRoleLabel = formatOrganizationRoleLabel(prototypeUser?.orgRole);
  const demoProjectContextLine = activeProjectLabel
    ? `${activeProjectLabel} · ${prototypeProjectRole ?? NO_PROJECT_ROLE_LABEL}`
    : null;
  const profileAria = `User profile: ${profileName}. ${profileOrgRoleLabel}.`;
  const demoAria = demoProjectContextLine
    ? `Demo identity: ${profileName}. ${profileOrgRoleLabel}. ${demoProjectContextLine}. Prototype preview only.`
    : `Demo identity: ${profileName}. ${profileOrgRoleLabel}. Prototype preview only.`;

  const chatsCount = chatTotalCount ?? projectChats.length;
  const constellationsCount = constellationTotalCount ?? projectConstellations.length;
  const railCollapsed = isMobileDrawer ? false : collapsed;
  const widthStyle = isMobileDrawer
    ? SIDEBAR_WIDTH_EXPANDED
    : (collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED);
  const showProjectSettings = PROJECT_SETTINGS_DESTINATION_AVAILABLE
    && canAccessProjectSettingsForUser(prototypeUser?.id, prototypeProjectRole);

  const quickChats = useMemo(
    () =>
      pickQuickFlyoutItems(
        projectChats,
        activeChatId,
        SECONDARY_QUICK_LIMIT,
        (item) => (item.pinned ? 1_000_000_000_000 : 0) + item.lastOpenedTimestamp,
      ),
    [projectChats, activeChatId],
  );

  const quickConstellations = useMemo(
    () =>
      pickQuickFlyoutItems(
        projectConstellations,
        activeConstellationId,
        SECONDARY_QUICK_LIMIT,
        (item) => (item.pinned ? 1_000_000_000_000 : 0) + item.updatedAtTimestamp,
      ),
    [projectConstellations, activeConstellationId],
  );

  const constellationSearchRows = useMemo(
    () => filterFlyoutSearch(projectConstellations, constellationQuery, SECONDARY_SEARCH_RESULT_LIMIT),
    [projectConstellations, constellationQuery],
  );

  const chatSearchRows = useMemo(
    () => filterFlyoutSearch(projectChats, chatQuery, SECONDARY_SEARCH_RESULT_LIMIT),
    [projectChats, chatQuery],
  );

  const projectBrowseRows = useMemo(() => {
    const sorted = [...switchableProjects].sort((a, b) => {
      if (a.id === projectId) return -1;
      if (b.id === projectId) return 1;
      return a.label.localeCompare(b.label);
    });
    return sorted.slice(0, PROJECT_SWITCHER_LIST_LIMIT);
  }, [switchableProjects, projectId]);

  const projectSearchRows = useMemo(
    () => filterFlyoutSearch(switchableProjects, projectQuery, SECONDARY_SEARCH_RESULT_LIMIT),
    [switchableProjects, projectQuery],
  );

  const getFlyoutTrigger = useCallback(
    (kind: FlyoutKind): HTMLElement | null => {
      if (kind === "projects") {
        return railCollapsed
          ? collapsedProjectSwitcherRef.current
          : projectSwitcherRef.current;
      }
      if (railCollapsed) {
        return kind === "constellations"
          ? collapsedConstellationsRef.current
          : collapsedChatsRef.current;
      }
      return kind === "constellations"
        ? (constellationsDisclosureRef.current ?? constellationsAnchorRef.current)
        : (chatsDisclosureRef.current ?? chatsAnchorRef.current);
    },
    [railCollapsed],
  );

  const closeFlyout = useCallback(
    (options?: { restoreFocus?: boolean }) => {
      if (options?.restoreFocus && flyout) {
        restoreFocusKindRef.current = flyout;
      } else {
        restoreFocusKindRef.current = null;
      }
      setFlyout(null);
      setConstellationQuery("");
      setChatQuery("");
      setProjectQuery("");
    },
    [flyout],
  );

  const clearSecondaryRail = useCallback(() => {
    restoreFocusKindRef.current = null;
    setFlyout(null);
    setConstellationQuery("");
    setChatQuery("");
    setProjectQuery("");
  }, []);

  const handlePrimaryCollapseToggle = useCallback(() => {
    onToggleCollapsed();
  }, [onToggleCollapsed]);

  const closeSecondaryRail = useCallback(() => {
    closeFlyout({ restoreFocus: true });
  }, [closeFlyout]);

  const toggleFlyout = useCallback((kind: FlyoutKind) => {
    setFlyout((prev) => {
      if (prev === kind) {
        restoreFocusKindRef.current = kind;
        setConstellationQuery("");
        setChatQuery("");
        setProjectQuery("");
        return null;
      }
      restoreFocusKindRef.current = null;
      setConstellationQuery("");
      setChatQuery("");
      setProjectQuery("");
      return kind;
    });
  }, []);

  const openProjectSwitcher = useCallback(() => {
    if (!canSwitchProjects) return;
    toggleFlyout("projects");
  }, [canSwitchProjects, toggleFlyout]);

  /** Full-page destinations close the rail; child entity picks keep it open on desktop. */
  const navigateAndCloseFlyout = useCallback((action: () => void) => {
    clearSecondaryRail();
    action();
  }, [clearSecondaryRail]);

  const selectProjectAndClose = useCallback(
    (nextProjectId: string) => {
      navigateAndCloseFlyout(() => {
        onSwitchProject?.(nextProjectId);
        onMobileClose?.();
      });
    },
    [navigateAndCloseFlyout, onSwitchProject, onMobileClose],
  );

  const navigateChildEntity = useCallback(
    (action: () => void) => {
      if (isMobileDrawer) {
        clearSecondaryRail();
        action();
        onMobileClose?.();
        return;
      }
      action();
    },
    [isMobileDrawer, onMobileClose, clearSecondaryRail],
  );

  useEffect(() => {
    onSecondaryRailOpenChange?.(!isMobileDrawer && flyout !== null);
  }, [flyout, isMobileDrawer, onSecondaryRailOpenChange]);

  useEffect(() => {
    clearSecondaryRail();
  }, [projectId, prototypeUser?.id, showProjectContext, clearSecondaryRail]);

  useEffect(() => {
    if (isMobileDrawer && !mobileOpen) {
      clearSecondaryRail();
    }
  }, [isMobileDrawer, mobileOpen, clearSecondaryRail]);

  useEffect(() => {
    if (flyout !== null) return;
    const kind = restoreFocusKindRef.current;
    if (!kind) return;
    restoreFocusKindRef.current = null;
    getFlyoutTrigger(kind)?.focus();
  }, [flyout, getFlyoutTrigger]);

  useEffect(() => {
    if (!flyout) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFlyout({ restoreFocus: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flyout, closeFlyout]);

  useEffect(() => {
    if (!isMobileDrawer || !mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (flyout) {
          closeFlyout({ restoreFocus: true });
          return;
        }
        onMobileClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileDrawer, mobileOpen, onMobileClose, flyout, closeFlyout]);

  function renderConstellationRow(item: LeftNavConstellationPreview) {
    return (
      <FlyoutNavRow
        key={item.id}
        icon={LuxiaConstellationIcon}
        label={item.label}
        active={activeConstellationId === item.id}
        href={projectId ? getConstellationSettingsPath(projectId, item.id) : undefined}
        onClick={() => {
          if (!projectId) return;
          navigateChildEntity(() => {
            onOpenConstellation?.(projectId, item.id);
          });
        }}
      />
    );
  }

  function renderChatRow(item: LeftNavChatPreview) {
    return (
      <FlyoutNavRow
        key={item.id}
        icon={item.chatSource === "galaxy" ? LuxiaGalaxyIcon : LuxiaChatIcon}
        label={item.label}
        active={activeChatId === item.id}
        href={
          item.chatSource === "constellation"
            && projectId
            && item.constellationId
            ? getConstellationChatPath(projectId, item.constellationId, item.id)
            : getChatPath(item.id)
        }
        onClick={() => {
          navigateChildEntity(() => {
            onOpenChat?.(item.id);
          });
        }}
      />
    );
  }

  const constellationRows = constellationQuery.trim()
    ? constellationSearchRows.map(renderConstellationRow)
    : quickConstellations.map(renderConstellationRow);

  const chatRows = chatQuery.trim()
    ? chatSearchRows.map(renderChatRow)
    : quickChats.map(renderChatRow);

  const constellationListEmpty = constellationQuery.trim()
    ? constellationSearchRows.length === 0
    : quickConstellations.length === 0;

  const chatListEmpty = chatQuery.trim()
    ? chatSearchRows.length === 0
    : quickChats.length === 0;

  function renderProjectRow(item: LeftNavProjectPreview) {
    const roleLabel = item.projectRole ?? NO_PROJECT_ROLE_LABEL;
    return (
      <ProjectSwitcherRow
        key={item.id}
        label={item.label}
        roleLabel={roleLabel}
        active={projectId === item.id}
        href={getProjectPath(item.id)}
        onClick={() => selectProjectAndClose(item.id)}
      />
    );
  }

  const projectRows = projectQuery.trim()
    ? projectSearchRows.map(renderProjectRow)
    : projectBrowseRows.map(renderProjectRow);

  const projectListEmpty = projectQuery.trim()
    ? projectSearchRows.length === 0
    : projectBrowseRows.length === 0;

  const mobileFlyoutActive = isMobileDrawer && Boolean(flyout);

  const desktopSecondaryRail =
    !isMobileDrawer && flyout === "projects" ? (
      <SidebarSecondaryRail
        id={projectsPanelId}
        mode="desktop"
        title="Projects"
        searchPlaceholder="Search Projects"
        noMatchLabel="No matching Projects"
        query={projectQuery}
        onQueryChange={setProjectQuery}
        rows={projectRows}
        isEmptyList={projectListEmpty}
        onClose={closeSecondaryRail}
        closeLabel="Close Projects navigation"
      />
    ) : !isMobileDrawer && flyout === "constellations" ? (
      <SidebarSecondaryRail
        id={constellationsPanelId}
        mode="desktop"
        title="Constellations"
        searchPlaceholder="Search Constellations"
        noMatchLabel="No matching Constellations"
        query={constellationQuery}
        onQueryChange={setConstellationQuery}
        rows={constellationRows}
        isEmptyList={constellationListEmpty}
        onClose={closeSecondaryRail}
        closeLabel="Close Constellations navigation"
      />
    ) : !isMobileDrawer && flyout === "chats" ? (
      <SidebarSecondaryRail
        id={chatsPanelId}
        mode="desktop"
        title="Chats"
        searchPlaceholder="Search Chats"
        noMatchLabel="No matching Chats"
        query={chatQuery}
        onQueryChange={setChatQuery}
        rows={chatRows}
        isEmptyList={chatListEmpty}
        onClose={closeSecondaryRail}
        closeLabel="Close Chats navigation"
      />
    ) : null;

  const aside = (
    <aside
      ref={asideRef}
      className="relative h-full min-h-0 flex-shrink-0"
      aria-label="Luxia sidebar"
      style={{
        width: widthStyle,
        transition: "width 200ms ease",
        overflow: "visible",
        ...(typeof window !== "undefined"
          && window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? { transition: "none" }
          : null),
      }}
    >
      <div
        className="relative flex h-full min-h-0 flex-col overflow-hidden"
        style={{ background: LX.gradient.nav, width: "100%" }}
      >
        {!railCollapsed ? <SidebarStarDecoration /> : null}

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {isMobileDrawer && mobileFlyoutActive && flyout === "projects" ? (
            <div
              className="absolute inset-0 z-[4] flex flex-col overflow-hidden"
              style={{ background: LX.gradient.nav }}
            >
              <SidebarSecondaryRail
                id={projectsPanelId}
                mode="mobile"
                title="Projects"
                searchPlaceholder="Search Projects"
                noMatchLabel="No matching Projects"
                query={projectQuery}
                onQueryChange={setProjectQuery}
                rows={projectRows}
                isEmptyList={projectListEmpty}
                onClose={closeSecondaryRail}
                closeLabel="Close Projects navigation"
              />
            </div>
          ) : null}
          {isMobileDrawer && mobileFlyoutActive && flyout === "constellations" ? (
            <div
              className="absolute inset-0 z-[4] flex flex-col overflow-hidden"
              style={{ background: LX.gradient.nav }}
            >
              <SidebarSecondaryRail
                id={constellationsPanelId}
                mode="mobile"
                title="Constellations"
                searchPlaceholder="Search Constellations"
                noMatchLabel="No matching Constellations"
                query={constellationQuery}
                onQueryChange={setConstellationQuery}
                rows={constellationRows}
                isEmptyList={constellationListEmpty}
                onClose={closeSecondaryRail}
                closeLabel="Close Constellations navigation"
              />
            </div>
          ) : null}
          {isMobileDrawer && mobileFlyoutActive && flyout === "chats" ? (
            <div
              className="absolute inset-0 z-[4] flex flex-col overflow-hidden"
              style={{ background: LX.gradient.nav }}
            >
              <SidebarSecondaryRail
                id={chatsPanelId}
                mode="mobile"
                title="Chats"
                searchPlaceholder="Search Chats"
                noMatchLabel="No matching Chats"
                query={chatQuery}
                onQueryChange={setChatQuery}
                rows={chatRows}
                isEmptyList={chatListEmpty}
                onClose={closeSecondaryRail}
                closeLabel="Close Chats navigation"
              />
            </div>
          ) : null}

          <>
            <div
              className={`relative z-[2] flex-shrink-0 ${railCollapsed ? "flex justify-center" : ""}`}
              style={{
                paddingTop: SIDEBAR_BRAND_TOP,
                paddingLeft: railCollapsed ? 0 : SIDEBAR_BRAND_LEFT,
                paddingRight: railCollapsed ? 0 : SIDEBAR_BRAND_LEFT,
                paddingBottom: SIDEBAR_BRAND_BOTTOM,
              }}
            >
              {railCollapsed ? <CollapsedStarLogo /> : <LuxiaLogo />}
            </div>

            <div
              ref={scrollRef}
              className="relative z-[2] min-h-0 flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical luxia-scrollbar-sidebar"
            >
              <nav className={`${navPadding} space-y-px`} aria-label="Global workspace">
                {NAV_TOP_ITEMS.map(({ id, icon, label, available, unavailableHint }) => (
                  <NavItem
                    key={id}
                    icon={icon}
                    label={label}
                    collapsed={railCollapsed}
                    active={
                      id === "home"
                        ? homeActive
                        : id === "users"
                          ? usersActive
                          : id === "datasources"
                            ? dataSourcesActive
                            : false
                    }
                    disabled={!available}
                    tooltip={!available ? unavailableHint ?? label : label}
                    href={
                      id === "home" && available
                        ? "/"
                        : id === "users" && available
                          ? getAccessLevelsPath()
                          : id === "datasources" && available
                            ? getDataSourcesPath()
                            : undefined
                    }
                    onClick={
                      id === "home"
                        ? () => {
                          closeFlyout();
                          onHomeClick?.();
                          onMobileClose?.();
                        }
                        : id === "users"
                          ? () => {
                            closeFlyout();
                            onUsersClick?.();
                            onMobileClose?.();
                          }
                          : id === "datasources"
                            ? () => {
                              closeFlyout();
                              onDataSourcesClick?.();
                              onMobileClose?.();
                            }
                            : undefined
                    }
                  />
                ))}
              </nav>

              {showProjectNav ? (
                <>
                  <div
                    className={`my-2.5 ${railCollapsed ? "mx-2" : "mx-4"}`}
                    style={{ height: 1, background: "rgba(255,255,255,0.07)" }}
                    role="separator"
                  />
                  <div className={navPadding}>
                    {!railCollapsed ? (
                      <div className="mb-1.5 px-3.5">
                        <p
                          className="luxia-type-overline-data"
                          style={{ color: "rgba(150,219,251,0.55)" }}
                        >
                          PROJECT
                        </p>
                        {canSwitchProjects ? (
                          <button
                            ref={projectSwitcherRef}
                            type="button"
                            className="mt-1 flex w-full min-w-0 items-center gap-1.5 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]"
                            style={{
                              color: "rgba(255,255,255,0.88)",
                              background: flyout === "projects"
                                ? "rgba(255,255,255,0.08)"
                                : "transparent",
                            }}
                            title={projectLabel ?? undefined}
                            aria-expanded={flyout === "projects"}
                            aria-controls={projectsPanelId}
                            aria-label={`Current Project: ${projectLabel}. Switch Project`}
                            onClick={openProjectSwitcher}
                            onMouseEnter={(e) => {
                              if (flyout !== "projects") {
                                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = flyout === "projects"
                                ? "rgba(255,255,255,0.08)"
                                : "transparent";
                            }}
                          >
                            <span className="min-w-0 flex-1 truncate luxia-type-nav-sidebar">
                              {projectLabel}
                            </span>
                            <ChevronDown
                              size={14}
                              strokeWidth={2}
                              className="flex-shrink-0"
                              style={{
                                color: "rgba(255,255,255,0.5)",
                                transform: flyout === "projects" ? "rotate(0deg)" : "rotate(-90deg)",
                                transition: "transform 160ms ease",
                              }}
                              aria-hidden
                            />
                          </button>
                        ) : (
                          <p
                            className="mt-1 truncate luxia-type-nav-sidebar"
                            style={{ color: "rgba(255,255,255,0.88)" }}
                            title={projectLabel ?? undefined}
                          >
                            {projectLabel}
                          </p>
                        )}
                      </div>
                    ) : null}

                    <nav className="space-y-px" aria-label="Current project">
                      <NavItem
                        icon={LuxiaProjectsIcon}
                        label="Overview"
                        tooltip={
                          railCollapsed && canSwitchProjects
                            ? "Switch Project"
                            : "Project overview"
                        }
                        active={
                          activeProjectSection === "overview"
                          || (railCollapsed && flyout === "projects")
                        }
                        collapsed={railCollapsed}
                        href={railCollapsed && canSwitchProjects ? undefined : overviewHref}
                        ariaExpanded={
                          railCollapsed && canSwitchProjects
                            ? flyout === "projects"
                            : undefined
                        }
                        ariaControls={
                          railCollapsed && canSwitchProjects
                            ? projectsPanelId
                            : undefined
                        }
                        buttonRef={
                          railCollapsed && canSwitchProjects
                            ? collapsedProjectSwitcherRef
                            : undefined
                        }
                        onClick={() => {
                          if (railCollapsed && canSwitchProjects) {
                            openProjectSwitcher();
                            return;
                          }
                          closeFlyout();
                          onProjectSectionClick?.("overview");
                          onMobileClose?.();
                        }}
                      />
                      {showGalaxy ? (
                        <NavItem
                          icon={LuxiaGalaxyIcon}
                          label="Galaxy"
                          tooltip="Galaxy"
                          active={activeProjectSection === "galaxy"}
                          collapsed={railCollapsed}
                          href={galaxyHref}
                          onClick={() => {
                            closeFlyout();
                            onProjectSectionClick?.("galaxy");
                            onMobileClose?.();
                          }}
                        />
                      ) : null}

                      {railCollapsed ? (
                        <>
                          <NavItem
                            icon={LuxiaConstellationIcon}
                            label="Constellations"
                            tooltip="Constellations"
                            active={activeProjectSection === "constellations" || flyout === "constellations"}
                            collapsed
                            count={constellationsCount}
                            ariaExpanded={flyout === "constellations"}
                            ariaControls={constellationsPanelId}
                            buttonRef={collapsedConstellationsRef}
                            onClick={() => toggleFlyout("constellations")}
                          />
                          <NavItem
                            icon={LuxiaChatIcon}
                            label="Chats"
                            tooltip="Chats"
                            active={activeProjectSection === "chats" || flyout === "chats"}
                            collapsed
                            count={chatsCount}
                            ariaExpanded={flyout === "chats"}
                            ariaControls={chatsPanelId}
                            buttonRef={collapsedChatsRef}
                            onClick={() => toggleFlyout("chats")}
                          />
                        </>
                      ) : (
                        <>
                          <ProjectDisclosureSection
                            label="Constellations"
                            icon={LuxiaConstellationIcon}
                            count={constellationsCount}
                            href={constellationsHref}
                            active={
                              activeProjectSection === "constellations" || Boolean(activeConstellationId)
                            }
                            childActive={Boolean(activeConstellationId)}
                            expanded={flyout === "constellations"}
                            panelId={constellationsPanelId}
                            anchorRef={constellationsAnchorRef}
                            disclosureRef={constellationsDisclosureRef}
                            onToggleExpand={() => toggleFlyout("constellations")}
                            onNavigate={() => {
                              navigateAndCloseFlyout(() => {
                                onProjectSectionClick?.("constellations");
                                onMobileClose?.();
                              });
                            }}
                          />
                          <ProjectDisclosureSection
                            label="Chats"
                            icon={LuxiaChatIcon}
                            count={chatsCount}
                            href={chatsHref}
                            active={activeProjectSection === "chats"}
                            childActive={Boolean(activeChatId) && activeProjectSection === "chats"}
                            expanded={flyout === "chats"}
                            panelId={chatsPanelId}
                            anchorRef={chatsAnchorRef}
                            disclosureRef={chatsDisclosureRef}
                            onToggleExpand={() => toggleFlyout("chats")}
                            onNavigate={() => {
                              navigateAndCloseFlyout(() => {
                                onProjectSectionClick?.("chats");
                                onMobileClose?.();
                              });
                            }}
                          />
                        </>
                      )}

                      <NavItem
                        icon={LuxiaDashboardIcon}
                        label="Dashboard"
                        tooltip="Dashboard"
                        active={activeProjectSection === "dashboard"}
                        collapsed={railCollapsed}
                        href={dashboardHref}
                        onClick={() => {
                          closeFlyout();
                          onProjectSectionClick?.("dashboard");
                          onMobileClose?.();
                        }}
                      />
                      <NavItem
                        icon={LuxiaUserPermissionsIcon}
                        label="Members & Roles"
                        tooltip="Members & Roles"
                        active={activeProjectSection === "members"}
                        collapsed={railCollapsed}
                        href={membersHref}
                        onClick={() => {
                          closeFlyout();
                          onProjectSectionClick?.("members");
                          onMobileClose?.();
                        }}
                      />
                      {showProjectSettings ? (
                        <NavItem
                          icon={LuxiaSettingsIcon}
                          label="Project Settings"
                          tooltip="Project Settings"
                          collapsed={railCollapsed}
                          onClick={() => {
                            closeFlyout();
                            onMobileClose?.();
                          }}
                        />
                      ) : null}
                    </nav>
                  </div>
                </>
              ) : null}
            </div>

            <div
              className={`relative z-[2] flex-shrink-0 ${navPadding} space-y-px pb-1 pt-2`}
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <nav className="space-y-px" aria-label="Utilities">
                {NAV_BOTTOM_ITEMS.map(({ id, icon, label, available, unavailableHint }) => (
                  <NavItem
                    key={id}
                    icon={icon}
                    label={label}
                    collapsed={railCollapsed}
                    disabled={!available}
                    tooltip={!available ? unavailableHint ?? label : label}
                  />
                ))}
              </nav>
            </div>
          </>
        </div>

        {railCollapsed ? (
              <div
                className="relative z-[2] flex flex-shrink-0 flex-col items-center gap-2 px-2 py-2.5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                {showDemoIdentity && prototypeUsers && onPrototypeUserChange ? (
                  <DemoIdentityControl
                    compact
                    profileName={profileName}
                    orgRoleLabel={profileOrgRoleLabel}
                    projectContextLine={demoProjectContextLine}
                    profileAria={demoAria}
                    prototypeUserId={prototypeUser?.id}
                    prototypeUsers={prototypeUsers}
                    onPrototypeUserChange={onPrototypeUserChange}
                  />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center justify-center"
                        aria-label={profileAria}
                      >
                        {prototypeUser?.id ? (
                          <DemoUserAvatar userId={prototypeUser.id} aria-hidden={false} />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white luxia-type-caption flex-shrink-0"
                            style={{ background: "var(--luxia-neutral-600)" }}
                            aria-hidden
                          >
                            {SIDEBAR_PROFILE_INITIALS}
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="max-w-[220px]">
                      <div className="flex flex-col gap-0.5">
                        <span>{profileName}</span>
                        <span>{profileOrgRoleLabel}</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ) : (
              <div
                className="relative z-[2] flex flex-shrink-0 flex-col gap-2 px-4 py-2.5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {prototypeUser?.id ? (
                    <DemoUserAvatar userId={prototypeUser.id} aria-hidden={false} />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white luxia-type-caption flex-shrink-0"
                      style={{ background: "var(--luxia-neutral-600)" }}
                      aria-hidden
                    >
                      {SIDEBAR_PROFILE_INITIALS}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white luxia-type-profile-secondary truncate leading-tight">
                      {profileName}
                    </p>
                    <p
                      className="luxia-type-profile-secondary truncate leading-tight"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {profileOrgRoleLabel}
                    </p>
                  </div>
                </div>
                {showDemoIdentity && prototypeUsers && onPrototypeUserChange ? (
                  <DemoIdentityControl
                    profileName={profileName}
                    orgRoleLabel={profileOrgRoleLabel}
                    projectContextLine={demoProjectContextLine}
                    profileAria={demoAria}
                    prototypeUserId={prototypeUser?.id}
                    prototypeUsers={prototypeUsers}
                    onPrototypeUserChange={onPrototypeUserChange}
                  />
                ) : null}
              </div>
            )}
      </div>
    </aside>
  );

  const desktopShell = (
    <div className="relative flex h-dvh min-h-0 flex-shrink-0">
      {aside}
      {desktopSecondaryRail}
      <SidebarCollapseToggle collapsed={collapsed} onToggle={handlePrimaryCollapseToggle} />
    </div>
  );

  if (isMobileDrawer) {
    return (
      <>
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-[40]"
            style={{ background: "rgba(8, 5, 18, 0.45)" }}
            onClick={onMobileClose}
          />
        ) : null}
        <div
          className="fixed inset-y-0 left-0 z-[50] h-dvh"
          style={{
            transform: mobileOpen ? "translateX(0)" : "translateX(-105%)",
            transition: "transform 200ms ease",
            visibility: mobileOpen ? "visible" : "hidden",
          }}
        >
          {aside}
        </div>
      </>
    );
  }

  return desktopShell;
}
