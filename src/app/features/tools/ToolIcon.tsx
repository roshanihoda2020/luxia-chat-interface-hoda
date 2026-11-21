import { ShieldCheck } from "lucide-react";
import { LuxiaWritingAssistantIcon } from "@/assets/icons";
import type { LuxiaToolId } from "./types";

/**
 * The one mark per Tool, used by every Tool surface (Tools page, Home tiles and headings).
 * VerifAI uses the same shield mark as @verifai in Chat.
 */
export function LuxiaToolIcon({
  toolId,
  size,
  color = "currentColor",
  accentColor,
}: {
  toolId: LuxiaToolId;
  size: number;
  color?: string;
  /** Writing Assistant's secondary stroke colour. */
  accentColor?: string;
}) {
  if (toolId === "verifai") {
    return <ShieldCheck size={size} color={color} strokeWidth={1.75} aria-hidden />;
  }
  return <LuxiaWritingAssistantIcon size={size} color={color} accentColor={accentColor} aria-hidden />;
}
