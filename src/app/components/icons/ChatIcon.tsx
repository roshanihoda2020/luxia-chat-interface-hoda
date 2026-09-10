import type { LuxiaIconProps } from "@/assets/icons";
import { LuxiaChatIcon } from "@/assets/icons";

export type ChatIconProps = LuxiaIconProps;

export function ChatIcon(props: ChatIconProps) {
  return <LuxiaChatIcon {...props} />;
}
