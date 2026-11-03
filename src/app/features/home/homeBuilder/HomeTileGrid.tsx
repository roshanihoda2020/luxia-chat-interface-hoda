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
import { Maximize2, Minus, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  homeTileColumnPitch,
  homeTilePointerColumn,
  measureHomeTileFluidSize,
  snapHomeTileDrop,
  suggestHomeTileBesideFullWidth,
  type HomeTileRowBand,
} from "./dragGeometry";
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
import { HOME_TILE_CORNER, HomeTileSurfaceProvider } from "./HomeTileSurface";
import { placeHomeTiles } from "./placement";
import {
  getHomeTileBesideSizes,
  getHomeTileDefinition,
  getHomeTileFitSizes,
  getHomeTileSizeId,
  getHomeTileSurfaceStyle,
  homeTileHasOwnBottomSpacing,
  homeTileUsesContentHeight,
} from "./registry";
import type { HomeLayout, HomeTile, HomeTileSize } from "./types";

/** Shown with an Undo action when a change did more than the user directly asked for. */
export interface HomeLayoutUndoNotice {
  title: string;
  description: string;
}

interface HomeTileGridProps {
  layout: HomeLayout;
  /** Renders one tile's content. Returning null hides the tile (outside editing). */
  renderTile: (tile: HomeTile) => ReactNode;
  editing?: boolean;
  /** Accessible, user-facing name for a tile (e.g. "Project · Project name 02"). */
  getTileLabel?: (tile: HomeTile) => string;
  onRemoveTile?: (tile: HomeTile) => void;
  /** Called with the new layout after a drag, resize, keyboard move or size change. */
  onLayoutChange?: (layout: HomeLayout, undo?: HomeLayoutUndoNotice) => void;
  /** Outer section heading for a tile; null when the tile renders its own Home section heading. */
  getTileSection?: (tile: HomeTile) => HomeTileSection | null;
  /** Configure Tile: choose a different item for a tile that shows one. */
  onConfigureTile?: (tile: HomeTile) => void;
}

/**
 * Customize-mode frame: an outline drawn just outside the tile, so the frame
 * matches the visible tile exactly and adds no inner padding. Its controls sit
 * on the card itself: Remove on the top-left corner, Configure and Size on the
 * top-right, resize grips on the side edges and bottom corners.
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

/** Mouse / pen movement (px) before a press on a tile body becomes a drag (a plain click never moves it). */
const DRAG_THRESHOLD_PX = 6;

/** Touch: hold a tile this long (moving less than the slop) to pick it up; moving sooner scrolls the page. */
const TOUCH_HOLD_MS = 300;
const TOUCH_HOLD_SLOP_PX = 8;

/** Top padding while customizing, so the first row's Remove badges aren't clipped. */
const EDIT_GRID_TOP_PX = 12;
/**
 * Full-width section tiles (Your focus / Pinned / Recent) carry their edit
 * controls just above the frame — clear of "View all", pin and view controls
 * and of the section title — so the first row needs this much room above it.
 */
const EDIT_GRID_TOP_SECTION_PX = 36;
/** Edit controls above a section tile's frame: 28px buttons plus a 4px gap. */
const SECTION_CONTROLS_OFFSET_PX = 32;
/** Inset from the frame's edges, clear of the resize grips of a tile in the row above. */
const SECTION_CONTROLS_INSET_PX = 24;

/** A resized tile glides from the size the user drew into its snapped size. */
const RESIZE_SETTLE_MS = 200;
const RESIZE_SETTLE_TRANSITION = [
  `transform ${RESIZE_SETTLE_MS}ms cubic-bezier(0.2, 0, 0, 1)`,
  `width ${RESIZE_SETTLE_MS}ms cubic-bezier(0.2, 0, 0, 1)`,
  `height ${RESIZE_SETTLE_MS}ms cubic-bezier(0.2, 0, 0, 1)`,
].join(", ");

type HomeTileResizeEdge = "left" | "right" | "bottom-left" | "bottom-right";
const RESIZE_EDGES: HomeTileResizeEdge[] = ["left", "right", "bottom-left", "bottom-right"];

/** Hit areas sit on the card's edges; the visible grip is small and brightens on hover. */
const RESIZE_HANDLE_CLASS: Record<HomeTileResizeEdge, string> = {
  left: "absolute -left-2 top-1/2 z-[3] flex h-14 w-4 -translate-y-1/2 cursor-ew-resize items-center justify-center",
  right: "absolute -right-2 top-1/2 z-[3] flex h-14 w-4 -translate-y-1/2 cursor-ew-resize items-center justify-center",
  "bottom-left": "absolute -bottom-2 -left-2 z-[3] flex size-5 cursor-nesw-resize items-center justify-center",
  "bottom-right": "absolute -bottom-2 -right-2 z-[3] flex size-5 cursor-nwse-resize items-center justify-center",
};
const RESIZE_GRIP_CLASS: Record<HomeTileResizeEdge, string> = {
  left: "h-8 w-1 rounded-full",
  right: "h-8 w-1 rounded-full",
  "bottom-left": "size-2.5 rounded-bl-[5px] border-b-2 border-l-2",
  "bottom-right": "size-2.5 rounded-br-[5px] border-b-2 border-r-2",
};
const TILE_ACTION_CLASS =
  "inline-flex size-7 items-center justify-center rounded-[8px] border outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";
const TILE_ACTION_STYLE: CSSProperties = {
  background: "var(--luxia-surface)",
  borderColor: "var(--luxia-border-default)",
  color: "var(--luxia-purple-60)",
  boxShadow: "var(--luxia-shadow-xs)",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Resting a dragged tile over a Full-width tile's row for this long (moving
 * less than the slop) offers to shrink that tile so both fit side by side.
 * Passing over the row never resizes anything.
 */
const BESIDE_DWELL_MS = 400;
const BESIDE_DWELL_SLOP_PX = 24;

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
  pointerType: string;
  /** Touch: press-and-hold timer before dragging a tile by its body starts. */
  holdTimer: number | null;
  /** Fluid resize from an edge or corner (resize mode only). Sizes are client px. */
  resize: {
    edge: HomeTileResizeEdge;
    startLeft: number;
    startWidth: number;
    startHeight: number;
    /** Height of the outer section heading above the card (0 when none). */
    headerPx: number;
    width: number;
    height: number;
    /** Preset the drawn size would snap to on release. */
    hint: HomeTileSize | null;
    moved: boolean;
    /** The card's min-height before the gesture, restored when it settles. */
    bodyMinHeight: string;
  } | null;
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
  /** Smaller sizes the dragged tile may take to fit beside a row, largest first. */
  fitSizes: Array<{ id: HomeTileSize; w: number; h: number }>;
  /** Size changes last announced ("" when none). */
  announcedFit: string;
  /** Resting over a Full-width tile's row; ready once the pointer has stayed for BESIDE_DWELL_MS. */
  dwell: { tileId: string; anchorX: number; anchorY: number; ready: boolean; timer: number } | null;
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
 * they never leave gaps (outside editing). In editing, a tile is dragged by
 * its body (press and hold on touch), resized fluidly from its side edges and
 * bottom corners (snapping to an allowed size on release), sized from its Size
 * menu, moved with arrow keys, and — for tiles that show one item — pointed at
 * a different item with Configure.
 */
export function HomeTileGrid({
  layout,
  renderTile,
  editing = false,
  getTileLabel,
  onRemoveTile,
  onLayoutChange,
  getTileSection,
  onConfigureTile,
}: HomeTileGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef(new Map<string, HTMLDivElement>());
  const sessionRef = useRef<DragSession | null>(null);
  const pendingFocusRef = useRef<{ tileId: string; control: "move" | "remove" | "size" | "configure" } | null>(null);
  /** A resized tile settling from its drawn size into its snapped size (next render). */
  const pendingResizeRef = useRef<{ tileId: string; rect: DOMRect; bodyMinHeight: string } | null>(null);
  const [stacked, setStacked] = useState(false);
  const [emptyKey, setEmptyKey] = useState("");
  const [drag, setDrag] = useState<{ tileId: string; mode: "move" | "resize"; preview: HomeLayout } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  /** Size a fluid resize would snap to, shown on the tile while resizing. */
  const [resizeHint, setResizeHint] = useState<{ tileId: string; label: string } | null>(null);

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
      const selector = `[data-home-tile-control="${pending.control}"]`;
      gridRef.current
        .querySelector<HTMLElement>(`[data-home-tile-id="${pending.tileId}"] ${selector}`)
        ?.focus();
    }
  });

  function cancelSession() {
    const session = sessionRef.current;
    session?.detach();
    if (session) clearDwell(session);
    sessionRef.current = null;
    if (session?.mode === "resize") {
      finishResize(session, true);
      return;
    }
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
      // The lifted tile follows the pointer; a resized tile settles on its own (below).
      if (!animate || !prev || id === draggedTileId || id === pendingResizeRef.current?.tileId) return;
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

  // After a fluid resize: the tile glides from the size the user drew into its
  // snapped size (or back, when cancelled), then hands sizing back to the grid.
  useLayoutEffect(() => {
    const pending = pendingResizeRef.current;
    if (!pending) return;
    pendingResizeRef.current = null;
    const frame = frameOf(pending.tileId);
    if (!frame) return;
    const body = frame.querySelector<HTMLElement>("[data-home-tile-body]");
    const content = body?.firstElementChild instanceof HTMLElement ? body.firstElementChild : null;
    const release = (minHeight: string) => {
      frame.style.transition = "";
      frame.style.transform = "";
      frame.style.width = "";
      frame.style.height = "";
      frame.style.flex = "";
      if (content) content.style.overflow = "";
      // Only restore the card's min-height if React didn't already set a new one.
      if (body && body.style.minHeight === "0px") body.style.minHeight = minHeight;
    };
    release(pending.bodyMinHeight);
    if (prefersReducedMotion()) return;

    const natural = frame.getBoundingClientRect();
    const from = pending.rect;
    const moved = Math.max(
      Math.abs(from.left - natural.left),
      Math.abs(from.top - natural.top),
      Math.abs(from.width - natural.width),
      Math.abs(from.height - natural.height),
    );
    if (moved < 1) return;
    const minHeight = body?.style.minHeight ?? "";
    frame.style.transition = "none";
    frame.style.flex = "none";
    if (content) content.style.overflow = "hidden";
    if (body) body.style.minHeight = "0px";
    frame.style.transform = `translate3d(${from.left - natural.left}px, ${from.top - natural.top}px, 0)`;
    frame.style.width = `${from.width}px`;
    frame.style.height = `${from.height}px`;
    void frame.offsetWidth; // commit the drawn size before transitioning
    frame.style.transition = RESIZE_SETTLE_TRANSITION;
    frame.style.transform = "translate3d(0, 0, 0)";
    frame.style.width = `${natural.width}px`;
    frame.style.height = `${natural.height}px`;
    window.setTimeout(() => release(minHeight), RESIZE_SETTLE_MS + 40);
  });


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

  function commit(next: HomeLayout, tileId: string, verb: string, undo?: HomeLayoutUndoNotice) {
    if (JSON.stringify(next) === JSON.stringify(layout)) return;
    onLayoutChange?.(next, undo);
    describePosition(next, tileId, verb);
  }
  // Window listeners outlive the render that created them; always commit through the latest props.
  const commitRef = useRef(commit);
  commitRef.current = commit;

  // ── Pointer drag (move) and corner resize ──

  /** Tile body pressed in Customize mode: drag it, unless the press is on an edit control. */
  function startBodyDrag(event: ReactPointerEvent<HTMLElement>, tile: HomeTile) {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, [role='menuitem'], [data-home-tile-resize]")) return;
    startSession(event, tile, "move");
  }

  function startSession(
    event: ReactPointerEvent<HTMLElement>,
    tile: HomeTile,
    mode: "move" | "resize",
    edge?: HomeTileResizeEdge,
  ) {
    if (!canArrange || event.button !== 0 || !gridRef.current) return;
    // Mouse and pen: no text selection or focus change. Touch keeps its default
    // until a press-and-hold starts the drag, so the page can still scroll.
    if (event.pointerType !== "touch" || mode === "resize") event.preventDefault();
    if (mode === "resize") event.stopPropagation();
    sessionRef.current?.detach();
    const grid = gridRef.current.getBoundingClientRect();
    const wrapper = event.currentTarget.closest<HTMLElement>("[data-home-tile-id]");
    const frame = wrapper?.querySelector<HTMLElement>("[data-home-tile-frame]")?.getBoundingClientRect();
    const body = wrapper?.querySelector<HTMLElement>("[data-home-tile-body]")?.getBoundingClientRect();
    const bodyElement = wrapper?.querySelector<HTMLElement>("[data-home-tile-body]");

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
      pointerType: event.pointerType,
      holdTimer: null,
      resize: mode === "resize" && edge && frame && body
        ? {
          edge,
          startLeft: frame.left,
          startWidth: frame.width,
          startHeight: frame.height,
          headerPx: body.top - frame.top,
          width: frame.width,
          height: frame.height,
          hint: null,
          moved: false,
          bodyMinHeight: bodyElement?.style.minHeight ?? "",
        }
        : null,
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
      fitSizes: mode === "move" ? getHomeTileFitSizes(tile) : [],
      announcedFit: "",
      dwell: null,
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
    const session = sessionRef.current;
    // Once a touch drag has started, the page must not scroll under the finger.
    const blockScroll = (touch: TouchEvent) => {
      if (sessionRef.current === session && session.started) touch.preventDefault();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("touchmove", blockScroll, { passive: false });
    session.detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("touchmove", blockScroll);
      if (session.holdTimer !== null) window.clearTimeout(session.holdTimer);
      session.holdTimer = null;
    };
    if (mode === "move" && event.pointerType === "touch") {
      // Press and hold picks the tile up, like rearranging on a phone.
      session.holdTimer = window.setTimeout(() => {
        session.holdTimer = null;
        if (sessionRef.current !== session) return;
        session.started = true;
        navigator.vibrate?.(10);
        moveSession({ pointerId: session.pointerId, clientX: session.pointerX, clientY: session.pointerY });
      }, TOUCH_HOLD_MS);
    }
    if (mode === "resize") setDrag({ tileId: tile.id, mode, preview: layout });
  }

  function moveSession(event: Pick<PointerEvent, "pointerId" | "clientX" | "clientY">) {
    const session = sessionRef.current;
    if (!session || event.pointerId !== session.pointerId) return;
    const tile = session.base.tiles.find((entry) => entry.id === session.tileId);
    if (!tile) return;
    if (!session.started) {
      const distance = Math.hypot(event.clientX - session.startX, event.clientY - session.startY);
      if (session.pointerType === "touch") {
        // Moving before the hold completes is a scroll, not a drag.
        if (distance > TOUCH_HOLD_SLOP_PX) cancelSession();
        return;
      }
      if (distance < DRAG_THRESHOLD_PX) return;
      session.started = true;
    }
    session.pointerX = event.clientX;
    session.pointerY = event.clientY;
    if (session.mode === "move") liftDraggedTile(session);
    const pointerX = event.clientX - session.gridLeft;
    const pointerY = event.clientY - session.gridTop;
    if (session.mode === "resize") {
      resizeFluidly(session);
      return;
    }
    let preview: HomeLayout;
    const neighbour = session.mode === "move" ? besideDwellTarget(session, tile, pointerY) : null;
    const suggestion = neighbour
      ? suggestHomeTileBesideFullWidth({
        tileSizes: [{ w: tile.w, h: tile.h }, ...session.fitSizes],
        neighbour,
        neighbourSizes: getHomeTileBesideSizes(neighbour),
        pointerColumn: homeTilePointerColumn(session.gridWidth, pointerX, session.grabOffsetX),
      })
      : null;
    if (neighbour && suggestion) {
      // Preview only: the Full-width tile shrinks in its row and the dragged tile goes beside it.
      const shrunk = placeHomeTileAt(session.base, neighbour.id, suggestion.neighbour);
      preview = settleHomeTilesAfterMove(
        session.base,
        placeHomeTileAt(shrunk, tile.id, suggestion.tile),
        tile.id,
      );
    } else if (session.mode === "move") {
      const target = snapHomeTileDrop({
        tile,
        others: session.base.tiles.filter((entry) => entry.id !== tile.id),
        bands: session.bands,
        gridWidth: session.gridWidth,
        pointerX,
        pointerY,
        grabOffsetX: session.grabOffsetX,
        fitSizes: session.fitSizes,
      });
      // Close only the gaps this move creates; the preview is exactly what a drop commits.
      preview = settleHomeTilesAfterMove(
        session.base,
        placeHomeTileAt(session.base, tile.id, target),
        tile.id,
      );
    } else {
      return;
    }
    session.preview = preview;
    // Re-render only when the snapped slot changes; between snaps only the lifted tile moves.
    const key = layoutPositionsKey(preview);
    if (key === session.previewKey) return;
    session.previewKey = key;
    setDrag({ tileId: tile.id, mode: session.mode, preview });
    if (session.mode === "move") {
      const summary = resizeSummary(session);
      const changeKey = summary?.key ?? "";
      if (changeKey !== session.announcedFit) {
        if (summary) setAnnouncement(summary.announcement);
        else if (session.announcedFit) setAnnouncement("No tiles change size here.");
        session.announcedFit = changeKey;
      }
    }
  }

  /**
   * Full-width tile whose row the pointer is resting over, once it has rested
   * there for BESIDE_DWELL_MS; null while passing over or elsewhere. Starts,
   * restarts or clears the dwell timer as the pointer moves.
   */
  function besideDwellTarget(session: DragSession, tile: HomeTile, pointerY: number): HomeTile | null {
    const band = session.bands.filter((entry) => pointerY >= entry.top && pointerY <= entry.bottom).pop();
    const neighbour = band
      ? session.base.tiles.find(
        (entry) => entry.id !== tile.id && entry.y === band.y && getHomeTileBesideSizes(entry).length > 0,
      )
      : undefined;
    const dwell = session.dwell;
    if (neighbour && dwell?.tileId === neighbour.id) {
      if (dwell.ready) return neighbour;
      const drift = Math.hypot(session.pointerX - dwell.anchorX, session.pointerY - dwell.anchorY);
      if (drift <= BESIDE_DWELL_SLOP_PX) return null;
    }
    clearDwell(session);
    if (!neighbour) return null;
    const pointerId = session.pointerId;
    session.dwell = {
      tileId: neighbour.id,
      anchorX: session.pointerX,
      anchorY: session.pointerY,
      ready: false,
      timer: window.setTimeout(() => {
        if (sessionRef.current !== session || session.dwell?.tileId !== neighbour.id) return;
        session.dwell.ready = true;
        moveSession({ pointerId, clientX: session.pointerX, clientY: session.pointerY });
      }, BESIDE_DWELL_MS),
    };
    return null;
  }

  function clearDwell(session: DragSession) {
    if (session.dwell) window.clearTimeout(session.dwell.timer);
    session.dwell = null;
  }

  /**
   * Tiles whose size the current move preview changes: the dragged tile shrunk
   * to fit, and/or a Full-width tile shrunk so the dragged tile fits beside it.
   */
  function resizeSummary(session: DragSession): {
    key: string;
    announcement: string;
    verb: string;
    undo: HomeLayoutUndoNotice;
  } | null {
    const sizeLabel = (entry: HomeTile) => findHomeTileSizeByDimensions(entry.w, entry.h)?.label ?? "a different size";
    const changes = session.preview.tiles.flatMap((after) => {
      const before = session.base.tiles.find((entry) => entry.id === after.id);
      if (!before || (before.w === after.w && before.h === after.h)) return [];
      return [{ after, from: sizeLabel(before), to: sizeLabel(after) }];
    });
    const movedTile = session.preview.tiles.find((entry) => entry.id === session.tileId);
    if (changes.length === 0 || !movedTile) return null;
    const moved = labelOf(movedTile);
    const dragged = changes.find((change) => change.after.id === session.tileId);
    const other = changes.find((change) => change.after.id !== session.tileId);
    const key = changes.map((change) => `${change.after.id}:${change.to}`).join("|");
    if (other) {
      const name = labelOf(other.after);
      return {
        key,
        announcement: `${name} will become ${other.to} so ${moved} fits beside it${dragged ? `, as ${dragged.to}` : ""}.`,
        verb: `${dragged ? `moved and resized to ${dragged.to}` : "moved"}; ${name} resized to ${other.to}`,
        undo: {
          title: `${name} resized to ${other.to}`,
          description: `It was made smaller so ${moved} fits beside it. Undo restores ${other.from} and the previous layout.`,
        },
      };
    }
    if (!dragged) return null;
    return {
      key,
      announcement: `${moved} will become ${dragged.to} to fit here.`,
      verb: `moved and resized to ${dragged.to}`,
      undo: {
        title: `${moved} resized to ${dragged.to}`,
        description: `It was made smaller to fit beside other tiles. Undo restores ${dragged.from} and where it was.`,
      },
    };
  }

  /** Preset the size currently drawn would snap to on release. */
  function resizeTargetSize(session: DragSession, tile: HomeTile): HomeTileSize {
    const resize = session.resize;
    if (!resize) return getHomeTileSizeId(tile) ?? getHomeTileDefinition(tile.type).defaultSize;
    const desired = measureHomeTileFluidSize({
      gridWidth: session.gridWidth,
      widthPx: resize.width,
      bodyHeightPx: resize.height - resize.headerPx,
      withSectionHeader: resize.headerPx > 0,
    });
    // Side edges change width only, and tiles whose height follows their content snap by width.
    const byHeight = resize.edge.startsWith("bottom") && !homeTileUsesContentHeight(tile);
    return snapHomeTileSize(tile.type, desired.w, desired.h, byHeight ? 1 : 0);
  }

  /**
   * Draws the tile at exactly the size the pointer asks for (no preset jumps);
   * neighbours stay put. Only the label naming the size it will snap to changes.
   */
  function resizeFluidly(session: DragSession) {
    const resize = session.resize;
    const frame = frameOf(session.tileId);
    const tile = session.base.tiles.find((entry) => entry.id === session.tileId);
    if (!resize || !frame || !tile) return;
    const dx = session.pointerX - session.startX;
    const dy = session.pointerY - session.startY;
    const fromLeft = resize.edge === "left" || resize.edge === "bottom-left";
    const minWidth = homeTileColumnPitch(session.gridWidth) * 2 - HOME_TILE_GRID.gapPx;
    const maxWidth = fromLeft
      ? resize.startLeft + resize.startWidth - session.gridLeft
      : session.gridLeft + session.gridWidth - resize.startLeft;
    const width = clamp(resize.startWidth + (fromLeft ? -dx : dx), minWidth, maxWidth);
    const tall = resize.edge.startsWith("bottom");
    const withHeader = resize.headerPx > 0;
    const height = tall
      ? clamp(
        resize.startHeight + dy,
        resize.headerPx + 96,
        resize.headerPx + homeTileBodyHeightPx(8, withHeader) * 1.1,
      )
      : resize.startHeight;
    resize.width = width;
    resize.height = height;
    resize.moved = true;

    frame.style.transition = "none";
    frame.style.flex = "none";
    frame.style.width = `${width}px`;
    frame.style.transform = `translate3d(${fromLeft ? resize.startWidth - width : 0}px, 0, 0)`;
    if (tall) {
      frame.style.height = `${height}px`;
      const body = frame.querySelector<HTMLElement>("[data-home-tile-body]");
      if (body) body.style.minHeight = "0px";
      const content = body?.firstElementChild;
      if (content instanceof HTMLElement) content.style.overflow = "hidden";
    }

    const sizeId = resizeTargetSize(session, tile);
    if (sizeId !== resize.hint) {
      resize.hint = sizeId;
      setResizeHint({ tileId: tile.id, label: HOME_TILE_SIZE_PRESETS[sizeId].label });
    }
  }

  /**
   * Release (or cancel) of a fluid resize: snap to the nearest allowed preset,
   * save only that, and let the tile glide from its drawn size into it.
   */
  function finishResize(session: DragSession, cancelled: boolean) {
    const frame = frameOf(session.tileId);
    const tile = session.base.tiles.find((entry) => entry.id === session.tileId);
    setResizeHint(null);
    setDrag(null);
    if (!frame || !tile || !session.resize) return;
    pendingResizeRef.current = {
      tileId: tile.id,
      rect: frame.getBoundingClientRect(),
      bodyMinHeight: session.resize.bodyMinHeight,
    };
    if (cancelled) {
      setAnnouncement("Resize cancelled.");
      return;
    }
    if (!session.resize.moved) return;
    const sizeId = resizeTargetSize(session, tile);
    const preset = HOME_TILE_SIZE_PRESETS[sizeId];
    const fromLeft = session.resize.edge === "left" || session.resize.edge === "bottom-left";
    // A left-edge resize keeps the right edge where it was.
    const x = clamp(fromLeft ? tile.x + tile.w - preset.w : tile.x, 0, HOME_TILE_GRID.columns - preset.w);
    if (preset.w === tile.w && preset.h === tile.h && x === tile.x) {
      setAnnouncement(`${labelOf(tile)} stays ${preset.label}.`);
      return;
    }
    const next = settleHomeTilesAfterMove(
      session.base,
      placeHomeTileAt(session.base, tile.id, { x, y: tile.y, w: preset.w, h: preset.h }),
      tile.id,
    );
    commitRef.current(next, tile.id, `resized to ${preset.label}`);
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
    clearDwell(session);
    sessionRef.current = null;
    if (session.mode === "resize") {
      finishResize(session, cancelled);
      return;
    }
    settleDraggedTile(session);
    setDrag(null);
    if (!cancelled && session.started) {
      const summary = session.mode === "move" ? resizeSummary(session) : null;
      commitRef.current(
        session.preview,
        session.tileId,
        summary ? summary.verb : session.mode === "move" ? "moved" : "resized",
        summary?.undo,
      );
    }
  }

  // ── Keyboard and button alternatives ──

  function handleMoveKey(event: ReactKeyboardEvent<HTMLElement>, tile: HomeTile) {
    if (event.target !== event.currentTarget) return;
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
        {/* The tile's chosen style travels with it: moves and resizes never change it. */}
        <HomeTileSurfaceProvider value={getHomeTileSurfaceStyle(tile)}>{renderTile(tile)}</HomeTileSurfaceProvider>
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
          // Room for the first row's Remove badges while customizing.
          paddingTop: editing
            ? placements.some(({ tile, rowStart }, index) =>
              (stacked ? index === 0 : rowStart === 1) && homeTileUsesContentHeight(tile))
              ? EDIT_GRID_TOP_SECTION_PX
              : EDIT_GRID_TOP_PX
            : undefined,
        }}
      >
        {placements.map(({ tile, rowStart, rowEnd }, index) => {
          const definition = getHomeTileDefinition(tile.type);
          const startsLowerRow = stacked ? index > 0 : rowStart > 1;
          const label = labelOf(tile);
          const size = findHomeTileSizeByDimensions(tile.w, tile.h);
          const isActive = drag?.tileId === tile.id;
          const isLifted = isActive && drag?.mode === "move";
          // While moving a tile, label every tile the drop would resize (the dragged one, or a Full-width neighbour).
          const sizedFrom = drag?.mode === "move" ? sessionRef.current?.base.tiles.find((entry) => entry.id === tile.id) : undefined;
          const fitLabel = sizedFrom && (sizedFrom.w !== tile.w || sizedFrom.h !== tile.h) ? size?.label : undefined;
          const sizeOptions = definition.allowedSizes;
          const canSize = sizeOptions.length > 1 && Boolean(onLayoutChange);
          // Every tile can change its style; tiles that show one item can also change the item.
          const configurable = Boolean(onConfigureTile);
          const hintLabel = resizeHint?.tileId === tile.id ? resizeHint.label : undefined;
          const slotTop = startsLowerRow ? HOME_TILE_GRID.rowGapPx : 0;
          const style: CSSProperties = {
            gridColumn: stacked ? "1 / -1" : `${tile.x + 1} / span ${tile.w}`,
            gridRow: stacked ? undefined : `${rowStart} / ${rowEnd}`,
            // The lifted or resized tile draws above its neighbours.
            position: isActive ? "relative" : undefined,
            zIndex: isActive ? 30 : undefined,
            paddingTop: startsLowerRow ? HOME_TILE_GRID.rowGapPx : undefined,
            marginBottom:
              homeTileHasOwnBottomSpacing(tile) && !editing ? -HOME_TILE_GRID.rowGapPx : undefined,
          };
          // Tiles that already render their own Home section heading (Full-width Focus,
          // Pinned, Recent) get no outer heading; every other tile gets one above its card.
          const section = getTileSection?.(tile) ?? null;
          const headingId = section ? `home-tile-heading-${tile.id}` : undefined;
          const sectionTile = homeTileUsesContentHeight(tile);
          // Stacked (tablet / phone): cards follow their content, never shorter than a Small tile.
          // Only the rendering changes; the saved desktop size and position are untouched.
          const minHeight = sectionTile
            ? undefined
            : homeTileBodyHeightPx(stacked ? 2 : tile.h, Boolean(section));
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
                // The whole tile (heading + card) is the drag surface; arrow keys move it when focused.
                <section
                  aria-label={canArrange ? `${label}. Drag to move, or use the arrow keys.` : `${label} tile`}
                  aria-roledescription="Home Tile"
                  data-home-tile-frame=""
                  data-home-tile-control="move"
                  tabIndex={canArrange ? 0 : undefined}
                  className="group/tile relative flex min-w-0 flex-1 select-none flex-col outline-none transition-[outline-color] duration-150 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] focus-visible:ring-offset-4"
                  style={{
                    ...(isLifted ? LIFTED_FRAME_STYLE : isActive ? ACTIVE_FRAME_STYLE : EDIT_FRAME_STYLE),
                    cursor: isLifted ? "grabbing" : canArrange ? "grab" : undefined,
                    // Vertical swipes still scroll the page until a press-and-hold picks the tile up.
                    touchAction: canArrange ? "pan-y" : undefined,
                    WebkitTouchCallout: "none",
                  }}
                  onPointerDown={canArrange ? (event) => startBodyDrag(event, tile) : undefined}
                  onKeyDown={canArrange ? (event) => handleMoveKey(event, tile) : undefined}
                  onContextMenu={(event) => {
                    // A long press that picked the tile up shouldn't also open the context menu.
                    if (sessionRef.current) event.preventDefault();
                  }}
                >
                  {sectionHeader}
                  <div className="relative flex min-w-0 flex-1 flex-col" data-home-tile-body="" style={{ minHeight }}>
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
                    {fitLabel || hintLabel ? (
                      // Size this drop or resize will give the tile — shown before the user lets go.
                      <span
                        {...(fitLabel ? { "data-home-tile-fit": "" } : { "data-home-tile-resize-hint": "" })}
                        className="pointer-events-none absolute left-1/2 top-3 z-[3] -translate-x-1/2 rounded-full px-2.5 py-1 luxia-type-caption font-semibold whitespace-nowrap shadow-[var(--luxia-shadow-sm)]"
                        style={{ background: "var(--luxia-purple-70)", color: "var(--luxia-text-inverse)" }}
                      >
                        {fitLabel ? `Will become ${fitLabel}` : hintLabel}
                      </span>
                    ) : null}
                    {onRemoveTile ? (
                      <button
                        type="button"
                        data-home-tile-control="remove"
                        aria-label={`Remove ${label} from Home`}
                        title="Remove from Home"
                        onClick={() => handleRemove(tile)}
                        className={`absolute z-[4] inline-flex size-6 items-center justify-center rounded-full border-2 shadow-[var(--luxia-shadow-sm)] outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] focus-visible:ring-offset-2 ${
                          // A section tile's title sits at its top-left, so its badge sits just above the frame.
                          sectionTile ? "" : "-left-2.5 -top-2.5"
                        }`}
                        style={{
                          background: "var(--luxia-error)",
                          borderColor: "var(--luxia-surface)",
                          color: "var(--luxia-text-inverse)",
                          // Inset like the right-hand controls, clear of the row above's bottom-left resize grip.
                          ...(sectionTile ? { top: -(SECTION_CONTROLS_OFFSET_PX - 2), left: SECTION_CONTROLS_INSET_PX } : {}),
                        }}
                      >
                        <Minus size={14} strokeWidth={2.75} aria-hidden />
                      </button>
                    ) : null}
                    {configurable || canSize ? (
                      // Section-style tiles (Full-width Your focus / Pinned / Recent) have their own
                      // links and controls top-right, so their actions sit just above the frame.
                      // Other tiles keep them just left of the card's category corner, never over it.
                      <div
                        className={`absolute z-[4] flex items-center gap-1 ${sectionTile ? "" : "top-2"}`}
                        style={sectionTile
                          ? { top: -SECTION_CONTROLS_OFFSET_PX, right: SECTION_CONTROLS_INSET_PX }
                          : { right: HOME_TILE_CORNER[size?.id === "small" ? "small" : "medium"].boxPx + 8 }}
                      >
                        {configurable ? (
                          <button
                            type="button"
                            data-home-tile-control="configure"
                            aria-label={definition.requiresTarget ? `Configure ${label}: style and item` : `Configure ${label}: style`}
                            title={definition.requiresTarget ? "Configure style and item" : "Configure style"}
                            onClick={() => {
                              pendingFocusRef.current = { tileId: tile.id, control: "configure" };
                              onConfigureTile?.(tile);
                            }}
                            className={TILE_ACTION_CLASS}
                            style={TILE_ACTION_STYLE}
                          >
                            <SlidersHorizontal size={14} strokeWidth={2} aria-hidden />
                          </button>
                        ) : null}
                        {canSize ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                data-home-tile-control="size"
                                aria-label={`Size of ${label}: ${size?.label ?? "custom"}`}
                                title="Size"
                                className={TILE_ACTION_CLASS}
                                style={TILE_ACTION_STYLE}
                              >
                                <Maximize2 size={14} strokeWidth={2} aria-hidden />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[10rem]">
                              <DropdownMenuLabel>Tile size</DropdownMenuLabel>
                              <DropdownMenuRadioGroup
                                value={size?.id ?? ""}
                                onValueChange={(value) => handleSize(tile, value as HomeTileSize)}
                              >
                                {sizeOptions.map((sizeId) => (
                                  <DropdownMenuRadioItem key={sizeId} value={sizeId}>
                                    {HOME_TILE_SIZE_PRESETS[sizeId].label}
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                    ) : null}
                    {canArrange && sizeOptions.length > 1
                      ? RESIZE_EDGES.map((edge) => (
                        <span
                          key={edge}
                          aria-hidden
                          data-home-tile-resize={edge}
                          title="Drag to resize"
                          className={RESIZE_HANDLE_CLASS[edge]}
                          style={{ touchAction: "none" }}
                          onPointerDown={(event) => startSession(event, tile, "resize", edge)}
                        >
                          <span
                            className={`${RESIZE_GRIP_CLASS[edge]} opacity-40 transition-opacity group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100`}
                            style={edge === "left" || edge === "right"
                              ? { background: "var(--luxia-purple-60)" }
                              : { borderColor: "var(--luxia-purple-60)" }}
                          />
                        </span>
                      ))
                      : null}
                  </div>
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
