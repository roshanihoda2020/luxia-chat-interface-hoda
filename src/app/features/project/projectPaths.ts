export function getProjectPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`;
}

export function getGalaxyPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/galaxy`;
}

export function getDashboardPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/dashboard`;
}

export function getChatPath(chatId: string): string {
  return `/chats/${encodeURIComponent(chatId)}`;
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

export function parseChatIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/chats\/([^/]+)\/?$/);
  if (!match?.[1]) return null;
  return decodePathSegment(match[1]);
}

export function isHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "" || pathname === "/home" || pathname === "/home/";
}

export type LuxiaResolvedPath =
  | { kind: "home"; normalizeToRoot: boolean }
  | { kind: "project"; projectId: string }
  | { kind: "galaxy"; projectId: string }
  | { kind: "dashboard"; projectId: string }
  | { kind: "chat"; chatId: string }
  | { kind: "invalid" };

export function resolveLuxiaPathname(pathname: string): LuxiaResolvedPath {
  if (pathname === "/" || pathname === "") {
    return { kind: "home", normalizeToRoot: false };
  }
  if (pathname === "/home" || pathname === "/home/") {
    return { kind: "home", normalizeToRoot: true };
  }

  const galaxyProjectId = parseGalaxyProjectIdFromPath(pathname);
  if (galaxyProjectId) {
    return { kind: "galaxy", projectId: galaxyProjectId };
  }

  const dashboardProjectId = parseDashboardProjectIdFromPath(pathname);
  if (dashboardProjectId) {
    return { kind: "dashboard", projectId: dashboardProjectId };
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
