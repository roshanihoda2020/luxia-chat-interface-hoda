import { useEffect, useRef } from "react";
import { LayoutGrid, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";

interface HomeBuilderToolbarProps {
  editing: boolean;
  onCustomize: () => void;
  onAddTile: () => void;
  onResetToDefault: () => void;
  onDone: () => void;
  /** False when the layout already matches the default. */
  canReset: boolean;
}

/** Sits at the top of the customizable Home area, below the protected header. */
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
  const previousEditing = useRef(editing);

  // The button that was pressed disappears when the mode changes; keep keyboard focus nearby.
  useEffect(() => {
    if (previousEditing.current === editing) return;
    previousEditing.current = editing;
    (editing ? addTileRef : customizeRef).current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <div className="mb-3 flex justify-end">
        <Button ref={customizeRef} type="button" variant="tertiary" size="compact" onClick={onCustomize}>
          <LayoutGrid size={14} strokeWidth={2} aria-hidden />
          Customize Home
        </Button>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Customizing Home"
      className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-[var(--luxia-radius-12)] border px-4 py-3"
      style={{
        borderColor: "var(--luxia-opacity-brand-primary-16)",
        background: "var(--luxia-surface)",
        boxShadow: "var(--luxia-shadow-sm)",
      }}
    >
      <div className="min-w-0">
        <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>
          Customizing Home
        </p>
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          Add or remove Home Tiles. Changes are saved for you only and don't affect your Projects or other data.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="tertiary"
          size="compact"
          onClick={onResetToDefault}
          disabled={!canReset}
        >
          <RotateCcw size={14} strokeWidth={2} aria-hidden />
          Reset to default
        </Button>
        <Button ref={addTileRef} type="button" {...LUXIA_PAGE_HEADER_ACTION.secondary} onClick={onAddTile}>
          <Plus size={14} strokeWidth={2.25} aria-hidden />
          Add Tile
        </Button>
        <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
