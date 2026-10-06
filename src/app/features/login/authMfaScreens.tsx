import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components/ui/input-otp";
import {
  formatCountdownClock,
  resolveAuthError,
} from "@/app/features/login/authErrors";
import {
  AuthBackToSignIn,
  AuthBusyLabel,
  AuthCancelToApp,
  AuthField,
  afterNextPaint,
} from "@/app/features/login/authShared";
import {
  EMAIL_OTP_COOLDOWN_SECONDS,
  EMAIL_OTP_TTL_SECONDS,
  MFA_MAX_WRONG_ATTEMPTS,
  PROTOTYPE_EMAIL_OTP,
  PROTOTYPE_MFA_SETUP_KEY,
  PROTOTYPE_OTP,
  PROTOTYPE_RECOVERY_KEY,
  PROTOTYPE_RETRY_AFTER_SECONDS,
  maskEmailAddress,
  writeMfaEnrolled,
  type PrototypeMfaChallengeMethod,
} from "@/app/features/login/prototypeAuth";

const AUTH_PRIMARY_CTA =
  "luxia-login-submit luxia-login-submit--activate luxia-button--on-dark";

function OtpSlots({
  code,
  onChange,
  onComplete,
  disabled,
  error,
  label,
}: {
  code: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
  label: string;
}) {
  const errorId = useId();
  return (
    <div className="luxia-login-field-stack">
      <div className="luxia-login-otp">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={onChange}
          onComplete={onComplete}
          disabled={disabled}
          autoFocus
          aria-label={label}
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
  );
}

function useResendCooldown(initialSeconds = EMAIL_OTP_COOLDOWN_SECONDS) {
  const [cooldownRemaining, setCooldownRemaining] = useState(initialSeconds);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setCooldownRemaining((current) => (current <= 0 ? 0 : current - 1));
      setRateLimitedUntil((until) => {
        if (until == null) return null;
        return Date.now() >= until ? null : until;
      });
    }, 1000);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, []);

  function restartCooldown(seconds = EMAIL_OTP_COOLDOWN_SECONDS) {
    setCooldownRemaining(seconds);
  }

  function triggerPrototypeRateLimit(seconds = PROTOTYPE_RETRY_AFTER_SECONDS) {
    setRateLimitedUntil(Date.now() + seconds * 1000);
  }

  const rateLimitedSeconds =
    rateLimitedUntil == null ? 0 : Math.max(0, Math.ceil((rateLimitedUntil - Date.now()) / 1000));

  return {
    cooldownRemaining,
    restartCooldown,
    rateLimitedSeconds,
    triggerPrototypeRateLimit,
    isRateLimited: rateLimitedSeconds > 0,
  };
}

export function MfaMethodSelectPanel({
  onSelect,
  onCancel,
  cancelToApp,
}: {
  onSelect: (method: PrototypeMfaChallengeMethod) => void;
  onCancel: () => void;
  cancelToApp?: boolean;
}) {
  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Secure your account</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Choose how you want to verify your identity.
        </p>
      </header>
      <div className="luxia-login-method-list" role="list">
        <button
          type="button"
          className="luxia-login-method-option"
          role="listitem"
          onClick={() => onSelect("authenticator")}
        >
          <span className="luxia-login-method-option-title">Authenticator app</span>
          <span className="luxia-login-method-option-meta">Recommended</span>
        </button>
        <button
          type="button"
          className="luxia-login-method-option"
          role="listitem"
          onClick={() => onSelect("email-otp")}
        >
          <span className="luxia-login-method-option-title">Email code</span>
          <span className="luxia-login-method-option-meta">Send a one-time code</span>
        </button>
      </div>
      {cancelToApp ? (
        <AuthCancelToApp onClick={onCancel} />
      ) : (
        <AuthBackToSignIn onClick={onCancel} />
      )}
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

export function MfaAuthenticatorSetupPanel({
  onVerified,
  onCancel,
  cancelToApp,
}: {
  onVerified: () => void;
  onCancel: () => void;
  cancelToApp?: boolean;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [verifying, setVerifying] = useState(false);

  function submitCode(value: string) {
    if (verifying) return;
    if (wrongCount >= MFA_MAX_WRONG_ATTEMPTS) {
      setError(resolveAuthError({ errorCode: "MFA_TOO_MANY_ATTEMPTS" }).message);
      return;
    }
    if (value.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    afterNextPaint(() => {
      if (value !== PROTOTYPE_OTP) {
        const next = wrongCount + 1;
        setWrongCount(next);
        setError(
          next >= MFA_MAX_WRONG_ATTEMPTS
            ? resolveAuthError({ errorCode: "MFA_TOO_MANY_ATTEMPTS" }).message
            : resolveAuthError({ errorCode: "MFA_CODE_INVALID" }).message,
        );
        setCode("");
        setVerifying(false);
        return;
      }
      onVerified();
    });
  }

  if (wrongCount >= MFA_MAX_WRONG_ATTEMPTS) {
    return (
      <>
        <header className="luxia-login-heading">
          <h1 className="luxia-type-heading-h3 luxia-login-title">Too many attempts</h1>
          <p className="luxia-type-body-small luxia-login-subtitle">
            {resolveAuthError({ errorCode: "MFA_TOO_MANY_ATTEMPTS" }).message}
          </p>
        </header>
        <Button type="button" variant="primary" className={AUTH_PRIMARY_CTA} onClick={onCancel}>
          Restart setup
        </Button>
      </>
    );
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Set up authenticator</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Scan the QR code, then enter a 6-digit code to verify.
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
          <span className="luxia-login-setup-step-label luxia-type-caption">3. Enter 6-digit code</span>
          <form
            className="luxia-login-form w-full min-w-0"
            onSubmit={(event) => {
              event.preventDefault();
              submitCode(code);
            }}
            aria-busy={verifying || undefined}
          >
            <OtpSlots
              code={code}
              onChange={(value) => {
                setCode(value);
                if (error) setError(null);
              }}
              onComplete={submitCode}
              disabled={verifying}
              error={error}
              label="Authenticator verification code"
            />
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
        </li>
      </ol>
      {cancelToApp ? (
        <AuthCancelToApp onClick={onCancel} />
      ) : (
        <AuthBackToSignIn onClick={onCancel} />
      )}
    </>
  );
}

export function MfaVerifyPanel({
  onVerified,
  onUseRecoveryKey,
  onUseEmailInstead,
  onSessionExpired,
  onBackToSignIn,
}: {
  onVerified: () => void;
  onUseRecoveryKey: () => void;
  onUseEmailInstead?: () => void;
  onSessionExpired: () => void;
  onBackToSignIn: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [verifying, setVerifying] = useState(false);

  function submitCode(value: string) {
    if (verifying) return;
    if (wrongCount >= MFA_MAX_WRONG_ATTEMPTS) {
      setError(resolveAuthError({ errorCode: "MFA_TOO_MANY_ATTEMPTS" }).message);
      return;
    }
    if (value.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    afterNextPaint(() => {
      // Prototype: code "000000" demos MFA_SESSION_EXPIRED
      if (value === "000000") {
        onSessionExpired();
        return;
      }
      if (value !== PROTOTYPE_OTP) {
        const next = wrongCount + 1;
        setWrongCount(next);
        setError(
          next >= MFA_MAX_WRONG_ATTEMPTS
            ? resolveAuthError({ errorCode: "MFA_TOO_MANY_ATTEMPTS" }).message
            : resolveAuthError({ errorCode: "MFA_CODE_INVALID" }).message,
        );
        setCode("");
        setVerifying(false);
        return;
      }
      onVerified();
    });
  }

  if (wrongCount >= MFA_MAX_WRONG_ATTEMPTS) {
    return (
      <>
        <header className="luxia-login-heading">
          <h1 className="luxia-type-heading-h3 luxia-login-title">Too many attempts</h1>
          <p className="luxia-type-body-small luxia-login-subtitle">
            {resolveAuthError({ errorCode: "MFA_TOO_MANY_ATTEMPTS" }).message}
          </p>
        </header>
        <Button type="button" variant="primary" className={AUTH_PRIMARY_CTA} onClick={onBackToSignIn}>
          Back to sign in
        </Button>
      </>
    );
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
        <OtpSlots
          code={code}
          onChange={(value) => {
            setCode(value);
            if (error) setError(null);
          }}
          onComplete={submitCode}
          disabled={verifying}
          error={error}
          label="Verification code"
        />
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
        {onUseEmailInstead ? (
          <p className="luxia-login-help luxia-type-caption">
            <button type="button" className="luxia-login-text-link" onClick={onUseEmailInstead}>
              Send a code to my email instead
            </button>
          </p>
        ) : null}
      </div>
      <AuthBackToSignIn onClick={onBackToSignIn} />
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
      <form
        className="luxia-login-form w-full min-w-0"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={verifying || undefined}
      >
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
      </div>
      <AuthBackToSignIn onClick={onBackToSignIn} />
    </>
  );
}

export function RecoveryKeyRevealPanel({
  email,
  method,
  onContinue,
  onCancel,
  cancelToApp,
}: {
  email: string;
  method: PrototypeMfaChallengeMethod;
  onContinue: () => void;
  onCancel: () => void;
  cancelToApp?: boolean;
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
      writeMfaEnrolled(email, method);
      onContinue();
    });
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Recovery key</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Save this recovery key somewhere secure. You may need it if you lose access to your
          authentication device.
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
      {cancelToApp ? (
        <AuthCancelToApp onClick={onCancel} />
      ) : (
        <AuthBackToSignIn onClick={onCancel} />
      )}
    </>
  );
}

export function EmailOtpVerifyPanel({
  email,
  onVerified,
  onUseAuthenticatorInstead,
  onSessionExpired,
  onBackToSignIn,
  onCancel,
  cancelToApp,
  enrollOnSuccess,
}: {
  email: string;
  onVerified: () => void;
  onUseAuthenticatorInstead?: () => void;
  onSessionExpired: () => void;
  onBackToSignIn: () => void;
  onCancel?: () => void;
  cancelToApp?: boolean;
  enrollOnSuccess?: boolean;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [issuedAtMs, setIssuedAtMs] = useState(() => Date.now());
  const [wrongCount, setWrongCount] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const {
    cooldownRemaining,
    restartCooldown,
    isRateLimited,
    rateLimitedSeconds,
    triggerPrototypeRateLimit,
  } = useResendCooldown();

  function submitCode(value: string) {
    if (verifying) return;
    if (wrongCount >= MFA_MAX_WRONG_ATTEMPTS) {
      setError(resolveAuthError({ errorCode: "MFA_TOO_MANY_ATTEMPTS" }).message);
      return;
    }
    if (value.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    afterNextPaint(() => {
      if (value === "000000") {
        onSessionExpired();
        return;
      }
      const ageSeconds = (Date.now() - issuedAtMs) / 1000;
      if (ageSeconds > EMAIL_OTP_TTL_SECONDS) {
        setError(resolveAuthError({ errorCode: "MFA_CODE_EXPIRED" }).message);
        setCode("");
        setVerifying(false);
        return;
      }
      if (value !== PROTOTYPE_EMAIL_OTP) {
        const next = wrongCount + 1;
        setWrongCount(next);
        setError(
          next >= MFA_MAX_WRONG_ATTEMPTS
            ? resolveAuthError({ errorCode: "MFA_TOO_MANY_ATTEMPTS" }).message
            : resolveAuthError({ errorCode: "MFA_CODE_INVALID" }).message,
        );
        setCode("");
        setVerifying(false);
        return;
      }
      if (enrollOnSuccess) writeMfaEnrolled(email, "email-otp");
      onVerified();
    });
  }

  function handleResend() {
    if (resending || cooldownRemaining > 0 || isRateLimited) return;
    setResending(true);
    setError(null);
    setResendNotice(null);
    afterNextPaint(() => {
      setIssuedAtMs(Date.now());
      restartCooldown();
      setCode("");
      setResendNotice("A new verification code was sent.");
      setResending(false);
    });
  }

  if (wrongCount >= MFA_MAX_WRONG_ATTEMPTS) {
    return (
      <>
        <header className="luxia-login-heading">
          <h1 className="luxia-type-heading-h3 luxia-login-title">Too many attempts</h1>
          <p className="luxia-type-body-small luxia-login-subtitle">
            {resolveAuthError({ errorCode: "MFA_TOO_MANY_ATTEMPTS" }).message}
          </p>
        </header>
        <Button
          type="button"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          onClick={cancelToApp && onCancel ? onCancel : onBackToSignIn}
        >
          {cancelToApp ? "Cancel" : "Back to sign in"}
        </Button>
      </>
    );
  }

  const masked = maskEmailAddress(email);

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Verify your identity</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          We sent a verification code to {masked}.
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
        <OtpSlots
          code={code}
          onChange={(value) => {
            setCode(value);
            if (error) setError(null);
            if (resendNotice) setResendNotice(null);
          }}
          onComplete={submitCode}
          disabled={verifying}
          error={error}
          label="Email verification code"
        />
        {resendNotice ? (
          <p className="luxia-type-caption luxia-login-subtitle" role="status">
            {resendNotice}
          </p>
        ) : null}
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
          {isRateLimited ? (
            <span role="status">
              {resolveAuthError({
                errorCode: "AUTH_RATE_LIMITED",
                retryAfterSeconds: rateLimitedSeconds,
              }).message}{" "}
              ({formatCountdownClock(rateLimitedSeconds)})
            </span>
          ) : cooldownRemaining > 0 ? (
            <span aria-live="off">Resend code in {formatCountdownClock(cooldownRemaining)}</span>
          ) : (
            <>
              Didn&apos;t receive a code?{" "}
              <button
                type="button"
                className="luxia-login-text-link"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
            </>
          )}
        </p>
        {onUseAuthenticatorInstead ? (
          <p className="luxia-login-help luxia-type-caption">
            <button
              type="button"
              className="luxia-login-text-link"
              onClick={onUseAuthenticatorInstead}
            >
              Use authenticator instead
            </button>
          </p>
        ) : null}
        {import.meta.env.DEV ? (
          <p className="luxia-login-help luxia-type-caption">
            <button
              type="button"
              className="luxia-login-text-link"
              onClick={() => triggerPrototypeRateLimit()}
            >
              Demo: too many requests
            </button>
          </p>
        ) : null}
      </div>
      {cancelToApp && onCancel ? (
        <AuthCancelToApp onClick={onCancel} />
      ) : (
        <AuthBackToSignIn onClick={onBackToSignIn} />
      )}
    </>
  );
}
