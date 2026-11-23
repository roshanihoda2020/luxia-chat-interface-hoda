import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import flagUs from "@/assets/flags/us.svg";
import flagIt from "@/assets/flags/it.svg";
import flagSa from "@/assets/flags/sa.svg";
import flagFr from "@/assets/flags/fr.svg";
import flagDe from "@/assets/flags/de.svg";
import flagEs from "@/assets/flags/es.svg";
import flagCn from "@/assets/flags/cn.svg";
import {
  ChevronDown, ChevronRight, Mic, Check, AlignLeft, Layers, BarChart3,
} from "lucide-react";
import { GalaxyRouteSelector, type GalaxyMatchedConstellation } from "@/app/features/galaxy";
import { LX } from "@/app/features/active-data-tables/tokens";
import { ChatSendButton } from "@/app/features/shared/ChatSendButton";
import type { ChatScope, ConstellationType } from "./appSectionShared";
import "@/app/features/chat-context/composerContext.css";

const LANGUAGES = [
  { code: "EN", flagUrl: flagUs, label: "English",  sublabel: "United States" },
  { code: "IT", flagUrl: flagIt, label: "Italiano", sublabel: "Italia" },
  { code: "AR", flagUrl: flagSa, label: "Arabic",   sublabel: "Saudi Arabia" },
  { code: "FR", flagUrl: flagFr, label: "French",   sublabel: "France" },
  { code: "DE", flagUrl: flagDe, label: "German",   sublabel: "Deutschland" },
  { code: "ES", flagUrl: flagEs, label: "Spanish",  sublabel: "España" },
  { code: "ZH", flagUrl: flagCn, label: "Chinese",  sublabel: "中国" },
];

function FlagCircle({ flagUrl, label, size = 24 }: { flagUrl: string; label: string; size?: number }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size, borderRadius: "50%",
      overflow: "hidden", flexShrink: 0,
      border: "1px solid rgba(0,0,0,0.10)",
      background: "#f0f0f0",
    }}>
      <img src={flagUrl} alt="" aria-hidden="true"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
    </span>
  );
}

const ASSISTANT_MODES = ["Luxia", "Knowledge Base", "Luxia / AI"];

function AssistantModeDropdown({ mode, onChange, variant = "field" }: {
  mode: string; onChange: (m: string) => void;
  /** "field": inside the typing field. "context": inline value in the context row. */
  variant?: "field" | "context";
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onOutside); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function openMenu() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const preferred = variant === "context" ? r.left : r.right - 160;
    setMenuPos({ top: r.top - 8, left: Math.max(8, Math.min(preferred, window.innerWidth - 168)) });
    setOpen(true);
  }

  const context = variant === "context";
  return (
    <div className={context ? "relative min-w-0" : "relative z-[1] flex-shrink-0 min-w-0"}>
      <button ref={triggerRef} type="button" onClick={() => open ? setOpen(false) : openMenu()}
        aria-label={`Assistant: ${mode}`}
        aria-haspopup="menu"
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        data-luxia-assistant-trigger=""
        className={context ? "luxia-ctx-value" : "flex items-center gap-1 px-2 h-full rounded-lg transition-colors outline-none"}
        style={context ? undefined : { color: "#64748B" }}
        onMouseEnter={context ? undefined : (e) => { (e.currentTarget as HTMLElement).style.color = LX.primary; }}
        onMouseLeave={context ? undefined : (e) => { (e.currentTarget as HTMLElement).style.color = "#64748B"; }}>
        <span className={context ? "luxia-ctx-name" : "luxia-type-body-dense-strong truncate max-w-[140px]"}>{mode}</span>
        <ChevronDown size={context ? 12 : 14} strokeWidth={2} aria-hidden className={context ? "luxia-ctx-chevron" : undefined} style={context ? undefined : { transition: "transform 160ms ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} role="menu" aria-label="Assistant" className="fixed z-[9999] rounded-[12px] overflow-hidden py-1.5"
          style={{
            background: "white",
            boxShadow: LX.shadow.md,
            border: "1px solid #E2E8F0",
            minWidth: 160,
            bottom: `calc(100vh - ${menuPos.top}px)`,
            left: menuPos.left,
          }}>
          {ASSISTANT_MODES.map(m => (
            <button key={m} type="button" role="menuitemradio" aria-checked={m === mode} onClick={() => { onChange(m); setOpen(false); triggerRef.current?.focus(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 luxia-type-body-dense text-left transition-colors hover:bg-[#F8FAFC]"
              style={{ color: LX.primary, fontWeight: m === mode ? 700 : 600 }}>
              {m === mode && <Check size={12} style={{ color: LX.secondary }} />}
              {m !== mode && <span className="w-3" />}
              {m}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function LanguageSelector({ lang, onChange }: { lang: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ bottom: number; left: number } | null>(null);
  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onOutside); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function openMenu() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setMenuPos({ bottom: window.innerHeight - r.top + 8, left: r.left });
    setOpen(true);
  }

  return (
    <div className="relative flex-shrink-0">
      <button ref={triggerRef}
        aria-label="Select answer language"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => open ? setOpen(false) : openMenu()}
        className="flex items-center gap-1 p-1 rounded-full select-none transition-colors outline-none"
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F1F5F9"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
        <FlagCircle flagUrl={current.flagUrl} label={current.label} size={26} />
        <ChevronDown size={13} strokeWidth={2.2} style={{ color: "#94A3B8", marginTop: 1 }} />
      </button>
      {open && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} role="menu"
          className="fixed z-[9999] rounded-[12px] overflow-hidden py-1.5"
          style={{
            background: "white",
            boxShadow: "0 4px 16px rgba(15,23,42,0.10)",
            border: "1px solid #E2E8F0",
            minWidth: 190,
            bottom: menuPos.bottom,
            left: menuPos.left,
          }}>
          {LANGUAGES.map(l => (
            <button key={l.code} role="menuitem"
              onClick={() => { onChange(l.code); setOpen(false); triggerRef.current?.focus(); }}
              className="w-full flex items-center gap-2.5 px-2.5 h-[44px] text-left outline-none transition-colors"
              style={{ color: LX.primary, fontWeight: l.code === lang ? 600 : 400 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(142,99,235,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <FlagCircle flagUrl={l.flagUrl} label={l.label} size={24} />
              <div className="flex-1 min-w-0">
                <p className="luxia-type-body-dense-strong leading-none mb-0.5" style={{ color: LX.primary }}>{l.label}</p>
                <p className="luxia-type-caption" style={{ color: "#64748B" }}>{l.sublabel}</p>
              </div>
              {l.code === lang && <Check size={13} style={{ color: LX.secondary, flexShrink: 0 }} />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function ResponseTypeDropdown({ constellationType }: { constellationType: ConstellationType }) {
  const options = constellationType === "database"
    ? [{ id: "narrative", label: "Narrative", icon: AlignLeft }, { id: "charts", label: "Charts", icon: BarChart3 }]
    : [{ id: "standard", label: "Standard", icon: AlignLeft }, { id: "deep", label: "Deep", icon: Layers }];
  const [selected, setSelected] = useState(options[0].id);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<number>(-1);

  useEffect(() => { setSelected(options[0].id); setOpen(false); }, [constellationType]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
      if (e.key === "ArrowDown") { e.preventDefault(); focusRef.current = Math.min(focusRef.current + 1, options.length - 1); focusNth(focusRef.current); }
      if (e.key === "ArrowUp") { e.preventDefault(); focusRef.current = Math.max(focusRef.current - 1, 0); focusNth(focusRef.current); }
      if (e.key === "Home") { e.preventDefault(); focusRef.current = 0; focusNth(0); }
      if (e.key === "End") { e.preventDefault(); focusRef.current = options.length - 1; focusNth(options.length - 1); }
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onOutside); document.removeEventListener("keydown", onKey); };
  }, [open, options.length]);

  function focusNth(n: number) {
    const btns = menuRef.current?.querySelectorAll("button");
    (btns?.[n] as HTMLElement | undefined)?.focus();
  }

  function openMenu() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: r.top - 8, left: Math.max(8, Math.min(r.left, window.innerWidth - 168)) });
    focusRef.current = options.findIndex(o => o.id === selected);
    setOpen(true);
  }

  const current = options.find(o => o.id === selected) ?? options[0];
  const Icon = current.icon;

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => open ? setOpen(false) : openMenu()}
        aria-label={`Response mode: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        data-luxia-response-trigger=""
        className="luxia-response-trigger flex items-center gap-1.5 h-[30px] px-1 rounded-lg transition-colors outline-none"
        style={{ color: "#64748B" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = LX.primary; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748B"; }}>
        <Icon size={14} strokeWidth={1.8} />
        <span className="luxia-type-body-small-strong luxia-response-trigger__label">{current.label}</span>
        <ChevronDown size={14} strokeWidth={2} style={{ transition: "transform 160ms ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} role="menu" aria-label="Response mode" className="fixed z-[9999] rounded-[12px] overflow-hidden py-1.5"
          style={{
            background: "white",
            boxShadow: "0 4px 16px rgba(15,23,42,0.10)",
            border: "1px solid #E2E8F0",
            minWidth: 160,
            bottom: `calc(100vh - ${menuPos.top}px)`,
            left: menuPos.left,
          }}>
          {options.map(opt => {
            const OptIcon = opt.icon;
            return (
              <button key={opt.id} type="button" role="menuitemradio" aria-checked={opt.id === selected}
                onClick={() => { setSelected(opt.id); setOpen(false); triggerRef.current?.focus(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 luxia-type-body-dense text-left transition-colors outline-none"
                style={{ color: LX.primary, fontWeight: opt.id === selected ? 700 : 600 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(142,99,235,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <OptIcon size={13} strokeWidth={1.8} style={{ color: opt.id === selected ? LX.secondary : "#94A3B8" }} />
                {opt.label}
                {opt.id === selected && <Check size={12} style={{ color: LX.secondary, marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

const COMPOSER_INPUT_MIN_HEIGHT = 20;
const COMPOSER_INPUT_MAX_HEIGHT = 40;

export type ComposerTool = {
  id: string;
  /** Typed form, e.g. "@verifai". */
  trigger: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const TOOL_TOKEN = /(^|\s)(@[\w-]*)$/;

/** Tools matching an "@" token at the end of the draft. */
function matchTools(value: string, tools: ComposerTool[]) {
  const token = TOOL_TOKEN.exec(value)?.[2];
  if (!token) return { token: null, matches: [] as ComposerTool[] };
  const query = token.toLowerCase();
  return { token, matches: tools.filter((tool) => tool.trigger.toLowerCase().startsWith(query)) };
}

/**
 * The Chat "@" Tools menu: matching, keyboard (↑ ↓ Enter Tab Esc), aria wiring and the portal list.
 * Shared by the Project Chat composer and Ask Luxia so both behave the same.
 */
export function useComposerToolMenu({
  value,
  onChange,
  tools,
  onSelectTool,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  tools?: ComposerTool[];
  onSelectTool?: (id: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [toolIndex, setToolIndex] = useState(0);
  const [dismissedToken, setDismissedToken] = useState<string | null>(null);
  const [toolPos, setToolPos] = useState<{ bottom: number; left: number } | null>(null);
  const toolMatch = tools?.length && onSelectTool ? matchTools(value, tools) : { token: null, matches: [] as ComposerTool[] };
  const toolMenuOpen = Boolean(toolMatch.token && toolMatch.matches.length && dismissedToken !== value);

  useEffect(() => { setToolIndex(0); }, [toolMatch.token]);
  useEffect(() => {
    if (!toolMenuOpen || !inputRef.current) { setToolPos(null); return; }
    const r = inputRef.current.getBoundingClientRect();
    setToolPos({ bottom: window.innerHeight - r.top + 14, left: Math.max(8, Math.min(r.left - 8, window.innerWidth - 368)) });
  }, [toolMenuOpen, inputRef]);

  function selectTool(tool: ComposerTool) {
    onChange(value.replace(TOOL_TOKEN, "$1").trimEnd());
    onSelectTool?.(tool.id);
  }

  /** Returns true when the key was used by the open menu. */
  function handleMenuKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): boolean {
    if (!toolMenuOpen) return false;
    const count = toolMatch.matches.length;
    if (e.key === "ArrowDown") { e.preventDefault(); setToolIndex((i) => (i + 1) % count); return true; }
    if (e.key === "ArrowUp") { e.preventDefault(); setToolIndex((i) => (i - 1 + count) % count); return true; }
    if (e.key === "Escape") { e.preventDefault(); setDismissedToken(value); return true; }
    if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
      e.preventDefault();
      selectTool(toolMatch.matches[Math.min(toolIndex, count - 1)]);
      return true;
    }
    return false;
  }

  const inputAria = {
    "aria-autocomplete": tools?.length ? ("list" as const) : undefined,
    "aria-controls": toolMenuOpen ? "luxia-composer-tools" : undefined,
    "aria-activedescendant": toolMenuOpen ? `luxia-composer-tool-${toolMatch.matches[Math.min(toolIndex, toolMatch.matches.length - 1)]?.id}` : undefined,
  };

  const menu = toolMenuOpen && toolPos ? ReactDOM.createPortal(
    <div id="luxia-composer-tools" role="listbox" aria-label="Tools" className="lx-composer-tools" style={{ bottom: toolPos.bottom, left: toolPos.left }}>
      <p className="lx-composer-tools__label" aria-hidden>Tools</p>
      {toolMatch.matches.map((tool, index) => (
        <button
          key={tool.id}
          id={`luxia-composer-tool-${tool.id}`}
          type="button"
          role="option"
          aria-selected={index === toolIndex}
          data-active={index === toolIndex || undefined}
          className="lx-composer-tools__item"
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => setToolIndex(index)}
          onClick={() => selectTool(tool)}
        >
          <span className="lx-composer-tools__icon" aria-hidden>{tool.icon}</span>
          <span className="min-w-0">
            <span className="lx-composer-tools__name">{tool.label}</span>
            <span className="lx-composer-tools__desc">{tool.description}</span>
          </span>
        </button>
      ))}
    </div>,
    document.body,
  ) : null;

  return { menu, inputAria, handleMenuKeyDown };
}

export function PromptComposer({
  value,
  onChange,
  onSend,
  language,
  onLanguageChange,
  constellationType,
  assistantMode,
  onModeChange,
  focusKey,
  chatType,
  galaxyRoute,
  contextControls,
  tools,
  onSelectTool,
  fieldContext,
  placeholder = "Ask something",
}: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  language: string; onLanguageChange: (c: string) => void;
  constellationType: ConstellationType;
  assistantMode: string; onModeChange: (m: string) => void;
  focusKey?: string;
  chatType: ChatScope;
  galaxyRoute?: {
    routeMode: "auto" | "manual";
    pendingManual: GalaxyMatchedConstellation | null;
    options: Array<{ id: string; label: string; type: "PDF" | "CSV" | "DB" }>;
    onSelectAuto: () => void;
    onSelectManual: (option: { id: string; label: string; type: "PDF" | "CSV" | "DB" }) => void;
    onClearManual: () => void;
  };
  /**
   * Optional context controls (Project / Constellation) shown under the typing field. When
   * given, the row reads Project → Constellation (or Galaxy) → Assistant, and the existing
   * response-mode control takes the assistant's place inside the typing field (both controls
   * keep their own state and handlers). When omitted, the composer renders exactly as before.
   */
  contextControls?: React.ReactNode;
  /** Tools offered when the user types "@" (e.g. VerifAI). Omitted: no menu. */
  tools?: ComposerTool[];
  onSelectTool?: (id: string) => void;
  /** Compact context shown inside the typing field, before the text (e.g. a VerifAI review). */
  fieldContext?: React.ReactNode;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;
  const toolMenu = useComposerToolMenu({ value, onChange, tools, onSelectTool, inputRef: ref });

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (toolMenu.handleMenuKeyDown(e)) return;
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  }
  const isConstellationChat = chatType === "constellation";
  const isGalaxyChat = chatType === "galaxy";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const contentHeight = el.scrollHeight;
    const capped = Math.min(
      Math.max(contentHeight, COMPOSER_INPUT_MIN_HEIGHT),
      COMPOSER_INPUT_MAX_HEIGHT,
    );
    el.style.height = `${capped}px`;
    el.style.overflowY = contentHeight > COMPOSER_INPUT_MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  useEffect(() => {
    if (!focusKey) return;
    const frame = window.requestAnimationFrame(() => ref.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [focusKey]);

  return (
    <div
      className={`luxia-composer flex-shrink-0 min-w-0 max-w-full w-full px-8 pb-5 pt-2${contextControls ? " luxia-composer--with-context" : ""}`}
      style={isGalaxyChat ? {
        background: "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.02) 100%)",
      } : undefined}
    >
      <div className="luxia-composer__main flex items-center gap-5 min-w-0 max-w-full">
        <LanguageSelector lang={language} onChange={onLanguageChange} />

        <div
          className="luxia-chat-composer"
          style={isGalaxyChat ? {
            borderColor: "#E8EAF2",
            background: "#FFFFFF",
          } : undefined}
        >
          <div className="luxia-chat-composer__text-safe">
            {fieldContext}
            <textarea
              ref={ref}
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="luxia-chat-composer__input"
              aria-label="Message"
              {...toolMenu.inputAria}
            />
          </div>
          {toolMenu.menu}
          {isConstellationChat ? (
            <div className="luxia-chat-composer__mode" data-luxia-composer-mode={contextControls ? "response" : "assistant"}>
              {contextControls
                ? <ResponseTypeDropdown constellationType={constellationType} />
                : <AssistantModeDropdown mode={assistantMode} onChange={onModeChange} />}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="luxia-composer__voice flex-shrink-0 w-[46px] h-[46px] flex items-center justify-center rounded-full transition-all hover:opacity-85 outline-none"
          style={{
            background: LX.gradient.button,
            boxShadow: "0 4px 12px rgba(48,33,78,0.18)",
          }}
          aria-label="Voice input"
        >
          <Mic size={18} color="white" />
        </button>

        <ChatSendButton
          canSend={hasText}
          onClick={onSend}
          aria-label="Send message"
        />
      </div>

      {contextControls ? (
        <div className="luxia-composer-context" data-luxia-composer-context="">
          {contextControls}
          {isGalaxyChat && galaxyRoute ? (
            <>
              <ChevronRight size={12} aria-hidden className="luxia-ctx-sep" />
              <GalaxyRouteSelector
                variant="context"
                routeMode={galaxyRoute.routeMode}
                pendingManual={galaxyRoute.pendingManual}
                options={galaxyRoute.options}
                onSelectAuto={galaxyRoute.onSelectAuto}
                onSelectManual={galaxyRoute.onSelectManual}
                onClearManual={galaxyRoute.onClearManual}
              />
            </>
          ) : null}
          <span className="luxia-ctx-group luxia-ctx-group--assistant" data-luxia-ctx-group="assistant">
            <span className="luxia-ctx-divider" aria-hidden />
            <span className="luxia-ctx-label">Assistant:</span>
            <AssistantModeDropdown mode={assistantMode} onChange={onModeChange} variant="context" />
          </span>
        </div>
      ) : isConstellationChat ? (
        <div className="mt-2 min-w-0 max-w-full" style={{ paddingLeft: "calc(2.25rem + 20px + 28px)" }}>
          <ResponseTypeDropdown constellationType={constellationType} />
        </div>
      ) : null}

      {isGalaxyChat && galaxyRoute && !contextControls ? (
        <GalaxyRouteSelector
          routeMode={galaxyRoute.routeMode}
          pendingManual={galaxyRoute.pendingManual}
          options={galaxyRoute.options}
          onSelectAuto={galaxyRoute.onSelectAuto}
          onSelectManual={galaxyRoute.onSelectManual}
          onClearManual={galaxyRoute.onClearManual}
        />
      ) : null}
    </div>
  );
}
