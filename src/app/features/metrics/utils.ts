import type { MetricRecord } from "./types";

export function cloneMetrics(items: MetricRecord[]): MetricRecord[] {
    return items.map((item) => ({ ...item }));
}

export function metricsSignature(items: MetricRecord[]): string {
    return JSON.stringify(items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        sqlExpression: item.sqlExpression,
        markedForRemoval: item.markedForRemoval ?? false,
    })));
}

export function activeMetricCount(items: MetricRecord[]): number {
    return items.filter((item) => !item.markedForRemoval).length;
}

export function isMetricValid(item: Pick<MetricRecord, "name" | "description" | "sqlExpression">): boolean {
    return Boolean(item.name.trim() && item.description.trim() && item.sqlExpression.trim());
}
