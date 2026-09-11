/**
 * Prototype UI gate only.
 * Does not authenticate, authorize, call APIs, or replace production session handling.
 * Remember me only chooses where this signed-in flag is stored.
 * Logout / session helpers must not clear project, tag, or other prototype data.
 */
const STORAGE_KEY = "luxia.prototype-signed-in.v1";

function readFlag(storage: Storage, key: string): boolean {
  try {
    return storage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(storage: Storage, key: string): void {
  try {
    storage.setItem(key, "1");
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function clearFlag(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore storage access failures */
  }
}

export function readPrototypeSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return readFlag(window.localStorage, STORAGE_KEY) || readFlag(window.sessionStorage, STORAGE_KEY);
}

export function writePrototypeSignedIn(rememberMe = false): void {
  if (typeof window === "undefined") return;
  if (rememberMe) {
    writeFlag(window.localStorage, STORAGE_KEY);
    clearFlag(window.sessionStorage, STORAGE_KEY);
    return;
  }
  writeFlag(window.sessionStorage, STORAGE_KEY);
  clearFlag(window.localStorage, STORAGE_KEY);
}

export function clearPrototypeSignedIn(): void {
  if (typeof window === "undefined") return;
  clearFlag(window.sessionStorage, STORAGE_KEY);
  clearFlag(window.localStorage, STORAGE_KEY);
}
