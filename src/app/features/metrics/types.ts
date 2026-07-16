export interface MetricRecord {
    id: string;
    name: string;
    description: string;
    sqlExpression: string;
    markedForRemoval?: boolean;
}
