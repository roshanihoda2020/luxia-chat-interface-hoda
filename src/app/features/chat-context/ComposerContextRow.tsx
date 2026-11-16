import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { LuxiaConstellationIcon, LuxiaGalaxyIcon, LuxiaProjectsIcon } from "@/assets/icons";
import "./composerContext.css";

/** A Project the user can switch to (already filtered by membership by the caller). */
export interface ProjectContextOption {
  id: string;
  label: string;
  role?: string | null;
  /** Accessible Constellations in this Project (0 = no knowledge set up yet). */
  knowledgeCount: number;
}

/** A knowledge scope of the SELECTED Project the user can use (filtered by access by the caller). */
export interface KnowledgeContextOption {
  kind: "galaxy" | "constellation";
  /** Galaxy: the Project's Galaxy chat id. Constellation: the Constellation id. */
  id: string;
  label: string;
  source?: "PDF" | "CSV" | "DB";
  description?: string;
}

const MENU = "w-[340px] max-w-[calc(100vw-24px)] p-2";

function ProjectContextSelect({ projects, value, onSelect }: {
  projects: ProjectContextOption[];
  value: string;
  onSelect: (projectId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = projects.find((p) => p.id === value);
  const name = current?.label ?? "Project";

  if (projects.length <= 1) {
    return (
      <span className="luxia-ctx-value luxia-ctx-value--static" aria-label={`Project: ${name}. Your only Project`}>
        <span className="luxia-ctx-name">{name}</span>
      </span>
    );
  }

  const filtered = projects.filter((p) => p.label.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
      <PopoverTrigger asChild>
        <button type="button" className="luxia-ctx-value" aria-label={`Project: ${name}. Switch Project`} data-luxia-ctx-project="">
          <span className="luxia-ctx-name">{name}</span>
          <ChevronDown size={12} strokeWidth={2.25} aria-hidden className="luxia-ctx-chevron" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className={MENU} data-luxia-ctx-project-menu="">
        <p className="px-2.5 pb-1 pt-1 luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>Switch Project</p>
        <p className="px-2.5 pb-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          Your chats stay in their Project. Knowledge is chosen inside each Project.
        </p>
        {projects.length > 4 ? (
          <label className="mb-1.5 flex items-center gap-2 rounded-[8px] border px-2 py-1.5" style={{ borderColor: "var(--luxia-border-default)" }}>
            <Search size={13} color="var(--luxia-text-muted)" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Projects"
              aria-label="Search Projects"
              className="min-w-0 flex-1 bg-transparent outline-none luxia-type-body-dense"
              autoFocus
            />
          </label>
        ) : null}
        <div role="listbox" aria-label="Projects" className="max-h-[320px] overflow-y-auto">
          {filtered.map((p) => {
            const selected = p.id === value;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { setOpen(false); setQuery(""); if (!selected) onSelect(p.id); }}
                className="flex w-full items-start gap-2.5 rounded-[8px] px-2.5 py-2 text-left outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:bg-[var(--luxia-opacity-brand-secondary-08)]"
                data-luxia-ctx-project-option={p.id}
              >
                <LuxiaProjectsIcon size={15} color={selected ? "var(--luxia-purple-60)" : "var(--luxia-text-muted)"} />
                <span className="min-w-0 flex-1">
                  <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{p.label}</span>
                  <span className="block luxia-type-caption" style={{ color: p.knowledgeCount ? "var(--luxia-text-muted)" : "var(--luxia-warning-90)" }}>
                    {[p.role, p.knowledgeCount ? `${p.knowledgeCount} Constellation${p.knowledgeCount === 1 ? "" : "s"}` : "Needs knowledge"].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {selected ? <Check size={15} color="var(--luxia-purple-60)" aria-label="Current Project" className="mt-0.5 shrink-0" /> : null}
              </button>
            );
          })}
          {filtered.length === 0 ? <p className="px-2.5 py-3 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>No matching Projects</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The ONE knowledge menu (Galaxy + the Project's accessible Constellations), shared by the
 * composer's knowledge control ("Constellation:" / "Galaxy:") and the inspector's
 * "ANSWERS FROM" heading, so both always offer and say the same.
 */
export function KnowledgeOptionsMenu({ options, value, onSelect, hasMessages, chatLabel, variant = "full", onDismiss }: {
  options: KnowledgeContextOption[];
  value: string | null;
  onSelect: (option: KnowledgeContextOption) => void;
  hasMessages: boolean;
  chatLabel: string;
  /** "compact": one-line rows only (icon · name · type · ✓), for the inspector heading. */
  variant?: "full" | "compact";
  /** Compact variant: close without changing (e.g. Enter on the current selection). */
  onDismiss?: () => void;
}) {
  if (variant === "compact") {
    return <CompactKnowledgeList options={options} value={value} onSelect={onSelect} onDismiss={onDismiss} />;
  }
  const row = (o: KnowledgeContextOption) => {
    const selected = o.id === value;
    return (
      <button
        key={`${o.kind}-${o.id}`}
        type="button"
        role="option"
        aria-selected={selected}
        onClick={() => { if (!selected) onSelect(o); }}
        className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:bg-[var(--luxia-opacity-brand-secondary-08)]"
        data-luxia-ctx-knowledge-option={o.id}
      >
        {o.kind === "galaxy" ? <LuxiaGalaxyIcon size={14} color="var(--luxia-purple-60)" /> : <LuxiaConstellationIcon size={14} color="var(--luxia-purple-60)" />}
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{o.label}</span>
            {o.source ? <span className="luxia-ctx-tag">{o.source}</span> : null}
          </span>
          {o.kind === "galaxy" ? (
            <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>Picks a suitable Constellation for each question</span>
          ) : o.description ? (
            <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{o.description}</span>
          ) : null}
        </span>
        {selected ? <Check size={14} color="var(--luxia-purple-60)" aria-hidden className="shrink-0" /> : null}
      </button>
    );
  };
  return (
    <>
      <p className="px-2.5 pb-1.5 luxia-type-caption" style={{ color: hasMessages ? "var(--luxia-purple-70)" : "var(--luxia-text-muted)" }}>
        {hasMessages
          ? `Choosing other knowledge starts a new chat. "${chatLabel}" keeps its knowledge and messages.`
          : "This chat answers from:"}
      </p>
      <div role="listbox" aria-label="Knowledge in this Project">
        {options.map(row)}
        {options.length === 0 ? <p className="px-2.5 py-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>No knowledge you can use in this Project yet.</p> : null}
      </div>
      {hasMessages ? <p className="px-2.5 pt-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>Your unsent text moves to the new chat.</p> : null}
    </>
  );
}

export const KNOWLEDGE_MENU_CLASS = MENU;

/**
 * Inspector variant: same options and handler, single-line rows. A search field filters by
 * name (case-insensitive, trimmed); ↑/↓ move the highlight, Enter selects it. Typing never
 * changes the selection.
 */
function CompactKnowledgeList({ options, value, onSelect, onDismiss }: {
  options: KnowledgeContextOption[];
  value: string | null;
  onSelect: (option: KnowledgeContextOption) => void;
  onDismiss?: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  const selectedIndex = Math.max(0, filtered.findIndex((o) => o.id === value));
  const [highlight, setHighlight] = useState(selectedIndex);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const safe = Math.min(highlight, Math.max(0, filtered.length - 1));
  useEffect(() => { setHighlight(q ? 0 : selectedIndex); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${safe}"]`)?.scrollIntoView({ block: "nearest" });
  }, [safe]);
  const choose = (o: KnowledgeContextOption | undefined) => {
    if (!o) return;
    if (o.id === value) onDismiss?.();
    else onSelect(o);
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setHighlight(Math.min(filtered.length - 1, safe + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setHighlight(Math.max(0, safe - 1)); }
    else if (event.key === "Home") { event.preventDefault(); setHighlight(0); }
    else if (event.key === "End") { event.preventDefault(); setHighlight(Math.max(0, filtered.length - 1)); }
    else if (event.key === "Enter") { event.preventDefault(); choose(filtered[safe]); }
  };
  return (
    <div className="luxia-knowledge-menu__inner" data-luxia-knowledge-list="compact">
      <label className="luxia-knowledge-search">
        <Search size={13} aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search constellations..."
          aria-label="Search constellations"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={filtered[safe] ? `${listId}-${safe}` : undefined}
          aria-autocomplete="list"
          data-luxia-knowledge-search=""
        />
      </label>
      <div ref={listRef} id={listId} role="listbox" aria-label="Knowledge in this Project" className="luxia-knowledge-list">
        {filtered.map((o, index) => {
          const selected = o.id === value;
          return (
            <button
              key={`${o.kind}-${o.id}`}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={selected}
              title={o.source ? `${o.label} (${o.source})` : o.label}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => choose(o)}
              className="luxia-knowledge-option"
              data-luxia-ctx-knowledge-option={o.id}
              data-index={index}
              data-selected={selected ? "" : undefined}
              data-highlighted={index === safe ? "" : undefined}
            >
              {o.kind === "galaxy" ? <LuxiaGalaxyIcon size={14} color="var(--luxia-purple-60)" /> : <LuxiaConstellationIcon size={14} color="var(--luxia-purple-60)" />}
              <span className="luxia-knowledge-option__name">{o.label}</span>
              {o.source ? <span className="luxia-ctx-tag">{o.source}</span> : null}
              <Check size={14} aria-hidden className="luxia-knowledge-option__check" style={{ visibility: selected ? "visible" : "hidden" }} />
            </button>
          );
        })}
        {filtered.length === 0 ? (
          <p className="px-2.5 py-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }} data-luxia-knowledge-empty="">
            {options.length === 0 ? "No knowledge you can use in this Project yet." : "No matching constellations"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function KnowledgeContextSelect({ options, value, onSelect, hasMessages, chatLabel }: {
  options: KnowledgeContextOption[];
  value: string | null;
  onSelect: (option: KnowledgeContextOption) => void;
  hasMessages: boolean;
  chatLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value) ?? null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="luxia-ctx-value"
          aria-label={`${current?.kind === "galaxy" ? "Galaxy" : "Constellation"}: ${current ? `${current.label}${current.source ? ` (${current.source})` : ""}` : "not chosen yet"}. Change knowledge`}
          data-luxia-ctx-knowledge=""
        >
          {current?.kind === "galaxy" ? <LuxiaGalaxyIcon size={13} color="currentColor" /> : current ? <LuxiaConstellationIcon size={13} color="currentColor" /> : null}
          <span className="luxia-ctx-name">{current?.label ?? "Choose knowledge"}</span>
          {current?.source ? <span className="luxia-ctx-tag">{current.source}</span> : null}
          <ChevronDown size={12} strokeWidth={2.25} aria-hidden className="luxia-ctx-chevron" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className={MENU} data-luxia-ctx-knowledge-menu="">
        <KnowledgeOptionsMenu options={options} value={value} onSelect={(o) => { setOpen(false); onSelect(o); }} hasMessages={hasMessages} chatLabel={chatLabel} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Minimal composer context: "Project: … › Constellation: …" (or "Galaxy: …") on one quiet
 * line under the typing field. Labels stay visible; values are inline dropdowns. State is the
 * application's own (active Project / active Chat) — this component only renders and reports.
 */
export function ComposerContextRow({ projects, projectId, onSelectProject, knowledge, knowledgeId, onSelectKnowledge, hasMessages, chatLabel }: {
  projects: ProjectContextOption[];
  projectId: string;
  onSelectProject: (projectId: string) => void;
  knowledge: KnowledgeContextOption[];
  knowledgeId: string | null;
  onSelectKnowledge: (option: KnowledgeContextOption) => void;
  hasMessages: boolean;
  chatLabel: string;
}): ReactNode {
  // Label the knowledge by what it is: a Constellation, or Galaxy (never call Galaxy a Constellation).
  const knowledgeLabel = knowledge.find((o) => o.id === knowledgeId)?.kind === "galaxy" ? "Galaxy:" : "Constellation:";
  return (
    <>
      <span className="luxia-ctx-group" data-luxia-ctx-group="project">
        <span className="luxia-ctx-label">Project:</span>
        <ProjectContextSelect projects={projects} value={projectId} onSelect={onSelectProject} />
      </span>
      <ChevronRight size={12} aria-hidden className="luxia-ctx-sep" />
      <span className="luxia-ctx-group luxia-ctx-group--knowledge" data-luxia-ctx-group="knowledge">
        <span className="luxia-ctx-label">{knowledgeLabel}</span>
        <KnowledgeContextSelect options={knowledge} value={knowledgeId} onSelect={onSelectKnowledge} hasMessages={hasMessages} chatLabel={chatLabel} />
      </span>
    </>
  );
}
