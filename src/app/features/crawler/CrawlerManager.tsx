import { Globe, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AddCrawlerDialog } from "./AddCrawlerDialog";
import { CrawlerRow } from "./CrawlerRow";
import { DiscardCrawlerChangesDialog } from "./DiscardCrawlerChangesDialog";
import { EditCrawlerDialog } from "./EditCrawlerDialog";
import { RemoveCrawlerDialog } from "./RemoveCrawlerDialog";
import { ViewCrawlerDialog } from "./ViewCrawlerDialog";
import type { CrawlerFormValues } from "./CrawlerForm";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
import { LX } from "./tokens";
import type { CrawlerState } from "./types";
import { activeCrawlerCount, cloneCrawlerState, crawlerSignature } from "./utils";

export function CrawlerManager({ open, state, onCommit, onCancel }: {
    open: boolean; state: CrawlerState; onCommit: (next: CrawlerState) => void; onCancel: () => void;
}) {
    const [draft, setDraft] = useState<CrawlerState>(() => cloneCrawlerState(state));
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [viewId, setViewId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef(cloneCrawlerState(state));

    useEffect(() => {
        if (!open) return;
        const snapshot = cloneCrawlerState(state);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setSearch(""); setAddOpen(false); setViewId(null); setEditId(null); setConfirmRemoveId(null); setDiscardOpen(false); setSaving(false); setSaveError(null);
    }, [open, state]);

    const dirty = crawlerSignature(draft) !== crawlerSignature(initialRef.current);
    const visible = useMemo(() => draft.entries.filter((e) => !e.markedForRemoval), [draft.entries]);
    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return visible;
        return visible.filter((e) => [e.url, e.description].join(" ").toLowerCase().includes(lowered));
    }, [visible, search]);

    const viewItem = visible.find((e) => e.id === viewId) ?? null;
    const editItem = visible.find((e) => e.id === editId) ?? null;
    const count = activeCrawlerCount(draft.entries);

    function requestClose() { if (dirty) { setDiscardOpen(true); return; } onCancel(); }
    function markRemove(id: string) { setDraft((c) => ({ ...c, entries: c.entries.map((e) => e.id === id ? { ...e, markedForRemoval: true } : e) })); setConfirmRemoveId(null); }
    function addEntry(values: CrawlerFormValues) {
        setDraft((c) => ({ ...c, entries: [...c.entries, { id: `crawl-${Date.now()}`, url: values.url.trim(), description: values.description.trim(), exactSearch: values.exactSearch }] }));
    }
    function updateEntry(values: CrawlerFormValues) {
        if (!editId) return;
        setDraft((c) => ({ ...c, entries: c.entries.map((e) => e.id === editId ? { ...e, url: values.url.trim(), description: values.description.trim(), exactSearch: values.exactSearch } : e) }));
        setEditId(null);
    }
    function save() {
        if (!dirty || saving) return;
        setSaving(true); setSaveError(null);
        window.setTimeout(() => {
            onCommit({ entries: draft.entries.filter((e) => !e.markedForRemoval).map((e) => ({ ...e, markedForRemoval: false })), settings: { ...draft.settings } });
            setSaving(false); onCancel();
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
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]" style={{ background: LX.blueT10 }}><Globe size={18} color={LX.secondary} /></div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal" style={{ color: LX.primary }}>Crawler URL Data</DialogTitle>
                                    <DialogDescription className="mt-1 luxia-type-metadata" style={{ color: LX.textMuted }}>Changes are local until saved.</DialogDescription>
                                </div>
                                <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" aria-label="Close crawler manager" onClick={requestClose}><X size={15} style={{ color: LX.textMuted }} /></Button>
                            </div>
                        </DialogHeader>

                        <div className="flex-shrink-0 border-b px-6 py-3" style={{ borderColor: LX.border }}>
                            <div className="flex items-center gap-2 rounded-[14px] border px-3 py-2" style={{ borderColor: LX.border, background: LX.subtle }}>
                                <Search size={14} style={{ color: LX.textMuted }} />
                                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search crawler URL data…" className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0" aria-label="Search crawler URLs" />
                                {search ? <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full" aria-label="Clear search" onClick={() => setSearch("")}><X size={12} style={{ color: LX.textMuted }} /></Button> : null}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>{search ? "No crawler URLs match your search." : "No crawler URLs yet"}</p>
                                    {!search ? <Button type="button" className="mt-4 rounded-full px-4" onClick={() => setAddOpen(true)}><Plus size={14} />Add URL</Button> : null}
                                </div>
                            ) : (
                                <div className="space-y-2">{filtered.map((item) => (
                                    <CrawlerRow key={item.id} item={item} onView={() => setViewId(item.id)} onEdit={() => setEditId(item.id)} onRemove={() => setConfirmRemoveId(item.id)} />
                                ))}</div>
                            )}
                        </div>

                        <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            {filtered.length > 0 ? <Button type="button" variant="outline" className="mb-3 w-full rounded-full" onClick={() => setAddOpen(true)}><Plus size={14} />Add URL</Button> : null}
                            <div className="mb-4 space-y-2 rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.subtle }}>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Crawler Mode</span>
                                    <Switch checked={draft.settings.crawlerMode} onCheckedChange={(crawlerMode) => setDraft((c) => ({ ...c, settings: { ...c.settings, crawlerMode } }))} aria-label="Crawler mode" className="data-[state=checked]:bg-[#30214E]" />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Use Crawler Cache</span>
                                    <Switch checked={draft.settings.useCrawlerCache} onCheckedChange={(useCrawlerCache) => setDraft((c) => ({ ...c, settings: { ...c.settings, useCrawlerCache } }))} aria-label="Use crawler cache" className="data-[state=checked]:bg-[#30214E]" />
                                </div>
                            </div>
                            {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>{count} {count === 1 ? "item" : "items"}{dirty ? " · Unsaved changes" : ""}</span>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="secondary" className="rounded-full px-4" onClick={requestClose}>Cancel</Button>
                                    <Button type="button" className="min-w-[132px] rounded-full px-4" disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save Changes"}</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AddCrawlerDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addEntry} />
            {editItem ? <EditCrawlerDialog open={!!editId} onOpenChange={(o) => { if (!o) setEditId(null); }} initialValues={{ url: editItem.url, description: editItem.description, exactSearch: editItem.exactSearch }} onUpdate={updateEntry} /> : null}
            <ViewCrawlerDialog open={!!viewItem} onOpenChange={(o) => { if (!o) setViewId(null); }} item={viewItem} />
            <RemoveCrawlerDialog open={!!confirmRemoveId} onOpenChange={(o) => { if (!o) setConfirmRemoveId(null); }} onConfirm={() => confirmRemoveId && markRemove(confirmRemoveId)} />
            <DiscardCrawlerChangesDialog open={discardOpen} onOpenChange={setDiscardOpen} onDiscard={() => { setDiscardOpen(false); onCancel(); }} />
        </>
    );
}
