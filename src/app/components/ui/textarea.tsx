import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground",
        "border-[var(--luxia-border-default)] bg-[var(--luxia-surface)] text-[var(--luxia-text-primary)]",
        "flex field-sizing-content min-h-16 w-full rounded-[var(--luxia-radius-8)] border px-3.5 py-2.5",
        "luxia-type-input-value outline-none resize-y",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-[border-color,box-shadow] duration-160",
        "hover:border-[var(--luxia-border-strong)]",
        "focus-visible:border-[var(--luxia-border-strong)] focus-visible:shadow-none",
        "aria-invalid:border-[var(--luxia-error)] aria-invalid:shadow-[0_0_0_3px_var(--luxia-opacity-error-16)]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
