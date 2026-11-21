import { LuxiaVignette, type LuxiaVignetteKind } from "@/app/features/home/LuxiaVignette";
import type { LuxiaToolId } from "./types";

/**
 * The one illustration per Tool, shared by the Tools page cards and the Home tool tiles: the
 * Writing Assistant's approved document-editing scene and VerifAI's verification scene (a document's
 * passages linked to checklist requirements with their outcomes). A new Tool registers its scene here.
 */
const TOOL_SCENES: Record<LuxiaToolId, LuxiaVignetteKind> = {
  "writing-assistant": "write",
  verifai: "verify",
};

export function ToolIllustration({ toolId, className = "" }: { toolId: LuxiaToolId; className?: string }) {
  return <LuxiaVignette kind={TOOL_SCENES[toolId]} className={className} />;
}
