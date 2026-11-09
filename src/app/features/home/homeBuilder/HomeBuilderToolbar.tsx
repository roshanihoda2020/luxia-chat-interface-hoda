import { useEffect, useRef, useState, type RefObject } from "react";
import {
  BookmarkCheck,
  BookmarkPlus,
  Check,
  ChevronDown,
  History,
  LayoutGrid,
  LayoutTemplate,
  ListChecks,
  Plus,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

interface HomeBuilderToolbarProps {
  editing: boolean;
  onAddTile: () => void;
  onDone: () => void;
  onResetToDefault: () => void;
  onSaveAsMyDefault: () => void;
  onRestoreMyDefault: () => void;
  /** When the saved layout was saved, or null when the user has none. */
  myDefaultSavedAt: number | null;
  /** The current Home already matches the Luxia Default. */
  isDefaultLayout: boolean;
  /** The current Home already matches the saved layout. */
  isMyDefaultLayout: boolean;
  onShowGuidance?: () => void;
  guidanceShown?: boolean;
}

type LayoutConfirm = "restore" | "reset" | "replace";

/** "Nov 4 at 4:59 PM"; "earlier" when the time is unknown. */
export function formatMyDefaultSavedAt(savedAt: number): string {
  if (!savedAt) return "earlier";
  const date = new Date(savedAt);
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  // Non-breaking, so a wrapped helper never leaves "PM" on its own line.
  return `${day} at\u00a0${time.replace(/\s/g, "\u00a0")}`;
}

/**
 * Customize mode toolbar, shown below the Home header (whose Customize Home
 * action opens it). Sticky within the Home scroll area, compacting once stuck.
 * Add Tile is the primary action, Done the exit, and the Layout menu holds
 * Save current layout, Restore saved layout and Reset to Luxia default.
 * Renders nothing outside Customize mode.
 */
export function HomeBuilderToolbar({
  editing,
  onAddTile,
  onDone,
  onResetToDefault,
  onSaveAsMyDefault,
  onRestoreMyDefault,
  myDefaultSavedAt,
  isDefaultLayout,
  isMyDefaultLayout,
  onShowGuidance,
  guidanceShown = false,
}: HomeBuilderToolbarProps) {
  const addTileRef = useRef<HTMLButtonElement>(null);
  const layoutMenuRef = useRef<HTMLButtonElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const previousEditing = useRef(editing);
  const [stuck, setStuck] = useState(false);
  const [confirm, setConfirm] = useState<LayoutConfirm | null>(null);

  // The pressed button changes with the mode; keep keyboard focus nearby.
  useEffect(() => {
    if (previousEditing.current === editing) return;
    previousEditing.current = editing;
    if (editing) addTileRef.current?.focus();
    else document.querySelector<HTMLElement>("[data-home-customize-entry]")?.focus();
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

  if (!editing) return null;

  const hasMyDefault = myDefaultSavedAt !== null;
  const savedLabel = hasMyDefault ? formatMyDefaultSavedAt(myDefaultSavedAt) : "";

  function saveAsMyDefault() {
    if (hasMyDefault) setConfirm("replace");
    else onSaveAsMyDefault();
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
                Changes save automatically. Only your Home changes.
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                ref={layoutMenuRef}
                type="button"
                variant="tertiary"
                aria-label="Layout"
                data-home-layout-menu=""
                className="luxia-home-touch-target luxia-home-toolbar-reset"
              >
                <LayoutTemplate size={15} strokeWidth={2} aria-hidden />
                <span className="max-sm:hidden">Layout</span>
                <ChevronDown size={14} strokeWidth={2} aria-hidden className="max-sm:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              collisionPadding={16}
              className="luxia-home-layout-menu w-[19rem] max-w-[calc(100vw-32px)]"
            >
              <LayoutMenuItem
                icon={isMyDefaultLayout ? BookmarkCheck : BookmarkPlus}
                label="Save current layout"
                detail={
                  isMyDefaultLayout
                    ? "Already saved"
                    : hasMyDefault
                      ? `Replaces your layout from ${savedLabel}`
                      : "Keep this arrangement to come back to"
                }
                disabled={isMyDefaultLayout}
                onSelect={saveAsMyDefault}
              />
              <LayoutMenuItem
                icon={History}
                label="Restore saved layout"
                detail={
                  !hasMyDefault
                    ? "No saved layout yet"
                    : isMyDefaultLayout
                      ? "Your Home already matches it"
                      : `Saved ${savedLabel}`
                }
                disabled={!hasMyDefault || isMyDefaultLayout}
                onSelect={() => setConfirm("restore")}
              />
              <DropdownMenuSeparator />
              <LayoutMenuItem
                icon={RotateCcw}
                label="Reset to Luxia default"
                detail={
                  isDefaultLayout
                    ? "Already the Luxia default"
                    : hasMyDefault
                      ? "Original Home layout · your saved layout stays"
                      : "Original Home layout"
                }
                disabled={isDefaultLayout}
                onSelect={() => setConfirm("reset")}
              />
              {onShowGuidance ? (
                <>
                  <DropdownMenuSeparator />
                  <LayoutMenuItem
                    icon={ListChecks}
                    label="Show getting started"
                    detail={guidanceShown ? "Already on your Home" : "Brings back the short getting-started steps"}
                    disabled={guidanceShown}
                    onSelect={onShowGuidance}
                  />
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
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

      <HomeLayoutConfirmDialog
        kind={confirm}
        savedLabel={savedLabel}
        hasMyDefault={hasMyDefault}
        returnFocusTo={layoutMenuRef}
        onCancel={() => setConfirm(null)}
        onConfirm={(kind) => {
          setConfirm(null);
          if (kind === "restore") onRestoreMyDefault();
          else if (kind === "reset") onResetToDefault();
          else onSaveAsMyDefault();
        }}
      />
    </>
  );
}

function LayoutMenuItem({
  icon: Icon,
  label,
  detail,
  disabled,
  onSelect,
}: {
  icon: typeof History;
  label: string;
  detail: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem disabled={disabled} onSelect={onSelect} className="luxia-home-layout-menu-item">
      <span aria-hidden className="luxia-home-layout-menu-chip">
        <Icon size={16} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="luxia-home-layout-menu-label block luxia-type-body-dense-strong">{label}</span>
        <span className="luxia-home-layout-menu-detail block luxia-type-caption">{detail}</span>
      </span>
    </DropdownMenuItem>
  );
}

function HomeLayoutConfirmDialog({
  kind,
  savedLabel,
  hasMyDefault,
  returnFocusTo,
  onCancel,
  onConfirm,
}: {
  kind: LayoutConfirm | null;
  savedLabel: string;
  hasMyDefault: boolean;
  returnFocusTo: RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onConfirm: (kind: LayoutConfirm) => void;
}) {
  // Keeps the last dialog's copy while it animates closed.
  const [shown, setShown] = useState<LayoutConfirm>("reset");
  if (kind && kind !== shown) setShown(kind);
  const current = kind ?? shown;

  const copy = {
    reset: {
      title: "Reset Home layout?",
      body: "Your current layout will be replaced with the original Luxia layout.",
      reassurance: hasMyDefault ? "Your saved layout will remain available." : null,
      action: "Reset Home",
    },
    restore: {
      title: "Restore saved layout?",
      body: `Your current layout will be replaced with the layout you saved ${savedLabel}.`,
      reassurance: "Your saved layout stays available.",
      action: "Restore layout",
    },
    replace: {
      title: "Replace saved layout?",
      body: `The layout you saved ${savedLabel} will be replaced with your current one.`,
      reassurance: "Your current Home won't change.",
      action: "Replace layout",
    },
  }[current];

  return (
    <AlertDialog open={kind !== null} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent
        data-home-layout-confirm={current}
        className="luxia-home-layout-confirm sm:max-w-[420px]"
        aria-describedby={copy.reassurance ? "home-layout-confirm-body home-layout-confirm-note" : "home-layout-confirm-body"}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusTo.current?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription id="home-layout-confirm-body">{copy.body}</AlertDialogDescription>
        </AlertDialogHeader>
        {copy.reassurance ? (
          <p id="home-layout-confirm-note" className="luxia-home-layout-confirm-note luxia-type-body-dense">
            <ShieldCheck size={16} strokeWidth={2} aria-hidden />
            {copy.reassurance}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="button" variant="primary" onClick={() => onConfirm(current)}>
            {copy.action}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
