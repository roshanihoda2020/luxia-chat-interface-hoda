import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import { LX } from "@/app/features/active-data-tables/tokens";
import { IC, IC_BTN_ICON, IC_BTN_OPEN, icHoverOff, icHoverOn, icOpenActiveOn } from "@/app/features/active-data-tables/inspectorTheme";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  ChevronDown, ChevronRight, ChevronLeft,
  Plus, X, Pin, Copy, Bookmark, SquareArrowOutUpRight,
  FileText, Database, Globe, BookOpen, FolderOpen, Cpu,
  Send, Mic, Eye, Upload, GripVertical,
  Trash2, Check, Edit3, BarChart3, Table2,
  Home, Users, LayoutGrid, Bot,
  Bell, Wrench, HelpCircle,
  Sparkles, MessageSquare, Network, Star,
  RefreshCw, Search, MoreHorizontal, Wand2,
  AlignLeft, Layers, Settings2, Pencil, Share2, List, FileBarChart2,
  type LucideIcon,
} from "lucide-react";

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
type ConstellationType = "database" | "pdf";

type SectionIcon = LucideIcon;

const SECTION_META: Record<SectionId, { label: string; icon: SectionIcon }> = {
  kb: { label: "Knowledge Base", icon: BookOpen },
  dataTable: { label: "Active Data Table", icon: Table2 },
  contextFiles: { label: "Extra Context Files", icon: FolderOpen },
  relationship: { label: "Relationship", icon: Network },
  metrics: { label: "Metrics", icon: BarChart3 },
  instr: { label: "Instruction", icon: Cpu },
  pdfFiles: { label: "PDF Files", icon: FileText },
  crawler: { label: "Crawler URL Data", icon: Globe },
};

const CONSTELLATION_SECTIONS: Record<ConstellationType, SectionId[]> = {
  database: ["dataTable", "kb", "instr", "contextFiles", "relationship", "metrics"],
  pdf: ["pdfFiles", "kb", "instr", "crawler"],
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

function getConstellationSourceLabel(type: ConstellationType): "PDF" | "DB" {
  return type === "pdf" ? "PDF" : "DB";
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
      variant={type === "pdf" ? "pdf" : "database"}
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
    <span className={`inline-flex min-w-0 max-w-full items-center gap-1 ${className}`} title={label}>
      <span className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${labelClassName}`}>{label}</span>
      <ConstellationSourceBadge type={type} className={`flex-shrink-0 ${badgeClassName}`} />
    </span>
  );
}

function getProjectConstellations(projectId: string) {
  return CONSTELLATIONS.filter((c) => c.projectId === projectId);
}

function resolveChatConstellation(chat: Chat | undefined): Constellation {
  if (chat?.chatType === "constellation" && chat.constellationId) {
    return CONSTELLATIONS.find((c) => c.id === chat.constellationId) ?? CONSTELLATIONS[0];
  }
  const projectConstellations = getProjectConstellations(chat?.projectId ?? PROJECTS[0].id);
  return projectConstellations[0] ?? CONSTELLATIONS[0];
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

const PROJECTS: Project[] = [
  { id: "proj1", label: "Project 01" },
  { id: "proj2", label: "Project 02" },
  { id: "proj3", label: "Project 03" },
];

const CONSTELLATIONS: Constellation[] = [
  {
    id: "con1", label: "Constellation 01", type: "database", projectId: "proj1",
    description: "Connects structured data tables, relationship graphs, and metrics for analytical queries and reporting.",
  },
  {
    id: "con2", label: "Constellation 02", type: "pdf", projectId: "proj1",
    description: "Indexes PDF documents and crawled web pages for semantic search and content summarisation.",
  },
  {
    id: "con3", label: "Constellation 03", type: "database", projectId: "proj1",
    description: "Operational database with real-time event streams, KPI dashboards, and usage analytics.",
  },
  {
    id: "con4", label: "Constellation 04", type: "pdf", projectId: "proj2",
    description: "Archived quarterly financial PDFs and supporting disclosure documents.",
  },
];

const INITIAL_CHATS: Chat[] = [
  { id: "c1", label: "Chat 1", chatType: "constellation", projectId: "proj1", constellationId: "con1" },
  { id: "c2", label: "Chat 2", chatType: "constellation", projectId: "proj1", constellationId: "con2" },
  { id: "g1", label: "Galaxy Chat", chatType: "galaxy", projectId: "proj1" },
];

const MESSAGES_C1: Message[] = [
  { id: "u1", role: "user", timestamp: "10:14 AM", content: "What data is available in this constellation?" },
  {
    id: "a1", role: "ai", timestamp: "10:14 AM",
    content: "This constellation connects two active data tables and three knowledge base documents across the project workspace.\n\nYou can query tables directly for structured metrics, filter records, and join related entities. Document sources support semantic search, summarisation, and section-level retrieval.\n\nKnowledge base entries take priority when a curated answer exists, while tables and documents complement each other for analytical and narrative questions.",
    sources: [{ id: "s1", label: "Table 1" }, { id: "s2", label: "Document A" }],
    insights: {
      format: "bullets",
      items: [
        "Start with knowledge base matches when you need a definitive, curated answer.",
        "Use table queries when the question depends on metrics, filters, or relationships.",
        "Blend document search when the question needs narrative or section-level context.",
      ],
    },
  },
];

const MESSAGES_C2: Message[] = [
  { id: "u1", role: "user", timestamp: "11:02 AM", content: "What PDF files are connected here?" },
  {
    id: "a1", role: "ai", timestamp: "11:02 AM",
    content: "This constellation includes two PDF documents and one crawled URL.\n\nI can search within the PDFs, summarise their content, or retrieve specific sections.",
    sources: [{ id: "s1", label: "Report A.pdf" }, { id: "s2", label: "Guide B.pdf" }],
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = { c1: MESSAGES_C1, c2: MESSAGES_C2 };

const EMPTY_PROMPTS = [
  "What information is available here?",
  "Give me a brief summary",
  "What are the key topics?",
  "Walk me through the structure",
];

const NAV_TOP_ITEMS = [
  { icon: Home, label: "Home page" },
  { icon: Users, label: "User & permissions" },
  { icon: Database, label: "Datasources" },
];
const NAV_PROJECT_ITEMS = [
  { icon: Network, label: "Galaxies" },
  { icon: LayoutGrid, label: "Constellations" },
  { icon: BarChart3, label: "Dashboard" },
  { icon: Bot, label: "Virtual assistant" },
  { icon: MessageSquare, label: "Chat", active: true },
];
const NAV_BOTTOM_ITEMS = [
  { icon: Bell, label: "Notifications" },
  { icon: Wrench, label: "Tools gallery" },
  { icon: Star, label: "Settings" },
  { icon: HelpCircle, label: "Support" },
];

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

function NavItem({ icon: Icon, label, active, badge, chevron, collapsed }: {
  icon: LucideIcon;
  label: string; active?: boolean; badge?: number; chevron?: boolean; collapsed?: boolean;
}) {
  const button = (
    <button
      type="button"
      aria-label={collapsed ? label : undefined}
      className={`w-full flex items-center rounded-[10px] transition-all group ${
        collapsed ? "justify-center h-[40px] px-0" : "gap-3 px-3.5 h-[40px] text-left"
      }`}
      style={{ background: active ? "rgba(255,255,255,0.12)" : "transparent" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <span className="relative flex-shrink-0">
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
          <span className="flex-1 luxia-type-nav-sidebar truncate"
            style={{ color: active ? "white" : "rgba(255,255,255,0.7)" }}>
            {label}
          </span>
          {badge ? <span className="luxia-type-badge px-1.5 py-0.5 rounded-full" style={{ background: LX.error, color: "white" }}>{badge}</span> : null}
          {chevron ? <ChevronRight size={12} color={active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.22)"} /> : null}
        </>
      ) : null}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
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
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const navPadding = collapsed ? "px-2" : "px-3";

  return (
    <aside
      className="relative h-full min-h-0 flex-shrink-0"
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

        <div className="relative z-[2] min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <nav className={`${navPadding} space-y-px`}>
            {NAV_TOP_ITEMS.map(({ icon, label }) => (
              <NavItem key={label} icon={icon} label={label} collapsed={collapsed} />
            ))}
          </nav>

          <div
            className={`my-2.5 ${collapsed ? "mx-2" : "mx-4"}`}
            style={{ height: 1, background: "rgba(255,255,255,0.07)" }}
          />

          <div className={navPadding}>
            {!collapsed ? (
              <p className="px-3 mb-1 luxia-type-overline-data"
                style={{ color: "rgba(150,219,251,0.55)" }}>
                Project Name 1
              </p>
            ) : null}
            <nav className="space-y-px">
              {NAV_PROJECT_ITEMS.map(({ icon, label, active }) => (
                <NavItem key={label} icon={icon} label={label} active={active} chevron={!collapsed} collapsed={collapsed} />
              ))}
            </nav>
          </div>

          <div
            className={`${navPadding} space-y-px pb-1 pt-2`}
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 8 }}
          >
            {NAV_BOTTOM_ITEMS.map(({ icon, label }) => (
              <NavItem key={label} icon={icon} label={label} collapsed={collapsed} />
            ))}
          </div>
        </div>

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="relative z-[2] flex flex-shrink-0 items-center justify-center px-2 py-2.5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white luxia-type-caption flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #5BC8F5 0%, #2C7A9E 100%)" }}>
                  HR
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Hoda Roshani — Administrator
            </TooltipContent>
          </Tooltip>
        ) : (
          <div
            className="relative z-[2] flex flex-shrink-0 items-center gap-2.5 px-4 py-2.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white luxia-type-caption flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #5BC8F5 0%, #2C7A9E 100%)" }}>
              HR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white luxia-type-profile-secondary truncate leading-tight">Hoda Roshani</p>
              <p className="luxia-type-profile-secondary truncate leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>Administrator</p>
            </div>
            <ChevronRight size={12} color="rgba(255,255,255,0.25)" />
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
    <div className="flex items-center gap-1.5 px-6 py-2 overflow-x-auto flex-shrink-0"
      style={{ borderBottom: `1px solid ${LX.border}` }}>
      {chats.map((chat) => {
        const isActive = chat.id === activeId;
        const con = chat.chatType === "constellation" && chat.constellationId
          ? CONSTELLATIONS.find((c) => c.id === chat.constellationId)
          : null;
        const style = con ? CONSTELLATION_STYLE[con.type] : null;

        const isGalaxyTab = chat.chatType === "galaxy";
        const galaxyProject = isGalaxyTab
          ? (PROJECTS.find((p) => p.id === chat.projectId)?.label ?? "Project")
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
              {isGalaxyTab && <Network size={11} style={{ color: LX.secondary, flexShrink: 0 }} />}
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
                      style={{ color: con.type === "pdf" ? "var(--luxia-blue-60)" : "var(--luxia-purple-50)" }}
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
}: {
  onCreate: (payload: NewChatPayload) => void;
  onClose: () => void;
}) {
  const [chatType, setChatType] = useState<ChatScope>("galaxy");
  const [projectId, setProjectId] = useState(PROJECTS[0]?.id ?? "");
  const [constellationId, setConstellationId] = useState("");

  const projectConstellations = useMemo(
    () => getProjectConstellations(projectId),
    [projectId],
  );

  const projectOptions = useMemo(
    () => PROJECTS.map((project) => ({ value: project.id, label: project.label })),
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

        <div className="flex-1 overflow-y-auto px-7 pb-5 space-y-5">
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
            />
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
          <Button type="button" variant="secondary" className="rounded-full px-4" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="rounded-full px-4" disabled={!canCreate} onClick={handleCreate}>
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
        <div className="flex-1 overflow-y-auto px-7 pb-2">{children}</div>
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

function RenameDialog({ open, current, onClose, onRename }: {
  open: boolean; current: string; onClose: () => void; onRename: (name: string) => void;
}) {
  const [value, setValue] = useState(current);
  useEffect(() => { if (open) setValue(current); }, [open, current]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.select(), 50); }, [open]);
  return (
    <LuxiaDialog open={open} onClose={onClose} title="Rename Chat"
      footer={<>
        <button onClick={onClose} className="px-5 h-[38px] rounded-full luxia-type-body-dense-strong transition-colors outline-none"
          style={{ color: LX.textMuted, border: `1px solid ${LX.border}` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>Cancel</button>
        <button onClick={() => { if (value.trim()) { onRename(value.trim()); onClose(); } }}
          disabled={!value.trim()}
          className="px-5 h-[38px] rounded-full luxia-type-body-dense-strong text-white transition-opacity hover:opacity-90 disabled:opacity-40 outline-none"
          style={{ background: LX.gradient.button }}>Rename</button>
      </>}>
      <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) { onRename(value.trim()); onClose(); } }}
        className="w-full h-[42px] px-4 rounded-[10px] luxia-type-body-small outline-none"
        style={{ border: `1px solid ${LX.border}`, color: LX.primary }} />
    </LuxiaDialog>
  );
}

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
      footer={<button onClick={onClose} className="px-5 h-[38px] rounded-full luxia-type-body-dense-strong text-white outline-none" style={{ background: LX.gradient.button }}>Done</button>}>
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
        <button onClick={onClose} className="px-5 h-[38px] rounded-full luxia-type-body-dense-strong transition-colors outline-none"
          style={{ color: LX.textMuted, border: `1px solid ${LX.border}` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>Cancel</button>
        <button onClick={() => { onShare(selected); setDone(true); }}
          disabled={selected.length === 0}
          className="px-5 h-[38px] rounded-full luxia-type-body-dense-strong text-white transition-opacity hover:opacity-90 disabled:opacity-40 outline-none"
          style={{ background: LX.gradient.button }}>Share</button>
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
      <div className="space-y-0.5 max-h-48 overflow-y-auto">
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
      footer={<button onClick={onClose} className="px-5 h-[38px] rounded-full luxia-type-body-dense-strong text-white outline-none" style={{ background: LX.gradient.button }}>Close</button>}>
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
        <button onClick={onClose} className="px-5 h-[38px] rounded-full luxia-type-body-dense-strong transition-colors outline-none"
          style={{ color: LX.textMuted, border: `1px solid ${LX.border}` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>Cancel</button>
        <button onClick={onClose}
          className="px-5 h-[38px] rounded-full luxia-type-body-dense-strong text-white transition-opacity hover:opacity-90 outline-none"
          style={{ background: LX.gradient.button }}>Generate and open in editor</button>
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

function DeleteChatDialog({ open, onClose, onDelete }: {
  open: boolean; onClose: () => void; onDelete: () => void;
}) {
  return (
    <LuxiaDialog open={open} onClose={onClose} title="Delete Chat?"
      footer={<>
        <button onClick={onClose} className="px-5 h-[38px] rounded-full luxia-type-body-dense-strong transition-colors outline-none"
          style={{ color: LX.textMuted, border: `1px solid ${LX.border}` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>Cancel</button>
        <button onClick={() => { onDelete(); onClose(); }}
          className="px-5 h-[38px] rounded-full luxia-type-body-dense-strong text-white transition-opacity hover:opacity-90 outline-none"
          style={{ background: "#F75050" }}>Delete Chat</button>
      </>}>
      <p className="py-4 luxia-type-body-small" style={{ color: LX.textSecondary }}>
        This will permanently remove the current chat and all its messages. This action cannot be undone.
      </p>
    </LuxiaDialog>
  );
}

function PageHeader({ chatLabel, chat, onRenameChat, onDeleteChat }: {
  chatLabel: string;
  chat: Chat;
  onRenameChat: (name: string) => void;
  onDeleteChat: () => void;
}) {
  const project = PROJECTS.find((p) => p.id === chat.projectId);
  const constellation = chat.chatType === "constellation" && chat.constellationId
    ? CONSTELLATIONS.find((c) => c.id === chat.constellationId)
    : null;
  const crumbs = chat.chatType === "galaxy"
    ? ["Home", project?.label ?? "Project", "Galaxy", chatLabel]
    : ["Home", project?.label ?? "Project", constellation?.label ?? "Constellation", chatLabel];
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [dialog, setDialog] = useState<"rename" | "share" | "shareList" | "report" | "delete" | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onOutside(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { setMenuOpen(false); btnRef.current?.focus(); } }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onOutside); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  function openMenu() {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    setMenuOpen(true);
  }

  function act(d: typeof dialog) { setMenuOpen(false); setDialog(d); }

  const menuItems: Array<{ label: string; icon: LucideIcon; action: () => void; destructive?: boolean; divider?: boolean }> = [
    { label: "Rename", icon: Pencil, action: () => act("rename") },
    { label: "Share", icon: Share2, action: () => act("share") },
    { label: "Share List", icon: List, action: () => act("shareList") },
    { label: "Generate report", icon: FileBarChart2, action: () => act("report") },
    { label: "Delete chat", icon: Trash2, action: () => act("delete"), destructive: true, divider: true },
  ];

  const isGalaxy = chat.chatType === "galaxy";
  const headerTitle = isGalaxy ? "Galaxy Chat" : chatLabel;

  return (
    <div
      className="flex-shrink-0 flex items-start justify-between gap-6 px-10 pt-4 pb-2"
      style={isGalaxy ? {
        background: "#FAFAFC",
        borderBottom: "1px solid #E8EAF2",
      } : undefined}
    >
      <div className="min-w-0 flex-1">
        <h1 className="mb-1 min-w-0 truncate luxia-type-title-page" style={{ color: LX.primary }}>
          {headerTitle}
        </h1>
        <nav className="flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="luxia-type-metadata" style={{ color: LX.borderStrong }}>/</span>}
                <span className="luxia-type-metadata" style={{
                  color: isLast ? LX.primary : "#697077",
                  fontWeight: isLast ? 600 : 400,
                }}>{crumb}</span>
              </span>
            );
          })}
        </nav>
      </div>

      <button ref={btnRef} onClick={menuOpen ? () => setMenuOpen(false) : openMenu}
        className="flex-shrink-0 flex items-center gap-2 h-[38px] px-5 rounded-full luxia-type-body-dense-strong text-white transition-opacity hover:opacity-90 outline-none"
        style={{ background: LX.gradient.button, boxShadow: "0 2px 10px rgba(48,33,78,0.18)" }}>
        <Settings2 size={14} />
        Options
      </button>

      {menuOpen && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} className="fixed z-[9999] rounded-[12px] overflow-hidden py-1.5"
          style={{
            background: "white",
            boxShadow: "0 4px 16px rgba(15,23,42,0.10)",
            border: "1px solid #E2E8F0",
            width: 220,
            top: menuPos.top,
            right: menuPos.right,
          }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                {item.divider && <div style={{ height: 1, background: "#F1F5F9", margin: "4px 0" }} />}
                <button onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 h-[40px] luxia-type-body-dense-strong text-left transition-colors outline-none"
                  style={{ color: item.destructive ? "#F75050" : "#30214E" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = item.destructive ? "rgba(247,80,80,0.06)" : "rgba(142,99,235,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <Icon size={15} color={item.destructive ? "#F75050" : "#64748B"} strokeWidth={1.8} />
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}

      <RenameDialog open={dialog === "rename"} current={chatLabel} onClose={() => setDialog(null)} onRename={onRenameChat} />
      <ShareDialog open={dialog === "share"} chatLabel={chatLabel} sharedUsers={sharedUsers} onClose={() => setDialog(null)} onShare={(ids) => setSharedUsers(ids)} />
      <ShareListDialog open={dialog === "shareList"} sharedUsers={sharedUsers} onClose={() => setDialog(null)} />
      <GenerateReportDialog open={dialog === "report"} onClose={() => setDialog(null)} />
      <DeleteChatDialog open={dialog === "delete"} onClose={() => setDialog(null)} onDelete={onDeleteChat} />
    </div>
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
    <div className="flex gap-3 mb-7 min-w-0 max-w-full" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-[8px] mt-0.5"
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

/** Must match --luxia-composer-input-max-height / min-height in luxia-tokens.css */
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
    options: Array<{ id: string; label: string; type: "PDF" | "DB" }>;
    onSelectAuto: () => void;
    onSelectManual: (option: { id: string; label: string; type: "PDF" | "DB" }) => void;
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
        <div className="flex-1 overflow-y-auto px-6 py-6">
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

        <div className="flex-1 overflow-y-auto px-8 py-5">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full" aria-label="Close">
                <X size={14} style={{ color: LX.textMuted }} />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>Close</TooltipContent>
          </Tooltip>
        </div>
        <div className="h-px mx-8 flex-shrink-0" style={{ background: LX.border }} />

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
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
                      <Wand2 size={12} />{generating ? "Generating…" : "Generate SQL"}
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
              <Button type="button" variant="secondary" onClick={onClose} className="h-[40px] rounded-[24px] px-5 luxia-type-body-dense-strong" style={{ color: LX.textMuted }}>
                Close
              </Button>
              <Button type="button" onClick={() => setMode("edit")} className="h-[40px] rounded-[24px] px-5 luxia-type-body-dense-strong text-white hover:opacity-90" style={{ background: LX.gradient.button, boxShadow: LX.shadow.sm }}>
                <Edit3 size={14} />Edit
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose} className="h-[40px] rounded-[24px] px-5 luxia-type-body-dense-strong" style={{ color: LX.textMuted }}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={!canSave} className="h-[40px] rounded-[24px] px-5 luxia-type-body-dense-strong text-white hover:opacity-90 disabled:opacity-40" style={{ background: LX.gradient.button, boxShadow: LX.shadow.sm }}>
                <Check size={14} />{submitLabel}
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
            <Wand2 size={15} color={LX.secondary} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="luxia-type-title-panel" style={{ color: LX.primary }}>Auto-generate Knowledge</h2>
            <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>From <span className="font-bold">{constellationLabel}</span></p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full" aria-label="Close">
                <X size={14} style={{ color: LX.textMuted }} />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>Close</TooltipContent>
          </Tooltip>
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
          <Button type="button" onClick={handleGenerate} disabled={generating} className="h-[34px] rounded-[24px] px-4 luxia-type-metadata text-white hover:opacity-90 disabled:opacity-60" style={{ background: LX.gradient.button, boxShadow: LX.shadow.sm }}>
            <Wand2 size={11} />{generating ? "Generating…" : "Generate"}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {generating && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-9 h-9 rounded-full border-2 animate-spin"
                style={{ borderColor: `${LX.secondary} transparent ${LX.secondary} ${LX.secondary}` }} />
              <p className="luxia-type-body-dense-strong" style={{ color: LX.textMuted }}>Generating Knowledge Entries…</p>
            </div>
          )}
          {!generating && generated.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <Wand2 size={28} style={{ color: `${LX.textMuted}55` }} />
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
          <Button type="button" variant="secondary" onClick={onClose} className="h-[40px] rounded-[24px] px-5 luxia-type-body-dense-strong" style={{ color: LX.textMuted }}>
            Cancel
          </Button>
          <Button type="button" onClick={() => { if (selectedEntries.length > 0) { onAdd(selectedEntries); onClose(); } }}
            disabled={selectedEntries.length === 0}
            className="h-[40px] rounded-[24px] px-5 luxia-type-body-dense-strong text-white hover:opacity-90 disabled:opacity-40"
            style={{ background: LX.gradient.button, boxShadow: LX.shadow.sm }}>
            <Plus size={14} />Add {selectedEntries.length > 0 ? `${selectedEntries.length} ` : ""}Selected
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full" aria-label="Close knowledge base">
                  <X size={15} style={{ color: LX.textMuted }} />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Close</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2.5 px-8 pb-5 flex-shrink-0">
            <div className="flex-1 flex items-center gap-2 px-3.5 h-[38px] rounded-[12px]"
              style={{ border: `1px solid ${LX.border}`, background: LX.subtle }}>
              <Search size={13} style={{ color: LX.textMuted }} />
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search questions and answers…"
                className="flex-1 outline-none luxia-type-body-dense bg-transparent" style={{ color: LX.primary }} />
              {searchQ && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSearchQ("")} aria-label="Clear search">
                      <X size={11} style={{ color: LX.textMuted }} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>Clear search</TooltipContent>
                </Tooltip>
              )}
            </div>
            <Button type="button" variant="outline" onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".csv"; i.click(); }}
              className="h-[38px] rounded-[12px] px-3.5 luxia-type-metadata" style={{ color: LX.textMuted }}>
              <Upload size={12} />Import CSV
            </Button>
            <Button type="button" variant="outline" onClick={() => setAutoOpen(true)}
              className="h-[38px] rounded-[12px] px-3.5 luxia-type-metadata" style={{ color: LX.secondary }}>
              <Wand2 size={12} />Auto-generate
            </Button>
            <Button type="button" onClick={() => setAddOpen(true)}
              className="h-[38px] rounded-[12px] px-4 luxia-type-metadata text-white hover:opacity-90"
              style={{ background: LX.gradient.button, boxShadow: LX.shadow.sm }}>
              <Plus size={13} />Add Entry
            </Button>
          </div>

          <div className="h-px mx-8 flex-shrink-0" style={{ background: LX.border }} />

          <div className="flex-1 overflow-y-auto px-8 py-5">
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
      style={{ background: IC.card, border: `1px solid ${IC.border}`, boxShadow: IC.cardShadow }}>
      <div className="flex items-center gap-1.5 px-[14px] py-3">
        <BookOpen size={14} color={IC.iconAccent} className="flex-shrink-0" />
        <span className="flex-1 luxia-type-title-component truncate" style={{ color: IC.textPrimary }}>Knowledge Base</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={(e) => { e.stopPropagation(); onExpand(); }}
              className={IC_BTN_OPEN}
              aria-label="Open full editor"
              onMouseEnter={icHoverOn}
              onMouseLeave={icHoverOff}
              onMouseDown={icOpenActiveOn}
              onMouseUp={icHoverOn}>
              <SquareArrowOutUpRight size={14} strokeWidth={2} style={{ color: IC.textMuted }} />
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>Open full editor</TooltipContent>
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
          <div className="flex items-center gap-1.5 px-2.5 h-[28px] rounded-[7px] mt-2 mb-1"
            style={{ border: `1px solid ${IC.border}`, background: IC.input }}>
            <Search size={10} style={{ color: IC.textMuted }} />
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search…"
              className="flex-1 outline-none luxia-type-caption bg-transparent" style={{ color: IC.textPrimary }} />
            {searchQ && (
              <button onClick={() => setSearchQ("")} className="w-4 h-4 flex items-center justify-center outline-none">
                <X size={9} style={{ color: IC.textMuted }} />
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
                <BookOpen size={10} color={IC.iconAccent} className="flex-shrink-0" />
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
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={CONSTELLATION_MENU_ID}
        disabled={disabled}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        className="inline-flex max-w-full min-w-0 items-center gap-2 overflow-hidden luxia-type-body-dense-strong transition-opacity hover:opacity-75 disabled:cursor-default disabled:opacity-100 outline-none"
        style={{ color: IC.textPrimary }}
      >
        <ConstellationNameWithSource
          label={constellation.label}
          type={constellation.type}
          className="min-w-0"
          labelClassName="luxia-type-body-dense-strong"
        />
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center" aria-hidden>
          <ChevronDown size={11} style={{ color: IC.textMuted }} />
        </span>
      </button>

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
            className="py-1 max-h-[200px] overflow-y-auto"
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

  if (collapsed) {
    return (
      <div
        className="flex h-full min-h-0 flex-shrink-0 flex-col self-stretch"
        style={{
          width: GALAXY_COLLAPSED_WIDTH + GALAXY_PANEL_OUTER_GAP * 2,
          padding: GALAXY_PANEL_OUTER_GAP,
          boxSizing: "border-box",
        }}
        data-luxia-inspector="capsule-collapsed"
      >
        <aside
          className="relative flex min-h-0 flex-1 flex-col items-center overflow-hidden outline-none"
          style={{
            width: GALAXY_COLLAPSED_WIDTH,
            minWidth: GALAXY_COLLAPSED_WIDTH,
            minHeight: 40,
            borderRadius: "var(--luxia-radius-24)",
            backgroundColor: IC.shell,
            backgroundImage: IC.shellGradient,
            border: `1px solid ${IC.shellBorder}`,
            boxShadow: IC.shellShadow,
            transition: "filter 140ms ease, box-shadow 140ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.filter = "brightness(1.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.filter = "none";
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Expand sidebar"
                aria-expanded={false}
                className="mt-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] outline-none focus-visible:outline-none"
                style={{ background: IC.controlBg }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = IC.focusRing;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <ChevronLeft size={16} style={{ color: IC.textMuted }} strokeWidth={2.2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Expand sidebar</TooltipContent>
          </Tooltip>

          <div className="mt-3 flex flex-col items-center gap-3">
            {sectionIds.map((id) => {
              const Icon = SECTION_META[id].icon;
              return (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onCollapse}
                      aria-label={SECTION_META[id].label}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] outline-none focus-visible:outline-none"
                      style={{ background: IC.raised }}
                      onFocus={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = IC.focusRing;
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      }}
                    >
                      <Icon size={18} color="rgba(255, 255, 255, 0.88)" strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">{SECTION_META[id].label}</TooltipContent>
                </Tooltip>
              );
            })}
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
      }}
      data-luxia-inspector="capsule"
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
        className="relative flex-shrink-0 overflow-hidden px-4 pt-3 pb-2.5"
        style={{ background: IC.header, borderBottom: `1px solid ${IC.borderSubtle}` }}
      >
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[6px]"
            style={{ background: IC.selected }}
          >
            <Sparkles size={12} color={IC.iconAccent} />
          </div>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            {isGalaxyChat ? (
              <div className="min-w-0 overflow-hidden">
                <div className="flex min-w-0 items-center gap-1.5 luxia-type-body-dense-strong" style={{ color: IC.textPrimary }}>
                  <Network size={12} style={{ color: IC.iconAccent, flexShrink: 0 }} />
                  <span className="min-w-0 truncate">Galaxy chat</span>
                </div>
                <p className="mt-0.5 truncate luxia-type-caption leading-4" style={{ color: IC.textMuted }}>
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
                aria-label="Collapse sidebar"
                aria-expanded={true}
                className="ml-auto mt-px flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] outline-none focus-visible:outline-none"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  color: IC.textMuted,
                  transition: "background-color 140ms ease, box-shadow 140ms ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = IC.hover;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255, 255, 255, 0.05)";
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
            <TooltipContent side="left">Collapse sidebar</TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-2 pl-[32px]">
          <p
            className="luxia-type-caption"
            style={{
              color: IC.textSecondary,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: descExpanded ? "unset" : 2,
              WebkitBoxOrient: "vertical",
            } as React.CSSProperties}
          >
            {constellation.description}
          </p>
          <button
            onClick={() => setDescExpanded((p) => !p)}
            className="luxia-type-caption mt-0.5 hover:opacity-70 transition-opacity"
            style={{ color: IC.iconAccent }}
          >
            {descExpanded ? "Show less" : "Read more"}
          </button>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2.5 space-y-2 galaxy-panel-scroll"
        style={{ scrollbarWidth: "thin", scrollbarColor: `${IC.scrollThumb} transparent` }}
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
          // Cast keeps the generic branch typed after specialized early-returns exhaust SectionId.
          const fallbackSid = sid as SectionId;
          const sectionItems: string[] = items[fallbackSid] ?? [];
          const FallbackIcon = SECTION_META[fallbackSid].icon;

          return (
            <div key={fallbackSid} className="overflow-hidden rounded-[14px]"
              style={{ background: IC.card, border: `1px solid ${IC.border}`, boxShadow: IC.cardShadow }}>
              <div className="flex items-center gap-1.5 px-[14px] py-3">
                <FallbackIcon size={14} color={IC.iconAccent} className="flex-shrink-0" />
                <span className="flex-1 luxia-type-title-component truncate" style={{ color: IC.textPrimary }}>{SECTION_META[fallbackSid].label}</span>
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
                      className="w-full outline-none resize-none luxia-type-metadata p-2.5 rounded-[12px] mt-2 transition-colors"
                      style={{ color: IC.textPrimary, background: IC.instructionField, border: `1px solid ${IC.border}` }}
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

      <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: `1px solid ${IC.borderSubtle}`, background: IC.header }}>
        {constellationFeedback ? (
          <p className="mb-2 text-center luxia-type-caption" role="status"
            style={{ color: constellationFeedback.type === "error" ? LX.error : LX.success }}>
            {constellationFeedback.message}
          </p>
        ) : null}
        <button
          type="button"
          disabled={!constellationDirty || constellationSaving}
          onClick={saveConstellation}
          className="flex h-[38px] w-full items-center justify-center gap-2 rounded-[10px] luxia-type-body-dense-strong outline-none disabled:cursor-not-allowed"
          style={{
            color: constellationDirty && !constellationSaving ? "#FFFFFF" : IC.disabledText,
            background: constellationDirty && !constellationSaving ? IC.saveEnabled : IC.disabledSurface,
            border: `1px solid ${constellationDirty && !constellationSaving ? "transparent" : IC.disabledBorder}`,
            boxShadow: constellationDirty && !constellationSaving ? "var(--luxia-shadow-sm)" : "none",
            opacity: 1,
          }}
        >
          <Check size={13} />{constellationSaving ? "Saving…" : "Save Constellation"}
        </button>
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
  const [activeChat, setActiveChat] = useState("c1");
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [language, setLanguage] = useState("EN");
  const [assistantMode, setAssistantMode] = useState("Luxia");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [galaxySessions, setGalaxySessions] = useState<Record<string, GalaxySessionState>>(() => ({
    g1: createIdleGalaxySession("Project Name 1"),
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
      /* ignore storage errors */
    }
  }, [leftNavCollapsedPreference]);

  useEffect(() => {
    function onResize() {
      setViewportWidth(window.innerWidth);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
  const activeConstellation = resolveChatConstellation(activeData);
  const messages = chatMessages[activeChat] ?? [];

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
    setShowNewChatModal(true);
  }

  function handleNewChatCreate(payload: NewChatPayload) {
    const id = `c${Date.now()}`;
    const n = chats.length + 1;
    const galaxyCount = chats.filter((c) => c.chatType === "galaxy").length;
    const projectName = PROJECTS.find((p) => p.id === payload.projectId)?.label ?? "Project";
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
    setActiveChat(id);
    setShowNewChatModal(false);
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
      setActiveChat(remaining[remaining.length - 1]!.id);
    }
  }

  function handleConstellationChange(conId: string) {
    const active = chats.find((c) => c.id === activeChat);
    if (!active || active.chatType !== "constellation") return;
    setChats((p) => p.map((c) => c.id === activeChat ? { ...c, constellationId: conId } : c));
  }

  function updateGalaxySession(chatId: string, patch: Partial<GalaxySessionState>) {
    setGalaxySessions((prev) => {
      const current = prev[chatId] ?? createIdleGalaxySession(
        PROJECTS.find((p) => p.id === chats.find((c) => c.id === chatId)?.projectId)?.label ?? "Project",
      );
      return { ...prev, [chatId]: { ...current, ...patch } };
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
    const projectName = PROJECTS.find((p) => p.id === active?.projectId)?.label ?? "Project";

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
    const match = CONSTELLATIONS.find((c) => c.id === matchedId);
    if (!match) return;
    const existing = chats.find(
      (c) => c.chatType === "constellation" && c.constellationId === match.id,
    );
    if (existing) {
      setActiveChat(existing.id);
      return;
    }
    const id = `c${Date.now()}`;
    setChats((p) => [...p, {
      id,
      label: match.label,
      chatType: "constellation",
      projectId: match.projectId,
      constellationId: match.id,
    }]);
    setChatMessages((p) => ({ ...p, [id]: [] }));
    setActiveChat(id);
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
    ? (galaxySessions[activeChat] ?? createIdleGalaxySession(
        PROJECTS.find((p) => p.id === activeData.projectId)?.label ?? "Project",
      ))
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

  const galaxyProjectName = PROJECTS.find((p) => p.id === (activeData?.projectId ?? PROJECTS[0].id))?.label
    ?? "Project";

  const galaxyRouteOptions = useMemo(() => {
    const seeds = getProjectConstellations(activeData?.projectId ?? PROJECTS[0].id).map((c) => ({
      id: c.id,
      label: c.label,
      type: getConstellationSourceLabel(c.type) as "PDF" | "DB",
    }));
    return buildGalaxyRouteCatalog(galaxyProjectName, seeds);
  }, [activeData?.projectId, galaxyProjectName]);

  const pendingManual = activeGalaxySession?.pendingManualId
    ? (() => {
        const found = galaxyRouteOptions.find((o) => o.id === activeGalaxySession.pendingManualId);
        return found ? { id: found.id, label: found.label, type: found.type } : null;
      })()
    : null;

  return (
    <div
      className="flex h-dvh max-h-dvh overflow-hidden"
      style={{ background: activeData?.chatType === "galaxy" ? "#FAFAFC" : "#FAFDFF" }}
    >
      <LeftNav
        collapsed={leftNavCollapsed}
        onToggleCollapsed={handleLeftNavToggle}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <PageHeader
          chatLabel={activeData?.label ?? "Chat 1"}
          chat={activeData ?? INITIAL_CHATS[0]}
          onRenameChat={(name) => setChats((p) => p.map((c) => c.id === activeChat ? { ...c, label: name } : c))}
          onDeleteChat={handleCloseChat.bind(null, activeChat)}
        />

        <ChatTabBar
          chats={chats} activeId={activeChat}
          onSelect={setActiveChat} onNew={handleNewChat}
          onClose={handleCloseChat}
          onPin={(id) => setChats(p => p.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c))}
          onRename={(id, label) => setChats(p => p.map(c => c.id === id ? { ...c, label } : c))}
        />

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            style={{ minWidth: 0 }}
          >
            <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-10 py-5">
              {messages.length === 0
                ? (activeData?.chatType === "galaxy"
                  ? (
                    <GalaxyEmptyState
                      projectName={PROJECTS.find((p) => p.id === activeData.projectId)?.label ?? "Project"}
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
              allConstellations={CONSTELLATIONS}
              onConstellationChange={handleConstellationChange}
              projectId={activeData?.projectId ?? PROJECTS[0].id}
              allowConstellationChange={activeData?.chatType === "constellation"}
              isGalaxyChat={false}
            />
          )}
        </div>
      </div>

      {showNewChatModal && (
        <NewChatModal
          onCreate={handleNewChatCreate}
          onClose={() => setShowNewChatModal(false)}
        />
      )}
    </div>
  );
}
