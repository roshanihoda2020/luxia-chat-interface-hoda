import { forwardRef, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ListChecks } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import type { VerifaiReview } from "../../types";
import { useReturnFocus } from "../useReturnFocus";
import { ChecklistNavigator } from "./ChecklistNavigator";
import { EvidenceAssistantPanel } from "./EvidenceAssistantPanel";
import { FindingsPanel } from "./FindingsPanel";

type LayoutMode = "three" | "two" | "tabs";
type Tab = "checklist" | "findings" | "evidence";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "checklist", label: "Checklist" },
  { id: "findings", label: "Findings" },
  { id: "evidence", label: "Evidence" },
];

/** Width of the workspace (not the window): the sidebar and page padding are already excluded. */
function modeFor(width: number): LayoutMode {
  if (width >= 1040) return "three";
  if (width >= 760) return "two";
  return "tabs";
}

/**
 * State C: the complete review as three coordinated panels — Checklist Navigator, Review Findings,
 * Evidence & AI Assistant. One selection drives all three; narrower widths fold the navigator into a
 * sheet, then into tabs.
 */
export const ResultsWorkspace = forwardRef<HTMLHeadingElement, { review: VerifaiReview }>(function ResultsWorkspace({ review }, headingRef) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => review.findings[0]?.requirementId ?? review.checklist.requirements[0]?.id ?? null,
  );
  const [mode, setMode] = useState<LayoutMode>("three");
  const [tab, setTab] = useState<Tab>("findings");
  const [navOpen, setNavOpen] = useState(false);
  const returnFocus = useReturnFocus(navOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => setMode(modeFor(el.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function select(requirementId: string) {
    setSelectedId(requirementId);
    if (mode === "tabs" && tab === "checklist") setTab("findings");
    if (mode === "two") setNavOpen(false);
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const i = (next + TABS.length) % TABS.length;
    setTab(TABS[i].id);
    tabRefs.current[i]?.focus();
  }

  const navigator = <ChecklistNavigator review={review} selectedId={selectedId} onSelect={select} />;
  // In tabs (narrow) the Evidence panel is a separate tab, so the cards keep their own evidence.
  const findings = <FindingsPanel ref={headingRef} review={review} selectedId={selectedId} onSelect={select} evidenceInPanel={mode !== "tabs"} />;
  const evidence = <EvidenceAssistantPanel review={review} selectedId={selectedId} />;

  return (
    <div ref={rootRef} className="lx-vws-results" data-mode={mode} data-vfy-results="">
      {mode === "three" ? (
        <div className="lx-vws-grid lx-vws-grid--three">{navigator}{findings}{evidence}</div>
      ) : mode === "two" ? (
        <>
          <div className="lx-vws-results__bar">
            <Button type="button" variant="secondary" size="sm" onClick={() => setNavOpen(true)} data-vfy-open-navigator="">
              <ListChecks size={14} aria-hidden /> Checklist
            </Button>
          </div>
          <div className="lx-vws-grid lx-vws-grid--two">{findings}{evidence}</div>
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            {/* lx-vws-sheet: the navigator fills the sheet and its list scrolls inside it. */}
            <SheetContent side="left" className="lx-vws-sheet flex h-full w-full flex-col gap-0 p-0 sm:max-w-[22rem]" onCloseAutoFocus={returnFocus} data-vfy-navigator-sheet="">
              <SheetHeader className="sr-only">
                <SheetTitle>Checklist Navigator</SheetTitle>
                <SheetDescription>Requirements and their results.</SheetDescription>
              </SheetHeader>
              {navigator}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <>
          <div className="lx-vws-tabs" role="tablist" aria-label="Review sections">
            {TABS.map((t, index) => (
              <button
                key={t.id}
                ref={(el) => { tabRefs.current[index] = el; }}
                type="button"
                role="tab"
                id={`lx-vws-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`lx-vws-tabpanel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                className="lx-vws-tab"
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKey(e, index)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`lx-vws-tabpanel-${tab}`} aria-labelledby={`lx-vws-tab-${tab}`} className="lx-vws-tabpanel">
            {tab === "checklist" ? navigator : tab === "findings" ? findings : evidence}
          </div>
        </>
      )}
    </div>
  );
});
