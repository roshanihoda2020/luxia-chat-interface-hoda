import { BarChart3, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AddMetricDialog } from "./AddMetricDialog";
import { DiscardMetricChangesDialog } from "./DiscardMetricChangesDialog";
import { EditMetricDialog } from "./EditMetricDialog";
import { MetricRow } from "./MetricRow";
import { RemoveMetricDialog } from "./RemoveMetricDialog";
import { ViewMetricDialog } from "./ViewMetricDialog";
import type { MetricFormValues } from "./MetricForm";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { LX } from "./tokens";
import type { MetricRecord } from "./types";
import { activeMetricCount, cloneMetrics, metricsSignature } from "./utils";

export function MetricsManager({
    open,
    metrics,
    onCommit,
    onCancel,
}: {
    open: boolean;
    metrics: MetricRecord[];
    onCommit: (next: MetricRecord[]) => void;
    onCancel: () => void;
}) {
    const [draft, setDraft] = useState<MetricRecord[]>(() => cloneMetrics(metrics));
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [viewId, setViewId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef(cloneMetrics(metrics));

    useEffect(() => {
        if (!open) return;
        const snapshot = cloneMetrics(metrics);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setSearch("");
        setAddOpen(false);
        setViewId(null);
        setEditId(null);
        setConfirmRemoveId(null);
        setDiscardOpen(false);
        setSaving(false);
        setSaveError(null);
    }, [open, metrics]);

    const dirty = metricsSignature(draft) !== metricsSignature(initialRef.current);
    const visibleDraft = useMemo(() => draft.filter((item) => !item.markedForRemoval), [draft]);

    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return visibleDraft;
        return visibleDraft.filter((item) => [item.name, item.description].join(" ").toLowerCase().includes(lowered));
    }, [visibleDraft, search]);

    const viewItem = visibleDraft.find((item) => item.id === viewId) ?? null;
    const editItem = visibleDraft.find((item) => item.id === editId) ?? null;
    const count = activeMetricCount(draft);

    function requestClose() {
        if (dirty) {
            setDiscardOpen(true);
            return;
        }
        onCancel();
    }

    function markRemove(id: string) {
        setDraft((current) => current.map((item) => item.id === id ? { ...item, markedForRemoval: true } : item));
        setConfirmRemoveId(null);
    }

    function addMetric(values: MetricFormValues) {
        setDraft((current) => [...current, {
            id: `metric-${Date.now()}`,
            name: values.name.trim(),
            description: values.description.trim(),
            sqlExpression: values.sqlExpression.trim(),
        }]);
    }

    function updateMetric(values: MetricFormValues) {
        if (!editId) return;
        setDraft((current) => current.map((item) => item.id === editId ? {
            ...item,
            name: values.name.trim(),
            description: values.description.trim(),
            sqlExpression: values.sqlExpression.trim(),
        } : item));
        setEditId(null);
    }

    function save() {
        if (!dirty || saving) return;
        setSaving(true);
        setSaveError(null);
        window.setTimeout(() => {
            const committed = draft
                .filter((item) => !item.markedForRemoval)
                .map((item) => ({ ...item, markedForRemoval: false }));
            onCommit(committed);
            setSaving(false);
            onCancel();
        }, 500);
    }

    if (!open) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
                <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 760px)", maxWidth: "min(92vw, 760px)", maxHeight: "88vh" }}>
                    <div className="flex max-h-[88vh] flex-col">
                        <DialogHeader className="flex-shrink-0 border-b px-6 py-5 text-left" style={{ borderColor: LX.border }}>
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]" style={{ background: LX.blueT10 }}>
                                    <BarChart3 size={18} color={LX.secondary} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal" style={{ color: LX.primary }}>Metrics</DialogTitle>
                                    <DialogDescription className="mt-1 luxia-type-metadata" style={{ color: LX.textMuted }}>Changes are local until saved.</DialogDescription>
                                </div>
                                <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" aria-label="Close metrics manager" onClick={requestClose}>
                                    <X size={15} style={{ color: LX.textMuted }} />
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="flex-shrink-0 border-b px-6 py-3" style={{ borderColor: LX.border }}>
                            <div className="flex items-center gap-2 rounded-[14px] border px-3 py-2" style={{ borderColor: LX.border, background: LX.subtle }}>
                                <Search size={14} style={{ color: LX.textMuted }} />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search metrics…"
                                    className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0"
                                    aria-label="Search metrics"
                                />
                                {search ? (
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full" aria-label="Clear search" onClick={() => setSearch("")}>
                                        <X size={12} style={{ color: LX.textMuted }} />
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    {search ? (
                                        <>
                                            <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>No metrics match your search.</p>
                                            <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Try another metric name.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="luxia-type-title-component" style={{ color: LX.primary }}>No metrics yet</p>
                                            <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Add a metric to define a reusable calculation.</p>
                                            <Button type="button" className="mt-4 rounded-full px-4" onClick={() => setAddOpen(true)}>
                                                <Plus size={14} />Add metric
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filtered.map((item) => (
                                        <MetricRow
                                            key={item.id}
                                            item={item}
                                            onView={() => setViewId(item.id)}
                                            onEdit={() => setEditId(item.id)}
                                            onRemove={() => setConfirmRemoveId(item.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            {filtered.length > 0 ? (
                                <Button type="button" variant="outline" className="mb-4 w-full rounded-full" onClick={() => setAddOpen(true)}>
                                    <Plus size={14} />Add item
                                </Button>
                            ) : null}
                            {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
                                    {count} {count === 1 ? "item" : "items"}{dirty ? " · Unsaved changes" : ""}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="secondary" className="rounded-full px-4" onClick={requestClose}>Cancel</Button>
                                    <Button type="button" className="min-w-[132px] rounded-full px-4" disabled={!dirty || saving} onClick={save}>
                                        {saving ? "Saving…" : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AddMetricDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addMetric} />

            {editItem ? (
                <EditMetricDialog
                    open={!!editId}
                    onOpenChange={(next) => { if (!next) setEditId(null); }}
                    initialValues={{
                        name: editItem.name,
                        description: editItem.description,
                        sqlExpression: editItem.sqlExpression,
                    }}
                    onUpdate={updateMetric}
                />
            ) : null}

            <ViewMetricDialog open={!!viewItem} onOpenChange={(next) => { if (!next) setViewId(null); }} item={viewItem} />

            <RemoveMetricDialog
                open={!!confirmRemoveId}
                onOpenChange={(next) => { if (!next) setConfirmRemoveId(null); }}
                onConfirm={() => confirmRemoveId && markRemove(confirmRemoveId)}
            />

            <DiscardMetricChangesDialog
                open={discardOpen}
                onOpenChange={setDiscardOpen}
                onDiscard={() => { setDiscardOpen(false); onCancel(); }}
            />
        </>
    );
}
