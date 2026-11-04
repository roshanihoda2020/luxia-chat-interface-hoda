export type DataTableColumnType = "Text" | "Number" | "Date" | "Boolean" | "Currency" | "Enum";

export interface DataTableColumn {
    id: string;
    displayName: string;
    originalName: string;
    type: DataTableColumnType;
    description: string;
    language: string;
    active: boolean;
    valueContext: boolean;
}

export interface DataTableRow {
    id: string;
    values: Record<string, string>;
}

export interface DataTableRecord {
    id: string;
    displayName: string;
    originalName: string;
    sourceDatabase: string;
    description: string;
    active: boolean;
    rowCount: number;
    columns: DataTableColumn[];
    rows: DataTableRow[];
}

export interface DataTableCatalogItem extends DataTableRecord {
}
