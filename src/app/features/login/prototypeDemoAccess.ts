/**
 * Demo access (Test accounts and "Demo:" scenario links on the auth screens).
 *
 * On when any of these holds, unless VITE_LUXIA_DEMO_ACCESS is "false":
 * - the Vite dev server (import.meta.env.DEV);
 * - VITE_LUXIA_DEMO_ACCESS is "true" in the build;
 * - the page is served from a prototype host: this machine, or Figma Make
 *   (its preview and published sites live on *.figma.site).
 *
 * Any other production host keeps demo access off.
 */
const PROTOTYPE_HOST_SUFFIXES = [".figma.site"] as const;
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"] as const;

export function isPrototypeDemoHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (LOCAL_HOSTS as readonly string[]).includes(host)
    || PROTOTYPE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export function resolvePrototypeDemoAccess(
  env: { DEV?: boolean; VITE_LUXIA_DEMO_ACCESS?: string } | undefined,
  hostname: string | undefined,
): boolean {
  if (env?.VITE_LUXIA_DEMO_ACCESS === "false") return false;
  if (env?.DEV === true || env?.VITE_LUXIA_DEMO_ACCESS === "true") return true;
  return hostname ? isPrototypeDemoHost(hostname) : false;
}

export const PROTOTYPE_DEMO_ACCESS = resolvePrototypeDemoAccess(
  import.meta.env,
  typeof window !== "undefined" ? window.location.hostname : undefined,
);
