import { useState, type ReactNode } from "react";
import { ROLE_LABEL, SCENARIOS, type DemoRole, type ScenarioId } from "./mockData";
import { useProposedModel } from "./model";
import { HomeDemo } from "./HomeDemo";
import { C1View, C2View, CurrentView } from "./views";
import type { KnowledgeMode } from "./lab/LabPanel";
import { HomeToLab, LabView, type CapsuleMode, type ProjectMode } from "./lab/LabView";
import type { LayoutOption } from "./lab/LayoutOptions";
import type { FinderPresentation } from "./lab/ChatFinder";

type ViewId = "layouts" | "home-layouts" | "final" | "home-final" | "lab" | "home-lab" | "current" | "c1" | "c2" | "home-current" | "home-proposed";
type LabModes = { project: ProjectMode; capsules: CapsuleMode; knowledge: KnowledgeMode };

const VIEWS: Array<{ id: ViewId; label: string; hint: string }> = [
  { id: "layouts", label: "◇ Layout options A–D", hint: "Compare where Project switching and chat discovery live. Same Project state, same chat list, same filters in every option. FINAL is unchanged until approved." },
  { id: "home-layouts", label: "◇ Home → Layout option", hint: "Real Home composer → the selected layout option, with your question as an unsent draft." },
  { id: "final", label: "★ FINAL · Recommended UX", hint: "Recommended UX. Current Project (dropdown) and Find chats sit on the chat bar; knowledge is chosen in the right panel (Answers from); quick search also in the sidebar Chats panel." },
  { id: "home-final", label: "★ Home → Final", hint: "Real Home composer → the recommended Chat, with your question as an unsent draft." },
  { id: "lab", label: "Lab · real layout", hint: "Real sidebar (Project switcher + Chats rail), real header, capsules, composer, Constellation inspector and Galaxy panel, on prototype data. Use the toggles below to compare options." },
  { id: "home-lab", label: "Home → Lab", hint: "Real Home composer → the lab Chat with your question as an unsent draft." },
  { id: "current", label: "A · Current Chat", hint: "Baseline: the real tab bar, messages and composer with today's behaviour. No search inside Chat today; search exists on the Project Chats page and Home Chats & Galaxies." },
  { id: "c1", label: "B · C1 Existing tabs + Project", hint: "Same Chat, plus a Project selector, Project-scoped tabs, inline New chat and a scope chip." },
  { id: "c2", label: "C · C2 Grouped sidebar", hint: "Experimental: tabs replaced by a Project-grouped rail (isolated prototype parts)." },
  { id: "home-current", label: "Home → Chat · today", hint: "Real Home composer → Create Chat dialog → Chat with a draft." },
  { id: "home-proposed", label: "Home → Chat · proposed", hint: "Real Home composer → Chat with a draft and the scope confirmed in Chat." },
];

function Segmented<T extends string>({ label, value, options, onChange, testId }: { label: string; value: T; options: Array<{ id: T; label: string }>; onChange: (v: T) => void; testId: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex max-w-full flex-wrap gap-1" data-ux-control={testId}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className="rounded-full border px-3 py-1 luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={value === o.id
            ? { background: "var(--luxia-purple-70)", borderColor: "var(--luxia-purple-70)", color: "var(--luxia-text-inverse)" }
            : { background: "var(--luxia-surface)", borderColor: "var(--luxia-border-default)", color: "var(--luxia-text-secondary)" }}
          data-ux-option={o.id}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** One instance per view + scenario + role, so each comparison starts from the same data. */
const LAYOUTS: Array<{ id: LayoutOption; label: string; hint: string }> = [
  { id: "A", label: "A · Switcher in page header", hint: "A: Project switcher in the header action area (before Constellation Settings and ⋯). Capsules keep their own row; “All chats” closes the capsule toolbar." },
  { id: "B", label: "B · Sidebar only", hint: "B: Project switcher stays in the sidebar. Chat discovery lives in the sidebar Chats item and its panel (search + “All chats · filters”). Capsule row = capsules + New Chat only." },
  { id: "C", label: "C · Title context + Chat toolbar", hint: "C: Project selector in the header context area under the breadcrumb. A separate compact Chat toolbar under the capsules: quick search + “All chats & filters”." },
  { id: "D", label: "D — Composer Context", hint: "D: PROJECT | ANSWERS FROM | RESPONSE in one labelled row under the typing bar (the real composer's own Standard control is the third cell). Header and capsules unchanged; “All chats” ends the capsule row; sidebar Chats panel links to the full Chats page." },
  { id: "D2", label: "D2 — Minimal Composer Context", hint: "D2: same as D (same state, menus and rules), presented as one quiet line under the typing bar: Project: … › Answers from: … ··· Standard ▾. Labels always visible; no borders at rest." },
];

function Stage({ view, scenarioId, role, modes, layout, finder }: { view: ViewId; scenarioId: ScenarioId; role: DemoRole; modes: LabModes; layout: LayoutOption; finder: FinderPresentation }) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
  // D lets both knowledge entry points edit (panel + composer share one menu): knowledge mode C.
  if (view === "layouts") return <LabView final layout={layout} finder={finder} scenario={scenario} role={role} projectMode="P1" capsuleMode="project" knowledgeMode={layout === "D" || layout === "D2" ? "C" : "A"} />;
  if (view === "home-layouts") return <HomeToLab final layout={layout} scenario={scenario} role={role} projectMode="P1" capsuleMode="project" knowledgeMode={layout === "D" || layout === "D2" ? "C" : "A"} />;
  if (view === "final") return <LabView final scenario={scenario} role={role} projectMode="P1" capsuleMode="project" knowledgeMode="A" />;
  if (view === "home-final") return <HomeToLab final scenario={scenario} role={role} projectMode="P1" capsuleMode="project" knowledgeMode="A" />;
  if (view === "lab") return <LabView scenario={scenario} role={role} projectMode={modes.project} capsuleMode={modes.capsules} knowledgeMode={modes.knowledge} />;
  if (view === "home-lab") return <HomeToLab scenario={scenario} role={role} projectMode={modes.project} capsuleMode={modes.capsules} knowledgeMode={modes.knowledge} />;
  if (view === "current") return <CurrentView scenario={scenario} />;
  if (view === "home-current" || view === "home-proposed") return <HomeDemo scenario={scenario} role={role} flow={view === "home-current" ? "current" : "proposed"} />;
  return <Proposed view={view} scenarioId={scenarioId} role={role} />;
}

function Proposed({ view, scenarioId, role }: { view: "c1" | "c2"; scenarioId: ScenarioId; role: DemoRole }) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
  const api = useProposedModel(scenario);
  return view === "c1" ? <C1View api={api} scenario={scenario} role={role} /> : <C2View api={api} scenario={scenario} role={role} />;
}

export function ChatComparison() {
  // FINAL stays the default; ?view=layouts&layout=A|B|C opens the comparison directly.
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [view, setView] = useState<ViewId>(VIEWS.some((v) => v.id === params?.get("view")) ? (params!.get("view") as ViewId) : "final");
  const [finder, setFinder] = useState<FinderPresentation>(params?.get("finder") === "overlay" ? "overlay" : "sidebar");
  const [layout, setLayout] = useState<LayoutOption>((["A", "B", "C", "D", "D2"] as const).find((l) => l === params?.get("layout")) ?? "A");
  const [modes, setModes] = useState<LabModes>({ project: "P1", capsules: "project", knowledge: "A" });
  const isLab = view === "lab" || view === "home-lab";
  const [controlsHidden, setControlsHidden] = useState(false);
  const [scenarioId, setScenarioId] = useState<ScenarioId>(SCENARIOS.find((x) => x.id === params?.get("scenario"))?.id ?? "one");
  const [role, setRole] = useState<DemoRole>("owner-manager");
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
  const viewInfo = VIEWS.find((v) => v.id === view)!;
  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: "var(--luxia-background, #fff)" }}>
      <header className="shrink-0 border-b px-4 py-3 sm:px-6" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="rounded-full px-2 py-0.5 luxia-type-overline-data" style={{ background: "var(--luxia-opacity-warning-12)", color: "var(--luxia-warning-90)", border: "1px solid var(--luxia-opacity-warning-32)" }} data-ux-internal-badge="">Internal UX prototype</span>
          <h1 className="luxia-type-title-component" style={{ color: "var(--luxia-purple-70)" }}>Luxia Chat comparison</h1>
          <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>Mock data in memory · not the product · nothing is saved</span>
          <button type="button" onClick={() => setControlsHidden((v) => !v)} aria-expanded={!controlsHidden} className="ml-auto rounded-full border px-3 py-1 luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]" style={{ borderColor: "var(--luxia-border-default)", color: "var(--luxia-text-secondary)" }} data-ux-toggle-controls="">
            {controlsHidden ? "Show prototype controls" : "Hide prototype controls"}
          </button>
        </div>
        {controlsHidden ? null : (<>
        <div className="mt-3 grid gap-2">
          <Row label="View"><Segmented label="View" testId="view" value={view} onChange={setView} options={VIEWS.map((v) => ({ id: v.id, label: v.label }))} /></Row>
          <Row label="Scenario"><Segmented label="Scenario" testId="scenario" value={scenarioId} onChange={setScenarioId} options={SCENARIOS.map((s) => ({ id: s.id, label: s.label }))} /></Row>
          {view === "layouts" || view === "home-layouts" ? (
            <Row label="Layout"><Segmented label="Layout option" testId="layout" value={layout} onChange={setLayout} options={LAYOUTS.map((l) => ({ id: l.id, label: l.label }))} /></Row>
          ) : null}
          {view === "layouts" && layout === "D2" ? (
            <Row label="Finder"><Segmented label="Chat Finder presentation" testId="finder" value={finder} onChange={setFinder} options={[{ id: "sidebar", label: "A · Sidebar Chats panel" }, { id: "overlay", label: "B · Overlay Finder" }]} /></Row>
          ) : null}
          {isLab ? (
            <>
              <Row label="Project"><Segmented label="Project selection" testId="lab-project" value={modes.project} onChange={(v) => setModes((x) => ({ ...x, project: v }))} options={[{ id: "P1", label: "P1 · Sidebar switcher" }, { id: "P2", label: "P2 · + Switcher in Chat" }]} /></Row>
              <Row label="Capsules"><Segmented label="Capsule scope" testId="lab-capsules" value={modes.capsules} onChange={(v) => setModes((x) => ({ ...x, capsules: v }))} options={[{ id: "project", label: "This Project" }, { id: "all", label: "All open (with Project tag)" }]} /></Row>
              <Row label="Knowledge"><Segmented label="Knowledge selection" testId="lab-knowledge" value={modes.knowledge} onChange={(v) => setModes((x) => ({ ...x, knowledge: v }))} options={[{ id: "A", label: "A · Panel primary" }, { id: "B", label: "B · Composer primary" }, { id: "C", label: "C · Both, one menu" }]} /></Row>
            </>
          ) : null}
          <Row label="Your role"><Segmented label="Your role in the Project" testId="role" value={role} onChange={setRole} options={(Object.keys(ROLE_LABEL) as DemoRole[]).map((id) => ({ id, label: id === "owner-manager" ? "Owner / Manager" : "Analyst / Member" }))} /></Row>
        </div>
        <p className="mt-2 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} data-ux-hint="">{view === "layouts" || view === "home-layouts" ? LAYOUTS.find((l) => l.id === layout)!.hint : viewInfo.hint} · {scenario.hint}</p>
        </>)}
      </header>
      <main className="min-h-0 flex-1 overflow-hidden" style={{ background: "var(--luxia-surface-subtle, #FAFDFF)" }}>
        <Stage key={`${view}-${scenarioId}-${role}-${view === "layouts" || view === "home-layouts" ? layout : ""}-${finder}`} view={view} scenarioId={scenarioId} role={role} modes={modes} layout={layout} finder={finder} />
      </main>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="w-[78px] shrink-0 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
