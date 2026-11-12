import { useMemo, useState } from "react";
import { Pin, Search, SlidersHorizontal, X } from "lucide-react";
import { ConstellationSourceBadge, type Chat, type Constellation } from "@/app/app-sections/appSectionShared";
import { LuxiaBreadcrumb } from "@/app/components/LuxiaBreadcrumb";
import { LUXIA_PAGE_HEADER_ACTION, LUXIA_PAGE_INTRO, LuxiaPageHeader, LuxiaPageHeaderShell } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { LuxiaChatIcon, LuxiaGalaxyIcon } from "@/assets/icons";

type TypeFilter = "all" | "galaxy" | "constellation";
type Sort = "opened" | "name";

export interface ChatListFilter {
  query: string;
  type: TypeFilter;
  constellationId: string;
  source: "all" | "database" | "csv" | "pdf";
  pinnedOnly: boolean;
}

export const EMPTY_LIST_FILTER: ChatListFilter = { query: "", type: "all", constellationId: "all", source: "all", pinnedOnly: false };

/** Title + Constellation name, the same matcher the sidebar rail uses in the lab. */
export function matchChat(chat: Chat, constellations: Constellation[], f: ChatListFilter): boolean {
  const con = constellations.find((c) => c.id === chat.constellationId);
  const q = f.query.trim().toLowerCase();
  if (q && !(`${chat.chatType === "galaxy" ? "galaxy " : ""}${chat.label} ${con?.label ?? ""}`.toLowerCase().includes(q))) return false;
  if (f.type !== "all" && chat.chatType !== f.type) return false;
  if (f.constellationId !== "all" && chat.constellationId !== f.constellationId) return false;
  if (f.source !== "all" && con?.type !== f.source) return false;
  if (f.pinnedOnly && !chat.pinned) return false;
  return true;
}

const advancedCount = (f: ChatListFilter) => (f.constellationId !== "all" ? 1 : 0) + (f.source !== "all" ? 1 : 0) + (f.pinnedOnly ? 1 : 0);

/**
 * Simulated Project Chats page (stand-in for the real ChatsLibrary): the full
 * browser for one Project. Search, Type and Sort are always visible; Constellation,
 * Source and Pinned live behind one "Filters" button. Never changes capsules or chats.
 */
export function ProjectChatsPage({
  projectName,
  chats,
  constellations,
  hidden,
  activeChatId,
  onOpen,
  onNewChat,
  onHome,
  order,
  backToChat,
  initialQuery = "",
  initialAdvanced = false,
}: {
  /** Entry points (sidebar panel, chat toolbar) can hand over what the user already typed. */
  initialQuery?: string;
  initialAdvanced?: boolean;
  backToChat?: { label: string; onClick: () => void };
  projectName: string;
  chats: Chat[];
  constellations: Constellation[];
  hidden: Set<string>;
  activeChatId: string | null;
  onOpen: (chatId: string) => void;
  onNewChat: () => void;
  onHome: () => void;
  order: string[];
}) {
  const [f, setF] = useState<ChatListFilter>({ ...EMPTY_LIST_FILTER, query: initialQuery });
  const [sort, setSort] = useState<Sort>("opened");
  const [showAdvanced, setShowAdvanced] = useState(initialAdvanced);
  const usedConstellations = constellations.filter((c) => chats.some((chat) => chat.constellationId === c.id));
  const results = useMemo(() => {
    const list = chats.filter((chat) => matchChat(chat, constellations, f));
    return sort === "name" ? list.slice().sort((a, b) => a.label.localeCompare(b.label)) : list.slice().sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [chats, constellations, f, sort, order]);
  const active = Boolean(f.query.trim()) || f.type !== "all" || advancedCount(f) > 0;
  const reset = () => setF(EMPTY_LIST_FILTER);
  const select = "rounded-[8px] border px-2 py-1.5 luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-ux-project-chats-page="">
      <LuxiaPageHeaderShell>
      <LuxiaPageHeader
        contentGap="none"
        pageTypeLabel="PROJECT"
        title="Chats"
        description={`Find any chat in ${projectName}: search by name, or narrow by type and filters.`}
        breadcrumb={<LuxiaBreadcrumb tone="page" items={[
          { id: "home", label: "Home", destination: { kind: "home" } },
          { id: "project", label: projectName, destination: { kind: "home" } },
          { id: "chats", label: "Chats", destination: { kind: "current" } },
        ]} handlers={{ onHome }} />}
        primaryAction={<Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={onNewChat}>New Chat</Button>}
        secondaryAction={backToChat ? <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.secondary} onClick={backToChat.onClick} data-ux-back-to-chat="">{`Back to ${backToChat.label}`}</Button> : undefined}
      />
      </LuxiaPageHeaderShell>
      <div className="luxia-scrollbar min-h-0 flex-1 overflow-y-auto pb-6 pt-5" style={{ paddingInline: LUXIA_PAGE_INTRO.padInline }}>
        <div className="flex flex-wrap items-center gap-2" role="search" aria-label="Search and filter chats">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] border px-2.5 py-1.5 sm:max-w-[320px]" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}>
            <Search size={13} color="var(--luxia-text-muted)" aria-hidden />
            <input value={f.query} onChange={(e) => setF({ ...f, query: e.target.value })} placeholder="Search chats" aria-label="Search chats" className="min-w-0 flex-1 bg-transparent outline-none luxia-type-body-dense" data-ux-page-search="" />
            {f.query ? <button type="button" aria-label="Clear search" onClick={() => setF({ ...f, query: "" })}><X size={12} /></button> : null}
          </label>
          <div className="flex rounded-[10px] border p-0.5" style={{ borderColor: "var(--luxia-border-default)" }} role="radiogroup" aria-label="Type">
            {(["all", "galaxy", "constellation"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={f.type === t} onClick={() => setF({ ...f, type: t, constellationId: t === "galaxy" ? "all" : f.constellationId, source: t === "galaxy" ? "all" : f.source })} className="rounded-[8px] px-2.5 py-1 luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]" style={f.type === t ? { background: "var(--luxia-opacity-brand-secondary-12)", color: "var(--luxia-purple-70)", fontWeight: 700 } : { color: "var(--luxia-text-secondary)" }} data-ux-page-type={t}>
                {t === "all" ? "All" : t === "galaxy" ? "Galaxy" : "Constellation"}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort chats" className={select} style={{ borderColor: "var(--luxia-border-default)" }}>
            <option value="opened">Recently opened</option>
            <option value="name">Name</option>
          </select>
          <Button type="button" variant="tertiary" size="compact" aria-expanded={showAdvanced} onClick={() => setShowAdvanced((v) => !v)} data-ux-page-filters="">
            <SlidersHorizontal size={14} aria-hidden />Filters{advancedCount(f) ? ` (${advancedCount(f)})` : ""}
          </Button>
        </div>
        {showAdvanced ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[10px] border px-3 py-2" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }} data-ux-page-advanced="">
            {f.type !== "galaxy" ? (
              <>
                <select value={f.constellationId} onChange={(e) => setF({ ...f, constellationId: e.target.value })} aria-label="Constellation" className={select} style={{ borderColor: "var(--luxia-border-default)" }} data-ux-page-constellation="">
                  <option value="all">Any Constellation</option>
                  {usedConstellations.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as ChatListFilter["source"] })} aria-label="Source" className={select} style={{ borderColor: "var(--luxia-border-default)" }} data-ux-page-source="">
                  <option value="all">Any source</option>
                  <option value="database">DB</option>
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </>
            ) : null}
            <label className="inline-flex items-center gap-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              <input type="checkbox" checked={f.pinnedOnly} onChange={(e) => setF({ ...f, pinnedOnly: e.target.checked })} data-ux-page-pinned="" />Pinned only
            </label>
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-3 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }} aria-live="polite">
          {!active ? <span className="luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }} data-ux-page-recent="">{sort === "opened" ? "Recent chats · pinned marked" : "All chats A–Z"}</span> : null}
          <span data-ux-page-count="">{active ? `${results.length} of ${chats.length} chats` : `${chats.length} chats`}</span>
          {active ? <Button type="button" variant="link" size="compact" onClick={reset} data-ux-page-clear="">Clear</Button> : null}
        </div>
        {results.length === 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[12px] border px-4 py-3 luxia-type-body-dense" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)", color: "var(--luxia-text-secondary)" }} data-ux-page-empty="">
            {f.query.trim() ? `No chats in ${projectName} match "${f.query.trim()}".` : `No chats in ${projectName} match these filters.`}
            <Button type="button" variant="secondary" size="compact" onClick={reset}>Clear</Button>
          </div>
        ) : (
          <ul className="mt-2 divide-y rounded-[12px] border" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }} data-ux-page-list="">
            {results.map((chat) => {
              const con = constellations.find((c) => c.id === chat.constellationId);
              const closed = hidden.has(chat.id);
              return (
                <li key={chat.id} style={{ borderColor: "var(--luxia-border-default)" }}>
                  <button type="button" onClick={() => onOpen(chat.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left outline-none hover:bg-[var(--luxia-opacity-brand-secondary-04)] focus-visible:bg-[var(--luxia-opacity-brand-secondary-08)]" aria-current={chat.id === activeChatId ? "true" : undefined} data-ux-page-row={chat.id}>
                    {chat.chatType === "galaxy" ? <LuxiaGalaxyIcon size={15} color="var(--luxia-purple-60)" /> : <LuxiaChatIcon size={15} color="var(--luxia-purple-60)" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{chat.chatType === "galaxy" ? "Galaxy" : chat.label}</span>
                      <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{con ? con.label : "Picks a suitable Constellation per question"}</span>
                    </span>
                    {chat.pinned ? <Pin size={12} color="var(--luxia-purple-60)" aria-label="Pinned" /> : null}
                    {con ? <ConstellationSourceBadge type={con.type} /> : null}
                    <span className="w-[52px] text-right luxia-type-caption" style={{ color: closed ? "var(--luxia-text-muted)" : "var(--luxia-success-70)" }}>{closed ? "Closed" : "Open"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
