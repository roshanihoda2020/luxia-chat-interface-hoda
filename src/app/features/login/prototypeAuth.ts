/**
 * Prototype authentication catalog and persistence.
 * Extends the existing UI session gate — it does not call APIs,
 * enroll real MFA, send email, or replace production auth.
 */
import { clearPrototypeSignedIn, readPrototypeSignedIn } from "./prototypeSignedIn";

export const PASSWORD_MIN_LENGTH = 4;
export const PROTOTYPE_PASSWORD = "demo";
export const PROTOTYPE_OTP = "123456";
/** Prototype Email OTP — same digits as authenticator for easy manual testing. */
export const PROTOTYPE_EMAIL_OTP = "123456";
/**
 * Prototype Email OTP cooldown / TTL — isolated demo values, not production policy.
 */
export const EMAIL_OTP_COOLDOWN_SECONDS = 30;
export const EMAIL_OTP_TTL_SECONDS = 90;
export const PROTOTYPE_RECOVERY_KEY = "LUXIA-DEMO-RECOVERY-KEY";
export const PROTOTYPE_MFA_SETUP_KEY = "LUXIADEMO2FASECRET";

const PASSWORDS_KEY = "luxia.prototype-auth-passwords.v1";
const SETUP_KEY = "luxia.prototype-account-setup.v1";
const MFA_ENROLLED_KEY = "luxia.prototype-mfa-enrolled.v1";
const MFA_NUDGE_DISMISSED_KEY = "luxia.prototype-mfa-nudge-dismissed.v1";

export type PrototypeAuthKind = "returning" | "invited";

export type PrototypeMfaChallengeMethod = "authenticator" | "email-otp";

export type PrototypeAuthAccount = {
  email: string;
  userId: string;
  kind: PrototypeAuthKind;
  /** Returning-user MFA challenge at sign-in (prototype catalog, not Settings MFA APIs). */
  mfaEnabled: boolean;
  /** First-time authenticator enrollment after credentials (blocking). */
  needsMfaEnrollment: boolean;
  mfaMethod?: PrototypeMfaChallengeMethod;
  /**
   * Optional non-blocking “Secure your account” nudge after credentials
   * when MFA is not required/enrolled. Isolated from needsMfaEnrollment.
   */
  suggestMfaNudge?: boolean;
  inviteOrganization?: string;
  inviteProject?: string;
};

export type PostCredentialBranch =
  | "home"
  | "account-setup"
  | "mfa-verify"
  | "mfa-verify-email"
  | "mfa-setup"
  | "mfa-nudge";

export type PrototypeInviteStatus = "valid" | "expired" | "invalid" | "used";

export type AuthLocationEntry =
  | { kind: "signin" }
  | { kind: "reset"; token: string; valid: boolean }
  | { kind: "session-expired" }
  | { kind: "workspace-unknown" }
  | { kind: "invite"; status: PrototypeInviteStatus }
  | { kind: "account-locked" }
  | { kind: "account-disabled" };

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
  },
  {
    email: "user03@luxia.example",
    userId: "user-03",
    kind: "returning",
    mfaEnabled: true,
    needsMfaEnrollment: false,
    mfaMethod: "email-otp",
  },
];

export function getPrototypeInviteAccount(): PrototypeAuthAccount {
  const invited = PROTOTYPE_AUTH_ACCOUNTS.find((account) => account.kind === "invited");
  if (!invited) {
    throw new Error("Prototype invite account missing from catalog.");
  }
  return invited;
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

export function validatePasswordPolicy(password: string): string | null {
  if (!password) return "Enter your password.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Enter at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
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

export function writeMfaEnrolled(email: string): void {
  const map = readJsonMap(MFA_ENROLLED_KEY);
  map[emailKey(email)] = "1";
  writeJsonMap(MFA_ENROLLED_KEY, map);
}

export function readMfaNudgeDismissed(email: string): boolean {
  const map = readJsonMap(MFA_NUDGE_DISMISSED_KEY);
  return map[emailKey(email)] === "1";
}

export function writeMfaNudgeDismissed(email: string): void {
  const map = readJsonMap(MFA_NUDGE_DISMISSED_KEY);
  map[emailKey(email)] = "1";
  writeJsonMap(MFA_NUDGE_DISMISSED_KEY, map);
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
}

function clearMfaNudgeDismissed(email: string): void {
  clearEmailFlag(MFA_NUDGE_DISMISSED_KEY, email);
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
    window.localStorage.removeItem(MFA_NUDGE_DISMISSED_KEY);
  } catch {
    /* ignore quota / private-mode failures */
  }
}

/**
 * DEV-only: reset only the flags that would skip this account's intended first screen.
 * Does not wipe unrelated accounts or passwords.
 */
export function preparePrototypeDevAccountLaunch(account: PrototypeAuthAccount): void {
  if (account.suggestMfaNudge) {
    clearMfaNudgeDismissed(account.email);
    // Enrolled MFA would route to verify before nudge.
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
  if (account.needsMfaEnrollment && !readMfaEnrolled(account.email)) {
    return "mfa-setup";
  }
  if (account.mfaEnabled || readMfaEnrolled(account.email)) {
    const method = account.mfaMethod ?? "authenticator";
    return method === "email-otp" ? "mfa-verify-email" : "mfa-verify";
  }
  if (account.suggestMfaNudge && !readMfaNudgeDismissed(account.email) && !readMfaEnrolled(account.email)) {
    return "mfa-nudge";
  }
  return "home";
}

export function getTurnstileSiteKey(): string | null {
  const key = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

function parseInviteStatus(raw: string | null): PrototypeInviteStatus | null {
  if (raw === "valid" || raw === "expired" || raw === "invalid" || raw === "used") return raw;
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
  if (account === "disabled") return { kind: "account-disabled" };
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
    entry.kind === "account-disabled"
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
  const search = url.searchParams.toString();
  window.history.replaceState({}, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}
