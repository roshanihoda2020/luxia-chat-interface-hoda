/** Canonical Project Overview path — always build from stable Project ID. */
export function getProjectPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`;
}

/** Parse `/projects/:projectId` from the location pathname. */
export function parseProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)\/?$/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function isHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "" || pathname === "/home";
}
