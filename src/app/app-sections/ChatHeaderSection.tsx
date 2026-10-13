import { useState } from "react";
import { Share2, List, FileBarChart2, Trash2 } from "lucide-react";
import { LuxiaSettingsIcon } from "@/assets/icons";
import {
  LuxiaBreadcrumb,
  buildChatBreadcrumbItems,
  buildGalaxyBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageHeader, LuxiaPageHeaderShell, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { Button } from "@/app/components/ui/button";
import { LX } from "@/app/features/active-data-tables/tokens";
import type { Chat } from "./appSectionShared";
import {
  ShareDialog,
  ShareListDialog,
  GenerateReportDialog,
  DeleteChatDialog,
} from "./ChatDialogs";

export function PageHeader({
  chatLabel,
  chat,
  projectName,
  constellationLabel,
  constellationId,
  onNavigateHome,
  onOpenProject,
  onOpenConstellation,
  onRenameChat,
  onDeleteChat,
  onOpenGalaxySettings,
  onOpenConstellationSettings,
  tabs,
}: {
  chatLabel: string;
  chat: Chat;
  projectName: string;
  constellationLabel?: string;
  constellationId?: string;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenConstellation?: (projectId: string, constellationId: string) => void;
  onRenameChat: (name: string) => void;
  onDeleteChat: () => void;
  onOpenGalaxySettings?: () => void;
  onOpenConstellationSettings?: () => void;
  tabs?: React.ReactNode;
}) {
  const isGalaxy = chat.chatType === "galaxy";
  const isConstellation = chat.chatType === "constellation";
  const entityType = isGalaxy ? "Galaxy" : "Chat";
  const pageTypeLabel = isGalaxy ? "GALAXY" : "CHAT";
  const headerTitle = chatLabel;

  const crumbItems = isGalaxy
    ? buildGalaxyBreadcrumbItems({
      projectId: chat.projectId,
      projectName,
      galaxyId: chat.id,
      galaxyName: chatLabel,
    })
    : buildChatBreadcrumbItems({
      projectId: chat.projectId,
      projectName,
      constellationId: constellationId,
      constellationName: constellationLabel
        ?? (chat.constellationId ? "Constellation" : undefined),
      chatId: chat.id,
      chatLabel,
    });

  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [dialog, setDialog] = useState<"share" | "shareList" | "report" | "delete" | null>(null);

  const chatOptionsItems = [
    {
      id: "share",
      label: "Share",
      icon: <Share2 size={15} strokeWidth={1.8} aria-hidden />,
      onSelect: () => setDialog("share"),
    },
    {
      id: "share-list",
      label: "Share List",
      icon: <List size={15} strokeWidth={1.8} aria-hidden />,
      onSelect: () => setDialog("shareList"),
    },
    {
      id: "report",
      label: "Generate report",
      icon: <FileBarChart2 size={15} strokeWidth={1.8} aria-hidden />,
      onSelect: () => setDialog("report"),
    },
    {
      id: "delete",
      label: "Delete Chat",
      icon: <Trash2 size={15} strokeWidth={1.8} aria-hidden />,
      onSelect: () => setDialog("delete"),
      destructive: true,
      separatorBefore: true,
    },
  ];

  return (
    <>
    <LuxiaPageHeaderShell
      trailing={tabs}
      style={isGalaxy ? {
        background: "#FAFAFC",
        borderBottom: "1px solid #E8EAF2",
      } : undefined}
    >
      <LuxiaPageHeader
        contentGap="none"
        pageTypeLabel={pageTypeLabel}
        title={headerTitle}
        titleStyle={{ color: LX.primary }}
        onRename={onRenameChat}
        renameLabel={`Rename ${headerTitle}`}
        breadcrumb={
          <LuxiaBreadcrumb
            items={crumbItems}
            tone="chat"
            handlers={{
              onHome: onNavigateHome,
              onProject: onOpenProject,
              onConstellation: onOpenConstellation,
            }}
          />
        }
        secondaryAction={
          isGalaxy && onOpenGalaxySettings ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.settings}
              onClick={onOpenGalaxySettings}
              aria-label="Galaxy Settings"
            >
              <LuxiaSettingsIcon size={16} aria-hidden color="currentColor" />
              Galaxy Settings
            </Button>
          ) : isConstellation && onOpenConstellationSettings ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.settings}
              onClick={onOpenConstellationSettings}
              aria-label="Constellation Settings"
            >
              <LuxiaSettingsIcon size={16} aria-hidden color="currentColor" />
              Constellation Settings
            </Button>
          ) : null
        }
        options={
          isGalaxy ? null : (
            <LuxiaEntityOptionsMenu
              entityType={entityType}
              entityLabel={chatLabel}
              ariaLabel="Chat options"
              triggerVariant={LUXIA_PAGE_HEADER_ACTION.menuTrigger}
              items={chatOptionsItems}
            />
          )
        }
      />
    </LuxiaPageHeaderShell>

      {!isGalaxy ? (
        <>
          <ShareDialog open={dialog === "share"} chatLabel={chatLabel} sharedUsers={sharedUsers} onClose={() => setDialog(null)} onShare={(ids) => setSharedUsers(ids)} />
          <ShareListDialog open={dialog === "shareList"} sharedUsers={sharedUsers} onClose={() => setDialog(null)} />
          <GenerateReportDialog open={dialog === "report"} onClose={() => setDialog(null)} />
          <DeleteChatDialog
            open={dialog === "delete"}
            entityName={chatLabel}
            entityType="Chat"
            onClose={() => setDialog(null)}
            onDelete={onDeleteChat}
          />
        </>
      ) : null}
    </>
  );
}
