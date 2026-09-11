import { useId, useState, type ReactNode } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export const SUPPORT_UNAVAILABLE_MESSAGE = "Support is currently unavailable.";
export const EMAIL_OTP_UNAVAILABLE_MESSAGE = "Email delivery is not available in this prototype.";
export const LEGAL_UNAVAILABLE_MESSAGE = "This document is not available in the prototype.";

export function afterNextPaint(callback: () => void): void {
  if (typeof window === "undefined") {
    callback();
    return;
  }
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback);
  });
}

export function AuthBusyLabel({
  busy,
  busyLabel,
  idleLabel,
}: {
  busy: boolean;
  busyLabel: string;
  idleLabel: string;
}) {
  return (
    <>
      {busy ? <LoaderCircle size={16} strokeWidth={1.8} className="animate-spin" aria-hidden /> : null}
      {busy ? busyLabel : idleLabel}
    </>
  );
}

export function AuthField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="luxia-login-field">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={errorId} className="luxia-type-caption luxia-login-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField({
  id,
  name,
  label,
  value,
  autoComplete,
  error,
  required,
  autoFocus,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  autoComplete: string;
  error?: string | null;
  required?: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const toggleId = useId();

  return (
    <div className="luxia-login-field">
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </Label>
      ) : null}
      <div className="relative min-w-0">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-required={required || undefined}
          className="luxia-login-input max-w-full pr-11"
          size={1}
          style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          id={toggleId}
          type="button"
          className="luxia-login-password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff size={16} strokeWidth={1.8} aria-hidden />
          ) : (
            <Eye size={16} strokeWidth={1.8} aria-hidden />
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="luxia-type-caption luxia-login-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
