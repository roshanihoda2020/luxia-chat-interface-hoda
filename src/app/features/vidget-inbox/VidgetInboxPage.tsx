import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AlertTriangle, Inbox, MessageSquare, Plus, Search, Share2 } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  BrowserFilterSelect,
  FilterToolbar,
  ResultsCount,
} from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import { LUXIA_SETTINGS_TABLE_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { VidgetsCollectionNav } from "@/app/features/vidgets/VidgetsCollectionNav";
import { VIDGET_CHANNEL_LABELS, type VidgetChannel, type VidgetRecord } from "@/app/features/vidgets/types";
import { VIDGETS_GUIDANCE } from "@/app/features/vidgets/ia";
import { InboxConversationThread } from "./InboxConversationThread";
import { InboxShareDialog } from "./InboxShareDialog";
import { InboxSplitPanes } from "./InboxSplitPanes";
import {
  EMPTY_VIDGET_INBOX_QUERY,
  filterVidgetInboxSessions,
  inboxQueryHasActiveFilters,
  uniqueInboxChannels,
  uniqueInboxConstellationIds,
  uniqueInboxLocales,
} from "./filters";
import { getVidgetInboxSessionById, getVidgetInboxSessionsForProject } from "./fixture";
import { formatProblemCount, formatProblemSummary } from "./problems";
import { parseVidgetInboxQueryFromSearch, serializeVidgetInboxQuery } from "./query";
import { getVidgetInboxCaptureVersion, subscribeVidgetInboxCapture } from "./sessionStore";
import { conversationShareScope, createVidgetInboxReviewShare, selectedShareScope } from "./share";
import type {
  VidgetInboxDateFilter,
  VidgetInboxProblemsFilter,
  VidgetInboxQuery,
  VidgetInboxRefinePayload,
  VidgetInboxReviewShareScope,
  VidgetInboxSession,
} from "./types";

const INBOX_SPLIT_MIN_WIDTH = 1024;

const TABLE_HEADER_CELL =
  "px-1.5 py-2 first:pl-2 last:pr-2 align-middle luxia-type-label-small";
const TABLE_BODY_CELL =
  "px-1.5 py-2 first:pl-2 last:pr-2 align-middle luxia-type-body-dense";
const COL_CHECK = "w-7";
const COL_STARTED = "w-[24%]";
const COL_VIDGET = "w-[30%]";
const COL_CHANNEL = "w-[20%]";
const COL_MESSAGES = "w-[4.75rem]";
const COL_PROBLEMS = "w-[6.75rem]";

function moreInboxFilterCount(query: VidgetInboxQuery): number {
  let count = 0;
  if (query.locale) count += 1;
  if (query.date !== "all") count += 1;
  if (query.constellationId) count += 1;
  return count;
}

function formatInboxTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InboxPanelEmptyState({
  icon,
  title,
  description,
  action,
  contained = false,
  quiet = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  contained?: boolean;
  quiet?: boolean;
}) {
  return (
    <div
      className={
        contained
          ? "flex h-full min-h-0 w-full overflow-y-auto px-4 py-8 sm:px-6"
          : "flex w-full px-4 py-10"
      }
    >
      <div
        className={
          contained
            ? "m-auto flex w-full max-w-[20rem] flex-col items-center py-2 text-center"
            : "mx-auto flex w-full max-w-[20rem] flex-col items-center text-center"
        }
      >
        <span
          className="mb-3"
          style={{ color: "var(--luxia-text-muted)" }}
          aria-hidden
        >
          {icon}
        </span>
        <h2
          className={quiet ? "luxia-type-title-component" : "luxia-type-title-panel"}
          style={{
            color: quiet
              ? "var(--luxia-text-secondary)"
              : "var(--luxia-text-primary)",
          }}
        >
          {title}
        </h2>
        <p
          className="mt-1.5 luxia-type-body-dense"
          style={{ color: "var(--luxia-text-muted)" }}
        >
          {description}
        </p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

function ShareConversationButton({
  onClick,
  label = "Share",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="compact"
      onClick={onClick}
    >
      <Share2 size={14} strokeWidth={1.8} aria-hidden className="shrink-0" />
      {label}
    </Button>
  );
}

function queriesEqual(a: VidgetInboxQuery, b: VidgetInboxQuery): boolean {
  return serializeVidgetInboxQuery(a) === serializeVidgetInboxQuery(b);
}

function uniqueVidgetNames(
  sessions: readonly VidgetInboxSession[],
  vidgetById: Record<string, VidgetRecord>,
): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const session of sessions) {
    const name = vidgetById[session.vidgetId]?.name ?? session.vidgetId;
    if (seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

function sharedVidgetId(sessions: readonly VidgetInboxSession[]): string | null {
  if (sessions.length === 0) return null;
  const first = sessions[0]?.vidgetId;
  if (!first) return null;
  return sessions.every((session) => session.vidgetId === first) ? first : null;
}

function useInboxSplitView(): boolean {
  const [split, setSplit] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia(`(min-width: ${INBOX_SPLIT_MIN_WIDTH}px)`).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${INBOX_SPLIT_MIN_WIDTH}px)`);
    const onChange = () => setSplit(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return split;
}

export interface VidgetInboxPageProps {
  projectId: string;
  projectName: string;
  sessionId?: string | null;
  search: string;
  vidgets: VidgetRecord[];
  constellationNameById: Record<string, string>;
  constellationTypeById?: Record<string, string>;
  canReview: boolean;
  canManage: boolean;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenVidgets: (projectId: string) => void;
  onCreateVidget?: () => void;
  onNavigateInbox: (next: {
    query: VidgetInboxQuery;
    history?: "push" | "replace";
  }) => void;
  onRefine?: (payload: VidgetInboxRefinePayload) => void;
}

export function VidgetInboxPage({
  projectId,
  projectName,
  sessionId,
  search,
  vidgets,
  constellationNameById,
  constellationTypeById,
  canReview,
  canManage,
  onNavigateHome,
  onOpenProject,
  onOpenVidgets,
  onCreateVidget,
  onNavigateInbox,
  onRefine,
}: VidgetInboxPageProps) {
  const splitView = useInboxSplitView();
  const [query, setQuery] = useState<VidgetInboxQuery>(() => {
    const parsed = parseVidgetInboxQueryFromSearch(search);
    if (sessionId && !parsed.sessionId) return { ...parsed, sessionId };
    return parsed;
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shareScope, setShareScope] = useState<VidgetInboxReviewShareScope | null>(null);

  useEffect(() => {
    const next = parseVidgetInboxQueryFromSearch(search);
    if (sessionId && !next.sessionId) next.sessionId = sessionId;
    setQuery((current) => (queriesEqual(current, next) ? current : next));
  }, [search, sessionId]);

  const vidgetIds = useMemo(
    () => new Set(vidgets.map((item) => item.id)),
    [vidgets],
  );
  const vidgetById = useMemo(
    () => Object.fromEntries(vidgets.map((item) => [item.id, item])),
    [vidgets],
  );
  const vidgetNameById = useMemo(
    () => Object.fromEntries(vidgets.map((item) => [item.id, item.name])),
    [vidgets],
  );

  const captureVersion = useSyncExternalStore(
    subscribeVidgetInboxCapture,
    getVidgetInboxCaptureVersion,
    () => 0,
  );

  const sessions = useMemo(
    () => getVidgetInboxSessionsForProject(projectId, vidgetIds),
    [projectId, vidgetIds, captureVersion],
  );

  const filtered = useMemo(
    () => filterVidgetInboxSessions(sessions, query, { vidgetNameById }),
    [sessions, query, vidgetNameById],
  );

  useEffect(() => {
    const visible = new Set(filtered.map((session) => session.id));
    setSelectedIds((current) => {
      const next = current.filter((id) => visible.has(id));
      return next.length === current.length ? current : next;
    });
  }, [filtered]);

  const channelOptions = useMemo(() => uniqueInboxChannels(sessions), [sessions]);
  const localeOptions = useMemo(() => uniqueInboxLocales(sessions), [sessions]);
  const constellationIds = useMemo(
    () => uniqueInboxConstellationIds(sessions),
    [sessions],
  );

  const selectedSessionId = query.sessionId.trim();
  const selected = selectedSessionId
    ? getVidgetInboxSessionById(selectedSessionId)
    : undefined;
  const selectedInProject = selected && selected.projectId === projectId
    && vidgetIds.has(selected.vidgetId)
    ? selected
    : undefined;

  const scopedShareSessions = useMemo(() => {
    if (!shareScope) return [];
    const ids = new Set(shareScope.sessionIds);
    return sessions.filter((session) => ids.has(session.id));
  }, [sessions, shareScope]);

  const allVisibleSelected =
    filtered.length > 0 && selectedIds.length === filtered.length;
  const someVisibleSelected =
    selectedIds.length > 0 && selectedIds.length < filtered.length;

  const showList = splitView || !selectedSessionId;
  const showReview = splitView || Boolean(selectedSessionId);

  function commitQuery(next: VidgetInboxQuery, history: "push" | "replace" = "replace") {
    setQuery(next);
    onNavigateInbox({ query: next, history });
  }

  function clearFilters() {
    commitQuery({ ...EMPTY_VIDGET_INBOX_QUERY, sessionId: query.sessionId });
  }

  function clearMoreFilters() {
    commitQuery({
      ...query,
      locale: "",
      date: "all",
      constellationId: "",
    });
  }

  function openSession(nextSessionId: string) {
    if (query.sessionId === nextSessionId) return;
    commitQuery({ ...query, sessionId: nextSessionId }, "push");
  }

  function closeSession() {
    if (!query.sessionId) return;
    commitQuery({ ...query, sessionId: "" }, "push");
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) return current.includes(id) ? current : [...current, id];
      return current.filter((item) => item !== id);
    });
  }

  function openSelectedShare() {
    if (selectedIds.length === 0) return;
    setShareScope(selectedShareScope(selectedIds));
  }

  function openConversationShare(id: string) {
    setShareScope(conversationShareScope(id));
  }

  function handleShare(anonymous: boolean) {
    if (!shareScope) return;
    createVidgetInboxReviewShare({
      projectId,
      scope: shareScope,
      vidgetId: sharedVidgetId(scopedShareSessions),
      anonymous,
    });
  }

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onProject: onOpenProject,
    onVidgets: onOpenVidgets,
    onVidgetInbox: () => commitQuery({ ...query, sessionId: "" }, "push"),
  };

  const listCrumbs: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "project",
      label: projectName,
      destination: { kind: "project", projectId },
    },
    {
      id: "vidgets",
      label: "Vidgets",
      destination: { kind: "vidgets", projectId },
    },
    {
      id: "inbox",
      label: "Inbox",
      destination: { kind: "current" },
    },
  ];

  const detailCrumbs: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "project",
      label: projectName,
      destination: { kind: "project", projectId },
    },
    {
      id: "vidgets",
      label: "Vidgets",
      destination: { kind: "vidgets", projectId },
    },
    {
      id: "inbox",
      label: "Inbox",
      destination: { kind: "vidget-inbox", projectId },
    },
    {
      id: "session",
      label: selectedInProject?.id ?? "Conversation",
      destination: { kind: "current" },
    },
  ];

  function vidgetLabel(session: VidgetInboxSession): string {
    return vidgetById[session.vidgetId]?.name ?? session.vidgetId;
  }

  function constellationLabel(id: string | null): string {
    if (!id) return "—";
    return constellationNameById[id] ?? id;
  }

  const hasSessions = sessions.length > 0;
  const hasVidgets = vidgets.length > 0;
  const showCreateVidget = !hasVidgets && canManage && Boolean(onCreateVidget);
  const extraFilterCount = moreInboxFilterCount(query);
  const filtersActive = inboxQueryHasActiveFilters(query);
  const narrowDetail = !splitView && Boolean(selectedSessionId);
  const shareVidgetName = shareScope?.type === "vidget"
    ? vidgetById[shareScope.vidgetId]?.name
    : shareScope?.type === "conversation" && selectedInProject
      ? vidgetLabel(selectedInProject)
      : undefined;

  const listPane = (
    <div
      className={
        splitView
          ? "flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
          : undefined
      }
    >
      {sessions.length === 0 ? (
        <div
          className={splitView ? "flex min-h-0 flex-1 flex-col overflow-hidden" : undefined}
          data-inbox-empty-state="zero-data"
        >
          <InboxPanelEmptyState
            contained={splitView}
            icon={<Inbox size={22} strokeWidth={1.6} />}
            title="No conversation sessions yet"
            description="Production conversations from this Project’s Vidgets will appear here."
            action={
              showCreateVidget ? (
                <Button
                  type="button"
                  variant="primary"
                  size="compact"
                  onClick={() => onCreateVidget?.()}
                >
                  <Plus size={14} strokeWidth={2} aria-hidden className="shrink-0" />
                  Create Vidget
                </Button>
              ) : hasVidgets ? (
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={() => onOpenVidgets(projectId)}
                >
                  Go to Vidgets
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
            <div className={splitView ? "shrink-0" : undefined}>
            <FilterToolbar>
            <div className="flex min-w-0 w-full items-center gap-2">
              <label className="block min-w-0 flex-1">
                <span className="sr-only">Search conversations</span>
                <div className="relative">
                  <Search
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                    style={{ color: "var(--luxia-text-muted)" }}
                  />
                  <Input
                    value={query.q}
                    onChange={(event) =>
                      commitQuery({ ...query, q: event.target.value })
                    }
                    placeholder="Search conversations"
                    aria-label="Search conversations"
                    className="h-9 w-full pl-9"
                    style={{
                      background: HS.searchBg,
                      borderColor: HS.searchBorder,
                    }}
                  />
                </div>
              </label>
              {filtersActive ? (
                <Button
                  type="button"
                  variant="tertiary"
                  size="compact"
                  className="shrink-0"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
            <div className="flex min-w-0 w-full flex-nowrap items-end gap-2">
                <BrowserFilterSelect
                  label="Vidget"
                  className="min-w-0 flex-1"
                  selectClassName="min-w-0"
                  selectStyle={{ minWidth: 0 }}
                  value={query.vidgetId || "all"}
                  onChange={(event) =>
                    commitQuery({
                      ...query,
                      vidgetId:
                        event.target.value === "all" ? "" : event.target.value,
                    })
                  }
                >
                  <option value="all">All</option>
                  {vidgets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </BrowserFilterSelect>
                <BrowserFilterSelect
                  label="Channel"
                  className="min-w-0 flex-1"
                  selectClassName="min-w-0"
                  selectStyle={{ minWidth: 0 }}
                  value={query.channel}
                  onChange={(event) =>
                    commitQuery({
                      ...query,
                      channel: event.target.value as "all" | VidgetChannel,
                    })
                  }
                >
                  <option value="all">All</option>
                  {channelOptions.map((channel) => (
                    <option key={channel} value={channel}>
                      {VIDGET_CHANNEL_LABELS[channel]}
                    </option>
                  ))}
                </BrowserFilterSelect>
                <BrowserFilterSelect
                  label="Status"
                  className="min-w-0 flex-1"
                  selectClassName="min-w-0"
                  selectStyle={{ minWidth: 0 }}
                  value={query.problems}
                  onChange={(event) =>
                    commitQuery({
                      ...query,
                      problems: event.target.value as VidgetInboxProblemsFilter,
                    })
                  }
                >
                  <option value="all">All</option>
                  <option value="problems">Problems</option>
                  <option value="none">No problems</option>
                </BrowserFilterSelect>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      className="shrink-0 self-end whitespace-nowrap"
                      aria-label={
                        extraFilterCount > 0
                          ? `More filters, ${extraFilterCount} active`
                          : "More filters"
                      }
                    >
                      More filters
                      {extraFilterCount > 0 ? ` · ${extraFilterCount}` : ""}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[min(92vw,18rem)] space-y-3 p-3">
                    <BrowserFilterSelect
                      label="Locale"
                      value={query.locale || "all"}
                      onChange={(event) =>
                        commitQuery({
                          ...query,
                          locale:
                            event.target.value === "all" ? "" : event.target.value,
                        })
                      }
                    >
                      <option value="all">All</option>
                      {localeOptions.map((locale) => (
                        <option key={locale} value={locale}>
                          {locale}
                        </option>
                      ))}
                    </BrowserFilterSelect>
                    <BrowserFilterSelect
                      label="Date"
                      value={query.date}
                      onChange={(event) =>
                        commitQuery({
                          ...query,
                          date: event.target.value as VidgetInboxDateFilter,
                        })
                      }
                    >
                      <option value="all">All dates</option>
                      <option value="today">Today</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                    </BrowserFilterSelect>
                    <BrowserFilterSelect
                      label="Constellation"
                      value={query.constellationId || "all"}
                      onChange={(event) =>
                        commitQuery({
                          ...query,
                          constellationId:
                            event.target.value === "all" ? "" : event.target.value,
                        })
                      }
                    >
                      <option value="all">All</option>
                      {constellationIds.map((id) => (
                        <option key={id} value={id}>
                          {constellationNameById[id] ?? id}
                        </option>
                      ))}
                    </BrowserFilterSelect>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="tertiary"
                        size="compact"
                        disabled={extraFilterCount === 0}
                        onClick={clearMoreFilters}
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
            </div>
          </FilterToolbar>
            </div>

          <div
            className={
              splitView
                ? "mt-3 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                : "mt-3 min-w-0"
            }
          >
            <div className="mb-2 flex min-h-8 min-w-0 shrink-0 flex-nowrap items-center gap-2">
              {selectedIds.length > 0 ? (
                <>
                  <p
                    className="min-w-0 flex-1 truncate luxia-type-caption"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    {selectedIds.length} selected
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    className="shrink-0"
                    onClick={openSelectedShare}
                  >
                    <Share2 size={14} strokeWidth={1.8} aria-hidden className="shrink-0" />
                    Share selected
                  </Button>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="compact"
                    className="shrink-0"
                    onClick={() => setSelectedIds([])}
                  >
                    Clear
                  </Button>
                </>
              ) : (
                <ResultsCount>
                  {filtered.length} conversation{filtered.length === 1 ? "" : "s"}
                </ResultsCount>
              )}
            </div>

            {filtered.length === 0 ? (
              <div
                className={
                  splitView
                    ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                    : undefined
                }
                data-inbox-empty-state="filtered"
              >
                <InboxPanelEmptyState
                  contained={splitView}
                  icon={<Search size={22} strokeWidth={1.6} />}
                  title="No conversations match your filters"
                  description="Try adjusting your search or filters."
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <div
                data-inbox-scroller="session-list"
                className={
                  splitView
                    ? "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical"
                    : undefined
                }
              >
              <div className={`${LUXIA_SETTINGS_TABLE_SURFACE_CLASS} min-w-0 overflow-x-auto overflow-y-hidden`}>
                <table className="w-full table-fixed border-collapse text-left">
                  <caption className="sr-only">Vidget conversations</caption>
                  <thead>
                    <tr
                      style={{
                        color: "var(--luxia-text-secondary)",
                        borderBottom: "1px solid var(--luxia-settings-row-divider)",
                      }}
                    >
                      <th scope="col" className={`${TABLE_HEADER_CELL} ${COL_CHECK}`}>
                        <Checkbox
                          checked={
                            allVisibleSelected
                              ? true
                              : someVisibleSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={(checked) => {
                            setSelectedIds(
                              checked === true
                                ? filtered.map((session) => session.id)
                                : [],
                            );
                          }}
                          aria-label="Select all visible conversations"
                        />
                      </th>
                      <th scope="col" className={`${TABLE_HEADER_CELL} ${COL_STARTED} whitespace-nowrap`}>
                        Started
                      </th>
                      <th scope="col" className={`${TABLE_HEADER_CELL} ${COL_VIDGET} whitespace-nowrap`}>
                        Vidget
                      </th>
                      <th scope="col" className={`${TABLE_HEADER_CELL} ${COL_CHANNEL} whitespace-nowrap`}>
                        Channel
                      </th>
                      <th scope="col" className={`${TABLE_HEADER_CELL} ${COL_MESSAGES}`}>
                        Messages
                      </th>
                      <th scope="col" className={`${TABLE_HEADER_CELL} ${COL_PROBLEMS} whitespace-nowrap`}>
                        Problems
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((session) => {
                      const problemSummary = formatProblemSummary(session);
                      const isOpen = session.id === selectedSessionId;
                      const isChecked = selectedIds.includes(session.id);
                      return (
                        <tr
                          key={session.id}
                          className="luxia-settings-row is-interactive cursor-pointer"
                          data-state={isOpen ? "selected" : undefined}
                          aria-selected={isOpen}
                          aria-label={`Review conversation from ${vidgetLabel(session)}`}
                          tabIndex={0}
                          style={
                            isOpen
                              ? {
                                  background: "var(--luxia-surface-selected)",
                                  boxShadow: "inset 2px 0 0 var(--luxia-brand-primary)",
                                }
                              : undefined
                          }
                          onClick={() => openSession(session.id)}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            openSession(session.id);
                          }}
                        >
                          <td
                            className={`${TABLE_BODY_CELL} ${COL_CHECK}`}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                toggleSelected(session.id, checked === true)
                              }
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Select conversation from ${vidgetLabel(session)}`}
                            />
                          </td>
                          <td
                            className={`${TABLE_BODY_CELL} ${COL_STARTED} truncate`}
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            {formatInboxTime(session.startedAt)}
                          </td>
                          <td className={`${TABLE_BODY_CELL} ${COL_VIDGET} truncate luxia-type-body-dense-strong`}>
                            {vidgetLabel(session)}
                          </td>
                          <td
                            className={`${TABLE_BODY_CELL} ${COL_CHANNEL} truncate`}
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            {VIDGET_CHANNEL_LABELS[session.channel]}
                          </td>
                          <td
                            className={`${TABLE_BODY_CELL} ${COL_MESSAGES}`}
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            {session.messageCount}
                          </td>
                          <td className={`${TABLE_BODY_CELL} ${COL_PROBLEMS} whitespace-nowrap`}>
                            <ProblemCountCell
                              count={session.problemCount}
                              summary={problemSummary}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const reviewPane = (
    <ConversationReviewPane
      session={selectedInProject}
      sessionRequested={Boolean(selectedSessionId)}
      hasSessions={hasSessions}
      projectName={projectName}
      vidget={selectedInProject ? vidgetById[selectedInProject.vidgetId] : undefined}
      constellationNameById={constellationNameById}
      constellationTypeById={constellationTypeById}
      vidgetLabel={selectedInProject ? vidgetLabel(selectedInProject) : ""}
      constellationLabel={constellationLabel}
      onRefine={
        onRefine
          ? (payload) => onRefine({ ...payload, projectId })
          : undefined
      }
      showHeading={!narrowDetail}
      contained={splitView}
      onShareConversation={
        selectedInProject && !narrowDetail
          ? () => openConversationShare(selectedInProject.id)
          : undefined
      }
      onClearSession={closeSession}
    />
  );

  return (
    <LuxiaPageFrame
      variant={VIDGETS_GUIDANCE.listPageVariant}
      className={
        splitView
          ? "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          : undefined
      }
      style={splitView ? { paddingBlockEnd: "0.75rem" } : undefined}
    >
      <LuxiaPageHeader
        contentGap="page"
        className={splitView ? "shrink-0" : undefined}
        pageTypeLabel="VIDGETS"
        title={narrowDetail ? "Conversation" : "Inbox"}
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={narrowDetail ? detailCrumbs : listCrumbs}
            handlers={breadcrumbHandlers}
          />
        }
        guide={VIDGETS_GUIDANCE.inboxPageDescription}
        secondaryAction={
          narrowDetail ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {selectedInProject ? (
                <ShareConversationButton
                  onClick={() => openConversationShare(selectedInProject.id)}
                />
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="compact"
                onClick={closeSession}
              >
                Back to Inbox
              </Button>
            </div>
          ) : undefined
        }
      />

      <LuxiaPageBody
        className={
          splitView
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : undefined
        }
      >
        {showList ? (
          <VidgetsCollectionNav
            active="inbox"
            showInbox={canReview}
            onChange={(view) => {
              if (view === "all") onOpenVidgets(projectId);
            }}
          />
        ) : null}

        {splitView ? (
          <InboxSplitPanes
            list={listPane}
            review={reviewPane}
            resizeDisabled={!hasSessions}
          />
        ) : showReview && !showList ? (
          reviewPane
        ) : (
          listPane
        )}
      </LuxiaPageBody>

      <InboxShareDialog
        open={shareScope !== null}
        onOpenChange={(open) => {
          if (!open) setShareScope(null);
        }}
        scope={shareScope}
        vidgetNames={uniqueVidgetNames(scopedShareSessions, vidgetById)}
        vidgetName={shareVidgetName}
        onShare={handleShare}
      />
    </LuxiaPageFrame>
  );
}

function ConversationReviewPane({
  session,
  sessionRequested,
  hasSessions,
  projectName,
  vidget,
  constellationNameById,
  constellationTypeById,
  vidgetLabel,
  constellationLabel,
  showHeading,
  contained = false,
  onRefine,
  onShareConversation,
  onClearSession,
}: {
  session: VidgetInboxSession | undefined;
  sessionRequested: boolean;
  hasSessions: boolean;
  projectName: string;
  vidget: VidgetRecord | undefined;
  constellationNameById: Record<string, string>;
  constellationTypeById?: Record<string, string>;
  vidgetLabel: string;
  constellationLabel: (id: string | null) => string;
  showHeading: boolean;
  contained?: boolean;
  onRefine?: (payload: Omit<VidgetInboxRefinePayload, "projectId">) => void;
  onShareConversation?: () => void;
  onClearSession: () => void;
}) {
  if (!sessionRequested) {
    if (!hasSessions) {
      return (
        <div
          className={contained ? "h-full min-h-0 overflow-hidden" : undefined}
          data-inbox-review-empty="zero-data"
        >
          <InboxPanelEmptyState
            contained={contained}
            quiet
            icon={<MessageSquare size={18} strokeWidth={1.6} />}
            title="Conversation review"
            description="Conversation details will appear here when sessions are available."
          />
        </div>
      );
    }

    return (
      <div
        className={contained ? "h-full min-h-0 overflow-hidden" : undefined}
        data-inbox-review-empty="select"
      >
        <InboxPanelEmptyState
          contained={contained}
          quiet
          icon={<MessageSquare size={18} strokeWidth={1.6} />}
          title="Select a conversation to review"
          description="Choose a conversation from the Inbox to inspect its messages, feedback, and response state."
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className={contained ? "h-full min-h-0 overflow-hidden" : undefined}
        data-inbox-review-empty="unavailable"
      >
        <InboxPanelEmptyState
          contained={contained}
          icon={<MessageSquare size={18} strokeWidth={1.6} />}
          title="Session unavailable"
          description="This conversation is not available in the current Project."
          action={
            <Button
              type="button"
              variant="outline"
              size="compact"
              onClick={onClearSession}
            >
              Clear selection
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div
      className={
        contained
          ? "flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
          : "min-w-0 pb-4"
      }
    >
      <div
        className={
          contained
            ? "mb-3 min-w-0 shrink-0 pb-3"
            : "mb-3 min-w-0 pb-3"
        }
        style={{ borderBottom: "1px solid var(--luxia-border-subtle)" }}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          {showHeading ? (
            <p
              className="luxia-type-overline-data"
              style={{ color: "var(--luxia-purple-60)" }}
            >
              Conversation review
            </p>
          ) : (
            <span />
          )}
          {onShareConversation ? (
            <ShareConversationButton onClick={onShareConversation} />
          ) : null}
        </div>
        <h2
          className={
            showHeading
              ? "mt-1 min-w-0 truncate luxia-type-title-panel"
              : "min-w-0 truncate luxia-type-title-panel"
          }
          style={{ color: "var(--luxia-text-primary)" }}
        >
          {vidgetLabel}
          {" · "}
          {VIDGET_CHANNEL_LABELS[session.channel]}
        </h2>
        <p
          className="mt-0.5 luxia-type-caption"
          style={{ color: "var(--luxia-text-secondary)" }}
        >
          {formatInboxTime(session.startedAt)}
          {" · "}
          {session.locale}
          {" · "}
          {constellationLabel(session.constellationId)}
        </p>
        <p
          className="mt-0.5 truncate luxia-type-caption"
          style={{ color: "var(--luxia-text-muted)" }}
          title={session.id}
        >
          {session.id}
        </p>
      </div>
      <div
        data-inbox-scroller="conversation-thread"
        className={
          contained
            ? "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical"
            : undefined
        }
      >
        <InboxConversationThread
          session={session}
          projectName={projectName}
          sourceType={vidget?.sourceType ?? null}
          vidgetConstellationId={vidget?.constellationId}
          constellationNameById={constellationNameById}
          constellationTypeById={constellationTypeById}
          onRefine={onRefine}
        />
      </div>
    </div>
  );
}

function ProblemCountCell({
  count,
  summary,
}: {
  count: number;
  summary: string | null;
}) {
  if (count <= 0) {
    return (
      <span style={{ color: "var(--luxia-text-muted)" }}>—</span>
    );
  }

  const label = formatProblemCount(count);
  const content = (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap luxia-type-caption"
      style={{ color: "var(--luxia-warning-90)" }}
    >
      <AlertTriangle size={13} strokeWidth={1.8} aria-hidden className="shrink-0" />
      {label}
    </span>
  );

  if (!summary) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>{content}</span>
      </TooltipTrigger>
      <TooltipContent>{summary}</TooltipContent>
    </Tooltip>
  );
}
