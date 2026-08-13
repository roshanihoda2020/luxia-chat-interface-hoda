import { Compass } from "lucide-react";

export function ProjectNavigatorIcon({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Compass
      size={size}
      strokeWidth={1.75}
      aria-hidden
      className={className}
    />
  );
}
