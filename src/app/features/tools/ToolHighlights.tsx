import type { LuxiaToolDefinition } from "./types";
import "./toolCard.css";

/**
 * A tool's two or three capabilities as compact chips, shared by the Tools page card and the Home
 * tool tile. Colours come from --lx-chip-* so each surface (including dark Featured tiles) can tune
 * them; a list, so screen readers hear it as the tool's features.
 */
export function ToolHighlights({ tool, className = "" }: { tool: LuxiaToolDefinition; className?: string }) {
  const items = tool.highlights ?? [];
  if (items.length === 0) return null;
  return (
    <ul className={`lx-tool-chips ${className}`.trim()} aria-label={`${tool.name} features`} data-tool-highlights="">
      {items.map((item) => (
        <li key={item} className="lx-tool-chip luxia-type-caption">{item}</li>
      ))}
    </ul>
  );
}
