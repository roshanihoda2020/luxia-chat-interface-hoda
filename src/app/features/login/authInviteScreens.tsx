import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  formatCountdownClock,
  resolveAuthError,
} from "@/app/features/login/authErrors";
import {
  AuthBackToSignIn,
  AuthBusyLabel,
  afterNextPaint,
} from "@/app/features/login/authShared";
import {
  EMAIL_OTP_COOLDOWN_SECONDS,
  PROTOTYPE_RETRY_AFTER_SECONDS,
  type PrototypeAuthAccount,
} from "@/app/features/login/prototypeAuth";

const AUTH_PRIMARY_CTA =
  "luxia-login-submit luxia-login-submit--activate luxia-button--on-dark";

export function AuthStatusPanel({
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onBackToSignIn,
}: {
  title: string;
  body: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onBackToSignIn: () => void;
}) {
  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">{title}</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">{body}</p>
      </header>
      {primaryLabel && onPrimary ? (
        <Button type="button" variant="primary" className={AUTH_PRIMARY_CTA} onClick={onPrimary}>
          {primaryLabel}
        </Button>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <div className="luxia-login-actions">
          <p className="luxia-login-help luxia-type-caption">
            <button type="button" className="luxia-login-text-link" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          </p>
        </div>
      ) : null}
      <AuthBackToSignIn onClick={onBackToSignIn} />
    </>
  );
}

export function InvitationAcceptPanel({
  account,
  existingAccount,
  onAccept,
  onSignInToJoin,
  onBackToSignIn,
}: {
  account: PrototypeAuthAccount;
  existingAccount?: boolean;
  onAccept: () => void;
  onSignInToJoin: () => void;
  onBackToSignIn: () => void;
}) {
  const [accepting, setAccepting] = useState(false);
  const org = account.inviteOrganization?.trim() || "Luxia";
  const inviter = account.inviteInviterName?.trim() || "Your administrator";
  const invitedEmail = account.email;

  function handleAccept() {
    if (accepting) return;
    setAccepting(true);
    afterNextPaint(onAccept);
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">You&apos;re invited to Luxia</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Review the invitation details below.
        </p>
      </header>
      <dl className="luxia-login-invite-meta">
        <div className="luxia-login-invite-meta-row">
          <dt>Invited by</dt>
          <dd>{inviter}</dd>
        </div>
        <div className="luxia-login-invite-meta-row">
          <dt>Organization</dt>
          <dd>{org}</dd>
        </div>
        <div className="luxia-login-invite-meta-row">
          <dt>Email</dt>
          <dd>
            <span className="luxia-login-invite-email">{invitedEmail}</span>
          </dd>
        </div>
      </dl>
      {existingAccount ? (
        <Button
          type="button"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          onClick={onSignInToJoin}
        >
          Sign in to join
        </Button>
      ) : (
        <Button
          type="button"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={accepting}
          aria-busy={accepting || undefined}
          onClick={handleAccept}
        >
          <AuthBusyLabel busy={accepting} busyLabel="Continuing…" idleLabel="Accept invitation" />
        </Button>
      )}
      <AuthBackToSignIn onClick={onBackToSignIn} />
    </>
  );
}

export function InviteExpiredPanel({
  onBackToSignIn,
}: {
  onBackToSignIn: () => void;
}) {
  const [requested, setRequested] = useState(false);
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

  function requestInvite() {
    if (cooldown > 0 || rateLimited > 0) return;
    setRequested(true);
    setCooldown(EMAIL_OTP_COOLDOWN_SECONDS);
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">
          {resolveAuthError({ errorCode: "INVITE_EXPIRED" }).message}
        </h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Ask your administrator for a new invitation, or sign in if you already have an account.
        </p>
      </header>
      {rateLimited > 0 ? (
        <p className="luxia-type-caption luxia-login-error" role="status">
          {resolveAuthError({
            errorCode: "AUTH_RATE_LIMITED",
            retryAfterSeconds: rateLimited,
          }).message}{" "}
          ({formatCountdownClock(rateLimited)})
        </p>
      ) : cooldown > 0 ? (
        <p className="luxia-login-help luxia-type-caption" role="status">
          {requested
            ? `Request sent. You can request again in ${formatCountdownClock(cooldown)}.`
            : `Resend in ${formatCountdownClock(cooldown)}`}
        </p>
      ) : (
        <Button type="button" variant="primary" className={AUTH_PRIMARY_CTA} onClick={requestInvite}>
          Request a new invitation
        </Button>
      )}
      {import.meta.env.DEV ? (
        <div className="luxia-login-actions">
          <p className="luxia-login-help luxia-type-caption">
            <button
              type="button"
              className="luxia-login-text-link"
              onClick={() => setRateLimited(PROTOTYPE_RETRY_AFTER_SECONDS)}
            >
              Demo: too many requests
            </button>
          </p>
        </div>
      ) : null}
      <AuthBackToSignIn onClick={onBackToSignIn} />
    </>
  );
}
