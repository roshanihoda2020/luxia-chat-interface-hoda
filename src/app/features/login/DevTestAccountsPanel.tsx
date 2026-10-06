import { useId, useState, type ChangeEvent } from "react";
import {
  clearPrototypeAuthFlags,
  findPrototypeAccount,
  preparePrototypeDevAccountLaunch,
  PROTOTYPE_AUTH_ACCOUNTS,
  PROTOTYPE_PASSWORD,
  type PrototypeAuthAccount,
} from "@/app/features/login/prototypeAuth";

type TestAccountRow = {
  label: string;
  email: string;
  passwordHint: string;
};

function labelForAccount(account: PrototypeAuthAccount): string {
  if (account.kind === "invited") return "First-time setup";
  if (account.mustChangePassword) return "Forced password";
  if (account.needsMfaEnrollment) return "MFA setup (required)";
  if (account.mfaEnabled && account.mfaMethod === "email-otp") return "Email OTP";
  if (account.mfaEnabled) return "MFA verification";
  if (account.suggestMfaNudge) return "MFA nudge (in-app)";
  return "Normal";
}

const TEST_ACCOUNT_ROWS: TestAccountRow[] = PROTOTYPE_AUTH_ACCOUNTS.map((account) => ({
  label: labelForAccount(account),
  email: account.email,
  passwordHint: PROTOTYPE_PASSWORD,
}));

const INVITE_OPTIONS = [
  { label: "Valid", href: "?invite=valid" },
  { label: "Existing user", href: "?invite=existing" },
  { label: "Expired", href: "?invite=expired" },
  { label: "Invalid", href: "?invite=invalid" },
  { label: "Used", href: "?invite=used" },
  { label: "Revoked", href: "?invite=revoked" },
] as const;

const ACCOUNT_STATUS_OPTIONS = [
  { label: "Locked (form)", href: "?account=locked" },
  { label: "Deactivated", href: "?account=disabled" },
  { label: "Rate limited", href: "?auth=rate-limited" },
  { label: "CAPTCHA failed", href: "?auth=captcha-failed" },
] as const;

function navigateScenario(href: string) {
  window.location.assign(href);
}

/**
 * Vite replaces `import.meta.env.DEV` with `false` in production builds.
 */
export function DevTestAccountsPanel({
  onLaunchAccount,
}: {
  onLaunchAccount: (account: PrototypeAuthAccount) => void;
}) {
  const panelId = useId();
  const inviteSelectId = useId();
  const accountSelectId = useId();
  const resetStatusId = useId();
  const [open, setOpen] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  if (!import.meta.env.DEV) return null;

  function handleScenarioSelect(event: ChangeEvent<HTMLSelectElement>) {
    const href = event.target.value;
    event.target.value = "";
    if (href) navigateScenario(href);
  }

  function handleResetFlags() {
    clearPrototypeAuthFlags();
    setResetNotice("Prototype states reset.");
  }

  function handleLaunchAccount(email: string) {
    const account = findPrototypeAccount(email);
    if (!account) return;
    preparePrototypeDevAccountLaunch(account);
    onLaunchAccount(account);
  }

  return (
    <div className="luxia-login-dev-accounts">
      <button
        type="button"
        className="luxia-login-dev-accounts-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>Test accounts (dev only)</span>
        <span className="luxia-login-dev-accounts-chevron" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div id={panelId} className="luxia-login-dev-accounts-panel">
          <p className="luxia-login-dev-accounts-group-label">Test accounts</p>
          <ul className="luxia-login-dev-accounts-list">
            {TEST_ACCOUNT_ROWS.map((row) => (
              <li key={row.email}>
                <button
                  type="button"
                  className="luxia-login-dev-accounts-row"
                  onClick={() => handleLaunchAccount(row.email)}
                >
                  <span className="luxia-login-dev-accounts-label">{row.label}</span>
                  <span className="luxia-login-dev-accounts-cred">
                    {row.email}
                    <span className="luxia-login-dev-accounts-sep" aria-hidden="true">
                      {" "}
                      ·{" "}
                    </span>
                    {row.passwordHint}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="luxia-login-dev-accounts-group-label">Auth scenarios</p>
          <div className="luxia-login-dev-accounts-scenarios">
            <div className="luxia-login-dev-accounts-scenario">
              <label className="luxia-login-dev-accounts-label" htmlFor={inviteSelectId}>
                Invitation
              </label>
              <select
                id={inviteSelectId}
                className="luxia-login-dev-accounts-select"
                defaultValue=""
                onChange={handleScenarioSelect}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {INVITE_OPTIONS.map((option) => (
                  <option key={option.href} value={option.href}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="luxia-login-dev-accounts-scenario">
              <label className="luxia-login-dev-accounts-label" htmlFor={accountSelectId}>
                Account / auth state
              </label>
              <select
                id={accountSelectId}
                className="luxia-login-dev-accounts-select"
                defaultValue=""
                onChange={handleScenarioSelect}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {ACCOUNT_STATUS_OPTIONS.map((option) => (
                  <option key={option.href} value={option.href}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="luxia-login-dev-accounts-scenario-action"
              onClick={() => navigateScenario("?session=expired")}
            >
              Session expired
            </button>
          </div>

          <div className="luxia-login-dev-accounts-reset">
            <button
              type="button"
              className="luxia-login-dev-accounts-scenario-action"
              onClick={handleResetFlags}
            >
              Reset prototype states
            </button>
            {resetNotice ? (
              <p id={resetStatusId} className="luxia-login-dev-accounts-label" role="status">
                {resetNotice}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
