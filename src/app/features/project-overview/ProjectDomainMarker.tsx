import type { ReactNode } from "react";

export type ProjectDomainMarkerTone =
  | "galaxy"
  | "chat"
  | "constellation"
  | "dashboard"
  | "virtual-assistant"
  | "navigator";

const MARKER_TONE: Record<
  ProjectDomainMarkerTone,
  { background: string; color: string }
> = {
  galaxy: {
    background: "var(--luxia-purple-50)",
    color: "var(--luxia-text-inverse)",
  },
  chat: {
    background: "var(--luxia-purple-50)",
    color: "var(--luxia-text-inverse)",
  },
  constellation: {
    background: "var(--luxia-purple-50)",
    color: "var(--luxia-text-inverse)",
  },
  dashboard: {
    background: "var(--luxia-blue-20)",
    color: "var(--luxia-blue-70)",
  },
  "virtual-assistant": {
    background: "var(--luxia-blue-20)",
    color: "var(--luxia-blue-70)",
  },
  navigator: {
    background: "var(--luxia-purple-70)",
    color: "var(--luxia-text-inverse)",
  },
};

export function ProjectDomainMarker({
  tone,
  icon,
  size = "module",
}: {
  tone: ProjectDomainMarkerTone;
  icon: ReactNode;
  size?: "galaxy" | "module";
}) {
  const { background, color } = MARKER_TONE[tone];
  const isGalaxy = size === "galaxy";

  return (
    <div
      aria-hidden="true"
      className={
        isGalaxy
          ? "pointer-events-none absolute top-0 right-0 z-[1] flex h-14 w-14 items-center justify-center sm:h-[56px] sm:w-[60px] lg:h-[58px] lg:w-16"
          : "pointer-events-none absolute top-0 right-0 z-[1] flex h-[42px] w-[42px] items-center justify-center"
      }
      style={{
        color,
        background,
        borderRadius: isGalaxy
          ? "0 var(--luxia-radius-16) 0 22px"
          : "0 var(--luxia-radius-16) 0 16px",
      }}
    >
      {icon}
    </div>
  );
}
