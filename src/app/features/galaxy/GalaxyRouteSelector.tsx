import { Check, X } from "lucide-react";
import { LuxiaGalaxyIcon } from "@/assets/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { LX } from "@/app/features/active-data-tables/tokens";
import { GALAXY_ROUTE_RESULT_LIMIT, type GalaxyMatchedConstellation, type GalaxyRouteMode } from "./constants";

export type GalaxyRouteOption = {
  id: string;
  label: string;
  type: "PDF" | "DB";
};

export function GalaxyRouteSelector({
  routeMode,
  pendingManual,
  options,
  onSelectAuto,
  onSelectManual,
  onClearManual,
}: {
  routeMode: GalaxyRouteMode;
  pendingManual: GalaxyMatchedConstellation | null;
  options: GalaxyRouteOption[];
  onSelectAuto: () => void;
  onSelectManual: (option: GalaxyRouteOption) => void;
  onClearManual: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = !q ? options : options.filter((o) => o.label.toLowerCase().includes(q));
    return all.slice(0, GALAXY_ROUTE_RESULT_LIMIT);
  }, [options, query]);

  useEffect(() => {
    if (!menuOpen && !pickerOpen) return;
    function onPointer(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
      setPickerOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setPickerOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [pickerOpen]);

  function openMenu() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: r.top - 8, left: r.left });
    setMenuOpen(true);
    setPickerOpen(false);
    setQuery("");
  }

  function openPicker() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: r.top - 8, left: r.left });
    setMenuOpen(false);
    setPickerOpen(true);
    setFocusIndex(0);
  }

  const label = routeMode === "manual" && pendingManual
    ? `Route: ${pendingManual.label}`
    : "Route: Auto";

  return (
    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2" style={{ paddingLeft: "calc(2.25rem + 20px + 28px)" }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen || pickerOpen}
        onClick={() => (menuOpen || pickerOpen ? (setMenuOpen(false), setPickerOpen(false)) : openMenu())}
        className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 luxia-type-caption outline-none transition-colors"
        style={{
          color: LX.primary,
          background: "rgba(48,33,78,0.06)",
          border: `1px solid rgba(142,99,235,0.22)`,
        }}
      >
        <LuxiaGalaxyIcon size={11} style={{ color: LX.secondary }} />
        {label}
      </button>

      {pendingManual ? (
        <span
          className="inline-flex max-w-full items-center gap-1.5 rounded-[8px] px-2 py-1 luxia-type-caption"
          style={{ color: LX.primary, background: "rgba(142,99,235,0.10)", border: `1px solid rgba(142,99,235,0.18)` }}
        >
          <span className="min-w-0 truncate">{pendingManual.label} · {pendingManual.type}</span>
          <button
            type="button"
            aria-label="Clear constellation selection"
            onClick={onClearManual}
            className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full outline-none"
          >
            <X size={10} style={{ color: LX.textMuted }} />
          </button>
        </span>
      ) : null}

      {(menuOpen || pickerOpen) && menuPos && ReactDOM.createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[9999] overflow-hidden rounded-[12px] py-1.5"
          style={{
            top: undefined,
            bottom: window.innerHeight - menuPos.top,
            left: menuPos.left,
            width: pickerOpen ? 280 : 260,
            background: "white",
            border: `1px solid ${LX.border}`,
            boxShadow: LX.shadow.lg,
          }}
        >
          {menuOpen ? (
            <>
              <button
                type="button"
                role="menuitem"
                className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left outline-none transition-colors"
                style={{ background: routeMode === "auto" ? LX.state.secondary08 : "transparent" }}
                onClick={() => { onSelectAuto(); setMenuOpen(false); }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.state.secondary08; }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    routeMode === "auto" ? LX.state.secondary08 : "transparent";
                }}
              >
                <span className="flex items-center gap-2 luxia-type-body-dense-strong" style={{ color: LX.primary }}>
                  Auto {routeMode === "auto" ? <Check size={12} style={{ color: LX.secondary }} /> : null}
                </span>
                <span className="luxia-type-caption" style={{ color: LX.textMuted }}>
                  Galaxy finds the best constellation
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left outline-none transition-colors"
                onClick={openPicker}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.state.secondary08; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Specific constellation</span>
                <span className="luxia-type-caption" style={{ color: LX.textMuted }}>
                  Choose one constellation for this question
                </span>
              </button>
            </>
          ) : (
            <div className="px-2 pb-1 pt-1">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setFocusIndex(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFocusIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFocusIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && filtered[focusIndex]) {
                    e.preventDefault();
                    onSelectManual(filtered[focusIndex]);
                    setPickerOpen(false);
                  }
                }}
                placeholder="Search constellations…"
                aria-label="Search constellations"
                className="mb-1.5 h-8 w-full rounded-[8px] px-2.5 outline-none luxia-type-caption"
                style={{ border: `1px solid ${LX.border}`, background: LX.subtle, color: LX.primary }}
              />
              <div className="max-h-[200px] overflow-y-auto" role="listbox" aria-label="Project constellations">
                {filtered.length === 0 ? (
                  <p className="px-2 py-3 luxia-type-caption" style={{ color: LX.textMuted }}>No results</p>
                ) : (
                  filtered.map((option, index) => (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={pendingManual?.id === option.id}
                      className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left outline-none"
                      style={{ background: index === focusIndex ? LX.state.secondary08 : "transparent" }}
                      onMouseEnter={() => setFocusIndex(index)}
                      onClick={() => { onSelectManual(option); setPickerOpen(false); }}
                    >
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <span className="block truncate luxia-type-caption" style={{ color: LX.primary, fontWeight: 600 }}>
                          {option.label}
                        </span>
                        <span className="mt-0.5 block luxia-type-caption" style={{ color: LX.textMuted }}>
                          {option.type}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
