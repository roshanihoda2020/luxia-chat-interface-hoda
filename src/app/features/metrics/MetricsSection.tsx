import { useEffect, useMemo, useState } from "react";
import { CompactMetricsList } from "./CompactMetricsList";
import { INITIAL_METRICS } from "./data";
import { MetricsManager } from "./MetricsManager";
import type { MetricRecord } from "./types";
import { cloneMetrics, metricsSignature } from "./utils";

export function MetricsSection({ isOpen, onToggle, onSignatureChange }: { isOpen: boolean; onToggle: () => void; onSignatureChange?: (signature: string) => void }) {
    const [metrics, setMetrics] = useState<MetricRecord[]>(() => cloneMetrics(INITIAL_METRICS));
    const [compactSearch, setCompactSearch] = useState("");
    const [managerOpen, setManagerOpen] = useState(false);

    const visibleMetrics = useMemo(() => metrics.filter((item) => !item.markedForRemoval), [metrics]);

    useEffect(() => {
        onSignatureChange?.(metricsSignature(metrics));
    }, [metrics, onSignatureChange]);

    return (
        <>
            <CompactMetricsList
                metrics={visibleMetrics}
                isOpen={isOpen}
                search={compactSearch}
                onSearchChange={setCompactSearch}
                onToggle={onToggle}
                onOpenManager={() => setManagerOpen(true)}
            />

            <MetricsManager
                open={managerOpen}
                metrics={metrics}
                onCommit={(next) => setMetrics(next)}
                onCancel={() => setManagerOpen(false)}
            />
        </>
    );
}
