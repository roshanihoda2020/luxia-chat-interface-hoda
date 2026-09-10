import type { LuxiaIconProps } from "@/assets/icons";
import { LuxiaGalaxyIcon } from "@/assets/icons";

export type GalaxyIconProps = LuxiaIconProps;

export function GalaxyIcon(props: GalaxyIconProps) {
  return <LuxiaGalaxyIcon {...props} />;
}
