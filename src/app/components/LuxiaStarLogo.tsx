import starUrl from "@/assets/brand/Star.svg";

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
