import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon } from "@/assets/icons";
import { HS } from "@/app/features/home/homeSurfaces";
import { LuxiaToolIcon } from "./ToolIcon";
import { ToolHighlights } from "./ToolHighlights";
import { ToolIllustration } from "./ToolIllustration";
import type { LuxiaToolDefinition, LuxiaToolStatus } from "./types";
import "./toolCard.css";

const STATUS_LABEL: Record<LuxiaToolStatus, string> = {
  beta: "Beta",
  available: "Available",
};

type ToolCardProps = {
  tool: LuxiaToolDefinition;
  onOpen: (tool: LuxiaToolDefinition) => void;
};

/**
 * Tool product card (Tools page): the tool's mark, name, one-sentence description, feature chips
 * and Open beside (wide) or below (narrow) its illustration on a soft panel. Same scene as the tool's Home tile
 * (ToolIllustration), so each tool looks the same wherever it appears.
 */
export function ToolCard({ tool, onOpen }: ToolCardProps) {
  const titleId = `lx-tool-card-${tool.id}`;
  return (
    <article className="lx-tool-card" data-tool={tool.id} aria-labelledby={titleId} data-tool-card="">
      <div className="lx-tool-card__layout">
        <div className="lx-tool-card__stage" aria-hidden>
          <ToolIllustration toolId={tool.id} className="lx-tool-card__art" />
        </div>
        <div className="lx-tool-card__body">
          <div className="lx-tool-card__identity">
            <span className="lx-tool-card__glyph" aria-hidden>
              <LuxiaToolIcon toolId={tool.id} size={18} />
            </span>
            <h2 id={titleId} className="luxia-type-title-card min-w-0" style={{ color: HS.sectionHeading }}>
              {tool.name}
            </h2>
            {tool.status ? (
              <Badge
                variant="outline"
                className="min-h-0 h-auto px-2 py-0.5 luxia-type-caption font-normal"
                style={{ color: "var(--luxia-text-secondary)", borderColor: "var(--luxia-border-subtle)" }}
              >
                {STATUS_LABEL[tool.status]}
              </Badge>
            ) : null}
          </div>
          <p className="lx-tool-card__description luxia-type-body-dense">{tool.description}</p>
          <ToolHighlights tool={tool} />
          <div className="lx-tool-card__actions">
            <Button type="button" variant="primary" size="compact" onClick={() => onOpen(tool)} data-tool-open={tool.id}>
              Open {tool.name}
              <LuxiaArrowRightIcon size={13} color="currentColor" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
