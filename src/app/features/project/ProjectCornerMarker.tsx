import { ProjectIcon } from "@/app/components/icons";
import { HS } from "@/app/features/home/homeSurfaces";

export type ProjectCornerMarkerSize = "featured" | "supporting";

export function ProjectCornerMarker({
  size = "supporting",
  tone,
}: {
  size?: ProjectCornerMarkerSize;
  /** Optional colours (Home cards pass the shared Home Tile corner tokens); defaults unchanged. */
  tone?: { color: string; background: string };
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
        color: tone?.color ?? "var(--luxia-text-inverse)",
        background: tone?.background ?? "var(--luxia-purple-50)",
        borderRadius: isFeatured
          ? `0 ${HS.heroRadius} 0 20px`
          : "0 var(--luxia-radius-12) 0 16px",
      }}
    >
      <ProjectIcon size={isFeatured ? 22 : 19} />
    </div>
  );
}
