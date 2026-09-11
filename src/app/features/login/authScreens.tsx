import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components/ui/input-otp";
import {
  AuthBusyLabel,
  AuthField,
  EMAIL_OTP_UNAVAILABLE_MESSAGE,
  LEGAL_UNAVAILABLE_MESSAGE,
  PasswordField,
  SUPPORT_UNAVAILABLE_MESSAGE,
  afterNextPaint,
} from "@/app/features/login/authShared";
import { DevTestAccountsPanel } from "@/app/features/login/DevTestAccountsPanel";
import { TurnstileField, isTurnstileRequired } from "@/app/features/login/TurnstileField";
import {
  PASSWORD_MIN_LENGTH,
  PROTOTYPE_MFA_SETUP_KEY,
  PROTOTYPE_OTP,
  PROTOTYPE_RECOVERY_KEY,
  credentialsMatch,
  findPrototypeAccount,
  isValidEmailFormat,
  validatePasswordPolicy,
  writeAccountSetupComplete,
  writeMfaEnrolled,
  writeStoredPassword,
  type PrototypeAuthAccount,
} from "@/app/features/login/prototypeAuth";

export type SignInNotice = "session-expired" | "password-updated" | null;

const AUTH_PRIMARY_CTA =
  "luxia-login-submit luxia-login-submit--activate luxia-button--on-dark";

function emailFieldError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your email.";
  if (!isValidEmailFormat(trimmed)) return "Enter a valid email address.";
  return null;
}

export function SignInPanel({
  notice,
  onAuthenticated,
  onForgotPassword,
}: {
  notice: SignInNotice;
  onAuthenticated: (account: PrototypeAuthAccount, rememberMe: boolean) => void;
  onForgotPassword: () => void;
}) {
  const emailId = useId();
  const rememberId = useId();
  const formErrorId = useId();
  const turnstileRequired = isTurnstileRequired();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const nextEmailError = emailFieldError(email);
    const nextPasswordError = !password
      ? "Enter your password."
      : validatePasswordPolicy(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) {
      setFormError(null);
      return;
    }
    if (turnstileRequired && !turnstileToken) return;
    setFormError(null);
    setSubmitting(true);
    afterNextPaint(() => {
      const account = findPrototypeAccount(email);
      if (!account || !credentialsMatch(email, password)) {
        setFormError("Invalid credentials.");
        setPassword("");
        setSubmitting(false);
        return;
      }
      onAuthenticated(account, rememberMe);
    });
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Welcome back</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Sign in to continue to Luxia
        </p>
      </header>

      {notice === "session-expired" ? (
        <p className="luxia-login-notice" role="status">
          Your session expired. Please sign in again.
        </p>
      ) : null}
      {notice === "password-updated" ? (
        <p className="luxia-login-notice" role="status">
          Password updated. Sign in with your new password.
        </p>
      ) : null}

      <form
        className="luxia-login-form w-full min-w-0"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting || undefined}
        aria-describedby={formError ? formErrorId : undefined}
      >
        <AuthField id={emailId} label="Email" required error={emailError}>
          <Input
            id={emailId}
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            value={email}
            aria-required="true"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? `${emailId}-error` : undefined}
            className="luxia-login-input max-w-full"
            size={1}
            style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError(null);
              if (formError) setFormError(null);
            }}
          />
        </AuthField>

        <div className="luxia-login-field">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <Label htmlFor={`${emailId}-password`}>
              Password <span aria-hidden="true">*</span>
            </Label>
            <button
              type="button"
              className="luxia-login-text-link luxia-type-caption shrink-0"
              onClick={onForgotPassword}
            >
              Forgot password?
            </button>
          </div>
          <PasswordField
            id={`${emailId}-password`}
            name="password"
            label=""
            required
            value={password}
            autoComplete="current-password"
            error={passwordError}
            onChange={(value) => {
              setPassword(value);
              if (passwordError) setPasswordError(null);
              if (formError) setFormError(null);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id={rememberId}
            checked={rememberMe}
            className="luxia-login-checkbox"
            onCheckedChange={(value) => setRememberMe(value === true)}
          />
          <Label htmlFor={rememberId} className="cursor-pointer font-normal">
            Remember me
          </Label>
        </div>

        <TurnstileField onToken={setTurnstileToken} />

        {formError ? (
          <p id={formErrorId} className="luxia-type-caption luxia-login-error" role="alert">
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={submitting || (turnstileRequired && !turnstileToken)}
          aria-busy={submitting || undefined}
        >
          <AuthBusyLabel
            busy={submitting}
            busyLabel="Signing in…"
            idleLabel="Sign in"
          />
        </Button>
      </form>

      <div className="luxia-login-actions">
        <p className="luxia-login-help luxia-type-caption">
          Need help?{" "}
          <button
            type="button"
            className="luxia-login-text-link"
            onClick={() => toast.message(SUPPORT_UNAVAILABLE_MESSAGE)}
          >
            Contact support
          </button>
        </p>
        <p className="luxia-login-privacy luxia-type-caption">
          <button
            type="button"
            className="luxia-login-privacy-link"
            onClick={() => toast.message(LEGAL_UNAVAILABLE_MESSAGE)}
          >
            Privacy Policy
          </button>
        </p>
        <DevTestAccountsPanel
          onSelectEmail={(nextEmail) => {
            setEmail(nextEmail);
            setEmailError(null);
            setFormError(null);
          }}
        />
      </div>
    </>
  );
}

export function ForgotPasswordPanel({ onBack }: { onBack: () => void }) {
  const emailId = useId();
  const turnstileRequired = isTurnstileRequired();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const nextError = emailFieldError(email);
    if (nextError) {
      setEmailError(nextError);
      return;
    }
    if (turnstileRequired && !turnstileToken) return;
    setEmailError(null);
    setSending(true);
    afterNextPaint(() => {
      setSending(false);
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <>
        <header className="luxia-login-heading">
          <h1 className="luxia-type-heading-h3 luxia-login-title">Check your email</h1>
          <p className="luxia-type-body-small luxia-login-subtitle">
            If an account exists for this email, you&apos;ll receive a password reset link.
          </p>
        </header>
        <Button
          type="button"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          onClick={onBack}
        >
          Back to sign in
        </Button>
      </>
    );
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Forgot password?</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Enter your email to receive a reset link.
        </p>
      </header>

      <form
        className="luxia-login-form w-full min-w-0"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={sending || undefined}
      >
        <AuthField id={emailId} label="Email" required error={emailError}>
          <Input
            id={emailId}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            value={email}
            aria-required="true"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? `${emailId}-error` : undefined}
            className="luxia-login-input max-w-full"
            size={1}
            style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError(null);
            }}
          />
        </AuthField>
        <TurnstileField onToken={setTurnstileToken} />
        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={sending || (turnstileRequired && !turnstileToken)}
          aria-busy={sending || undefined}
        >
          <AuthBusyLabel busy={sending} busyLabel="Sending…" idleLabel="Send reset link" />
        </Button>
      </form>
      <div className="luxia-login-actions">
        <p className="luxia-login-help luxia-type-caption">
          <button type="button" className="luxia-login-text-link" onClick={onBack}>
            Back to sign in
          </button>
        </p>
      </div>
    </>
  );
}

export function AccountSetupPanel({
  account,
  onComplete,
}: {
  account: PrototypeAuthAccount;
  onComplete: () => void;
}) {
  const titleId = useId();
  const nameId = useId();
  const [jobTitle, setJobTitle] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [jobError, setJobError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nextJob = jobTitle.trim() ? null : "Enter your job title.";
    const nextName = fullName.trim() ? null : "Enter your full name.";
    const nextPassword = validatePasswordPolicy(password);
    const nextConfirm = !confirm
      ? "Confirm your password."
      : confirm === password
        ? null
        : "Passwords do not match.";
    setJobError(nextJob);
    setNameError(nextName);
    setPasswordError(nextPassword);
    setConfirmError(nextConfirm);
    if (nextJob || nextName || nextPassword || nextConfirm) return;
    setSaving(true);
    afterNextPaint(() => {
      writeStoredPassword(account.email, password);
      writeAccountSetupComplete(account.email);
      onComplete();
    });
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Set up your account</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Complete your profile and choose a password to continue.
        </p>
      </header>
      <form className="luxia-login-form w-full min-w-0" onSubmit={handleSubmit} noValidate aria-busy={saving || undefined}>
        <AuthField id={nameId} label="Full name" required error={nameError}>
          <Input
            id={nameId}
            name="name"
            autoComplete="name"
            autoFocus
            value={fullName}
            aria-required="true"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${nameId}-error` : undefined}
            className="luxia-login-input max-w-full"
            size={1}
            style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
            onChange={(event) => {
              setFullName(event.target.value);
              if (nameError) setNameError(null);
            }}
          />
        </AuthField>
        <AuthField id={titleId} label="Job title" required error={jobError}>
          <Input
            id={titleId}
            name="jobTitle"
            autoComplete="organization-title"
            value={jobTitle}
            aria-required="true"
            aria-invalid={jobError ? true : undefined}
            aria-describedby={jobError ? `${titleId}-error` : undefined}
            className="luxia-login-input max-w-full"
            size={1}
            style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
            onChange={(event) => {
              setJobTitle(event.target.value);
              if (jobError) setJobError(null);
            }}
          />
        </AuthField>
        <PasswordField
          id={`${nameId}-password`}
          name="new-password"
          label="Password"
          required
          autoComplete="new-password"
          value={password}
          error={passwordError}
          onChange={(value) => {
            setPassword(value);
            if (passwordError) setPasswordError(null);
          }}
        />
        <PasswordField
          id={`${nameId}-confirm`}
          name="confirm-password"
          label="Confirm password"
          required
          autoComplete="new-password"
          value={confirm}
          error={confirmError}
          onChange={(value) => {
            setConfirm(value);
            if (confirmError) setConfirmError(null);
          }}
        />
        <p className="luxia-type-caption luxia-login-policy-hint">
          Use at least {PASSWORD_MIN_LENGTH} characters.
        </p>
        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={saving}
          aria-busy={saving || undefined}
        >
          <AuthBusyLabel busy={saving} busyLabel="Saving…" idleLabel="Continue" />
        </Button>
      </form>
    </>
  );
}

export function MfaVerifyPanel({
  onVerified,
  onUseRecoveryKey,
  onBackToSignIn,
}: {
  onVerified: () => void;
  onUseRecoveryKey: () => void;
  onBackToSignIn: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const errorId = useId();

  function submitCode(value: string) {
    if (verifying) return;
    if (value.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    afterNextPaint(() => {
      if (value !== PROTOTYPE_OTP) {
        setError("Invalid verification code.");
        setCode("");
        setVerifying(false);
        return;
      }
      onVerified();
    });
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Verify it&apos;s you</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Enter the 6-digit code from your authenticator app.
        </p>
      </header>
      <form
        className="luxia-login-form w-full min-w-0"
        onSubmit={(event) => {
          event.preventDefault();
          submitCode(code);
        }}
        aria-busy={verifying || undefined}
      >
        <div className="luxia-login-field-stack">
          <div className="luxia-login-otp">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => {
                setCode(value);
                if (error) setError(null);
              }}
              onComplete={submitCode}
              disabled={verifying}
              autoFocus
              aria-label="Verification code"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              containerClassName="luxia-login-otp-group"
            >
              <InputOTPGroup className="luxia-login-otp-group">
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot key={index} index={index} className="luxia-login-otp-slot" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error ? (
            <p id={errorId} className="luxia-type-caption luxia-login-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={verifying}
          aria-busy={verifying || undefined}
        >
          <AuthBusyLabel busy={verifying} busyLabel="Verifying…" idleLabel="Verify" />
        </Button>
      </form>
      <div className="luxia-login-actions">
        <p className="luxia-login-help luxia-type-caption">
          <button type="button" className="luxia-login-text-link" onClick={onUseRecoveryKey}>
            Use recovery key
          </button>
        </p>
        <p className="luxia-login-help luxia-type-caption">
          <button
            type="button"
            className="luxia-login-text-link"
            onClick={() => toast.message(EMAIL_OTP_UNAVAILABLE_MESSAGE)}
          >
            Email OTP unavailable in this prototype
          </button>
        </p>
        <p className="luxia-login-help luxia-type-caption">
          <button type="button" className="luxia-login-text-link" onClick={onBackToSignIn}>
            Back to sign in
          </button>
        </p>
      </div>
    </>
  );
}

export function MfaRecoveryPanel({
  onVerified,
  onBack,
  onBackToSignIn,
}: {
  onVerified: () => void;
  onBack: () => void;
  onBackToSignIn: () => void;
}) {
  const keyId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (verifying) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter your recovery key.");
      return;
    }
    setVerifying(true);
    afterNextPaint(() => {
      if (trimmed !== PROTOTYPE_RECOVERY_KEY) {
        setError("Invalid recovery key.");
        setVerifying(false);
        return;
      }
      onVerified();
    });
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Use recovery key</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Enter the recovery key you saved when you set up multi-factor authentication.
        </p>
      </header>
      <form className="luxia-login-form w-full min-w-0" onSubmit={handleSubmit} noValidate aria-busy={verifying || undefined}>
        <AuthField id={keyId} label="Recovery key" required error={error}>
          <Input
            id={keyId}
            name="recovery-key"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
            value={value}
            aria-required="true"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${keyId}-error` : undefined}
            className="luxia-login-input luxia-login-input--mono max-w-full"
            size={1}
            style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
          />
        </AuthField>
        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={verifying}
          aria-busy={verifying || undefined}
        >
          <AuthBusyLabel busy={verifying} busyLabel="Verifying…" idleLabel="Continue" />
        </Button>
      </form>
      <div className="luxia-login-actions">
        <p className="luxia-login-help luxia-type-caption">
          <button type="button" className="luxia-login-text-link" onClick={onBack}>
            Back to verification
          </button>
        </p>
        <p className="luxia-login-help luxia-type-caption">
          <button type="button" className="luxia-login-text-link" onClick={onBackToSignIn}>
            Back to sign in
          </button>
        </p>
      </div>
    </>
  );
}

function PrototypeQrPlaceholder() {
  return (
    <div className="luxia-login-qr" aria-hidden>
      <svg width="128" height="128" viewBox="0 0 128 128" fill="none">
        <rect x="8" y="8" width="40" height="40" rx="4" fill="currentColor" />
        <rect x="16" y="16" width="24" height="24" rx="2" fill="#1C1336" />
        <rect x="22" y="22" width="12" height="12" fill="currentColor" />
        <rect x="80" y="8" width="40" height="40" rx="4" fill="currentColor" />
        <rect x="88" y="16" width="24" height="24" rx="2" fill="#1C1336" />
        <rect x="94" y="22" width="12" height="12" fill="currentColor" />
        <rect x="8" y="80" width="40" height="40" rx="4" fill="currentColor" />
        <rect x="16" y="88" width="24" height="24" rx="2" fill="#1C1336" />
        <rect x="22" y="94" width="12" height="12" fill="currentColor" />
        <rect x="56" y="8" width="12" height="12" fill="currentColor" />
        <rect x="80" y="56" width="12" height="12" fill="currentColor" />
        <rect x="104" y="56" width="12" height="12" fill="currentColor" />
        <rect x="56" y="32" width="12" height="12" fill="currentColor" />
        <rect x="56" y="56" width="12" height="12" fill="currentColor" />
        <rect x="80" y="80" width="12" height="12" fill="currentColor" />
        <rect x="104" y="80" width="12" height="12" fill="currentColor" />
        <rect x="56" y="104" width="12" height="12" fill="currentColor" />
        <rect x="80" y="104" width="20" height="12" fill="currentColor" />
        <rect x="104" y="104" width="12" height="12" fill="currentColor" />
      </svg>
    </div>
  );
}

export function MfaSetupPanel({ onContinue }: { onContinue: () => void }) {
  const [continuing, setContinuing] = useState(false);

  function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    afterNextPaint(onContinue);
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Set up multi-factor authentication</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Add an authenticator app to protect your account.
        </p>
      </header>

      <ol className="luxia-login-setup-steps">
        <li className="luxia-login-setup-step">
          <span className="luxia-login-setup-step-label luxia-type-caption">1. Scan QR code</span>
          <div className="luxia-login-qr-wrap">
            <PrototypeQrPlaceholder />
            <p className="luxia-type-caption luxia-login-subtitle">
              Prototype placeholder — not a scannable production QR code.
            </p>
          </div>
        </li>
        <li className="luxia-login-setup-step">
          <span className="luxia-login-setup-step-label luxia-type-caption">2. Or enter setup key</span>
          <div className="luxia-login-setup-key">
            <code className="luxia-login-secret">{PROTOTYPE_MFA_SETUP_KEY}</code>
          </div>
        </li>
        <li className="luxia-login-setup-step">
          <span className="luxia-login-setup-step-label luxia-type-caption">3. Continue</span>
          <Button
            type="button"
            variant="primary"
            className={AUTH_PRIMARY_CTA}
            disabled={continuing}
            aria-busy={continuing || undefined}
            onClick={handleContinue}
          >
            <AuthBusyLabel busy={continuing} busyLabel="Saving…" idleLabel="Continue" />
          </Button>
        </li>
      </ol>

      <div className="luxia-login-actions">
        <p className="luxia-login-help luxia-type-caption">
          <button
            type="button"
            className="luxia-login-text-link"
            onClick={() => toast.message(EMAIL_OTP_UNAVAILABLE_MESSAGE)}
          >
            Email OTP unavailable in this prototype
          </button>
        </p>
      </div>
    </>
  );
}

export function RecoveryKeyRevealPanel({
  email,
  onContinue,
}: {
  email: string;
  onContinue: () => void;
}) {
  const ackId = useId();
  const [saved, setSaved] = useState(false);
  const [ackError, setAckError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);

  function handleContinue() {
    if (continuing) return;
    if (!saved) {
      setAckError("Confirm that you saved your recovery key.");
      return;
    }
    setContinuing(true);
    afterNextPaint(() => {
      writeMfaEnrolled(email);
      onContinue();
    });
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Recovery key</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Save this recovery key somewhere secure. You may need it if you lose access to your
          authentication device. It cannot be shown again in this prototype.
        </p>
      </header>
      <div className="luxia-login-recovery">
        <code className="luxia-login-secret" tabIndex={0}>
          {PROTOTYPE_RECOVERY_KEY}
        </code>
        <Button
          type="button"
          variant="secondary"
          className="luxia-login-copy luxia-button--on-dark"
          onClick={() => {
            void navigator.clipboard.writeText(PROTOTYPE_RECOVERY_KEY).then(
              () => toast.message("Recovery key copied."),
              () => toast.message("Unable to copy recovery key."),
            );
          }}
        >
          Copy
        </Button>
      </div>
      <div className="luxia-login-form w-full min-w-0">
        <div className="luxia-login-field-stack">
          <div className="flex items-start gap-2">
            <Checkbox
              id={ackId}
              checked={saved}
              className="luxia-login-checkbox mt-0.5"
              onCheckedChange={(value) => {
                setSaved(value === true);
                if (ackError) setAckError(null);
              }}
            />
            <Label htmlFor={ackId} className="cursor-pointer font-normal">
              I saved my recovery key
            </Label>
          </div>
          {ackError ? (
            <p className="luxia-type-caption luxia-login-error" role="alert">
              {ackError}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={continuing}
          aria-busy={continuing || undefined}
          onClick={handleContinue}
        >
          <AuthBusyLabel busy={continuing} busyLabel="Saving…" idleLabel="Continue" />
        </Button>
      </div>
    </>
  );
}

export function ResetPasswordPanel({
  emailHint,
  onReset,
}: {
  emailHint: string | null;
  onReset: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const id = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nextPassword = validatePasswordPolicy(password);
    const nextConfirm = !confirm
      ? "Confirm your password."
      : confirm === password
        ? null
        : "Passwords do not match.";
    setPasswordError(nextPassword);
    setConfirmError(nextConfirm);
    if (nextPassword || nextConfirm) return;
    setSaving(true);
    afterNextPaint(() => onReset(password));
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Reset password</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Choose a new password{emailHint ? " for your account" : ""}.
        </p>
      </header>
      <form className="luxia-login-form w-full min-w-0" onSubmit={handleSubmit} noValidate aria-busy={saving || undefined}>
        <PasswordField
          id={`${id}-new`}
          name="new-password"
          label="New password"
          required
          autoComplete="new-password"
          autoFocus
          value={password}
          error={passwordError}
          onChange={(value) => {
            setPassword(value);
            if (passwordError) setPasswordError(null);
          }}
        />
        <PasswordField
          id={`${id}-confirm`}
          name="confirm-password"
          label="Confirm password"
          required
          autoComplete="new-password"
          value={confirm}
          error={confirmError}
          onChange={(value) => {
            setConfirm(value);
            if (confirmError) setConfirmError(null);
          }}
        />
        <p className="luxia-type-caption luxia-login-policy-hint">
          Use at least {PASSWORD_MIN_LENGTH} characters.
        </p>
        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={saving}
          aria-busy={saving || undefined}
        >
          <AuthBusyLabel busy={saving} busyLabel="Resetting password…" idleLabel="Reset password" />
        </Button>
      </form>
    </>
  );
}

export function AuthStatusPanel({
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">{title}</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">{body}</p>
      </header>
      <Button
        type="button"
        variant="primary"
        className={AUTH_PRIMARY_CTA}
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
      {secondaryLabel && onSecondary ? (
        <div className="luxia-login-actions">
          <p className="luxia-login-help luxia-type-caption">
            <button type="button" className="luxia-login-text-link" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          </p>
        </div>
      ) : null}
    </>
  );
}
