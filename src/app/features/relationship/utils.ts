import { TABLE_COLUMNS } from "./data";
import type { RelationshipRecord } from "./types";

export function cloneRelationships(items: RelationshipRecord[]): RelationshipRecord[] {
    return items.map((item) => ({ ...item }));
}

export function relationshipsSignature(items: RelationshipRecord[]): string {
    return JSON.stringify(items.map((item) => ({
        id: item.id,
        type: item.type,
        fromTable: item.fromTable,
        fromColumn: item.fromColumn,
        toTable: item.toTable,
        toColumn: item.toColumn,
        active: item.active,
        markedForRemoval: item.markedForRemoval ?? false,
    })));
}

export function relationshipSummary(item: RelationshipRecord): string {
    return `${item.fromColumn} → ${item.toColumn}`;
}

export function relationshipName(item: RelationshipRecord): string {
    return `${item.fromTable} → ${item.toTable}`;
}

export function activeRelationshipCount(items: RelationshipRecord[]): number {
    return items.filter((item) => !item.markedForRemoval).length;
}

export function isRelationshipValid(item: {
  type: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}): boolean {
    return Boolean(item.type && item.fromTable && item.fromColumn && item.toTable && item.toColumn);
}

export function loadTableColumns(table: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        window.setTimeout(() => {
            const columns = TABLE_COLUMNS[table];
            if (!columns) reject(new Error("Could not load columns"));
            else resolve(columns);
        }, 450);
    });
}
