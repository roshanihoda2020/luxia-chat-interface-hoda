/**
 * Luxia left sidebar — context-aware navigation.
 *
 * Global collapse (expanded rail vs icon rail) is separate from Project
 * Chats/Constellations disclosure previews.
 */

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
import { getDemoPersonaRoleLabel } from "@/app/features/permissions/currentUser";
import {
  getAccessLevelsPath,
  getConstellationSettingsPath,
  getConstellationsPath,
  getDashboardPath,
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
  LuxiaNotificationsIcon,
  LuxiaProjectsIcon,
  LuxiaSettingsIcon,
  LuxiaSupportIcon,
  LuxiaToolsGalleryIcon,
  LuxiaUserPermissionsIcon,
  type LuxiaIconProps,
} from "@/assets/icons";

export const SIDEBAR_WIDTH_EXPANDED = 280;
export const SIDEBAR_WIDTH_COLLAPSED = 76;
export const LEFT_NAV_COLLAPSED_STORAGE_KEY = "luxia-left-nav-collapsed";
/** Below this width the sidebar becomes an overlay drawer (not a permanent icon rail). */
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
const PREVIEW_LIMIT = 3;

const SIDEBAR_PROFILE_NAME = "User name";
const SIDEBAR_PROFILE_INITIALS = "UN";

type NavIconComponent = (props: LuxiaIconProps) => ReactElement;

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

export type LeftNavProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isMobileDrawer?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  homeActive?: boolean;
  usersActive?: boolean;
  projectId?: string | null;
  projectLabel?: string | null;
  showProjectContext?: boolean;
  showGalaxy?: boolean;
  activeProjectSection?: ProjectNavSection | null;
  activeChatId?: string | null;
  activeConstellationId?: string | null;
  projectChats?: LeftNavChatPreview[];
  projectConstellations?: LeftNavConstellationPreview[];
  chatTotalCount?: number;
  constellationTotalCount?: number;
  onHomeClick?: () => void;
  onUsersClick?: () => void;
  onProjectSectionClick?: (section: ProjectNavSection) => void;
  onOpenChat?: (chatId: string) => void;
  onOpenConstellation?: (projectId: string, constellationId: string) => void;
  prototypeUser?: { id: string; name: string; orgRole: string };
  prototypeProjectRole?: string | null;
  onPrototypeUserChange?: (userId: string) => void;
  prototypeUsers?: Array<{
    id: string;
    name: string;
    orgRole: string;
    roleLabel: string;
  }>;
};

const NAV_TOP_ITEMS: {
  id: string;
  icon: typeof LuxiaHomeIcon;
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
    available: false,
    unavailableHint: "Data Sources browser is not available in this prototype.",
  },
];

const NAV_BOTTOM_ITEMS: {
  id: string;
  icon: typeof LuxiaNotificationsIcon;
  label: string;
  available: boolean;
  unavailableHint?: string;
}[] = [
  {
    id: "notifications",
    icon: LuxiaNotificationsIcon,
    label: "Notifications",
    available: false,
    unavailableHint: "Notifications are not available in this prototype.",
  },
  {
    id: "tools",
    icon: LuxiaToolsGalleryIcon,
    label: "Tools Gallery",
    available: false,
    unavailableHint: "Tools Gallery is not available in this prototype.",
  },
  {
    id: "settings",
    icon: LuxiaSettingsIcon,
    label: "Settings",
    available: false,
    unavailableHint: "Organization Settings are not available in this prototype.",
  },
  {
    id: "support",
    icon: LuxiaSupportIcon,
    label: "Support",
    available: false,
    unavailableHint: "Support is not available in this prototype.",
  },
];

function prototypeUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function disclosureStorageKey(projectId: string): string {
  return `luxia-project-nav-disclosure:${projectId}`;
}

function readDisclosure(projectId: string): { chats: boolean; constellations: boolean } {
  try {
    const raw = sessionStorage.getItem(disclosureStorageKey(projectId));
    if (!raw) return { chats: false, constellations: false };
    const parsed = JSON.parse(raw) as { chats?: boolean; constellations?: boolean };
    return {
      chats: Boolean(parsed.chats),
      constellations: Boolean(parsed.constellations),
    };
  } catch {
    return { chats: false, constellations: false };
  }
}

function writeDisclosure(
  projectId: string,
  next: { chats: boolean; constellations: boolean },
): void {
  try {
    sessionStorage.setItem(disclosureStorageKey(projectId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function pickPreviewItems<T extends { id: string }>(
  items: T[],
  activeId: string | null | undefined,
  limit: number,
  rank: (item: T) => number,
): T[] {
  if (items.length <= limit) return [...items].sort((a, b) => rank(b) - rank(a));
  const active = activeId ? items.find((item) => item.id === activeId) : undefined;
  const rest = items
    .filter((item) => item.id !== active?.id)
    .sort((a, b) => rank(b) - rank(a));
  if (active) return [active, ...rest.slice(0, limit - 1)];
  return rest.slice(0, limit);
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
    <button
      type="button"
      disabled
      aria-label={tip}
      aria-current={active ? "page" : undefined}
      aria-disabled
      className={className}
      style={style}
    >
      {content}
    </button>
  ) : href ? (
    <a
      href={href}
      aria-label={tip}
      aria-current={active ? "page" : undefined}
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
      type="button"
      onClick={onClick}
      aria-label={tip}
      aria-current={active ? "page" : undefined}
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

function SidebarStarDecoration() {
  const left = -(SIDEBAR_STAR_INTERSECTION_X - SIDEBAR_BRAND_LEFT);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
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
  const logoCenterY =
    SIDEBAR_BRAND_TOP + SIDEBAR_LOGO_HEIGHT / 2 - SIDEBAR_TOGGLE_SIZE / 2;
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
  section,
  label,
  icon: Icon,
  count,
  href,
  active,
  childActive = false,
  expanded,
  onToggleExpand,
  onNavigate,
  children,
}: {
  section: "chats" | "constellations";
  label: string;
  icon: NavIconComponent;
  count: number;
  href?: string;
  active: boolean;
  childActive?: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  const panelId = `luxia-sidebar-${section}-preview`;
  return (
    <div className="space-y-px">
      <div className="flex items-stretch gap-0.5">
        <a
          href={href}
          aria-current={active && !childActive ? "page" : undefined}
          aria-label={label}
          className="min-w-0 flex-1 flex items-center gap-3 rounded-[10px] px-3.5 h-[40px] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]"
          style={{
            background: active ? "rgba(255,255,255,0.12)" : "transparent",
          }}
          onClick={(e) => {
            e.preventDefault();
            onNavigate();
          }}
          onMouseEnter={(e) => {
            if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            if (!active) e.currentTarget.style.background = "transparent";
          }}
        >
          <Icon size={16} color={active ? "white" : "rgba(255,255,255,0.55)"} aria-hidden />
          <span
            className="flex-1 luxia-type-nav-sidebar truncate"
            style={{ color: active ? "white" : "rgba(255,255,255,0.7)" }}
          >
            {label}
          </span>
          {count > 0 ? (
            <span
              className="luxia-type-caption tabular-nums"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {count}
            </span>
          ) : null}
        </a>
        <button
          type="button"
          className="flex h-[40px] w-9 flex-shrink-0 items-center justify-center rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]"
          style={{ color: "rgba(255,255,255,0.55)" }}
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={expanded ? `Collapse ${label} preview` : `Expand ${label} preview`}
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
      {expanded ? (
        <div id={panelId} role="group" aria-label={`${label} preview`}>
          {children}
        </div>
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
  projectId,
  projectLabel,
  showProjectContext = true,
  showGalaxy = true,
  activeProjectSection,
  activeChatId,
  activeConstellationId,
  projectChats = [],
  projectConstellations = [],
  chatTotalCount,
  constellationTotalCount,
  onHomeClick,
  onUsersClick,
  onProjectSectionClick,
  onOpenChat,
  onOpenConstellation,
  prototypeUser,
  onPrototypeUserChange,
  prototypeUsers,
}: LeftNavProps) {
  const showDemoIdentity = import.meta.env.DEV && Boolean(prototypeUsers && onPrototypeUserChange);
  const navPadding = collapsed ? "px-2" : "px-3";
  const showProjectNav = Boolean(projectId && projectLabel && showProjectContext);
  const overviewHref = projectId ? getProjectPath(projectId) : undefined;
  const galaxyHref = projectId ? getGalaxyPath(projectId) : undefined;
  const dashboardHref = projectId ? getDashboardPath(projectId) : undefined;
  const constellationsHref = projectId ? getConstellationsPath(projectId) : undefined;
  const chatsHref = projectId ? getProjectChatsPath(projectId) : undefined;
  const membersHref = projectId ? getProjectMembersPath(projectId) : undefined;

  const profileName = prototypeUser?.name ?? SIDEBAR_PROFILE_NAME;
  const selectedDemoUser = prototypeUsers?.find((user) => user.id === prototypeUser?.id);
  const profileRoleLabel =
    selectedDemoUser?.roleLabel
    ?? (prototypeUser ? getDemoPersonaRoleLabel(prototypeUser.id) : "Member");
  const profileInitials = prototypeUser
    ? prototypeUserInitials(prototypeUser.name)
    : SIDEBAR_PROFILE_INITIALS;
  const profileAria = `Prototype identity: ${profileName}. ${profileRoleLabel}. Prototype preview only.`;
  const selectedOptionLabel = `${profileName} — ${profileRoleLabel}`;

  const [chatsExpanded, setChatsExpanded] = useState(false);
  const [constellationsExpanded, setConstellationsExpanded] = useState(false);
  const [manualChatsCollapse, setManualChatsCollapse] = useState(false);
  const [manualConstellationsCollapse, setManualConstellationsCollapse] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const saved = readDisclosure(projectId);
    setChatsExpanded(saved.chats);
    setConstellationsExpanded(saved.constellations);
    setManualChatsCollapse(false);
    setManualConstellationsCollapse(false);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    writeDisclosure(projectId, {
      chats: chatsExpanded,
      constellations: constellationsExpanded,
    });
  }, [projectId, chatsExpanded, constellationsExpanded]);

  useEffect(() => {
    if (!projectId || collapsed) return;
    if (activeProjectSection === "chats" && activeChatId && !manualChatsCollapse) {
      setChatsExpanded(true);
    }
    if (
      activeProjectSection === "constellations"
      && activeConstellationId
      && !manualConstellationsCollapse
    ) {
      setConstellationsExpanded(true);
    }
  }, [
    projectId,
    collapsed,
    activeProjectSection,
    activeChatId,
    activeConstellationId,
    manualChatsCollapse,
    manualConstellationsCollapse,
  ]);

  useEffect(() => {
    if (!isMobileDrawer || !mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileDrawer, mobileOpen, onMobileClose]);

  const chatPreviews = useMemo(
    () =>
      pickPreviewItems(
        projectChats,
        activeChatId,
        PREVIEW_LIMIT,
        (item) => (item.pinned ? 1_000_000_000_000 : 0) + item.lastOpenedTimestamp,
      ),
    [projectChats, activeChatId],
  );

  const constellationPreviews = useMemo(
    () =>
      pickPreviewItems(
        projectConstellations,
        activeConstellationId,
        PREVIEW_LIMIT,
        (item) => (item.pinned ? 1_000_000_000_000 : 0) + item.updatedAtTimestamp,
      ),
    [projectConstellations, activeConstellationId],
  );

  const chatsCount = chatTotalCount ?? projectChats.length;
  const constellationsCount = constellationTotalCount ?? projectConstellations.length;

  const railCollapsed = isMobileDrawer ? false : collapsed;
  const drawerHidden = isMobileDrawer && !mobileOpen;

  const widthStyle = isMobileDrawer
    ? SIDEBAR_WIDTH_EXPANDED
    : (collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED);

  const aside = (
    <aside
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

        <div
          className={`relative z-[2] flex-shrink-0 ${railCollapsed ? "flex justify-center" : ""}`}
          style={{
            paddingTop: SIDEBAR_BRAND_TOP,
            paddingLeft: railCollapsed ? 0 : SIDEBAR_BRAND_LEFT,
            paddingRight: railCollapsed ? 0 : SIDEBAR_BRAND_LEFT,
            paddingBottom: SIDEBAR_BRAND_BOTTOM,
          }}
        >
          {railCollapsed ? (
            <div aria-label="Luxia" role="img">
              <LuxiaStarLogo size={26} />
            </div>
          ) : (
            <LuxiaLogo />
          )}
        </div>

        <div className="relative z-[2] min-h-0 flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical luxia-scrollbar-sidebar">
          <nav className={`${navPadding} space-y-px`} aria-label="Global workspace">
            {NAV_TOP_ITEMS.map(({ id, icon, label, available, unavailableHint }) => (
              <NavItem
                key={id}
                icon={icon}
                label={label}
                collapsed={railCollapsed}
                active={id === "home" ? homeActive : id === "users" ? usersActive : false}
                disabled={!available}
                tooltip={!available ? unavailableHint ?? label : label}
                href={
                  id === "home" && available
                    ? "/"
                    : id === "users" && available
                      ? getAccessLevelsPath()
                      : undefined
                }
                onClick={
                  id === "home"
                    ? () => {
                      onHomeClick?.();
                      onMobileClose?.();
                    }
                    : id === "users"
                      ? () => {
                        onUsersClick?.();
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
                    <button
                      type="button"
                      className="mt-1 block w-full truncate text-left luxia-type-nav-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)] rounded"
                      style={{ color: "rgba(255,255,255,0.88)" }}
                      title={projectLabel ?? undefined}
                      onClick={() => {
                        onProjectSectionClick?.("overview");
                        onMobileClose?.();
                      }}
                    >
                      {projectLabel}
                    </button>
                  </div>
                ) : null}

                <nav className="space-y-px" aria-label="Current project">
                  <NavItem
                    icon={LuxiaProjectsIcon}
                    label="Overview"
                    tooltip="Project overview"
                    active={activeProjectSection === "overview"}
                    collapsed={railCollapsed}
                    href={overviewHref}
                    onClick={() => {
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
                        active={activeProjectSection === "constellations"}
                        collapsed
                        count={constellationsCount}
                        href={constellationsHref}
                        onClick={() => {
                          onProjectSectionClick?.("constellations");
                          onMobileClose?.();
                        }}
                      />
                      <NavItem
                        icon={LuxiaChatIcon}
                        label="Chats"
                        tooltip="Chats"
                        active={activeProjectSection === "chats"}
                        collapsed
                        count={chatsCount}
                        href={chatsHref}
                        onClick={() => {
                          onProjectSectionClick?.("chats");
                          onMobileClose?.();
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <ProjectDisclosureSection
                        section="constellations"
                        label="Constellations"
                        icon={LuxiaConstellationIcon}
                        count={constellationsCount}
                        href={constellationsHref}
                        active={activeProjectSection === "constellations"}
                        childActive={Boolean(activeConstellationId)}
                        expanded={constellationsExpanded}
                        onToggleExpand={() => {
                          setConstellationsExpanded((prev) => {
                            const next = !prev;
                            if (!next) setManualConstellationsCollapse(true);
                            else setManualConstellationsCollapse(false);
                            return next;
                          });
                        }}
                        onNavigate={() => {
                          onProjectSectionClick?.("constellations");
                          onMobileClose?.();
                        }}
                      >
                        {constellationPreviews.length === 0 ? (
                          <p
                            className="px-3.5 py-2 luxia-type-caption"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            No Constellations yet
                          </p>
                        ) : (
                          constellationPreviews.map((item) => (
                            <NavItem
                              key={item.id}
                              icon={LuxiaConstellationIcon}
                              label={item.label}
                              indent
                              active={activeConstellationId === item.id}
                              href={
                                projectId
                                  ? getConstellationSettingsPath(projectId, item.id)
                                  : undefined
                              }
                              onClick={() => {
                                if (!projectId) return;
                                onOpenConstellation?.(projectId, item.id);
                                onMobileClose?.();
                              }}
                            />
                          ))
                        )}
                        {constellationsCount > PREVIEW_LIMIT ? (
                          <button
                            type="button"
                            className="w-full rounded-[10px] px-3.5 py-2 text-left luxia-type-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]"
                            style={{ color: "rgba(150,219,251,0.75)" }}
                            onClick={() => {
                              onProjectSectionClick?.("constellations");
                              onMobileClose?.();
                            }}
                          >
                            View all {constellationsCount} Constellations
                          </button>
                        ) : null}
                      </ProjectDisclosureSection>

                      <ProjectDisclosureSection
                        section="chats"
                        label="Chats"
                        icon={LuxiaChatIcon}
                        count={chatsCount}
                        href={chatsHref}
                        active={activeProjectSection === "chats"}
                        childActive={Boolean(activeChatId)}
                        expanded={chatsExpanded}
                        onToggleExpand={() => {
                          setChatsExpanded((prev) => {
                            const next = !prev;
                            if (!next) setManualChatsCollapse(true);
                            else setManualChatsCollapse(false);
                            return next;
                          });
                        }}
                        onNavigate={() => {
                          onProjectSectionClick?.("chats");
                          onMobileClose?.();
                        }}
                      >
                        {chatPreviews.length === 0 ? (
                          <p
                            className="px-3.5 py-2 luxia-type-caption"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            No Chats yet
                          </p>
                        ) : (
                          chatPreviews.map((item) => (
                            <NavItem
                              key={item.id}
                              icon={item.chatSource === "galaxy" ? LuxiaGalaxyIcon : LuxiaChatIcon}
                              label={item.label}
                              indent
                              active={activeChatId === item.id}
                              href={
                                item.chatSource === "constellation"
                                  && projectId
                                  && item.constellationId
                                  ? getConstellationChatPath(
                                    projectId,
                                    item.constellationId,
                                    item.id,
                                  )
                                  : getChatPath(item.id)
                              }
                              onClick={() => {
                                onOpenChat?.(item.id);
                                onMobileClose?.();
                              }}
                            />
                          ))
                        )}
                        {chatsCount > PREVIEW_LIMIT ? (
                          <button
                            type="button"
                            className="w-full rounded-[10px] px-3.5 py-2 text-left luxia-type-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.45)]"
                            style={{ color: "rgba(150,219,251,0.75)" }}
                            onClick={() => {
                              onProjectSectionClick?.("chats");
                              onMobileClose?.();
                            }}
                          >
                            View all {chatsCount} Chats
                          </button>
                        ) : null}
                      </ProjectDisclosureSection>
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
                      onProjectSectionClick?.("members");
                      onMobileClose?.();
                    }}
                  />
                  <NavItem
                    icon={LuxiaSettingsIcon}
                    label="Project Settings"
                    collapsed={railCollapsed}
                    disabled
                    tooltip="Project Settings are not available in this prototype."
                  />
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

        {railCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="relative z-[2] flex flex-shrink-0 items-center justify-center px-2 py-2.5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                aria-label={profileAria}
              >
                <div
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white luxia-type-caption flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #5BC8F5 0%, #2C7A9E 100%)" }}
                  aria-hidden
                >
                  {profileInitials}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="max-w-[220px]">
              <div className="flex flex-col gap-0.5">
                <span>{profileName}</span>
                <span>{profileRoleLabel}</span>
                <span style={{ opacity: 0.75 }}>Prototype preview only</span>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div
            className="relative z-[2] flex flex-shrink-0 flex-col gap-2 px-4 py-2.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white luxia-type-caption flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #5BC8F5 0%, #2C7A9E 100%)" }}
                aria-hidden
              >
                {profileInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white luxia-type-profile-secondary truncate leading-tight">
                  {profileName}
                </p>
                <p
                  className="luxia-type-profile-secondary truncate leading-tight"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {profileRoleLabel}
                </p>
              </div>
            </div>
            {showDemoIdentity ? (
              <div className="block min-w-0">
                <p
                  className="mb-1 luxia-type-caption"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                  id="luxia-demo-identity-label"
                >
                  Demo identity
                </p>
                <Select
                  value={prototypeUser?.id ?? ""}
                  onValueChange={(value) => onPrototypeUserChange?.(value)}
                >
                  <SelectTrigger
                    size="sm"
                    aria-labelledby="luxia-demo-identity-label"
                    aria-label="Demo identity"
                    className="h-9 min-h-9 w-full min-w-0 border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-2.5 text-left text-[rgba(255,255,255,0.92)] hover:border-[rgba(255,255,255,0.28)] focus-visible:border-[rgba(150,219,251,0.55)] focus-visible:shadow-[0_0_0_3px_rgba(150,219,251,0.22)] [&_svg]:text-[rgba(255,255,255,0.55)]"
                  >
                    <SelectValue placeholder="Select identity">
                      <span className="truncate luxia-type-caption">{selectedOptionLabel}</span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="top"
                    sideOffset={6}
                    className="z-[60] min-w-[var(--radix-select-trigger-width)]"
                  >
                    {prototypeUsers?.map((user) => {
                      const accessibleName = `${user.name}, ${user.roleLabel}`;
                      return (
                        <SelectItem
                          key={user.id}
                          value={user.id}
                          textValue={accessibleName}
                          className="data-[state=checked]:bg-[var(--luxia-opacity-brand-secondary-08)]"
                        >
                          <span className="flex w-full min-w-0 items-center justify-between gap-3 pr-1">
                            <span className="truncate">{user.name}</span>
                            <span
                              className="flex-shrink-0 luxia-type-caption"
                              style={{ color: "var(--luxia-text-muted)" }}
                            >
                              {user.roleLabel}
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <span
                  className="mt-1 block luxia-type-caption"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Prototype preview only
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>
      {!isMobileDrawer ? (
        <SidebarCollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
      ) : null}
    </aside>
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
            transform: drawerHidden ? "translateX(-105%)" : "translateX(0)",
            transition: "transform 200ms ease",
            visibility: drawerHidden ? "hidden" : "visible",
          }}
        >
          {aside}
        </div>
      </>
    );
  }

  return aside;
}
