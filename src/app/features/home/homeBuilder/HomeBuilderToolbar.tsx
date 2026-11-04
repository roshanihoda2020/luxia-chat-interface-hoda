import { useEffect, useRef, useState } from "react";
import { Check, LayoutGrid, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";

interface HomeBuilderToolbarProps {
  editing: boolean;
  onCustomize: () => void;
  onAddTile: () => void;
  onResetToDefault: () => void;
  onDone: () => void;
  /** False when the layout already matches the default. */
  canReset: boolean;
}

/**
 * Sits at the top of the customizable Home area, below the protected header.
 * Not editing: one clear "Customize Home" button. Editing: a toolbar that
 * stays at the top of the page while scrolling (sticky within the Home
 * scroll area, so it never floats over tiles at rest), compacting once stuck.
 * Add Tile is the primary action, Done the exit, Reset a quiet secondary action.
 */
export function HomeBuilderToolbar({
  editing,
  onCustomize,
  onAddTile,
  onResetToDefault,
  onDone,
  canReset,
}: HomeBuilderToolbarProps) {
  const customizeRef = useRef<HTMLButtonElement>(null);
  const addTileRef = useRef<HTMLButtonElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const previousEditing = useRef(editing);
  const [stuck, setStuck] = useState(false);

  // The button that was pressed disappears when the mode changes; keep keyboard focus nearby.
  useEffect(() => {
    if (previousEditing.current === editing) return;
    previousEditing.current = editing;
    (editing ? addTileRef : customizeRef).current?.focus();
  }, [editing]);

  // "Stuck" once the spot the toolbar started at has scrolled out of the Home scroll area.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!editing || !sentinel || typeof IntersectionObserver === "undefined") {
      setStuck(false);
      return;
    }
    const root = sentinel.closest<HTMLElement>(".luxia-home-shell");
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { root, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [editing]);

  if (!editing) {
    return (
      // The start of the customizable area: one line saying what can be changed, and the action.
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p
          id="home-customize-hint"
          className="min-w-0 luxia-type-body-dense"
          style={{ color: "var(--luxia-text-secondary)" }}
        >
          Make Home yours — add, move and resize tiles.
        </p>
        <Button
          ref={customizeRef}
          type="button"
          variant="secondary"
          onClick={onCustomize}
          data-home-customize-entry=""
          className="luxia-home-customize-entry luxia-home-touch-target"
          aria-describedby="home-customize-hint"
        >
          <LayoutGrid size={16} strokeWidth={2.25} aria-hidden style={{ color: "var(--luxia-purple-60)" }} />
          Customize Home
        </Button>
      </div>
    );
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <div
        role="toolbar"
        aria-label="Customize Home"
        data-home-builder-toolbar=""
        data-stuck={stuck ? "" : undefined}
        className="luxia-home-builder-toolbar sticky top-0 z-[35] mb-5 flex items-center justify-end gap-3 rounded-[var(--luxia-radius-12)] border px-3 py-2.5 sm:justify-between sm:px-4"
      >
        {/* Phones: the global mobile nav button sits top-left, so only the actions show (right-aligned). */}
        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: "var(--luxia-purple-60)", color: "var(--luxia-text-inverse)" }}
          >
            <LayoutGrid size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="truncate luxia-type-title-component" style={{ color: "var(--luxia-purple-70)" }}>
              Customizing Home
            </p>
            {!stuck ? (
              <p className="hidden truncate luxia-type-caption md:block" style={{ color: "var(--luxia-text-secondary)" }}>
                Drag tiles to move them. Only your Home changes.
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="tertiary"
                onClick={onResetToDefault}
                disabled={!canReset}
                aria-label="Reset to default"
                className="luxia-home-touch-target luxia-home-toolbar-reset"
              >
                <RotateCcw size={15} strokeWidth={2} aria-hidden />
                <span className="max-sm:hidden">Reset</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {canReset ? "Reset Home to the default tiles (you can undo)" : "Home already uses the default tiles"}
            </TooltipContent>
          </Tooltip>
          <span aria-hidden className="mx-0.5 hidden h-6 w-px sm:block" style={{ background: "var(--luxia-border-default)" }} />
          <Button
            ref={addTileRef}
            type="button"
            variant="primary"
            onClick={onAddTile}
            className="luxia-home-touch-target"
          >
            <Plus size={16} strokeWidth={2.25} aria-hidden />
            Add Tile
          </Button>
          <Button type="button" variant="secondary" onClick={onDone} className="luxia-home-touch-target">
            <Check size={16} strokeWidth={2.25} aria-hidden />
            Done
          </Button>
        </div>
      </div>
    </>
  );
}
