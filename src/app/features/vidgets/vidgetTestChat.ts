import { getConstellationSettingsRecord } from "@/app/features/constellation-settings/data";
import type { VidgetInboxFeedback } from "@/app/features/vidget-inbox/types";
import {
  DEFAULT_VIDGET_ROUTING_MODE,
  normalizeGalaxyConstellationIds,
  normalizeVidgetRoutingMode,
} from "./data";
import type { VidgetRecord, VidgetRoutingMode } from "./types";
import { toVisitorAssistantLabel } from "./visitorAssistants";

export type VidgetTestMessageRole = "user" | "assistant" | "assistant-error";

export type VidgetTestMessage = {
  id: string;
  role: VidgetTestMessageRole;
  content: string;
  feedback?: VidgetInboxFeedback;
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
  constellationOptions: { id: string; name: string; description?: string }[];
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

/** Visitor-safe constellation answer — no source/file leakage. */
function buildConstellationAnswer(
  constellation: VidgetTestConstellationRef,
  userMessage: string,
): string {
  const query = userMessage.trim();
  const assistantLabel = toVisitorAssistantLabel(constellation.name);
  return [
    `I can help with questions in ${assistantLabel}.`,
    query ? `You asked: "${query}"` : null,
    "Here’s a prototype response based on the selected assistant.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Visitor-safe automatic Galaxy answer — no constellation/source diagnostics. */
function buildGalaxyAutomaticAnswer(
  matched: VidgetTestConstellationRef,
  userMessage: string,
): string {
  const query = userMessage.trim();
  const assistantLabel = toVisitorAssistantLabel(matched.name);
  return [
    `I found a helpful answer for you.`,
    query ? `You asked: "${query}"` : null,
    `This prototype response was prepared with ${assistantLabel}.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildGalaxyVisitorAnswer(
  selected: VidgetTestConstellationRef,
  userMessage: string,
): string {
  return buildConstellationAnswer(selected, userMessage);
}

export type VidgetTestResponse =
  | {
      ok: true;
      content: string;
      constellationId: string | null;
      /** Empty for visitor-facing prototype replies (no source leakage). */
      sources: { id: string; label: string }[];
    }
  | { ok: false; error: string };

function resolveMatchedConstellation(
  record: Pick<VidgetRecord, "sourceType" | "routingMode">,
  scoped: VidgetTestConstellationRef[],
  userMessage: string,
  selectedAssistantId?: string | null,
): VidgetTestConstellationRef | null {
  if (scoped.length === 0) return null;
  if (record.sourceType === "constellation") return scoped[0]!;

  const mode = normalizeVidgetRoutingMode(record.sourceType, record.routingMode);
  if (mode === "visitor") {
    const id = selectedAssistantId?.trim();
    if (!id) return null;
    return scoped.find((item) => item.id === id) ?? null;
  }
  return pickGalaxyMatch(userMessage, scoped);
}

export async function requestVidgetTestResponse(input: {
  record: VidgetRecord;
  userMessage: string;
  context: VidgetTestContextInput;
  /** Required when Galaxy routingMode is visitor. */
  selectedAssistantId?: string | null;
}): Promise<VidgetTestResponse> {
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

  const routingMode: VidgetRoutingMode = normalizeVidgetRoutingMode(
    input.record.sourceType,
    input.record.routingMode ?? DEFAULT_VIDGET_ROUTING_MODE,
  );

  if (
    input.record.sourceType === "galaxy"
    && routingMode === "visitor"
    && !input.selectedAssistantId?.trim()
  ) {
    return {
      ok: false,
      error: "Choose an assistant before sending a message.",
    };
  }

  await new Promise((resolve) => window.setTimeout(resolve, RESPONSE_DELAY_MS));

  const matched = resolveMatchedConstellation(
    input.record,
    scoped,
    trimmed,
    input.selectedAssistantId,
  );
  if (!matched) {
    if (routingMode === "visitor") {
      return {
        ok: false,
        error: "No assistants are available right now.",
      };
    }
    return {
      ok: false,
      error:
        "Source unavailable. This Vidget cannot be tested until its source is available.",
    };
  }

  let content: string;
  if (input.record.sourceType === "constellation") {
    content = buildConstellationAnswer(matched, trimmed);
  } else if (routingMode === "visitor") {
    content = buildGalaxyVisitorAnswer(matched, trimmed);
  } else {
    content = buildGalaxyAutomaticAnswer(matched, trimmed);
  }

  content = appendInstructionPrefix(content, input.record.vidgetInstruction);
  content = appendLanguageNote(content, input.record.language);

  return {
    ok: true,
    content,
    constellationId: matched.id,
    sources: [],
  };
}
