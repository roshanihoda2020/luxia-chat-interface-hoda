import { useId, useState } from "react";
import {
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
  if (account.needsMfaEnrollment) return "MFA setup";
  if (account.mfaEnabled) return "MFA verification";
  return "Normal";
}

const TEST_ACCOUNT_ROWS: TestAccountRow[] = PROTOTYPE_AUTH_ACCOUNTS.map((account) => ({
  label: labelForAccount(account),
  email: account.email,
  passwordHint: PROTOTYPE_PASSWORD,
}));

/**
 * Development-only helper nested in Sign-in.
 * Vite replaces `import.meta.env.DEV` with `false` in production builds.
 */
export function DevTestAccountsPanel({
  onSelectEmail,
}: {
  onSelectEmail: (email: string) => void;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  if (!import.meta.env.DEV) return null;

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
          <ul className="luxia-login-dev-accounts-list">
            {TEST_ACCOUNT_ROWS.map((row) => (
              <li key={row.email}>
                <button
                  type="button"
                  className="luxia-login-dev-accounts-row"
                  onClick={() => onSelectEmail(row.email)}
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
        </div>
      ) : null}
    </div>
  );
}
