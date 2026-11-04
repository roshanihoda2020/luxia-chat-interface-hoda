import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon, LuxiaWritingAssistantIcon } from "@/assets/icons";
import type { LuxiaToolDefinition } from "@/app/features/tools/types";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileStatus,
  HomeTileSurface,
  HomeTileText,
  HomeTileTitleAction,
} from "./HomeTileSurface";
import { CardArrow, GlyphChip } from "./homeTileVisuals";

const STATUS_LABEL: Record<NonNullable<LuxiaToolDefinition["status"]>, string> = {
  beta: "Beta",
  available: "Available",
};

/**
 * Tool shortcut Home Tile (e.g. Writing Assistant). A launcher, not the tool:
 * Small opens from anywhere on the card; Medium adds the tool's own
 * description and an explicit Open action anchored to the bottom.
 */
export function ToolHomeTile({
  tool,
  density,
  onOpen,
}: {
  tool: LuxiaToolDefinition;
  density: "small" | "medium";
  onOpen: () => void;
}) {
  const status = tool.status ? STATUS_LABEL[tool.status] : undefined;
  const corner = { icon: (size: number) => <LuxiaWritingAssistantIcon size={size} color="currentColor" /> };

  if (density === "small") {
    // A launcher: the tool's mark and name lead; the whole card opens it.
    return (
      <HomeTileSurface density="small" label={`Tool ${tool.name}`} corner={corner}>
        <div className="flex min-h-0 min-w-0 flex-1 items-center gap-3">
          <GlyphChip size={44} tone="strong"><LuxiaWritingAssistantIcon size={22} color="currentColor" /></GlyphChip>
          <div className="min-w-0 flex-1">
            <div className={HOME_TILE_CORNER_CLEARANCE.small}>
              <HomeTileTitleAction title={tool.name} onOpen={onOpen} ariaLabel={`Open ${tool.name}`} stretched size="dense" />
            </div>
            <HomeTileText lines={2}>{tool.description}</HomeTileText>
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-2">
          {status ? <HomeTileStatus>{status}</HomeTileStatus> : <span />}
          <span className="ml-auto luxia-type-label-small" style={{ color: HT.link }}>Open</span>
          <CardArrow />
        </div>
      </HomeTileSurface>
    );
  }

  return (
    <HomeTileSurface density="medium" label={`Tool ${tool.name}`} corner={corner}>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
        <GlyphChip size={56} tone="strong"><LuxiaWritingAssistantIcon size={28} color="currentColor" /></GlyphChip>
        <div className="min-w-0 space-y-1.5">
          <div className={`flex min-w-0 items-center gap-2 ${HOME_TILE_CORNER_CLEARANCE.medium}`}>
            <HomeTileTitleAction title={tool.name} onOpen={onOpen} ariaLabel={`Open ${tool.name}`} />
            {status ? <HomeTileStatus>{status}</HomeTileStatus> : null}
          </div>
          <HomeTileText lines={3}>{tool.description}</HomeTileText>
        </div>
      <div>
        <Button type="button" variant="primary" size="compact" onClick={onOpen} aria-label={`Open ${tool.name}`}>
          Open {tool.name}
          <LuxiaArrowRightIcon size={13} color="currentColor" aria-hidden />
        </Button>
      </div>
      </div>
    </HomeTileSurface>
  );
}
