import type { ComponentProps, ReactNode } from "react";
import { LuxiaAiIcon } from "@/assets/icons";
import { Button } from "@/app/components/ui/button";

type LuxiaAiButtonSize = "default" | "compact" | "large";

type LuxiaAiButtonProps = Omit<ComponentProps<typeof Button>, "variant" | "size" | "children"> & {
  size?: LuxiaAiButtonSize;
  children: ReactNode;
};

function iconSizeFor(size: LuxiaAiButtonSize): number {
  if (size === "compact") return 14;
  if (size === "large") return 18;
  return 16;
}

/**
 * Secondary AI action: Luxia sparkles icon + visible “AI” text label.
 * Never use icon-only, link styling, or the primary/destructive variants for AI.
 */
export function LuxiaAiButton({
  children,
  size = "compact",
  type = "button",
  ...props
}: LuxiaAiButtonProps) {
  return (
    <Button type={type} variant="ai" size={size} {...props}>
      <LuxiaAiIcon size={iconSizeFor(size)} aria-hidden />
      {children}
    </Button>
  );
}
