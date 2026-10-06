import { useState } from "react";
import { AuthShell } from "@/app/features/login/AuthShell";
import {
  EmailOtpVerifyPanel,
  MfaAuthenticatorSetupPanel,
  MfaMethodSelectPanel,
  RecoveryKeyRevealPanel,
} from "@/app/features/login/authScreens";
import type { PrototypeMfaChallengeMethod } from "@/app/features/login/prototypeAuth";

type Step = "method" | "authenticator" | "email" | "recovery";

/**
 * In-app MFA enrollment launched from the optional nudge.
 * Cancel returns to the app (caller closes host) — not sign-in.
 */
export function InAppMfaSetupHost({
  email,
  onComplete,
  onCancel,
}: {
  email: string;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<PrototypeMfaChallengeMethod>("authenticator");

  let screen = null;
  if (step === "method") {
    screen = (
      <MfaMethodSelectPanel
        cancelToApp
        onCancel={onCancel}
        onSelect={(next) => {
          setMethod(next);
          setStep(next === "email-otp" ? "email" : "authenticator");
        }}
      />
    );
  } else if (step === "authenticator") {
    screen = (
      <MfaAuthenticatorSetupPanel
        cancelToApp
        onCancel={onCancel}
        onVerified={() => {
          setMethod("authenticator");
          setStep("recovery");
        }}
      />
    );
  } else if (step === "email") {
    screen = (
      <EmailOtpVerifyPanel
        email={email}
        enrollOnSuccess
        cancelToApp
        onCancel={onCancel}
        onVerified={onComplete}
        onSessionExpired={onCancel}
        onBackToSignIn={onCancel}
      />
    );
  } else {
    screen = (
      <RecoveryKeyRevealPanel
        email={email}
        method={method}
        cancelToApp
        onCancel={onCancel}
        onContinue={onComplete}
      />
    );
  }

  return (
    <div className="luxia-login-inapp-mfa-host">
      <AuthShell expanded={step === "authenticator" || step === "recovery"}>{screen}</AuthShell>
    </div>
  );
}
