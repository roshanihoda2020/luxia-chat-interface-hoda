import { ProjectIcon } from "@/app/components/icons";
import { HS } from "@/app/features/home/homeSurfaces";

export type ProjectCornerMarkerSize = "featured" | "supporting";

/**
 * Integrated top-right Project identity marker (Hero-style geometry, smaller).
 * Decorative only — PROJECT text label remains the accessible identity.
 */
export function ProjectCornerMarker({
  size = "supporting",
}: {
  size?: ProjectCornerMarkerSize;
}) {
  const isFeatured = size === "featured";

  return (
    <div
      aria-hidden="true"
      className={
        isFeatured
          ? "pointer-events-none absolute top-0 right-0 z-[1] flex h-12 w-12 items-center justify-center"
          : "pointer-events-none absolute top-0 right-0 z-[1] flex h-[42px] w-[42px] items-center justify-center"
      }
      style={{
        color: "var(--luxia-text-inverse)",
        background: "var(--luxia-purple-50)",
        borderRadius: isFeatured
          ? `0 ${HS.heroRadius} 0 20px`
          : "0 var(--luxia-radius-12) 0 16px",
      }}
    >
      <ProjectIcon size={isFeatured ? 22 : 19} />
    </div>
  );
}
