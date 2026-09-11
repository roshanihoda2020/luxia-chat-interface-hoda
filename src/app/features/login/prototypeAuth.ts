/**
 * Prototype authentication catalog and persistence.
 * Extends the existing UI session gate — it does not call APIs,
 * enroll real MFA, send email, or replace production auth.
 */
import { clearPrototypeSignedIn, readPrototypeSignedIn } from "./prototypeSignedIn";

export const PASSWORD_MIN_LENGTH = 4;
export const PROTOTYPE_PASSWORD = "demo";
export const PROTOTYPE_OTP = "123456";
export const PROTOTYPE_RECOVERY_KEY = "LUXIA-DEMO-RECOVERY-KEY";
export const PROTOTYPE_MFA_SETUP_KEY = "LUXIADEMO2FASECRET";

const PASSWORDS_KEY = "luxia.prototype-auth-passwords.v1";
const SETUP_KEY = "luxia.prototype-account-setup.v1";
const MFA_ENROLLED_KEY = "luxia.prototype-mfa-enrolled.v1";

export type PrototypeAuthKind = "returning" | "invited";

export type PrototypeAuthAccount = {
  email: string;
  userId: string;
  kind: PrototypeAuthKind;
  /** Returning-user MFA challenge at sign-in (prototype catalog, not Settings MFA APIs). */
  mfaEnabled: boolean;
  /** First-time authenticator enrollment after credentials. */
  needsMfaEnrollment: boolean;
};

export type PostCredentialBranch = "home" | "account-setup" | "mfa-verify" | "mfa-setup";

export type AuthLocationEntry =
  | { kind: "signin" }
  | { kind: "reset"; token: string; valid: boolean }
  | { kind: "session-expired" }
  | { kind: "workspace-unknown" };

/** Generic demo identities — same emails as ORGANIZATION_USERS, no personal names. */
export const PROTOTYPE_AUTH_ACCOUNTS: PrototypeAuthAccount[] = [
  {
    email: "user05@luxia.example",
    userId: "user-05",
    kind: "returning",
    mfaEnabled: false,
    needsMfaEnrollment: false,
  },
  {
    email: "user01@luxia.example",
    userId: "user-01",
    kind: "returning",
    mfaEnabled: true,
    needsMfaEnrollment: false,
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
  },
];

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

export function resolvePostCredentialBranch(account: PrototypeAuthAccount): PostCredentialBranch {
  if (account.kind === "invited" && !readAccountSetupComplete(account.email)) {
    return "account-setup";
  }
  if (account.needsMfaEnrollment && !readMfaEnrolled(account.email)) {
    return "mfa-setup";
  }
  if (account.mfaEnabled || readMfaEnrolled(account.email)) {
    return "mfa-verify";
  }
  return "home";
}

export function getTurnstileSiteKey(): string | null {
  const key = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

export function readAuthLocationEntry(): AuthLocationEntry {
  if (typeof window === "undefined") return { kind: "signin" };
  const params = new URLSearchParams(window.location.search);
  const workspace = params.get("workspace");
  if (workspace === "unknown") return { kind: "workspace-unknown" };
  if (params.get("session") === "expired") return { kind: "session-expired" };
  const reset = params.get("reset");
  if (reset !== null) {
    return { kind: "reset", token: reset, valid: reset === "valid" };
  }
  return { kind: "signin" };
}

export function authEntryClearsSession(entry: AuthLocationEntry): boolean {
  return entry.kind === "reset" || entry.kind === "session-expired" || entry.kind === "workspace-unknown";
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
  const search = url.searchParams.toString();
  window.history.replaceState({}, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}
