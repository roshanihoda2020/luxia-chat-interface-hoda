import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import type { HomeConstellationSource } from "@/app/features/home/types";
import {
  VidgetChannelMetaIcon,
  VidgetSourceMetaIcon,
} from "@/app/features/vidgets/vidgetMetaIcons";
import {
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaSettingsIcon,
  LuxiaVirtualAssistantIcon,
} from "@/assets/icons";
import {
  DashboardOutputPreviewGraphic,
  outputTypeLabel,
} from "./DashboardOutputPreviews";
import type {
  ProjectDashboardOutput,
  ProjectOverviewChat,
  ProjectOverviewConstellation,
  ProjectWidgetItem,
} from "./types";
import { ProjectDomainMarker } from "./ProjectDomainMarker";
import {
  ProjectMetaText,
  ProjectModuleCard,
  ProjectModuleEmptyState,
  ProjectOutlineButton,
  ProjectPreviewRow,
  ProjectViewAllLink,
} from "./ProjectModuleShared";
import {
  buildProjectViewAllLabel,
  deriveProjectSummaryPreview,
} from "./projectOverviewPreview";

function sourceBadgeLabel(type: HomeConstellationSource): string {
  if (type === "pdf") return "PDF";
  if (type === "csv") return "CSV";
  return "Database";
}

function SourceBadge({ type }: { type: HomeConstellationSource }) {
  const variant = type === "database" ? "database" : type === "csv" ? "csv" : "pdf";
  return (
    <Badge
      variant={variant}
      className="min-h-0 h-[15px] px-1 py-0 luxia-type-badge"
    >
      {sourceBadgeLabel(type)}
    </Badge>
  );
}

export function ChatsModule({
  chats,
  onOpenChat,
  onViewAll,
  onNewChat,
}: {
  chats: ProjectOverviewChat[];
  onOpenChat: (chatId: string) => void;
  onViewAll?: () => void;
  onNewChat: () => void;
}) {
  const { total, preview } = deriveProjectSummaryPreview(chats, {
    getRecencyTimestamp: (chat) => chat.lastOpenedTimestamp,
  });
  const viewAllLabel = buildProjectViewAllLabel(total, {
    zeroLabel: "View all Chats",
    singular: "Chat",
    plural: "Chats",
  });

  return (
    <ProjectModuleCard
      icon={<LuxiaChatIcon size={20} aria-hidden color="currentColor" />}
      title="Chats"
      count={total}
      countLabel={total === 1 ? "Chat" : "Chats"}
      description="Continue conversations with Galaxy or individual Constellations."
      size="knowledge"
      surface="knowledge"
      marker={
        <ProjectDomainMarker
          tone="chat"
          icon={<LuxiaChatIcon size={20} aria-hidden color="currentColor" />}
        />
      }
      footer={
        <>
          <ProjectViewAllLink label={viewAllLabel} onClick={onViewAll} />
          <ProjectOutlineButton label="New Chat" onClick={onNewChat} />
        </>
      }
    >
      {preview.length === 0 ? (
        <ProjectModuleEmptyState
          title="No Chats available for your current access"
          description="Chats appear here when their Constellation is usable with your Data Source permissions."
          action={<ProjectOutlineButton label="New Chat" onClick={onNewChat} />}
        />
      ) : (
        <div className="flex flex-col">
          {preview.map((chat) => (
            <ProjectPreviewRow
              key={chat.id}
              icon={<LuxiaChatIcon size={18} aria-hidden color="currentColor" />}
              title={chat.label}
              ariaLabel={`Open ${chat.label}`}
              onClick={() => onOpenChat(chat.id)}
              meta={
                <>
                  {chat.chatSource === "galaxy" ? (
                    <ProjectMetaText>Galaxy</ProjectMetaText>
                  ) : (
                    <>
                      {chat.constellationName ? (
                        <ProjectMetaText>{chat.constellationName}</ProjectMetaText>
                      ) : null}
                      {chat.constellationSource ? (
                        <SourceBadge type={chat.constellationSource} />
                      ) : null}
                    </>
                  )}
                  <ProjectMetaText>{chat.lastOpenedAt}</ProjectMetaText>
                </>
              }
            />
          ))}
        </div>
      )}
    </ProjectModuleCard>
  );
}

export function ConstellationsModule({
  constellations,
  projectId,
  onOpenConstellation,
  onOpenConstellationSettings,
  onViewAll,
  onAddConstellation,
}: {
  constellations: ProjectOverviewConstellation[];
  projectId: string;
  onOpenConstellation: (projectId: string, constellationId: string) => void;
  onOpenConstellationSettings?: (projectId: string, constellationId: string) => void;
  onViewAll?: () => void;
  onAddConstellation?: () => void;
}) {
  const { total, preview } = deriveProjectSummaryPreview(constellations, {
    getRecencyTimestamp: (item) => item.updatedAtTimestamp,
  });
  const viewAllLabel = buildProjectViewAllLabel(total, {
    zeroLabel: "View all Constellations",
    singular: "Constellation",
    plural: "Constellations",
    alwaysShowCount: true,
  });

  function openConstellationSettings(constellationId: string) {
    (onOpenConstellationSettings ?? onOpenConstellation)(projectId, constellationId);
  }

  return (
    <ProjectModuleCard
      icon={<LuxiaConstellationIcon size={20} aria-hidden color="currentColor" />}
      title="Constellations"
      count={total}
      countLabel={total === 1 ? "Constellation" : "Constellations"}
      description="Focused knowledge environments built from connected Project data sources."
      size="knowledge"
      surface="knowledge"
      marker={
        <ProjectDomainMarker
          tone="constellation"
          icon={<LuxiaConstellationIcon size={20} aria-hidden color="currentColor" />}
        />
      }
      footer={
        <>
          <ProjectViewAllLink label={viewAllLabel} onClick={onViewAll} />
          {onAddConstellation ? (
            <ProjectOutlineButton label="Add Constellation" onClick={onAddConstellation} />
          ) : null}
        </>
      }
    >
      {preview.length === 0 ? (
        <ProjectModuleEmptyState
          title="No available Constellations"
          description="No Constellations are currently usable with your Data Source permissions."
          action={
            onAddConstellation ? (
              <ProjectOutlineButton label="Add Constellation" onClick={onAddConstellation} />
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col">
          {preview.map((item) => {
            const settingsLabel = `Open settings for ${item.label}`;
            return (
              <ProjectPreviewRow
                key={item.id}
                icon={<LuxiaConstellationIcon size={18} aria-hidden color="currentColor" />}
                title={item.label}
                ariaLabel={`Open ${item.label}`}
                onClick={() => onOpenConstellation(projectId, item.id)}
                showChevron={false}
                meta={
                  <ProjectMetaText>
                    {sourceBadgeLabel(item.type)} · {item.sourceCount}{" "}
                    {item.sourceCount === 1 ? "source" : "sources"}
                  </ProjectMetaText>
                }
                actions={
                  <Button
                    type="button"
                    variant="tertiary"
                    size="iconCompact"
                    aria-label={settingsLabel}
                    onClick={(event) => {
                      event.stopPropagation();
                      openConstellationSettings(item.id);
                    }}
                  >
                    <LuxiaSettingsIcon size={16} aria-hidden color="currentColor" />
                  </Button>
                }
              />
            );
          })}
        </div>
      )}
    </ProjectModuleCard>
  );
}

export function DashboardsModule({
  outputs,
  onOpenDashboard,
}: {
  outputs: ProjectDashboardOutput[];
  onOpenDashboard?: () => void;
}) {
  const preview = outputs.slice(0, 8);
  const lastUpdated = preview[0]?.updatedAt;

  return (
    <ProjectModuleCard
      icon={<LuxiaDashboardIcon size={20} aria-hidden color="currentColor" />}
      title="Dashboard"
      count={outputs.length}
      countLabel={outputs.length === 1 ? "saved output" : "saved outputs"}
      description="Saved charts, tables, reports, metrics, and analyses from Project conversations."
      headingColor="var(--luxia-blue-70)"
      iconColor="var(--luxia-blue-60)"
      size="output"
      surface="output"
      marker={
        <ProjectDomainMarker
          tone="dashboard"
          icon={<LuxiaDashboardIcon size={20} aria-hidden color="currentColor" />}
        />
      }
      footer={
        <>
          <ProjectViewAllLink label="Open Dashboard" onClick={onOpenDashboard} />
          <span />
        </>
      }
    >
      {preview.length === 0 ? (
        <ProjectModuleEmptyState
          title="No saved outputs yet"
          description="Charts, tables, and reports saved from conversations will appear here."
        />
      ) : (
        <div className="flex min-w-0 flex-col gap-3">
          {lastUpdated ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-neutral-600, #475569)" }}>
              Last updated {lastUpdated}
            </p>
          ) : null}

          <div className="grid min-w-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {preview.map((item) => (
              <article
                key={item.id}
                className="flex min-w-0 flex-col rounded-[10px] p-2"
                style={{
                  background: "color-mix(in srgb, var(--luxia-surface) 72%, transparent)",
                  border:
                    "1px solid color-mix(in srgb, var(--luxia-blue-20) 45%, var(--luxia-neutral-200))",
                }}
                aria-label={`${item.name}, ${outputTypeLabel(item.outputType)}, from ${item.sourceContext}, updated ${item.updatedAt}`}
              >
                <DashboardOutputPreviewGraphic variant={item.outputType} />
                <div className="mt-2 flex min-w-0 flex-1 flex-col gap-0.5 px-0.5">
                  <p
                    className="truncate luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {item.name}
                  </p>
                  <p
                    className="truncate luxia-type-caption"
                    style={{ color: "var(--luxia-neutral-600, #475569)" }}
                  >
                    {outputTypeLabel(item.outputType)} · {item.sourceContext}
                  </p>
                  <p
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-neutral-500, #64748B)" }}
                  >
                    Updated {item.updatedAt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </ProjectModuleCard>
  );
}

export function WidgetsModule({
  widgets,
  onViewAll,
  onCreateVidget,
  onOpen,
}: {
  widgets: ProjectWidgetItem[];
  onViewAll?: () => void;
  onCreateVidget?: () => void;
  onOpen?: (id: string) => void;
}) {
  const preview = widgets.slice(0, 3);
  return (
    <ProjectModuleCard
      icon={<LuxiaVirtualAssistantIcon size={20} aria-hidden color="currentColor" />}
      title="Vidgets"
      count={widgets.length}
      countLabel={widgets.length === 1 ? "Vidget" : "Vidgets"}
      description="Configure and deploy a Vidget from Galaxy or a Constellation across websites, embeds, kiosks, and totems."
      iconColor="var(--luxia-purple-60)"
      size="supporting"
      surface="assistant"
      marker={
        <ProjectDomainMarker
          tone="virtual-assistant"
          icon={<LuxiaVirtualAssistantIcon size={20} aria-hidden color="currentColor" />}
        />
      }
      footer={
        <>
          <ProjectViewAllLink label="View all Vidgets" onClick={onViewAll} />
          {onCreateVidget ? (
            <ProjectOutlineButton label="Create Vidget" onClick={onCreateVidget} />
          ) : null}
        </>
      }
    >
      {preview.length === 0 ? (
        <ProjectModuleEmptyState
          title="No Vidgets yet"
          description="External AI experiences for this Project will appear here when available."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {preview.map((item) => (
            <ProjectPreviewRow
              key={item.id}
              icon={<LuxiaVirtualAssistantIcon size={18} aria-hidden color="currentColor" />}
              title={item.name}
              ariaLabel={item.name}
              onClick={onOpen ? () => onOpen(item.id) : undefined}
              meta={
                <>
                  <span
                    className="inline-flex items-center gap-1.5 luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    <VidgetChannelMetaIcon channel={item.channel} />
                    <span>{item.channelLabel}</span>
                  </span>
                  <ProjectMetaText>·</ProjectMetaText>
                  <span
                    className="inline-flex items-center gap-1.5 luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    <VidgetSourceMetaIcon sourceType={item.sourceType} />
                    <span>{item.sourceLabel}</span>
                  </span>
                  <ProjectMetaText>·</ProjectMetaText>
                  <ProjectMetaText>{item.statusLabel}</ProjectMetaText>
                </>
              }
            />
          ))}
        </div>
      )}
    </ProjectModuleCard>
  );
}

/** @deprecated Use WidgetsModule — kept for unfinished library browse surfaces. */
export const VirtualAssistantsModule = WidgetsModule;
