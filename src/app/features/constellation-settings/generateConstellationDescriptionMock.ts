import type { CapsuleConstellationType } from "@/app/features/constellation/capsuleCapabilities";

export type GenerateConstellationDescriptionInput = {
  name: string;
  type: CapsuleConstellationType;
  projectName: string;
  connectedSourceNames?: readonly string[];
};

export type GenerateConstellationDescriptionResult =
  | { ok: true; description: string }
  | { ok: false; message: string };

const MOCK_DELAY_MIN_MS = 750;
const MOCK_DELAY_MAX_MS = 1100;

/** Deterministic prototype failure trigger — not shown in UI. */
export function shouldFailDescriptionGeneratePrototype(name: string): boolean {
  return name.includes("__desc_fail");
}

function typePhrase(type: CapsuleConstellationType): string {
  if (type === "database") return "structured database tables";
  if (type === "csv") return "CSV tabular data";
  return "PDF documents and related knowledge";
}

/**
 * Build a realistic plain-text constellation description draft.
 * Prototype only — no chatbot/API.
 */
export function buildMockConstellationDescription(
  input: GenerateConstellationDescriptionInput,
): string {
  const name = input.name.trim() || "this Constellation";
  const project = input.projectName.trim() || "this Project";
  const sources = (input.connectedSourceNames ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  const sourceClause =
    sources.length === 0
      ? `its connected ${typePhrase(input.type)}`
      : sources.length === 1
        ? `${sources[0]} and related ${typePhrase(input.type)}`
        : `${sources.slice(0, 2).join(" and ")}${
          sources.length > 2 ? `, and ${sources.length - 2} more sources` : ""
        }`;

  return (
    `${name} helps teams in ${project} answer questions using ${sourceClause}. ` +
    `It summarises key facts, explains patterns in the available data, and keeps responses grounded in the Constellation’s configured knowledge.`
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Short mock async generate used by Settings Generate description. */
export async function generateConstellationDescriptionMock(
  input: GenerateConstellationDescriptionInput,
): Promise<GenerateConstellationDescriptionResult> {
  const span = MOCK_DELAY_MAX_MS - MOCK_DELAY_MIN_MS;
  const waitMs = MOCK_DELAY_MIN_MS + Math.floor(Math.random() * (span + 1));
  await delay(waitMs);

  if (shouldFailDescriptionGeneratePrototype(input.name)) {
    return {
      ok: false,
      message: "Could not generate a description.",
    };
  }

  return {
    ok: true,
    description: buildMockConstellationDescription(input),
  };
}
