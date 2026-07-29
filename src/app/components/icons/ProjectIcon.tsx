import type { LuxiaIconProps } from "@/assets/icons";
import { LuxiaProjectsIcon } from "@/assets/icons";

export type ProjectIconProps = LuxiaIconProps;

export function ProjectIcon(props: ProjectIconProps) {
  return <LuxiaProjectsIcon {...props} />;
}
