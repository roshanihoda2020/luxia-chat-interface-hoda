import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { LuxiaConstellationIcon, LuxiaGalaxyIcon } from "@/assets/icons";
import { getConstellationSourceLabel } from "@/app/app-sections/appSectionShared";
import type { Constellation } from "@/app/app-sections/appSectionShared";
import { Button } from "@/app/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import type { Scope } from "../model";
import { KnowledgeChoices, ScopeName } from "../shared";
import "./composerContext.css";
import "./composerContextMinimal.css";

/** Small always-visible field label (same overline style as other Luxia labels). */
function FieldLabel({ area, children, id }: { area: string; children: ReactNode; id?: string }) {
  return (
    <span id={id} className="luxia-type-overline-data" style={{ gridArea: area, color: "var(--luxia-text-muted)" }} data-ux-d-label={area}>
      {children}
    </span>
  );
}

/**
 * ANSWERS FROM selector (option D). Same list, same state and same safe rule as the
 * right inspector's selector: empty chat → changes this chat; chat with messages →
 * a new chat with the chosen knowledge (the original keeps its messages and knowledge).
 */
export function KnowledgeContextSelect({ scope, constellations, open, onOpenChange, onChoose, hasMessages, chatLabel, disabledText, minimal = false, emptyAction }: {
  /** D2: inline text trigger (no border), subtle source tag. */
  minimal?: boolean;
  /** D2 no-knowledge state: role-aware action (e.g. "Set up knowledge"). */
  emptyAction?: ReactNode;
  scope: Scope | null;
  constellations: Constellation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (scope: Scope) => void;
  hasMessages: boolean;
  chatLabel?: string;
  disabledText?: string;
}) {
  if (disabledText && minimal) {
    return (
      <span className="inline-flex min-w-0 items-center gap-2" data-ux-d-knowledge="disabled">
        <span className="ux-d2-value ux-d2-value--static ux-d2-value--muted">{disabledText}</span>
        {emptyAction}
      </span>
    );
  }
  if (disabledText) {
    return <span className="inline-flex h-[30px] items-center px-1 luxia-type-body-small-strong" style={{ color: "var(--luxia-text-muted)" }} data-ux-d-knowledge="disabled">{disabledText}</span>;
  }
  const name = scope ? (scope.kind === "galaxy" ? "Galaxy" : constellations.find((c) => c.id === scope.id)?.label ?? "Constellation") : null;
  const current = scope?.kind === "constellation" ? constellations.find((c) => c.id === scope.id) : undefined;
  const menu = (
    <PopoverContent align="start" side="top" className="w-[340px] max-w-[calc(100vw-24px)] p-2" onFocusOutside={(e) => e.preventDefault()} data-ux-d-knowledge-menu="">
      <KnowledgeChoices scope={scope} constellations={constellations} onChoose={onChoose} hasMessages={hasMessages} chatLabel={chatLabel} />
    </PopoverContent>
  );
  if (minimal) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button type="button" className={`ux-d2-value${scope ? "" : " ux-d2-value--required"}`} aria-label={`Answers from: ${name ?? "not chosen yet"}${current ? ` (${getConstellationSourceLabel(current.type)})` : ""}. Change knowledge`} data-ux-d-knowledge="">
            {scope?.kind === "galaxy" ? <LuxiaGalaxyIcon size={13} color="currentColor" /> : scope ? <LuxiaConstellationIcon size={13} color="currentColor" /> : null}
            <span className="ux-d2-name">{name ?? "Choose knowledge"}</span>
            {current ? <span className="ux-d2-tag" data-ux-d2-source="">{getConstellationSourceLabel(current.type)}</span> : null}
            <ChevronDown size={12} strokeWidth={2.25} aria-hidden className="ux-d2-chevron" />
          </button>
        </PopoverTrigger>
        {menu}
      </Popover>
    );
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="compact"
          className="h-[30px] max-w-full px-2"
          aria-label={`Answers from: ${name ?? "not chosen yet"}. Change knowledge`}
          title={name ? `Answers from ${name}` : "Choose the knowledge this chat answers from"}
          data-ux-d-knowledge=""
          style={!scope ? { borderColor: "var(--luxia-purple-50)", color: "var(--luxia-purple-70)" } : undefined}
        >
          <span className="inline-flex min-w-0 max-w-[240px] items-center gap-1.5" style={{ color: "var(--luxia-purple-70)" }}>
            {scope ? <ScopeName scope={scope} constellations={constellations} /> : <span className="luxia-type-body-dense-strong">Choose knowledge</span>}
          </span>
          <ChevronDown size={14} aria-hidden style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 140ms ease" }} />
        </Button>
      </PopoverTrigger>
      {menu}
    </Popover>
  );
}

/** The labelled fields; `display: contents` so they join the composer row's grid. */
function Fields({ project, knowledge, withResponse }: { project: ReactNode; knowledge: ReactNode; withResponse: boolean }) {
  return (
    <div className="ux-d-fields" data-ux-d-fields="">
      <FieldLabel area="pl">Project</FieldLabel>
      <FieldLabel area="kl">Answers from</FieldLabel>
      {withResponse ? <FieldLabel area="rl">Response</FieldLabel> : null}
      <div className="min-w-0" style={{ gridArea: "pc" }} data-ux-d-project="">{project}</div>
      <div className="min-w-0" style={{ gridArea: "kc" }}>{knowledge}</div>
    </div>
  );
}

/** D2: label and value on one baseline; "›" reads Project → its knowledge. */
function InlineFields({ project, knowledge }: { project: ReactNode; knowledge: ReactNode }) {
  return (
    <div className="ux-d-fields" data-ux-d-fields="">
      <span className="ux-d2-group" data-ux-d-project="">
        <span className="ux-d2-label" data-ux-d-label="pl">Project:</span>
        {project}
      </span>
      <ChevronRight size={12} aria-hidden className="ux-d2-sep" />
      <span className="ux-d2-group ux-d2-group--knowledge">
        <span className="ux-d2-label" data-ux-d-label="kl">Answers from:</span>
        {knowledge}
      </span>
    </div>
  );
}

/**
 * Places PROJECT and ANSWERS FROM in the REAL composer's existing control row, next to
 * its own response-type control ("Standard"), which stays untouched. PromptComposer has
 * no slot for this, so the prototype inserts the fields (portal). Galaxy chats have no
 * response-type row: the fields get their own row there, above Galaxy's route selector.
 * Real implementation: one optional `contextControls` slot in PromptComposer (flagged).
 */
export function ComposerContextRow({ composerRef, chatKey, project, knowledge, variant = "d" }: {
  variant?: "d" | "d2";
  composerRef: RefObject<HTMLDivElement | null>;
  chatKey: string;
  project: ReactNode;
  knowledge: ReactNode;
}) {
  const container = useMemo(() => { const el = document.createElement("div"); el.className = "ux-d-fields-host"; return el; }, []);
  const galaxyHost = useMemo(() => { const el = document.createElement("div"); el.setAttribute("data-ux-d-row", "galaxy"); el.className = variant === "d2" ? "ux-d2-row ux-d2-row--galaxy" : "ux-d-row ux-d-row--galaxy"; return el; }, [variant]);
  const [withResponse, setWithResponse] = useState(true);

  useEffect(() => {
    const root = composerRef.current;
    if (!root) return;
    const sync = () => {
      const shell = root.querySelector<HTMLElement>("[data-ux-composer]")?.firstElementChild as HTMLElement | null; // PromptComposer's outer div
      if (!shell) return;
      // The response-type row: the direct child that holds the "Standard"/"Narrative" button.
      const responseRow = Array.from(shell.children).find((c) => c !== galaxyHost && c.classList.contains("mt-2") && !c.classList.contains("flex") && c.querySelector(":scope > button")) as HTMLElement | undefined;
      if (responseRow) {
        if (!responseRow.hasAttribute("data-ux-d-row")) { responseRow.setAttribute("data-ux-d-row", "composer"); responseRow.classList.add(variant === "d2" ? "ux-d2-row" : "ux-d-row"); }
        if (container.parentElement !== responseRow) responseRow.insertBefore(container, responseRow.firstChild);
        if (galaxyHost.parentElement) galaxyHost.remove();
        setWithResponse(true);
      } else {
        const inputRow = shell.firstElementChild;
        if (inputRow && galaxyHost.previousElementSibling !== inputRow) inputRow.after(galaxyHost);
        if (container.parentElement !== galaxyHost) galaxyHost.appendChild(container);
        setWithResponse(false);
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); container.remove(); galaxyHost.remove(); };
  }, [composerRef, container, galaxyHost, chatKey, variant]);

  return createPortal(variant === "d2" ? <InlineFields project={project} knowledge={knowledge} /> : <Fields project={project} knowledge={knowledge} withResponse={withResponse} />, container);
}

/** Same fields when there is no composer (Project without usable knowledge). */
export function StandaloneContextRow({ project, knowledge, variant = "d" }: { project: ReactNode; knowledge: ReactNode; variant?: "d" | "d2" }) {
  if (variant === "d2") {
    return (
      <div className="ux-d2-row ux-d2-row--galaxy px-8 pb-5" data-ux-d-row="standalone">
        <div className="ux-d-fields-host"><InlineFields project={project} knowledge={knowledge} /></div>
      </div>
    );
  }
  return (
    <div className="ux-d-row ux-d-row--galaxy px-8 pb-5" data-ux-d-row="standalone">
      <div className="ux-d-fields-host"><Fields project={project} knowledge={knowledge} withResponse={false} /></div>
    </div>
  );
}
