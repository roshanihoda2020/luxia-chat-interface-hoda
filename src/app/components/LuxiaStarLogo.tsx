import starUrl from "@/assets/brand/Star.svg";

/**
 * Renders the official Luxia star mark.
 * Use size to control rendered dimensions; the SVG viewBox is 26×32.
 */
export function LuxiaStarLogo({
    size = 24,
    className,
}: {
    size?: number;
    className?: string;
}) {
    return (
        <img
            src={starUrl}
            alt="Luxia"
            width={size}
            height={Math.round(size * (32 / 26))}
            aria-hidden="true"
            className={className}
            style={{ display: "block", objectFit: "contain", flexShrink: 0 }}
        />
    );
}
