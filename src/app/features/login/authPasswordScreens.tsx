import { useId, useState, type FormEvent } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  AuthBackToSignIn,
  AuthBusyLabel,
  AuthField,
  PasswordChecklist,
  PasswordField,
  afterNextPaint,
} from "@/app/features/login/authShared";
import {
  getStoredPassword,
  passwordsMatch,
  validatePasswordPolicy,
  writeAccountSetupComplete,
  writeMustChangeComplete,
  writeStoredPassword,
  type PrototypeAuthAccount,
} from "@/app/features/login/prototypeAuth";

const AUTH_PRIMARY_CTA =
  "luxia-login-submit luxia-login-submit--activate luxia-button--on-dark";

export function AccountSetupPanel({
  account,
  onComplete,
  onBackToSignIn,
}: {
  account: PrototypeAuthAccount;
  onComplete: () => void;
  onBackToSignIn: () => void;
}) {
  const titleId = useId();
  const nameId = useId();
  const [jobTitle, setJobTitle] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nextName = fullName.trim() ? null : "Enter your full name.";
    const nextPassword = validatePasswordPolicy(password);
    const nextConfirm = passwordsMatch(password, confirm);
    setNameError(nextName);
    setPasswordError(nextPassword);
    setConfirmError(nextConfirm);
    if (nextName || nextPassword || nextConfirm) return;
    setSaving(true);
    afterNextPaint(() => {
      writeStoredPassword(account.email, password);
      writeAccountSetupComplete(account.email);
      onComplete();
    });
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Set up your account</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Complete your profile and choose a password to continue.
        </p>
      </header>
      <form
        className="luxia-login-form w-full min-w-0"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={saving || undefined}
      >
        <AuthField id={nameId} label="Full name" required error={nameError}>
          <Input
            id={nameId}
            name="name"
            autoComplete="name"
            autoFocus
            value={fullName}
            aria-required="true"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${nameId}-error` : undefined}
            className="luxia-login-input max-w-full"
            size={1}
            style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
            onChange={(event) => {
              setFullName(event.target.value);
              if (nameError) setNameError(null);
            }}
          />
        </AuthField>
        <AuthField id={titleId} label="Job title">
          <Input
            id={titleId}
            name="jobTitle"
            autoComplete="organization-title"
            value={jobTitle}
            className="luxia-login-input max-w-full"
            size={1}
            style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
            onChange={(event) => setJobTitle(event.target.value)}
          />
        </AuthField>
        <PasswordField
          id={`${nameId}-password`}
          name="new-password"
          label="Password"
          required
          autoComplete="new-password"
          value={password}
          error={passwordError}
          onChange={(value) => {
            setPassword(value);
            if (passwordError) setPasswordError(null);
          }}
        />
        <PasswordField
          id={`${nameId}-confirm`}
          name="confirm-password"
          label="Confirm password"
          required
          autoComplete="new-password"
          value={confirm}
          error={confirmError}
          onChange={(value) => {
            setConfirm(value);
            if (confirmError) setConfirmError(null);
          }}
        />
        <PasswordChecklist password={password} confirm={confirm} showConfirm />
        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={saving}
          aria-busy={saving || undefined}
        >
          <AuthBusyLabel busy={saving} busyLabel="Saving…" idleLabel="Continue" />
        </Button>
      </form>
      <AuthBackToSignIn onClick={onBackToSignIn} />
    </>
  );
}

export function ForcedPasswordChangePanel({
  account,
  onComplete,
  onBackToSignIn,
}: {
  account: PrototypeAuthAccount;
  onComplete: () => void;
  onBackToSignIn: () => void;
}) {
  const id = useId();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nextCurrent = !current
      ? "Enter your current password."
      : current === getStoredPassword(account.email)
        ? null
        : "Current password is incorrect.";
    const nextPassword = validatePasswordPolicy(password);
    const nextConfirm = passwordsMatch(password, confirm);
    setCurrentError(nextCurrent);
    setPasswordError(nextPassword);
    setConfirmError(nextConfirm);
    if (nextCurrent || nextPassword || nextConfirm) return;
    setSaving(true);
    afterNextPaint(() => {
      writeStoredPassword(account.email, password);
      writeMustChangeComplete(account.email);
      onComplete();
    });
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Change password</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          You must set a new password before continuing.
        </p>
      </header>
      <form
        className="luxia-login-form w-full min-w-0"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={saving || undefined}
      >
        <PasswordField
          id={`${id}-current`}
          name="current-password"
          label="Current password"
          required
          autoComplete="current-password"
          autoFocus
          value={current}
          error={currentError}
          onChange={(value) => {
            setCurrent(value);
            if (currentError) setCurrentError(null);
          }}
        />
        <PasswordField
          id={`${id}-new`}
          name="new-password"
          label="New password"
          required
          autoComplete="new-password"
          value={password}
          error={passwordError}
          onChange={(value) => {
            setPassword(value);
            if (passwordError) setPasswordError(null);
          }}
        />
        <PasswordField
          id={`${id}-confirm`}
          name="confirm-password"
          label="Confirm new password"
          required
          autoComplete="new-password"
          value={confirm}
          error={confirmError}
          onChange={(value) => {
            setConfirm(value);
            if (confirmError) setConfirmError(null);
          }}
        />
        <PasswordChecklist password={password} confirm={confirm} showConfirm />
        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={saving}
          aria-busy={saving || undefined}
        >
          <AuthBusyLabel busy={saving} busyLabel="Saving…" idleLabel="Update password" />
        </Button>
      </form>
      <AuthBackToSignIn onClick={onBackToSignIn} />
    </>
  );
}

export function ResetPasswordPanel({
  emailHint,
  onReset,
  onBackToSignIn,
}: {
  emailHint: string | null;
  onReset: (password: string) => void;
  onBackToSignIn: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const id = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nextPassword = validatePasswordPolicy(password);
    const nextConfirm = passwordsMatch(password, confirm);
    setPasswordError(nextPassword);
    setConfirmError(nextConfirm);
    if (nextPassword || nextConfirm) return;
    setSaving(true);
    afterNextPaint(() => onReset(password));
  }

  return (
    <>
      <header className="luxia-login-heading">
        <h1 className="luxia-type-heading-h3 luxia-login-title">Reset password</h1>
        <p className="luxia-type-body-small luxia-login-subtitle">
          Choose a new password{emailHint ? " for your account" : ""}.
        </p>
      </header>
      <form
        className="luxia-login-form w-full min-w-0"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={saving || undefined}
      >
        <PasswordField
          id={`${id}-new`}
          name="new-password"
          label="New password"
          required
          autoComplete="new-password"
          autoFocus
          value={password}
          error={passwordError}
          onChange={(value) => {
            setPassword(value);
            if (passwordError) setPasswordError(null);
          }}
        />
        <PasswordField
          id={`${id}-confirm`}
          name="confirm-password"
          label="Confirm password"
          required
          autoComplete="new-password"
          value={confirm}
          error={confirmError}
          onChange={(value) => {
            setConfirm(value);
            if (confirmError) setConfirmError(null);
          }}
        />
        <PasswordChecklist password={password} confirm={confirm} showConfirm />
        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_CTA}
          disabled={saving}
          aria-busy={saving || undefined}
        >
          <AuthBusyLabel busy={saving} busyLabel="Resetting password…" idleLabel="Reset password" />
        </Button>
      </form>
      <AuthBackToSignIn onClick={onBackToSignIn} />
    </>
  );
}
