import type { ProjectAssistantConstellationRef } from "./types";

const RESPONSE_DELAY_MS = 900;

let messageCounter = 0;

export function nextProjectAssistantMessageId(): string {
  messageCounter += 1;
  return `project-assistant-${Date.now()}-${messageCounter}`;
}

export async function requestProjectAssistantResponse(input: {
  userMessage: string;
  projectName: string;
  constellations: ProjectAssistantConstellationRef[];
}): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  const trimmed = input.userMessage.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a question about this Project." };
  }

  await new Promise((resolve) => window.setTimeout(resolve, RESPONSE_DELAY_MS));

  if (input.constellations.length === 0) {
    return {
      ok: true,
      content: [
        `I looked across ${input.projectName}, but there isn't enough available knowledge to answer yet.`,
        "Add or restore Project knowledge, then ask again.",
      ].join("\n\n"),
    };
  }

  const lowered = trimmed.toLowerCase();
  if (
    lowered.includes("where should i start") ||
    lowered.includes("where to start")
  ) {
    return {
      ok: true,
      content: [
        `A good place to begin in ${input.projectName} is with the Project Overview, then the areas that matter most to your goal.`,
        "If you share what you're trying to accomplish, I can help narrow where to look next.",
      ].join("\n\n"),
    };
  }

  if (
    lowered.includes("what information is available") ||
    lowered.includes("what data is available") ||
    lowered.includes("what's available") ||
    lowered.includes("whats available")
  ) {
    return {
      ok: true,
      content: [
        `${input.projectName} includes the knowledge currently available in this Project.`,
        "Ask about a topic, ask for a summary, or tell me what you're looking for and I'll help you find a starting point.",
      ].join("\n\n"),
    };
  }

  if (lowered.includes("summarize") || lowered.includes("summary")) {
    return {
      ok: true,
      content: [
        `Here's a concise starting summary for ${input.projectName}: this Project holds the knowledge your team has made available here.`,
        "Tell me which area matters most—policies, operations, people, or another topic—and I can help you dig in.",
      ].join("\n\n"),
    };
  }

  return {
    ok: true,
    content: [
      `Here's help related to your question in ${input.projectName}.`,
      "I can summarize what's available, help you explore a topic, or suggest where to start. Add more detail if you want a more specific answer.",
    ].join("\n\n"),
  };
}
