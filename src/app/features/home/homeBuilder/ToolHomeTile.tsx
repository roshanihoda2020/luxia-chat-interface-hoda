import { ChevronRight } from "lucide-react";
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
    return (
      <HomeTileSurface density="small" label={`Tool ${tool.name}`} className="justify-center" corner={corner}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <HomeTileTitleAction
              title={tool.name}
              onOpen={onOpen}
              ariaLabel={`Open ${tool.name}`}
              stretched
              size="dense"
            />
            <HomeTileText>{status ? `${status} · ${tool.description}` : tool.description}</HomeTileText>
          </div>
          <ChevronRight
            size={16}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 transition-transform duration-150 group-hover/tile:translate-x-0.5"
            style={{ color: HT.accent }}
          />
        </div>
      </HomeTileSurface>
    );
  }

  return (
    <HomeTileSurface density="medium" label={`Tool ${tool.name}`} corner={corner}>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className={`flex min-w-0 items-start gap-2 ${HOME_TILE_CORNER_CLEARANCE.medium}`}>
          <div className="min-w-0">
            <HomeTileTitleAction title={tool.name} onOpen={onOpen} ariaLabel={`Open ${tool.name}`} />
          </div>
          {status ? <span className="pt-0.5"><HomeTileStatus>{status}</HomeTileStatus></span> : null}
        </div>
        <HomeTileText lines={3}>{tool.description}</HomeTileText>
      </div>
      <div className="mt-4">
        <Button type="button" variant="primary" size="compact" onClick={onOpen} aria-label={`Open ${tool.name}`}>
          Open {tool.name}
          <LuxiaArrowRightIcon size={13} color="currentColor" aria-hidden />
        </Button>
      </div>
    </HomeTileSurface>
  );
}
