import type { DataTableCatalogItem, DataTableColumnType, DataTableRecord } from "./types";
import { cloneTable } from "./utils";

export const COLUMN_LANGUAGES = ["EN", "AR", "FR", "DE", "ES", "ZH"];

const columns = (items: Array<[string, string, DataTableColumnType, string, string, boolean, boolean]>) => items.map(([id, displayName, type, description, language, active, valueContext]) => ({
    id,
    displayName,
    originalName: id.toUpperCase(),
    type,
    description,
    language,
    active,
    valueContext,
}));

const rows = (prefix: string, count: number, fields: Record<string, string>[]) => fields.slice(0, count).map((values, index) => ({ id: `${prefix}-${index + 1}`, values }));

export const TABLE_CATALOG: DataTableCatalogItem[] = [
    {
        id: "dt-customer-activity",
        displayName: "Global Customer Activity and Retention Ledger",
        originalName: "DW_GLOBAL_CUSTOMER_ACTIVITY",
        sourceDatabase: "Snowflake / Marketing",
        description: "A long running customer behaviour feed that combines lifecycle events, retention signals, and campaign attribution across multiple business units.",
        active: true,
        rowCount: 1248,
        columns: columns([
            ["customer_tier", "Customer tier", "Enum", "Commercial segment assigned to the account.", "EN", true, true],
            ["campaign", "Campaign", "Text", "Primary campaign source.", "EN", true, false],
            ["lifetime_value", "Lifetime value", "Currency", "Rolling 12 month value.", "EN", true, true],
            ["country", "Country", "Text", "Country of record.", "EN", true, false],
            ["last_purchase", "Last purchase", "Date", "Most recent purchase date.", "EN", true, true],
            ["is_retained", "Retained", "Boolean", "Whether the account renewed.", "EN", true, false],
        ]),
        rows: rows("dt-customer-activity", 6, [
            { customer_tier: "Enterprise", campaign: "Winter Launch", lifetime_value: "$28,120", country: "United States", last_purchase: "2026-06-28", is_retained: "Yes" },
            { customer_tier: "Mid Market", campaign: "Partner Referral", lifetime_value: "$14,580", country: "Germany", last_purchase: "2026-06-24", is_retained: "Yes" },
            { customer_tier: "Enterprise", campaign: "Upsell Motion", lifetime_value: "$41,003", country: "France", last_purchase: "2026-05-18", is_retained: "Yes" },
            { customer_tier: "SMB", campaign: "Inbound", lifetime_value: "$3,220", country: "Spain", last_purchase: "2026-04-03", is_retained: "No" },
            { customer_tier: "Mid Market", campaign: "Webinar", lifetime_value: "$8,840", country: "Canada", last_purchase: "2026-06-10", is_retained: "Yes" },
            { customer_tier: "SMB", campaign: "Organic", lifetime_value: "$1,400", country: "United Kingdom", last_purchase: "2026-06-19", is_retained: "No" },
        ]),
    },
    {
        id: "dt-fleet-utilization",
        displayName: "Fleet Vehicle Utilization Snapshot",
        originalName: "FLEET_VEHICLE_UTILIZATION",
        sourceDatabase: "Postgres / Operations",
        description: "Daily operational snapshot for vehicle use and maintenance scheduling.",
        active: true,
        rowCount: 84,
        columns: columns([
            ["vehicle_id", "Vehicle ID", "Text", "Unique vehicle identifier.", "EN", true, true],
            ["region", "Region", "Text", "Operating region.", "EN", true, false],
            ["miles", "Miles", "Number", "Mileage in the current cycle.", "EN", true, true],
            ["available", "Available", "Boolean", "Available for deployment.", "EN", true, false],
        ]),
        rows: rows("dt-fleet-utilization", 6, [
            { vehicle_id: "VH-1001", region: "North East", miles: "10422", available: "Yes" },
            { vehicle_id: "VH-1002", region: "North East", miles: "9823", available: "No" },
            { vehicle_id: "VH-1031", region: "West", miles: "11484", available: "Yes" },
            { vehicle_id: "VH-1098", region: "South", miles: "6341", available: "Yes" },
            { vehicle_id: "VH-1104", region: "West", miles: "8842", available: "No" },
            { vehicle_id: "VH-1110", region: "Central", miles: "7221", available: "Yes" },
        ]),
    },
    {
        id: "dt-supplier-exceptions",
        displayName: "Supplier Compliance Exceptions Archive",
        originalName: "SUPPLIER_COMPLIANCE_EXCEPTIONS_ARCHIVE",
        sourceDatabase: "BigQuery / Governance",
        description: "Exception archive for supplier compliance review.",
        active: true,
        rowCount: 420,
        columns: columns([
            ["supplier", "Supplier", "Text", "Supplier name.", "EN", true, true],
            ["severity", "Severity", "Enum", "Issue severity.", "EN", true, false],
            ["open_cases", "Open cases", "Number", "Open exceptions.", "EN", true, true],
        ]),
        rows: rows("dt-supplier-exceptions", 5, [
            { supplier: "Atlas Manufacturing", severity: "High", open_cases: "4" },
            { supplier: "Northwind Supplies", severity: "Medium", open_cases: "2" },
            { supplier: "Redwood Logistics", severity: "Low", open_cases: "1" },
            { supplier: "Kite Health", severity: "High", open_cases: "5" },
            { supplier: "Orion Parts", severity: "Medium", open_cases: "3" },
        ]),
    },
    {
        id: "dt-regional-inventory",
        displayName: "Regional Inventory Reconciliation",
        originalName: "REGIONAL_INVENTORY_RECONCILIATION",
        sourceDatabase: "SQL Server / Supply Chain",
        description: "",
        active: false,
        rowCount: 0,
        columns: columns([
            ["region", "Region", "Text", "Operating region.", "EN", true, true],
            ["inventory", "Inventory", "Number", "Inventory count.", "EN", true, false],
        ]),
        rows: [],
    },
    {
        id: "dt-customer-support",
        displayName: "Customer Support Conversation Fact Table",
        originalName: "CUSTOMER_SUPPORT_CONVERSATION_FACT",
        sourceDatabase: "Databricks / Support",
        description: "Conversation fact table for support interaction analytics.",
        active: true,
        rowCount: 6420,
        columns: columns([
            ["ticket_id", "Ticket ID", "Text", "Support ticket identifier.", "EN", true, true],
            ["sentiment", "Sentiment", "Enum", "Conversation sentiment.", "EN", true, false],
            ["resolved", "Resolved", "Boolean", "Resolved in first contact.", "EN", true, true],
        ]),
        rows: rows("dt-customer-support", 6, [
            { ticket_id: "T-10021", sentiment: "Positive", resolved: "Yes" },
            { ticket_id: "T-10022", sentiment: "Neutral", resolved: "No" },
            { ticket_id: "T-10023", sentiment: "Negative", resolved: "Yes" },
            { ticket_id: "T-10024", sentiment: "Positive", resolved: "Yes" },
            { ticket_id: "T-10025", sentiment: "Neutral", resolved: "No" },
            { ticket_id: "T-10026", sentiment: "Positive", resolved: "Yes" },
        ]),
    },
    {
        id: "dt-campaign-funnel",
        displayName: "Campaign Performance Funnel Extract",
        originalName: "CAMPAIGN_PERFORMANCE_FUNNEL_EXTRACT",
        sourceDatabase: "Snowflake / Growth",
        description: "Campaign funnel extract with basic stage and conversion metrics.",
        active: false,
        rowCount: 128,
        columns: columns([
            ["campaign", "Campaign", "Text", "Campaign name.", "EN", true, true],
            ["stage", "Stage", "Text", "Funnel stage.", "EN", true, false],
            ["conversion", "Conversion", "Boolean", "Converted or not.", "EN", true, true],
        ]),
        rows: rows("dt-campaign-funnel", 4, [
            { campaign: "Spring Push", stage: "Awareness", conversion: "No" },
            { campaign: "Partner Webinar", stage: "Consideration", conversion: "Yes" },
            { campaign: "Email Nurture", stage: "Decision", conversion: "No" },
            { campaign: "Retargeting", stage: "Decision", conversion: "Yes" },
        ]),
    },
];

export const INITIAL_ACTIVE_TABLES: DataTableRecord[] = TABLE_CATALOG.filter((table) => table.active).map((table) => cloneTable(table));
