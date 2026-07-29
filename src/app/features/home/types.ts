export type HomeHeroKind = "galaxySession" | "chat" | "project" | "empty";
export type HomeConstellationSource = "database" | "pdf";

import type { HomeEntityKey } from "./homeEntityKeys";
import type { HomePrimaryPreference } from "./homePrimaryPreference";

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
  projectName: string;
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

export interface HomeProjectCard {
  id: string;
  name: string;
  /** Single Project-level Galaxy ID (exactly one per Project). */
  galaxyId: string;
  constellationCount: number;
  /** Project-level source total when available; omit from meta when undefined. */
  sourceCount?: number;
  memberCount: number;
  /** Visible relative label (e.g. "2h ago"). */
  updatedAt: string;
  /** Sortable absolute timestamp for ranking. */
  updatedAtTimestamp: number;
  isPinned: boolean;
  isFeatured: boolean;
  isEmpty: boolean;
  recentPreview?: string;
  description?: string;
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
  onToggleWorkPin: (itemId: string) => void;
  onContinueWork: (item: HomeRecentWorkItem) => void;
  onOpenShortcut?: (shortcut: HomeShortcutRef) => void;
  onOpenProject: (projectId: string) => void;
  onOpenGalaxy: (projectId: string) => void;
  onOpenChat: (chatId: string) => void;
  onNewChat: () => void;
  onNewProject: () => void;
  onNavigateProjectDestination?: (
    destination: ProjectDestination,
    projectId: string,
  ) => void;
}

export type ProjectDestination = "galaxy" | "constellations" | "openProject";
