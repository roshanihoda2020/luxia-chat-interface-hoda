import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
    DESTRUCTIVE_CONFIRM,
    DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { ActiveDataTablesManager } from "./ActiveDataTablesManager";
import { TABLE_CATALOG as FEATURE_TABLE_CATALOG } from "./data";
import { CompactDataTableList } from "./CompactDataTableList";
import { ConfigureColumnsDialog } from "./ConfigureColumnsDialog";
import { EditTableDetailsDialog } from "./EditTableDetailsDialog";
import { TablePreviewDrawer } from "./TablePreviewDrawer";
import type { DataTableRecord } from "./types";
import { cloneTables } from "./utils";

/**
 * Chat capsule Active Data Tables — expandable summary + dialog shortcut.
 * Reads/writes the same Constellation `bundle.tables` as Settings.
 */
export function ActiveDataTablesSection({
    tables,
    onCommitTables,
    isOpen,
    onToggle,
    readOnly = false,
    constellationId = "demo",
}: {
    tables: DataTableRecord[];
    onCommitTables: (next: DataTableRecord[]) => void;
    isOpen: boolean;
    onToggle: () => void;
    readOnly?: boolean;
    constellationId?: string;
}) {
    const [compactSearch, setCompactSearch] = useState("");
    const [managerOpen, setManagerOpen] = useState(false);
    const [previewTableId, setPreviewTableId] = useState<string | null>(null);
    const [detailsTableId, setDetailsTableId] = useState<string | null>(null);
    const [columnsTableId, setColumnsTableId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const removeTimerRef = useRef<number | null>(null);

    const activeTables = useMemo(() => tables.filter((table) => table.active), [tables]);
    const openPreviewTable = tables.find((table) => table.id === previewTableId) ?? null;
    const openDetailsTable = tables.find((table) => table.id === detailsTableId) ?? null;
    const openColumnsTable = tables.find((table) => table.id === columnsTableId) ?? null;

    function commit(next: DataTableRecord[]) {
        if (readOnly) return;
        onCommitTables(cloneTables(next));
    }

    function updateTable(tableId: string, patch: Partial<DataTableRecord>) {
        if (readOnly) return;
        commit(tables.map((table) => (table.id === tableId ? { ...table, ...patch } : table)));
    }

    useEffect(() => {
        return () => {
            if (removeTimerRef.current !== null) {
                window.clearTimeout(removeTimerRef.current);
            }
        };
    }, []);

    function confirmRemove() {
        if (readOnly || !confirmRemoveId || removing) return;
        const removeId = confirmRemoveId;
        setRemoving(true);
        removeTimerRef.current = window.setTimeout(() => {
            removeTimerRef.current = null;
            try {
                commit(tables.filter((table) => table.id !== removeId));
                if (previewTableId === removeId) setPreviewTableId(null);
                if (detailsTableId === removeId) setDetailsTableId(null);
                if (columnsTableId === removeId) setColumnsTableId(null);
                luxiaToast.success(DESTRUCTIVE_CONFIRM.table.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.table.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }

    return (
        <>
            <CompactDataTableList
                tables={activeTables}
                isOpen={isOpen}
                search={compactSearch}
                onSearchChange={setCompactSearch}
                onToggle={onToggle}
                onOpenManager={() => setManagerOpen(true)}
                onView={(id) => setPreviewTableId(id)}
                onEditDetails={readOnly ? undefined : (id) => setDetailsTableId(id)}
                onConfigureColumns={readOnly ? undefined : (id) => setColumnsTableId(id)}
                onRemove={readOnly ? undefined : (id) => setConfirmRemoveId(id)}
                readOnly={readOnly}
            />

            <ActiveDataTablesManager
                open={managerOpen}
                tables={tables}
                catalog={FEATURE_TABLE_CATALOG}
                readOnly={readOnly}
                onCommit={(nextTables) => {
                    if (readOnly) return;
                    onCommitTables(nextTables);
                }}
                onCancel={() => setManagerOpen(false)}
                onPreview={(id) => {
                    setManagerOpen(false);
                    requestAnimationFrame(() => setPreviewTableId(id));
                }}
                onEditDetails={(id) => {
                    if (readOnly) return;
                    setManagerOpen(false);
                    requestAnimationFrame(() => setDetailsTableId(id));
                }}
                onConfigureColumns={(id) => {
                    if (readOnly) return;
                    setManagerOpen(false);
                    requestAnimationFrame(() => setColumnsTableId(id));
                }}
            />

            <TablePreviewDrawer
                table={openPreviewTable}
                open={!!openPreviewTable}
                onOpenChange={(open) => { if (!open) setPreviewTableId(null); }}
                hideMutatingActions={readOnly}
                onEditDetails={() => {
                    if (!openPreviewTable || readOnly) return;
                    setPreviewTableId(null);
                    setDetailsTableId(openPreviewTable.id);
                }}
                onConfigureColumns={() => {
                    if (!openPreviewTable || readOnly) return;
                    setPreviewTableId(null);
                    setColumnsTableId(openPreviewTable.id);
                }}
            />

            {!readOnly ? (
                <EditTableDetailsDialog
                    table={openDetailsTable}
                    open={!!openDetailsTable}
                    onOpenChange={(open) => { if (!open) setDetailsTableId(null); }}
                    onSave={(tableId, patch) => updateTable(tableId, patch)}
                />
            ) : null}

            {!readOnly ? (
                <ConfigureColumnsDialog
                    table={openColumnsTable}
                    open={!!openColumnsTable}
                    onOpenChange={(open) => { if (!open) setColumnsTableId(null); }}
                    onSave={(tableId, columns) => updateTable(tableId, { columns })}
                    constellationId={constellationId}
                />
            ) : null}

            <ConfirmDialog
                open={Boolean(confirmRemoveId)}
                onOpenChange={(next) => {
                    if (!next && !removing) setConfirmRemoveId(null);
                }}
                tone="destructive"
                title={DESTRUCTIVE_CONFIRM.table.title}
                description={DESTRUCTIVE_CONFIRM.table.description}
                cancelLabel="Cancel"
                confirmLabel={DESTRUCTIVE_CONFIRM.table.confirmLabel}
                busy={removing}
                busyLabel={DESTRUCTIVE_CONFIRM.table.busyLabel}
                onConfirm={confirmRemove}
            />
        </>
    );
}
