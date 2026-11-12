import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import type { HomeProjectCard } from "@/app/features/project/types";
import { LuxiaProjectsIcon } from "@/assets/icons";

/**
 * Chat-level entry point to the ONE Project selection (same switch function and
 * state as the sidebar switcher). Labelled "Current Project"; opens "Switch Project".
 */
export function CurrentProjectControl({
  projects,
  value,
  roleLabel,
  readiness,
  onSwitch,
  appearance = "bar",
}: {
  /** bar = FINAL chat bar (with overline); header = page-header action; context = beside the title area. */
  appearance?: "bar" | "header" | "context" | "composer" | "inline";
  projects: HomeProjectCard[];
  value: string;
  roleLabel: string;
  readiness: (projectId: string) => number;
  onSwitch: (projectId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = projects.find((p) => p.id === value) ?? projects[0];
  const label = (
    <span className="block luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>Current Project</span>
  );

  // Header/context placements: with one Project the breadcrumb already names it, so no extra label.
  // Composer (option D): the field is always labelled PROJECT, so one Project shows as plain, non-interactive text.
  if (projects.length <= 1 && appearance === "composer") {
    return (
      <span className="inline-flex h-[30px] min-w-0 max-w-[240px] items-center gap-1.5 px-1 luxia-type-body-small-strong" style={{ color: "var(--luxia-text-secondary)" }} title={`${current?.name} (your only Project)`} aria-label={`Project: ${current?.name}. Your only Project`} data-ux-current-project="single">
        <LuxiaProjectsIcon size={14} color="currentColor" />
        <span className="truncate">{current?.name}</span>
      </span>
    );
  }
  // D2 inline: one Project → plain value next to the visible "Project:" label.
  if (projects.length <= 1 && appearance === "inline") {
    return <span className="ux-d2-value ux-d2-value--static" aria-label={`Project: ${current?.name}. Your only Project`} data-ux-current-project="single"><span className="ux-d2-name">{current?.name}</span></span>;
  }
  if (projects.length <= 1 && appearance !== "bar") return null;
  if (projects.length <= 1) {
    return (
      <div className="min-w-0" data-ux-current-project="single">
        {label}
        <div className="mt-1 inline-flex min-w-0 items-center gap-2 rounded-[10px] border border-dashed px-3 py-1.5" style={{ borderColor: "var(--luxia-border-default)" }} aria-label={`Current Project: ${current?.name}. Your only Project`}>
          <LuxiaProjectsIcon size={14} color="var(--luxia-purple-60)" />
          <span className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{current?.name}</span>
          <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>· Your only Project</span>
        </div>
      </div>
    );
  }

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className={appearance === "inline" ? "inline-flex min-w-0" : "min-w-0"} data-ux-current-project="switcher" data-ux-project-appearance={appearance}>
      {appearance === "bar" ? label : null}
      <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
        <PopoverTrigger asChild>
          {appearance === "inline" ? (
            <button type="button" className="ux-d2-value" aria-label={`Project: ${current?.name}. Switch Project`} data-ux-chat-project-trigger="">
              <span className="ux-d2-name">{current?.name}</span>
              <ChevronDown size={12} strokeWidth={2.25} aria-hidden className="ux-d2-chevron" />
            </button>
          ) : (
          <Button
            type="button"
            variant={appearance === "context" ? "tertiary" : "secondary"}
            size="compact"
            className={appearance === "bar" ? "mt-1 max-w-full" : appearance === "composer" ? "h-[30px] max-w-full px-2" : "max-w-full"}
            title={`Switch Project (current: ${current?.name})`}
            aria-label={`Current Project: ${current?.name}. Switch Project`}
            data-ux-chat-project-trigger=""
          >
            <LuxiaProjectsIcon size={14} color="currentColor" />
            <span className={`${appearance === "bar" ? "max-w-[260px]" : appearance === "composer" ? "max-w-[220px]" : "max-w-[200px]"} truncate`}>{current?.name}</span>
            <ChevronDown size={14} aria-hidden style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 140ms ease" }} />
          </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" side={appearance === "composer" || appearance === "inline" ? "top" : "bottom"} className="w-[340px] max-w-[calc(100vw-24px)] p-2" data-ux-switch-project-menu="">
          <p className="px-2.5 pb-1 pt-1 luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>Switch Project</p>
          <p className="px-2.5 pb-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>Your chats stay in their Project. Knowledge is chosen inside each Project.</p>
          {projects.length > 4 ? (
            <label className="mb-1.5 flex items-center gap-2 rounded-[8px] border px-2 py-1.5" style={{ borderColor: "var(--luxia-border-default)" }}>
              <Search size={13} color="var(--luxia-text-muted)" aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Projects" aria-label="Search Projects" className="min-w-0 flex-1 bg-transparent outline-none luxia-type-body-dense" autoFocus />
            </label>
          ) : null}
          <div role="listbox" aria-label="Projects" className="max-h-[320px] overflow-y-auto">
            {filtered.map((p) => {
              const selected = p.id === value;
              const ready = readiness(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => { setOpen(false); setQuery(""); if (!selected) onSwitch(p.id); }}
                  className="flex w-full items-start gap-2.5 rounded-[8px] px-2.5 py-2 text-left outline-none hover:bg-[var(--luxia-opacity-brand-secondary-08)] focus-visible:bg-[var(--luxia-opacity-brand-secondary-08)]"
                  data-ux-switch-project-option={p.id}
                >
                  <LuxiaProjectsIcon size={15} color={selected ? "var(--luxia-purple-60)" : "var(--luxia-text-muted)"} />
                  <span className="min-w-0 flex-1">
                    <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{p.name}</span>
                    <span className="block luxia-type-caption" style={{ color: ready ? "var(--luxia-text-muted)" : "var(--luxia-warning-90)" }}>
                      {`${roleLabel} · ${ready ? `${ready} Constellation${ready === 1 ? "" : "s"}` : "Needs knowledge"}`}
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
    </div>
  );
}

/** The visible way to find older chats in this Project (opens the Project Chats page). */
export function FindChatsButton({ onClick, count }: { onClick: () => void; count: number }) {
  return (
    <Button type="button" variant="secondary" size="compact" onClick={onClick} aria-label={`Find chats in this Project (${count})`} data-ux-find-chats="">
      <Search size={14} aria-hidden />Find chats
    </Button>
  );
}
