import { useEffect, useMemo, useState } from "react";
import { ActiveDataTablesManager } from "./ActiveDataTablesManager";
import { TABLE_CATALOG as FEATURE_TABLE_CATALOG, INITIAL_ACTIVE_TABLES as FEATURE_INITIAL_ACTIVE_TABLES } from "./data";
import { CompactDataTableList } from "./CompactDataTableList";
import { ConfigureColumnsDialog } from "./ConfigureColumnsDialog";
import { EditTableDetailsDialog } from "./EditTableDetailsDialog";
import { TablePreviewDrawer } from "./TablePreviewDrawer";
import { tableSignature } from "./utils";

export function ActiveDataTablesSection({ isOpen, onToggle, onSignatureChange }: { isOpen: boolean; onToggle: () => void; onSignatureChange?: (signature: string) => void }) {
    const [tables, setTables] = useState(() => FEATURE_INITIAL_ACTIVE_TABLES);
    const [compactSearch, setCompactSearch] = useState("");
    const [managerOpen, setManagerOpen] = useState(false);
    const [previewTableId, setPreviewTableId] = useState<string | null>(null);
    const [detailsTableId, setDetailsTableId] = useState<string | null>(null);
    const [columnsTableId, setColumnsTableId] = useState<string | null>(null);

    const activeTables = useMemo(() => tables.filter((table) => table.active), [tables]);
    const openPreviewTable = tables.find((table) => table.id === previewTableId) ?? null;
    const openDetailsTable = tables.find((table) => table.id === detailsTableId) ?? null;
    const openColumnsTable = tables.find((table) => table.id === columnsTableId) ?? null;

    function updateTable(tableId: string, patch: Partial<import("./types").DataTableRecord>) {
        setTables((current) => current.map((table) => table.id === tableId ? { ...table, ...patch } : table));
    }

    useEffect(() => {
        onSignatureChange?.(tableSignature(tables));
    }, [tables, onSignatureChange]);

    function removeCommittedTable(tableId: string) {
        setTables((current) => current.filter((table) => table.id !== tableId));
        if (previewTableId === tableId) setPreviewTableId(null);
        if (detailsTableId === tableId) setDetailsTableId(null);
        if (columnsTableId === tableId) setColumnsTableId(null);
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
                onEditDetails={(id) => setDetailsTableId(id)}
                onConfigureColumns={(id) => setColumnsTableId(id)}
                onRemove={removeCommittedTable}
            />

            <ActiveDataTablesManager
                open={managerOpen}
                tables={tables}
                catalog={FEATURE_TABLE_CATALOG}
                onCommit={(nextTables) => setTables(nextTables)}
                onCancel={() => setManagerOpen(false)}
                onPreview={(id) => {
                    setManagerOpen(false);
                    requestAnimationFrame(() => setPreviewTableId(id));
                }}
                onEditDetails={(id) => {
                    setManagerOpen(false);
                    requestAnimationFrame(() => setDetailsTableId(id));
                }}
                onConfigureColumns={(id) => {
                    setManagerOpen(false);
                    requestAnimationFrame(() => setColumnsTableId(id));
                }}
            />

            <TablePreviewDrawer
                table={openPreviewTable}
                open={!!openPreviewTable}
                onOpenChange={(open) => { if (!open) setPreviewTableId(null); }}
                onEditDetails={() => {
                    if (!openPreviewTable) return;
                    setPreviewTableId(null);
                    setDetailsTableId(openPreviewTable.id);
                }}
                onConfigureColumns={() => {
                    if (!openPreviewTable) return;
                    setPreviewTableId(null);
                    setColumnsTableId(openPreviewTable.id);
                }}
            />

            <EditTableDetailsDialog
                table={openDetailsTable}
                open={!!openDetailsTable}
                onOpenChange={(open) => { if (!open) setDetailsTableId(null); }}
                onSave={(tableId, patch) => updateTable(tableId, patch)}
            />

            <ConfigureColumnsDialog
                table={openColumnsTable}
                open={!!openColumnsTable}
                onOpenChange={(open) => { if (!open) setColumnsTableId(null); }}
                onSave={(tableId, columns) => updateTable(tableId, { columns })}
            />
        </>
    );
}
