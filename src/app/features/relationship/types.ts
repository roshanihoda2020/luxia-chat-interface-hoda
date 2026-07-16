export type RelationshipType = "1-1" | "1-many" | "many-1" | "many-many";

export interface RelationshipRecord {
    id: string;
    type: RelationshipType;
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    active: boolean;
    markedForRemoval?: boolean;
}
