import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, MoreHorizontal, Pencil, Search, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { LuxiaBreadcrumb, type LuxiaBreadcrumbItem } from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageBody, LuxiaPageFrame } from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { LuxiaDialog } from "@/app/app-sections/ChatDialogs";
import { ChatSendButton } from "@/app/features/shared/ChatSendButton";
import { HS } from "@/app/features/home/homeSurfaces";
import { LuxiaAiMessageList } from "@/app/features/home/HomeAssistantConversation";
import { formatHomeChatActivity } from "@/app/features/home/homeBuilder/chatActivity";
import {
  LUXIA_ASSISTANT_CONFIG,
  type LuxiaAssistantAbilities,
  type LuxiaAssistantActionId,
} from "@/app/features/home/luxiaAssistant";
import { LUXIA_TOOLS } from "@/app/features/tools/data";
import { LuxiaToolIcon } from "@/app/features/tools/ToolIcon";
import { LuxiaAiIcon } from "@/assets/icons";
import { FileText } from "lucide-react";
// Same Chat Tool pieces as Project Chat: the "@" Tools menu and the answer's Writing Assistant action.
import { useComposerToolMenu, type ComposerTool } from "@/app/app-sections/ChatComposerSection";
import { ResponseActionButton } from "@/app/features/chat/ResponseActionsFooter";
import { isEligibleWritingAssistantContent } from "@/app/features/writing-assistant/chatHandoff";
import {
  askLuxiaAi,
  deleteLuxiaAiConversation,
  lastLuxiaAiMessagePreview,
  matchesLuxiaAiConversation,
  renameLuxiaAiConversation,
  useLuxiaAiConversations,
  type LuxiaAiConversation,
} from "./conversationStore";

const INK = "var(--luxia-purple-70)";
const ACCENT = "var(--luxia-purple-60)";
const BORDER = "var(--luxia-border-default)";
const SOFT_BORDER = "var(--luxia-opacity-brand-secondary-24)";
const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";
const ICON_BUTTON = `inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--luxia-opacity-brand-secondary-08)] ${FOCUS_RING}`;
const PANEL = "min-w-0 rounded-[16px] border bg-[var(--luxia-surface)]";

export interface LuxiaAiWorkspacePageProps {
  userId: string;
  /** The conversation in the URL (`/luxia-ai/:id`); null = a new conversation. */
  conversationId: string | null;
  abilities: LuxiaAssistantAbilities;
  /** Real destinations an answer may open; only those this user can use are given. */
  actions: Partial<Record<LuxiaAssistantActionId, () => void>>;
  onOpenConversation: (conversationId: string | null, options?: { replace?: boolean }) => void;
  onNavigateHome: () => void;
  onOpenAllConversations: () => void;
  /** Opens a Tool in its own workspace. */
  onOpenTool: (toolId: string) => void;
  onOpenTools: () => void;
  /**
   * Tools offered on "@" — the same list and menu as Project Chat. Given only when this user may use
   * them (App applies the Tool's existing access rule); omitted = no menu.
   */
  composerTools?: ComposerTool[];
  /** A Tool chosen from the "@" menu (or typed "@verifai" and sent), as in Project Chat. */
  onSelectComposerTool?: (toolId: string) => void;
  /** Project Chat's "Open in Writing Assistant" for one answer (existing Chat → Writing Assistant handoff). */
  onOpenInWritingAssistant?: (content: string) => void;
}

function activityLabel(conversation: LuxiaAiConversation): string {
  return formatHomeChatActivity(conversation.updatedAt, undefined)?.short ?? "";
}

/**
 * Luxia AI workspace: the standalone assistant's own place. Its conversation history (new, search,
 * open, rename, delete), one conversation at a time, and links to the Tools it can point you to.
 * No Project, Galaxy or Constellation context: Luxia AI never answers from Project knowledge, and Tools
 * open in their own workspaces (they don't run inside a conversation).
 */
export function LuxiaAiWorkspacePage({
  userId,
  conversationId,
  abilities,
  actions,
  onOpenConversation,
  onNavigateHome,
  onOpenAllConversations,
  onOpenTool,
  onOpenTools,
  composerTools,
  onSelectComposerTool,
  onOpenInWritingAssistant,
}: LuxiaAiWorkspacePageProps) {
  const { conversations, pendingIds } = useLuxiaAiConversations(userId);
  const active = conversationId ? conversations.find((entry) => entry.id === conversationId) ?? null : null;
  const missing = Boolean(conversationId && !active);
  const pending = Boolean(active && pendingIds.has(active.id));
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState<LuxiaAiConversation | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<LuxiaAiConversation | null>(null);
  // Phones and small tablets show one pane at a time: the history list, or the open conversation.
  const [narrowPane, setNarrowPane] = useState<"list" | "conversation">(conversationId ? "conversation" : "list");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const toolMenu = useComposerToolMenu({ value: draft, onChange: setDraft, tools: composerTools, onSelectTool: onSelectComposerTool, inputRef });

  const visible = useMemo(
    () => conversations.filter((conversation) => matchesLuxiaAiConversation(conversation, query)),
    [conversations, query],
  );

  useEffect(() => {
    if (conversationId) setNarrowPane("conversation");
  }, [conversationId]);

  useLayoutEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [active?.id, active?.messages.length, pending]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 168)}px`;
  }, [draft]);

  function canRun(action: LuxiaAssistantActionId) {
    return Boolean(actions[action]);
  }

  function run(action: LuxiaAssistantActionId) {
    actions[action]?.();
  }

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    const id = askLuxiaAi(userId, active?.id ?? null, trimmed, abilities);
    setDraft("");
    if (id && id !== active?.id) onOpenConversation(id, { replace: true });
    inputRef.current?.focus();
  }

  /** Send. As in Project Chat, a message starting with a Tool's "@" trigger opens that Tool instead. */
  function submitComposer() {
    const typedTool = composerTools?.find((tool) => new RegExp(`^${tool.trigger}\\b`, "i").test(draft.trim()));
    if (typedTool && onSelectComposerTool) {
      setDraft(draft.trim().replace(new RegExp(`^${typedTool.trigger}\\b\\s*`, "i"), ""));
      onSelectComposerTool(typedTool.id);
      return;
    }
    ask(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (toolMenu.handleMenuKeyDown(event)) return;
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submitComposer();
    }
  }

  function startNew() {
    setDraft("");
    setNarrowPane("conversation");
    onOpenConversation(null);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function openConversation(id: string) {
    setNarrowPane("conversation");
    if (id !== conversationId) onOpenConversation(id);
  }

  function requestRename(conversation: LuxiaAiConversation) {
    setRenaming(conversation);
    setRenameValue(conversation.title);
  }

  function confirmRename() {
    if (!renaming || !renameValue.trim()) return;
    renameLuxiaAiConversation(userId, renaming.id, renameValue);
    setRenaming(null);
    toast("Conversation renamed", { id: "luxia-ai-renamed" });
  }

  function confirmDelete() {
    if (!deleting) return;
    const wasOpen = deleting.id === conversationId;
    deleteLuxiaAiConversation(userId, deleting.id);
    setDeleting(null);
    toast("Conversation deleted", { id: "luxia-ai-deleted" });
    if (wasOpen) onOpenConversation(null, { replace: true });
  }

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    { id: "luxia-ai", label: LUXIA_ASSISTANT_CONFIG.displayName, destination: { kind: "current" } },
  ];

  const historyPane = (
    <section
      aria-labelledby="luxia-ai-history-title"
      className={`${PANEL} flex min-h-0 flex-col p-3 [grid-area:list] ${narrowPane === "list" ? "" : "max-lg:hidden"}`}
      style={{ borderColor: BORDER }}
      data-luxia-ai-history=""
    >
      <div className="flex min-w-0 items-center justify-between gap-2 px-1 pb-2">
        <h2 id="luxia-ai-history-title" className="luxia-type-body-dense-strong" style={{ color: INK }}>
          Conversations
        </h2>
        <Button type="button" variant="primary" size="compact" onClick={startNew} data-luxia-ai-new="">
          <SquarePen size={14} aria-hidden />
          New conversation
        </Button>
      </div>
      <label className="relative mb-2 block">
        <span className="sr-only">Search Ask Luxia conversations</span>
        <Search size={15} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--luxia-text-muted)" }} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search conversations"
          className={`h-10 w-full rounded-[10px] border bg-transparent pl-9 pr-3 luxia-type-body-dense ${FOCUS_RING}`}
          style={{ borderColor: BORDER, color: "var(--luxia-text-primary)" }}
          data-luxia-ai-search=""
        />
      </label>
      {conversations.length === 0 ? (
        <p className="px-1 py-3 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }} data-luxia-ai-history-empty="">
          No conversations yet. Your questions to {LUXIA_ASSISTANT_CONFIG.displayName}, here or on Home, are saved here.
        </p>
      ) : visible.length === 0 ? (
        <p role="status" className="px-1 py-3 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          No conversations match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <ul className="luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical -mx-1 min-h-0 flex-1 space-y-1 overflow-y-auto px-1" aria-label="Ask Luxia conversations">
          {visible.map((conversation) => {
            const current = conversation.id === conversationId;
            return (
              <li key={conversation.id} className="group relative min-w-0" data-luxia-ai-conversation={conversation.id}>
                <button
                  type="button"
                  onClick={() => openConversation(conversation.id)}
                  aria-current={current ? "page" : undefined}
                  className={`block w-full min-w-0 rounded-[12px] border py-2 pl-3 pr-10 text-left transition-colors ${current ? "" : "hover:bg-[var(--luxia-opacity-brand-secondary-04)]"} ${FOCUS_RING}`}
                  style={current
                    ? { background: "var(--luxia-opacity-brand-secondary-08)", borderColor: SOFT_BORDER }
                    : { borderColor: "transparent" }}
                >
                  <span className="block truncate luxia-type-body-dense-strong" style={{ color: INK }}>{conversation.title}</span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    <span className="min-w-0 flex-1 truncate">{lastLuxiaAiMessagePreview(conversation)}</span>
                    <span className="shrink-0">{activityLabel(conversation)}</span>
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`More actions for ${conversation.title}`}
                      className={`${ICON_BUTTON} absolute right-1 top-1/2 -translate-y-1/2`}
                      style={{ color: ACCENT }}
                      data-luxia-ai-conversation-menu=""
                    >
                      <MoreHorizontal size={16} aria-hidden />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => requestRename(conversation)} data-luxia-ai-rename="">
                      <Pencil size={14} aria-hidden />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDeleting(conversation)} variant="destructive" data-luxia-ai-delete="">
                      <Trash2 size={14} aria-hidden />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  const toolsPane = (
    <section
      aria-labelledby="luxia-ai-tools-title"
      className={`${PANEL} p-4 [grid-area:tools] ${narrowPane === "list" ? "" : "max-lg:hidden"}`}
      style={{ borderColor: BORDER }}
      data-luxia-ai-tools=""
    >
      <h2 id="luxia-ai-tools-title" className="luxia-type-body-dense-strong" style={{ color: INK }}>Tools</h2>
      <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
        Each tool opens in its own workspace, with its own history. Tools don&rsquo;t run inside Ask Luxia conversations.
      </p>
      <ul className="mt-3 space-y-2">
        {LUXIA_TOOLS.map((tool) => (
          <li key={tool.id} className="flex min-w-0 items-center gap-3 rounded-[12px] border p-2.5" style={{ borderColor: BORDER }} data-luxia-ai-tool={tool.id}>
            <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: "var(--luxia-opacity-brand-secondary-08)", color: ACCENT }}>
              <LuxiaToolIcon toolId={tool.id} size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate luxia-type-body-dense-strong" style={{ color: INK }}>{tool.name}</span>
              <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{tool.description}</span>
            </span>
            <Button type="button" variant="outline" size="compact" onClick={() => onOpenTool(tool.id)} aria-label={`Open ${tool.name}`}>
              Open
            </Button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onOpenTools}
        className={`mt-2 inline-flex min-h-8 items-center rounded-[6px] px-0.5 luxia-type-label-small hover:underline ${FOCUS_RING}`}
        style={{ color: ACCENT }}
        data-luxia-ai-all-tools=""
      >
        See all Tools
      </button>
    </section>
  );

  const conversationPane = (
    <section
      aria-labelledby="luxia-ai-conversation-title"
      className={`${PANEL} flex h-[min(760px,calc(100dvh-200px))] min-h-[440px] flex-col [grid-area:conv] ${narrowPane === "conversation" ? "" : "max-lg:hidden"}`}
      style={{ borderColor: BORDER }}
      data-luxia-ai-conversation-pane={active ? active.id : missing ? "missing" : "new"}
    >
      <div className="flex min-w-0 items-center gap-1.5 border-b px-3 py-2.5 sm:px-4" style={{ borderColor: BORDER }}>
        <button
          type="button"
          onClick={() => setNarrowPane("list")}
          aria-label="Back to conversations"
          className={`${ICON_BUTTON} lg:hidden`}
          style={{ color: ACCENT }}
          data-luxia-ai-back-to-list=""
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
        <span aria-hidden className="flex shrink-0" style={{ color: ACCENT }}><LuxiaAiIcon size={16} color="currentColor" /></span>
        <h2 id="luxia-ai-conversation-title" className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: INK }} title={active?.title}>
          {active ? active.title : missing ? "Conversation not found" : "New conversation"}
        </h2>
        <span
          className="shrink-0 rounded-full px-1.5 text-[11px] font-bold leading-4"
          style={{ background: "var(--luxia-opacity-brand-secondary-08)", color: "var(--luxia-text-secondary)" }}
          title={LUXIA_ASSISTANT_CONFIG.disclosure}
        >
          Demo
        </span>
        {active ? (
          <>
            <button type="button" onClick={() => requestRename(active)} aria-label="Rename this conversation" title="Rename" className={ICON_BUTTON} style={{ color: ACCENT }} data-luxia-ai-rename-open="">
              <Pencil size={15} aria-hidden />
            </button>
            <button type="button" onClick={() => setDeleting(active)} aria-label="Delete this conversation" title="Delete" className={ICON_BUTTON} style={{ color: ACCENT }} data-luxia-ai-delete-open="">
              <Trash2 size={15} aria-hidden />
            </button>
          </>
        ) : null}
      </div>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${LUXIA_ASSISTANT_CONFIG.displayName}`}
        className="luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5"
        data-luxia-ai-log=""
      >
        {missing ? (
          <div className="mx-auto max-w-[460px] py-10 text-center" data-luxia-ai-missing="">
            <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
              This conversation isn&rsquo;t available. It may have been deleted, or it belongs to someone else.
            </p>
            <Button type="button" variant="primary" size="compact" className="mt-4" onClick={startNew}>New conversation</Button>
          </div>
        ) : active ? (
          <LuxiaAiMessageList
            messages={active.messages}
            pending={pending}
            onFollowUp={ask}
            canRun={canRun}
            onRun={run}
            // Project Chat's answer action (same button, icon, label and eligibility rule); only this answer's text.
            renderAnswerFooter={onOpenInWritingAssistant ? (message) => (isEligibleWritingAssistantContent(message.text) ? (
              <span className="-ml-2 mt-1.5 flex" data-luxia-ai-open-wa={message.id}>
                <ResponseActionButton
                  icon={FileText}
                  label="Open in Writing Assistant"
                  showLabel
                  onClick={() => onOpenInWritingAssistant(message.text)}
                />
              </span>
            ) : null) : undefined}
          />
        ) : (
          <div className="mx-auto flex max-w-[520px] flex-col items-center py-8 text-center" data-luxia-ai-intro="">
            <span aria-hidden className="flex size-11 items-center justify-center rounded-full" style={{ background: "var(--luxia-opacity-brand-secondary-12)", color: ACCENT }}>
              <LuxiaAiIcon size={22} color="currentColor" />
            </span>
            <p className="mt-3 luxia-type-heading-h4" style={{ color: INK }}>What would you like to find out?</p>
            <p className="mt-1.5 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
              {LUXIA_ASSISTANT_CONFIG.displayName} helps with using Luxia. It doesn&rsquo;t read your Projects, Constellations or Data Sources: for answers from your documents, use Chat in a Project.
            </p>
            <div role="group" aria-label="Suggested questions" className="mt-4 flex flex-wrap justify-center gap-2">
              {LUXIA_ASSISTANT_CONFIG.suggestedQuestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  className={`inline-flex min-h-8 items-center rounded-[10px] border px-2.5 luxia-type-caption font-medium transition-colors hover:border-[var(--luxia-opacity-brand-secondary-24)] hover:bg-[var(--luxia-opacity-brand-secondary-08)] ${FOCUS_RING}`}
                  style={{ background: "var(--luxia-opacity-brand-secondary-04)", borderColor: "var(--luxia-opacity-brand-secondary-12)", color: INK }}
                  data-luxia-ai-starter=""
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {missing ? null : (
        <div className="border-t px-3 pb-3 pt-2.5 sm:px-4" style={{ borderColor: BORDER }}>
          <div
            className="flex min-w-0 items-end gap-2 rounded-[16px] border px-3 py-2 focus-within:shadow-[0_0_0_3px_var(--luxia-opacity-brand-secondary-16)]"
            style={{ borderColor: SOFT_BORDER }}
            data-luxia-ai-composer=""
          >
            <label htmlFor="luxia-ai-input" className="sr-only">Your question for {LUXIA_ASSISTANT_CONFIG.displayName}</label>
            <textarea
              id="luxia-ai-input"
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={`${LUXIA_ASSISTANT_CONFIG.displayName} about using Luxia…`}
              className="block min-h-[38px] w-full min-w-0 resize-none bg-transparent px-1 py-1.5 text-[16px] leading-[24px] outline-none placeholder:text-[var(--luxia-text-muted)]"
              style={{ color: "var(--luxia-text-primary)" }}
              data-luxia-ai-input=""
              {...toolMenu.inputAria}
            />
            {toolMenu.menu}
            <ChatSendButton
              canSend={Boolean(draft.trim()) && !pending}
              onClick={submitComposer}
              aria-label={LUXIA_ASSISTANT_CONFIG.displayName}
              className="h-10 w-10 shrink-0"
            />
          </div>
          <p className="mt-1.5 px-1 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            {LUXIA_ASSISTANT_CONFIG.disclosure}
          </p>
        </div>
      )}
    </section>
  );

  return (
    <LuxiaPageFrame variant="standard">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="ASSISTANT"
        title={LUXIA_ASSISTANT_CONFIG.displayName}
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={<LuxiaBreadcrumb tone="page" items={breadcrumbItems} handlers={{ onHome: onNavigateHome }} />}
        guide="Your Ask Luxia conversations, and the Tools it can point you to. Ask Luxia is separate from Project Chats and never answers from Project knowledge."
        guideIcon={false}
        actions={(
          <Button type="button" variant="outline" size="compact" onClick={onOpenAllConversations} data-luxia-ai-all-conversations="">
            All conversations
          </Button>
        )}
      />
      <LuxiaPageBody>
        <div
          className="grid min-w-0 gap-4 [grid-template-areas:'list'_'tools'_'conv'] lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:[grid-template-areas:'list_conv'_'tools_conv'] lg:grid-rows-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(240px,290px)_minmax(0,1fr)_minmax(240px,280px)] xl:grid-rows-1 xl:[grid-template-areas:'list_conv_tools']"
          data-luxia-ai-workspace=""
        >
          {historyPane}
          {conversationPane}
          {toolsPane}
        </div>
      </LuxiaPageBody>

      <LuxiaDialog
        open={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        size="compact"
        title="Rename conversation"
        footer={<>
          <Button type="button" variant="secondary" onClick={() => setRenaming(null)}>Cancel</Button>
          <Button type="button" variant="primary" onClick={confirmRename} disabled={!renameValue.trim()} data-luxia-ai-rename-confirm="">Rename</Button>
        </>}
      >
        <label className="block py-4">
          <span className="mb-1.5 block luxia-type-body-dense-strong" style={{ color: INK }}>Name</span>
          <input
            value={renameValue}
            maxLength={120}
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); confirmRename(); } }}
            className={`h-10 w-full rounded-[10px] border px-3 luxia-type-body-dense ${FOCUS_RING}`}
            style={{ borderColor: BORDER, color: "var(--luxia-text-primary)" }}
            data-luxia-ai-rename-input=""
          />
        </label>
      </LuxiaDialog>

      <LuxiaDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="compact"
        role="alertdialog"
        title="Delete this conversation?"
        footer={<>
          <Button type="button" variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={confirmDelete} data-luxia-ai-delete-confirm="">Delete</Button>
        </>}
      >
        <p className="py-4 luxia-type-body-small" style={{ color: "var(--luxia-text-secondary)" }}>
          &ldquo;{deleting?.title}&rdquo; will be removed from your Ask Luxia conversations. This can&rsquo;t be undone.
        </p>
      </LuxiaDialog>
    </LuxiaPageFrame>
  );
}
