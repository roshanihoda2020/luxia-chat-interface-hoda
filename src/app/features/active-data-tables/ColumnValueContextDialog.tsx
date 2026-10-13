import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";
import { BusyButton } from "@/app/features/shared/Loading";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import {
  getColumnValueContextSnapshot,
  mockRetrieveColumnValues,
  removeColumnValueContextSnapshot,
  saveColumnValueContextSnapshot,
} from "./columnValueContextStore";
import {
  CVC_LIMIT_DEFAULT,
  CVC_LIMIT_MAX,
  CVC_LIMIT_MIN,
  CVC_OPEN_LOAD_DELAY_MS,
  CVC_REMOVE_DELAY_MS,
  CVC_RETRIEVE_DELAY_MS,
  CVC_SAVE_DELAY_MS,
  clampCvcLimit,
  draftFromSnapshot,
  emptyCvcDraft,
  type ColumnValueContextDraft,
  type CvcEntityKind,
  type CvcOrder,
  type CvcRetrieveMode,
} from "./columnValueContextTypes";
import { LX } from "./tokens";
import type { DataTableColumn, DataTableRecord } from "./types";

function draftSignature(draft: ColumnValueContextDraft): string {
  return JSON.stringify({
    retrieveMode: draft.retrieveMode,
    order: draft.order,
    limit: draft.limit,
    sumColumnId: draft.sumColumnId,
    values: draft.values,
    manualEdited: draft.manualEdited,
    hasRetrieved: draft.hasRetrieved,
  });
}

function sumColumnChoices(columns: DataTableColumn[], excludeId: string): DataTableColumn[] {
  return columns.filter(
    (column) =>
      column.id !== excludeId
      && (column.type === "Number" || column.type === "Currency"),
  );
}

export function ColumnValueContextDialog({
  open,
  onOpenChange,
  constellationId,
  entityKind = "table",
  entity,
  column,
  onValueContextCleared,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constellationId: string;
  entityKind?: CvcEntityKind;
  entity: DataTableRecord | null;
  column: DataTableColumn | null;
  /** Called after Remove snapshot succeeds — turn Value context OFF for this column. */
  onValueContextCleared: (columnId: string) => void;
}) {
  const [draft, setDraft] = useState<ColumnValueContextDraft>(() => emptyCvcDraft());
  const [baseline, setBaseline] = useState<ColumnValueContextDraft>(() => emptyCvcDraft());
  const [opening, setOpening] = useState(false);
  const [retrieving, setRetrieving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [savedSnapshotPresent, setSavedSnapshotPresent] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const openTimerRef = useRef<number | null>(null);
  const retrieveTimerRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const removeTimerRef = useRef<number | null>(null);

  const entityId = entity?.id ?? null;
  const columnId = column?.id ?? null;
  const entityName = entity?.displayName ?? "";
  const columnName = column?.displayName ?? "";

  const sumChoices = useMemo(
    () => (entity && column ? sumColumnChoices(entity.columns, column.id) : []),
    [entity, column],
  );

  const dirty = draftSignature(draft) !== draftSignature(baseline);
  const canSave = draft.values.length > 0 && !opening && !retrieving && !saving && !removing;
  const busy = opening || retrieving || saving || removing;

  useEffect(() => {
    return () => {
      if (openTimerRef.current !== null) window.clearTimeout(openTimerRef.current);
      if (retrieveTimerRef.current !== null) window.clearTimeout(retrieveTimerRef.current);
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      if (removeTimerRef.current !== null) window.clearTimeout(removeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open || !entityId || !columnId) return;

    setRetrieving(false);
    setSaving(false);
    setRemoving(false);
    setConfirmRemoveOpen(false);
    setDiscardOpen(false);

    const existing = getColumnValueContextSnapshot(
      constellationId,
      entityKind,
      entityId,
      columnId,
    );

    if (!existing) {
      const empty = emptyCvcDraft();
      setDraft(empty);
      setBaseline(empty);
      setSavedSnapshotPresent(false);
      setSavedCount(0);
      setOpening(false);
      return;
    }

    setOpening(true);
    setSavedSnapshotPresent(true);
    setSavedCount(existing.values.length);
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null;
      const restored = draftFromSnapshot(existing);
      setDraft(restored);
      setBaseline(restored);
      setOpening(false);
    }, CVC_OPEN_LOAD_DELAY_MS);
  }, [open, constellationId, entityKind, entityId, columnId]);

  function requestClose() {
    if (busy) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  function patchDraft(patch: Partial<ColumnValueContextDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleRetrieve() {
    if (!entity || !column || retrieving || busy) return;
    if (draft.retrieveMode === "sum" && !draft.sumColumnId) {
      luxiaToast.error("Choose a Sum column before retrieving");
      return;
    }

    setRetrieving(true);
    retrieveTimerRef.current = window.setTimeout(() => {
      retrieveTimerRef.current = null;
      try {
        const sumCol = sumChoices.find((item) => item.id === draft.sumColumnId) ?? null;
        const values = mockRetrieveColumnValues({
          constellationId,
          entityKind,
          entityId: entity.id,
          entityName: entity.displayName,
          columnId: column.id,
          columnName: column.displayName,
          retrieveMode: draft.retrieveMode,
          order: draft.order,
          limit: clampCvcLimit(draft.limit),
          sumColumnId: draft.sumColumnId,
          sumColumnName: sumCol?.displayName ?? null,
        });
        setDraft((current) => ({
          ...current,
          limit: clampCvcLimit(current.limit),
          values,
          manualEdited: false,
          hasRetrieved: true,
        }));
        luxiaToast.success("Values retrieved");
      } catch {
        luxiaToast.error("Could not retrieve values for this column");
      } finally {
        setRetrieving(false);
      }
    }, CVC_RETRIEVE_DELAY_MS);
  }

  function handleSave() {
    if (!entity || !column || !canSave) return;
    setSaving(true);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      try {
        const saved = saveColumnValueContextSnapshot({
          constellationId,
          entityKind,
          entityId: entity.id,
          columnId: column.id,
          retrieveMode: draft.retrieveMode,
          order: draft.order,
          limit: clampCvcLimit(draft.limit),
          sumColumnId: draft.retrieveMode === "sum" ? draft.sumColumnId : null,
          values: draft.values,
          manualEdited: draft.manualEdited,
        });
        const next = draftFromSnapshot(saved);
        setDraft(next);
        setBaseline(next);
        setSavedSnapshotPresent(true);
        setSavedCount(saved.values.length);
        luxiaToast.success("Column value context saved");
        setSaving(false);
        onOpenChange(false);
      } catch {
        luxiaToast.error("Could not save the column value context");
        setSaving(false);
      }
    }, CVC_SAVE_DELAY_MS);
  }

  function handleConfirmRemove() {
    if (!entity || !column || removing) return;
    setRemoving(true);
    removeTimerRef.current = window.setTimeout(() => {
      removeTimerRef.current = null;
      try {
        removeColumnValueContextSnapshot(
          constellationId,
          entityKind,
          entity.id,
          column.id,
        );
        onValueContextCleared(column.id);
        setSavedSnapshotPresent(false);
        setSavedCount(0);
        const empty = emptyCvcDraft();
        setDraft(empty);
        setBaseline(empty);
        luxiaToast.success("Column value context removed");
        setConfirmRemoveOpen(false);
        setRemoving(false);
        onOpenChange(false);
      } catch {
        luxiaToast.error("Could not remove the column value context");
        setRemoving(false);
      }
    }, CVC_REMOVE_DELAY_MS);
  }

  function updateValue(index: number, nextValue: string) {
    setDraft((current) => ({
      ...current,
      manualEdited: true,
      values: current.values.map((row, i) =>
        i === index ? { ...row, value: nextValue } : row,
      ),
    }));
  }

  function updateMetric(index: number, nextMetric: string) {
    setDraft((current) => ({
      ...current,
      manualEdited: true,
      values: current.values.map((row, i) =>
        i === index ? { ...row, metric: nextMetric } : row,
      ),
    }));
  }

  if (!entity || !column) return null;

  const statusText = opening
    ? "Loading the saved snapshot…"
    : !savedSnapshotPresent && draft.values.length === 0
      ? "No snapshot saved for this column yet."
      : savedSnapshotPresent
        ? `Saved snapshot: ${savedCount} value${savedCount === 1 ? "" : "s"}${
            draft.manualEdited ? " · manually edited" : ""
          }`
        : draft.hasRetrieved
          ? `Draft: ${draft.values.length} value${draft.values.length === 1 ? "" : "s"}${
              draft.manualEdited ? " · manually edited" : ""
            }`
          : "No snapshot saved for this column yet.";

  const showMetric = draft.retrieveMode === "frequent" || draft.retrieveMode === "sum";
  const metricLabel = draft.retrieveMode === "sum" ? "Sum" : "Count";

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
          className="flex max-h-[calc(100vh-64px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
          style={{
            width: "min(calc(100vw - 64px), 640px)",
            maxWidth: "min(calc(100vw - 64px), 640px)",
            maxHeight: "calc(100vh - 64px)",
          }}
          onEscapeKeyDown={(event) => {
            if (busy || dirty) {
              event.preventDefault();
              requestClose();
            }
          }}
          onPointerDownOutside={(event) => {
            if (busy || dirty) {
              event.preventDefault();
              requestClose();
            }
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <DialogTitle>Column value context</DialogTitle>
                  <DialogDescription className="sr-only">
                    Manage retrieved values for {columnName} on {entityName}.
                  </DialogDescription>
                  <p className="mt-1 luxia-type-metadata leading-snug text-[var(--luxia-purple-10)]">
                    {entityName} · {columnName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={busy}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2",
                    LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
                  )}
                  aria-label="Close column value context"
                >
                  <X size={15} />
                </button>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-4">
              <p className="luxia-type-caption" style={{ color: LX.textMuted }} role="status">
                {statusText}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <label className="block luxia-type-label-small" style={{ color: LX.textSecondary }}>
                    Retrieve
                  </label>
                  <Select
                    value={draft.retrieveMode}
                    disabled={busy}
                    onValueChange={(value) =>
                      patchDraft({
                        retrieveMode: value as CvcRetrieveMode,
                        sumColumnId: value === "sum" ? draft.sumColumnId : null,
                      })
                    }
                  >
                    <SelectTrigger aria-label="Retrieve mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[80]">
                      <SelectItem value="distinct">Distinct values</SelectItem>
                      <SelectItem value="frequent">Most frequent</SelectItem>
                      <SelectItem value="sum" disabled={sumChoices.length === 0}>
                        By sum of another column
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label className="block luxia-type-label-small" style={{ color: LX.textSecondary }}>
                    Order
                  </label>
                  <Select
                    value={draft.order}
                    disabled={busy}
                    onValueChange={(value) => patchDraft({ order: value as CvcOrder })}
                  >
                    <SelectTrigger aria-label="Order">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[80]">
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label className="block luxia-type-label-small" style={{ color: LX.textSecondary }}>
                    Limit
                  </label>
                  <Input
                    type="number"
                    min={CVC_LIMIT_MIN}
                    max={CVC_LIMIT_MAX}
                    value={draft.limit}
                    disabled={busy}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      patchDraft({
                        limit: Number.isFinite(next) ? next : CVC_LIMIT_DEFAULT,
                      });
                    }}
                    onBlur={() => patchDraft({ limit: clampCvcLimit(draft.limit) })}
                    aria-label="Limit"
                  />
                </div>

                {draft.retrieveMode === "sum" ? (
                  <div className="min-w-0 space-y-1.5">
                    <label className="block luxia-type-label-small" style={{ color: LX.textSecondary }}>
                      Sum column
                    </label>
                    <Select
                      value={draft.sumColumnId ?? undefined}
                      disabled={busy || sumChoices.length === 0}
                      onValueChange={(value) => patchDraft({ sumColumnId: value })}
                    >
                      <SelectTrigger aria-label="Sum column">
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                      <SelectContent className="z-[80]">
                        {sumChoices.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {sumChoices.length === 0 ? (
                      <p className="luxia-type-caption" style={{ color: LX.textMuted }}>
                        No Number or Currency columns available to sum.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div>
                <BusyButton
                  type="button"
                  variant="secondary"
                  className="px-4"
                  disabled={busy || (draft.retrieveMode === "sum" && !draft.sumColumnId)}
                  busy={retrieving}
                  busyLabel="Retrieving…"
                  busyText="Retrieving…"
                  onClick={handleRetrieve}
                >
                  Retrieve values
                </BusyButton>
              </div>

              {draft.values.length > 0 ? (
                <div className="space-y-2">
                  <p className="luxia-type-label-small" style={{ color: LX.textSecondary }}>
                    Values
                  </p>
                  <ul className="space-y-2">
                    {draft.values.map((row, index) => (
                      <li key={`cvc-row-${index}`} className="grid gap-2 sm:grid-cols-[1fr_minmax(5rem,7rem)]">
                        <Input
                          value={row.value}
                          disabled={busy}
                          onChange={(event) => updateValue(index, event.target.value)}
                          aria-label={`Value ${index + 1}`}
                          className="h-8 min-h-8"
                        />
                        {showMetric ? (
                          <Input
                            value={row.metric ?? ""}
                            disabled={busy}
                            onChange={(event) => updateMetric(index, event.target.value)}
                            aria-label={`${metricLabel} ${index + 1}`}
                            className="h-8 min-h-8"
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div
              className="flex flex-shrink-0 items-center justify-between gap-3 border-t px-6 py-3"
              style={{ borderColor: LX.border, background: LX.surface }}
            >
              <div>
                {savedSnapshotPresent ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-3"
                    style={{ color: LX.error }}
                    disabled={busy}
                    onClick={() => setConfirmRemoveOpen(true)}
                  >
                    Remove snapshot
                  </Button>
                ) : (
                  <span />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-4"
                  onClick={requestClose}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <BusyButton
                  type="button"
                  className="min-w-[112px] px-4"
                  disabled={!canSave}
                  busy={saving}
                  busyLabel="Saving…"
                  busyText="Saving…"
                  onClick={handleSave}
                >
                  Save
                </BusyButton>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DiscardChangesDialog
        open={discardOpen}
        onOpenChange={(next) => {
          if (busy && !next) return;
          setDiscardOpen(next);
        }}
        onDiscard={() => {
          setDiscardOpen(false);
          onOpenChange(false);
        }}
      />

      <ConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={(next) => {
          if (!next && !removing) setConfirmRemoveOpen(false);
        }}
        tone="destructive"
        chrome="compact"
        title="Remove this saved value context?"
        description="The saved values for this column will be removed. The column itself and its configuration will not be deleted."
        cancelLabel="Cancel"
        confirmLabel="Remove"
        busy={removing}
        busyLabel="Removing…"
        onConfirm={handleConfirmRemove}
      />
    </>
  );
}
