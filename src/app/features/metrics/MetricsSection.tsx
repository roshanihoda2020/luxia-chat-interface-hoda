import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
    DESTRUCTIVE_CONFIRM,
    DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { CompactMetricsList } from "./CompactMetricsList";
import { EditMetricDialog } from "./EditMetricDialog";
import { MetricsManager } from "./MetricsManager";
import { ViewMetricDialog } from "./ViewMetricDialog";
import type { MetricFormValues } from "./MetricForm";
import type { MetricRecord } from "./types";
import { cloneMetrics } from "./utils";

/**
 * Chat capsule Metrics — expandable summary + dialog shortcut.
 * Reads/writes the same Constellation `bundle.metrics` as Settings.
 */
export function MetricsSection({
    metrics,
    onCommitMetrics,
    isOpen,
    onToggle,
    readOnly = false,
}: {
    metrics: MetricRecord[];
    onCommitMetrics: (next: MetricRecord[]) => void;
    isOpen: boolean;
    onToggle: () => void;
    readOnly?: boolean;
}) {
    const [compactSearch, setCompactSearch] = useState("");
    const [managerOpen, setManagerOpen] = useState(false);
    const [viewId, setViewId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const removeTimerRef = useRef<number | null>(null);

    const visibleMetrics = useMemo(
        () => metrics.filter((item) => !item.markedForRemoval),
        [metrics],
    );
    const viewItem = visibleMetrics.find((item) => item.id === viewId) ?? null;
    const editItem = visibleMetrics.find((item) => item.id === editId) ?? null;

    useEffect(() => {
        return () => {
            if (removeTimerRef.current !== null) {
                window.clearTimeout(removeTimerRef.current);
            }
        };
    }, []);

    function commit(next: MetricRecord[]) {
        if (readOnly) return;
        onCommitMetrics(cloneMetrics(next));
    }

    function updateMetric(values: MetricFormValues) {
        if (readOnly || !editId) return;
        commit(
            metrics.map((item) =>
                item.id === editId
                    ? {
                        ...item,
                        name: values.name.trim(),
                        description: values.description.trim(),
                        sqlExpression: values.sqlExpression.trim(),
                    }
                    : item,
            ),
        );
        setEditId(null);
        luxiaToast.success("Metric updated");
    }

    function confirmRemove() {
        if (readOnly || !confirmRemoveId || removing) return;
        const removeId = confirmRemoveId;
        setRemoving(true);
        removeTimerRef.current = window.setTimeout(() => {
            removeTimerRef.current = null;
            try {
                commit(metrics.filter((item) => item.id !== removeId));
                if (viewId === removeId) setViewId(null);
                if (editId === removeId) setEditId(null);
                luxiaToast.success(DESTRUCTIVE_CONFIRM.metric.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.metric.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }

    return (
        <>
            <CompactMetricsList
                metrics={visibleMetrics}
                isOpen={isOpen}
                search={compactSearch}
                onSearchChange={setCompactSearch}
                onToggle={onToggle}
                onOpenManager={() => setManagerOpen(true)}
                onView={(id) => setViewId(id)}
                onEdit={readOnly ? undefined : (id) => setEditId(id)}
                onRemove={readOnly ? undefined : (id) => setConfirmRemoveId(id)}
                readOnly={readOnly}
            />

            <MetricsManager
                open={managerOpen}
                metrics={metrics}
                onCommit={(next) => {
                    if (readOnly) return;
                    onCommitMetrics(next);
                }}
                onCancel={() => setManagerOpen(false)}
            />

            <ViewMetricDialog
                open={Boolean(viewItem)}
                onOpenChange={(open) => {
                    if (!open) setViewId(null);
                }}
                item={viewItem}
            />

            {!readOnly && editItem ? (
                <EditMetricDialog
                    open={Boolean(editId)}
                    onOpenChange={(open) => {
                        if (!open) setEditId(null);
                    }}
                    initialValues={{
                        name: editItem.name,
                        description: editItem.description,
                        sqlExpression: editItem.sqlExpression,
                    }}
                    onUpdate={updateMetric}
                />
            ) : null}

            <ConfirmDialog
                open={Boolean(confirmRemoveId)}
                onOpenChange={(next) => {
                    if (!next && !removing) setConfirmRemoveId(null);
                }}
                tone="destructive"
                title={DESTRUCTIVE_CONFIRM.metric.title}
                description={DESTRUCTIVE_CONFIRM.metric.description}
                cancelLabel="Cancel"
                confirmLabel={DESTRUCTIVE_CONFIRM.metric.confirmLabel}
                busy={removing}
                busyLabel={DESTRUCTIVE_CONFIRM.metric.busyLabel}
                onConfirm={confirmRemove}
            />
        </>
    );
}
