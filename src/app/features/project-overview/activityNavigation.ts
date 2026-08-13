import type { ProjectActivityItem } from "./types";

export type ActivityDestination =
  | { kind: "chat"; projectId: string; chatId: string }
  | { kind: "constellation"; projectId: string; constellationId: string }
  | { kind: "dashboard-output"; projectId: string; outputId: string }
  | { kind: "dashboard"; projectId: string }
  | { kind: "vidget"; projectId: string; vidgetId: string }
  | { kind: "galaxy"; projectId: string }
  | { kind: "galaxy-settings"; projectId: string };

export type ActivityNavigationContext = {
  projectId: string;
  chatIds: ReadonlySet<string>;
  constellationIds: ReadonlySet<string>;
  outputIds: ReadonlySet<string>;
  vidgetIds: ReadonlySet<string>;
  hasGalaxy: boolean;
};

export type ActivityNavigationHandlers = {
  onOpenChat: (chatId: string) => void;
  onOpenConstellation: (projectId: string, constellationId: string) => void;
  onOpenDashboard: (projectId: string) => void;
  onOpenDashboardOutput: (projectId: string, outputId: string) => void;
  onOpenVidget: (projectId: string, vidgetId: string) => void;
  onOpenGalaxy: (projectId: string) => void;
  onOpenGalaxySettings: (projectId: string) => void;
};

function resolveOutputId(item: ProjectActivityItem): string | undefined {
  return item.outputId ?? (item.type === "output" ? item.dashboardId : undefined);
}

export function resolveActivityDestination(
  item: ProjectActivityItem,
): ActivityDestination | null {
  if (item.projectId) {
    if (item.type === "chat" && item.chatId) {
      return { kind: "chat", projectId: item.projectId, chatId: item.chatId };
    }
    if (item.type === "constellation" && item.constellationId) {
      return {
        kind: "constellation",
        projectId: item.projectId,
        constellationId: item.constellationId,
      };
    }
    const outputId = resolveOutputId(item);
    if (item.type === "output" && outputId) {
      return { kind: "dashboard-output", projectId: item.projectId, outputId };
    }
    if (item.type === "dashboard") {
      return { kind: "dashboard", projectId: item.projectId };
    }
    const vidgetId = item.virtualAssistantId;
    if ((item.type === "widget" || item.type === "virtual-assistant") && vidgetId) {
      return { kind: "vidget", projectId: item.projectId, vidgetId };
    }
    if (item.type === "instruction") {
      return { kind: "galaxy-settings", projectId: item.projectId };
    }
  }
  return null;
}

export function activityTargetExists(
  destination: ActivityDestination,
  context: ActivityNavigationContext,
): boolean {
  if (destination.projectId !== context.projectId) return false;

  switch (destination.kind) {
    case "chat":
      return context.chatIds.has(destination.chatId);
    case "constellation":
      return context.constellationIds.has(destination.constellationId);
    case "dashboard-output":
      return context.outputIds.has(destination.outputId);
    case "dashboard":
      return true;
    case "vidget":
      return context.vidgetIds.has(destination.vidgetId);
    case "galaxy":
    case "galaxy-settings":
      return context.hasGalaxy;
    default:
      return false;
  }
}

export function activityHasDestination(
  item: ProjectActivityItem,
  context: ActivityNavigationContext,
): boolean {
  const destination = resolveActivityDestination(item);
  if (!destination) return false;
  return activityTargetExists(destination, context);
}

export function openProjectActivity(
  item: ProjectActivityItem,
  context: ActivityNavigationContext,
  handlers: ActivityNavigationHandlers,
): void {
  const destination = resolveActivityDestination(item);
  if (!destination || !activityTargetExists(destination, context)) return;

  switch (destination.kind) {
    case "chat":
      handlers.onOpenChat(destination.chatId);
      break;
    case "constellation":
      handlers.onOpenConstellation(destination.projectId, destination.constellationId);
      break;
    case "dashboard-output":
      handlers.onOpenDashboardOutput(destination.projectId, destination.outputId);
      break;
    case "dashboard":
      handlers.onOpenDashboard(destination.projectId);
      break;
    case "vidget":
      handlers.onOpenVidget(destination.projectId, destination.vidgetId);
      break;
    case "galaxy":
      handlers.onOpenGalaxy(destination.projectId);
      break;
    case "galaxy-settings":
      handlers.onOpenGalaxySettings(destination.projectId);
      break;
    default:
      break;
  }
}

export function buildActivityNavigationContext(input: {
  projectId: string;
  chatIds: readonly string[];
  constellationIds: readonly string[];
  outputIds: readonly string[];
  vidgetIds: readonly string[];
  hasGalaxy: boolean;
}): ActivityNavigationContext {
  return {
    projectId: input.projectId,
    chatIds: new Set(input.chatIds),
    constellationIds: new Set(input.constellationIds),
    outputIds: new Set(input.outputIds),
    vidgetIds: new Set(input.vidgetIds),
    hasGalaxy: input.hasGalaxy,
  };
}
