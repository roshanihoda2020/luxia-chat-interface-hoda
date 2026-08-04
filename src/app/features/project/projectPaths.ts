export function getProjectPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`;
}

export function getGalaxyPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/galaxy`;
}

export function getDashboardPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/dashboard`;
}

export function getConstellationsPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/constellations`;
}

export type ConstellationSettingsTabQuery =
  | "general"
  | "configuration"
  | "connected-data-sources"
  | "access"
  | "danger-zone";

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

export function getAccessLevelsPath(): string {
  return "/organization/access-levels";
}

export function getAccessLevelPath(accessLevelId: string): string {
  return `/organization/access-levels/${encodeURIComponent(accessLevelId)}`;
}

export function getDataSourcesPath(): string {
  return "/data-sources";
}

export function getDataSourceSettingsPath(dataSourceId: string): string {
  return `/data-sources/${encodeURIComponent(dataSourceId)}/settings`;
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

export function parseDashboardProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/dashboard\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function parseConstellationsProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/constellations\/?$/);
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

export function parseAccessLevelsPath(pathname: string): boolean {
  return /^\/organization\/access-levels\/?$/.test(pathname);
}

export function parseAccessLevelIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/organization\/access-levels\/([^/]+)\/?$/);
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
  | { kind: "dashboard"; projectId: string }
  | { kind: "constellations"; projectId: string }
  | {
    kind: "constellation-settings";
    projectId: string;
    constellationId: string;
    capabilityPath?: string;
  }
  | { kind: "project-members"; projectId: string }
  | { kind: "access-levels" }
  | { kind: "access-level"; accessLevelId: string }
  | { kind: "data-sources" }
  | { kind: "data-source-settings"; dataSourceId: string }
  | { kind: "chat"; chatId: string; projectId?: string; constellationId?: string }
  | { kind: "invalid" };

export function resolveLuxiaPathname(pathname: string): LuxiaResolvedPath {
  if (pathname === "/" || pathname === "") {
    return { kind: "home", normalizeToRoot: false };
  }
  if (pathname === "/home" || pathname === "/home/") {
    return { kind: "home", normalizeToRoot: true };
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

  const galaxyProjectId = parseGalaxyProjectIdFromPath(pathname);
  if (galaxyProjectId) {
    return { kind: "galaxy", projectId: galaxyProjectId };
  }

  const dashboardProjectId = parseDashboardProjectIdFromPath(pathname);
  if (dashboardProjectId) {
    return { kind: "dashboard", projectId: dashboardProjectId };
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

  const constellationsProjectId = parseConstellationsProjectIdFromPath(pathname);
  if (constellationsProjectId) {
    return { kind: "constellations", projectId: constellationsProjectId };
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
