import { useMemo, type ReactNode } from "react";
import { ChevronRight, MessageSquareText } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import {
  LuxiaChatIcon,
  LuxiaDatasourceIcon,
  LuxiaGalaxyIcon,
  LuxiaWritingAssistantIcon,
} from "@/assets/icons";
import { HS } from "./homeSurfaces";
import { LuxiaCharacter } from "./LuxiaCharacter";
import type { HomeProjectCard } from "./types";

export interface HomeContinueItem {
  id: string;
  kind: "chat" | "galaxy";
  title: string;
  detail: string;
  onOpen: () => void;
}

interface HomeStartPanelProps {
  projects: HomeProjectCard[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  /** Opens the existing New Chat flow scoped to the Project. */
  onStartChat: (projectId: string) => void;
  /** Opens the Project's Galaxy through the existing access checks. */
  onAskProject: (projectId: string) => void;
  onOpenConstellations?: (projectId: string) => void;
  continueItems: HomeContinueItem[];
  onViewAllWork: () => void;
  canCreateProject: boolean;
  onNewProject: () => void;
  onOpenWritingAssistant?: () => void;
  onOpenDataSources?: () => void;
}

const QUICK_ACTION_CLASS =
  "inline-flex min-h-[36px] items-center gap-2 rounded-[10px] border px-3 py-1.5 luxia-type-body-dense-strong outline-none transition-colors hover:bg-[rgba(255,255,255,0.12)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

function QuickAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={QUICK_ACTION_CLASS}
      style={{ borderColor: HS.heroBorder, color: HS.heroText, background: "var(--luxia-opacity-white-08)" }}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Fixed Start band above the Home tiles. Left: one outcome-first action
 * (ask a question), in a quietly chosen Project, plus a few real alternatives.
 * Right: up to three items to continue. Chats always belong to a Project and
 * need at least one Constellation, so the band guides the user when either is missing.
 */
export function HomeStartPanel({
  projects,
  selectedProjectId,
  onSelectProject,
  onStartChat,
  onAskProject,
  onOpenConstellations,
  continueItems,
  onViewAllWork,
  canCreateProject,
  onNewProject,
  onOpenWritingAssistant,
  onOpenDataSources,
}: HomeStartPanelProps) {
  const project = projects.find((entry) => entry.id === selectedProjectId) ?? projects[0] ?? null;
  const options = useMemo(
    () => projects.map((entry) => ({ value: entry.id, label: entry.name })),
    [projects],
  );
  const hasKnowledge = Boolean(project && project.constellationCount > 0);

  return (
    <section
      aria-labelledby="home-start-title"
      data-home-start-panel=""
      className="relative mb-6 grid min-w-0 overflow-hidden lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,1fr)]"
      style={{
        background: HS.heroSurface,
        border: `1px solid ${HS.heroBorder}`,
        boxShadow: HS.heroShadow,
        borderRadius: HS.heroRadius,
        color: HS.heroText,
      }}
    >
      <div className="min-w-0 px-5 py-5 sm:px-7 sm:py-6">
        <p className="luxia-type-overline-data" style={{ color: HS.heroSoft, letterSpacing: "0.08em" }}>Start</p>
        <h2 id="home-start-title" className="mt-1 luxia-type-title-section" style={{ color: HS.heroText }}>
          {project ? "What would you like to do today?" : "You're not in a Project yet"}
        </h2>
        <p className="mt-1.5 max-w-[560px] luxia-type-body-dense" style={{ color: HS.heroDescription }}>
          {!project
            ? canCreateProject
              ? "Luxia answers questions from your organisation's knowledge inside Projects. Create one to begin."
              : "Luxia answers questions from your organisation's knowledge inside Projects. Ask an admin to invite you."
            : hasKnowledge
              ? "Ask about your documents and data and get answers with their sources."
              : `${project.name} has no knowledge to answer from yet. Add a Constellation first.`}
        </p>

        {project ? (
          <div className="mt-5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2.5">
            {hasKnowledge ? (
              <Button type="button" variant="primary" size="large" onClick={() => onStartChat(project.id)} data-home-start-chat="">
                <MessageSquareText size={16} strokeWidth={2} aria-hidden />
                Ask a question
              </Button>
            ) : onOpenConstellations ? (
              <Button type="button" variant="primary" size="large" onClick={() => onOpenConstellations(project.id)}>
                Add knowledge to {project.name}
              </Button>
            ) : null}
            {projects.length > 1 ? (
              <div className="flex min-w-0 items-center gap-2" style={{ color: HS.heroSoft }}>
                <label htmlFor="home-start-project" className="luxia-type-caption whitespace-nowrap">in</label>
                <div className="w-[min(240px,60vw)]" style={{ color: "var(--luxia-text-primary)" }}>
                  <SearchableSelect
                    id="home-start-project"
                    value={project.id}
                    onValueChange={onSelectProject}
                    options={options}
                    placeholder="Choose a Project"
                    searchPlaceholder="Search Projects"
                    noResultsText="No Projects found"
                  />
                </div>
              </div>
            ) : (
              <span className="luxia-type-caption" style={{ color: HS.heroSoft }}>in {project.name}</span>
            )}
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {canCreateProject ? (
              <Button type="button" variant="primary" size="large" onClick={onNewProject}>New Project</Button>
            ) : null}
          </div>
        )}

        <div className="mt-5 flex min-w-0 flex-wrap items-center gap-2" aria-label="Other ways to start">
          {onOpenWritingAssistant ? (
            <QuickAction
              icon={<LuxiaWritingAssistantIcon size={16} color="currentColor" />}
              label="Write a document"
              onClick={onOpenWritingAssistant}
            />
          ) : null}
          {onOpenDataSources ? (
            <QuickAction
              icon={<LuxiaDatasourceIcon size={16} color="currentColor" />}
              label="Work with your data"
              onClick={onOpenDataSources}
            />
          ) : null}
          {project && hasKnowledge ? (
            <QuickAction
              icon={<LuxiaGalaxyIcon size={16} color="currentColor" />}
              label="Ask across the whole Project"
              onClick={() => onAskProject(project.id)}
            />
          ) : null}
        </div>
      </div>

      <div
        className="min-w-0 border-t px-5 py-5 sm:px-6 lg:border-l lg:border-t-0"
        style={{ borderColor: HS.heroBorder, background: "rgba(255, 255, 255, 0.04)" }}
        data-home-continue=""
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="luxia-type-title-component" style={{ color: HS.heroText }}>Continue</h3>
          {continueItems.length > 0 ? (
            <button
              type="button"
              onClick={onViewAllWork}
              className="inline-flex items-center gap-1 rounded-[6px] luxia-type-caption font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
              style={{ color: HS.heroDescription }}
            >
              All recent work
              <ChevronRight size={14} aria-hidden />
            </button>
          ) : null}
        </div>
        {continueItems.length > 0 ? (
          <ul className="mt-3 grid gap-1.5">
            {continueItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={item.onOpen}
                  aria-label={`Continue ${item.kind === "galaxy" ? "Galaxy" : "Chat"} ${item.title}`}
                  data-home-continue-item=""
                  className="group flex w-full min-w-0 items-center gap-3 rounded-[10px] px-2.5 py-2 text-left outline-none transition-colors hover:bg-[rgba(255,255,255,0.08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                >
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: "var(--luxia-opacity-white-08)", color: "var(--luxia-purple-20)" }}
                  >
                    {item.kind === "galaxy"
                      ? <LuxiaGalaxyIcon size={18} color="currentColor" />
                      : <LuxiaChatIcon size={18} color="currentColor" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate luxia-type-body-dense-strong" style={{ color: HS.heroText }}>{item.title}</span>
                    <span className="block truncate luxia-type-caption" style={{ color: HS.heroMuted }}>{item.detail}</span>
                  </span>
                  <ChevronRight size={16} aria-hidden className="shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 flex min-w-0 items-center gap-3" data-home-continue-empty="">
            <LuxiaCharacter role="guide" size={52} color="var(--luxia-purple-30)" />
            <p className="luxia-type-body-dense" style={{ color: HS.heroDescription }}>
              Your recent Chats will appear here, so you can pick up where you left off.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
