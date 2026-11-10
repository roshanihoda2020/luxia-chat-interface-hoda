import { useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { HOME_PROJECTS_VIEW_COPY, getHomeProjectsView } from "./collections";
import { isHomeTileTargetOnLayout } from "./layoutOps";
import { getHomeTileDefinition, getHomeTileStartingSurface, getHomeTileSurfaceStyle, homeTileUsesContentHeight } from "./registry";
import { sameHomeTileTarget, TargetPicker, type HomeTileTargetOption } from "./HomeTileLibrary";
import "./homeTileSurfaces.css";
import {
  HOME_PROJECTS_VIEWS,
  HOME_TILE_SURFACES,
  type HomeProjectsView,
  type HomeLayout,
  type HomeTile,
  type HomeTileSurfaceStyle,
  type HomeTileTarget,
  type HomeTileType,
} from "./types";

export interface HomeTileConfigureChanges {
  target?: HomeTileTarget;
  surface?: HomeTileSurfaceStyle;
  /** Collection settings, e.g. the Projects collection's `view`. */
  config?: { view: HomeProjectsView };
}

const SURFACE_COPY: Record<HomeTileSurfaceStyle, { label: string; hint: string }> = {
  featured: { label: "Featured", hint: "Dark, for what matters most" },
  soft: { label: "Soft", hint: "Light lavender" },
  default: { label: "Default", hint: "White, like the rest of Home" },
};

export function homeTileSurfaceLabel(surface: HomeTileSurfaceStyle): string {
  return SURFACE_COPY[surface].label;
}

/**
 * Configure Tile: how a tile looks (Featured / Soft / Default) and, for tiles
 * that show one item, which item. Nothing changes until Save; Cancel or
 * closing leaves the tile as it was. Saving applies both in one change, so a
 * single Undo restores them. The tile keeps its place and size.
 */
export function HomeTileConfigureDialog({
  tile,
  tileLabel,
  layout,
  targetOptions,
  onClose,
  onSave,
}: {
  /** The tile being configured; the dialog is open while set. Remount per tile (key) to reset choices. */
  tile: HomeTile | null;
  tileLabel: string;
  layout: HomeLayout;
  targetOptions: Partial<Record<HomeTileType, HomeTileTargetOption[]>>;
  onClose: () => void;
  onSave: (tile: HomeTile, changes: HomeTileConfigureChanges) => void;
}) {
  const initialSurface = tile ? getHomeTileSurfaceStyle(tile) : "default";
  const [surface, setSurface] = useState<HomeTileSurfaceStyle>(initialSurface);
  const [target, setTarget] = useState<HomeTileTarget | null>(tile?.target ?? null);
  const initialView = tile?.type === "projects-collection" ? getHomeProjectsView(tile) : null;
  const [view, setView] = useState<HomeProjectsView | null>(initialView);
  const [query, setQuery] = useState("");
  const returnFocusRef = useRef<HTMLElement | null>(null);

  if (!tile) return null;
  const definition = getHomeTileDefinition(tile.type);
  const typeDefault = getHomeTileStartingSurface(tile.type);
  const targetChanged = Boolean(target && !sameHomeTileTarget(tile.target, target));
  const viewChanged = view !== initialView;
  const dirty = surface !== initialSurface || targetChanged || viewChanged;
  const fullWidthSection = homeTileUsesContentHeight(tile);

  function save() {
    if (!tile || !dirty) return;
    onSave(tile, {
      ...(surface !== initialSurface ? { surface } : {}),
      ...(targetChanged && target ? { target } : {}),
      ...(viewChanged && view ? { config: { view } } : {}),
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="sm:max-w-2xl"
        onOpenAutoFocus={() => {
          returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          const back = returnFocusRef.current;
          if (back?.isConnected) {
            event.preventDefault();
            back.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{`Edit ${definition.label} tile`}</DialogTitle>
          <DialogDescription>
            {definition.requiresTarget
              ? `Choose how ${tileLabel} looks and which item it shows. Its place and size on your Home stay the same.`
              : view
                ? `Choose which Projects ${tileLabel} lists and how it looks. Its place and size on your Home stay the same.`
                : `Choose how ${tileLabel} looks. Its place and size on your Home stay the same.`}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(64vh,600px)] space-y-6 overflow-y-auto px-6 py-5">
          {view ? (
            <section aria-labelledby="home-tile-configure-view">
              <h3 id="home-tile-configure-view" className="mb-2 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>
                Projects to show
              </h3>
              <ProjectsViewOptions value={view} onChange={setView} />
            </section>
          ) : null}
          <section aria-labelledby="home-tile-configure-style">
            <h3 id="home-tile-configure-style" className="mb-2 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>
              Style
            </h3>
            <SurfacePicker value={surface} typeDefault={typeDefault} onChange={setSurface} />
            {fullWidthSection && tile.type !== "your-focus" ? (
              <p className="mt-2 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                At Full width, Soft and Featured frame the Project cards in this style; the cards keep their own design.
              </p>
            ) : null}
          </section>
          {definition.requiresTarget ? (
            <section aria-labelledby="home-tile-configure-item">
              <h3 id="home-tile-configure-item" className="mb-2 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>
                Item
              </h3>
              <TargetPicker
                definition={definition}
                options={targetOptions[tile.type] ?? []}
                entryState={(option) => {
                  const current = sameHomeTileTarget(tile.target, option);
                  const selected = sameHomeTileTarget(target, option);
                  const elsewhere = !current && isHomeTileTargetOnLayout(layout, tile.type, option);
                  return {
                    status: current ? "Current" : elsewhere ? "On your Home" : selected ? "Selected" : null,
                    selectable: !elsewhere,
                    selected,
                  };
                }}
                actionLabel="Choose"
                query={query}
                onQueryChange={setQuery}
                onPick={setTarget}
              />
            </section>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="compact" onClick={save} disabled={!dirty}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Three style options as a radio group, each with a small preview drawn from
 * the real surface tokens. Arrow keys move between options.
 */
function SurfacePicker({
  value,
  typeDefault,
  onChange,
}: {
  value: HomeTileSurfaceStyle;
  typeDefault: HomeTileSurfaceStyle;
  onChange: (surface: HomeTileSurfaceStyle) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = HOME_TILE_SURFACES.indexOf(value);
    const next = (index + step + HOME_TILE_SURFACES.length) % HOME_TILE_SURFACES.length;
    onChange(HOME_TILE_SURFACES[next]);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label="Tile style" className="grid grid-cols-1 gap-2 sm:grid-cols-3" onKeyDown={onKeyDown}>
      {HOME_TILE_SURFACES.map((option, index) => {
        const checked = option === value;
        const copy = SURFACE_COPY[option];
        return (
          <button
            key={option}
            ref={(el) => { refs.current[index] = el; }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            data-home-tile-style-option={option}
            onClick={() => onChange(option)}
            className="flex min-w-0 items-center gap-3 rounded-[var(--luxia-radius-12)] border p-2.5 text-left outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] sm:flex-col sm:items-stretch"
            style={{
              borderColor: checked ? "var(--luxia-purple-60)" : "var(--luxia-border-default)",
              boxShadow: checked ? "inset 0 0 0 1px var(--luxia-purple-60)" : undefined,
            }}
          >
            <SurfacePreview surface={option} />
            <span className="min-w-0">
              <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>
                {copy.label}
                {option === typeDefault ? (
                  <span className="ml-1.5 font-normal luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    Default for this tile
                  </span>
                ) : null}
              </span>
              <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                {copy.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A miniature tile in the given style: card, title line, text line, button and the purple corner. */
function SurfacePreview({ surface }: { surface: HomeTileSurfaceStyle }) {
  return (
    <span
      aria-hidden
      data-home-tile-surface={surface}
      className="relative block h-14 w-24 shrink-0 overflow-hidden rounded-[10px] border sm:w-full"
      style={{ background: "var(--home-tile-bg)", borderColor: "var(--home-tile-border)" }}
    >
      <span
        className="absolute right-0 top-0 block size-4"
        style={{ background: "var(--luxia-purple-50)", borderRadius: "0 9px 0 6px" }}
      />
      <span className="absolute left-2.5 top-3 block h-1.5 w-1/2 rounded-full" style={{ background: "var(--home-tile-title)" }} />
      <span className="absolute left-2.5 top-6 block h-1 w-2/3 rounded-full" style={{ background: "var(--home-tile-text-muted)", opacity: 0.7 }} />
      <span className="absolute bottom-2 left-2.5 block h-2 w-8 rounded-full" style={{ background: "var(--home-tile-accent)" }} />
    </span>
  );
}

/** The Projects collection's view as a radio group; arrow keys move between options. */
function ProjectsViewOptions({
  value,
  onChange,
}: {
  value: HomeProjectsView;
  onChange: (view: HomeProjectsView) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = HOME_PROJECTS_VIEWS.indexOf(value);
    const next = (index + step + HOME_PROJECTS_VIEWS.length) % HOME_PROJECTS_VIEWS.length;
    onChange(HOME_PROJECTS_VIEWS[next]);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label="Projects to show" className="grid grid-cols-1 gap-2 sm:grid-cols-3" onKeyDown={onKeyDown}>
      {HOME_PROJECTS_VIEWS.map((option, index) => {
        const checked = option === value;
        const copy = HOME_PROJECTS_VIEW_COPY[option];
        return (
          <button
            key={option}
            ref={(el) => { refs.current[index] = el; }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            data-home-tile-view-option={option}
            onClick={() => onChange(option)}
            className="flex min-w-0 flex-col rounded-[var(--luxia-radius-12)] border px-3 py-2.5 text-left outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            style={{
              borderColor: checked ? "var(--luxia-purple-60)" : "var(--luxia-border-default)",
              boxShadow: checked ? "inset 0 0 0 1px var(--luxia-purple-60)" : undefined,
            }}
          >
            <span className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>
              {copy.label}
            </span>
            <span className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              {copy.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
