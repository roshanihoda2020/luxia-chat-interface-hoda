/** Typed breadcrumb destinations — always carry stable IDs, never labels. */
export type LuxiaBreadcrumbDestination =
  | { kind: "home" }
  | { kind: "project"; projectId: string }
  | { kind: "constellation"; projectId: string; constellationId: string }
  | { kind: "chat"; projectId: string; chatId: string; constellationId?: string }
  | { kind: "galaxy"; projectId: string; galaxyId: string }
  | { kind: "dashboard"; projectId: string; dashboardId?: string }
  | { kind: "virtual-assistant"; projectId: string; virtualAssistantId?: string }
  | { kind: "current" };

export interface LuxiaBreadcrumbItem {
  id: string;
  label: string;
  destination: LuxiaBreadcrumbDestination;
}

export interface LuxiaBreadcrumbHandlers {
  onHome?: () => void;
  onProject?: (projectId: string) => void;
  onConstellation?: (projectId: string, constellationId: string) => void;
  onChat?: (projectId: string, chatId: string, constellationId?: string) => void;
  onGalaxy?: (projectId: string, galaxyId: string) => void;
  onDashboard?: (projectId: string, dashboardId?: string) => void;
  onVirtualAssistant?: (projectId: string, virtualAssistantId?: string) => void;
}

function resolveNavigate(
  destination: LuxiaBreadcrumbDestination,
  handlers: LuxiaBreadcrumbHandlers,
): (() => void) | undefined {
  switch (destination.kind) {
    case "home":
      return handlers.onHome;
    case "project":
      return handlers.onProject
        ? () => handlers.onProject!(destination.projectId)
        : undefined;
    case "constellation":
      return handlers.onConstellation
        ? () => handlers.onConstellation!(destination.projectId, destination.constellationId)
        : undefined;
    case "chat":
      return handlers.onChat
        ? () => handlers.onChat!(destination.projectId, destination.chatId, destination.constellationId)
        : undefined;
    case "galaxy":
      return handlers.onGalaxy
        ? () => handlers.onGalaxy!(destination.projectId, destination.galaxyId)
        : undefined;
    case "dashboard":
      return handlers.onDashboard
        ? () => handlers.onDashboard!(destination.projectId, destination.dashboardId)
        : undefined;
    case "virtual-assistant":
      return handlers.onVirtualAssistant
        ? () => handlers.onVirtualAssistant!(destination.projectId, destination.virtualAssistantId)
        : undefined;
    case "current":
    default:
      return undefined;
  }
}

interface LuxiaBreadcrumbProps {
  items: LuxiaBreadcrumbItem[];
  handlers: LuxiaBreadcrumbHandlers;
  className?: string;
  /** Visual density — Chat header uses metadata size; Project Overview uses caption. */
  tone?: "chat" | "page";
}

/**
 * Shared Luxia breadcrumb trail.
 * Clickable segments are buttons; the current page is a non-interactive span.
 */
export function LuxiaBreadcrumb({
  items,
  handlers,
  className = "",
  tone = "chat",
}: LuxiaBreadcrumbProps) {
  if (items.length === 0) return null;

  const textClass = tone === "page" ? "luxia-type-caption" : "luxia-type-metadata";
  const muted = tone === "page" ? "var(--luxia-text-muted)" : "#697077";
  const current = tone === "page" ? "var(--luxia-text-secondary)" : "var(--luxia-brand-primary, #30214E)";

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const onNavigate = isLast || item.destination.kind === "current"
            ? undefined
            : resolveNavigate(item.destination, handlers);
          const clickable = Boolean(onNavigate);
          const showAsCurrentPage = isLast;

          return (
            <li key={item.id} className="inline-flex min-w-0 max-w-full items-center gap-1.5">
              {index > 0 ? (
                <span
                  className={textClass}
                  style={{ color: muted, flexShrink: 0 }}
                  aria-hidden="true"
                >
                  /
                </span>
              ) : null}

              {clickable && onNavigate ? (
                <button
                  type="button"
                  onClick={onNavigate}
                  className={`${textClass} min-w-0 max-w-[min(100%,280px)] truncate rounded-[4px] text-left outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]`}
                  style={{ color: muted, fontWeight: 400, cursor: "pointer" }}
                  title={item.label}
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={`${textClass} min-w-0 max-w-[min(100%,320px)] truncate`}
                  style={{
                    color: showAsCurrentPage ? current : muted,
                    fontWeight: showAsCurrentPage && tone === "chat" ? 600 : 400,
                  }}
                  title={item.label}
                  {...(showAsCurrentPage ? { "aria-current": "page" as const } : {})}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Build Chat page trail: Home › Project › Constellation › Chat */
export function buildChatBreadcrumbItems(input: {
  projectId: string;
  projectName: string;
  constellationId?: string;
  constellationName?: string;
  chatId: string;
  chatLabel: string;
}): LuxiaBreadcrumbItem[] {
  const items: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: `project-${input.projectId}`,
      label: input.projectName,
      destination: input.projectId
        ? { kind: "project", projectId: input.projectId }
        : { kind: "current" },
    },
  ];

  if (input.constellationId && input.constellationName) {
    items.push({
      id: `constellation-${input.constellationId}`,
      label: input.constellationName,
      destination: {
        kind: "constellation",
        projectId: input.projectId,
        constellationId: input.constellationId,
      },
    });
  } else if (input.constellationName) {
    items.push({
      id: "constellation-unavailable",
      label: input.constellationName,
      destination: { kind: "current" },
    });
  }

  items.push({
    id: `chat-${input.chatId}`,
    label: input.chatLabel,
    destination: { kind: "current" },
  });

  return items;
}

/** Build Galaxy page trail: Home › Project › Galaxy */
export function buildGalaxyBreadcrumbItems(input: {
  projectId: string;
  projectName: string;
  galaxyId: string;
  galaxyName: string;
}): LuxiaBreadcrumbItem[] {
  return [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: `project-${input.projectId}`,
      label: input.projectName,
      destination: input.projectId
        ? { kind: "project", projectId: input.projectId }
        : { kind: "current" },
    },
    {
      id: `galaxy-${input.galaxyId}`,
      label: input.galaxyName,
      destination: { kind: "current" },
    },
  ];
}

/** Build Project Overview trail: Home › Project */
export function buildProjectOverviewBreadcrumbItems(input: {
  projectId: string;
  projectName: string;
}): LuxiaBreadcrumbItem[] {
  return [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: `project-${input.projectId}`,
      label: input.projectName,
      destination: { kind: "current" },
    },
  ];
}

/** Build Home archive trail: Home › Archive (Projects / Your work). */
export function buildHomeArchiveBreadcrumbItems(input: {
  archiveId: string;
  archiveLabel: string;
}): LuxiaBreadcrumbItem[] {
  return [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: `archive-${input.archiveId}`,
      label: input.archiveLabel,
      destination: { kind: "current" },
    },
  ];
}

/** Build Project library trail: Home › Project › Library. */
export function buildProjectLibraryBreadcrumbItems(input: {
  projectId: string;
  projectName: string;
  libraryId: string;
  libraryLabel: string;
}): LuxiaBreadcrumbItem[] {
  return [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: `project-${input.projectId}`,
      label: input.projectName,
      destination: input.projectId
        ? { kind: "project", projectId: input.projectId }
        : { kind: "current" },
    },
    {
      id: `library-${input.libraryId}`,
      label: input.libraryLabel,
      destination: { kind: "current" },
    },
  ];
}
