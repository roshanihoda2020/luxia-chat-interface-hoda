import { useEffect, useMemo, useRef, useState } from "react";
import { ConfigureColumnsDialog } from "@/app/features/active-data-tables/ConfigureColumnsDialog";
import { EditTableDetailsDialog } from "@/app/features/active-data-tables/EditTableDetailsDialog";
import { TablePreviewDrawer } from "@/app/features/active-data-tables/TablePreviewDrawer";
import type { DataTableRecord } from "@/app/features/active-data-tables/types";
import { cloneTables } from "@/app/features/active-data-tables/utils";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
  DESTRUCTIVE_CONFIRM,
  DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { VIEW_CATALOG } from "./catalog";
import { CompactViewsList } from "./CompactViewsList";
import { DataViewsManager } from "./DataViewsManager";

/**
 * Chat capsule Views — expandable summary + dialog shortcut.
 * Reads/writes the same Constellation `bundle.views` as Settings.
 */
export function DataViewsSection({
  views,
  onCommitViews,
  isOpen,
  onToggle,
  readOnly = false,
  constellationId = "demo",
}: {
  views: DataTableRecord[];
  onCommitViews: (nextViews: DataTableRecord[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  readOnly?: boolean;
  constellationId?: string;
}) {
  const [managerOpen, setManagerOpen] = useState(false);
  const [previewViewId, setPreviewViewId] = useState<string | null>(null);
  const [detailsViewId, setDetailsViewId] = useState<string | null>(null);
  const [columnsViewId, setColumnsViewId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const removeTimerRef = useRef<number | null>(null);

  const openPreviewView = useMemo(
    () => views.find((view) => view.id === previewViewId) ?? null,
    [views, previewViewId],
  );
  const openDetailsView = useMemo(
    () => views.find((view) => view.id === detailsViewId) ?? null,
    [views, detailsViewId],
  );
  const openColumnsView = useMemo(
    () => views.find((view) => view.id === columnsViewId) ?? null,
    [views, columnsViewId],
  );

  useEffect(() => {
    return () => {
      if (removeTimerRef.current !== null) {
        window.clearTimeout(removeTimerRef.current);
      }
    };
  }, []);

  function commitViews(next: DataTableRecord[]) {
    onCommitViews(cloneTables(next));
  }

  function patchView(viewId: string, patch: Partial<DataTableRecord>) {
    if (readOnly) return;
    commitViews(
      views.map((view) => (view.id === viewId ? { ...view, ...patch } : view)),
    );
  }

  function confirmRemove() {
    if (readOnly || !confirmRemoveId || removing) return;
    const removeId = confirmRemoveId;
    setRemoving(true);
    removeTimerRef.current = window.setTimeout(() => {
      removeTimerRef.current = null;
      try {
        const next = views.filter((view) => view.id !== removeId);
        commitViews(next);
        if (previewViewId === removeId) setPreviewViewId(null);
        if (detailsViewId === removeId) setDetailsViewId(null);
        if (columnsViewId === removeId) setColumnsViewId(null);
        luxiaToast.success(DESTRUCTIVE_CONFIRM.view.successToast);
        setConfirmRemoveId(null);
      } catch {
        luxiaToast.error(DESTRUCTIVE_CONFIRM.view.errorToast);
      } finally {
        setRemoving(false);
      }
    }, DESTRUCTIVE_REMOVE_DELAY_MS);
  }

  return (
    <>
      <CompactViewsList
        views={views}
        isOpen={isOpen}
        onToggle={onToggle}
        readOnly={readOnly}
        onOpenManager={() => setManagerOpen(true)}
        onView={(id) => setPreviewViewId(id)}
        onEditDetails={readOnly ? undefined : (id) => setDetailsViewId(id)}
        onConfigureColumns={readOnly ? undefined : (id) => setColumnsViewId(id)}
        onRemove={readOnly ? undefined : (id) => setConfirmRemoveId(id)}
      />

      <DataViewsManager
        open={managerOpen}
        presentation="dialog"
        views={views}
        catalog={VIEW_CATALOG}
        readOnly={readOnly}
        onCommit={commitViews}
        onCancel={() => setManagerOpen(false)}
        onPreview={(id) => {
          setManagerOpen(false);
          requestAnimationFrame(() => setPreviewViewId(id));
        }}
        onEditDetails={(id) => {
          if (readOnly) return;
          setManagerOpen(false);
          requestAnimationFrame(() => setDetailsViewId(id));
        }}
        onConfigureColumns={(id) => {
          if (readOnly) return;
          setManagerOpen(false);
          requestAnimationFrame(() => setColumnsViewId(id));
        }}
      />

      <TablePreviewDrawer
        entityKind="view"
        hideMutatingActions={readOnly}
        table={openPreviewView}
        open={Boolean(openPreviewView)}
        onOpenChange={(open) => {
          if (!open) setPreviewViewId(null);
        }}
        onEditDetails={() => {
          if (!openPreviewView || readOnly) return;
          setPreviewViewId(null);
          setDetailsViewId(openPreviewView.id);
        }}
        onConfigureColumns={() => {
          if (!openPreviewView || readOnly) return;
          setPreviewViewId(null);
          setColumnsViewId(openPreviewView.id);
        }}
      />

      {!readOnly ? (
        <EditTableDetailsDialog
          entityKind="view"
          table={openDetailsView}
          open={Boolean(openDetailsView)}
          onOpenChange={(open) => {
            if (!open) setDetailsViewId(null);
          }}
          onSave={(viewId, patch) => patchView(viewId, patch)}
        />
      ) : null}

      {!readOnly ? (
        <ConfigureColumnsDialog
          entityKind="view"
          table={openColumnsView}
          open={Boolean(openColumnsView)}
          onOpenChange={(open) => {
            if (!open) setColumnsViewId(null);
          }}
          onSave={(viewId, columns) => patchView(viewId, { columns })}
          constellationId={constellationId}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmRemoveId)}
        onOpenChange={(next) => {
          if (!next && !removing) setConfirmRemoveId(null);
        }}
        tone="destructive"
        title={DESTRUCTIVE_CONFIRM.view.title}
        description={DESTRUCTIVE_CONFIRM.view.description}
        cancelLabel="Cancel"
        confirmLabel={DESTRUCTIVE_CONFIRM.view.confirmLabel}
        busy={removing}
        busyLabel={DESTRUCTIVE_CONFIRM.view.busyLabel}
        onConfirm={confirmRemove}
      />
    </>
  );
}
