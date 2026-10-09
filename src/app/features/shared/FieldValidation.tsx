import type { ReactNode } from "react";
import { cn } from "@/app/components/ui/utils";

/**
 * Field-level validation helpers for Luxia forms.
 *
 * Pattern:
 * - Put `aria-invalid` and `aria-describedby` on the control
 * - Render FieldError / FieldHint with matching `id`
 * - Prefer actionable copy over “Invalid value”
 *
 * Warning vs error:
 * - FieldError = blocking (prevent submit)
 * - FieldHint tone="warning" = non-blocking advisory
 */

export function fieldDescribedBy(
  ...ids: Array<string | undefined | false | null>
): string | undefined {
  const list = ids.filter(Boolean) as string[];
  return list.length ? list.join(" ") : undefined;
}

export function FieldError({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  if (children == null || children === false || children === "") return null;

  return (
    <p
      id={id}
      role="alert"
      data-slot="luxia-field-error"
      className={cn(
        "mt-1 luxia-type-caption leading-snug text-[var(--luxia-error-70)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function FieldHint({
  id,
  tone = "neutral",
  children,
  className,
}: {
  id?: string;
  tone?: "neutral" | "warning";
  children: ReactNode;
  className?: string;
}) {
  if (children == null || children === false || children === "") return null;

  return (
    <p
      id={id}
      data-slot="luxia-field-hint"
      className={cn(
        "mt-1 luxia-type-caption leading-snug",
        tone === "warning"
          ? "text-[var(--luxia-warning-90)]"
          : "text-[var(--luxia-text-secondary)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Convenience wrapper: label + control slot + error/hint. */
export function FieldValidationBlock({
  label,
  htmlFor,
  required,
  error,
  errorId,
  hint,
  hintId,
  hintTone = "neutral",
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: ReactNode;
  errorId?: string;
  hint?: ReactNode;
  hintId?: string;
  hintTone?: "neutral" | "warning";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)} data-slot="luxia-field">
      {label ? (
        <label
          htmlFor={htmlFor}
          className="luxia-type-label-small block text-[var(--luxia-text-secondary)]"
        >
          {label}
          {required ? (
            <span className="text-[var(--luxia-error-70)]" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      <FieldError id={errorId}>{error}</FieldError>
      {!error ? (
        <FieldHint id={hintId} tone={hintTone}>
          {hint}
        </FieldHint>
      ) : null}
    </div>
  );
}
