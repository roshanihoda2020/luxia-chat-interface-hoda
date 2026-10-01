import { useState, type ReactNode } from "react";
import { AuthShell } from "@/app/features/login/AuthShell";
import {
  AccountSetupPanel,
  AuthStatusPanel,
  EmailOtpVerifyPanel,
  ForgotPasswordPanel,
  InvitationAcceptPanel,
  MfaNudgePanel,
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
  getPrototypeInviteAccount,
  readAccountSetupComplete,
  readAuthLocationEntry,
  resolvePostCredentialBranch,
  writeSharedPassword,
  type PrototypeAuthAccount,
  type PrototypeInviteStatus,
} from "@/app/features/login/prototypeAuth";

type AuthScreen =
  | "signin"
  | "forgot"
  | "account-setup"
  | "mfa-verify"
  | "mfa-verify-email"
  | "mfa-recovery"
  | "mfa-setup"
  | "mfa-nudge"
  | "recovery-reveal"
  | "reset"
  | "reset-invalid"
  | "workspace"
  | "invite-accept"
  | "invite-expired"
  | "invite-invalid"
  | "invite-used"
  | "account-locked"
  | "account-disabled";

function inviteScreenForStatus(status: PrototypeInviteStatus): AuthScreen {
  if (status === "valid") return "invite-accept";
  if (status === "expired") return "invite-expired";
  if (status === "used") return "invite-used";
  return "invite-invalid";
}

function initialScreen(): AuthScreen {
  const entry = readAuthLocationEntry();
  if (entry.kind === "workspace-unknown") return "workspace";
  if (entry.kind === "account-locked") return "account-locked";
  if (entry.kind === "account-disabled") return "account-disabled";
  if (entry.kind === "invite") return inviteScreenForStatus(entry.status);
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
    if (branch === "mfa-verify-email") {
      setAuthScreen("mfa-verify-email");
      return;
    }
    if (branch === "mfa-nudge") {
      setAuthScreen("mfa-nudge");
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
        onBackToSignIn={() => goSignIn()}
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
  } else if (authScreen === "mfa-verify-email" && pendingAccount) {
    screen = (
      <EmailOtpVerifyPanel
        email={pendingAccount.email}
        onVerified={enterApp}
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
    screen = (
      <MfaSetupPanel
        onContinue={() => setAuthScreen("recovery-reveal")}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "mfa-nudge" && pendingAccount) {
    screen = (
      <MfaNudgePanel
        email={pendingAccount.email}
        onSetupMfa={() => setAuthScreen("mfa-setup")}
        onSkip={() => enterApp()}
      />
    );
  } else if (authScreen === "recovery-reveal" && pendingAccount) {
    screen = (
      <RecoveryKeyRevealPanel
        email={pendingAccount.email}
        onContinue={enterApp}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "invite-accept") {
    screen = (
      <InvitationAcceptPanel
        account={getPrototypeInviteAccount()}
        onAccept={acceptInvitation}
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "invite-expired") {
    screen = (
      <AuthStatusPanel
        title="This invitation has expired."
        body="Ask your administrator for a new invitation, or sign in if you already have an account."
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "invite-invalid") {
    screen = (
      <AuthStatusPanel
        title="This invitation link isn't valid."
        body="Check the link from your invitation email, or return to sign in."
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "invite-used") {
    screen = (
      <AuthStatusPanel
        title="This invitation has already been used."
        body="Sign in with your account to continue."
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "account-locked") {
    screen = (
      <AuthStatusPanel
        title="Account locked"
        body="Your account is currently locked. Please contact your administrator or support for assistance."
        onBackToSignIn={() => goSignIn()}
      />
    );
  } else if (authScreen === "account-disabled") {
    screen = (
      <AuthStatusPanel
        title="Account unavailable"
        body="This account is currently disabled. Please contact your administrator or support for assistance."
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
        onAuthenticated={handleAuthenticated}
        onForgotPassword={() => setAuthScreen("forgot")}
      />
    );
  }

  return <AuthShell expanded={expanded}>{screen}</AuthShell>;
}
