import { getWritingAssistantPath } from "@/app/features/project/projectPaths";
import type { LuxiaToolDefinition } from "./types";

export const LUXIA_TOOLS: LuxiaToolDefinition[] = [
  {
    id: "writing-assistant",
    name: "Writing Assistant",
    description:
      "Write, edit, and improve selected parts of a document with AI assistance.",
    status: "beta",
    href: getWritingAssistantPath(),
  },
];

export function getLuxiaToolById(id: string): LuxiaToolDefinition | undefined {
  return LUXIA_TOOLS.find((tool) => tool.id === id);
}
