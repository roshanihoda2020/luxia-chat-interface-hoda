import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Pin, Search, SlidersHorizontal, X } from "lucide-react";
import { getConstellationSourceLabel, type Chat, type Constellation } from "@/app/app-sections/appSectionShared";
import { LuxiaChatIcon, LuxiaGalaxyIcon } from "@/assets/icons";
import { EMPTY_LIST_FILTER, matchChat, type ChatListFilter } from "./ProjectChatsPage";
import "./chatFinder.css";

export type FinderPresentation = "sidebar" | "overlay";

const advancedCount = (f: ChatListFilter) => (f.constellationId !== "all" ? 1 : 0) + (f.source !== "all" ? 1 : 0) + (f.pinnedOnly ? 1 : 0);

/**
 * ONE Finder state for both presentations (sidebar and overlay): same filter object,
 * same matcher as the Project Chats page (title + Constellation name). Lives in the
 * Chat shell, so it never touches the active Project, knowledge or open capsules.
 */
export function useChatFinder() {
  const [filter, setFilter] = useState<ChatListFilter>(EMPTY_LIST_FILTER);
  const [showAdvanced, setShowAdvanced] = useState(false);
  return {
    filter,
    setFilter,
    showAdvanced,
    setShowAdvanced,
    advanced: advancedCount(filter),
    active: Boolean(filter.query.trim()) || filter.type !== "all" || advancedCount(filter) > 0,
    clear: () => setFilter(EMPTY_LIST_FILTER),
  };
}
export type ChatFinderState = ReturnType<typeof useChatFinder>;

/** Chats the user may see in the selected Project: Galaxy + Constellation chats whose Constellation they can access. */
export function finderChats(chats: Chat[], projectId: string, usable: Constellation[], unscoped: Set<string>): Chat[] {
  return chats.filter((c) => c.projectId === projectId && !unscoped.has(c.id) && (c.chatType === "galaxy" || usable.some((u) => u.id === c.constellationId)));
}

export function FinderBody({ tone, state, chats, constellations, hidden, activeChatId, recentOrder, onOpen, onOpenPage, autoFocusKey, headerSlot }: {
  tone: "dark" | "light";
  state: ChatFinderState;
  chats: Chat[];
  constellations: Constellation[];
  hidden: Set<string>;
  activeChatId: string | null;
  /** Most recent first. */
  recentOrder: string[];
  onOpen: (chatId: string) => void;
  onOpenPage: () => void;
  autoFocusKey?: number;
  headerSlot?: ReactNode;
}) {
  const { filter: f, setFilter: setF, showAdvanced, setShowAdvanced, advanced, active, clear } = state;
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocusKey) window.requestAnimationFrame(() => inputRef.current?.focus()); }, [autoFocusKey]);
  const used = constellations.filter((c) => chats.some((chat) => chat.constellationId === c.id));
  const rank = (id: string) => { const i = recentOrder.indexOf(id); return i < 0 ? 999 : i; };
  const results = useMemo(() => chats.filter((c) => matchChat(c, constellations, f)).sort((a, b) => rank(a.id) - rank(b.id)), [chats, constellations, f, recentOrder]); // eslint-disable-line react-hooks/exhaustive-deps
  const pinned = results.filter((c) => c.pinned);
  const recent = results.filter((c) => !c.pinned);

  const row = (chat: Chat) => {
    const con = constellations.find((c) => c.id === chat.constellationId);
    const closed = hidden.has(chat.id);
    const current = chat.id === activeChatId;
    return (
      <li key={chat.id}>
        <button type="button" onClick={() => onOpen(chat.id)} className="ux-finder-row" aria-current={current ? "true" : undefined} data-ux-finder-row={chat.id} aria-label={`${chat.chatType === "galaxy" ? "Galaxy" : chat.label}${con ? `, ${con.label} ${getConstellationSourceLabel(con.type)}` : ""}${chat.pinned ? ", pinned" : ""}${closed ? ", closed: reopen" : current ? ", current chat" : ""}`}>
          {chat.chatType === "galaxy" ? <LuxiaGalaxyIcon size={14} color="currentColor" /> : <LuxiaChatIcon size={14} color="currentColor" />}
          <span className="ux-finder-row__text">
            <span className="ux-finder-row__title">{chat.chatType === "galaxy" ? "Galaxy" : chat.label}</span>
            <span className="ux-finder-row__meta">
              {con ? <>{con.label} <span className="ux-finder-tag">{getConstellationSourceLabel(con.type)}</span></> : "Picks a Constellation per question"}
            </span>
          </span>
          {chat.pinned ? <Pin size={12} aria-hidden className="ux-finder-row__pin" /> : null}
          <span className={`ux-finder-status${closed ? " ux-finder-status--closed" : current ? " ux-finder-status--current" : ""}`}>{closed ? "Reopen" : current ? "Current" : "Open"}</span>
        </button>
      </li>
    );
  };

  return (
    <div className={`ux-finder ux-finder--${tone}`} data-ux-finder-body={tone}>
      <div className="ux-finder__controls">
        {headerSlot}
        <label className="ux-finder__search">
          <Search size={13} aria-hidden />
          <input ref={inputRef} type="search" value={f.query} onChange={(e) => setF({ ...f, query: e.target.value })} placeholder="Search chats" aria-label="Search chats in this Project" data-ux-finder-search="" />
          {f.query ? <button type="button" aria-label="Clear search" onClick={() => setF({ ...f, query: "" })}><X size={12} /></button> : null}
        </label>
        <div className="ux-finder__toolbar">
          <div className="ux-finder__type" role="radiogroup" aria-label="Chat type">
            {(["all", "galaxy", "constellation"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={f.type === t} onClick={() => setF({ ...f, type: t, ...(t === "galaxy" ? { constellationId: "all", source: "all" } : {}) })} data-ux-finder-type={t}>
                {t === "all" ? "All" : t === "galaxy" ? "Galaxy" : "Constellation"}
              </button>
            ))}
          </div>
          <button type="button" className={`ux-finder__filters${advanced ? " is-active" : ""}`} aria-expanded={showAdvanced} onClick={() => setShowAdvanced(!showAdvanced)} data-ux-finder-filters="">
            <SlidersHorizontal size={12} aria-hidden />Filters{advanced ? <span className="ux-finder__badge" data-ux-finder-filter-count="">{advanced}</span> : null}
          </button>
        </div>
        {showAdvanced ? (
          <div className="ux-finder__advanced" data-ux-finder-advanced="">
            <label>
              <span>Constellation</span>
              <select value={f.constellationId} disabled={f.type === "galaxy"} onChange={(e) => setF({ ...f, constellationId: e.target.value })} data-ux-finder-constellation="">
                <option value="all">Any</option>
                {used.map((c) => <option key={c.id} value={c.id}>{c.label} ({getConstellationSourceLabel(c.type)})</option>)}
              </select>
            </label>
            <label>
              <span>Source</span>
              <select value={f.source} disabled={f.type === "galaxy"} onChange={(e) => setF({ ...f, source: e.target.value as ChatListFilter["source"] })} data-ux-finder-source="">
                <option value="all">Any</option>
                <option value="database">DB</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
            <label className="ux-finder__check">
              <input type="checkbox" checked={f.pinnedOnly} onChange={(e) => setF({ ...f, pinnedOnly: e.target.checked })} data-ux-finder-pinned="" />Pinned only
            </label>
          </div>
        ) : null}
        <div className="ux-finder__status" aria-live="polite">
          <span data-ux-finder-count="">{active ? `${results.length} of ${chats.length} chats` : `${chats.length} chats`}</span>
          <span className="ux-finder__status-actions">
            {active ? <button type="button" onClick={clear} data-ux-finder-clear="">Clear filters</button> : null}
            {tone === "dark" ? <button type="button" onClick={onOpenPage} data-ux-finder-page="">Full page</button> : null}
          </span>
        </div>
      </div>
      <div className="ux-finder__results luxia-scrollbar">
        {chats.length === 0 ? (
          <p className="ux-finder__empty" data-ux-finder-empty="none">No chats in this Project yet.</p>
        ) : results.length === 0 ? (
          <div className="ux-finder__empty" data-ux-finder-empty="filtered">
            <p>{f.query.trim() ? `No chats match "${f.query.trim()}"` : "No chats match these filters."}</p>
            <button type="button" onClick={clear}>Clear filters</button>
          </div>
        ) : active ? (
          <ul data-ux-finder-list="results">{results.map(row)}</ul>
        ) : (
          <>
            {pinned.length ? <><p className="ux-finder__section">Pinned</p><ul data-ux-finder-list="pinned">{pinned.map(row)}</ul></> : null}
            <p className="ux-finder__section">Recent</p>
            <ul data-ux-finder-list="recent">{recent.map(row)}</ul>
          </>
        )}
      </div>
      {tone === "light" ? (
        <button type="button" className="ux-finder__page" onClick={onOpenPage} data-ux-finder-page="">
          Open full Chats page<ArrowRight size={12} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Presentation A: the REAL sidebar Chats panel (LeftNav, unchanged) keeps its header and
 * close button; the prototype places the Finder inside it (portal) and hides the panel's
 * own plain search + list so there is one search logic. Real build: a small LeftNav slot.
 */
export function SidebarFinder(props: Omit<Parameters<typeof FinderBody>[0], "tone">) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const container = useMemo(() => { const el = document.createElement("div"); el.className = "ux-finder-host"; return el; }, []);
  useEffect(() => {
    const sync = () => {
      const panel = document.querySelector<HTMLElement>('[role="navigation"][aria-label="Chats"]');
      if (panel) {
        if (!panel.hasAttribute("data-ux-finder-host")) panel.setAttribute("data-ux-finder-host", "");
        if (container.parentElement !== panel) panel.insertBefore(container, panel.children[1] ?? null);
      }
      setHost((h) => (h === panel ? h : panel));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); container.remove(); };
  }, [container]);
  if (!host) return null;
  return createPortal(<FinderBody tone="dark" {...props} />, container);
}

/** Presentation B: an overlay Finder over the chat (dialog). Esc / backdrop closes; focus returns. */
export function OverlayFinder({ open, onClose, returnFocusTo, ...props }: Omit<Parameters<typeof FinderBody>[0], "tone"> & { open: boolean; onClose: () => void; returnFocusTo?: () => HTMLElement | null }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); window.setTimeout(() => returnFocusTo?.()?.focus(), 0); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  return createPortal(
    <div className="ux-finder-overlay" data-ux-finder-overlay="" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ux-finder-overlay__panel" role="dialog" aria-modal="true" aria-label="Find chats in this Project">
        <FinderBody
          tone="light"
          {...props}
          headerSlot={(
            <div className="ux-finder-overlay__head">
              <span>Find chats</span>
              <button type="button" onClick={onClose} aria-label="Close Find chats" data-ux-finder-close=""><X size={14} /></button>
            </div>
          )}
        />
      </div>
    </div>,
    document.body,
  );
}
