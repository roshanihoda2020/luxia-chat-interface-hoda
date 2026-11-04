import type { DataTableColumn, DataTableRecord } from "./types";

export function truncateValue(value: string, limit = 44) {
    if (value.length <= limit) return value;
    return `${value.slice(0, Math.max(0, limit - 1))}…`;
}

export function compactMeta(table: DataTableRecord) {
    const parts = [table.sourceDatabase, `${table.rowCount} rows`, `${table.columns.length} columns`].filter(Boolean);
    return parts.join(" • ");
}

export function cloneColumn(column: DataTableColumn): DataTableColumn {
    return { ...column };
}

export function cloneTable(table: DataTableRecord): DataTableRecord {
    return { ...table, columns: table.columns.map(cloneColumn), rows: table.rows.map((row) => ({ id: row.id, values: { ...row.values } })) };
}

export function cloneTables(tables: DataTableRecord[]): DataTableRecord[] {
    return tables.map(cloneTable);
}

export function tableSignature(tables: DataTableRecord[]) {
    return JSON.stringify(tables.map((table) => ({
        id: table.id,
        active: table.active,
        displayName: table.displayName,
        description: table.description,
        columns: table.columns.map((column) => ({ id: column.id, active: column.active, displayName: column.displayName, description: column.description, type: column.type, language: column.language, valueContext: column.valueContext })),
    })));
}
