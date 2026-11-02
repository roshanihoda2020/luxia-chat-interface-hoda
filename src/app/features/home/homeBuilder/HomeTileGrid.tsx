import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { GripVertical, MoveDiagonal2, X } from "lucide-react";
import { measureHomeTileResize, snapHomeTileDrop, type HomeTileRowBand } from "./dragGeometry";
import {
  HOME_TILE_GRID,
  HOME_TILE_SIZE_PRESETS,
  findHomeTileSizeByDimensions,
  homeTileBodyHeightPx,
} from "./grid";
import {
  moveHomeTileByKeyboard,
  placeHomeTileAt,
  resizeHomeTile,
  settleHomeTilesAfterMove,
  snapHomeTileSize,
  type HomeTileMoveDirection,
} from "./layoutOps";
import { HomeTileSectionHeader, type HomeTileSection } from "./HomeTileSectionHeader";
import { placeHomeTiles } from "./placement";
import { getHomeTileDefinition, homeTileHasOwnBottomSpacing, homeTileUsesContentHeight } from "./registry";
import type { HomeLayout, HomeTile, HomeTileSize } from "./types";

interface HomeTileGridProps {
  layout: HomeLayout;
  /** Renders one tile's content. Returning null hides the tile (outside editing). */
  renderTile: (tile: HomeTile) => ReactNode;
  editing?: boolean;
  /** Accessible, user-facing name for a tile (e.g. "Project · Project name 02"). */
  getTileLabel?: (tile: HomeTile) => string;
  onRemoveTile?: (tile: HomeTile) => void;
  /** Called with the new layout after a drag, resize, keyboard move or size change. */
  onLayoutChange?: (layout: HomeLayout) => void;
  /** Outer section heading for a tile; null when the tile renders its own Home section heading. */
  getTileSection?: (tile: HomeTile) => HomeTileSection | null;
}

/**
 * Customize-mode frame: an outline drawn just outside the tile, so the frame
 * matches the visible tile exactly and adds no inner padding. The tile's
 * controls sit in a slim bar in the row gap above it.
 */
const EDIT_FRAME_STYLE: CSSProperties = {
  outline: "1.5px dashed var(--luxia-opacity-brand-primary-24)",
  outlineOffset: 2,
  borderRadius: "var(--luxia-radius-12)",
};

const ACTIVE_FRAME_STYLE: CSSProperties = {
  ...EDIT_FRAME_STYLE,
  outline: "2px solid var(--luxia-purple-60)",
};

/** The dragged tile while it follows the pointer: lifted above the page on an opaque surface. */
const LIFTED_FRAME_STYLE: CSSProperties = {
  ...ACTIVE_FRAME_STYLE,
  background: "var(--luxia-surface-background)",
  boxShadow: "var(--luxia-shadow-xl)",
  cursor: "grabbing",
  willChange: "transform",
};

/** Dashed slot showing where the dragged tile will land. */
const DROP_PLACEHOLDER_STYLE: CSSProperties = {
  border: "2px dashed var(--luxia-opacity-brand-primary-24)",
  borderRadius: "var(--luxia-radius-12)",
  background: "var(--luxia-opacity-brand-primary-04)",
};


const KEY_DIRECTIONS: Record<string, HomeTileMoveDirection> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

/** Pointer movement (px) before a press on the move handle becomes a drag. */
const DRAG_THRESHOLD_PX = 4;

/** Neighbouring tiles glide to their new slots; the dragged tile settles into its slot on release. */
const REFLOW_TRANSITION = "transform 180ms cubic-bezier(0.2, 0, 0, 1)";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Stable key for a preview's tile positions; renders happen only when it changes. */
function layoutPositionsKey(layout: HomeLayout): string {
  return layout.tiles.map((tile) => `${tile.id}:${tile.x},${tile.y},${tile.w},${tile.h}`).join("|");
}

interface DragSession {
  tileId: string;
  mode: "move" | "resize";
  base: HomeLayout;
  pointerId: number;
  startX: number;
  startY: number;
  started: boolean;
  gridLeft: number;
  gridTop: number;
  gridWidth: number;
  grabOffsetX: number;
  grabOffsetY: number;
  /** Latest pointer position (client px), so the lifted tile can be re-positioned after a render. */
  pointerX: number;
  pointerY: number;
  /** Current translate of the lifted tile's frame, relative to its slot. */
  liftX: number;
  liftY: number;
  previewKey: string;
  bodyLeft: number;
  bodyTop: number;
  bands: HomeTileRowBand[];
  /** Latest preview; kept here so a fast release never commits a stale render. */
  preview: HomeLayout;
  /** Tile ids in DOM order when the drag began; kept fixed so no node moves mid-drag. */
  domOrder: string[];
  /** Removes the window listeners that follow this gesture. */
  detach: () => void;
}

/**
 * Home Tile Grid: 12-column CSS grid that places tiles at their stored x / w
 * and compacted rows. Below `stackBelowPx` of its own width it stacks every
 * tile full width in reading order (stored positions are never changed by
 * that). Tiles whose content renders nothing are left out of placement, so
 * they never leave gaps (outside editing). In editing, tiles can be dragged
 * by their move handle, resized from the corner (snapping to the tile's
 * allowed sizes), sized with buttons, and moved with arrow keys.
 */
export function HomeTileGrid({
  layout,
  renderTile,
  editing = false,
  getTileLabel,
  onRemoveTile,
  onLayoutChange,
  getTileSection,
}: HomeTileGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef(new Map<string, HTMLDivElement>());
  const sessionRef = useRef<DragSession | null>(null);
  const pendingFocusRef = useRef<{ tileId: string; control: "move" | "remove" | "size" } | null>(null);
  const [stacked, setStacked] = useState(false);
  const [emptyKey, setEmptyKey] = useState("");
  const [drag, setDrag] = useState<{ tileId: string; mode: "move" | "resize"; preview: HomeLayout } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const canArrange = editing && !stacked && Boolean(onLayoutChange);
  const shownLayout = drag?.preview ?? layout;

  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => setStacked(el.clientWidth < HOME_TILE_GRID.stackBelowPx);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // After every render, note which tiles rendered no content, and restore keyboard focus.
  useLayoutEffect(() => {
    const next = shownLayout.tiles
      .filter((tile) => contentRefs.current.get(tile.id)?.childNodes.length === 0)
      .map((tile) => tile.id)
      .join("|");
    if (next !== emptyKey) setEmptyKey(next);

    const pending = pendingFocusRef.current;
    if (pending && gridRef.current) {
      pendingFocusRef.current = null;
      const selector = pending.control === "size"
        ? '[data-home-tile-control="size"][aria-pressed="true"]'
        : `[data-home-tile-control="${pending.control}"]`;
      gridRef.current
        .querySelector<HTMLElement>(`[data-home-tile-id="${pending.tileId}"] ${selector}`)
        ?.focus();
    }
  });

  function cancelSession() {
    const session = sessionRef.current;
    session?.detach();
    sessionRef.current = null;
    if (session) settleDraggedTile(session);
    setDrag(null);
  }

  // Leaving edit mode or switching to the stacked layout cancels any drag in progress.
  useEffect(() => {
    if (!canArrange && sessionRef.current) cancelSession();
  }, [canArrange]);

  // Never leave window listeners behind.
  useEffect(() => () => sessionRef.current?.detach(), []);

  // FLIP reflow: when tiles change slots while customizing (drag preview, drop,
  // keyboard move, size change), each tile starts at where it was drawn and
  // glides to its new slot. Grid placement itself can't be transitioned.
  const slotRectsRef = useRef(new Map<string, { left: number; top: number }>());
  const reflowModeRef = useRef({ editing, stacked });
  const draggedTileId = drag?.mode === "move" ? drag.tileId : null;
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const origin = grid.getBoundingClientRect();
    const modeChanged = reflowModeRef.current.editing !== editing || reflowModeRef.current.stacked !== stacked;
    reflowModeRef.current = { editing, stacked };
    const animate = editing && !stacked && !modeChanged && !prefersReducedMotion();
    const next = new Map<string, { left: number; top: number }>();

    grid.querySelectorAll<HTMLElement>(":scope > [data-home-tile-id]:not([hidden])").forEach((el) => {
      const id = el.dataset.homeTileId ?? "";
      // Where the tile is drawn right now: its old slot plus any reflow still in flight.
      const drawn = getComputedStyle(el).transform;
      const inFlight = drawn && drawn !== "none" ? new DOMMatrixReadOnly(drawn) : null;
      el.style.transition = "none";
      el.style.transform = "";
      const rect = el.getBoundingClientRect();
      const slot = { left: rect.left - origin.left, top: rect.top - origin.top };
      next.set(id, slot);

      const prev = slotRectsRef.current.get(id);
      // The lifted tile follows the pointer instead.
      if (!animate || !prev || id === draggedTileId) return;
      const dx = prev.left + (inFlight?.m41 ?? 0) - slot.left;
      const dy = prev.top + (inFlight?.m42 ?? 0) - slot.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      void el.offsetWidth; // commit the start position before transitioning
      el.style.transition = REFLOW_TRANSITION;
      el.style.transform = "";
    });
    slotRectsRef.current = next;

    // The dragged tile's slot may have moved in this render; keep it under the pointer.
    const session = sessionRef.current;
    if (session?.mode === "move" && session.started) liftDraggedTile(session);
  }, [shownLayout, editing, stacked, emptyKey, draggedTileId]);

  useEffect(() => {
    if (!drag) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      cancelSession();
      setAnnouncement("Move cancelled.");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drag]);

  const emptyIds = useMemo(() => new Set(emptyKey ? emptyKey.split("|") : []), [emptyKey]);
  const shownTiles = useMemo(
    () => (editing ? shownLayout.tiles : shownLayout.tiles.filter((tile) => !emptyIds.has(tile.id))),
    [editing, emptyIds, shownLayout],
  );
  const placements = useMemo(() => {
    const ordered = placeHomeTiles(shownTiles);
    // While dragging, keep the DOM order from the start of the drag: CSS grid
    // positions are explicit, and moving the dragged node in the DOM would make
    // the browser drop the gesture.
    const domOrder = drag ? sessionRef.current?.domOrder : undefined;
    if (!domOrder) return ordered;
    const rank = new Map(domOrder.map((id, index) => [id, index]));
    return [...ordered].sort((a, b) => (rank.get(a.tile.id) ?? 0) - (rank.get(b.tile.id) ?? 0));
  }, [drag, shownTiles]);
  const shownIds = new Set(shownTiles.map((tile) => tile.id));
  const hiddenTiles = shownLayout.tiles.filter((tile) => !shownIds.has(tile.id));

  function labelOf(tile: HomeTile) {
    return getTileLabel?.(tile) ?? getHomeTileDefinition(tile.type).label;
  }

  function describePosition(next: HomeLayout, tileId: string, verb: string) {
    const order = placeHomeTiles(next.tiles);
    const index = order.findIndex((entry) => entry.tile.id === tileId);
    const tile = next.tiles.find((entry) => entry.id === tileId);
    if (!tile || index < 0) return;
    const size = findHomeTileSizeByDimensions(tile.w, tile.h)?.label ?? "";
    setAnnouncement(`${labelOf(tile)} ${verb}. Position ${index + 1} of ${order.length}${size ? `, ${size}` : ""}.`);
  }

  function commit(next: HomeLayout, tileId: string, verb: string) {
    if (JSON.stringify(next) === JSON.stringify(layout)) return;
    onLayoutChange?.(next);
    describePosition(next, tileId, verb);
  }
  // Window listeners outlive the render that created them; always commit through the latest props.
  const commitRef = useRef(commit);
  commitRef.current = commit;

  // ── Pointer drag (move) and corner resize ──

  function startSession(event: ReactPointerEvent<HTMLElement>, tile: HomeTile, mode: "move" | "resize") {
    if (!canArrange || event.button !== 0 || !gridRef.current) return;
    event.preventDefault();
    sessionRef.current?.detach();
    const grid = gridRef.current.getBoundingClientRect();
    const wrapper = event.currentTarget.closest<HTMLElement>("[data-home-tile-id]");
    const frame = wrapper?.querySelector<HTMLElement>("[data-home-tile-frame]")?.getBoundingClientRect();
    const body = wrapper?.querySelector<HTMLElement>("[data-home-tile-body]")?.getBoundingClientRect();

    // Rows of the other tiles as currently rendered, keyed by stored row.
    const bandMap = new Map<number, HomeTileRowBand>();
    for (const other of layout.tiles) {
      if (other.id === tile.id) continue;
      const rect = gridRef.current
        .querySelector<HTMLElement>(`[data-home-tile-id="${other.id}"] [data-home-tile-frame]`)
        ?.getBoundingClientRect();
      if (!rect) continue;
      const band = bandMap.get(other.y);
      const top = rect.top - grid.top;
      const bottom = rect.bottom - grid.top;
      bandMap.set(other.y, {
        y: other.y,
        end: Math.max(band?.end ?? 0, other.y + other.h),
        top: Math.min(band?.top ?? top, top),
        bottom: Math.max(band?.bottom ?? bottom, bottom),
      });
    }

    sessionRef.current = {
      tileId: tile.id,
      mode,
      base: layout,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      started: mode === "resize",
      gridLeft: grid.left,
      gridTop: grid.top,
      gridWidth: grid.width,
      grabOffsetX: frame ? event.clientX - frame.left : 0,
      grabOffsetY: frame ? event.clientY - frame.top : 0,
      pointerX: event.clientX,
      pointerY: event.clientY,
      liftX: 0,
      liftY: 0,
      // Empty so the first move always renders the lifted state.
      previewKey: "",
      bodyLeft: (body?.left ?? grid.left) - grid.left,
      bodyTop: (body?.top ?? grid.top) - grid.top,
      bands: [...bandMap.values()].sort((a, b) => a.top - b.top),
      preview: layout,
      domOrder: placements.map((entry) => entry.tile.id),
      detach: () => undefined,
    };

    // Follow the gesture on the window, not the handle: the release must be
    // seen even if the pointer leaves the handle or the browser drops capture.
    const onMove = (pointer: PointerEvent) => moveSession(pointer);
    const onUp = (pointer: PointerEvent) => endSession(pointer, false);
    const onCancel = (pointer: PointerEvent) => endSession(pointer, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    sessionRef.current.detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
    if (mode === "resize") setDrag({ tileId: tile.id, mode, preview: layout });
  }

  function moveSession(event: Pick<PointerEvent, "pointerId" | "clientX" | "clientY">) {
    const session = sessionRef.current;
    if (!session || event.pointerId !== session.pointerId) return;
    const tile = session.base.tiles.find((entry) => entry.id === session.tileId);
    if (!tile) return;
    if (!session.started) {
      const distance = Math.hypot(event.clientX - session.startX, event.clientY - session.startY);
      if (distance < DRAG_THRESHOLD_PX) return;
      session.started = true;
    }
    session.pointerX = event.clientX;
    session.pointerY = event.clientY;
    if (session.mode === "move") liftDraggedTile(session);
    const pointerX = event.clientX - session.gridLeft;
    const pointerY = event.clientY - session.gridTop;
    let preview: HomeLayout;
    if (session.mode === "move") {
      const target = snapHomeTileDrop({
        tile,
        others: session.base.tiles.filter((entry) => entry.id !== tile.id),
        bands: session.bands,
        gridWidth: session.gridWidth,
        pointerX,
        pointerY,
        grabOffsetX: session.grabOffsetX,
      });
      // Close only the gaps this move creates; the preview is exactly what a drop commits.
      preview = settleHomeTilesAfterMove(
        session.base,
        placeHomeTileAt(session.base, tile.id, { ...target, w: tile.w, h: tile.h }),
        tile.id,
      );
    } else {
      const desired = measureHomeTileResize({
        gridWidth: session.gridWidth,
        bodyLeft: session.bodyLeft,
        bodyTop: session.bodyTop,
        pointerX,
        pointerY,
      });
      preview = resizeHomeTile(session.base, tile.id, snapHomeTileSize(tile.type, desired.w, desired.h));
    }
    session.preview = preview;
    // Re-render only when the snapped slot changes; between snaps only the lifted tile moves.
    const key = layoutPositionsKey(preview);
    if (key === session.previewKey) return;
    session.previewKey = key;
    setDrag({ tileId: tile.id, mode: session.mode, preview });
  }

  function frameOf(tileId: string) {
    return gridRef.current?.querySelector<HTMLElement>(`[data-home-tile-id="${tileId}"] [data-home-tile-frame]`) ?? null;
  }

  /** Moves the dragged tile's frame under the pointer, relative to wherever its slot is now. */
  function liftDraggedTile(session: DragSession) {
    const frame = frameOf(session.tileId);
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const slotLeft = rect.left - session.liftX;
    const slotTop = rect.top - session.liftY;
    session.liftX = session.pointerX - session.grabOffsetX - slotLeft;
    session.liftY = session.pointerY - session.grabOffsetY - slotTop;
    frame.style.transition = "none";
    frame.style.transform = `translate3d(${session.liftX}px, ${session.liftY}px, 0)`;
  }

  /** Releases the lifted frame; it glides from the pointer into its (possibly new) slot. */
  function settleDraggedTile(session: DragSession) {
    const frame = frameOf(session.tileId);
    if (!frame || !frame.style.transform) return;
    if (prefersReducedMotion()) {
      frame.style.transition = "";
      frame.style.transform = "";
      return;
    }
    frame.style.transition = REFLOW_TRANSITION;
    frame.style.transform = "";
    // Hand the frame's transition back to its stylesheet (outline colour).
    frame.addEventListener("transitionend", () => { frame.style.transition = ""; }, { once: true });
  }

  function endSession(event: Pick<PointerEvent, "pointerId">, cancelled: boolean) {
    const session = sessionRef.current;
    if (!session || event.pointerId !== session.pointerId) return;
    session.detach();
    sessionRef.current = null;
    settleDraggedTile(session);
    setDrag(null);
    if (!cancelled && session.started) {
      commitRef.current(session.preview, session.tileId, session.mode === "move" ? "moved" : "resized");
    }
  }

  // ── Keyboard and button alternatives ──

  function handleMoveKey(event: ReactKeyboardEvent<HTMLElement>, tile: HomeTile) {
    const direction = KEY_DIRECTIONS[event.key];
    if (!direction || !onLayoutChange) return;
    event.preventDefault();
    const next = moveHomeTileByKeyboard(layout, tile.id, direction);
    if (!next) {
      setAnnouncement(`${labelOf(tile)} cannot move ${direction}.`);
      return;
    }
    pendingFocusRef.current = { tileId: tile.id, control: "move" };
    commit(next, tile.id, "moved");
  }

  function handleSize(tile: HomeTile, sizeId: HomeTileSize) {
    pendingFocusRef.current = { tileId: tile.id, control: "size" };
    commit(resizeHomeTile(layout, tile.id, sizeId), tile.id, "resized");
  }

  function handleRemove(tile: HomeTile) {
    // Keep keyboard focus on the next tile's Remove button (or the previous one).
    const index = placements.findIndex((entry) => entry.tile.id === tile.id);
    const neighbour = placements[index + 1] ?? placements[index - 1];
    if (neighbour) pendingFocusRef.current = { tileId: neighbour.tile.id, control: "remove" };
    onRemoveTile?.(tile);
  }

  function renderContent(tile: HomeTile) {
    // Grid-height tiles stretch their card to fill the reserved height; content-height tiles stay natural.
    const definition = getHomeTileDefinition(tile.type);
    const fillsSlot = !homeTileUsesContentHeight(tile);
    // While customizing, drop a section's own trailing margin so the frame hugs the visible content.
    const trimSectionMargin = editing && homeTileHasOwnBottomSpacing(tile)
      ? " [&>section]:[margin-bottom:0!important]"
      : "";
    return (
      <div
        ref={(el) => {
          if (el) {
            contentRefs.current.set(tile.id, el);
            // Content is visible but not interactive while editing.
            el.inert = editing;
          } else {
            contentRefs.current.delete(tile.id);
          }
        }}
        className={(fillsSlot ? "flex min-w-0 flex-1 flex-col [&>*]:flex-1" : "min-w-0") + trimSectionMargin}
      >
        {renderTile(tile)}
      </div>
    );
  }

  return (
    <div className={drag ? "select-none" : undefined}>
      {editing && stacked ? (
        <p className="mb-3 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          Tiles are stacked to fit this screen. Widen the window to move or resize tiles; sizes you set still apply on larger screens.
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div
        ref={gridRef}
        className="luxia-home-tile-grid grid min-w-0"
        style={{
          gridTemplateColumns: `repeat(${HOME_TILE_GRID.columns}, minmax(0, 1fr))`,
          columnGap: HOME_TILE_GRID.gapPx,
          // Room for the first row's control bars while customizing.
          paddingTop: editing ? HOME_TILE_GRID.rowGapPx : undefined,
        }}
      >
        {placements.map(({ tile, rowStart, rowEnd }, index) => {
          const definition = getHomeTileDefinition(tile.type);
          const startsLowerRow = stacked ? index > 0 : rowStart > 1;
          const label = labelOf(tile);
          const size = findHomeTileSizeByDimensions(tile.w, tile.h);
          const isActive = drag?.tileId === tile.id;
          const isLifted = isActive && drag?.mode === "move";
          const sizeOptions = definition.allowedSizes;
          const slotTop = startsLowerRow ? HOME_TILE_GRID.rowGapPx : 0;
          const style: CSSProperties = {
            gridColumn: stacked ? "1 / -1" : `${tile.x + 1} / span ${tile.w}`,
            gridRow: stacked ? undefined : `${rowStart} / ${rowEnd}`,
            // The lifted tile draws above its neighbours while it follows the pointer.
            position: isLifted ? "relative" : undefined,
            zIndex: isLifted ? 30 : undefined,
            paddingTop: startsLowerRow ? HOME_TILE_GRID.rowGapPx : undefined,
            marginBottom:
              homeTileHasOwnBottomSpacing(tile) && !editing ? -HOME_TILE_GRID.rowGapPx : undefined,
          };
          // Tiles that already render their own Home section heading (Full-width Focus,
          // Pinned, Recent) get no outer heading; every other tile gets one above its card.
          const section = getTileSection?.(tile) ?? null;
          const headingId = section ? `home-tile-heading-${tile.id}` : undefined;
          const minHeight = homeTileUsesContentHeight(tile) ? undefined : homeTileBodyHeightPx(tile.h, Boolean(section));
          const sectionHeader = section ? <HomeTileSectionHeader section={section} id={headingId} /> : null;
          return (
            <div
              key={tile.id}
              className="luxia-home-tile flex min-w-0 flex-col"
              data-home-tile-id={tile.id}
              data-home-tile-type={tile.type}
              style={style}
            >
              {isLifted ? (
                // Where the tile will land; the tile itself follows the pointer.
                <div
                  aria-hidden
                  data-home-tile-placeholder=""
                  className="pointer-events-none absolute inset-x-0 bottom-0"
                  style={{ ...DROP_PLACEHOLDER_STYLE, top: slotTop }}
                />
              ) : null}
              {editing ? (
                <section
                  aria-label={`${label} tile`}
                  data-home-tile-frame=""
                  className="relative flex min-w-0 flex-1 flex-col transition-[outline-color] duration-150"
                  style={isLifted ? LIFTED_FRAME_STYLE : isActive ? ACTIVE_FRAME_STYLE : EDIT_FRAME_STYLE}
                >
                  <div className="absolute inset-x-0 bottom-[calc(100%+4px)] flex h-6 min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1">
                      {canArrange ? (
                        <button
                          type="button"
                          data-home-tile-control="move"
                          aria-label={`Move ${label}. Drag, or use the arrow keys.`}
                          title="Drag to move · Arrow keys move"
                          className="inline-flex size-6 shrink-0 cursor-grab items-center justify-center rounded-[8px] border bg-[var(--luxia-surface)] outline-none hover:bg-[var(--luxia-opacity-brand-primary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] active:cursor-grabbing"
                          style={{ color: "var(--luxia-purple-60)", borderColor: "var(--luxia-border-default)", touchAction: "none" }}
                          onPointerDown={(event) => startSession(event, tile, "move")}
                          onKeyDown={(event) => handleMoveKey(event, tile)}
                        >
                          <GripVertical size={16} strokeWidth={2} aria-hidden />
                        </button>
                      ) : null}
                      <p
                        className="min-w-0 truncate pl-1 luxia-type-caption font-semibold"
                        style={{ color: "var(--luxia-purple-70)" }}
                        title={label}
                      >
                        {label}
                        {size && sizeOptions.length < 2 ? (
                          <span className="ml-1.5 font-normal" style={{ color: "var(--luxia-text-muted)" }}>
                            {size.label}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {sizeOptions.length > 1 && onLayoutChange ? (
                        <div
                          role="group"
                          aria-label={`Size of ${label}`}
                          className="inline-flex items-center gap-0.5 rounded-[8px] border p-0.5"
                          style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}
                        >
                          {sizeOptions.map((sizeId) => {
                            const preset = HOME_TILE_SIZE_PRESETS[sizeId];
                            const pressed = size?.id === sizeId;
                            return (
                              <button
                                key={sizeId}
                                type="button"
                                data-home-tile-control="size"
                                aria-pressed={pressed}
                                aria-label={`${preset.label} size`}
                                title={preset.label}
                                onClick={() => handleSize(tile, sizeId)}
                                className="h-5 min-w-5 rounded-[5px] px-1 luxia-type-caption outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                                style={{
                                  background: pressed ? "var(--luxia-purple-70)" : "transparent",
                                  color: pressed ? "var(--luxia-text-inverse)" : "var(--luxia-text-secondary)",
                                }}
                              >
                                {preset.label.charAt(0)}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      {onRemoveTile ? (
                        <button
                          type="button"
                          data-home-tile-control="remove"
                          aria-label={`Remove ${label} from Home`}
                          title="Remove from Home"
                          onClick={() => handleRemove(tile)}
                          className="inline-flex size-6 shrink-0 items-center justify-center rounded-[8px] border bg-[var(--luxia-surface)] outline-none hover:bg-[var(--luxia-opacity-brand-primary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                          style={{ color: "var(--luxia-text-secondary)", borderColor: "var(--luxia-border-default)" }}
                        >
                          <X size={14} strokeWidth={2} aria-hidden />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {sectionHeader}
                  <div className="flex min-w-0 flex-1 flex-col" data-home-tile-body="" style={{ minHeight }}>
                    {renderContent(tile)}
                    {emptyIds.has(tile.id) ? (
                      <p
                        className="rounded-[var(--luxia-radius-12)] border border-dashed px-4 py-3 luxia-type-body-dense"
                        style={{
                          borderColor: "var(--luxia-border-default)",
                          color: "var(--luxia-text-secondary)",
                          background: "var(--luxia-surface)",
                        }}
                      >
                        Nothing to show here right now. This tile appears on Home when it has content.
                      </p>
                    ) : null}
                  </div>
                  {canArrange && sizeOptions.length > 1 ? (
                    <span
                      aria-hidden
                      title="Drag to resize"
                      className="absolute -right-2.5 -bottom-2.5 z-[2] inline-flex size-6 cursor-nwse-resize items-center justify-center rounded-full border bg-[var(--luxia-surface)] shadow-[var(--luxia-shadow-sm)] hover:bg-[var(--luxia-opacity-brand-primary-08)]"
                      style={{ color: "var(--luxia-purple-60)", borderColor: "var(--luxia-opacity-brand-primary-24)", touchAction: "none" }}
                      onPointerDown={(event) => startSession(event, tile, "resize")}
                    >
                      <MoveDiagonal2 size={14} strokeWidth={2} />
                    </span>
                  ) : null}
                </section>
              ) : (
                <section aria-labelledby={headingId} className="flex min-w-0 flex-1 flex-col">
                  {sectionHeader}
                  <div className="flex min-w-0 flex-1 flex-col" style={{ minHeight }}>
                    {renderContent(tile)}
                  </div>
                </section>
              )}
            </div>
          );
        })}
        {hiddenTiles.map((tile) => (
          // Still rendered so the grid notices when the tile gains content.
          <div key={tile.id} data-home-tile-id={tile.id} data-home-tile-type={tile.type} hidden>
            {renderContent(tile)}
          </div>
        ))}
      </div>
    </div>
  );
}
