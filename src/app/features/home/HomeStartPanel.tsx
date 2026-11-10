import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, ChevronRight, CircleAlert, Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { ChatSendButton } from "@/app/features/shared/ChatSendButton";
import { LuxiaAiIcon, LuxiaChatIcon, LuxiaGalaxyIcon, LuxiaProjectsIcon } from "@/assets/icons";
import { canCreateConstellation } from "@/app/features/permissions";
import { HS } from "./homeSurfaces";
import { HomeAssistantConversation, type HomeAssistantView } from "./HomeAssistantConversation";
import {
  LUXIA_ASSISTANT_CONFIG,
  answerLuxiaAssistant,
  readLuxiaConversation,
  writeLuxiaConversation,
  type LuxiaAssistantAbilities,
  type LuxiaAssistantActionId,
  type LuxiaAssistantMessage,
} from "./luxiaAssistant";
import type { HomeProjectCard } from "./types";

export interface HomeContinueItem {
  id: string;
  kind: "chat" | "galaxy";
  title: string;
  detail: string;
  /** Short time label shown on the chip; the full detail stays in its tooltip and label. */
  when?: string;
  projectName?: string;
  pinned?: boolean;
  onOpen: () => void;
}

interface HomeStartPanelProps {
  projects: HomeProjectCard[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  /** Projects to list first in the context menu (last chosen, then those of recent work). */
  recentProjectIds?: string[];
  /** Opens the existing New Chat flow scoped to the Project, carrying the typed question. */
  onAsk: (projectId: string, question: string) => void;
  onOpenConstellations?: (projectId: string) => void;
  continueItems: HomeContinueItem[];
  onViewAllWork: () => void;
  canCreateProject: boolean;
  onNewProject: () => void;
  /** Luxia AI: whose conversation this is, what this user may do, and the real destinations answers can open. */
  assistant: {
    sessionKey: string;
    abilities: LuxiaAssistantAbilities;
    actions: Partial<Record<Exclude<LuxiaAssistantActionId, "project-chat">, () => void>>;
  };
}

/** How long a demo answer takes to appear, so the exchange reads as a conversation. */
const DEMO_ANSWER_DELAY_MS = 600;

const INK = "var(--luxia-purple-70)";
const SOFT_BORDER = "var(--luxia-opacity-brand-secondary-24)";
const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";
/** Menus with at least this many Projects show a Recent group first. */
const RECENT_GROUP_MIN_PROJECTS = 6;

function knowledgeLabel(project: HomeProjectCard): string {
  if (project.constellationCount === 0) return "No knowledge available";
  return `${project.constellationCount} Constellation${project.constellationCount === 1 ? "" : "s"}`;
}

function HeroMark() {
  return (
    <svg
      viewBox="0 0 150 96"
      aria-hidden
      focusable="false"
      className="pointer-events-none absolute right-6 top-4 hidden h-[96px] w-[150px] xl:block"
    >
      <g stroke="var(--luxia-purple-20)" strokeWidth="1.6" strokeDasharray="1 5" strokeLinecap="round" fill="none">
        <path d="M18 70 L56 40 L92 56 L130 22" />
        <path d="M56 40 L64 12" />
      </g>
      <circle cx="18" cy="70" r="4" fill="var(--luxia-purple-50)" />
      <circle cx="56" cy="40" r="5.5" fill="var(--luxia-purple-70)" />
      <circle cx="92" cy="56" r="4" fill="var(--luxia-brand-tertiary)" />
      <circle cx="130" cy="22" r="5" fill="var(--luxia-purple-60)" />
      <circle cx="64" cy="12" r="3" fill="var(--luxia-purple-20)" />
      <path
        transform="translate(118 74)"
        d="M0 -8C1 -2.3 2.3 -1 8 0C2.3 1 1 2.3 0 8C-1 2.3-2.3 1-8 0C-2.3-1-1-2.3 0-8Z"
        fill="var(--luxia-data-yellow)"
      />
    </svg>
  );
}

/** Atmospheric light: a soft aurora band, a quiet lower-left glow and two faint orbits around the constellation. */
function HeroBackdrop() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]" data-home-hero-backdrop="">
      <span
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(112deg, transparent 16%, var(--luxia-opacity-brand-tertiary-12) 40%, var(--luxia-opacity-brand-secondary-08) 58%, transparent 82%)",
        }}
      />
      <span
        className="absolute -bottom-44 -left-36 size-[460px] rounded-full"
        style={{ background: "radial-gradient(closest-side, var(--luxia-opacity-brand-secondary-12), transparent)" }}
      />
      <svg viewBox="0 0 640 320" preserveAspectRatio="xMaxYMin slice" focusable="false" className="absolute right-0 top-0 hidden h-full w-[70%] sm:block">
        <ellipse cx="560" cy="34" rx="330" ry="150" fill="none" stroke="var(--luxia-opacity-brand-secondary-12)" strokeWidth="1" />
        <ellipse cx="596" cy="12" rx="460" ry="220" fill="none" stroke="var(--luxia-opacity-brand-tertiary-24)" strokeWidth="1" />
      </svg>
    </span>
  );
}

const SEGMENT =
  "inline-flex h-8 min-w-0 items-center gap-1.5 rounded-full border px-2.5 text-left transition-colors @max-[519px]:h-9 @max-[519px]:gap-1 @max-[519px]:px-2";
const SELECTED_CONTEXT = { background: "var(--luxia-opacity-brand-secondary-12)", borderColor: "var(--luxia-opacity-brand-secondary-24)", color: INK };
const OPTIONAL_CONTEXT = { background: "var(--luxia-surface)", borderColor: "var(--luxia-border-default)", color: "var(--luxia-text-secondary)" };
const OPTIONAL_HOVER = "hover:border-[var(--luxia-opacity-brand-secondary-24)] hover:bg-[var(--luxia-opacity-brand-secondary-04)]";

function ProjectContext({
  projects,
  project,
  active,
  recentProjectIds = [],
  onSelect,
}: {
  projects: HomeProjectCard[];
  project: HomeProjectCard;
  /** Project Chat is the chosen context (otherwise this segment offers it). */
  active: boolean;
  recentProjectIds?: string[];
  onSelect: (projectId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const noKnowledge = active && project.constellationCount === 0;
  const recent = projects.length >= RECENT_GROUP_MIN_PROJECTS
    ? recentProjectIds
      .map((id) => projects.find((entry) => entry.id === id))
      .filter((entry): entry is HomeProjectCard => Boolean(entry))
      .slice(0, 3)
    : [];
  const rest = recent.length > 0 ? projects.filter((entry) => !recent.includes(entry)) : projects;

  function renderOption(entry: HomeProjectCard) {
    const selected = entry.id === project.id;
    return (
      <CommandItem
        key={entry.id}
        value={`${entry.name} ${entry.id}`}
        onSelect={() => {
          onSelect(entry.id);
          setOpen(false);
        }}
        data-home-ask-context-option={entry.id}
        aria-selected={selected}
        className="min-h-[44px] gap-2.5 rounded-[10px] px-2 py-1.5 data-[selected=true]:bg-[var(--luxia-opacity-brand-secondary-08)]"
      >
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-[9px]"
          style={{ background: "var(--luxia-opacity-brand-secondary-08)", color: "var(--luxia-purple-60)" }}
        >
          <LuxiaProjectsIcon size={16} color="currentColor" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate luxia-type-body-dense-strong" style={{ color: INK }}>{entry.name}</span>
          <span
            className="block truncate luxia-type-caption"
            style={{ color: entry.constellationCount === 0 ? "var(--luxia-warning-70)" : "var(--luxia-text-muted)" }}
          >
            {knowledgeLabel(entry)}
          </span>
        </span>
        {selected ? <Check size={16} aria-hidden className="text-[var(--luxia-purple-60)]" /> : null}
      </CommandItem>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={active ? `Project Chat in ${project.name}. Change Project` : "Chat in a Project: choose a Project. Opens a separate Project Chat"}
          title={active ? `Answers come from ${project.name}` : "Ask about a Project's documents and data in a Project Chat"}
          data-home-ask-context=""
          data-context-kind="project"
          data-context-id={project.id}
          data-active={active ? "" : undefined}
          className={`${SEGMENT} flex-1 @[520px]:flex-none ${active ? "" : OPTIONAL_HOVER} ${FOCUS_RING}`}
          style={active ? SELECTED_CONTEXT : OPTIONAL_CONTEXT}
        >
          <span
            aria-hidden
            className="flex shrink-0 @max-[519px]:hidden"
            style={{ color: noKnowledge ? "var(--luxia-warning-70)" : "var(--luxia-purple-60)" }}
          >
            {noKnowledge ? <CircleAlert size={15} strokeWidth={2.25} /> : <LuxiaProjectsIcon size={15} color="currentColor" />}
          </span>
          <span className="min-w-0 flex-1 truncate luxia-type-body-dense-strong">{active ? project.name : "Chat in a Project"}</span>
          <ChevronDown size={14} aria-hidden className="shrink-0" style={{ color: "var(--luxia-purple-60)" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(360px,calc(100vw-32px))] rounded-[16px] p-1.5"
        style={{ background: "var(--luxia-surface)", borderColor: "var(--luxia-border-default)", boxShadow: "var(--luxia-shadow-lg)" }}
        data-home-ask-context-menu=""
      >
        <Command
          loop
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-[var(--luxia-text-muted)]"
        >
          <CommandInput placeholder="Find a Project" aria-label="Find a Project" />
          <CommandList className="max-h-[320px] pt-1">
            <CommandEmpty>No Projects found</CommandEmpty>
            {recent.length > 0 ? (
              <CommandGroup heading="Recent" data-home-ask-context-group="recent">
                {recent.map(renderOption)}
              </CommandGroup>
            ) : null}
            <CommandGroup heading={recent.length > 0 ? "All Projects" : "Ask in a Project"} data-home-ask-context-group="all">
              {rest.map(renderOption)}
            </CommandGroup>
          </CommandList>
          <p className="mx-2 mb-1 mt-1 border-t pt-2 luxia-type-caption" style={{ borderColor: "var(--luxia-border-default)", color: "var(--luxia-text-muted)" }}>
            Opens a separate Project Chat. Answers only use the knowledge of the Project you choose.
          </p>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Luxia AI: the default conversation on Home, for help with using Luxia. */
function LuxiaAiContext({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`${LUXIA_ASSISTANT_CONFIG.displayName}: help with using Luxia`}
      title={`${LUXIA_ASSISTANT_CONFIG.displayName} · ${LUXIA_ASSISTANT_CONFIG.disclosure}`}
      data-home-ask-context-option="luxia-ai"
      data-context-kind="luxia-ai"
      data-active={active ? "" : undefined}
      className={`${SEGMENT} shrink-0 ${active ? "" : OPTIONAL_HOVER} ${FOCUS_RING}`}
      style={active ? SELECTED_CONTEXT : OPTIONAL_CONTEXT}
    >
      <LuxiaAiIcon size={15} color={active ? "var(--luxia-purple-60)" : "currentColor"} aria-hidden />
      <span className="luxia-type-body-dense-strong">{LUXIA_ASSISTANT_CONFIG.displayName}</span>
    </button>
  );
}

/**
 * Fixed Home Hero: one question box. Luxia AI is the default and answers here on
 * Home. Chat in a Project is the explicit second path: it opens the existing New
 * Chat flow for the chosen Project, with the question carried over.
 */
export function HomeStartPanel({
  projects,
  selectedProjectId,
  onSelectProject,
  recentProjectIds,
  onAsk,
  onOpenConstellations,
  continueItems,
  onViewAllWork,
  canCreateProject,
  onNewProject,
  assistant,
}: HomeStartPanelProps) {
  const project = projects.find((entry) => entry.id === selectedProjectId) ?? projects[0] ?? null;
  const [mode, setMode] = useState<"luxia-ai" | "project">("luxia-ai");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<LuxiaAssistantMessage[]>(() => readLuxiaConversation(assistant.sessionKey));
  const [pending, setPending] = useState(false);
  const [view, setView] = useState<HomeAssistantView>("open");
  const answerTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const aiMode = mode === "luxia-ai";
  const showStarters = aiMode && messages.length === 0 && !pending;
  const hasKnowledge = Boolean(project && project.constellationCount > 0);
  const canAsk = aiMode ? Boolean(question.trim()) && !pending : Boolean(project && hasKnowledge);
  const canAddKnowledge = Boolean(project && onOpenConstellations && canCreateConstellation(project.viewerProjectRole));
  const sendLabel = aiMode
    ? `Ask ${LUXIA_ASSISTANT_CONFIG.displayName}`
    : !project ? "Ask" : question.trim() ? `Ask in ${project.name}` : `Start a Chat in ${project.name}`;

  useEffect(() => {
    writeLuxiaConversation(assistant.sessionKey, messages);
  }, [assistant.sessionKey, messages]);

  useEffect(() => () => {
    if (answerTimer.current !== null) window.clearTimeout(answerTimer.current);
  }, []);

  function askAssistant(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    const asked: LuxiaAssistantMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    setMessages((current) => [...current, asked]);
    setQuestion("");
    setView((current) => (current === "collapsed" ? "open" : current));
    setPending(true);
    answerTimer.current = window.setTimeout(() => {
      answerTimer.current = null;
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", ...answerLuxiaAssistant(trimmed, assistant.abilities) }]);
      setPending(false);
    }, DEMO_ANSWER_DELAY_MS);
    inputRef.current?.focus();
  }

  function clearConversation() {
    if (answerTimer.current !== null) window.clearTimeout(answerTimer.current);
    answerTimer.current = null;
    setPending(false);
    setMessages([]);
    setView("open");
    inputRef.current?.focus();
  }

  function canRun(action: LuxiaAssistantActionId) {
    return action === "project-chat" ? projects.length > 0 : Boolean(assistant.actions[action]);
  }

  function run(action: LuxiaAssistantActionId) {
    if (action === "project-chat") {
      setMode("project");
      inputRef.current?.focus();
      return;
    }
    assistant.actions[action]?.();
  }

  function chooseProject(projectId: string) {
    onSelectProject(projectId);
    setMode("project");
  }

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 168)}px`;
  }, [question, showStarters]);

  function ask() {
    if (aiMode) {
      askAssistant(question);
      return;
    }
    if (!project || !canAsk) return;
    onAsk(project.id, question.trim());
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      ask();
    }
  }

  const placeholder = aiMode
    ? `Ask ${LUXIA_ASSISTANT_CONFIG.displayName} about using Luxia…`
    : !project
      ? "Projects hold the documents and data Luxia answers from."
      : hasKnowledge
        ? `Ask a question about ${project.name}…`
        : "Type your question";

  return (
    <section
      aria-labelledby="home-start-title"
      data-home-start-panel=""
      data-home-hero="composer"
      className="relative isolate mb-6 min-w-0 rounded-[24px] border px-4 pb-5 pt-5 sm:px-8 sm:pb-6 sm:pt-6"
      style={{
        borderColor: SOFT_BORDER,
        background: [
          "radial-gradient(120% 140% at 100% 0%, var(--luxia-opacity-brand-tertiary-24) 0%, transparent 45%)",
          "radial-gradient(90% 120% at 0% 100%, var(--luxia-opacity-brand-secondary-16) 0%, transparent 55%)",
          "linear-gradient(var(--luxia-opacity-brand-secondary-04), var(--luxia-opacity-brand-secondary-04))",
          "var(--luxia-surface)",
        ].join(", "),
      }}
    >
      <HeroBackdrop />
      <HeroMark />
      <div className="@container relative mx-auto min-w-0" style={{ width: "min(100%, clamp(860px, calc(66% + 42px), 1200px))" }} data-home-hero-column="">
        <h2
          id="home-start-title"
          className="mb-3 luxia-type-heading-h4 sm:text-center"
          style={{ color: INK }}
        >
          {aiMode || project ? "What would you like to find out?" : "You're not in a Project yet"}
        </h2>

        <div
          className="min-w-0 rounded-[20px] border px-3 pb-3 pt-3 transition-shadow focus-within:shadow-[0_0_0_3px_var(--luxia-opacity-brand-secondary-16),var(--luxia-shadow-md)] sm:px-4"
          style={{ background: "var(--luxia-surface)", borderColor: SOFT_BORDER, boxShadow: "var(--luxia-shadow-md)" }}
          data-home-ask-composer=""
        >
          {aiMode && messages.length > 0 ? (
            <HomeAssistantConversation
              messages={messages}
              pending={pending}
              view={view}
              onViewChange={setView}
              onClear={clearConversation}
              onFollowUp={askAssistant}
              canRun={canRun}
              onRun={run}
            />
          ) : null}
          <label htmlFor="home-ask-input" className="sr-only">
            {aiMode ? `Your question for ${LUXIA_ASSISTANT_CONFIG.displayName}` : project ? `Your question for ${project.name}` : "Your question"}
          </label>
          <div
            className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-2 [grid-template-areas:'input_send'_'starters_starters'_'context_context'_'status_status'] @[520px]:[grid-template-areas:'input_input'_'starters_starters'_'context_send'_'status_status']"
            data-home-ask-layout=""
          >
            <textarea
              id="home-ask-input"
              ref={inputRef}
              rows={showStarters ? 1 : 2}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={onKeyDown}
              disabled={!aiMode && !project}
              placeholder={placeholder}
              data-home-ask-input=""
              className={`block w-full resize-none ${showStarters ? "min-h-[38px]" : "min-h-[52px]"} bg-transparent px-1.5 pb-2 pt-1 text-[17px] leading-[26px] outline-none [grid-area:input] placeholder:text-[var(--luxia-text-muted)] disabled:cursor-not-allowed`}
              style={{ color: "var(--luxia-text-primary)" }}
            />
            {showStarters ? (
              <div role="group" aria-label="Suggested questions" className="flex min-w-0 flex-wrap gap-2 px-1 pb-2 [grid-area:starters]" data-home-ai-starters="">
                {LUXIA_ASSISTANT_CONFIG.suggestedQuestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => askAssistant(suggestion)}
                    className={`inline-flex min-h-8 items-center rounded-[10px] border px-2.5 luxia-type-caption font-medium transition-colors hover:border-[var(--luxia-opacity-brand-secondary-24)] hover:bg-[var(--luxia-opacity-brand-secondary-08)] ${FOCUS_RING}`}
                    style={{ background: "var(--luxia-opacity-brand-secondary-04)", borderColor: "var(--luxia-opacity-brand-secondary-12)", color: INK }}
                    data-home-ai-starter=""
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
            <div
              role="group"
              aria-label="Conversation context"
              className="mt-1 flex min-w-0 items-center gap-2 justify-self-stretch [grid-area:context] @[520px]:justify-self-start"
              data-home-ask-contexts=""
            >
              <LuxiaAiContext active={aiMode} onSelect={() => setMode("luxia-ai")} />
              {project ? (
                <ProjectContext projects={projects} project={project} active={!aiMode} recentProjectIds={recentProjectIds} onSelect={chooseProject} />
              ) : (
                <button
                  type="button"
                  onClick={() => setMode("project")}
                  aria-pressed={!aiMode}
                  className={`${SEGMENT} flex-1 luxia-type-body-dense-strong @[520px]:flex-none ${aiMode ? OPTIONAL_HOVER : ""} ${FOCUS_RING}`}
                  style={aiMode ? OPTIONAL_CONTEXT : SELECTED_CONTEXT}
                  data-home-ask-context=""
                  data-context-kind="none"
                  data-active={aiMode ? undefined : ""}
                >
                  <LuxiaProjectsIcon size={15} color="currentColor" aria-hidden />
                  {aiMode ? "Chat in a Project" : "No Project"}
                </button>
              )}
            </div>
            <span className="shrink-0 self-end [grid-area:send]" title={canAsk ? sendLabel : undefined}>
              <ChatSendButton canSend={canAsk} onClick={ask} aria-label={sendLabel} className="h-11 w-11" />
            </span>

            {!aiMode && project && hasKnowledge ? (
              <p
                data-home-ask-hint="project-chat"
                className="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 border-t px-1 pt-2 luxia-type-caption [grid-area:status]"
                style={{ borderColor: "var(--luxia-border-default)", color: "var(--luxia-text-secondary)" }}
              >
                <Info size={14} strokeWidth={2.25} aria-hidden className="shrink-0" style={{ color: "var(--luxia-purple-60)" }} />
                <span>Opens a separate Project Chat. Answers come only from this Project's knowledge.</span>
              </p>
            ) : null}

            {!aiMode && project && !hasKnowledge ? (
              <p
                role="status"
                data-home-ask-hint="no-knowledge"
                className="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 border-t px-1 pt-2 luxia-type-caption [grid-area:status]"
                style={{ borderColor: "var(--luxia-border-default)", color: "var(--luxia-text-secondary)" }}
              >
                <CircleAlert size={14} strokeWidth={2.25} aria-hidden className="shrink-0" style={{ color: "var(--luxia-warning-70)" }} />
                <span className="font-semibold" style={{ color: "var(--luxia-warning-90)" }}>No knowledge available</span>
                <span aria-hidden style={{ color: "var(--luxia-text-muted)" }}>·</span>
                {canAddKnowledge && onOpenConstellations ? (
                  <button
                    type="button"
                    onClick={() => onOpenConstellations(project.id)}
                    className={`inline-flex min-h-7 items-center rounded-[6px] px-0.5 font-bold underline-offset-2 hover:underline ${FOCUS_RING}`}
                    style={{ color: "var(--luxia-purple-60)" }}
                  >
                    Add knowledge
                  </button>
                ) : (
                  <span>Switch Project or ask a Project admin.</span>
                )}
              </p>
            ) : null}

            {!aiMode && !project ? (
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-1 [grid-area:status]" data-home-ask-hint="no-project">
                {canCreateProject ? (
                  <Button type="button" variant="primary" size="compact" onClick={onNewProject}>New Project</Button>
                ) : null}
                <span className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                  {canCreateProject ? "or ask an admin to invite you to one." : "Ask an admin to invite you to a Project."}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {continueItems.length > 0 ? (
          <nav aria-labelledby="home-continue-title" className="mt-3 min-w-0" data-home-continue="">
            <div className="mb-1.5 flex min-w-0 items-center justify-between gap-3 px-1">
              <h3 id="home-continue-title" className="min-w-0 truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-secondary)" }}>
                Continue where you left off
              </h3>
              <button
                type="button"
                onClick={onViewAllWork}
                aria-label="Chat history: open Chats & Galaxies"
                title="Open Chats & Galaxies"
                data-home-continue-all=""
                className={`-mr-1 inline-flex min-h-7 shrink-0 items-center gap-0.5 rounded-[8px] px-1.5 luxia-type-body-dense-strong hover:underline ${FOCUS_RING}`}
                style={{ color: "var(--luxia-purple-60)" }}
              >
                Chat history
                <ChevronRight size={15} aria-hidden />
              </button>
            </div>
            <ul className="grid min-w-0 grid-cols-1 gap-2 @[620px]:grid-cols-3">
              {continueItems.map((item, index) => {
                const isGalaxy = item.kind === "galaxy";
                const meta = [item.projectName, item.when].filter(Boolean).join(" · ") || item.detail;
                return (
                  <li key={item.id} className={`min-w-0 ${index >= 2 ? "@max-[619px]:hidden" : ""}`}>
                    <button
                      type="button"
                      onClick={item.onOpen}
                      aria-label={`Continue ${isGalaxy ? "Galaxy" : "Chat"} ${item.title}, ${item.detail}${item.pinned ? ", pinned" : ""}`}
                      title={`${item.title} · ${item.detail}`}
                      data-home-continue-item=""
                      data-kind={item.kind}
                      data-pinned={item.pinned ? "" : undefined}
                      className={`flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-[14px] border py-1 pl-1 pr-3 text-left transition-colors hover:border-[var(--luxia-opacity-brand-secondary-32)] hover:bg-[var(--luxia-opacity-brand-secondary-04)] ${FOCUS_RING}`}
                      style={{ borderColor: SOFT_BORDER, background: "var(--luxia-surface)", color: INK }}
                    >
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full"
                        style={isGalaxy
                          ? { background: HS.accentGalaxySoft, color: HS.accentGalaxy }
                          : { background: "var(--luxia-opacity-brand-tertiary-24)", color: HS.accentChat }}
                      >
                        {isGalaxy ? <LuxiaGalaxyIcon size={16} color="currentColor" /> : <LuxiaChatIcon size={16} color="currentColor" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate luxia-type-body-dense-strong">{item.title}</span>
                        <span className="block truncate luxia-type-caption leading-4" style={{ color: "var(--luxia-text-muted)" }}>{meta}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
