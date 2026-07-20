import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--luxia-radius-pill)] border px-2.5 min-h-6 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--luxia-brand-primary)] text-[var(--luxia-text-inverse)]",
        secondary:
          "border-transparent bg-[var(--luxia-opacity-brand-secondary-12)] text-[var(--luxia-brand-primary)]",
        destructive:
          "border-[var(--luxia-opacity-error-24)] bg-[var(--luxia-opacity-error-08)] text-[var(--luxia-error-70)]",
        outline:
          "border-[var(--luxia-border-default)] text-[var(--luxia-text-primary)] bg-[var(--luxia-surface)]",
        success:
          "border-[var(--luxia-opacity-success-24)] bg-[var(--luxia-opacity-success-08)] text-[var(--luxia-success-70)]",
        warning:
          "border-[var(--luxia-opacity-warning-32)] bg-[var(--luxia-opacity-warning-12)] text-[var(--luxia-warning-90)]",
        info:
          "border-[var(--luxia-blue-30)] bg-[var(--luxia-blue-10)] text-[var(--luxia-blue-70)]",
        error:
          "border-[var(--luxia-opacity-error-24)] bg-[var(--luxia-opacity-error-08)] text-[var(--luxia-error-70)]",
        database:
          "border-[var(--luxia-opacity-purple-16)] bg-[var(--luxia-opacity-purple-08)] text-[var(--luxia-purple-60)]",
        pdf:
          "border-[var(--luxia-opacity-blue-16)] bg-[var(--luxia-opacity-blue-08)] text-[var(--luxia-blue-70)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
