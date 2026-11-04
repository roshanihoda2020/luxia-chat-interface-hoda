import type { ReactNode } from "react";
import { Clock3, Pin, Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon, LuxiaChatIcon, LuxiaProjectsIcon } from "@/assets/icons";
import type { HomeChatActivity } from "./chatActivity";
import {
  CollectionHomeTile,
  useFittingCount,
  type HomeCollectionDensity,
  type HomeCollectionEmptyState,
} from "./CollectionHomeTile";
import {
  HOME_TILE_CORNER_CLEARANCE,
  HT,
  HomeTileSurface,
  HomeTileTitleAction,
} from "./HomeTileSurface";
import {
  CardArrow,
  HOME_TILE_PANEL_BUTTON,
  HOME_TILE_ROW,
  KnowledgeGlyph,
  OpenCue,
  knowledgeKindOf,
} from "./homeTileVisuals";

/**
 * Chat Home Tiles: one specific Chat (Small / Medium) and the Chats collection
 * (Small / Medium / Large / Full width). Every value comes from the Chat's
 * real record — name, Project, Constellation (name, type, description), last
 * opened time and pin state. Message previews are not shown: Chat records on
 * Home carry none.
 */
export interface HomeChatTileItem {
  id: string;
  title: string;
  projectName?: string;
  constellationName?: string;
  /** Constellation type label ("Database", "CSV", "PDF"). */
  constellationType?: string;
  /** The Constellation's own description (Specific Chat, Medium). */
  description?: string;
  activity?: HomeChatActivity;
  pinned?: boolean;
  /** Accessible name of the open action (e.g. "Continue Chat Chat name 01"). */
  openLabel: string;
  onOpen: () => void;
}

const chatIcon = (size: number) => <LuxiaChatIcon size={size} color="currentColor" />;
const CORNER = { icon: chatIcon };

function TypeBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="shrink-0 rounded-[6px] px-1.5 py-px luxia-type-caption"
      style={{ color: HT.secondary, background: HT.chipBg, border: `1px solid ${HT.chipBorder}` }}
    >
      {children}
    </span>
  );
}

function ActivityText({ activity, form, className = "" }: { activity: HomeChatActivity; form: "short" | "long"; className?: string }) {
  return (
    <span className={`shrink-0 luxia-type-caption ${className}`} style={{ color: HT.muted }} title={activity.exact ?? activity[form]}>
      {activity[form]}
    </span>
  );
}

// Specific Chat

export interface ChatHomeTileProps {
  density: "small" | "medium";
  chat: HomeChatTileItem;
  openProject?: { ariaLabel: string; onClick: () => void };
}

/**
 * Small — name, Constellation and Project; the whole card continues the Chat.
 * Medium — three areas spread over the card: the Chat (name, Project) at the
 * top, its Constellation context in a panel, activity and actions at the
 * bottom. With little real context the gaps stay as quiet whitespace.
 */
export function ChatHomeTile({ density, chat, openProject }: ChatHomeTileProps) {
  const label = `Chat ${chat.title}`;

  if (density === "small") {
    // The Chat's name leads; its Constellation (type, name) and last opened time anchor the foot.
    return (
      <HomeTileSurface density="small" label={label} corner={CORNER}>
        <div className={HOME_TILE_CORNER_CLEARANCE.small}>
          <HomeTileTitleAction title={chat.title} onOpen={chat.onOpen} ariaLabel={chat.openLabel} stretched size="dense" lines={2} />
          {chat.projectName ? (
            <p className="truncate luxia-type-caption" style={{ color: HT.muted }} title={chat.projectName}>{chat.projectName}</p>
          ) : null}
        </div>
        <div className="mt-auto flex min-w-0 items-center gap-2.5 rounded-[10px] py-1.5 pl-1.5 pr-1" style={{ background: HT.panel }}>
          {chat.constellationType ? <KnowledgeGlyph kind={knowledgeKindOf(chat.constellationType)} size={26} tone="strong" /> : null}
          <span className="min-w-0 flex-1">
            <span className="block truncate luxia-type-body-dense-strong" style={{ color: HT.text, fontSize: 12, lineHeight: "16px" }} title={chat.constellationName}>
              {chat.constellationName ?? "Constellation Chat"}
            </span>
            {chat.activity ? (
              <span className="block truncate luxia-type-caption" style={{ color: HT.muted }} title={chat.activity.exact}>{chat.activity.long}</span>
            ) : null}
          </span>
          <CardArrow />
        </div>
      </HomeTileSurface>
    );
  }

  const hasContext = Boolean(chat.constellationName || chat.projectName);
  const activityLine = chat.activity || chat.pinned ? (
    <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 luxia-type-caption" style={{ color: HT.muted }}>
      {chat.activity ? (
        <span className="inline-flex min-w-0 items-center gap-1.5" title={chat.activity.exact}>
          <Clock3 size={13} strokeWidth={2} aria-hidden />
          <span className="truncate">{chat.activity.long}</span>
        </span>
      ) : null}
      {chat.pinned ? (
        <span className="inline-flex items-center gap-1">
          <Pin size={12} strokeWidth={2} aria-hidden />
          Pinned
        </span>
      ) : null}
    </p>
  ) : null;

  return (
    <HomeTileSurface density="medium" label={label} corner={CORNER}>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-4" data-home-chat-layout="medium">
        {/* The Chat itself: name and when it was last opened */}
        <div className={`min-w-0 space-y-1.5 ${HOME_TILE_CORNER_CLEARANCE.medium}`}>
          <HomeTileTitleAction title={chat.title} onOpen={chat.onOpen} ariaLabel={chat.openLabel} lines={2} />
          {activityLine}
        </div>

        {/* Where it lives: the Constellation it answers from, and its Project */}
        {hasContext ? (
          <dl className="min-w-0 rounded-[10px] px-3.5 py-3" style={{ background: HT.panel }} data-home-chat-context="">
            {chat.constellationName ? (
              <div className="min-w-0">
                <dt className="flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate luxia-type-overline-data" style={{ color: HT.muted }}>Constellation</span>
                  {chat.constellationType ? <TypeBadge>{chat.constellationType}</TypeBadge> : null}
                </dt>
                <dd className="mt-1.5 min-w-0">
                  <p className="flex min-w-0 items-center gap-2 luxia-type-body-dense-strong" style={{ color: HT.text }} title={chat.constellationName}>
                    {chat.constellationType ? <KnowledgeGlyph kind={knowledgeKindOf(chat.constellationType)} size={24} /> : null}
                    <span className="min-w-0 truncate">{chat.constellationName}</span>
                  </p>
                  {chat.description ? (
                    <p className="mt-0.5 line-clamp-2 luxia-type-caption" style={{ color: HT.secondary, overflowWrap: "anywhere" }} title={chat.description}>
                      {chat.description}
                    </p>
                  ) : null}
                </dd>
              </div>
            ) : null}
            {chat.projectName ? (
              <div
                className={`min-w-0 ${chat.constellationName ? "mt-2.5 border-t pt-2.5" : ""}`}
                style={{ borderColor: HT.divider }}
              >
                <dt className="truncate luxia-type-overline-data" style={{ color: HT.muted }}>Project</dt>
                <dd className="mt-1 flex min-w-0 items-center gap-1.5 luxia-type-body-dense-strong" style={{ color: HT.text }}>
                  <span className="shrink-0" style={{ color: HT.icon }} aria-hidden>
                    <LuxiaProjectsIcon size={13} color="currentColor" />
                  </span>
                  <span className="min-w-0 truncate" title={chat.projectName}>{chat.projectName}</span>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button type="button" variant="primary" size="compact" onClick={chat.onOpen} aria-label={chat.openLabel}>
            Continue Chat
          </Button>
          {openProject ? (
            <Button type="button" variant="secondary" size="compact" onClick={openProject.onClick} aria-label={openProject.ariaLabel}>
              Open Project
            </Button>
          ) : null}
        </div>
      </div>
    </HomeTileSurface>
  );
}

// Chats collection

/** Most Chats each size offers besides the lead; the tile shows only as many as fit its slot. */
const OFFER: Record<HomeCollectionDensity, number> = { small: 2, medium: 5, large: 6, wide: 6 };

const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

function contextLine(chat: HomeChatTileItem) {
  return [chat.constellationName, chat.projectName].filter(Boolean).join(" · ");
}

function ChatGlyph({ chat, size, tone }: { chat: HomeChatTileItem; size: number; tone?: "default" | "strong" }) {
  return <KnowledgeGlyph kind={knowledgeKindOf(chat.constellationType)} size={size} tone={tone} />;
}

/** Small: one compact line — a marker, the name and how recently it was opened. */
function SmallRow({ chat }: { chat: HomeChatTileItem }) {
  return (
    <button
      type="button"
      onClick={chat.onOpen}
      aria-label={chat.openLabel}
      title={[chat.title, contextLine(chat)].filter(Boolean).join(" — ")}
      className={`flex w-full min-w-0 items-center gap-2 rounded-[6px] px-1.5 py-[3px] text-left hover:bg-[var(--home-tile-row-hover)] ${FOCUS_RING}`}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: HT.accent }} />
      <span className="min-w-0 flex-1 truncate luxia-type-body-dense" style={{ color: HT.title }}>{chat.title}</span>
      {chat.activity ? <ActivityText activity={chat.activity} form="short" /> : null}
    </button>
  );
}

/** Medium / Large: a timeline row — the Constellation type, name, context and time. */
function ListRow({ chat }: { chat: HomeChatTileItem }) {
  const context = contextLine(chat);
  return (
    <button type="button" onClick={chat.onOpen} aria-label={chat.openLabel} className={HOME_TILE_ROW}>
      <ChatGlyph chat={chat} size={28} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-baseline justify-between gap-3">
          <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={chat.title}>{chat.title}</span>
          {chat.activity ? <ActivityText activity={chat.activity} form="short" /> : null}
        </span>
        {context ? (
          <span className="block truncate luxia-type-caption" style={{ color: HT.secondary }} title={context}>{context}</span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * The most recently opened Chat, larger: where it answers from, when it was
 * opened and a Continue cue. `detail` adds the Constellation's own description.
 */
function LeadChat({ chat, compact = false, detail = false }: { chat: HomeChatTileItem; compact?: boolean; detail?: boolean }) {
  return (
    <button
      type="button"
      onClick={chat.onOpen}
      aria-label={chat.openLabel}
      className={`group/chat ${HOME_TILE_PANEL_BUTTON} h-full flex-col gap-2 ${compact ? "px-3 py-2.5" : "p-3.5"}`}
      data-home-chat-lead=""
    >
      <span className="flex min-w-0 items-center gap-3">
        <ChatGlyph chat={chat} size={compact ? 32 : 36} tone="strong" />
        <span className="min-w-0 flex-1">
          <span className="block truncate luxia-type-overline-data" style={{ color: HT.muted }}>Latest</span>
          <span className="block truncate luxia-type-body-dense-strong" style={{ color: HT.title, fontSize: compact ? 14 : 15, lineHeight: "20px" }} title={chat.title}>
            {chat.title}
          </span>
        </span>
      </span>
      {detail && chat.description ? (
        <span className="line-clamp-3 luxia-type-body-dense" style={{ color: HT.secondary, overflowWrap: "anywhere" }} title={chat.description}>
          {chat.description}
        </span>
      ) : null}
      {detail ? (
        <span className="mt-auto grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 border-t pt-2.5 luxia-type-caption" style={{ borderColor: HT.divider }}>
          {chat.constellationName ? (
            <>
              <span style={{ color: HT.muted }}>Constellation</span>
              <span className="min-w-0 truncate text-right luxia-type-body-dense-strong" style={{ color: HT.text, fontSize: 12, lineHeight: "16px" }} title={chat.constellationName}>
                {chat.constellationName}
              </span>
            </>
          ) : null}
          {chat.projectName ? (
            <>
              <span style={{ color: HT.muted }}>Project</span>
              <span className="min-w-0 truncate text-right luxia-type-body-dense-strong" style={{ color: HT.text, fontSize: 12, lineHeight: "16px" }} title={chat.projectName}>{chat.projectName}</span>
            </>
          ) : null}
        </span>
      ) : null}
      <span className={`flex w-full min-w-0 items-center gap-3 ${detail ? "justify-end" : "justify-between"}`}>
        {detail ? null : (
          <span className="min-w-0 truncate luxia-type-caption" style={{ color: HT.secondary }} title={contextLine(chat)}>
            {contextLine(chat)}
          </span>
        )}
        <span className="inline-flex shrink-0 items-center gap-1.5 luxia-type-caption">
          {chat.activity ? <ActivityText activity={chat.activity} form="short" /> : null}
          <span className="inline-flex items-center gap-1 luxia-type-label-small" style={{ color: HT.link }} aria-hidden>
            {compact ? null : "Continue"}
            <LuxiaArrowRightIcon size={12} color="currentColor" className="transition-transform duration-150 group-hover/chat:translate-x-0.5" />
          </span>
        </span>
      </span>
    </button>
  );
}

/**
 * Full width: one conversation card per Chat — its Constellation (type and
 * name), Project, and when it was opened, with a Continue cue at the foot.
 */
function ChatCard({ chat }: { chat: HomeChatTileItem }) {
  return (
    <button
      type="button"
      onClick={chat.onOpen}
      aria-label={chat.openLabel}
      className={`group/chat ${HOME_TILE_PANEL_BUTTON} h-full flex-col justify-between gap-2 px-3.5 py-3`}
    >
      <span className="flex min-w-0 items-start gap-3">
        <ChatGlyph chat={chat} size={32} />
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong" style={{ color: HT.title }} title={chat.title}>{chat.title}</span>
            {chat.pinned ? <Pin size={12} strokeWidth={2} aria-label="Pinned" style={{ color: HT.icon }} /> : null}
          </span>
          {chat.constellationName ? (
            <span className="block truncate luxia-type-caption" style={{ color: HT.secondary }} title={chat.constellationName}>
              {[chat.constellationName, chat.constellationType].filter(Boolean).join(" · ")}
            </span>
          ) : null}
          {chat.projectName ? (
            <span className="block truncate luxia-type-caption" style={{ color: HT.muted }} title={chat.projectName}>{chat.projectName}</span>
          ) : null}
        </span>
      </span>
      <span className="flex min-w-0 items-center justify-between gap-3 border-t pt-2" style={{ borderColor: HT.divider }}>
        {chat.activity ? <ActivityText activity={chat.activity} form="long" className="truncate" /> : <span />}
        <span className="inline-flex shrink-0 items-center gap-1 luxia-type-label-small" style={{ color: HT.link }} aria-hidden>
          Continue
          <LuxiaArrowRightIcon size={12} color="currentColor" className="transition-transform duration-150 group-hover/chat:translate-x-0.5" />
        </span>
      </span>
    </button>
  );
}

/** Fills the rest of a sparse card grid with a real action instead of empty space. */
function NewChatCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full min-h-[72px] w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed px-3 py-3 text-center transition-colors hover:bg-[var(--home-tile-row-hover)] ${FOCUS_RING}`}
      style={{ borderColor: HT.chipBorder, color: HT.link }}
      data-home-chat-new=""
    >
      <Plus size={16} strokeWidth={2} aria-hidden />
      <span className="luxia-type-body-dense-strong">New Chat</span>
    </button>
  );
}

export interface ChatsCollectionHomeTileProps {
  density: HomeCollectionDensity;
  /** Accessible Chats, already ordered (most recently opened first). */
  chats: readonly HomeChatTileItem[];
  label: string;
  /** Full count line (e.g. "6 Chats · most recently opened first"). */
  summary: string;
  /** Count only (e.g. "6 Chats"). */
  count: string;
  empty: HomeCollectionEmptyState;
  viewAll?: { label: string; ariaLabel?: string; onClick: () => void };
  onNewChat?: () => void;
}

/**
 * Small — the latest Chat as a lead (Constellation type, name, time), then the
 *   next Chats as compact lines.
 * Medium — the latest Chat as a lead panel, then a timeline of the next ones.
 * Large — lead panel with the Constellation's description beside the timeline.
 * Full width — three columns of conversation cards; two rows share the card's
 *   height. With fewer than three Chats a New Chat card takes the rest of the row.
 */
export function ChatsCollectionHomeTile({ density, chats, label, summary, count, empty, viewAll, onNewChat }: ChatsCollectionHomeTileProps) {
  const wide = density === "wide";
  const rest = wide ? chats : chats.slice(1);
  const candidate = Math.min(rest.length, OFFER[density]);
  const { areaRef, listRef, count: fitting } = useFittingCount(candidate, `chats|${density}|${chats.map((chat) => chat.id).join(",")}`);

  if (chats.length === 0) {
    return (
      <CollectionHomeTile density={density} label={label} icon={chatIcon} items={[]} summary={summary} empty={empty} />
    );
  }

  const lead = chats[0];
  const shown = rest.slice(0, fitting);
  const hidden = rest.length - shown.length;

  if (density === "small") {
    return (
      <HomeTileSurface density="small" label={label} corner={CORNER}>
        <button
          type="button"
          onClick={lead.onOpen}
          aria-label={lead.openLabel}
          title={[lead.title, contextLine(lead)].filter(Boolean).join(" — ")}
          className={`-mx-1 -mt-0.5 flex min-w-0 items-center gap-2.5 rounded-[8px] px-1 py-0.5 text-left hover:bg-[var(--home-tile-row-hover)] ${FOCUS_RING} ${HOME_TILE_CORNER_CLEARANCE.small}`}
        >
          <ChatGlyph chat={lead} size={32} tone="strong" />
          <span className="min-w-0 flex-1">
            <span className="block truncate luxia-type-body-dense-strong" style={{ color: HT.title }}>{lead.title}</span>
            <span className="block truncate luxia-type-caption" style={{ color: HT.muted }}>
              {[lead.activity?.short, lead.constellationName].filter(Boolean).join(" · ")}
            </span>
          </span>
        </button>
        <div ref={areaRef} className="mt-1.5 min-h-0 flex-1 overflow-hidden border-t pt-1" style={{ borderColor: HT.divider }}>
          <ul ref={listRef} className="-mx-1.5 min-w-0" aria-label={`${label}, ${count}`}>
            {shown.map((chat) => (
              <li key={chat.id} className="min-w-0"><SmallRow chat={chat} /></li>
            ))}
          </ul>
        </div>
      </HomeTileSurface>
    );
  }

  const surfaceDensity = wide ? "large" : density;
  const header = (
    <div className={`flex min-w-0 items-center justify-between gap-3 ${HOME_TILE_CORNER_CLEARANCE[surfaceDensity]}`}>
      <p className="min-w-0 truncate luxia-type-caption" style={{ color: HT.muted }} title={summary}>{summary}</p>
      {viewAll ? <OpenCue label="View all" ariaLabel={viewAll.ariaLabel ?? viewAll.label} onClick={viewAll.onClick} /> : null}
    </div>
  );
  const moreLine = hidden > 0 && !viewAll ? (
    <p className="mt-1 px-1.5 luxia-type-caption" style={{ color: HT.muted }}>{`+${hidden} more`}</p>
  ) : null;

  if (wide) {
    const fillWithNewChat = Boolean(onNewChat) && shown.length < 3;
    const rowsFill = shown.length + (fillWithNewChat ? 1 : 0) > 3 ? "h-full auto-rows-fr" : "content-start";
    return (
      <HomeTileSurface density="large" label={label} corner={CORNER} className="@container">
        {header}
        <div ref={areaRef} className="mt-3 min-h-0 flex-1 overflow-hidden" data-home-chat-layout="wide">
          <ul ref={listRef} className={`grid min-w-0 ${rowsFill} grid-cols-1 gap-3 @sm:grid-cols-2 @3xl:grid-cols-3`} aria-label={label}>
            {shown.map((chat) => (
              <li key={chat.id} className="min-w-0"><ChatCard chat={chat} /></li>
            ))}
            {fillWithNewChat && onNewChat ? (
              <li className={`min-w-0 ${shown.length === 1 ? "@3xl:col-span-2" : ""}`}>
                <NewChatCard onClick={onNewChat} />
              </li>
            ) : null}
          </ul>
        </div>
        {moreLine}
      </HomeTileSurface>
    );
  }

  const list = (
    <div ref={areaRef} className="min-h-0 flex-1 overflow-hidden">
      <ul ref={listRef} className="-mx-1.5 flex min-w-0 flex-col" aria-label={`Earlier ${label.toLowerCase()}`}>
        {shown.map((chat) => (
          <li key={chat.id} className="min-w-0"><ListRow chat={chat} /></li>
        ))}
      </ul>
      {shown.length === 0 && onNewChat ? (
        <div className="pt-1"><NewChatCard onClick={onNewChat} /></div>
      ) : null}
    </div>
  );

  if (density === "large") {
    return (
      <HomeTileSurface density="large" label={label} corner={CORNER} className="@container">
        {header}
        <div className="mt-3 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 @sm:grid-cols-2" data-home-chat-layout="large">
          <div className="min-h-0 min-w-0"><LeadChat chat={lead} detail /></div>
          <div className="flex min-h-0 min-w-0 flex-col">
            {list}
            {moreLine}
          </div>
        </div>
      </HomeTileSurface>
    );
  }

  return (
    <HomeTileSurface density="medium" label={label} corner={CORNER}>
      {header}
      <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-2" data-home-chat-layout="medium">
        <div className="shrink-0"><LeadChat chat={lead} compact /></div>
        {list}
        {moreLine}
      </div>
    </HomeTileSurface>
  );
}
