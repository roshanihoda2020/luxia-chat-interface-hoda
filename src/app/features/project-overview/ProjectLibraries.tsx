import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  LuxiaBreadcrumb,
  buildProjectLibraryBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { HS } from "@/app/features/home/homeSurfaces";
import {
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaVirtualAssistantIcon,
} from "@/assets/icons";
import { activityIcon } from "./RecentActivityCard";
import { ProjectMetaText, ProjectOutlineButton, ProjectPreviewRow } from "./ProjectModuleShared";
import { Button } from "@/app/components/ui/button";
import { LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import type {
  ProjectActivityItem,
  ProjectActivityType,
  ProjectDashboardItem,
  ProjectOverviewChat,
  ProjectOverviewConstellation,
  ProjectVirtualAssistantItem,
} from "./types";

function LibraryShell({
  title,
  libraryId,
  projectId,
  projectName,
  description,
  countLabel,
  onNavigateHome,
  onBackToProject,
  actions,
  searchLabel,
  searchValue,
  onSearchChange,
  filters,
  children,
  footer,
}: {
  title: string;
  libraryId: string;
  projectId: string;
  projectName: string;
  description: string;
  countLabel: string;
  onNavigateHome: () => void;
  onBackToProject: () => void;
  actions?: ReactNode;
  searchLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-w-0 w-full">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel={title.toUpperCase()}
        title={title}
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={buildProjectLibraryBreadcrumbItems({
              projectId,
              projectName,
              libraryId,
              libraryLabel: title,
            })}
            handlers={{
              onHome: onNavigateHome,
              onProject: () => onBackToProject(),
            }}
          />
        }
        context={
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            {countLabel}
          </p>
        }
        guide={description}
        primaryAction={actions}
      />

      <div className="mb-4 space-y-3">
        <label className="block">
          <span className="sr-only">{searchLabel}</span>
          <div className="relative">
            <Search
              size={16}
              strokeWidth={1.75}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              style={{ color: "var(--luxia-text-muted)" }}
            />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchLabel}
              className="pl-9"
            />
          </div>
        </label>
        {filters}
      </div>

      {children}
      {footer}
    </div>
  );
}

function EmptyLibrary({ title, description }: { title: string; description: string }) {
  return (
    <div
      className="rounded-[var(--luxia-radius-16)] border bg-white px-5 py-10 text-center"
      style={{ borderColor: "var(--luxia-border-default)" }}
    >
      <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
        {title}
      </p>
      <p className="mt-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
        {description}
      </p>
    </div>
  );
}

export function ActivityLibrary({
  projectId,
  projectName,
  items,
  onNavigateHome,
  onBack,
  onOpen,
}: {
  projectId: string;
  projectName: string;
  items: ProjectActivityItem[];
  onNavigateHome: () => void;
  onBack: () => void;
  onOpen: (item: ProjectActivityItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ProjectActivityType>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!q) return true;
      return (
        item.primary.toLowerCase().includes(q)
        || (item.secondary?.toLowerCase().includes(q) ?? false)
      );
    });
    next = next.slice().sort((a, b) =>
      sort === "newest" ? b.timestampValue - a.timestampValue : a.timestampValue - b.timestampValue,
    );
    return next;
  }, [items, query, typeFilter, sort]);

  return (
    <LibraryShell
      title="Activity"
      libraryId="activity"
      projectId={projectId}
      projectName={projectName}
      description={`All recent activity for ${projectName}`}
      countLabel={`${filtered.length} ${filtered.length === 1 ? "item" : "items"}`}
      onNavigateHome={onNavigateHome}
      onBackToProject={onBack}
      searchLabel="Search activity"
      searchValue={query}
      onSearchChange={setQuery}
      filters={(
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="rounded-[8px] px-2 py-2 luxia-type-caption"
            style={{ border: "1px solid var(--luxia-border-default)" }}
          >
            <option value="all">All types</option>
            <option value="chat">Chat</option>
            <option value="constellation">Constellation</option>
            <option value="source">Source</option>
            <option value="dashboard">Dashboard</option>
            <option value="virtual-assistant">Vidget</option>
            <option value="member">Member</option>
            <option value="project">Project</option>
          </select>
          <select
            aria-label="Sort activity"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-[8px] px-2 py-2 luxia-type-caption"
            style={{ border: "1px solid var(--luxia-border-default)" }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      )}
    >
      {filtered.length === 0 ? (
        <EmptyLibrary title="No activity found" description="Try a different search or filter." />
      ) : (
        <ul
          className="overflow-hidden rounded-[var(--luxia-radius-16)] border bg-white divide-y"
          style={{ borderColor: "var(--luxia-border-default)" }}
        >
          {filtered.map((item) => {
            const canNavigate = Boolean(item.chatId || item.constellationId);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!canNavigate}
                  onClick={() => canNavigate && onOpen(item)}
                  className="flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left outline-none transition-colors enabled:hover:bg-[var(--luxia-opacity-brand-primary-04)] enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--luxia-border-focus)]"
                >
                  <span className="shrink-0">{activityIcon(item.type)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                      {item.primary}
                    </span>
                    {item.secondary ? (
                      <span className="mt-0.5 block luxia-type-caption" style={{ color: "var(--luxia-neutral-600, #475569)" }}>
                        {item.secondary}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 luxia-type-caption" style={{ color: "var(--luxia-neutral-500, #64748B)" }}>
                    {item.timestamp}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </LibraryShell>
  );
}

export function ChatsLibrary({
  projectId,
  projectName,
  chats,
  onNavigateHome,
  onBack,
  onOpenChat,
  onNewChat,
}: {
  projectId: string;
  projectName: string;
  chats: ProjectOverviewChat[];
  onNavigateHome: () => void;
  onBack: () => void;
  onOpenChat: (chatId: string) => void;
  onNewChat: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "database" | "pdf">("all");
  const [sort, setSort] = useState<"opened" | "name">("opened");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = chats.filter((chat) => {
      if (sourceFilter !== "all" && chat.constellationSource !== sourceFilter) return false;
      if (!q) return true;
      return (
        chat.label.toLowerCase().includes(q)
        || (chat.constellationName?.toLowerCase().includes(q) ?? false)
      );
    });
    next = next.slice().sort((a, b) => {
      if (sort === "name") return a.label.localeCompare(b.label);
      return b.lastOpenedTimestamp - a.lastOpenedTimestamp;
    });
    return next;
  }, [chats, query, sourceFilter, sort]);

  return (
    <LibraryShell
      title="Chats"
      libraryId="chats"
      projectId={projectId}
      projectName={projectName}
      description={`Project-scoped Chats for ${projectName}`}
      countLabel={`${filtered.length} ${filtered.length === 1 ? "Chat" : "Chats"}`}
      onNavigateHome={onNavigateHome}
      onBackToProject={onBack}
      actions={
        <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={onNewChat}>
          New Chat
        </Button>
      }
      searchLabel="Search Chats"
      searchValue={query}
      onSearchChange={setQuery}
      filters={(
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter by source"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
            className="rounded-[8px] px-2 py-2 luxia-type-caption"
            style={{ border: "1px solid var(--luxia-border-default)" }}
          >
            <option value="all">All sources</option>
            <option value="database">DB</option>
            <option value="pdf">PDF</option>
          </select>
          <select
            aria-label="Sort Chats"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-[8px] px-2 py-2 luxia-type-caption"
            style={{ border: "1px solid var(--luxia-border-default)" }}
          >
            <option value="opened">Last opened</option>
            <option value="name">Name</option>
          </select>
        </div>
      )}
    >
      {filtered.length === 0 ? (
        <EmptyLibrary title="No Chats available for your current access" description="Try another search, or open a Chat whose Constellation you can use." />
      ) : (
        <div
          className="overflow-hidden rounded-[var(--luxia-radius-16)] border bg-white"
          style={{ borderColor: "var(--luxia-border-default)" }}
        >
          {filtered.map((chat) => (
            <ProjectPreviewRow
              key={chat.id}
              icon={<LuxiaChatIcon size={16} aria-hidden color="currentColor" />}
              title={chat.label}
              ariaLabel={`Open ${chat.label}`}
              onClick={() => onOpenChat(chat.id)}
              meta={
                <>
                  {chat.constellationName ? <ProjectMetaText>{chat.constellationName}</ProjectMetaText> : null}
                  {chat.constellationSource ? (
                    <Badge
                      variant={chat.constellationSource === "pdf" ? "pdf" : "database"}
                      className="min-h-0 h-[15px] px-1 py-0 luxia-type-badge"
                    >
                      {chat.constellationSource === "pdf" ? "PDF" : "DB"}
                    </Badge>
                  ) : null}
                  <ProjectMetaText>{chat.lastOpenedAt}</ProjectMetaText>
                </>
              }
            />
          ))}
        </div>
      )}
    </LibraryShell>
  );
}

export function ConstellationsLibrary({
  projectId,
  projectName,
  constellations,
  onNavigateHome,
  onBack,
  onOpen,
  onOpenSettings,
  onAdd,
}: {
  projectId: string;
  projectName: string;
  constellations: ProjectOverviewConstellation[];
  onNavigateHome: () => void;
  onBack: () => void;
  onOpen: (id: string) => void;
  onOpenSettings?: (id: string) => void;
  onAdd?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "database" | "pdf" | "csv">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return constellations.filter((item) => {
      if (sourceFilter !== "all" && item.type !== sourceFilter) return false;
      if (!q) return true;
      return item.label.toLowerCase().includes(q);
    });
  }, [constellations, query, sourceFilter]);

  return (
    <LibraryShell
      title="Constellations"
      libraryId="constellations"
      projectId={projectId}
      projectName={projectName}
      description={`Constellations in ${projectName}`}
      countLabel={`${filtered.length} ${filtered.length === 1 ? "Constellation" : "Constellations"}`}
      onNavigateHome={onNavigateHome}
      onBackToProject={onBack}
      actions={
        onAdd ? (
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={onAdd}>
            Add Constellation
          </Button>
        ) : undefined
      }
      searchLabel="Search Constellations"
      searchValue={query}
      onSearchChange={setQuery}
      filters={(
        <select
          aria-label="Filter by type"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
          className="rounded-[8px] px-2 py-2 luxia-type-caption"
          style={{ border: "1px solid var(--luxia-border-default)" }}
        >
          <option value="all">All types</option>
          <option value="database">Database</option>
          <option value="pdf">PDF</option>
          <option value="csv">CSV</option>
        </select>
      )}
    >
      {filtered.length === 0 ? (
        <EmptyLibrary
          title={constellations.length === 0 ? "No Constellations" : "No Constellations found"}
          description={
            constellations.length === 0
              ? "No Constellations have been added to this Project yet."
              : "Try a different search or type filter."
          }
        />
      ) : (
        <div
          className="overflow-hidden rounded-[var(--luxia-radius-16)] border bg-white"
          style={{ borderColor: "var(--luxia-border-default)" }}
        >
          {filtered.map((item) => (
            <ProjectPreviewRow
              key={item.id}
              icon={<LuxiaConstellationIcon size={16} aria-hidden color="currentColor" />}
              title={item.label}
              ariaLabel={`Open Settings for ${item.label}`}
              onClick={() => onOpen(item.id)}
              showChevron={false}
              meta={
                <>
                  <Badge
                    variant={
                      item.type === "pdf" ? "pdf" : item.type === "csv" ? "csv" : "database"
                    }
                    className="min-h-0 h-[15px] px-1 py-0 luxia-type-badge"
                  >
                    {item.type === "pdf" ? "PDF" : item.type === "csv" ? "CSV" : "Database"}
                  </Badge>
                  <ProjectMetaText>Active</ProjectMetaText>
                  <ProjectMetaText>
                    {item.sourceCount} {item.sourceCount === 1 ? "Source" : "Sources"}
                  </ProjectMetaText>
                </>
              }
              actions={
                onOpenSettings ? (
                  <ProjectOutlineButton
                    label="Settings"
                    ariaLabel={`Open Settings for ${item.label}`}
                    onClick={() => onOpenSettings(item.id)}
                  />
                ) : null
              }
            />
          ))}
        </div>
      )}
    </LibraryShell>
  );
}

export function DashboardsLibrary({
  projectId,
  projectName,
  dashboards,
  onNavigateHome,
  onBack,
  onNew,
  canCreate = false,
}: {
  projectId: string;
  projectName: string;
  dashboards: ProjectDashboardItem[];
  onNavigateHome: () => void;
  onBack: () => void;
  onOpen?: (id: string) => void;
  onNew?: () => void;
  canCreate?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dashboards;
    return dashboards.filter((item) => item.name.toLowerCase().includes(q));
  }, [dashboards, query]);

  return (
    <LibraryShell
      title="Dashboards"
      libraryId="dashboards"
      projectId={projectId}
      projectName={projectName}
      description={`Dashboards for ${projectName}`}
      countLabel={`${filtered.length} ${filtered.length === 1 ? "Dashboard" : "Dashboards"}`}
      onNavigateHome={onNavigateHome}
      onBackToProject={onBack}
      actions={
        canCreate && onNew ? (
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={onNew}>
            New Dashboard
          </Button>
        ) : undefined
      }
      searchLabel="Search Dashboards"
      searchValue={query}
      onSearchChange={setQuery}
    >
      {filtered.length === 0 ? (
        <EmptyLibrary title="No Dashboards found" description="Create a Dashboard for this Project." />
      ) : (
        <div
          className="overflow-hidden rounded-[var(--luxia-radius-16)] border bg-white"
          style={{ borderColor: "var(--luxia-border-default)" }}
        >
          {filtered.map((item) => (
            <ProjectPreviewRow
              key={item.id}
              icon={<LuxiaDashboardIcon size={16} aria-hidden color="currentColor" />}
              title={item.name}
              ariaLabel={item.name}
              meta={<ProjectMetaText>Updated {item.updatedAt}</ProjectMetaText>}
            />
          ))}
        </div>
      )}
    </LibraryShell>
  );
}

export function VirtualAssistantsLibrary({
  projectId,
  projectName,
  assistants,
  onNavigateHome,
  onBack,
}: {
  projectId: string;
  projectName: string;
  assistants: ProjectVirtualAssistantItem[];
  onNavigateHome: () => void;
  onBack: () => void;
  onOpen?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assistants;
    return assistants.filter((item) => item.name.toLowerCase().includes(q));
  }, [assistants, query]);

  return (
    <LibraryShell
      title="Vidgets"
      libraryId="virtual-assistants"
      projectId={projectId}
      projectName={projectName}
      description={`Vidgets for ${projectName}`}
      countLabel={`${filtered.length} ${filtered.length === 1 ? "Vidget" : "Vidgets"}`}
      onNavigateHome={onNavigateHome}
      onBackToProject={onBack}
      searchLabel="Search Vidgets"
      searchValue={query}
      onSearchChange={setQuery}
    >
      {filtered.length === 0 ? (
        <EmptyLibrary
          title="No Vidgets found"
          description="Vidgets for this Project will appear here when available."
        />
      ) : (
        <div
          className="overflow-hidden rounded-[var(--luxia-radius-16)] border bg-white"
          style={{ borderColor: "var(--luxia-border-default)" }}
        >
          {filtered.map((item) => (
            <ProjectPreviewRow
              key={item.id}
              icon={<LuxiaVirtualAssistantIcon size={16} aria-hidden color="currentColor" />}
              title={item.name}
              ariaLabel={item.name}
              meta={
                <ProjectMetaText>
                  {item.channelLabel} · {item.sourceLabel} · {item.statusLabel}
                </ProjectMetaText>
              }
            />
          ))}
        </div>
      )}
    </LibraryShell>
  );
}
