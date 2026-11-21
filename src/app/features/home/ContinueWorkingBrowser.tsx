import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { getProjectNameById } from "@/app/features/project/data";
import {
  LuxiaBreadcrumb,
  buildHomeArchiveBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { ChangePrimaryDialog } from "./ChangePrimaryDialog";
import {
  BROWSER_PAGE_SIZE,
  BrowserFilterDropdown,
  BrowserPagination,
  BrowserShell,
  CollectionFilterBar,
  FilterChip,
  FilteredEmptyState,
  FilterField,
  ResultsCount,
  SegmentedFilterGroup,
  WORK_ARCHIVE_GRID,
} from "./browserShared";
import {
  areAllWorkItemsHidden,
  filterContinueWorkItems,
  formatWorkLastOpened,
  listContinueWorkingCollection,
  sortContinueWorkItems,
  type ContinueEntityFilter,
  type ContinueSortMode,
  type ContinueSourceFilter,
  type ContinueVisibilityFilter,
} from "./browserUtils";
import { EntityIdentityRow } from "./entityIdentity";
import {
  buildContinueFocusMenuItems,
  HomeContinueMenu,
} from "./HomeContinueMenu";
import { getHomeCardStyle, getSourceAccentColor, HS } from "./homeSurfaces";
import type { HomeEntityKey } from "./homeEntityKeys";
import { workItemEntityKey } from "./homeEntityKeys";
import { PinButton } from "./PinButton";
import {
  CollectorViewToggle,
  readCollectorViewMode,
  writeCollectorViewMode,
  type CollectorViewMode,
} from "@/app/features/shared";
import type { HomeProjectCard, HomeRecentWorkItem } from "./types";
import { LuxiaAiIcon } from "@/assets/icons";
import { formatHomeChatActivity } from "./homeBuilder/chatActivity";
import {
  lastLuxiaAiMessagePreview,
  matchesLuxiaAiConversation,
  type LuxiaAiConversation,
} from "@/app/features/luxia-ai/conversationStore";

const PAGE_TITLE = "All conversations";
const PAGE_TYPE_LABEL = "CONVERSATIONS";
const PAGE_DESCRIPTION = "Your Luxia AI conversations, Project Chats and Galaxies, each labelled by type. Writing Assistant documents and VerifAI reviews stay in their own tools.";

interface ContinueWorkingBrowserProps {
  /** Saved Luxia AI conversations (standalone assistant, no Project). Listed only with `onOpenLuxiaConversation`. */
  luxiaConversations?: readonly LuxiaAiConversation[];
  /** Opens one Luxia AI conversation in the Luxia AI workspace. */
  onOpenLuxiaConversation?: (conversationId: string) => void;
  /** Opens the Luxia AI workspace. */
  onOpenLuxiaWorkspace?: () => void;
  items: HomeRecentWorkItem[];
  dismissedKeys: HomeEntityKey[];
  heroEntityKey: HomeEntityKey | null;
  projects: HomeProjectCard[];
  onBack: () => void;
  onContinue: (item: HomeRecentWorkItem) => void;
  onTogglePin: (itemId: string) => void;
  onRestore: (entityKey: HomeEntityKey) => void;
  onDismiss: (entityKey: HomeEntityKey) => void;
  onSetPrimary: (entityKey: HomeEntityKey) => void;
  onShowAllOnHome: () => void;
  onNewChat: () => void;
  onOpenGalaxy: (projectId: string) => void;
  onNewProject: () => void;
}

function SourceTag({ source }: { source: "database" | "csv" | "pdf" }) {
  const isDb = source === "database";
  const label = source === "database" ? "DB" : source === "csv" ? "CSV" : "PDF";
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data"
      style={{
        color: getSourceAccentColor(source, "soft"),
        background: isDb
          ? "var(--luxia-opacity-brand-secondary-16)"
          : "var(--luxia-opacity-blue-16)",
      }}
    >
      {label}
    </span>
  );
}

function WorkItemCard({
  item,
  projects,
  isHidden,
  isHomeFocus,
  onContinue,
  onTogglePin,
  onRestore,
  onDismiss,
  onOpenChangeFocus,
  onSetAsFocus,
}: {
  item: HomeRecentWorkItem;
  projects: readonly HomeProjectCard[];
  isHidden: boolean;
  isHomeFocus: boolean;
  onContinue: () => void;
  onTogglePin: () => void;
  onRestore: () => void;
  onDismiss: () => void;
  onOpenChangeFocus: () => void;
  onSetAsFocus: () => void;
}) {
  const entityType = item.kind === "galaxySession" ? "galaxy-conversation" : "chat";
  const entityColor = item.kind === "galaxySession"
    ? HS.accentGalaxy
    : (getSourceAccentColor(item.constellationSource, "soft") ?? HS.accentChat);
  const projectName = getProjectNameById(item.projectId, projects);
  const cardStyle = getHomeCardStyle("supportingProject");

  const menuItems = buildContinueFocusMenuItems({
    title: item.title,
    focusAction: isHomeFocus ? "change" : "set",
    visibilityAction: isHidden ? "show" : "hide",
    onChangePrimary: onOpenChangeFocus,
    onSetAsFocus: isHomeFocus ? undefined : onSetAsFocus,
    onShow: isHidden ? onRestore : undefined,
    onHide: !isHidden ? onDismiss : undefined,
  });

  return (
    <article
      className="relative flex h-full min-w-0 flex-col overflow-hidden p-4 transition-colors hover:border-[var(--luxia-opacity-brand-primary-16)]"
      style={{
        background: cardStyle.bg,
        border: `1px solid ${cardStyle.border}`,
        borderRadius: "var(--luxia-radius-12)",
      }}
    >
      <div
        className="absolute z-[2] flex shrink-0 items-center gap-1"
        style={{ top: 8, right: 8 }}
      >
        <PinButton
          pinned={Boolean(item.isPinned)}
          label={item.title}
          controlSize="project"
          onToggle={onTogglePin}
        />
        {menuItems.length > 0 ? (
          <HomeContinueMenu
            label={item.title}
            controlSize="default"
            items={menuItems}
          />
        ) : null}
      </div>

      <div className="relative z-[1] min-w-0" style={{ paddingRight: 72 }}>
        <EntityIdentityRow
          entityType={entityType}
          iconColor={entityColor}
          size="compact"
        />

        <h3
          className="mt-1.5 line-clamp-2 luxia-type-title-card"
          style={{ color: HS.workCardTitle }}
          title={item.title}
        >
          {item.title}
        </h3>

        <div className="mt-1.5 space-y-0.5">
          <p
            className="truncate luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
            aria-label={`Project: ${projectName}`}
          >
            {projectName}
          </p>
          {item.constellationName ? (
            <p
              className="flex min-w-0 items-center gap-1.5 truncate luxia-type-body-dense"
              style={{ color: "var(--luxia-text-secondary)" }}
              aria-label={`Constellation: ${item.constellationName}${
                item.constellationSource
                  ? `, Source: ${
                      item.constellationSource === "database"
                        ? "DB"
                        : item.constellationSource === "csv"
                          ? "CSV"
                          : "PDF"
                    }`
                  : ""
              }`}
            >
              <span className="truncate">{item.constellationName}</span>
              {item.constellationSource ? (
                <SourceTag source={item.constellationSource} />
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            {formatWorkLastOpened(item)}
          </p>
          {isHomeFocus ? (
            <span
              className="inline-flex rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data"
              style={{
                color: HS.accentGalaxy,
                background: "var(--luxia-opacity-brand-primary-08)",
                letterSpacing: "0.04em",
              }}
            >
              HOME FOCUS
            </span>
          ) : null}
          {isHidden ? (
            <span
              className="inline-flex rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data"
              style={{
                color: "var(--luxia-text-muted)",
                background: "var(--luxia-surface-subtle)",
                letterSpacing: "0.04em",
              }}
            >
              HIDDEN FROM HOME
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-[1] mt-auto flex flex-wrap items-center pt-3">
        <Button
          type="button"
          variant="primary"
          size="compact"
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </article>
  );
}

/**
 * List View row — same visual system as the Projects List View (bordered list, one row per item,
 * title + one-line metadata, actions on the right). Uses the SAME item, menu and handlers as the card.
 */
function WorkItemRow({
  item,
  projects,
  isHidden,
  isHomeFocus,
  onContinue,
  onTogglePin,
  onRestore,
  onDismiss,
  onOpenChangeFocus,
  onSetAsFocus,
}: Parameters<typeof WorkItemCard>[0]) {
  const isGalaxy = item.kind === "galaxySession";
  const entityType = isGalaxy ? "galaxy-conversation" : "chat";
  const entityColor = isGalaxy
    ? HS.accentGalaxy
    : (getSourceAccentColor(item.constellationSource, "soft") ?? HS.accentChat);
  const projectName = getProjectNameById(item.projectId, projects);
  const menuItems = buildContinueFocusMenuItems({
    title: item.title,
    focusAction: isHomeFocus ? "change" : "set",
    visibilityAction: isHidden ? "show" : "hide",
    onChangePrimary: onOpenChangeFocus,
    onSetAsFocus: isHomeFocus ? undefined : onSetAsFocus,
    onShow: isHidden ? onRestore : undefined,
    onHide: !isHidden ? onDismiss : undefined,
  });
  return (
    <div
      role="listitem"
      className="flex min-w-0 flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0"
      style={{ borderColor: "var(--luxia-border-default)" }}
      data-work-row={item.id}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <EntityIdentityRow entityType={entityType} iconColor={entityColor} size="compact" />
          {isHomeFocus ? (
            <span className="inline-flex shrink-0 rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data" style={{ color: HS.accentGalaxy, background: "var(--luxia-opacity-brand-primary-08)", letterSpacing: "0.04em" }}>HOME FOCUS</span>
          ) : null}
          {isHidden ? (
            <span className="inline-flex shrink-0 rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)", background: "var(--luxia-surface-subtle)", letterSpacing: "0.04em" }}>HIDDEN FROM HOME</span>
          ) : null}
        </div>
        <p className="mt-1 truncate luxia-type-body-dense-strong" style={{ color: HS.workCardTitle }} title={item.title}>
          {item.title}
        </p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          <span className="min-w-0 truncate" aria-label={`Project: ${projectName}`}>{projectName}</span>
          <span aria-hidden>·</span>
          {isGalaxy ? (
            <span className="shrink-0">Galaxy</span>
          ) : item.constellationName ? (
            <span className="flex min-w-0 items-center gap-1.5" aria-label={`Constellation: ${item.constellationName}`}>
              <span className="min-w-0 truncate">{item.constellationName}</span>
              {item.constellationSource ? <SourceTag source={item.constellationSource} /> : null}
            </span>
          ) : null}
          <span className="hidden shrink-0 md:inline" aria-hidden>·</span>
          <span className="hidden shrink-0 md:inline">{formatWorkLastOpened(item)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <PinButton pinned={Boolean(item.isPinned)} label={item.title} controlSize="project" onToggle={onTogglePin} />
        {menuItems.length > 0 ? <HomeContinueMenu label={item.title} controlSize="default" items={menuItems} /> : null}
        <Button type="button" variant="primary" size="compact" onClick={onContinue} aria-label={`Continue ${item.title}`}>
          Continue
        </Button>
      </div>
    </div>
  );
}

/** Type label for a Luxia AI conversation, in the same style as CHAT / GALAXY. */
function LuxiaAiIdentityRow() {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span role="img" aria-label="Luxia AI" className="inline-flex shrink-0" style={{ color: LUXIA_AI_ACCENT }}>
        <LuxiaAiIcon size={18} color="currentColor" />
      </span>
      <span className="truncate luxia-type-caption" style={{ color: LUXIA_AI_ACCENT, letterSpacing: "0.06em", fontWeight: 700 }}>
        LUXIA AI
      </span>
    </div>
  );
}

const LUXIA_AI_ACCENT = "var(--luxia-purple-60)";

function luxiaAiActivity(conversation: LuxiaAiConversation): string {
  return formatHomeChatActivity(conversation.updatedAt, undefined)?.long.replace(/^Opened/, "Updated") ?? "Updated recently";
}

/** A Luxia AI conversation card: not part of a Project, managed (rename, delete) in the Luxia AI workspace. */
function LuxiaAiConversationCard({ conversation, onContinue }: { conversation: LuxiaAiConversation; onContinue: () => void }) {
  const cardStyle = getHomeCardStyle("supportingProject");
  return (
    <article
      className="relative flex h-full min-w-0 flex-col overflow-hidden p-4 transition-colors hover:border-[var(--luxia-opacity-brand-primary-16)]"
      style={{ background: cardStyle.bg, border: `1px solid ${cardStyle.border}`, borderRadius: "var(--luxia-radius-12)" }}
      data-luxia-ai-conversation-card={conversation.id}
    >
      <div className="relative z-[1] min-w-0">
        <LuxiaAiIdentityRow />
        <h3 className="mt-1.5 line-clamp-2 luxia-type-title-card" style={{ color: HS.workCardTitle }} title={conversation.title}>
          {conversation.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          {lastLuxiaAiMessagePreview(conversation)}
        </p>
        <p className="mt-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          Not in a Project · {luxiaAiActivity(conversation)}
        </p>
      </div>
      <div className="relative z-[1] mt-auto flex flex-wrap items-center pt-3">
        <Button type="button" variant="primary" size="compact" onClick={onContinue} aria-label={`Continue Luxia AI conversation ${conversation.title}`}>
          Continue
        </Button>
      </div>
    </article>
  );
}

function LuxiaAiConversationRow({ conversation, onContinue }: { conversation: LuxiaAiConversation; onContinue: () => void }) {
  return (
    <div
      role="listitem"
      className="flex min-w-0 flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0"
      style={{ borderColor: "var(--luxia-border-default)" }}
      data-luxia-ai-conversation-row={conversation.id}
    >
      <div className="min-w-0 flex-1">
        <LuxiaAiIdentityRow />
        <p className="mt-1 truncate luxia-type-body-dense-strong" style={{ color: HS.workCardTitle }} title={conversation.title}>
          {conversation.title}
        </p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          <span className="shrink-0">Not in a Project</span>
          <span aria-hidden>·</span>
          <span className="min-w-0 truncate">{luxiaAiActivity(conversation)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <Button type="button" variant="primary" size="compact" onClick={onContinue} aria-label={`Continue Luxia AI conversation ${conversation.title}`}>
          Continue
        </Button>
      </div>
    </div>
  );
}

type ConversationEntry =
  | { kind: "work"; key: string; title: string; at: number; pinned: boolean; item: HomeRecentWorkItem }
  | { kind: "luxia-ai"; key: string; title: string; at: number; pinned: boolean; conversation: LuxiaAiConversation };

function compareEntries(sortMode: ContinueSortMode) {
  return (a: ConversationEntry, b: ConversationEntry): number => {
    if (sortMode === "name-asc") return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    if (sortMode === "name-desc") return b.title.localeCompare(a.title, undefined, { sensitivity: "base" });
    if (sortMode === "opened-oldest") return a.at - b.at;
    if (sortMode === "pinned" && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.at - a.at;
  };
}

function PageHeaderStack({
  onBack,
  actions,
  children,
}: {
  onBack: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 w-full">
      <LuxiaPageHeader
        contentGap="page"
        className="luxia-home-browser-header"
        pageTypeLabel={PAGE_TYPE_LABEL}
        actions={actions}
        title={PAGE_TITLE}
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={buildHomeArchiveBreadcrumbItems({
              archiveId: "your-work",
              archiveLabel: PAGE_TITLE,
            })}
            handlers={{ onHome: onBack }}
          />
        }
        guide={PAGE_DESCRIPTION}
      />
      {children}
    </div>
  );
}

export function ContinueWorkingBrowser({
  luxiaConversations = [],
  onOpenLuxiaConversation,
  onOpenLuxiaWorkspace,
  items,
  dismissedKeys,
  heroEntityKey,
  projects,
  onBack,
  onContinue,
  onTogglePin,
  onRestore,
  onDismiss,
  onSetPrimary,
  onShowAllOnHome,
  onNewChat,
  onOpenGalaxy,
  onNewProject,
}: ContinueWorkingBrowserProps) {
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<ContinueEntityFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<ContinueSourceFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<ContinueVisibilityFilter>("all");
  const [sortMode, setSortMode] = useState<ContinueSortMode>("opened");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<CollectorViewMode>(() => readCollectorViewMode("chats-galaxies"));
  const handleViewModeChange = (mode: CollectorViewMode) => {
    setViewMode(mode);
    writeCollectorViewMode("chats-galaxies", mode);
  };
  const [changePrimaryOpen, setChangePrimaryOpen] = useState(false);

  const collection = useMemo(() => listContinueWorkingCollection(items), [items]);
  const dismissedSet = useMemo(() => new Set(dismissedKeys), [dismissedKeys]);
  const allHidden = areAllWorkItemsHidden(items, dismissedKeys);
  const showsLuxiaAi = Boolean(onOpenLuxiaConversation);
  const listedLuxiaConversations = showsLuxiaAi ? luxiaConversations : [];
  const genuinelyEmpty = collection.length === 0 && listedLuxiaConversations.length === 0;

  /**
   * One list of conversations: Project Chats and Galaxies (with their Project filters) and Luxia AI
   * conversations, which have no Project, Source or Home visibility, so those filters leave them out.
   */
  const filteredItems = useMemo((): ConversationEntry[] => {
    const work: ConversationEntry[] = sortContinueWorkItems(
      filterContinueWorkItems(items, {
        query,
        entityFilter,
        sourceFilter,
        visibilityFilter,
        dismissedKeys: dismissedSet,
        projects,
      }),
      sortMode,
    ).map((item) => ({ kind: "work", key: item.id, title: item.title, at: item.lastOpenedAt ?? 0, pinned: Boolean(item.isPinned), item }));
    const q = query.trim().toLowerCase();
    const luxia: ConversationEntry[] = (entityFilter === "all" || entityFilter === "luxia-ai")
      && sourceFilter === "all"
      && visibilityFilter !== "hidden"
      ? listedLuxiaConversations
        .filter((conversation) => matchesLuxiaAiConversation(conversation, q) || (q.length > 0 && "luxia ai".includes(q)))
        .map((conversation) => ({ kind: "luxia-ai", key: `luxia-ai:${conversation.id}`, title: conversation.title, at: conversation.updatedAt, pinned: false, conversation }))
      : [];
    // Stable sort: Project items keep their existing order among themselves.
    return [...work, ...luxia].sort(compareEntries(sortMode));
  }, [
    items,
    listedLuxiaConversations,
    query,
    entityFilter,
    sourceFilter,
    visibilityFilter,
    dismissedSet,
    sortMode,
    projects,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / BROWSER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice(
    (currentPage - 1) * BROWSER_PAGE_SIZE,
    currentPage * BROWSER_PAGE_SIZE,
  );

  const hasActiveFilters = Boolean(
    query.trim()
    || entityFilter !== "all"
    || sourceFilter !== "all"
    || visibilityFilter !== "all"
    || sortMode !== "opened",
  );

  const clearFilters = () => {
    setQuery("");
    setEntityFilter("all");
    setSourceFilter("all");
    setVisibilityFilter("all");
    setSortMode("opened");
  };

  useEffect(() => {
    setPage(1);
  }, [query, entityFilter, sourceFilter, visibilityFilter, sortMode]);

  const galaxyProject = projects.find((project) => !project.isEmpty) ?? projects[0];
  const workspaceAction = onOpenLuxiaWorkspace ? (
    <Button type="button" variant="outline" size="compact" onClick={onOpenLuxiaWorkspace} data-open-luxia-ai-workspace="">
      <LuxiaAiIcon size={15} color="currentColor" aria-hidden />
      Luxia AI workspace
    </Button>
  ) : undefined;

  if (genuinelyEmpty) {
    return (
      <PageHeaderStack onBack={onBack} actions={workspaceAction}>
        <div
          className="rounded-[12px] border px-5 py-6"
          style={{
            borderColor: "var(--luxia-border-default)",
            background: "var(--luxia-surface)",
          }}
        >
          <h2 className="luxia-type-title-component" style={{ color: HS.sectionHeading }}>
            No conversations yet
          </h2>
          <p className="mt-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            Ask Luxia AI on Home, start a Chat or open a Project Galaxy to see your conversations here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={onNewChat}>
              New Chat
            </Button>
            {galaxyProject ? (
              <Button type="button" variant="outline" onClick={() => onOpenGalaxy(galaxyProject.id)}>
                Open Galaxy
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={onNewProject}>
                New Project
              </Button>
            )}
          </div>
        </div>
      </PageHeaderStack>
    );
  }

  const allHiddenBanner = allHidden ? (
    <div
      className="mb-3 flex flex-col gap-3 rounded-[10px] border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
      style={{
        borderColor: "var(--luxia-opacity-brand-primary-16)",
        background: "var(--luxia-opacity-brand-primary-04)",
      }}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <Info
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className="mt-0.5 shrink-0"
          style={{ color: HS.sectionHeading }}
        />
        <div className="min-w-0">
          <p className="luxia-type-body-dense-strong" style={{ color: HS.sectionHeading }}>
            Nothing is currently shown on Home
          </p>
          <p className="mt-0.5 luxia-type-body-small" style={{ color: "var(--luxia-text-secondary)" }}>
            Your Chats and Galaxies are still available here.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:pl-2">
        <Button
          type="button"
          variant="outline"
          size="compact"
          onClick={() => setChangePrimaryOpen(true)}
        >
          Choose Home focus
        </Button>
        <Button
          type="button"
          variant="primary"
          size="compact"
          onClick={onShowAllOnHome}
          aria-label="Show all Chats and Galaxies on Home"
        >
          Show all on Home
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <BrowserShell
        title={PAGE_TITLE}
        pageTypeLabel={PAGE_TYPE_LABEL}
        archiveId="your-work"
        description={PAGE_DESCRIPTION}
        onBack={onBack}
        actions={workspaceAction}
        searchLabel="Search conversations"
        searchPlaceholder="Search conversations"
        searchValue={query}
        onSearchChange={setQuery}
        banner={allHiddenBanner}
        controlsSpacing="compact"
        filters={(
          <CollectionFilterBar
            trailing={(
              <>
                {hasActiveFilters ? (
                  <Button type="button" variant="tertiary" size="compact" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
                <CollectorViewToggle value={viewMode} onChange={handleViewModeChange} />
                <ResultsCount>
                  {filteredItems.length} {filteredItems.length === 1 ? "result" : "results"}
                </ResultsCount>
              </>
            )}
          >
            <FilterField label="Type">
              <SegmentedFilterGroup label="Type">
                <FilterChip active={entityFilter === "all"} onClick={() => setEntityFilter("all")}>
                  All
                </FilterChip>
                {showsLuxiaAi ? (
                  <FilterChip active={entityFilter === "luxia-ai"} onClick={() => setEntityFilter("luxia-ai")}>
                    Luxia AI
                  </FilterChip>
                ) : null}
                <FilterChip active={entityFilter === "chat"} onClick={() => setEntityFilter("chat")}>
                  Project Chats
                </FilterChip>
                <FilterChip active={entityFilter === "galaxy"} onClick={() => setEntityFilter("galaxy")}>
                  Galaxies
                </FilterChip>
              </SegmentedFilterGroup>
            </FilterField>

            <BrowserFilterDropdown
              label="Source"
              ariaLabel="Filter by source"
              value={sourceFilter}
              onValueChange={(value) => setSourceFilter(value as ContinueSourceFilter)}
              dataAttr="source"
              options={[
                { value: "all", label: "All sources" },
                { value: "database", label: "Database" },
                { value: "csv", label: "CSV" },
                { value: "pdf", label: "PDF" },
              ]}
            />

            <BrowserFilterDropdown
              label="Visibility"
              ariaLabel="Filter by visibility"
              value={visibilityFilter}
              onValueChange={(value) => setVisibilityFilter(value as ContinueVisibilityFilter)}
              dataAttr="visibility"
              options={[
                { value: "all", label: "All visibility" },
                { value: "visible", label: "Visible on Home" },
                { value: "hidden", label: "Hidden from Home" },
              ]}
            />

            <BrowserFilterDropdown
              label="Sort"
              ariaLabel="Sort conversations"
              value={sortMode}
              onValueChange={(value) => setSortMode(value as ContinueSortMode)}
              dataAttr="sort"
              options={[
                { value: "opened", label: "Recently opened" },
                { value: "opened-oldest", label: "Oldest opened" },
                { value: "name-asc", label: "Name A–Z" },
                { value: "name-desc", label: "Name Z–A" },
                { value: "pinned", label: "Pinned first" },
              ]}
            />
          </CollectionFilterBar>
        )}
        footer={(
          <BrowserPagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      >
        {pageItems.length === 0 ? (
          <FilteredEmptyState
            title="No matching conversations"
            onClear={hasActiveFilters ? clearFilters : undefined}
          />
        ) : (
          <div
            className={viewMode === "grid" ? WORK_ARCHIVE_GRID : "overflow-hidden rounded-[var(--luxia-radius-12)] border bg-white"}
            style={viewMode === "grid" ? undefined : { borderColor: "var(--luxia-border-default)" }}
            role={viewMode === "grid" ? undefined : "list"}
            aria-label={viewMode === "grid" ? undefined : "Conversations"}
            data-work-view={viewMode}
          >
            {pageItems.map((entry) => {
              if (entry.kind === "luxia-ai") {
                const LuxiaView = viewMode === "grid" ? LuxiaAiConversationCard : LuxiaAiConversationRow;
                return (
                  <LuxiaView
                    key={entry.key}
                    conversation={entry.conversation}
                    onContinue={() => onOpenLuxiaConversation?.(entry.conversation.id)}
                  />
                );
              }
              const item = entry.item;
              const entityKey = workItemEntityKey(item);
              const isHidden = dismissedSet.has(entityKey);
              const isHomeFocus = heroEntityKey === entityKey && !isHidden;
              const View = viewMode === "grid" ? WorkItemCard : WorkItemRow;

              return (
                <View
                  key={item.id}
                  item={item}
                  projects={projects}
                  isHidden={isHidden}
                  isHomeFocus={isHomeFocus}
                  onContinue={() => onContinue(item)}
                  onTogglePin={() => onTogglePin(item.id)}
                  onRestore={() => onRestore(entityKey)}
                  onDismiss={() => onDismiss(entityKey)}
                  onOpenChangeFocus={() => setChangePrimaryOpen(true)}
                  onSetAsFocus={() => onSetPrimary(entityKey)}
                />
              );
            })}
          </div>
        )}
      </BrowserShell>

      <ChangePrimaryDialog
        open={changePrimaryOpen}
        items={collection}
        currentKey={heroEntityKey}
        projects={projects}
        onClose={() => setChangePrimaryOpen(false)}
        onSelect={(entityKey) => onSetPrimary(entityKey)}
      />
    </>
  );
}
