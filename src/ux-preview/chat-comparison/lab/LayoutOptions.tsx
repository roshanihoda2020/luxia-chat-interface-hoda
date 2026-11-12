import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, FileBarChart2, List, Search, Share2, SlidersHorizontal, Trash2, X } from "lucide-react";
import type { Chat, Constellation } from "@/app/app-sections/appSectionShared";
import { DeleteChatDialog, GenerateReportDialog, ShareDialog, ShareListDialog } from "@/app/app-sections/ChatDialogs";
import { LuxiaBreadcrumb, buildChatBreadcrumbItems, buildGalaxyBreadcrumbItems } from "@/app/components/LuxiaBreadcrumb";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { LUXIA_PAGE_HEADER_ACTION, LuxiaPageHeader, LuxiaPageHeaderShell } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { LX } from "@/app/features/active-data-tables/tokens";
import { LuxiaChatIcon, LuxiaGalaxyIcon, LuxiaSettingsIcon } from "@/assets/icons";
import type { Scenario } from "../mockData";
import { EMPTY_LIST_FILTER, matchChat } from "./ProjectChatsPage";

export type LayoutOption = "A" | "B" | "C" | "D" | "D2";

const NAV_NOTE = "In the real app this link opens the Project or Constellation page (not simulated here).";

/**
 * PROTOTYPE MIRROR of the real Chat PageHeader (app-sections/ChatHeaderSection.tsx):
 * same canonical LuxiaPageHeader, breadcrumb, Settings button, options menu and dialogs.
 * The real PageHeader has no slot for an extra action or a context row, so options A and C
 * need ONE new optional prop on that approved component (flagged, not changed here).
 * The shared LuxiaPageHeader already supports both slots (`primaryAction`, `context`).
 */
export interface HeaderMenuItem { id: string; label: string; icon: ReactNode; onSelect: () => void }

export function ProtoChatHeader({ chat, scenario, tabs, headerAction, context, onRename, onDelete, onSettings, onNote, leadingMenuItems = [] }: {
  /** Extra first items in the ⋯ Chat options menu (e.g. "Find chats" on narrow screens). */
  leadingMenuItems?: HeaderMenuItem[];
  chat: Chat;
  scenario: Scenario;
  tabs?: ReactNode;
  headerAction?: ReactNode;
  context?: ReactNode;
  onRename: (name: string) => void;
  onDelete: () => void;
  onSettings: () => void;
  onNote: (text: string) => void;
}) {
  const isGalaxy = chat.chatType === "galaxy";
  const projectName = scenario.projects.find((p) => p.id === chat.projectId)?.name ?? "";
  const constellation = chat.constellationId ? scenario.constellations.find((c) => c.id === chat.constellationId) : undefined;
  const [dialog, setDialog] = useState<"share" | "shareList" | "report" | "delete" | null>(null);
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const crumbs = isGalaxy
    ? buildGalaxyBreadcrumbItems({ projectId: chat.projectId, projectName, galaxyId: chat.id, galaxyName: chat.label })
    : buildChatBreadcrumbItems({ projectId: chat.projectId, projectName, constellationId: constellation?.id, constellationName: constellation?.label ?? (chat.constellationId ? "Constellation" : undefined), chatId: chat.id, chatLabel: chat.label });
  return (
    <>
      <LuxiaPageHeaderShell trailing={tabs} style={isGalaxy ? { background: "#FAFAFC", borderBottom: "1px solid #E8EAF2" } : undefined}>
        <LuxiaPageHeader
          contentGap="none"
          pageTypeLabel={isGalaxy ? "GALAXY" : "CHAT"}
          title={chat.label}
          titleStyle={{ color: LX.primary }}
          onRename={onRename}
          renameLabel={`Rename ${chat.label}`}
          breadcrumb={<LuxiaBreadcrumb items={crumbs} tone="chat" handlers={{ onHome: () => onNote(NAV_NOTE), onProject: () => onNote(NAV_NOTE), onConstellation: () => onNote(NAV_NOTE) }} />}
          primaryAction={headerAction}
          secondaryAction={
            <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.settings} onClick={onSettings} aria-label={isGalaxy ? "Galaxy Settings" : "Constellation Settings"}>
              <LuxiaSettingsIcon size={16} aria-hidden color="currentColor" />
              {isGalaxy ? "Galaxy Settings" : "Constellation Settings"}
            </Button>
          }
          options={isGalaxy ? null : (
            <LuxiaEntityOptionsMenu
              entityType="Chat"
              entityLabel={chat.label}
              ariaLabel="Chat options"
              triggerVariant={LUXIA_PAGE_HEADER_ACTION.menuTrigger}
              items={[
                ...leadingMenuItems,
                { id: "share", label: "Share", icon: <Share2 size={15} strokeWidth={1.8} aria-hidden />, onSelect: () => setDialog("share"), separatorBefore: leadingMenuItems.length > 0 },
                { id: "share-list", label: "Share List", icon: <List size={15} strokeWidth={1.8} aria-hidden />, onSelect: () => setDialog("shareList") },
                { id: "report", label: "Generate report", icon: <FileBarChart2 size={15} strokeWidth={1.8} aria-hidden />, onSelect: () => setDialog("report") },
                { id: "delete", label: "Delete Chat", icon: <Trash2 size={15} strokeWidth={1.8} aria-hidden />, onSelect: () => setDialog("delete"), destructive: true, separatorBefore: true },
              ]}
            />
          )}
          context={context}
        />
      </LuxiaPageHeaderShell>
      {!isGalaxy ? (
        <>
          <ShareDialog open={dialog === "share"} chatLabel={chat.label} sharedUsers={sharedUsers} onClose={() => setDialog(null)} onShare={(ids) => setSharedUsers(ids)} />
          <ShareListDialog open={dialog === "shareList"} sharedUsers={sharedUsers} onClose={() => setDialog(null)} />
          <GenerateReportDialog open={dialog === "report"} onClose={() => setDialog(null)} />
          <DeleteChatDialog open={dialog === "delete"} entityName={chat.label} entityType="Chat" onClose={() => setDialog(null)} onDelete={onDelete} />
        </>
      ) : null}
    </>
  );
}

/** Option A: capsules keep their row; one labelled entry point at the end of that toolbar. */
export function CapsuleToolbarA({ capsules, count, onAllChats, label = "All chats" }: { capsules: ReactNode; count: number; onAllChats: () => void; label?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2" data-ux-layout-a-toolbar="">
      <div className="min-w-0 flex-1" data-ux-capsules="">{capsules}</div>
      <div className="h-6 w-px shrink-0" style={{ background: "var(--luxia-border-default)" }} aria-hidden />
      <Button type="button" variant="tertiary" size="compact" className="shrink-0" onClick={onAllChats} aria-label={`${label} in this Project (${count}): search and filter`} title="Search and filter all chats in this Project" data-ux-all-chats="" data-ux-find-chats-entry={label === "Find chats" ? "" : undefined}>
        <Search size={14} aria-hidden />{label}<span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{count}</span>
      </Button>
    </div>
  );
}

/**
 * Option C: a separate, compact Chat toolbar under the capsules. Quick search uses the
 * same matcher and chat list as the Project Chats page; "All chats & filters" opens that
 * page with the query handed over. One chat history, two entry points.
 */
export function ChatToolbarC({ projectName, chats, constellations, hidden, activeChatId, onOpen, onOpenPage }: {
  projectName: string;
  chats: Chat[];
  constellations: Constellation[];
  hidden: Set<string>;
  activeChatId: string | null;
  onOpen: (chatId: string) => void;
  onOpenPage: (query: string, advanced: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => (query.trim() ? chats.filter((c) => matchChat(c, constellations, { ...EMPTY_LIST_FILTER, query })) : []), [chats, constellations, query]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  return (
    <div ref={rootRef} className="relative flex min-w-0 flex-wrap items-center gap-2 pb-2 pt-1" role="search" aria-label={`Find chats in ${projectName}`} data-ux-layout-c-toolbar="">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] border px-2.5 py-1.5 sm:max-w-[340px]" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}>
        <Search size={13} color="var(--luxia-text-muted)" aria-hidden />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); setOpen(false); onOpenPage(query, false); }
            if (e.key === "Escape") { setOpen(false); if (!query) (e.target as HTMLInputElement).blur(); else setQuery(""); }
            if (e.key === "ArrowDown") { e.preventDefault(); rootRef.current?.querySelector<HTMLElement>("[data-ux-c-result]")?.focus(); }
          }}
          placeholder="Search chats"
          aria-label={`Search chats in ${projectName}`}
          aria-expanded={open && Boolean(query.trim())}
          aria-controls="ux-c-results"
          className="min-w-0 flex-1 bg-transparent outline-none luxia-type-body-dense"
          data-ux-c-search=""
        />
        {query ? <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={12} /></button> : null}
      </label>
      <Button type="button" variant="tertiary" size="compact" onClick={() => onOpenPage(query, true)} data-ux-c-all="">
        <SlidersHorizontal size={14} aria-hidden />All chats &amp; filters
      </Button>
      {open && query.trim() ? (
        <div id="ux-c-results" className="absolute left-0 top-full z-30 mt-1 w-full max-w-[420px] rounded-[12px] border p-1.5 shadow-lg" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }} data-ux-c-results="">
          {results.slice(0, 6).map((chat) => {
            const con = constellations.find((c) => c.id === chat.constellationId);
            return (
              <button key={chat.id} type="button" onClick={() => { setOpen(false); setQuery(""); onOpen(chat.id); }} onKeyDown={(e) => {
                const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-ux-c-result]") ?? []);
                const i = items.indexOf(e.currentTarget);
                if (e.key === "ArrowDown") { e.preventDefault(); items[i + 1]?.focus(); }
                if (e.key === "ArrowUp") { e.preventDefault(); (items[i - 1] ?? rootRef.current?.querySelector<HTMLElement>("[data-ux-c-search]"))?.focus(); }
                if (e.key === "Escape") { setOpen(false); rootRef.current?.querySelector<HTMLElement>("[data-ux-c-search]")?.focus(); }
              }} className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-left outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:bg-[var(--luxia-opacity-brand-secondary-08)]" aria-current={chat.id === activeChatId ? "true" : undefined} data-ux-c-result={chat.id}>
                {chat.chatType === "galaxy" ? <LuxiaGalaxyIcon size={14} color="var(--luxia-purple-60)" /> : <LuxiaChatIcon size={14} color="var(--luxia-purple-60)" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{chat.chatType === "galaxy" ? "Galaxy" : chat.label}</span>
                  <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{con ? con.label : "Picks a suitable Constellation per question"}{hidden.has(chat.id) ? " · closed" : ""}</span>
                </span>
              </button>
            );
          })}
          {results.length === 0 ? <p className="px-2.5 py-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>No chats match "{query.trim()}".</p> : null}
          <button type="button" onClick={() => { setOpen(false); onOpenPage(query, true); }} className="mt-1 flex w-full items-center justify-between rounded-[8px] border-t px-2.5 py-2 text-left luxia-type-caption outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:bg-[var(--luxia-opacity-brand-secondary-08)]" style={{ borderColor: "var(--luxia-border-default)", color: "var(--luxia-purple-70)", fontWeight: 600 }} data-ux-c-result="page">
            {results.length > 6 ? `See all ${results.length} results with filters` : "Open all chats with filters"}<ArrowRight size={13} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Option B: adds a footer link to the REAL sidebar Chats panel (rendered by LeftNav,
 * unchanged) through a portal. It hands the panel's search text to the Project Chats page.
 * In the real app this would be a small LeftNav change (flagged).
 */
export function SidebarChatsPanelLink({ count, onOpenPage }: { count: number; onOpenPage: (query: string) => void }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const container = useMemo(() => {
    const el = document.createElement("div");
    el.setAttribute("data-ux-b-panel-footer", "");
    return el;
  }, []);
  useEffect(() => {
    const sync = () => {
      const panel = document.querySelector<HTMLElement>('[role="navigation"][aria-label="Chats"]');
      // Directly under the panel's search field (the panel's first child is its header).
      if (panel && container.parentElement !== panel) panel.insertBefore(container, panel.children[1] ?? null);
      setHost(panel);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); container.remove(); };
  }, [container]);
  if (!host) return null;
  return createPortal(
    <div className="shrink-0 px-3.5 pb-2.5 pt-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <button
        type="button"
        onClick={() => onOpenPage(host.querySelector<HTMLInputElement>('input[type="search"]')?.value ?? "")}
        className="flex w-full items-center justify-between gap-2 rounded-[8px] border px-3 py-2 text-left luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[rgba(150,219,251,0.55)]"
        style={{ borderColor: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.92)", fontWeight: 600 }}
        data-ux-b-all-chats=""
      >
        <span className="inline-flex items-center gap-2"><SlidersHorizontal size={13} aria-hidden />All {count} chats · filters</span>
        <ArrowRight size={13} aria-hidden />
      </button>
    </div>,
    container,
  );
}

/** D2: "Find chats" as a canonical header action (same style as Constellation Settings). */
export function FindChatsHeaderAction({ onClick, iconOnly = false }: { onClick: () => void; iconOnly?: boolean }) {
  return (
    <Button
      type="button"
      {...LUXIA_PAGE_HEADER_ACTION.settings}
      onClick={onClick}
      aria-label="Find chats: search and filter chats in this Project"
      title="Find chats"
      className={iconOnly ? "px-2.5" : undefined}
      data-ux-find-chats-entry=""
      data-ux-find-chats-header={iconOnly ? "icon" : "full"}
    >
      <Search size={16} aria-hidden />
      {iconOnly ? null : "Find chats"}
    </Button>
  );
}
