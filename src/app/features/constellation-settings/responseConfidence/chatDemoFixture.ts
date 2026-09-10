import type { LuxiaResponsePresentation } from "@/app/features/chat/LuxiaResponseCard";
import { applyResponsePresentationState } from "./previewModel";
import { loadResponseConfidencePolicy } from "./persistence";

/**
 * Dev-only seeded chat states. Not a product control.
 * Set Message.responsePresentation.state; copy comes from the Constellation's saved policy.
 * Do not invent confidence scores. Backend later writes the same field.
 */
export const RESPONSE_CONFIDENCE_CHAT_DEMO_STATES: readonly LuxiaResponsePresentation[] = [
  "normal",
  "warning",
  "error",
  "block",
];

const DEMO_USER_PROMPTS: Record<LuxiaResponsePresentation, string> = {
  normal: "Placeholder question for",
  warning: "What should we double-check before using this?",
  error: "Can you confirm this is complete?",
  block: "What is missing from the connected sources?",
};

export type ResponseConfidenceDemoMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  sources?: { id: string; label: string }[];
  responsePresentation?: { state: LuxiaResponsePresentation };
};

export function makeResponseConfidenceDemoMessages(
  chatId: string,
  chatLabel: string,
): ResponseConfidenceDemoMessage[] {
  const generated = `Placeholder response for ${chatLabel}. This message history belongs only to ${chatId}.`;
  const sources = [
    { id: `${chatId}-s1`, label: "Source A" },
    { id: `${chatId}-s2`, label: "Source B" },
  ];
  const messages: ResponseConfidenceDemoMessage[] = [];

  RESPONSE_CONFIDENCE_CHAT_DEMO_STATES.forEach((state, index) => {
    const turn = index + 1;
    const minute = 14 + index;
    const timestamp = `10:${String(minute).padStart(2, "0")} AM`;
    messages.push({
      id: `${chatId}-u${turn}`,
      role: "user",
      timestamp,
      content:
        state === "normal"
          ? `${DEMO_USER_PROMPTS.normal} ${chatLabel}.`
          : DEMO_USER_PROMPTS[state],
    });
    messages.push({
      id: `${chatId}-a${turn}`,
      role: "ai",
      timestamp,
      content: generated,
      sources: sources.map((source) => ({ ...source })),
      responsePresentation: { state },
    });
  });

  return messages;
}

/**
 * Applies saved Constellation policy when presentation state is explicit.
 * Galaxy should pass message.galaxy.matched.id. Does not score confidence.
 */
export function hydrateMessageResponsePresentation(
  message: {
    content: string;
    sources?: { id: string; label: string }[];
    responsePresentation?: { state: LuxiaResponsePresentation; notice?: string };
  },
  constellationId?: string,
): {
  presentation: LuxiaResponsePresentation;
  notice: string | null | undefined;
  content: string;
  sources: { id: string; label: string }[] | undefined;
  hideInsights: boolean;
  footerVariant: "full" | "copy-only";
} {
  const state = message.responsePresentation?.state;
  if (!constellationId || !state) {
    const presentation = state ?? "normal";
    return {
      presentation,
      notice: message.responsePresentation?.notice,
      content: message.content,
      sources: presentation === "block" ? undefined : message.sources,
      hideInsights: presentation === "block",
      footerVariant: presentation === "block" ? "copy-only" : "full",
    };
  }

  const applied = applyResponsePresentationState(
    state,
    loadResponseConfidencePolicy(constellationId),
    message.content,
  );

  return {
    presentation: applied.presentation,
    notice: applied.notice,
    content: applied.content,
    sources: applied.showSources ? message.sources : undefined,
    hideInsights: !applied.showSources,
    footerVariant: applied.footerVariant,
  };
}
