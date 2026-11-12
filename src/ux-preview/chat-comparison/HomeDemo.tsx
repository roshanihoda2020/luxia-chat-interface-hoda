import { useEffect, useState } from "react";
import { HomeStartPanel } from "@/app/features/home/HomeStartPanel";
import { Button } from "@/app/components/ui/button";
import type { DemoRole, Scenario } from "./mockData";
import { useProposedModel } from "./model";
import { C1View, CreateChatReplica, CurrentView, type CurrentStart } from "./views";

type Flow = "current" | "proposed";

/** The real Home composer (unchanged) feeding either today's flow or the proposed one. */
export function HomeDemo({ scenario, role, flow }: { scenario: Scenario; role: DemoRole; flow: Flow }) {
  const [projectId, setProjectId] = useState(scenario.startProjectId);
  const [dialog, setDialog] = useState<{ projectId: string; question: string } | null>(null);
  const [currentStart, setCurrentStart] = useState<CurrentStart | null>(null);
  const [proposed, setProposed] = useState<{ projectId: string; question: string } | null>(null);

  useEffect(() => { setDialog(null); setCurrentStart(null); setProposed(null); }, [flow, scenario]);

  const onAsk = (pid: string, question: string) => {
    if (flow === "current") setDialog({ projectId: pid, question });
    else setProposed({ projectId: pid, question });
  };

  if (currentStart) return <Result label="Today: Create Chat → Chat with the question as a draft" onBack={() => setCurrentStart(null)}><CurrentView scenario={scenario} start={currentStart} /></Result>;
  if (proposed) return <Result label="Proposed: straight into Chat, question as a draft, scope confirmed in Chat" onBack={() => setProposed(null)}><ProposedHandoff scenario={scenario} role={role} projectId={proposed.projectId} question={proposed.question} /></Result>;

  return (
    <div className="luxia-scrollbar h-full overflow-y-auto px-4 py-6 sm:px-8" data-ux-home-demo={flow}>
      <p className="mb-3 max-w-[70ch] luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
        The real Home composer, unchanged. Pick <strong>Chat in a Project</strong>, choose a Project, type a question and send.
        {flow === "current" ? " Today the Create Chat dialog opens next." : " Proposed: Chat opens directly with your question as a draft. Nothing is sent automatically."}
      </p>
      <div className="mx-auto max-w-[920px]">
        <HomeStartPanel
          projects={scenario.projects}
          selectedProjectId={projectId}
          onSelectProject={setProjectId}
          recentProjectIds={[]}
          onAsk={onAsk}
          continueItems={[]}
          onViewAllWork={() => undefined}
          canCreateProject
          onNewProject={() => undefined}
          assistant={{
            sessionKey: `ux-preview-chat-comparison-${scenario.id}-${role}`,
            abilities: { canCreateProject: true, canAddDataSources: role === "owner-manager", hasProjects: scenario.projects.length > 0 },
            actions: {},
          }}
        />
      </div>
      {dialog ? (
        <CreateChatReplica
          scenario={scenario}
          lockedProjectId={dialog.projectId}
          question={dialog.question}
          onClose={() => setDialog(null)}
          onCreate={(payload) => { setCurrentStart({ ...payload, draft: dialog.question }); setDialog(null); }}
        />
      ) : null}
    </div>
  );
}

function ProposedHandoff({ scenario, role, projectId, question }: { scenario: Scenario; role: DemoRole; projectId: string; question: string }) {
  const api = useProposedModel(scenario, projectId);
  useEffect(() => { api.newChat(question, projectId); /* once, on arrival */ }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <C1View api={api} scenario={scenario} role={role} />;
}

function Result({ label, onBack, children }: { label: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2 sm:px-8" style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-opacity-brand-secondary-04)" }}>
        <Button type="button" variant="tertiary" size="compact" onClick={onBack} data-ux-home-back="">← Back to Home</Button>
        <span className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{label}</span>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
