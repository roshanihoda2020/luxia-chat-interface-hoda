import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";
import { BusyButton } from "@/app/features/shared/Loading";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import type { DataTableCatalogItem, DataTableRecord } from "@/app/features/active-data-tables/types";
import { LX } from "@/app/features/active-data-tables/tokens";
import { MAX_CONSTELLATION_VIEWS } from "./constants";
import {
  buildViewsFromSelection,
  mergeViewCatalogWithSelected,
} from "./catalog";

const SAVE_DELAY_MS = 500;

function idsSignature(ids: string[]): string {
  return [...ids].sort().join("\0");
}

export function ManageViewsDialog({
  open,
  onOpenChange,
  catalog,
  selectedViews,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: DataTableCatalogItem[];
  selectedViews: DataTableRecord[];
  onSave: (nextViews: DataTableRecord[]) => void;
}) {
  const candidates = useMemo(
    () => mergeViewCatalogWithSelected(catalog, selectedViews),
    [catalog, selectedViews],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const initialIdsRef = useRef<string[]>([]);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const ids = selectedViews.map((view) => view.id);
    initialIdsRef.current = ids;
    setSelectedIds(ids);
    setSaving(false);
    setDiscardOpen(false);
  }, [open, selectedViews]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const dirty = idsSignature(selectedIds) !== idsSignature(initialIdsRef.current);
  const atLimit = selectedIds.length >= MAX_CONSTELLATION_VIEWS;

  function toggle(id: string) {
    if (saving) return;
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= MAX_CONSTELLATION_VIEWS) return current;
      return [...current, id];
    });
  }

  function requestClose() {
    if (saving) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  function handleSave() {
    if (saving) return;
    setSaving(true);
    const next = buildViewsFromSelection(selectedIds, candidates, selectedViews);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      try {
        onSave(next);
        luxiaToast.success("Views updated");
        setSaving(false);
        onOpenChange(false);
      } catch {
        luxiaToast.error("Could not save the Views");
        setSaving(false);
      }
    }, SAVE_DELAY_MS);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
      >
        <DialogContent
          hideCloseButton
          className="flex max-h-[calc(100vh-48px)] flex-col gap-0 overflow-hidden p-0"
          style={{ width: "min(92vw, 560px)", maxWidth: "min(92vw, 560px)" }}
          onEscapeKeyDown={(event) => {
            if (saving || dirty) {
              event.preventDefault();
              requestClose();
            }
          }}
          onPointerDownOutside={(event) => {
            if (saving || dirty) {
              event.preventDefault();
              requestClose();
            }
          }}
        >
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <DialogTitle className="luxia-type-title-modal">Manage Views</DialogTitle>
                <DialogDescription className="sr-only">
                  Select database views for this Constellation. Maximum {MAX_CONSTELLATION_VIEWS}.
                </DialogDescription>
                <p className="mt-1.5 luxia-type-metadata text-[var(--luxia-purple-10)]">
                  Select up to {MAX_CONSTELLATION_VIEWS} database views.
                </p>
              </div>
              <button
                type="button"
                onClick={requestClose}
                disabled={saving}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2",
                  LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
                )}
                aria-label="Close Manage Views"
              >
                <X size={15} />
              </button>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-3">
            {candidates.length === 0 ? (
              <p
                className="rounded-[10px] border border-dashed px-4 py-6 text-center luxia-type-body-dense"
                style={{ borderColor: LX.border, color: LX.textMuted }}
              >
                This schema has no views.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {candidates.map((view) => {
                  const selected = selectedIds.includes(view.id);
                  const disabled = saving || (!selected && atLimit);
                  return (
                    <li key={view.id}>
                      <label
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] border px-2.5 py-2 text-left transition-colors",
                          disabled && "cursor-not-allowed opacity-60",
                        )}
                        style={{
                          borderColor: selected ? LX.secondary : LX.border,
                          background: selected ? LX.subtle : LX.surface,
                        }}
                      >
                        <Checkbox
                          checked={selected}
                          disabled={disabled}
                          onCheckedChange={() => {
                            if (!disabled) toggle(view.id);
                          }}
                          aria-label={`Select ${view.displayName}`}
                          className="mt-0.5 shrink-0"
                        />
                        <span className="min-w-0 flex-1 leading-snug">
                          <span
                            className="block truncate luxia-type-body-dense-strong"
                            style={{ color: LX.primary }}
                          >
                            {view.displayName}
                          </span>
                          <span
                            className="mt-0.5 block truncate luxia-type-caption"
                            style={{ color: LX.textMuted }}
                          >
                            {view.originalName}
                          </span>
                          <span
                            className="mt-0.5 block truncate luxia-type-caption"
                            style={{ color: LX.textMuted }}
                          >
                            {view.sourceDatabase} · {view.rowCount} rows · {view.columns.length} columns
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div
            className="flex flex-shrink-0 items-center justify-between gap-3 border-t px-6 py-4"
            style={{ borderColor: LX.border, background: LX.surface }}
          >
            <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
              {selectedIds.length} of {MAX_CONSTELLATION_VIEWS} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="px-4"
                disabled={saving}
                onClick={requestClose}
              >
                Cancel
              </Button>
              <BusyButton
                type="button"
                variant="primary"
                className="min-w-[108px] px-4"
                busy={saving}
                busyLabel="Saving…"
                busyText="Saving…"
                disabled={!dirty && !saving}
                onClick={handleSave}
              >
                Save
              </BusyButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DiscardChangesDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={() => {
          setDiscardOpen(false);
          setSelectedIds(initialIdsRef.current);
          onOpenChange(false);
        }}
      />
    </>
  );
}
