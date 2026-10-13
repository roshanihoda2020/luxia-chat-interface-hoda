import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
    DESTRUCTIVE_CONFIRM,
    DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { CompactRelationshipList } from "./CompactRelationshipList";
import { EditRelationshipDialog } from "./AddRelationshipDialog";
import { RelationshipManager } from "./RelationshipManager";
import { ViewRelationshipDialog } from "./ViewRelationshipDialog";
import type { RelationshipFormValues } from "./RelationshipForm";
import type { RelationshipRecord } from "./types";
import { cloneRelationships } from "./utils";

/**
 * Chat capsule Relationship — expandable summary + dialog shortcut.
 * Reads/writes the same Constellation `bundle.relationships` as Settings.
 */
export function RelationshipSection({
    relationships,
    onCommitRelationships,
    isOpen,
    onToggle,
    readOnly = false,
}: {
    relationships: RelationshipRecord[];
    onCommitRelationships: (next: RelationshipRecord[]) => void;
    isOpen: boolean;
    onToggle: () => void;
    readOnly?: boolean;
}) {
    const [compactSearch, setCompactSearch] = useState("");
    const [managerOpen, setManagerOpen] = useState(false);
    const [viewId, setViewId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const removeTimerRef = useRef<number | null>(null);

    const visibleRelationships = useMemo(
        () => relationships.filter((item) => !item.markedForRemoval),
        [relationships],
    );
    const viewItem = visibleRelationships.find((item) => item.id === viewId) ?? null;
    const editItem = visibleRelationships.find((item) => item.id === editId) ?? null;

    useEffect(() => {
        return () => {
            if (removeTimerRef.current !== null) {
                window.clearTimeout(removeTimerRef.current);
            }
        };
    }, []);

    function commit(next: RelationshipRecord[]) {
        if (readOnly) return;
        onCommitRelationships(cloneRelationships(next));
    }

    function updateRelationship(values: RelationshipFormValues) {
        if (readOnly || !editId || !values.type) return;
        const nextType = values.type;
        commit(
            relationships.map((item) =>
                item.id === editId
                    ? {
                        ...item,
                        type: nextType,
                        fromTable: values.fromTable.trim(),
                        fromColumn: values.fromColumn.trim(),
                        toTable: values.toTable.trim(),
                        toColumn: values.toColumn.trim(),
                        active: values.active,
                    }
                    : item,
            ),
        );
        setEditId(null);
        luxiaToast.success("Relationship updated");
    }

    function confirmRemove() {
        if (readOnly || !confirmRemoveId || removing) return;
        const removeId = confirmRemoveId;
        setRemoving(true);
        removeTimerRef.current = window.setTimeout(() => {
            removeTimerRef.current = null;
            try {
                commit(relationships.filter((item) => item.id !== removeId));
                if (viewId === removeId) setViewId(null);
                if (editId === removeId) setEditId(null);
                luxiaToast.success(DESTRUCTIVE_CONFIRM.relationship.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.relationship.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }

    return (
        <>
            <CompactRelationshipList
                relationships={visibleRelationships}
                isOpen={isOpen}
                search={compactSearch}
                onSearchChange={setCompactSearch}
                onToggle={onToggle}
                onOpenManager={() => setManagerOpen(true)}
                onView={(id) => setViewId(id)}
                onEdit={readOnly ? undefined : (id) => setEditId(id)}
                onRemove={readOnly ? undefined : (id) => setConfirmRemoveId(id)}
                readOnly={readOnly}
            />

            <RelationshipManager
                open={managerOpen}
                relationships={relationships}
                onCommit={(next) => {
                    if (readOnly) return;
                    onCommitRelationships(next);
                }}
                onCancel={() => setManagerOpen(false)}
            />

            <ViewRelationshipDialog
                open={Boolean(viewItem)}
                onOpenChange={(open) => {
                    if (!open) setViewId(null);
                }}
                item={viewItem}
            />

            {!readOnly && editItem ? (
                <EditRelationshipDialog
                    open={Boolean(editId)}
                    onOpenChange={(open) => {
                        if (!open) setEditId(null);
                    }}
                    initialValues={{
                        type: editItem.type,
                        fromTable: editItem.fromTable,
                        fromColumn: editItem.fromColumn,
                        toTable: editItem.toTable,
                        toColumn: editItem.toColumn,
                        active: editItem.active,
                    }}
                    onUpdate={updateRelationship}
                />
            ) : null}

            <ConfirmDialog
                open={Boolean(confirmRemoveId)}
                onOpenChange={(next) => {
                    if (!next && !removing) setConfirmRemoveId(null);
                }}
                tone="destructive"
                title={DESTRUCTIVE_CONFIRM.relationship.title}
                description={DESTRUCTIVE_CONFIRM.relationship.description}
                cancelLabel="Cancel"
                confirmLabel={DESTRUCTIVE_CONFIRM.relationship.confirmLabel}
                busy={removing}
                busyLabel={DESTRUCTIVE_CONFIRM.relationship.busyLabel}
                onConfirm={confirmRemove}
            />
        </>
    );
}
