import type { RelationshipRecord, RelationshipType } from "./types";

export const RELATIONSHIP_TYPES: RelationshipType[] = ["1-1", "1-many", "many-1", "many-many"];

export const TABLE_OPTIONS = ["DELIVERIES", "DEPOTS", "CUSTOMERS", "ORDERS", "PRODUCTS"] as const;

export const TABLE_COLUMNS: Record<string, string[]> = {
    DELIVERIES: ["DEPOT_ID", "ORDER_ID", "DELIVERY_DATE", "STATUS"],
    DEPOTS: ["DEPOT_ID", "NAME", "REGION"],
    CUSTOMERS: ["CUSTOMER_ID", "NAME", "EMAIL", "COUNTRY"],
    ORDERS: ["ORDER_ID", "CUSTOMER_ID", "ORDER_DATE", "TOTAL"],
    PRODUCTS: ["PRODUCT_ID", "NAME", "CATEGORY", "PRICE"],
};

export const INITIAL_RELATIONSHIPS: RelationshipRecord[] = [
    {
        id: "rel1",
        type: "many-1",
        fromTable: "DELIVERIES",
        fromColumn: "DEPOT_ID",
        toTable: "DEPOTS",
        toColumn: "DEPOT_ID",
        active: true,
    },
];
