"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent outline-none transition-all",
        /* Active = dark Luxia purple; inactive = neutral grey (never grey-when-on). */
        "data-[state=checked]:bg-[var(--luxia-brand-primary)] data-[state=unchecked]:bg-[var(--luxia-neutral-300)]",
        "data-[state=checked]:hover:enabled:bg-[var(--luxia-brand-primary-dark)]",
        "data-[state=unchecked]:hover:enabled:bg-[var(--luxia-neutral-400)]",
        "focus-visible:shadow-[0_0_0_3px_var(--luxia-opacity-brand-primary-32)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-[var(--luxia-surface)] pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
