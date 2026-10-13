import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
  DESTRUCTIVE_CONFIRM,
  DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { CompactKnowledgeBaseList } from "./CompactKnowledgeBaseList";
import type { KnowledgeBaseEntry } from "./data";
import {
  KnowledgeBaseManager,
  KnowledgeEntryDialog,
} from "./KnowledgeBaseManager";

/**
 * Chat capsule Knowledge Base — expandable summary + in-Chat manager dialog.
 * Reads/writes the same Constellation `bundle.knowledgeBase` as Settings.
 */
export function KnowledgeBaseSection({
  entries,
  onCommitEntries,
  isOpen,
  onToggle,
  readOnly = false,
  managerOpen,
  onManagerOpenChange,
  closeRef,
  dirtyRef,
  onLeaveAborted,
  onCancelManager,
}: {
  entries: KnowledgeBaseEntry[];
  onCommitEntries: (next: KnowledgeBaseEntry[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  readOnly?: boolean;
  managerOpen: boolean;
  onManagerOpenChange: (open: boolean) => void;
  closeRef?: MutableRefObject<(() => void) | null>;
  dirtyRef?: MutableRefObject<boolean>;
  onLeaveAborted?: () => void;
  onCancelManager: () => void;
}) {
  const [compactSearch, setCompactSearch] = useState("");
  const [viewEntryId, setViewEntryId] = useState<string | null>(null);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const removeTimerRef = useRef<number | null>(null);

  const viewEntry = useMemo(
    () => entries.find((entry) => entry.id === viewEntryId) ?? null,
    [entries, viewEntryId],
  );
  const editEntry = useMemo(
    () => entries.find((entry) => entry.id === editEntryId) ?? null,
    [entries, editEntryId],
  );

  useEffect(() => {
    return () => {
      if (removeTimerRef.current !== null) {
        window.clearTimeout(removeTimerRef.current);
      }
    };
  }, []);

  function commit(next: KnowledgeBaseEntry[]) {
    if (readOnly) return;
    onCommitEntries(next.map((entry) => ({ ...entry })));
  }

  function handleAdd(entry: KnowledgeBaseEntry) {
    if (readOnly) return;
    // KnowledgeEntryDialog already emits success toast.
    commit([...entries, entry]);
    setAddOpen(false);
  }

  function handleEdit(entry: KnowledgeBaseEntry) {
    if (readOnly || !editEntryId) return;
    // KnowledgeEntryDialog already emits success toast.
    commit(entries.map((item) => (item.id === editEntryId ? { ...entry, id: editEntryId } : item)));
    setEditEntryId(null);
  }

  function confirmRemove() {
    if (readOnly || !confirmRemoveId || removing) return;
    const removeId = confirmRemoveId;
    setRemoving(true);
    removeTimerRef.current = window.setTimeout(() => {
      removeTimerRef.current = null;
      try {
        commit(entries.filter((entry) => entry.id !== removeId));
        if (viewEntryId === removeId) setViewEntryId(null);
        if (editEntryId === removeId) setEditEntryId(null);
        luxiaToast.success(DESTRUCTIVE_CONFIRM.knowledgeEntry.successToast);
        setConfirmRemoveId(null);
      } catch {
        luxiaToast.error(DESTRUCTIVE_CONFIRM.knowledgeEntry.errorToast);
      } finally {
        setRemoving(false);
      }
    }, DESTRUCTIVE_REMOVE_DELAY_MS);
  }

  return (
    <>
      <CompactKnowledgeBaseList
        entries={entries}
        isOpen={isOpen}
        search={compactSearch}
        onSearchChange={setCompactSearch}
        onToggle={onToggle}
        onOpenManager={() => onManagerOpenChange(true)}
        onView={(id) => setViewEntryId(id)}
        onEdit={readOnly ? undefined : (id) => setEditEntryId(id)}
        onRemove={readOnly ? undefined : (id) => setConfirmRemoveId(id)}
        onAdd={readOnly ? undefined : () => setAddOpen(true)}
        readOnly={readOnly}
      />

      <KnowledgeBaseManager
        open={managerOpen}
        presentation="dialog"
        entries={entries}
        readOnly={readOnly}
        closeRef={closeRef}
        dirtyRef={dirtyRef}
        onCommit={onCommitEntries}
        onCancel={onCancelManager}
        onLeaveAborted={onLeaveAborted}
      />

      {viewEntry ? (
        <KnowledgeEntryDialog
          mode="view"
          entry={viewEntry}
          open
          onOpenChange={(next) => {
            if (!next) setViewEntryId(null);
          }}
          onSubmit={() => {}}
        />
      ) : null}

      {!readOnly ? (
        <KnowledgeEntryDialog
          mode="add"
          open={addOpen}
          onOpenChange={setAddOpen}
          onSubmit={handleAdd}
        />
      ) : null}

      {!readOnly && editEntry ? (
        <KnowledgeEntryDialog
          mode="edit"
          entry={editEntry}
          open
          onOpenChange={(next) => {
            if (!next) setEditEntryId(null);
          }}
          onSubmit={handleEdit}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmRemoveId)}
        onOpenChange={(next) => {
          if (!next && !removing) setConfirmRemoveId(null);
        }}
        tone="destructive"
        title={DESTRUCTIVE_CONFIRM.knowledgeEntry.title}
        description={DESTRUCTIVE_CONFIRM.knowledgeEntry.description}
        cancelLabel="Cancel"
        confirmLabel={DESTRUCTIVE_CONFIRM.knowledgeEntry.confirmLabel}
        busy={removing}
        busyLabel={DESTRUCTIVE_CONFIRM.knowledgeEntry.busyLabel}
        onConfirm={confirmRemove}
      />
    </>
  );
}
