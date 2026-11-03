import { useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { SearchField } from "@/app/features/shared/SearchField";
import { canAddHomeTileType, isHomeTileTargetOnLayout } from "./layoutOps";
import {
  HOME_TILE_CATEGORY_LABELS,
  HOME_TILE_DEFINITIONS,
  type HomeTileCategory,
  type HomeTileDefinition,
} from "./registry";
import type { HomeLayout, HomeTileTarget, HomeTileType } from "./types";

/** One item the current user can already access, offered for a specific-item tile. */
export interface HomeTileTargetOption {
  target: HomeTileTarget;
  label: string;
  detail?: string;
}

/** Catalog entries that exist in Luxia but cannot be a Home Tile yet. */
const NOT_YET_AVAILABLE: Array<{ label: string; description: string; category: HomeTileCategory; reason: string }> = [
  {
    label: "Saved output",
    description: "A single saved Dashboard output.",
    category: "projects",
    reason: "Output changes are not saved in the prototype yet.",
  },
  {
    label: "Vidget",
    description: "A Vidget's status and settings.",
    category: "tools",
    reason: "Vidget access checks are not ready for Home yet.",
  },
];

const CATEGORY_ORDER: HomeTileCategory[] = ["home", "projects", "conversations", "knowledge", "tools"];

interface HomeTileLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: HomeLayout;
  /** Accessible items per specific-item tile type. */
  targetOptions: Partial<Record<HomeTileType, HomeTileTargetOption[]>>;
  onAdd: (type: HomeTileType, target?: HomeTileTarget) => void;
}

export function sameHomeTileTarget(a: HomeTileTarget | null | undefined, b: HomeTileTarget): boolean {
  return Boolean(a && a.scope === b.scope && a.entityId === b.entityId);
}

export function HomeTileLibrary({
  open,
  onOpenChange,
  layout,
  targetOptions,
  onAdd,
}: HomeTileLibraryProps) {
  const [pickType, setPickType] = useState<HomeTileType | null>(null);
  const [query, setQuery] = useState("");
  // Opened from a plain button (not a DialogTrigger), so remember where focus should return.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPickType(null);
      setQuery("");
    }
    onOpenChange(next);
  }

  function add(type: HomeTileType, target?: HomeTileTarget) {
    onAdd(type, target);
    handleOpenChange(false);
  }

  const pickDefinition = pickType ? HOME_TILE_DEFINITIONS[pickType] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        onOpenAutoFocus={() => {
          // Runs before focus moves into the dialog.
          returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current;
          if (target?.isConnected) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{pickDefinition ? `Add ${pickDefinition.label} tile` : "Home Tile Library"}</DialogTitle>
          <DialogDescription>
            {pickDefinition
              ? "Choose the item this tile shows. Only items you can already open are listed."
              : "Add tiles to your Home. Tiles only change your Home — nothing else in Luxia."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(60vh,560px)] overflow-y-auto px-6 py-5">
          {pickDefinition && pickType ? (
            <TargetPicker
              definition={pickDefinition}
              options={targetOptions[pickType] ?? []}
              entryState={(target) => {
                const onHome = isHomeTileTargetOnLayout(layout, pickType, target);
                return { status: onHome ? "On your Home" : null, selectable: !onHome };
              }}
              actionLabel="Add"
              query={query}
              onQueryChange={setQuery}
              onBack={() => {
                setPickType(null);
                setQuery("");
              }}
              onPick={(target) => add(pickType, target)}
            />
          ) : (
            <Catalog
              layout={layout}
              targetOptions={targetOptions}
              onChoose={(definition) => {
                if (definition.requiresTarget) setPickType(definition.type);
                else add(definition.type);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Catalog({
  layout,
  targetOptions,
  onChoose,
}: {
  layout: HomeLayout;
  targetOptions: HomeTileLibraryProps["targetOptions"];
  onChoose: (definition: HomeTileDefinition) => void;
}) {
  const definitions = Object.values(HOME_TILE_DEFINITIONS);
  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((category) => {
        const tiles = definitions.filter((definition) => definition.category === category);
        const later = NOT_YET_AVAILABLE.filter((entry) => entry.category === category);
        if (tiles.length === 0 && later.length === 0) return null;
        return (
          <section key={category} aria-labelledby={`home-tile-library-${category}`}>
            <h3
              id={`home-tile-library-${category}`}
              className="mb-2 luxia-type-overline-data"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              {HOME_TILE_CATEGORY_LABELS[category]}
            </h3>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {tiles.map((definition) => {
                const atLimit = !canAddHomeTileType(layout, definition.type);
                const noItems =
                  definition.requiresTarget && (targetOptions[definition.type]?.length ?? 0) === 0;
                const status = atLimit ? "On your Home" : noItems ? "No items available" : null;
                return (
                  <li key={definition.type}>
                    <LibraryEntry
                      label={definition.label}
                      description={definition.description}
                      status={status}
                      actionLabel={definition.requiresTarget ? "Choose" : "Add"}
                      onSelect={status ? undefined : () => onChoose(definition)}
                    />
                  </li>
                );
              })}
              {later.map((entry) => (
                <li key={entry.label}>
                  <LibraryEntry
                    label={entry.label}
                    description={`${entry.description} ${entry.reason}`}
                    status="Not available yet"
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function LibraryEntry({
  label,
  description,
  status,
  actionLabel,
  onSelect,
  selected,
}: {
  label: string;
  description: string;
  status: string | null;
  actionLabel?: string;
  onSelect?: () => void;
  /** Configure Tile: whether this item is the one that will be saved. */
  selected?: boolean;
}) {
  const disabled = !onSelect;
  const choosing = selected !== undefined;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={choosing ? selected : undefined}
      aria-label={disabled
        ? `${label} — ${status}`
        : choosing ? `${label}${status ? ` — ${status}` : ""}` : `${actionLabel} ${label}`}
      className="flex h-full w-full min-w-0 items-start justify-between gap-3 rounded-[var(--luxia-radius-12)] border px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] enabled:hover:bg-[var(--luxia-opacity-brand-primary-04)] disabled:cursor-default"
      style={{
        borderColor: selected ? "var(--luxia-purple-60)" : "var(--luxia-border-default)",
        boxShadow: selected ? "inset 0 0 0 1px var(--luxia-purple-60)" : undefined,
        background: selected
          ? "var(--luxia-opacity-brand-primary-04)"
          : disabled ? "var(--luxia-neutral-surface-subtle, var(--luxia-surface))" : "var(--luxia-surface)",
      }}
    >
      <span className="min-w-0">
        <span
          className="block luxia-type-body-dense-strong"
          style={{ color: disabled ? "var(--luxia-text-secondary)" : "var(--luxia-purple-70)" }}
        >
          {label}
        </span>
        <span className="mt-0.5 block luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          {description}
        </span>
      </span>
      <span
        className="shrink-0 luxia-type-caption"
        style={{ color: disabled ? "var(--luxia-text-muted)" : "var(--luxia-purple-60)" }}
      >
        {status ?? actionLabel}
      </span>
    </button>
  );
}

/** Item list shared by Add Tile and Configure Tile. */
export function TargetPicker({
  definition,
  options,
  entryState,
  actionLabel,
  query,
  onQueryChange,
  onBack,
  onPick,
}: {
  definition: HomeTileDefinition;
  options: HomeTileTargetOption[];
  /** Status text ("On your Home", "Current"), whether the item can be chosen, and (Configure) whether it is selected. */
  entryState: (target: HomeTileTarget) => { status: string | null; selectable: boolean; selected?: boolean };
  actionLabel: string;
  query: string;
  onQueryChange: (value: string) => void;
  /** Back to the catalog; omitted in Configure Tile. */
  onBack?: () => void;
  onPick: (target: HomeTileTarget) => void;
}) {
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      `${option.label} ${option.detail ?? ""}`.toLowerCase().includes(needle),
    );
  }, [options, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {onBack ? (
          <Button type="button" variant="tertiary" size="compact" onClick={onBack}>
            <ChevronLeft size={14} aria-hidden />
            All tiles
          </Button>
        ) : null}
        <SearchField
          value={query}
          onChange={onQueryChange}
          placeholder={`Search ${definition.label.toLowerCase()} items`}
          aria-label={`Search ${definition.label} items`}
          className="min-w-[12rem] flex-1"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-6 text-center luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          {options.length === 0 ? "There are no items you can add here yet." : "No items match your search."}
        </p>
      ) : (
        <ul className="space-y-2" aria-label={`${definition.label} items`}>
          {filtered.map((option) => {
            const state = entryState(option.target);
            return (
              <li key={`${option.target.scope}:${option.target.entityId}`}>
                <LibraryEntry
                  label={option.label}
                  description={option.detail ?? ""}
                  status={state.status}
                  actionLabel={actionLabel}
                  selected={state.selected}
                  onSelect={state.selectable ? () => onPick(option.target) : undefined}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
