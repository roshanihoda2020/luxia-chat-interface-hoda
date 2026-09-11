import officialLuxiaLogoUrl from "@/assets/brand/Luxia-Star.svg";

/**
 * Official Luxia lockup: assets/brand/Luxia-Star.svg (same file as LeftNav).
 * viewBox 120 × 47. Do not crop, recolor, or reconstruct this asset.
 *
 * Wordmark "LUXIA" path bounds in the viewBox:
 *   x 1.83398 → 99.834
 * The gradient star occupies the upper-right and must not drive alignment.
 */
export const LUXIA_LOGO_VIEWBOX_WIDTH = 120;
export const LUXIA_LOGO_VIEWBOX_HEIGHT = 47;
export const LUXIA_WORDMARK_START = 1.83398 / LUXIA_LOGO_VIEWBOX_WIDTH;
export const LUXIA_WORDMARK_END = 99.834 / LUXIA_LOGO_VIEWBOX_WIDTH;

const AUTH_LOGO_WIDTH = LUXIA_LOGO_VIEWBOX_WIDTH;
const AUTH_LOGO_HEIGHT = LUXIA_LOGO_VIEWBOX_HEIGHT;

export function LoginLogo() {
  return (
    <div
      className="luxia-login-logo-slot"
      role="img"
      aria-label="Luxia"
      style={{
        ["--luxia-wordmark-start" as string]: String(LUXIA_WORDMARK_START),
        ["--luxia-wordmark-end" as string]: String(LUXIA_WORDMARK_END),
      }}
    >
      <img
        className="luxia-login-logo"
        src={officialLuxiaLogoUrl}
        alt=""
        width={AUTH_LOGO_WIDTH}
        height={AUTH_LOGO_HEIGHT}
        draggable={false}
        decoding="async"
      />
    </div>
  );
}
