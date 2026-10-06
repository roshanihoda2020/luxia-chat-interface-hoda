import { useState, type ReactNode } from "react";
import { AuthShell } from "@/app/features/login/AuthShell";
import {
  AccountSetupPanel,
  AuthStatusPanel,
  EmailOtpVerifyPanel,
  ForcedPasswordChangePanel,
  ForgotPasswordPanel,
  InvitationAcceptPanel,
  InviteExpiredPanel,
  MfaAuthenticatorSetupPanel,
  MfaMethodSelectPanel,
  MfaRecoveryPanel,
  MfaVerifyPanel,
  RecoveryKeyRevealPanel,
  ResetPasswordPanel,
  SignInPanel,
  type SignInFormMode,
  type SignInNotice,
} from "@/app/features/login/authScreens";
import { resolveAuthError } from "@/app/features/login/authErrors";
import {
  accountHasAuthenticatorMfa,
  clearAuthSearchParams,
  getPrototypeExistingInviteAccount,
  getPrototypeInviteAccount,
  readAccountSetupComplete,
  readAuthLocationEntry,
  resolvePostCredentialBranch,
  shouldShowMfaNudge,
  writePendingMfaNudge,
  writeSharedPassword,
  type PrototypeAuthAccount,
  type PrototypeInviteStatus,
  type PrototypeMfaChallengeMethod,
} from "@/app/features/login/prototypeAuth";

type AuthScreen =
  | "signin"
  | "forgot"
  | "account-setup"
  | "must-change-password"
  | "mfa-verify"
  | "mfa-verify-email"
  | "mfa-recovery"
  | "mfa-method"
  | "mfa-setup-authenticator"
  | "mfa-setup-email"
  | "recovery-reveal"
  | "reset"
  | "reset-invalid"
  | "workspace"
  | "invite-accept"
  | "invite-existing"
  | "invite-expired"
  | "invite-invalid"
  | "invite-used"
  | "invite-revoked";

function inviteScreenForStatus(status: PrototypeInviteStatus): AuthScreen {
  if (status === "valid") return "invite-accept";
  if (status === "existing") return "invite-existing";
  if (status === "expired") return "invite-expired";
  if (status === "used") return "invite-used";
  if (status === "revoked") return "invite-revoked";
  return "invite-invalid";
}

function initialScreen(): AuthScreen {
  const entry = readAuthLocationEntry();
  if (entry.kind === "workspace-unknown") return "workspace";
  if (entry.kind === "invite") return inviteScreenForStatus(entry.status);
  if (entry.kind === "reset") return entry.valid ? "reset" : "reset-invalid";
  return "signin";
}

function initialNotice(): SignInNotice {
  const entry = readAuthLocationEntry();
  if (entry.kind === "session-expired") return "session-expired";
  return null;
}

function initialFormMode(): SignInFormMode {
  const entry = readAuthLocationEntry();
  if (entry.kind === "account-locked") return "locked";
  if (entry.kind === "account-disabled") return "deactivated";
  if (entry.kind === "auth-rate-limited") return "rate-limited";
  if (entry.kind === "auth-captcha-failed") return "captcha-failed";
  return "normal";
}

export function LoginPage({
  onSignedIn,
}: {
  onSignedIn: (rememberMe: boolean, userId: string) => void;
}) {
  const [authScreen, setAuthScreen] = useState<AuthScreen>(initialScreen);
  const [notice, setNotice] = useState<SignInNotice>(initialNotice);
  const [formMode, setFormMode] = useState<SignInFormMode>(initialFormMode);
  const [pendingRememberMe, setPendingRememberMe] = useState(false);
  const [pendingAccount, setPendingAccount] = useState<PrototypeAuthAccount | null>(null);
  const [setupMethod, setSetupMethod] = useState<PrototypeMfaChallengeMethod>("authenticator");
  const [mfaFromApp, setMfaFromApp] = useState(false);

  function enterApp(rememberMe = pendingRememberMe, account = pendingAccount) {
    if (!account) return;
    if (shouldShowMfaNudge(account)) {
      writePendingMfaNudge(account.email);
    }
    clearAuthSearchParams();
    onSignedIn(rememberMe, account.userId);
  }

  function continueAfterCredentials(
    account: PrototypeAuthAccount,
    rememberMe = pendingRememberMe,
  ) {
    const branch = resolvePostCredentialBranch(account);
    if (branch === "account-setup") {
      setAuthScreen("account-setup");
      return;
    }
    if (branch === "must-change-password") {
      setAuthScreen("must-change-password");
      return;
    }
    if (branch === "mfa-setup") {
      setMfaFromApp(false);
      setAuthScreen("mfa-method");
      return;
    }
    if (branch === "mfa-verify") {
      setAuthScreen("mfa-verify");
      return;
    }
    if (branch === "mfa-verify-email") {
      setAuthScreen("mfa-verify-email");
      return;
    }
    enterApp(rememberMe, account);
  }

  function handleAuthenticated(account: PrototypeAuthAccount, rememberMe: boolean) {
    setPendingAccount(account);
    setPendingRememberMe(rememberMe);
    continueAfterCredentials(account, rememberMe);
  }

  function goSignIn(nextNotice: SignInNotice = null) {
    setNotice(nextNotice);
    setFormMode("normal");
    setPendingAccount(null);
    setMfaFromApp(false);
    setAuthScreen("signin");
    clearAuthSearchParams();
  }

  function acceptInvitation() {
    const invited = getPrototypeInviteAccount();
    setPendingAccount(invited);
    setPendingRememberMe(false);
    clearAuthSearchParams();
    if (!readAccountSetupComplete(invited.email)) {
      setAuthScreen("account-setup");
      return;
    }
    continueAfterCredentials(invited, false);
  }

  const cancelMfa = () => {
    if (mfaFromApp) {
      enterApp();
      return;
    }
    goSignIn();
  };

  const expanded =
    authScreen === "account-setup" ||
    authScreen === "must-change-password" ||
    authScreen === "mfa-setup-authenticator" ||
    authScreen === "recovery-reveal" ||
    authScreen === "mfa-recovery";

  let screen: ReactNode = null;
  if (authScreen === "signin") {
    screen = (
      <SignInPanel
        notice={notice}
        formMode={formMode}
        onAuthenticated={handleAuthenticated}
        onForgotPassword={() => setAuthScreen("forgot")}
        onMustChangePassword={(account, rememberMe) => {
          setPendingAccount(account);
          setPendingRememberMe(rememberMe);
          setAuthScreen("must-change-password");
        }}
      />
    );
  } else if (authScreen === "forgot") {
    screen = <ForgotPasswordPanel onBack={() => goSignIn()} />;
  } else if (authScreen === "account-setup" && pendingAccount) {
    screen = (
      <AccountSetupPanel
        account={pendingAccount}
        onComplete={() => continueAfterCredentials(pendingAccount)}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "must-change-password" && pendingAccount) {
    screen = (
      <ForcedPasswordChangePanel
        account={pendingAccount}
        onComplete={() => {
          const next = { ...pendingAccount, mustChangePassword: false };
          setPendingAccount(next);
          continueAfterCredentials(next);
        }}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "mfa-verify") {
    screen = (
      <MfaVerifyPanel
        onVerified={enterApp}
        onUseRecoveryKey={() => setAuthScreen("mfa-recovery")}
        onUseEmailInstead={() => setAuthScreen("mfa-verify-email")}
        onSessionExpired={() => goSignIn("mfa-session-expired")}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "mfa-verify-email" && pendingAccount) {
    screen = (
      <EmailOtpVerifyPanel
        email={pendingAccount.email}
        onVerified={enterApp}
        onUseAuthenticatorInstead={
          accountHasAuthenticatorMfa(pendingAccount)
            ? () => setAuthScreen("mfa-verify")
            : undefined
        }
        onSessionExpired={() => goSignIn("mfa-session-expired")}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "mfa-recovery") {
    screen = (
      <MfaRecoveryPanel
        onVerified={enterApp}
        onBack={() => setAuthScreen("mfa-verify")}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "mfa-method") {
    screen = (
      <MfaMethodSelectPanel
        cancelToApp={mfaFromApp}
        onCancel={cancelMfa}
        onSelect={(method) => {
          setSetupMethod(method);
          setAuthScreen(method === "email-otp" ? "mfa-setup-email" : "mfa-setup-authenticator");
        }}
      />
    );
  } else if (authScreen === "mfa-setup-authenticator") {
    screen = (
      <MfaAuthenticatorSetupPanel
        cancelToApp={mfaFromApp}
        onCancel={cancelMfa}
        onVerified={() => {
          setSetupMethod("authenticator");
          setAuthScreen("recovery-reveal");
        }}
      />
    );
  } else if (authScreen === "mfa-setup-email" && pendingAccount) {
    screen = (
      <EmailOtpVerifyPanel
        email={pendingAccount.email}
        enrollOnSuccess
        cancelToApp={mfaFromApp}
        onCancel={cancelMfa}
        onVerified={enterApp}
        onSessionExpired={() => goSignIn("mfa-session-expired")}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "recovery-reveal" && pendingAccount) {
    screen = (
      <RecoveryKeyRevealPanel
        email={pendingAccount.email}
        method={setupMethod}
        cancelToApp={mfaFromApp}
        onCancel={cancelMfa}
        onContinue={enterApp}
      />
    );
  } else if (authScreen === "invite-accept") {
    screen = (
      <InvitationAcceptPanel
        account={getPrototypeInviteAccount()}
        onAccept={acceptInvitation}
        onSignInToJoin={() => goSignIn()}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "invite-existing") {
    screen = (
      <InvitationAcceptPanel
        account={getPrototypeExistingInviteAccount()}
        existingAccount
        onAccept={() => goSignIn()}
        onSignInToJoin={() => goSignIn()}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "invite-expired") {
    screen = <InviteExpiredPanel onBackToSignIn={() => goSignIn()} />;
  } else if (authScreen === "invite-invalid") {
    screen = (
      <AuthStatusPanel
        title={resolveAuthError({ errorCode: "INVITE_INVALID" }).message}
        body="Check the link from your invitation email, or return to sign in."
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "invite-used") {
    screen = (
      <AuthStatusPanel
        title={resolveAuthError({ errorCode: "INVITE_USED" }).message}
        body="Sign in with your account to continue."
        primaryLabel="Sign in to join"
        onPrimary={() => goSignIn()}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "invite-revoked") {
    screen = (
      <AuthStatusPanel
        title={resolveAuthError({ errorCode: "INVITE_REVOKED" }).message}
        body="Contact your administrator if you believe this is a mistake."
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "reset") {
    screen = (
      <ResetPasswordPanel
        emailHint={null}
        onReset={(password) => {
          writeSharedPassword(password);
          goSignIn("password-updated");
        }}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "reset-invalid") {
    screen = (
      <AuthStatusPanel
        title="This reset link is no longer valid."
        body="Request a new link or return to sign in."
        primaryLabel="Request a new reset link"
        onPrimary={() => setAuthScreen("forgot")}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "workspace") {
    screen = (
      <AuthStatusPanel
        title="Workspace not found"
        body="Check the address or contact support."
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else {
    screen = (
      <SignInPanel
        notice={notice}
        formMode={formMode}
        onAuthenticated={handleAuthenticated}
        onForgotPassword={() => setAuthScreen("forgot")}
      />
    );
  }

  return <AuthShell expanded={expanded}>{screen}</AuthShell>;
}

/** Exposed for in-app MFA setup launched from nudge (reuses login MFA screens). */

