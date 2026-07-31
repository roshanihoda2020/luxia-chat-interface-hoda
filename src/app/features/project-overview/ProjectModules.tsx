import { Badge } from "@/app/components/ui/badge";
import type { HomeConstellationSource } from "@/app/features/home/types";
import {
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaVirtualAssistantIcon,
} from "@/assets/icons";
import type {
  ProjectDashboardItem,
  ProjectOverviewChat,
  ProjectOverviewConstellation,
  ProjectVirtualAssistantItem,
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

function sourceBadgeLabel(type: HomeConstellationSource): string {
  if (type === "pdf") return "PDF";
  if (type === "csv") return "CSV";
  return "DB";
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
  /** Chats archive is not designed yet — omit to keep View all static. */
  onViewAll?: () => void;
  onNewChat: () => void;
}) {
  const preview = chats.slice(0, 3);
  return (
    <ProjectModuleCard
      icon={<LuxiaChatIcon size={19} aria-hidden color="currentColor" />}
      title="Chats"
      count={chats.length}
      countLabel={chats.length === 1 ? "Chat" : "Chats"}
      description="Ask questions using one Constellation at a time. Responses and sources remain available in that Chat’s history. Verified answers may be retained in the Constellation Knowledge Base for controlled reuse."
      size="primary"
      surface="interaction"
      marker={
        <ProjectDomainMarker
          tone="chat"
          icon={<LuxiaChatIcon size={20} aria-hidden color="currentColor" />}
        />
      }
      footer={
        <>
          <ProjectViewAllLink label="View all Chats" onClick={onViewAll} />
          <ProjectOutlineButton label="New Chat" onClick={onNewChat} />
        </>
      }
    >
      {preview.length === 0 ? (
        <ProjectModuleEmptyState
          title="No Chats yet"
          description="Start a Chat from one of this Project’s Constellations."
          action={<ProjectOutlineButton label="New Chat" onClick={onNewChat} />}
        />
      ) : (
        <div className="flex flex-col">
          {preview.map((chat) => (
            <ProjectPreviewRow
              key={chat.id}
              icon={<LuxiaChatIcon size={16} aria-hidden color="currentColor" />}
              title={chat.label}
              ariaLabel={`Open ${chat.label}`}
              onClick={() => onOpenChat(chat.id)}
              meta={
                <>
                  {chat.constellationName ? (
                    <ProjectMetaText>{chat.constellationName}</ProjectMetaText>
                  ) : null}
                  {chat.constellationSource ? (
                    <SourceBadge type={chat.constellationSource} />
                  ) : null}
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
}: {
  constellations: ProjectOverviewConstellation[];
}) {
  const preview = constellations.slice(0, 3);
  return (
    <ProjectModuleCard
      icon={<LuxiaConstellationIcon size={19} aria-hidden color="currentColor" />}
      title="Constellations"
      count={constellations.length}
      countLabel={constellations.length === 1 ? "Constellation" : "Constellations"}
      description="Organize selected Database, CSV, or PDF sources into focused knowledge environments used by Chat and Galaxy. Sources are managed separately and can be connected to a Constellation later."
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
          <ProjectViewAllLink label="View all Constellations" />
          <ProjectOutlineButton label="Add Constellation" />
        </>
      }
    >
      {preview.length === 0 ? (
        <ProjectModuleEmptyState
          title="No Constellations yet"
          description="Add a Database, CSV, or PDF Constellation to begin."
          action={<ProjectOutlineButton label="Add Constellation" />}
        />
      ) : (
        <div className="flex flex-col">
          {preview.map((item) => (
            <ProjectPreviewRow
              key={item.id}
              icon={<LuxiaConstellationIcon size={16} aria-hidden color="currentColor" />}
              title={item.label}
              ariaLabel={item.label}
              meta={
                <>
                  <SourceBadge type={item.type} />
                  <ProjectMetaText>
                    {item.sourceCount} {item.sourceCount === 1 ? "source" : "sources"}
                  </ProjectMetaText>
                </>
              }
            />
          ))}
        </div>
      )}
    </ProjectModuleCard>
  );
}

export function DashboardsModule({
  dashboards,
}: {
  dashboards: ProjectDashboardItem[];
}) {
  const preview = dashboards.slice(0, 3);
  return (
    <ProjectModuleCard
      icon={<LuxiaDashboardIcon size={19} aria-hidden color="currentColor" />}
      title="Dashboards"
      count={dashboards.length}
      countLabel={dashboards.length === 1 ? "Dashboard" : "Dashboards"}
      description="Collect charts, tables, metrics, and selected analyses explicitly saved from Chats."
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
          <ProjectViewAllLink label="View all Dashboards" />
          <ProjectOutlineButton label="New Dashboard" />
        </>
      }
    >
      {preview.length === 0 ? (
        <ProjectModuleEmptyState
          title="No Dashboards yet"
          description="Create a Dashboard for this Project."
          action={<ProjectOutlineButton label="New Dashboard" />}
        />
      ) : (
        <div className="flex flex-col">
          {preview.map((item) => (
            <ProjectPreviewRow
              key={item.id}
              icon={<LuxiaDashboardIcon size={16} aria-hidden color="currentColor" />}
              title={item.name}
              ariaLabel={item.name}
              iconColor="var(--luxia-blue-60)"
              meta={<ProjectMetaText>Updated {item.updatedAt}</ProjectMetaText>}
            />
          ))}
        </div>
      )}
    </ProjectModuleCard>
  );
}

export function VirtualAssistantsModule({
  assistants,
}: {
  assistants: ProjectVirtualAssistantItem[];
}) {
  const preview = assistants.slice(0, 3);
  return (
    <ProjectModuleCard
      icon={<LuxiaVirtualAssistantIcon size={19} aria-hidden color="currentColor" />}
      title="Virtual Assistant"
      count={assistants.length}
      countLabel={assistants.length === 1 ? "Virtual Assistant" : "Virtual Assistants"}
      description="Provide a reusable way for selected users or audiences to interact with approved Project knowledge."
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
          <ProjectViewAllLink label="View all Virtual Assistants" />
          <span />
        </>
      }
    >
      {preview.length === 0 ? (
        <ProjectModuleEmptyState
          title="No Virtual Assistants yet"
          description="Virtual Assistants for this Project will appear here when available."
        />
      ) : (
        <div className="flex flex-col">
          {preview.map((item) => (
            <ProjectPreviewRow
              key={item.id}
              icon={<LuxiaVirtualAssistantIcon size={16} aria-hidden color="currentColor" />}
              title={item.name}
              ariaLabel={item.name}
              meta={item.channel ? <ProjectMetaText>{item.channel}</ProjectMetaText> : undefined}
            />
          ))}
        </div>
      )}
    </ProjectModuleCard>
  );
}
