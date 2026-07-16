"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "./utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[var(--luxia-radius-4)] border border-[var(--luxia-border-default)] bg-[var(--luxia-surface)] shadow-[var(--luxia-shadow-xs)] outline-none transition-shadow",
        "data-[state=checked]:bg-[var(--luxia-brand-primary)] data-[state=checked]:text-[var(--luxia-text-inverse)] data-[state=checked]:border-[var(--luxia-brand-primary)]",
        "focus-visible:border-[var(--luxia-border-focus)] focus-visible:shadow-[0_0_0_3px_var(--luxia-opacity-brand-secondary-32)]",
        "aria-invalid:border-[var(--luxia-error)] aria-invalid:shadow-[0_0_0_3px_var(--luxia-opacity-error-16)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
