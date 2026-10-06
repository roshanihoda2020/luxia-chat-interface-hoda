import { useEffect, useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  formatCountdownClock,
  resolveAuthError,
  type AuthErrorCode,
} from "@/app/features/login/authErrors";
import {
  AuthBackToSignIn,
  AuthBusyLabel,
  AuthField,
  LEGAL_UNAVAILABLE_MESSAGE,
  PasswordField,
  SUPPORT_UNAVAILABLE_MESSAGE,
  afterNextPaint,
} from "@/app/features/login/authShared";
import { DevTestAccountsPanel } from "@/app/features/login/DevTestAccountsPanel";
import { TurnstileField, isTurnstileRequired } from "@/app/features/login/TurnstileField";
import {
  EMAIL_OTP_COOLDOWN_SECONDS,
  PROTOTYPE_PASSWORD,
  PROTOTYPE_RETRY_AFTER_SECONDS,
  credentialsMatch,
  findPrototypeAccount,
  isValidEmailFormat,
  type PrototypeAuthAccount,
} from "@/app/features/login/prototypeAuth";

export type SignInNotice =
  | "session-expired"
  | "password-updated"
  | "mfa-session-expired"
  | null;

export type SignInFormMode =
  | "normal"
  | "locked"
  | "rate-limited"
  | "captcha-failed"
  | "deactivated";

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
  formMode = "normal",
  onAuthenticated,
  onForgotPassword,
  onMustChangePassword,
}: {
  notice: SignInNotice;
  formMode?: SignInFormMode;
  onAuthenticated: (account: PrototypeAuthAccount, rememberMe: boolean) => void;
  onForgotPassword: () => void;
  onMustChangePassword?: (account: PrototypeAuthAccount, rememberMe: boolean) => void;
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
  const [formErrorCode, setFormErrorCode] = useState<AuthErrorCode | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(
    formMode === "locked" || formMode === "rate-limited" ? PROTOTYPE_RETRY_AFTER_SECONDS : 0,
  );
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [captchaError, setCaptchaError] = useState(
    formMode === "captcha-failed"
      ? resolveAuthError({ errorCode: "AUTH_CAPTCHA_FAILED" }).message
      : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const deactivated = formMode === "deactivated";

  useEffect(() => {
    if (lockRemaining <= 0) return;
    const id = window.setInterval(() => {
      setLockRemaining((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockRemaining > 0]);

  useEffect(() => {
    if (formMode === "locked") {
      const view = resolveAuthError({
        errorCode: "AUTH_LOCKED",
        retryAfterSeconds: PROTOTYPE_RETRY_AFTER_SECONDS,
      });
      setFormError(view.message);
      setFormErrorCode("AUTH_LOCKED");
      setLockRemaining(PROTOTYPE_RETRY_AFTER_SECONDS);
    } else if (formMode === "rate-limited") {
      const view = resolveAuthError({
        errorCode: "AUTH_RATE_LIMITED",
        retryAfterSeconds: PROTOTYPE_RETRY_AFTER_SECONDS,
      });
      setFormError(view.message);
      setFormErrorCode("AUTH_RATE_LIMITED");
      setLockRemaining(PROTOTYPE_RETRY_AFTER_SECONDS);
    }
  }, [formMode]);

  const lockedOut =
    lockRemaining > 0 &&
    (formErrorCode === "AUTH_LOCKED" || formErrorCode === "AUTH_RATE_LIMITED");

  function applyInvalidCredentials() {
    const nextFails = failCount + 1;
    setFailCount(nextFails);
    const view = resolveAuthError({ errorCode: "AUTH_INVALID_CREDENTIALS" });
    setFormError(view.message);
    setFormErrorCode("AUTH_INVALID_CREDENTIALS");
    setPassword("");
    setSubmitting(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || deactivated || lockedOut) return;
    const nextEmailError = emailFieldError(email);
    const nextPasswordError = !password ? "Enter your password." : null;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) {
      setFormError(null);
      setFormErrorCode(null);
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setCaptchaError(resolveAuthError({ errorCode: "AUTH_CAPTCHA_FAILED" }).message);
      return;
    }
    setFormError(null);
    setFormErrorCode(null);
    setCaptchaError(null);
    setSubmitting(true);
    afterNextPaint(() => {
      if (formMode === "captcha-failed" && turnstileRequired) {
        setCaptchaError(resolveAuthError({ errorCode: "AUTH_CAPTCHA_FAILED" }).message);
        setTurnstileToken(null);
        setTurnstileKey((key) => key + 1);
        setSubmitting(false);
        return;
      }
      const account = findPrototypeAccount(email);
      if (!account || !credentialsMatch(email, password)) {
        applyInvalidCredentials();
        return;
      }
      if (account.mustChangePassword && onMustChangePassword) {
        onMustChangePassword(account, rememberMe);
        return;
      }
      onAuthenticated(account, rememberMe);
    });
  }

  function handleDevLaunchAccount(account: PrototypeAuthAccount) {
    if (submitting || deactivated || lockedOut) return;
    setEmail(account.email);
    setPassword(PROTOTYPE_PASSWORD);
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setFormErrorCode(null);
    if (!credentialsMatch(account.email, PROTOTYPE_PASSWORD)) {
      applyInvalidCredentials();
      return;
    }
    setSubmitting(true);
    afterNextPaint(() => {
      if (account.mustChangePassword && onMustChangePassword) {
        onMustChangePassword(account, false);
        return;
      }
      onAuthenticated(account, false);
    });
  }

  if (deactivated) {
    const view = resolveAuthError({ errorCode: "AUTH_ACCOUNT_DEACTIVATED" });
    return (
      <>
        <header className="luxia-login-heading">
          <h1 className="luxia-type-heading-h3 luxia-login-title">Account deactivated</h1>
          <p className="luxia-type-body-small luxia-login-subtitle">{view.message}</p>
        </header>
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
        </div>
        <AuthBackToSignIn onClick={() => window.location.assign("/")} />
      </>
    );
  }

  const showResetHint = failCount >= 3 || formErrorCode === "AUTH_LOCKED";

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Welcome back</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Sign in to continue to Luxia
        </p>
      </header>

      {notice === "session-expired" || notice === "mfa-session-expired" ? (
        <p className="luxia-login-notice" role="status">
          {resolveAuthError({ errorCode: "MFA_SESSION_EXPIRED" }).message}
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
            disabled={lockedOut}
            aria-required="true"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? `${emailId}-error` : undefined}
            className="luxia-login-input max-w-full"
            size={1}
            style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError(null);
              if (formErrorCode === "AUTH_INVALID_CREDENTIALS") {
                setFormError(null);
                setFormErrorCode(null);
              }
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
              if (formErrorCode === "AUTH_INVALID_CREDENTIALS") {
                setFormError(null);
                setFormErrorCode(null);
              }
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id={rememberId}
            checked={rememberMe}
            disabled={lockedOut}
            className="luxia-login-checkbox"
            onCheckedChange={(value) => setRememberMe(value === true)}
          />
          <Label htmlFor={rememberId} className="cursor-pointer font-normal">
            Remember me
          </Label>
        </div>

        <TurnstileField key={turnstileKey} onToken={setTurnstileToken} />
        {captchaError ? (
          <p className="luxia-type-caption luxia-login-error" role="alert">
            {captchaError}
          </p>
        ) : null}

        {formError ? (
          <p id={formErrorId} className="luxia-type-caption luxia-login-error" role="alert">
            {formError}
            {lockRemaining > 0 &&
            (formErrorCode === "AUTH_LOCKED" || formErrorCode === "AUTH_RATE_LIMITED") ? (
              <>
                {" "}
                <span aria-live="off">({formatCountdownClock(lockRemaining)})</span>
              </>
            ) : null}
          </p>
        ) : null}

        {showResetHint ? (
          <p className="luxia-login-help luxia-type-caption">
            <button type="button" className="luxia-login-text-link" onClick={onForgotPassword}>
              Reset your password?
            </button>
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={submitting || lockedOut || (turnstileRequired && !turnstileToken)}
          aria-busy={submitting || undefined}
        >
          <AuthBusyLabel busy={submitting} busyLabel="Signing in…" idleLabel="Sign in" />
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
        <DevTestAccountsPanel onLaunchAccount={handleDevLaunchAccount} />
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
  const [cooldown, setCooldown] = useState(0);
  const [rateLimited, setRateLimited] = useState(0);

  useEffect(() => {
    if (cooldown <= 0 && rateLimited <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
      setRateLimited((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown > 0 || rateLimited > 0]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || rateLimited > 0) return;
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
      setCooldown(EMAIL_OTP_COOLDOWN_SECONDS);
    });
  }

  function handleResend() {
    if (sending || cooldown > 0 || rateLimited > 0) return;
    setSending(true);
    afterNextPaint(() => {
      setCooldown(EMAIL_OTP_COOLDOWN_SECONDS);
      setSending(false);
      toast.message("If an account exists, a new reset link was sent.");
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
        <div className="luxia-login-actions">
          <p className="luxia-login-help luxia-type-caption">
            {rateLimited > 0 ? (
              <span role="status">
                {resolveAuthError({
                  errorCode: "AUTH_RATE_LIMITED",
                  retryAfterSeconds: rateLimited,
                }).message}{" "}
                ({formatCountdownClock(rateLimited)})
              </span>
            ) : cooldown > 0 ? (
              <span aria-live="off">Resend in {formatCountdownClock(cooldown)}</span>
            ) : (
              <>
                Didn&apos;t get it?{" "}
                <button
                  type="button"
                  className="luxia-login-text-link"
                  onClick={handleResend}
                  disabled={sending}
                >
                  {sending ? "Sending…" : "Resend code"}
                </button>
              </>
            )}
          </p>
          {import.meta.env.DEV ? (
            <p className="luxia-login-help luxia-type-caption">
              <button
                type="button"
                className="luxia-login-text-link"
                onClick={() => setRateLimited(PROTOTYPE_RETRY_AFTER_SECONDS)}
              >
                Demo: too many requests
              </button>
            </p>
          ) : null}
        </div>
        <AuthBackToSignIn onClick={onBack} />
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
      <AuthBackToSignIn onClick={onBack} />
    </>
  );
}
