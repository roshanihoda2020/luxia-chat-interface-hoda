import { useEffect, useRef, useState } from "react";
import {
  Plus, X, Pin, Copy, Edit3, Trash2,
} from "lucide-react";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import { LuxiaGalaxyIcon } from "@/assets/icons";
import { ResponseActionsFooter } from "@/app/features/chat/ResponseActionsFooter";
import { LuxiaResponseCard } from "@/app/features/chat/LuxiaResponseCard";
import { hydrateMessageResponsePresentation } from "@/app/features/constellation-settings/responseConfidence";
import { getProjectNameById } from "@/app/features/project";
import type { HomeProjectCard } from "@/app/features/home";
import { LX } from "@/app/features/active-data-tables/tokens";
import {
  CONSTELLATION_STYLE,
  getConstellationSourceLabel,
  type Chat,
  type Constellation,
  type Message,
} from "./appSectionShared";

const EMPTY_PROMPTS = [
  "What information is available here?",
  "Give me a brief summary",
  "What are the key topics?",
  "Walk me through the structure",
];

export function ChatTabBar({ chats, activeId, onSelect, onNew, onClose, onPin, onRename, projects, constellations }: {
  chats: Chat[]; activeId: string;
  onSelect: (id: string) => void; onNew: () => void;
  onClose: (id: string) => void; onPin: (id: string) => void;
  onRename: (id: string, v: string) => void;
  projects: readonly HomeProjectCard[];
  constellations: Constellation[];
}) {
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);
  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <div className="luxia-scrollbar luxia-scrollbar-horizontal flex items-center gap-1.5 py-2 overflow-x-auto flex-shrink-0"
      style={{ borderBottom: `1px solid ${LX.border}` }}>
      {chats.map((chat) => {
        const isActive = chat.id === activeId;
        const con = chat.chatType === "constellation" && chat.constellationId
          ? constellations.find((c) => c.id === chat.constellationId)
          : null;
        const style = con ? CONSTELLATION_STYLE[con.type] : null;

        const isGalaxyTab = chat.chatType === "galaxy";
        const galaxyProject = isGalaxyTab
          ? getProjectNameById(chat.projectId, projects)
          : null;
        const tabLabel = isGalaxyTab ? galaxyProject! : chat.label;

        return (
          <div key={chat.id} className="relative flex-shrink-0 group"
            onContextMenu={(e) => { e.preventDefault(); setMenu({ id: chat.id, x: e.clientX, y: e.clientY }); }}>
            <button onClick={() => onSelect(chat.id)}
              className="flex items-center gap-2 px-3.5 h-[36px] rounded-[10px] luxia-type-body-dense transition-all"
              style={{
                background: isGalaxyTab
                  ? (isActive ? "rgba(48,33,78,0.05)" : "transparent")
                  : style ? (isActive ? style.activeBg : style.bg) : (isActive ? LX.subtle : "transparent"),
                border: `1px solid ${
                  isGalaxyTab
                    ? (isActive ? LX.borderStrong : LX.border)
                    : style ? (isActive ? style.activeBorder : style.border) : (isActive ? LX.borderStrong : LX.border)
                }`,
                color: isActive ? LX.primary : LX.muted,
                fontWeight: isActive ? 800 : 600,
                boxShadow: isActive ? LX.shadow.sm : "none",
              }}>
              {chat.pinned && <Pin size={10} style={{ color: isGalaxyTab ? LX.secondary : (style?.color ?? LX.accent) }} />}
              {isGalaxyTab && <LuxiaGalaxyIcon size={11} style={{ color: LX.secondary, flexShrink: 0 }} />}
              {renaming === chat.id ? (
                <input ref={renameRef} value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onBlur={() => { if (renameVal.trim()) onRename(chat.id, renameVal.trim()); setRenaming(null); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { if (renameVal.trim()) onRename(chat.id, renameVal.trim()); setRenaming(null); }
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  className="bg-transparent border-none outline-none w-[90px] luxia-type-body-dense-strong"
                  style={{ color: LX.primary }} onClick={(e) => e.stopPropagation()} />
              ) : (
                <span className="flex items-center gap-[6px] min-w-0 items-baseline">
                  <span className="truncate select-none" style={{ maxWidth: 140 }} title={tabLabel}>{tabLabel}</span>
                  {con ? (
                    <span
                      className="luxia-type-overline-data shrink-0"
                      style={{ color: con.type === "database" ? "var(--luxia-purple-50)" : "var(--luxia-blue-60)" }}
                    >
                      {getConstellationSourceLabel(con.type)}
                    </span>
                  ) : null}
                </span>
              )}
              {chats.length > 1 && (
                <span onClick={(e) => { e.stopPropagation(); onClose(chat.id); }}
                  className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-full transition-all hover:bg-black/10 ml-0.5 flex-shrink-0">
                  <X size={9} style={{ color: LX.muted }} />
                </span>
              )}
            </button>
          </div>
        );
      })}

      <button onClick={onNew}
        className="flex items-center justify-center w-[30px] h-[30px] rounded-[8px] flex-shrink-0 transition-all hover:opacity-80"
        style={{ border: `1.5px dashed ${LX.border}` }}
        title="New Chat">
        <Plus size={13} style={{ color: LX.muted }} />
      </button>

      {menu && (
        <div className="fixed z-50 rounded-[12px] overflow-hidden py-1"
          style={{ top: menu.y, left: menu.x, background: "white", boxShadow: LX.shadow.md, border: `1px solid ${LX.border}`, minWidth: 156 }}
          onClick={(e) => e.stopPropagation()}>
          {[
            { icon: Edit3, label: "Rename", action: () => { const c = chats.find(x => x.id === menu.id); if (c) { setRenaming(menu.id); setRenameVal(c.label); setMenu(null); } } },
            { icon: Pin, label: "Toggle pin", action: () => { onPin(menu.id); setMenu(null); } },
            { icon: Copy, label: "Duplicate", action: () => setMenu(null) },
            { icon: Trash2, label: "Close tab", action: () => { onClose(menu.id); setMenu(null); }, danger: true },
          ].map(({ icon: Icon, label, action, danger }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-2.5 px-4 py-2 luxia-type-body-dense-strong hover:bg-[#FAFDFF] transition-colors text-left"
              style={{ color: danger ? LX.error : LX.primary }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 h-px" style={{ background: LX.borderSubtle }} />
      <span className="luxia-type-overline-data" style={{ color: LX.borderStrong }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: LX.borderSubtle }} />
    </div>
  );
}

export function AICard({
  message,
  constellationId,
  onOpenGalaxyConstellation,
  onViewGalaxyActivity,
}: {
  message: Message;
  constellationId?: string;
  onOpenGalaxyConstellation?: () => void;
  onViewGalaxyActivity?: () => void;
}) {
  const hydrated = hydrateMessageResponsePresentation(message, constellationId);
  const presentation = hydrated.presentation;
  const notice = hydrated.notice;
  const content = hydrated.content;
  const showAnswerBody = !message.galaxy || message.galaxy.phase === "answering" || message.galaxy.phase === "complete";
  const showResponseActions = Boolean(showAnswerBody && content);

  return (
    <LuxiaResponseCard
      content={content}
      timestamp={message.timestamp}
      presentation={presentation}
      notice={notice}
      sources={hydrated.sources}
      insights={hydrated.hideInsights ? undefined : message.insights}
      galaxy={message.galaxy}
      onOpenGalaxyConstellation={onOpenGalaxyConstellation}
      onViewGalaxyActivity={onViewGalaxyActivity}
      footer={
        showResponseActions ? (
          <ResponseActionsFooter
            content={content}
            variant={hydrated.footerVariant}
          />
        ) : null
      }
    />
  );
}

export function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-end mb-7 min-w-0 max-w-full">
      <div className="min-w-0 max-w-[min(70%,720px)]">
        <div className="luxia-chat-text px-5 py-3.5 luxia-type-body-small-strong"
          style={{
            background: "var(--luxia-purple-70)",
            color: "var(--luxia-text-inverse)",
            borderRadius: "18px 18px 6px 18px",
            boxShadow: "0 2px 12px rgba(48,33,78,0.22)",
          }}>
          {message.content}
        </div>
        <p className="text-right luxia-type-caption mt-1.5 pr-1" style={{ color: LX.borderStrong }}>{message.timestamp}</p>
      </div>
    </div>
  );
}

export function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pb-8">
      <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 overflow-hidden"
        style={{ background: LX.gradient.button, boxShadow: LX.shadow.lg }}>
        <LuxiaStarLogo size={32} />
      </div>
      <h2 className="luxia-type-heading-h4 mb-2 text-center" style={{ color: LX.primary }}>
        Start the conversation
      </h2>
      <p className="luxia-type-body-small text-center mb-8 max-w-[380px]" style={{ color: LX.muted }}>
        Ask anything. Luxia will search across your connected constellation.
      </p>
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-[480px]">
        {EMPTY_PROMPTS.map((p) => (
          <button key={p} onClick={() => onPrompt(p)}
            className="text-left px-4 py-3 rounded-[14px] luxia-type-body-dense transition-all outline-none"
            style={{ color: LX.primary, fontWeight: 600, background: "white", border: `1px solid ${LX.border}`, boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = LX.secondary; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px rgba(142,99,235,0.08)`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = LX.border; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(15,23,42,0.06)"; }}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
