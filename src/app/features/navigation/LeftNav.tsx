import {
  Fragment,
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
import { Check, ChevronDown, ChevronLeft, ChevronRight, Compass, Users, X } from "lucide-react";
import luxiaWordmarkUrl from "@/assets/brand/Luxia-Star.svg";
import sidebarStarLogoUrl from "@/assets/brand/Star.svg";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { AccountMenu } from "@/app/features/navigation/AccountMenu";
import { LX } from "@/app/features/active-data-tables/luxiaTokens";
import type { ProjectNavSection } from "@/app/features/project-overview/types";
import { formatOrganizationRoleLabel, NO_PROJECT_ROLE_LABEL } from "@/app/features/permissions/currentUser";
import {
  getAccessLevelsPath,
  getAdminPipelinesPath,
  getToolsPath,
  getExplorePath,
  getConstellationSettingsPath,
  getConstellationsPath,
  getDashboardPath,
  getDataSourcesPath,
  getGalaxyPath,
  getOrganizationUsersPath,
  getProjectChatsPath,
  getProjectMembersPath,
  getProjectPipelinesPath,
  getPipelinePath,
  getProjectVidgetsPath,
  getProjectPath,
  getChatPath,
  getConstellationChatPath,
  getVidgetSettingsPath,
} from "@/app/features/project/projectPaths";
import { canViewProjectPipelines } from "@/app/features/pipelines/access";
import {
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaDatasourceIcon,
  LuxiaGalaxyIcon,
  LuxiaHomeIcon,
  LuxiaPipelineIcon,
  LuxiaProjectsIcon,
  LuxiaSettingsIcon,
  LuxiaToolsGalleryIcon,
  LuxiaUserPermissionsIcon,
  LuxiaVirtualAssistantIcon,
  type LuxiaIconProps,
} from "@/assets/icons";
import { canAccessProjectSettingsForUser } from "@/app/features/permissions/accessGuards";
import type { ProjectRole } from "@/app/features/permissions/types";

export const SIDEBAR_WIDTH_EXPANDED = 280;
export const SIDEBAR_WIDTH_COLLAPSED = 76;
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

type NavIconComponent = (props: LuxiaIconProps) => ReactElement;

function LuxiaOrgUsersIcon({
  size = 16,
  color = "currentColor",
  className,
  style,
  ...rest
}: LuxiaIconProps) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", color, lineHeight: 0, ...style }}
      {...rest}
    >
      <Users size={size} strokeWidth={1.75} color="currentColor" aria-hidden />
    </span>
  );
}

type FlyoutKind =
  | "constellations"
  | "chats"
  | "dashboard"
  | "vidgets"
  | "pipelines"
  | "projects";

export type LeftNavDashboardPreview = {
  id: string;
  label: string;
  updatedAtTimestamp: number;
};

export type LeftNavVidgetPreview = {
  id: string;
  label: string;
  updatedAtTimestamp: number;
};

export type LeftNavPipelinePreview = {
  id: string;
  label: string;
  /** Optional technical id — used for search matching only, not shown in the row. */
  dagId?: string;
  updatedAtTimestamp: number;
};

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
  organizationUsersActive?: boolean;
  accessLevelsActive?: boolean;
  dataSourcesActive?: boolean;
  adminPipelinesActive?: boolean;
  toolsActive?: boolean;
  exploreActive?: boolean;
  /** Important unread updates; shows a subtle dot on Explore Luxia when above 0. */
  exploreUnreadCount?: number;
  /** When false, Pipeline Admin nav item is hidden (non–Org Admin). */
  canAdministerPipelines?: boolean;
  /**
   * When true, auto-closes the Pipelines secondary collector rail so
   * Main Nav + Detail are not squeezed on mid-width viewports.
   */
  collapsePipelinesCollector?: boolean;
  projectId?: string | null;
  projectLabel?: string | null;
  showProjectContext?: boolean;
  showGalaxy?: boolean;
  activeProjectSection?: ProjectNavSection | null;
  activeChatId?: string | null;
  activeConstellationId?: string | null;
  /** The open named Dashboard, highlighted in the Dashboards panel. */
  activeDashboardId?: string | null;
  activeVidgetId?: string | null;
  activePipelineId?: string | null;
  projectChats?: LeftNavChatPreview[];
  projectConstellations?: LeftNavConstellationPreview[];
  /** The Project's named Dashboards (not outputs). */
  projectDashboards?: LeftNavDashboardPreview[];
  projectVidgets?: LeftNavVidgetPreview[];
  projectPipelines?: LeftNavPipelinePreview[];
  switchableProjects?: LeftNavProjectPreview[];
  chatTotalCount?: number;
  constellationTotalCount?: number;
  dashboardTotalCount?: number;
  vidgetTotalCount?: number;
  pipelineTotalCount?: number;
  onHomeClick?: () => void;
  onOrganizationUsersClick?: () => void;
  onAccessLevelsClick?: () => void;
  onDataSourcesClick?: () => void;
  onAdminPipelinesClick?: () => void;
  onToolsClick?: () => void;
  onExploreClick?: () => void;
  onProjectSectionClick?: (section: ProjectNavSection) => void;
  onSwitchProject?: (projectId: string) => void;
  onOpenChat?: (chatId: string) => void;
  onOpenConstellation?: (projectId: string, constellationId: string) => void;
  onOpenDashboard?: (projectId: string, dashboardId: string) => void;
  onOpenVidget?: (projectId: string, vidgetId: string) => void;
  onOpenPipeline?: (projectId: string, pipelineId: string) => void;
  prototypeUser?: { id: string; name: string; email: string; orgRole: string };
  prototypeProjectRole?: ProjectRole | null;
  activeProjectLabel?: string | null;
  onPrototypeUserChange?: (userId: string) => void;
  prototypeUsers?: DemoPrototypeUser[];
  onSettingsClick?: () => void;
  onLogout?: () => void;
  /** Notifies shell when desktop secondary rail open state changes (for content width). */
  onSecondaryRailOpenChange?: (open: boolean) => void;
};

/** Explore Luxia: a compass, drawn at the nav icon size and colour like the Luxia icons. */
function ExploreNavIcon({ size = 16, color }: LuxiaIconProps) {
  return <Compass size={size} color={color ?? "currentColor"} strokeWidth={1.9} aria-hidden />;
}

const NAV_TOP_ITEMS: {
  id: string;
  icon: NavIconComponent;
  label: string;
  available: boolean;
  unavailableHint?: string;
}[] = [
  { id: "home", icon: LuxiaHomeIcon, label: "Home", available: true },
  { id: "orgusers", icon: LuxiaOrgUsersIcon, label: "Users", available: true },
  { id: "accesslevels", icon: LuxiaUserPermissionsIcon, label: "Access Levels", available: true },
  {
    id: "datasources",
    icon: LuxiaDatasourceIcon,
    label: "Data Sources",
    available: true,
  },
  {
    id: "tools",
    icon: LuxiaToolsGalleryIcon,
    label: "Tools",
    available: true,
  },
  {
    id: "explore",
    icon: ExploreNavIcon,
    label: "Explore Luxia",
    available: true,
  },
  {
    id: "adminpipelines",
    icon: LuxiaPipelineIcon,
    label: "Pipeline Admin",
    available: true,
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
  indicator = false,
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
  /** A small dot on the icon (e.g. unread updates); the tooltip / label says what it means. */
  indicator?: boolean;
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
        {indicator ? (
          <span
            className="absolute -right-1 -top-0.5 size-[7px] rounded-full"
            style={{ background: "var(--luxia-cyan-40, #96dbfb)", boxShadow: "0 0 0 2px var(--luxia-sidebar-bg, #1d1238)" }}
            data-nav-indicator=""
          />
        ) : null}
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
          {typeof count === "number" ? (
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
          {typeof count === "number" ? (
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

export function LeftNav({
  collapsed,
  onToggleCollapsed,
  isMobileDrawer = false,
  mobileOpen = false,
  onMobileClose,
  homeActive,
  organizationUsersActive,
  accessLevelsActive,
  dataSourcesActive,
  adminPipelinesActive,
  toolsActive,
  exploreActive,
  exploreUnreadCount = 0,
  canAdministerPipelines = true,
  collapsePipelinesCollector = false,
  projectId,
  projectLabel,
  showProjectContext = true,
  showGalaxy = true,
  activeProjectSection,
  activeChatId,
  activeConstellationId,
  activeDashboardId,
  activeVidgetId,
  activePipelineId,
  projectChats = [],
  projectConstellations = [],
  projectDashboards = [],
  projectVidgets = [],
  projectPipelines = [],
  switchableProjects = [],
  chatTotalCount,
  constellationTotalCount,
  dashboardTotalCount,
  vidgetTotalCount,
  pipelineTotalCount,
  onHomeClick,
  onOrganizationUsersClick,
  onAccessLevelsClick,
  onDataSourcesClick,
  onAdminPipelinesClick,
  onToolsClick,
  onExploreClick,
  onProjectSectionClick,
  onSwitchProject,
  onOpenChat,
  onOpenConstellation,
  onOpenDashboard,
  onOpenVidget,
  onOpenPipeline,
  prototypeUser,
  prototypeProjectRole,
  activeProjectLabel,
  onPrototypeUserChange,
  prototypeUsers,
  onSettingsClick,
  onLogout,
  onSecondaryRailOpenChange,
}: LeftNavProps) {
  const reactId = useId();
  const constellationsPanelId = `${reactId}-constellations-rail`;
  const chatsPanelId = `${reactId}-chats-rail`;
  const dashboardPanelId = `${reactId}-dashboard-rail`;
  const vidgetsPanelId = `${reactId}-vidgets-rail`;
  const pipelinesPanelId = `${reactId}-pipelines-rail`;
  const projectsPanelId = `${reactId}-projects-rail`;

  const asideRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const constellationsAnchorRef = useRef<HTMLDivElement>(null);
  const chatsAnchorRef = useRef<HTMLDivElement>(null);
  const constellationsDisclosureRef = useRef<HTMLButtonElement>(null);
  const chatsDisclosureRef = useRef<HTMLButtonElement>(null);
  const dashboardAnchorRef = useRef<HTMLDivElement>(null);
  const vidgetsAnchorRef = useRef<HTMLDivElement>(null);
  const pipelinesAnchorRef = useRef<HTMLDivElement>(null);
  const dashboardDisclosureRef = useRef<HTMLButtonElement>(null);
  const vidgetsDisclosureRef = useRef<HTMLButtonElement>(null);
  const pipelinesDisclosureRef = useRef<HTMLButtonElement>(null);
  const collapsedConstellationsRef = useRef<HTMLButtonElement>(null);
  const collapsedChatsRef = useRef<HTMLButtonElement>(null);
  const collapsedDashboardRef = useRef<HTMLButtonElement>(null);
  const collapsedVidgetsRef = useRef<HTMLButtonElement>(null);
  const collapsedPipelinesRef = useRef<HTMLButtonElement>(null);
  const projectSwitcherRef = useRef<HTMLButtonElement>(null);
  const collapsedProjectSwitcherRef = useRef<HTMLButtonElement>(null);
  const restoreFocusKindRef = useRef<FlyoutKind | null>(null);

  const [flyout, setFlyout] = useState<FlyoutKind | null>(null);
  const [constellationQuery, setConstellationQuery] = useState("");
  const [chatQuery, setChatQuery] = useState("");
  const [dashboardQuery, setDashboardQuery] = useState("");
  const [vidgetQuery, setVidgetQuery] = useState("");
  const [pipelineQuery, setPipelineQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");

  const navPadding = collapsed ? "px-2" : "px-3";
  const showProjectNav = Boolean(projectId && projectLabel && showProjectContext);
  const canSwitchProjects = switchableProjects.length > 1;
  const overviewHref = projectId ? getProjectPath(projectId) : undefined;
  const galaxyHref = projectId ? getGalaxyPath(projectId) : undefined;
  const dashboardHref = projectId ? getDashboardPath(projectId) : undefined;
  const constellationsHref = projectId ? getConstellationsPath(projectId) : undefined;
  const chatsHref = projectId ? getProjectChatsPath(projectId) : undefined;
  const vidgetsHref = projectId ? getProjectVidgetsPath(projectId) : undefined;
  const pipelinesHref = projectId ? getProjectPipelinesPath(projectId) : undefined;
  const membersHref = projectId ? getProjectMembersPath(projectId) : undefined;

  const profileName = prototypeUser?.name ?? SIDEBAR_PROFILE_NAME;
  const profileEmail = prototypeUser?.email ?? "";
  const profileOrgRoleLabel = formatOrganizationRoleLabel(prototypeUser?.orgRole);
  const profileAria = `User profile: ${profileName}. ${profileOrgRoleLabel}.`;

  const chatsCount = chatTotalCount ?? projectChats.length;
  const constellationsCount = constellationTotalCount ?? projectConstellations.length;
  const dashboardCount = dashboardTotalCount ?? projectDashboards.length;
  const vidgetsCount = vidgetTotalCount ?? projectVidgets.length;
  const pipelinesCount = pipelineTotalCount ?? projectPipelines.length;
  const railCollapsed = isMobileDrawer ? false : collapsed;
  const widthStyle = isMobileDrawer
    ? SIDEBAR_WIDTH_EXPANDED
    : (collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED);
  const showProjectSettings = PROJECT_SETTINGS_DESTINATION_AVAILABLE
    && canAccessProjectSettingsForUser(prototypeUser?.id, prototypeProjectRole);
  const showPipelines = canViewProjectPipelines();

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

  const quickDashboardOutputs = useMemo(
    () =>
      pickQuickFlyoutItems(
        projectDashboards,
        activeDashboardId,
        SECONDARY_QUICK_LIMIT,
        (item) => item.updatedAtTimestamp,
      ),
    [projectDashboards, activeDashboardId],
  );

  const quickVidgets = useMemo(
    () =>
      pickQuickFlyoutItems(
        projectVidgets,
        activeVidgetId,
        SECONDARY_QUICK_LIMIT,
        (item) => item.updatedAtTimestamp,
      ),
    [projectVidgets, activeVidgetId],
  );

  const quickPipelines = useMemo(
    () =>
      pickQuickFlyoutItems(
        projectPipelines,
        activePipelineId,
        SECONDARY_QUICK_LIMIT,
        (item) => item.updatedAtTimestamp,
      ),
    [projectPipelines, activePipelineId],
  );

  const constellationSearchRows = useMemo(
    () => filterFlyoutSearch(projectConstellations, constellationQuery, SECONDARY_SEARCH_RESULT_LIMIT),
    [projectConstellations, constellationQuery],
  );

  const chatSearchRows = useMemo(
    () => filterFlyoutSearch(projectChats, chatQuery, SECONDARY_SEARCH_RESULT_LIMIT),
    [projectChats, chatQuery],
  );

  const dashboardSearchRows = useMemo(
    () => filterFlyoutSearch(projectDashboards, dashboardQuery, SECONDARY_SEARCH_RESULT_LIMIT),
    [projectDashboards, dashboardQuery],
  );

  const vidgetSearchRows = useMemo(
    () => filterFlyoutSearch(projectVidgets, vidgetQuery, SECONDARY_SEARCH_RESULT_LIMIT),
    [projectVidgets, vidgetQuery],
  );

  const pipelineSearchRows = useMemo(() => {
    const q = pipelineQuery.trim().toLowerCase();
    if (!q) return [];
    return projectPipelines
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q)
          || (item.dagId?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, SECONDARY_SEARCH_RESULT_LIMIT);
  }, [projectPipelines, pipelineQuery]);

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
        if (kind === "dashboard") return collapsedDashboardRef.current;
        if (kind === "vidgets") return collapsedVidgetsRef.current;
        if (kind === "pipelines") return collapsedPipelinesRef.current;
        return kind === "constellations"
          ? collapsedConstellationsRef.current
          : collapsedChatsRef.current;
      }
      if (kind === "dashboard") {
        return dashboardDisclosureRef.current ?? dashboardAnchorRef.current;
      }
      if (kind === "vidgets") {
        return vidgetsDisclosureRef.current ?? vidgetsAnchorRef.current;
      }
      if (kind === "pipelines") {
        return pipelinesDisclosureRef.current ?? pipelinesAnchorRef.current;
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
      setDashboardQuery("");
      setVidgetQuery("");
      setPipelineQuery("");
      setProjectQuery("");
    },
    [flyout],
  );

  const clearSecondaryRail = useCallback(() => {
    restoreFocusKindRef.current = null;
    setFlyout(null);
    setConstellationQuery("");
    setChatQuery("");
    setDashboardQuery("");
    setVidgetQuery("");
    setPipelineQuery("");
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
        setDashboardQuery("");
        setVidgetQuery("");
        setPipelineQuery("");
        setProjectQuery("");
        return null;
      }
      restoreFocusKindRef.current = null;
      setConstellationQuery("");
      setChatQuery("");
      setDashboardQuery("");
      setVidgetQuery("");
      setPipelineQuery("");
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
    if (collapsePipelinesCollector) {
      clearSecondaryRail();
    }
  }, [collapsePipelinesCollector, clearSecondaryRail]);

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

  function renderDashboardRow(item: LeftNavDashboardPreview) {
    return (
      <FlyoutNavRow
        key={item.id}
        icon={LuxiaDashboardIcon}
        label={item.label}
        active={activeDashboardId === item.id}
        href={projectId ? getDashboardPath(projectId, item.id) : undefined}
        onClick={() => {
          if (!projectId) return;
          navigateChildEntity(() => {
            onOpenDashboard?.(projectId, item.id);
          });
        }}
      />
    );
  }

  function renderVidgetRow(item: LeftNavVidgetPreview) {
    return (
      <FlyoutNavRow
        key={item.id}
        icon={LuxiaVirtualAssistantIcon}
        label={item.label}
        active={activeVidgetId === item.id}
        href={projectId ? getVidgetSettingsPath(projectId, item.id) : undefined}
        onClick={() => {
          if (!projectId) return;
          navigateChildEntity(() => {
            onOpenVidget?.(projectId, item.id);
          });
        }}
      />
    );
  }

  function renderPipelineRow(item: LeftNavPipelinePreview) {
    return (
      <FlyoutNavRow
        key={item.id}
        icon={LuxiaPipelineIcon}
        label={item.label}
        active={activePipelineId === item.id}
        href={projectId ? getPipelinePath(projectId, item.id) : undefined}
        onClick={() => {
          if (!projectId) return;
          navigateChildEntity(() => {
            onOpenPipeline?.(projectId, item.id);
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

  const dashboardRows = dashboardQuery.trim()
    ? dashboardSearchRows.map(renderDashboardRow)
    : quickDashboardOutputs.map(renderDashboardRow);

  const vidgetRows = vidgetQuery.trim()
    ? vidgetSearchRows.map(renderVidgetRow)
    : quickVidgets.map(renderVidgetRow);

  const pipelineRows = pipelineQuery.trim()
    ? pipelineSearchRows.map(renderPipelineRow)
    : quickPipelines.map(renderPipelineRow);

  const constellationListEmpty = constellationQuery.trim()
    ? constellationSearchRows.length === 0
    : quickConstellations.length === 0;

  const chatListEmpty = chatQuery.trim()
    ? chatSearchRows.length === 0
    : quickChats.length === 0;

  const dashboardListEmpty = dashboardQuery.trim()
    ? dashboardSearchRows.length === 0
    : quickDashboardOutputs.length === 0;

  const vidgetListEmpty = vidgetQuery.trim()
    ? vidgetSearchRows.length === 0
    : quickVidgets.length === 0;

  const pipelineListEmpty = pipelineQuery.trim()
    ? pipelineSearchRows.length === 0
    : quickPipelines.length === 0;

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
    ) : !isMobileDrawer && flyout === "dashboard" ? (
      <SidebarSecondaryRail
        id={dashboardPanelId}
        mode="desktop"
        title="Dashboard"
        searchPlaceholder="Search Dashboards"
        noMatchLabel="No matching Dashboards"
        query={dashboardQuery}
        onQueryChange={setDashboardQuery}
        rows={dashboardRows}
        isEmptyList={dashboardListEmpty}
        onClose={closeSecondaryRail}
        closeLabel="Close Dashboard navigation"
      />
    ) : !isMobileDrawer && flyout === "vidgets" ? (
      <SidebarSecondaryRail
        id={vidgetsPanelId}
        mode="desktop"
        title="Vidgets"
        searchPlaceholder="Search Vidgets"
        noMatchLabel="No matching Vidgets"
        query={vidgetQuery}
        onQueryChange={setVidgetQuery}
        rows={vidgetRows}
        isEmptyList={vidgetListEmpty}
        onClose={closeSecondaryRail}
        closeLabel="Close Vidgets navigation"
      />
    ) : !isMobileDrawer && flyout === "pipelines" ? (
      <SidebarSecondaryRail
        id={pipelinesPanelId}
        mode="desktop"
        title="Pipelines"
        searchPlaceholder="Search Pipelines"
        noMatchLabel="No matching Pipelines"
        query={pipelineQuery}
        onQueryChange={setPipelineQuery}
        rows={pipelineRows}
        isEmptyList={pipelineListEmpty}
        onClose={closeSecondaryRail}
        closeLabel="Close Pipelines navigation"
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
          {isMobileDrawer && mobileFlyoutActive && flyout === "dashboard" ? (
            <div
              className="absolute inset-0 z-[4] flex flex-col overflow-hidden"
              style={{ background: LX.gradient.nav }}
            >
              <SidebarSecondaryRail
                id={dashboardPanelId}
                mode="mobile"
                title="Dashboard"
                searchPlaceholder="Search Dashboards"
                noMatchLabel="No matching Dashboards"
                query={dashboardQuery}
                onQueryChange={setDashboardQuery}
                rows={dashboardRows}
                isEmptyList={dashboardListEmpty}
                onClose={closeSecondaryRail}
                closeLabel="Close Dashboard navigation"
              />
            </div>
          ) : null}
          {isMobileDrawer && mobileFlyoutActive && flyout === "vidgets" ? (
            <div
              className="absolute inset-0 z-[4] flex flex-col overflow-hidden"
              style={{ background: LX.gradient.nav }}
            >
              <SidebarSecondaryRail
                id={vidgetsPanelId}
                mode="mobile"
                title="Vidgets"
                searchPlaceholder="Search Vidgets"
                noMatchLabel="No matching Vidgets"
                query={vidgetQuery}
                onQueryChange={setVidgetQuery}
                rows={vidgetRows}
                isEmptyList={vidgetListEmpty}
                onClose={closeSecondaryRail}
                closeLabel="Close Vidgets navigation"
              />
            </div>
          ) : null}
          {isMobileDrawer && mobileFlyoutActive && flyout === "pipelines" ? (
            <div
              className="absolute inset-0 z-[4] flex flex-col overflow-hidden"
              style={{ background: LX.gradient.nav }}
            >
              <SidebarSecondaryRail
                id={pipelinesPanelId}
                mode="mobile"
                title="Pipelines"
                searchPlaceholder="Search Pipelines"
                noMatchLabel="No matching Pipelines"
                query={pipelineQuery}
                onQueryChange={setPipelineQuery}
                rows={pipelineRows}
                isEmptyList={pipelineListEmpty}
                onClose={closeSecondaryRail}
                closeLabel="Close Pipelines navigation"
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
                {NAV_TOP_ITEMS.filter(
                  (item) => item.id !== "adminpipelines" || canAdministerPipelines,
                ).map(({ id, icon, label, available, unavailableHint }) => (
                  <Fragment key={id}>
                    {id === "adminpipelines" ? (
                      <div
                        className={`my-2.5 ${railCollapsed ? "mx-2" : "mx-4"}`}
                        style={{ height: 1, background: "rgba(255,255,255,0.07)" }}
                        role="separator"
                        aria-hidden
                      />
                    ) : null}
                    <NavItem
                      icon={icon}
                      label={label}
                      collapsed={railCollapsed}
                      active={
                        id === "home"
                          ? homeActive
                          : id === "orgusers"
                            ? organizationUsersActive
                            : id === "accesslevels"
                              ? accessLevelsActive
                              : id === "datasources"
                                ? dataSourcesActive
                                : id === "tools"
                                  ? toolsActive
                                  : id === "explore"
                                    ? exploreActive
                                  : id === "adminpipelines"
                                    ? adminPipelinesActive
                                    : false
                      }
                      disabled={!available}
                      indicator={id === "explore" && exploreUnreadCount > 0}
                      tooltip={!available
                        ? unavailableHint ?? label
                        : id === "explore" && exploreUnreadCount > 0
                          ? `${label}, ${exploreUnreadCount} new ${exploreUnreadCount === 1 ? "update" : "updates"}`
                          : label}
                      href={
                        id === "home" && available
                          ? "/"
                          : id === "orgusers" && available
                            ? getOrganizationUsersPath()
                            : id === "accesslevels" && available
                              ? getAccessLevelsPath()
                              : id === "datasources" && available
                                ? getDataSourcesPath()
                                : id === "tools" && available
                                  ? getToolsPath()
                                  : id === "explore" && available
                                    ? getExplorePath()
                                  : id === "adminpipelines" && available
                                    ? getAdminPipelinesPath()
                                    : undefined
                      }
                      onClick={
                        id === "home"
                          ? () => {
                            closeFlyout();
                            onHomeClick?.();
                            onMobileClose?.();
                          }
                          : id === "orgusers"
                            ? () => {
                              closeFlyout();
                              onOrganizationUsersClick?.();
                              onMobileClose?.();
                            }
                            : id === "accesslevels"
                              ? () => {
                                closeFlyout();
                                onAccessLevelsClick?.();
                                onMobileClose?.();
                              }
                              : id === "datasources"
                                ? () => {
                                  closeFlyout();
                                  onDataSourcesClick?.();
                                  onMobileClose?.();
                                }
                                : id === "tools"
                                  ? () => {
                                    closeFlyout();
                                    onToolsClick?.();
                                    onMobileClose?.();
                                  }
                                  : id === "explore"
                                    ? () => {
                                      closeFlyout();
                                      onExploreClick?.();
                                      onMobileClose?.();
                                    }
                                  : id === "adminpipelines"
                                    ? () => {
                                      closeFlyout();
                                      onAdminPipelinesClick?.();
                                      onMobileClose?.();
                                    }
                                    : undefined
                      }
                    />
                  </Fragment>
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
                            className="mt-2 flex w-full min-w-0 items-center gap-1.5 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]"
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
                            className="mt-2 truncate luxia-type-nav-sidebar"
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
                          <NavItem
                            icon={LuxiaDashboardIcon}
                            label="Dashboard"
                            tooltip="Dashboard"
                            active={
                              activeProjectSection === "dashboard"
                              || flyout === "dashboard"
                              || Boolean(activeDashboardId)
                            }
                            collapsed
                            count={dashboardCount}
                            ariaExpanded={flyout === "dashboard"}
                            ariaControls={dashboardPanelId}
                            buttonRef={collapsedDashboardRef}
                            onClick={() => toggleFlyout("dashboard")}
                          />
                          <NavItem
                            icon={LuxiaVirtualAssistantIcon}
                            label="Vidgets"
                            tooltip="Vidgets"
                            active={
                              activeProjectSection === "vidgets"
                              || activeProjectSection === "virtual-assistant"
                              || flyout === "vidgets"
                              || Boolean(activeVidgetId)
                            }
                            collapsed
                            count={vidgetsCount}
                            ariaExpanded={flyout === "vidgets"}
                            ariaControls={vidgetsPanelId}
                            buttonRef={collapsedVidgetsRef}
                            onClick={() => toggleFlyout("vidgets")}
                          />
                          {showPipelines ? (
                            <NavItem
                              icon={LuxiaPipelineIcon}
                              label="Pipelines"
                              tooltip="Pipelines"
                              active={
                                activeProjectSection === "pipelines"
                                || flyout === "pipelines"
                                || Boolean(activePipelineId)
                              }
                              collapsed
                              count={pipelinesCount}
                              ariaExpanded={flyout === "pipelines"}
                              ariaControls={pipelinesPanelId}
                              buttonRef={collapsedPipelinesRef}
                              onClick={() => toggleFlyout("pipelines")}
                            />
                          ) : null}
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
                          <ProjectDisclosureSection
                            label="Dashboard"
                            icon={LuxiaDashboardIcon}
                            count={dashboardCount}
                            href={dashboardHref}
                            active={
                              activeProjectSection === "dashboard"
                              || Boolean(activeDashboardId)
                            }
                            childActive={Boolean(activeDashboardId)}
                            expanded={flyout === "dashboard"}
                            panelId={dashboardPanelId}
                            anchorRef={dashboardAnchorRef}
                            disclosureRef={dashboardDisclosureRef}
                            onToggleExpand={() => toggleFlyout("dashboard")}
                            onNavigate={() => {
                              navigateAndCloseFlyout(() => {
                                onProjectSectionClick?.("dashboard");
                                onMobileClose?.();
                              });
                            }}
                          />
                          <ProjectDisclosureSection
                            label="Vidgets"
                            icon={LuxiaVirtualAssistantIcon}
                            count={vidgetsCount}
                            href={vidgetsHref}
                            active={
                              activeProjectSection === "vidgets"
                              || activeProjectSection === "virtual-assistant"
                              || Boolean(activeVidgetId)
                            }
                            childActive={Boolean(activeVidgetId)}
                            expanded={flyout === "vidgets"}
                            panelId={vidgetsPanelId}
                            anchorRef={vidgetsAnchorRef}
                            disclosureRef={vidgetsDisclosureRef}
                            onToggleExpand={() => toggleFlyout("vidgets")}
                            onNavigate={() => {
                              navigateAndCloseFlyout(() => {
                                onProjectSectionClick?.("vidgets");
                                onMobileClose?.();
                              });
                            }}
                          />
                          {showPipelines ? (
                            <ProjectDisclosureSection
                              label="Pipelines"
                              icon={LuxiaPipelineIcon}
                              count={pipelinesCount}
                              href={pipelinesHref}
                              active={
                                activeProjectSection === "pipelines"
                                || Boolean(activePipelineId)
                              }
                              childActive={Boolean(activePipelineId)}
                              expanded={flyout === "pipelines"}
                              panelId={pipelinesPanelId}
                              anchorRef={pipelinesAnchorRef}
                              disclosureRef={pipelinesDisclosureRef}
                              onToggleExpand={() => toggleFlyout("pipelines")}
                              onNavigate={() => {
                                navigateAndCloseFlyout(() => {
                                  onProjectSectionClick?.("pipelines");
                                  onMobileClose?.();
                                });
                              }}
                            />
                          ) : null}
                        </>
                      )}

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
          </>
        </div>

        <div
          className={`relative z-[2] flex flex-shrink-0 ${railCollapsed ? "px-2 py-2.5" : "px-3 py-2.5"}`}
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <AccountMenu
            collapsed={railCollapsed}
            profileName={profileName}
            profileEmail={profileEmail}
            orgRoleLabel={profileOrgRoleLabel}
            profileAria={profileAria}
            prototypeUserId={prototypeUser?.id}
            prototypeUsers={prototypeUsers}
            onPrototypeUserChange={onPrototypeUserChange}
            onSettingsClick={onSettingsClick}
            onLogout={onLogout}
          />
        </div>
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
