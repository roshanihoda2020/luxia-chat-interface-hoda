import { useEffect, useMemo, useState } from "react";
import { AddCrawlerDialog } from "./AddCrawlerDialog";
import { CompactCrawlerList } from "./CompactCrawlerList";
import { CrawlerManager } from "./CrawlerManager";
import { EditCrawlerDialog } from "./EditCrawlerDialog";
import { RemoveCrawlerDialog } from "./RemoveCrawlerDialog";
import { ViewCrawlerDialog } from "./ViewCrawlerDialog";
import { INITIAL_CRAWLER_STATE } from "./data";
import type { CrawlerState } from "./types";
import { cloneCrawlerState, crawlerSignature } from "./utils";

export function CrawlerSection({
    isOpen,
    onToggle,
    onSignatureChange,
    readOnly = false,
}: {
    isOpen: boolean;
    onToggle: () => void;
    onSignatureChange?: (signature: string) => void;
    readOnly?: boolean;
}) {
    const [state, setState] = useState<CrawlerState>(() => cloneCrawlerState(INITIAL_CRAWLER_STATE));
    const [managerOpen, setManagerOpen] = useState(false);
    const [viewId, setViewId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    const visibleEntries = useMemo(() => state.entries.filter((e) => !e.markedForRemoval), [state.entries]);
    const viewItem = visibleEntries.find((e) => e.id === viewId) ?? null;
    const editItem = visibleEntries.find((e) => e.id === editId) ?? null;

    useEffect(() => {
        onSignatureChange?.(crawlerSignature(state));
    }, [state, onSignatureChange]);

    return (
        <>
            <CompactCrawlerList
                entries={visibleEntries}
                isOpen={isOpen}
                onToggle={onToggle}
                onOpenManager={readOnly ? () => undefined : () => setManagerOpen(true)}
                onView={(id) => setViewId(id)}
                onEdit={readOnly ? undefined : (id) => setEditId(id)}
                onRemove={readOnly ? undefined : (id) => setConfirmRemoveId(id)}
                readOnly={readOnly}
            />

            {!readOnly ? (
                <>
                    <CrawlerManager open={managerOpen} state={state} onCommit={setState} onCancel={() => setManagerOpen(false)} />
                    <AddCrawlerDialog open={addOpen} onOpenChange={setAddOpen} onAdd={(values) => setState((c) => ({ ...c, entries: [...c.entries, { id: `crawl-${Date.now()}`, ...values, url: values.url.trim(), description: values.description.trim() }] }))} />
                    {editItem ? <EditCrawlerDialog open={!!editId} onOpenChange={(o) => { if (!o) setEditId(null); }} initialValues={{ url: editItem.url, description: editItem.description, exactSearch: editItem.exactSearch }} onUpdate={(values) => { setState((c) => ({ ...c, entries: c.entries.map((e) => e.id === editId ? { ...e, url: values.url.trim(), description: values.description.trim(), exactSearch: values.exactSearch } : e) })); setEditId(null); }} /> : null}
                    <RemoveCrawlerDialog open={!!confirmRemoveId} onOpenChange={(o) => { if (!o) setConfirmRemoveId(null); }} onConfirm={() => { if (!confirmRemoveId) return; setState((c) => ({ ...c, entries: c.entries.filter((e) => e.id !== confirmRemoveId) })); setConfirmRemoveId(null); }} />
                </>
            ) : null}
            <ViewCrawlerDialog open={!!viewItem} onOpenChange={(o) => { if (!o) setViewId(null); }} item={viewItem} />
        </>
    );
}
