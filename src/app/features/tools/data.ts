import { getVerifaiToolPath, getWritingAssistantPath } from "@/app/features/project/projectPaths";
import type { LuxiaToolDefinition } from "./types";

export const LUXIA_TOOLS: LuxiaToolDefinition[] = [
  {
    id: "writing-assistant",
    name: "Writing Assistant",
    description: "Write, edit, and refine documents with AI.",
    highlights: ["Rewrite", "Summarize", "Translate"],
    href: getWritingAssistantPath(),
  },
  {
    id: "verifai",
    name: "VerifAI",
    description: "Verify documents against checklists with AI.",
    highlights: ["Checklist", "Findings", "Export"],
    href: getVerifaiToolPath(),
  },
];

export function getLuxiaToolById(id: string): LuxiaToolDefinition | undefined {
  return LUXIA_TOOLS.find((tool) => tool.id === id);
}
