import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { getHomeCardStyle, HS } from "@/app/features/home/homeSurfaces";
import { LuxiaWritingAssistantIcon } from "@/assets/icons";
import type { LuxiaToolDefinition, LuxiaToolId, LuxiaToolStatus } from "./types";

const STATUS_LABEL: Record<LuxiaToolStatus, string> = {
  beta: "Beta",
  available: "Available",
};

function ToolIcon({ toolId }: { toolId: LuxiaToolId }) {
  if (toolId === "writing-assistant") {
    return (
      <LuxiaWritingAssistantIcon
        size={20}
        color="currentColor"
        accentColor="var(--luxia-purple-50)"
        aria-hidden
      />
    );
  }
  return null;
}

type ToolCardProps = {
  tool: LuxiaToolDefinition;
  onOpen: (tool: LuxiaToolDefinition) => void;
};

export function ToolCard({ tool, onOpen }: ToolCardProps) {
  const card = getHomeCardStyle("supportingProject");

  return (
    <article
      className="flex h-full min-w-0 flex-col rounded-[var(--luxia-radius-16)] border p-5 transition-[background,border-color]"
      style={{
        background: card.bg,
        borderColor: card.border,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = card.hover;
        event.currentTarget.style.borderColor = card.hoverBorder;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = card.bg;
        event.currentTarget.style.borderColor = card.border;
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{
            color: "var(--luxia-purple-60)",
            background: "var(--luxia-opacity-purple-08)",
          }}
          aria-hidden
        >
          <ToolIcon toolId={tool.id} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className="luxia-type-title-card min-w-0"
              style={{ color: HS.sectionHeading }}
            >
              {tool.name}
            </h2>
            {tool.status ? (
              <Badge
                variant="outline"
                className="min-h-0 h-auto px-2 py-0.5 luxia-type-caption font-normal"
                style={{
                  color: "var(--luxia-text-secondary)",
                  borderColor: "var(--luxia-border-subtle)",
                  background: "var(--luxia-neutral-surface-subtle, transparent)",
                }}
              >
                {STATUS_LABEL[tool.status]}
              </Badge>
            ) : null}
          </div>
          <p
            className="mt-2 luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            {tool.description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          {...LUXIA_PAGE_HEADER_ACTION.primary}
          onClick={() => onOpen(tool)}
        >
          Open
        </Button>
      </div>
    </article>
  );
}
