export type HomeHeroKind = "galaxySession" | "chat" | "project" | "empty";
export type HomeConstellationSource = "database" | "csv" | "pdf";

import type { HomeEntityKey } from "./homeEntityKeys";
import type { HomePrimaryPreference } from "./homePrimaryPreference";
import type { HomeProjectCard, ProjectDestination } from "@/app/features/project/types";

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
  /**
   * Legacy optional field only — ignored for display when present.
   * Resolve visible names via `getProjectNameById(projectId)`.
   */
  projectName?: string;
  chatId: string;
  conversationId: string;
  constellationId?: string;
  constellationName?: string;
  constellationSource?: HomeConstellationSource;
  /** Active constellation description (Chat), resolved by constellation ID. */
  constellationDescription?: string;
  /** Project description (Galaxy), resolved by project ID. */
  projectDescription?: string;
  /** Neutral mock/demo entity — shows reserved description placeholder. */
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
  /** Contextual description beneath the entity name (clamped to 2 lines). */
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
  projects: HomeProjectCard[];
  recentWork: HomeRecentWorkItem[];
  pinnedProjectIds: string[];
  pinnedEntityOrder: HomeEntityKey[];
  primaryPreference: HomePrimaryPreference;
  dismissedContinueKeys: HomeEntityKey[];
  /** Controlled Home surface: overview | your-work | projects */
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
  onToggleWorkPin: (itemId: string) => void;
  onContinueWork: (item: HomeRecentWorkItem) => void;
  onOpenShortcut?: (shortcut: HomeShortcutRef) => void;
  onOpenProject: (projectId: string) => void;
  onOpenGalaxy: (projectId: string) => void;
  onOpenChat: (chatId: string) => void;
  onOpenConstellation?: (projectId: string, constellationId: string) => void;
  onNewChat: () => void;
  onNewProject: () => void;
  /** Canonical Constellation catalog for Home search (stable IDs). */
  searchConstellations?: Array<{
    id: string;
    label: string;
    projectId: string;
    type: "database" | "csv" | "pdf";
  }>;
  onNavigateProjectDestination?: (
    destination: ProjectDestination,
    projectId: string,
  ) => void;
}
