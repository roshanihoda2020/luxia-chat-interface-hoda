import { PROTOTYPE_DEFAULT_USER_ID } from "@/app/features/permissions/currentUser";

/**
 * Per-user storage for Home personalization (pins, Your focus choices).
 *
 * Each preference is saved under `<baseKey>:user:<userId>`. Before this, these
 * preferences used one key shared by every prototype identity. That legacy
 * value is never modified or deleted. Its owner is taken to be the identity
 * every prototype session starts as (PROTOTYPE_DEFAULT_USER_ID): every page
 * load began as that identity, and other identities were only reachable
 * through the prototype "Switch demo identity" tool. So:
 * - The default identity reads its own per-user value, or, until it saves one,
 *   the legacy shared value (read-only).
 * - Every other identity reads only its own per-user value, else the product
 *   default. The legacy value is never copied to other users.
 */
export const LEGACY_HOME_PREFERENCE_OWNER = PROTOTYPE_DEFAULT_USER_ID;

export function userScopedHomePreferenceKey(baseKey: string, userId: string): string {
  return `${baseKey}:user:${userId}`;
}

/**
 * Raw stored text for this user, or null when the user has nothing saved
 * (callers then apply the product default). Storage failures read as null.
 */
export function readUserHomePreference(baseKey: string, userId: string): string | null {
  try {
    const own = localStorage.getItem(userScopedHomePreferenceKey(baseKey, userId));
    if (own !== null) return own;
    if (userId === LEGACY_HOME_PREFERENCE_OWNER) return localStorage.getItem(baseKey);
    return null;
  } catch {
    return null;
  }
}

/** Saves to this user's key only; the legacy shared key is left untouched. */
export function writeUserHomePreference(baseKey: string, userId: string, value: unknown): void {
  try {
    localStorage.setItem(userScopedHomePreferenceKey(baseKey, userId), JSON.stringify(value));
  } catch {
    /* ignore quota / private-mode failures */
  }
}
