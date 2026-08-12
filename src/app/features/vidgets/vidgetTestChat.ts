import { getConstellationSettingsRecord } from "@/app/features/constellation-settings/data";
import { normalizeGalaxyConstellationIds } from "./data";
import type { VidgetRecord } from "./types";

export type VidgetTestMessageRole = "user" | "assistant" | "assistant-error";

export type VidgetTestMessage = {
  id: string;
  role: VidgetTestMessageRole;
  content: string;
};

export type VidgetTestConstellationRef = {
  id: string;
  name: string;
  connectedSourceNames: string[];
};

export type VidgetTestEligibility = {
  canTest: boolean;
  reason?: string;
};

export type VidgetTestContextInput = {
  sourceAvailable: boolean;
  constellationOptions: { id: string; name: string }[];
  galaxyName: string;
  constellationName: string | null;
};

const RESPONSE_DELAY_MS = 900;

let messageCounter = 0;

export function nextVidgetTestMessageId(): string {
  messageCounter += 1;
  return `vidget-test-${Date.now()}-${messageCounter}`;
}

export function resolveVidgetTestEligibility(
  record: Pick<
    VidgetRecord,
    "channel" | "sourceType" | "constellationId" | "galaxyConstellationIds"
  >,
  input: Pick<VidgetTestContextInput, "sourceAvailable" | "constellationOptions">,
): VidgetTestEligibility {
  if (record.channel !== "web") {
    return { canTest: false };
  }
  if (!input.sourceAvailable) {
    return {
      canTest: false,
      reason:
        "Source unavailable. This Vidget cannot be tested until its source is available.",
    };
  }
  if (record.sourceType === "constellation") {
    const constellationId = record.constellationId?.trim();
    if (
      !constellationId
      || !input.constellationOptions.some((item) => item.id === constellationId)
    ) {
      return {
        canTest: false,
        reason:
          "Source unavailable. This Vidget cannot be tested until its source is available.",
      };
    }
    return { canTest: true };
  }

  const scopeIds = normalizeGalaxyConstellationIds(record.galaxyConstellationIds);
  if (scopeIds.length === 0) {
    return {
      canTest: false,
      reason: "Select at least one Constellation to test this Vidget.",
    };
  }
  const optionIds = new Set(input.constellationOptions.map((item) => item.id));
  if (scopeIds.some((id) => !optionIds.has(id))) {
    return {
      canTest: false,
      reason:
        "Source unavailable. This Vidget cannot be tested until its source is available.",
    };
  }
  return { canTest: true };
}

export function buildVidgetTestConstellationRefs(
  record: Pick<VidgetRecord, "sourceType" | "constellationId" | "galaxyConstellationIds">,
  constellationOptions: { id: string; name: string }[],
): VidgetTestConstellationRef[] {
  const optionMap = new Map(constellationOptions.map((item) => [item.id, item.name]));

  if (record.sourceType === "constellation") {
    const id = record.constellationId?.trim();
    if (!id || !optionMap.has(id)) return [];
    const settings = getConstellationSettingsRecord(id);
    return [{
      id,
      name: optionMap.get(id) ?? id,
      connectedSourceNames: (settings?.connectedSources ?? []).map((source) => source.name),
    }];
  }

  return normalizeGalaxyConstellationIds(record.galaxyConstellationIds)
    .filter((id) => optionMap.has(id))
    .map((id) => {
      const settings = getConstellationSettingsRecord(id);
      return {
        id,
        name: optionMap.get(id) ?? id,
        connectedSourceNames: (settings?.connectedSources ?? []).map((source) => source.name),
      };
    });
}

function pickGalaxyMatch(
  userMessage: string,
  scoped: VidgetTestConstellationRef[],
): VidgetTestConstellationRef {
  const normalized = userMessage.trim().toLowerCase();
  const byName = scoped.find((item) => normalized.includes(item.name.toLowerCase()));
  return byName ?? scoped[0]!;
}

function appendInstructionPrefix(content: string, instruction: string | undefined): string {
  const trimmed = instruction?.trim();
  if (!trimmed) return content;
  return `Using the current Vidget instruction.\n\n${content}`;
}

function appendLanguageNote(content: string, language: string | undefined): string {
  const trimmed = language?.trim();
  if (!trimmed || trimmed === "English") return content;
  return `${content}\n\n(Language setting: ${trimmed})`;
}

function buildConstellationAnswer(
  constellation: VidgetTestConstellationRef,
  userMessage: string,
): string {
  const query = userMessage.trim();
  const sourceLine = constellation.connectedSourceNames.length > 0
    ? `Sources considered: ${constellation.connectedSourceNames.join(", ")}.`
    : "No connected Data Source labels are available in this prototype response.";

  return [
    `I searched ${constellation.name} for your question.`,
    query ? `You asked: "${query}"` : null,
    sourceLine,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildGalaxyScopedAnswer(
  scoped: VidgetTestConstellationRef[],
  galaxyName: string,
  userMessage: string,
): string {
  const matched = pickGalaxyMatch(userMessage, scoped);
  const scopeLabels = scoped.map((item) => item.name).join(", ");
  const sourceLine = matched.connectedSourceNames.length > 0
    ? `Sources considered: ${matched.connectedSourceNames.join(", ")}.`
    : "No connected Data Source labels are available in this prototype response.";

  return [
    `Searching ${galaxyName} within this Vidget's configured scope (${scopeLabels}).`,
    `Best match: ${matched.name}.`,
    sourceLine,
  ].join("\n\n");
}

export async function requestVidgetTestResponse(input: {
  record: VidgetRecord;
  userMessage: string;
  context: VidgetTestContextInput;
}): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  const trimmed = input.userMessage.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a message to test this Vidget." };
  }

  const eligibility = resolveVidgetTestEligibility(input.record, input.context);
  if (!eligibility.canTest) {
    return {
      ok: false,
      error: eligibility.reason ?? "This Vidget cannot be tested right now.",
    };
  }

  const scoped = buildVidgetTestConstellationRefs(
    input.record,
    input.context.constellationOptions,
  );
  if (scoped.length === 0) {
    return {
      ok: false,
      error:
        "Source unavailable. This Vidget cannot be tested until its source is available.",
    };
  }

  await new Promise((resolve) => window.setTimeout(resolve, RESPONSE_DELAY_MS));

  let content: string;
  if (input.record.sourceType === "constellation") {
    content = buildConstellationAnswer(scoped[0]!, trimmed);
  } else {
    content = buildGalaxyScopedAnswer(
      scoped,
      input.context.galaxyName,
      trimmed,
    );
  }

  content = appendInstructionPrefix(content, input.record.vidgetInstruction);
  content = appendLanguageNote(content, input.record.language);

  return { ok: true, content };
}
