/**
 * Settings → Profile → Security MFA dialogs.
 * Local UI prototype only — no auth APIs, email delivery, or TOTP enrollment.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import type { PrototypeMfaMethod } from "@/app/features/permissions/types";

export type ProfileMfaDialogView =
  | "closed"
  | "choose-method"
  | "email-otp"
  | "authenticator"
  | "manage"
  | "disable-confirm";

export interface ProfileSecurityMfaDialogsProps {
  view: ProfileMfaDialogView;
  email: string;
  currentMethod: PrototypeMfaMethod | null;
  onClose: () => void;
  onSelectMethod: (method: PrototypeMfaMethod) => void;
  onConfirmEnable: (method: PrototypeMfaMethod) => void;
  onRequestDisable: () => void;
  onConfirmDisable: () => void;
  onCancelDisable: () => void;
  onSwitchMethod: () => void;
}

function formatMethodLabel(method: PrototypeMfaMethod): string {
  return method === "email-otp" ? "Email OTP" : "Authenticator App";
}

/** Decorative QR-like mock — not a scannable authenticator payload. */
function PrototypeQrPlaceholder() {
  return (
    <div
      className="mx-auto flex h-40 w-40 items-center justify-center rounded-[var(--luxia-radius-8)] border"
      style={{
        borderColor: "var(--luxia-border-default)",
        background: "var(--luxia-surface)",
      }}
      aria-hidden
    >
      <svg width="128" height="128" viewBox="0 0 128 128" fill="none">
        <rect x="8" y="8" width="40" height="40" rx="4" fill="var(--luxia-text-primary)" />
        <rect x="16" y="16" width="24" height="24" rx="2" fill="var(--luxia-surface)" />
        <rect x="22" y="22" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="80" y="8" width="40" height="40" rx="4" fill="var(--luxia-text-primary)" />
        <rect x="88" y="16" width="24" height="24" rx="2" fill="var(--luxia-surface)" />
        <rect x="94" y="22" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="8" y="80" width="40" height="40" rx="4" fill="var(--luxia-text-primary)" />
        <rect x="16" y="88" width="24" height="24" rx="2" fill="var(--luxia-surface)" />
        <rect x="22" y="94" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="56" y="8" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="80" y="56" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="104" y="56" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="56" y="32" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="56" y="56" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="80" y="80" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="104" y="80" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="56" y="104" width="12" height="12" fill="var(--luxia-text-primary)" />
        <rect x="80" y="104" width="20" height="12" fill="var(--luxia-text-primary)" />
        <rect x="104" y="104" width="12" height="12" fill="var(--luxia-text-primary)" />
      </svg>
    </div>
  );
}

function CompactMfaDialogShell({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        hideCloseButton
        overlayClassName="z-[80] bg-[var(--luxia-opacity-black-40)]"
        className="z-[80] flex max-h-[min(90vh,36rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeader className="shrink-0 space-y-1 text-left">
          <DialogTitle className="luxia-type-title-modal text-left">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="luxia-type-body-dense text-left">
              {description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--luxia-surface)] px-5 py-4">
          {children}
        </div>
        <DialogFooter className="shrink-0 gap-2 sm:justify-end">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProfileSecurityMfaDialogs({
  view,
  email,
  currentMethod,
  onClose,
  onSelectMethod,
  onConfirmEnable,
  onRequestDisable,
  onConfirmDisable,
  onCancelDisable,
  onSwitchMethod,
}: ProfileSecurityMfaDialogsProps) {
  const [pendingMethod, setPendingMethod] = useState<PrototypeMfaMethod>("email-otp");
  const [emailCode, setEmailCode] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState("");

  useEffect(() => {
    if (view === "choose-method") {
      setPendingMethod(currentMethod === "authenticator" ? "authenticator" : "email-otp");
    }
    if (view === "email-otp") setEmailCode("");
    if (view === "authenticator") setAuthenticatorCode("");
  }, [view, currentMethod]);

  const emailCodeReady = /^\d{6}$/.test(emailCode.trim());
  const authenticatorCodeReady = /^\d{6}$/.test(authenticatorCode.trim());

  return (
    <>
      <CompactMfaDialogShell
        open={view === "choose-method"}
        title="Enable multi-factor authentication"
        description="Choose how you want to verify your identity when signing in."
        onClose={onClose}
        footer={
          <>
            <Button type="button" variant="secondary" size="compact" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="compact"
              onClick={() => onSelectMethod(pendingMethod)}
            >
              Continue
            </Button>
          </>
        }
      >
        <RadioGroup
          value={pendingMethod}
          onValueChange={(value) => setPendingMethod(value as PrototypeMfaMethod)}
          className="gap-3"
        >
          <label
            className="flex cursor-pointer items-start gap-3 rounded-[var(--luxia-radius-8)] border px-3 py-3"
            style={{ borderColor: "var(--luxia-border-default)" }}
          >
            <RadioGroupItem value="email-otp" id="mfa-method-email" className="mt-0.5" />
            <span className="min-w-0">
              <span
                className="block luxia-type-body-dense-strong"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Email OTP
              </span>
              <span
                className="mt-0.5 block luxia-type-caption"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Receive a one-time code at your account email.
              </span>
            </span>
          </label>
          <label
            className="flex cursor-pointer items-start gap-3 rounded-[var(--luxia-radius-8)] border px-3 py-3"
            style={{ borderColor: "var(--luxia-border-default)" }}
          >
            <RadioGroupItem value="authenticator" id="mfa-method-app" className="mt-0.5" />
            <span className="min-w-0">
              <span
                className="block luxia-type-body-dense-strong"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Authenticator App
              </span>
              <span
                className="mt-0.5 block luxia-type-caption"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Use an authenticator app to generate verification codes.
              </span>
            </span>
          </label>
        </RadioGroup>
      </CompactMfaDialogShell>

      <CompactMfaDialogShell
        open={view === "email-otp"}
        title="Email OTP"
        description="A 6-digit verification code will be sent to the current account email when signing in."
        onClose={onClose}
        footer={
          <>
            <Button type="button" variant="secondary" size="compact" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="compact"
              disabled={!emailCodeReady}
              onClick={() => onConfirmEnable("email-otp")}
            >
              Verify & enable
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <p className="mb-1 luxia-type-label-small" style={{ color: "var(--luxia-text-muted)" }}>
              Account email
            </p>
            <p
              className="break-all luxia-type-body-dense-strong"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              {email}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mfa-email-otp-code">Verification code</Label>
            <Input
              id="mfa-email-otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit code"
              value={emailCode}
              onChange={(event) =>
                setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
          </div>
        </div>
      </CompactMfaDialogShell>

      <CompactMfaDialogShell
        open={view === "authenticator"}
        title="Authenticator App"
        description="Scan the code with your authenticator app, or enter the setup key manually."
        onClose={onClose}
        footer={
          <>
            <Button type="button" variant="secondary" size="compact" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="compact"
              disabled={!authenticatorCodeReady}
              onClick={() => onConfirmEnable("authenticator")}
            >
              Verify & enable
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <PrototypeQrPlaceholder />
          <div>
            <p className="mb-1 luxia-type-label-small" style={{ color: "var(--luxia-text-muted)" }}>
              Setup key
            </p>
            {/* Static layout placeholder — not a TOTP secret / not enrollable. */}
            <p
              className="rounded-[var(--luxia-radius-8)] border px-3 py-2 font-mono luxia-type-body-dense tracking-wider"
              style={{
                borderColor: "var(--luxia-border-default)",
                color: "var(--luxia-text-primary)",
                background: "var(--luxia-surface-subtle, var(--luxia-surface))",
              }}
            >
              A1B2-C3D4-E5F6-G7H8
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mfa-authenticator-code">Authenticator code</Label>
            <Input
              id="mfa-authenticator-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit code"
              value={authenticatorCode}
              onChange={(event) =>
                setAuthenticatorCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
          </div>
        </div>
      </CompactMfaDialogShell>

      <CompactMfaDialogShell
        open={view === "manage"}
        title="Manage multi-factor authentication"
        description="Review your verification method or turn MFA off."
        onClose={onClose}
        footer={
          <>
            <Button type="button" variant="secondary" size="compact" onClick={onClose}>
              Close
            </Button>
            <Button type="button" variant="outline" size="compact" onClick={onSwitchMethod}>
              Switch method
            </Button>
            <Button type="button" variant="destructive" size="compact" onClick={onRequestDisable}>
              Disable MFA
            </Button>
          </>
        }
      >
        <dl className="grid gap-3">
          <div>
            <dt className="mb-1 luxia-type-label-small" style={{ color: "var(--luxia-text-muted)" }}>
              Status
            </dt>
            <dd
              className="luxia-type-body-dense-strong"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              On
            </dd>
          </div>
          <div>
            <dt className="mb-1 luxia-type-label-small" style={{ color: "var(--luxia-text-muted)" }}>
              Verification method
            </dt>
            <dd
              className="luxia-type-body-dense-strong"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              {currentMethod ? formatMethodLabel(currentMethod) : "—"}
            </dd>
          </div>
        </dl>
      </CompactMfaDialogShell>

      <CompactMfaDialogShell
        open={view === "disable-confirm"}
        title="Disable multi-factor authentication?"
        description="Disabling MFA reduces account protection."
        onClose={onCancelDisable}
        footer={
          <>
            <Button type="button" variant="secondary" size="compact" onClick={onCancelDisable}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" size="compact" onClick={onConfirmDisable}>
              Disable
            </Button>
          </>
        }
      >
        <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          You can enable multi-factor authentication again at any time from Security.
        </p>
      </CompactMfaDialogShell>
    </>
  );
}

export function formatPrototypeMfaMethodLabel(method: PrototypeMfaMethod): string {
  return formatMethodLabel(method);
}
