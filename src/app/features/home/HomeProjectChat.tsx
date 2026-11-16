import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, ChevronUp, Pencil, RotateCcw } from "lucide-react";
import { ICON_BUTTON as HEADER_ICON_BUTTON } from "./HomeAssistantConversation";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { LuxiaConstellationIcon, LuxiaGalaxyIcon } from "@/assets/icons";
import { KnowledgeOptionsMenu, type KnowledgeContextOption } from "@/app/features/chat-context/ComposerContextRow";
import { KnowledgeChangeNotice, type KnowledgeNotice } from "@/app/features/chat-context/KnowledgeChangeNotice";

/**
 * Home inline Project Chat. Home renders a REAL chat from the app's shared chat state; App owns
 * the record, messages, drafts, access checks and the single send pipeline. Nothing here is a
 * second chat engine — it is a compact view plus callbacks.
 */
export interface HomeProjectChatController {
  projectId: string;
  projectName: string;
  /** Accessible knowledge for this Project (Galaxy + usable Constellations). */
  options: KnowledgeContextOption[];
  /** The chosen knowledge; null when the user must choose explicitly. */
  knowledge: KnowledgeContextOption | null;
  onSelectKnowledge: (option: KnowledgeContextOption) => void;
  /** The real chat shown on Home (null until the first message creates it). */
  chatId: string | null;
  chatLabel: string | null;
  messageCount: number;
  /** Renders the real chat messages with the app's own message components. */
  renderMessages: () => ReactNode;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  canOpenFullChat: boolean;
  onOpenFullChat: () => void;
  /** "New conversation": keeps the current chat; the next message starts a new one (same scope). */
  canStartNew: boolean;
  onStartNew: () => void;
  /** Rename from Home (shared handler; returns an inline error or null). Gated by App. */
  canRename: boolean;
  onRename: (value: string) => string | null;
  /** Plain-text preview of the last message (collapsed summary). */
  lastMessagePreview?: string;
  notice: KnowledgeNotice | null;
}

const ICON_BUTTON = "inline-flex h-8 items-center gap-1 rounded-[8px] px-2 outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

export function OpenFullChatButton({ chat, compact = false }: { chat: HomeProjectChatController; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={chat.onOpenFullChat}
      disabled={!chat.canOpenFullChat}
      className={`${ICON_BUTTON} shrink-0 luxia-type-caption font-bold disabled:cursor-not-allowed disabled:opacity-50`}
      style={{ color: "var(--luxia-purple-60)" }}
      aria-label={chat.chatLabel ? `Open full chat: ${chat.chatLabel}` : "Open full chat"}
      title="Open in the full Chat"
      data-home-open-full-chat=""
    >
      {compact ? null : <span>Open full chat</span>}
      <ArrowUpRight size={15} aria-hidden />
    </button>
  );
}

/** Compact searchable knowledge selector in the Hero's context row ("Constellation:" / "Galaxy:"). */
export function HomeKnowledgeSelect({ chat, segmentClass, style }: { chat: HomeProjectChatController; segmentClass: string; style: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const k = chat.knowledge;
  const galaxy = k?.kind === "galaxy";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={segmentClass}
          style={style}
          aria-label={k ? `${galaxy ? "Galaxy" : "Constellation"}: ${k.label}${k.source ? ` (${k.source})` : ""}. Change knowledge` : "Constellation: not chosen. Choose a Constellation or Galaxy"}
          title={k ? k.label : undefined}
          data-home-ask-knowledge=""
          data-knowledge-kind={k?.kind ?? "none"}
        >
          <span aria-hidden className="flex shrink-0" style={{ color: "var(--luxia-purple-60)" }}>
            {galaxy ? <LuxiaGalaxyIcon size={14} color="currentColor" /> : <LuxiaConstellationIcon size={14} color="currentColor" />}
          </span>
          <span className="shrink-0 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{galaxy ? "Galaxy:" : "Constellation:"}</span>
          <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ maxWidth: 220 }}>{k ? k.label : "Choose…"}</span>
          {k?.source ? <span className="shrink-0 text-[10px] font-semibold tracking-[0.04em]" style={{ color: "var(--luxia-text-muted)" }}>{k.source}</span> : null}
          <ChevronDown size={14} aria-hidden className="shrink-0" style={{ color: "var(--luxia-purple-60)" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="luxia-knowledge-menu p-1"
        // Wider than the trigger on narrow screens (the shared menu class defaults to trigger width).
        style={{ width: "min(320px, calc(100vw - 24px))", maxWidth: "min(320px, calc(100vw - 24px))" }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const menu = event.currentTarget as HTMLElement | null;
          window.requestAnimationFrame(() => menu?.querySelector<HTMLInputElement>("[data-luxia-knowledge-search]")?.focus());
        }}
        data-home-ask-knowledge-menu=""
      >
        <KnowledgeOptionsMenu
          variant="compact"
          options={chat.options}
          value={k?.id ?? null}
          onSelect={(option) => { setOpen(false); chat.onSelectKnowledge(option); }}
          onDismiss={() => setOpen(false)}
          hasMessages={chat.messageCount > 0}
          chatLabel={chat.chatLabel ?? ""}
        />
      </PopoverContent>
    </Popover>
  );
}

/** The inline conversation above the Hero input (shown once there is something to show). */
export function HomeProjectConversation({ chat }: { chat: HomeProjectChatController }) {
  const logRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && stick.current) log.scrollTop = log.scrollHeight;
  });
  const k = chat.knowledge;
  // Collapse is Home-only view state per chat (never Close or Delete); it survives re-renders.
  const [collapsedByChat, setCollapsedByChat] = useState<Record<string, boolean>>({});
  const viewKey = chat.chatId ?? `new:${chat.projectId}`;
  const collapsed = Boolean(collapsedByChat[viewKey]);
  const setCollapsed = (value: boolean) => setCollapsedByChat((p) => ({ ...p, [viewKey]: value }));
  // Inline rename (shared handler in App; it validates and returns an error message).
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const startEditing = () => {
    setDraftName(chat.chatLabel ?? "");
    setRenameError(null);
    setEditing(true);
    window.requestAnimationFrame(() => { renameRef.current?.focus(); renameRef.current?.select(); });
  };
  const stopEditing = () => {
    setEditing(false);
    setRenameError(null);
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-home-project-rename]")?.focus());
  };
  /** Invalid names keep the editor open with the error (Escape cancels). */
  const commitRename = () => {
    const error = chat.onRename(draftName);
    if (error) { setRenameError(error); return; }
    stopEditing();
  };
  return (
    <div className="mb-2 min-w-0 border-b pb-2" style={{ borderColor: "var(--luxia-border-default)" }} data-home-project-conversation="">
      <div className="flex min-w-0 items-center gap-1.5 px-1 pb-1">
        <span aria-hidden className="flex shrink-0" style={{ color: "var(--luxia-purple-60)" }}>
          {k?.kind === "galaxy" ? <LuxiaGalaxyIcon size={15} color="currentColor" /> : <LuxiaConstellationIcon size={15} color="currentColor" />}
        </span>
        {editing ? (
          <input
            ref={renameRef}
            value={draftName}
            maxLength={80}
            onChange={(e) => { setDraftName(e.target.value); setRenameError(null); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitRename(); }
              if (e.key === "Escape") { e.preventDefault(); stopEditing(); }
            }}
            onBlur={() => { if (!renameError) commitRename(); }}
            aria-label="Chat name"
            aria-invalid={renameError ? true : undefined}
            aria-describedby={renameError ? "home-rename-error" : undefined}
            className="min-w-0 flex-1 rounded-[6px] border bg-white px-1.5 py-0.5 luxia-type-body-dense-strong outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            style={{ color: "var(--luxia-purple-70)", borderColor: renameError ? "var(--luxia-error)" : "var(--luxia-border-default)" }}
            data-home-project-rename-input=""
          />
        ) : (
          <span className="flex min-w-0 items-center gap-0.5">
            <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }} title={`${chat.chatLabel ?? "New chat"} · ${chat.projectName}`} data-home-project-title="">
              {chat.chatLabel ?? "New chat"}
              <span className="font-normal" style={{ color: "var(--luxia-text-muted)" }}> · {chat.projectName}</span>
            </span>
            {chat.canRename && chat.chatLabel ? (
              <button
                type="button"
                onClick={startEditing}
                aria-label={`Rename chat ${chat.chatLabel}`}
                title="Rename chat"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                style={{ color: "var(--luxia-text-muted)" }}
                data-home-project-rename=""
              >
                <Pencil size={13} aria-hidden />
              </button>
            ) : null}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={chat.onOpenFullChat}
            disabled={!chat.canOpenFullChat}
            aria-label="Open full chat"
            title={chat.chatLabel ? `Open "${chat.chatLabel}" in the full Chat` : "Open in the full Chat"}
            // Text + icon; icon-only (same accessible name) when the Hero is narrow.
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[13px] font-semibold leading-none outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] disabled:opacity-50 @max-[519px]:w-8 @max-[519px]:justify-center @max-[519px]:px-0"
            style={{ color: "var(--luxia-purple-60)" }}
            data-home-open-full-chat=""
          >
            <span className="@max-[519px]:hidden">Open full chat</span>
            <ArrowUpRight size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={chat.onStartNew}
            disabled={!chat.canStartNew}
            aria-label={`Start a new conversation in ${chat.projectName}. ${chat.chatLabel ? `"${chat.chatLabel}" is kept` : "Nothing is deleted"}`}
            title="Start a new conversation"
            className={`${HEADER_ICON_BUTTON} disabled:cursor-not-allowed disabled:opacity-40`}
            style={{ color: "var(--luxia-purple-60)" }}
            data-home-project-new=""
          >
            <RotateCcw size={15} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-controls="home-project-log"
            aria-label={collapsed ? "Show the conversation" : "Collapse the conversation"}
            title={collapsed ? "Show chat" : "Collapse chat"}
            className={HEADER_ICON_BUTTON}
            style={{ color: "var(--luxia-purple-60)" }}
            data-home-project-collapse=""
          >
            {collapsed ? <ChevronDown size={16} aria-hidden /> : <ChevronUp size={16} aria-hidden />}
          </button>
        </span>
      </div>
      {renameError ? (
        <p id="home-rename-error" role="alert" className="px-1 pb-1 luxia-type-caption" style={{ color: "var(--luxia-error)" }}>{renameError}</p>
      ) : null}
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex w-full min-w-0 items-center gap-2 rounded-[10px] px-2 py-1.5 text-left luxia-type-caption outline-none hover:bg-[var(--luxia-opacity-brand-secondary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: "var(--luxia-text-secondary)" }}
          data-home-project-collapsed-summary=""
        >
          <span className="min-w-0 flex-1 truncate">
            {`${chat.messageCount} ${chat.messageCount === 1 ? "message" : "messages"}`}
            {chat.lastMessagePreview ? ` · ${chat.lastMessagePreview}` : ""}
          </span>
          <span className="shrink-0 font-bold" style={{ color: "var(--luxia-purple-60)" }}>Show</span>
        </button>
      ) : null}
      <div
        id="home-project-log"
        hidden={collapsed}
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label={`Project chat${chat.chatLabel ? ` ${chat.chatLabel}` : ""} in ${chat.projectName}`}
        onScroll={(event) => {
          const log = event.currentTarget;
          stick.current = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
        }}
        className="luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain px-1 max-h-[min(420px,55vh)]"
        data-home-project-log=""
      >
        {chat.renderMessages()}
        {chat.notice ? <KnowledgeChangeNotice notice={chat.notice} /> : null}
      </div>
    </div>
  );
}
