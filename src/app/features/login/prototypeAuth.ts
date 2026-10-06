/**
 * Prototype authentication catalog and persistence.
 * Extends the existing UI session gate — it does not call APIs,
 * enroll real MFA, send email, or replace production auth.
 */
import { clearPrototypeSignedIn, readPrototypeSignedIn } from "./prototypeSignedIn";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
/** Demo password meets min length for prototype catalog accounts. */
export const PROTOTYPE_PASSWORD = "demopass";
export const PROTOTYPE_OTP = "123456";
/** Prototype Email OTP — same digits as authenticator for easy manual testing. */
export const PROTOTYPE_EMAIL_OTP = "123456";
/**
 * Prototype Email OTP cooldown / TTL — UI-oriented demo values.
 * Production: 60s cooldown + server-enforced limits (not implemented here).
 */
export const EMAIL_OTP_COOLDOWN_SECONDS = 60;
/** Prototype-only OTP age window for demonstrating MFA_CODE_EXPIRED UI. */
export const EMAIL_OTP_TTL_SECONDS = 90;
/** Prototype wrong-code budget before MFA_TOO_MANY_ATTEMPTS UI (not server). */
export const MFA_MAX_WRONG_ATTEMPTS = 5;
export const PROTOTYPE_RECOVERY_KEY = "LUXIA-DEMO-RECOVERY-KEY";
export const PROTOTYPE_MFA_SETUP_KEY = "LUXIADEMO2FASECRET";
/** Prototype lockout / rate-limit countdown when demoing AUTH_LOCKED / AUTH_RATE_LIMITED. */
export const PROTOTYPE_RETRY_AFTER_SECONDS = 120;

const PASSWORDS_KEY = "luxia.prototype-auth-passwords.v1";
const SETUP_KEY = "luxia.prototype-account-setup.v1";
const MFA_ENROLLED_KEY = "luxia.prototype-mfa-enrolled.v1";
const MFA_METHOD_KEY = "luxia.prototype-mfa-method.v1";
const MUST_CHANGE_DONE_KEY = "luxia.prototype-must-change-done.v1";
/**
 * Local-only MFA nudge snooze. Future backend field: mfaReminderSnoozedUntil (ISO).
 * Prototype is device-local — not cross-device.
 */
const MFA_NUDGE_SNOOZE_KEY = "luxia.prototype-mfa-nudge-snooze.v1";
/** Prototype default snooze window (7 days) — structure only; not server-persisted. */
export const MFA_NUDGE_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export type PrototypeAuthKind = "returning" | "invited";

export type PrototypeMfaChallengeMethod = "authenticator" | "email-otp";

export type PrototypeAuthAccount = {
  email: string;
  userId: string;
  kind: PrototypeAuthKind;
  /** Returning-user MFA challenge at sign-in (prototype catalog, not Settings MFA APIs). */
  mfaEnabled: boolean;
  /** Org/policy requires MFA — blocking gate until enrolled. */
  needsMfaEnrollment: boolean;
  mfaMethod?: PrototypeMfaChallengeMethod;
  /**
   * Optional non-blocking “Secure your account” nudge AFTER app entry
   * when MFA is not required/enrolled. Isolated from needsMfaEnrollment.
   */
  suggestMfaNudge?: boolean;
  /** Prototype: force password change before app entry. */
  mustChangePassword?: boolean;
  inviteOrganization?: string;
  inviteProject?: string;
  inviteInviterName?: string;
};

export type PostCredentialBranch =
  | "home"
  | "account-setup"
  | "mfa-verify"
  | "mfa-verify-email"
  | "mfa-setup"
  | "must-change-password";

export type PrototypeInviteStatus =
  | "valid"
  | "expired"
  | "invalid"
  | "used"
  | "revoked"
  | "existing";

export type AuthLocationEntry =
  | { kind: "signin" }
  | { kind: "reset"; token: string; valid: boolean }
  | { kind: "session-expired" }
  | { kind: "workspace-unknown" }
  | { kind: "invite"; status: PrototypeInviteStatus }
  | { kind: "account-locked" }
  | { kind: "account-disabled" }
  | { kind: "auth-rate-limited" }
  | { kind: "auth-captcha-failed" };

/** Generic demo identities — same emails as ORGANIZATION_USERS, no personal names. */
export const PROTOTYPE_AUTH_ACCOUNTS: PrototypeAuthAccount[] = [
  {
    email: "user05@luxia.example",
    userId: "user-05",
    kind: "returning",
    mfaEnabled: false,
    needsMfaEnrollment: false,
    suggestMfaNudge: true,
  },
  {
    email: "user01@luxia.example",
    userId: "user-01",
    kind: "returning",
    mfaEnabled: true,
    needsMfaEnrollment: false,
    mfaMethod: "authenticator",
  },
  {
    email: "user02@luxia.example",
    userId: "user-02",
    kind: "returning",
    mfaEnabled: false,
    needsMfaEnrollment: true,
  },
  {
    email: "user06@luxia.example",
    userId: "user-06",
    kind: "invited",
    mfaEnabled: false,
    needsMfaEnrollment: false,
    inviteOrganization: "Acme Analytics",
    inviteProject: "Northwind Insights",
    inviteInviterName: "Alex Rivera",
  },
  {
    email: "user03@luxia.example",
    userId: "user-03",
    kind: "returning",
    mfaEnabled: true,
    needsMfaEnrollment: false,
    mfaMethod: "email-otp",
  },
  {
    email: "user04@luxia.example",
    userId: "user-04",
    kind: "returning",
    mfaEnabled: false,
    needsMfaEnrollment: false,
    mustChangePassword: true,
  },
];

export function getPrototypeInviteAccount(): PrototypeAuthAccount {
  const invited = PROTOTYPE_AUTH_ACCOUNTS.find((account) => account.kind === "invited");
  if (!invited) {
    throw new Error("Prototype invite account missing from catalog.");
  }
  return invited;
}

/** Existing-account invite demo — Sign in to join (not account setup). */
export function getPrototypeExistingInviteAccount(): PrototypeAuthAccount {
  return {
    email: "user01@luxia.example",
    userId: "user-01",
    kind: "invited",
    mfaEnabled: true,
    needsMfaEnrollment: false,
    mfaMethod: "authenticator",
    inviteOrganization: "Acme Analytics",
    inviteProject: "Northwind Insights",
    inviteInviterName: "Alex Rivera",
  };
}

function readJsonMap(key: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function writeJsonMap(key: string, value: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function emailKey(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export type PasswordPolicyResult =
  | { ok: true }
  | {
      ok: false;
      code: "required" | "too-short" | "too-long" | "too-common" | "breached";
      message: string;
    };

/** Demo-only common passwords for UI state — not a real breached-password service. */
const PROTOTYPE_COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password12",
  "password123",
  "12345678",
  "qwerty123",
  "letmein1",
]);

export function evaluatePasswordPolicy(
  password: string,
  options?: { allowDemoCommonTrigger?: boolean },
): PasswordPolicyResult {
  if (!password) {
    return { ok: false, code: "required", message: "Enter your password." };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      code: "too-short",
      message: `Enter at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      code: "too-long",
      message: `Use at most ${PASSWORD_MAX_LENGTH} characters.`,
    };
  }
  if (options?.allowDemoCommonTrigger && PROTOTYPE_COMMON_PASSWORDS.has(password.toLowerCase())) {
    return {
      ok: false,
      code: "too-common",
      message: "Choose a less common password.",
    };
  }
  return { ok: true };
}

export function validatePasswordPolicy(password: string): string | null {
  const result = evaluatePasswordPolicy(password, { allowDemoCommonTrigger: true });
  return result.ok ? null : result.message;
}

export function passwordsMatch(password: string, confirm: string): string | null {
  if (!confirm) return "Confirm your password.";
  if (confirm !== password) return "Passwords do not match.";
  return null;
}

export function findPrototypeAccount(email: string): PrototypeAuthAccount | null {
  const key = emailKey(email);
  return PROTOTYPE_AUTH_ACCOUNTS.find((account) => account.email === key) ?? null;
}

export function writeSharedPassword(password: string): void {
  const map = readJsonMap(PASSWORDS_KEY);
  map["*"] = password;
  writeJsonMap(PASSWORDS_KEY, map);
}

export function getStoredPassword(email: string): string {
  const map = readJsonMap(PASSWORDS_KEY);
  return map[emailKey(email)] ?? map["*"] ?? PROTOTYPE_PASSWORD;
}

export function writeStoredPassword(email: string, password: string): void {
  const map = readJsonMap(PASSWORDS_KEY);
  map[emailKey(email)] = password;
  writeJsonMap(PASSWORDS_KEY, map);
}

export function credentialsMatch(email: string, password: string): boolean {
  const account = findPrototypeAccount(email);
  if (!account) return false;
  return password === getStoredPassword(email);
}

export function readAccountSetupComplete(email: string): boolean {
  const map = readJsonMap(SETUP_KEY);
  return map[emailKey(email)] === "1";
}

export function writeAccountSetupComplete(email: string): void {
  const map = readJsonMap(SETUP_KEY);
  map[emailKey(email)] = "1";
  writeJsonMap(SETUP_KEY, map);
}

export function readMfaEnrolled(email: string): boolean {
  const map = readJsonMap(MFA_ENROLLED_KEY);
  return map[emailKey(email)] === "1";
}

export function writeMfaEnrolled(email: string, method?: PrototypeMfaChallengeMethod): void {
  const map = readJsonMap(MFA_ENROLLED_KEY);
  map[emailKey(email)] = "1";
  writeJsonMap(MFA_ENROLLED_KEY, map);
  if (method) writeStoredMfaMethod(email, method);
}

export function readMustChangeComplete(email: string): boolean {
  return readJsonMap(MUST_CHANGE_DONE_KEY)[emailKey(email)] === "1";
}

export function writeMustChangeComplete(email: string): void {
  const map = readJsonMap(MUST_CHANGE_DONE_KEY);
  map[emailKey(email)] = "1";
  writeJsonMap(MUST_CHANGE_DONE_KEY, map);
}

export function readStoredMfaMethod(email: string): PrototypeMfaChallengeMethod | null {
  const raw = readJsonMap(MFA_METHOD_KEY)[emailKey(email)];
  if (raw === "authenticator" || raw === "email-otp") return raw;
  return null;
}

export function writeStoredMfaMethod(email: string, method: PrototypeMfaChallengeMethod): void {
  const map = readJsonMap(MFA_METHOD_KEY);
  map[emailKey(email)] = method;
  writeJsonMap(MFA_METHOD_KEY, map);
}

/**
 * Whether authenticator is the enrolled/available MFA method for this account.
 * Mirrors resolvePostCredentialBranch method resolution (stored → catalog → default).
 */
export function accountHasAuthenticatorMfa(account: PrototypeAuthAccount): boolean {
  if (!(account.mfaEnabled || readMfaEnrolled(account.email))) return false;
  const method =
    readStoredMfaMethod(account.email) ?? account.mfaMethod ?? "authenticator";
  return method === "authenticator";
}

/**
 * Returns true when optional MFA nudge should show in-app.
 * Uses local snooze timestamp shaped like future mfaReminderSnoozedUntil.
 */
export function shouldShowMfaNudge(account: PrototypeAuthAccount): boolean {
  if (!account.suggestMfaNudge) return false;
  if (account.needsMfaEnrollment) return false;
  if (account.mfaEnabled || readMfaEnrolled(account.email)) return false;
  return !isMfaNudgeSnoozed(account.email);
}

export function isMfaNudgeSnoozed(email: string): boolean {
  const raw = readJsonMap(MFA_NUDGE_SNOOZE_KEY)[emailKey(email)];
  if (!raw) return false;
  const until = Date.parse(raw);
  if (Number.isNaN(until)) return false;
  return Date.now() < until;
}

/** Local prototype snooze — future API: persist mfaReminderSnoozedUntil server-side. */
export function snoozeMfaNudge(email: string, durationMs = MFA_NUDGE_SNOOZE_MS): void {
  const until = new Date(Date.now() + durationMs).toISOString();
  const map = readJsonMap(MFA_NUDGE_SNOOZE_KEY);
  map[emailKey(email)] = until;
  writeJsonMap(MFA_NUDGE_SNOOZE_KEY, map);
}

/** @deprecated Prefer snoozeMfaNudge — kept for clearPrototypeAuthFlags compatibility. */
export function writeMfaNudgeDismissed(email: string): void {
  snoozeMfaNudge(email);
}

export function readMfaNudgeDismissed(email: string): boolean {
  return isMfaNudgeSnoozed(email);
}

function clearEmailFlag(storageKey: string, email: string): void {
  if (typeof window === "undefined") return;
  const map = readJsonMap(storageKey);
  delete map[emailKey(email)];
  writeJsonMap(storageKey, map);
}

function clearAccountSetupComplete(email: string): void {
  clearEmailFlag(SETUP_KEY, email);
}

function clearMfaEnrolled(email: string): void {
  clearEmailFlag(MFA_ENROLLED_KEY, email);
  clearEmailFlag(MFA_METHOD_KEY, email);
}

function clearMfaNudgeSnooze(email: string): void {
  clearEmailFlag(MFA_NUDGE_SNOOZE_KEY, email);
}

/**
 * DEV/QA helper — clears prototype auth flow flags only.
 * Does not clear passwords, signed-in session, or unrelated app data.
 */
export function clearPrototypeAuthFlags(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SETUP_KEY);
    window.localStorage.removeItem(MFA_ENROLLED_KEY);
    window.localStorage.removeItem(MFA_METHOD_KEY);
    window.localStorage.removeItem(MUST_CHANGE_DONE_KEY);
    window.localStorage.removeItem(MFA_NUDGE_SNOOZE_KEY);
  } catch {
    /* ignore quota / private-mode failures */
  }
}

/**
 * DEV-only: reset only the flags that would skip this account's intended first screen.
 */
export function preparePrototypeDevAccountLaunch(account: PrototypeAuthAccount): void {
  if (account.suggestMfaNudge) {
    clearMfaNudgeSnooze(account.email);
    clearMfaEnrolled(account.email);
  }
  if (account.needsMfaEnrollment) {
    clearMfaEnrolled(account.email);
  }
  if (account.kind === "invited") {
    clearAccountSetupComplete(account.email);
  }
}

export function maskEmailAddress(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function formatInviteContext(account: PrototypeAuthAccount): string {
  const org = account.inviteOrganization?.trim();
  const project = account.inviteProject?.trim();
  if (org && project) return `${org} / ${project}`;
  if (org) return org;
  if (project) return project;
  return "Luxia";
}

export function resolvePostCredentialBranch(account: PrototypeAuthAccount): PostCredentialBranch {
  if (account.kind === "invited" && !readAccountSetupComplete(account.email)) {
    return "account-setup";
  }
  if (account.mustChangePassword && !readMustChangeComplete(account.email)) {
    return "must-change-password";
  }
  if (account.needsMfaEnrollment && !readMfaEnrolled(account.email)) {
    return "mfa-setup";
  }
  if (account.mfaEnabled || readMfaEnrolled(account.email)) {
    const method =
      readStoredMfaMethod(account.email) ?? account.mfaMethod ?? "authenticator";
    return method === "email-otp" ? "mfa-verify-email" : "mfa-verify";
  }
  // Optional MFA nudge is in-app after entry — not a login gate.
  return "home";
}

export function getTurnstileSiteKey(): string | null {
  const key = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

function parseInviteStatus(raw: string | null): PrototypeInviteStatus | null {
  if (
    raw === "valid" ||
    raw === "expired" ||
    raw === "invalid" ||
    raw === "used" ||
    raw === "revoked" ||
    raw === "existing"
  ) {
    return raw;
  }
  if (raw === null) return null;
  return "invalid";
}

export function readAuthLocationEntry(): AuthLocationEntry {
  if (typeof window === "undefined") return { kind: "signin" };
  const params = new URLSearchParams(window.location.search);
  const workspace = params.get("workspace");
  if (workspace === "unknown") return { kind: "workspace-unknown" };
  if (params.get("session") === "expired") return { kind: "session-expired" };
  const account = params.get("account");
  if (account === "locked") return { kind: "account-locked" };
  if (account === "disabled" || account === "deactivated") return { kind: "account-disabled" };
  const auth = params.get("auth");
  if (auth === "rate-limited") return { kind: "auth-rate-limited" };
  if (auth === "captcha-failed") return { kind: "auth-captcha-failed" };
  const invite = parseInviteStatus(params.get("invite"));
  if (invite) return { kind: "invite", status: invite };
  const reset = params.get("reset");
  if (reset !== null) {
    return { kind: "reset", token: reset, valid: reset === "valid" };
  }
  return { kind: "signin" };
}

export function authEntryClearsSession(entry: AuthLocationEntry): boolean {
  return (
    entry.kind === "reset" ||
    entry.kind === "session-expired" ||
    entry.kind === "workspace-unknown" ||
    entry.kind === "invite" ||
    entry.kind === "account-locked" ||
    entry.kind === "account-disabled" ||
    entry.kind === "auth-rate-limited" ||
    entry.kind === "auth-captcha-failed"
  );
}

export function bootstrapPrototypeSignedIn(): boolean {
  const entry = readAuthLocationEntry();
  if (authEntryClearsSession(entry)) {
    clearPrototypeSignedIn();
    return false;
  }
  return readPrototypeSignedIn();
}

export function clearAuthSearchParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("reset");
  url.searchParams.delete("session");
  url.searchParams.delete("workspace");
  url.searchParams.delete("invite");
  url.searchParams.delete("account");
  url.searchParams.delete("auth");
  const search = url.searchParams.toString();
  window.history.replaceState({}, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}

/** SessionStorage key for optional in-app MFA nudge after sign-in. */
export const MFA_NUDGE_PENDING_KEY = "luxia.prototype-mfa-nudge-pending.v1";

export function writePendingMfaNudge(email: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(MFA_NUDGE_PENDING_KEY, emailKey(email));
  } catch {
    /* ignore */
  }
}

export function consumePendingMfaNudge(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const email = window.sessionStorage.getItem(MFA_NUDGE_PENDING_KEY);
    window.sessionStorage.removeItem(MFA_NUDGE_PENDING_KEY);
    return email;
  } catch {
    return null;
  }
}

export function clearPendingMfaNudge(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(MFA_NUDGE_PENDING_KEY);
  } catch {
    /* ignore */
  }
}
