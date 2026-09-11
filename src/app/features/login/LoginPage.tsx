import { useState, type ReactNode } from "react";
import { AuthShell } from "@/app/features/login/AuthShell";
import {
  AccountSetupPanel,
  AuthStatusPanel,
  ForgotPasswordPanel,
  MfaRecoveryPanel,
  MfaSetupPanel,
  MfaVerifyPanel,
  RecoveryKeyRevealPanel,
  ResetPasswordPanel,
  SignInPanel,
  type SignInNotice,
} from "@/app/features/login/authScreens";
import {
  clearAuthSearchParams,
  readAuthLocationEntry,
  resolvePostCredentialBranch,
  writeSharedPassword,
  type PrototypeAuthAccount,
} from "@/app/features/login/prototypeAuth";

type AuthScreen =
  | "signin"
  | "forgot"
  | "account-setup"
  | "mfa-verify"
  | "mfa-recovery"
  | "mfa-setup"
  | "recovery-reveal"
  | "reset"
  | "reset-invalid"
  | "workspace";

function initialScreen(): AuthScreen {
  const entry = readAuthLocationEntry();
  if (entry.kind === "workspace-unknown") return "workspace";
  if (entry.kind === "reset") return entry.valid ? "reset" : "reset-invalid";
  return "signin";
}

function initialNotice(): SignInNotice {
  const entry = readAuthLocationEntry();
  if (entry.kind === "session-expired") return "session-expired";
  return null;
}

export function LoginPage({
  onSignedIn,
}: {
  onSignedIn: (rememberMe: boolean, userId: string) => void;
}) {
  const [authScreen, setAuthScreen] = useState<AuthScreen>(initialScreen);
  const [notice, setNotice] = useState<SignInNotice>(initialNotice);
  const [pendingRememberMe, setPendingRememberMe] = useState(false);
  const [pendingAccount, setPendingAccount] = useState<PrototypeAuthAccount | null>(null);

  const rememberMeRef = pendingRememberMe;
  const accountRef = pendingAccount;

  function enterApp(rememberMe = rememberMeRef, account = accountRef) {
    if (!account) return;
    clearAuthSearchParams();
    onSignedIn(rememberMe, account.userId);
  }

  function continueAfterCredentials(account: PrototypeAuthAccount, rememberMe = pendingRememberMe) {
    const branch = resolvePostCredentialBranch(account);
    if (branch === "account-setup") {
      setAuthScreen("account-setup");
      return;
    }
    if (branch === "mfa-setup") {
      setAuthScreen("mfa-setup");
      return;
    }
    if (branch === "mfa-verify") {
      setAuthScreen("mfa-verify");
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
    setPendingAccount(null);
    setAuthScreen("signin");
    clearAuthSearchParams();
  }

  const expanded =
    authScreen === "account-setup" ||
    authScreen === "mfa-setup" ||
    authScreen === "recovery-reveal" ||
    authScreen === "mfa-recovery";

  let screen: ReactNode = null;
  if (authScreen === "signin") {
    screen = (
      <SignInPanel
        notice={notice}
        onAuthenticated={handleAuthenticated}
        onForgotPassword={() => setAuthScreen("forgot")}
      />
    );
  } else if (authScreen === "forgot") {
    screen = <ForgotPasswordPanel onBack={() => goSignIn()} />;
  } else if (authScreen === "account-setup" && pendingAccount) {
    screen = (
      <AccountSetupPanel
        account={pendingAccount}
        onComplete={() => continueAfterCredentials(pendingAccount)}
      />
    );
  } else if (authScreen === "mfa-verify") {
    screen = (
      <MfaVerifyPanel
        onVerified={enterApp}
        onUseRecoveryKey={() => setAuthScreen("mfa-recovery")}
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
  } else if (authScreen === "mfa-setup") {
    screen = <MfaSetupPanel onContinue={() => setAuthScreen("recovery-reveal")} />;
  } else if (authScreen === "recovery-reveal" && pendingAccount) {
    screen = (
      <RecoveryKeyRevealPanel
        email={pendingAccount.email}
        onContinue={enterApp}
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
      />
    );
  } else if (authScreen === "reset-invalid") {
    screen = (
      <AuthStatusPanel
        title="This reset link is no longer valid."
        body="Request a new link or return to sign in."
        primaryLabel="Request a new reset link"
        onPrimary={() => setAuthScreen("forgot")}
        secondaryLabel="Back to sign in"
        onSecondary={() => goSignIn()}
      />
    );
  } else if (authScreen === "workspace") {
    screen = (
      <AuthStatusPanel
        title="Workspace not found"
        body="Check the address or contact support."
        primaryLabel="Go to sign in"
        onPrimary={() => goSignIn()}
      />
    );
  } else {
    screen = (
      <SignInPanel
        notice={notice}
        onAuthenticated={handleAuthenticated}
        onForgotPassword={() => setAuthScreen("forgot")}
      />
    );
  }

  return <AuthShell expanded={expanded}>{screen}</AuthShell>;
}
