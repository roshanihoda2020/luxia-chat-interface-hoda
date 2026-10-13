import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import flagUs from "@/assets/flags/us.svg";
import flagIt from "@/assets/flags/it.svg";
import flagSa from "@/assets/flags/sa.svg";
import flagFr from "@/assets/flags/fr.svg";
import flagDe from "@/assets/flags/de.svg";
import flagEs from "@/assets/flags/es.svg";
import flagCn from "@/assets/flags/cn.svg";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import {
  LoginPage,
  MfaInAppNudge,
  InAppMfaSetupHost,
  bootstrapPrototypeSignedIn,
  clearPrototypeSignedIn,
  consumePendingMfaNudge,
  findPrototypeAccount,
  readAuthLocationEntry,
  snoozeMfaNudge,
  writePrototypeSignedIn,
} from "@/app/features/login";
import {
  runWithUnsavedNavigationGuard,
  type UnsavedNavigationGuard,
} from "@/app/features/shared/unsavedNavigationGuard";
import { ActiveDataTablesSection } from "@/app/features/active-data-tables/ActiveDataTablesSection";
import type { DataTableRecord } from "@/app/features/active-data-tables/types";
import { ExtraContextFilesSection } from "@/app/features/extra-context-files/ExtraContextFilesSection";
import type { ExtraContextFile } from "@/app/features/extra-context-files/types";
import { InstructionSection } from "@/app/features/instruction/InstructionSection";
import {
  KnowledgeBaseSection,
  type KnowledgeBaseEntry,
} from "@/app/features/knowledge-base";
import { DataViewsSection } from "@/app/features/data-views";
import { MetricsSection } from "@/app/features/metrics/MetricsSection";
import type { MetricRecord } from "@/app/features/metrics/types";
import { PDFFilesSection } from "@/app/features/pdf-files/PDFFilesSection";
import type { PDFFileRecord } from "@/app/features/pdf-files/types";
import { CrawlerSection } from "@/app/features/crawler/CrawlerSection";
import type { CrawlerState } from "@/app/features/crawler/types";
import { RelationshipSection } from "@/app/features/relationship/RelationshipSection";
import type { RelationshipRecord } from "@/app/features/relationship/types";
import {
  GalaxyActivityPanel,
  GalaxyCollapsedRail,
  GalaxyEmptyState,
  GalaxyRouteSelector,
  GALAXY_COLLAPSED_WIDTH,
  GALAXY_DEFAULT_INSTRUCTION,
  GALAXY_PANEL_OUTER_GAP,
  buildGalaxyRouteCatalog,
  createIdleGalaxySession,
  type GalaxyMatchedConstellation,
  type GalaxyRoutingMeta,
  type GalaxyRoutingPhase,
  type GalaxySessionState,
} from "@/app/features/galaxy";
import {
  HomePage,
  HomePageShell,
  NewProjectModal,
  HOME_PROJECTS,
  HOME_RECENT_WORK,
  HERO_DESCRIPTION_PLACEHOLDER,
  getChatEntityKey,
  getGalaxyEntityKey,
  getProjectPath,
  getGalaxyPath,
  getGalaxySettingsPath,
  getDashboardPath,
  getChatPath,
  getConstellationChatPath,
  getConstellationsPath,
  getProjectChatsPath,
  getProjectActivityPath,
  getConstellationCreatePath,
  getConstellationSettingsPath,
  getConstellationSettingsCapabilityPath,
  getProjectMembersPath,
  getProjectVidgetsPath,
  getProjectPipelinesPath,
  getPipelinePath,
  getPipelineRunPath,
  getVidgetSettingsPath,
  getVidgetInboxPath,
  getAccessLevelsPath,
  getAccessLevelPath,
  getOrganizationUsersPath,
  getOrganizationUserPath,
  getDataSourcesPath,
  getDataSourceSettingsPath,
  getAdminPipelinesPath,
  isHomePath,
  resolveLuxiaPathname,
  homePrimaryPreferencesEqual,
  normalizeHomePrimaryPreference,
  parseEntityKey,
  readDismissedContinueKeys,
  readHomePrimaryPreference,
  readPinnedEntityOrder,
  readPinnedProjectIds,
  togglePinnedEntityKey,
  togglePinnedProjectId,
  workItemEntityKey,
  writeDismissedContinueKeys,
  writeHomePrimaryPreference,
  writePinnedEntityOrder,
  writePinnedProjectIds,
} from "@/app/features/home";
import type { HomeBrowseMode, HomeProjectCard, HomeRecentWorkItem } from "@/app/features/home";
import { getProjectNameById, ProjectManageDialogs, deriveProjectEntityCounts, filterActiveProjects } from "@/app/features/project";
import type { ProjectManageMode, ProjectConstellationSourceEntry } from "@/app/features/project";
import {
  ConstellationSettingsPage,
  ConstellationCapabilityManagePage,
  ConstellationCreatePage,
  CONSTELLATION_SETTINGS_RECORDS,
  buildSettingsForConstellation,
  buildConnectedSourceFromCreationDraft,
  buildCapabilityBundleFromCreationDraft,
  getReviewReadiness,
  cloneConstellationSettingsRecord,
  getConstellationSettingsRecord,
  createSeedCapabilityBundle,
  cloneCapabilityBundle,
  normalizeCapabilityBundle,
  summarizeCapabilityBundle,
  buildLocalConstellationDuplicate,
  commitDuplicateResponseConfidence,
  type ConstellationSettingsRecord,
  type ConstellationSettingsDraft,
  type ConstellationSettingsSectionId,
  type ConnectedDataSource,
  type ConstellationCapabilityBundle,
  type ConstellationCreationDraft,
  type ConstellationCreateNavigationGuard,
  constellationSettingsSectionToTab,
  parseConstellationSettingsTabFromSearch,
} from "@/app/features/constellation-settings";
import {
  GalaxySettingsPage,
  GALAXY_CONFIGURE_DENIED_MESSAGE,
  GALAXY_MANUAL_ROUTE_REQUIRED_MESSAGE,
  buildGalaxyConstellationRoutingItems,
  buildGalaxySettingsRecord,
  cloneGalaxySettingsRecord,
  galaxySettingsSectionToTab,
  parseGalaxySettingsTabFromSearch,
  type GalaxySettingsDraft,
  type GalaxySettingsRecord,
  type GalaxySettingsSectionId,
} from "@/app/features/galaxy-settings";
import {
  DataSourcesPage,
  NewDataSourceFlow,
  CreateConstellationFromDataSourceDialog,
  ConnectDataSourceToConstellationDialog,
  listProjectsWhereUserCanCreateConstellation,
  listConstellationsUserCanConfigure,
} from "@/app/features/data-sources";
import { commitDataSourceTagBucket, type DataSourceTagBucket } from "@/app/features/document-tags";
import {
  LuxiaSettingsDialog,
  organizationSettingsSectionToAccountSection,
  parseOrganizationSettingsTabFromSearch,
  parsePersonalSettingsTabFromSearch,
  personalSettingsSectionToAccountSection,
  type AccountSettingsSectionId,
} from "@/app/features/settings";
import { Toaster, toast } from "sonner";
import {
  CAPSULE_CAPABILITY_ICON,
  CAPSULE_CAPABILITY_PATH,
  capabilityIdFromPath,
  capsuleCapabilitiesForType,
  isCapsuleCapabilityAllowed,
  CANONICAL_CONSTELLATIONS,
  getCanonicalConstellationById,
  getConstellationSourceCount,
  type CapsuleCapabilityId,
} from "@/app/features/constellation";
import {
  AccessLevelsPage,
  AccessLevelEditorPage,
  OrganizationUsersPage,
  OrganizationUserDetailPage,
  InviteOrganizationUserDialog,
  ProjectMembersPage,
  DataSourceSettingsPage,
  canUserAccessDataSource,
  ACCESS_LEVELS,
  PROJECT_MEMBERSHIPS,
  ORGANIZATION_USERS,
  DATA_SOURCE_CATALOG,
  CURRENT_USER_ID,
  getOrganizationUserById,
  setOrganizationUsersRuntime,
  buildEmptyAccessLevel,
  cloneAccessLevel,
  getDataSourceById,
  getDataSourceOwnerDisplay,
  getProjectRequiredDataSourceIds,
  buildSourceAccessSummaryRow,
  buildDataSourceAccessSummary,
  hasConstellationConnectAccess,
  ACCESS_LEVEL_DENIED_MESSAGE,
  ACCESS_LEVEL_CREATE_DENIED_MESSAGE,
  CONSTELLATION_CONFIGURE_DENIED_MESSAGE,
  CONSTELLATION_KNOWLEDGE_DENIED_MESSAGE,
  PROJECT_ACTION_DENIED_MESSAGE,
  PROJECT_CREATE_DENIED_MESSAGE,
  canAdministerAccessLevels,
  canArchiveConstellation,
  canArchiveProject,
  canAccessProject,
  canAdministerProjectConfiguration,
  isOrganizationAdmin,
  canEditConstellationKnowledge,
  canEditGalaxySettings,
  canCreateConstellation,
  canCreateOrganizationalDataSource,
  canCreateProject,
  canDeleteConstellation,
  canDeleteProject,
  canViewOrganizationAnalytics,
  countProjectMembers,
  evaluateConstellationUseAccess,
  getAccessibleConstellationIds,
  getActiveProjectMembership,
  isWorkingChatAccessible,
  setPrototypeCurrentUserId,
  formatDemoIdentityContextLabel,
} from "@/app/features/permissions";
import type {
  AccessLevelRecord,
  DataSourceCatalogItem,
  DataSourceSettingsFocusSection,
  InviteOrganizationUserPayload,
  OrganizationUser,
  PrototypeMfaMethod,
} from "@/app/features/permissions";
import {
  ProjectOverviewPage,
  ProjectDashboardPage,
  ChatsLibrary,
  ConstellationsLibrary,
  ActivityLibrary,
  CONSTELLATION_SOURCE_COUNTS,
  getProjectActivity,
  getProjectDashboardOutputs,
  buildActivityNavigationContext,
  openProjectActivity,
  type ProjectNavSection,
  type ProjectOverviewBrowseMode,
  type ProjectOverviewChat,
  type ProjectOverviewConstellation,
  type ProjectActivityItem,
} from "@/app/features/project-overview";
import { PROJECT_DASHBOARD_OUTPUTS } from "@/app/features/project-overview/data";
import {
  ProjectAssistantHost,
  type ProjectAssistantMessage,
} from "@/app/features/project-assistant";
import {
  SEED_VIDGETS,
  cloneVidget,
  duplicateVidget,
  buildEmptyVidget,
  getVidgetsForProject,
  getVidgetForProject,
  resolveVidgetSourceDisplay,
  canManageVidgets,
  canReviewVidgetInbox,
  VIDGET_MANAGE_DENIED_MESSAGE,
  VIDGET_INBOX_DENIED_MESSAGE,
  resolveVidgetCreateSource,
  withLockedVidgetSource,
  validateVidgetScopeForProject,
  VidgetsPage,
  VidgetSettingsPage,
  CreateVidgetDialog,
  parseVidgetSettingsTabFromSearch,
  vidgetSettingsSectionToTab,
  type VidgetCreateSourcePreset,
  type VidgetSettingsSectionId,
  type CreateVidgetSubmitPayload,
} from "@/app/features/vidgets";
import {
  PipelinesPage,
  PipelineDetailPage,
  PipelineRunDetailPage,
  PipelineRouteMissingState,
  applyPrototypeTaskRetry,
  canRetryFailedTask,
  canTriggerPipeline,
  canUpdatePipelineVariables,
  canViewProjectPipelines,
  createPrototypeRunningRun,
  getPipelineById,
  getPipelinesForProject,
  getVisiblePipelineCountForProject,
  getRunById,
  getRunsForPipeline,
  getTasksForRun,
  getVariablesForPipeline,
  SEED_PIPELINE_RUNS,
  SEED_PIPELINE_TASKS,
  SEED_PIPELINE_VARIABLES,
  SEED_PROJECT_PIPELINES,
  PIPELINE_RETRY_DENIED_MESSAGE,
  PIPELINE_TRIGGER_DENIED_MESSAGE,
  PIPELINE_VARIABLES_DENIED_MESSAGE,
} from "@/app/features/pipelines";
import type {
  PipelineRunRecord,
  PipelineTaskRecord,
  PipelineVariableRecord,
  ProjectPipelineRecord,
} from "@/app/features/pipelines";
import { AdminPipelinesPage } from "@/app/features/admin-pipelines";
import {
  getAdminPipelinesSnapshot,
  mergeAdminIntoCustomerPipelines,
  mergeAdminIntoCustomerVariables,
  isAdminOriginatedPipeline,
  customerPipelineIdFromMapping,
  subscribeAdminPipelines,
} from "@/app/features/admin-pipelines";
import {
  VidgetInboxPage,
  serializeVidgetInboxQuery,
  parseVidgetInboxQueryFromSearch,
  vidgetInboxQueryFromPartial,
  type VidgetInboxQuery,
  type VidgetInboxRefinePayload,
} from "@/app/features/vidget-inbox";
import { parseLuxiaRelativeTimestamp } from "@/app/features/project-overview/projectOverviewPreview";
import {
  LuxiaBreadcrumb,
  buildChatBreadcrumbItems,
  buildGalaxyBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageHeader, LuxiaPageHeaderShell, LUXIA_PAGE_INTRO, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { ResponseActionsFooter } from "@/app/features/chat/ResponseActionsFooter";
import { LuxiaResponseCard } from "@/app/features/chat/LuxiaResponseCard";
import type { LuxiaResponsePresentation } from "@/app/features/chat/LuxiaResponseCard";
import {
  hydrateMessageResponsePresentation,
  makeResponseConfidenceDemoMessages,
} from "@/app/features/constellation-settings/responseConfidence";
import { LX } from "@/app/features/active-data-tables/tokens";
import { IC, IC_BTN_ICON, IC_BTN_OPEN, IC_CARD_HEADER, IC_INPUT_TEXT, IC_SEARCH_SHELL, IC_SEARCH_SHELL_STYLE, icCardStyle, icHoverOff, icHoverOn, icInspectorAccentStyle, icInspectorDescriptionColor, icInspectorTitleColor, icOpenActiveOn, icSearchShellBlur, icSearchShellFocus, icSearchShellHoverOff, icSearchShellHoverOn, icTextareaStyle } from "@/app/features/active-data-tables/inspectorTheme";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import {
  LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
  STRUCTURED_MODAL_DARK_CHROME_STYLE,
} from "@/app/features/shared/structuredModalChrome";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  ChevronDown, ChevronRight, ChevronLeft,
  Plus, X, Pin, Copy, SquareArrowOutUpRight,
  FileText, Database, BookOpen,
  Send, Mic, Eye, Upload, GripVertical,
  Trash2, Check, Edit3, BarChart3, Table2,
  Search, MoreHorizontal,
  AlignLeft, Layers, Share2, List, FileBarChart2,
  type LucideIcon,
} from "lucide-react";
import {
  LuxiaGalaxyIcon,
  LuxiaHomeIcon,
  LuxiaSettingsIcon,
} from "@/assets/icons";
import {
  LeftNav,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_SECONDARY_WIDTH,
  LEFT_NAV_COLLAPSED_STORAGE_KEY,
  LEFT_NAV_MOBILE_BREAKPOINT,
} from "@/app/features/navigation/LeftNav";

import {
  CONSTELLATION_STYLE,
  getConstellationSourceLabel,
  ConstellationSourceBadge,
  type Chat,
  type ChatScope,
  type Constellation,
  type ConstellationType,
  type Message,
  type NewChatPayload,
  type Project,
} from "@/app/app-sections/appSectionShared";
import { PageHeader } from "@/app/app-sections/ChatHeaderSection";
import { PromptComposer } from "@/app/app-sections/ChatComposerSection";
import {
  AICard,
  ChatTabBar,
  DateSeparator,
  EmptyState,
  UserBubble,
} from "@/app/app-sections/ChatContentSection";
import { ConstellationSidebar } from "@/app/app-sections/ConstellationSidebarSection";





function getProjectConstellations(
  projectId: string,
  catalog: Constellation[] = CONSTELLATIONS,
) {
  return catalog.filter((c) => c.projectId === projectId);
}

function applyConstellationNameOverrides(
  constellations: Constellation[],
  settingsById: Record<string, ConstellationSettingsRecord>,
): Constellation[] {
  return constellations.map((item) => {
    const settings = settingsById[item.id];
    if (!settings?.name) return item;
    return {
      ...item,
      label: settings.name,
      description: settings.description || item.description,
    };
  });
}

function homeProjectsAsSelectOptions(
  projects: readonly HomeProjectCard[],
): Project[] {
  return projects.map((project) => ({
    id: project.id,
    label: project.name,
  }));
}

function syncProjectNameInSettingsById(
  prev: Record<string, ConstellationSettingsRecord>,
  projectId: string,
  projectName: string,
): Record<string, ConstellationSettingsRecord> {
  let changed = false;
  const next = { ...prev };
  for (const [id, record] of Object.entries(next)) {
    if (record.projectId === projectId && record.projectName !== projectName) {
      next[id] = { ...record, projectName };
      changed = true;
    }
  }
  return changed ? next : prev;
}

function withLiveProjectNameOnSettingsRecord(
  record: ConstellationSettingsRecord,
  projects: readonly HomeProjectCard[],
): ConstellationSettingsRecord {
  const projectName = getProjectNameById(record.projectId, projects);
  return record.projectName === projectName ? record : { ...record, projectName };
}

function resolveChatConstellation(
  chat: Chat | undefined,
  catalog: Constellation[] = CONSTELLATIONS,
): Constellation | undefined {
  if (chat?.chatType === "constellation" && chat.constellationId) {
    const exact = catalog.find((c) => c.id === chat.constellationId);
    if (exact) {
      if (chat.projectId && exact.projectId !== chat.projectId) {
        console.warn(
          `[Luxia] Constellation "${chat.constellationId}" belongs to "${exact.projectId}", not chat project "${chat.projectId}".`,
        );
        return undefined;
      }
      return exact;
    }
    console.warn(
      `[Luxia] Constellation "${chat.constellationId}" not found for chat "${chat.id}". Preserving unavailable state.`,
    );
    return undefined;
  }
  return undefined;
}

const CONSTELLATIONS: Constellation[] = CANONICAL_CONSTELLATIONS.map((item) => ({
  id: item.id,
  label: item.name,
  type: item.type,
  projectId: item.projectId,
  description: item.description,
}));

const INITIAL_CHATS: Chat[] = [
  { id: "chat-01", label: "Chat name 01", chatType: "constellation", projectId: "project-01", constellationId: "con1", pinned: true },
  { id: "chat-02", label: "Chat name 02", chatType: "constellation", projectId: "project-01", constellationId: "con2" },
  { id: "chat-03", label: "Chat name 03", chatType: "constellation", projectId: "project-01", constellationId: "con3" },
  { id: "chat-04", label: "Chat name 04", chatType: "constellation", projectId: "project-01", constellationId: "con4", pinned: true },
  { id: "chat-05", label: "Chat name 05", chatType: "constellation", projectId: "project-01", constellationId: "con5" },
  { id: "chat-06", label: "Chat name 06", chatType: "constellation", projectId: "project-02", constellationId: "con6" },
  { id: "chat-07", label: "Chat name 07", chatType: "constellation", projectId: "project-02", constellationId: "con7" },
  { id: "chat-08", label: "Chat name 08", chatType: "constellation", projectId: "project-02", constellationId: "con8" },
  { id: "chat-09", label: "Chat name 09", chatType: "constellation", projectId: "project-03", constellationId: "con9" },
  { id: "chat-10", label: "Chat name 10", chatType: "constellation", projectId: "project-03", constellationId: "con10" },
  { id: "chat-11", label: "Chat name 11", chatType: "constellation", projectId: "project-04", constellationId: "con11" },
  { id: "chat-12", label: "Chat name 12", chatType: "constellation", projectId: "project-04", constellationId: "con14" },
  { id: "chat-13", label: "Chat name 13", chatType: "constellation", projectId: "project-05", constellationId: "con15" },
  { id: "chat-14", label: "Chat name 14", chatType: "constellation", projectId: "project-06", constellationId: "con17" },
  { id: "chat-15", label: "Chat name 15", chatType: "constellation", projectId: "project-06", constellationId: "con18" },
  { id: "chat-16", label: "Chat name 16", chatType: "constellation", projectId: "project-06", constellationId: "con19" },
  { id: "chat-17", label: "Chat name 17", chatType: "constellation", projectId: "project-06", constellationId: "con20" },
  { id: "chat-18", label: "Chat name 18", chatType: "constellation", projectId: "project-06", constellationId: "con21" },
  { id: "chat-19", label: "Chat name 19", chatType: "constellation", projectId: "project-06", constellationId: "con22" },
  { id: "chat-20", label: "Chat name 20", chatType: "constellation", projectId: "project-06", constellationId: "con23" },
  { id: "chat-21", label: "Chat name 21", chatType: "constellation", projectId: "project-06", constellationId: "con24" },
  { id: "chat-22", label: "Chat name 22", chatType: "constellation", projectId: "project-06", constellationId: "con25" },
  { id: "chat-23", label: "Chat name 23", chatType: "constellation", projectId: "project-06", constellationId: "con26" },
  { id: "galaxy-01", label: "Galaxy name 01", chatType: "galaxy", projectId: "project-01" },
  { id: "galaxy-02", label: "Galaxy name 02", chatType: "galaxy", projectId: "project-02", pinned: true },
  { id: "galaxy-03", label: "Galaxy name 03", chatType: "galaxy", projectId: "project-03" },
  { id: "galaxy-04", label: "Galaxy name 04", chatType: "galaxy", projectId: "project-04" },
  { id: "galaxy-05", label: "Galaxy name 05", chatType: "galaxy", projectId: "project-05" },
  { id: "galaxy-06", label: "Galaxy name 06", chatType: "galaxy", projectId: "project-06" },
];

function makePrototypeMessages(chatId: string, chatLabel: string): Message[] {
  return makeResponseConfidenceDemoMessages(chatId, chatLabel);
}

const INITIAL_MESSAGES: Record<string, Message[]> = Object.fromEntries(
  INITIAL_CHATS
    .filter((chat) => chat.chatType === "constellation")
    .map((chat) => [chat.id, makePrototypeMessages(chat.id, chat.label)]),
);

const DEFAULT_ACTIVE_CHAT_ID = "chat-01";
const PROJECT_NAME_FALLBACK = "Project name 01";

function findGalaxyChatForProject(
  projectId: string,
  chatList: readonly Chat[],
  projects: readonly HomeProjectCard[] = HOME_PROJECTS,
): Chat | undefined {
  const galaxyId = projects.find((entry) => entry.id === projectId)?.galaxyId
    ?? chatList.find((chat) => chat.chatType === "galaxy" && chat.projectId === projectId)?.id
    ?? INITIAL_CHATS.find((chat) => chat.chatType === "galaxy" && chat.projectId === projectId)?.id;
  if (!galaxyId) return undefined;
  return chatList.find((chat) => chat.id === galaxyId && chat.chatType === "galaxy")
    ?? INITIAL_CHATS.find((chat) => chat.id === galaxyId && chat.chatType === "galaxy");
}

function findChatById(chatId: string, chatList: readonly Chat[]): Chat | undefined {
  return chatList.find((chat) => chat.id === chatId)
    ?? INITIAL_CHATS.find((chat) => chat.id === chatId);
}

type LuxiaAppView =
  | "home"
  | "chat"
  | "project"
  | "constellation-create"
  | "constellation-settings"
  | "galaxy-settings"
  | "project-members"
  | "project-vidgets"
  | "project-pipelines"
  | "pipeline-detail"
  | "pipeline-run-detail"
  | "vidget-inbox"
  | "vidget-settings"
  | "organization-users"
  | "organization-user"
  | "access-levels"
  | "access-level"
  | "data-sources"
  | "data-source-settings"
  | "admin-pipelines";

function readInitialShellFromLocation(): {
  appView: LuxiaAppView;
  activeProjectId: string | null;
  activeChat: string;
  projectBrowseMode: ProjectOverviewBrowseMode;
  settingsConstellationId: string | null;
  settingsCapabilityPath: string | null;
  settingsSection: ConstellationSettingsSectionId;
  accessLevelId: string | null;
  organizationUserId: string | null;
  dataSourceSettingsId: string | null;
} {
  const defaults = {
    appView: "home" as LuxiaAppView,
    activeProjectId: null as string | null,
    activeChat: DEFAULT_ACTIVE_CHAT_ID,
    projectBrowseMode: "overview" as ProjectOverviewBrowseMode,
    settingsConstellationId: null as string | null,
    settingsCapabilityPath: null as string | null,
    settingsSection: "general" as ConstellationSettingsSectionId,
    accessLevelId: null as string | null,
    organizationUserId: null as string | null,
    dataSourceSettingsId: null as string | null,
  };

  if (typeof window === "undefined") {
    return defaults;
  }

  // Prototype rule: full page load / refresh / fresh session always start at Home.
  // In-session navigation (pushState / popstate) is unchanged and still resolves deep URLs.
  // Auth-entry query params (invite / account / session / reset / workspace) must survive
  // until LoginPage and bootstrapPrototypeSignedIn can consume them; clearAuthSearchParams
  // removes them after the auth flow exits that state.
  const authEntry = readAuthLocationEntry();
  if (authEntry.kind === "signin") {
    window.history.replaceState({ luxiaView: "home" }, "", "/");
  } else {
    const search = window.location.search;
    window.history.replaceState({ luxiaView: "home" }, "", `/${search}`);
  }
  return defaults;
}

const INITIAL_SHELL = readInitialShellFromLocation();



const INSPECTOR_NARROW_BREAKPOINT = 1280;
const INSPECTOR_WIDTH_DEFAULT = 288;
const INSPECTOR_WIDTH_MIN = 260;
const INSPECTOR_WIDTH_HARD_MAX = 360;
const CONSTELLATION_COLLAPSED_WIDTH = 56;
const CHAT_MIN_USABLE_WIDTH = 480;

const GALAXY_WIDTH_DEFAULT = 360;
const GALAXY_WIDTH_MIN = 340;
const GALAXY_WIDTH_PREFERRED_LARGE = 380;
const GALAXY_WIDTH_HARD_MAX = 420;
const GALAXY_WIDTH_LARGE_BREAKPOINT = 1440;
const GALAXY_OUTER_CHROME = GALAXY_PANEL_OUTER_GAP * 2;
const GALAXY_NARROW_BREAKPOINT = 1280;

function readLeftNavCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(LEFT_NAV_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function clampInspectorWidth(width: number, viewportWidth: number, leftNavWidth: number) {
  const maxByChat = Math.max(
    INSPECTOR_WIDTH_MIN,
    viewportWidth - leftNavWidth - CHAT_MIN_USABLE_WIDTH,
  );
  const maxByViewportShare = Math.floor(viewportWidth * 0.26);
  const maxWidth = Math.min(INSPECTOR_WIDTH_HARD_MAX, maxByViewportShare, maxByChat);
  return Math.max(INSPECTOR_WIDTH_MIN, Math.min(maxWidth, width));
}

function preferredGalaxyWidth(viewportWidth: number) {
  return viewportWidth >= GALAXY_WIDTH_LARGE_BREAKPOINT
    ? GALAXY_WIDTH_PREFERRED_LARGE
    : GALAXY_WIDTH_DEFAULT;
}

function clampGalaxyWidth(width: number, viewportWidth: number, leftNavWidth: number) {
  const maxByChat = Math.max(
    GALAXY_WIDTH_MIN,
    viewportWidth - leftNavWidth - CHAT_MIN_USABLE_WIDTH - GALAXY_OUTER_CHROME,
  );
  const maxByViewportShare = Math.floor(viewportWidth * 0.31);
  const maxWidth = Math.min(GALAXY_WIDTH_HARD_MAX, maxByViewportShare, maxByChat);
  return Math.max(GALAXY_WIDTH_MIN, Math.min(maxWidth, width));
}



function ChatTypeOption({
  id,
  value,
  title,
  description,
  selected,
}: {
  id: string;
  value: ChatScope;
  title: string;
  description: string;
  selected: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-[12px] border px-3.5 py-3 transition-[border-color,background-color,box-shadow] outline-none"
      style={{
        borderColor: selected ? LX.secondary : LX.border,
        background: selected ? LX.state.secondary08 : LX.surface,
        boxShadow: selected ? `0 0 0 3px ${LX.state.secondary04}` : "none",
      }}
    >
      <RadioGroupItem id={id} value={value} className="mt-0.5" aria-label={title} />
      <span className="min-w-0">
        <span className="block luxia-type-body-dense-strong leading-5" style={{ color: LX.primary }}>{title}</span>
        <span className="block luxia-type-caption leading-4 mt-0.5" style={{ color: LX.textMuted }}>{description}</span>
      </span>
    </label>
  );
}

function NewChatModal({
  onCreate,
  onClose,
  lockedProjectId,
  constellations,
  projects,
}: {
  onCreate: (payload: NewChatPayload) => void;
  onClose: () => void;
  lockedProjectId?: string | null;
  constellations: Constellation[];
  projects: Project[];
}) {
  const [chatType, setChatType] = useState<ChatScope>("constellation");
  const [projectId, setProjectId] = useState(lockedProjectId ?? projects[0]?.id ?? "");
  const [constellationId, setConstellationId] = useState("");

  useEffect(() => {
    if (lockedProjectId) setProjectId(lockedProjectId);
  }, [lockedProjectId]);

  useEffect(() => {
    if (projects.some((project) => project.id === projectId)) return;
    setProjectId(lockedProjectId ?? projects[0]?.id ?? "");
  }, [lockedProjectId, projectId, projects]);

  const projectConstellations = useMemo(
    () => constellations.filter((c) => c.projectId === projectId),
    [constellations, projectId],
  );

  const projectOptions = useMemo(
    () => projects.map((project) => ({
      value: project.id,
      label: project.label,
      content: (
        <span className="truncate" style={{ color: "var(--luxia-text-project-title)" }}>
          {project.label}
        </span>
      ),
    })),
    [projects],
  );

  const constellationOptions = useMemo(
    () => projectConstellations.map((constellation) => ({
      value: constellation.id,
      label: constellation.label,
      content: (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{constellation.label}</span>
          <ConstellationSourceBadge type={constellation.type} />
        </span>
      ),
    })),
    [projectConstellations],
  );

  useEffect(() => {
    if (chatType !== "constellation") return;
    setConstellationId((current) => {
      if (current && projectConstellations.some((c) => c.id === current)) return current;
      return projectConstellations[0]?.id ?? "";
    });
  }, [chatType, projectConstellations]);

  const canCreate = chatType === "galaxy"
    ? Boolean(projectId)
    : Boolean(projectId && constellationId);

  function handleCreate() {
    if (!canCreate) return;
    onCreate({
      chatType,
      projectId,
      constellationId: chatType === "constellation" ? constellationId : undefined,
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (document.querySelector("[data-searchable-select-open='true']")) return;
      onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(16,5,32,0.35)", backdropFilter: "blur(4px)" }} />
      <div
        className="relative flex w-full max-w-[500px] flex-col rounded-[20px] overflow-hidden"
        style={{ maxHeight: "min(88vh, 760px)", background: "white", boxShadow: LX.shadow.dialog }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-title"
      >
        <div
          className="flex flex-shrink-0 items-start justify-between px-7 pt-5 pb-4"
          style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
        >
          <div>
            <h2 id="new-chat-title" className="luxia-type-title-modal mb-1 text-[var(--luxia-text-inverse)]">
              Create Chat
            </h2>
            <p className="luxia-type-body-dense text-[var(--luxia-purple-10)]">
              Choose a chat type and project to start a new conversation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full outline-none transition-opacity",
              LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
            )}
            aria-label="Close create chat dialog"
          >
            <X size={13} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-7 pb-5 space-y-5">
          <section>
            <Label className="mb-2 block luxia-type-overline-form" style={{ color: LX.textMuted }}>
              Chat Type
            </Label>
            <RadioGroup
              value={chatType}
              onValueChange={(value) => setChatType(value as ChatScope)}
              className="grid gap-2.5 sm:grid-cols-2"
            >
              <ChatTypeOption
                id="chat-type-galaxy"
                value="galaxy"
                title="Galaxy"
                description="Whole project knowledge"
                selected={chatType === "galaxy"}
              />
              <ChatTypeOption
                id="chat-type-constellation"
                value="constellation"
                title="Constellation"
                description="Specific knowledge source"
                selected={chatType === "constellation"}
              />
            </RadioGroup>
          </section>

          <section>
            <Label htmlFor="create-chat-project" className="mb-2 block luxia-type-label-form" style={{ color: LX.primary }}>
              Project
            </Label>
              <SearchableSelect
                id="create-chat-project"
                value={projectId}
                onValueChange={setProjectId}
                options={projectOptions}
                placeholder="Search or select a project"
                emptyText="No projects found"
                noResultsText="No projects found"
                disabled={Boolean(lockedProjectId)}
              />
              {lockedProjectId ? (
                <p className="mt-2 luxia-type-metadata" style={{ color: LX.textMuted }}>
                  This Chat is scoped to the current Project.
                </p>
              ) : null}
            {chatType === "galaxy" ? (
              <p className="mt-2 luxia-type-metadata" style={{ color: LX.textMuted }}>
                Galaxy automatically uses the available constellations inside the selected project.
              </p>
            ) : null}
          </section>

          {chatType === "constellation" ? (
            <section>
              <Label htmlFor="create-chat-constellation" className="mb-2 block luxia-type-label-form" style={{ color: LX.primary }}>
                Constellation
              </Label>
              <SearchableSelect
                id="create-chat-constellation"
                value={constellationId}
                onValueChange={setConstellationId}
                options={constellationOptions}
                placeholder={projectConstellations.length === 0
                  ? "No constellations available"
                  : "Search or select a constellation"}
                emptyText="No constellations available"
                noResultsText="No constellations found"
                disabled={projectConstellations.length === 0}
              />
              {projectConstellations.length === 0 ? (
                <p className="mt-2 luxia-type-metadata" style={{ color: LX.textMuted }}>
                  This project has no constellations yet.
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="flex-shrink-0 flex items-center justify-end gap-2.5 px-7 py-4" style={{ borderTop: `1px solid ${LX.border}` }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled={!canCreate} onClick={handleCreate}>
            Create Chat
          </Button>
        </div>
      </div>
    </div>
  );
}



export default function App() {
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState(INITIAL_SHELL.activeChat);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [language, setLanguage] = useState("EN");
  const [assistantMode, setAssistantMode] = useState("Luxia");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatLockedProjectId, setNewChatLockedProjectId] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [projectManageMode, setProjectManageMode] = useState<ProjectManageMode | null>(null);
  const [projectManageId, setProjectManageId] = useState<string | null>(null);
  const [appView, setAppView] = useState<LuxiaAppView>(INITIAL_SHELL.appView);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(INITIAL_SHELL.activeProjectId);
  const [projectBrowseMode, setProjectBrowseMode] = useState<ProjectOverviewBrowseMode>(
    INITIAL_SHELL.projectBrowseMode,
  );
  const [settingsConstellationId, setSettingsConstellationId] = useState<string | null>(
    INITIAL_SHELL.settingsConstellationId,
  );
  const [settingsCapabilityPath, setSettingsCapabilityPath] = useState<string | null>(
    INITIAL_SHELL.settingsCapabilityPath,
  );
  const [settingsSection, setSettingsSection] = useState<ConstellationSettingsSectionId>(
    INITIAL_SHELL.settingsSection,
  );
  const [galaxySettingsSection, setGalaxySettingsSection] = useState<GalaxySettingsSectionId>("general");
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [accountSettingsSection, setAccountSettingsSection] = useState<AccountSettingsSectionId>("profile");
  const [galaxySettingsFocusHeadingToken, setGalaxySettingsFocusHeadingToken] = useState(0);
  const [galaxySettingsById, setGalaxySettingsById] = useState<
    Record<string, GalaxySettingsRecord>
  >({});
  const [settingsFocusHeadingToken, setSettingsFocusHeadingToken] = useState(0);
  const [accessLevelId, setAccessLevelId] = useState<string | null>(
    INITIAL_SHELL.accessLevelId,
  );
  const [organizationUserId, setOrganizationUserId] = useState<string | null>(
    INITIAL_SHELL.organizationUserId,
  );
  const [organizationUsersState, setOrganizationUsersState] = useState<OrganizationUser[]>(
    () => ORGANIZATION_USERS.map((user) => ({ ...user })),
  );
  const [inviteOrganizationUserOpen, setInviteOrganizationUserOpen] = useState(false);
  const [dataSourceSettingsId, setDataSourceSettingsId] = useState<string | null>(
    INITIAL_SHELL.dataSourceSettingsId,
  );
  const [dataSourceSettingsFocus, setDataSourceSettingsFocus] = useState<
    DataSourceSettingsFocusSection | null
  >(null);
  const [constellationSettingsById, setConstellationSettingsById] = useState<
    Record<string, ConstellationSettingsRecord>
  >(() => {
    const map: Record<string, ConstellationSettingsRecord> = {};
    for (const record of CONSTELLATION_SETTINGS_RECORDS) {
      map[record.id] = cloneConstellationSettingsRecord(record);
    }
    return map;
  });
  const [accessLevelsState, setAccessLevelsState] = useState(() =>
    ACCESS_LEVELS.map((level) => cloneAccessLevel(level)),
  );
  const [dataSourcesState, setDataSourcesState] = useState(() =>
    DATA_SOURCE_CATALOG.map((source) => ({ ...source })),
  );
  const [dataSourceCreationOpen, setDataSourceCreationOpen] = useState(false);
  const [constellationCreateExistingSourceId, setConstellationCreateExistingSourceId] =
    useState<string | null>(null);
  const [dataSourceHandoff, setDataSourceHandoff] = useState<{
    sourceId: string;
    kind: "create" | "connect";
  } | null>(null);
  const [projectMembershipsState, setProjectMembershipsState] = useState(() =>
    PROJECT_MEMBERSHIPS.map((membership) => ({ ...membership })),
  );
  const [vidgetsState, setVidgetsState] = useState(() => SEED_VIDGETS.map(cloneVidget));
  const [vidgetId, setVidgetId] = useState<string | null>(null);
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [pipelineRunId, setPipelineRunId] = useState<string | null>(null);
  const [pipelineRunFocusTaskKey, setPipelineRunFocusTaskKey] = useState<
    string | null
  >(null);
  const [pipelinesState, setPipelinesState] = useState<ProjectPipelineRecord[]>(() => {
    const seeded = SEED_PROJECT_PIPELINES.map((item) => ({
      ...item,
      enabledActions: { ...item.enabledActions },
    }));
    const admin = getAdminPipelinesSnapshot();
    return mergeAdminIntoCustomerPipelines(seeded, admin.mappings);
  });
  const [pipelineRunsState, setPipelineRunsState] = useState<PipelineRunRecord[]>(() =>
    SEED_PIPELINE_RUNS.map((item) => ({ ...item })),
  );
  const [pipelineTasksState, setPipelineTasksState] = useState<PipelineTaskRecord[]>(() =>
    SEED_PIPELINE_TASKS.map((item) => ({
      ...item,
      upstreamKeys: [...item.upstreamKeys],
    })),
  );
  const [pipelineVariablesState, setPipelineVariablesState] = useState<
    PipelineVariableRecord[]
  >(() => {
    const seeded = SEED_PIPELINE_VARIABLES.map((item) => ({
      ...item,
      allowedValues: item.allowedValues ? [...item.allowedValues] : undefined,
    }));
    const admin = getAdminPipelinesSnapshot();
    return mergeAdminIntoCustomerVariables(
      seeded,
      admin.mappings,
      admin.variables,
    );
  });
  const [vidgetInboxSessionId, setVidgetInboxSessionId] = useState<string | null>(null);
  const [vidgetInboxSearch, setVidgetInboxSearch] = useState("");
  const [dashboardFocusOutputId, setDashboardFocusOutputId] = useState<string | null>(null);
  const [activeDashboardOutputId, setActiveDashboardOutputId] = useState<string | null>(null);
  const [dashboardViewResetKey, setDashboardViewResetKey] = useState(0);
  const [vidgetSettingsSection, setVidgetSettingsSection] = useState<VidgetSettingsSectionId>("general");
  const [vidgetSettingsFocusPreview, setVidgetSettingsFocusPreview] = useState(false);
  const [createVidgetOpen, setCreateVidgetOpen] = useState(false);
  const [createVidgetPreset, setCreateVidgetPreset] = useState<VidgetCreateSourcePreset>({
    kind: "choose",
  });
  const [createVidgetProjectId, setCreateVidgetProjectId] = useState<string | null>(null);
  const [projectAssistantOpen, setProjectAssistantOpen] = useState(false);
  const [projectAssistantSessions, setProjectAssistantSessions] = useState<
    Record<string, ProjectAssistantMessage[]>
  >({});
  const [prototypeUserId, setPrototypeUserId] = useState(CURRENT_USER_ID);
  const [prototypeSignedIn, setPrototypeSignedIn] = useState(bootstrapPrototypeSignedIn);
  const [mfaNudgeEmail, setMfaNudgeEmail] = useState<string | null>(null);
  const [mfaNudgeOpen, setMfaNudgeOpen] = useState(false);
  const [inAppMfaSetupEmail, setInAppMfaSetupEmail] = useState<string | null>(null);
  const [constellationAccessBlock, setConstellationAccessBlock] = useState<{
    projectId: string;
    constellationId: string;
    reason: string;
  } | null>(null);
  const [galaxyAccessBlock, setGalaxyAccessBlock] = useState<{
    projectId: string;
    reason: string;
  } | null>(null);
  const [capabilityBundlesById, setCapabilityBundlesById] = useState<
    Record<string, ConstellationCapabilityBundle>
  >(() => {
    const map: Record<string, ConstellationCapabilityBundle> = {};
    for (const item of CANONICAL_CONSTELLATIONS) {
      const record = CONSTELLATION_SETTINGS_RECORDS.find((entry) => entry.id === item.id);
      map[item.id] = createSeedCapabilityBundle(item.id, item.type, record?.instructions);
    }
    return map;
  });
  const [runtimeConstellations, setRuntimeConstellations] = useState<Constellation[]>([]);
  const allConstellations = useMemo(
    () => applyConstellationNameOverrides(
      [...CONSTELLATIONS, ...runtimeConstellations],
      constellationSettingsById,
    ),
    [runtimeConstellations, constellationSettingsById],
  );
  const [homeBrowseMode, setHomeBrowseMode] = useState<HomeBrowseMode>("overview");
  const [homeScrollRequest, setHomeScrollRequest] = useState(0);
  const [homeProjects, setHomeProjects] = useState<HomeProjectCard[]>(HOME_PROJECTS);
  const dataSourceConstellationHandoff = useMemo(() => {
    const projects = listProjectsWhereUserCanCreateConstellation({
      projects: homeProjects,
      memberships: projectMembershipsState,
      userId: prototypeUserId,
    });
    const constellations = listConstellationsUserCanConfigure({
      constellations: allConstellations.map((item) => {
        const record = constellationSettingsById[item.id]
          ?? getConstellationSettingsRecord(item.id);
        return {
          id: item.id,
          name: item.label,
          projectId: item.projectId,
          dataSourceIds: record?.connectedSources.map((source) => source.id)
            ?? getCanonicalConstellationById(item.id)?.dataSourceIds
            ?? [],
        };
      }),
      projects: homeProjects,
      memberships: projectMembershipsState,
      userId: prototypeUserId,
    });
    return { projects, constellations };
  }, [
    homeProjects,
    projectMembershipsState,
    prototypeUserId,
    allConstellations,
    constellationSettingsById,
  ]);
  const [pinnedProjectIds, setPinnedProjectIds] = useState<string[]>(readPinnedProjectIds);
  const [pinnedEntityOrder, setPinnedEntityOrder] = useState(readPinnedEntityOrder);
  const [primaryPreference, setPrimaryPreference] = useState(readHomePrimaryPreference);
  const [dismissedContinueKeys, setDismissedContinueKeys] = useState(readDismissedContinueKeys);
  const [galaxySessions, setGalaxySessions] = useState<Record<string, GalaxySessionState>>(() => ({
    "galaxy-01": createIdleGalaxySession(getProjectNameById("project-01")),
    "galaxy-02": createIdleGalaxySession(getProjectNameById("project-02")),
    "galaxy-03": createIdleGalaxySession(getProjectNameById("project-03")),
    "galaxy-04": createIdleGalaxySession(getProjectNameById("project-04")),
    "galaxy-05": createIdleGalaxySession(getProjectNameById("project-05")),
    "galaxy-06": createIdleGalaxySession(getProjectNameById("project-06")),
  }));
  const [sidebarWidth, setSidebarWidth] = useState(INSPECTOR_WIDTH_DEFAULT);
  const [galaxyPanelWidth, setGalaxyPanelWidth] = useState(() =>
    typeof window !== "undefined" ? preferredGalaxyWidth(window.innerWidth) : GALAXY_WIDTH_DEFAULT,
  );
  const [galaxyPanelCollapsed, setGalaxyPanelCollapsed] = useState(false);
  const [galaxyPanelContentOpaque, setGalaxyPanelContentOpaque] = useState(true);
  const [galaxyExpandedDespiteNarrow, setGalaxyExpandedDespiteNarrow] = useState(false);
  const galaxyManualCollapseRef = useRef(false);
  const galaxyExpandSignalSeenRef = useRef(0);
  const [sidebarCollapsedPreference, setSidebarCollapsedPreference] = useState(false);
  const [leftNavCollapsedPreference, setLeftNavCollapsedPreference] = useState(readLeftNavCollapsedPreference);
  const [leftNavSecondaryOpen, setLeftNavSecondaryOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inspectorExpandedDespiteNarrow, setInspectorExpandedDespiteNarrow] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1920
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(200);
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  const homeProjectsRef = useRef(homeProjects);
  homeProjectsRef.current = homeProjects;
  const appViewRef = useRef(appView);
  appViewRef.current = appView;
  const activeProjectIdRef = useRef(activeProjectId);
  activeProjectIdRef.current = activeProjectId;
  const projectMembershipsStateRef = useRef(projectMembershipsState);
  projectMembershipsStateRef.current = projectMembershipsState;
  const prototypeUserIdRef = useRef(prototypeUserId);
  prototypeUserIdRef.current = prototypeUserId;
  const constellationCreateGuardRef = useRef<ConstellationCreateNavigationGuard | null>(null);
  const capabilityManageGuardRef = useRef<UnsavedNavigationGuard | null>(null);
  const settingsCapabilityPathRef = useRef(settingsCapabilityPath);
  settingsCapabilityPathRef.current = settingsCapabilityPath;
  const settingsConstellationIdRef = useRef(settingsConstellationId);
  settingsConstellationIdRef.current = settingsConstellationId;
  const accessLevelCreateDraftRef = useRef<AccessLevelRecord | null>(null);

  const isMobileNav = viewportWidth < LEFT_NAV_MOBILE_BREAKPOINT;
  const isInspectorNarrow = viewportWidth <= INSPECTOR_NARROW_BREAKPOINT;

  const leftNavCollapsed = isMobileNav ? true : leftNavCollapsedPreference;

  const sidebarCollapsed = isInspectorNarrow
    ? !inspectorExpandedDespiteNarrow
    : sidebarCollapsedPreference;

  const leftNavWidth = isMobileNav
    ? 0
    : (leftNavCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED)
      + (leftNavSecondaryOpen ? SIDEBAR_SECONDARY_WIDTH : 0);
  const clampedInspectorWidth = clampInspectorWidth(sidebarWidth, viewportWidth, leftNavWidth);
  const clampedGalaxyWidth = clampGalaxyWidth(galaxyPanelWidth, viewportWidth, leftNavWidth);
  const isGalaxyNarrow = viewportWidth <= GALAXY_NARROW_BREAKPOINT;
  const renderedGalaxyCollapsed = isGalaxyNarrow
    ? !galaxyExpandedDespiteNarrow
    : galaxyPanelCollapsed;
  const renderedGalaxyOuterWidth = renderedGalaxyCollapsed
    ? GALAXY_COLLAPSED_WIDTH + GALAXY_OUTER_CHROME
    : clampedGalaxyWidth + GALAXY_OUTER_CHROME;

  useEffect(() => {
    try {
      localStorage.setItem(LEFT_NAV_COLLAPSED_STORAGE_KEY, String(leftNavCollapsedPreference));
    } catch {
    }
  }, [leftNavCollapsedPreference]);

  useEffect(() => {
    setOrganizationUsersRuntime(organizationUsersState);
  }, [organizationUsersState]);

  useEffect(() => {
    function syncAdminPipelinesIntoCustomer() {
      const admin = getAdminPipelinesSnapshot();
      const liveAdminPipelineIds = new Set(
        admin.mappings.map((mapping) => customerPipelineIdFromMapping(mapping.id)),
      );
      setPipelinesState((prev) =>
        mergeAdminIntoCustomerPipelines(prev, admin.mappings),
      );
      setPipelineVariablesState((prev) =>
        mergeAdminIntoCustomerVariables(prev, admin.mappings, admin.variables),
      );
      // Remove runs/tasks only for admin-originated pipelines that no longer exist.
      setPipelineRunsState((runs) =>
        runs.filter(
          (run) =>
            !isAdminOriginatedPipeline(run.pipelineId)
            || liveAdminPipelineIds.has(run.pipelineId),
        ),
      );
      setPipelineTasksState((tasks) =>
        tasks.filter(
          (task) =>
            !isAdminOriginatedPipeline(task.pipelineId)
            || liveAdminPipelineIds.has(task.pipelineId),
        ),
      );
    }
    syncAdminPipelinesIntoCustomer();
    return subscribeAdminPipelines(syncAdminPipelinesIntoCustomer);
  }, []);

  useEffect(() => {
    function clearSettingsRouteState() {
      setSettingsConstellationId(null);
      setSettingsCapabilityPath(null);
      setSettingsSection("general");
      setGalaxySettingsSection("general");
      setVidgetId(null);
      setVidgetInboxSessionId(null);
      setVidgetInboxSearch("");
      setVidgetSettingsSection("general");
      setAccessLevelId(null);
      setOrganizationUserId(null);
      setDataSourceSettingsId(null);
      setDataSourceSettingsFocus(null);
    }

    function goHome(replace: boolean) {
      if (typeof window !== "undefined") {
        const onRoot = window.location.pathname === "/" || window.location.pathname === "";
        if (!onRoot) {
          if (replace) {
            window.history.replaceState({ luxiaView: "home" }, "", "/");
          } else {
            window.history.pushState({ luxiaView: "home" }, "", "/");
          }
        }
      }
      setAppView("home");
      setHomeBrowseMode("overview");
      setActiveProjectId(null);
      setProjectBrowseMode("overview");
      clearSettingsRouteState();
    }

    function applyPath(pathname: string, search = typeof window !== "undefined" ? window.location.search : "") {
      const resolved = resolveLuxiaPathname(pathname);

      if (resolved.kind === "home") {
        if (resolved.normalizeToRoot && typeof window !== "undefined") {
          window.history.replaceState({ luxiaView: "home" }, "", "/");
        }
        setAppView("home");
        setHomeBrowseMode("overview");
        setActiveProjectId(null);
        setProjectBrowseMode("overview");
        clearSettingsRouteState();
        return;
      }

      if (resolved.kind === "project") {
        clearSettingsRouteState();
        setActiveProjectId(resolved.projectId);
        setProjectBrowseMode("overview");
        setAppView("project");
        return;
      }

      if (resolved.kind === "dashboard") {
        clearSettingsRouteState();
        setActiveProjectId(resolved.projectId);
        setProjectBrowseMode("dashboards");
        setAppView("project");
        return;
      }

      if (resolved.kind === "constellation-create") {
        clearSettingsRouteState();
        setActiveProjectId(resolved.projectId);
        setProjectBrowseMode("constellations");
        setAppView("constellation-create");
        return;
      }

      if (resolved.kind === "constellations") {
        clearSettingsRouteState();
        setActiveProjectId(resolved.projectId);
        setProjectBrowseMode("constellations");
        setAppView("project");
        return;
      }

      if (resolved.kind === "project-chats") {
        clearSettingsRouteState();
        setActiveProjectId(resolved.projectId);
        setProjectBrowseMode("chats");
        setAppView("project");
        return;
      }

      if (resolved.kind === "project-activity") {
        clearSettingsRouteState();
        setActiveProjectId(resolved.projectId);
        setProjectBrowseMode("activity");
        setAppView("project");
        return;
      }

      if (resolved.kind === "constellation-settings") {
        setActiveProjectId(resolved.projectId);
        setSettingsConstellationId(resolved.constellationId);
        setSettingsCapabilityPath(resolved.capabilityPath ?? null);
        setSettingsSection(
          resolved.capabilityPath
            ? "configuration"
            : parseConstellationSettingsTabFromSearch(search),
        );
        setGalaxySettingsSection("general");
        setAccessLevelId(null);
        setDataSourceSettingsId(null);
        setAppView("constellation-settings");
        return;
      }

      if (resolved.kind === "galaxy-settings") {
        if (!canAccessProject(
          resolved.projectId,
          projectMembershipsStateRef.current,
          CURRENT_USER_ID,
        )) {
          goHome(true);
          return;
        }
        setActiveProjectId(resolved.projectId);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setGalaxySettingsSection(parseGalaxySettingsTabFromSearch(search));
        setAccessLevelId(null);
        setDataSourceSettingsId(null);
        setAppView("galaxy-settings");
        return;
      }

      if (resolved.kind === "project-members") {
        setActiveProjectId(resolved.projectId);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setVidgetId(null);
        setAppView("project-members");
        return;
      }

      if (resolved.kind === "project-vidgets") {
        setActiveProjectId(resolved.projectId);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setVidgetId(null);
        setVidgetSettingsSection("general");
        setVidgetInboxSessionId(null);
        setVidgetInboxSearch("");
        setAppView("project-vidgets");
        return;
      }

      if (resolved.kind === "project-pipelines") {
        if (!canViewProjectPipelines()) {
          setActiveProjectId(resolved.projectId);
          setProjectBrowseMode("overview");
          setAppView("project");
          if (typeof window !== "undefined") {
            const next = getProjectPath(resolved.projectId);
            if (window.location.pathname !== next) {
              window.history.replaceState(
                { luxiaView: "project", projectId: resolved.projectId },
                "",
                next,
              );
            }
          }
          return;
        }
        setActiveProjectId(resolved.projectId);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setVidgetId(null);
        setPipelineId(null);
        setPipelineRunId(null);
        setAppView("project-pipelines");
        return;
      }

      if (resolved.kind === "pipeline-detail") {
        if (!canViewProjectPipelines()) {
          setActiveProjectId(resolved.projectId);
          setProjectBrowseMode("overview");
          setAppView("project");
          if (typeof window !== "undefined") {
            const next = getProjectPath(resolved.projectId);
            if (window.location.pathname !== next) {
              window.history.replaceState(
                { luxiaView: "project", projectId: resolved.projectId },
                "",
                next,
              );
            }
          }
          return;
        }
        // Keep the deep-link URL; missing pipeline renders generic not-found.
        setActiveProjectId(resolved.projectId);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setVidgetId(null);
        setPipelineId(resolved.pipelineId);
        setPipelineRunId(null);
        setPipelineRunFocusTaskKey(null);
        setAppView("pipeline-detail");
        return;
      }

      if (resolved.kind === "pipeline-run") {
        if (!canViewProjectPipelines()) {
          setActiveProjectId(resolved.projectId);
          setProjectBrowseMode("overview");
          setAppView("project");
          if (typeof window !== "undefined") {
            const next = getProjectPath(resolved.projectId);
            if (window.location.pathname !== next) {
              window.history.replaceState(
                { luxiaView: "project", projectId: resolved.projectId },
                "",
                next,
              );
            }
          }
          return;
        }
        // Keep the deep-link URL. Missing parent pipeline → generic Pipeline
        // not-found; missing run → Run not-found (both decided at render).
        setActiveProjectId(resolved.projectId);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setVidgetId(null);
        setPipelineId(resolved.pipelineId);
        setPipelineRunId(resolved.runId);
        setPipelineRunFocusTaskKey(null);
        setAppView("pipeline-run-detail");
        return;
      }

      if (resolved.kind === "vidget-inbox") {
        const parsed = parseVidgetInboxQueryFromSearch(search);
        const sessionId = parsed.sessionId || resolved.sessionId || "";
        const query = { ...parsed, sessionId };
        const nextSearch = serializeVidgetInboxQuery(query);
        setActiveProjectId(resolved.projectId);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setVidgetId(null);
        setVidgetSettingsSection("general");
        setVidgetInboxSessionId(sessionId || null);
        setVidgetInboxSearch(nextSearch ? `?${nextSearch}` : "");
        setAppView("vidget-inbox");
        if (typeof window !== "undefined" && resolved.sessionId) {
          const canonical = getVidgetInboxPath(resolved.projectId, { search: nextSearch });
          const current = `${window.location.pathname}${window.location.search}`;
          if (current !== canonical) {
            window.history.replaceState(
              {
                luxiaView: "vidget-inbox",
                projectId: resolved.projectId,
                sessionId: sessionId || null,
              },
              "",
              canonical,
            );
          }
        }
        return;
      }

      if (resolved.kind === "vidget-settings") {
        setActiveProjectId(resolved.projectId);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setVidgetId(resolved.vidgetId);
        setVidgetSettingsSection(parseVidgetSettingsTabFromSearch(search));
        setAppView("vidget-settings");
        return;
      }

      if (resolved.kind === "organization-users") {
        setActiveProjectId(null);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setAppView("organization-users");
        return;
      }

      if (resolved.kind === "organization-user") {
        setActiveProjectId(null);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(resolved.userId);
        setDataSourceSettingsId(null);
        setAppView("organization-user");
        return;
      }

      if (resolved.kind === "access-levels") {
        setActiveProjectId(null);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setAppView("access-levels");
        return;
      }

      if (resolved.kind === "data-sources") {
        setActiveProjectId(null);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setAppView("data-sources");
        return;
      }

      if (resolved.kind === "admin-pipelines") {
        if (!canAdministerAccessLevels(prototypeUserIdRef.current)) {
          toast.error("Only Organization Admins can access Pipeline Admin.");
          goHome(true);
          return;
        }
        setActiveProjectId(null);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setAppView("admin-pipelines");
        return;
      }

      if (resolved.kind === "personal-settings") {
        setAccountSettingsSection(
          personalSettingsSectionToAccountSection(parsePersonalSettingsTabFromSearch(search)),
        );
        setAccountSettingsOpen(true);
        setMobileNavOpen(false);
        setProjectAssistantOpen(false);
        return;
      }

      if (resolved.kind === "organization-settings") {
        const requested = parseOrganizationSettingsTabFromSearch(search);
        setAccountSettingsSection(
          requested === "analytics" && !canViewOrganizationAnalytics(prototypeUserId)
            ? "general"
            : organizationSettingsSectionToAccountSection(requested),
        );
        setAccountSettingsOpen(true);
        setMobileNavOpen(false);
        setProjectAssistantOpen(false);
        return;
      }

      if (resolved.kind === "access-level") {
        if (
          resolved.accessLevelId === "new"
          && !canAdministerAccessLevels()
        ) {
          toast.error(ACCESS_LEVEL_CREATE_DENIED_MESSAGE);
          setActiveProjectId(null);
          setSettingsConstellationId(null);
          setSettingsCapabilityPath(null);
          setAccessLevelId(null);
          setOrganizationUserId(null);
          setDataSourceSettingsId(null);
          setAppView("access-levels");
          if (typeof window !== "undefined") {
            const listPath = getAccessLevelsPath();
            if (window.location.pathname !== listPath) {
              window.history.replaceState({ luxiaView: "access-levels" }, "", listPath);
            }
          }
          return;
        }
        setActiveProjectId(null);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(resolved.accessLevelId);
        setOrganizationUserId(null);
        setDataSourceSettingsId(null);
        setAppView("access-level");
        return;
      }

      if (resolved.kind === "data-source-settings") {
        setActiveProjectId(null);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setDataSourceSettingsId(resolved.dataSourceId);
        setAppView("data-source-settings");
        return;
      }

      if (resolved.kind === "galaxy") {
        clearSettingsRouteState();
        const galaxyChat = findGalaxyChatForProject(
          resolved.projectId,
          chatsRef.current,
          homeProjectsRef.current,
        );
        if (!galaxyChat) {
          setActiveProjectId(resolved.projectId);
          setProjectBrowseMode("overview");
          setAppView("project");
          if (typeof window !== "undefined") {
            const overviewPath = getProjectPath(resolved.projectId);
            if (window.location.pathname !== overviewPath) {
              window.history.replaceState(
                { luxiaView: "project", projectId: resolved.projectId },
                "",
                overviewPath,
              );
            }
          }
          return;
        }
        setActiveProjectId(resolved.projectId);
        setActiveChat(galaxyChat.id);
        setAppView("chat");
        return;
      }

      if (resolved.kind === "chat") {
        clearSettingsRouteState();
        const chat = findChatById(resolved.chatId, chatsRef.current);
        if (!chat) {
          goHome(true);
          return;
        }
        if (
          resolved.projectId
          && chat.projectId
          && resolved.projectId !== chat.projectId
        ) {
          goHome(true);
          return;
        }
        if (
          resolved.constellationId
          && chat.chatType === "constellation"
          && chat.constellationId
          && resolved.constellationId !== chat.constellationId
        ) {
          goHome(true);
          return;
        }
        if (chat.projectId) setActiveProjectId(chat.projectId);
        setActiveChat(chat.id);
        setAppView("chat");
        return;
      }

      goHome(true);
    }

    function onPopState() {
      const pathname = window.location.pathname;
      const search = window.location.search;
      const resolved = resolveLuxiaPathname(pathname);

      if (appViewRef.current === "constellation-create") {
        const guard = constellationCreateGuardRef.current;
        if (guard?.isDirty() && resolved.kind !== "constellation-create") {
          const projectId = activeProjectIdRef.current;
          if (projectId) {
            const createPath = getConstellationCreatePath(projectId);
            window.history.pushState(
              { luxiaView: "constellation-create", projectId },
              "",
              createPath,
            );
          }
          guard.requestLeaveConfirmation(() => applyPath(pathname, search));
          return;
        }
      }

      const manageCapabilityPath = settingsCapabilityPathRef.current;
      if (
        appViewRef.current === "constellation-settings"
        && manageCapabilityPath
      ) {
        const guard = capabilityManageGuardRef.current;
        const stillOnSameCapability =
          resolved.kind === "constellation-settings"
          && resolved.capabilityPath === manageCapabilityPath
          && resolved.constellationId === settingsConstellationIdRef.current
          && resolved.projectId === activeProjectIdRef.current;
        if (guard?.isDirty() && !stillOnSameCapability) {
          const projectId = activeProjectIdRef.current;
          const constellationId = settingsConstellationIdRef.current;
          if (projectId && constellationId) {
            window.history.pushState(
              {
                luxiaView: "constellation-settings",
                projectId,
                constellationId,
                capabilityPath: manageCapabilityPath,
                section: "configuration",
              },
              "",
              getConstellationSettingsCapabilityPath(
                projectId,
                constellationId,
                manageCapabilityPath,
              ),
            );
          }
          guard.requestLeaveConfirmation(() => applyPath(pathname, search));
          return;
        }
      }

      applyPath(pathname, search);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);


  useEffect(() => {
    if (!isMobileNav) setMobileNavOpen(false);
  }, [isMobileNav]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isInspectorNarrow) setInspectorExpandedDespiteNarrow(false);
  }, [isInspectorNarrow]);

  useEffect(() => {
    if (!isGalaxyNarrow) setGalaxyExpandedDespiteNarrow(false);
  }, [isGalaxyNarrow]);

  useEffect(() => {
    setSidebarWidth((prev) => clampInspectorWidth(prev, viewportWidth, leftNavWidth));
    setGalaxyPanelWidth((prev) => clampGalaxyWidth(prev, viewportWidth, leftNavWidth));
  }, [viewportWidth, leftNavWidth]);

  const activeData = chats.find((c) => c.id === activeChat);
  const resolvedConstellation = resolveChatConstellation(activeData, allConstellations);
  /** Render-only stand-in when a Chat's constellationId is missing — never used for Settings routing. */
  const activeConstellation: Constellation = resolvedConstellation ?? {
    id: activeData?.constellationId ?? "constellation-unavailable",
    label: "Constellation unavailable",
    type: "database",
    projectId: activeData?.projectId ?? "",
    description: "",
  };
  const messages = chatMessages[activeChat] ?? [];

  const contextProjectId = appView === "home"
    || appView === "organization-users"
    || appView === "organization-user"
    || appView === "access-levels"
    || appView === "access-level"
    || appView === "data-sources"
    || appView === "data-source-settings"
    || appView === "admin-pipelines"
    ? null
    : appView === "project" || appView === "constellation-create" || appView === "constellation-settings" || appView === "galaxy-settings" || appView === "project-members" || appView === "project-vidgets" || appView === "project-pipelines" || appView === "pipeline-detail" || appView === "pipeline-run-detail" || appView === "vidget-inbox" || appView === "vidget-settings"
      ? activeProjectId
      : (activeData?.projectId ?? activeProjectId);

  const contextProjectLabel = useMemo(() => {
    if (!contextProjectId) return null;
    return getProjectNameById(contextProjectId, homeProjects, PROJECT_NAME_FALLBACK);
  }, [contextProjectId, homeProjects]);

  const activeProjectSection: ProjectNavSection | null = useMemo(() => {
    if (appView === "project") {
      if (projectBrowseMode === "chats") return "chats";
      if (projectBrowseMode === "constellations") return "constellations";
      if (projectBrowseMode === "dashboards") return "dashboard";
      if (projectBrowseMode === "virtual-assistants") return "virtual-assistant";
      return "overview";
    }
    if (appView === "constellation-settings") return "constellations";
    if (appView === "galaxy-settings") return "galaxy";
    if (appView === "constellation-create") return "constellations";
    if (appView === "project-members") return "members";
    if (appView === "project-vidgets" || appView === "vidget-inbox" || appView === "vidget-settings") return "vidgets";
    if (appView === "project-pipelines" || appView === "pipeline-detail" || appView === "pipeline-run-detail") return "pipelines";
    if (appView === "chat") {
      if (activeData?.chatType === "galaxy") return "galaxy";
      return "chats";
    }
    return null;
  }, [appView, projectBrowseMode, activeData?.chatType]);

  const galaxyNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const chat of INITIAL_CHATS) {
      if (chat.chatType === "galaxy") map[chat.id] = chat.label;
    }
    for (const chat of chats) {
      if (chat.chatType === "galaxy") map[chat.id] = chat.label;
    }
    return map;
  }, [chats]);

  const constellationNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of CANONICAL_CONSTELLATIONS) {
      map[item.id] = item.name;
    }
    for (const item of allConstellations) {
      map[item.id] = item.label;
    }
    return map;
  }, [allConstellations]);

  const galaxyInstructionById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const chat of [...INITIAL_CHATS, ...chats]) {
      if (chat.chatType !== "galaxy") continue;
      map[chat.id] = galaxySettingsById[chat.id]?.instruction ?? GALAXY_DEFAULT_INSTRUCTION;
    }
    return map;
  }, [chats, galaxySettingsById]);

  const overviewChats: ProjectOverviewChat[] = useMemo(() => {
    const source = [...INITIAL_CHATS, ...chats.filter((c) => !INITIAL_CHATS.some((i) => i.id === c.id))];
    const byProject = new Map<string, number>();
    return source.map((chat) => {
      const constellation = allConstellations.find((c) => c.id === chat.constellationId);
      const isGalaxy = chat.chatType === "galaxy";
      const projectOrder = byProject.get(chat.projectId) ?? 0;
      byProject.set(chat.projectId, projectOrder + 1);
      const hoursAgo = isGalaxy ? 1 + projectOrder * 5 : 2 + projectOrder * 8;
      return {
        id: chat.id,
        label: chat.label,
        projectId: chat.projectId,
        chatSource: isGalaxy ? ("galaxy" as const) : ("constellation" as const),
        constellationId: chat.constellationId,
        constellationName: constellation?.label,
        constellationSource: constellation
          ? constellation.type === "pdf"
            ? ("pdf" as const)
            : constellation.type === "csv"
              ? ("csv" as const)
              : ("database" as const)
          : undefined,
        lastOpenedAt:
          hoursAgo <= 2
            ? "1 hour ago"
            : hoursAgo <= 24
              ? "Yesterday"
              : `${Math.max(2, Math.round(hoursAgo / 24))} days ago`,
        lastOpenedTimestamp: Date.now() - hoursAgo * 3_600_000,
      };
    });
  }, [chats, allConstellations]);

  const overviewConstellations: ProjectOverviewConstellation[] = useMemo(
    () => allConstellations
      .filter((item) => {
        const settings = constellationSettingsById[item.id]
          ?? getConstellationSettingsRecord(item.id);
        const status = settings?.status
          ?? getCanonicalConstellationById(item.id)?.status
          ?? "active";
        return status !== "archived";
      })
      .map((item) => {
        const settings = constellationSettingsById[item.id]
          ?? getConstellationSettingsRecord(item.id);
        const canonical = getCanonicalConstellationById(item.id);
        const derivedSourceCount = settings
          ? settings.connectedSources.length
          : (getConstellationSourceCount(item.id)
            || CONSTELLATION_SOURCE_COUNTS[item.id]
            || 0);
        const updatedAtLabel = settings?.updatedAt ?? canonical?.updatedAt ?? "";
        const updatedAtTimestamp =
          parseLuxiaRelativeTimestamp(updatedAtLabel) ?? 0;
        return {
          id: item.id,
          label: item.label,
          type: item.type === "pdf" ? "pdf" : item.type === "csv" ? "csv" : "database",
          projectId: item.projectId,
          sourceCount: derivedSourceCount,
          description: item.description,
          updatedAtTimestamp,
        };
      }),
    [allConstellations, constellationSettingsById],
  );

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function handleSidebarResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = clampedInspectorWidth;
    function onMove(ev: MouseEvent) {
      const next = startW + startX - ev.clientX;
      setSidebarWidth(clampInspectorWidth(next, window.innerWidth, leftNavWidth));
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handleGalaxyResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    if (renderedGalaxyCollapsed) return;
    const startX = e.clientX;
    const startW = clampedGalaxyWidth;
    function onMove(ev: MouseEvent) {
      const next = startW + startX - ev.clientX;
      setGalaxyPanelWidth(clampGalaxyWidth(next, window.innerWidth, leftNavWidth));
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function expandGalaxyIntelligencePanel(options?: { force?: boolean }) {
    const force = options?.force === true;
    if (force) galaxyManualCollapseRef.current = false;
    if (!force && galaxyManualCollapseRef.current) return;

    const wasCollapsed = isGalaxyNarrow
      ? !galaxyExpandedDespiteNarrow
      : galaxyPanelCollapsed;

    setGalaxyPanelCollapsed(false);
    if (isGalaxyNarrow) setGalaxyExpandedDespiteNarrow(true);

    if (wasCollapsed) {
      setGalaxyPanelContentOpaque(false);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setGalaxyPanelContentOpaque(true));
      });
    } else {
      setGalaxyPanelContentOpaque(true);
    }
  }

  function collapseGalaxyIntelligencePanel() {
    galaxyManualCollapseRef.current = true;
    setGalaxyPanelContentOpaque(false);
    if (isGalaxyNarrow) setGalaxyExpandedDespiteNarrow(false);
    setGalaxyPanelCollapsed(true);
    window.setTimeout(() => setGalaxyPanelContentOpaque(true), 180);
  }

  function handleLeftNavToggle() {
    if (isMobileNav) {
      setMobileNavOpen((prev) => !prev);
      return;
    }
    setLeftNavCollapsedPreference((prev) => !prev);
  }

  function handleInspectorCollapseToggle() {
    if (isInspectorNarrow) {
      setInspectorExpandedDespiteNarrow((prev) => !prev);
      return;
    }
    setSidebarCollapsedPreference((prev) => !prev);
  }

  function handleNewChat() {
    setNewChatLockedProjectId(null);
    setAppView("chat");
    setShowNewChatModal(true);
  }

  function handleNewChatFromProject(projectId: string) {
    setNewChatLockedProjectId(projectId);
    setActiveProjectId(projectId);
    setShowNewChatModal(true);
  }

  function handleNavigateHome() {
    setAppView("home");
    setHomeBrowseMode("overview");
    setActiveProjectId(null);
    setProjectBrowseMode("overview");
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setSettingsSection("general");
    setAccessLevelId(null);
    setDataSourceSettingsId(null);
    setShowNewChatModal(false);
    setNewChatLockedProjectId(null);
    setShowNewProjectModal(false);
    setHomeScrollRequest((value) => value + 1);
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/home" || window.location.pathname === "/home/") {
        window.history.replaceState({ luxiaView: "home" }, "", "/");
      } else if (!isHomePath(window.location.pathname)) {
        window.history.pushState({ luxiaView: "home" }, "", "/");
      }
    }
  }

  /** Sidebar / chrome navigation while create or capability-manage drafts are dirty. */
  function whenUnsavedNavigationAllows(proceed: () => void) {
    runWithUnsavedNavigationGuard(constellationCreateGuardRef.current, () => {
      runWithUnsavedNavigationGuard(capabilityManageGuardRef.current, proceed);
    });
  }

  function syncConstellationSettingsPath(
    projectId: string,
    constellationId: string,
    options?: {
      capabilityPath?: string | null;
      section?: ConstellationSettingsSectionId;
      /** Include `?tab=` even for General (tab switches / explicit destinations). */
      explicitTab?: boolean;
      replace?: boolean;
    },
  ) {
    if (typeof window === "undefined") return;
    const capabilityPath = options?.capabilityPath;
    const next = capabilityPath
      ? getConstellationSettingsCapabilityPath(projectId, constellationId, capabilityPath)
      : getConstellationSettingsPath(projectId, constellationId, {
          tab: constellationSettingsSectionToTab(options?.section ?? "general"),
          includeTabQuery: Boolean(options?.explicitTab),
        });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === next) return;
    const state = {
      luxiaView: "constellation-settings" as const,
      projectId,
      constellationId,
      capabilityPath: capabilityPath ?? undefined,
      section: options?.section ?? "general",
    };
    if (options?.replace) {
      window.history.replaceState(state, "", next);
    } else {
      window.history.pushState(state, "", next);
    }
  }

  function handleOpenConstellationSettings(
    projectId: string,
    constellationId: string,
    section: ConstellationSettingsSectionId = "general",
    options?: { explicitTab?: boolean; focusHeading?: boolean },
  ) {
    setActiveProjectId(projectId);
    setSettingsConstellationId(constellationId);
    setSettingsCapabilityPath(null);
    setSettingsSection(section);
    setAppView("constellation-settings");
    syncConstellationSettingsPath(projectId, constellationId, {
      section,
      explicitTab: options?.explicitTab ?? section !== "general",
    });
    if (options?.focusHeading) {
      setSettingsFocusHeadingToken((value) => value + 1);
    }
  }

  function handleOpenConstellationCapability(
    projectId: string,
    constellationId: string,
    capabilityId: CapsuleCapabilityId,
  ) {
    const capabilityPath = CAPSULE_CAPABILITY_PATH[capabilityId];
    setActiveProjectId(projectId);
    setSettingsConstellationId(constellationId);
    setSettingsCapabilityPath(capabilityPath);
    setSettingsSection("configuration");
    setAppView("constellation-settings");
    syncConstellationSettingsPath(projectId, constellationId, { capabilityPath });
  }

  function handleConstellationSettingsSectionChange(
    projectId: string,
    constellationId: string,
    section: ConstellationSettingsSectionId,
  ) {
    if (section === settingsSection && !settingsCapabilityPath) return;
    setSettingsSection(section);
    setSettingsCapabilityPath(null);
    syncConstellationSettingsPath(projectId, constellationId, {
      section,
      explicitTab: true,
    });
  }

  function handleOpenConstellationsList(projectId: string) {
    setActiveProjectId(projectId);
    setProjectBrowseMode("constellations");
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAppView("project");
    if (typeof window !== "undefined") {
      const next = getConstellationsPath(projectId);
      if (window.location.pathname !== next) {
        window.history.pushState(
          { luxiaView: "project", projectId, browse: "constellations" },
          "",
          next,
        );
      }
    }
  }

  function handleOpenChatsList(projectId: string) {
    setActiveProjectId(projectId);
    setProjectBrowseMode("chats");
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAppView("project");
    if (typeof window !== "undefined") {
      const next = getProjectChatsPath(projectId);
      if (window.location.pathname !== next) {
        window.history.pushState(
          { luxiaView: "project", projectId, browse: "chats" },
          "",
          next,
        );
      }
    }
  }

  function handleOpenActivityList(projectId: string) {
    setActiveProjectId(projectId);
    setProjectBrowseMode("activity");
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAppView("project");
    if (typeof window !== "undefined") {
      const next = getProjectActivityPath(projectId);
      if (window.location.pathname !== next) {
        window.history.pushState(
          { luxiaView: "project", projectId, browse: "activity" },
          "",
          next,
        );
      }
    }
  }

  function handleOpenProjectMembers(projectId: string) {
    setActiveProjectId(projectId);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setVidgetId(null);
    setAppView("project-members");
    if (typeof window !== "undefined") {
      const next = getProjectMembersPath(projectId);
      if (window.location.pathname !== next) {
        window.history.pushState({ luxiaView: "project-members", projectId }, "", next);
      }
    }
  }

  function handleOpenProjectVidgets(projectId: string) {
    setActiveProjectId(projectId);
    setVidgetId(null);
    setVidgetSettingsSection("general");
    setVidgetInboxSessionId(null);
    setVidgetInboxSearch("");
    setAppView("project-vidgets");
    if (typeof window !== "undefined") {
      const next = getProjectVidgetsPath(projectId);
      if (window.location.pathname !== next) {
        window.history.pushState({ luxiaView: "project-vidgets", projectId }, "", next);
      }
    }
  }

  function handleOpenProjectPipelines(projectId: string) {
    if (!canViewProjectPipelines()) {
      handleOpenProjectOverview(projectId, "overview");
      return;
    }
    setActiveProjectId(projectId);
    setVidgetId(null);
    setPipelineId(null);
    setPipelineRunId(null);
    setAppView("project-pipelines");
    if (typeof window !== "undefined") {
      const next = getProjectPipelinesPath(projectId);
      if (window.location.pathname !== next) {
        window.history.pushState({ luxiaView: "project-pipelines", projectId }, "", next);
      }
    }
  }

  function handleOpenPipelineDetail(projectId: string, nextPipelineId: string) {
    if (!canViewProjectPipelines()) {
      handleOpenProjectOverview(projectId, "overview");
      return;
    }
    // Always enter the detail route; missing pipeline renders generic not-found.
    setActiveProjectId(projectId);
    setVidgetId(null);
    setPipelineId(nextPipelineId);
    setPipelineRunId(null);
    setPipelineRunFocusTaskKey(null);
    setAppView("pipeline-detail");
    if (typeof window !== "undefined") {
      const next = getPipelinePath(projectId, nextPipelineId);
      if (window.location.pathname !== next) {
        window.history.pushState(
          { luxiaView: "pipeline-detail", projectId, pipelineId: nextPipelineId },
          "",
          next,
        );
      }
    }
  }

  function handleOpenPipelineRun(
    projectId: string,
    nextPipelineId: string,
    nextRunId: string,
    taskKey?: string,
  ) {
    if (!canViewProjectPipelines()) {
      handleOpenProjectOverview(projectId, "overview");
      return;
    }
    const pipeline = getPipelineById(projectId, nextPipelineId, pipelinesState);
    const run = pipeline
      ? getRunById(projectId, nextPipelineId, nextRunId, pipelineRunsState)
      : null;
    if (pipeline && !run) {
      // Parent exists but run does not — return to Pipeline Detail.
      handleOpenPipelineDetail(projectId, nextPipelineId);
      return;
    }
    // Missing parent pipeline keeps the run URL and shows generic Pipeline not-found.
    setActiveProjectId(projectId);
    setVidgetId(null);
    setPipelineId(nextPipelineId);
    setPipelineRunId(nextRunId);
    setPipelineRunFocusTaskKey(taskKey ?? null);
    setAppView("pipeline-run-detail");
    if (typeof window !== "undefined") {
      const next = getPipelineRunPath(projectId, nextPipelineId, nextRunId);
      if (window.location.pathname !== next) {
        window.history.pushState(
          {
            luxiaView: "pipeline-run-detail",
            projectId,
            pipelineId: nextPipelineId,
            runId: nextRunId,
          },
          "",
          next,
        );
      }
    }
  }

  function handlePrototypeRunPipeline(
    projectId: string,
    nextPipelineId: string,
  ): string | null {
    const pipeline = getPipelineById(projectId, nextPipelineId, pipelinesState);
    if (!pipeline) return null;
    const role = projectRoleFor(projectId);
    const orgAdmin = isOrganizationAdmin(prototypeUserId);
    if (!canTriggerPipeline(pipeline, role, orgAdmin)) {
      toast.error(PIPELINE_TRIGGER_DENIED_MESSAGE);
      return null;
    }
    const { run, tasks } = createPrototypeRunningRun({ projectId, pipeline });
    setPipelineRunsState((prev) => [run, ...prev]);
    setPipelineTasksState((prev) => [...tasks, ...prev]);
    setPipelinesState((prev) =>
      prev.map((item) =>
        item.id === pipeline.id && item.projectId === projectId
          ? { ...item, status: "running", lastRunAt: run.startedAt }
          : item,
      ),
    );
    toast.success("Pipeline run started", {
      action: {
        label: "View run",
        onClick: () => {
          handleOpenPipelineRun(projectId, nextPipelineId, run.id);
        },
      },
    });
    return run.id;
  }

  function handlePrototypeSavePipelineVariables(
    projectId: string,
    nextPipelineId: string,
    nextVariables: PipelineVariableRecord[],
  ) {
    const pipeline = getPipelineById(projectId, nextPipelineId, pipelinesState);
    if (!pipeline) return;
    const role = projectRoleFor(projectId);
    const orgAdmin = isOrganizationAdmin(prototypeUserId);
    if (!canUpdatePipelineVariables(pipeline, role, orgAdmin)) {
      toast.error(PIPELINE_VARIABLES_DENIED_MESSAGE);
      return;
    }
    setPipelineVariablesState((prev) => {
      const ids = new Set(nextVariables.map((item) => item.id));
      return [
        ...prev.filter((item) => !ids.has(item.id)),
        ...nextVariables.map((item) => ({
          ...item,
          allowedValues: item.allowedValues ? [...item.allowedValues] : undefined,
        })),
      ];
    });
    toast.success("Changes saved.");
  }

  function handlePrototypeRetryPipelineTask(
    projectId: string,
    nextPipelineId: string,
    nextRunId: string,
    taskId: string,
  ): boolean {
    const pipeline = getPipelineById(projectId, nextPipelineId, pipelinesState);
    if (!pipeline) return false;
    const task = pipelineTasksState.find(
      (item) =>
        item.id === taskId
        && item.runId === nextRunId
        && item.pipelineId === nextPipelineId
        && item.projectId === projectId,
    );
    if (!task) return false;
    const role = projectRoleFor(projectId);
    const orgAdmin = isOrganizationAdmin(prototypeUserId);
    if (!canRetryFailedTask(pipeline, task.status, role, orgAdmin)) {
      toast.error(PIPELINE_RETRY_DENIED_MESSAGE);
      return false;
    }
    setPipelineTasksState((prev) => applyPrototypeTaskRetry(prev, taskId));
    setPipelineRunsState((prev) =>
      prev.map((item) =>
        item.id === nextRunId
          ? {
              ...item,
              status: "running",
              durationSeconds: null,
              failedTaskCount: undefined,
            }
          : item,
      ),
    );
    setPipelinesState((prev) =>
      prev.map((item) =>
        item.id === nextPipelineId && item.projectId === projectId
          ? { ...item, status: "running", lastRunAt: new Date().toISOString() }
          : item,
      ),
    );
    toast.success("Retry requested");
    return true;
  }

  function handleOpenVidgetInbox(
    projectId: string,
    options?: {
      sessionId?: string | null;
      query?: Partial<VidgetInboxQuery>;
      search?: string;
      history?: "push" | "replace";
    },
  ) {
    if (!canAccessProject(projectId, projectMembershipsState, prototypeUserId)) {
      handleNavigateHome();
      return;
    }
    if (!canReviewVidgetInbox(projectRoleFor(projectId))) {
      toast.error(VIDGET_INBOX_DENIED_MESSAGE);
      handleOpenProjectVidgets(projectId);
      return;
    }
    const parsed = options?.search
      ? parseVidgetInboxQueryFromSearch(options.search)
      : vidgetInboxQueryFromPartial(options?.query);
    const query = options && Object.prototype.hasOwnProperty.call(options, "sessionId")
      ? { ...parsed, sessionId: options.sessionId?.trim() || "" }
      : parsed;
    const search = serializeVidgetInboxQuery(query);
    const sessionId = query.sessionId || null;
    setActiveProjectId(projectId);
    setVidgetId(null);
    setVidgetInboxSessionId(sessionId);
    setVidgetInboxSearch(search ? `?${search}` : "");
    setAppView("vidget-inbox");
    if (typeof window !== "undefined") {
      const next = getVidgetInboxPath(projectId, { search });
      const current = `${window.location.pathname}${window.location.search}`;
      if (current === next) return;
      const state = { luxiaView: "vidget-inbox", projectId, sessionId };
      if (options?.history === "replace") {
        window.history.replaceState(state, "", next);
      } else {
        window.history.pushState(state, "", next);
      }
    }
  }

  function handleOpenVidgetSettings(
    projectId: string,
    nextVidgetId: string,
    section?: VidgetSettingsSectionId,
    focusPreview = false,
  ) {
    const resolvedSection = focusPreview ? "interface" : (section ?? "general");
    setActiveProjectId(projectId);
    setVidgetId(nextVidgetId);
    setVidgetSettingsSection(resolvedSection);
    setVidgetSettingsFocusPreview(focusPreview);
    setAppView("vidget-settings");
    if (typeof window !== "undefined") {
      const next = getVidgetSettingsPath(projectId, nextVidgetId, {
        tab: vidgetSettingsSectionToTab(resolvedSection),
      });
      const current = `${window.location.pathname}${window.location.search}`;
      if (current !== next) {
        window.history.pushState(
          { luxiaView: "vidget-settings", projectId, vidgetId: nextVidgetId, section: resolvedSection },
          "",
          next,
        );
      }
    }
  }

  function handleOpenCreateVidget(projectId: string, preset: VidgetCreateSourcePreset) {
    if (!canManageVidgets(projectRoleFor(projectId))) {
      toast.error(VIDGET_MANAGE_DENIED_MESSAGE);
      return;
    }
    setCreateVidgetProjectId(projectId);
    setCreateVidgetPreset(preset);
    setCreateVidgetOpen(true);
  }

  function handleCreateVidgetSubmit(payload: CreateVidgetSubmitPayload): boolean {
    const projectId = createVidgetProjectId;
    if (!projectId) return false;
    if (!canManageVidgets(projectRoleFor(projectId))) {
      toast.error(VIDGET_MANAGE_DENIED_MESSAGE);
      return false;
    }

    const project = homeProjects.find((entry) => entry.id === projectId);
    const projectGalaxyId = project?.galaxyId
      ?? findGalaxyChatForProject(projectId, chats, homeProjects)?.id
      ?? null;

    const projectConstellations = allConstellations.map((item) => ({
      id: item.id,
      projectId: item.projectId,
    }));

    const resolved = resolveVidgetCreateSource(payload, {
      projectId,
      projectGalaxyId,
      projectConstellations,
    });
    if (!resolved.ok) {
      toast.error(resolved.message);
      return false;
    }

    try {
      const record = buildEmptyVidget({
        projectId,
        name: payload.name,
        channel: payload.channel,
        sourceType: resolved.source.sourceType,
        galaxyId: resolved.source.galaxyId,
        constellationId: resolved.source.constellationId,
        galaxyConstellationIds: resolved.source.galaxyConstellationIds,
        routingMode: payload.routingMode,
      });
      setVidgetsState((prev) => [record, ...prev]);
      setCreateVidgetOpen(false);
      toast.success("Vidget created");
      handleOpenVidgetSettings(projectId, record.id);
      return true;
    } catch {
      toast.error("Could not create Vidget with the selected source.");
      return false;
    }
  }

  function handleOpenAccessLevels() {
    setActiveProjectId(null);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(null);
    setOrganizationUserId(null);
    setDataSourceSettingsId(null);
    setAppView("access-levels");
    if (typeof window !== "undefined") {
      const next = getAccessLevelsPath();
      if (window.location.pathname !== next) {
        window.history.pushState({ luxiaView: "access-levels" }, "", next);
      }
    }
  }

  function handleOpenOrganizationUsers() {
    setActiveProjectId(null);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(null);
    setOrganizationUserId(null);
    setDataSourceSettingsId(null);
    setAppView("organization-users");
    if (typeof window !== "undefined") {
      const next = getOrganizationUsersPath();
      if (window.location.pathname !== next) {
        window.history.pushState({ luxiaView: "organization-users" }, "", next);
      }
    }
  }

  function handleOpenOrganizationUser(userId: string) {
    setActiveProjectId(null);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(null);
    setOrganizationUserId(userId);
    setDataSourceSettingsId(null);
    setAppView("organization-user");
    if (typeof window !== "undefined") {
      const next = getOrganizationUserPath(userId);
      if (window.location.pathname !== next) {
        window.history.pushState(
          { luxiaView: "organization-user", userId },
          "",
          next,
        );
      }
    }
  }

  function handleInviteOrganizationUser(payload: InviteOrganizationUserPayload) {
    if (!canAdministerAccessLevels(prototypeUserId)) {
      toast.error("You do not have permission to invite organization users.");
      return;
    }
    const id = `user-${Date.now()}`;
    const invitedAt = new Date().toISOString();
    const newUser: OrganizationUser = {
      id,
      name: payload.name,
      email: payload.email,
      orgRole: payload.orgRole,
      status: "pending",
      jobTitle: "",
      mobile: "",
      mfaEnabled: false,
      mfaMethod: null,
    };
    setOrganizationUsersState((prev) => [...prev, newUser]);
    if (payload.projectAssignments.length > 0) {
      setProjectMembershipsState((prev) => [
        ...prev,
        ...payload.projectAssignments.map((assignment, index) => ({
          id: `pm-invite-${Date.now()}-${index}`,
          projectId: assignment.projectId,
          userId: id,
          projectRole: assignment.projectRole,
          status: "pending" as const,
          joinedOrInvitedAt: invitedAt,
        })),
      ]);
    }
    if (payload.accessLevelIds.length > 0) {
      setAccessLevelsState((prev) =>
        prev.map((level) => {
          if (!payload.accessLevelIds.includes(level.id)) return level;
          if (level.memberUserIds.includes(id)) return level;
          return {
            ...level,
            memberUserIds: [...level.memberUserIds, id],
            updatedAt: invitedAt,
          };
        }),
      );
    }
    toast.success("Invitation sent.");
    handleOpenOrganizationUser(id);
  }

  function removeOrganizationUserCompletely(userId: string) {
    setOrganizationUsersState((prev) => prev.filter((user) => user.id !== userId));
    setProjectMembershipsState((prev) =>
      prev.filter((membership) => membership.userId !== userId),
    );
    setAccessLevelsState((prev) =>
      prev.map((level) => ({
        ...level,
        memberUserIds: level.memberUserIds.filter((id) => id !== userId),
      })),
    );
    if (prototypeUserId === userId) {
      const fallback =
        organizationUsersState.find(
          (user) => user.id !== userId && user.status === "active",
        )?.id
        ?? CURRENT_USER_ID;
      setPrototypeUserId(fallback);
    }
    if (organizationUserId === userId) {
      handleOpenOrganizationUsers();
    }
  }

  function handleOpenDataSources() {
    setActiveProjectId(null);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(null);
    setOrganizationUserId(null);
    setDataSourceSettingsId(null);
    setDataSourceSettingsFocus(null);
    setAppView("data-sources");
    if (typeof window !== "undefined") {
      const next = getDataSourcesPath();
      if (window.location.pathname !== next) {
        window.history.pushState({ luxiaView: "data-sources" }, "", next);
      }
    }
  }

  function handleOpenAdminPipelines() {
    if (!canAdministerAccessLevels(prototypeUserId)) {
      toast.error("Only Organization Admins can access Pipeline Admin.");
      return;
    }
    setActiveProjectId(null);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(null);
    setOrganizationUserId(null);
    setDataSourceSettingsId(null);
    setAppView("admin-pipelines");
    if (typeof window !== "undefined") {
      const next = getAdminPipelinesPath();
      if (window.location.pathname !== next) {
        window.history.pushState({ luxiaView: "admin-pipelines" }, "", next);
      }
    }
  }

  function handleOpenAccountSettings(section: AccountSettingsSectionId = accountSettingsSection) {
    const next =
      section === "analytics" && !canViewOrganizationAnalytics(prototypeUserId)
        ? "general"
        : section;
    setProjectAssistantOpen(false);
    setAccountSettingsSection(next);
    setAccountSettingsOpen(true);
    setMobileNavOpen(false);
  }

  function handleAccountSettingsSectionChange(section: AccountSettingsSectionId) {
    if (section === "analytics" && !canViewOrganizationAnalytics(prototypeUserId)) return;
    setAccountSettingsSection(section);
  }

  function handleCloseAccountSettings() {
    setAccountSettingsOpen(false);
  }

  function handleUpdateProfile(
    userId: string,
    draft: { name: string; jobTitle: string; mobile: string },
  ) {
    const nextName = draft.name.trim();
    if (!nextName) return;
    setOrganizationUsersState((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              name: nextName,
              jobTitle: draft.jobTitle.trim(),
              mobile: draft.mobile.trim(),
            }
          : user,
      ),
    );
  }

  function handleUpdateProfileMfa(
    userId: string,
    next: { mfaEnabled: boolean; mfaMethod: PrototypeMfaMethod | null },
  ) {
    setOrganizationUsersState((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              mfaEnabled: next.mfaEnabled,
              mfaMethod: next.mfaEnabled ? next.mfaMethod : null,
            }
          : user,
      ),
    );
  }

  function handleSettingsOpenDataSources() {
    setAccountSettingsOpen(false);
    handleOpenDataSources();
  }

  function handleSettingsOpenUsers() {
    setAccountSettingsOpen(false);
    handleOpenOrganizationUsers();
  }

  function handleSettingsOpenAccessLevels() {
    setAccountSettingsOpen(false);
    handleOpenAccessLevels();
  }

  function handleOpenAccessLevel(id: string) {
    if (id === "new" && !canAdministerAccessLevels(prototypeUserId)) {
      toast.error(ACCESS_LEVEL_CREATE_DENIED_MESSAGE);
      return;
    }
    setActiveProjectId(null);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(id);
    setOrganizationUserId(null);
    setDataSourceSettingsId(null);
    setAppView("access-level");
    if (typeof window !== "undefined") {
      const next = getAccessLevelPath(id);
      if (window.location.pathname !== next) {
        window.history.pushState({ luxiaView: "access-level", accessLevelId: id }, "", next);
      }
    }
  }

  function handleCreateAccessLevel() {
    if (!canAdministerAccessLevels(prototypeUserId)) {
      toast.error(ACCESS_LEVEL_CREATE_DENIED_MESSAGE);
      return;
    }
    accessLevelCreateDraftRef.current = null;
    handleOpenAccessLevel("new");
  }

  function handleOpenDataSourceSettings(
    dataSourceId: string,
    options?: {
      focus?: DataSourceSettingsFocusSection;
      /**
       * Trusted just-created catalog row from the local create flow.
       * Merged into the access catalog only when React state has not committed yet.
       * Existing-library opens must omit this — they still use live dataSourcesState.
       */
      createdSource?: DataSourceCatalogItem;
    },
  ) {
    // Avoid stale-state deny after create: setDataSourcesState has not re-rendered yet.
    const created = options?.createdSource;
    const catalogForAccess =
      created && created.id === dataSourceId
        ? (
          dataSourcesState.some((item) => item.id === dataSourceId)
            ? dataSourcesState
            : [...dataSourcesState, created]
        )
        : dataSourcesState;

    const allowed = canUserAccessDataSource(
      dataSourceId,
      accessLevelsState,
      catalogForAccess,
      prototypeUserId,
    );
    if (!allowed) {
      toast.error("You do not have access to this Data Source.");
      handleOpenDataSources();
      return;
    }
    setActiveProjectId(null);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(null);
    setDataSourceSettingsId(dataSourceId);
    setDataSourceSettingsFocus(options?.focus ?? null);
    setAppView("data-source-settings");
    if (typeof window !== "undefined") {
      const next = getDataSourceSettingsPath(dataSourceId);
      if (window.location.pathname !== next) {
        window.history.pushState(
          { luxiaView: "data-source-settings", dataSourceId },
          "",
          next,
        );
      }
    }
  }

  function resolveConstellationSettingsRecordForView(
    constellationId: string,
  ): ConstellationSettingsRecord | undefined {
    const existing = constellationSettingsById[constellationId];
    if (existing) {
      return withLiveProjectNameOnSettingsRecord(existing, homeProjects);
    }

    const seeded = getConstellationSettingsRecord(constellationId);
    if (seeded) return cloneConstellationSettingsRecord(seeded);

    const constellation = allConstellations.find((item) => item.id === constellationId);
    if (!constellation) return undefined;

    return buildSettingsForConstellation({
      id: constellation.id,
      projectId: constellation.projectId,
      projectName: getProjectNameById(constellation.projectId, homeProjects),
      name: constellation.label,
      description: constellation.description ?? HERO_DESCRIPTION_PLACEHOLDER,
      type: constellation.type,
    });
  }

  function upsertConstellationSettingsRecord(
    constellationId: string,
    updater: (record: ConstellationSettingsRecord) => ConstellationSettingsRecord,
  ) {
    setConstellationSettingsById((prev) => {
      let current = prev[constellationId];
      if (!current) {
        const seeded = getConstellationSettingsRecord(constellationId);
        if (seeded) {
          current = cloneConstellationSettingsRecord(seeded);
        } else {
          const constellation = allConstellations.find((item) => item.id === constellationId);
          if (!constellation) return prev;
          current = buildSettingsForConstellation({
            id: constellation.id,
            projectId: constellation.projectId,
            projectName: getProjectNameById(constellation.projectId, homeProjects),
            name: constellation.label,
            description: constellation.description ?? HERO_DESCRIPTION_PLACEHOLDER,
            type: constellation.type,
          });
        }
      }
      return {
        ...prev,
        [constellationId]: updater(cloneConstellationSettingsRecord(current)),
      };
    });
  }

  function handleSaveConstellationSettings(
    constellationId: string,
    draft: ConstellationSettingsDraft,
  ) {
    const current = resolveConstellationSettingsRecordForView(constellationId);
    if (!current) return;
    if (!guardConstellationConfigure(current.projectId)) return;
    upsertConstellationSettingsRecord(constellationId, (existing) => ({
      ...existing,
      name: draft.name,
      description: draft.description,
      updatedAt: "Just now",
    }));
    setRuntimeConstellations((prev) => prev.map((item) => (
      item.id === constellationId
        ? { ...item, label: draft.name, description: draft.description }
        : item
    )));
  }

  function resolveConstellationSourceEntry(
    constellation: Constellation,
    settingsById: Record<string, ConstellationSettingsRecord> = constellationSettingsById,
  ): ProjectConstellationSourceEntry {
    const settings = settingsById[constellation.id]
      ?? getConstellationSettingsRecord(constellation.id);
    const canonical = getCanonicalConstellationById(constellation.id);
    const status = settings?.status ?? canonical?.status ?? "active";
    const dataSourceIds = settings
      ? settings.connectedSources.map((source) => source.id)
      : (canonical?.dataSourceIds ?? []);
    return {
      constellationId: constellation.id,
      projectId: constellation.projectId,
      status,
      dataSourceIds,
    };
  }

  function buildProjectSourceEntries(
    projectId: string,
    options?: {
      settingsById?: Record<string, ConstellationSettingsRecord>;
      constellations?: Constellation[];
      omitConstellationIds?: ReadonlySet<string>;
    },
  ): ProjectConstellationSourceEntry[] {
    const settingsById = options?.settingsById ?? constellationSettingsById;
    const constellations = options?.constellations ?? allConstellations;
    const omit = options?.omitConstellationIds;
    return constellations
      .filter((item) => item.projectId === projectId && !omit?.has(item.id))
      .map((item) => resolveConstellationSourceEntry(item, settingsById));
  }

  function resolveConnectedSourceIds(constellationId: string): string[] {
    const record = resolveConstellationSettingsRecordForView(constellationId);
    return record?.connectedSources.map((source) => source.id) ?? [];
  }

  function assertConstellationUseAccess(
    projectId: string,
    constellationId: string,
  ): boolean {
    const membership = getActiveProjectMembership(
      projectId,
      projectMembershipsState,
      prototypeUserId,
    );
    const connectedSourceIds = resolveConnectedSourceIds(constellationId);
    const result = evaluateConstellationUseAccess({
      userId: prototypeUserId,
      projectRole: membership?.projectRole ?? null,
      membershipStatus: membership?.status,
      connectedSourceIds,
      accessLevels: accessLevelsState,
      dataSources: dataSourcesState,
    });
    if (!result.available) {
      setConstellationAccessBlock({
        projectId,
        constellationId,
        reason: result.reason,
      });
      return false;
    }
    return true;
  }

  function projectRoleFor(projectId: string) {
    return getActiveProjectMembership(
      projectId,
      projectMembershipsState,
      prototypeUserId,
    )?.projectRole ?? null;
  }

  function userCanArchiveProject(projectId: string): boolean {
    return canArchiveProject(projectRoleFor(projectId));
  }

  function userCanDeleteProject(projectId: string): boolean {
    return canDeleteProject(projectRoleFor(projectId));
  }

  function userCanRestoreProject(projectId: string): boolean {
    return canArchiveProject(projectRoleFor(projectId));
  }

  function userCanConfigureProject(projectId: string): boolean {
    return canAdministerProjectConfiguration(
      prototypeUserId,
      projectRoleFor(projectId),
    );
  }

  function isConstellationWorkingAccessible(
    projectId: string,
    constellationId: string,
  ): boolean {
    if (!canAccessProject(projectId, projectMembershipsState, prototypeUserId)) {
      return false;
    }
    const membership = getActiveProjectMembership(
      projectId,
      projectMembershipsState,
      prototypeUserId,
    );
    return evaluateConstellationUseAccess({
      userId: prototypeUserId,
      projectRole: membership?.projectRole ?? null,
      membershipStatus: membership?.status,
      connectedSourceIds: resolveConnectedSourceIds(constellationId),
      accessLevels: accessLevelsState,
      dataSources: dataSourcesState,
    }).available;
  }

  function isChatWorkingAccessible(chat: {
    chatType: string;
    projectId: string;
    constellationId?: string;
  }): boolean {
    return isWorkingChatAccessible({
      chatType: chat.chatType,
      projectId: chat.projectId,
      constellationId: chat.constellationId,
      userId: prototypeUserId,
      memberships: projectMembershipsState,
      accessLevels: accessLevelsState,
      dataSources: dataSourcesState,
      connectedSourceIds: chat.constellationId
        ? resolveConnectedSourceIds(chat.constellationId)
        : [],
    });
  }

  function guardConstellationConfigure(projectId: string): boolean {
    if (canAdministerProjectConfiguration(prototypeUserId, projectRoleFor(projectId))) {
      return true;
    }
    toast.error(CONSTELLATION_CONFIGURE_DENIED_MESSAGE);
    return false;
  }

  function guardConstellationKnowledge(projectId: string): boolean {
    if (canEditConstellationKnowledge(projectRoleFor(projectId))) {
      return true;
    }
    toast.error(CONSTELLATION_KNOWLEDGE_DENIED_MESSAGE);
    return false;
  }

  function guardAccessLevelMutation(): boolean {
    if (canAdministerAccessLevels(prototypeUserId)) return true;
    toast.error(ACCESS_LEVEL_DENIED_MESSAGE);
    return false;
  }

  function guardConstellationArchive(projectId: string): boolean {
    const membership = getActiveProjectMembership(
      projectId,
      projectMembershipsState,
      prototypeUserId,
    );
    if (canArchiveConstellation(membership?.projectRole)) return true;
    toast.error(PROJECT_ACTION_DENIED_MESSAGE);
    return false;
  }

  function guardConstellationDelete(projectId: string): boolean {
    const membership = getActiveProjectMembership(
      projectId,
      projectMembershipsState,
      prototypeUserId,
    );
    if (canDeleteConstellation(membership?.projectRole)) return true;
    toast.error(PROJECT_ACTION_DENIED_MESSAGE);
    return false;
  }

  function guardProjectArchive(projectId: string): boolean {
    const membership = getActiveProjectMembership(
      projectId,
      projectMembershipsState,
      prototypeUserId,
    );
    if (canArchiveProject(membership?.projectRole)) return true;
    toast.error(PROJECT_ACTION_DENIED_MESSAGE);
    return false;
  }

  function guardProjectDelete(projectId: string): boolean {
    const membership = getActiveProjectMembership(
      projectId,
      projectMembershipsState,
      prototypeUserId,
    );
    if (canDeleteProject(membership?.projectRole)) return true;
    toast.error(PROJECT_ACTION_DENIED_MESSAGE);
    return false;
  }

  useEffect(() => {
    setPrototypeCurrentUserId(prototypeUserId);
  }, [prototypeUserId]);

  const prototypeUser = useMemo(
    () =>
      organizationUsersState.find((user) => user.id === prototypeUserId)
      ?? organizationUsersState.find((user) => user.status === "active")
      ?? ORGANIZATION_USERS[0]!,
    [organizationUsersState, prototypeUserId],
  );

  const prototypeProjectRole = useMemo(() => {
    const projectId = activeProjectId
      ?? chats.find((chat) => chat.id === activeChat)?.projectId
      ?? null;
    if (!projectId) return null;
    return getActiveProjectMembership(
      projectId,
      projectMembershipsState,
      prototypeUserId,
    )?.projectRole ?? null;
  }, [activeProjectId, activeChat, chats, projectMembershipsState, prototypeUserId]);

  function handlePrototypeUserChange(userId: string) {
    if (!organizationUsersState.some((user) => user.id === userId && user.status === "active")) {
      return;
    }
    setPrototypeCurrentUserId(userId);
    setPrototypeUserId(userId);
    setConstellationAccessBlock(null);
    setGalaxyAccessBlock(null);
    setMobileNavOpen(false);

    if (
      appView === "data-source-settings"
      && dataSourceSettingsId
      && !canUserAccessDataSource(
        dataSourceSettingsId,
        accessLevelsState,
        dataSourcesState,
        userId,
      )
    ) {
      handleOpenDataSources();
      return;
    }

    if (
      appView === "access-level"
      && accessLevelId === "new"
      && !canAdministerAccessLevels(userId)
    ) {
      toast.error(ACCESS_LEVEL_CREATE_DENIED_MESSAGE);
      setAppView("access-levels");
      setAccessLevelId(null);
      if (typeof window !== "undefined") {
        const listPath = getAccessLevelsPath();
        if (window.location.pathname !== listPath) {
          window.history.replaceState({ luxiaView: "access-levels" }, "", listPath);
        }
      }
      return;
    }

    // Pipeline Admin is org-admin only — never leave the mounted admin view after
    // identity switch just because the nav item is hidden.
    if (appView === "admin-pipelines" && !canAdministerAccessLevels(userId)) {
      toast.error("Only Organization Admins can access Pipeline Admin.");
      setAppView("home");
      setHomeBrowseMode("overview");
      setActiveProjectId(null);
      setProjectBrowseMode("overview");
      setSettingsConstellationId(null);
      setSettingsCapabilityPath(null);
      setAccessLevelId(null);
      setOrganizationUserId(null);
      setDataSourceSettingsId(null);
      setMobileNavOpen(false);
      if (typeof window !== "undefined") {
        window.history.replaceState({ luxiaView: "home" }, "", "/");
      }
      return;
    }

    const projectId =
      appView === "home"
        || appView === "organization-users"
        || appView === "organization-user"
        || appView === "access-levels"
        || appView === "access-level"
        || appView === "data-sources"
        || appView === "data-source-settings"
        || appView === "admin-pipelines"
        ? null
        : (activeProjectId
          ?? chats.find((chat) => chat.id === activeChat)?.projectId
          ?? null);
    if (!projectId) return;

    const onProjectSurface =
      appView === "project"
      || appView === "project-members"
      || appView === "project-vidgets"
      || appView === "project-pipelines"
      || appView === "pipeline-detail"
      || appView === "pipeline-run-detail"
      || appView === "vidget-inbox"
      || appView === "vidget-settings"
      || appView === "constellation-settings"
      || appView === "galaxy-settings"
      || appView === "constellation-create"
      || appView === "chat";

    if (!canAccessProject(projectId, projectMembershipsState, userId) && onProjectSurface) {
      handleNavigateHome();
      return;
    }

    if (appView === "vidget-inbox") {
      const membership = getActiveProjectMembership(
        projectId,
        projectMembershipsState,
        userId,
      );
      if (!canReviewVidgetInbox(membership?.projectRole)) {
        toast.error(VIDGET_INBOX_DENIED_MESSAGE);
        handleOpenProjectVidgets(projectId);
        return;
      }
    }

    if (appView === "chat") {
      const chat = chats.find((item) => item.id === activeChat)
        ?? INITIAL_CHATS.find((item) => item.id === activeChat);
      if (!chat) return;
      if (!isWorkingChatAccessible({
        chatType: chat.chatType,
        projectId: chat.projectId,
        constellationId: chat.constellationId,
        userId,
        memberships: projectMembershipsState,
        accessLevels: accessLevelsState,
        dataSources: dataSourcesState,
        connectedSourceIds: chat.constellationId
          ? (constellationSettingsById[chat.constellationId]
            ?? getConstellationSettingsRecord(chat.constellationId))
            ?.connectedSources.map((source) => source.id) ?? []
          : [],
      })) {
        if (canAccessProject(projectId, projectMembershipsState, userId)) {
          handleOpenProjectOverview(projectId, "overview");
        } else {
          handleNavigateHome();
        }
      }
    }
  }

  useEffect(() => {
    setHomeProjects((prev) => prev.map((project) => ({
      ...project,
      memberCount: countProjectMembers(project.id, projectMembershipsState),
    })));
  }, [projectMembershipsState, prototypeUserId]);

  function syncHomeProjectDerivedCounts(
    projectId: string,
    options?: {
      settingsById?: Record<string, ConstellationSettingsRecord>;
      constellations?: Constellation[];
      omitConstellationIds?: ReadonlySet<string>;
    },
  ) {
    const counts = deriveProjectEntityCounts(
      projectId,
      buildProjectSourceEntries(projectId, options),
    );
    setHomeProjects((prev) => prev.map((project) => (
      project.id === projectId
        ? {
          ...project,
          constellationCount: counts.constellationCount,
          sourceCount: counts.sourceCount,
          isEmpty: counts.constellationCount === 0,
        }
        : project
    )));
  }

  function handleDisconnectConstellationSource(
    constellationId: string,
    sourceId: string,
  ) {
    const current = resolveConstellationSettingsRecordForView(constellationId);
    if (!current || current.connectedSources.length <= 1) return;
    if (!guardConstellationConfigure(current.projectId)) return;
    const nextRecord: ConstellationSettingsRecord = {
      ...current,
      connectedSources: current.connectedSources.filter((source) => source.id !== sourceId),
      sourceAccessRows: current.sourceAccessRows.filter((row) => row.sourceId !== sourceId),
      updatedAt: "Just now",
    };
    setConstellationSettingsById((prev) => ({
      ...prev,
      [constellationId]: cloneConstellationSettingsRecord(nextRecord),
    }));
    syncHomeProjectDerivedCounts(current.projectId, {
      settingsById: {
        ...constellationSettingsById,
        [constellationId]: nextRecord,
      },
    });
  }

  function handleAddConstellationDataSource(
    constellationId: string,
    sourceId: string,
  ) {
    const current = resolveConstellationSettingsRecordForView(constellationId);
    if (!current) return;
    if (!guardConstellationConfigure(current.projectId)) return;
    if (current.connectedSources.some((source) => source.id === sourceId)) {
      toast.error("That Data Source is already connected to this Constellation.");
      return;
    }
    const item = dataSourcesState.find((source) => source.id === sourceId);
    if (!item) {
      toast.error("Data Source not found.");
      return;
    }
    if (
      !hasConstellationConnectAccess(
        prototypeUserId,
        sourceId,
        accessLevelsState,
        dataSourcesState,
      )
    ) {
      toast.error("You need Use or Manage access to connect this Data Source.");
      return;
    }
    if (item.status !== "active") {
      toast.error("Only active Data Sources can be connected.");
      return;
    }

    const type = (item.type.toLowerCase().includes("csv")
      ? "csv"
      : item.type.toLowerCase().includes("pdf") || item.type.toLowerCase().includes("file")
        ? "pdf"
        : "database") as ConnectedDataSource["type"];
    const nextSource: ConnectedDataSource = {
      id: item.id,
      name: item.name,
      type,
      ownership: item.ownership,
      ownerUserId: item.ownerUserId,
      owner: getDataSourceOwnerDisplay(item),
      status: item.status === "active" ? "connected" : "needs-attention",
      accessSummary: buildDataSourceAccessSummary(
        item,
        accessLevelsState,
        prototypeUserId,
        dataSourcesState,
      ),
      lastUpdated: "Just now",
      usageInConstellation:
        type === "database"
          ? "Active tables and metrics"
          : type === "csv"
            ? "Tabular file context"
            : "Primary knowledge files",
      selectable: true,
    };

    const accessRow = buildSourceAccessSummaryRow(
      nextSource,
      accessLevelsState,
      prototypeUserId,
      dataSourcesState,
    );
    const nextRecord: ConstellationSettingsRecord = {
      ...current,
      connectedSources: [...current.connectedSources, nextSource],
      sourceAccessRows: [...current.sourceAccessRows, accessRow],
      updatedAt: "Just now",
    };
    setConstellationSettingsById((prev) => ({
      ...prev,
      [constellationId]: cloneConstellationSettingsRecord(nextRecord),
    }));
    syncHomeProjectDerivedCounts(current.projectId, {
      settingsById: {
        ...constellationSettingsById,
        [constellationId]: nextRecord,
      },
    });
    toast.success(`Connected ${nextSource.name}`);
  }

  function handleManageSourceAccess(sourceId: string) {
    const level = accessLevelsState.find((entry) =>
      entry.status === "active"
      && entry.sourceGrants.some((grant) => grant.dataSourceId === sourceId),
    );
    if (level) {
      handleOpenAccessLevel(level.id);
      return;
    }
    handleOpenAccessLevels();
  }

  function handleArchiveConstellationSettings(constellationId: string) {
    const current = resolveConstellationSettingsRecordForView(constellationId);
    if (!current) return;
    if (!guardConstellationArchive(current.projectId)) return;
    const nextRecord: ConstellationSettingsRecord = {
      ...current,
      status: "archived",
      updatedAt: "Just now",
    };
    setConstellationSettingsById((prev) => ({
      ...prev,
      [constellationId]: cloneConstellationSettingsRecord(nextRecord),
    }));
    syncHomeProjectDerivedCounts(current.projectId, {
      settingsById: {
        ...constellationSettingsById,
        [constellationId]: nextRecord,
      },
    });
  }

  function handleDeleteConstellationSettings(
    projectId: string,
    constellationId: string,
  ) {
    if (!guardConstellationDelete(projectId)) return;
    const nextSettings = { ...constellationSettingsById };
    delete nextSettings[constellationId];
    const nextRuntime = runtimeConstellations.filter((item) => item.id !== constellationId);
    const nextAll = allConstellations.filter((item) => item.id !== constellationId);

    setConstellationSettingsById(nextSettings);
    setCapabilityBundlesById((prev) => {
      const next = { ...prev };
      delete next[constellationId];
      return next;
    });
    setRuntimeConstellations(nextRuntime);
    syncHomeProjectDerivedCounts(projectId, {
      settingsById: nextSettings,
      constellations: nextAll,
      omitConstellationIds: new Set([constellationId]),
    });
    handleOpenConstellationsList(projectId);
  }

  /**
   * Atomic local Duplicate commit — builds the full clone in memory first,
   * then writes settings + capability bundle + runtime list + counts together.
   * Called only after the dialog mock job reaches success (never on cancel/fail).
   */
  function handleDuplicateConstellation(
    sourceConstellationId: string,
    name: string,
  ): { constellationId: string; projectId: string; name: string } {
    const source = allConstellations.find((item) => item.id === sourceConstellationId);
    if (!source) {
      throw new Error("Source Constellation was not found.");
    }
    const projectRole = projectRoleFor(source.projectId);
    if (!canCreateConstellation(projectRole)) {
      throw new Error("You do not have permission to duplicate this Constellation.");
    }
    const sourceSettings = resolveConstellationSettingsRecordForView(sourceConstellationId);
    if (!sourceSettings || sourceSettings.status === "archived") {
      throw new Error("This Constellation cannot be duplicated.");
    }

    const sourceBundle = resolveCapabilityBundle(
      sourceConstellationId,
      sourceSettings.instructions,
    );
    const createdBy =
      getOrganizationUserById(prototypeUserId)?.name ?? sourceSettings.createdBy;

    const draft = buildLocalConstellationDuplicate({
      sourceConstellation: {
        id: source.id,
        label: source.label,
        type: source.type,
        projectId: source.projectId,
        description: source.description,
      },
      sourceSettings,
      sourceBundle,
      name,
      createdBy,
    });

    const created: Constellation = {
      id: draft.constellation.id,
      label: draft.constellation.label,
      type: draft.constellation.type,
      projectId: draft.constellation.projectId,
      description: draft.constellation.description,
    };

    const nextRuntime = [...runtimeConstellations, created];
    const nextAll = [...CONSTELLATIONS, ...nextRuntime];
    const nextSettings = {
      ...constellationSettingsById,
      [draft.settings.id]: draft.settings,
    };

    setRuntimeConstellations(nextRuntime);
    setConstellationSettingsById(nextSettings);
    setCapabilityBundlesById((prev) => ({
      ...prev,
      [draft.constellation.id]: draft.bundle,
    }));
    commitDuplicateResponseConfidence(draft);
    syncHomeProjectDerivedCounts(created.projectId, {
      settingsById: nextSettings,
      constellations: nextAll,
    });

    return {
      constellationId: created.id,
      projectId: created.projectId,
      name: created.label,
    };
  }

  function handleOpenDuplicatedConstellation(
    projectId: string,
    constellationId: string,
  ) {
    handleOpenConstellationSettings(projectId, constellationId, "general", {
      focusHeading: true,
    });
  }

  function resolveCapabilityBundle(
    constellationId: string,
    instructions?: string,
  ): ConstellationCapabilityBundle {
    const existing = capabilityBundlesById[constellationId];
    if (existing) {
      const normalized = normalizeCapabilityBundle(existing);
      // Heal pre-Views in-memory bundles so Configuration / Views manage never crash.
      if (!Array.isArray(existing.views)) {
        queueMicrotask(() => {
          setCapabilityBundlesById((prev) => {
            const current = prev[constellationId];
            if (!current || Array.isArray(current.views)) return prev;
            return { ...prev, [constellationId]: normalizeCapabilityBundle(current) };
          });
        });
      }
      return normalized;
    }
    const constellation = allConstellations.find((item) => item.id === constellationId);
    const type = constellation?.type ?? "database";
    return createSeedCapabilityBundle(constellationId, type, instructions);
  }

  useEffect(() => {
    const constellationId = appView === "constellation-settings"
      ? settingsConstellationId
      : appView === "chat"
        ? activeConstellation.id
        : null;
    if (!constellationId) return;
    setCapabilityBundlesById((prev) => {
      if (prev[constellationId]) return prev;
      const record = constellationSettingsById[constellationId]
        ?? getConstellationSettingsRecord(constellationId);
      const constellation = allConstellations.find((item) => item.id === constellationId);
      const type = constellation?.type ?? record?.type ?? "database";
      return {
        ...prev,
        [constellationId]: createSeedCapabilityBundle(
          constellationId,
          type,
          record?.instructions,
        ),
      };
    });
  }, [
    appView,
    settingsConstellationId,
    activeConstellation.id,
    constellationSettingsById,
    allConstellations,
  ]);

  function handleUpdateCapabilityBundle(
    constellationId: string,
    next: ConstellationCapabilityBundle,
    options?: { capabilityKind?: "knowledge" | "configure" },
  ) {
    const current = resolveConstellationSettingsRecordForView(constellationId);
    if (!current) return;
    const kind = options?.capabilityKind ?? "configure";
    if (kind === "knowledge") {
      if (!guardConstellationKnowledge(current.projectId)) return;
    } else if (!guardConstellationConfigure(current.projectId)) {
      return;
    }
    const cloned = cloneCapabilityBundle(next);
    setCapabilityBundlesById((prev) => ({
      ...prev,
      [constellationId]: cloned,
    }));
    upsertConstellationSettingsRecord(constellationId, (existing) => ({
      ...existing,
      instructions: cloned.instruction.text,
      capabilitySummaries: {
        ...existing.capabilitySummaries,
        ...summarizeCapabilityBundle(cloned),
      },
      updatedAt: "Just now",
    }));
  }

  /** Chat KB Save Changes → same Constellation capability bundle as Settings. */
  function handleCommitChatKnowledgeBase(
    constellationId: string,
    knowledgeBase: KnowledgeBaseEntry[],
  ) {
    const bundle = resolveCapabilityBundle(constellationId);
    handleUpdateCapabilityBundle(
      constellationId,
      { ...bundle, knowledgeBase },
      { capabilityKind: "knowledge" },
    );
  }

  /** Chat Views popup → same Constellation capability bundle.views as Settings. */
  function handleCommitChatViews(
    constellationId: string,
    nextViews: DataTableRecord[],
  ) {
    const bundle = resolveCapabilityBundle(constellationId);
    handleUpdateCapabilityBundle(
      constellationId,
      { ...bundle, views: nextViews },
      { capabilityKind: "configure" },
    );
  }

  function handleCommitChatTables(
    constellationId: string,
    nextTables: DataTableRecord[],
  ) {
    const bundle = resolveCapabilityBundle(constellationId);
    handleUpdateCapabilityBundle(
      constellationId,
      { ...bundle, tables: nextTables },
      { capabilityKind: "configure" },
    );
  }

  function handleCommitChatContextFiles(
    constellationId: string,
    nextFiles: ExtraContextFile[],
  ) {
    const bundle = resolveCapabilityBundle(constellationId);
    handleUpdateCapabilityBundle(
      constellationId,
      { ...bundle, contextFiles: nextFiles },
      { capabilityKind: "configure" },
    );
  }

  function handleCommitChatRelationships(
    constellationId: string,
    nextRelationships: RelationshipRecord[],
  ) {
    const bundle = resolveCapabilityBundle(constellationId);
    handleUpdateCapabilityBundle(
      constellationId,
      { ...bundle, relationships: nextRelationships },
      { capabilityKind: "configure" },
    );
  }

  function handleCommitChatMetrics(
    constellationId: string,
    nextMetrics: MetricRecord[],
  ) {
    const bundle = resolveCapabilityBundle(constellationId);
    handleUpdateCapabilityBundle(
      constellationId,
      { ...bundle, metrics: nextMetrics },
      { capabilityKind: "configure" },
    );
  }

  function handleCommitChatPdfFiles(
    constellationId: string,
    nextFiles: PDFFileRecord[],
  ) {
    const bundle = resolveCapabilityBundle(constellationId);
    handleUpdateCapabilityBundle(
      constellationId,
      { ...bundle, pdfFiles: nextFiles },
      { capabilityKind: "configure" },
    );
  }

  function handleCommitChatCrawler(
    constellationId: string,
    nextCrawler: CrawlerState,
  ) {
    const bundle = resolveCapabilityBundle(constellationId);
    handleUpdateCapabilityBundle(
      constellationId,
      { ...bundle, crawler: nextCrawler },
      { capabilityKind: "knowledge" },
    );
  }

  function syncProjectPath(projectId: string) {
    if (typeof window === "undefined") return;
    const next = getProjectPath(projectId);
    if (window.location.pathname !== next) {
      window.history.pushState({ luxiaView: "project", projectId }, "", next);
    }
  }

  function syncDashboardPath(projectId: string) {
    if (typeof window === "undefined") return;
    const next = getDashboardPath(projectId);
    if (window.location.pathname !== next) {
      window.history.pushState({ luxiaView: "dashboard", projectId }, "", next);
    }
  }

  function syncWorkspacePathForChat(
    chat: Pick<Chat, "id" | "chatType" | "projectId" | "constellationId">,
  ) {
    if (typeof window === "undefined") return;
    const next = chat.chatType === "galaxy"
      ? getGalaxyPath(chat.projectId)
      : chat.chatType === "constellation" && chat.constellationId
        ? getConstellationChatPath(chat.projectId, chat.constellationId, chat.id)
        : getChatPath(chat.id);
    if (window.location.pathname === next) return;
    window.history.pushState(
      {
        luxiaView: "chat",
        chatId: chat.id,
        projectId: chat.projectId,
        chatType: chat.chatType,
        constellationId: chat.constellationId,
      },
      "",
      next,
    );
  }

  function handleOpenProjectOverview(
    projectId: string,
    browseMode: ProjectOverviewBrowseMode = "overview",
    options?: { skipMembershipCheck?: boolean; project?: HomeProjectCard },
  ) {
    if (!options?.skipMembershipCheck) {
      if (!canAccessProject(projectId, projectMembershipsState, prototypeUserId)) {
        toast.error("You are not an active member of this Project.");
        handleNavigateHome();
        return;
      }
    }

    const project = options?.project
      ?? homeProjects.find((entry) => entry.id === projectId);
    if (!project) {
      setActiveProjectId(projectId);
      setProjectBrowseMode(
        browseMode === "dashboards"
          ? "dashboards"
          : browseMode === "constellations"
            ? "constellations"
            : "overview",
      );
      setAppView("project");
      if (browseMode === "dashboards") {
        syncDashboardPath(projectId);
      } else if (browseMode === "constellations") {
        if (typeof window !== "undefined") {
          const next = getConstellationsPath(projectId);
          if (window.location.pathname !== next) {
            window.history.pushState(
              { luxiaView: "project", projectId, browse: "constellations" },
              "",
              next,
            );
          }
        }
      } else {
        syncProjectPath(projectId);
      }
      setHomeScrollRequest((value) => value + 1);
      console.warn(`[Luxia] Project "${projectId}" not found. Showing not-found state.`);
      return;
    }
    setActiveProjectId(projectId);
    setProjectBrowseMode(
      browseMode === "dashboards"
        ? "dashboards"
        : browseMode === "constellations"
          ? "constellations"
          : "overview",
    );
    setAppView("project");
    if (browseMode === "dashboards") {
      syncDashboardPath(projectId);
    } else if (browseMode === "constellations") {
      if (typeof window !== "undefined") {
        const next = getConstellationsPath(projectId);
        if (window.location.pathname !== next) {
          window.history.pushState(
            { luxiaView: "project", projectId, browse: "constellations" },
            "",
            next,
          );
        }
      }
    } else {
      syncProjectPath(projectId);
    }
    setHomeScrollRequest((value) => value + 1);
  }

  function handleOpenProjectDashboard(
    projectId: string,
    options?: { outputId?: string },
  ) {
    if (options?.outputId) {
      setDashboardFocusOutputId(options.outputId);
      setActiveDashboardOutputId(options.outputId);
    } else {
      setDashboardFocusOutputId(null);
      setActiveDashboardOutputId(null);
      setDashboardViewResetKey((value) => value + 1);
    }
    handleOpenProjectOverview(projectId, "dashboards");
  }

  function handleOpenDashboardOutput(projectId: string, outputId: string) {
    handleOpenProjectDashboard(projectId, { outputId });
  }
  function handleNavigateProjectDestination(
    destination: "galaxy" | "constellations" | "openProject",
    projectId: string,
  ) {
    if (destination === "galaxy") {
      handleOpenGalaxyFromHome(projectId);
      return;
    }
    if (destination === "constellations") {
      handleOpenConstellationsList(projectId);
      return;
    }
    handleOpenProjectOverview(projectId, "overview");
  }

  const recentWork = useMemo<HomeRecentWorkItem[]>(() => (
    HOME_RECENT_WORK
      .filter((item) =>
        Boolean(
          getActiveProjectMembership(
            item.projectId,
            projectMembershipsState,
            prototypeUserId,
          ),
        ),
      )
      .filter((item) => {
        const chat = chats.find((c) => c.id === item.chatId)
          ?? INITIAL_CHATS.find((c) => c.id === item.chatId);
        if (!chat) return true;
        return isChatWorkingAccessible(chat);
      })
      .map((item) => {
        const chat = chats.find((c) => c.id === item.chatId);
        const key = workItemEntityKey(item);
        const constellation = item.constellationId
          ? allConstellations.find((entry) => entry.id === item.constellationId)
          : undefined;
        const projectCard = homeProjects.find((project) => project.id === item.projectId);
        const { projectName: _legacyProjectName, ...rest } = item;
        return {
          ...rest,
          title: chat?.label ?? item.title,
          isPinned: pinnedEntityOrder.includes(key) || Boolean(chat?.pinned),
          constellationName: constellation?.label ?? item.constellationName,
          constellationSource: constellation?.type ?? item.constellationSource,
          constellationDescription: constellation?.description,
          projectDescription: projectCard?.description,
        };
      })
  ), [allConstellations, chats, homeProjects, pinnedEntityOrder, projectMembershipsState, prototypeUserId, accessLevelsState, dataSourcesState, constellationSettingsById]);

  useEffect(() => {
    const normalized = normalizeHomePrimaryPreference(
      primaryPreference,
      recentWork,
      dismissedContinueKeys,
    );
    if (!homePrimaryPreferencesEqual(normalized, primaryPreference)) {
      setPrimaryPreference(normalized);
      writeHomePrimaryPreference(normalized);
    }
  }, [dismissedContinueKeys, primaryPreference, recentWork]);

  function handleToggleWorkPin(itemId: string) {
    const item = recentWork.find((entry) => entry.id === itemId);
    if (!item) return;
    const key = workItemEntityKey(item);
    const nextOrder = togglePinnedEntityKey(pinnedEntityOrder, key);
    const pinned = nextOrder.includes(key);
    setPinnedEntityOrder(nextOrder);
    writePinnedEntityOrder(nextOrder);
    setChats((prev) => prev.map((chat) => (
      chat.id === item.chatId ? { ...chat, pinned } : chat
    )));
  }

  function handleToggleProjectPin(projectId: string) {
    const target = homeProjects.find((project) => project.id === projectId);
    if (!target || target.status === "archived") return;

    const next = togglePinnedProjectId(pinnedProjectIds, projectId);
    setPinnedProjectIds(next);
    writePinnedProjectIds(next);
    setHomeProjects((prev) => prev.map((project) => (
      project.id === projectId ? { ...project, isPinned: next.includes(projectId) } : project
    )));
  }

  function handleArchiveProject(projectId: string) {
    const target = homeProjects.find((project) => project.id === projectId);
    if (!target || target.status === "archived") return;
    if (!guardProjectArchive(projectId)) return;

    setHomeProjects((prev) => prev.map((project) => (
      project.id === projectId
        ? { ...project, status: "archived" as const, isPinned: false }
        : project
    )));

    if (pinnedProjectIds.includes(projectId)) {
      const nextPins = pinnedProjectIds.filter((id) => id !== projectId);
      setPinnedProjectIds(nextPins);
      writePinnedProjectIds(nextPins);
    }
  }

  function handleRestoreProject(projectId: string) {
    const target = homeProjects.find((project) => project.id === projectId);
    if (!target || target.status !== "archived") return;

    setHomeProjects((prev) => prev.map((project) => (
      project.id === projectId
        ? { ...project, status: "active" as const }
        : project
    )));
  }

  function handleRenameProject(projectId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setHomeProjects((prev) => prev.map((project) => (
      project.id === projectId ? { ...project, name: trimmed } : project
    )));
    setConstellationSettingsById((prev) => (
      syncProjectNameInSettingsById(prev, projectId, trimmed)
    ));
  }

  function handleEditProjectDetails(
    projectId: string,
    details: { name: string; description: string },
  ) {
    const trimmedName = details.name.trim();
    if (!trimmedName) return;
    setHomeProjects((prev) => prev.map((project) => (
      project.id === projectId
        ? {
            ...project,
            name: trimmedName,
            description: details.description.trim() || undefined,
          }
        : project
    )));
    setConstellationSettingsById((prev) => (
      syncProjectNameInSettingsById(prev, projectId, trimmedName)
    ));
  }

  function requestEditProjectDetails(projectId: string) {
    setProjectManageId(projectId);
    setProjectManageMode("edit");
  }

  function requestArchiveProject(projectId: string) {
    setProjectManageId(projectId);
    setProjectManageMode("archive");
  }

  function requestDeleteProject(projectId: string) {
    setProjectManageId(projectId);
    setProjectManageMode("delete");
  }

  function closeProjectManageDialogs() {
    setProjectManageMode(null);
    setProjectManageId(null);
  }

  function handleDeleteProject(projectId: string) {
    const target = homeProjects.find((project) => project.id === projectId);
    if (!target) return;
    if (!guardProjectDelete(projectId)) return;

    const viewingDeletedProject = activeProjectId === projectId
      || activeData?.projectId === projectId;

    setHomeProjects((prev) => prev.filter((project) => project.id !== projectId));

    setProjectMembershipsState((prev) =>
      prev.filter((membership) => membership.projectId !== projectId),
    );

    const galaxyId = target.galaxyId;
    setGalaxySessions((prev) => {
      if (!galaxyId || !(galaxyId in prev)) return prev;
      const next = { ...prev };
      delete next[galaxyId];
      return next;
    });
    setGalaxySettingsById((prev) => {
      if (!galaxyId || !(galaxyId in prev)) return prev;
      const next = { ...prev };
      delete next[galaxyId];
      return next;
    });

    if (pinnedProjectIds.includes(projectId)) {
      const nextPins = pinnedProjectIds.filter((id) => id !== projectId);
      setPinnedProjectIds(nextPins);
      writePinnedProjectIds(nextPins);
    }

    setChats((prev) => prev.filter((chat) => chat.projectId !== projectId));

    if (viewingDeletedProject) {
      handleNavigateHome();
    }
  }

  function handleRenameGalaxy(projectId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const galaxyId = homeProjects.find((project) => project.id === projectId)?.galaxyId
      ?? INITIAL_CHATS.find((chat) => chat.chatType === "galaxy" && chat.projectId === projectId)?.id;
    if (!galaxyId) return;
    setChats((prev) => prev.map((chat) => (
      chat.id === galaxyId && chat.chatType === "galaxy"
        ? { ...chat, label: trimmed }
        : chat
    )));
    setGalaxySettingsById((prev) => {
      const existing = prev[galaxyId];
      if (!existing) return prev;
      return {
        ...prev,
        [galaxyId]: { ...existing, name: trimmed, updatedAt: "Just now" },
      };
    });
  }

  function handleSetPrimaryHero(entityKey: string) {
    if (!parseEntityKey(entityKey)) return;
    const exists = recentWork.some((item) => workItemEntityKey(item) === entityKey);
    if (!exists) return;

    const next = { mode: "manual" as const, entityKey };
    setPrimaryPreference(next);
    writeHomePrimaryPreference(next);
    if (dismissedContinueKeys.includes(entityKey)) {
      const cleared = dismissedContinueKeys.filter((key) => key !== entityKey);
      setDismissedContinueKeys(cleared);
      writeDismissedContinueKeys(cleared);
    }
  }

  function clearManualHomeFocus() {
    const next = { mode: "automatic" as const, entityKey: null };
    setPrimaryPreference(next);
    writeHomePrimaryPreference(next);
  }

  function handleShowAllOnHome() {
    setDismissedContinueKeys([]);
    writeDismissedContinueKeys([]);
    clearManualHomeFocus();
  }

  function handleDismissFromContinue(entityKey: string) {
    const next = [...new Set([...dismissedContinueKeys, entityKey])];
    setDismissedContinueKeys(next);
    writeDismissedContinueKeys(next);
    if (primaryPreference.mode === "manual" && primaryPreference.entityKey === entityKey) {
      const automatic = { mode: "automatic" as const, entityKey: null };
      setPrimaryPreference(automatic);
      writeHomePrimaryPreference(automatic);
    }
  }

  function handleRestoreToContinue(entityKey: string) {
    const next = dismissedContinueKeys.filter((key) => key !== entityKey);
    setDismissedContinueKeys(next);
    writeDismissedContinueKeys(next);
  }

  function ensureChatOpen(chatId: string) {
    const existing = chats.find((chat) => chat.id === chatId);
    if (existing) {
      setActiveChat(chatId);
      return true;
    }
    const template = INITIAL_CHATS.find((chat) => chat.id === chatId);
    if (!template) {
      console.warn(`[Luxia] Chat/Galaxy "${chatId}" not found. Navigation aborted.`);
      return false;
    }
    setChats((prev) => [...prev, template]);
    setChatMessages((prev) => ({ ...prev, [chatId]: INITIAL_MESSAGES[chatId] ?? [] }));
    if (template.chatType === "galaxy") {
      const projectName = getProjectNameById(template.projectId, homeProjects);
      if (!projectName) {
        console.warn(
          `[Luxia] Project "${template.projectId}" missing for galaxy "${chatId}". Navigation aborted.`,
        );
        return false;
      }
      setGalaxySessions((prev) => ({
        ...prev,
        [chatId]: prev[chatId] ?? createIdleGalaxySession(projectName),
      }));
    }
    setActiveChat(chatId);
    return true;
  }

  function handleContinueWork(item: HomeRecentWorkItem) {
    if (item.projectId) setActiveProjectId(item.projectId);
    const targetChat = findChatById(item.chatId, chatsRef.current)
      ?? INITIAL_CHATS.find((entry) => entry.id === item.chatId);
    if (
      targetChat?.chatType === "constellation"
      && targetChat.projectId
      && targetChat.constellationId
      && !assertConstellationUseAccess(targetChat.projectId, targetChat.constellationId)
    ) {
      return;
    }
    if (!ensureChatOpen(item.chatId)) return;
    const chat = findChatById(item.chatId, chatsRef.current);
    if (chat) syncWorkspacePathForChat(chat);
    setAppView("chat");
  }

  function handleOpenProjectFromHome(projectId: string) {
    handleOpenProjectOverview(projectId, "overview");
  }

  function handleOpenGalaxyFromHome(projectId: string) {
    const project = homeProjects.find((entry) => entry.id === projectId);
    if (!project) {
      console.warn(`[Luxia] Project "${projectId}" not found for Galaxy open. Navigation aborted.`);
      return;
    }

    const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);

    if (!galaxyChat || galaxyChat.projectId !== projectId) {
      console.warn(
        `[Luxia] Galaxy is missing or not bound to project "${projectId}". Navigation aborted.`,
      );
      return;
    }

    setActiveProjectId(projectId);
    if (!ensureChatOpen(galaxyChat.id)) return;
    syncWorkspacePathForChat(galaxyChat);
    setAppView("chat");
  }

  function handleOpenGalaxySettingsFromOverview(
    projectId: string,
    section: GalaxySettingsSectionId = "general",
    options?: { explicitTab?: boolean; focusHeading?: boolean },
  ) {
    if (!canAccessProject(projectId, projectMembershipsState, prototypeUserId)) {
      toast.error(PROJECT_ACTION_DENIED_MESSAGE);
      return;
    }

    const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);

    if (!galaxyChat || galaxyChat.projectId !== projectId) {
      console.warn(
        `[Luxia] Galaxy is missing or not bound to project "${projectId}". Settings navigation aborted.`,
      );
      return;
    }

    setActiveProjectId(projectId);
    setGalaxySettingsSection(section);
    setAppView("galaxy-settings");
    syncGalaxySettingsPath(projectId, {
      section,
      explicitTab: options?.explicitTab ?? section !== "general",
    });
    if (options?.focusHeading) {
      setGalaxySettingsFocusHeadingToken((value) => value + 1);
    }
  }

  function syncGalaxySettingsPath(
    projectId: string,
    options?: {
      section?: GalaxySettingsSectionId;
      explicitTab?: boolean;
      replace?: boolean;
    },
  ) {
    if (typeof window === "undefined") return;
    const next = getGalaxySettingsPath(projectId, {
      tab: galaxySettingsSectionToTab(options?.section ?? "general"),
      includeTabQuery: Boolean(options?.explicitTab),
    });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === next) return;
    const state = {
      luxiaView: "galaxy-settings" as const,
      projectId,
      section: options?.section ?? "general",
    };
    if (options?.replace) {
      window.history.replaceState(state, "", next);
    } else {
      window.history.pushState(state, "", next);
    }
  }

  function handleGalaxySettingsSectionChange(
    projectId: string,
    section: GalaxySettingsSectionId,
  ) {
    if (section === galaxySettingsSection) return;
    setGalaxySettingsSection(section);
    syncGalaxySettingsPath(projectId, {
      section,
      explicitTab: true,
    });
  }

  function resolveGalaxySettingsRecord(projectId: string): GalaxySettingsRecord | null {
    const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);
    if (!galaxyChat || galaxyChat.projectId !== projectId) return null;
    const existing = galaxySettingsById[galaxyChat.id];
    const session = galaxySessions[galaxyChat.id];
    if (existing) {
      return {
        ...cloneGalaxySettingsRecord(existing),
        name: galaxyChat.label,
        projectName: getProjectNameById(projectId, homeProjects),
        routeMode: session?.routeMode ?? existing.routeMode,
        instruction: existing.instruction,
        manualConstellationIds: [...existing.manualConstellationIds],
      };
    }
    return buildGalaxySettingsRecord({
      id: galaxyChat.id,
      projectId,
      projectName: getProjectNameById(projectId, homeProjects),
      name: galaxyChat.label,
      routeMode: session?.routeMode ?? "auto",
      manualConstellationIds: [],
    });
  }

  function handleSaveGalaxySettingsGeneral(
    projectId: string,
    patch: Pick<GalaxySettingsDraft, "name">,
  ) {
    if (!guardGalaxyConfigure(projectId)) return;
    const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);
    if (!galaxyChat || galaxyChat.projectId !== projectId) return;
    const existing = resolveGalaxySettingsRecord(projectId);
    const trimmedName = patch.name.trim() || galaxyChat.label;
    setChats((prev) => prev.map((chat) => (
      chat.id === galaxyChat.id && chat.chatType === "galaxy"
        ? { ...chat, label: trimmedName }
        : chat
    )));
    setGalaxySettingsById((prev) => ({
      ...prev,
      [galaxyChat.id]: buildGalaxySettingsRecord({
        id: galaxyChat.id,
        projectId,
        projectName: getProjectNameById(projectId, homeProjects),
        name: trimmedName,
        instruction: existing?.instruction,
        routeMode: existing?.routeMode
          ?? galaxySessions[galaxyChat.id]?.routeMode
          ?? "auto",
        manualConstellationIds: existing?.manualConstellationIds ?? [],
        updatedAt: "Just now",
      }),
    }));
  }

  function handleSaveGalaxySettingsInstruction(
    projectId: string,
    patch: Pick<GalaxySettingsDraft, "instruction">,
  ) {
    if (!guardGalaxyConfigure(projectId)) return;
    const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);
    if (!galaxyChat || galaxyChat.projectId !== projectId) return;
    const existing = resolveGalaxySettingsRecord(projectId);
    setGalaxySettingsById((prev) => ({
      ...prev,
      [galaxyChat.id]: buildGalaxySettingsRecord({
        id: galaxyChat.id,
        projectId,
        projectName: getProjectNameById(projectId, homeProjects),
        name: existing?.name ?? galaxyChat.label,
        instruction: patch.instruction,
        routeMode: existing?.routeMode
          ?? galaxySessions[galaxyChat.id]?.routeMode
          ?? "auto",
        manualConstellationIds: existing?.manualConstellationIds ?? [],
        updatedAt: "Just now",
      }),
    }));
  }

  function handleSaveGalaxySettingsRouting(
    projectId: string,
    patch: Pick<GalaxySettingsDraft, "routeMode" | "manualConstellationIds">,
  ) {
    if (!guardGalaxyConfigure(projectId)) return;
    const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);
    if (!galaxyChat || galaxyChat.projectId !== projectId) return;
    const existing = resolveGalaxySettingsRecord(projectId);
    setGalaxySessions((prev) => {
      const current = prev[galaxyChat.id]
        ?? createIdleGalaxySession(getProjectNameById(projectId, homeProjects));
      return {
        ...prev,
        [galaxyChat.id]: {
          ...current,
          routeMode: patch.routeMode,
        },
      };
    });
    setGalaxySettingsById((prev) => ({
      ...prev,
      [galaxyChat.id]: buildGalaxySettingsRecord({
        id: galaxyChat.id,
        projectId,
        projectName: getProjectNameById(projectId, homeProjects),
        name: existing?.name ?? galaxyChat.label,
        instruction: existing?.instruction,
        routeMode: patch.routeMode,
        manualConstellationIds: [...patch.manualConstellationIds],
        updatedAt: "Just now",
      }),
    }));
  }

  function handleSaveGalaxyInstruction(projectId: string, instruction: string) {
    if (!guardGalaxyConfigure(projectId)) return;
    const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);
    if (!galaxyChat || galaxyChat.projectId !== projectId) return;
    const existing = resolveGalaxySettingsRecord(projectId);
    setGalaxySettingsById((prev) => ({
      ...prev,
      [galaxyChat.id]: buildGalaxySettingsRecord({
        id: galaxyChat.id,
        projectId,
        projectName: getProjectNameById(projectId, homeProjects),
        name: existing?.name ?? galaxyChat.label,
        instruction,
        routeMode: existing?.routeMode
          ?? galaxySessions[galaxyChat.id]?.routeMode
          ?? "auto",
        manualConstellationIds: existing?.manualConstellationIds ?? [],
        updatedAt: "Just now",
      }),
    }));
  }

  function guardGalaxyConfigure(projectId: string): boolean {
    if (canEditGalaxySettings(projectRoleFor(projectId))) {
      return true;
    }
    toast.error(GALAXY_CONFIGURE_DENIED_MESSAGE);
    return false;
  }

  function handleOpenChatFromHome(chatId: string) {
    const chat = chats.find((entry) => entry.id === chatId)
      ?? INITIAL_CHATS.find((entry) => entry.id === chatId);
    if (
      chat?.chatType === "constellation"
      && chat.projectId
      && chat.constellationId
      && !assertConstellationUseAccess(chat.projectId, chat.constellationId)
    ) {
      return;
    }
    if (chat?.projectId) setActiveProjectId(chat.projectId);
    if (!ensureChatOpen(chatId)) return;
    if (chat) syncWorkspacePathForChat(chat);
    setAppView("chat");
  }

  function handleOpenConstellationFromProject(projectId: string, constellationId: string) {
    const constellation = allConstellations.find(
      (entry) => entry.id === constellationId && entry.projectId === projectId,
    );
    if (!constellation) {
      console.warn(
        `[Luxia] Constellation "${constellationId}" not found in project "${projectId}". Navigation aborted.`,
      );
      return;
    }
    handleOpenConstellationSettings(projectId, constellationId);
  }

  function handleCreateChatForConstellation(projectId: string, constellationId: string) {
    const constellation = allConstellations.find(
      (entry) => entry.id === constellationId && entry.projectId === projectId,
    );
    if (!constellation) {
      console.warn(
        `[Luxia] Cannot create Chat — Constellation "${constellationId}" not found in project "${projectId}".`,
      );
      return;
    }
    if (!assertConstellationUseAccess(projectId, constellationId)) return;
    const existingCount = chats.filter(
      (chat) => chat.chatType === "constellation"
        && chat.projectId === projectId
        && chat.constellationId === constellationId,
    ).length;
    const id = `c${Date.now()}`;
    const created: Chat = {
      id,
      label: `Chat name ${String(existingCount + 1).padStart(2, "0")}`,
      chatType: "constellation",
      projectId,
      constellationId,
    };
    setChats((prev) => [...prev, created]);
    setChatMessages((prev) => ({ ...prev, [id]: [] }));
    setActiveProjectId(projectId);
    setActiveChat(id);
    syncWorkspacePathForChat(created);
    setAppView("chat");
  }

  function handleOpenConstellationCreate(
    projectId: string,
    options?: { existingDataSourceId?: string },
  ) {
    if (!guardConstellationConfigure(projectId)) return;
    setConstellationCreateExistingSourceId(options?.existingDataSourceId ?? null);
    setActiveProjectId(projectId);
    setProjectBrowseMode("constellations");
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAppView("constellation-create");
    if (typeof window !== "undefined") {
      const next = getConstellationCreatePath(projectId);
      if (window.location.pathname !== next) {
        window.history.pushState(
          { luxiaView: "constellation-create", projectId },
          "",
          next,
        );
      }
    }
  }

  function handleRequestCreateConstellationFromSource(sourceId: string, projectId?: string) {
    if (!dataSourcesState.some((source) => source.id === sourceId)) return;
    if (projectId) {
      if (!dataSourceConstellationHandoff.projects.some((project) => project.id === projectId)) {
        return;
      }
      handleOpenConstellationCreate(projectId, { existingDataSourceId: sourceId });
      return;
    }
    setDataSourceHandoff({ sourceId, kind: "create" });
  }

  function handleRequestConnectConstellationFromSource(sourceId: string) {
    if (!dataSourcesState.some((source) => source.id === sourceId)) return;
    setDataSourceHandoff({ sourceId, kind: "connect" });
  }

  function handleAddConstellationToProject(
    projectId: string,
    name: string,
    type: "database" | "csv" | "pdf",
  ) {
    void name;
    void type;
    handleOpenConstellationCreate(projectId);
  }

  function buildConnectedSourceFromDraft(
    draft: ConstellationCreationDraft,
  ): ReturnType<typeof buildConnectedSourceFromCreationDraft> {
    return buildConnectedSourceFromCreationDraft(draft, {
      dataSources: dataSourcesState,
      accessLevels: accessLevelsState,
      currentUserId: prototypeUserId,
    });
  }

  function handleCreateConstellationDraft(
    draft: ConstellationCreationDraft,
    tagBucket?: DataSourceTagBucket,
  ) {
    const projectId = draft.projectId;
    if (!projectId || !draft.type) return;
    if (!guardConstellationConfigure(projectId)) return;

    const existingNames = allConstellations
      .filter((item) => item.projectId === projectId)
      .map((item) => item.label);
    const readiness = getReviewReadiness(draft, existingNames);
    if (!readiness.ready) return;

    const id = `con-runtime-${Date.now()}`;
    const createdConstellation: Constellation = {
      id,
      label: draft.name.trim(),
      type: draft.type,
      projectId,
      description: draft.description.trim(),
    };
    const nextRuntime = [...runtimeConstellations, createdConstellation];
    const nextAll = [...CONSTELLATIONS, ...nextRuntime];
    setRuntimeConstellations(nextRuntime);

    const seededBase = buildSettingsForConstellation({
      id,
      projectId,
      projectName: getProjectNameById(projectId, homeProjects),
      name: draft.name.trim(),
      description: draft.description.trim(),
      type: draft.type,
    });

    const creationSource = buildConnectedSourceFromDraft(draft);
    const connectedSource = creationSource?.connected ?? null;
    const connectedSources = connectedSource ? [connectedSource] : [];

    const nextDataSources = creationSource?.catalogItem
      && !dataSourcesState.some((item) => item.id === creationSource.catalogItem!.id)
      ? [...dataSourcesState, creationSource.catalogItem]
      : dataSourcesState;

    if (nextDataSources !== dataSourcesState) {
      setDataSourcesState(nextDataSources);
    }

    if (creationSource?.catalogItem && tagBucket) {
      commitDataSourceTagBucket(creationSource.catalogItem.id, tagBucket);
    }

    const seeded: ConstellationSettingsRecord = {
      ...seededBase,
      instructions: draft.instruction.trim() || seededBase.instructions,
      connectedSources,
      sourceAccessRows: connectedSources.map((source) =>
        buildSourceAccessSummaryRow(
          source,
          accessLevelsState,
          prototypeUserId,
          nextDataSources,
        ),
      ),
    };

    const nextSettings = {
      ...constellationSettingsById,
      [id]: seeded,
    };
    setConstellationSettingsById(nextSettings);

    const instructionText = draft.instruction.trim() || seeded.instructions;
    const bundle = buildCapabilityBundleFromCreationDraft(
      id,
      draft,
      connectedSource,
      instructionText,
    );

    setCapabilityBundlesById((prev) => ({
      ...prev,
      [id]: bundle,
    }));
    syncHomeProjectDerivedCounts(projectId, {
      settingsById: nextSettings,
      constellations: nextAll,
    });
    toast.success("Constellation created.");
    handleOpenConstellationSettings(projectId, id);
  }

  function handleProjectNavSection(section: ProjectNavSection) {
    const projectId = contextProjectId;
    if (!projectId) return;

    if (section === "overview") {
      handleOpenProjectOverview(projectId, "overview");
      return;
    }
    if (section === "galaxy") {
      handleOpenGalaxyFromHome(projectId);
      return;
    }
    if (section === "dashboard") {
      handleOpenProjectDashboard(projectId);
      return;
    }
    if (section === "constellations") {
      handleOpenConstellationsList(projectId);
      return;
    }
    if (section === "chats") {
      handleOpenChatsList(projectId);
      return;
    }
    if (section === "members") {
      handleOpenProjectMembers(projectId);
      return;
    }
    if (section === "vidgets" || section === "virtual-assistant") {
      handleOpenProjectVidgets(projectId);
      return;
    }
    if (section === "pipelines") {
      handleOpenProjectPipelines(projectId);
    }
  }

  function handleCreateProject(name: string) {
    if (!canCreateProject(prototypeUserId)) {
      toast.error(PROJECT_CREATE_DENIED_MESSAGE);
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) return;

    const stamp = Date.now();
    const id = `project-${stamp}`;
    const galaxyId = `galaxy-${stamp}`;
    const galaxyLabel = trimmed;
    const newProject: HomeProjectCard = {
      id,
      name: trimmed,
      galaxyId,
      constellationCount: 0,
      sourceCount: 0,
      memberCount: 1,
      updatedAt: "Just now",
      updatedAtTimestamp: stamp,
      isPinned: false,
      isFeatured: false,
      isEmpty: true,
      status: "active",
      description: undefined,
    };

    setHomeProjects((prev) => [...prev, newProject]);

    setProjectMembershipsState((prev) => [...prev, {
      id: `pm-${id}-${prototypeUserId}`,
      projectId: id,
      userId: prototypeUserId,
      projectRole: "Project Owner",
      status: "active",
      joinedOrInvitedAt: new Date(stamp).toISOString(),
    }]);

    setChats((prev) => [...prev, {
      id: galaxyId,
      label: galaxyLabel,
      chatType: "galaxy",
      projectId: id,
    }]);

    setGalaxySessions((prev) => ({
      ...prev,
      [galaxyId]: createIdleGalaxySession(trimmed),
    }));

    setGalaxySettingsById((prev) => ({
      ...prev,
      [galaxyId]: buildGalaxySettingsRecord({
        id: galaxyId,
        projectId: id,
        projectName: trimmed,
        name: galaxyLabel,
      }),
    }));

    setShowNewProjectModal(false);
    handleOpenProjectOverview(id, "overview", {
      skipMembershipCheck: true,
      project: newProject,
    });
  }

  function handleChatPin(id: string) {
    setChats((prev) => {
      const target = prev.find((chat) => chat.id === id);
      if (!target) return prev;
      const nextPinned = !target.pinned;
      const key = target.chatType === "galaxy" ? getGalaxyEntityKey(id) : getChatEntityKey(id);
      setPinnedEntityOrder((order) => {
        const next = nextPinned
          ? [...order.filter((entry) => entry !== key), key]
          : order.filter((entry) => entry !== key);
        writePinnedEntityOrder(next);
        return next;
      });
      return prev.map((chat) => (chat.id === id ? { ...chat, pinned: nextPinned } : chat));
    });
  }

  function handleNewChatCreate(payload: NewChatPayload) {
    if (
      payload.chatType === "constellation"
      && payload.constellationId
      && !assertConstellationUseAccess(payload.projectId, payload.constellationId)
    ) {
      return;
    }
    const id = `c${Date.now()}`;
    const n = chats.length + 1;
    const galaxyCount = chats.filter((c) => c.chatType === "galaxy").length;
    const projectName = getProjectNameById(payload.projectId, homeProjects);
    setChats((p) => [...p, {
      id,
      label: payload.chatType === "galaxy"
        ? (galaxyCount === 0 ? "Galaxy Chat" : `Galaxy Chat ${galaxyCount + 1}`)
        : `Chat ${n}`,
      chatType: payload.chatType,
      projectId: payload.projectId,
      constellationId: payload.constellationId,
    }]);
    setChatMessages((p) => ({ ...p, [id]: [] }));
    if (payload.chatType === "galaxy") {
      setGalaxySessions((p) => ({ ...p, [id]: createIdleGalaxySession(projectName) }));
    }
    setActiveProjectId(payload.projectId);
    setActiveChat(id);
    setShowNewChatModal(false);
    setNewChatLockedProjectId(null);
    setAppView("chat");
    syncWorkspacePathForChat({
      id,
      chatType: payload.chatType,
      projectId: payload.projectId,
      constellationId: payload.constellationId,
    });
  }

  function handleRefineInboxInteraction(payload: VidgetInboxRefinePayload) {
    if (!assertConstellationUseAccess(payload.projectId, payload.constellationId)) {
      return;
    }
    const id = `c${Date.now()}`;
    const n = chats.length + 1;
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setChats((prev) => [...prev, {
      id,
      label: `Chat ${n}`,
      chatType: "constellation",
      projectId: payload.projectId,
      constellationId: payload.constellationId,
    }]);
    const seeded: Message[] = [];
    if (payload.question.trim()) {
      seeded.push({
        id: `${id}-user`,
        role: "user",
        content: payload.question,
        timestamp: now,
      });
    }
    if (payload.answer.trim() || payload.presentation === "block") {
      seeded.push({
        id: `${id}-ai`,
        role: "ai",
        content: payload.answer,
        timestamp: now,
        sources: payload.sources,
        responsePresentation: {
          state: payload.presentation,
          notice: payload.notice,
        },
      });
    }
    setChatMessages((prev) => ({ ...prev, [id]: seeded }));
    setInputValue(payload.question);
    setActiveProjectId(payload.projectId);
    setActiveChat(id);
    setAppView("chat");
    syncWorkspacePathForChat({
      id,
      chatType: "constellation",
      projectId: payload.projectId,
      constellationId: payload.constellationId,
    });
  }

  function handleCloseChat(id: string) {
    if (chats.length <= 1) return;
    setChats(p => p.filter(c => c.id !== id));
    setGalaxySessions((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
    if (activeChat === id) {
      const remaining = chats.filter(c => c.id !== id);
      const nextChat = remaining[remaining.length - 1]!;
      setActiveChat(nextChat.id);
      syncWorkspacePathForChat(nextChat);
    }
  }

  function handleSelectChat(chatId: string) {
    const chat = findChatById(chatId, chats);
    if (
      chat?.chatType === "constellation"
      && chat.projectId
      && chat.constellationId
      && !assertConstellationUseAccess(chat.projectId, chat.constellationId)
    ) {
      return;
    }
    setActiveChat(chatId);
    if (chat) {
      if (chat.projectId) setActiveProjectId(chat.projectId);
      syncWorkspacePathForChat(chat);
    }
  }

  function handleConstellationChange(conId: string) {
    const active = chats.find((c) => c.id === activeChat);
    if (!active || active.chatType !== "constellation" || !active.projectId) return;
    if (!assertConstellationUseAccess(active.projectId, conId)) return;
    setChats((p) => p.map((c) => c.id === activeChat ? { ...c, constellationId: conId } : c));
    syncWorkspacePathForChat({
      ...active,
      constellationId: conId,
    });
  }

  function updateGalaxySession(chatId: string, patch: Partial<GalaxySessionState>) {
    setGalaxySessions((prev) => {
      const projectId = chats.find((c) => c.id === chatId)?.projectId;
      const current = prev[chatId] ?? createIdleGalaxySession(
        getProjectNameById(projectId, homeProjects),
      );
      return {
        ...prev,
        [chatId]: {
          ...current,
          ...patch,
          projectName: getProjectNameById(projectId, homeProjects),
        },
      };
    });
  }

  function patchGalaxyMessage(chatId: string, messageId: string, patch: Partial<Message>) {
    setChatMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] ?? []).map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              ...patch,
              galaxy: patch.galaxy
                ? { ...(msg.galaxy as GalaxyRoutingMeta), ...patch.galaxy }
                : msg.galaxy,
            }
          : msg,
      ),
    }));
  }

  function handleSend(text?: string) {
    const content = (text ?? inputValue).trim();
    if (!content) return;
    setInputValue("");
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const uid = `u${counterRef.current++}`, aid = `a${counterRef.current++}`;
    const chatId = activeChat;
    const active = chats.find((c) => c.id === chatId);
    const isGalaxy = active?.chatType === "galaxy";
    const projectName = getProjectNameById(active?.projectId, homeProjects);

    if (!isGalaxy) {
      if (
        active?.chatType === "constellation"
        && active.projectId
        && active.constellationId
        && !assertConstellationUseAccess(active.projectId, active.constellationId)
      ) {
        return;
      }
      const constellationRecord = active?.constellationId
        ? resolveConstellationSettingsRecordForView(active.constellationId)
        : undefined;
      const chatSources = (constellationRecord?.connectedSources ?? []).map((source) => ({
        id: `${aid}-${source.id}`,
        label: source.name,
      }));
      setChatMessages(p => ({
        ...p,
        [chatId]: [...(p[chatId] ?? []),
        { id: uid, role: "user", content, timestamp: now },
        {
          id: aid, role: "ai", timestamp: now,
          content: chatSources.length > 0
            ? `I have searched the connected Constellation for your query.\n\nSources considered: ${chatSources.map((source) => source.label).join(", ")}.`
            : "I have searched the connected Constellation for your query.\n\nNo connected Data Source labels are available.",
          sources: chatSources,
        },
        ],
      }));
      return;
    }

    const projectId = active?.projectId ?? homeProjects[0]?.id ?? "project-01";
    const projectConstellations = getProjectConstellations(projectId, allConstellations);
    const constellationSourceMap = projectConstellations.map((constellation) => {
      const record = constellationSettingsById[constellation.id]
        ?? getConstellationSettingsRecord(constellation.id);
      return {
        id: constellation.id,
        dataSourceIds: record?.connectedSources.map((source) => source.id) ?? [],
      };
    });
    const accessibleIds = getAccessibleConstellationIds({
      projectId,
      constellationSourceMap,
      memberships: projectMembershipsState,
      accessLevels: accessLevelsState,
      dataSources: dataSourcesState,
      userId: prototypeUserId,
    });
    const accessibleConstellations = projectConstellations.filter((item) =>
      accessibleIds.includes(item.id),
    );

    if (accessibleConstellations.length === 0) {
      setGalaxyAccessBlock({
        projectId,
        reason:
          "You need Use access to every connected Data Source before Galaxy can use a Constellation.",
      });
      updateGalaxySession(chatId, {
        status: "ready",
        activityLabel: "No accessible Constellations",
        candidates: [],
        selected: null,
        selectionSource: null,
        sources: [],
        pendingManualId: null,
      });
      return;
    }

    const session = galaxySessions[chatId] ?? createIdleGalaxySession(projectName);
    const routeMode = session.routeMode === "manual" ? "manual" : "auto";

    if (routeMode === "manual" && !session.pendingManualId) {
      toast.error(GALAXY_MANUAL_ROUTE_REQUIRED_MESSAGE);
      expandGalaxyIntelligencePanel({ force: true });
      updateGalaxySession(chatId, {
        routeMode: "manual",
        status: "ready",
        activityLabel: "Select a Constellation",
        focusSection: "activity",
      });
      return;
    }

    const isManual = routeMode === "manual" && Boolean(session.pendingManualId);
    const manualOption = isManual
      ? accessibleConstellations.find((c) => c.id === session.pendingManualId)
      : null;

    if (isManual && !manualOption) {
      setGalaxyAccessBlock({
        projectId,
        reason:
          "The selected Constellation is no longer accessible with your current Data Source permissions.",
      });
      updateGalaxySession(chatId, {
        status: "ready",
        activityLabel: "Selected Constellation unavailable",
        selected: null,
        selectionSource: null,
        pendingManualId: null,
        routeMode: "manual",
        focusSection: "activity",
      });
      expandGalaxyIntelligencePanel({ force: true });
      toast.error(GALAXY_MANUAL_ROUTE_REQUIRED_MESSAGE);
      return;
    }

    const matchedConstellation = manualOption ?? accessibleConstellations[0]!;
    const matchedRecord = constellationSettingsById[matchedConstellation.id]
      ?? getConstellationSettingsRecord(matchedConstellation.id);
    const matched: GalaxyMatchedConstellation = {
      id: matchedConstellation.id,
      label: matchedConstellation.label,
      type: getConstellationSourceLabel(matchedConstellation.type),
    };
    const accessibleSources = (matchedRecord?.connectedSources ?? []).map((source) => ({
      id: `src-${source.id}`,
      label: source.name,
      description:
        `${source.type === "pdf" ? "PDF" : source.type === "csv" ? "CSV" : "Database"} · ${
          source.ownership === "organizational" ? "Organizational" : "Private"
        }`,
    }));
    const answerContent = accessibleSources.length > 0
      ? `Based on accessible Constellation ${matched.label}, here is an answer using only Data Sources you can Use.\n\nSources considered: ${accessibleSources.map((source) => source.label).join(", ")}.`
      : `Based on accessible Constellation ${matched.label}, no connected Data Source labels are available.`;
    const candidates = accessibleConstellations.slice(0, 3).map((item, index) => ({
      id: item.id,
      label: item.label,
      type: getConstellationSourceLabel(item.type),
      relevance: (index === 0
        ? "High relevance"
        : index === 1
          ? "Medium relevance"
          : "Low relevance") as "High relevance" | "Medium relevance" | "Low relevance",
    }));

    galaxyManualCollapseRef.current = false;
    expandGalaxyIntelligencePanel({ force: true });

    const baseGalaxy: GalaxyRoutingMeta = {
      projectName,
      phase: "searching",
      matched,
      selectionSource: isManual ? "manual" : "auto",
      constellationsChecked: accessibleConstellations.length,
    };

    updateGalaxySession(chatId, {
      status: "searching",
      activityLabel: isManual
        ? `Searching ${matched.label}`
        : `Searching ${projectName}`,
      candidates: [],
      selected: isManual ? matched : null,
      selectionSource: isManual ? "manual" : null,
      sources: [],
      focusSection: "activity",
      routeMode,
      pendingManualId: isManual ? session.pendingManualId : null,
    });

    setChatMessages((p) => ({
      ...p,
      [chatId]: [
        ...(p[chatId] ?? []),
        { id: uid, role: "user", content, timestamp: now },
        { id: aid, role: "ai", content: "", timestamp: now, galaxy: baseGalaxy },
      ],
    }));

    if (isManual) {
      window.setTimeout(() => {
        updateGalaxySession(chatId, {
          status: "answering",
          activityLabel: "Generating answer",
          selected: matched,
          selectionSource: "manual",
        });
        patchGalaxyMessage(chatId, aid, {
          content: answerContent,
          galaxy: { ...baseGalaxy, phase: "answering" },
        });
      }, 700);
      window.setTimeout(() => {
        updateGalaxySession(chatId, {
          status: "complete",
          activityLabel: "Answer complete",
          selected: matched,
          selectionSource: "manual",
          sources: accessibleSources,
          focusSection: "sources",
        });
        patchGalaxyMessage(chatId, aid, {
          content: answerContent,
          sources: accessibleSources.map((s) => ({ id: `${aid}-${s.id}`, label: s.label })),
          galaxy: { ...baseGalaxy, phase: "complete" },
        });
      }, 1800);
      return;
    }

    const phases: Array<{ phase: GalaxyRoutingPhase; delay: number }> = [
      { phase: "finding", delay: 700 },
      { phase: "matched", delay: 1500 },
      { phase: "answering", delay: 2300 },
      { phase: "complete", delay: 3200 },
    ];

    phases.forEach(({ phase, delay }) => {
      window.setTimeout(() => {
        if (phase === "finding") {
          updateGalaxySession(chatId, {
            status: "matching",
            activityLabel: "Comparing relevant matches",
            candidates,
          });
          patchGalaxyMessage(chatId, aid, { galaxy: { ...baseGalaxy, phase } });
          return;
        }
        if (phase === "matched") {
          updateGalaxySession(chatId, {
            status: "matching",
            activityLabel: "Best match found",
            candidates,
            selected: matched,
            selectionSource: "auto",
            focusSection: "selected",
          });
          patchGalaxyMessage(chatId, aid, { galaxy: { ...baseGalaxy, phase } });
          return;
        }
        if (phase === "answering") {
          updateGalaxySession(chatId, {
            status: "answering",
            activityLabel: "Generating answer",
            selected: matched,
            selectionSource: "auto",
            candidates,
          });
          patchGalaxyMessage(chatId, aid, {
            content: answerContent,
            galaxy: { ...baseGalaxy, phase },
          });
          return;
        }
        updateGalaxySession(chatId, {
          status: "complete",
          activityLabel: "Answer complete",
          selected: matched,
          selectionSource: "auto",
          candidates,
          sources: accessibleSources,
          focusSection: "sources",
        });
        patchGalaxyMessage(chatId, aid, {
          content: answerContent,
          sources: accessibleSources.map((s) => ({ id: `${aid}-${s.id}`, label: s.label })),
          galaxy: { ...baseGalaxy, phase: "complete" },
        });
      }, delay);
    });
  }

  function handleOpenGalaxyConstellation() {
    expandGalaxyIntelligencePanel({ force: true });
    const session = galaxySessions[activeChat];
    const matchedId = session?.selected?.id;
    if (!matchedId) {
      toast.message("Select an accessible Constellation before opening Chat.");
      return;
    }
    const match = allConstellations.find((c) => c.id === matchedId);
    if (!match) return;
    if (!assertConstellationUseAccess(match.projectId, match.id)) return;
    const existing = chats.find(
      (c) => c.chatType === "constellation" && c.constellationId === match.id,
    );
    if (existing) {
      setActiveChat(existing.id);
      syncWorkspacePathForChat(existing);
      return;
    }
    const id = `c${Date.now()}`;
    const created: Chat = {
      id,
      label: match.label,
      chatType: "constellation",
      projectId: match.projectId,
      constellationId: match.id,
    };
    setChats((p) => [...p, created]);
    setChatMessages((p) => ({ ...p, [id]: [] }));
    setActiveChat(id);
    syncWorkspacePathForChat(created);
  }

  function handleViewGalaxyActivity() {
    expandGalaxyIntelligencePanel({ force: true });
    const session = galaxySessions[activeChat];
    const focusSection = session?.selected && (
      session.status === "matching" ||
      session.status === "answering" ||
      session.status === "complete"
    )
      ? "selected"
      : "activity";
    updateGalaxySession(activeChat, {
      expandSignal: (session?.expandSignal ?? 0) + 1,
      focusSection,
    });
  }

  const activeGalaxySession = activeData?.chatType === "galaxy"
    ? (() => {
      const session = galaxySessions[activeChat]
        ?? createIdleGalaxySession(getProjectNameById(activeData.projectId, homeProjects));
      return {
        ...session,
        projectName: getProjectNameById(activeData.projectId, homeProjects),
      };
    })()
    : null;

  useEffect(() => {
    if (!activeGalaxySession) return;

    const signal = activeGalaxySession.expandSignal;
    if (signal > galaxyExpandSignalSeenRef.current) {
      galaxyExpandSignalSeenRef.current = signal;
      expandGalaxyIntelligencePanel({ force: true });
      return;
    }

    const { status, selected, focusSection } = activeGalaxySession;
    const working =
      status === "searching" ||
      status === "matching" ||
      status === "answering";
    const hasBestMatch = Boolean(selected) && (
      status === "matching" ||
      status === "answering" ||
      status === "complete"
    );

    if (working || hasBestMatch || focusSection) {
      expandGalaxyIntelligencePanel();
    }
  }, [
    activeGalaxySession?.status,
    activeGalaxySession?.selected?.id,
    activeGalaxySession?.expandSignal,
    activeGalaxySession?.focusSection,
  ]);

  const galaxyProjectName = getProjectNameById(activeData?.projectId, homeProjects);

  const galaxyRouteOptions = useMemo(() => {
    const projectId = activeData?.projectId ?? homeProjects[0]?.id ?? "project-01";
    const projectConstellations = getProjectConstellations(projectId, allConstellations);
    const constellationSourceMap = projectConstellations.map((constellation) => {
      const record = constellationSettingsById[constellation.id]
        ?? getConstellationSettingsRecord(constellation.id);
      return {
        id: constellation.id,
        dataSourceIds: record?.connectedSources.map((source) => source.id) ?? [],
      };
    });
    const accessibleIds = new Set(
      getAccessibleConstellationIds({
        projectId,
        constellationSourceMap,
        memberships: projectMembershipsState,
        accessLevels: accessLevelsState,
        dataSources: dataSourcesState,
        userId: prototypeUserId,
      }),
    );
    const seeds = projectConstellations
      .filter((constellation) => accessibleIds.has(constellation.id))
      .map((constellation) => ({
        id: constellation.id,
        label: constellation.label,
        type: getConstellationSourceLabel(constellation.type),
      }));
    const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);
    const savedSettings = galaxyChat ? galaxySettingsById[galaxyChat.id] : undefined;
    const savedRouteMode = savedSettings?.routeMode
      ?? (galaxyChat ? galaxySessions[galaxyChat.id]?.routeMode : undefined)
      ?? "auto";
    const manualIds = savedSettings?.manualConstellationIds ?? [];
    const filteredSeeds =
      savedRouteMode === "manual" && manualIds.length > 0
        ? seeds.filter((seed) => manualIds.includes(seed.id))
        : seeds;
    return buildGalaxyRouteCatalog(galaxyProjectName, filteredSeeds);
  }, [
    activeData?.projectId,
    allConstellations,
    chats,
    galaxyProjectName,
    galaxySessions,
    galaxySettingsById,
    homeProjects,
    constellationSettingsById,
    projectMembershipsState,
    accessLevelsState,
    dataSourcesState,
    prototypeUserId,
  ]);

  const pendingManual = activeGalaxySession?.pendingManualId
    ? (() => {
        const found = galaxyRouteOptions.find((o) => o.id === activeGalaxySession.pendingManualId);
        return found ? { id: found.id, label: found.label, type: found.type } : null;
      })()
    : null;

  useEffect(() => {
    if (!activeGalaxySession || activeData?.chatType !== "galaxy") return;
    const projectId = activeData.projectId;
    if (!projectId) return;
    if (galaxyRouteOptions.length === 0) {
      if (
        activeGalaxySession.selected
        || activeGalaxySession.pendingManualId
        || (activeGalaxySession.sources?.length ?? 0) > 0
      ) {
        updateGalaxySession(activeChat, {
          selected: null,
          selectionSource: null,
          pendingManualId: null,
          candidates: [],
          sources: [],
          activityLabel: "No accessible Constellations",
          routeMode: activeGalaxySession.routeMode === "manual" ? "manual" : "auto",
        });
        setGalaxyAccessBlock({
          projectId,
          reason:
            "You need Use access to every connected Data Source before Galaxy can use a Constellation.",
        });
      }
      return;
    }
    if (
      activeGalaxySession.pendingManualId
      && !galaxyRouteOptions.some((option) => option.id === activeGalaxySession.pendingManualId)
    ) {
      updateGalaxySession(activeChat, {
        pendingManualId: null,
        routeMode: activeGalaxySession.routeMode === "manual" ? "manual" : "auto",
        selected: null,
        selectionSource: null,
        activityLabel: "Selected Constellation unavailable",
      });
    }
  }, [
    activeChat,
    activeData?.chatType,
    activeData?.projectId,
    activeGalaxySession?.pendingManualId,
    activeGalaxySession?.selected?.id,
    activeGalaxySession?.sources?.length,
    galaxyRouteOptions,
  ]);

  const settingsConstellation = settingsConstellationId
    ? allConstellations.find((item) => item.id === settingsConstellationId)
    : undefined;

  const settingsProjectExists = activeProjectId
    ? Boolean(homeProjects.find((project) => project.id === activeProjectId))
    : false;

  const settingsUnavailable = !activeProjectId
    || !settingsProjectExists
    || !settingsConstellation
    || settingsConstellation.projectId !== activeProjectId;

  const settingsRecord = settingsConstellationId
    ? resolveConstellationSettingsRecordForView(settingsConstellationId)
    : undefined;

  const settingsCapabilityId = settingsCapabilityPath
    ? capabilityIdFromPath(settingsCapabilityPath)
    : null;

  const settingsCapabilityUnavailable = Boolean(settingsCapabilityPath)
    && (
      !settingsCapabilityId
      || !settingsConstellation
      || !isCapsuleCapabilityAllowed(settingsCapabilityId, settingsConstellation.type)
    );

  useEffect(() => {
    if (
      appView === "access-level"
      && accessLevelId === "new"
      && !canAdministerAccessLevels(prototypeUserId)
    ) {
      toast.error(ACCESS_LEVEL_CREATE_DENIED_MESSAGE);
      setAppView("access-levels");
      setAccessLevelId(null);
      if (typeof window !== "undefined") {
        const listPath = getAccessLevelsPath();
        if (window.location.pathname !== listPath) {
          window.history.replaceState({ luxiaView: "access-levels" }, "", listPath);
        }
      }
    }
  }, [appView, accessLevelId, prototypeUserId]);

  useEffect(() => {
    if (appView !== "admin-pipelines") return;
    if (canAdministerAccessLevels(prototypeUserId)) return;
    toast.error("Only Organization Admins can access Pipeline Admin.");
    setAppView("home");
    setHomeBrowseMode("overview");
    setActiveProjectId(null);
    setProjectBrowseMode("overview");
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(null);
    setOrganizationUserId(null);
    setDataSourceSettingsId(null);
    setMobileNavOpen(false);
    if (typeof window !== "undefined") {
      window.history.replaceState({ luxiaView: "home" }, "", "/");
    }
  }, [appView, prototypeUserId]);

  const editingAccessLevel = useMemo(() => {
    if (appView !== "access-level" || !accessLevelId) {
      accessLevelCreateDraftRef.current = null;
      return null;
    }
    if (accessLevelId === "new") {
      if (!canAdministerAccessLevels(prototypeUserId)) {
        accessLevelCreateDraftRef.current = null;
        return null;
      }
      if (!accessLevelCreateDraftRef.current) {
        accessLevelCreateDraftRef.current = buildEmptyAccessLevel();
      }
      return accessLevelCreateDraftRef.current;
    }
    accessLevelCreateDraftRef.current = null;
    return accessLevelsState.find((level) => level.id === accessLevelId) ?? null;
  }, [appView, accessLevelId, accessLevelsState, prototypeUserId]);

  const projectNamesById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const project of homeProjects) map[project.id] = project.name;
    return map;
  }, [homeProjects]);

  const membersProject = activeProjectId
    ? {
      id: activeProjectId,
      name: getProjectNameById(activeProjectId, homeProjects),
    }
    : null;

  const membersProjectExists = activeProjectId
    ? Boolean(homeProjects.find((project) => project.id === activeProjectId))
    : false;

  const membersForProject = activeProjectId
    ? projectMembershipsState.filter((membership) => membership.projectId === activeProjectId)
    : [];

  const dataSourceForSettings = dataSourceSettingsId
    ? dataSourcesState.find((source) => source.id === dataSourceSettingsId)
      ?? getDataSourceById(dataSourceSettingsId)
      ?? null
    : null;

  const canAccessDataSourceSettings = Boolean(
    dataSourceForSettings
    && canUserAccessDataSource(
      dataSourceForSettings.id,
      accessLevelsState,
      dataSourcesState,
      prototypeUserId,
    ),
  );

  const dataSourceHandoffSource = dataSourceHandoff
    ? dataSourcesState.find((source) => source.id === dataSourceHandoff.sourceId)
    : undefined;

  const contextProjectMembership = useMemo(() => {
    if (!contextProjectId) return null;
    return getActiveProjectMembership(
      contextProjectId,
      projectMembershipsState,
      prototypeUserId,
    ) ?? null;
  }, [contextProjectId, projectMembershipsState, prototypeUserId]);

  const showProjectContext = Boolean(contextProjectId && contextProjectMembership);

  useEffect(() => {
    setProjectAssistantOpen(false);
  }, [contextProjectId]);

  const projectAssistantMessages = contextProjectId
    ? projectAssistantSessions[contextProjectId] ?? []
    : [];

  const sidebarProjectChats = useMemo(() => {
    if (!contextProjectId || !contextProjectMembership) return [];
    return overviewChats
      .filter((chat) => chat.projectId === contextProjectId)
      .filter((chat) => isWorkingChatAccessible({
        chatType: chat.chatSource === "galaxy" ? "galaxy" : "constellation",
        projectId: chat.projectId,
        constellationId: chat.constellationId,
        userId: prototypeUserId,
        memberships: projectMembershipsState,
        accessLevels: accessLevelsState,
        dataSources: dataSourcesState,
        connectedSourceIds: chat.constellationId
          ? (constellationSettingsById[chat.constellationId]
            ?? getConstellationSettingsRecord(chat.constellationId))
            ?.connectedSources.map((source) => source.id) ?? []
          : [],
      }))
      .map((chat) => ({
        id: chat.id,
        label: chat.label,
        chatSource: chat.chatSource,
        constellationId: chat.constellationId,
        lastOpenedTimestamp: chat.lastOpenedTimestamp,
        pinned: chats.find((item) => item.id === chat.id)?.pinned,
      }));
  }, [
    contextProjectId,
    contextProjectMembership,
    overviewChats,
    constellationSettingsById,
    prototypeUserId,
    accessLevelsState,
    dataSourcesState,
    chats,
  ]);

  const sidebarProjectConstellations = useMemo(() => {
    if (!contextProjectId || !contextProjectMembership) return [];
    return overviewConstellations
      .filter((item) => item.projectId === contextProjectId)
      .filter((item) => {
        const record = constellationSettingsById[item.id]
          ?? getConstellationSettingsRecord(item.id);
        const connectedSourceIds = record?.connectedSources.map((source) => source.id) ?? [];
        return evaluateConstellationUseAccess({
          userId: prototypeUserId,
          projectRole: contextProjectMembership.projectRole,
          membershipStatus: contextProjectMembership.status,
          connectedSourceIds,
          accessLevels: accessLevelsState,
          dataSources: dataSourcesState,
        }).available;
      })
      .map((item) => ({
        id: item.id,
        label: item.label,
        type: item.type,
        updatedAtTimestamp: item.updatedAtTimestamp,
      }));
  }, [
    contextProjectId,
    contextProjectMembership,
    overviewConstellations,
    constellationSettingsById,
    prototypeUserId,
    accessLevelsState,
    dataSourcesState,
  ]);

  const sidebarProjectDashboardOutputs = useMemo(() => {
    if (!contextProjectId || !contextProjectMembership) return [];
    return getProjectDashboardOutputs(contextProjectId).map((item) => ({
      id: item.id,
      label: item.name,
      updatedAtTimestamp: item.updatedAtTimestamp,
    }));
  }, [contextProjectId, contextProjectMembership]);

  const sidebarProjectVidgets = useMemo(() => {
    if (!contextProjectId || !contextProjectMembership) return [];
    return getVidgetsForProject(contextProjectId, vidgetsState).map((item) => ({
      id: item.id,
      label: item.name,
      updatedAtTimestamp: new Date(item.updatedAt).getTime() || 0,
    }));
  }, [contextProjectId, contextProjectMembership, vidgetsState]);

  const sidebarProjectPipelines = useMemo(() => {
    if (!contextProjectId || !contextProjectMembership) return [];
    if (!canViewProjectPipelines()) return [];
    return getPipelinesForProject(contextProjectId, pipelinesState).map((item) => ({
      id: item.id,
      label: item.name,
      dagId: item.dagId,
      updatedAtTimestamp: item.lastRunAt ? Date.parse(item.lastRunAt) || 0 : 0,
    }));
  }, [contextProjectId, contextProjectMembership, pipelinesState]);

  const sidebarPipelineCount = useMemo(() => {
    if (!contextProjectId || !contextProjectMembership) return 0;
    if (!canViewProjectPipelines()) return 0;
    return getVisiblePipelineCountForProject(contextProjectId, pipelinesState);
  }, [contextProjectId, contextProjectMembership, pipelinesState]);

  useEffect(() => {
    setDashboardFocusOutputId(null);
    setActiveDashboardOutputId(null);
    setDashboardViewResetKey((value) => value + 1);
  }, [activeProjectId]);

  const workingAccessibleChats = useMemo(
    () => chats.filter((chat) => isChatWorkingAccessible(chat)),
    [
      chats,
      prototypeUserId,
      projectMembershipsState,
      accessLevelsState,
      dataSourcesState,
      constellationSettingsById,
    ],
  );

  const workingAccessibleOverviewChats = useMemo(
    () => overviewChats.filter((chat) => isChatWorkingAccessible({
      chatType: chat.chatSource === "galaxy" ? "galaxy" : "constellation",
      projectId: chat.projectId,
      constellationId: chat.constellationId,
    })),
    [
      overviewChats,
      prototypeUserId,
      projectMembershipsState,
      accessLevelsState,
      dataSourcesState,
      constellationSettingsById,
    ],
  );

  const accessibleHomeProjects = useMemo(
    () => {
      // Personal Project collection: active membership required (Org Admin included).
      const visible = homeProjects.filter((project) =>
        Boolean(
          getActiveProjectMembership(
            project.id,
            projectMembershipsState,
            prototypeUserId,
          ),
        ),
      );
      return visible.map((project) => {
        const membership = getActiveProjectMembership(
          project.id,
          projectMembershipsState,
          prototypeUserId,
        )!;
        const viewerProjectRole = membership.projectRole;
        const accessibleConstellations = overviewConstellations.filter((item) => {
          if (item.projectId !== project.id) return false;
          const record = constellationSettingsById[item.id]
            ?? getConstellationSettingsRecord(item.id);
          const connectedSourceIds = record?.connectedSources.map((source) => source.id) ?? [];
          return evaluateConstellationUseAccess({
            userId: prototypeUserId,
            projectRole: membership.projectRole,
            membershipStatus: membership.status,
            connectedSourceIds,
            accessLevels: accessLevelsState,
            dataSources: dataSourcesState,
          }).available;
        });
        const sourceIds = new Set<string>();
        for (const item of accessibleConstellations) {
          const record = constellationSettingsById[item.id]
            ?? getConstellationSettingsRecord(item.id);
          for (const source of record?.connectedSources ?? []) {
            sourceIds.add(source.id);
          }
        }
        return {
          ...project,
          constellationCount: accessibleConstellations.length,
          sourceCount: sourceIds.size,
          isEmpty: accessibleConstellations.length === 0,
          viewerProjectRole,
        };
      });
    },
    [
      homeProjects,
      projectMembershipsState,
      prototypeUserId,
      overviewConstellations,
      constellationSettingsById,
      accessLevelsState,
      dataSourcesState,
    ],
  );

  const sidebarSwitchableProjects = useMemo(
    () => accessibleHomeProjects.map((project) => ({
      id: project.id,
      label: project.name,
      projectRole: project.viewerProjectRole ?? null,
    })),
    [accessibleHomeProjects],
  );

  const prototypeUsersForDemo = useMemo(() => {
    const inProjectContext = Boolean(activeProjectId);
    return organizationUsersState
      .filter((user) => user.status === "active")
      .map((user) => {
        const projectRole = activeProjectId
          ? getActiveProjectMembership(
            activeProjectId,
            projectMembershipsState,
            user.id,
          )?.projectRole ?? null
          : null;
        return {
          id: user.id,
          name: user.name,
          orgRole: user.orgRole,
          projectRole,
          contextLabel: formatDemoIdentityContextLabel({
            orgRole: user.orgRole,
            projectRole,
            includeProjectRole: inProjectContext,
          }),
        };
      });
  }, [activeProjectId, organizationUsersState, projectMembershipsState]);

  const privateDataSourceCountForUser = useMemo(
    () => dataSourcesState.filter(
      (source) => source.ownership === "private" && source.ownerUserId === prototypeUserId,
    ).length,
    [dataSourcesState, prototypeUserId],
  );

  const organizationalDataSourceCount = useMemo(
    () => dataSourcesState.filter((source) => source.ownership === "organizational").length,
    [dataSourcesState],
  );

  const organizationMemberSummary = useMemo(() => ({
    total: organizationUsersState.length,
    active: organizationUsersState.filter((user) => user.status === "active").length,
    invited: organizationUsersState.filter((user) => user.status === "pending").length,
  }), [organizationUsersState]);

  const organizationUsageMetrics = useMemo(() => ({
    projects: filterActiveProjects(homeProjects).length,
    users: organizationUsersState.length,
    dataSources: dataSourcesState.length,
    accessLevels: accessLevelsState.length,
    constellations: CANONICAL_CONSTELLATIONS.length,
    chats: chats.length,
    dashboardOutputs: PROJECT_DASHBOARD_OUTPUTS.length,
    vidgets: vidgetsState.length,
  }), [
    homeProjects,
    organizationUsersState,
    dataSourcesState,
    accessLevelsState,
    chats,
    vidgetsState,
  ]);

  const workingAccessibleOverviewConstellations = useMemo(() => {
    return overviewConstellations.filter((item) => {
      if (!canAccessProject(item.projectId, projectMembershipsState, prototypeUserId)) {
        return false;
      }
      const membership = getActiveProjectMembership(
        item.projectId,
        projectMembershipsState,
        prototypeUserId,
      );
      const record = constellationSettingsById[item.id]
        ?? getConstellationSettingsRecord(item.id);
      const connectedSourceIds = record?.connectedSources.map((source) => source.id) ?? [];
      return evaluateConstellationUseAccess({
        userId: prototypeUserId,
        projectRole: membership?.projectRole ?? null,
        membershipStatus: membership?.status,
        connectedSourceIds,
        accessLevels: accessLevelsState,
        dataSources: dataSourcesState,
      }).available;
    });
  }, [
    overviewConstellations,
    projectMembershipsState,
    prototypeUserId,
    constellationSettingsById,
    accessLevelsState,
    dataSourcesState,
  ]);

  const projectActivityNavigationContext = useMemo(() => {
    if (!activeProjectId) return null;
    const projectChats = workingAccessibleOverviewChats.filter(
      (chat) => chat.projectId === activeProjectId,
    );
    const projectConstellations = workingAccessibleOverviewConstellations.filter(
      (entry) => entry.projectId === activeProjectId,
    );
    return buildActivityNavigationContext({
      projectId: activeProjectId,
      chatIds: projectChats.map((chat) => chat.id),
      constellationIds: projectConstellations.map((entry) => entry.id),
      outputIds: getProjectDashboardOutputs(activeProjectId).map((output) => output.id),
      vidgetIds: getVidgetsForProject(activeProjectId, vidgetsState).map((vidget) => vidget.id),
      hasGalaxy: Boolean(findGalaxyChatForProject(activeProjectId, chats, homeProjects)),
    });
  }, [
    activeProjectId,
    workingAccessibleOverviewChats,
    workingAccessibleOverviewConstellations,
    vidgetsState,
    chats,
    homeProjects,
  ]);

  function handleOpenProjectActivity(item: ProjectActivityItem) {
    if (!projectActivityNavigationContext || item.projectId !== projectActivityNavigationContext.projectId) {
      return;
    }
    openProjectActivity(item, projectActivityNavigationContext, {
      onOpenChat: handleOpenChatFromHome,
      onOpenConstellation: handleOpenConstellationFromProject,
      onOpenDashboard: handleOpenProjectDashboard,
      onOpenDashboardOutput: handleOpenDashboardOutput,
      onOpenVidget: handleOpenVidgetSettings,
      onOpenGalaxy: handleOpenGalaxyFromHome,
      onOpenGalaxySettings: handleOpenGalaxySettingsFromOverview,
    });
  }

  const projectAssistantConstellations = useMemo(() => {
    if (!contextProjectId || !contextProjectMembership) return [];
    return workingAccessibleOverviewConstellations
      .filter((item) => item.projectId === contextProjectId)
      .map((item) => ({ id: item.id, name: item.label }));
  }, [
    contextProjectId,
    contextProjectMembership,
    workingAccessibleOverviewConstellations,
  ]);

  useEffect(() => {
    if (appView !== "chat") return;
    const chat = chats.find((item) => item.id === activeChat);
    if (!chat) return;
    if (isChatWorkingAccessible(chat)) return;
    const fallback = workingAccessibleChats[0];
    if (fallback) {
      setActiveChat(fallback.id);
      return;
    }
    const projectId = chat.projectId;
    if (canAccessProject(projectId, projectMembershipsState, prototypeUserId)) {
      handleOpenProjectOverview(projectId, "overview");
      return;
    }
    handleNavigateHome();
  }, [
    appView,
    activeChat,
    chats,
    workingAccessibleChats,
    projectMembershipsState,
    prototypeUserId,
    accessLevelsState,
    dataSourcesState,
    constellationSettingsById,
  ]);

  if (!prototypeSignedIn) {
    return (
      <>
        <LoginPage
          onSignedIn={(rememberMe, userId) => {
            writePrototypeSignedIn(rememberMe);
            setPrototypeUserId(userId);
            setPrototypeSignedIn(true);
            const pending = consumePendingMfaNudge();
            if (pending) {
              const account = findPrototypeAccount(pending);
              if (account) {
                setMfaNudgeEmail(pending);
                setMfaNudgeOpen(true);
              }
            }
          }}
        />
        <Toaster richColors closeButton position="top-right" />
      </>
    );
  }

  if (inAppMfaSetupEmail) {
    return (
      <>
        <InAppMfaSetupHost
          email={inAppMfaSetupEmail}
          onComplete={() => {
            setInAppMfaSetupEmail(null);
            setMfaNudgeOpen(false);
            setMfaNudgeEmail(null);
          }}
          onCancel={() => {
            setInAppMfaSetupEmail(null);
          }}
        />
        <Toaster richColors closeButton position="top-right" />
      </>
    );
  }

  return (
    <div
      className="flex h-dvh max-h-dvh overflow-hidden"
      style={{ background: activeData?.chatType === "galaxy" ? "#FAFAFC" : "#FAFDFF" }}
    >
      <MfaInAppNudge
        open={mfaNudgeOpen && Boolean(mfaNudgeEmail)}
        onSetup={() => {
          if (!mfaNudgeEmail) return;
          setMfaNudgeOpen(false);
          setInAppMfaSetupEmail(mfaNudgeEmail);
        }}
        onRemindLater={() => {
          if (mfaNudgeEmail) snoozeMfaNudge(mfaNudgeEmail);
          setMfaNudgeOpen(false);
          setMfaNudgeEmail(null);
        }}
      />
      {isMobileNav && !mobileNavOpen ? (
        <button
          type="button"
          className="fixed left-3 top-3 z-[45] flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            background: "var(--luxia-surface, #fff)",
            border: "1px solid rgba(28, 19, 54, 0.12)",
            boxShadow: "0 4px 14px rgba(8, 5, 18, 0.16)",
            color: "var(--luxia-brand-primary, #5B3FA6)",
          }}
          aria-label="Open navigation"
          onClick={() => setMobileNavOpen(true)}
        >
          <LuxiaHomeIcon size={16} color="currentColor" />
        </button>
      ) : null}
      <LeftNav
        collapsed={leftNavCollapsed}
        onToggleCollapsed={handleLeftNavToggle}
        isMobileDrawer={isMobileNav}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        homeActive={appView === "home"}
        organizationUsersActive={
          appView === "organization-users" || appView === "organization-user"
        }
        accessLevelsActive={appView === "access-levels" || appView === "access-level"}
        dataSourcesActive={appView === "data-sources" || appView === "data-source-settings"}
        adminPipelinesActive={appView === "admin-pipelines"}
        canAdministerPipelines={canAdministerAccessLevels(prototypeUserId)}
        collapsePipelinesCollector={
          viewportWidth < 1280
          && (appView === "pipeline-detail" || appView === "pipeline-run-detail")
        }
        projectId={contextProjectId}
        projectLabel={contextProjectLabel}
        showProjectContext={showProjectContext}
        showGalaxy={Boolean(contextProjectMembership)}
        activeProjectSection={activeProjectSection}
        activeChatId={appView === "chat" ? activeChat : null}
        activeConstellationId={
          appView === "constellation-settings" || appView === "constellation-create"
            ? settingsConstellationId
            : null
        }
        activeDashboardOutputId={
          appView === "project" && projectBrowseMode === "dashboards"
            ? activeDashboardOutputId
            : null
        }
        activeVidgetId={appView === "vidget-settings" ? vidgetId : null}
        activePipelineId={
          appView === "pipeline-detail" || appView === "pipeline-run-detail"
            ? pipelineId
            : null
        }
        projectChats={sidebarProjectChats}
        projectConstellations={sidebarProjectConstellations}
        projectDashboardOutputs={sidebarProjectDashboardOutputs}
        projectVidgets={sidebarProjectVidgets}
        projectPipelines={sidebarProjectPipelines}
        switchableProjects={sidebarSwitchableProjects}
        chatTotalCount={sidebarProjectChats.length}
        constellationTotalCount={sidebarProjectConstellations.length}
        dashboardTotalCount={sidebarProjectDashboardOutputs.length}
        vidgetTotalCount={sidebarProjectVidgets.length}
        pipelineTotalCount={sidebarPipelineCount}
        onHomeClick={() => whenUnsavedNavigationAllows(handleNavigateHome)}
        onOrganizationUsersClick={() => whenUnsavedNavigationAllows(handleOpenOrganizationUsers)}
        onAccessLevelsClick={() => whenUnsavedNavigationAllows(handleOpenAccessLevels)}
        onDataSourcesClick={() => whenUnsavedNavigationAllows(handleOpenDataSources)}
        onAdminPipelinesClick={() => whenUnsavedNavigationAllows(handleOpenAdminPipelines)}
        onProjectSectionClick={(section) => {
          whenUnsavedNavigationAllows(() => handleProjectNavSection(section));
        }}
        onSwitchProject={(projectId) => {
          whenUnsavedNavigationAllows(() => {
            handleOpenProjectOverview(projectId, "overview");
          });
        }}
        onOpenChat={(chatId) => whenUnsavedNavigationAllows(() => handleSelectChat(chatId))}
        onOpenConstellation={(projectId, constellationId) => {
          whenUnsavedNavigationAllows(() => {
            handleOpenConstellationSettings(projectId, constellationId, "general");
          });
        }}
        onOpenDashboardOutput={(projectId, outputId) => {
          whenUnsavedNavigationAllows(() => handleOpenDashboardOutput(projectId, outputId));
        }}
        onOpenVidget={(projectId, nextVidgetId) => {
          whenUnsavedNavigationAllows(() => {
            handleOpenVidgetSettings(projectId, nextVidgetId);
          });
        }}
        onOpenPipeline={(projectId, nextPipelineId) => {
          whenUnsavedNavigationAllows(() => {
            handleOpenPipelineDetail(projectId, nextPipelineId);
          });
        }}
        prototypeUser={prototypeUser}
        prototypeProjectRole={prototypeProjectRole}
        activeProjectLabel={
          activeProjectId
            ? getProjectNameById(activeProjectId, homeProjects)
            : null
        }
        prototypeUsers={prototypeUsersForDemo}
        onPrototypeUserChange={handlePrototypeUserChange}
        onSettingsClick={() => {
          whenUnsavedNavigationAllows(() => handleOpenAccountSettings("profile"));
        }}
        onLogout={() => {
          whenUnsavedNavigationAllows(() => {
            clearPrototypeSignedIn();
            setPrototypeSignedIn(false);
          });
        }}
        onSecondaryRailOpenChange={setLeftNavSecondaryOpen}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {appView === "home" ? (
          <HomePageShell scrollRequest={homeScrollRequest} variant="standard">
            <HomePage
              projects={accessibleHomeProjects}
              recentWork={recentWork}
              pinnedProjectIds={pinnedProjectIds}
              pinnedEntityOrder={pinnedEntityOrder}
              primaryPreference={primaryPreference}
              dismissedContinueKeys={dismissedContinueKeys}
              browseMode={homeBrowseMode}
              onBrowseModeChange={setHomeBrowseMode}
              onPrimaryPreferenceChange={(preference) => {
                setPrimaryPreference(preference);
                writeHomePrimaryPreference(preference);
              }}
              onDismissFromContinue={handleDismissFromContinue}
              onRestoreToContinue={handleRestoreToContinue}
              onSetPrimaryHero={handleSetPrimaryHero}
              onShowAllOnHome={handleShowAllOnHome}
              onToggleProjectPin={handleToggleProjectPin}
              onArchiveProject={requestArchiveProject}
              onRestoreProject={handleRestoreProject}
              onEditProject={requestEditProjectDetails}
              onDeleteProject={requestDeleteProject}
              canEditProject={userCanConfigureProject}
              canArchiveProject={userCanArchiveProject}
              canDeleteProject={userCanDeleteProject}
              canRestoreProject={userCanRestoreProject}
              onToggleWorkPin={handleToggleWorkPin}
              onContinueWork={handleContinueWork}
              onOpenProject={handleOpenProjectFromHome}
              onOpenGalaxy={handleOpenGalaxyFromHome}
              onOpenChat={handleOpenChatFromHome}
              onOpenConstellation={handleOpenConstellationFromProject}
              searchConstellations={workingAccessibleOverviewConstellations.map((item) => ({
                id: item.id,
                label: item.label,
                projectId: item.projectId,
                type: item.type,
              }))}
              onNewChat={handleNewChat}
              onNewProject={() => setShowNewProjectModal(true)}
              onNavigateProjectDestination={handleNavigateProjectDestination}
            />
          </HomePageShell>
        ) : appView === "project" ? (
          <HomePageShell
            scrollRequest={homeScrollRequest}
            variant="standard"
          >
            {projectBrowseMode === "dashboards" ? (
              <ProjectDashboardPage
                projectId={activeProjectId}
                projects={homeProjects}
                projectRole={prototypeProjectRole}
                currentUserId={prototypeUserId}
                focusOutputId={dashboardFocusOutputId}
                viewResetKey={dashboardViewResetKey}
                onViewOutputIdChange={setActiveDashboardOutputId}
                onNavigateHome={handleNavigateHome}
                onViewProjects={() => {
                  setAppView("home");
                  setHomeBrowseMode("projects");
                  setActiveProjectId(null);
                  setProjectBrowseMode("overview");
                  setHomeScrollRequest((value) => value + 1);
                  if (typeof window !== "undefined" && !isHomePath(window.location.pathname)) {
                    window.history.pushState({ luxiaView: "home", browse: "projects" }, "", "/");
                  }
                }}
                onOpenProjectOverview={(projectId) => {
                  handleOpenProjectOverview(projectId, "overview");
                }}
                onOpenGalaxy={handleOpenGalaxyFromHome}
              />
            ) : projectBrowseMode === "constellations" && activeProjectId ? (
              <ConstellationsLibrary
                projectId={activeProjectId}
                projectName={getProjectNameById(activeProjectId, homeProjects)}
                constellations={(
                  userCanConfigureProject(activeProjectId)
                    ? overviewConstellations
                    : workingAccessibleOverviewConstellations
                ).filter((item) => item.projectId === activeProjectId)}
                onNavigateHome={handleNavigateHome}
                onBack={() => handleOpenProjectOverview(activeProjectId, "overview")}
                onOpen={(constellationId) => {
                  if (isConstellationWorkingAccessible(activeProjectId, constellationId)) {
                    handleOpenConstellationFromProject(activeProjectId, constellationId);
                    return;
                  }
                  handleOpenConstellationSettings(activeProjectId, constellationId);
                }}
                onOpenSettings={(constellationId) =>
                  handleOpenConstellationSettings(activeProjectId, constellationId)
                }
                onAdd={
                  userCanConfigureProject(activeProjectId)
                    ? () =>
                        handleAddConstellationToProject(
                          activeProjectId,
                          `Constellation name ${String(overviewConstellations.filter((item) => item.projectId === activeProjectId).length + 1).padStart(2, "0")}`,
                          "database",
                        )
                    : undefined
                }
              />
            ) : projectBrowseMode === "chats" && activeProjectId ? (
              <ChatsLibrary
                projectId={activeProjectId}
                projectName={getProjectNameById(activeProjectId, homeProjects)}
                chats={workingAccessibleOverviewChats.filter((chat) => chat.projectId === activeProjectId)}
                onNavigateHome={handleNavigateHome}
                onBack={() => handleOpenProjectOverview(activeProjectId, "overview")}
                onOpenChat={handleOpenChatFromHome}
                onNewChat={() => handleNewChatFromProject(activeProjectId)}
              />
            ) : projectBrowseMode === "activity" && activeProjectId && projectActivityNavigationContext ? (
              <ActivityLibrary
                projectId={activeProjectId}
                projectName={getProjectNameById(activeProjectId, homeProjects)}
                items={getProjectActivity(activeProjectId)}
                navigationContext={projectActivityNavigationContext}
                onNavigateHome={handleNavigateHome}
                onBack={() => handleOpenProjectOverview(activeProjectId, "overview")}
                onOpen={handleOpenProjectActivity}
              />
            ) : (
              <ProjectOverviewPage
                projectId={activeProjectId}
                projects={homeProjects}
                galaxyNameById={galaxyNameById}
                galaxyInstructionById={galaxyInstructionById}
                chats={workingAccessibleOverviewChats}
                constellations={workingAccessibleOverviewConstellations}
                initialBrowseMode="overview"
                onBrowseModeChange={setProjectBrowseMode}
                onNavigateHome={handleNavigateHome}
                onViewProjects={() => {
                  setAppView("home");
                  setHomeBrowseMode("projects");
                  setActiveProjectId(null);
                  setHomeScrollRequest((value) => value + 1);
                  if (typeof window !== "undefined" && !isHomePath(window.location.pathname)) {
                    window.history.pushState({ luxiaView: "home", browse: "projects" }, "", "/");
                  }
                }}
                onOpenGalaxy={handleOpenGalaxyFromHome}
                onOpenGalaxySettings={handleOpenGalaxySettingsFromOverview}
                onOpenChat={handleOpenChatFromHome}
                onOpenConstellation={handleOpenConstellationFromProject}
                onOpenConstellationSettings={handleOpenConstellationSettings}
                onViewAllConstellations={handleOpenConstellationsList}
                onViewAllChats={handleOpenChatsList}
                onNewChat={handleNewChatFromProject}
                onAddConstellation={
                  activeProjectId && userCanConfigureProject(activeProjectId)
                    ? handleAddConstellationToProject
                    : undefined
                }
                onOpenDashboard={handleOpenProjectDashboard}
                onOpenDashboardOutput={handleOpenDashboardOutput}
                onViewAllActivity={handleOpenActivityList}
                activityNavigationContext={projectActivityNavigationContext ?? undefined}
                onRenameProject={
                  activeProjectId && userCanConfigureProject(activeProjectId)
                    ? handleRenameProject
                    : undefined
                }
                onEditProject={
                  activeProjectId && userCanConfigureProject(activeProjectId)
                    ? requestEditProjectDetails
                    : undefined
                }
                onArchiveProject={
                  activeProjectId && userCanArchiveProject(activeProjectId)
                    ? requestArchiveProject
                    : undefined
                }
                onDeleteProject={
                  activeProjectId && userCanDeleteProject(activeProjectId)
                    ? requestDeleteProject
                    : undefined
                }
                onViewAllVidgets={handleOpenProjectVidgets}
                vidgets={
                  activeProjectId
                    ? getVidgetsForProject(activeProjectId, vidgetsState)
                    : []
                }
                onCreateVidgetFromGalaxy={(projectId) =>
                  handleOpenCreateVidget(projectId, { kind: "galaxy" })
                }
                onCreateVidget={(projectId) =>
                  handleOpenCreateVidget(projectId, { kind: "choose" })
                }
                canManageVidgets={(projectId) => canManageVidgets(projectRoleFor(projectId))}
                onAskProjectAssistant={() => setProjectAssistantOpen(true)}
                onOpenVirtualAssistant={(projectId, vidgetId) => {
                  handleOpenVidgetSettings(projectId, vidgetId);
                }}
              />
            )}
          </HomePageShell>
        ) : appView === "constellation-create" && activeProjectId ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            <ConstellationCreatePage
              projectId={activeProjectId}
              projectName={getProjectNameById(activeProjectId, homeProjects)}
              existingConstellationNames={allConstellations
                .filter((item) => item.projectId === activeProjectId)
                .map((item) => item.label)}
              unavailable={!homeProjects.some((project) => project.id === activeProjectId)}
              accessLevels={accessLevelsState}
              dataSources={dataSourcesState}
              currentUserId={prototypeUserId}
              initialExistingDataSourceId={constellationCreateExistingSourceId}
              navigationGuardRef={constellationCreateGuardRef}
              onNavigateHome={handleNavigateHome}
              onOpenProject={(projectId) => handleOpenProjectOverview(projectId, "overview")}
              onCancel={(projectId) => handleOpenConstellationsList(projectId)}
              onCreate={handleCreateConstellationDraft}
            />
          </HomePageShell>
        ) : appView === "galaxy-settings" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {(() => {
              const projectId = activeProjectId ?? "";
              const settingsRecord = projectId
                ? resolveGalaxySettingsRecord(projectId)
                : null;
              const membership = projectId
                ? getActiveProjectMembership(
                  projectId,
                  projectMembershipsState,
                  prototypeUserId,
                )
                : null;
              const projectConstellations = projectId
                ? allConstellations.filter((item) => item.projectId === projectId)
                : [];
              const constellationItems = projectId && membership
                ? buildGalaxyConstellationRoutingItems({
                  projectConstellations: projectConstellations.map((item) => ({
                    id: item.id,
                    label: item.label,
                    type: item.type,
                  })),
                  projectRole: membership.projectRole,
                  membershipStatus: membership.status,
                  userId: prototypeUserId,
                  accessLevels: accessLevelsState,
                  dataSources: dataSourcesState,
                  constellationSettingsById,
                })
                : [];
              const fallbackRecord = settingsRecord ?? buildGalaxySettingsRecord({
                id: "galaxy-unavailable",
                projectId: projectId || "unavailable",
                projectName: projectId
                  ? getProjectNameById(projectId, homeProjects)
                  : "Project unavailable",
                name: "Galaxy unavailable",
              });

              return (
                <GalaxySettingsPage
                  record={fallbackRecord}
                  unavailable={!settingsRecord}
                  unavailableReason="This Galaxy settings view is unavailable."
                  constellationItems={constellationItems}
                  activeSection={galaxySettingsSection}
                  onSectionChange={(section) => {
                    if (!projectId) return;
                    handleGalaxySettingsSectionChange(projectId, section);
                  }}
                  focusHeadingToken={galaxySettingsFocusHeadingToken}
                  onSaveGeneral={(draft) => {
                    if (!projectId) return;
                    handleSaveGalaxySettingsGeneral(projectId, draft);
                  }}
                  onSaveInstruction={(draft) => {
                    if (!projectId) return;
                    handleSaveGalaxySettingsInstruction(projectId, draft);
                  }}
                  onSaveRouting={(draft) => {
                    if (!projectId) return;
                    handleSaveGalaxySettingsRouting(projectId, draft);
                  }}
                  onOpenGalaxy={handleOpenGalaxyFromHome}
                  onNavigateHome={handleNavigateHome}
                  onOpenProject={(pid) => handleOpenProjectOverview(pid, "overview")}
                  onOpenConstellations={handleOpenConstellationsList}
                  onOpenConstellationResponse={(constellationId) => {
                    if (!projectId) return;
                    handleOpenConstellationSettings(projectId, constellationId, "response");
                  }}
                  onOpenAccessLevels={handleOpenAccessLevels}
                  onOpenDataSources={handleOpenDataSources}
                  currentProjectRole={membership?.projectRole ?? null}
                  onCreateVidget={
                    canManageVidgets(membership?.projectRole)
                      ? (pid) => handleOpenCreateVidget(pid, { kind: "galaxy" })
                      : undefined
                  }
                />
              );
            })()}
          </HomePageShell>
        ) : appView === "constellation-settings" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {(() => {
              const projectId = activeProjectId ?? "";
              const constellationId = settingsConstellationId ?? "";
              const constellationProjectId =
                settingsConstellation?.projectId
                || settingsRecord?.projectId
                || projectId;
              const constellationProjectRole = projectRoleFor(constellationProjectId);
              const fallbackRecord = settingsRecord ?? buildSettingsForConstellation({
                id: constellationId || "unavailable",
                projectId: projectId || "unavailable",
                projectName: projectId
                  ? getProjectNameById(projectId, homeProjects)
                  : "Project unavailable",
                name: settingsConstellation?.label ?? "Constellation unavailable",
                description: "",
                type: settingsConstellation?.type ?? "database",
              });
              const liveCapabilityBundle = constellationId && !settingsUnavailable
                ? resolveCapabilityBundle(constellationId, fallbackRecord.instructions)
                : null;
              const settingsPageRecord: ConstellationSettingsRecord = {
                ...fallbackRecord,
                projectName: projectId
                  ? getProjectNameById(projectId, homeProjects)
                  : fallbackRecord.projectName,
                name: settingsConstellation?.label ?? fallbackRecord.name,
                capabilitySummaries: {
                  ...fallbackRecord.capabilitySummaries,
                  ...(liveCapabilityBundle
                    ? summarizeCapabilityBundle(liveCapabilityBundle)
                    : {}),
                },
              };

              if (settingsCapabilityPath) {
                const capabilityBundle = liveCapabilityBundle
                  ?? resolveCapabilityBundle(
                    constellationId || "unavailable",
                    fallbackRecord.instructions,
                  );
                return (
                  <ConstellationCapabilityManagePage
                    project={{
                      id: projectId || "unavailable",
                      name: projectId
                        ? getProjectNameById(projectId, homeProjects)
                        : "Project unavailable",
                    }}
                    constellation={{
                      id: constellationId || "unavailable",
                      name: settingsConstellation?.label ?? fallbackRecord.name,
                      type: settingsConstellation?.type ?? fallbackRecord.type,
                      status: fallbackRecord.status,
                    }}
                    capabilityId={settingsCapabilityId ?? "instr"}
                    bundle={capabilityBundle}
                    connectedSourceIds={settingsPageRecord.connectedSources.map((source) => source.id)}
                    onUpdateBundle={(next) => {
                      if (!constellationId || settingsUnavailable) return;
                      const capId = settingsCapabilityId ?? "instr";
                      const isKnowledgeCap = capId === "kb" || capId === "instr" || capId === "crawler";
                      const role = constellationProjectRole;
                      if (isKnowledgeCap) {
                        if (!canEditConstellationKnowledge(role)) return;
                        handleUpdateCapabilityBundle(constellationId, next, {
                          capabilityKind: "knowledge",
                        });
                        return;
                      }
                      if (!canAdministerProjectConfiguration(prototypeUserId, role)) return;
                      handleUpdateCapabilityBundle(constellationId, next, {
                        capabilityKind: "configure",
                      });
                    }}
                    readOnly={(() => {
                      const capId = settingsCapabilityId ?? "instr";
                      const isKnowledgeCap = capId === "kb" || capId === "instr" || capId === "crawler";
                      const role = constellationProjectRole;
                      if (isKnowledgeCap) return !canEditConstellationKnowledge(role);
                      return !canAdministerProjectConfiguration(prototypeUserId, role);
                    })()}
                    unavailable={
                      settingsUnavailable
                      || settingsCapabilityUnavailable
                      || !settingsCapabilityId
                    }
                    unavailableReason={
                      settingsUnavailable
                        ? "This Constellation settings view is unavailable."
                        : "This capability is not available for this Constellation type."
                    }
                    navigationGuardRef={capabilityManageGuardRef}
                    onBackToSettings={() => {
                      if (!projectId || !constellationId) {
                        handleNavigateHome();
                        return;
                      }
                      handleOpenConstellationSettings(
                        projectId,
                        constellationId,
                        "configuration",
                        { explicitTab: true, focusHeading: true },
                      );
                    }}
                    onNavigateHome={handleNavigateHome}
                    onOpenProject={handleOpenProjectFromHome}
                    onOpenConstellations={handleOpenConstellationsList}
                    onOpenConstellation={(pid, cid) => {
                      handleOpenConstellationSettings(pid, cid, "general", {
                        focusHeading: true,
                      });
                    }}
                  />
                );
              }

              return (
                <ConstellationSettingsPage
                  record={settingsPageRecord}
                  unavailable={settingsUnavailable || !settingsRecord}
                  unavailableReason="This Constellation settings view is unavailable."
                  activeSection={settingsSection}
                  onSectionChange={(section) => {
                    if (!projectId || !constellationId) return;
                    handleConstellationSettingsSectionChange(
                      projectId,
                      constellationId,
                      section,
                    );
                  }}
                  focusHeadingToken={settingsFocusHeadingToken}
                  relatedChats={chats
                    .filter((chat) =>
                      chat.chatType === "constellation"
                      && chat.projectId === projectId
                      && chat.constellationId === constellationId
                      && isChatWorkingAccessible(chat),
                    )
                    .map((chat) => ({ id: chat.id, label: chat.label }))}
                  relatedVidgets={getVidgetsForProject(projectId, vidgetsState)
                    .filter((item) =>
                      item.sourceType === "constellation"
                      && item.constellationId === constellationId,
                    )
                    .map((item) => ({ id: item.id, label: item.name }))}
                  onCreateChat={
                    projectId
                    && constellationId
                    && isConstellationWorkingAccessible(projectId, constellationId)
                      ? handleCreateChatForConstellation
                      : undefined
                  }
                  onOpenChat={handleOpenChatFromHome}
                  onOpenVidget={(pid, nextVidgetId) => {
                    handleOpenVidgetSettings(pid, nextVidgetId);
                  }}
                  onSaveGeneral={(draft) => {
                    if (!constellationId || settingsUnavailable) return;
                    handleSaveConstellationSettings(constellationId, draft);
                  }}
                  onManageCapability={(capabilityId) => {
                    if (!projectId || !constellationId || settingsUnavailable) return;
                    const isKnowledgeCap = capabilityId === "kb" || capabilityId === "instr" || capabilityId === "crawler";
                    const role = constellationProjectRole;
                    if (isKnowledgeCap) {
                      // KB may open read-only for Members; instr/crawler still require edit.
                      if (capabilityId !== "kb" && !canEditConstellationKnowledge(role)) return;
                    } else if (!canAdministerProjectConfiguration(prototypeUserId, role)) {
                      return;
                    }
                    handleOpenConstellationCapability(
                      projectId,
                      constellationId,
                      capabilityId,
                    );
                  }}
                  onAddDataSource={(sourceId) => {
                    if (!constellationId || settingsUnavailable) return;
                    handleAddConstellationDataSource(constellationId, sourceId);
                  }}
                  onOpenDataSourceSettings={handleOpenDataSourceSettings}
                  onManageSourceAccess={handleManageSourceAccess}
                  onDisconnectSource={(sourceId) => {
                    if (!constellationId || settingsUnavailable) return;
                    handleDisconnectConstellationSource(constellationId, sourceId);
                  }}
                  onArchive={() => {
                    if (!constellationId || settingsUnavailable) return;
                    handleArchiveConstellationSettings(constellationId);
                  }}
                  onDelete={() => {
                    if (!projectId || !constellationId || settingsUnavailable) return;
                    handleDeleteConstellationSettings(projectId, constellationId);
                  }}
                  onDuplicateConstellation={(name) => {
                    if (!constellationId || settingsUnavailable) {
                      throw new Error("This Constellation cannot be duplicated.");
                    }
                    return handleDuplicateConstellation(constellationId, name);
                  }}
                  onOpenDuplicatedConstellation={handleOpenDuplicatedConstellation}
                  onNavigateHome={handleNavigateHome}
                  onOpenProject={handleOpenProjectFromHome}
                  onOpenConstellations={handleOpenConstellationsList}
                  onOpenConstellation={handleOpenConstellationFromProject}
                  onOpenMembers={handleOpenProjectMembers}
                  onOpenAccessLevels={handleOpenAccessLevels}
                  accessLevels={accessLevelsState}
                  dataSources={dataSourcesState}
                  currentUserId={prototypeUserId}
                  currentProjectRole={constellationProjectRole}
                  onCreateVidget={
                    canManageVidgets(projectRoleFor(projectId))
                      ? (pid, constellationId) =>
                        handleOpenCreateVidget(pid, {
                          kind: "constellation",
                          constellationId,
                        })
                      : undefined
                  }
                />
              );
            })()}
          </HomePageShell>
        ) : appView === "project-vidgets" && activeProjectId ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {(() => {
              const projectId = activeProjectId;
              const project = homeProjects.find((entry) => entry.id === projectId);
              const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);
              const projectGalaxyId = project?.galaxyId
                ?? galaxyChat?.id
                ?? null;
              const galaxyName = projectGalaxyId
                ? (galaxyNameById[projectGalaxyId] ?? galaxyChat?.label ?? "")
                : "";
              const constellationProjectById = Object.fromEntries(
                allConstellations.map((item) => [item.id, item.projectId]),
              );
              return (
                <VidgetsPage
                  projectId={projectId}
                  projectName={getProjectNameById(projectId, homeProjects)}
                  galaxyName={galaxyName}
                  projectGalaxyId={projectGalaxyId}
                  vidgets={getVidgetsForProject(projectId, vidgetsState)}
                  constellationNameById={constellationNameById}
                  constellationProjectById={constellationProjectById}
                  canManage={canManageVidgets(projectRoleFor(projectId))}
                  canReviewInbox={canReviewVidgetInbox(projectRoleFor(projectId))}
                  onNavigateHome={handleNavigateHome}
                  onOpenProject={(pid) => handleOpenProjectOverview(pid, "overview")}
                  onOpenInbox={(id) =>
                    handleOpenVidgetInbox(projectId, {
                      query: id ? { vidgetId: id } : undefined,
                    })
                  }
                  onCreate={() => handleOpenCreateVidget(projectId, { kind: "choose" })}
                  onOpen={(id) => handleOpenVidgetSettings(projectId, id)}
                  onPreview={(id) =>
                    handleOpenVidgetSettings(projectId, id, "interface", true)
                  }
                  onRename={(id, name) => {
                    if (!canManageVidgets(projectRoleFor(projectId))) {
                      toast.error(VIDGET_MANAGE_DENIED_MESSAGE);
                      return;
                    }
                    const trimmed = name.trim();
                    if (!trimmed) return;
                    setVidgetsState((prev) =>
                      prev.map((item) =>
                        item.id === id
                          ? { ...item, name: trimmed, updatedAt: new Date().toISOString() }
                          : item,
                      ),
                    );
                    toast.success("Vidget renamed");
                  }}
                  onDuplicate={(id) => {
                    if (!canManageVidgets(projectRoleFor(projectId))) {
                      toast.error(VIDGET_MANAGE_DENIED_MESSAGE);
                      return;
                    }
                    const source = vidgetsState.find(
                      (item) => item.id === id && item.projectId === projectId,
                    );
                    if (!source) return;
                    const copy = duplicateVidget(source);
                    setVidgetsState((prev) => [copy, ...prev]);
                    toast.success("Vidget duplicated");
                  }}
                  onDelete={(id) => {
                    if (!canManageVidgets(projectRoleFor(projectId))) {
                      toast.error(VIDGET_MANAGE_DENIED_MESSAGE);
                      return;
                    }
                    setVidgetsState((prev) =>
                      prev.filter(
                        (item) => !(item.id === id && item.projectId === projectId),
                      ),
                    );
                    toast.success("Vidget deleted");
                  }}
                />
              );
            })()}
          </HomePageShell>
        ) : appView === "project-pipelines" && activeProjectId ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            <PipelinesPage
              projectId={activeProjectId}
              projectName={getProjectNameById(activeProjectId, homeProjects)}
              pipelines={getPipelinesForProject(activeProjectId, pipelinesState)}
              onNavigateHome={handleNavigateHome}
              onOpenProject={(pid) => handleOpenProjectOverview(pid, "overview")}
              onOpenPipeline={(id) => handleOpenPipelineDetail(activeProjectId, id)}
            />
          </HomePageShell>
        ) : appView === "pipeline-detail" && activeProjectId && pipelineId ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {(() => {
              const projectId = activeProjectId;
              const pipeline = getPipelineById(projectId, pipelineId, pipelinesState);
              if (!pipeline) {
                return (
                  <PipelineRouteMissingState
                    title="Pipeline not found"
                    description="This pipeline could not be found or is no longer available."
                    actionLabel="Back to Pipelines"
                    onAction={() => handleOpenProjectPipelines(projectId)}
                  />
                );
              }
              const feedsName = pipeline.feedsConstellationId
                ? constellationNameById[pipeline.feedsConstellationId] ?? null
                : null;
              const role = projectRoleFor(projectId);
              const orgAdmin = isOrganizationAdmin(prototypeUserId);
              return (
                <PipelineDetailPage
                  projectId={projectId}
                  projectName={getProjectNameById(projectId, homeProjects)}
                  pipeline={pipeline}
                  runs={getRunsForPipeline(projectId, pipelineId, pipelineRunsState)}
                  tasks={pipelineTasksState.filter(
                    (task) =>
                      task.projectId === projectId && task.pipelineId === pipelineId,
                  )}
                  variables={getVariablesForPipeline(
                    projectId,
                    pipelineId,
                    pipelineVariablesState,
                  )}
                  feedsConstellationName={feedsName}
                  projectRole={role}
                  isOrgAdmin={orgAdmin}
                  onNavigateHome={handleNavigateHome}
                  onOpenProject={(pid) => handleOpenProjectOverview(pid, "overview")}
                  onOpenPipelines={handleOpenProjectPipelines}
                  onOpenRun={(runId, taskKey) =>
                    handleOpenPipelineRun(projectId, pipelineId, runId, taskKey)
                  }
                  onRunPipeline={() =>
                    handlePrototypeRunPipeline(projectId, pipelineId)
                  }
                  onSaveVariables={(next) =>
                    handlePrototypeSavePipelineVariables(projectId, pipelineId, next)
                  }
                />
              );
            })()}
          </HomePageShell>
        ) : appView === "pipeline-run-detail"
          && activeProjectId
          && pipelineId
          && pipelineRunId ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {(() => {
              const projectId = activeProjectId;
              const pipeline = getPipelineById(projectId, pipelineId, pipelinesState);
              const run = pipeline
                ? getRunById(projectId, pipelineId, pipelineRunId, pipelineRunsState)
                : null;
              if (!pipeline) {
                return (
                  <PipelineRouteMissingState
                    title="Pipeline not found"
                    description="This pipeline could not be found or is no longer available."
                    actionLabel="Back to Pipelines"
                    onAction={() => handleOpenProjectPipelines(projectId)}
                  />
                );
              }
              if (!run) {
                return (
                  <PipelineRouteMissingState
                    title="Run not found"
                    description="This run is unavailable or no longer exists for this pipeline."
                    actionLabel="Back to pipeline"
                    onAction={() => handleOpenPipelineDetail(projectId, pipelineId)}
                  />
                );
              }
              const role = projectRoleFor(projectId);
              const orgAdmin = isOrganizationAdmin(prototypeUserId);
              return (
                <PipelineRunDetailPage
                  key={`${pipelineRunId}:${pipelineRunFocusTaskKey ?? ""}`}
                  projectId={projectId}
                  projectName={getProjectNameById(projectId, homeProjects)}
                  pipeline={pipeline}
                  run={run}
                  tasks={getTasksForRun(pipelineRunId, pipelineTasksState)}
                  initialSelectedTaskKey={pipelineRunFocusTaskKey}
                  projectRole={role}
                  isOrgAdmin={orgAdmin}
                  onNavigateHome={handleNavigateHome}
                  onOpenProject={(pid) => handleOpenProjectOverview(pid, "overview")}
                  onOpenPipelines={handleOpenProjectPipelines}
                  onOpenPipeline={(id) => handleOpenPipelineDetail(projectId, id)}
                  onRetryTask={(taskId) =>
                    handlePrototypeRetryPipelineTask(
                      projectId,
                      pipelineId,
                      pipelineRunId,
                      taskId,
                    )
                  }
                />
              );
            })()}
          </HomePageShell>
        ) : appView === "vidget-inbox" && activeProjectId ? (
          <HomePageShell
            scrollRequest={homeScrollRequest}
            framed={false}
            containLayout
          >
            {(() => {
              const projectId = activeProjectId;
              const constellationTypeById = Object.fromEntries(
                allConstellations.map((item) => [item.id, item.type]),
              );
              return (
                <VidgetInboxPage
                  projectId={projectId}
                  projectName={getProjectNameById(projectId, homeProjects)}
                  sessionId={vidgetInboxSessionId}
                  search={vidgetInboxSearch}
                  vidgets={getVidgetsForProject(projectId, vidgetsState)}
                  constellationNameById={constellationNameById}
                  constellationTypeById={constellationTypeById}
                  canReview={canReviewVidgetInbox(projectRoleFor(projectId))}
                  canManage={canManageVidgets(projectRoleFor(projectId))}
                  onNavigateHome={handleNavigateHome}
                  onOpenProject={(pid) => handleOpenProjectOverview(pid, "overview")}
                  onOpenVidgets={handleOpenProjectVidgets}
                  onCreateVidget={
                    canManageVidgets(projectRoleFor(projectId))
                      ? () => handleOpenCreateVidget(projectId, { kind: "choose" })
                      : undefined
                  }
                  onNavigateInbox={({ query, history }) =>
                    handleOpenVidgetInbox(projectId, {
                      query,
                      history,
                    })
                  }
                  onRefine={handleRefineInboxInteraction}
                />
              );
            })()}
          </HomePageShell>
        ) : appView === "vidget-settings" && activeProjectId && vidgetId ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {(() => {
              const projectId = activeProjectId;
              const record =
                getVidgetForProject(projectId, vidgetId, vidgetsState) ?? null;
              if (!record) {
                return (
                  <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 py-16">
                    <p className="luxia-type-overline-data" style={{ color: "var(--luxia-purple-60)" }}>
                      Vidget settings
                    </p>
                    <h1 className="luxia-type-title-page" style={{ color: "var(--luxia-purple-70)" }}>
                      Unavailable
                    </h1>
                    <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                      This Vidget is not available in the current Project.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      onClick={() => handleOpenProjectVidgets(projectId)}
                    >
                      Back to Vidgets
                    </Button>
                  </div>
                );
              }
              const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);
              const project = homeProjects.find((entry) => entry.id === projectId);
              const projectGalaxyId = project?.galaxyId
                ?? galaxyChat?.id
                ?? null;
              const galaxyName = projectGalaxyId
                ? (galaxyNameById[projectGalaxyId] ?? null)
                : null;
              const constellationOptions = allConstellations
                .filter((item) => item.projectId === projectId)
                .map((item) => ({
                  id: item.id,
                  name: item.label,
                  description: item.description,
                }));
              const projectConstellations = constellationOptions.map((item) => ({
                id: item.id,
                projectId,
                name: item.name,
              }));
              const boundConstellation = record.constellationId
                ? allConstellations.find((item) => item.id === record.constellationId)
                : undefined;
              const sourceDisplay = resolveVidgetSourceDisplay(record, {
                projectGalaxyId,
                galaxyName,
                constellation: boundConstellation
                  ? {
                      id: boundConstellation.id,
                      projectId: boundConstellation.projectId,
                      name: boundConstellation.label,
                    }
                  : record.constellationId
                    ? null
                    : undefined,
                projectConstellations,
              });
              const constellationName = sourceDisplay.available
                && sourceDisplay.sourceType === "constellation"
                ? sourceDisplay.label
                : null;
              const resolvedGalaxyName = sourceDisplay.available
                && sourceDisplay.sourceType === "galaxy"
                ? sourceDisplay.label
                : galaxyName ?? "";
              return (
                <VidgetSettingsPage
                  record={record}
                  projectId={projectId}
                  projectName={getProjectNameById(projectId, homeProjects)}
                  galaxyName={resolvedGalaxyName}
                  constellationName={constellationName}
                  constellationOptions={constellationOptions}
                  sourceAvailable={sourceDisplay.available}
                  sourceDisplayLabel={sourceDisplay.label}
                  activeSection={vidgetSettingsSection}
                  focusPreviewOnMount={vidgetSettingsFocusPreview}
                  onPreviewFocusHandled={() => setVidgetSettingsFocusPreview(false)}
                  onSectionChange={(section) => {
                    setVidgetSettingsSection(section);
                    if (typeof window === "undefined") return;
                    const next = getVidgetSettingsPath(projectId, record.id, {
                      tab: vidgetSettingsSectionToTab(section),
                    });
                    const current = `${window.location.pathname}${window.location.search}`;
                    if (current === next) return;
                    window.history.pushState(
                      {
                        luxiaView: "vidget-settings",
                        projectId,
                        vidgetId: record.id,
                        section,
                      },
                      "",
                      next,
                    );
                  }}
                  onSave={(nextRecord) => {
                    if (!canManageVidgets(projectRoleFor(projectId))) {
                      toast.error(VIDGET_MANAGE_DENIED_MESSAGE);
                      return;
                    }
                    if (
                      nextRecord.id !== record.id
                      || nextRecord.projectId !== projectId
                    ) {
                      toast.error("This Vidget is not available in the current Project.");
                      return;
                    }
                    const locked = withLockedVidgetSource(nextRecord, record);
                    const scopeCheck = validateVidgetScopeForProject(
                      locked,
                      allConstellations.map((item) => ({
                        id: item.id,
                        projectId: item.projectId,
                      })),
                    );
                    if (!scopeCheck.valid) {
                      toast.error(scopeCheck.message ?? "Invalid Vidget source scope.");
                      return;
                    }
                    setVidgetsState((prev) =>
                      prev.map((item) =>
                        item.id === locked.id && item.projectId === projectId
                          ? cloneVidget(locked)
                          : item,
                      ),
                    );
                    toast.success("Vidget saved");
                  }}
                  onPublish={(nextRecord) => {
                    if (!canManageVidgets(projectRoleFor(projectId))) {
                      toast.error(VIDGET_MANAGE_DENIED_MESSAGE);
                      return false;
                    }
                    if (!sourceDisplay.available) {
                      toast.error("Cannot publish: the Vidget source is unavailable.");
                      return false;
                    }
                    if (
                      nextRecord.id !== record.id
                      || nextRecord.projectId !== projectId
                    ) {
                      toast.error("This Vidget is not available in the current Project.");
                      return false;
                    }
                    const locked = withLockedVidgetSource(nextRecord, record);
                    const publishScopeCheck = validateVidgetScopeForProject(
                      locked,
                      allConstellations.map((item) => ({
                        id: item.id,
                        projectId: item.projectId,
                      })),
                    );
                    if (!publishScopeCheck.valid) {
                      toast.error(
                        publishScopeCheck.message ?? "Cannot publish: invalid Vidget source scope.",
                      );
                      return false;
                    }
                    setVidgetsState((prev) =>
                      prev.map((item) =>
                        item.id === locked.id && item.projectId === projectId
                          ? cloneVidget(locked)
                          : item,
                      ),
                    );
                    return true;
                  }}
                  onNavigateHome={handleNavigateHome}
                  onOpenProject={(pid) => handleOpenProjectOverview(pid, "overview")}
                  onOpenVidgets={handleOpenProjectVidgets}
                  currentProjectRole={projectRoleFor(projectId)}
                />
              );
            })()}
          </HomePageShell>
        ) : appView === "project-members" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {membersProject && membersProjectExists ? (
              <ProjectMembersPage
                project={membersProject}
                memberships={membersForProject}
                accessLevels={accessLevelsState}
                organizationUsers={organizationUsersState.filter(
                  (user) => user.status === "active",
                )}
                dataSources={dataSourcesState}
                projectRequiredSourceIds={getProjectRequiredDataSourceIds(membersProject.id)}
                onSaveMemberships={(memberships) => {
                  setProjectMembershipsState((prev) => {
                    const others = prev.filter(
                      (membership) => membership.projectId !== membersProject.id,
                    );
                    return [...others, ...memberships];
                  });
                  setHomeProjects((prev) => prev.map((project) => (
                    project.id === membersProject.id
                      ? {
                        ...project,
                        memberCount: countProjectMembers(
                          membersProject.id,
                          memberships,
                        ),
                      }
                      : project
                  )));
                }}
                onNavigateHome={handleNavigateHome}
                onOpenProject={handleOpenProjectFromHome}
                onOpenAccessLevels={handleOpenAccessLevels}
                onOpenDataSourceSettings={handleOpenDataSourceSettings}
              />
            ) : (
              <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 py-16">
                <p className="luxia-type-overline-data" style={{ color: "var(--luxia-purple-60)" }}>
                  Members & Roles
                </p>
                <h1 className="luxia-type-title-page" style={{ color: "var(--luxia-purple-70)" }}>
                  Unavailable
                </h1>
                <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                  This Project is not available in the current workspace.
                </p>
                <Button type="button" variant="outline" size="compact" onClick={handleNavigateHome}>
                  Back to Home
                </Button>
              </div>
            )}
          </HomePageShell>
        ) : appView === "organization-users" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            <OrganizationUsersPage
              users={organizationUsersState}
              memberships={projectMembershipsState}
              accessLevels={accessLevelsState}
              onOpenUser={handleOpenOrganizationUser}
              onInvite={() => {
                if (!canAdministerAccessLevels(prototypeUserId)) {
                  toast.error("You do not have permission to invite organization users.");
                  return;
                }
                setInviteOrganizationUserOpen(true);
              }}
              onUpdateOrgRole={(userId, orgRole) => {
                if (!canAdministerAccessLevels(prototypeUserId)) {
                  toast.error("You do not have permission to edit Organization roles.");
                  return;
                }
                setOrganizationUsersState((prev) =>
                  prev.map((user) =>
                    user.id === userId ? { ...user, orgRole } : user,
                  ),
                );
                toast.success("Organization role updated");
              }}
              onRemoveUser={(userId) => {
                if (!canAdministerAccessLevels(prototypeUserId)) {
                  toast.error("You do not have permission to remove organization users.");
                  return;
                }
                removeOrganizationUserCompletely(userId);
                toast.success("User removed from organization");
              }}
              onResendInvitation={(userId) => {
                if (!canAdministerAccessLevels(prototypeUserId)) return;
                const user = organizationUsersState.find((entry) => entry.id === userId);
                toast.success(
                  user
                    ? `Invitation resent to ${user.email}`
                    : "Invitation resent",
                );
              }}
              onCancelInvitation={(userId) => {
                if (!canAdministerAccessLevels(prototypeUserId)) return;
                removeOrganizationUserCompletely(userId);
                toast.success("Invitation cancelled");
              }}
              onNavigateHome={handleNavigateHome}
              canAdminister={canAdministerAccessLevels(prototypeUserId)}
            />
          </HomePageShell>
        ) : appView === "organization-user" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {(() => {
              const detailUser = organizationUsersState.find(
                (user) => user.id === organizationUserId,
              );
              if (!detailUser) {
                return (
                  <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 py-16">
                    <p
                      className="luxia-type-overline-data"
                      style={{ color: "var(--luxia-purple-60)" }}
                    >
                      Users
                    </p>
                    <h1
                      className="luxia-type-title-page"
                      style={{ color: "var(--luxia-purple-70)" }}
                    >
                      User unavailable
                    </h1>
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      onClick={handleOpenOrganizationUsers}
                    >
                      Back to Users
                    </Button>
                  </div>
                );
              }
              return (
                <OrganizationUserDetailPage
                  user={detailUser}
                  memberships={projectMembershipsState}
                  accessLevels={accessLevelsState}
                  dataSources={dataSourcesState}
                  projectOptions={homeProjects.map((project) => ({
                    id: project.id,
                    name: project.name,
                  }))}
                  onNavigateHome={handleNavigateHome}
                  onNavigateUsers={handleOpenOrganizationUsers}
                  onOpenProject={handleOpenProjectFromHome}
                  onOpenProjectMembers={handleOpenProjectMembers}
                  onOpenAccessLevel={handleOpenAccessLevel}
                  canEditProjectRoles={canAdministerAccessLevels(prototypeUserId)}
                  onUpdateProjectRole={(membershipId, projectRole) => {
                    if (!canAdministerAccessLevels(prototypeUserId)) return;
                    setProjectMembershipsState((prev) =>
                      prev.map((membership) => {
                        if (membership.id !== membershipId) return membership;
                        if (membership.projectRole === "Project Owner") {
                          return membership;
                        }
                        if (projectRole === "Project Owner") return membership;
                        return { ...membership, projectRole };
                      }),
                    );
                    toast.success("Project role updated");
                  }}
                />
              );
            })()}
          </HomePageShell>
        ) : appView === "access-levels" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            <AccessLevelsPage
              accessLevels={accessLevelsState}
              onOpen={handleOpenAccessLevel}
              onCreate={handleCreateAccessLevel}
              onDelete={(id) => {
                if (!guardAccessLevelMutation()) return;
                setAccessLevelsState((prev) => prev.filter((level) => level.id !== id));
              }}
              onNavigateHome={handleNavigateHome}
              canAdminister={canAdministerAccessLevels(prototypeUserId)}
            />
          </HomePageShell>
        ) : appView === "data-sources" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            <DataSourcesPage
              dataSources={dataSourcesState}
              accessLevels={accessLevelsState}
              currentUserId={prototypeUserId}
              constellationConnections={allConstellations.map((item) => {
                const record = constellationSettingsById[item.id]
                  ?? getConstellationSettingsRecord(item.id);
                return {
                  id: item.id,
                  dataSourceIds: record?.connectedSources.map((source) => source.id)
                    ?? getCanonicalConstellationById(item.id)?.dataSourceIds
                    ?? [],
                };
              })}
              constellationHandoff={dataSourceConstellationHandoff}
              onOpenSource={handleOpenDataSourceSettings}
              onSaveSource={(nextSource) => {
                setDataSourcesState((prev) =>
                  prev.map((item) => (item.id === nextSource.id ? nextSource : item)),
                );
              }}
              onCreateConstellationFromSource={handleRequestCreateConstellationFromSource}
              onAddToExistingConstellation={handleRequestConnectConstellationFromSource}
              onNavigateHome={handleNavigateHome}
              onNewDataSource={() => setDataSourceCreationOpen(true)}
            />
          </HomePageShell>
        ) : appView === "admin-pipelines"
          && canAdministerAccessLevels(prototypeUserId) ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            <AdminPipelinesPage onNavigateHome={handleNavigateHome} />
          </HomePageShell>
        ) : appView === "access-level" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {editingAccessLevel ? (
              <AccessLevelEditorPage
                record={editingAccessLevel}
                otherLevels={accessLevelsState.filter((level) => level.id !== editingAccessLevel.id)}
                dataSources={dataSourcesState}
                organizationUsers={organizationUsersState}
                canAdminister={canAdministerAccessLevels(prototypeUserId)}
                onSave={(record) => {
                  if (!guardAccessLevelMutation()) return;
                  const wasNew = Boolean(editingAccessLevel?.isNew);
                  setAccessLevelsState((prev) => {
                    const index = prev.findIndex((level) => level.id === record.id);
                    const saved = cloneAccessLevel({ ...record, isNew: undefined });
                    if (index >= 0) {
                      const next = [...prev];
                      next[index] = saved;
                      return next;
                    }
                    return [...prev, saved];
                  });
                  if (wasNew) {
                    toast.success("Access Level created");
                  }
                  handleOpenAccessLevel(record.id);
                }}
                onCancel={handleOpenAccessLevels}
                onDelete={(id) => {
                  if (!guardAccessLevelMutation()) return;
                  setAccessLevelsState((prev) => prev.filter((level) => level.id !== id));
                  handleOpenAccessLevels();
                }}
                onNavigateHome={handleNavigateHome}
                onOpenAccessLevels={handleOpenAccessLevels}
                onOpenDataSourceSettings={handleOpenDataSourceSettings}
                onOpenConstellationSettings={(projectId, constellationId) => {
                  handleOpenConstellationSettings(projectId, constellationId, "access");
                }}
                onOpenProject={handleOpenProjectFromHome}
                projectNames={projectNamesById}
              />
            ) : (
              <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 py-16">
                <p className="luxia-type-overline-data" style={{ color: "var(--luxia-purple-60)" }}>
                  Access Levels
                </p>
                <h1 className="luxia-type-title-page" style={{ color: "var(--luxia-purple-70)" }}>
                  Unavailable
                </h1>
                <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                  This Access Level is not available in the current workspace.
                </p>
                <Button type="button" variant="outline" size="compact" onClick={handleOpenAccessLevels}>
                  Back to Access Levels
                </Button>
              </div>
            )}
          </HomePageShell>
        ) : appView === "data-source-settings" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            <DataSourceSettingsPage
              source={dataSourceForSettings}
              accessLevels={accessLevelsState}
              dataSources={dataSourcesState}
              projects={homeProjects}
              constellations={allConstellations}
              constellationConnections={allConstellations.map((item) => {
                const record = constellationSettingsById[item.id]
                  ?? getConstellationSettingsRecord(item.id);
                return {
                  id: item.id,
                  label: item.label,
                  projectId: item.projectId,
                  dataSourceIds: record?.connectedSources.map((source) => source.id)
                    ?? getCanonicalConstellationById(item.id)?.dataSourceIds
                    ?? [],
                };
              })}
              memberships={projectMembershipsState}
              currentUserId={prototypeUserId}
              focusSection={dataSourceSettingsFocus}
              canAccess={canAccessDataSourceSettings}
              onNavigateHome={handleNavigateHome}
              onOpenDataSources={handleOpenDataSources}
              onOpenAccessLevels={handleOpenAccessLevels}
              onOpenAccessLevel={handleOpenAccessLevel}
              onOpenProject={handleOpenProjectFromHome}
              onOpenConstellationSettings={(projectId, constellationId) => {
                handleOpenConstellationSettings(projectId, constellationId, "access");
              }}
              onSaveSource={(nextSource) => {
                setDataSourcesState((prev) =>
                  prev.map((item) => (item.id === nextSource.id ? nextSource : item)),
                );
              }}
              onBack={handleOpenDataSources}
            />
          </HomePageShell>
        ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <PageHeader
            chatLabel={activeData?.label ?? "Chat 1"}
            chat={activeData ?? INITIAL_CHATS[0]}
            projectName={getProjectNameById(activeData?.projectId, homeProjects)}
            constellationId={
              activeData?.chatType === "constellation"
                && activeData.constellationId
                && resolvedConstellation
                && activeData.constellationId === resolvedConstellation.id
                ? resolvedConstellation.id
                : undefined
            }
            constellationLabel={
              activeData?.chatType === "constellation"
                ? (
                  resolvedConstellation
                    && activeData.constellationId === resolvedConstellation.id
                    ? resolvedConstellation.label
                    : "Constellation"
                )
                : undefined
            }
            onNavigateHome={handleNavigateHome}
            onOpenProject={handleOpenProjectFromHome}
            onOpenConstellation={handleOpenConstellationFromProject}
            onRenameChat={(name) => setChats((p) => p.map((c) => c.id === activeChat ? { ...c, label: name } : c))}
            onDeleteChat={handleCloseChat.bind(null, activeChat)}
            onOpenGalaxySettings={
              activeData?.chatType === "galaxy" && activeData.projectId
                ? () => handleOpenGalaxySettingsFromOverview(activeData.projectId)
                : undefined
            }
            onOpenConstellationSettings={
              activeData?.chatType === "constellation"
                && activeData.projectId
                && activeData.constellationId
                ? () => handleOpenConstellationSettings(
                  activeData.projectId,
                  activeData.constellationId!,
                )
                : undefined
            }
            tabs={(
              <ChatTabBar
                chats={workingAccessibleChats} activeId={activeChat}
                onSelect={handleSelectChat} onNew={handleNewChat}
                onClose={handleCloseChat}
                onPin={handleChatPin}
                onRename={(id, label) => setChats(p => p.map(c => c.id === id ? { ...c, label } : c))}
                projects={homeProjects}
                constellations={allConstellations}
              />
            )}
          />

          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
            <div
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
              style={{ minWidth: 0 }}
            >
            <div
              className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical luxia-scrollbar-messages pt-6 pb-5"
              style={{ paddingInline: LUXIA_PAGE_INTRO.padInline }}
            >
              {messages.length === 0
                ? (activeData?.chatType === "galaxy"
                  ? (
                    <GalaxyEmptyState
                      projectName={getProjectNameById(activeData.projectId, homeProjects)}
                      onPrompt={handleSend}
                    />
                  )
                  : <EmptyState onPrompt={handleSend} />)
                : <>
                  <DateSeparator label="Today" />
                  {messages.map(msg =>
                    msg.role === "user"
                      ? <UserBubble key={msg.id} message={msg} />
                      : <AICard
                          key={msg.id}
                          message={msg}
                          constellationId={
                            activeData?.chatType === "constellation"
                              ? activeData.constellationId
                              : msg.galaxy?.matched.id
                          }
                          onOpenGalaxyConstellation={
                            activeData?.chatType === "galaxy" ? handleOpenGalaxyConstellation : undefined
                          }
                          onViewGalaxyActivity={
                            activeData?.chatType === "galaxy" ? handleViewGalaxyActivity : undefined
                          }
                        />
                  )}
                  <div ref={messagesEndRef} className="h-2 flex-shrink-0" aria-hidden="true" />
                </>}
            </div>
            <PromptComposer value={inputValue} onChange={setInputValue} onSend={() => handleSend()}
              language={language} onLanguageChange={setLanguage}
              constellationType={activeConstellation.type}
              assistantMode={assistantMode} onModeChange={setAssistantMode}
              chatType={activeData?.chatType ?? "constellation"}
              focusKey={activeData?.chatType === "galaxy" ? activeChat : undefined}
              galaxyRoute={activeGalaxySession ? {
                routeMode: activeGalaxySession.routeMode,
                pendingManual,
                options: galaxyRouteOptions,
                onSelectAuto: () => {
                  updateGalaxySession(activeChat, {
                    routeMode: "auto",
                    pendingManualId: null,
                  });
                  if (activeData?.projectId) {
                    const current = resolveGalaxySettingsRecord(activeData.projectId);
                    if (current) {
                      setGalaxySettingsById((prev) => ({
                        ...prev,
                        [activeChat]: {
                          ...current,
                          routeMode: "auto",
                          updatedAt: "Just now",
                        },
                      }));
                    }
                  }
                },
                onSelectManual: (option) => {
                  updateGalaxySession(activeChat, {
                    routeMode: "manual",
                    pendingManualId: option.id,
                  });
                  if (activeData?.projectId) {
                    const current = resolveGalaxySettingsRecord(activeData.projectId);
                    if (current) {
                      setGalaxySettingsById((prev) => ({
                        ...prev,
                        [activeChat]: {
                          ...current,
                          routeMode: "manual",
                          updatedAt: "Just now",
                        },
                      }));
                    }
                  }
                },
                onClearManual: () => updateGalaxySession(activeChat, {
                  routeMode: "manual",
                  pendingManualId: null,
                }),
              } : undefined}
            />
            </div>

          {activeData?.chatType === "galaxy" && activeGalaxySession ? (
            <div
              className="flex h-full min-h-0 flex-shrink-0 flex-col self-stretch overflow-hidden"
              style={{
                width: renderedGalaxyOuterWidth,
                transition: "width 220ms ease-out",
              }}
              data-galaxy-shell="true"
            >
              {renderedGalaxyCollapsed ? (
                <GalaxyCollapsedRail
                  status={activeGalaxySession.status}
                  onExpand={() => expandGalaxyIntelligencePanel({ force: true })}
                />
              ) : (
                <GalaxyActivityPanel
                  key={activeData.id}
                  session={activeGalaxySession}
                  width={clampedGalaxyWidth}
                  routeOptions={galaxyRouteOptions}
                  pendingManual={pendingManual}
                  instructionValue={galaxyInstructionById[activeChat]}
                  onSaveInstruction={
                    activeData.projectId
                    && canEditGalaxySettings(projectRoleFor(activeData.projectId))
                      ? (instruction) => {
                          handleSaveGalaxyInstruction(activeData.projectId, instruction);
                        }
                      : undefined
                  }
                  onResizeStart={handleGalaxyResizeStart}
                  onOpenConstellation={handleOpenGalaxyConstellation}
                  onCollapse={collapseGalaxyIntelligencePanel}
                  contentOpacity={galaxyPanelContentOpaque ? 1 : 0}
                  onSelectAuto={() => {
                    updateGalaxySession(activeChat, {
                      routeMode: "auto",
                      pendingManualId: null,
                    });
                    if (activeData.projectId) {
                      const current = resolveGalaxySettingsRecord(activeData.projectId);
                      if (current) {
                        setGalaxySettingsById((prev) => ({
                          ...prev,
                          [activeChat]: {
                            ...current,
                            routeMode: "auto",
                            updatedAt: "Just now",
                          },
                        }));
                      }
                    }
                  }}
                  onEnterSpecific={() => updateGalaxySession(activeChat, {
                    routeMode: "manual",
                  })}
                  onSelectManual={(option) => {
                    updateGalaxySession(activeChat, {
                      routeMode: "manual",
                      pendingManualId: option.id,
                    });
                    if (activeData.projectId) {
                      const current = resolveGalaxySettingsRecord(activeData.projectId);
                      if (current) {
                        setGalaxySettingsById((prev) => ({
                          ...prev,
                          [activeChat]: {
                            ...current,
                            routeMode: "manual",
                            updatedAt: "Just now",
                          },
                        }));
                      }
                    }
                  }}
                  onClearManual={() => updateGalaxySession(activeChat, {
                    routeMode: "manual",
                    pendingManualId: null,
                  })}
                />
              )}
            </div>
          ) : (
            <ConstellationSidebar
              key={`${activeData?.id ?? "chat"}-${activeConstellation.id}`}
              width={clampedInspectorWidth}
              onResizeStart={handleSidebarResizeStart}
              collapsed={sidebarCollapsed}
              onCollapse={handleInspectorCollapseToggle}
              constellation={activeConstellation}
              allConstellations={allConstellations.filter((item) =>
                workingAccessibleOverviewConstellations.some((entry) => entry.id === item.id)
                || item.id === activeConstellation.id,
              )}
              onConstellationChange={handleConstellationChange}
              onOpenConstellationSettings={(projectId, constellationId) =>
                handleOpenConstellationSettings(projectId, constellationId, "general")
              }
              projectId={activeData?.projectId ?? homeProjects[0]?.id ?? "project-01"}
              allowConstellationChange={activeData?.chatType === "constellation"}
              isGalaxyChat={false}
              canConfigure={canAdministerProjectConfiguration(
                prototypeUserId,
                prototypeProjectRole,
              )}
              canEditKnowledge={canEditConstellationKnowledge(prototypeProjectRole)}
              knowledgeBase={
                resolveCapabilityBundle(activeConstellation.id).knowledgeBase
              }
              onCommitKnowledgeBase={(next) =>
                handleCommitChatKnowledgeBase(activeConstellation.id, next)
              }
              views={resolveCapabilityBundle(activeConstellation.id).views}
              onCommitViews={(next) =>
                handleCommitChatViews(activeConstellation.id, next)
              }
              tables={resolveCapabilityBundle(activeConstellation.id).tables}
              onCommitTables={(next) =>
                handleCommitChatTables(activeConstellation.id, next)
              }
              contextFiles={
                resolveCapabilityBundle(activeConstellation.id).contextFiles
              }
              onCommitContextFiles={(next) =>
                handleCommitChatContextFiles(activeConstellation.id, next)
              }
              relationships={
                resolveCapabilityBundle(activeConstellation.id).relationships
              }
              onCommitRelationships={(next) =>
                handleCommitChatRelationships(activeConstellation.id, next)
              }
              metrics={resolveCapabilityBundle(activeConstellation.id).metrics}
              onCommitMetrics={(next) =>
                handleCommitChatMetrics(activeConstellation.id, next)
              }
              pdfFiles={resolveCapabilityBundle(activeConstellation.id).pdfFiles}
              onCommitPdfFiles={(next) =>
                handleCommitChatPdfFiles(activeConstellation.id, next)
              }
              crawler={resolveCapabilityBundle(activeConstellation.id).crawler}
              onCommitCrawler={(next) =>
                handleCommitChatCrawler(activeConstellation.id, next)
              }
            />
          )}
          </div>
        </div>
        )}
      </div>

      {showNewChatModal && (
        <NewChatModal
          onCreate={handleNewChatCreate}
          onClose={() => {
            setShowNewChatModal(false);
            setNewChatLockedProjectId(null);
          }}
          lockedProjectId={newChatLockedProjectId}
          constellations={allConstellations.filter((item) =>
            workingAccessibleOverviewConstellations.some((entry) => entry.id === item.id),
          )}
          projects={homeProjectsAsSelectOptions(accessibleHomeProjects)}
        />
      )}
      {showNewProjectModal && (
        <NewProjectModal
          open={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          onCreate={handleCreateProject}
        />
      )}
      <AlertDialog
        open={Boolean(constellationAccessBlock)}
        onOpenChange={(open) => !open && setConstellationAccessBlock(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Constellation unavailable</AlertDialogTitle>
            <AlertDialogDescription>
              {constellationAccessBlock?.reason
                ?? "You need Use access to every connected Data Source before you can use this Constellation."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {constellationAccessBlock ? (
              <AlertDialogAction
                onClick={() => {
                  const { projectId, constellationId } = constellationAccessBlock;
                  setConstellationAccessBlock(null);
                  // Access tab explains membership; it is not a Request Access workflow.
                  handleOpenConstellationSettings(projectId, constellationId, "access");
                }}
              >
                View access details
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(galaxyAccessBlock)}
        onOpenChange={(open) => !open && setGalaxyAccessBlock(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              No accessible Constellations are currently available in this Project.
            </AlertDialogTitle>
            <AlertDialogDescription>
              {galaxyAccessBlock?.reason
                ?? "You need Use access to every connected Data Source before Galaxy can use a Constellation."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {galaxyAccessBlock ? (
              <AlertDialogAction
                onClick={() => {
                  const { projectId } = galaxyAccessBlock;
                  setGalaxyAccessBlock(null);
                  const projectConstellations = getProjectConstellations(
                    projectId,
                    allConstellations,
                  );
                  const first = projectConstellations[0];
                  if (first) {
                    handleOpenConstellationSettings(projectId, first.id, "access");
                    return;
                  }
                  handleOpenProjectMembers(projectId);
                }}
              >
                View access details
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <NewDataSourceFlow
        open={dataSourceCreationOpen}
        currentUserId={prototypeUserId}
        allowOrganizational={canCreateOrganizationalDataSource(prototypeUserId)}
        existingSources={dataSourcesState}
        returnContext={{ kind: "library" }}
        onOpenChange={setDataSourceCreationOpen}
        onCreated={(source, _returnContext, options) => {
          setDataSourcesState((prev) => {
            if (prev.some((item) => item.id === source.id)) return prev;
            return [...prev, source];
          });
          if (!options?.openSettings) {
            toast.success(`Created ${source.name}`);
          }
          if (options?.openSettings) {
            // Pass the just-created row so access check does not race setState.
            handleOpenDataSourceSettings(source.id, { createdSource: source });
            return;
          }
          if (appView !== "data-sources") {
            handleOpenDataSources();
          }
        }}
        eligibleProjects={dataSourceConstellationHandoff.projects}
        onCreateConstellationFromSource={handleRequestCreateConstellationFromSource}
      />
      <CreateConstellationFromDataSourceDialog
        open={dataSourceHandoff?.kind === "create"}
        sourceName={dataSourceHandoffSource?.name ?? "this Data Source"}
        projects={dataSourceConstellationHandoff.projects}
        onOpenChange={(open) => {
          if (!open) setDataSourceHandoff(null);
        }}
        onConfirm={(projectId) => {
          if (!dataSourceHandoff) return;
          const sourceId = dataSourceHandoff.sourceId;
          setDataSourceHandoff(null);
          handleOpenConstellationCreate(projectId, { existingDataSourceId: sourceId });
        }}
      />
      <ConnectDataSourceToConstellationDialog
        open={dataSourceHandoff?.kind === "connect"}
        sourceId={dataSourceHandoff?.sourceId ?? ""}
        sourceName={dataSourceHandoffSource?.name ?? "this Data Source"}
        constellations={dataSourceConstellationHandoff.constellations}
        onOpenChange={(open) => {
          if (!open) setDataSourceHandoff(null);
        }}
        onConfirm={(constellationId) => {
          if (!dataSourceHandoff) return;
          handleAddConstellationDataSource(constellationId, dataSourceHandoff.sourceId);
          setDataSourceHandoff(null);
        }}
      />
      <InviteOrganizationUserDialog
        open={inviteOrganizationUserOpen}
        onOpenChange={setInviteOrganizationUserOpen}
        projects={homeProjects.map((project) => ({
          id: project.id,
          name: project.name,
        }))}
        accessLevels={accessLevelsState}
        existingEmails={organizationUsersState.map((user) => user.email)}
        onInvite={handleInviteOrganizationUser}
      />
      <CreateVidgetDialog
        open={createVidgetOpen}
        onOpenChange={setCreateVidgetOpen}
        projectName={
          createVidgetProjectId
            ? getProjectNameById(createVidgetProjectId, homeProjects)
            : ""
        }
        galaxyId={(() => {
          if (!createVidgetProjectId) return null;
          const project = homeProjects.find((entry) => entry.id === createVidgetProjectId);
          if (project?.galaxyId) return project.galaxyId;
          return findGalaxyChatForProject(
            createVidgetProjectId,
            chats,
            homeProjects,
          )?.id ?? null;
        })()}
        galaxyName={(() => {
          if (!createVidgetProjectId) return "";
          const galaxyChat = findGalaxyChatForProject(
            createVidgetProjectId,
            chats,
            homeProjects,
          );
          if (galaxyChat) return galaxyNameById[galaxyChat.id] ?? galaxyChat.label;
          return getProjectNameById(createVidgetProjectId, homeProjects);
        })()}
        constellations={
          createVidgetProjectId
            ? allConstellations
              .filter((item) => item.projectId === createVidgetProjectId)
              .map((item) => ({
                id: item.id,
                name: item.label,
                type: item.type,
                description: item.description,
              }))
            : []
        }
        sourcePreset={createVidgetPreset}
        onCreate={handleCreateVidgetSubmit}
      />
      <Toaster richColors closeButton position="top-right" />
      <ProjectAssistantHost
        projectId={contextProjectId}
        projectName={contextProjectLabel ?? "Project"}
        constellations={projectAssistantConstellations}
        visible={showProjectContext}
        open={projectAssistantOpen}
        onOpenChange={setProjectAssistantOpen}
        messages={projectAssistantMessages}
        onMessagesChange={(next) => {
          if (!contextProjectId) return;
          setProjectAssistantSessions((prev) => ({
            ...prev,
            [contextProjectId]: next,
          }));
        }}
      />
      <ProjectManageDialogs
        mode={projectManageMode}
        project={
          projectManageId
            ? homeProjects.find((project) => project.id === projectManageId) ?? null
            : null
        }
        onClose={closeProjectManageDialogs}
        onEditDetails={handleEditProjectDetails}
        onArchive={handleArchiveProject}
        onDelete={handleDeleteProject}
      />
      {prototypeUser ? (
        <LuxiaSettingsDialog
          open={accountSettingsOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseAccountSettings();
            else setAccountSettingsOpen(true);
          }}
          user={prototypeUser}
          activeSection={accountSettingsSection}
          onSectionChange={handleAccountSettingsSectionChange}
          canViewOrganizationAnalytics={canViewOrganizationAnalytics(prototypeUserId)}
          privateDataSourceCount={privateDataSourceCountForUser}
          memberSummary={organizationMemberSummary}
          accessLevelCount={accessLevelsState.length}
          organizationalDataSourceCount={organizationalDataSourceCount}
          usageMetrics={organizationUsageMetrics}
          directoryUsers={organizationUsersState}
          vidgets={vidgetsState}
          onOpenDataSources={handleSettingsOpenDataSources}
          onOpenUsers={handleSettingsOpenUsers}
          onOpenAccessLevels={handleSettingsOpenAccessLevels}
          onUpdateProfile={handleUpdateProfile}
          onUpdateProfileMfa={handleUpdateProfileMfa}
        />
      ) : null}
    </div>
  );
}
