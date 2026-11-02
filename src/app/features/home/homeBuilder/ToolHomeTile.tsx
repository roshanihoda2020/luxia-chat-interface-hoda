import { ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon, LuxiaWritingAssistantIcon } from "@/assets/icons";
import type { LuxiaToolDefinition } from "@/app/features/tools/types";
import {
  HomeTileIcon,
  HomeTileOverline,
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

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={`Tool ${tool.name}`} className="justify-center">
        <div className="flex min-w-0 items-center gap-3">
          <HomeTileIcon size="sm">
            <LuxiaWritingAssistantIcon size={20} color="currentColor" />
          </HomeTileIcon>
          <div className="min-w-0 flex-1">
            <HomeTileOverline status={status}>Tool</HomeTileOverline>
            <HomeTileTitleAction
              title={tool.name}
              onOpen={onOpen}
              ariaLabel={`Open ${tool.name}`}
              stretched
              size="dense"
            />
            <HomeTileText>{tool.description}</HomeTileText>
          </div>
          <ChevronRight
            size={16}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 transition-transform duration-150 group-hover/tile:translate-x-0.5"
            style={{ color: "var(--luxia-purple-60)" }}
          />
        </div>
      </HomeTileSurface>
    );
  }

  return (
    <HomeTileSurface density="medium" label={`Tool ${tool.name}`}>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <HomeTileIcon size="lg">
            <LuxiaWritingAssistantIcon size={26} color="currentColor" />
          </HomeTileIcon>
          <div className="min-w-0">
            <HomeTileOverline status={status}>Tool</HomeTileOverline>
            <HomeTileTitleAction title={tool.name} onOpen={onOpen} ariaLabel={`Open ${tool.name}`} />
          </div>
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
