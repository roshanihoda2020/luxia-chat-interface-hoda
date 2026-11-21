import { readUserHomePreference, writeUserHomePreference } from "@/app/features/home/homePreferenceScope";

/** Last Project / Constellation chosen in the VerifAI Tool, stored per user (never shared between users). */
const SCOPE_KEY = "luxia-verifai-tool-scope:v1";

export type VerifaiToolScope = { projectId: string; constellationId: string };

export function readVerifaiToolScope(userId: string): VerifaiToolScope | null {
  const raw = readUserHomePreference(SCOPE_KEY, userId);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<VerifaiToolScope>;
    return typeof value.projectId === "string" && typeof value.constellationId === "string"
      ? { projectId: value.projectId, constellationId: value.constellationId }
      : null;
  } catch {
    return null;
  }
}

export function writeVerifaiToolScope(userId: string, scope: VerifaiToolScope): void {
  writeUserHomePreference(SCOPE_KEY, userId, scope);
}
