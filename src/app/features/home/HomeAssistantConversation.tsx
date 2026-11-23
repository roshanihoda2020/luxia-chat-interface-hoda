import { useEffect, useLayoutEffect, useRef, type ReactElement, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, ChevronUp, FoldVertical, SquarePen, UnfoldVertical } from "lucide-react";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { LuxiaAiIcon, LuxiaArrowRightIcon } from "@/assets/icons";
import {
  LUXIA_ASSISTANT_ACTION_LABELS,
  LUXIA_ASSISTANT_CONFIG,
  type LuxiaAssistantActionId,
  type LuxiaAssistantMessage,
} from "./luxiaAssistant";

export type HomeAssistantView = "open" | "expanded" | "collapsed";

const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";
/** Shared with the Home Project Chat header so both conversations use identical controls. */
export const ICON_BUTTON = `inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--luxia-opacity-brand-secondary-08)] ${FOCUS_RING}`;

/**
 * Ask Luxia conversation toolbar: one treatment for the labelled New chat and the icon actions.
 * Compact 32px controls on desktop (8px radius, neutral border, no fill); 40px touch targets when the
 * header is phone-width or the pointer is coarse. Brand tint only on hover, press and focus.
 */
const TOUCH_SIZE = "@max-[440px]/askluxia:h-10 [@media(pointer:coarse)]:h-10";
const TOOLBAR_BUTTON = [
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[var(--luxia-radius-8)] border",
  TOUCH_SIZE,
  "border-[var(--luxia-border-default)] bg-transparent text-[var(--luxia-text-secondary)] transition-colors",
  "hover:border-[var(--luxia-opacity-brand-secondary-24)] hover:bg-[var(--luxia-opacity-brand-secondary-04)] hover:text-[var(--luxia-purple-70)]",
  "active:bg-[var(--luxia-opacity-brand-secondary-08)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
  FOCUS_RING,
].join(" ");
const TOOLBAR_ICON_BUTTON = `${TOOLBAR_BUTTON} w-8 @max-[440px]/askluxia:w-10 [@media(pointer:coarse)]:w-10`;
const TOOLBAR_ICON = 16;

/** Describes a toolbar action on hover and on keyboard focus. */
function ToolbarTip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

interface HomeAssistantConversationProps {
  messages: readonly LuxiaAssistantMessage[];
  pending: boolean;
  view: HomeAssistantView;
  onViewChange: (view: HomeAssistantView) => void;
  onClear: () => void;
  onFollowUp: (question: string) => void;
  canRun: (action: LuxiaAssistantActionId) => boolean;
  onRun: (action: LuxiaAssistantActionId) => void;
  /** Opens this saved conversation in the Luxia AI workspace. */
  onOpenWorkspace?: () => void;
}

/** The Luxia AI conversation inside the Hero: scrolls on its own, collapses without losing messages. */
export function HomeAssistantConversation({
  messages,
  pending,
  view,
  onViewChange,
  onClear,
  onFollowUp,
  canRun,
  onRun,
  onOpenWorkspace,
}: HomeAssistantConversationProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const count = messages.length;

  useLayoutEffect(() => {
    const log = logRef.current;
    if (!log || !stickToBottom.current) return;
    log.scrollTop = log.scrollHeight;
  }, [count, pending, view]);

  useEffect(() => {
    stickToBottom.current = true;
    if (view !== "expanded") return;
    // Expanded: keep the input reachable so the user can continue chatting right away.
    const frame = window.requestAnimationFrame(() => {
      logRef.current?.closest<HTMLElement>("[data-home-ask-composer]")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  const last = messages[messages.length - 1];

  return (
    <div className="mb-2 min-w-0 border-b pb-2" style={{ borderColor: "var(--luxia-border-default)" }} data-home-ai-conversation={view}>
      {/* Narrow panels (phones): the actions wrap to a second, right-aligned row instead of crowding the name. */}
      {/* Header is a size container: on phone-width panels New chat becomes icon-only so the four actions keep one compact row. */}
      <div className="@container/askluxia flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 px-1 pb-1" data-home-ai-header="">
        {/* The one assistant identity mark in this panel: answers below carry no repeated avatar. */}
        <span className="flex min-w-0 items-center gap-1.5" data-home-ai-identity="">
          <span aria-hidden className="flex shrink-0" style={{ color: "var(--luxia-purple-60)" }}><LuxiaAiIcon size={15} color="currentColor" /></span>
          <span className="whitespace-nowrap luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{LUXIA_ASSISTANT_CONFIG.displayName}</span>
        </span>
        <span
          className="inline-flex h-5 items-center rounded-full px-1.5 text-[11px] font-bold leading-none"
          style={{ background: "var(--luxia-opacity-brand-secondary-08)", color: "var(--luxia-text-secondary)" }}
          title={LUXIA_ASSISTANT_CONFIG.disclosure}
          data-home-ai-demo=""
        >
          Demo
        </span>
        <span className="sr-only">{LUXIA_ASSISTANT_CONFIG.disclosure}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1 @max-[440px]/askluxia:gap-1.5" data-home-ai-toolbar="">
          {/* The one way to start over from this panel: labelled, not icon-only. The current conversation stays saved. */}
          <ToolbarTip label="Start a new conversation. This one stays saved.">
            <button
              type="button"
              onClick={onClear}
              aria-label={`New chat: start a new ${LUXIA_ASSISTANT_CONFIG.displayName} conversation. The current one stays saved.`}
              className={`${TOOLBAR_BUTTON} px-2.5 luxia-type-label-small @max-[440px]/askluxia:w-10 @max-[440px]/askluxia:px-0`}
              data-home-ai-clear=""
            >
              <SquarePen size={TOOLBAR_ICON} aria-hidden />
              <span className="@max-[440px]/askluxia:hidden" data-home-ai-clear-label="">New chat</span>
            </button>
          </ToolbarTip>
          {view !== "collapsed" ? (
            <ToolbarTip label={view === "expanded" ? "Restore the chat to its normal size" : "Expand the chat here on Home"}>
              <button
                type="button"
                onClick={() => onViewChange(view === "expanded" ? "open" : "expanded")}
                aria-label={view === "expanded" ? "Restore the conversation to its normal size" : "Expand the conversation"}
                className={TOOLBAR_ICON_BUTTON}
                data-home-ai-expand=""
              >
                {/* Height only, in place: vertical fold arrows, distinct from "open elsewhere" (arrow up-right). */}
                {view === "expanded" ? <FoldVertical size={TOOLBAR_ICON} aria-hidden /> : <UnfoldVertical size={TOOLBAR_ICON} aria-hidden />}
              </button>
            </ToolbarTip>
          ) : null}
          {onOpenWorkspace ? (
            <ToolbarTip label="Open in the Ask Luxia workspace, with all your conversations">
              <button
                type="button"
                onClick={onOpenWorkspace}
                aria-label="Open this conversation in the Ask Luxia workspace"
                className={TOOLBAR_ICON_BUTTON}
                data-home-ai-open-workspace=""
              >
                <ArrowUpRight size={TOOLBAR_ICON} aria-hidden />
              </button>
            </ToolbarTip>
          ) : null}
          <ToolbarTip label={view === "collapsed" ? "Show the conversation" : "Collapse the chat. Messages are kept."}>
            <button
              type="button"
              onClick={() => onViewChange(view === "collapsed" ? "open" : "collapsed")}
              aria-expanded={view !== "collapsed"}
              aria-controls="home-ai-log"
              aria-label={view === "collapsed" ? "Show the conversation" : "Collapse the conversation"}
              className={TOOLBAR_ICON_BUTTON}
              data-home-ai-collapse=""
            >
              {view === "collapsed" ? <ChevronDown size={TOOLBAR_ICON} aria-hidden /> : <ChevronUp size={TOOLBAR_ICON} aria-hidden />}
            </button>
          </ToolbarTip>
        </span>
      </div>

      {view === "collapsed" ? (
        <button
          type="button"
          onClick={() => onViewChange("open")}
          className={`flex w-full min-w-0 items-center gap-2 rounded-[10px] px-2 py-1.5 text-left luxia-type-caption hover:bg-[var(--luxia-opacity-brand-secondary-04)] ${FOCUS_RING}`}
          style={{ color: "var(--luxia-text-secondary)" }}
          data-home-ai-collapsed-summary=""
        >
          <span className="min-w-0 flex-1 truncate">
            {`${count} ${count === 1 ? "message" : "messages"}`}
            {last ? ` · ${last.role === "user" ? "You" : LUXIA_ASSISTANT_CONFIG.displayName}: ${last.text}` : ""}
          </span>
          <span className="shrink-0 font-bold" style={{ color: "var(--luxia-purple-60)" }}>Show</span>
        </button>
      ) : null}

      <div
        id="home-ai-log"
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${LUXIA_ASSISTANT_CONFIG.displayName}`}
        hidden={view === "collapsed"}
        onScroll={(event) => {
          const log = event.currentTarget;
          stickToBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
        }}
        className={`luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical min-w-0 overflow-y-auto overscroll-contain px-1 ${view === "expanded" ? "max-h-[min(560px,62vh)]" : "max-h-[min(280px,42vh)]"}`}
        data-home-ai-log=""
      >
        <LuxiaAiMessageList messages={messages} pending={pending} onFollowUp={onFollowUp} canRun={canRun} onRun={onRun} showAvatar={false} />
      </div>
    </div>
  );
}

/**
 * Luxia AI messages, the "answering" line and the suggested follow-ups. Shared by the Home box and the
 * Luxia AI workspace so both show one conversation the same way.
 */
export function LuxiaAiMessageList({
  messages,
  pending,
  onFollowUp,
  canRun,
  onRun,
  showAvatar = true,
  renderAnswerFooter,
}: {
  messages: readonly LuxiaAssistantMessage[];
  pending: boolean;
  onFollowUp: (question: string) => void;
  canRun: (action: LuxiaAssistantActionId) => boolean;
  onRun: (action: LuxiaAssistantActionId) => void;
  /**
   * The star beside each answer. Home turns it off: its panel header already names the assistant, the
   * answer bubble's side and surface tell it apart from the person's, and screen readers hear the name.
   */
  showAvatar?: boolean;
  /** Optional actions under one answer (the Ask Luxia workspace adds "Open in Writing Assistant"). Home passes none. */
  renderAnswerFooter?: (message: LuxiaAssistantMessage) => ReactNode;
}) {
  const last = messages[messages.length - 1];
  const lastAnswer = last?.role === "assistant" ? last : null;
  return (
    <>
      <ol className="flex min-w-0 flex-col gap-3 py-1">
        {messages.map((message) => (
          <li
            key={message.id}
            className={`flex min-w-0 ${message.role === "user" ? "justify-end" : "justify-start gap-2"}`}
            data-home-ai-message={message.role}
          >
            {message.role === "assistant" && showAvatar ? (
              <span aria-hidden className="mt-0.5 flex size-7 shrink-0 items-center justify-center" data-home-ai-avatar="">
                <LuxiaStarLogo size={18} />
              </span>
            ) : null}
            <div
              className={`min-w-0 max-w-[min(100%,620px)] whitespace-pre-wrap break-words rounded-[14px] px-3.5 py-2.5 luxia-type-body-dense ${message.role === "user" ? "rounded-br-[6px]" : "rounded-tl-[6px]"}`}
              style={message.role === "user"
                ? { background: "var(--luxia-opacity-brand-secondary-12)", color: "var(--luxia-text-primary)" }
                : { background: "var(--luxia-neutral-50, var(--luxia-surface))", color: "var(--luxia-text-primary)", border: "1px solid var(--luxia-border-default)" }}
            >
              <span className="sr-only">{message.role === "user" ? "You: " : `${LUXIA_ASSISTANT_CONFIG.displayName}: `}</span>
              {message.text}
              {message.role === "assistant" && message.actions?.some(canRun) ? (
                <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {message.actions.filter(canRun).map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => onRun(action)}
                      className={`group/cue inline-flex min-h-7 items-center gap-1 rounded-[6px] px-0.5 luxia-type-label-small hover:underline ${FOCUS_RING}`}
                      style={{ color: "var(--luxia-purple-60)" }}
                      data-home-ai-action={action}
                    >
                      {LUXIA_ASSISTANT_ACTION_LABELS[action]}
                      <LuxiaArrowRightIcon size={12} color="currentColor" aria-hidden />
                    </button>
                  ))}
                </span>
              ) : null}
              {message.role === "assistant" && renderAnswerFooter ? renderAnswerFooter(message) : null}
            </div>
          </li>
        ))}
        {pending ? (
          <li className="flex min-w-0 justify-start gap-2" data-home-ai-pending="">
            {showAvatar ? (
              <span aria-hidden className="mt-0.5 flex size-7 shrink-0 items-center justify-center" data-home-ai-avatar="">
                <LuxiaStarLogo size={18} />
              </span>
            ) : null}
            <span className="rounded-[14px] px-3.5 py-2.5 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
              {`${LUXIA_ASSISTANT_CONFIG.displayName} is answering…`}
            </span>
          </li>
        ) : null}
      </ol>
      {lastAnswer?.followUps?.length && !pending ? (
        <div className={`flex flex-wrap gap-1.5 pb-1 pt-1 ${showAvatar ? "pl-9" : ""}`} aria-label="Suggested questions" role="group" data-home-ai-followups="">
          {lastAnswer.followUps.slice(0, 2).map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onFollowUp(question)}
              className={`inline-flex min-h-8 items-center rounded-full border px-3 luxia-type-caption font-semibold transition-colors hover:bg-[var(--luxia-opacity-brand-secondary-08)] ${FOCUS_RING}`}
              style={{ borderColor: "var(--luxia-opacity-brand-secondary-24)", color: "var(--luxia-purple-70)" }}
              data-home-ai-followup=""
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
