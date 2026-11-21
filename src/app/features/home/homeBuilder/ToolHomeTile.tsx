import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon } from "@/assets/icons";
import { LuxiaToolIcon } from "@/app/features/tools/ToolIcon";
import type { LuxiaToolDefinition } from "@/app/features/tools/types";
import { ToolHighlights } from "@/app/features/tools/ToolHighlights";
import { ToolIllustration } from "@/app/features/tools/ToolIllustration";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileStatus,
  HomeTileSurface,
  HomeTileText,
  HomeTileTitleAction,
} from "./HomeTileSurface";
import { CardArrow } from "./homeTileVisuals";

const STATUS_LABEL: Record<NonNullable<LuxiaToolDefinition["status"]>, string> = {
  beta: "Beta",
  available: "Available",
};

/**
 * Tool shortcut Home Tile (e.g. Writing Assistant). A launcher, not the tool:
 * Small opens from anywhere on the card; Medium and Large are product cards
 * with the tool's illustration, description, feature chips and an Open action.
 * Each size has its own composition (homeTileSurfaces.css); the scene is always
 * the tool's own drawing at its own 4:3 shape.
 */
export function ToolHomeTile({
  tool,
  density,
  onOpen,
}: {
  tool: LuxiaToolDefinition;
  density: "small" | "medium" | "large";
  onOpen: () => void;
}) {
  const status = tool.status ? STATUS_LABEL[tool.status] : undefined;
  const corner = { icon: (size: number) => <LuxiaToolIcon toolId={tool.id} size={size} /> };

  if (density === "small") {
    // A launcher; the whole card opens the tool. On the grid the scene sits in a band above the name
    // (the card is taller than it is wide enough for a split); stacked, beside it.
    return (
      <HomeTileSurface density="small" label={`Tool ${tool.name}`} corner={corner}>
        <div className="lx-tool-mini" data-tool={tool.id}>
          <div className="lx-tool-mini__band" data-tool-tile-illustration="" aria-hidden>
            <ToolIllustration toolId={tool.id} className="lx-tool-mini__art" />
          </div>
          <div className="lx-tool-mini__body">
            <div className={`lx-tool-mini__title ${HOME_TILE_CORNER_CLEARANCE.small}`}>
              <HomeTileTitleAction title={tool.name} onOpen={onOpen} ariaLabel={`Open ${tool.name}`} stretched size="dense" />
            </div>
            <HomeTileText lines={2}>{tool.description}</HomeTileText>
            <div className="lx-tool-mini__open flex min-w-0 items-center justify-between gap-2">
              {status ? <HomeTileStatus>{status}</HomeTileStatus> : <span />}
              <span className="ml-auto luxia-type-label-small" style={{ color: HT.link }}>Open</span>
              <CardArrow />
            </div>
          </div>
        </div>
      </HomeTileSurface>
    );
  }

  // A product card: the tool's own scene (shared registry, the same drawing as on the Tools page) on a
  // soft panel that bleeds to the card's edges, and the name, description, feature chips and Open.
  // homeTileSurfaces.css puts the panel beside the text in Large (and stacked) cards and above it in
  // Medium ones, whose grid slot is tall rather than wide.
  return (
    <HomeTileSurface density="medium" label={`Tool ${tool.name}`} corner={corner}>
      <div className="lx-tool-tile" data-tool={tool.id} data-size={density}>
        <div className="lx-tool-tile__layout">
          <div className="lx-tool-tile__panel" data-tool-tile-illustration="" aria-hidden>
            <ToolIllustration toolId={tool.id} className="lx-tool-tile__art" />
          </div>
          <div className="lx-tool-tile__content">
            <div className="min-w-0 space-y-1">
              <div className="lx-tool-tile__title flex min-w-0 items-center gap-2">
                <HomeTileTitleAction title={tool.name} onOpen={onOpen} ariaLabel={`Open ${tool.name}`} />
                {status ? <HomeTileStatus>{status}</HomeTileStatus> : null}
              </div>
              <HomeTileText lines={2}>{tool.description}</HomeTileText>
            </div>
            <ToolHighlights tool={tool} />
            <div>
              <Button type="button" variant="primary" size="compact" onClick={onOpen} aria-label={`Open ${tool.name}`}>
                Open {tool.name}
                <LuxiaArrowRightIcon size={13} color="currentColor" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </HomeTileSurface>
  );
}
