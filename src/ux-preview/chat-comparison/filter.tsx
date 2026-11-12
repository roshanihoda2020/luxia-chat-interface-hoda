import { useEffect, useRef, useState } from "react";
import { Pin, Search, X } from "lucide-react";
import type { Chat, Constellation } from "@/app/app-sections/appSectionShared";
import { Button } from "@/app/components/ui/button";

export interface ChatFilter {
  query: string;
  type: "all" | "galaxy" | "constellation";
  constellationId: "all" | string;
  pinnedOnly: boolean;
}

export const EMPTY_FILTER: ChatFilter = { query: "", type: "all", constellationId: "all", pinnedOnly: false };

export function isFiltering(f: ChatFilter): boolean {
  return Boolean(f.query.trim()) || f.type !== "all" || f.constellationId !== "all" || f.pinnedOnly;
}

/** Title-only match. Never removes, closes or changes a chat: it only decides what is listed. */
export function applyFilter(chats: Chat[], f: ChatFilter): Chat[] {
  const q = f.query.trim().toLowerCase();
  return chats.filter((chat) => {
    const title = chat.chatType === "galaxy" ? `galaxy ${chat.label}` : chat.label;
    if (q && !title.toLowerCase().includes(q)) return false;
    if (f.type !== "all" && chat.chatType !== f.type) return false;
    if (f.constellationId !== "all" && chat.constellationId !== f.constellationId) return false;
    if (f.pinnedOnly && !chat.pinned) return false;
    return true;
  });
}

/** Filter state scoped to one Project: switching Project clears Constellation-specific criteria. */
export function useChatFilter(projectId: string) {
  const [filter, setFilter] = useState<ChatFilter>(EMPTY_FILTER);
  const [open, setOpen] = useState(false);
  useEffect(() => { setFilter((f) => ({ ...f, constellationId: "all" })); }, [projectId]);
  return { filter, setFilter, open, setOpen, reset: () => setFilter(EMPTY_FILTER) };
}

function Chip({ active, onClick, children, testId }: { active: boolean; onClick: () => void; children: React.ReactNode; testId: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
      style={active
        ? { background: "var(--luxia-opacity-brand-secondary-12)", borderColor: "var(--luxia-purple-50)", color: "var(--luxia-purple-70)" }
        : { background: "var(--luxia-surface)", borderColor: "var(--luxia-border-default)", color: "var(--luxia-text-secondary)" }}
      data-ux-filter-chip={testId}
    >
      {children}
    </button>
  );
}

/**
 * Search + filters for the chats of the current Project. Only criteria that can
 * narrow this Project's chats are shown (no Project filter: the selector already sets it).
 */
export function ChatFilterBar({
  filter,
  onChange,
  onReset,
  chats,
  constellations,
  resultCount,
  total,
  compact = false,
}: {
  filter: ChatFilter;
  onChange: (f: ChatFilter) => void;
  onReset: () => void;
  chats: Chat[];
  constellations: Constellation[];
  resultCount: number;
  total: number;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const hasGalaxy = chats.some((c) => c.chatType === "galaxy");
  const hasConstellationChats = chats.some((c) => c.chatType === "constellation");
  const used = constellations.filter((c) => chats.some((chat) => chat.constellationId === c.id));
  const hasPinned = chats.some((c) => c.pinned);
  const active = isFiltering(filter);
  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-2 ${compact ? "" : "py-2"}`} data-ux-filter-bar="" role="search" aria-label="Search and filter chats">
      <label className={`flex min-w-0 items-center gap-2 rounded-[10px] border px-2.5 py-1.5 ${compact ? "w-full" : "w-full sm:w-[240px]"}`} style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}>
        <Search size={13} color="var(--luxia-text-muted)" aria-hidden />
        <input
          ref={inputRef}
          value={filter.query}
          onChange={(e) => onChange({ ...filter, query: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Escape" && filter.query) { e.stopPropagation(); onChange({ ...filter, query: "" }); } }}
          placeholder="Search chat titles"
          aria-label="Search chat titles"
          className="min-w-0 flex-1 bg-transparent outline-none luxia-type-body-dense"
          data-ux-filter-search=""
        />
        {filter.query ? <button type="button" aria-label="Clear search" onClick={() => onChange({ ...filter, query: "" })} className="rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"><X size={12} /></button> : null}
      </label>
      {hasGalaxy && hasConstellationChats ? (
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Show">
          <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>Show:</span>
          <Chip active={filter.type === "all"} onClick={() => onChange({ ...filter, type: "all" })} testId="type-all">All chats</Chip>
          <Chip active={filter.type === "galaxy"} onClick={() => onChange({ ...filter, type: "galaxy", constellationId: "all" })} testId="type-galaxy">Galaxy chats</Chip>
          <Chip active={filter.type === "constellation"} onClick={() => onChange({ ...filter, type: "constellation" })} testId="type-constellation">Constellation chats</Chip>
        </div>
      ) : null}
      {used.length > 1 && filter.type !== "galaxy" ? (
        <select
          value={filter.constellationId}
          onChange={(e) => onChange({ ...filter, constellationId: e.target.value })}
          aria-label="Filter by Constellation"
          className="rounded-full border px-2.5 py-1 luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ borderColor: filter.constellationId === "all" ? "var(--luxia-border-default)" : "var(--luxia-purple-50)", background: "var(--luxia-surface)", color: "var(--luxia-text-secondary)" }}
          data-ux-filter-constellation=""
        >
          <option value="all">Any Constellation</option>
          {used.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      ) : null}
      {hasPinned ? (
        <Chip active={filter.pinnedOnly} onClick={() => onChange({ ...filter, pinnedOnly: !filter.pinnedOnly })} testId="pinned"><Pin size={11} aria-hidden />Pinned</Chip>
      ) : null}
      <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }} aria-live="polite" data-ux-filter-count="">
        {active ? `${resultCount} of ${total} chats` : `${total} chats in History`}
      </span>
      {active ? <Button type="button" variant="link" size="compact" onClick={onReset} data-ux-filter-clear="">Clear filters</Button> : null}
    </div>
  );
}

export function NoMatches({ onReset, projectName, query }: { onReset: () => void; projectName: string; query: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-2.5 py-3 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }} data-ux-filter-empty="">
      {query.trim() ? `No chats in ${projectName} match "${query.trim()}".` : `No chats in ${projectName} match these filters.`}
      <Button type="button" variant="secondary" size="compact" onClick={onReset} data-ux-filter-reset="">Clear filters</Button>
    </div>
  );
}
