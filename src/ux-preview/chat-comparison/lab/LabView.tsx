import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { History, Plus, Search } from "lucide-react";
import { ChatTabBar } from "@/app/app-sections/ChatContentSection";
import type { Chat } from "@/app/app-sections/appSectionShared";
import { LUXIA_PAGE_INTRO } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { useIsMobile } from "@/app/components/ui/use-mobile";
import type { GalaxyMatchedConstellation } from "@/app/features/galaxy";
import { HomeStartPanel } from "@/app/features/home/HomeStartPanel";
import { LeftNav, type LeftNavChatPreview } from "@/app/features/navigation/LeftNav";
import { LuxiaChatIcon, LuxiaHomeIcon } from "@/assets/icons";
import type { DemoRole, Scenario } from "../mockData";
import { scopeOf, usableConstellations, useProposedModel, type ProposedApi, type Scope } from "../model";
import { AnswersFrom, Composer, NotReadyPanel, ProjectSelector, PrototypeNote, SimulatedSetup, Thread, useRecentProjects } from "../shared";
import { Notice, ProjectPageHeader, RealChatHeader, activeChatOf, orderTabs } from "../views";
import { LabRightPanel, type KnowledgeMode } from "./LabPanel";
import { CurrentProjectControl, FindChatsButton } from "./FinalControls";
import { ProjectChatsPage } from "./ProjectChatsPage";
import { CapsuleToolbarA, ChatToolbarC, FindChatsHeaderAction, ProtoChatHeader, SidebarChatsPanelLink, type LayoutOption } from "./LayoutOptions";
import "./final.css";
import { OverlayFinder, SidebarFinder, finderChats, useChatFinder, type FinderPresentation } from "./ChatFinder";
import { ComposerContextRow, KnowledgeContextSelect, StandaloneContextRow } from "./ComposerContext";

export type ProjectMode = "P1" | "P2";
export type CapsuleMode = "project" | "all";
type Route = { mode: "auto" | "manual"; pending: GalaxyMatchedConstellation | null };
type Page = "chat" | "project-chats" | "setup";

const SHORT = (name: string) => `P${name.replace(/\D/g, "").slice(-2) || "?"}`;

/**
 * Realistic lab: real LeftNav (Project switcher + Chats rail), real Chat header,
 * real capsules, real composer, real Constellation inspector / Galaxy panel,
 * all driven by in-memory prototype state. Toggles compare Project selection
 * (P1/P2), capsule scope and knowledge selection (A/B/C).
 */
export function LabView({ scenario, role, projectMode, capsuleMode, knowledgeMode, start, onHome, final = false, layout, finder }: {
  /** D2 only: Chat Finder presentation to compare. */
  finder?: FinderPresentation;
  final?: boolean;
  /** Layout options A/B/C for Project switching + chat discovery (FINAL behaviour otherwise). */
  layout?: LayoutOption;
  scenario: Scenario;
  role: DemoRole;
  projectMode: ProjectMode;
  capsuleMode: CapsuleMode;
  knowledgeMode: KnowledgeMode;
  start?: { projectId: string; question: string };
  onHome?: () => void;
}) {
  const api = useProposedModel(scenario, start?.projectId);
  useEffect(() => { if (start) api.newChat(start.question, start.projectId); /* once */ }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <LabShell api={api} scenario={scenario} role={role} projectMode={projectMode} capsuleMode={capsuleMode} knowledgeMode={knowledgeMode} onHome={onHome} final={final} layout={layout} finder={finder} />;
}

function LabShell({ api, scenario, role, projectMode, capsuleMode, knowledgeMode, onHome, final, layout, finder }: {
  finder?: FinderPresentation;
  final: boolean;
  layout?: LayoutOption;
  api: ProposedApi;
  scenario: Scenario;
  role: DemoRole;
  projectMode: ProjectMode;
  capsuleMode: CapsuleMode;
  knowledgeMode: KnowledgeMode;
  onHome?: () => void;
}) {
  const isMobile = useIsMobile();
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [page, setPage] = useState<Page>("chat");
  const [pageInit, setPageInit] = useState<{ query: string; advanced: boolean; key: number }>({ query: "", advanced: false, key: 0 });
  const openChatsPage = (query = "", advanced = false) => { setPageInit((p) => ({ query, advanced, key: p.key + 1 })); setPage("project-chats"); setNavOpen(false); };
  const [note, setNote] = useState<string | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [panelMenuOpen, setPanelMenuOpen] = useState(false);
  const [routes, setRoutes] = useState<Record<string, Route>>({});
  const recent = useRecentProjects(api.m.projectId);

  const { m } = api;
  const project = scenario.projects.find((p) => p.id === m.projectId) ?? scenario.projects[0];
  const usable = usableConstellations(scenario, m.projectId);
  const active = activeChatOf(api);
  const ready = usable.length > 0;
  const projectRole = role === "owner-manager" ? "Project Owner" : "Analyst";

  // Capsules: open chats of this Project, or all open chats with a Project tag.
  const projectTabs = orderTabs(api.visibleChats(m.projectId));
  const allOpen = useMemo(() => m.chats.filter((c) => !m.hidden.has(c.id)), [m.chats, m.hidden]);
  const capsules: Chat[] = capsuleMode === "project"
    ? projectTabs
    : allOpen.map((c) => (c.chatType === "galaxy" ? c : { ...c, label: `${SHORT(scenario.projects.find((p) => p.id === c.projectId)?.name ?? "")} · ${c.label}` }));

  // Sidebar rail: every chat of this Project, open first-class; closed ones marked.
  const order = useMemo(() => m.chats.map((c) => c.id), [m.chats]);
  const railChats: LeftNavChatPreview[] = m.chats
    .filter((c) => c.projectId === m.projectId && !m.unscoped.has(c.id))
    .map((c, i) => ({
      id: c.id,
      label: `${c.chatType === "galaxy" ? (final ? "Galaxy" : `Galaxy · ${project.name}`) : c.label}${m.hidden.has(c.id) ? " (closed)" : ""}`,
      chatSource: c.chatType,
      constellationId: c.constellationId,
      lastOpenedTimestamp: Date.now() - i * 60_000,
      pinned: c.pinned,
    }));

  const scope: Scope | null = active ? (m.unscoped.has(active.id) ? null : scopeOf(active)) : null;
  const messages = active ? m.messages[active.id] ?? [] : [];
  const route = (active && routes[active.id]) || { mode: "auto" as const, pending: null };
  const setRoute = (next: Route) => { if (active) setRoutes((r) => ({ ...r, [active.id]: next })); };
  const constellation = scope?.kind === "constellation" ? usable.find((c) => c.id === scope.id) ?? null : null;

  // D and D2 share every state and handler; D2 only changes the presentation.
  const isComposerLayout = layout === "D" || layout === "D2";
  const minimal = layout === "D2";
  const sameScope = (a: Scope | null, b: Scope) => Boolean(a && a.kind === b.kind && (a.kind === "galaxy" || (b.kind === "constellation" && a.id === b.id)));
  const choose = (next: Scope) => {
    // Option D: re-choosing the knowledge a chat with messages already uses must not spawn a duplicate chat.
    if (isComposerLayout && active && messages.length > 0 && sameScope(scope, next)) { api.openScopePicker(null); setPanelMenuOpen(false); return; }
    if (active) api.changeScope(active.id, next);
    setPanelMenuOpen(false);
  };
  const composerRef = useRef<HTMLDivElement>(null);
  // Header crowding is decided by the chat column's real width (inspector open or not), not the window.
  const mainColRef = useRef<HTMLDivElement>(null);
  const [mainWidth, setMainWidth] = useState(1000);
  useEffect(() => {
    const el = mainColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setMainWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const headerRowRef = useRef<HTMLDivElement>(null);
  const splitHeaderActive = layout === "D2" && page === "chat";
  const [headerWidth, setHeaderWidth] = useState(0);
  useEffect(() => {
    const el = headerRowRef.current;
    if (!el) { setHeaderWidth(0); return; }
    const ro = new ResizeObserver(([entry]) => setHeaderWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [splitHeaderActive]);
  const headerCompact = (headerWidth || mainWidth) < 600;
  // Chat Finder (D2): one state, two presentations; never changes Project, knowledge or capsules.
  const finderState = useChatFinder();
  const finderMode: FinderPresentation | null = layout === "D2" ? finder ?? "sidebar" : null;
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [finderFocus, setFinderFocus] = useState(0);
  const openChat = (id: string) => { api.openChat(id); setPage("chat"); setNavOpen(false); setNote(null); };
  const switchProject = (id: string) => { api.selectProject(id); setPage("chat"); setNavOpen(false); setNote(null); };

  // Knowledge entry points per option.
  const panelVisible = !isMobile && page === "chat" && Boolean(active) && ready;
  const panelInteractive = knowledgeMode !== "B" && active?.chatType !== "galaxy";
  const composerVariant: "editable" | "indicator" = knowledgeMode === "A" && panelVisible && !panelCollapsed && active?.chatType !== "galaxy" ? "indicator" : "editable";
  const openPanelMenu = () => { setPanelCollapsed(false); setPanelMenuOpen(true); };

  const tabBar = (
    <ChatTabBar
      chats={capsules}
      activeId={m.activeChatId ?? ""}
      onSelect={openChat}
      onNew={() => { api.newChat(); setPage("chat"); }}
      onClose={api.close}
      onPin={api.togglePin}
      onRename={(id, v) => api.rename(id, v.replace(/^P\d+ · /, ""))}
      projects={final ? scenario.projects.map((p) => ({ ...p, name: "Galaxy" })) : scenario.projects}
      constellations={scenario.constellations}
    />
  );
  const projectChatCount = m.chats.filter((c) => c.projectId === m.projectId && !m.unscoped.has(c.id)).length;
  const finalBar = (
    <div className="flex min-w-0 flex-wrap items-end gap-x-4 gap-y-2" data-ux-final-bar="">
      <div className="min-w-0 shrink-0">
        <CurrentProjectControl projects={scenario.projects} value={m.projectId} roleLabel={projectRole} readiness={(id) => usableConstellations(scenario, id).length} onSwitch={switchProject} />
      </div>
      {ready ? <div className="ml-auto shrink-0 md:order-3"><FindChatsButton count={projectChatCount} onClick={() => openChatsPage()} /></div> : null}
      {ready ? <div className="order-3 min-w-0 basis-full md:order-2 md:basis-0 md:flex-1" data-ux-capsules="">{tabBar}</div> : null}
    </div>
  );

  const projectChats = m.chats.filter((c) => c.projectId === m.projectId && !m.unscoped.has(c.id));
  const finderList = finderChats(m.chats, m.projectId, usable, m.unscoped);
  // Most recently opened first: the active chat, then the capsule order, then the rest.
  const recentOrder = [m.activeChatId ?? "", ...projectTabs.map((c) => c.id), ...order].filter(Boolean);
  const openFinder = () => {
    if (finderMode === "overlay") { setOverlayOpen(true); setFinderFocus((k) => k + 1); return; }
    const openPanel = () => {
      const btn = document.querySelector<HTMLButtonElement>('button[aria-label="Open Chats panel"]');
      if (btn) btn.click();
      window.setTimeout(() => setFinderFocus((k) => k + 1), 80);
    };
    if (isMobile) { setNavOpen(true); window.setTimeout(openPanel, 260); } else openPanel();
  };
  const finderProps = {
    state: finderState,
    chats: finderList,
    constellations: usable,
    hidden: m.hidden,
    activeChatId: m.activeChatId,
    recentOrder,
    onOpen: (id: string) => { openChat(id); setOverlayOpen(false); },
    onOpenPage: () => { setOverlayOpen(false); openChatsPage(finderState.filter.query, finderState.advanced > 0); },
    autoFocusKey: finderFocus,
  };
  const projectControl = (appearance: "header" | "context" | "composer" | "inline") => (
    <CurrentProjectControl appearance={appearance} projects={scenario.projects} value={m.projectId} roleLabel={projectRole} readiness={(id) => usableConstellations(scenario, id).length} onSwitch={switchProject} />
  );
  const layoutRow = layout === "D2"
    // D2: the capsule row holds ONLY the real capsule bar (capsules + New Chat).
    ? (ready ? <div className="min-w-0" data-ux-capsules="" data-ux-d2-capsule-row="">{tabBar}</div> : null)
    : layout === "A" || isComposerLayout
    ? (ready ? <CapsuleToolbarA capsules={tabBar} count={finderMode ? finderList.length : projectChatCount} label={finderMode ? "Find chats" : "All chats"} onAllChats={() => (finderMode ? openFinder() : openChatsPage())} /> : null)
    : layout === "B"
      ? (ready ? <div className="min-w-0" data-ux-capsules="" data-ux-layout-b-row="">{tabBar}</div> : null)
      : layout === "C"
        ? (ready ? (
          <div className="min-w-0" data-ux-layout-c-rows="">
            <div className="min-w-0" data-ux-capsules="">{tabBar}</div>
            <ChatToolbarC projectName={project.name} chats={projectChats} constellations={usable} hidden={m.hidden} activeChatId={m.activeChatId} onOpen={openChat} onOpenPage={openChatsPage} />
          </div>
        ) : null)
        : null;
  const capsuleRow = layout ? layoutRow : final ? finalBar : ready ? (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap" data-ux-lab-capsule-row="">
      {projectMode === "P2" ? (
        <div className="shrink-0" data-ux-lab-chat-project-switcher="">
          <ProjectSelector compact projects={scenario.projects} value={m.projectId} onChange={switchProject} role={role} readiness={(id) => usableConstellations(scenario, id).length} recentIds={recent} onOpenSetup={() => setPage("setup")} />
        </div>
      ) : null}
      <div className="min-w-0 flex-1 basis-full sm:basis-auto" data-ux-capsules="">
        <ChatTabBar
          chats={capsules}
          activeId={m.activeChatId ?? ""}
          onSelect={openChat}
          onNew={() => { api.newChat(); setPage("chat"); }}
          onClose={api.close}
          onPin={api.togglePin}
          onRename={(id, v) => api.rename(id, v.replace(/^P\d+ · /, ""))}
          projects={final ? scenario.projects.map((p) => ({ ...p, name: "Galaxy" })) : scenario.projects}
          constellations={scenario.constellations}
        />
      </div>
    </div>
  ) : projectMode === "P2" ? (
    <div className="shrink-0" data-ux-lab-chat-project-switcher="">
      <ProjectSelector compact projects={scenario.projects} value={m.projectId} onChange={switchProject} role={role} readiness={(id) => usableConstellations(scenario, id).length} recentIds={recent} onOpenSetup={() => setPage("setup")} />
    </div>
  ) : null;

  // Returns the page header separately so D2 can lay it out like the real Chat:
  // heading + breadcrumb + actions + capsule row span the full width; the inspector starts below.
  const main = ((): { header: ReactNode; body: ReactNode } => {
    if (page === "setup") {
      return { header: null, body: (
        <>
          <ProjectPageHeader pageTypeLabel="PROJECT" title={`Set up knowledge in ${project.name}`} projectName={project.name} />
          <SimulatedSetup projectName={project.name} onBack={() => setPage("chat")} />
        </>
      ) };
    }
    if (page === "project-chats") {
      return { header: null, body: (
        <ProjectChatsPage
          key={pageInit.key}
          initialQuery={pageInit.query}
          initialAdvanced={pageInit.advanced}
          projectName={project.name}
          chats={m.chats.filter((c) => c.projectId === m.projectId && !m.unscoped.has(c.id))}
          constellations={usable}
          hidden={m.hidden}
          activeChatId={m.activeChatId}
          onOpen={openChat}
          onNewChat={() => { api.newChat(); setPage("chat"); }}
          onHome={() => onHome?.()}
          order={order}
          backToChat={active ? { label: active.chatType === "galaxy" ? "Galaxy" : active.label, onClick: () => setPage("chat") } : undefined}
        />
      ) };
    }
    const headerEl = (
        active && (layout === "A" || layout === "C" || layout === "D2") ? (
          <ProtoChatHeader
            chat={active}
            scenario={scenario}
            tabs={capsuleRow}
            headerAction={layout === "A" ? projectControl("header") : layout === "D2" && ready ? (
              // Narrow column: Constellation chats move it into ⋯; Galaxy (no ⋯ menu) keeps an icon button.
              headerCompact && active.chatType !== "galaxy" ? undefined : <FindChatsHeaderAction iconOnly={headerCompact} onClick={() => openFinder()} />
            ) : undefined}
            leadingMenuItems={layout === "D2" && ready && headerCompact ? [{ id: "find-chats", label: "Find chats", icon: <Search size={15} strokeWidth={1.8} aria-hidden />, onSelect: () => window.setTimeout(() => openFinder(), 0) }] : []}
            context={layout === "C" ? projectControl("context") : undefined}
            onRename={(name) => api.rename(active.id, name)}
            onDelete={() => api.remove(active.id)}
            onSettings={() => setPage("setup")}
            onNote={setNote}
          />
        ) : active ? (
          <RealChatHeader chat={active} scenario={scenario} tabs={capsuleRow} onRename={(name) => api.rename(active.id, name)} onDelete={() => api.remove(active.id)} onSettings={() => setPage("setup")} onNote={setNote} />
        ) : (
          <ProjectPageHeader
            title={ready ? `Chats in ${project.name}` : project.name}
            projectName={project.name}
            tabs={capsuleRow}
            action={layout === "A" ? projectControl("header") : layout === "D2" && ready ? <FindChatsHeaderAction iconOnly={headerCompact} onClick={() => openFinder()} /> : undefined}
            context={layout === "C" ? projectControl("context") : undefined}
          />
        )
    );
    return { header: headerEl, body: (
      <>
        {note ? <Notice text={note} onDismiss={() => setNote(null)} /> : null}
        {m.notice ? <Notice text={m.notice} onDismiss={api.dismissNotice} /> : null}
        {!ready ? <NotReadyPanel projectName={project.name} role={role} onSetup={() => setPage("setup")} /> : !active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <LuxiaChatIcon size={28} color="var(--luxia-purple-50)" />
            <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>No open chats in {project.name}.</p>
            <Button type="button" variant="primary" size="compact" onClick={() => api.newChat()}><Plus size={14} aria-hidden />New chat</Button>
          </div>
        ) : (
          <>
            <Thread messages={messages} chat={active} projectName={project.name} onPrompt={(p) => { api.setDraft(active.id, p); api.send(active.id); if (m.unscoped.has(active.id) && composerVariant === "indicator") openPanelMenu(); }} />
            {isComposerLayout ? null : <div className="flex flex-wrap items-center justify-between gap-2" style={{ paddingInline: LUXIA_PAGE_INTRO.padInline }} data-ux-scope-row="">
              <AnswersFrom
                scope={scope}
                constellations={usable}
                open={m.scopePickerFor === active.id && composerVariant === "editable"}
                onOpenChange={(o) => api.openScopePicker(o ? active.id : null)}
                onChoose={choose}
                hasMessages={messages.length > 0}
                chatLabel={active.label}
                variant={composerVariant}
                onIndicatorClick={openPanelMenu}
                indicatorHint="Change knowledge in the Constellation panel"
              />
              <PrototypeNote>Prototype: chats here aren't saved.</PrototypeNote>
            </div>}
            <div ref={composerRef} className="min-w-0" data-ux-d-composer={isComposerLayout ? "" : undefined} data-ux-d-variant={layout}>
            <Composer
              value={m.drafts[active.id] ?? ""}
              onChange={(v) => api.setDraft(active.id, v)}
              onSend={(r) => { api.send(active.id, r); if (m.unscoped.has(active.id) && composerVariant === "indicator") openPanelMenu(); }}
              chat={active}
              constellation={constellation}
              constellations={usable}
              focusKey={active.id}
              route={route}
              onRouteChange={setRoute}
            />
            </div>
            {isComposerLayout ? (
              <ComposerContextRow
                key={layout}
                variant={minimal ? "d2" : "d"}
                composerRef={composerRef}
                chatKey={active.id}
                project={projectControl(minimal ? "inline" : "composer")}
                knowledge={(
                  <KnowledgeContextSelect
                    scope={scope}
                    constellations={usable}
                    open={m.scopePickerFor === active.id}
                    onOpenChange={(o) => api.openScopePicker(o ? active.id : null)}
                    onChoose={choose}
                    hasMessages={messages.length > 0}
                    chatLabel={active.label}
                    minimal={minimal}
                  />
                )}
              />
            ) : null}
          </>
        )}
        {isComposerLayout && !ready ? (
          <StandaloneContextRow
            variant={minimal ? "d2" : "d"}
            project={projectControl(minimal ? "inline" : "composer")}
            knowledge={(
              <KnowledgeContextSelect
                scope={null}
                constellations={[]}
                open={false}
                onOpenChange={() => undefined}
                onChoose={() => undefined}
                hasMessages={false}
                minimal={minimal}
                disabledText={minimal ? (role === "owner-manager" ? "No knowledge yet" : "No knowledge yet · ask a Project Owner") : "No knowledge set up yet"}
                emptyAction={minimal && role === "owner-manager" ? <button type="button" className="ux-d2-value" onClick={() => setPage("setup")} data-ux-d2-setup="">Set up knowledge</button> : undefined}
              />
            )}
          />
        ) : null}
      </>
    ) };
  })();
  // D2 reproduces the real Chat structure: full-width heading + capsule row, inspector below it.
  const splitHeader = layout === "D2" && page === "chat";

  // FINAL only: proposed keyboard behaviour for the real Projects panel — focus moves to
  // "Search Projects" when it opens and back to the switcher when it closes.
  useEffect(() => {
    if (!final) return;
    let wasOpen = false;
    const observer = new MutationObserver(() => {
      const panel = document.querySelector<HTMLElement>('[role="navigation"][aria-label="Projects"]');
      if (panel && !wasOpen) {
        wasOpen = true;
        panel.querySelector<HTMLInputElement>('input[placeholder="Search Projects"]')?.focus();
      } else if (!panel && wasOpen) {
        wasOpen = false;
        const switcher = document.querySelector<HTMLElement>('button[aria-label^="Current Project:"]');
        if (switcher && (document.activeElement === document.body || !document.activeElement)) switcher.focus();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [final]);

  // When knowledge is still unchosen and the panel is the primary control (A), point to it.
  useEffect(() => {
    if (knowledgeMode === "A" && active && m.unscoped.has(active.id) && panelVisible) setPanelMenuOpen(true);
  }, [knowledgeMode, active?.id, panelVisible]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (composerVariant === "indicator" && m.scopePickerFor) { api.openScopePicker(null); openPanelMenu(); }
  }, [m.scopePickerFor, composerVariant]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex h-full min-h-0" data-ux-view="lab" data-ux-final={final && (!layout || layout === "B") ? "" : undefined} data-ux-layout={layout} data-ux-finder={finderMode ?? undefined} data-ux-lab-modes={`${projectMode}-${capsuleMode}-${knowledgeMode}`}>
      {isMobile && !navOpen ? (
        <button type="button" onClick={() => setNavOpen(true)} aria-label="Open navigation" className="absolute left-3 top-3 z-[45] flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--luxia-surface)", border: "1px solid rgba(28, 19, 54, 0.12)", boxShadow: "0 4px 14px rgba(8, 5, 18, 0.16)", color: "var(--luxia-brand-primary)" }} data-ux-lab-open-nav="">
          <LuxiaHomeIcon size={16} color="currentColor" />
        </button>
      ) : null}
      {finderMode === "sidebar" && ready ? <SidebarFinder {...finderProps} /> : null}
      {finderMode === "overlay" && ready ? <OverlayFinder {...finderProps} open={overlayOpen} onClose={() => setOverlayOpen(false)} returnFocusTo={() => document.querySelector<HTMLElement>("[data-ux-find-chats-entry]")} /> : null}
      {finderMode === "overlay" && ready ? <SidebarChatsPanelLink count={finderList.length} onOpenPage={() => openFinder()} /> : null}
      {(layout === "B" || (isComposerLayout && !finderMode)) && ready ? <SidebarChatsPanelLink count={projectChatCount} onOpenPage={(q) => openChatsPage(q)} /> : null}
      <LeftNav
        collapsed={navCollapsed}
        onToggleCollapsed={() => setNavCollapsed((v) => !v)}
        isMobileDrawer={isMobile}
        mobileOpen={navOpen}
        onMobileClose={() => setNavOpen(false)}
        projectId={m.projectId}
        projectLabel={project.name}
        showProjectContext
        showGalaxy={ready}
        activeProjectSection={page === "project-chats" ? "chats" : null}
        activeChatId={page === "chat" ? m.activeChatId : null}
        projectChats={railChats}
        projectConstellations={usable.map((c, i) => ({ id: c.id, label: c.label, type: c.type, updatedAtTimestamp: Date.now() - i * 3_600_000 }))}
        switchableProjects={scenario.projects.map((p) => ({ id: p.id, label: p.name, projectRole }))}
        chatTotalCount={railChats.length}
        constellationTotalCount={usable.length}
        dashboardTotalCount={0}
        vidgetTotalCount={0}
        pipelineTotalCount={0}
        onHomeClick={() => onHome?.()}
        onProjectSectionClick={(section) => {
          if (section === "chats") { openChatsPage(); return; }
          if (section === "galaxy") { const galaxy = m.chats.find((c) => c.projectId === m.projectId && c.chatType === "galaxy"); if (galaxy) openChat(galaxy.id); return; }
          setNote(`"${section}" opens the existing Project page in the real app (not simulated here).`);
        }}
        onSwitchProject={switchProject}
        onOpenChat={openChat}
        onOpenConstellation={() => setPage("setup")}
        prototypeUser={{ id: "user-05", name: "User name 05", email: "user05@luxia.example", orgRole: role === "owner-manager" ? "Admin" : "Member" }}
        prototypeProjectRole={projectRole}
      />
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: "var(--luxia-background, #fff)" }} data-ux-lab-main="">
        {splitHeader ? <div ref={headerRowRef} className="min-w-0 shrink-0" data-ux-full-width-header="">{main.header}</div> : null}
        <div className="flex min-h-0 flex-1">
          <div ref={mainColRef} className="flex min-w-0 flex-1 flex-col">{splitHeader ? main.body : <>{main.header}{main.body}</>}</div>
          {panelVisible && active ? (
            <div className="hidden h-full lg:flex">
              <LabRightPanel
                mode={knowledgeMode}
                chatType={active.chatType}
                chatLabel={active.label}
                scope={scope}
                hasMessages={messages.length > 0}
                projectId={m.projectId}
                projectName={project.name}
                constellations={usable}
                canConfigure={role === "owner-manager"}
                canEditKnowledge={role === "owner-manager"}
                collapsed={panelCollapsed}
                onToggleCollapsed={() => setPanelCollapsed((v) => !v)}
                menuOpen={panelMenuOpen && panelInteractive}
                onMenuOpenChange={setPanelMenuOpen}
                onChoose={choose}
                onChangeInComposer={() => api.openScopePicker(active.id)}
                onOpenSettings={() => setPage("setup")}
                route={route}
                onRouteChange={setRoute}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Real Home composer (unchanged) feeding the lab: the question arrives as an unsent draft. */
export function HomeToLab({ scenario, role, projectMode, capsuleMode, knowledgeMode, final = false, layout }: { scenario: Scenario; role: DemoRole; projectMode: ProjectMode; capsuleMode: CapsuleMode; knowledgeMode: KnowledgeMode; final?: boolean; layout?: LayoutOption }) {
  const [projectId, setProjectId] = useState(scenario.startProjectId);
  const [start, setStart] = useState<{ projectId: string; question: string } | null>(null);
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { setStart(null); }, [scenario]);
  if (start) {
    return <LabView key={`${start.projectId}-${start.question}`} scenario={scenario} role={role} projectMode={projectMode} capsuleMode={capsuleMode} knowledgeMode={knowledgeMode} start={start} onHome={() => setStart(null)} final={final} layout={layout} />;
  }
  return (
    <div className="relative flex h-full min-h-0" data-ux-view="home-lab">
      {isMobile && !navOpen ? (
        <button type="button" onClick={() => setNavOpen(true)} aria-label="Open navigation" className="absolute left-3 top-3 z-[45] flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--luxia-surface)", border: "1px solid rgba(28, 19, 54, 0.12)", color: "var(--luxia-brand-primary)" }}>
          <LuxiaHomeIcon size={16} color="currentColor" />
        </button>
      ) : null}
      <LeftNav collapsed={false} onToggleCollapsed={() => undefined} isMobileDrawer={isMobile} mobileOpen={navOpen} onMobileClose={() => setNavOpen(false)} homeActive prototypeUser={{ id: "user-05", name: "User name 05", email: "user05@luxia.example", orgRole: "Admin" }} />
      <div className="luxia-scrollbar min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8" style={{ background: "var(--luxia-background, #fff)" }}>
        <p className="mb-3 max-w-[70ch] luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          The real Home composer, unchanged. Choose <strong>Chat in a Project</strong>, pick a Project, type a question and send: the full Chat opens with your question as an unsent draft.
        </p>
        <div className="mx-auto max-w-[920px]">
          <HomeStartPanel
            projects={scenario.projects}
            selectedProjectId={projectId}
            onSelectProject={setProjectId}
            recentProjectIds={[]}
            onAsk={(pid, question) => setStart({ projectId: pid, question })}
            continueItems={[]}
            onViewAllWork={() => undefined}
            canCreateProject
            onNewProject={() => undefined}
            assistant={{
              sessionKey: `ux-preview-lab-${scenario.id}-${role}`,
              abilities: { canCreateProject: true, canAddDataSources: role === "owner-manager", hasProjects: scenario.projects.length > 0 },
              actions: {},
            }}
          />
        </div>
      </div>
    </div>
  );
}
