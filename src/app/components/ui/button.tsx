import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva("luxia-button", {
  variants: {
    variant: {
      default: "luxia-button--primary",
      primary: "luxia-button--primary",
      secondary: "luxia-button--secondary",
      outline: "luxia-button--outline",
      ghost: "luxia-button--ghost",
      destructive: "luxia-button--destructive",
      destructiveGhost: "luxia-button--destructive-ghost",
      link: "luxia-button--link",
    },
    size: {
      default: "",
      compact: "luxia-button--compact",
      sm: "luxia-button--compact",
      large: "luxia-button--large",
      lg: "luxia-button--large",
      icon: "luxia-button--icon",
      iconCompact: "luxia-button--icon-compact",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
