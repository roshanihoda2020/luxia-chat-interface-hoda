import { BookOpen, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { KBEntryMenu } from "@/app/features/kb/KBEntryMenu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { cn } from "@/app/components/ui/utils";
import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";
import { BusyButton } from "@/app/features/shared/Loading";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { useManagerLeaveRegistration } from "@/app/features/shared/unsavedNavigationGuard";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import { KB_RESPONSE_TYPES, type KnowledgeBaseEntry } from "./data";
import { LX } from "@/app/features/active-data-tables/tokens";

function cloneEntries(entries: KnowledgeBaseEntry[]): KnowledgeBaseEntry[] {
    return entries.map((entry) => ({ ...entry }));
}

function entriesSignature(entries: KnowledgeBaseEntry[]): string {
    return JSON.stringify(entries.map((entry) => ({
        id: entry.id,
        question: entry.question,
        answer: entry.answer,
        responseType: entry.responseType,
    })));
}

function KBEntryFormAlert({
    mode,
    entry,
    open,
    onOpenChange,
    onSubmit,
}: {
    mode: "add" | "edit" | "view";
    entry?: KnowledgeBaseEntry;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (entry: KnowledgeBaseEntry) => void;
}) {
    const [question, setQuestion] = useState(entry?.question ?? "");
    const [answer, setAnswer] = useState(entry?.answer ?? "");
    const [responseType, setResponseType] = useState(entry?.responseType ?? "narrative");
    const isView = mode === "view";
    const isAdd = mode === "add";
    const canSave = question.trim().length > 0 && answer.trim().length > 0;

    useEffect(() => {
        if (!open) return;
        setQuestion(entry?.question ?? "");
        setAnswer(entry?.answer ?? "");
        setResponseType(entry?.responseType ?? "narrative");
    }, [open, entry]);

    function handleSubmit() {
        if (!canSave || isView) return;
        onSubmit({
            id: entry?.id ?? `kb${Date.now()}`,
            question: question.trim(),
            answer: answer.trim(),
            responseType,
        });
        onOpenChange(false);
    }

    const title = isAdd ? "Add Knowledge Entry" : isView ? "Knowledge Entry" : "Edit Knowledge Entry";

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[min(92vw,560px)] gap-0 overflow-hidden p-0">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {!isView ? (
                        <AlertDialogDescription>
                            Question and answer are required.
                        </AlertDialogDescription>
                    ) : null}
                </AlertDialogHeader>

                <div className="max-h-[min(60vh,480px)] space-y-4 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                    <div>
                        <label className="luxia-type-metadata mb-2 block" style={{ color: LX.textMuted }}>Question</label>
                        {isView ? (
                            <p className="luxia-type-body-small-strong rounded-[12px] px-4 py-3.5" style={{ border: `1px solid ${LX.border}`, color: LX.primary, background: LX.subtle }}>{question}</p>
                        ) : (
                            <Input
                                value={question}
                                onChange={(event) => setQuestion(event.target.value)}
                                placeholder="e.g. What is Luxia?"
                                className="rounded-[12px] luxia-type-body-small"
                                aria-label="Question"
                            />
                        )}
                    </div>
                    <div>
                        <label className="luxia-type-metadata mb-2 block" style={{ color: LX.textMuted }}>Answer</label>
                        {isView ? (
                            <p className="luxia-type-body-small whitespace-pre-wrap rounded-[12px] px-4 py-3.5" style={{ border: `1px solid ${LX.border}`, color: LX.primary, background: LX.subtle }}>{answer}</p>
                        ) : (
                            <Textarea
                                value={answer}
                                onChange={(event) => setAnswer(event.target.value)}
                                placeholder="Write the expected answer…"
                                rows={6}
                                className="min-h-[140px] resize-y rounded-[12px] luxia-type-body-small"
                                aria-label="Answer"
                            />
                        )}
                    </div>
                    <div>
                        <label className="luxia-type-overline-form mb-2 block" style={{ color: LX.textMuted }}>Response Type</label>
                        <div className="inline-flex overflow-hidden rounded-[10px]" style={{ border: `1px solid ${LX.border}`, background: LX.surface, opacity: isView ? 0.7 : 1 }}>
                            {KB_RESPONSE_TYPES.map((type, index) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    disabled={isView}
                                    onClick={() => setResponseType(type.id)}
                                    className="px-4 py-2 luxia-type-metadata transition-all disabled:cursor-default"
                                    style={{
                                        background: responseType === type.id ? LX.primary : "transparent",
                                        color: responseType === type.id ? LX.surface : LX.textMuted,
                                        borderRight: index < KB_RESPONSE_TYPES.length - 1 ? `1px solid ${LX.border}` : "none",
                                    }}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <AlertDialogFooter>
                    {isView ? (
                        <AlertDialogCancel className="px-4">Close</AlertDialogCancel>
                    ) : (
                        <>
                            <AlertDialogCancel className="px-4">Cancel</AlertDialogCancel>
                            <AlertDialogAction className="px-4 text-white hover:opacity-90" style={{ background: LX.primary }} disabled={!canSave} onClick={handleSubmit}>
                                {isAdd ? "Add" : "Save Changes"}
                            </AlertDialogAction>
                        </>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function KnowledgeBaseManager({
    open,
    entries,
    onCommit,
    onCancel,
    presentation = "dialog",
    closeRef,
    dirtyRef,
    hideChrome,
}: {
    open: boolean;
    entries: KnowledgeBaseEntry[];
    onCommit: (next: KnowledgeBaseEntry[]) => void;
    onCancel: () => void;
    presentation?: "dialog" | "page";
    closeRef?: MutableRefObject<(() => void) | null>;
    dirtyRef?: MutableRefObject<boolean>;
    hideChrome?: boolean;
}) {
    const isPage = presentation === "page";
    const effectiveOpen = isPage ? true : open;
    const showHeaderChrome = !hideChrome && !isPage;

    const [draft, setDraft] = useState<KnowledgeBaseEntry[]>(() => cloneEntries(entries));
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [viewEntry, setViewEntry] = useState<KnowledgeBaseEntry | null>(null);
    const [editEntry, setEditEntry] = useState<KnowledgeBaseEntry | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [discardIntent, setDiscardIntent] = useState<"leave" | "reset">("leave");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef(cloneEntries(entries));

    useEffect(() => {
        if (!effectiveOpen) return;
        const snapshot = cloneEntries(entries);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setSearch("");
        setAddOpen(false);
        setViewEntry(null);
        setEditEntry(null);
        setConfirmRemoveId(null);
        setDiscardOpen(false);
        setSaving(false);
        setSaveError(null);
    }, [effectiveOpen, entries]);

    const dirty = entriesSignature(draft) !== entriesSignature(initialRef.current);

    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return draft;
        return draft.filter((entry) =>
            entry.question.toLowerCase().includes(lowered) ||
            entry.answer.toLowerCase().includes(lowered),
        );
    }, [draft, search]);

    const removeEntry = draft.find((entry) => entry.id === confirmRemoveId) ?? null;

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

    function removeById(id: string) {
        setDraft((current) => current.filter((entry) => entry.id !== id));
        setConfirmRemoveId(null);
    }

    function addEntry(entry: KnowledgeBaseEntry) {
        setDraft((current) => [...current, entry]);
    }

    function updateEntry(entry: KnowledgeBaseEntry) {
        setDraft((current) => current.map((item) => item.id === entry.id ? entry : item));
        setEditEntry(null);
    }

    function save() {
        if (!dirty || saving) return;
        setSaving(true);
        setSaveError(null);
        window.setTimeout(() => {
            const next = cloneEntries(draft);
            onCommit(next);
            initialRef.current = next;
            setDraft(next);
            setSaving(false);
            luxiaToast.success("Knowledge base saved");
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
                            <BookOpen size={18} color={LX.secondary} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="luxia-type-title-modal">Knowledge Base</DialogTitle>
                            <DialogDescription className="mt-1 luxia-type-metadata">Changes are local until saved.</DialogDescription>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn("h-9 w-9", LUXIA_DIALOG_CLOSE_ON_DARK_CLASS)}
                            aria-label="Close knowledge base manager"
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
                            placeholder="Search questions and answers…"
                            className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0"
                            aria-label="Search knowledge base entries"
                        />
                        {search ? (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 " aria-label="Clear search" onClick={() => setSearch("")}>
                                <X size={12} style={{ color: LX.textMuted }} />
                            </Button>
                        ) : null}
                    </div>
                    <Button type="button" variant="primary" size="compact" onClick={() => setAddOpen(true)}>
                        <Plus size={14} />Add Knowledge Entry
                    </Button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        {search ? (
                            <>
                                <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>No entries match your search.</p>
                                <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Try another question or answer.</p>
                            </>
                        ) : (
                            <>
                                <p className="luxia-type-title-component" style={{ color: LX.primary }}>No knowledge entries yet</p>
                                <p className="mt-1 luxia-type-body-dense" style={{ color: LX.textMuted }}>Add curated question-answer pairs for this constellation.</p>
                                <Button type="button" className="mt-4 px-4" onClick={() => setAddOpen(true)}>
                                    <Plus size={14} />Add Knowledge Entry
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((entry) => {
                            const typeLabel = KB_RESPONSE_TYPES.find((type) => type.id === entry.responseType)?.label;
                            return (
                                <div
                                    key={entry.id}
                                    className="group/item flex items-start gap-2 rounded-[10px] px-2.5 py-2.5 transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)]"
                                    style={{ background: "transparent" }}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="luxia-type-body-dense-strong leading-snug" style={{ color: LX.primary }}>{entry.question}</p>
                                        <p
                                            className="mt-1 luxia-type-caption"
                                            style={{
                                                color: LX.textMuted,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            } as React.CSSProperties}
                                        >
                                            {entry.answer}
                                        </p>
                                        {typeLabel ? (
                                            <p className="mt-1 luxia-type-caption" style={{ color: LX.textMuted }}>{typeLabel}</p>
                                        ) : null}
                                    </div>
                                    <div
                                        className="relative z-20 flex flex-shrink-0 items-center"
                                        onPointerDown={(event) => event.stopPropagation()}
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <KBEntryMenu
                                            onView={() => setViewEntry(entry)}
                                            onEdit={() => setEditEntry(entry)}
                                            onRemove={() => setConfirmRemoveId(entry.id)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                <div className="flex items-center justify-between gap-3">
                    <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
                        {draft.length} {draft.length === 1 ? "entry" : "entries"}{dirty ? " · Unsaved changes" : ""}
                    </span>
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
                <div className="flex flex-col overflow-hidden rounded-[12px] border" style={{ borderColor: LX.border }}>
                    {shell}
                </div>
            ) : (
                <Dialog open={open} onOpenChange={(next) => { if (!next) requestLeave(); }}>
                    <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 760px)", maxWidth: "min(92vw, 760px)", maxHeight: "88vh" }}>
                        {shell}
                    </DialogContent>
                </Dialog>
            )}

            <KBEntryFormAlert mode="add" open={addOpen} onOpenChange={setAddOpen} onSubmit={addEntry} />

            {viewEntry ? (
                <KBEntryFormAlert
                    mode="view"
                    entry={viewEntry}
                    open={!!viewEntry}
                    onOpenChange={(next) => { if (!next) setViewEntry(null); }}
                    onSubmit={() => {}}
                />
            ) : null}

            {editEntry ? (
                <KBEntryFormAlert
                    mode="edit"
                    entry={editEntry}
                    open={!!editEntry}
                    onOpenChange={(next) => { if (!next) setEditEntry(null); }}
                    onSubmit={updateEntry}
                />
            ) : null}

            <AlertDialog open={!!confirmRemoveId} onOpenChange={(next) => { if (!next) setConfirmRemoveId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove knowledge entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {removeEntry ? `"${removeEntry.question}" will be removed from this draft.` : "This entry will be removed from this draft."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction style={{ background: LX.error }} className="text-white hover:opacity-90" onClick={() => confirmRemoveId && removeById(confirmRemoveId)}>
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DiscardChangesDialog
                open={discardOpen}
                onOpenChange={setDiscardOpen}
                onDiscard={() => {
                    setDiscardOpen(false);
                    if (discardIntent === "reset") {
                        setDraft(cloneEntries(initialRef.current));
                        return;
                    }
                    onCancel();
                }}
            />
        </>
    );
}
