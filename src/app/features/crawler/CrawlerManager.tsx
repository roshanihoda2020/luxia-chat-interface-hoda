import { Globe, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { AddCrawlerDialog } from "./AddCrawlerDialog";
import { CrawlerRow } from "./CrawlerRow";
import { DiscardCrawlerChangesDialog } from "./DiscardCrawlerChangesDialog";
import { EditCrawlerDialog } from "./EditCrawlerDialog";
import { RemoveCrawlerDialog } from "./RemoveCrawlerDialog";
import { ViewCrawlerDialog } from "./ViewCrawlerDialog";
import type { CrawlerFormValues } from "./CrawlerForm";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Switch } from "@/app/components/ui/switch";
import { cn } from "@/app/components/ui/utils";
import { BusyButton } from "@/app/features/shared/Loading";
import { ListEmptyState } from "@/app/features/shared/ListEmptyState";
import { ListNoResultsState } from "@/app/features/shared/ListNoResultsState";
import {
    DESTRUCTIVE_CONFIRM,
    DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { SearchField } from "@/app/features/shared/SearchField";
import { useManagerLeaveRegistration } from "@/app/features/shared/unsavedNavigationGuard";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import { LX } from "./tokens";
import type { CrawlerState } from "./types";
import { activeCrawlerCount, cloneCrawlerState, crawlerSignature } from "./utils";

export function CrawlerManager({ open, state, onCommit, onCancel, presentation = "dialog", closeRef, dirtyRef, hideChrome }: {
    open: boolean; state: CrawlerState; onCommit: (next: CrawlerState) => void; onCancel: () => void;
    presentation?: "dialog" | "page";
    closeRef?: MutableRefObject<(() => void) | null>;
    dirtyRef?: MutableRefObject<boolean>;
    hideChrome?: boolean;
}) {
    const isPage = presentation === "page";
    const effectiveOpen = isPage ? true : open;
    const showHeaderChrome = !hideChrome && !isPage;
    const [draft, setDraft] = useState<CrawlerState>(() => cloneCrawlerState(state));
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [viewId, setViewId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [discardIntent, setDiscardIntent] = useState<"leave" | "reset">("leave");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef(cloneCrawlerState(state));
    const removeTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!effectiveOpen) return;
        const snapshot = cloneCrawlerState(state);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setSearch(""); setAddOpen(false); setViewId(null); setEditId(null); setConfirmRemoveId(null); setRemoving(false); setDiscardOpen(false); setSaving(false); setSaveError(null);
    }, [effectiveOpen, state]);

    useEffect(() => {
        return () => {
            if (removeTimerRef.current !== null) {
                window.clearTimeout(removeTimerRef.current);
            }
        };
    }, []);

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

    function requestLeave() {
        if (dirty) {
            setDiscardIntent("leave");
            setDiscardOpen(true);
            return;
        }
        onCancel();
    }

    function requestCancelEdits() {
        if (!dirty) {
            if (!isPage) onCancel();
            return;
        }
        setDiscardIntent(isPage ? "reset" : "leave");
        setDiscardOpen(true);
    }

    useManagerLeaveRegistration({ closeRef, dirtyRef, dirty, requestLeave });

    function confirmMarkRemove() {
        if (!confirmRemoveId || removing) return;
        const removeId = confirmRemoveId;
        setRemoving(true);
        removeTimerRef.current = window.setTimeout(() => {
            removeTimerRef.current = null;
            try {
                setDraft((c) => ({
                    ...c,
                    entries: c.entries.map((e) =>
                        e.id === removeId ? { ...e, markedForRemoval: true } : e,
                    ),
                }));
                luxiaToast.success(DESTRUCTIVE_CONFIRM.crawler.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.crawler.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }
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
            const next = { entries: draft.entries.filter((e) => !e.markedForRemoval).map((e) => ({ ...e, markedForRemoval: false })), settings: { ...draft.settings } };
            onCommit(next);
            initialRef.current = cloneCrawlerState(next);
            setDraft(cloneCrawlerState(next));
            setSaving(false);
            luxiaToast.success("Crawler settings saved");
            if (!isPage) onCancel();
        }, 500);
    }

    if (!effectiveOpen) return null;

    const shell = (
                    <div className={isPage ? "flex min-h-0 flex-1 flex-col" : "flex max-h-[88vh] flex-col"}>
                        {showHeaderChrome ? (
                        <DialogHeader className="flex-shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]" style={{ background: LX.blueT10 }}><Globe size={18} color={LX.secondary} /></div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal">Crawler URL Data</DialogTitle>
                                    <DialogDescription className="mt-1.5 luxia-type-metadata">Changes are local until saved.</DialogDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-9 w-9", LUXIA_DIALOG_CLOSE_ON_DARK_CLASS)}
                                    aria-label="Close crawler manager"
                                    onClick={requestLeave}
                                >
                                    <X size={15} />
                                </Button>
                            </div>
                        </DialogHeader>
                        ) : null}

                        <div className="flex-shrink-0 border-b px-6 py-3.5" style={{ borderColor: LX.border }}>
                            <div className="flex flex-wrap items-center gap-2">
                            <SearchField
                                density="dense"
                                value={search}
                                onChange={setSearch}
                                placeholder="Search crawler URL data…"
                                aria-label="Search crawler URLs"
                            />
                            <Button type="button" variant="primary" size="compact" onClick={() => setAddOpen(true)}>
                                <Plus size={14} />Add URL
                            </Button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                            {filtered.length === 0 ? (
                                search ? (
                                    <ListNoResultsState
                                        title="No crawler URLs match your search."
                                        className="border-0 bg-transparent px-2 py-10"
                                    />
                                ) : (
                                    <ListEmptyState
                                        title="No crawler URLs yet"
                                        className="border-0 bg-transparent px-2 py-10"
                                        action={
                                            <Button type="button" className="px-4" onClick={() => setAddOpen(true)}>
                                                <Plus size={14} />Add URL
                                            </Button>
                                        }
                                    />
                                )
                            ) : (
                                <div className="space-y-2">{filtered.map((item) => (
                                    <CrawlerRow key={item.id} item={item} onView={() => setViewId(item.id)} onEdit={() => setEditId(item.id)} onRemove={() => setConfirmRemoveId(item.id)} />
                                ))}</div>
                            )}
                        </div>

                        <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            <div className="mb-4 space-y-2 rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.subtle }}>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Crawler Mode</span>
                                    <Switch checked={draft.settings.crawlerMode} onCheckedChange={(crawlerMode) => setDraft((c) => ({ ...c, settings: { ...c.settings, crawlerMode } }))} aria-label="Crawler mode" />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Use Crawler Cache</span>
                                    <Switch checked={draft.settings.useCrawlerCache} onCheckedChange={(useCrawlerCache) => setDraft((c) => ({ ...c, settings: { ...c.settings, useCrawlerCache } }))} aria-label="Use crawler cache" />
                                </div>
                            </div>
                            {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>{count} {count === 1 ? "item" : "items"}{dirty ? " · Unsaved changes" : ""}</span>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="secondary" className="px-4" onClick={requestCancelEdits} disabled={isPage && !dirty}>Cancel</Button>
                                    <BusyButton
                                        type="button"
                                        variant="primary"
                                        className="min-w-[132px] px-4 !bg-[var(--luxia-purple-70)] !bg-none disabled:!opacity-[0.45]"
                                        disabled={!dirty}
                                        busy={saving}
                                        busyLabel="Saving…"
                                        busyText="Saving…"
                                        onClick={save}
                                    >
                                        Save Changes
                                    </BusyButton>
                                </div>
                            </div>
                        </div>
                    </div>
    );

    return (
        <>
            {isPage ? (
                shell
            ) : (
                <Dialog open={open} onOpenChange={(next) => { if (!next) requestLeave(); }}>
                    <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 760px)", maxWidth: "min(92vw, 760px)", maxHeight: "88vh" }}>
                        {shell}
                    </DialogContent>
                </Dialog>
            )}

            <AddCrawlerDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addEntry} />
            {editItem ? <EditCrawlerDialog open={!!editId} onOpenChange={(o) => { if (!o) setEditId(null); }} initialValues={{ url: editItem.url, description: editItem.description, exactSearch: editItem.exactSearch }} onUpdate={updateEntry} /> : null}
            <ViewCrawlerDialog open={!!viewItem} onOpenChange={(o) => { if (!o) setViewId(null); }} item={viewItem} />
            <RemoveCrawlerDialog
                open={!!confirmRemoveId}
                onOpenChange={(o) => { if (!o && !removing) setConfirmRemoveId(null); }}
                onConfirm={confirmMarkRemove}
                busy={removing}
                chrome={isPage ? "standard" : "compact"}
            />
            <DiscardCrawlerChangesDialog open={discardOpen} onOpenChange={setDiscardOpen} onDiscard={() => {
                setDiscardOpen(false);
                if (discardIntent === "reset") {
                    setDraft(cloneCrawlerState(initialRef.current));
                    return;
                }
                onCancel();
            }} />
        </>
    );
}
