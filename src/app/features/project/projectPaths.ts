export function getProjectPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`;
}

export function getGalaxyPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/galaxy`;
}

export type GalaxySettingsTabQuery =
  | "general"
  | "instruction-response"
  | "constellation-routing"
  | "response"
  | "helios-tools"
  | "tools-helios"
  | "access-availability";

export function getGalaxySettingsPath(
  projectId: string,
  options?: {
    tab?: GalaxySettingsTabQuery | null;
    /** When true, include `?tab=general`. External opens omit the query (General default). */
    includeTabQuery?: boolean;
  },
): string {
  const base = `/projects/${encodeURIComponent(projectId)}/galaxy/settings`;
  const tab = options?.tab ?? null;
  if (!tab) return base;
  if (tab === "general" && !options?.includeTabQuery) return base;
  return `${base}?tab=${encodeURIComponent(tab)}`;
}

/**
 * The Project's Dashboard page (Dashboards tab), or one named Dashboard when
 * `dashboardId` is given.
 */
export function getDashboardPath(projectId: string, dashboardId?: string | null): string {
  const base = `/projects/${encodeURIComponent(projectId)}/dashboard`;
  return dashboardId ? `${base}/${encodeURIComponent(dashboardId)}` : base;
}

/** The Dashboard page's All outputs tab: every saved output, independent of Dashboards. */
export function getProjectOutputsPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/dashboard/outputs`;
}

export function getConstellationsPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/constellations`;
}

export function getProjectChatsPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/chats`;
}

export function getProjectActivityPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/activity`;
}

export function getConstellationCreatePath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/constellations/new`;
}

export type ConstellationSettingsTabQuery =
  | "general"
  | "configuration"
  | "response"
  | "connected-data-sources"
  | "access"
  | "lifecycle";

export function getConstellationSettingsPath(
  projectId: string,
  constellationId: string,
  options?: {
    tab?: ConstellationSettingsTabQuery | null;
    /** When true, include `?tab=general`. External opens omit the query (General default). */
    includeTabQuery?: boolean;
  },
): string {
  const base = `/projects/${encodeURIComponent(projectId)}/constellations/${encodeURIComponent(constellationId)}/settings`;
  const tab = options?.tab ?? null;
  if (!tab) return base;
  if (tab === "general" && !options?.includeTabQuery) return base;
  return `${base}?tab=${encodeURIComponent(tab)}`;
}

export function getConstellationSettingsCapabilityPath(
  projectId: string,
  constellationId: string,
  capabilityPath: string,
): string {
  return `/projects/${encodeURIComponent(projectId)}/constellations/${encodeURIComponent(constellationId)}/settings/${encodeURIComponent(capabilityPath)}`;
}

export function getProjectMembersPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/members`;
}

export function getProjectVidgetsPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/vidgets`;
}

export function getProjectPipelinesPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/pipelines`;
}

export function getPipelinePath(projectId: string, pipelineId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/pipelines/${encodeURIComponent(pipelineId)}`;
}

export function getPipelineRunPath(
  projectId: string,
  pipelineId: string,
  runId: string,
): string {
  return `/projects/${encodeURIComponent(projectId)}/pipelines/${encodeURIComponent(pipelineId)}/runs/${encodeURIComponent(runId)}`;
}

export function getVidgetSettingsPath(
  projectId: string,
  vidgetId: string,
  options?: { tab?: string },
): string {
  const base = `/projects/${encodeURIComponent(projectId)}/vidgets/${encodeURIComponent(vidgetId)}/settings`;
  if (!options?.tab) return base;
  const params = new URLSearchParams();
  params.set("tab", options.tab);
  return `${base}?${params.toString()}`;
}

export function getVidgetInboxPath(
  projectId: string,
  options?: {
    sessionId?: string | null;
    search?: string | null;
  },
): string {
  const base = `/projects/${encodeURIComponent(projectId)}/vidgets/inbox`;
  const params = new URLSearchParams(options?.search?.replace(/^\?/, "") ?? "");
  if (options && Object.prototype.hasOwnProperty.call(options, "sessionId")) {
    const sessionId = options.sessionId?.trim();
    if (sessionId) params.set("session", sessionId);
    else params.delete("session");
  }
  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

/** External read-only review share — not a Project-scoped route. */
export function getSharedReviewPath(shareId: string): string {
  return `/shared-review/${encodeURIComponent(shareId)}`;
}

export function parseSharedReviewShareIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/shared-review\/([^/]+)\/?$/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).trim() || null;
  } catch {
    return match[1].trim() || null;
  }
}

export function getAccessLevelsPath(): string {
  return "/organization/access-levels";
}

export function getAccessLevelPath(accessLevelId: string): string {
  return `/organization/access-levels/${encodeURIComponent(accessLevelId)}`;
}

export function getOrganizationUsersPath(): string {
  return "/organization/users";
}

export function getOrganizationUserPath(userId: string): string {
  return `/organization/users/${encodeURIComponent(userId)}`;
}

export function getDataSourcesPath(): string {
  return "/data-sources";
}

export function getDataSourceSettingsPath(dataSourceId: string): string {
  return `/data-sources/${encodeURIComponent(dataSourceId)}/settings`;
}

export function getAdminPipelinesPath(): string {
  return "/organization/pipelines";
}

export function getWritingAssistantPath(): string {
  return "/document-ai";
}

export function getToolsPath(): string {
  return "/tools";
}

export type PersonalSettingsTabQuery = "profile" | "my-data";

export type OrganizationSettingsTabQuery =
  | "general"
  | "members"
  | "access-data"
  | "usage";

export function getPersonalSettingsPath(options?: {
  tab?: PersonalSettingsTabQuery | null;
  includeTabQuery?: boolean;
}): string {
  const base = "/settings/personal";
  const tab = options?.tab ?? null;
  if (!tab) return base;
  if (tab === "profile" && !options?.includeTabQuery) return base;
  return `${base}?tab=${encodeURIComponent(tab)}`;
}

export function getOrganizationSettingsPath(options?: {
  tab?: OrganizationSettingsTabQuery | null;
  includeTabQuery?: boolean;
}): string {
  const base = "/settings/organization";
  const tab = options?.tab ?? null;
  if (!tab) return base;
  if (tab === "general" && !options?.includeTabQuery) return base;
  return `${base}?tab=${encodeURIComponent(tab)}`;
}

export function parsePersonalSettingsPath(pathname: string): boolean {
  return /^\/settings\/personal\/?$/.test(pathname);
}

export function parseOrganizationSettingsPath(pathname: string): boolean {
  return /^\/settings\/organization\/?$/.test(pathname);
}

export function getChatPath(chatId: string): string {
  return `/chats/${encodeURIComponent(chatId)}`;
}

/** Exact Constellation Chat destination — preferred when project + constellation are known. */
export function getConstellationChatPath(
  projectId: string,
  constellationId: string,
  chatId: string,
): string {
  return `/projects/${encodeURIComponent(projectId)}/constellations/${encodeURIComponent(constellationId)}/chats/${encodeURIComponent(chatId)}`;
}

function decodePathSegment(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function parseProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseGalaxyProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/galaxy\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseGalaxySettingsProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/galaxy\/settings\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

/**
 * `/projects/:id/dashboard` (Dashboards tab) and `/projects/:id/dashboard/:dashboardId`.
 * `/projects/:id/dashboard/outputs` is the All outputs tab, not a Dashboard.
 */
export function parseDashboardProjectIdFromPath(pathname: string): string | null {
  return parseDashboardPath(pathname)?.projectId ?? null;
}

export function parseDashboardPath(
  pathname: string,
): { projectId: string; dashboardId: string | null } | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/dashboard(?:\/([^/]+))?\/?$/);
  if (!match?.[1] || match[2] === "outputs") return null;
  return {
    projectId: decodePathSegment(match[1]),
    dashboardId: match[2] ? decodePathSegment(match[2]) : null,
  };
}

export function parseProjectOutputsProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/dashboard\/outputs\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseConstellationCreateProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/constellations\/new\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseConstellationsProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/constellations\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseProjectChatsProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/chats\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseProjectActivityProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/activity\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseConstellationSettingsCapabilityFromPath(pathname: string): {
  projectId: string;
  constellationId: string;
  capabilityPath: string;
} | null {
  const match = pathname.match(
    /^\/projects\/([^/]+)\/constellations\/([^/]+)\/settings\/([^/]+)\/?$/,
  );
  if (!match?.[1] || !match[2] || !match[3]) return null;
  return {
    projectId: decodePathSegment(match[1]),
    constellationId: decodePathSegment(match[2]),
    capabilityPath: decodePathSegment(match[3]),
  };
}

export function parseConstellationSettingsFromPath(pathname: string): {
  projectId: string;
  constellationId: string;
} | null {
  const match = pathname.match(
    /^\/projects\/([^/]+)\/constellations\/([^/]+)\/settings\/?$/,
  );
  if (!match?.[1] || !match[2]) return null;
  return {
    projectId: decodePathSegment(match[1]),
    constellationId: decodePathSegment(match[2]),
  };
}

export function parseProjectMembersFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/members\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseProjectVidgetsFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/vidgets\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseProjectPipelinesFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/pipelines\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parsePipelineDetailFromPath(pathname: string): {
  projectId: string;
  pipelineId: string;
} | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/pipelines\/([^/]+)\/?$/);
  if (!match?.[1] || !match[2]) return null;
  return {
    projectId: decodePathSegment(match[1]),
    pipelineId: decodePathSegment(match[2]),
  };
}

export function parsePipelineRunFromPath(pathname: string): {
  projectId: string;
  pipelineId: string;
  runId: string;
} | null {
  const match = pathname.match(
    /^\/projects\/([^/]+)\/pipelines\/([^/]+)\/runs\/([^/]+)\/?$/,
  );
  if (!match?.[1] || !match[2] || !match[3]) return null;
  return {
    projectId: decodePathSegment(match[1]),
    pipelineId: decodePathSegment(match[2]),
    runId: decodePathSegment(match[3]),
  };
}

export function parseVidgetSettingsFromPath(pathname: string): {
  projectId: string;
  vidgetId: string;
} | null {
  const match = pathname.match(
    /^\/projects\/([^/]+)\/vidgets\/([^/]+)\/settings\/?$/,
  );
  if (!match?.[1] || !match[2]) return null;
  return {
    projectId: decodePathSegment(match[1]),
    vidgetId: decodePathSegment(match[2]),
  };
}

export function parseVidgetInboxFromPath(pathname: string): {
  projectId: string;
  sessionId: string | null;
} | null {
  const match = pathname.match(
    /^\/projects\/([^/]+)\/vidgets\/inbox(?:\/([^/]+))?\/?$/,
  );
  if (!match?.[1]) return null;
  return {
    projectId: decodePathSegment(match[1]),
    sessionId: match[2] ? decodePathSegment(match[2]) : null,
  };
}

export function parseAccessLevelsPath(pathname: string): boolean {
  return /^\/organization\/access-levels\/?$/.test(pathname);
}

export function parseAccessLevelIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/organization\/access-levels\/([^/]+)\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseOrganizationUsersPath(pathname: string): boolean {
  return /^\/organization\/users\/?$/.test(pathname);
}

export function parseOrganizationUserIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/organization\/users\/([^/]+)\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseDataSourcesPath(pathname: string): boolean {
  return /^\/data-sources\/?$/.test(pathname);
}

export function parseDataSourceSettingsFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/data-sources\/([^/]+)\/settings\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseAdminPipelinesPath(pathname: string): boolean {
  return /^\/organization\/pipelines\/?$/.test(pathname);
}

export function parseWritingAssistantPath(pathname: string): boolean {
  return /^\/document-ai\/?$/.test(pathname) || /^\/writing-assistant\/?$/.test(pathname);
}

export function parseToolsPath(pathname: string): boolean {
  return /^\/tools\/?$/.test(pathname);
}

export function parseChatIdFromPath(pathname: string): string | null {
  const nested = parseConstellationChatFromPath(pathname);
  if (nested) return nested.chatId;
  const match = pathname.match(/^\/chats\/([^/]+)\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseConstellationChatFromPath(pathname: string): {
  projectId: string;
  constellationId: string;
  chatId: string;
} | null {
  const match = pathname.match(
    /^\/projects\/([^/]+)\/constellations\/([^/]+)\/chats\/([^/]+)\/?$/,
  );
  if (!match?.[1] || !match[2] || !match[3]) return null;
  return {
    projectId: decodePathSegment(match[1]),
    constellationId: decodePathSegment(match[2]),
    chatId: decodePathSegment(match[3]),
  };
}

export function isHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "" || pathname === "/home" || pathname === "/home/";
}

export type LuxiaResolvedPath =
  | { kind: "home"; normalizeToRoot: boolean }
  | { kind: "project"; projectId: string }
  | { kind: "galaxy"; projectId: string }
  | { kind: "galaxy-settings"; projectId: string }
  | { kind: "dashboard"; projectId: string; dashboardId: string | null }
  | { kind: "project-outputs"; projectId: string }
  | { kind: "constellations"; projectId: string }
  | { kind: "project-chats"; projectId: string }
  | { kind: "project-activity"; projectId: string }
  | { kind: "constellation-create"; projectId: string }
  | {
    kind: "constellation-settings";
    projectId: string;
    constellationId: string;
    capabilityPath?: string;
  }
  | { kind: "project-members"; projectId: string }
  | { kind: "project-vidgets"; projectId: string }
  | { kind: "project-pipelines"; projectId: string }
  | { kind: "pipeline-detail"; projectId: string; pipelineId: string }
  | {
    kind: "pipeline-run";
    projectId: string;
    pipelineId: string;
    runId: string;
  }
  | { kind: "vidget-inbox"; projectId: string; sessionId: string | null }
  | { kind: "vidget-settings"; projectId: string; vidgetId: string }
  | { kind: "organization-users" }
  | { kind: "organization-user"; userId: string }
  | { kind: "access-levels" }
  | { kind: "access-level"; accessLevelId: string }
  | { kind: "data-sources" }
  | { kind: "data-source-settings"; dataSourceId: string }
  | { kind: "admin-pipelines" }
  | { kind: "writing-assistant" }
  | { kind: "tools" }
  | { kind: "shared-review"; shareId: string }
  | { kind: "personal-settings" }
  | { kind: "organization-settings" }
  | { kind: "chat"; chatId: string; projectId?: string; constellationId?: string }
  | { kind: "invalid" };

export function resolveLuxiaPathname(pathname: string): LuxiaResolvedPath {
  if (pathname === "/" || pathname === "") {
    return { kind: "home", normalizeToRoot: false };
  }
  if (pathname === "/home" || pathname === "/home/") {
    return { kind: "home", normalizeToRoot: true };
  }

  const sharedReviewShareId = parseSharedReviewShareIdFromPath(pathname);
  if (sharedReviewShareId) {
    return { kind: "shared-review", shareId: sharedReviewShareId };
  }

  if (parseOrganizationUsersPath(pathname)) {
    return { kind: "organization-users" };
  }

  const organizationUserId = parseOrganizationUserIdFromPath(pathname);
  if (organizationUserId) {
    return { kind: "organization-user", userId: organizationUserId };
  }

  if (parseAccessLevelsPath(pathname)) {
    return { kind: "access-levels" };
  }

  const accessLevelId = parseAccessLevelIdFromPath(pathname);
  if (accessLevelId) {
    return { kind: "access-level", accessLevelId };
  }

  if (parseDataSourcesPath(pathname)) {
    return { kind: "data-sources" };
  }

  const dataSourceId = parseDataSourceSettingsFromPath(pathname);
  if (dataSourceId) {
    return { kind: "data-source-settings", dataSourceId };
  }

  if (parseAdminPipelinesPath(pathname)) {
    return { kind: "admin-pipelines" };
  }

  if (parseWritingAssistantPath(pathname)) {
    return { kind: "writing-assistant" };
  }

  if (parseToolsPath(pathname)) {
    return { kind: "tools" };
  }

  if (parsePersonalSettingsPath(pathname)) {
    return { kind: "personal-settings" };
  }

  if (parseOrganizationSettingsPath(pathname)) {
    return { kind: "organization-settings" };
  }

  const galaxySettingsProjectId = parseGalaxySettingsProjectIdFromPath(pathname);
  if (galaxySettingsProjectId) {
    return { kind: "galaxy-settings", projectId: galaxySettingsProjectId };
  }

  const galaxyProjectId = parseGalaxyProjectIdFromPath(pathname);
  if (galaxyProjectId) {
    return { kind: "galaxy", projectId: galaxyProjectId };
  }

  const dashboardPath = parseDashboardPath(pathname);
  if (dashboardPath) {
    return { kind: "dashboard", projectId: dashboardPath.projectId, dashboardId: dashboardPath.dashboardId };
  }

  const outputsProjectId = parseProjectOutputsProjectIdFromPath(pathname);
  if (outputsProjectId) {
    return { kind: "project-outputs", projectId: outputsProjectId };
  }

  const capability = parseConstellationSettingsCapabilityFromPath(pathname);
  if (capability) {
    return {
      kind: "constellation-settings",
      projectId: capability.projectId,
      constellationId: capability.constellationId,
      capabilityPath: capability.capabilityPath,
    };
  }

  const settings = parseConstellationSettingsFromPath(pathname);
  if (settings) {
    return {
      kind: "constellation-settings",
      projectId: settings.projectId,
      constellationId: settings.constellationId,
    };
  }

  const constellationChat = parseConstellationChatFromPath(pathname);
  if (constellationChat) {
    return {
      kind: "chat",
      chatId: constellationChat.chatId,
      projectId: constellationChat.projectId,
      constellationId: constellationChat.constellationId,
    };
  }

  const membersProjectId = parseProjectMembersFromPath(pathname);
  if (membersProjectId) {
    return { kind: "project-members", projectId: membersProjectId };
  }

  const vidgetSettings = parseVidgetSettingsFromPath(pathname);
  if (vidgetSettings) {
    return {
      kind: "vidget-settings",
      projectId: vidgetSettings.projectId,
      vidgetId: vidgetSettings.vidgetId,
    };
  }

  const vidgetInbox = parseVidgetInboxFromPath(pathname);
  if (vidgetInbox) {
    return {
      kind: "vidget-inbox",
      projectId: vidgetInbox.projectId,
      sessionId: vidgetInbox.sessionId,
    };
  }

  const vidgetsProjectId = parseProjectVidgetsFromPath(pathname);
  if (vidgetsProjectId) {
    return { kind: "project-vidgets", projectId: vidgetsProjectId };
  }

  const pipelineRun = parsePipelineRunFromPath(pathname);
  if (pipelineRun) {
    return {
      kind: "pipeline-run",
      projectId: pipelineRun.projectId,
      pipelineId: pipelineRun.pipelineId,
      runId: pipelineRun.runId,
    };
  }

  const pipelineDetail = parsePipelineDetailFromPath(pathname);
  if (pipelineDetail) {
    return {
      kind: "pipeline-detail",
      projectId: pipelineDetail.projectId,
      pipelineId: pipelineDetail.pipelineId,
    };
  }

  const pipelinesProjectId = parseProjectPipelinesFromPath(pathname);
  if (pipelinesProjectId) {
    return { kind: "project-pipelines", projectId: pipelinesProjectId };
  }

  const constellationCreateProjectId = parseConstellationCreateProjectIdFromPath(pathname);
  if (constellationCreateProjectId) {
    return { kind: "constellation-create", projectId: constellationCreateProjectId };
  }

  const constellationsProjectId = parseConstellationsProjectIdFromPath(pathname);
  if (constellationsProjectId) {
    return { kind: "constellations", projectId: constellationsProjectId };
  }

  const projectChatsId = parseProjectChatsProjectIdFromPath(pathname);
  if (projectChatsId) {
    return { kind: "project-chats", projectId: projectChatsId };
  }

  const projectActivityId = parseProjectActivityProjectIdFromPath(pathname);
  if (projectActivityId) {
    return { kind: "project-activity", projectId: projectActivityId };
  }

  const projectId = parseProjectIdFromPath(pathname);
  if (projectId) {
    return { kind: "project", projectId };
  }

  const chatId = parseChatIdFromPath(pathname);
  if (chatId) {
    return { kind: "chat", chatId };
  }

  return { kind: "invalid" };
}
