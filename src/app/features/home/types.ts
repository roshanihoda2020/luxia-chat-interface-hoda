export type HomeHeroKind = "galaxySession" | "chat" | "project" | "empty";
export type HomeConstellationSource = "database" | "csv" | "pdf";

import type { HomeEntityKey } from "./homeEntityKeys";
import type { HomePrimaryPreference } from "./homePrimaryPreference";
import type { HomeProjectCard, ProjectDestination } from "@/app/features/project/types";
import type { DataSourceContentSummary } from "@/app/features/permissions/types";
import type { VidgetRecord } from "@/app/features/vidgets/types";

export type { HomeProjectCard, ProjectDestination };

export type HomeShortcutEntityType = "project" | "chat" | "galaxy-conversation";
export type HomeShortcutSourceType = "database" | "pdf" | "mixed" | "unknown";

export interface HomeShortcutRef {
  shortcutId: string;
  entityType: HomeShortcutEntityType;
  entityId: string;
  projectId: string;
  chatId?: string;
  conversationId?: string;
  constellationId?: string;
  sourceType?: HomeShortcutSourceType;
  activeTabId?: string;
  roleId?: string;
  shortcutKey?: string;
}

export interface HomeRecentWorkItem {
  id: string;
  title: string;
  kind: "galaxySession" | "chat";
  projectId: string;
  projectName?: string;
  chatId: string;
  conversationId: string;
  constellationId?: string;
  constellationName?: string;
  constellationSource?: HomeConstellationSource;
  constellationDescription?: string;
  projectDescription?: string;
  isPrototype?: boolean;
  mode?: "auto" | "specific";
  role?: string;
  updatedAt: string;
  lastOpenedAt?: number;
  latestPreview?: string;
  isPinned?: boolean;
}

export interface HomeHeroContent {
  kind: HomeHeroKind;
  title: string;
  context: string;
  meta?: string;
  selectedByYou?: boolean;
  preview?: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  chatId?: string;
  conversationId?: string;
  workItemId?: string;
  mode?: "auto" | "specific";
  constellationId?: string;
  constellationName?: string;
  constellationSource?: HomeConstellationSource;
  canSaveAsChat?: boolean;
  isPinned?: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
  secondaryAction?: "openProject" | "openGalaxy" | "saveAsChat" | "newProject" | "viewYourWork";
  emptyReason?: "none" | "allHidden";
}

export type HomeBrowseMode = "overview" | "your-work" | "projects";

export interface HomePageProps {
  /** Prototype user whose saved Home Layout is shown. */
  homeLayoutUserId: string;
  projects: HomeProjectCard[];
  recentWork: HomeRecentWorkItem[];
  pinnedProjectIds: string[];
  pinnedEntityOrder: HomeEntityKey[];
  primaryPreference: HomePrimaryPreference;
  dismissedContinueKeys: HomeEntityKey[];
  browseMode: HomeBrowseMode;
  onBrowseModeChange: (mode: HomeBrowseMode) => void;
  onPrimaryPreferenceChange: (preference: HomePrimaryPreference) => void;
  onDismissFromContinue: (entityKey: HomeEntityKey) => void;
  onRestoreToContinue: (entityKey: HomeEntityKey) => void;
  onSetPrimaryHero: (entityKey: HomeEntityKey) => void;
  onShowAllOnHome: () => void;
  onToggleProjectPin: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onRestoreProject?: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  canEditProject?: (projectId: string) => boolean;
  canArchiveProject?: (projectId: string) => boolean;
  canDeleteProject?: (projectId: string) => boolean;
  canRestoreProject?: (projectId: string) => boolean;
  onToggleWorkPin: (itemId: string) => void;
  onContinueWork: (item: HomeRecentWorkItem) => void;
  onOpenShortcut?: (shortcut: HomeShortcutRef) => void;
  onOpenProject: (projectId: string) => void;
  onOpenGalaxy: (projectId: string) => void;
  onOpenChat: (chatId: string) => void;
  onOpenConstellation?: (projectId: string, constellationId: string) => void;
  onNewChat: () => void;
  /** New Chat flow with the Project already chosen (Constellation or Galaxy is picked there). */
  /** Opens New Chat scoped to the Project; a question typed on Home is carried into the new Chat. */
  onNewChatInProject?: (projectId: string, question?: string) => void;
  onNewProject: () => void;
  /** Every Vidget in the prototype; Home lists only those in Projects the user manages or reviews. */
  homeVidgets?: readonly VidgetRecord[];
  onOpenProjectVidgets?: (projectId: string) => void;
  searchConstellations?: Array<{
    id: string;
    label: string;
    projectId: string;
    type: "database" | "csv" | "pdf";
    /** The Constellation's own description (Home Tiles). */
    description?: string;
    /** Data Sources it draws on (Home Tiles). */
    sourceCount?: number;
  }>;
  onNavigateProjectDestination?: (
    destination: ProjectDestination,
    projectId: string,
  ) => void;
  /** Data Sources the current user can already access (Home Tile Library). */
  homeTileDataSources?: Array<{
    id: string;
    name: string;
    typeLabel: string;
    ownership?: "organizational" | "private";
    status?: string;
    connector?: string;
    /** Non-secret content snapshot (tables, files, database), summarised on Home Tiles. */
    contentSummary?: DataSourceContentSummary;
    /** The current user's access, as the Data Sources library words it (Owner / Manage / Use / View). */
    myAccess?: string;
    /** Constellations the current user can access that use this source (never the inaccessible ones). */
    visibleConstellationCount?: number;
  }>;
  onOpenDataSource?: (dataSourceId: string) => void;
  /** Opens the Data Sources library. */
  onOpenDataSources?: () => void;
  /** Opens Explore Luxia: What's New, or one update's page within it. */
  onOpenExplore?: (section?: "whats-new", updateId?: string) => void;
  /** Opens one named Dashboard in its Project (Project › Dashboards › name). */
  onOpenDashboard?: (projectId: string, dashboardId: string) => void;
  /** Opens a Project's Dashboards page (Project › Dashboards). */
  onOpenProjectDashboards?: (projectId: string) => void;
  onOpenTool?: (toolId: string) => void;
}
