import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { History, Menu, Plus, Search, X } from "lucide-react";
import { ChatTabBar } from "@/app/app-sections/ChatContentSection";
import { PageHeader } from "@/app/app-sections/ChatHeaderSection";
import { ConstellationSourceBadge, type Chat, type ChatScope, type Constellation, type Message } from "@/app/app-sections/appSectionShared";
import { LuxiaBreadcrumb } from "@/app/components/LuxiaBreadcrumb";
import { LUXIA_PAGE_INTRO, LuxiaPageHeader, LuxiaPageHeaderShell } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS, STRUCTURED_MODAL_DARK_CHROME_STYLE } from "@/app/features/shared/structuredModalChrome";
import { LuxiaChatIcon, LuxiaGalaxyIcon } from "@/assets/icons";
import { applyFilter, ChatFilterBar, isFiltering, NoMatches, useChatFilter } from "./filter";
import type { DemoRole, Scenario } from "./mockData";
import { scopeOf, usableConstellations, type ProposedApi } from "./model";
import { AnswersFrom, Composer, NotReadyPanel, ProjectSelector, PrototypeNote, SimulatedSetup, Thread, useRecentProjects } from "./shared";

const NAV_NOTE = "Navigation from the header is simulated in this prototype.";
const PROJECT_CHATS_NOTE = "In the real app this opens the existing Project Chats page (search, source filter and sort). The prototype doesn't recreate it.";

// ── Replica of the current Create Chat dialog (App.tsx NewChatModal is not exported) ──

export function CreateChatReplica({
  scenario,
  lockedProjectId,
  question,
  onClose,
  onCreate,
}: {
  scenario: Scenario;
  lockedProjectId?: string;
  question?: string;
  onClose: () => void;
  onCreate: (payload: { chatType: ChatScope; projectId: string; constellationId?: string }) => void;
}) {
  const [chatType, setChatType] = useState<ChatScope>("constellation");
  const [projectId, setProjectId] = useState(lockedProjectId ?? scenario.projects[0].id);
  const options = usableConstellations(scenario, projectId);
  const [constellationId, setConstellationId] = useState(options[0]?.id ?? "");
  useEffect(() => { setConstellationId(usableConstellations(scenario, projectId)[0]?.id ?? ""); }, [projectId, scenario]);
  const canCreate = chatType === "galaxy" ? Boolean(projectId) : Boolean(constellationId);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const radio = (value: ChatScope, title: string, sub: string) => (
    <label className="flex flex-1 cursor-pointer items-start gap-2 rounded-[12px] border p-3" style={{ borderColor: chatType === value ? "var(--luxia-purple-50)" : "var(--luxia-border-default)", background: chatType === value ? "var(--luxia-opacity-brand-secondary-08)" : "var(--luxia-surface)" }}>
      <input type="radio" name="ux-chat-type" checked={chatType === value} onChange={() => setChatType(value)} className="mt-1" />
      <span>
        <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{title}</span>
        <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{sub}</span>
      </span>
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} data-ux-create-replica="">
      <div className="absolute inset-0" style={{ background: "rgba(16,5,32,0.35)", backdropFilter: "blur(4px)" }} />
      <div className="relative flex w-full max-w-[500px] flex-col overflow-hidden rounded-[20px] bg-white" role="dialog" aria-modal="true" aria-labelledby="ux-create-title" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "min(88vh, 760px)" }}>
        <div className="flex items-start justify-between px-7 pb-4 pt-5" style={STRUCTURED_MODAL_DARK_CHROME_STYLE}>
          <div>
            <h2 id="ux-create-title" className="mb-1 luxia-type-title-modal text-[var(--luxia-text-inverse)]">Create Chat</h2>
            <p className="luxia-type-body-dense text-[var(--luxia-purple-10)]">Choose a chat type and project to start a new conversation.</p>
          </div>
          <button type="button" onClick={onClose} className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full outline-none ${LUXIA_DIALOG_CLOSE_ON_DARK_CLASS}`} aria-label="Close create chat dialog"><X size={13} /></button>
        </div>
        <div className="space-y-5 overflow-y-auto px-7 pb-5">
          <p className="pt-3 luxia-type-caption" style={{ color: "var(--luxia-warning-90)" }}>Replica of today's dialog for comparison.</p>
          {question ? (
            <section>
              <p className="mb-2 luxia-type-overline-form" style={{ color: "var(--luxia-text-muted)" }}>Your question</p>
              <p className="whitespace-pre-wrap break-words rounded-[12px] px-3.5 py-2.5 luxia-type-body-dense" style={{ background: "var(--luxia-opacity-brand-secondary-08)", color: "var(--luxia-text-primary)" }}>{question}</p>
              <p className="mt-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>It will be ready to send in the new Chat.</p>
            </section>
          ) : null}
          <section>
            <p className="mb-2 luxia-type-overline-form" style={{ color: "var(--luxia-text-muted)" }}>Chat Type</p>
            <div className="flex gap-2">{radio("galaxy", "Galaxy", "Whole project knowledge")}{radio("constellation", "Constellation", "Specific knowledge source")}</div>
          </section>
          <section>
            <label htmlFor="ux-create-project" className="mb-2 block luxia-type-label-form" style={{ color: "var(--luxia-text-primary)" }}>Project</label>
            <select id="ux-create-project" value={projectId} disabled={Boolean(lockedProjectId)} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-[10px] border px-3 py-2 luxia-type-body-dense" style={{ borderColor: "var(--luxia-border-default)" }}>
              {scenario.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {lockedProjectId ? <p className="mt-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>This Chat is scoped to the current Project.</p> : null}
          </section>
          {chatType === "constellation" ? (
            <section>
              <label htmlFor="ux-create-constellation" className="mb-2 block luxia-type-label-form" style={{ color: "var(--luxia-text-primary)" }}>Constellation</label>
              <select id="ux-create-constellation" value={constellationId} disabled={options.length === 0} onChange={(e) => setConstellationId(e.target.value)} className="w-full rounded-[10px] border px-3 py-2 luxia-type-body-dense" style={{ borderColor: "var(--luxia-border-default)" }}>
                {options.length === 0 ? <option value="">No constellations available</option> : options.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              {options.length === 0 ? <p className="mt-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>This project has no constellations yet.</p> : null}
            </section>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t px-7 py-4" style={{ borderColor: "var(--luxia-border-default)" }}>
          <Button type="button" variant="secondary" size="compact" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="primary" size="compact" disabled={!canCreate} onClick={() => onCreate({ chatType, projectId, constellationId: chatType === "constellation" ? constellationId : undefined })} data-ux-create-submit="">Create Chat</Button>
        </div>
      </div>
    </div>
  );
}

export function Notice({ text, onDismiss, tone = "info" }: { text: string; onDismiss: () => void; tone?: "info" | "warning" }) {
  return (
    <div role="status" className="mx-4 mt-3 flex items-start justify-between gap-3 rounded-[10px] border px-3 py-2 luxia-type-body-dense sm:mx-8" style={tone === "warning"
      ? { borderColor: "var(--luxia-opacity-warning-32)", background: "var(--luxia-opacity-warning-12)", color: "var(--luxia-warning-90)" }
      : { borderColor: "var(--luxia-opacity-brand-secondary-24)", background: "var(--luxia-opacity-brand-secondary-08)", color: "var(--luxia-purple-70)" }} data-ux-notice="">
      <span>{text}</span>
      <Button type="button" variant="ghost" size="iconCompact" onClick={onDismiss} aria-label="Dismiss"><X size={13} /></Button>
    </div>
  );
}

/** The real Chat page header (breadcrumb, title, actions); capsules go in its tabs slot. */
export function RealChatHeader({ chat, scenario, tabs, onRename, onDelete, onSettings, onNote }: {
  chat: Chat;
  scenario: Scenario;
  tabs?: ReactNode;
  onRename: (name: string) => void;
  onDelete: () => void;
  onSettings: () => void;
  onNote: (text: string) => void;
}) {
  const projectName = scenario.projects.find((p) => p.id === chat.projectId)?.name ?? "";
  const constellation = chat.constellationId ? scenario.constellations.find((c) => c.id === chat.constellationId) : undefined;
  return (
    <PageHeader
      chatLabel={chat.label}
      chat={chat}
      projectName={projectName}
      constellationLabel={constellation?.label}
      constellationId={constellation?.id}
      onNavigateHome={() => onNote(NAV_NOTE)}
      onOpenProject={() => onNote(NAV_NOTE)}
      onOpenConstellation={() => onNote(NAV_NOTE)}
      onRenameChat={onRename}
      onDeleteChat={onDelete}
      onOpenGalaxySettings={chat.chatType === "galaxy" ? onSettings : undefined}
      onOpenConstellationSettings={chat.chatType === "constellation" ? onSettings : undefined}
      tabs={tabs}
    />
  );
}

/** Canonical page header when there is no chat to head (not-ready Project, setup page). */
export function ProjectPageHeader({ title, projectName, tabs, pageTypeLabel = "CHAT", action, context }: { title: string; projectName: string; tabs?: ReactNode; pageTypeLabel?: string; action?: ReactNode; context?: ReactNode }) {
  return (
    <LuxiaPageHeaderShell trailing={tabs}>
      <LuxiaPageHeader
        contentGap="none"
        pageTypeLabel={pageTypeLabel}
        title={title}
        breadcrumb={<LuxiaBreadcrumb tone="page" items={[
          { id: "home", label: "Home", destination: { kind: "home" } },
          { id: "project", label: projectName, destination: { kind: "current" } },
        ]} handlers={{ onHome: () => undefined }} />}
        primaryAction={action}
        context={context}
      />
    </LuxiaPageHeaderShell>
  );
}

// ── A · Current Chat (baseline behaviour, in memory) ──

export interface CurrentStart { projectId: string; chatType: ChatScope; constellationId?: string; draft: string }

export function CurrentView({ scenario, start }: { scenario: Scenario; start?: CurrentStart }) {
  const counter = useRef(0);
  const [chats, setChats] = useState<Chat[]>(() => scenario.chats.map((c) => ({ ...c })));
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => ({ ...scenario.messages }));
  const [activeId, setActiveId] = useState<string>(() => scenario.chats.find((c) => c.chatType === "constellation")?.id ?? scenario.chats[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const create = (payload: { chatType: ChatScope; projectId: string; constellationId?: string }, text = "") => {
    counter.current += 1;
    const chat: Chat = { id: `ux-cur-${counter.current}`, label: payload.chatType === "galaxy" ? `Galaxy Chat ${counter.current}` : `New Chat ${counter.current}`, projectId: payload.projectId, chatType: payload.chatType, constellationId: payload.constellationId };
    setChats((list) => [...list, chat]);
    setMessages((map) => ({ ...map, [chat.id]: [] }));
    setActiveId(chat.id);
    setDraft(text);
    setCreating(false);
  };

  useEffect(() => {
    if (start) create({ chatType: start.chatType, projectId: start.projectId, constellationId: start.constellationId }, start.draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = chats.find((c) => c.id === activeId) ?? null;
  const constellation = active?.constellationId ? scenario.constellations.find((c) => c.id === active.constellationId) ?? null : null;
  const sameProject = active ? usableConstellations(scenario, active.projectId) : [];
  const projectName = scenario.projects.find((p) => p.id === active?.projectId)?.name ?? "";

  /** Same as the real handleSend: a suggested question is sent immediately. */
  const send = (text?: string) => {
    const content = (text ?? draft).trim();
    if (!active || !content) return;
    const id = active.id;
    setMessages((map) => ({ ...map, [id]: [...(map[id] ?? []), { id: `${id}-u${Date.now()}`, role: "user", content, timestamp: "now" }] }));
    if (text === undefined) setDraft("");
    window.setTimeout(() => {
      setMessages((map) => ({ ...map, [id]: [...(map[id] ?? []), { id: `${id}-a${Date.now()}`, role: "ai", content: `Simulated answer (prototype).`, timestamp: "now", sources: constellation ? [{ id: constellation.id, label: constellation.label }] : undefined }] }));
    }, 500);
  };

  const remove = (id: string) => {
    if (chats.length <= 1) return;
    setChats((list) => list.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(chats.find((c) => c.id !== id)?.id ?? "");
  };

  const tabs = (
    <ChatTabBar
      chats={chats}
      activeId={activeId}
      onSelect={setActiveId}
      onNew={() => setCreating(true)}
      onClose={(id) => {
        const label = chats.find((c) => c.id === id)?.label;
        remove(id);
        setNotice(`Current behaviour: "Close tab" deleted "${label}".`);
      }}
      onPin={(id) => setChats((list) => list.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))}
      onRename={(id, v) => setChats((list) => list.map((c) => (c.id === id ? { ...c, label: v } : c)))}
      projects={scenario.projects}
      constellations={scenario.constellations}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col" data-ux-view="current">
      {active ? (
        <RealChatHeader
          chat={active}
          scenario={scenario}
          tabs={tabs}
          onRename={(name) => setChats((list) => list.map((c) => (c.id === active.id ? { ...c, label: name } : c)))}
          onDelete={() => remove(active.id)}
          onSettings={() => setNotice("Opens the existing Constellation or Galaxy settings in the real app.")}
          onNote={setNotice}
        />
      ) : null}
      {active?.chatType === "constellation" && sameProject.length > 1 ? (
        <label className="mx-4 mt-2 flex w-fit items-center gap-1.5 luxia-type-caption sm:mx-8" style={{ color: "var(--luxia-text-muted)" }}>
          Change Constellation (from the Chat inspector)
          <select
            value={active.constellationId}
            onChange={(e) => {
              const next = e.target.value;
              setChats((list) => list.map((c) => (c.id === active.id ? { ...c, constellationId: next } : c)));
              if ((messages[active.id] ?? []).length) setNotice("Current behaviour: the same chat now uses another Constellation and keeps its earlier messages.");
            }}
            className="rounded-[8px] border px-2 py-1 luxia-type-caption"
            style={{ borderColor: "var(--luxia-border-default)" }}
            data-ux-current-change-constellation=""
          >
            {sameProject.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
      ) : null}
      {notice ? <Notice tone="warning" text={notice} onDismiss={() => setNotice(null)} /> : null}
      <Thread messages={active ? messages[active.id] ?? [] : []} chat={active} projectName={projectName} onPrompt={(p) => send(p)} />
      {active ? <Composer value={draft} onChange={setDraft} onSend={() => send()} chat={active} constellation={constellation} constellations={sameProject} focusKey={active.id} /> : null}
      {creating ? <CreateChatReplica scenario={scenario} onClose={() => setCreating(false)} onCreate={(p) => create(p)} /> : null}
    </div>
  );
}

// ── Shared chat body for C1 and C2: identical behaviour and polish ──

export function activeChatOf(api: ProposedApi): Chat | null {
  return api.m.chats.find((c) => c.id === api.m.activeChatId && c.projectId === api.m.projectId && !api.m.hidden.has(c.id)) ?? null;
}

function ChatBody({ api, scenario, role, onSetup }: { api: ProposedApi; scenario: Scenario; role: DemoRole; onSetup: () => void }) {
  const { m } = api;
  const projectName = scenario.projects.find((p) => p.id === m.projectId)?.name ?? "";
  const usable = usableConstellations(scenario, m.projectId);
  const active = activeChatOf(api);
  if (usable.length === 0) return <NotReadyPanel projectName={projectName} role={role} onSetup={onSetup} />;
  if (!active) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <LuxiaChatIcon size={28} color="var(--luxia-purple-50)" />
        <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>No open chats in {projectName}.</p>
        <Button type="button" variant="primary" size="compact" onClick={() => api.newChat()}><Plus size={14} aria-hidden />New chat</Button>
      </div>
    );
  }
  const unscoped = m.unscoped.has(active.id);
  const scope = unscoped ? null : scopeOf(active);
  const constellation = scope?.kind === "constellation" ? usable.find((c) => c.id === scope.id) ?? null : null;
  const messages = m.messages[active.id] ?? [];
  return (
    <>
      {m.notice ? <Notice text={m.notice} onDismiss={api.dismissNotice} /> : null}
      <Thread
        messages={messages}
        chat={active}
        projectName={projectName}
        onPrompt={(prompt) => { api.setDraft(active.id, prompt); api.send(active.id); }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2" style={{ paddingInline: LUXIA_PAGE_INTRO.padInline }} data-ux-scope-row="">
        <AnswersFrom
          scope={scope}
          constellations={usable}
          open={m.scopePickerFor === active.id}
          onOpenChange={(open) => api.openScopePicker(open ? active.id : null)}
          onChoose={(next) => api.changeScope(active.id, next)}
          hasMessages={messages.length > 0}
        />
        <PrototypeNote>Prototype: chats here aren't saved.</PrototypeNote>
      </div>
      <Composer
        value={m.drafts[active.id] ?? ""}
        onChange={(v) => api.setDraft(active.id, v)}
        onSend={(route) => api.send(active.id, route)}
        chat={active}
        constellation={constellation}
        constellations={usable}
        focusKey={active.id}
      />
    </>
  );
}

export function orderTabs(chats: Chat[]): Chat[] {
  return [...chats.filter((c) => c.chatType === "galaxy"), ...chats.filter((c) => c.chatType !== "galaxy" && c.pinned), ...chats.filter((c) => c.chatType !== "galaxy" && !c.pinned)];
}

/** History: every chat in this Project, including closed ones. Search and filters only narrow this list. */
function HistoryPopover({ api, scenario, onOpenProjectChats }: { api: ProposedApi; scenario: Scenario; onOpenProjectChats: () => void }) {
  const [open, setOpen] = useState(false);
  const search = useChatFilter(api.m.projectId);
  const all = orderTabs(api.m.chats.filter((c) => c.projectId === api.m.projectId && !api.m.unscoped.has(c.id)));
  const results = applyFilter(all, search.filter);
  const projectName = scenario.projects.find((p) => p.id === api.m.projectId)?.name ?? "";
  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) search.reset(); }}>
      <PopoverTrigger asChild>
        <Button type="button" variant="tertiary" size="compact" data-ux-history=""><History size={14} aria-hidden />History</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(420px,calc(100vw-24px))] p-3" data-ux-history-panel="">
        <p className="pb-1 luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>Chats in {projectName}</p>
        <ChatFilterBar compact filter={search.filter} onChange={search.setFilter} onReset={search.reset} chats={all} constellations={usableConstellations(scenario, api.m.projectId)} resultCount={results.length} total={all.length} />
        <div className="mt-2 max-h-[300px] overflow-y-auto border-t pt-1" style={{ borderColor: "var(--luxia-border-default)" }} role="list" aria-label="History results">
          {results.length === 0 ? <NoMatches onReset={search.reset} projectName={projectName} query={search.filter.query} /> : results.map((c) => {
            const con = scenario.constellations.find((x) => x.id === c.constellationId);
            const closed = api.m.hidden.has(c.id);
            return (
              <button key={c.id} type="button" role="listitem" onClick={() => { closed ? api.reopen(c.id) : api.selectChat(c.id); setOpen(false); search.reset(); }} className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-left outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:bg-[var(--luxia-opacity-brand-secondary-08)]" aria-current={c.id === api.m.activeChatId ? "true" : undefined} data-ux-history-item={c.id}>
                {c.chatType === "galaxy" ? <LuxiaGalaxyIcon size={13} color="var(--luxia-purple-60)" /> : <LuxiaChatIcon size={13} color="var(--luxia-purple-60)" />}
                <span className="min-w-0 flex-1 truncate luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)", fontWeight: c.id === api.m.activeChatId ? 700 : 500 }}>{c.chatType === "galaxy" ? `Galaxy · ${projectName}` : c.label}</span>
                {con ? <ConstellationSourceBadge type={con.type} /> : null}
                {closed ? <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>closed</span> : null}
              </button>
            );
          })}
        </div>
        <Button type="button" variant="link" size="compact" className="mt-2" onClick={() => { setOpen(false); search.reset(); onOpenProjectChats(); }} data-ux-history-project-chats="">See all in Project Chats</Button>
      </PopoverContent>
    </Popover>
  );
}

// ── B · C1: existing capsules + Project selector + History ──

export function C1View({ api, scenario, role }: { api: ProposedApi; scenario: Scenario; role: DemoRole }) {
  const [setup, setSetup] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const recent = useRecentProjects(api.m.projectId);
  const projectName = scenario.projects.find((p) => p.id === api.m.projectId)?.name ?? "";
  const tabs = orderTabs(api.visibleChats(api.m.projectId));
  const ready = usableConstellations(scenario, api.m.projectId).length > 0;
  const active = activeChatOf(api);
  const capsuleRow = (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap" data-ux-c1-row="">
      <div className="shrink-0">
        <ProjectSelector compact projects={scenario.projects} value={api.m.projectId} onChange={(id) => { setSetup(false); setNote(null); api.selectProject(id); }} role={role} readiness={(id) => usableConstellations(scenario, id).length} recentIds={recent} onOpenSetup={() => setSetup(true)} />
      </div>
      {ready ? (
        <div className="min-w-0 flex-1 basis-full sm:basis-auto" data-ux-capsules="">
          <ChatTabBar
            chats={tabs}
            activeId={api.m.activeChatId ?? ""}
            onSelect={api.selectChat}
            onNew={() => api.newChat()}
            onClose={api.close}
            onPin={api.togglePin}
            onRename={api.rename}
            projects={scenario.projects}
            constellations={scenario.constellations}
          />
        </div>
      ) : <div className="flex-1" />}
      {ready ? <div className="shrink-0"><HistoryPopover api={api} scenario={scenario} onOpenProjectChats={() => setNote(PROJECT_CHATS_NOTE)} /></div> : null}
    </div>
  );
  return (
    <div className="flex h-full min-h-0 flex-col" data-ux-view="c1">
      {setup ? (
        <>
          <ProjectPageHeader pageTypeLabel="PROJECT" title={`Set up knowledge in ${projectName}`} projectName={projectName} />
          <SimulatedSetup projectName={projectName} onBack={() => setSetup(false)} />
        </>
      ) : (
        <>
          {active ? (
            <RealChatHeader
              chat={active}
              scenario={scenario}
              tabs={capsuleRow}
              onRename={(name) => api.rename(active.id, name)}
              onDelete={() => api.remove(active.id)}
              onSettings={() => setSetup(true)}
              onNote={setNote}
            />
          ) : (
            <ProjectPageHeader title={ready ? `Chats in ${projectName}` : projectName} projectName={projectName} tabs={capsuleRow} />
          )}
          {note ? <Notice text={note} onDismiss={() => setNote(null)} /> : null}
          <ChatBody api={api} scenario={scenario} role={role} onSetup={() => setSetup(true)} />
        </>
      )}
    </div>
  );
}

// ── C · C2: Project-grouped sidebar (experimental; isolated prototype parts) ──

function SearchToggle({ open, active, onToggle }: { open: boolean; active: boolean; onToggle: () => void }) {
  return (
    <Button type="button" variant="tertiary" size="compact" onClick={onToggle} aria-expanded={open} data-ux-search-toggle="">
      <Search size={14} aria-hidden />Search
      {active ? <span className="size-1.5 rounded-full" style={{ background: "var(--luxia-purple-50)" }} aria-label="Filters active" /> : null}
    </Button>
  );
}

function RailItem({ chat, active, constellation, onSelect, onClose }: { chat: Chat; active: boolean; constellation?: Constellation; onSelect: () => void; onClose: () => void }) {
  return (
    <div className="group flex items-center rounded-[8px]" style={{ background: active ? "var(--luxia-opacity-brand-secondary-12)" : "transparent" }}>
      <button type="button" onClick={onSelect} aria-current={active ? "true" : undefined} className="flex min-w-0 flex-1 items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-left outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]" data-ux-rail-chat={chat.id}>
        {chat.chatType === "galaxy" ? <LuxiaGalaxyIcon size={13} color="var(--luxia-purple-60)" /> : <LuxiaChatIcon size={13} color="var(--luxia-purple-60)" />}
        <span className="min-w-0 flex-1 truncate luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)", fontWeight: active ? 700 : 500 }}>{chat.chatType === "galaxy" ? "Galaxy" : chat.label}</span>
        {constellation ? <ConstellationSourceBadge type={constellation.type} /> : null}
      </button>
      {chat.chatType !== "galaxy" ? <Button type="button" variant="ghost" size="iconCompact" onClick={onClose} aria-label={`Close ${chat.label}`}><X size={11} /></Button> : null}
    </div>
  );
}

function RailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <p className="px-2.5 pb-1 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function C2View({ api, scenario, role }: { api: ProposedApi; scenario: Scenario; role: DemoRole }) {
  const [setup, setSetup] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const recent = useRecentProjects(api.m.projectId);
  const projectName = scenario.projects.find((p) => p.id === api.m.projectId)?.name ?? "";
  const usable = usableConstellations(scenario, api.m.projectId);
  const allVisible = api.visibleChats(api.m.projectId);
  const search = useChatFilter(api.m.projectId);
  const filtering = search.open && isFiltering(search.filter);
  const results = applyFilter(allVisible, search.filter);
  const visible = filtering ? results : allVisible;
  const toggleSearch = () => { if (search.open) search.reset(); search.setOpen(!search.open); };
  const closed = api.m.chats.filter((c) => c.projectId === api.m.projectId && api.m.hidden.has(c.id));
  const groups = useMemo(() => usable.map((c) => ({ c, chats: visible.filter((x) => x.chatType === "constellation" && x.constellationId === c.id && !x.pinned && !api.m.unscoped.has(x.id)) })), [usable, visible, api.m.unscoped]);
  const unscoped = visible.filter((x) => api.m.unscoped.has(x.id));
  const item = (chat: Chat) => (
    <RailItem key={chat.id} chat={chat} active={chat.id === api.m.activeChatId} constellation={scenario.constellations.find((c) => c.id === chat.constellationId)} onSelect={() => { setSetup(false); setRailOpen(false); api.selectChat(chat.id); }} onClose={() => api.close(chat.id)} />
  );
  const rail = (
    <nav aria-label={`Chats in ${projectName}`} className="flex h-full w-[264px] shrink-0 flex-col border-r" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }} data-ux-rail="">
      <div className="border-b p-3" style={{ borderColor: "var(--luxia-border-default)" }}>
        <ProjectSelector projects={scenario.projects} value={api.m.projectId} onChange={(id) => { setSetup(false); api.selectProject(id); }} role={role} readiness={(id) => usableConstellations(scenario, id).length} recentIds={recent} onOpenSetup={() => { setRailOpen(false); setSetup(true); }} />
        {usable.length ? (
          <div className="mt-3 flex items-center gap-1">
            <Button type="button" variant="secondary" size="compact" className="flex-1" onClick={() => { setSetup(false); setRailOpen(false); api.newChat(); }} data-ux-rail-new=""><Plus size={14} aria-hidden />New chat</Button>
            <SearchToggle open={search.open} active={filtering} onToggle={toggleSearch} />
          </div>
        ) : null}
        {usable.length && search.open ? (
          <div className="mt-2">
            <ChatFilterBar compact filter={search.filter} onChange={search.setFilter} onReset={search.reset} chats={allVisible} constellations={usable} resultCount={results.length} total={allVisible.length} />
            {filtering && results.length === 0 ? <NoMatches onReset={search.reset} projectName={projectName} query={search.filter.query} /> : null}
          </div>
        ) : null}
      </div>
      <div className="luxia-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {usable.length ? (
          <>
            {visible.some((c) => c.pinned && c.chatType !== "galaxy") ? <RailGroup title="Pinned">{visible.filter((c) => c.pinned && c.chatType !== "galaxy").map(item)}</RailGroup> : null}
            {visible.some((c) => c.chatType === "galaxy") ? <RailGroup title="Galaxy">{visible.filter((c) => c.chatType === "galaxy").map(item)}</RailGroup> : null}
            {unscoped.length ? <RailGroup title="New">{unscoped.map(item)}</RailGroup> : null}
            {groups.filter((g) => g.chats.length).map((g) => <RailGroup key={g.c.id} title={g.c.label}>{g.chats.map(item)}</RailGroup>)}
            {closed.length ? (
              <RailGroup title="Closed">
                {closed.map((c) => <button key={c.id} type="button" onClick={() => api.reopen(c.id)} className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-left luxia-type-body-dense outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)]" style={{ color: "var(--luxia-text-muted)" }}><History size={12} />{c.label}</button>)}
              </RailGroup>
            ) : null}
          </>
        ) : <p className="px-2.5 pt-3 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>No chats yet. This Project needs knowledge first.</p>}
      </div>
    </nav>
  );
  const active = activeChatOf(api);
  const railToggle = <span className="md:hidden"><Button type="button" variant="tertiary" size="compact" onClick={() => setRailOpen(true)} aria-label="Show chats" data-ux-rail-toggle=""><Menu size={14} aria-hidden />Chats</Button></span>;
  return (
    <div className="relative flex h-full min-h-0" data-ux-view="c2">
      {railOpen ? <button type="button" aria-label="Close chats" className="absolute inset-0 z-20 md:hidden" style={{ background: "rgba(16,5,32,0.25)" }} onClick={() => setRailOpen(false)} /> : null}
      <div className={railOpen ? "absolute inset-y-0 left-0 z-30 flex h-full md:static md:z-auto" : "hidden h-full md:flex"}>{rail}</div>
      <div className="flex min-w-0 flex-1 flex-col">
        {setup ? (
          <>
            <ProjectPageHeader pageTypeLabel="PROJECT" title={`Set up knowledge in ${projectName}`} projectName={projectName} tabs={railToggle} />
            <SimulatedSetup projectName={projectName} onBack={() => setSetup(false)} />
          </>
        ) : (
          <>
            {active ? (
              <RealChatHeader chat={active} scenario={scenario} tabs={railToggle} onRename={(name) => api.rename(active.id, name)} onDelete={() => api.remove(active.id)} onSettings={() => setSetup(true)} onNote={setNote} />
            ) : <ProjectPageHeader title={projectName} projectName={projectName} tabs={railToggle} />}
            {note ? <Notice text={note} onDismiss={() => setNote(null)} /> : null}
            <ChatBody api={api} scenario={scenario} role={role} onSetup={() => setSetup(true)} />
          </>
        )}
      </div>
    </div>
  );
}
