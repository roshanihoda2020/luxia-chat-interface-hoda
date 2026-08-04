import { useState, useRef, useEffect, useCallback, useMemo, type ReactElement, type MouseEvent as ReactMouseEvent } from "react";
import ReactDOM from "react-dom";
import luxiaWordmarkUrl from "@/assets/brand/Luxia-Star.svg";
import sidebarStarLogoUrl from "@/assets/brand/Star.svg";
import flagUs from "@/assets/flags/us.svg";
import flagIt from "@/assets/flags/it.svg";
import flagSa from "@/assets/flags/sa.svg";
import flagFr from "@/assets/flags/fr.svg";
import flagDe from "@/assets/flags/de.svg";
import flagEs from "@/assets/flags/es.svg";
import flagCn from "@/assets/flags/cn.svg";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import { ActiveDataTablesSection } from "@/app/features/active-data-tables/ActiveDataTablesSection";
import { ExtraContextFilesSection } from "@/app/features/extra-context-files/ExtraContextFilesSection";
import { InstructionSection } from "@/app/features/instruction/InstructionSection";
import { KBEntryMenu } from "@/app/features/kb/KBEntryMenu";
import { MetricsSection } from "@/app/features/metrics/MetricsSection";
import { PDFFilesSection } from "@/app/features/pdf-files/PDFFilesSection";
import { CrawlerSection } from "@/app/features/crawler/CrawlerSection";
import { RelationshipSection } from "@/app/features/relationship/RelationshipSection";
import {
  GalaxyActivityPanel,
  GalaxyCollapsedRail,
  GalaxyEmptyState,
  GalaxyProvenanceRow,
  GalaxyRouteSelector,
  GALAXY_COLLAPSED_WIDTH,
  GALAXY_MOCK_ANSWER,
  GALAXY_MOCK_CANDIDATES,
  GALAXY_MOCK_CONSTELLATIONS_CHECKED,
  GALAXY_MOCK_MATCHED,
  GALAXY_MOCK_SOURCES,
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
  getDashboardPath,
  getChatPath,
  getConstellationChatPath,
  getConstellationsPath,
  getConstellationSettingsPath,
  getConstellationSettingsCapabilityPath,
  getProjectMembersPath,
  getAccessLevelsPath,
  getAccessLevelPath,
  getDataSourceSettingsPath,
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
import { getProjectNameById, ProjectManageDialogs, deriveProjectEntityCounts } from "@/app/features/project";
import type { ProjectManageMode, ProjectConstellationSourceEntry } from "@/app/features/project";
import {
  ConstellationSettingsPage,
  ConstellationCapabilityManagePage,
  NewConstellationModal,
  AVAILABLE_SOURCES_CATALOG,
  CONSTELLATION_SETTINGS_RECORDS,
  buildSettingsForConstellation,
  cloneConstellationSettingsRecord,
  getConstellationSettingsRecord,
  createSeedCapabilityBundle,
  cloneCapabilityBundle,
  summarizeCapabilityBundle,
  type ConstellationSettingsRecord,
  type ConstellationSettingsDraft,
  type ConstellationSettingsSectionId,
  type ConnectedDataSource,
  type ConstellationCapabilityBundle,
  type NewConstellationDraft,
  constellationSettingsSectionToTab,
  parseConstellationSettingsTabFromSearch,
} from "@/app/features/constellation-settings";
import {
  CAPSULE_CAPABILITY_ICON,
  CAPSULE_CAPABILITY_PATH,
  capabilityIdFromPath,
  isCapsuleCapabilityAllowed,
  CANONICAL_CONSTELLATIONS,
  getCanonicalConstellationById,
  getConstellationSourceCount,
  type CapsuleCapabilityId,
} from "@/app/features/constellation";
import {
  AccessLevelsPage,
  AccessLevelEditorPage,
  ProjectMembersPage,
  DataSourceSettingsPage,
  ACCESS_LEVELS,
  PROJECT_MEMBERSHIPS,
  ORGANIZATION_USERS,
  DATA_SOURCE_CATALOG,
  buildEmptyAccessLevel,
  cloneAccessLevel,
  getDataSourceById,
} from "@/app/features/permissions";
import {
  ProjectOverviewPage,
  ProjectDashboardPage,
  ConstellationsLibrary,
  CONSTELLATION_SOURCE_COUNTS,
  type ProjectNavSection,
  type ProjectOverviewBrowseMode,
  type ProjectOverviewChat,
  type ProjectOverviewConstellation,
} from "@/app/features/project-overview";
import {
  LuxiaBreadcrumb,
  buildChatBreadcrumbItems,
  buildGalaxyBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageHeader, LuxiaPageHeaderShell, LUXIA_PAGE_INTRO, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { LX } from "@/app/features/active-data-tables/tokens";
import { IC, IC_BTN_ICON, IC_BTN_OPEN, IC_CARD_HEADER, IC_INPUT_TEXT, IC_SEARCH_SHELL, IC_SEARCH_SHELL_STYLE, icCardStyle, icHoverOff, icHoverOn, icInspectorAccentStyle, icInspectorDescriptionColor, icInspectorTitleColor, icOpenActiveOn, icSearchShellBlur, icSearchShellFocus, icSearchShellHoverOff, icSearchShellHoverOn, icTextareaStyle } from "@/app/features/active-data-tables/inspectorTheme";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  ChevronDown, ChevronRight, ChevronLeft,
  Plus, X, Pin, Copy, Bookmark, SquareArrowOutUpRight,
  FileText, Database, BookOpen,
  Send, Mic, Eye, Upload, GripVertical,
  Trash2, Check, Edit3, BarChart3, Table2,
  RefreshCw, Search, MoreHorizontal,
  AlignLeft, Layers, Share2, List, FileBarChart2,
  type LucideIcon,
} from "lucide-react";
import {
  LuxiaAiIcon,
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaDatasourceIcon,
  LuxiaGalaxyIcon,
  LuxiaHomeIcon,
  LuxiaNotificationsIcon,
  LuxiaProjectsIcon,
  LuxiaSettingsIcon,
  LuxiaSupportIcon,
  LuxiaToolsGalleryIcon,
  LuxiaUserPermissionsIcon,
  LuxiaVirtualAssistantIcon,
  type LuxiaIconProps,
} from "@/assets/icons";

const CONSTELLATION_STYLE: Record<string, {
  color: string; bg: string; activeBg: string;
  border: string; activeBorder: string;
}> = {
  database: {
    color: "#7652C4",
    bg: "rgba(118,82,196,0.05)",
    activeBg: "rgba(118,82,196,0.10)",
    border: "rgba(118,82,196,0.18)",
    activeBorder: "rgba(118,82,196,0.35)",
  },
  pdf: {
    color: "#2B8DC4",
    bg: "rgba(43,141,196,0.05)",
    activeBg: "rgba(43,141,196,0.10)",
    border: "rgba(43,141,196,0.18)",
    activeBorder: "rgba(43,141,196,0.35)",
  },
  csv: {
    color: "#2B8DC4",
    bg: "rgba(43,141,196,0.05)",
    activeBg: "rgba(43,141,196,0.10)",
    border: "rgba(43,141,196,0.18)",
    activeBorder: "rgba(43,141,196,0.35)",
  },
};

const LANGUAGES = [
  { code: "EN", flagUrl: flagUs, label: "English",  sublabel: "United States" },
  { code: "IT", flagUrl: flagIt, label: "Italiano", sublabel: "Italia" },
  { code: "AR", flagUrl: flagSa, label: "Arabic",   sublabel: "Saudi Arabia" },
  { code: "FR", flagUrl: flagFr, label: "French",   sublabel: "France" },
  { code: "DE", flagUrl: flagDe, label: "German",   sublabel: "Deutschland" },
  { code: "ES", flagUrl: flagEs, label: "Spanish",  sublabel: "España" },
  { code: "ZH", flagUrl: flagCn, label: "Chinese",  sublabel: "中国" },
];

function FlagCircle({ flagUrl, label, size = 24 }: { flagUrl: string; label: string; size?: number }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size, borderRadius: "50%",
      overflow: "hidden", flexShrink: 0,
      border: "1px solid rgba(0,0,0,0.10)",
      background: "#f0f0f0",
    }}>
      <img src={flagUrl} alt="" aria-hidden="true"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
    </span>
  );
}

type SectionId = "kb" | "dataTable" | "contextFiles" | "relationship" | "metrics" | "instr" | "pdfFiles" | "crawler";
type ConstellationType = "database" | "csv" | "pdf";

type SectionIcon = LucideIcon;

const SECTION_META: Record<SectionId, { label: string; icon: SectionIcon }> = {
  kb: { label: "Knowledge Base", icon: CAPSULE_CAPABILITY_ICON.kb },
  dataTable: { label: "Active Data Tables", icon: CAPSULE_CAPABILITY_ICON.dataTable },
  contextFiles: { label: "Extra Context Files", icon: CAPSULE_CAPABILITY_ICON.contextFiles },
  relationship: { label: "Relationship", icon: CAPSULE_CAPABILITY_ICON.relationship },
  metrics: { label: "Metrics", icon: CAPSULE_CAPABILITY_ICON.metrics },
  instr: { label: "Instruction", icon: CAPSULE_CAPABILITY_ICON.instr },
  pdfFiles: { label: "PDF Files", icon: CAPSULE_CAPABILITY_ICON.pdfFiles },
  crawler: { label: "Crawler URLs", icon: CAPSULE_CAPABILITY_ICON.crawler },
};

const FILE_BASED_SECTIONS: SectionId[] = ["pdfFiles", "kb", "instr", "crawler"];

const CONSTELLATION_SECTIONS: Record<ConstellationType, SectionId[]> = {
  database: ["dataTable", "kb", "instr", "contextFiles", "relationship", "metrics"],
  pdf: FILE_BASED_SECTIONS,
  csv: FILE_BASED_SECTIONS,
};

const SECTION_DEFAULTS: Partial<Record<SectionId, string[]>> = {
  kb: [],
  dataTable: ["Table 1", "Table 2"],
  contextFiles: ["Context File A", "Context File B"],
  relationship: ["Relation 1"],
  metrics: ["Metric 1", "Metric 2"],
  pdfFiles: ["Report A.pdf", "Guide B.pdf"],
  crawler: ["https://site-1.example", "https://site-2.example"],
};

const SECTION_INSTRUCTION: Record<ConstellationType, string> = {
  database: "Answer based on the connected data sources and documents.",
  pdf: "Extract and summarise information from the connected PDF files.",
  csv: "Answer based on the connected CSV tabular data.",
};

interface KBEntry { id: string; question: string; answer: string; responseType?: string; }

const KB_RESPONSE_TYPES = [
  { id: "narrative", label: "Narrative" },
  { id: "table", label: "Table" },
  { id: "chart", label: "Chart" },
  { id: "kpi", label: "KPI" },
  { id: "list", label: "List" },
];

const KB_DEFAULTS: KBEntry[] = [
  {
    id: "kb1", responseType: "narrative", question: "What is Luxia?",
    answer: "Luxia is an enterprise AI platform that connects your data, documents, and knowledge into intelligent conversational experiences through AI-powered Constellations."
  },
  {
    id: "kb2", responseType: "list", question: "How do I create a Constellation?",
    answer: "Navigate to Constellations in the sidebar, click Create New, choose your data sources (databases, PDFs, or web crawlers), configure your settings, and save. It becomes available in Chat immediately."
  },
  {
    id: "kb3", responseType: "narrative", question: "How does the Relationship feature work?",
    answer: "Relationship maps entity connections in your data using graph logic. It traverses linked records to surface related information, improving accuracy for complex multi-entity queries."
  },
  {
    id: "kb4", responseType: "list", question: "Which documents belong to this Constellation?",
    answer: "Connected documents appear in the Extra Context Files and Active Data Table sidebar sections. Each section shows the resources Luxia searches when generating responses for this Constellation."
  },
  {
    id: "kb5", responseType: "table", question: "What response types are available?",
    answer: "Luxia supports five response types: Narrative (natural language), Table (structured grid), Chart (visual graph), KPI (key metric), and List (bullet summary). Each Knowledge Entry can have a default type."
  },
];

const KB_AUTO_SAMPLES: KBEntry[] = [
  {
    id: "s1", responseType: "narrative", question: "How is data refreshed in real time?",
    answer: "Data refreshes automatically when connected sources are updated. You can also trigger a manual refresh from the Datasources panel in the left navigation."
  },
  {
    id: "s2", responseType: "list", question: "What file formats can I upload?",
    answer: "Supported formats include PDF, DOCX, XLSX, CSV, and TXT. Files are indexed automatically after upload and become searchable within seconds."
  },
  {
    id: "s3", responseType: "narrative", question: "How do I share a Constellation with my team?",
    answer: "Open the Constellation settings, go to the Permissions tab, and add team members by email. You can set View or Edit access per person."
  },
  {
    id: "s4", responseType: "list", question: "Can I export chat conversations?",
    answer: "Yes. Open any Chat, click the ⋯ menu in the header, and select Export. You can export as PDF, Markdown, or plain text."
  },
  {
    id: "s5", responseType: "kpi", question: "What is the maximum number of data sources per Constellation?",
    answer: "Enterprise plans support up to 50 connected data sources per Constellation. The Standard plan allows up to 10 sources."
  },
  {
    id: "s6", responseType: "narrative", question: "Does Luxia support Arabic language responses?",
    answer: "Yes. Luxia supports responses in Arabic, English, French, German, Spanish, and Chinese. The language can be set per-session using the Language selector in the Chat composer."
  },
  {
    id: "s7", responseType: "table", question: "How does the Metrics section work?",
    answer: "Metrics connect to your KPI definitions and aggregate numeric data from your active data sources. They update dynamically as the underlying data changes."
  },
  {
    id: "s8", responseType: "narrative", question: "What happens if a data source is disconnected?",
    answer: "If a data source disconnects, Luxia will continue using cached data up to the last successful sync. A warning badge appears in the sidebar indicating the disconnected source."
  },
  {
    id: "s9", responseType: "list", question: "Can I use multiple Constellations in one Chat session?",
    answer: "Each Chat is connected to one Constellation at a time. To switch contexts, create a new Chat and select a different Constellation from the selector."
  },
  {
    id: "s10", responseType: "narrative", question: "How is the Knowledge Base different from documents?",
    answer: "The Knowledge Base contains hand-curated question-answer pairs that provide precise, structured answers. Documents are raw files that Luxia searches through semantic retrieval. The KB takes priority in responses when a matching entry is found."
  },
];

interface Source { id: string; label: string; }
type ResponseInsights = {
  format: "bullets" | "paragraphs";
  items: string[];
};
interface Message {
  id: string; role: "user" | "ai"; content: string; timestamp: string;
  sources?: Source[]; insights?: ResponseInsights;
  galaxy?: GalaxyRoutingMeta;
}
interface Chat {
  id: string;
  label: string;
  chatType: ChatScope;
  projectId: string;
  constellationId?: string;
  pinned?: boolean;
}
interface Project {
  id: string;
  label: string;
}
interface Constellation {
  id: string;
  label: string;
  type: ConstellationType;
  projectId: string;
  description: string;
}

type ChatScope = "galaxy" | "constellation";
type NewChatPayload = {
  chatType: ChatScope;
  projectId: string;
  constellationId?: string;
};

function getConstellationSourceLabel(type: ConstellationType): "PDF" | "CSV" | "DB" {
  if (type === "pdf") return "PDF";
  if (type === "csv") return "CSV";
  return "DB";
}

function constellationBadgeVariant(type: ConstellationType): "database" | "csv" | "pdf" {
  if (type === "csv") return "csv";
  if (type === "pdf") return "pdf";
  return "database";
}

function ConstellationSourceBadge({
  type,
  className = "",
}: {
  type: ConstellationType;
  className?: string;
}) {
  return (
    <Badge
      variant={constellationBadgeVariant(type)}
      className={`min-h-0 h-[15px] px-1 py-0 luxia-type-badge ${className}`}
    >
      {getConstellationSourceLabel(type)}
    </Badge>
  );
}

function ConstellationNameWithSource({
  label,
  type,
  className = "",
  labelClassName = "",
  badgeClassName = "",
}: {
  label: string;
  type: ConstellationType;
  className?: string;
  labelClassName?: string;
  badgeClassName?: string;
}) {
  return (
    <span className={`inline-flex min-w-0 max-w-full items-center justify-start gap-1.5 text-left ${className}`} title={label}>
      <span className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left ${labelClassName}`}>{label}</span>
      <ConstellationSourceBadge type={type} className={`flex-shrink-0 ${badgeClassName}`} />
    </span>
  );
}

function getProjectConstellations(projectId: string, extra: Constellation[] = []) {
  return [...CONSTELLATIONS, ...extra].filter((c) => c.projectId === projectId);
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

const INSIGHTS_MIN_CONTENT_LENGTH = 220;

function normalizeInsightText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function shouldShowInsightsEligibleContent(content: string): boolean {
  const normalized = content.trim();
  if (!normalized) return false;

  const paragraphs = normalized.split(/\n\s*\n/).filter((paragraph) => paragraph.trim());
  const bulletLines = normalized.split("\n").filter((line) => line.trim().startsWith("- "));
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);

  return (
    normalized.length >= INSIGHTS_MIN_CONTENT_LENGTH ||
    paragraphs.length >= 3 ||
    bulletLines.length >= 2 ||
    sentences.length >= 5
  );
}

function insightsRepeatAnswer(content: string, items: string[]): boolean {
  const normalizedContent = normalizeInsightText(content);
  const redundant = items.filter((item) => {
    const normalizedItem = normalizeInsightText(item);
    if (!normalizedItem) return true;
    if (normalizedContent.includes(normalizedItem)) return true;
    const words = normalizedItem.split(" ").filter(Boolean);
    if (words.length < 4) return normalizedContent.includes(normalizedItem);
    return normalizedContent.includes(words.slice(0, 6).join(" "));
  });
  return redundant.length >= Math.ceil(items.length * 0.67);
}

function getResponseInsights(content: string, insights?: ResponseInsights): ResponseInsights | null {
  if (!insights?.items?.length) return null;
  const items = insights.items.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  if (items.length === 0) return null;
  if (!shouldShowInsightsEligibleContent(content)) return null;
  if (insightsRepeatAnswer(content, items)) return null;
  return { format: insights.format, items };
}

function ResponseInsightsContent({ insights }: { insights: ResponseInsights }) {
  if (insights.format === "paragraphs") {
    return (
      <div className="mt-3 space-y-2 pl-1 min-w-0">
        {insights.items.map((item, i) => (
          <p key={i} className="luxia-chat-text luxia-type-metadata" style={{ color: LX.textSecondary }}>
            {item}
          </p>
        ))}
      </div>
    );
  }

  return (
    <ul className="mt-3 space-y-1.5 pl-1 min-w-0">
      {insights.items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 luxia-type-metadata min-w-0" style={{ color: LX.textSecondary }}>
          <span
            className="mt-[6px] w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{ background: LX.accent }}
          />
          <span className="luxia-chat-text min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const PROJECTS: Project[] = HOME_PROJECTS.map((project) => ({
  id: project.id,
  label: project.name,
}));

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
  { id: "galaxy-01", label: "Galaxy name 01", chatType: "galaxy", projectId: "project-01" },
  { id: "galaxy-02", label: "Galaxy name 02", chatType: "galaxy", projectId: "project-02", pinned: true },
  { id: "galaxy-03", label: "Galaxy name 03", chatType: "galaxy", projectId: "project-03" },
  { id: "galaxy-04", label: "Galaxy name 04", chatType: "galaxy", projectId: "project-04" },
  { id: "galaxy-05", label: "Galaxy name 05", chatType: "galaxy", projectId: "project-05" },
  { id: "galaxy-06", label: "Galaxy name 06", chatType: "galaxy", projectId: "project-06" },
];

function makePrototypeMessages(chatId: string, chatLabel: string): Message[] {
  return [
    {
      id: `${chatId}-u1`,
      role: "user",
      timestamp: "10:14 AM",
      content: `Placeholder question for ${chatLabel}.`,
    },
    {
      id: `${chatId}-a1`,
      role: "ai",
      timestamp: "10:14 AM",
      content: `Placeholder response for ${chatLabel}. This message history belongs only to ${chatId}.`,
      sources: [{ id: `${chatId}-s1`, label: "Source A" }, { id: `${chatId}-s2`, label: "Source B" }],
    },
  ];
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
  | "constellation-settings"
  | "project-members"
  | "access-levels"
  | "access-level"
  | "data-source-settings";

function readInitialShellFromLocation(): {
  appView: LuxiaAppView;
  activeProjectId: string | null;
  activeChat: string;
  projectBrowseMode: ProjectOverviewBrowseMode;
  settingsConstellationId: string | null;
  settingsCapabilityPath: string | null;
  settingsSection: ConstellationSettingsSectionId;
  accessLevelId: string | null;
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
    dataSourceSettingsId: null as string | null,
  };

  if (typeof window === "undefined") {
    return defaults;
  }

  // Prototype rule: full page load / refresh / fresh session always start at Home.
  // In-session navigation (pushState / popstate) is unchanged and still resolves deep URLs.
  window.history.replaceState({ luxiaView: "home" }, "", "/");
  return defaults;
}

const INITIAL_SHELL = readInitialShellFromLocation();


const EMPTY_PROMPTS = [
  "What information is available here?",
  "Give me a brief summary",
  "What are the key topics?",
  "Walk me through the structure",
];

const NAV_TOP_ITEMS: {
  id: string;
  icon: typeof LuxiaHomeIcon;
  label: string;
  available: boolean;
}[] = [
  { id: "home", icon: LuxiaHomeIcon, label: "Home", available: true },
  { id: "users", icon: LuxiaUserPermissionsIcon, label: "Users & Permissions", available: true },
  { id: "datasources", icon: LuxiaDatasourceIcon, label: "Data Sources", available: false },
];

const NAV_PROJECT_ITEMS: {
  icon: typeof LuxiaGalaxyIcon;
  label: string;
  section: ProjectNavSection;
  available: boolean;
}[] = [
  { icon: LuxiaProjectsIcon, label: "Overview", section: "overview", available: true },
  { icon: LuxiaGalaxyIcon, label: "Galaxy", section: "galaxy", available: true },
  { icon: LuxiaDashboardIcon, label: "Dashboard", section: "dashboard", available: true },
  { icon: LuxiaConstellationIcon, label: "Constellations", section: "constellations", available: false },
  { icon: LuxiaChatIcon, label: "Chats", section: "chats", available: false },
  { icon: LuxiaVirtualAssistantIcon, label: "Vidgets", section: "virtual-assistant", available: false },
];

const NAV_BOTTOM_ITEMS: {
  id: string;
  icon: typeof LuxiaNotificationsIcon;
  label: string;
  available: boolean;
}[] = [
  { id: "notifications", icon: LuxiaNotificationsIcon, label: "Notifications", available: false },
  { id: "tools", icon: LuxiaToolsGalleryIcon, label: "Tools Gallery", available: false },
  { id: "settings", icon: LuxiaSettingsIcon, label: "Settings", available: false },
  { id: "support", icon: LuxiaSupportIcon, label: "Support", available: false },
];

const SIDEBAR_PROFILE_NAME = "User name";
const SIDEBAR_PROFILE_ROLE = "Administrator";
const SIDEBAR_PROFILE_INITIALS = "UN";

type NavIconComponent = (props: LuxiaIconProps) => ReactElement;

function renderMd(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="font-bold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="luxia-chat-text px-1.5 py-0.5 rounded luxia-type-body-dense font-mono" style={{ background: LX.blueT10, color: LX.accent }}>{p.slice(1, -1)}</code>;
    return <span key={i} className="luxia-chat-text">{p}</span>;
  });
}

function renderContent(content: string) {
  return content.split("\n\n").map((block, i) => {
    const lines = block.split("\n");
    if (lines.every(l => l.startsWith("- "))) {
      return (
        <ul key={i} className="space-y-1.5 my-2 min-w-0">
          {lines.map((l, j) => (
            <li key={j} className="flex items-start gap-2 luxia-type-body-small min-w-0">
              <span className="mt-[7px] w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: LX.accent }} />
              <span className="luxia-chat-text min-w-0">{renderMd(l.slice(2))}</span>
            </li>
          ))}
        </ul>
      );
    }
    return <p key={i} className={`luxia-chat-text luxia-type-body-small ${i > 0 ? "mt-3" : ""}`}>{renderMd(block)}</p>;
  });
}

function SidebarBrandBackground() {
  return null;
}

const SIDEBAR_WIDTH_EXPANDED = 280;
const SIDEBAR_WIDTH_COLLAPSED = 76;
const SIDEBAR_TOGGLE_SIZE = 42;
const SIDEBAR_TOGGLE_INSET = SIDEBAR_TOGGLE_SIZE / 2;
const LEFT_NAV_COLLAPSED_STORAGE_KEY = "luxia-left-nav-collapsed";
const LEFT_NAV_NARROW_BREAKPOINT = 1600;
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

function NavItem({ icon: Icon, label, active, badge, collapsed, disabled, href, onClick }: {
  icon: NavIconComponent | LucideIcon;
  label: string;
  active?: boolean;
  badge?: number;
  collapsed?: boolean;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const isDisabled = Boolean(disabled);
  const className = `w-full flex items-center rounded-[10px] transition-all group no-underline ${
    collapsed ? "justify-center h-[40px] px-0" : "gap-3 px-3.5 h-[40px] text-left"
  } ${isDisabled ? "cursor-not-allowed" : ""}`;
  const style = {
    background: active ? "rgba(255,255,255,0.12)" : "transparent",
    opacity: isDisabled && !active ? 0.48 : 1,
  } as const;
  const onMouseEnter = (e: ReactMouseEvent<HTMLElement>) => {
    if (!active && !isDisabled) {
      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
    }
  };
  const onMouseLeave = (e: ReactMouseEvent<HTMLElement>) => {
    if (!active) {
      e.currentTarget.style.background = "transparent";
    }
  };

  const content = (
    <>
      <span className="relative flex-shrink-0" aria-hidden>
        <Icon size={16} color={active ? "white" : "rgba(255,255,255,0.55)"} />
        {collapsed && badge ? (
          <span
            className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full luxia-type-badge flex items-center justify-center"
            style={{ background: LX.error, color: "white" }}
          >
            {badge}
          </span>
        ) : null}
      </span>
      {!collapsed ? (
        <>
          <span
            className="flex-1 luxia-type-nav-sidebar truncate"
            style={{ color: active ? "white" : "rgba(255,255,255,0.7)" }}
          >
            {label}
          </span>
          {badge ? (
            <span
              className="luxia-type-badge px-1.5 py-0.5 rounded-full"
              style={{ background: LX.error, color: "white" }}
            >
              {badge}
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );

  const item = isDisabled ? (
    <button
      type="button"
      disabled
      aria-label={label}
      aria-current={active ? "page" : undefined}
      aria-disabled
      className={className}
      style={style}
    >
      {content}
    </button>
  ) : href ? (
    <a
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </a>
  ) : (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </button>
  );

  if (collapsed) {
    const trigger = isDisabled ? (
      <span className="block w-full">{item}</span>
    ) : (
      item
    );
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
    );
  }

  return item;
}

const SIDEBAR_LOGO_WIDTH = 119.66;
const SIDEBAR_LOGO_HEIGHT = 46.64;
const SIDEBAR_BRAND_LEFT = 24;
const SIDEBAR_BRAND_TOP = 16;
const SIDEBAR_BRAND_BOTTOM = 12;

const SIDEBAR_STAR_WIDTH = 538.11;
const SIDEBAR_STAR_HEIGHT = 674.69;
const SIDEBAR_STAR_INTERSECTION_X = 174;

function LuxiaLogo() {
  return (
    <img
      src={luxiaWordmarkUrl}
      alt="Luxia"
      width={SIDEBAR_LOGO_WIDTH}
      height={SIDEBAR_LOGO_HEIGHT}
      style={{ display: "block", objectFit: "contain", flexShrink: 0 }}
    />
  );
}

function SidebarStarDecoration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute z-0"
      style={{
        left: SIDEBAR_STAR_INTERSECTION_X,
        top: "81%",
        width: SIDEBAR_STAR_WIDTH,
        height: SIDEBAR_STAR_HEIGHT,
        transform: "translate(-50%, -50%) rotate(10deg)",
        transformOrigin: "center",
        opacity: 0.4,
      }}
    >
      <img
        src={sidebarStarLogoUrl}
        alt=""
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

function SidebarCollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      className="absolute flex items-center justify-center rounded-full outline-none transition-shadow hover:shadow-[var(--luxia-shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--luxia-border-focus)]"
      style={{
        top: SIDEBAR_BRAND_TOP + SIDEBAR_LOGO_HEIGHT / 2 - SIDEBAR_TOGGLE_INSET,
        right: -SIDEBAR_TOGGLE_INSET,
        width: SIDEBAR_TOGGLE_SIZE,
        height: SIDEBAR_TOGGLE_SIZE,
        zIndex: 50,
        background: "var(--luxia-surface)",
        border: "1px solid var(--luxia-border-default)",
        boxShadow: "var(--luxia-shadow-sm)",
        color: "var(--luxia-brand-primary)",
      }}
    >
      {collapsed ? <ChevronRight size={18} strokeWidth={2.2} /> : <ChevronLeft size={18} strokeWidth={2.2} />}
    </button>
  );
}

function LeftNav({
  collapsed,
  onToggleCollapsed,
  homeActive,
  usersActive,
  projectId,
  projectLabel,
  activeProjectSection,
  onHomeClick,
  onUsersClick,
  onProjectSectionClick,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  homeActive?: boolean;
  usersActive?: boolean;
  projectId?: string | null;
  projectLabel?: string | null;
  activeProjectSection?: ProjectNavSection | null;
  onHomeClick?: () => void;
  onUsersClick?: () => void;
  onProjectSectionClick?: (section: ProjectNavSection) => void;
}) {
  const navPadding = collapsed ? "px-2" : "px-3";
  const showProjectNav = Boolean(projectLabel);
  const overviewHref = projectId ? getProjectPath(projectId) : undefined;
  const galaxyHref = projectId ? getGalaxyPath(projectId) : undefined;
  const dashboardHref = projectId ? getDashboardPath(projectId) : undefined;

  return (
    <aside
      className="relative h-full min-h-0 flex-shrink-0"
      aria-label="Luxia sidebar"
      style={{
        width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        transition: "width 200ms ease",
        overflow: "visible",
      }}
    >
      <div
        className="relative flex h-full min-h-0 flex-col overflow-hidden"
        style={{ background: LX.gradient.nav, width: "100%" }}
      >
        {!collapsed ? <SidebarStarDecoration /> : null}

        <div
          className={`relative z-[2] flex-shrink-0 ${collapsed ? "flex justify-center" : ""}`}
          style={{
            paddingTop: SIDEBAR_BRAND_TOP,
            paddingLeft: collapsed ? 0 : SIDEBAR_BRAND_LEFT,
            paddingRight: collapsed ? 0 : SIDEBAR_BRAND_LEFT,
            paddingBottom: SIDEBAR_BRAND_BOTTOM,
          }}
        >
          {collapsed ? (
            <div aria-label="Luxia" role="img">
              <LuxiaStarLogo size={26} />
            </div>
          ) : (
            <LuxiaLogo />
          )}
        </div>

        <div className="relative z-[2] min-h-0 flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical luxia-scrollbar-sidebar">
          <nav className={`${navPadding} space-y-px`} aria-label="Global workspace">
            {NAV_TOP_ITEMS.map(({ id, icon, label, available }) => (
              <NavItem
                key={id}
                icon={icon}
                label={label}
                collapsed={collapsed}
                active={id === "home" ? homeActive : id === "users" ? usersActive : false}
                disabled={!available}
                href={id === "home" && available ? "/" : undefined}
                onClick={
                  id === "home"
                    ? onHomeClick
                    : id === "users"
                      ? onUsersClick
                      : undefined
                }
              />
            ))}
          </nav>

          {showProjectNav ? (
            <>
              <div
                className={`my-2.5 ${collapsed ? "mx-2" : "mx-4"}`}
                style={{ height: 1, background: "rgba(255,255,255,0.07)" }}
                role="separator"
              />

              <div className={navPadding}>
                {!collapsed ? (
                  <div className="mb-1.5 px-3.5">
                    <p
                      className="luxia-type-overline-data"
                      style={{ color: "rgba(150,219,251,0.55)" }}
                    >
                      PROJECT
                    </p>
                    <p
                      className="mt-1 truncate luxia-type-nav-sidebar"
                      style={{ color: "rgba(255,255,255,0.88)" }}
                      title={projectLabel ?? undefined}
                    >
                      {projectLabel}
                    </p>
                  </div>
                ) : null}
                <nav className="space-y-px" aria-label="Current project">
                  {NAV_PROJECT_ITEMS.map(({ icon, label, section, available }) => (
                    <NavItem
                      key={section}
                      icon={icon}
                      label={label}
                      active={activeProjectSection === section}
                      collapsed={collapsed}
                      disabled={!available}
                      href={
                        available
                          ? section === "overview"
                            ? overviewHref
                            : section === "galaxy"
                              ? galaxyHref
                              : section === "dashboard"
                                ? dashboardHref
                                : undefined
                          : undefined
                      }
                      onClick={
                        available
                          ? () => onProjectSectionClick?.(section)
                          : undefined
                      }
                    />
                  ))}
                </nav>
              </div>
            </>
          ) : null}
        </div>

        <div
          className={`relative z-[2] flex-shrink-0 ${navPadding} space-y-px pb-1 pt-2`}
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <nav className="space-y-px" aria-label="Utilities">
            {NAV_BOTTOM_ITEMS.map(({ id, icon, label, available }) => (
              <NavItem
                key={id}
                icon={icon}
                label={label}
                collapsed={collapsed}
                disabled={!available}
              />
            ))}
          </nav>
        </div>

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="relative z-[2] flex flex-shrink-0 items-center justify-center px-2 py-2.5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                aria-label={`${SIDEBAR_PROFILE_NAME}, ${SIDEBAR_PROFILE_ROLE}`}
              >
                <div
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white luxia-type-caption flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #5BC8F5 0%, #2C7A9E 100%)" }}
                  aria-hidden
                >
                  {SIDEBAR_PROFILE_INITIALS}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {SIDEBAR_PROFILE_NAME} — {SIDEBAR_PROFILE_ROLE}
            </TooltipContent>
          </Tooltip>
        ) : (
          <div
            className="relative z-[2] flex flex-shrink-0 items-center gap-2.5 px-4 py-2.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white luxia-type-caption flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #5BC8F5 0%, #2C7A9E 100%)" }}
              aria-hidden
            >
              {SIDEBAR_PROFILE_INITIALS}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white luxia-type-profile-secondary truncate leading-tight">
                {SIDEBAR_PROFILE_NAME}
              </p>
              <p
                className="luxia-type-profile-secondary truncate leading-tight"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {SIDEBAR_PROFILE_ROLE}
              </p>
            </div>
          </div>
        )}
      </div>

      <SidebarCollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
    </aside>
  );
}

function ChatTabBar({ chats, activeId, onSelect, onNew, onClose, onPin, onRename }: {
  chats: Chat[]; activeId: string;
  onSelect: (id: string) => void; onNew: () => void;
  onClose: (id: string) => void; onPin: (id: string) => void;
  onRename: (id: string, v: string) => void;
}) {
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);
  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <div className="luxia-scrollbar luxia-scrollbar-horizontal flex items-center gap-1.5 py-2 overflow-x-auto flex-shrink-0"
      style={{ borderBottom: `1px solid ${LX.border}` }}>
      {chats.map((chat) => {
        const isActive = chat.id === activeId;
        const con = chat.chatType === "constellation" && chat.constellationId
          ? CONSTELLATIONS.find((c) => c.id === chat.constellationId)
          : null;
        const style = con ? CONSTELLATION_STYLE[con.type] : null;

        const isGalaxyTab = chat.chatType === "galaxy";
        const galaxyProject = isGalaxyTab
          ? getProjectNameById(chat.projectId)
          : null;
        const tabLabel = isGalaxyTab ? galaxyProject! : chat.label;

        return (
          <div key={chat.id} className="relative flex-shrink-0 group"
            onContextMenu={(e) => { e.preventDefault(); setMenu({ id: chat.id, x: e.clientX, y: e.clientY }); }}>
            <button onClick={() => onSelect(chat.id)}
              className="flex items-center gap-2 px-3.5 h-[36px] rounded-[10px] luxia-type-body-dense transition-all"
              style={{
                background: isGalaxyTab
                  ? (isActive ? "rgba(48,33,78,0.05)" : "transparent")
                  : style ? (isActive ? style.activeBg : style.bg) : (isActive ? LX.subtle : "transparent"),
                border: `1px solid ${
                  isGalaxyTab
                    ? (isActive ? LX.borderStrong : LX.border)
                    : style ? (isActive ? style.activeBorder : style.border) : (isActive ? LX.borderStrong : LX.border)
                }`,
                color: isActive ? LX.primary : LX.muted,
                fontWeight: isActive ? 800 : 600,
                boxShadow: isActive ? LX.shadow.sm : "none",
              }}>
              {chat.pinned && <Pin size={10} style={{ color: isGalaxyTab ? LX.secondary : (style?.color ?? LX.accent) }} />}
              {isGalaxyTab && <LuxiaGalaxyIcon size={11} style={{ color: LX.secondary, flexShrink: 0 }} />}
              {renaming === chat.id ? (
                <input ref={renameRef} value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onBlur={() => { if (renameVal.trim()) onRename(chat.id, renameVal.trim()); setRenaming(null); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { if (renameVal.trim()) onRename(chat.id, renameVal.trim()); setRenaming(null); }
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  className="bg-transparent border-none outline-none w-[90px] luxia-type-body-dense-strong"
                  style={{ color: LX.primary }} onClick={(e) => e.stopPropagation()} />
              ) : (
                <span className="flex items-center gap-[6px] min-w-0 items-baseline">
                  <span className="truncate select-none" style={{ maxWidth: 140 }} title={tabLabel}>{tabLabel}</span>
                  {con ? (
                    <span
                      className="luxia-type-overline-data shrink-0"
                      style={{ color: con.type === "database" ? "var(--luxia-purple-50)" : "var(--luxia-blue-60)" }}
                    >
                      {getConstellationSourceLabel(con.type)}
                    </span>
                  ) : null}
                </span>
              )}
              {chats.length > 1 && (
                <span onClick={(e) => { e.stopPropagation(); onClose(chat.id); }}
                  className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-full transition-all hover:bg-black/10 ml-0.5 flex-shrink-0">
                  <X size={9} style={{ color: LX.muted }} />
                </span>
              )}
            </button>
          </div>
        );
      })}

      <button onClick={onNew}
        className="flex items-center justify-center w-[30px] h-[30px] rounded-[8px] flex-shrink-0 transition-all hover:opacity-80"
        style={{ border: `1.5px dashed ${LX.border}` }}
        title="New Chat">
        <Plus size={13} style={{ color: LX.muted }} />
      </button>

      {menu && (
        <div className="fixed z-50 rounded-[12px] overflow-hidden py-1"
          style={{ top: menu.y, left: menu.x, background: "white", boxShadow: LX.shadow.md, border: `1px solid ${LX.border}`, minWidth: 156 }}
          onClick={(e) => e.stopPropagation()}>
          {[
            { icon: Edit3, label: "Rename", action: () => { const c = chats.find(x => x.id === menu.id); if (c) { setRenaming(menu.id); setRenameVal(c.label); setMenu(null); } } },
            { icon: Pin, label: "Toggle pin", action: () => { onPin(menu.id); setMenu(null); } },
            { icon: Copy, label: "Duplicate", action: () => setMenu(null) },
            { icon: Trash2, label: "Close tab", action: () => { onClose(menu.id); setMenu(null); }, danger: true },
          ].map(({ icon: Icon, label, action, danger }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-2.5 px-4 py-2 luxia-type-body-dense-strong hover:bg-[#FAFDFF] transition-colors text-left"
              style={{ color: danger ? LX.error : LX.primary }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ASSISTANT_MODES = ["Luxia", "Knowledge Base", "Luxia / AI"];

function AssistantModeDropdown({ mode, onChange }: { mode: string; onChange: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function openMenu() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: r.top - 8, left: r.right - 160 });
    setOpen(true);
  }

  return (
    <div className="relative z-[1] flex-shrink-0 min-w-0">
      <button ref={triggerRef} onClick={() => open ? setOpen(false) : openMenu()}
        className="flex items-center gap-1 px-2 h-full rounded-lg transition-colors outline-none"
        style={{ color: "#64748B" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = LX.primary; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748B"; }}>
        <span className="luxia-type-body-dense-strong truncate max-w-[140px]">{mode}</span>
        <ChevronDown size={14} strokeWidth={2} style={{ transition: "transform 160ms ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} className="fixed z-[9999] rounded-[12px] overflow-hidden py-1.5"
          style={{
            background: "white",
            boxShadow: LX.shadow.md,
            border: "1px solid #E2E8F0",
            minWidth: 160,
            bottom: `calc(100vh - ${menuPos.top}px)`,
            left: menuPos.left,
          }}>
          {ASSISTANT_MODES.map(m => (
            <button key={m} onClick={() => { onChange(m); setOpen(false); triggerRef.current?.focus(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 luxia-type-body-dense text-left transition-colors hover:bg-[#F8FAFC]"
              style={{ color: LX.primary, fontWeight: m === mode ? 700 : 600 }}>
              {m === mode && <Check size={12} style={{ color: LX.secondary }} />}
              {m !== mode && <span className="w-3" />}
              {m}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
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
}: {
  onCreate: (payload: NewChatPayload) => void;
  onClose: () => void;
  lockedProjectId?: string | null;
  constellations: Constellation[];
}) {
  const [chatType, setChatType] = useState<ChatScope>("constellation");
  const [projectId, setProjectId] = useState(lockedProjectId ?? PROJECTS[0]?.id ?? "");
  const [constellationId, setConstellationId] = useState("");

  useEffect(() => {
    if (lockedProjectId) setProjectId(lockedProjectId);
  }, [lockedProjectId]);

  const projectConstellations = useMemo(
    () => constellations.filter((c) => c.projectId === projectId),
    [constellations, projectId],
  );

  const projectOptions = useMemo(
    () => PROJECTS.map((project) => ({
      value: project.id,
      label: project.label,
      content: (
        <span className="truncate" style={{ color: "var(--luxia-text-project-title)" }}>
          {project.label}
        </span>
      ),
    })),
    [],
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
        <div className="flex items-start justify-between px-7 pt-6 pb-4 flex-shrink-0">
          <div>
            <h2 id="new-chat-title" className="luxia-type-title-modal mb-1" style={{ color: LX.primary }}>Create Chat</h2>
            <p className="luxia-type-body-dense" style={{ color: LX.textMuted }}>
              Choose a chat type and project to start a new conversation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0 mt-0.5 outline-none"
            style={{ border: `1px solid ${LX.border}` }}
            aria-label="Close create chat dialog"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <X size={13} style={{ color: LX.textMuted }} />
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

function LuxiaDialog({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void;
  title: string; children: React.ReactNode; footer: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.40)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md flex flex-col max-h-[85vh]"
        style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 16, boxShadow: "0 12px 32px rgba(15,23,42,0.14)" }}>
        <div className="flex-shrink-0 flex items-center justify-between px-7 pt-6 pb-4">
          <h2 className="luxia-type-title-modal" style={{ color: LX.primary }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors outline-none"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <X size={16} style={{ color: LX.textMuted }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-7 pb-2">{children}</div>
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-7 py-5" style={{ borderTop: `1px solid ${LX.border}` }}>
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
}

const DEMO_USERS = [
  { id: "u1", name: "Alice Martin", email: "alice@luxia.ai" },
  { id: "u2", name: "Ben Torres", email: "ben@luxia.ai" },
  { id: "u3", name: "Clara Huang", email: "clara@luxia.ai" },
  { id: "u4", name: "David Kim", email: "david@luxia.ai" },
];

function ShareDialog({ open, chatLabel, sharedUsers, onClose, onShare }: {
  open: boolean; chatLabel: string; sharedUsers: string[];
  onClose: () => void; onShare: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  useEffect(() => { if (open) { setSelected([...sharedUsers]); setQuery(""); setDone(false); } }, [open]);
  const filtered = DEMO_USERS.filter(u =>
    !sharedUsers.includes(u.id) &&
    (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  );
  function toggle(id: string) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  if (done) return (
    <LuxiaDialog open={open} onClose={onClose} title={`Share ${chatLabel}`}
      footer={<Button type="button" variant="primary" onClick={onClose}>Done</Button>}>
      <div className="py-6 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(142,99,235,0.1)" }}>
          <Check size={22} style={{ color: LX.secondary }} />
        </div>
        <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>Chat shared successfully</p>
      </div>
    </LuxiaDialog>
  );
  return (
    <LuxiaDialog open={open} onClose={onClose} title={`Share ${chatLabel}`}
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="primary" onClick={() => { onShare(selected); setDone(true); }} disabled={selected.length === 0}>
          Share
        </Button>
      </>}>
      <div className="flex items-center gap-2 px-3 h-[38px] rounded-[10px] mb-3" style={{ border: `1px solid ${LX.border}` }}>
        <Search size={13} style={{ color: LX.textMuted }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…"
          className="flex-1 bg-transparent luxia-type-body-dense outline-none" style={{ color: LX.primary }} />
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selected.map(id => {
            const u = DEMO_USERS.find(x => x.id === id);
            if (!u) return null;
            return (
              <span key={id} className="flex items-center gap-1 px-2.5 py-1 rounded-full luxia-type-metadata"
                style={{ background: "rgba(142,99,235,0.08)", color: LX.secondary }}>
                {u.name}
                <button onClick={() => toggle(id)} className="outline-none ml-0.5"><X size={10} /></button>
              </span>
            );
          })}
        </div>
      )}
      <div className="space-y-0.5 max-h-48 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical">
        {filtered.map(u => (
          <button key={u.id} onClick={() => toggle(u.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-left transition-colors outline-none"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center luxia-type-caption flex-shrink-0"
              style={{ background: "rgba(142,99,235,0.12)", color: LX.secondary }}>{u.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="luxia-type-body-dense-strong truncate" style={{ color: LX.primary }}>{u.name}</p>
              <p className="luxia-type-caption truncate" style={{ color: LX.textMuted }}>{u.email}</p>
            </div>
            {selected.includes(u.id) && <Check size={13} style={{ color: LX.secondary }} />}
          </button>
        ))}
        {filtered.length === 0 && <p className="luxia-type-body-dense py-4 text-center" style={{ color: LX.textMuted }}>No users found</p>}
      </div>
    </LuxiaDialog>
  );
}

function ShareListDialog({ open, sharedUsers, onClose }: {
  open: boolean; sharedUsers: string[]; onClose: () => void;
}) {
  const users = DEMO_USERS.filter(u => sharedUsers.includes(u.id));
  return (
    <LuxiaDialog open={open} onClose={onClose} title="Who Has Access"
      footer={<Button type="button" variant="primary" onClick={onClose}>Close</Button>}>
      {users.length === 0
        ? <p className="py-6 luxia-type-body-small text-center" style={{ color: LX.textMuted }}>No users currently have access to this chat.</p>
        : <div className="space-y-1 py-1">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px]"
                style={{ border: `1px solid ${LX.borderSubtle}` }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center luxia-type-caption flex-shrink-0"
                  style={{ background: "rgba(142,99,235,0.12)", color: LX.secondary }}>{u.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>{u.name}</p>
                  <p className="luxia-type-caption" style={{ color: LX.textMuted }}>{u.email}</p>
                </div>
              </div>
            ))}
          </div>
      }
    </LuxiaDialog>
  );
}

function GenerateReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [scope, setScope] = useState("entire");
  const [content, setContent] = useState("transcript_charts");
  const [instructions, setInstructions] = useState("");
  return (
    <LuxiaDialog open={open} onClose={onClose} title="Generate Report"
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="primary" onClick={onClose}>Generate and open in editor</Button>
      </>}>
      <div className="space-y-5 py-1">
        <div>
          <p className="luxia-type-overline-form mb-2" style={{ color: LX.textMuted }}>Include</p>
          {[{ id: "entire", label: "Entire conversation" }, { id: "selected", label: "Selected interactions" }].map(opt => (
            <label key={opt.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <input type="radio" name="scope" value={opt.id} checked={scope === opt.id} onChange={() => setScope(opt.id)}
                className="accent-purple-600" />
              <span className="luxia-type-body-small" style={{ color: LX.primary }}>{opt.label}</span>
            </label>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${LX.borderSubtle}`, paddingTop: 16 }}>
          <p className="luxia-type-overline-form mb-2" style={{ color: LX.textMuted }}>Report content</p>
          {[
            { id: "transcript_charts", label: "Transcript with charts" },
            { id: "summary", label: "Summary only" },
            { id: "transcript_summary", label: "Transcript and summary" },
          ].map(opt => (
            <label key={opt.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <input type="radio" name="content" value={opt.id} checked={content === opt.id} onChange={() => setContent(opt.id)}
                className="accent-purple-600" />
              <span className="luxia-type-body-small" style={{ color: LX.primary }}>{opt.label}</span>
            </label>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${LX.borderSubtle}`, paddingTop: 16 }}>
          <p className="luxia-type-overline-form mb-2" style={{ color: LX.textMuted }}>Custom instructions (optional)</p>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}
            placeholder="Add any specific instructions for this report…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-[10px] luxia-type-body-dense resize-none outline-none"
            style={{ border: `1px solid ${LX.border}`, color: LX.primary }} />
        </div>
      </div>
    </LuxiaDialog>
  );
}

function DeleteChatDialog({ open, onClose, onDelete, entityName, entityType = "Chat" }: {
  open: boolean; onClose: () => void; onDelete: () => void;
  entityName: string;
  entityType?: string;
}) {
  return (
    <LuxiaDialog open={open} onClose={onClose} title={`Delete ${entityName}?`}
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="destructive" onClick={() => { onDelete(); onClose(); }}>
          {`Delete ${entityType}`}
        </Button>
      </>}>
      <p className="py-4 luxia-type-body-small" style={{ color: LX.textSecondary }}>
        This will permanently remove {entityName} and all its messages. This action cannot be undone.
      </p>
    </LuxiaDialog>
  );
}

function PageHeader({
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

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 h-px" style={{ background: LX.borderSubtle }} />
      <span className="luxia-type-overline-data" style={{ color: LX.borderStrong }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: LX.borderSubtle }} />
    </div>
  );
}

function SourceFooter({
  sources,
  insights,
}: {
  sources?: Source[];
  insights?: ResponseInsights;
}) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const hasInsights = Boolean(insights?.items.length);
  const hasSources = Boolean(sources && sources.length > 0);
  const sectionOffset = hasSources ? "mt-3" : "";

  return (
    <div className="mt-4 pt-3.5 min-w-0" style={{ borderTop: `1px solid ${LX.borderSubtle}` }}>
      {hasSources ? (
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="luxia-type-metadata flex-shrink-0" style={{ color: LX.textMuted }}>Sources:</span>
          {sources!.map((s, i) => (
            <button key={s.id} type="button"
              className="luxia-chat-text luxia-type-metadata transition-colors outline-none text-left"
              style={{ color: LX.purple60 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = LX.primary; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = LX.purple60; }}>
              {s.label}{i < sources!.length - 1 ? "," : ""}
            </button>
          ))}
        </div>
      ) : null}

      {hasInsights && insights ? (
        <div className={sectionOffset}>
          <button
            type="button"
            onClick={() => setInsightsOpen((open) => !open)}
            aria-expanded={insightsOpen}
            className="flex items-center gap-1.5 luxia-type-caption hover:opacity-80 transition-opacity outline-none"
            style={{ color: LX.textMuted }}
          >
            <ChevronDown
              size={11}
              style={{
                transition: "transform 160ms ease",
                transform: insightsOpen ? "rotate(180deg)" : "none",
              }}
            />
            Insights
          </button>
          {insightsOpen ? <ResponseInsightsContent insights={insights} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function AICard({
  message,
  onOpenGalaxyConstellation,
  onViewGalaxyActivity,
}: {
  message: Message;
  onOpenGalaxyConstellation?: () => void;
  onViewGalaxyActivity?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const insights = getResponseInsights(message.content, message.insights);
  const galaxy = message.galaxy;
  const showAnswerBody = !galaxy || galaxy.phase === "answering" || galaxy.phase === "complete";
  const showStandardFooter = !galaxy && (message.sources || insights);

  return (
    <div className="flex items-start gap-3 mb-7 min-w-0 max-w-full" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="flex-shrink-0 w-8 flex items-start justify-center rounded-[8px]"
        style={{ background: "transparent" }}>
        <LuxiaStarLogo size={24} />
      </div>
      <div className="flex-1 min-w-0 max-w-[680px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="luxia-type-body-dense font-bold" style={{ color: LX.primary }}>Luxia</span>
          <span className="luxia-type-caption" style={{ color: LX.borderStrong }}>{message.timestamp}</span>
        </div>
        <div className="px-5 py-4 rounded-[16px] min-w-0 overflow-hidden"
          style={{ background: "white", border: "1px solid #EAF0F6", boxShadow: "0 6px 18px rgba(15,23,42,0.08)" }}>
          {galaxy && galaxy.phase !== "complete" ? (
            <GalaxyProvenanceRow meta={galaxy} />
          ) : null}
          {showAnswerBody && message.content ? (
            <div className="luxia-chat-text" style={{ color: LX.primary }}>{renderContent(message.content)}</div>
          ) : null}
          {galaxy && galaxy.phase === "complete" ? (
            <GalaxyProvenanceRow
              meta={galaxy}
              onViewActivity={onViewGalaxyActivity}
              onOpenConstellation={onOpenGalaxyConstellation}
            />
          ) : null}
          {showStandardFooter ? (
            <SourceFooter
              sources={message.sources}
              insights={insights ?? undefined}
            />
          ) : null}
        </div>
        <div className="flex items-center gap-0.5 mt-2 transition-opacity duration-150" style={{ opacity: hover ? 1 : 0 }}>
          {[{ icon: Copy, label: "Copy" }, { icon: RefreshCw, label: "Regenerate" }, { icon: Bookmark, label: "Save" }].map(({ icon: Icon, label }) => (
            <button key={label}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] luxia-type-caption transition-colors"
              style={{ color: LX.textMuted }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Icon size={11} />{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-end mb-7 min-w-0 max-w-full">
      <div className="min-w-0 max-w-[min(70%,720px)]">
        <div className="luxia-chat-text px-5 py-3.5 luxia-type-body-small-strong"
          style={{
            background: "var(--luxia-purple-70)",
            color: "var(--luxia-text-inverse)",
            borderRadius: "18px 18px 6px 18px",
            boxShadow: "0 2px 12px rgba(48,33,78,0.22)",
          }}>
          {message.content}
        </div>
        <p className="text-right luxia-type-caption mt-1.5 pr-1" style={{ color: LX.borderStrong }}>{message.timestamp}</p>
      </div>
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pb-8">
      <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 overflow-hidden"
        style={{ background: LX.gradient.button, boxShadow: LX.shadow.lg }}>
        <LuxiaStarLogo size={32} />
      </div>
      <h2 className="luxia-type-heading-h4 mb-2 text-center" style={{ color: LX.primary }}>
        Start the conversation
      </h2>
      <p className="luxia-type-body-small text-center mb-8 max-w-[380px]" style={{ color: LX.muted }}>
        Ask anything. Luxia will search across your connected constellation.
      </p>
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-[480px]">
        {EMPTY_PROMPTS.map((p) => (
          <button key={p} onClick={() => onPrompt(p)}
            className="text-left px-4 py-3 rounded-[14px] luxia-type-body-dense transition-all outline-none"
            style={{ color: LX.primary, fontWeight: 600, background: "white", border: `1px solid ${LX.border}`, boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = LX.secondary; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px rgba(142,99,235,0.08)`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = LX.border; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(15,23,42,0.06)"; }}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function LanguageSelector({ lang, onChange }: { lang: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ bottom: number; left: number } | null>(null);
  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onOutside); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function openMenu() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setMenuPos({ bottom: window.innerHeight - r.top + 8, left: r.left });
    setOpen(true);
  }

  return (
    <div className="relative flex-shrink-0">
      <button ref={triggerRef}
        aria-label="Select answer language"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => open ? setOpen(false) : openMenu()}
        className="flex items-center gap-1 p-1 rounded-full select-none transition-colors outline-none"
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F1F5F9"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
        <FlagCircle flagUrl={current.flagUrl} label={current.label} size={26} />
        <ChevronDown size={13} strokeWidth={2.2} style={{ color: "#94A3B8", marginTop: 1 }} />
      </button>
      {open && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} role="menu"
          className="fixed z-[9999] rounded-[12px] overflow-hidden py-1.5"
          style={{
            background: "white",
            boxShadow: "0 4px 16px rgba(15,23,42,0.10)",
            border: "1px solid #E2E8F0",
            minWidth: 190,
            bottom: menuPos.bottom,
            left: menuPos.left,
          }}>
          {LANGUAGES.map(l => (
            <button key={l.code} role="menuitem"
              onClick={() => { onChange(l.code); setOpen(false); triggerRef.current?.focus(); }}
              className="w-full flex items-center gap-2.5 px-2.5 h-[44px] text-left outline-none transition-colors"
              style={{ color: LX.primary, fontWeight: l.code === lang ? 600 : 400 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(142,99,235,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <FlagCircle flagUrl={l.flagUrl} label={l.label} size={24} />
              <div className="flex-1 min-w-0">
                <p className="luxia-type-body-dense-strong leading-none mb-0.5" style={{ color: LX.primary }}>{l.label}</p>
                <p className="luxia-type-caption" style={{ color: "#64748B" }}>{l.sublabel}</p>
              </div>
              {l.code === lang && <Check size={13} style={{ color: LX.secondary, flexShrink: 0 }} />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function ResponseTypeDropdown({ constellationType }: { constellationType: ConstellationType }) {
  const options = constellationType === "database"
    ? [{ id: "narrative", label: "Narrative", icon: AlignLeft }, { id: "charts", label: "Charts", icon: BarChart3 }]
    : [{ id: "standard", label: "Standard", icon: AlignLeft }, { id: "deep", label: "Deep", icon: Layers }];
  const [selected, setSelected] = useState(options[0].id);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<number>(-1);

  useEffect(() => { setSelected(options[0].id); setOpen(false); }, [constellationType]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
      if (e.key === "ArrowDown") { e.preventDefault(); focusRef.current = Math.min(focusRef.current + 1, options.length - 1); focusNth(focusRef.current); }
      if (e.key === "ArrowUp") { e.preventDefault(); focusRef.current = Math.max(focusRef.current - 1, 0); focusNth(focusRef.current); }
      if (e.key === "Home") { e.preventDefault(); focusRef.current = 0; focusNth(0); }
      if (e.key === "End") { e.preventDefault(); focusRef.current = options.length - 1; focusNth(options.length - 1); }
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onOutside); document.removeEventListener("keydown", onKey); };
  }, [open, options.length]);

  function focusNth(n: number) {
    const btns = menuRef.current?.querySelectorAll("button");
    (btns?.[n] as HTMLElement | undefined)?.focus();
  }

  function openMenu() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: r.top - 8, left: r.left });
    focusRef.current = options.findIndex(o => o.id === selected);
    setOpen(true);
  }

  const current = options.find(o => o.id === selected) ?? options[0];
  const Icon = current.icon;

  return (
    <>
      <button ref={triggerRef} onClick={() => open ? setOpen(false) : openMenu()}
        className="flex items-center gap-1.5 h-[30px] px-1 rounded-lg transition-colors outline-none"
        style={{ color: "#64748B" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = LX.primary; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748B"; }}>
        <Icon size={14} strokeWidth={1.8} />
        <span className="luxia-type-body-small-strong">{current.label}</span>
        <ChevronDown size={14} strokeWidth={2} style={{ transition: "transform 160ms ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} className="fixed z-[9999] rounded-[12px] overflow-hidden py-1.5"
          style={{
            background: "white",
            boxShadow: "0 4px 16px rgba(15,23,42,0.10)",
            border: "1px solid #E2E8F0",
            minWidth: 160,
            bottom: `calc(100vh - ${menuPos.top}px)`,
            left: menuPos.left,
          }}>
          {options.map(opt => {
            const OptIcon = opt.icon;
            return (
              <button key={opt.id}
                onClick={() => { setSelected(opt.id); setOpen(false); triggerRef.current?.focus(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 luxia-type-body-dense text-left transition-colors outline-none"
                style={{ color: LX.primary, fontWeight: opt.id === selected ? 700 : 600 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(142,99,235,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <OptIcon size={13} strokeWidth={1.8} style={{ color: opt.id === selected ? LX.secondary : "#94A3B8" }} />
                {opt.label}
                {opt.id === selected && <Check size={12} style={{ color: LX.secondary, marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

const COMPOSER_INPUT_MIN_HEIGHT = 20;
const COMPOSER_INPUT_MAX_HEIGHT = 40;

function PromptComposer({
  value,
  onChange,
  onSend,
  language,
  onLanguageChange,
  constellationType,
  assistantMode,
  onModeChange,
  focusKey,
  chatType,
  galaxyRoute,
}: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  language: string; onLanguageChange: (c: string) => void;
  constellationType: ConstellationType;
  assistantMode: string; onModeChange: (m: string) => void;
  focusKey?: string;
  chatType: ChatScope;
  galaxyRoute?: {
    routeMode: "auto" | "manual";
    pendingManual: GalaxyMatchedConstellation | null;
    options: Array<{ id: string; label: string; type: "PDF" | "CSV" | "DB" }>;
    onSelectAuto: () => void;
    onSelectManual: (option: { id: string; label: string; type: "PDF" | "CSV" | "DB" }) => void;
    onClearManual: () => void;
  };
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;
  const isConstellationChat = chatType === "constellation";
  const isGalaxyChat = chatType === "galaxy";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const contentHeight = el.scrollHeight;
    const capped = Math.min(
      Math.max(contentHeight, COMPOSER_INPUT_MIN_HEIGHT),
      COMPOSER_INPUT_MAX_HEIGHT,
    );
    el.style.height = `${capped}px`;
    el.style.overflowY = contentHeight > COMPOSER_INPUT_MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  useEffect(() => {
    if (!focusKey) return;
    const frame = window.requestAnimationFrame(() => ref.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [focusKey]);

  return (
    <div
      className="flex-shrink-0 min-w-0 max-w-full w-full px-8 pb-5 pt-2"
      style={isGalaxyChat ? {
        background: "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.02) 100%)",
      } : undefined}
    >
      <div className="flex items-center gap-5 min-w-0 max-w-full">
        <LanguageSelector lang={language} onChange={onLanguageChange} />

        <div
          className="luxia-chat-composer"
          style={isGalaxyChat ? {
            borderColor: "#E8EAF2",
            background: "#FFFFFF",
          } : undefined}
        >
          <div className="luxia-chat-composer__text-safe">
            <textarea
              ref={ref}
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              placeholder="Ask something"
              className="luxia-chat-composer__input"
              aria-label="Message"
            />
          </div>
          {isConstellationChat ? (
            <div className="luxia-chat-composer__mode">
              <AssistantModeDropdown mode={assistantMode} onChange={onModeChange} />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="flex-shrink-0 w-[46px] h-[46px] flex items-center justify-center rounded-full transition-all hover:opacity-85 outline-none"
          style={{
            background: LX.gradient.button,
            boxShadow: "0 4px 12px rgba(48,33,78,0.18)",
          }}
          aria-label="Voice input"
        >
          <Mic size={18} color="white" />
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={!hasText}
          className="flex-shrink-0 w-[46px] h-[46px] flex items-center justify-center rounded-full transition-all hover:opacity-90 outline-none"
          style={{
            background: hasText ? LX.gradient.button : "#E2E8F0",
            boxShadow: hasText ? "0 4px 12px rgba(48,33,78,0.18)" : "none",
          }}
          aria-label="Send message"
        >
          <Send size={17} color={hasText ? "white" : "#94A3B8"} />
        </button>
      </div>

      {isConstellationChat ? (
        <div className="mt-2 min-w-0 max-w-full" style={{ paddingLeft: "calc(2.25rem + 20px + 28px)" }}>
          <ResponseTypeDropdown constellationType={constellationType} />
        </div>
      ) : null}

      {isGalaxyChat && galaxyRoute ? (
        <GalaxyRouteSelector
          routeMode={galaxyRoute.routeMode}
          pendingManual={galaxyRoute.pendingManual}
          options={galaxyRoute.options}
          onSelectAuto={galaxyRoute.onSelectAuto}
          onSelectManual={galaxyRoute.onSelectManual}
          onClearManual={galaxyRoute.onClearManual}
        />
      ) : null}
    </div>
  );
}

function SidebarListItem({ label, icon: Icon, onView, onRemove, draggable: isDraggable, onDragStart, onDragOver, onDrop, onDragEnd, dragOver }: {
  label: string; icon: SectionIcon;
  onView?: () => void; onRemove: () => void;
  draggable?: boolean; onDragStart?: () => void; onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void; onDragEnd?: () => void; dragOver?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] group transition-colors relative"
      style={{ borderTop: dragOver ? `2px solid ${LX.accent}` : "2px solid transparent", background: dragOver ? `${LX.accent}08` : "transparent" }}
      onMouseEnter={(e) => { if (!dragOver) (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
      onMouseLeave={(e) => { if (!dragOver) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {isDraggable && <GripVertical size={10} color={LX.borderStrong} className="flex-shrink-0 cursor-grab" />}
      <Icon size={11} color={LX.accent} className="flex-shrink-0" />
      <span className="flex-1 luxia-type-caption truncate select-none" style={{ color: LX.primary, fontWeight: 600 }}>{label}</span>
      <div ref={menuRef} className="relative flex-shrink-0">
        <button onClick={() => setMenuOpen(p => !p)}
          className="w-5 h-5 flex items-center justify-center rounded-[5px] transition-all"
          style={{ opacity: menuOpen ? 1 : 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.background = LX.border; }}
          onMouseLeave={(e) => { if (!menuOpen) { (e.currentTarget as HTMLElement).style.opacity = "0"; (e.currentTarget as HTMLElement).style.background = "transparent"; } }}>
          <MoreHorizontal size={11} style={{ color: LX.textMuted }} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-40 min-w-[176px] py-1"
            style={{ background: "white", boxShadow: LX.shadow.lg, border: `1px solid ${LX.border}`, borderRadius: 12 }}
            onClick={(e) => e.stopPropagation()}>
            {onView && (
              <button onClick={() => { setMenuOpen(false); onView(); }}
                className="w-full flex items-center gap-2.5 px-3.5 luxia-type-profile-secondary transition-colors text-left"
                style={{ color: LX.primary, height: 36 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <Eye size={13} style={{ color: LX.textMuted }} />View
              </button>
            )}
            <div className="h-px mx-3 my-0.5" style={{ background: LX.borderSubtle }} />
            <button onClick={() => { setMenuOpen(false); onRemove(); }}
              className="w-full flex items-center gap-2.5 px-3.5 luxia-type-profile-secondary transition-colors text-left"
              style={{ color: LX.error, height: 36 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.state.error06; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Trash2 size={13} style={{ color: LX.error }} />Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmRemoveDialog({ label, onConfirm, onCancel }: {
  label: string; onConfirm: () => void; onCancel: () => void;
}) {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0" style={{ background: "rgba(16,5,32,0.3)", backdropFilter: "blur(3px)" }} />
      <div className="relative rounded-[20px] p-7 w-[380px]"
        style={{ background: "white", boxShadow: "0 12px 32px rgba(15,23,42,0.14)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center mb-4"
          style={{ background: "rgba(247,80,80,0.06)", border: "1px solid rgba(247,80,80,0.14)" }}>
          <Trash2 size={17} style={{ color: LX.error }} />
        </div>
        <h3 className="luxia-type-body-small-strong mb-1.5" style={{ color: LX.primary }}>Remove item?</h3>
        <p className="luxia-type-body-dense mb-6" style={{ color: LX.textMuted }}>
          This will be removed from the constellation. This action cannot be undone.
        </p>
        <div className="flex items-center gap-2.5">
          <button onClick={onCancel}
            className="flex-1 h-[40px] rounded-[10px] luxia-type-body-dense-strong transition-colors outline-none"
            style={{ color: LX.textMuted, border: `1px solid ${LX.border}`, background: "white" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.subtle; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 h-[40px] rounded-[10px] luxia-type-body-dense-strong text-white hover:opacity-90 transition-opacity outline-none"
            style={{ background: LX.error }}>
            Remove
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ItemPreviewModal({ label, icon: Icon, onClose }: {
  label: string; icon: SectionIcon; onClose: () => void;
}) {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" style={{ backdropFilter: "blur(2px)" }} />
      <div className="relative rounded-[20px] w-[560px] max-h-[70vh] overflow-hidden flex flex-col"
        style={{ background: "white", boxShadow: LX.shadow.xl }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-5 flex-shrink-0" style={{ borderBottom: `1px solid ${LX.border}` }}>
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: LX.blueT10 }}>
            <Icon size={14} color={LX.accent} />
          </div>
          <h3 className="flex-1 luxia-type-title-panel truncate" style={{ color: LX.primary }}>{label}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
            style={{ border: `1px solid ${LX.border}` }}>
            <X size={14} style={{ color: LX.muted }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-6">
          <div className="rounded-[12px] p-4 luxia-type-body-dense"
            style={{ background: LX.subtle, border: `1px solid ${LX.border}`, color: LX.muted }}>
            <p className="font-bold mb-2" style={{ color: LX.primary }}>{label}</p>
            <p>Preview content for this resource would appear here. Connect to your data source to load the full content of this item.</p>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${LX.border}` }}>
          <button onClick={onClose} className="px-5 h-[38px] rounded-[24px] luxia-type-body-dense-strong hover:bg-black/5 transition-colors" style={{ color: LX.muted }}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FileDropZone({ onDrop }: { onDrop: (names: string[]) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-[10px] cursor-pointer transition-all mt-1"
      style={{ border: `1.5px dashed ${over ? LX.accent : LX.border}`, background: over ? `${LX.accent}08` : "transparent" }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const n = Array.from(e.dataTransfer.files).map(f => f.name); if (n.length) onDrop(n); }}
      onClick={() => { const i = document.createElement("input"); i.type = "file"; i.multiple = true; i.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f) onDrop(Array.from(f).map(x => x.name)); }; i.click(); }}>
      <Upload size={13} color={over ? LX.accent : LX.muted} />
      <span className="luxia-type-caption" style={{ color: over ? LX.accent : LX.muted }}>Drop files or click to upload</span>
    </div>
  );
}

function SectionWorkspaceModal({ sectionId, items, instruction, onSave, onClose }: {
  sectionId: SectionId; items: string[]; instruction: string;
  onSave: (items: string[], instruction: string) => void;
  onClose: () => void;
}) {
  const meta = SECTION_META[sectionId];
  const Icon = meta.icon;
  const isInstr = sectionId === "instr";
  const showDrop = sectionId === "pdfFiles";

  const [pendingItems, setPendingItems] = useState<string[]>([...items]);
  const [pendingInstr, setPendingInstr] = useState(instruction);
  const [searchQ, setSearchQ] = useState("");
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [itemMenu, setItemMenu] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemMenu === null) return;
    const close = (e: MouseEvent) => { setItemMenu(null); };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [itemMenu]);

  const filtered = pendingItems.filter(it => it.toLowerCase().includes(searchQ.toLowerCase()));

  function reorder(fromIdx: number, toIdx: number) {
    const next = [...pendingItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setPendingItems(next);
  }

  function removeItem(idx: number) {
    setPendingItems(p => p.filter((_, i) => i !== idx));
    setConfirmRemoveIdx(null);
  }

  const hasChanges = !isInstr
    ? JSON.stringify(pendingItems) !== JSON.stringify(items)
    : pendingInstr !== instruction;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(16,5,32,0.35)", backdropFilter: "blur(4px)" }} />
      <div className="relative w-[700px] max-h-[84vh] rounded-[20px] overflow-hidden flex flex-col"
        style={{ background: "white", boxShadow: "0 12px 32px rgba(15,23,42,0.14)" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center gap-3 px-7 py-5 flex-shrink-0" style={{ borderBottom: `1px solid ${LX.border}` }}>
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(142,99,235,0.08)" }}>
            <Icon size={16} color={LX.secondary} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="luxia-type-title-panel" style={{ color: LX.primary }}>{meta.label}</h2>
            <p className="luxia-type-caption mt-0.5" style={{ color: LX.textMuted }}>Changes are local until saved</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors outline-none"
            style={{ border: `1px solid ${LX.border}` }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <X size={14} style={{ color: LX.textMuted }} />
          </button>
        </div>

        {!isInstr && (
          <div className="flex items-center gap-2 px-6 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${LX.border}` }}>
            <Search size={13} style={{ color: LX.muted }} />
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder={`Search ${meta.label.toLowerCase()}…`}
              className="flex-1 outline-none luxia-type-body-dense bg-transparent"
              style={{ color: LX.primary }} />
            {searchQ && (
              <button onClick={() => setSearchQ("")} className="w-5 h-5 flex items-center justify-center">
                <X size={11} style={{ color: LX.muted }} />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-8 py-5">
          {isInstr ? (
            <textarea value={pendingInstr} onChange={(e) => setPendingInstr(e.target.value)} rows={14}
              className="w-full outline-none resize-none luxia-type-body-small p-4 rounded-[12px]"
              style={{ border: `1px solid ${LX.border}`, color: LX.primary, background: LX.subtle }} />
          ) : (
            <div className="space-y-1.5">
              {filtered.length === 0 && (
                <p className="text-center py-8 luxia-type-body-dense" style={{ color: LX.muted }}>
                  {searchQ ? "No items match your search." : "No items yet. Add one below."}
                </p>
              )}
              {filtered.map((item) => {
                const realIdx = pendingItems.indexOf(item);
                return (
                  <div key={realIdx}
                    draggable
                    onDragStart={() => setDragSrc(realIdx)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(realIdx); }}
                    onDrop={() => { if (dragSrc !== null && dragSrc !== realIdx) reorder(dragSrc, realIdx); setDragSrc(null); setDragOver(null); }}
                    onDragEnd={() => { setDragSrc(null); setDragOver(null); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-[12px] group transition-colors relative"
                    style={{
                      border: `1px solid ${dragOver === realIdx ? LX.accent : LX.border}`,
                      background: dragOver === realIdx ? `${LX.accent}06` : "white",
                    }}>
                    <GripVertical size={14} color="rgba(0,0,0,0.18)" className="cursor-grab flex-shrink-0" />
                    <Icon size={14} color={LX.accent} className="flex-shrink-0" />
                    <span className="flex-1 luxia-type-body-small-strong truncate" style={{ color: LX.primary }}>{item}</span>
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setItemMenu(itemMenu === realIdx ? null : realIdx)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-[7px] hover:bg-black/5 transition-all"
                        style={{ opacity: itemMenu === realIdx ? 1 : undefined }}>
                        <MoreHorizontal size={14} style={{ color: LX.muted }} />
                      </button>
                      {itemMenu === realIdx && (
                        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] py-1.5"
                          style={{ background: "white", boxShadow: LX.shadow.lg, border: `1px solid ${LX.border}`, borderRadius: 14 }}>
                          <button onClick={() => { setItemMenu(null); setPreviewIdx(realIdx); }}
                            className="w-full flex items-center gap-2.5 px-4 luxia-type-body-dense-strong transition-colors text-left"
                            style={{ color: LX.primary, height: 40 }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(218,203,248,0.28)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <Eye size={14} style={{ color: LX.muted }} />View
                          </button>
                          <div className="h-px mx-3 my-1" style={{ background: LX.border }} />
                          <button onClick={() => { setItemMenu(null); setConfirmRemoveIdx(realIdx); }}
                            className="w-full flex items-center gap-2.5 px-4 luxia-type-body-dense-strong transition-colors text-left"
                            style={{ color: LX.error, height: 40 }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(247,80,80,0.07)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <Trash2 size={14} style={{ color: LX.error }} />Remove from Constellation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {!searchQ && showDrop && <FileDropZone onDrop={(names) => setPendingItems(p => [...p, ...names])} />}
              {!searchQ && (
                <button
                  onClick={() => setPendingItems(p => [...p, sectionId === "crawler" ? "https://example.com" : `Item ${p.length + 1}`])}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] luxia-type-body-dense-strong hover:opacity-80 transition-opacity mt-1"
                  style={{ border: `1.5px dashed ${LX.border}`, color: LX.muted }}>
                  <Plus size={14} />{sectionId === "crawler" ? "Add URL" : "Add item"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-7 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${LX.border}` }}>
          <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
            {isInstr ? "" : `${pendingItems.length} item${pendingItems.length !== 1 ? "s" : ""}`}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-5 h-[38px] rounded-[10px] luxia-type-body-dense-strong transition-colors outline-none"
              style={{ color: LX.textMuted, border: `1px solid ${LX.border}` }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.subtle; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              Cancel
            </button>
            <button onClick={() => { onSave(pendingItems, pendingInstr); onClose(); }}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-5 h-[38px] rounded-[10px] luxia-type-body-dense-strong text-white transition-opacity outline-none disabled:opacity-40"
              style={{ background: LX.gradient.button, boxShadow: LX.shadow.sm }}>
              <Check size={13} />Save Changes
            </button>
          </div>
        </div>
      </div>

      {confirmRemoveIdx !== null && (
        <ConfirmRemoveDialog
          label={pendingItems[confirmRemoveIdx]}
          onConfirm={() => removeItem(confirmRemoveIdx)}
          onCancel={() => setConfirmRemoveIdx(null)}
        />
      )}
      {previewIdx !== null && (
        <ItemPreviewModal
          label={pendingItems[previewIdx]}
          icon={Icon}
          onClose={() => setPreviewIdx(null)}
        />
      )}
    </div>,
    document.body,
  );
}

function KBEntryModal({ mode: initialMode, entry, onSave, onAdd, onClose }: {
  mode: "add" | "view" | "edit";
  entry?: KBEntry;
  onSave?: (e: KBEntry) => void;
  onAdd?: (e: KBEntry) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [question, setQuestion] = useState(entry?.question ?? "");
  const [answer, setAnswer] = useState(entry?.answer ?? "");
  const [responseType, setResponseType] = useState(entry?.responseType ?? "narrative");
  const [advanced, setAdvanced] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sqlDraft, setSqlDraft] = useState("");

  const isView = mode === "view";
  const isAdd = mode === "add";
  const typeLabel = KB_RESPONSE_TYPES.find(t => t.id === responseType)?.label ?? "Narrative";
  const sqlDisabled = responseType === "narrative";
  const canSave = question.trim().length > 0 && answer.trim().length > 0;

  function handleGenerateSQL() {
    if (!question.trim() || sqlDisabled) return;
    setGenerating(true);
    setTimeout(() => {
      setSqlDraft(`SELECT content, source, relevance_score\nFROM knowledge_base\nWHERE question ILIKE '%${question.slice(0, 28).replace(/'/g, "''").trim()}%'\n   OR content_vector <-> query_vector < 0.35\nORDER BY relevance_score DESC\nLIMIT 5;`);
      setGenerating(false);
    }, 1100);
  }

  function handleSubmit() {
    if (!canSave) return;
    const updated: KBEntry = { id: entry?.id ?? `kb${Date.now()}`, question: question.trim(), answer: answer.trim(), responseType };
    if (isAdd) { onAdd?.(updated); }
    else { onSave?.(updated); }
    onClose();
  }

  const title = isAdd ? "Add Knowledge Entry" : isView ? "Knowledge Entry" : "Edit Knowledge Entry";
  const submitLabel = isAdd ? "Add" : "Save Changes";

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/35" style={{ backdropFilter: "blur(3px)" }} />
      <div className="relative rounded-[24px] w-[600px] max-h-[90vh] flex flex-col overflow-hidden"
        style={{ background: LX.surface, boxShadow: LX.shadow.xl }} onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center gap-3 px-8 pt-6 pb-5 flex-shrink-0">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: LX.blueT10 }}>
            <BookOpen size={15} color={LX.secondary} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="luxia-type-title-panel" style={{ color: LX.primary }}>{title}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 " aria-label="Close">
            <X size={14} style={{ color: LX.textMuted }} />
          </Button>
        </div>
        <div className="h-px mx-8 flex-shrink-0" style={{ background: LX.border }} />

        <div className="flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-8 py-6 space-y-5">
          <div>
            <label className="luxia-type-metadata mb-2 block" style={{ color: LX.textMuted }}>Question</label>
            {isView ? (
              <p className="luxia-type-body-small-strong px-4 py-3.5 rounded-[12px]"
                style={{ border: `1px solid ${LX.border}`, color: LX.primary, background: LX.subtle }}>{question}</p>
            ) : (
              <input value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. What is Luxia?"
                className="w-full outline-none luxia-type-body-small px-4 py-3.5 rounded-[12px] transition-colors"
                style={{ border: `1px solid ${question ? LX.secondary : LX.border}`, color: LX.primary, background: LX.subtle }} />
            )}
          </div>
          <div>
            <label className="luxia-type-metadata mb-2 block" style={{ color: LX.textMuted }}>Answer</label>
            {isView ? (
              <p className="luxia-type-body-small px-4 py-3.5 rounded-[12px]"
                style={{ border: `1px solid ${LX.border}`, color: LX.primary, background: LX.subtle, whiteSpace: "pre-wrap" }}>{answer}</p>
            ) : (
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write the expected answer…"
                rows={6}
                className="w-full outline-none resize-none luxia-type-body-small px-4 py-3.5 rounded-[12px] transition-colors"
                style={{ border: `1px solid ${answer ? LX.secondary : LX.border}`, color: LX.primary, background: LX.subtle }} />
            )}
          </div>
          <div>
            <button onClick={() => !isView && setAdvanced(p => !p)}
              className="flex items-center gap-1.5 luxia-type-metadata transition-opacity"
              style={{ color: LX.textMuted, opacity: isView ? 0.5 : 1, cursor: isView ? "default" : "pointer" }}>
              <ChevronRight size={12} style={{ transform: advanced ? "rotate(90deg)" : "none", transition: "transform 0.16s" }} />
              Advanced Mode
            </button>
            {(advanced || isView) && (
              <div className="mt-3 space-y-5 rounded-[14px] p-5" style={{ background: LX.subtle, border: `1px solid ${LX.border}` }}>
                <div>
                  <label className="luxia-type-overline-form mb-2.5 block" style={{ color: LX.textMuted }}>Response Type</label>
                  <div className="inline-flex rounded-[10px] overflow-hidden" style={{ border: `1px solid ${LX.border}`, background: LX.surface, opacity: isView ? 0.7 : 1 }}>
                    {KB_RESPONSE_TYPES.map((rt, i) => (
                      <button key={rt.id} onClick={() => !isView && setResponseType(rt.id)}
                        disabled={isView}
                        className="px-4 py-2 luxia-type-metadata transition-all"
                        style={{
                          background: responseType === rt.id ? LX.primary : "transparent",
                          color: responseType === rt.id ? LX.surface : LX.textMuted,
                          borderRight: i < KB_RESPONSE_TYPES.length - 1 ? `1px solid ${LX.border}` : "none",
                          cursor: isView ? "default" : "pointer",
                        }}>{rt.label}</button>
                    ))}
                  </div>
                </div>
                {!isView && (
                  <div>
                    <label className="luxia-type-overline-form mb-2.5 block" style={{ color: LX.textMuted }}>Generate SQL</label>
                    <button onClick={handleGenerateSQL}
                      disabled={!question.trim() || generating || sqlDisabled}
                      className="flex items-center gap-2 px-4 h-[34px] rounded-[10px] luxia-type-metadata transition-opacity disabled:opacity-35"
                      style={{ background: sqlDisabled ? LX.borderStrong : LX.primary, color: LX.surface }}>
                      <LuxiaAiIcon size={12} />{generating ? "Generating…" : "Generate SQL"}
                    </button>
                    {sqlDisabled && (
                      <p className="luxia-type-caption mt-1.5" style={{ color: LX.textMuted }}>Available for Table, Chart, KPI, and List types only.</p>
                    )}
                    {sqlDraft && !sqlDisabled && (
                      <div className="mt-3">
                        <label className="luxia-type-overline-form mb-1.5 block" style={{ color: LX.textMuted }}>SQL Editor</label>
                        <textarea value={sqlDraft} onChange={(e) => setSqlDraft(e.target.value)} rows={5}
                          className="w-full outline-none resize-none luxia-type-metadata font-mono px-3.5 py-3 rounded-[10px]"
                          style={{ border: `1px solid ${LX.border}`, color: LX.primary, background: LX.surface }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-8 py-5 flex-shrink-0" style={{ borderTop: `1px solid ${LX.border}` }}>
          {isView ? (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button type="button" variant="primary" onClick={() => setMode("edit")}>
                <Edit3 size={16} aria-hidden />
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleSubmit} disabled={!canSave}>
                <Check size={16} aria-hidden />
                {submitLabel}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AutoKBModal({ constellationLabel, onAdd, onClose }: {
  constellationLabel: string; onAdd: (entries: KBEntry[]) => void; onClose: () => void;
}) {
  const [count, setCount] = useState(5);
  const [lang, setLang] = useState("EN");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<KBEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function handleGenerate() {
    setGenerating(true);
    setGenerated([]);
    setSelected(new Set());
    setTimeout(() => {
      const slice = KB_AUTO_SAMPLES.slice(0, count).map(e => ({ ...e, id: `auto${Date.now()}${Math.random().toString(36).slice(2, 6)}` }));
      setGenerated(slice);
      setSelected(new Set(slice.map(e => e.id)));
      setGenerating(false);
    }, 1400);
  }

  function toggleSelect(id: string) {
    setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const selectedEntries = generated.filter(e => selected.has(e.id));

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/35" style={{ backdropFilter: "blur(3px)" }} />
      <div className="relative rounded-[24px] w-[640px] max-h-[86vh] flex flex-col overflow-hidden"
        style={{ background: LX.surface, boxShadow: LX.shadow.xl }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-7 py-5 flex-shrink-0" style={{ borderBottom: `1px solid ${LX.border}` }}>
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${LX.blueT10} 0%, ${LX.sl10} 100%)` }}>
            <LuxiaAiIcon size={15} color={LX.secondary} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="luxia-type-title-panel" style={{ color: LX.primary }}>Auto-generate Knowledge</h2>
            <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>From <span className="font-bold">{constellationLabel}</span></p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 " aria-label="Close">
            <X size={14} style={{ color: LX.textMuted }} />
          </Button>
        </div>
        <div className="flex items-center gap-4 px-7 py-3.5 flex-shrink-0" style={{ borderBottom: `1px solid ${LX.border}` }}>
          <div className="flex items-center gap-2">
            <span className="luxia-type-metadata" style={{ color: LX.primary }}>Entries</span>
            <div className="flex gap-1">
              {[3, 5, 10].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  className="w-9 h-8 rounded-[8px] luxia-type-metadata transition-all"
                  style={{ background: count === n ? LX.secondary : LX.surface, color: count === n ? LX.surface : LX.textMuted, border: `1px solid ${count === n ? LX.secondary : LX.border}` }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="luxia-type-metadata" style={{ color: LX.primary }}>Language</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}
              className="h-8 px-2.5 rounded-[8px] luxia-type-metadata outline-none"
              style={{ border: `1px solid ${LX.border}`, color: LX.primary, background: LX.surface }}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex-1" />
          <Button type="button" variant="primary" size="compact" onClick={handleGenerate} disabled={generating}>
            <LuxiaAiIcon size={14} aria-hidden />
            {generating ? "Generating…" : "Generate"}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-7 py-5">
          {generating && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-9 h-9 rounded-full border-2 animate-spin"
                style={{ borderColor: `${LX.secondary} transparent ${LX.secondary} ${LX.secondary}` }} />
              <p className="luxia-type-body-dense-strong" style={{ color: LX.textMuted }}>Generating Knowledge Entries…</p>
            </div>
          )}
          {!generating && generated.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <LuxiaAiIcon size={28} style={{ color: `${LX.textMuted}55` }} />
              <p className="luxia-type-body-dense" style={{ color: LX.textMuted }}>Configure above, then click Generate</p>
            </div>
          )}
          {!generating && generated.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>{selected.size} of {generated.length} selected</p>
                <button onClick={() => setSelected(selected.size === generated.length ? new Set() : new Set(generated.map(e => e.id)))}
                  className="luxia-type-metadata hover:opacity-80 transition-opacity" style={{ color: LX.secondary }}>
                  {selected.size === generated.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              {generated.map(entry => {
                const checked = selected.has(entry.id);
                return (
                  <button key={entry.id} onClick={() => toggleSelect(entry.id)}
                    className="w-full flex items-start gap-3 px-4 py-3.5 rounded-[14px] text-left transition-all"
                    style={{ background: checked ? LX.state.secondary08 : LX.surface, border: `1px solid ${checked ? LX.secondary : LX.border}`, boxShadow: checked ? LX.shadow.xs : "none" }}>
                    <div className="w-4 h-4 rounded-[5px] flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                      style={{ background: checked ? LX.secondary : LX.surface, border: `1.5px solid ${checked ? LX.secondary : LX.border}` }}>
                      {checked && <Check size={9} color={LX.surface} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>{entry.question}</p>
                      <p className="luxia-type-metadata mt-0.5 truncate" style={{ color: LX.textMuted }}>{entry.answer}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2.5 px-7 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${LX.border}` }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => { if (selectedEntries.length > 0) { onAdd(selectedEntries); onClose(); } }}
            disabled={selectedEntries.length === 0}
          >
            <Plus size={16} aria-hidden />
            Add {selectedEntries.length > 0 ? `${selectedEntries.length} ` : ""}Selected
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function KBWorkspaceModal({ entries, constellationLabel, onSave, onClose }: {
  entries: KBEntry[]; constellationLabel: string;
  onSave: (entries: KBEntry[]) => void; onClose: () => void;
}) {
  const [pending, setPending] = useState<KBEntry[]>([...entries]);
  const [searchQ, setSearchQ] = useState("");
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [itemMenu, setItemMenu] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<KBEntry | null>(null);
  const [editEntry, setEditEntry] = useState<KBEntry | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    const close = () => setItemMenu(null);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  const filtered = pending.filter(e =>
    e.question.toLowerCase().includes(searchQ.toLowerCase()) ||
    e.answer.toLowerCase().includes(searchQ.toLowerCase())
  );

  function reorder(from: number, to: number) {
    const next = [...pending]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); setPending(next);
  }
  function removeEntry(id: string) { setPending(p => p.filter(e => e.id !== id)); setConfirmRemoveId(null); }
  function updateEntry(updated: KBEntry) { setPending(p => p.map(e => e.id === updated.id ? updated : e)); }

  const hasChanges = JSON.stringify(pending) !== JSON.stringify(entries);

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40" style={{ backdropFilter: "blur(4px)" }} />
        <div className="relative w-[760px] max-h-[88vh] rounded-[24px] overflow-hidden flex flex-col"
          style={{ background: LX.surface, boxShadow: LX.shadow.xl }} onClick={(e) => e.stopPropagation()}>

          <div className="flex items-center gap-4 px-8 py-6 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="luxia-type-heading-h4 leading-none" style={{ color: LX.primary }}>Knowledge Base</h2>
              <p className="luxia-type-body-dense mt-1" style={{ color: LX.textMuted }}>
                {constellationLabel} · {pending.length} {pending.length === 1 ? "entry" : "entries"}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 " aria-label="Close knowledge base">
              <X size={15} style={{ color: LX.textMuted }} />
            </Button>
          </div>

          <div className="flex items-center gap-2.5 px-8 pb-5 flex-shrink-0">
            <div className="flex-1 flex items-center gap-2 px-3.5 h-[38px] rounded-[12px]"
              style={{ border: `1px solid ${LX.border}`, background: LX.subtle }}>
              <Search size={13} style={{ color: LX.textMuted }} />
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search questions and answers…"
                className="flex-1 outline-none luxia-type-body-dense bg-transparent" style={{ color: LX.primary }} />
              {searchQ && (
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSearchQ("")} aria-label="Clear search">
                  <X size={11} style={{ color: LX.textMuted }} />
                </Button>
              )}
            </div>
            <Button type="button" variant="outline" onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".csv"; i.click(); }}
              className="h-[38px] rounded-[12px] px-3.5 luxia-type-metadata" style={{ color: LX.textMuted }}>
              <Upload size={12} />Import CSV
            </Button>
            <Button type="button" variant="outline" onClick={() => setAutoOpen(true)}
              className="h-[38px] rounded-[12px] px-3.5 luxia-type-metadata" style={{ color: LX.secondary }}>
              <LuxiaAiIcon size={12} />Auto-generate
            </Button>
            <Button type="button" onClick={() => setAddOpen(true)}
              className="h-[38px] rounded-[12px] px-4 luxia-type-metadata text-white hover:opacity-90"
              style={{ background: LX.gradient.button, boxShadow: LX.shadow.sm }}>
              <Plus size={13} />Add Entry
            </Button>
          </div>

          <div className="h-px mx-8 flex-shrink-0" style={{ background: LX.border }} />

          <div className="flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-8 py-5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <BookOpen size={32} style={{ color: `${LX.textMuted}44` }} />
                <p className="luxia-type-body-small" style={{ color: LX.textMuted }}>
                  {searchQ ? "No entries match your search." : "No entries yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((entry) => {
                  const realIdx = pending.findIndex(e => e.id === entry.id);
                  const typeLabel = KB_RESPONSE_TYPES.find(t => t.id === entry.responseType)?.label;
                  const isMenuOpen = itemMenu === entry.id;
                  return (
                    <div key={entry.id}
                      draggable={!searchQ}
                      onDragStart={() => setDragSrc(realIdx)}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(realIdx); }}
                      onDrop={() => { if (dragSrc !== null && dragSrc !== realIdx) reorder(dragSrc, realIdx); setDragSrc(null); setDragOver(null); }}
                      onDragEnd={() => { setDragSrc(null); setDragOver(null); }}
                      className="flex items-start gap-3.5 px-5 py-4 rounded-[16px] group relative transition-all"
                      style={{
                        border: `1px solid ${dragOver === realIdx ? LX.secondary : LX.border}`,
                        background: dragOver === realIdx ? LX.state.secondary04 : LX.surface,
                      }}>
                      {!searchQ && <GripVertical size={14} color={LX.borderStrong} className="cursor-grab flex-shrink-0 mt-1" />}
                      <div className="flex-1 min-w-0">
                        <p className="luxia-type-title-component leading-snug mb-1.5" style={{ color: LX.primary }}>{entry.question}</p>
                        <p className="luxia-type-body-dense" style={{
                          color: LX.textMuted,
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        } as React.CSSProperties}>{entry.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" onClick={() => setItemMenu(isMenuOpen ? null : entry.id)}
                                className="h-7 w-7 rounded-[8px]" aria-label="Entry actions">
                                <MoreHorizontal size={14} style={{ color: LX.textMuted }} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={6}>Actions</TooltipContent>
                          </Tooltip>
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[168px] py-1.5"
                              style={{ background: LX.surface, boxShadow: LX.shadow.lg, border: `1px solid ${LX.border}`, borderRadius: 14 }}
                              onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { setItemMenu(null); setPreviewEntry(entry); }}
                                className="w-full flex items-center gap-2.5 px-4 luxia-type-body-dense-strong transition-colors text-left"
                                style={{ color: LX.primary, height: 40 }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.state.menuHover; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <Eye size={14} style={{ color: LX.textMuted }} />View</button>
                              <button onClick={() => { setItemMenu(null); setEditEntry(entry); }}
                                className="w-full flex items-center gap-2.5 px-4 luxia-type-body-dense-strong transition-colors text-left"
                                style={{ color: LX.primary, height: 40 }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.state.menuHover; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <Edit3 size={14} style={{ color: LX.textMuted }} />Edit</button>
                              <div className="h-px mx-3 my-1" style={{ background: LX.border }} />
                              <button onClick={() => { setItemMenu(null); setConfirmRemoveId(entry.id); }}
                                className="w-full flex items-center gap-2.5 px-4 luxia-type-body-dense-strong transition-colors text-left"
                                style={{ color: LX.error, height: 40 }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.state.error07; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <Trash2 size={14} style={{ color: LX.error }} />Remove</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-8 py-5 flex-shrink-0" style={{ borderTop: `1px solid ${LX.border}` }}>
            <span className="luxia-type-body-dense" style={{ color: LX.textMuted }}>
              {pending.length} {pending.length === 1 ? "entry" : "entries"}
            </span>
            <div className="flex items-center gap-2.5">
              <Button type="button" variant="secondary" onClick={onClose} className="h-[40px] rounded-[12px] px-5 luxia-type-body-dense-strong" style={{ color: LX.textMuted }}>
                Cancel
              </Button>
              <Button type="button" onClick={() => { onSave(pending); onClose(); }} disabled={!hasChanges}
                className="h-[40px] rounded-[12px] px-5 luxia-type-body-dense-strong text-white disabled:opacity-40"
                style={{ background: LX.gradient.button, boxShadow: LX.shadow.sm }}>
                <Check size={14} />Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {confirmRemoveId && (
        <ConfirmRemoveDialog
          label={pending.find(e => e.id === confirmRemoveId)?.question ?? ""}
          onConfirm={() => removeEntry(confirmRemoveId)}
          onCancel={() => setConfirmRemoveId(null)}
        />
      )}
      {previewEntry && (
        <KBEntryModal mode="view" entry={previewEntry}
          onSave={(e) => { updateEntry(e); setPreviewEntry(null); }}
          onClose={() => setPreviewEntry(null)} />
      )}
      {editEntry && (
        <KBEntryModal mode="edit" entry={editEntry}
          onSave={(e) => { updateEntry(e); setEditEntry(null); }}
          onClose={() => setEditEntry(null)} />
      )}
      {addOpen && (
        <KBEntryModal mode="add"
          onAdd={(e) => setPending(p => [...p, e])}
          onClose={() => setAddOpen(false)} />
      )}
      {autoOpen && <AutoKBModal constellationLabel={constellationLabel} onAdd={(es) => setPending(p => [...p, ...es])} onClose={() => setAutoOpen(false)} />}
    </>,
    document.body,
  );
}

function KBSidebarSection({ entries, isOpen, onToggle, onExpand, onAdd, onView, onEdit, onRemove }: {
  entries: KBEntry[]; isOpen: boolean;
  onToggle: () => void; onExpand: () => void; onAdd: () => void;
  onView: (id: string) => void; onEdit: (id: string) => void; onRemove: (id: string) => void;
}) {
  const [searchQ, setSearchQ] = useState("");

  const filtered = entries.filter(e => e.question.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <div className="overflow-hidden rounded-[14px]"
      style={icCardStyle(isOpen)}>
      <div className={IC_CARD_HEADER}>
        <BookOpen size={14} color={IC.iconSemantic} className="flex-shrink-0" />
        <span className="flex-1 luxia-type-title-component truncate" style={{ color: IC.iconSemantic }}>Knowledge Base</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={(e) => { e.stopPropagation(); onExpand(); }}
              className={IC_BTN_OPEN}
              aria-label="Open Knowledge Base settings"
              onMouseEnter={icHoverOn}
              onMouseLeave={icHoverOff}
              onMouseDown={icOpenActiveOn}
              onMouseUp={icHoverOn}>
              <SquareArrowOutUpRight size={14} strokeWidth={2} style={{ color: IC.textMuted }} aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>Open Knowledge Base settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onToggle}
              className={IC_BTN_ICON}
              aria-label={isOpen ? "Collapse" : "Expand"}
              onMouseEnter={icHoverOn}
              onMouseLeave={icHoverOff}>
              <ChevronDown size={15} style={{ color: IC.textMuted, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} />
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>{isOpen ? "Collapse" : "Expand"}</TooltipContent>
        </Tooltip>
      </div>

      {isOpen && (
        <div className="px-2 pb-2.5" style={{ borderTop: `1px solid ${IC.borderSubtle}` }}>
          <div
            className={IC_SEARCH_SHELL}
            style={IC_SEARCH_SHELL_STYLE}
            onMouseEnter={icSearchShellHoverOn}
            onMouseLeave={icSearchShellHoverOff}
          >
            <Search size={10} style={{ color: IC.inputIcon }} />
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search…"
              className={`flex-1 ${IC_INPUT_TEXT}`} style={{ color: IC.textPrimary }}
              onFocus={icSearchShellFocus}
              onBlur={icSearchShellBlur} />
            {searchQ && (
              <button onClick={() => setSearchQ("")} className="w-4 h-4 flex items-center justify-center outline-none">
                <X size={9} style={{ color: IC.inputIcon }} />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="px-2 py-2 luxia-type-caption" style={{ color: IC.textMuted }}>
              {searchQ ? "No matches." : "No entries yet."}
            </p>
          ) : (
            filtered.map(entry => (
              <div key={entry.id}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] relative"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = IC.hover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <BookOpen size={10} color={IC.iconSemantic} className="flex-shrink-0" />
                <span className="flex-1 luxia-type-caption truncate" style={{ color: IC.textPrimary }}>{entry.question}</span>
                <KBEntryMenu
                  onView={() => onView(entry.id)}
                  onEdit={() => onEdit(entry.id)}
                  onRemove={() => onRemove(entry.id)}
                />
              </div>
            ))
          )}

          <button onClick={onAdd}
            className="mt-1 w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] luxia-type-caption transition-colors outline-none"
            style={{ color: IC.textMuted }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = IC.hover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <Plus size={10} />Add Entry
          </button>
        </div>
      )}
    </div>
  );
}

const CONSTELLATION_MENU_ID = "luxia-constellation-selector-listbox";
const CONSTELLATION_MENU_WIDTH = 244;
const CONSTELLATION_MENU_MIN_WIDTH = 220;
const CONSTELLATION_MENU_GAP = 8;

function ConstellationSelector({
  constellation,
  options,
  onChange,
  disabled = false,
  forceClosed = false,
}: {
  constellation: Constellation;
  options: Constellation[];
  onChange: (id: string) => void;
  disabled?: boolean;
  forceClosed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filtered = useMemo(
    () => options.filter((c) => c.label.toLowerCase().includes(searchQ.toLowerCase())),
    [options, searchQ],
  );

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    setSearchQ("");
    setMenuPos(null);
    setFocusIndex(-1);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const positionMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const width = Math.max(
      CONSTELLATION_MENU_MIN_WIDTH,
      Math.min(CONSTELLATION_MENU_WIDTH, window.innerWidth - 16),
    );
    let left = r.left;
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
    if (left < 8) left = 8;

    const estimatedHeight = Math.min(280, 52 + Math.max(filtered.length, 1) * 44 + 8);
    const spaceBelow = window.innerHeight - r.bottom - CONSTELLATION_MENU_GAP;
    const spaceAbove = r.top - CONSTELLATION_MENU_GAP;
    const openUpward = spaceBelow < Math.min(220, estimatedHeight) && spaceAbove > spaceBelow;

    if (openUpward) {
      setMenuPos({
        bottom: window.innerHeight - r.top + CONSTELLATION_MENU_GAP,
        left,
        width,
      });
    } else {
      setMenuPos({
        top: r.bottom + CONSTELLATION_MENU_GAP,
        left,
        width,
      });
    }
  }, [filtered.length]);

  function openMenu() {
    if (disabled) return;
    positionMenu();
    setOpen(true);
    setFocusIndex(-1);
  }

  useEffect(() => {
    if (forceClosed) closeMenu(false);
  }, [forceClosed, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    setFocusIndex(-1);
  }, [searchQ]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu(true);
        return;
      }
      if (filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((prev) => {
          const next = prev < filtered.length - 1 ? prev + 1 : 0;
          optionRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((prev) => {
          const next = prev <= 0 ? filtered.length - 1 : prev - 1;
          optionRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === "Home") {
        e.preventDefault();
        setFocusIndex(0);
        optionRefs.current[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        const last = filtered.length - 1;
        setFocusIndex(last);
        optionRefs.current[last]?.focus();
      } else if (e.key === "Enter" && focusIndex >= 0 && filtered[focusIndex]) {
        e.preventDefault();
        onChange(filtered[focusIndex].id);
        closeMenu(true);
      }
    }

    function onReposition() {
      positionMenu();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => onReposition())
      : null;
    if (triggerRef.current) resizeObserver?.observe(triggerRef.current);
    const inspectorEl = triggerRef.current?.closest("aside");
    if (inspectorEl) resizeObserver?.observe(inspectorEl);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
      resizeObserver?.disconnect();
    };
  }, [open, filtered, focusIndex, closeMenu, onChange, positionMenu]);

  function selectConstellation(id: string) {
    onChange(id);
    closeMenu(true);
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label="Change Constellation"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={CONSTELLATION_MENU_ID}
            disabled={disabled}
            onClick={() => (open ? closeMenu(false) : openMenu())}
            onMouseEnter={() => setTriggerHovered(true)}
            onMouseLeave={() => setTriggerHovered(false)}
            className="inline-flex max-w-full min-w-0 items-center justify-start gap-1.5 overflow-hidden text-left luxia-type-title-panel disabled:cursor-default disabled:opacity-100 outline-none focus-visible:outline-none rounded-[8px]"
            style={{
              color: "var(--luxia-text-inverse)",
              background: "transparent",
              transition: "background-color 140ms ease, box-shadow 140ms ease",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = IC.focusRing;
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <span className="min-w-0 flex-1 overflow-hidden text-left" title={constellation.label}>
              <span className="block min-w-0 truncate text-left">{constellation.label}</span>
            </span>
            <ConstellationSourceBadge
              type={constellation.type}
              className="pointer-events-none flex-shrink-0 select-none"
            />
            <ChevronDown
              size={14}
              strokeWidth={2.2}
              aria-hidden
              className="flex-shrink-0"
              style={{ color: triggerHovered && !disabled ? "rgba(255, 255, 255, 0.78)" : IC.textMuted }}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>Change Constellation</TooltipContent>
      </Tooltip>

      {open && menuPos && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] rounded-[14px] overflow-hidden"
          style={{
            top: menuPos.top,
            bottom: menuPos.bottom,
            left: menuPos.left,
            width: menuPos.width,
            background: "white",
            boxShadow: LX.shadow.lg,
            border: `1px solid ${LX.border}`,
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ borderBottom: `1px solid ${LX.borderSubtle}` }}
          >
            <Search size={12} style={{ color: LX.textMuted, flexShrink: 0 }} aria-hidden="true" />
            <input
              ref={searchRef}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search constellations…"
              aria-label="Search constellations"
              aria-controls={CONSTELLATION_MENU_ID}
              className="flex-1 outline-none luxia-type-body-dense bg-transparent"
              style={{ color: LX.primary }}
            />
          </div>
          <div
            id={CONSTELLATION_MENU_ID}
            role="listbox"
            aria-label="Constellations"
            className="py-1 max-h-[200px] overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical"
          >
            {filtered.length === 0 ? (
              <p className="px-4 py-3 luxia-type-metadata" style={{ color: LX.textMuted }}>No results</p>
            ) : (
              filtered.map((c, index) => {
                const cs = CONSTELLATION_STYLE[c.type];
                const selected = c.id === constellation.id;
                const focused = index === focusIndex;
                return (
                  <button
                    key={c.id}
                    ref={(el) => { optionRefs.current[index] = el; }}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={focused ? 0 : -1}
                    onClick={() => selectConstellation(c.id)}
                    onMouseEnter={() => setFocusIndex(index)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left outline-none"
                    style={{ background: focused ? LX.subtle : "transparent" }}
                  >
                    <div
                      className="w-5 h-5 rounded-[5px] flex items-center justify-center flex-shrink-0"
                      style={{ background: cs.bg, border: `1px solid ${cs.border}` }}
                    >
                      {c.type === "database"
                        ? <Database size={10} color={cs.color} />
                        : c.type === "csv"
                          ? <Table2 size={10} color={cs.color} />
                          : <FileText size={10} color={cs.color} />}
                    </div>
                    <span
                      className="flex-1 min-w-0 luxia-type-profile-secondary truncate"
                      style={{ color: selected ? LX.accent : LX.primary }}
                    >
                      <ConstellationNameWithSource
                        label={c.label}
                        type={c.type}
                        labelClassName="truncate"
                      />
                    </span>
                    {selected ? <Check size={11} style={{ color: LX.accent, flexShrink: 0 }} /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function ConstellationSidebar({
  width,
  onResizeStart,
  collapsed,
  onCollapse,
  constellation,
  allConstellations,
  onConstellationChange,
  onOpenConstellationSettings,
  projectId,
  allowConstellationChange,
  isGalaxyChat,
}: {
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  collapsed: boolean;
  onCollapse: () => void;
  constellation: Constellation;
  allConstellations: Constellation[];
  onConstellationChange: (id: string) => void;
  onOpenConstellationSettings?: (projectId: string, constellationId: string) => void;
  projectId: string;
  allowConstellationChange: boolean;
  isGalaxyChat: boolean;
}) {
  const sectionIds = CONSTELLATION_SECTIONS[constellation.type];

  const initItems = () => Object.fromEntries(sectionIds.map(id => [id, [...(SECTION_DEFAULTS[id] ?? [])]])) as Record<SectionId, string[]>;
  const [items, setItems] = useState<Record<SectionId, string[]>>(initItems);
  const [instruction, setInstruction] = useState(SECTION_INSTRUCTION[constellation.type]);
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>(
    Object.fromEntries(sectionIds.map((id) => [id, false])) as Record<SectionId, boolean>
  );

  const [descExpanded, setDescExpanded] = useState(false);

  const [modalSection, setModalSection] = useState<SectionId | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ sid: SectionId; idx: number } | null>(null);
  const [previewItem, setPreviewItem] = useState<{ sid: SectionId; idx: number } | null>(null);

  const [kbEntries, setKbEntries] = useState<KBEntry[]>(KB_DEFAULTS);
  const [kbWorkspaceOpen, setKbWorkspaceOpen] = useState(false);
  const [kbAddOpen, setKbAddOpen] = useState(false);
  const [kbConfirmId, setKbConfirmId] = useState<string | null>(null);
  const [kbViewId, setKbViewId] = useState<string | null>(null);
  const [kbEditId, setKbEditId] = useState<string | null>(null);

  const [dragSrc, setDragSrc] = useState<{ sid: SectionId; i: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ sid: SectionId; i: number } | null>(null);

  const [sectionSignatures, setSectionSignatures] = useState<Record<string, string>>({});
  const [savedConstellationSnapshot, setSavedConstellationSnapshot] = useState<string | null>(null);
  const [constellationSaving, setConstellationSaving] = useState(false);
  const [constellationFeedback, setConstellationFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const registerSectionSignature = useCallback((sectionId: string, signature: string) => {
    setSectionSignatures((prev) => (prev[sectionId] === signature ? prev : { ...prev, [sectionId]: signature }));
  }, []);

  const kbSignature = useMemo(
    () => JSON.stringify(kbEntries.map((e) => ({ id: e.id, question: e.question, answer: e.answer, responseType: e.responseType }))),
    [kbEntries],
  );

  const currentConstellationSnapshot = useMemo(
    () => JSON.stringify({ kb: kbSignature, sections: sectionSignatures }),
    [kbSignature, sectionSignatures],
  );

  useEffect(() => {
    setSectionSignatures({});
    setSavedConstellationSnapshot(null);
    setConstellationFeedback(null);
  }, [constellation.id]);

  useEffect(() => {
    if (savedConstellationSnapshot === null) {
      const timer = window.setTimeout(() => setSavedConstellationSnapshot(currentConstellationSnapshot), 150);
      return () => window.clearTimeout(timer);
    }
  }, [savedConstellationSnapshot, currentConstellationSnapshot, constellation.id]);

  const constellationDirty = savedConstellationSnapshot !== null && currentConstellationSnapshot !== savedConstellationSnapshot;

  function saveConstellation() {
    if (!constellationDirty || constellationSaving) return;
    setConstellationSaving(true);
    setConstellationFeedback(null);
    window.setTimeout(() => {
      setSavedConstellationSnapshot(currentConstellationSnapshot);
      setConstellationSaving(false);
      setConstellationFeedback({ type: "success", message: "Constellation saved." });
      window.setTimeout(() => setConstellationFeedback(null), 2500);
    }, 600);
  }

  function updateItems(sid: SectionId, next: string[]) {
    setItems(prev => ({ ...prev, [sid]: next }));
  }

  function handleDrop(sid: SectionId, targetIdx: number) {
    if (!dragSrc || dragSrc.sid !== sid || dragSrc.i === targetIdx) return;
    const next = [...items[sid]];
    const [moved] = next.splice(dragSrc.i, 1);
    next.splice(targetIdx, 0, moved);
    updateItems(sid, next);
    setDragSrc(null); setDragOver(null);
  }

  const projectConstellations = useMemo(
    () => allConstellations.filter((c) => c.projectId === projectId),
    [allConstellations, projectId],
  );

  function expandToSection(sid: SectionId) {
    setOpenSections((prev) => {
      const next = { ...prev } as Record<SectionId, boolean>;
      for (const id of sectionIds) next[id] = id === sid;
      return next;
    });
    onCollapse();
  }

  const railHit =
    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] outline-none focus-visible:outline-none transition-colors";
  const expandHit =
    "mt-px flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] outline-none focus-visible:outline-none";

  if (collapsed) {
    return (
      <div
        className="flex h-full min-h-0 flex-shrink-0 flex-col self-stretch"
        style={{
          width: CONSTELLATION_COLLAPSED_WIDTH + GALAXY_PANEL_OUTER_GAP * 2,
          padding: GALAXY_PANEL_OUTER_GAP,
          boxSizing: "border-box",
          ...icInspectorAccentStyle(constellation.type),
        }}
        data-luxia-inspector="capsule-collapsed"
        data-constellation-type={constellation.type}
      >
        <aside
          className="relative flex min-h-0 flex-1 flex-col items-center overflow-hidden outline-none"
          style={{
            width: CONSTELLATION_COLLAPSED_WIDTH,
            minWidth: CONSTELLATION_COLLAPSED_WIDTH,
            minHeight: 40,
            borderRadius: "var(--luxia-radius-24)",
            backgroundColor: IC.shell,
            backgroundImage: IC.shellGradient,
            border: `1px solid ${IC.shellBorder}`,
            boxShadow: IC.shellShadow,
          }}
        >
          <div className="flex w-full flex-shrink-0 items-start justify-center px-1.5 pt-3 pb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onCollapse}
                  aria-label="Expand Constellation inspector"
                  aria-expanded={false}
                  className={expandHit}
                  style={{
                    background: "transparent",
                    color: IC.textMuted,
                    transition: "background-color 140ms ease, box-shadow 140ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = IC.hover;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = IC.focusRing;
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <ChevronLeft size={15} strokeWidth={2.2} aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8}>Expand inspector</TooltipContent>
            </Tooltip>
          </div>

          <div className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical px-1.5 pb-3">
            <div className="flex flex-col items-center gap-2 pt-1">
              {sectionIds.map((id) => {
                const Icon = SECTION_META[id].icon;
                const label = SECTION_META[id].label;
                return (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => expandToSection(id)}
                        aria-label={`Open ${label}`}
                        className={railHit}
                        style={{ background: "transparent", color: IC.iconSemantic }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = IC.hover;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = IC.focusRing;
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        }}
                      >
                        <Icon size={17} strokeWidth={2} aria-hidden color="currentColor" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={8}>{label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-shrink-0 flex-col self-stretch"
      style={{
        width,
        padding: IC.gap,
        boxSizing: "border-box",
        ...icInspectorAccentStyle(constellation.type),
      }}
      data-luxia-inspector="capsule"
      data-constellation-type={constellation.type}
    >
    <aside
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{
        width: "100%",
        borderRadius: IC.radiusShell,
        backgroundColor: IC.shell,
        backgroundImage: IC.shellGradient,
        border: `1px solid ${IC.shellBorder}`,
        boxShadow: IC.shellShadow,
      }}
    >

      <div className="absolute left-0 top-0 h-full w-[5px] z-20 cursor-col-resize group" onMouseDown={onResizeStart}>
        <div className="absolute inset-y-0 left-0 w-[3px] group-hover:bg-[var(--luxia-brand-secondary)]/30 transition-colors" />
      </div>

      <div
        className="relative flex-shrink-0 overflow-hidden px-5 pt-3 pb-2.5"
        style={{ background: IC.header, borderBottom: `1px solid ${IC.headerDivider}` }}
      >
        <div className="flex min-w-0 items-start gap-3 overflow-hidden">
          <div className="relative min-w-0 flex-1 overflow-hidden text-left">
            {isGalaxyChat ? (
              <div className="min-w-0 overflow-hidden text-left">
                <div
                  className="min-w-0 luxia-type-body-dense-strong text-left"
                  style={{ color: icInspectorTitleColor("galaxy"), letterSpacing: "-0.01em" }}
                >
                  <span className="min-w-0 truncate block text-left">Galaxy chat</span>
                </div>
                <p className="mt-0.5 truncate luxia-type-caption leading-4" style={{ color: IC.textSubtitle }}>
                  Uses all constellations in this project
                </p>
              </div>
            ) : (
              <ConstellationSelector
                constellation={constellation}
                options={projectConstellations}
                onChange={onConstellationChange}
                disabled={!allowConstellationChange}
                forceClosed={collapsed}
              />
            )}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Collapse Constellation inspector"
                aria-expanded={true}
                className="mt-px flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] outline-none focus-visible:outline-none"
                style={{
                  background: "transparent",
                  color: IC.textMuted,
                  transition: "background-color 140ms ease, box-shadow 140ms ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = IC.hover;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  el.style.boxShadow = "none";
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = IC.focusRing;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Collapse inspector</TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-4">
          <p
            className="luxia-type-caption"
            style={{
              color: isGalaxyChat ? IC.textPrimary : icInspectorDescriptionColor(constellation.type),
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: descExpanded ? "unset" : 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.45,
            } as React.CSSProperties}
          >
            {constellation.description}
          </p>
          <div
            className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
            style={{ color: isGalaxyChat ? IC.textPrimary : IC.iconSemantic }}
          >
            <button
              type="button"
              onClick={() => setDescExpanded((p) => !p)}
              className="luxia-type-caption min-h-7 hover:opacity-80 transition-opacity outline-none focus-visible:underline"
              style={{ color: "inherit" }}
              aria-expanded={descExpanded}
              aria-label={descExpanded ? "Read less Constellation description" : "Read more Constellation description"}
            >
              {descExpanded ? "Read less" : "Read more"}
            </button>
            {!isGalaxyChat ? (
              <>
                <span className="luxia-type-caption select-none" style={{ color: IC.textMuted }} aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  className="luxia-type-caption min-h-7 hover:opacity-80 transition-opacity outline-none focus-visible:underline"
                  style={{ color: "inherit" }}
                  aria-label="Open Constellation"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const settingsProjectId = constellation.projectId || projectId;
                    const settingsConstellationId = constellation.id;
                    if (!settingsProjectId || !settingsConstellationId) return;
                    if (settingsConstellationId === "constellation-unavailable") return;
                    onOpenConstellationSettings?.(settingsProjectId, settingsConstellationId);
                  }}
                >
                  Open Constellation
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-dark luxia-scrollbar-vertical galaxy-panel-scroll px-5 pt-5 pb-2.5 space-y-2"
      >
        {sectionIds.map((sid) => {
          const meta = SECTION_META[sid];
          const Icon = meta.icon;
          const isOpen = openSections[sid];

          if (sid === "dataTable") {
            return (
              <ActiveDataTablesSection
                key="dataTable"
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, dataTable: !p.dataTable }))}
                onSignatureChange={(sig) => registerSectionSignature("dataTable", sig)}
              />
            );
          }

          if (sid === "contextFiles") {
            return (
              <ExtraContextFilesSection
                key="contextFiles"
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, contextFiles: !p.contextFiles }))}
                onSignatureChange={(sig) => registerSectionSignature("contextFiles", sig)}
              />
            );
          }

          if (sid === "relationship") {
            return (
              <RelationshipSection
                key="relationship"
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, relationship: !p.relationship }))}
                onSignatureChange={(sig) => registerSectionSignature("relationship", sig)}
              />
            );
          }

          if (sid === "metrics") {
            return (
              <MetricsSection
                key="metrics"
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, metrics: !p.metrics }))}
                onSignatureChange={(sig) => registerSectionSignature("metrics", sig)}
              />
            );
          }

          if (sid === "instr") {
            return (
              <InstructionSection
                key={constellation.id}
                defaultInstruction={SECTION_INSTRUCTION[constellation.type]}
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, instr: !p.instr }))}
                onSignatureChange={(sig) => registerSectionSignature("instr", sig)}
              />
            );
          }

          if (sid === "pdfFiles") {
            return (
              <PDFFilesSection
                key="pdfFiles"
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, pdfFiles: !p.pdfFiles }))}
                onSignatureChange={(sig) => registerSectionSignature("pdfFiles", sig)}
              />
            );
          }

          if (sid === "crawler") {
            return (
              <CrawlerSection
                key="crawler"
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, crawler: !p.crawler }))}
                onSignatureChange={(sig) => registerSectionSignature("crawler", sig)}
              />
            );
          }

          if (sid === "kb") {
            return (
              <KBSidebarSection key="kb"
                entries={kbEntries}
                isOpen={isOpen}
                onToggle={() => setOpenSections(p => ({ ...p, kb: !p.kb }))}
                onExpand={() => setKbWorkspaceOpen(true)}
                onAdd={() => setKbAddOpen(true)}
                onView={(id) => setKbViewId(id)}
                onEdit={(id) => setKbEditId(id)}
                onRemove={(id) => setKbConfirmId(id)}
              />
            );
          }

          const isInstr = sid === "instr";
          const showDrop = sid === "pdfFiles";
          const fallbackSid = sid as SectionId;
          const sectionItems: string[] = items[fallbackSid] ?? [];
          const FallbackIcon = SECTION_META[fallbackSid].icon;

          return (
            <div key={fallbackSid} className="overflow-hidden rounded-[14px]"
              style={icCardStyle(isOpen)}>
              <div className={IC_CARD_HEADER}>
                <FallbackIcon size={14} color={IC.iconSemantic} className="flex-shrink-0" />
                <span className="flex-1 luxia-type-title-component truncate" style={{ color: IC.iconSemantic }}>{SECTION_META[fallbackSid].label}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setModalSection(fallbackSid); }} title="Open full editor"
                  className={IC_BTN_OPEN}
                  aria-label="Open full editor"
                  onMouseEnter={icHoverOn}
                  onMouseLeave={icHoverOff}
                  onMouseDown={icOpenActiveOn}
                  onMouseUp={icHoverOn}>
                  <SquareArrowOutUpRight size={14} strokeWidth={2} style={{ color: IC.textMuted }} />
                </button>
                <button onClick={() => setOpenSections(p => ({ ...p, [fallbackSid]: !p[fallbackSid] }))}
                  className={IC_BTN_ICON}
                  onMouseEnter={icHoverOn}
                  onMouseLeave={icHoverOff}>
                  <ChevronDown size={15} style={{ color: IC.textMuted, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} />
                </button>
              </div>
              {isOpen && (
                <div className="px-2 pb-2.5" style={{ borderTop: `1px solid ${IC.borderSubtle}` }}>
                  {isInstr ? (
                    <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={3}
                      className="w-full outline-none resize-none luxia-type-metadata p-2.5 rounded-[12px] mt-2 transition-[border-color] duration-150 placeholder:text-[rgba(255,255,255,0.40)]"
                      style={icTextareaStyle(false)}
                      placeholder="Write instructions…" />
                  ) : (
                    <div className="pt-1.5">
                      {sectionItems.map((item, i) => (
                        <SidebarListItem key={i} label={item}
                          icon={FallbackIcon}
                          draggable
                          onDragStart={() => setDragSrc({ sid: fallbackSid, i })}
                          onDragOver={() => setDragOver({ sid: fallbackSid, i })}
                          onDrop={() => handleDrop(fallbackSid, i)}
                          onDragEnd={() => { setDragSrc(null); setDragOver(null); }}
                          dragOver={dragOver?.sid === fallbackSid && dragOver?.i === i && dragSrc?.i !== i}
                          onView={() => setPreviewItem({ sid: fallbackSid, idx: i })}
                          onRemove={() => setConfirmRemove({ sid: fallbackSid, idx: i })} />
                      ))}
                      {showDrop && <FileDropZone onDrop={(names) => updateItems(fallbackSid, [...sectionItems, ...names])} />}
                      <button onClick={() => updateItems(fallbackSid, [...sectionItems, fallbackSid === "crawler" ? "https://example.com" : `Item ${sectionItems.length + 1}`])}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] luxia-type-caption transition-colors mt-1 outline-none"
                        style={{ color: IC.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = IC.hover; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <Plus size={11} />{fallbackSid === "crawler" ? "Add URL" : "Add item"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: `1px solid ${IC.headerDivider}`, background: IC.shell }}>
        {constellationFeedback ? (
          <p className="mb-2 text-center luxia-type-caption" role="status"
            style={{ color: constellationFeedback.type === "error" ? LX.error : LX.success }}>
            {constellationFeedback.message}
          </p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          disabled={!constellationDirty || constellationSaving}
          onClick={saveConstellation}
          className="w-full"
        >
          <Check size={16} aria-hidden />
          {constellationSaving ? "Saving…" : "Save Constellation"}
        </Button>
      </div>
    </aside>

      {modalSection && (
        <SectionWorkspaceModal
          sectionId={modalSection}
          items={items[modalSection] ?? []}
          instruction={instruction}
          onSave={(newItems, newInstr) => {
            updateItems(modalSection, newItems);
            setInstruction(newInstr);
          }}
          onClose={() => setModalSection(null)}
        />
      )}
      {confirmRemove && (
        <ConfirmRemoveDialog
          label={items[confirmRemove.sid]?.[confirmRemove.idx] ?? ""}
          onConfirm={() => {
            updateItems(confirmRemove.sid, items[confirmRemove.sid].filter((_, j) => j !== confirmRemove.idx));
            setConfirmRemove(null);
          }}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
      {previewItem && (
        <ItemPreviewModal
          label={items[previewItem.sid]?.[previewItem.idx] ?? ""}
          icon={SECTION_META[previewItem.sid].icon}
          onClose={() => setPreviewItem(null)}
        />
      )}

      {kbWorkspaceOpen && (
        <KBWorkspaceModal
          entries={kbEntries}
          constellationLabel={constellation.label}
          onSave={(es) => setKbEntries(es)}
          onClose={() => setKbWorkspaceOpen(false)}
        />
      )}
      {kbAddOpen && (
        <KBEntryModal mode="add"
          onAdd={(e) => setKbEntries(p => [...p, e])}
          onClose={() => setKbAddOpen(false)}
        />
      )}
      {kbViewId && (() => {
        const e = kbEntries.find(x => x.id === kbViewId); return e ? (
          <KBEntryModal mode="view" entry={e}
            onSave={(upd) => { setKbEntries(p => p.map(x => x.id === upd.id ? upd : x)); setKbViewId(null); }}
            onClose={() => setKbViewId(null)} />
        ) : null;
      })()}
      {kbEditId && (() => {
        const e = kbEntries.find(x => x.id === kbEditId); return e ? (
          <KBEntryModal mode="edit" entry={e}
            onSave={(upd) => { setKbEntries(p => p.map(x => x.id === upd.id ? upd : x)); setKbEditId(null); }}
            onClose={() => setKbEditId(null)} />
        ) : null;
      })()}
      {kbConfirmId && (
        <ConfirmRemoveDialog
          label={kbEntries.find(e => e.id === kbConfirmId)?.question ?? ""}
          onConfirm={() => { setKbEntries(p => p.filter(e => e.id !== kbConfirmId)); setKbConfirmId(null); }}
          onCancel={() => setKbConfirmId(null)}
        />
      )}
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
  const [showNewConstellationModal, setShowNewConstellationModal] = useState(false);
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
  const [settingsFocusHeadingToken, setSettingsFocusHeadingToken] = useState(0);
  const [accessLevelId, setAccessLevelId] = useState<string | null>(
    INITIAL_SHELL.accessLevelId,
  );
  const [dataSourceSettingsId, setDataSourceSettingsId] = useState<string | null>(
    INITIAL_SHELL.dataSourceSettingsId,
  );
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
  const [projectMembershipsState, setProjectMembershipsState] = useState(() =>
    PROJECT_MEMBERSHIPS.map((membership) => ({ ...membership })),
  );
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
    () => [...CONSTELLATIONS, ...runtimeConstellations],
    [runtimeConstellations],
  );
  const [homeBrowseMode, setHomeBrowseMode] = useState<HomeBrowseMode>("overview");
  const [homeScrollRequest, setHomeScrollRequest] = useState(0);
  const [homeProjects, setHomeProjects] = useState<HomeProjectCard[]>(HOME_PROJECTS);
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
  const [leftNavExpandedDespiteNarrow, setLeftNavExpandedDespiteNarrow] = useState(false);
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

  const isLeftNavNarrow = viewportWidth < LEFT_NAV_NARROW_BREAKPOINT;
  const isInspectorNarrow = viewportWidth <= INSPECTOR_NARROW_BREAKPOINT;

  const leftNavCollapsed = isLeftNavNarrow
    ? !leftNavExpandedDespiteNarrow
    : leftNavCollapsedPreference;

  const sidebarCollapsed = isInspectorNarrow
    ? !inspectorExpandedDespiteNarrow
    : sidebarCollapsedPreference;

  const leftNavWidth = leftNavCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
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
    function clearSettingsRouteState() {
      setSettingsConstellationId(null);
      setSettingsCapabilityPath(null);
      setSettingsSection("general");
      setAccessLevelId(null);
      setDataSourceSettingsId(null);
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

      if (resolved.kind === "constellations") {
        clearSettingsRouteState();
        setActiveProjectId(resolved.projectId);
        setProjectBrowseMode("constellations");
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
        setAccessLevelId(null);
        setDataSourceSettingsId(null);
        setAppView("constellation-settings");
        return;
      }

      if (resolved.kind === "project-members") {
        setActiveProjectId(resolved.projectId);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setDataSourceSettingsId(null);
        setAppView("project-members");
        return;
      }

      if (resolved.kind === "access-levels") {
        setActiveProjectId(null);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(null);
        setDataSourceSettingsId(null);
        setAppView("access-levels");
        return;
      }

      if (resolved.kind === "access-level") {
        setActiveProjectId(null);
        setSettingsConstellationId(null);
        setSettingsCapabilityPath(null);
        setAccessLevelId(resolved.accessLevelId);
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
      applyPath(window.location.pathname, window.location.search);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);


  useEffect(() => {
    if (!isLeftNavNarrow) setLeftNavExpandedDespiteNarrow(false);
  }, [isLeftNavNarrow]);

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

  const contextProjectId = appView === "home" || appView === "access-levels" || appView === "access-level" || appView === "data-source-settings"
    ? null
    : appView === "project" || appView === "constellation-settings" || appView === "project-members"
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
    if (appView === "project-members") return "overview";
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
        const derivedSourceCount = settings
          ? settings.connectedSources.length
          : (getConstellationSourceCount(item.id)
            || CONSTELLATION_SOURCE_COUNTS[item.id]
            || 0);
        return {
          id: item.id,
          label: item.label,
          type: item.type === "pdf" ? "pdf" : item.type === "csv" ? "csv" : "database",
          projectId: item.projectId,
          sourceCount: derivedSourceCount,
          description: item.description,
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
      const navW = leftNavCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
      setSidebarWidth(clampInspectorWidth(next, window.innerWidth, navW));
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
      const navW = leftNavCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
      setGalaxyPanelWidth(clampGalaxyWidth(next, window.innerWidth, navW));
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
    if (isLeftNavNarrow) {
      setLeftNavExpandedDespiteNarrow((prev) => !prev);
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

  function handleOpenProjectMembers(projectId: string) {
    setActiveProjectId(projectId);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAppView("project-members");
    if (typeof window !== "undefined") {
      const next = getProjectMembersPath(projectId);
      if (window.location.pathname !== next) {
        window.history.pushState({ luxiaView: "project-members", projectId }, "", next);
      }
    }
  }

  function handleOpenAccessLevels() {
    setActiveProjectId(null);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(null);
    setDataSourceSettingsId(null);
    setAppView("access-levels");
    if (typeof window !== "undefined") {
      const next = getAccessLevelsPath();
      if (window.location.pathname !== next) {
        window.history.pushState({ luxiaView: "access-levels" }, "", next);
      }
    }
  }

  function handleOpenAccessLevel(id: string) {
    setActiveProjectId(null);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(id);
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
    handleOpenAccessLevel("new");
  }

  function handleOpenDataSourceSettings(dataSourceId: string) {
    setActiveProjectId(null);
    setSettingsConstellationId(null);
    setSettingsCapabilityPath(null);
    setAccessLevelId(null);
    setDataSourceSettingsId(dataSourceId);
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
    if (existing) return existing;

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

  function handleAddConstellationDataSource(constellationId: string) {
    const current = resolveConstellationSettingsRecordForView(constellationId);
    if (!current) return;
    const connectedIds = new Set(current.connectedSources.map((source) => source.id));
    const candidate = AVAILABLE_SOURCES_CATALOG.find((source) => !connectedIds.has(source.id));
    if (!candidate) return;
    const nextSource: ConnectedDataSource = { ...candidate, usageInConstellation: "Connected" };
    const nextRecord: ConstellationSettingsRecord = {
      ...current,
      connectedSources: [...current.connectedSources, nextSource],
      sourceAccessRows: [
        ...current.sourceAccessRows,
        {
          sourceId: nextSource.id,
          sourceName: nextSource.name,
          sourceType: nextSource.type,
          ownership: nextSource.ownership,
          ownerUserId: nextSource.ownerUserId,
          owner: nextSource.owner,
          requiredPermission: "Use",
          currentUserPermission: nextSource.ownership === "private" ? "Manage" : "Use",
          accessLevelName: nextSource.ownership === "private" ? "—" : "Access Level name 01",
          sourceStatus: nextSource.status,
          conflictStatus: nextSource.ownership === "private" ? "owner-access" : "none",
        },
      ],
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

  function resolveCapabilityBundle(
    constellationId: string,
    instructions?: string,
  ): ConstellationCapabilityBundle {
    const existing = capabilityBundlesById[constellationId];
    if (existing) return existing;
    const constellation = allConstellations.find((item) => item.id === constellationId);
    const type = constellation?.type ?? "database";
    return createSeedCapabilityBundle(constellationId, type, instructions);
  }

  useEffect(() => {
    if (appView !== "constellation-settings" || !settingsConstellationId) return;
    setCapabilityBundlesById((prev) => {
      if (prev[settingsConstellationId]) return prev;
      const record = constellationSettingsById[settingsConstellationId]
        ?? getConstellationSettingsRecord(settingsConstellationId);
      const constellation = allConstellations.find((item) => item.id === settingsConstellationId);
      const type = constellation?.type ?? record?.type ?? "database";
      return {
        ...prev,
        [settingsConstellationId]: createSeedCapabilityBundle(
          settingsConstellationId,
          type,
          record?.instructions,
        ),
      };
    });
  }, [appView, settingsConstellationId, constellationSettingsById, allConstellations]);

  function handleUpdateCapabilityBundle(
    constellationId: string,
    next: ConstellationCapabilityBundle,
  ) {
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
  ) {
    const project = homeProjects.find((entry) => entry.id === projectId)
      ?? PROJECTS.find((entry) => entry.id === projectId);
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

  function handleOpenProjectDashboard(projectId: string) {
    handleOpenProjectOverview(projectId, "dashboards");
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
      handleOpenProjectOverview(projectId, "overview");
      return;
    }
    handleOpenProjectOverview(projectId, "overview");
  }

  const recentWork = useMemo<HomeRecentWorkItem[]>(() => (
    HOME_RECENT_WORK
      .filter((item) => homeProjects.some((project) => project.id === item.projectId))
      .map((item) => {
        const chat = chats.find((c) => c.id === item.chatId);
        const key = workItemEntityKey(item);
        const constellation = item.constellationId
          ? CONSTELLATIONS.find((entry) => entry.id === item.constellationId)
          : undefined;
        const projectCard = homeProjects.find((project) => project.id === item.projectId);
        const { projectName: _legacyProjectName, ...rest } = item;
        return {
          ...rest,
          title: chat?.label ?? item.title,
          isPinned: pinnedEntityOrder.includes(key) || Boolean(chat?.pinned),
          constellationDescription: constellation?.description,
          projectDescription: projectCard?.description,
        };
      })
  ), [chats, homeProjects, pinnedEntityOrder]);

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
  }

  function requestEditProjectDetails(projectId: string) {
    setProjectManageId(projectId);
    setProjectManageMode("edit");
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

    const viewingDeletedProject = activeProjectId === projectId
      || activeData?.projectId === projectId;

    setHomeProjects((prev) => prev.filter((project) => project.id !== projectId));

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
      const project = PROJECTS.find((p) => p.id === template.projectId);
      if (!project) {
        console.warn(
          `[Luxia] Project "${template.projectId}" missing for galaxy "${chatId}". Navigation aborted.`,
        );
        return false;
      }
      setGalaxySessions((prev) => ({
        ...prev,
        [chatId]: prev[chatId] ?? createIdleGalaxySession(project.label),
      }));
    }
    setActiveChat(chatId);
    return true;
  }

  function handleContinueWork(item: HomeRecentWorkItem) {
    if (item.projectId) setActiveProjectId(item.projectId);
    if (!ensureChatOpen(item.chatId)) return;
    const chat = findChatById(item.chatId, chatsRef.current);
    if (chat) syncWorkspacePathForChat(chat);
    setAppView("chat");
  }

  function handleOpenProjectFromHome(projectId: string) {
    handleOpenProjectOverview(projectId, "overview");
  }

  function handleOpenGalaxyFromHome(projectId: string) {
    const homeProject = homeProjects.find((entry) => entry.id === projectId);
    const project = homeProject ?? PROJECTS.find((entry) => entry.id === projectId);
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

  function handleOpenGalaxySettingsFromOverview(projectId: string) {
    const galaxyChat = findGalaxyChatForProject(projectId, chats, homeProjects);

    if (!galaxyChat || galaxyChat.projectId !== projectId) {
      console.warn(
        `[Luxia] Galaxy is missing or not bound to project "${projectId}". Settings navigation aborted.`,
      );
      return;
    }

    setActiveProjectId(projectId);
    if (!ensureChatOpen(galaxyChat.id)) return;

    const session = galaxySessions[galaxyChat.id]
      ?? createIdleGalaxySession(getProjectNameById(projectId, homeProjects));
    updateGalaxySession(galaxyChat.id, {
      expandSignal: (session.expandSignal ?? 0) + 1,
      focusSection: "instruction",
    });
    expandGalaxyIntelligencePanel({ force: true });
    syncWorkspacePathForChat(galaxyChat);
    setAppView("chat");
  }

  function handleOpenChatFromHome(chatId: string) {
    const chat = chats.find((entry) => entry.id === chatId)
      ?? INITIAL_CHATS.find((entry) => entry.id === chatId);
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

  function handleAddConstellationToProject(
    projectId: string,
    name: string,
    type: "database" | "csv" | "pdf",
  ) {
    setActiveProjectId(projectId);
    setShowNewConstellationModal(true);
    void name;
    void type;
  }

  function handleCreateConstellationDraft(draft: NewConstellationDraft) {
    const projectId = activeProjectId;
    if (!projectId) return;

    const id = `con-runtime-${Date.now()}`;
    const createdConstellation: Constellation = {
      id,
      label: draft.name,
      type: draft.type,
      projectId,
      description: draft.description,
    };
    const nextRuntime = [...runtimeConstellations, createdConstellation];
    const nextAll = [...CONSTELLATIONS, ...nextRuntime];
    setRuntimeConstellations(nextRuntime);

    const seededBase = buildSettingsForConstellation({
      id,
      projectId,
      projectName: getProjectNameById(projectId, homeProjects),
      name: draft.name,
      description: draft.description,
      type: draft.type,
    });

    const connectedSources = draft.dataSourceIds
      .map((sourceId) => {
        const catalog = getDataSourceById(sourceId) ?? DATA_SOURCE_CATALOG.find((item) => item.id === sourceId);
        if (!catalog) return null;
        const typeLabel = catalog.type.toLowerCase();
        const sourceType = typeLabel.includes("csv")
          ? "csv" as const
          : typeLabel.includes("pdf")
            ? "pdf" as const
            : "database" as const;
        return {
          id: catalog.id,
          name: catalog.name,
          type: sourceType,
          ownership: catalog.ownership,
          ownerUserId: catalog.ownerUserId,
          owner: catalog.ownerName,
          status: catalog.status === "inactive" ? "needs-attention" as const : "connected" as const,
          accessSummary: catalog.ownership === "private" ? "Owner access" : "Use via Access Level name 01",
          lastUpdated: "Just now",
          usageInConstellation: "Primary connected source",
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const seeded: ConstellationSettingsRecord = {
      ...seededBase,
      connectedSources,
      sourceAccessRows: connectedSources.map((source) => ({
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.type,
        ownership: source.ownership,
        ownerUserId: source.ownerUserId,
        owner: source.owner,
        requiredPermission: "Use" as const,
        currentUserPermission: source.ownership === "private" ? "Manage" as const : "Use" as const,
        accessLevelName: source.ownership === "private" ? "—" : "Access Level name 01",
        sourceStatus: source.status,
        conflictStatus: source.ownership === "private" ? "owner-access" as const : "none" as const,
      })),
    };

    const nextSettings = {
      ...constellationSettingsById,
      [id]: seeded,
    };
    setConstellationSettingsById(nextSettings);
    setCapabilityBundlesById((prev) => ({
      ...prev,
      [id]: createSeedCapabilityBundle(id, draft.type, seeded.instructions),
    }));
    syncHomeProjectDerivedCounts(projectId, {
      settingsById: nextSettings,
      constellations: nextAll,
    });
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
  }

  function handleCreateProject(name: string) {
    const stamp = Date.now();
    const id = `project-${stamp}`;
    const galaxyId = `galaxy-${stamp}`;
    setHomeProjects((prev) => [...prev, {
      id,
      name,
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
    }]);
    handleOpenProjectOverview(id, "overview");
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
    setActiveChat(chatId);
    const chat = findChatById(chatId, chats);
    if (chat) {
      if (chat.projectId) setActiveProjectId(chat.projectId);
      syncWorkspacePathForChat(chat);
    }
  }

  function handleConstellationChange(conId: string) {
    const active = chats.find((c) => c.id === activeChat);
    if (!active || active.chatType !== "constellation") return;
    setChats((p) => p.map((c) => c.id === activeChat ? { ...c, constellationId: conId } : c));
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
      setChatMessages(p => ({
        ...p,
        [chatId]: [...(p[chatId] ?? []),
        { id: uid, role: "user", content, timestamp: now },
        {
          id: aid, role: "ai", timestamp: now,
          content: "I have searched the connected constellation for your query.\n\nHere is what I found based on the available sources.",
          sources: [{ id: `${aid}s1`, label: "Document A" }],
        },
        ],
      }));
      return;
    }

    const session = galaxySessions[chatId] ?? createIdleGalaxySession(projectName);
    const isManual = session.routeMode === "manual" && session.pendingManualId;
    const manualOption = isManual
      ? CONSTELLATIONS.find((c) => c.id === session.pendingManualId)
      : null;
    const matched: GalaxyMatchedConstellation = manualOption
      ? {
          id: manualOption.id,
          label: manualOption.label,
          type: getConstellationSourceLabel(manualOption.type),
        }
      : GALAXY_MOCK_MATCHED;

    galaxyManualCollapseRef.current = false;
    expandGalaxyIntelligencePanel({ force: true });

    const baseGalaxy: GalaxyRoutingMeta = {
      projectName,
      phase: "searching",
      matched,
      selectionSource: isManual ? "manual" : "auto",
      constellationsChecked: GALAXY_MOCK_CONSTELLATIONS_CHECKED,
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
      routeMode: "auto",
      pendingManualId: null,
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
          content: GALAXY_MOCK_ANSWER,
          galaxy: { ...baseGalaxy, phase: "answering" },
        });
      }, 700);
      window.setTimeout(() => {
        updateGalaxySession(chatId, {
          status: "complete",
          activityLabel: "Answer complete",
          selected: matched,
          selectionSource: "manual",
          sources: GALAXY_MOCK_SOURCES,
          focusSection: "sources",
        });
        patchGalaxyMessage(chatId, aid, {
          content: GALAXY_MOCK_ANSWER,
          sources: GALAXY_MOCK_SOURCES.map((s) => ({ id: `${aid}-${s.id}`, label: s.label })),
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
            candidates: GALAXY_MOCK_CANDIDATES,
          });
          patchGalaxyMessage(chatId, aid, { galaxy: { ...baseGalaxy, phase } });
          return;
        }
        if (phase === "matched") {
          updateGalaxySession(chatId, {
            status: "matching",
            activityLabel: "Best match found",
            candidates: GALAXY_MOCK_CANDIDATES,
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
            candidates: GALAXY_MOCK_CANDIDATES,
          });
          patchGalaxyMessage(chatId, aid, {
            content: GALAXY_MOCK_ANSWER,
            galaxy: { ...baseGalaxy, phase },
          });
          return;
        }
        updateGalaxySession(chatId, {
          status: "complete",
          activityLabel: "Answer complete",
          selected: matched,
          selectionSource: "auto",
          candidates: GALAXY_MOCK_CANDIDATES,
          sources: GALAXY_MOCK_SOURCES,
          focusSection: "sources",
        });
        patchGalaxyMessage(chatId, aid, {
          content: GALAXY_MOCK_ANSWER,
          sources: GALAXY_MOCK_SOURCES.map((s) => ({ id: `${aid}-${s.id}`, label: s.label })),
          galaxy: { ...baseGalaxy, phase: "complete" },
        });
      }, delay);
    });
  }

  function handleOpenGalaxyConstellation() {
    expandGalaxyIntelligencePanel({ force: true });
    const session = galaxySessions[activeChat];
    const matchedId = session?.selected?.id ?? GALAXY_MOCK_MATCHED.id;
    const match = allConstellations.find((c) => c.id === matchedId);
    if (!match) return;
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
    const seeds = getProjectConstellations(
      activeData?.projectId ?? PROJECTS[0].id,
      runtimeConstellations,
    ).map((c) => ({
      id: c.id,
      label: c.label,
      type: getConstellationSourceLabel(c.type),
    }));
    return buildGalaxyRouteCatalog(galaxyProjectName, seeds);
  }, [activeData?.projectId, galaxyProjectName, runtimeConstellations]);

  const pendingManual = activeGalaxySession?.pendingManualId
    ? (() => {
        const found = galaxyRouteOptions.find((o) => o.id === activeGalaxySession.pendingManualId);
        return found ? { id: found.id, label: found.label, type: found.type } : null;
      })()
    : null;

  const settingsConstellation = settingsConstellationId
    ? allConstellations.find((item) => item.id === settingsConstellationId)
    : undefined;

  const settingsProjectExists = activeProjectId
    ? Boolean(
      homeProjects.find((project) => project.id === activeProjectId)
        ?? PROJECTS.find((project) => project.id === activeProjectId),
    )
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

  const editingAccessLevel = useMemo(() => {
    if (appView !== "access-level" || !accessLevelId) return null;
    if (accessLevelId === "new") return buildEmptyAccessLevel();
    return accessLevelsState.find((level) => level.id === accessLevelId) ?? null;
  }, [appView, accessLevelId, accessLevelsState]);

  const projectNamesById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const project of homeProjects) map[project.id] = project.name;
    for (const project of PROJECTS) map[project.id] = project.label;
    return map;
  }, [homeProjects]);

  const membersProject = activeProjectId
    ? {
      id: activeProjectId,
      name: getProjectNameById(activeProjectId, homeProjects),
    }
    : null;

  const membersProjectExists = activeProjectId
    ? Boolean(
      homeProjects.find((project) => project.id === activeProjectId)
        ?? PROJECTS.find((project) => project.id === activeProjectId),
    )
    : false;

  const membersForProject = activeProjectId
    ? projectMembershipsState.filter((membership) => membership.projectId === activeProjectId)
    : [];

  const dataSourceForSettings = dataSourceSettingsId
    ? getDataSourceById(dataSourceSettingsId)
      ?? DATA_SOURCE_CATALOG.find((source) => source.id === dataSourceSettingsId)
      ?? null
    : null;

  return (
    <div
      className="flex h-dvh max-h-dvh overflow-hidden"
      style={{ background: activeData?.chatType === "galaxy" ? "#FAFAFC" : "#FAFDFF" }}
    >
      <LeftNav
        collapsed={leftNavCollapsed}
        onToggleCollapsed={handleLeftNavToggle}
        homeActive={appView === "home"}
        usersActive={appView === "access-levels" || appView === "access-level"}
        projectId={contextProjectId}
        projectLabel={contextProjectLabel}
        activeProjectSection={activeProjectSection}
        onHomeClick={handleNavigateHome}
        onUsersClick={handleOpenAccessLevels}
        onProjectSectionClick={handleProjectNavSection}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {appView === "home" ? (
          <HomePageShell scrollRequest={homeScrollRequest} variant="standard">
            <HomePage
              projects={homeProjects}
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
              onArchiveProject={handleArchiveProject}
              onRestoreProject={handleRestoreProject}
              onEditProject={requestEditProjectDetails}
              onDeleteProject={requestDeleteProject}
              onToggleWorkPin={handleToggleWorkPin}
              onContinueWork={handleContinueWork}
              onOpenProject={handleOpenProjectFromHome}
              onOpenGalaxy={handleOpenGalaxyFromHome}
              onOpenChat={handleOpenChatFromHome}
              onOpenConstellation={handleOpenConstellationFromProject}
              searchConstellations={overviewConstellations.map((item) => ({
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
                constellations={overviewConstellations.filter(
                  (item) => item.projectId === activeProjectId,
                )}
                onNavigateHome={handleNavigateHome}
                onBack={() => handleOpenProjectOverview(activeProjectId, "overview")}
                onOpen={(constellationId) =>
                  handleOpenConstellationFromProject(activeProjectId, constellationId)
                }
                onOpenSettings={(constellationId) =>
                  handleOpenConstellationSettings(activeProjectId, constellationId)
                }
                onAdd={() =>
                  handleAddConstellationToProject(
                    activeProjectId,
                    `Constellation name ${String(overviewConstellations.filter((item) => item.projectId === activeProjectId).length + 1).padStart(2, "0")}`,
                    "database",
                  )
                }
              />
            ) : (
              <ProjectOverviewPage
                projectId={activeProjectId}
                projects={homeProjects}
                galaxyNameById={galaxyNameById}
                chats={overviewChats}
                constellations={overviewConstellations}
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
                onNewChat={handleNewChatFromProject}
                onAddConstellation={handleAddConstellationToProject}
                onOpenDashboard={handleOpenProjectDashboard}
                onRenameProject={handleRenameProject}
                onRenameGalaxy={handleRenameGalaxy}
                onArchiveProject={handleArchiveProject}
                onOpenMembers={handleOpenProjectMembers}
              />
            )}
          </HomePageShell>
        ) : appView === "constellation-settings" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {(() => {
              const projectId = activeProjectId ?? "";
              const constellationId = settingsConstellationId ?? "";
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
                    onUpdateBundle={(next) => {
                      if (!constellationId || settingsUnavailable) return;
                      handleUpdateCapabilityBundle(constellationId, next);
                    }}
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
                      && chat.constellationId === constellationId,
                    )
                    .map((chat) => ({ id: chat.id, label: chat.label }))}
                  onCreateChat={handleCreateChatForConstellation}
                  onOpenChat={handleOpenChatFromHome}
                  onSaveGeneral={(draft) => {
                    if (!constellationId || settingsUnavailable) return;
                    handleSaveConstellationSettings(constellationId, draft);
                  }}
                  onManageCapability={(capabilityId) => {
                    if (!projectId || !constellationId || settingsUnavailable) return;
                    handleOpenConstellationCapability(
                      projectId,
                      constellationId,
                      capabilityId,
                    );
                  }}
                  onAddDataSource={() => {
                    if (!constellationId || settingsUnavailable) return;
                    handleAddConstellationDataSource(constellationId);
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
                  onNavigateHome={handleNavigateHome}
                  onOpenProject={handleOpenProjectFromHome}
                  onOpenConstellations={handleOpenConstellationsList}
                  onOpenConstellation={handleOpenConstellationFromProject}
                  onOpenMembers={handleOpenProjectMembers}
                  onOpenAccessLevels={handleOpenAccessLevels}
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
                organizationUsers={ORGANIZATION_USERS}
                dataSources={DATA_SOURCE_CATALOG}
                onSaveMemberships={(memberships) => {
                  setProjectMembershipsState((prev) => {
                    const others = prev.filter(
                      (membership) => membership.projectId !== membersProject.id,
                    );
                    return [...others, ...memberships];
                  });
                }}
                onNavigateHome={handleNavigateHome}
                onOpenProject={handleOpenProjectFromHome}
                onOpenAccessLevels={handleOpenAccessLevels}
                onOpenDataSourceSettings={handleOpenDataSourceSettings}
              />
            ) : null}
          </HomePageShell>
        ) : appView === "access-levels" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            <AccessLevelsPage
              accessLevels={accessLevelsState}
              onOpen={handleOpenAccessLevel}
              onCreate={handleCreateAccessLevel}
              onDelete={(id) => {
                setAccessLevelsState((prev) => prev.filter((level) => level.id !== id));
              }}
              onNavigateHome={handleNavigateHome}
            />
          </HomePageShell>
        ) : appView === "access-level" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            {editingAccessLevel ? (
              <AccessLevelEditorPage
                record={editingAccessLevel}
                otherLevels={accessLevelsState.filter((level) => level.id !== editingAccessLevel.id)}
                onSave={(record) => {
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
                  handleOpenAccessLevel(record.id);
                }}
                onCancel={handleOpenAccessLevels}
                onDelete={(id) => {
                  setAccessLevelsState((prev) => prev.filter((level) => level.id !== id));
                  handleOpenAccessLevels();
                }}
                onNavigateHome={handleNavigateHome}
                onOpenAccessLevels={handleOpenAccessLevels}
                projectNames={projectNamesById}
              />
            ) : null}
          </HomePageShell>
        ) : appView === "data-source-settings" ? (
          <HomePageShell scrollRequest={homeScrollRequest} framed={false}>
            <DataSourceSettingsPage
              source={dataSourceForSettings}
              accessLevels={accessLevelsState}
              onNavigateHome={handleNavigateHome}
              onOpenAccessLevels={handleOpenAccessLevels}
              onOpenAccessLevel={handleOpenAccessLevel}
              onBack={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                  return;
                }
                handleOpenAccessLevels();
              }}
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
              activeData?.chatType === "galaxy"
                ? () => {
                    const session = galaxySessions[activeChat]
                      ?? createIdleGalaxySession(getProjectNameById(activeData.projectId, homeProjects));
                    updateGalaxySession(activeChat, {
                      expandSignal: (session.expandSignal ?? 0) + 1,
                      focusSection: "instruction",
                    });
                    expandGalaxyIntelligencePanel({ force: true });
                  }
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
                chats={chats} activeId={activeChat}
                onSelect={handleSelectChat} onNew={handleNewChat}
                onClose={handleCloseChat}
                onPin={handleChatPin}
                onRename={(id, label) => setChats(p => p.map(c => c.id === id ? { ...c, label } : c))}
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
                onSelectAuto: () => updateGalaxySession(activeChat, {
                  routeMode: "auto",
                  pendingManualId: null,
                }),
                onSelectManual: (option) => updateGalaxySession(activeChat, {
                  routeMode: "manual",
                  pendingManualId: option.id,
                }),
                onClearManual: () => updateGalaxySession(activeChat, {
                  routeMode: "auto",
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
                  onResizeStart={handleGalaxyResizeStart}
                  onOpenConstellation={handleOpenGalaxyConstellation}
                  onCollapse={collapseGalaxyIntelligencePanel}
                  contentOpacity={galaxyPanelContentOpaque ? 1 : 0}
                  onSelectAuto={() => updateGalaxySession(activeChat, {
                    routeMode: "auto",
                    pendingManualId: null,
                  })}
                  onEnterSpecific={() => updateGalaxySession(activeChat, {
                    routeMode: "manual",
                  })}
                  onSelectManual={(option) => updateGalaxySession(activeChat, {
                    routeMode: "manual",
                    pendingManualId: option.id,
                  })}
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
              allConstellations={allConstellations}
              onConstellationChange={handleConstellationChange}
              onOpenConstellationSettings={(projectId, constellationId) =>
                handleOpenConstellationSettings(projectId, constellationId, "general")
              }
              projectId={activeData?.projectId ?? PROJECTS[0].id}
              allowConstellationChange={activeData?.chatType === "constellation"}
              isGalaxyChat={false}
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
          constellations={allConstellations}
        />
      )}
      {showNewProjectModal && (
        <NewProjectModal
          open={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          onCreate={handleCreateProject}
        />
      )}
      {showNewConstellationModal && activeProjectId ? (
        <NewConstellationModal
          open={showNewConstellationModal}
          projectId={activeProjectId}
          projectName={getProjectNameById(activeProjectId, homeProjects)}
          existingNames={allConstellations
            .filter((item) => item.projectId === activeProjectId)
            .map((item) => item.label)}
          onClose={() => setShowNewConstellationModal(false)}
          onCreate={handleCreateConstellationDraft}
        />
      ) : null}
      <ProjectManageDialogs
        mode={projectManageMode}
        project={
          projectManageId
            ? homeProjects.find((project) => project.id === projectManageId) ?? null
            : null
        }
        onClose={closeProjectManageDialogs}
        onEditDetails={handleEditProjectDetails}
        onDelete={handleDeleteProject}
      />
    </div>
  );
}
