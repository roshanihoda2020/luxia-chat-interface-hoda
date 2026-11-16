import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Pin, Search, SlidersHorizontal, X } from "lucide-react";
import { LuxiaChatIcon, LuxiaGalaxyIcon } from "@/assets/icons";
import {
  EMPTY_CHAT_FILTER,
  advancedFilterCount,
  findChats,
  isFilterActive,
  type ChatFilter,
  type FinderChat,
} from "./chatQuery";
import "./chatFinder.css";

const SOURCE_LABEL: Record<NonNullable<FinderChat["source"]>, string> = { pdf: "PDF", csv: "CSV", database: "DB" };

/**
 * Overlay Chat Finder. Searches the selected Project's accessible chats;
 * filters never change the active chat — only choosing a result opens (or reopens) it.
 */
export function ChatFinderOverlay({ open, onClose, chats, activeChatId, projectName, onOpenChat, onOpenAllChats }: {
  open: boolean;
  onClose: () => void;
  chats: readonly FinderChat[];
  activeChatId: string | null;
  projectName: string;
  onOpenChat: (chatId: string) => void;
  onOpenAllChats: () => void;
}) {
  const [filter, setFilter] = useState<ChatFilter>(EMPTY_CHAT_FILTER);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fresh, uncluttered state each time it opens; advanced filters collapsed by default.
  useEffect(() => {
    if (!open) return;
    setFilter(EMPTY_CHAT_FILTER);
    setShowAdvanced(false);
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } };
    document.addEventListener("keydown", onKey);
    return () => { window.cancelAnimationFrame(frame); document.removeEventListener("keydown", onKey); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => findChats(chats, filter), [chats, filter]);
  const constellations = useMemo(() => {
    const map = new Map<string, { id: string; label: string; source?: FinderChat["source"] }>();
    for (const chat of chats) if (chat.constellationId && chat.constellationLabel) map.set(chat.constellationId, { id: chat.constellationId, label: chat.constellationLabel, source: chat.source });
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }, [chats]);
  if (!open) return null;

  const active = isFilterActive(filter);
  const advanced = advancedFilterCount(filter);
  const pinned = results.filter((c) => c.pinned);
  const recent = results.filter((c) => !c.pinned);
  const clear = () => setFilter(EMPTY_CHAT_FILTER);

  // ↓ from search enters the list; ↑/↓ move between results.
  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const rows = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>("[data-luxia-finder-row]") ?? []);
    if (rows.length === 0) return;
    const index = rows.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1 && event.key === "ArrowDown" && document.activeElement === searchRef.current) { event.preventDefault(); rows[0].focus(); return; }
    if (index === -1) return;
    event.preventDefault();
    if (event.key === "ArrowDown") rows[Math.min(rows.length - 1, index + 1)].focus();
    else if (index === 0) searchRef.current?.focus();
    else rows[index - 1].focus();
  };

  const row = (chat: FinderChat) => {
    const current = chat.id === activeChatId;
    const name = chat.chatType === "galaxy" ? chat.label || "Galaxy" : chat.label;
    return (
      <li key={chat.id}>
        <button
          type="button"
          className="luxia-finder-row"
          onClick={() => onOpenChat(chat.id)}
          aria-current={current ? "true" : undefined}
          aria-label={`${name}${chat.constellationLabel ? `, ${chat.constellationLabel}${chat.source ? ` ${SOURCE_LABEL[chat.source]}` : ""}` : ""}${chat.pinned ? ", pinned" : ""}${chat.closed ? ", closed: reopen" : current ? ", current chat" : ""}`}
          data-luxia-finder-row={chat.id}
        >
          {chat.chatType === "galaxy" ? <LuxiaGalaxyIcon size={14} color="currentColor" /> : <LuxiaChatIcon size={14} color="currentColor" />}
          <span className="luxia-finder-row__text">
            <span className="luxia-finder-row__title" title={name}>{name}</span>
            <span className="luxia-finder-row__meta">
              {chat.constellationLabel
                ? <>{chat.constellationLabel}{chat.source ? <span className="luxia-finder-tag">{SOURCE_LABEL[chat.source]}</span> : null}</>
                : "Picks a Constellation per question"}
            </span>
          </span>
          {chat.pinned ? <Pin size={12} aria-hidden className="luxia-finder-row__pin" /> : null}
          <span className={`luxia-finder-status${chat.closed ? " is-closed" : current ? " is-current" : ""}`}>
            {chat.closed ? "Reopen" : current ? "Current" : "Open"}
          </span>
        </button>
      </li>
    );
  };

  return createPortal(
    <div className="luxia-finder-overlay" data-luxia-finder="" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panelRef} className="luxia-finder" role="dialog" aria-modal="true" aria-label={`Find chats in ${projectName}`} onKeyDown={onPanelKeyDown}>
        <div className="luxia-finder__controls">
          <div className="luxia-finder__head">
            <span>Find chats</span>
            <button type="button" onClick={onClose} aria-label="Close Find chats" data-luxia-finder-close=""><X size={14} /></button>
          </div>
          <label className="luxia-finder__search">
            <Search size={13} aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={filter.query}
              onChange={(e) => setFilter({ ...filter, query: e.target.value })}
              placeholder="Search chats"
              aria-label={`Search chats in ${projectName}`}
              data-luxia-finder-search=""
            />
            {filter.query ? <button type="button" aria-label="Clear search" onClick={() => setFilter({ ...filter, query: "" })}><X size={12} /></button> : null}
          </label>
          <div className="luxia-finder__toolbar">
            <div className="luxia-finder__type" role="radiogroup" aria-label="Chat type">
              {(["all", "galaxy", "constellation"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={filter.type === t}
                  onClick={() => setFilter({ ...filter, type: t, ...(t === "galaxy" ? { constellationId: "all", source: "all" as const } : {}) })}
                  data-luxia-finder-type={t}
                >
                  {t === "all" ? "All" : t === "galaxy" ? "Galaxy" : "Constellation"}
                </button>
              ))}
            </div>
            <button type="button" className={`luxia-finder__filters${advanced ? " is-active" : ""}`} aria-expanded={showAdvanced} onClick={() => setShowAdvanced(!showAdvanced)} data-luxia-finder-filters="">
              <SlidersHorizontal size={12} aria-hidden />Filters{advanced ? <span className="luxia-finder__badge" data-luxia-finder-filter-count="">{advanced}</span> : null}
            </button>
          </div>
          {showAdvanced ? (
            <div className="luxia-finder__advanced" data-luxia-finder-advanced="">
              <label>
                <span>Constellation</span>
                <select value={filter.constellationId} disabled={filter.type === "galaxy"} onChange={(e) => setFilter({ ...filter, constellationId: e.target.value })} data-luxia-finder-constellation="">
                  <option value="all">Any</option>
                  {constellations.map((c) => <option key={c.id} value={c.id}>{c.label}{c.source ? ` (${SOURCE_LABEL[c.source]})` : ""}</option>)}
                </select>
              </label>
              <label>
                <span>Source</span>
                <select value={filter.source} disabled={filter.type === "galaxy"} onChange={(e) => setFilter({ ...filter, source: e.target.value as ChatFilter["source"] })} data-luxia-finder-source="">
                  <option value="all">Any</option>
                  <option value="database">DB</option>
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </label>
              <label className="luxia-finder__check">
                <input type="checkbox" checked={filter.pinnedOnly} onChange={(e) => setFilter({ ...filter, pinnedOnly: e.target.checked })} data-luxia-finder-pinned="" />Pinned only
              </label>
            </div>
          ) : null}
          <div className="luxia-finder__status" aria-live="polite">
            <span data-luxia-finder-count="">{active ? `${results.length} of ${chats.length} chats` : `${chats.length} chats`}</span>
            {active ? <button type="button" onClick={clear} data-luxia-finder-clear="">Clear filters</button> : null}
          </div>
        </div>
        <div className="luxia-finder__results luxia-scrollbar">
          {chats.length === 0 ? (
            <p className="luxia-finder__empty" data-luxia-finder-empty="none">No chats in this Project yet.</p>
          ) : results.length === 0 ? (
            <div className="luxia-finder__empty" data-luxia-finder-empty="filtered">
              <p>{filter.query.trim() ? `No chats match “${filter.query.trim()}”.` : "No chats match these filters."}</p>
              <button type="button" onClick={clear}>Clear filters</button>
            </div>
          ) : active ? (
            <ul data-luxia-finder-list="results">{results.map(row)}</ul>
          ) : (
            <>
              {pinned.length ? <><p className="luxia-finder__section">Pinned</p><ul data-luxia-finder-list="pinned">{pinned.map(row)}</ul></> : null}
              {recent.length ? <><p className="luxia-finder__section">Recent</p><ul data-luxia-finder-list="recent">{recent.map(row)}</ul></> : null}
            </>
          )}
        </div>
        <button type="button" className="luxia-finder__page" onClick={onOpenAllChats} data-luxia-finder-page="">
          Open full Chats page<ArrowRight size={12} aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}
