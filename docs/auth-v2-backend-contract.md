# Auth V2 — Backend contract (frontend handoff)

Frontend prototype maps stable `errorCode` values via `src/app/features/login/authErrors.ts`.
This document lists what the UI expects from the future API. **Nothing here is enforced by a server in this repo.**

## Shared response shape

```ts
{
  errorCode: string;
  message?: string;           // optional override; UI has defaults
  retryAfterSeconds?: number; // AUTH_LOCKED, AUTH_RATE_LIMITED, resend limits
}
```

## Error codes

| errorCode | Frontend screen / state | Required payload | Recovery action |
|---|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | Sign-in form error | — | Retry; after 3 failures show Reset password? |
| `AUTH_LOCKED` | Sign-in form (not dead-end page) | `retryAfterSeconds` | Wait + Reset password |
| `AUTH_RATE_LIMITED` | Sign-in / resend surfaces | `retryAfterSeconds` | Wait |
| `AUTH_CAPTCHA_FAILED` | Sign-in near CAPTCHA | — | Retry; reload CAPTCHA |
| `AUTH_ACCOUNT_DEACTIVATED` | Dedicated deactivated state | — | Contact support |
| `AUTH_MUST_CHANGE_PASSWORD` / `mustChangePassword` | Forced change-password screen | flag or code | Complete password change |
| `MFA_CODE_INVALID` | MFA verify / setup verify | — | Retry |
| `MFA_CODE_EXPIRED` | Email OTP | — | Resend |
| `MFA_TOO_MANY_ATTEMPTS` | MFA verify / setup | — | Restart auth/setup |
| `MFA_SESSION_EXPIRED` | Return to Sign in | — | Sign in again |
| `INVITE_EXPIRED` | Invite expired + Request new | — | Request invitation / Sign in |
| `INVITE_USED` | Invite used | — | Sign in to join |
| `INVITE_REVOKED` | Invite revoked | — | Contact admin |
| `INVITE_INVALID` | Invite invalid | — | Sign in |
| `PASSWORD_TOO_COMMON` | Setup / reset / change | — | Choose another password |
| `PASSWORD_BREACHED` | Setup / reset / change | — | Choose another password (service-backed) |
| `NETWORK_ERROR` | Any form | — | Retry |

## Invite GET (valid)

Expected fields for invitation UI:

| Field | UI |
|---|---|
| `inviterName` | Invited by |
| `organizationName` | Organization |
| `invitedEmail` | Email (read-only) |

Invite accept must reject used / expired / revoked server-side (not implemented in FE).

## MFA reminder (optional nudge)

After successful sign-in, when MFA is optional:

| Field | Meaning |
|---|---|
| `mfaRequired` | If true → mandatory MFA gate (blocking) |
| `mfaEnrolled` | If true → no nudge |
| `mfaReminderSnoozedUntil` | ISO timestamp; if future → suppress nudge |

Frontend prototype stores snooze **locally only** (`snoozeMfaNudge`). Not cross-device.

## Password policy (UI presentation)

- Min 8, max 128
- No forced upper/lower/number/symbol
- Common/breached rejection via error codes above (backend/service)

## Resend

UI shows 60s cooldown. Backend should enforce e.g. 5 sends / 15 minutes and may return `AUTH_RATE_LIMITED` + `retryAfterSeconds`.

## Backend-only (do not expect from this FE repo)

- Hashed OTP storage / real OTP expiry
- Attempt counters, Redis cooldown
- HTTP 423 / 429 enforcement
- Invite used/expired/revoked enforcement
- Account deactivation persistence + session revocation
- Security emails
- Breached-password service
- Production token/session management
