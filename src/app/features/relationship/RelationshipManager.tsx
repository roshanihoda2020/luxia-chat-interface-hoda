import { GitBranch, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { AddRelationshipDialog } from "./AddRelationshipDialog";
import { DiscardRelationshipChangesDialog } from "./DiscardRelationshipChangesDialog";
import { EditRelationshipDialog } from "./EditRelationshipDialog";
import { RelationshipRow } from "./RelationshipRow";
import { RemoveRelationshipDialog } from "./RemoveRelationshipDialog";
import { ViewRelationshipDialog } from "./ViewRelationshipDialog";
import type { RelationshipFormValues } from "./RelationshipForm";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/components/ui/utils";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import { LX } from "./tokens";
import type { RelationshipRecord } from "./types";
import { activeRelationshipCount, cloneRelationships, relationshipName, relationshipsSignature } from "./utils";

export function RelationshipManager({
    open,
    relationships,
    onCommit,
    onCancel,
    presentation = "dialog",
    closeRef,
    hideChrome,
}: {
    open: boolean;
    relationships: RelationshipRecord[];
    onCommit: (next: RelationshipRecord[]) => void;
    onCancel: () => void;
    presentation?: "dialog" | "page";
    closeRef?: MutableRefObject<(() => void) | null>;
    hideChrome?: boolean;
}) {
    const isPage = presentation === "page";
    const effectiveOpen = isPage ? true : open;
    const showHeaderChrome = !hideChrome && !isPage;
    const [draft, setDraft] = useState<RelationshipRecord[]>(() => cloneRelationships(relationships));
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [viewId, setViewId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [discardIntent, setDiscardIntent] = useState<"leave" | "reset">("leave");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef(cloneRelationships(relationships));

    useEffect(() => {
        if (!effectiveOpen) return;
        const snapshot = cloneRelationships(relationships);
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
    }, [effectiveOpen, relationships]);

    const dirty = relationshipsSignature(draft) !== relationshipsSignature(initialRef.current);
    const visibleDraft = useMemo(() => draft.filter((item) => !item.markedForRemoval), [draft]);

    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return visibleDraft;
        return visibleDraft.filter((item) => {
            const haystack = [
                relationshipName(item),
                item.fromTable,
                item.toTable,
            ].join(" ").toLowerCase();
            return haystack.includes(lowered);
        });
    }, [visibleDraft, search]);

    const viewItem = visibleDraft.find((item) => item.id === viewId) ?? null;
    const editItem = visibleDraft.find((item) => item.id === editId) ?? null;
    const count = activeRelationshipCount(draft);

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

    useEffect(() => {
        if (closeRef) closeRef.current = requestLeave;
        return () => { if (closeRef) closeRef.current = null; };
    });

    function markRemove(id: string) {
        setDraft((current) => current.map((item) => item.id === id ? { ...item, markedForRemoval: true } : item));
        setConfirmRemoveId(null);
    }

    function toggleActive(id: string, active: boolean) {
        setDraft((current) => current.map((item) => item.id === id ? { ...item, active } : item));
    }

    function addRelationship(values: RelationshipFormValues) {
        const next: RelationshipRecord = {
            id: `rel-${Date.now()}`,
            type: values.type as RelationshipRecord["type"],
            fromTable: values.fromTable,
            fromColumn: values.fromColumn,
            toTable: values.toTable,
            toColumn: values.toColumn,
            active: values.active,
        };
        setDraft((current) => [...current, next]);
    }

    function updateRelationship(values: RelationshipFormValues) {
        if (!editId) return;
        setDraft((current) => current.map((item) => item.id === editId ? {
            ...item,
            type: values.type as RelationshipRecord["type"],
            fromTable: values.fromTable,
            fromColumn: values.fromColumn,
            toTable: values.toTable,
            toColumn: values.toColumn,
            active: values.active,
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
            initialRef.current = cloneRelationships(committed);
            setDraft(cloneRelationships(committed));
            setSaving(false);
            if (!isPage) onCancel();
        }, 500);
    }

    if (!effectiveOpen) return null;

    const shell = (
                    <div className={isPage ? "flex min-h-0 flex-1 flex-col" : "flex max-h-[88vh] flex-col"}>
                        {showHeaderChrome ? (
                        <DialogHeader className="flex-shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]" style={{ background: LX.blueT10 }}>
                                    <GitBranch size={18} color={LX.secondary} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal">Relationship</DialogTitle>
                                    <DialogDescription className="mt-1 luxia-type-metadata">Changes are local until saved.</DialogDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-9 w-9", LUXIA_DIALOG_CLOSE_ON_DARK_CLASS)}
                                    aria-label="Close relationship manager"
                                    onClick={requestLeave}
                                >
                                    <X size={15} />
                                </Button>
                            </div>
                        </DialogHeader>
                        ) : null}

                        <div className="flex-shrink-0 border-b px-6 py-3" style={{ borderColor: LX.border }}>
                            <div className="flex flex-wrap items-center gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] border px-3 py-2" style={{ borderColor: LX.border, background: LX.subtle }}>
                                <Search size={14} style={{ color: LX.textMuted }} />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search relationship…"
                                    className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0"
                                    aria-label="Search relationships"
                                />
                                {search ? (
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 " aria-label="Clear search" onClick={() => setSearch("")}>
                                        <X size={12} style={{ color: LX.textMuted }} />
                                    </Button>
                                ) : null}
                            </div>
                            <Button type="button" variant="primary" size="compact" onClick={() => setAddOpen(true)}>
                                <Plus size={14} />Add Relationship
                            </Button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    {search ? (
                                        <>
                                            <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>No relationships match your search.</p>
                                            <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Try another table or relationship name.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="luxia-type-title-component" style={{ color: LX.primary }}>No relationships yet</p>
                                            <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Add a relationship between two tables.</p>
                                            <Button type="button" className="mt-4 px-4" onClick={() => setAddOpen(true)}>
                                                <Plus size={14} />Add relationship
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filtered.map((item) => (
                                        <RelationshipRow
                                            key={item.id}
                                            item={item}
                                            onToggleActive={(active) => toggleActive(item.id, active)}
                                            onView={() => setViewId(item.id)}
                                            onEdit={() => setEditId(item.id)}
                                            onRemove={() => setConfirmRemoveId(item.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
                                    {count} {count === 1 ? "item" : "items"}{dirty ? " · Unsaved changes" : ""}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="secondary" className="px-4" onClick={requestCancelEdits} disabled={isPage && !dirty}>Cancel</Button>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        className="min-w-[132px] px-4 !bg-[var(--luxia-purple-70)] !bg-none disabled:!opacity-[0.45]"
                                        disabled={!dirty || saving}
                                        onClick={save}
                                    >
                                        {saving ? "Saving…" : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
    );

    return (
        <>
            {isPage ? (
                <div className="flex flex-col overflow-hidden rounded-[12px] border" style={{ borderColor: LX.border }}>
                    {shell}
                </div>
            ) : (
                <Dialog open={open} onOpenChange={(next) => { if (!next) requestLeave(); }}>
                    <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 720px)", maxWidth: "min(92vw, 720px)", maxHeight: "88vh" }}>
                        {shell}
                    </DialogContent>
                </Dialog>
            )}

            <AddRelationshipDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addRelationship} />

            {editItem ? (
                <EditRelationshipDialog
                    open={!!editId}
                    onOpenChange={(next) => { if (!next) setEditId(null); }}
                    initialValues={{
                        type: editItem.type,
                        fromTable: editItem.fromTable,
                        fromColumn: editItem.fromColumn,
                        toTable: editItem.toTable,
                        toColumn: editItem.toColumn,
                        active: editItem.active,
                    }}
                    onUpdate={updateRelationship}
                />
            ) : null}

            <ViewRelationshipDialog
                open={!!viewItem}
                onOpenChange={(next) => { if (!next) setViewId(null); }}
                item={viewItem}
            />

            <RemoveRelationshipDialog
                open={!!confirmRemoveId}
                onOpenChange={(next) => { if (!next) setConfirmRemoveId(null); }}
                onConfirm={() => confirmRemoveId && markRemove(confirmRemoveId)}
            />

            <DiscardRelationshipChangesDialog
                open={discardOpen}
                onOpenChange={setDiscardOpen}
                onDiscard={() => {
                    setDiscardOpen(false);
                    if (discardIntent === "reset") {
                        setDraft(cloneRelationships(initialRef.current));
                        return;
                    }
                    onCancel();
                }}
            />
        </>
    );
}
