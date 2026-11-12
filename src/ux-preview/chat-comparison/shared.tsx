import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { AICard, DateSeparator, EmptyState, UserBubble } from "@/app/app-sections/ChatContentSection";
import { LUXIA_PAGE_INTRO } from "@/app/components/LuxiaPageHeader";
import { GalaxyEmptyState } from "@/app/features/galaxy";
import { PromptComposer } from "@/app/app-sections/ChatComposerSection";
import type { GalaxyMatchedConstellation } from "@/app/features/galaxy";
import { ConstellationSourceBadge, type Chat, type Constellation, type Message } from "@/app/app-sections/appSectionShared";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import type { HomeProjectCard } from "@/app/features/project/types";
import { LuxiaConstellationIcon, LuxiaDatasourceIcon, LuxiaGalaxyIcon, LuxiaProjectsIcon, LuxiaSettingsIcon } from "@/assets/icons";
import { ROLE_LABEL, type DemoRole } from "./mockData";
import type { Scope } from "./model";

const RECENT_MIN = 6;

/** Project context: a plain label with one Project, a searchable menu with more. */
export function ProjectSelector({
  projects,
  value,
  onChange,
  role,
  readiness,
  recentIds = [],
  compact = false,
  onOpenSetup,
}: {
  projects: HomeProjectCard[];
  value: string;
  onChange: (id: string) => void;
  role: DemoRole;
  readiness: (id: string) => number;
  recentIds?: string[];
  compact?: boolean;
  /** Project knowledge & settings (existing Project pages); role-aware label. */
  onOpenSetup?: () => void;
}) {
  const setupLabel = role === "owner-manager" ? "Project knowledge & settings" : "View Project knowledge";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = projects.find((p) => p.id === value) ?? projects[0];
  const filtered = projects.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  const recent = projects.length >= RECENT_MIN && !query ? recentIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as HomeProjectCard[] : [];
  const label = (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-[7px]" style={{ background: "var(--luxia-opacity-brand-secondary-12)", color: "var(--luxia-purple-60)" }}>
        <LuxiaProjectsIcon size={14} color="currentColor" />
      </span>
      <span className="min-w-0">
        <span className="block truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{current?.name}</span>
        {!compact ? <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{`${ROLE_LABEL[role]} · ${current?.memberCount} members`}</span> : null}
      </span>
    </span>
  );

  if (projects.length <= 1) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <div className="flex min-w-0 items-center px-2 py-1" data-ux-project-label="" aria-label={`Project: ${current?.name}`}>{label}</div>
        {onOpenSetup ? (
          <button type="button" onClick={onOpenSetup} title={setupLabel} aria-label={setupLabel} className="rounded-[8px] p-1.5 outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]" style={{ color: "var(--luxia-text-muted)" }} data-ux-project-setup-entry="">
            <LuxiaSettingsIcon size={14} color="currentColor" />
          </button>
        ) : null}
      </div>
    );
  }

  const row = (p: HomeProjectCard) => {
    const ready = readiness(p.id);
    return (
      <button
        key={p.id}
        type="button"
        role="option"
        aria-selected={p.id === value}
        onClick={() => { onChange(p.id); setOpen(false); setQuery(""); }}
        className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:bg-[var(--luxia-opacity-brand-secondary-08)] outline-none"
        data-ux-project-option={p.id}
      >
        <LuxiaProjectsIcon size={14} color="var(--luxia-purple-60)" />
        <span className="min-w-0 flex-1">
          <span className="block truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{p.name}</span>
          <span className="block truncate luxia-type-caption" style={{ color: ready ? "var(--luxia-text-muted)" : "var(--luxia-warning-90)" }}>
            {ready ? `${ready} Constellation${ready === 1 ? "" : "s"}` : "Needs knowledge"}
          </span>
        </span>
        {p.id === value ? <Check size={14} color="var(--luxia-purple-60)" aria-hidden /> : null}
      </button>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 items-center gap-1.5 rounded-[10px] border px-2 py-1 text-left outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}
          aria-label={`Project: ${current?.name}. Change Project`}
          data-ux-project-trigger=""
        >
          {label}
          <ChevronDown size={14} color="var(--luxia-text-muted)" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-2">
        {projects.length > 4 ? (
          <label className="mb-1.5 flex items-center gap-2 rounded-[8px] border px-2 py-1.5" style={{ borderColor: "var(--luxia-border-default)" }}>
            <Search size={13} color="var(--luxia-text-muted)" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a Project" aria-label="Find a Project" className="min-w-0 flex-1 bg-transparent outline-none luxia-type-body-dense" autoFocus />
          </label>
        ) : null}
        <div role="listbox" aria-label="Projects" className="max-h-[320px] overflow-y-auto">
          {recent.length ? <p className="px-2.5 pb-1 pt-1.5 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>Recent</p> : null}
          {recent.map(row)}
          {recent.length ? <p className="px-2.5 pb-1 pt-2 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>All Projects</p> : null}
          {filtered.map(row)}
          {filtered.length === 0 ? <p className="px-2.5 py-3 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>No Projects match.</p> : null}
        </div>
        {onOpenSetup ? (
          <div className="mt-1.5 border-t pt-1.5" style={{ borderColor: "var(--luxia-border-default)" }}>
            <button type="button" onClick={() => { setOpen(false); onOpenSetup(); }} className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left luxia-type-body-dense-strong outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:bg-[var(--luxia-opacity-brand-secondary-08)]" style={{ color: "var(--luxia-purple-70)" }} data-ux-project-setup-entry="">
              <LuxiaSettingsIcon size={14} color="currentColor" />{`${setupLabel} · ${current?.name}`}
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function ScopeName({ scope, constellations }: { scope: Scope; constellations: Constellation[] }) {
  const current = scope.kind === "constellation" ? constellations.find((c) => c.id === scope.id) : null;
  return (
    <>
      {scope.kind === "galaxy" ? <LuxiaGalaxyIcon size={13} color="currentColor" /> : <LuxiaConstellationIcon size={13} color="currentColor" />}
      <span className="truncate luxia-type-body-dense-strong">{current ? current.label : "Galaxy"}</span>
      {current ? <ConstellationSourceBadge type={current.type} /> : null}
    </>
  );
}

/**
 * The one knowledge list (Galaxy + this Project's Constellations), used by every
 * entry point. With messages, choosing starts a new chat; the text says so first.
 */
export function KnowledgeChoices({ scope, constellations, onChoose, hasMessages, chatLabel, tone = "light" }: {
  scope: Scope | null;
  constellations: Constellation[];
  onChoose: (scope: Scope) => void;
  hasMessages: boolean;
  chatLabel?: string;
  tone?: "light";
}) {
  void tone;
  const choice = (key: string, selected: boolean, onClick: () => void, children: ReactNode) => (
    <button
      key={key}
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:bg-[var(--luxia-opacity-brand-secondary-08)]"
      data-ux-scope-option={key}
    >
      {children}
      {selected ? <Check size={14} color="var(--luxia-purple-60)" aria-hidden className="ml-auto shrink-0" /> : null}
    </button>
  );
  return (
    <div data-ux-knowledge-list="">
      <p className="px-2.5 pb-1.5 luxia-type-caption" style={{ color: hasMessages ? "var(--luxia-purple-70)" : "var(--luxia-text-muted)" }} data-ux-knowledge-context="">
        {hasMessages
          ? `Choosing other knowledge starts a new chat. "${chatLabel ?? "This chat"}" keeps its knowledge and messages.`
          : "This chat answers from:"}
      </p>
      <div role="listbox" aria-label={hasMessages ? "Knowledge for a new chat" : "Knowledge for this chat"}>
        {choice("galaxy", !hasMessages && scope?.kind === "galaxy", () => onChoose({ kind: "galaxy" }), (
          <>
            <LuxiaGalaxyIcon size={14} color="var(--luxia-purple-60)" />
            <span className="min-w-0">
              <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>Galaxy</span>
              <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>Picks a suitable Constellation for each question</span>
            </span>
          </>
        ))}
        {constellations.map((c) => choice(c.id, !hasMessages && scope?.kind === "constellation" && scope.id === c.id, () => onChoose({ kind: "constellation", id: c.id }), (
          <>
            <LuxiaConstellationIcon size={14} color="var(--luxia-purple-60)" />
            <span className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{c.label}</span>
            <ConstellationSourceBadge type={c.type} />
          </>
        )))}
      </div>
      {hasMessages ? <p className="px-2.5 pt-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>Your unsent text moves to the new chat.</p> : null}
    </div>
  );
}

export function KnowledgeName({ scope, constellations }: { scope: Scope; constellations: Constellation[] }) {
  return <ScopeName scope={scope} constellations={constellations} />;
}

/**
 * "Answers from": the knowledge a chat uses.
 * - editable: the composer is where knowledge is chosen (C1 / option B / C).
 * - indicator: read-only line; clicking it hands over to the primary control (option A).
 * Not a filter, and not Galaxy's per-message routing.
 */
export function AnswersFrom({
  scope,
  constellations,
  open,
  onOpenChange,
  onChoose,
  hasMessages,
  chatLabel,
  variant = "editable",
  onIndicatorClick,
  indicatorHint,
}: {
  scope: Scope | null;
  constellations: Constellation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (scope: Scope) => void;
  hasMessages: boolean;
  chatLabel?: string;
  variant?: "editable" | "indicator";
  onIndicatorClick?: () => void;
  indicatorHint?: string;
}) {
  const list = (
    <PopoverContent align="start" side="top" className="w-[340px] p-2" onFocusOutside={(event) => event.preventDefault()}>
      <KnowledgeChoices scope={scope} constellations={constellations} onChoose={onChoose} hasMessages={hasMessages} chatLabel={chatLabel} />
    </PopoverContent>
  );
  const label = <span className="shrink-0 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>Answers from:</span>;

  if (variant === "indicator") {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1" data-ux-answers-from="indicator">
        {label}
        <button
          type="button"
          onClick={onIndicatorClick}
          className="inline-flex min-w-0 items-center gap-1.5 rounded-[8px] px-1.5 py-0.5 outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: "var(--luxia-purple-70)" }}
          title={indicatorHint ?? "Change knowledge in the Constellation panel"}
          aria-label={`Answers from: ${scope ? (scope.kind === "galaxy" ? "Galaxy" : constellations.find((c) => c.id === scope.id)?.label ?? "Constellation") : "not chosen"}. ${indicatorHint ?? "Change knowledge in the Constellation panel"}`}
          data-ux-answers-value=""
        >
          {scope ? <ScopeName scope={scope} constellations={constellations} /> : <span className="luxia-type-body-dense-strong">Choose knowledge</span>}
        </button>
        {!scope ? <span className="luxia-type-caption" style={{ color: "var(--luxia-purple-70)" }}>Required before sending</span> : null}
      </div>
    );
  }

  if (hasMessages && scope) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1" data-ux-answers-from="read-only">
        {label}
        <span className="inline-flex min-w-0 items-center gap-1.5" style={{ color: "var(--luxia-purple-70)" }} title="The knowledge this chat uses. It can't change once the chat has messages." data-ux-answers-value="">
          <ScopeName scope={scope} constellations={constellations} />
        </span>
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <button type="button" className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 luxia-type-caption font-semibold outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]" style={{ color: "var(--luxia-purple-70)" }} data-ux-new-chat-other="">
              <Plus size={12} aria-hidden />Start new chat with other knowledge…
            </button>
          </PopoverTrigger>
          {list}
        </Popover>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2" data-ux-answers-from="editable">
      {label}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            style={scope
              ? { borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)", color: "var(--luxia-purple-70)" }
              : { borderColor: "var(--luxia-purple-50)", background: "var(--luxia-opacity-brand-secondary-08)", color: "var(--luxia-purple-70)" }}
            aria-label={scope ? "Answers from: change knowledge for this chat" : "Answers from: choose knowledge"}
            title="The knowledge this chat uses"
            data-ux-scope-chip=""
          >
            {scope ? <ScopeName scope={scope} constellations={constellations} /> : <span className="luxia-type-body-dense-strong">Choose knowledge</span>}
            <ChevronDown size={12} aria-hidden />
          </button>
        </PopoverTrigger>
        {list}
      </Popover>
      {!scope ? <span className="luxia-type-caption" style={{ color: "var(--luxia-purple-70)" }}>Required before sending</span> : null}
    </div>
  );
}

/** Project exists but nothing can answer yet. Role-aware, no composer. */
export function NotReadyPanel({ projectName, role, onSetup }: { projectName: string; role: DemoRole; onSetup: () => void }) {
  const canSetUp = role === "owner-manager";
  return (
    <div className="flex flex-1 items-center justify-center p-6" data-ux-not-ready="">
      <div className="w-full max-w-[520px] rounded-[var(--luxia-radius-16)] border p-6" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}>
        <span className="flex size-10 items-center justify-center rounded-[12px]" style={{ background: "var(--luxia-opacity-brand-secondary-12)", color: "var(--luxia-purple-60)" }}>
          <LuxiaConstellationIcon size={20} color="currentColor" />
        </span>
        <h2 className="mt-4 luxia-type-heading-h3" style={{ color: "var(--luxia-purple-70)" }}>{projectName} has no knowledge yet</h2>
        <p className="mt-1.5 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          A Chat answers from a Constellation, and a Constellation needs a Data Source. Galaxy can answer once the Project has at least one Constellation.
        </p>
        <ol className="mt-4 space-y-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
          <li className="flex items-center gap-2"><LuxiaDatasourceIcon size={14} color="var(--luxia-purple-60)" />1. Connect a Data Source the Project can use</li>
          <li className="flex items-center gap-2"><LuxiaConstellationIcon size={14} color="var(--luxia-purple-60)" />2. Create a Constellation from it</li>
          <li className="flex items-center gap-2"><LuxiaGalaxyIcon size={14} color="var(--luxia-purple-60)" />3. Chat with it, or ask across it with Galaxy</li>
        </ol>
        {canSetUp ? (
          <Button type="button" variant="primary" size="compact" className="mt-5" onClick={onSetup} data-ux-setup-action="">
            <LuxiaSettingsIcon size={14} color="currentColor" />Set up knowledge
          </Button>
        ) : (
          <p className="mt-5 rounded-[10px] px-3 py-2 luxia-type-body-dense" style={{ background: "var(--luxia-opacity-brand-secondary-08)", color: "var(--luxia-text-secondary)" }} data-ux-ask-owner="">
            Ask the Project Owner or a Project Manager to add knowledge. Members can chat once it's ready.
          </p>
        )}
      </div>
    </div>
  );
}

/** Stand-in for the existing Project setup pages; the prototype only shows where they live. */
export function SimulatedSetup({ projectName, onBack }: { projectName: string; onBack: () => void }) {
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { backRef.current?.focus(); }, []);
  return (
    <div className="flex-1 overflow-y-auto p-6" data-ux-setup-page="">
      <Button ref={backRef} type="button" variant="tertiary" size="compact" onClick={onBack} data-ux-setup-back="">← Back to Chat</Button>
      <p className="mt-3 max-w-[60ch] luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }} data-ux-simulated-label="" aria-label={`Simulated setup for ${projectName}`}>
        In the real app this opens the existing pages: Data Sources, Constellations › New Constellation, and Galaxy settings. The prototype doesn't change them.
      </p>
      <div className="mt-4 grid max-w-[720px] gap-3 sm:grid-cols-3">
        {[
          { icon: <LuxiaDatasourceIcon size={16} color="currentColor" />, title: "Data Sources", text: "Connect or choose a source the Project can use." },
          { icon: <LuxiaConstellationIcon size={16} color="currentColor" />, title: "New Constellation", text: "Turn the source into knowledge Chats answer from." },
          { icon: <LuxiaGalaxyIcon size={16} color="currentColor" />, title: "Galaxy settings", text: "Routing: automatic, or selected Constellations." },
        ].map((card) => (
          <div key={card.title} className="rounded-[12px] border p-4" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}>
            <span style={{ color: "var(--luxia-purple-60)" }}>{card.icon}</span>
            <p className="mt-2 luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{card.title}</p>
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{card.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The real message area: empty chats show the existing suggested questions
 * (GalaxyEmptyState / EmptyState), otherwise "Today" and the messages.
 */
export function Thread({ messages, chat, projectName, onPrompt }: { messages: Message[]; chat: Chat | null; projectName: string; onPrompt: (prompt: string) => void }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length, chat?.id]);
  return (
    <div className="luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical luxia-scrollbar-messages min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-5 pt-6" style={{ paddingInline: LUXIA_PAGE_INTRO.padInline }} data-ux-thread="">
      {messages.length === 0
        ? (chat?.chatType === "galaxy"
          ? <GalaxyEmptyState projectName={projectName} onPrompt={onPrompt} />
          : <EmptyState onPrompt={onPrompt} />)
        : (
          <>
            <DateSeparator label="Today" />
            {messages.map((message) => (message.role === "user"
              ? <UserBubble key={message.id} message={message} />
              : <AICard key={message.id} message={message} constellationId={chat?.constellationId} />))}
          </>
        )}
      <div ref={endRef} />
    </div>
  );
}

const ROUTE_TYPE = { pdf: "PDF", csv: "CSV", database: "DB" } as const;

/** The real Chat composer, unchanged, fed by prototype state (real default values). */
export function Composer({
  value,
  onChange,
  onSend,
  chat,
  constellation,
  constellations,
  focusKey,
  route,
  onRouteChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (routeConstellationId?: string) => void;
  chat: Chat;
  constellation: Constellation | null;
  /** Usable Constellations, for Galaxy's existing per-message route selector. */
  constellations: Constellation[];
  focusKey?: string;
  /** Optional shared Galaxy route state (so the Galaxy panel and composer agree). */
  route?: { mode: "auto" | "manual"; pending: GalaxyMatchedConstellation | null };
  onRouteChange?: (route: { mode: "auto" | "manual"; pending: GalaxyMatchedConstellation | null }) => void;
}) {
  const [language, setLanguage] = useState("EN");
  const [mode, setMode] = useState("Luxia");
  const [ownMode, setOwnMode] = useState<"auto" | "manual">("auto");
  const [ownPending, setOwnPending] = useState<GalaxyMatchedConstellation | null>(null);
  useEffect(() => { setOwnMode("auto"); setOwnPending(null); }, [chat.id]);
  const routeMode = route?.mode ?? ownMode;
  const pending = route ? route.pending : ownPending;
  const setRoute = (nextMode: "auto" | "manual", nextPending: GalaxyMatchedConstellation | null) => {
    if (onRouteChange) onRouteChange({ mode: nextMode, pending: nextPending });
    else { setOwnMode(nextMode); setOwnPending(nextPending); }
  };
  const options = constellations.map((c) => ({ id: c.id, label: c.label, type: ROUTE_TYPE[c.type] }));
  return (
    <div data-ux-composer="" data-ux-galaxy-route={routeMode === "manual" && pending ? pending.id : "auto"}>
      <PromptComposer
        value={value}
        onChange={onChange}
        onSend={() => onSend(chat.chatType === "galaxy" && routeMode === "manual" && pending ? pending.id : undefined)}
        language={language}
        onLanguageChange={setLanguage}
        constellationType={constellation?.type ?? "pdf"}
        assistantMode={mode}
        onModeChange={setMode}
        chatType={chat.chatType}
        focusKey={focusKey}
        galaxyRoute={chat.chatType === "galaxy" ? {
          routeMode,
          pendingManual: pending,
          options,
          onSelectAuto: () => setRoute("auto", null),
          onSelectManual: (option) => setRoute("manual", option),
          onClearManual: () => setRoute("auto", null),
        } : undefined}
      />
    </div>
  );
}

export function useRecentProjects(activeProjectId: string) {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    setRecent((list) => [activeProjectId, ...list.filter((id) => id !== activeProjectId)].slice(0, 3));
  }, [activeProjectId]);
  return useMemo(() => recent, [recent]);
}

export function PrototypeNote({ children }: { children: ReactNode }) {
  return <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }} data-ux-prototype-note="">{children}</p>;
}
