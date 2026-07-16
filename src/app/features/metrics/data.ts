import type { MetricRecord } from "./types";

export const INITIAL_METRICS: MetricRecord[] = [
    {
        id: "metric1",
        name: "Total Revenue",
        description: "Sum of order totals across all completed orders.",
        sqlExpression: "SUM(orders.total)\nWHERE orders.status = 'completed'",
    },
    {
        id: "metric2",
        name: "Active Customers",
        description: "Count of customers with at least one order in the last 30 days.",
        sqlExpression: "COUNT(DISTINCT customers.customer_id)\nFROM orders\nWHERE order_date >= CURRENT_DATE - 30",
    },
];
