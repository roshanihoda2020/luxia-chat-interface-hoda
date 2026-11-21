import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { SearchField } from "@/app/features/shared";
import type { VerifaiRequirementStatus, VerifaiReview } from "../../types";

type Filter = "all" | "issues" | "met";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "issues", label: "Issues" },
  { id: "met", label: "Met" },
];

export const REQUIREMENT_STATUS_TONE: Record<VerifaiRequirementStatus, string> = {
  Met: "met",
  "Not met": "not-met",
  "Partially met": "partial",
  Unclear: "unclear",
  "Not assessed": "not-assessed",
};

/** Left panel: every checklist requirement with its stored result; selecting one syncs the other panels. */
export function ChecklistNavigator({
  review,
  selectedId,
  onSelect,
}: {
  review: VerifaiReview;
  selectedId: string | null;
  onSelect: (requirementId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const listRef = useRef<HTMLDivElement>(null);
  const resultById = useMemo(() => new Map(review.requirementResults.map((r) => [r.requirementId, r])), [review]);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: Array<{ title: string; items: typeof review.checklist.requirements }> = [];
    for (const requirement of review.checklist.requirements) {
      const status = resultById.get(requirement.id)?.status ?? "Not assessed";
      if (filter === "issues" && (status === "Met" || status === "Not assessed")) continue;
      if (filter === "met" && status !== "Met") continue;
      if (q && !requirement.id.toLowerCase().includes(q) && !requirement.text.toLowerCase().includes(q)) continue;
      const title = requirement.section ?? "Requirements";
      let section = out.find((s) => s.title === title);
      if (!section) { section = { title, items: [] }; out.push(section); }
      section.items.push(requirement);
    }
    return out;
  }, [review, resultById, query, filter]);

  // ↑/↓ move between requirement rows.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const rows = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("[data-vfy-nav-req]") ?? [])];
    const index = rows.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    rows[Math.max(0, Math.min(rows.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
  }

  const total = review.checklist.requirements.length;
  const met = review.requirementResults.filter((r) => r.status === "Met").length;

  return (
    <nav className="lx-vws-panel lx-vws-nav" aria-label="Checklist Navigator" data-vfy-navigator="">
      <div className="lx-vws-panel__head">
        <h3 className="lx-vws-panel__title">Checklist</h3>
        <p className="lx-vws-panel__meta">{met} of {total} met</p>
        <SearchField value={query} onChange={setQuery} placeholder="Search requirements" aria-label="Search requirements" />
        <div className="lx-vws-chips" role="group" aria-label="Show requirements">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="lx-vws-chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
      </div>
      <div ref={listRef} className="lx-vws-panel__scroll" onKeyDown={onKeyDown}>
        {sections.length === 0 ? <p className="lx-vws-empty">No requirements match.</p> : null}
        {sections.map((section) => (
          <section key={section.title} className="lx-vws-nav__section" aria-label={section.title}>
            <h4 className="lx-vws-nav__section-title">{section.title} <span>· {section.items.length}</span></h4>
            <ul>
              {section.items.map((requirement) => {
                const status = resultById.get(requirement.id)?.status ?? "Not assessed";
                const isSelected = selectedId === requirement.id;
                return (
                  <li key={requirement.id}>
                    <button
                      type="button"
                      className="lx-vws-nav__req"
                      data-vfy-nav-req={requirement.id}
                      data-selected={isSelected || undefined}
                      aria-current={isSelected ? "true" : undefined}
                      onClick={() => onSelect(requirement.id)}
                    >
                      <span className="lx-vws-status-dot" data-tone={REQUIREMENT_STATUS_TONE[status]} aria-hidden />
                      <span className="lx-vws-nav__req-body">
                        <span className="lx-vws-nav__req-top">
                          <span className="lx-vfy-req-id">{requirement.id}</span>
                          <span className="lx-vws-status-label" data-tone={REQUIREMENT_STATUS_TONE[status]}>{status}</span>
                        </span>
                        <span className="lx-vws-nav__req-text">{requirement.text}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
