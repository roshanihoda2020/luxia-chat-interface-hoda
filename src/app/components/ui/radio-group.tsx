"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";

import { cn } from "./utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border-[var(--luxia-border-default)] text-[var(--luxia-brand-primary)] aspect-square size-4 shrink-0 rounded-full border shadow-[var(--luxia-shadow-xs)] transition-[color,box-shadow] outline-none",
        "focus-visible:border-[var(--luxia-border-focus)] focus-visible:shadow-[0_0_0_3px_var(--luxia-opacity-brand-secondary-32)]",
        "aria-invalid:border-[var(--luxia-error)] aria-invalid:shadow-[0_0_0_3px_var(--luxia-opacity-error-16)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-[var(--luxia-brand-primary)] absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
