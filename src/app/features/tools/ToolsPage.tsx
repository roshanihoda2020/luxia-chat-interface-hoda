import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageBody, LuxiaPageFrame } from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { HS } from "@/app/features/home/homeSurfaces";
import { LUXIA_TOOLS } from "./data";
import { ToolCard } from "./ToolCard";
import type { LuxiaToolDefinition } from "./types";

const PAGE_GUIDANCE =
  "Explore specialized AI workspaces to create, review, and work with documents.";

type ToolsPageProps = {
  onNavigateHome: () => void;
  onOpenTool: (tool: LuxiaToolDefinition) => void;
};

export function ToolsPage({ onNavigateHome, onOpenTool }: ToolsPageProps) {
  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "tools",
      label: "Tools",
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
  };

  return (
    <LuxiaPageFrame variant="standard">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="APPLICATION"
        title="Tools"
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={PAGE_GUIDANCE}
        guideIcon={false}
      />

      <LuxiaPageBody>
        {/* Showcase cards: two per row from tablet width, one per row below. */}
        <div className="grid max-w-[68rem] grid-cols-1 gap-5 md:grid-cols-2" data-tools-grid="">

          {LUXIA_TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onOpen={onOpenTool} />
          ))}
        </div>
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
