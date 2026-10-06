/**
 * Frontend Auth V2 error-code contract.
 * Maps stable machine-readable codes to copy and recovery.
 * Prototype may trigger these locally — production will receive them from the API.
 * Does not implement server enforcement.
 */

export type AuthErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_LOCKED"
  | "AUTH_RATE_LIMITED"
  | "AUTH_CAPTCHA_FAILED"
  | "AUTH_ACCOUNT_DEACTIVATED"
  | "AUTH_MUST_CHANGE_PASSWORD"
  | "MFA_CODE_INVALID"
  | "MFA_CODE_EXPIRED"
  | "MFA_TOO_MANY_ATTEMPTS"
  | "MFA_SESSION_EXPIRED"
  | "INVITE_EXPIRED"
  | "INVITE_USED"
  | "INVITE_REVOKED"
  | "INVITE_INVALID"
  | "PASSWORD_TOO_COMMON"
  | "PASSWORD_BREACHED"
  | "NETWORK_ERROR";

export type AuthErrorPayload = {
  errorCode: AuthErrorCode;
  /** Seconds until retry is allowed — expected for AUTH_LOCKED / AUTH_RATE_LIMITED. */
  retryAfterSeconds?: number;
  message?: string;
};

export type AuthErrorView = {
  errorCode: AuthErrorCode;
  message: string;
  recovery:
    | "retry"
    | "resend"
    | "restart-mfa"
    | "sign-in"
    | "reset-password"
    | "contact-support"
    | "wait";
};

const MESSAGES: Record<AuthErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS: "Incorrect email or password.",
  AUTH_LOCKED: "Too many incorrect attempts. Try again in N min.",
  AUTH_RATE_LIMITED: "Too many attempts. Try again in N min.",
  AUTH_CAPTCHA_FAILED: "Verification failed. Try again.",
  AUTH_ACCOUNT_DEACTIVATED:
    "This account is deactivated. Contact your administrator or support for help.",
  AUTH_MUST_CHANGE_PASSWORD: "You must change your password before continuing.",
  MFA_CODE_INVALID: "That code isn't valid. Check the code and try again.",
  MFA_CODE_EXPIRED: "This code has expired. Request a new code to continue.",
  MFA_TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Restart authentication to continue.",
  MFA_SESSION_EXPIRED: "Your sign-in session expired. Please sign in again.",
  INVITE_EXPIRED: "This invitation has expired.",
  INVITE_USED: "This invitation has already been used.",
  INVITE_REVOKED: "This invitation has been revoked.",
  INVITE_INVALID: "This invitation link isn't valid.",
  PASSWORD_TOO_COMMON: "Choose a less common password.",
  PASSWORD_BREACHED: "This password appears in known breaches. Choose another.",
  NETWORK_ERROR: "Something went wrong. Check your connection and try again.",
};

const RECOVERY: Record<AuthErrorCode, AuthErrorView["recovery"]> = {
  AUTH_INVALID_CREDENTIALS: "retry",
  AUTH_LOCKED: "wait",
  AUTH_RATE_LIMITED: "wait",
  AUTH_CAPTCHA_FAILED: "retry",
  AUTH_ACCOUNT_DEACTIVATED: "contact-support",
  AUTH_MUST_CHANGE_PASSWORD: "retry",
  MFA_CODE_INVALID: "retry",
  MFA_CODE_EXPIRED: "resend",
  MFA_TOO_MANY_ATTEMPTS: "restart-mfa",
  MFA_SESSION_EXPIRED: "sign-in",
  INVITE_EXPIRED: "retry",
  INVITE_USED: "sign-in",
  INVITE_REVOKED: "contact-support",
  INVITE_INVALID: "sign-in",
  PASSWORD_TOO_COMMON: "retry",
  PASSWORD_BREACHED: "retry",
  NETWORK_ERROR: "retry",
};

export function formatRetryMessage(template: string, retryAfterSeconds?: number): string {
  if (retryAfterSeconds == null || retryAfterSeconds <= 0) {
    return template.replace(" in N min.", ".").replace("N min", "a few minutes");
  }
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return template.replace("N min", `${minutes} min`);
}

export function resolveAuthError(payload: AuthErrorPayload): AuthErrorView {
  const base = MESSAGES[payload.errorCode];
  const message =
    payload.message ??
    (payload.errorCode === "AUTH_LOCKED" || payload.errorCode === "AUTH_RATE_LIMITED"
      ? formatRetryMessage(base, payload.retryAfterSeconds)
      : base);
  return {
    errorCode: payload.errorCode,
    message,
    recovery: RECOVERY[payload.errorCode],
  };
}

export function formatCountdownClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
