import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
          "border-[var(--luxia-border-default)] bg-[var(--luxia-surface)] text-[var(--luxia-text-primary)]",
          "flex h-10 min-h-10 w-full min-w-0 rounded-[var(--luxia-radius-8)] border px-3.5 py-2",
          "luxia-type-input-value outline-none",
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:luxia-type-label-small",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "transition-[border-color,box-shadow] duration-160",
          "hover:border-[var(--luxia-border-strong)]",
          "focus-visible:border-[var(--luxia-border-strong)] focus-visible:shadow-none",
          "aria-invalid:border-[var(--luxia-error)] aria-invalid:shadow-[0_0_0_3px_var(--luxia-opacity-error-16)]",
          className,
        )}
        {...props}
      />
    );
  },
);

export { Input };
