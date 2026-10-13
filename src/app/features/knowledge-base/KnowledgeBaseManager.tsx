import { BookOpen, Download, Plus, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { KBEntryMenu } from "@/app/features/kb/KBEntryMenu";
import {
    AlertDialog,
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
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";
import {
    DESTRUCTIVE_CONFIRM,
    DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { ListEmptyState } from "@/app/features/shared/ListEmptyState";
import { ListNoResultsState } from "@/app/features/shared/ListNoResultsState";
import { ListPagination } from "@/app/features/shared/ListPagination";
import { BusyButton } from "@/app/features/shared/Loading";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { PageSizeSelect } from "@/app/features/shared/PageSizeSelect";
import { SearchField } from "@/app/features/shared/SearchField";
import { useManagerLeaveRegistration } from "@/app/features/shared/unsavedNavigationGuard";
import {
    LUXIA_DIALOG_CLOSE_ABSOLUTE_CLASS,
    LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
} from "@/app/features/shared/structuredModalChrome";
import { KB_RESPONSE_TYPES, type KnowledgeBaseEntry } from "./data";
import { downloadKnowledgeBaseCsv } from "./exportCsv";
import { KbImportCsvDialog } from "./KbImportCsvDialog";
import { LX } from "@/app/features/active-data-tables/tokens";

const KB_PAGE_SIZES = [10, 25, 50] as const;
const KB_PAGE_SIZE_DEFAULT: (typeof KB_PAGE_SIZES)[number] = 25;

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

const KB_ENTRY_SUBMIT_DELAY_MS = 500;

/** Shared Knowledge Entry add / edit / view dialog (Chat capsule View + manager). */
export function KnowledgeEntryDialog({
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
    const [submitting, setSubmitting] = useState(false);
    const submitTimerRef = useRef<number | null>(null);
    const isView = mode === "view";
    const isAdd = mode === "add";
    const canSave = question.trim().length > 0 && answer.trim().length > 0;

    function clearSubmitTimer() {
        if (submitTimerRef.current != null) {
            window.clearTimeout(submitTimerRef.current);
            submitTimerRef.current = null;
        }
    }

    useEffect(() => {
        if (!open) {
            clearSubmitTimer();
            setSubmitting(false);
            return;
        }
        setQuestion(entry?.question ?? "");
        setAnswer(entry?.answer ?? "");
        setResponseType(entry?.responseType ?? "narrative");
        clearSubmitTimer();
        setSubmitting(false);
    }, [open, entry]);

    useEffect(() => () => clearSubmitTimer(), []);

    function handleOpenChange(next: boolean) {
        if (!next && submitting) {
            // Cancel / dismiss aborts a pending mock submit without mutating or toasting.
            clearSubmitTimer();
            setSubmitting(false);
        }
        onOpenChange(next);
    }

    function handleSubmit() {
        if (!canSave || isView || submitting) return;
        setSubmitting(true);
        const nextEntry: KnowledgeBaseEntry = {
            id: entry?.id ?? `kb${Date.now()}`,
            question: question.trim(),
            answer: answer.trim(),
            responseType,
        };
        clearSubmitTimer();
        submitTimerRef.current = window.setTimeout(() => {
            submitTimerRef.current = null;
            onSubmit(nextEntry);
            luxiaToast.success(isAdd ? "Knowledge entry added." : "Knowledge entry updated.");
            setSubmitting(false);
            onOpenChange(false);
        }, KB_ENTRY_SUBMIT_DELAY_MS);
    }

    const title = isAdd ? "Add Knowledge Entry" : isView ? "Knowledge Entry" : "Edit Knowledge Entry";
    const submitLabel = isAdd ? "Add Entry" : "Save Changes";
    const busyLabel = isAdd ? "Adding…" : "Saving…";

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="relative max-w-[min(92vw,560px)] gap-0 overflow-hidden p-0">
                <AlertDialogHeader className="pr-14">
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {!isView ? (
                        <AlertDialogDescription>
                            Question and answer are required.
                        </AlertDialogDescription>
                    ) : (
                        <AlertDialogDescription className="sr-only">
                            Read-only knowledge entry details.
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogCancel
                    className={cn(
                        "luxia-button luxia-button--ghost luxia-button--icon-compact border-0 bg-transparent shadow-none",
                        LUXIA_DIALOG_CLOSE_ABSOLUTE_CLASS,
                        LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
                    )}
                    aria-label="Close"
                    disabled={submitting}
                >
                    <X size={15} />
                    <span className="sr-only">Close</span>
                </AlertDialogCancel>

                <form
                    className="contents"
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSubmit();
                    }}
                >
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
                                    disabled={submitting}
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
                                    disabled={submitting}
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
                                        disabled={isView || submitting}
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
                                <AlertDialogCancel className="px-4" disabled={submitting}>Cancel</AlertDialogCancel>
                                <BusyButton
                                    type="submit"
                                    variant="primary"
                                    className="px-4"
                                    style={{ background: LX.primary }}
                                    disabled={!canSave}
                                    busy={submitting}
                                    busyLabel={busyLabel}
                                    busyText={busyLabel}
                                >
                                    {submitLabel}
                                </BusyButton>
                            </>
                        )}
                    </AlertDialogFooter>
                </form>
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
    readOnly = false,
    onLeaveAborted,
}: {
    open: boolean;
    entries: KnowledgeBaseEntry[];
    onCommit: (next: KnowledgeBaseEntry[]) => void;
    onCancel: () => void;
    presentation?: "dialog" | "page";
    closeRef?: MutableRefObject<(() => void) | null>;
    dirtyRef?: MutableRefObject<boolean>;
    hideChrome?: boolean;
    /** When true, browsing/View/Export remain available; all mutations are blocked. */
    readOnly?: boolean;
    /** Keep editing / dismiss on leave confirmation — pending host leave actions should clear. */
    onLeaveAborted?: () => void;
}) {
    const isPage = presentation === "page";
    const effectiveOpen = isPage ? true : open;
    const showHeaderChrome = !hideChrome && !isPage;

    const [draft, setDraft] = useState<KnowledgeBaseEntry[]>(() => cloneEntries(entries));
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<(typeof KB_PAGE_SIZES)[number]>(KB_PAGE_SIZE_DEFAULT);
    const [addOpen, setAddOpen] = useState(false);
    const [viewEntry, setViewEntry] = useState<KnowledgeBaseEntry | null>(null);
    const [editEntry, setEditEntry] = useState<KnowledgeBaseEntry | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [discardIntent, setDiscardIntent] = useState<"leave" | "reset">("leave");
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const initialRef = useRef(cloneEntries(entries));
    const importFileInputRef = useRef<HTMLInputElement>(null);
    const removeTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!effectiveOpen) return;
        const snapshot = cloneEntries(entries);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setSearch("");
        setPage(1);
        setAddOpen(false);
        setViewEntry(null);
        setEditEntry(null);
        setConfirmRemoveId(null);
        setRemoving(false);
        setDiscardOpen(false);
        setSaving(false);
        setExporting(false);
        setSaveError(null);
        setImportFile(null);
        setImportDialogOpen(false);
        if (importFileInputRef.current) importFileInputRef.current.value = "";
    }, [effectiveOpen, entries]);

    useEffect(() => {
        return () => {
            if (removeTimerRef.current !== null) {
                window.clearTimeout(removeTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!readOnly) return;
        setAddOpen(false);
        setEditEntry(null);
        setConfirmRemoveId(null);
        setDiscardOpen(false);
        setImportFile(null);
        setImportDialogOpen(false);
        if (importFileInputRef.current) importFileInputRef.current.value = "";
    }, [readOnly]);

    const dirty = !readOnly && entriesSignature(draft) !== entriesSignature(initialRef.current);

    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return draft;
        return draft.filter((entry) =>
            entry.question.toLowerCase().includes(lowered) ||
            entry.answer.toLowerCase().includes(lowered),
        );
    }, [draft, search]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, pageCount);

    useEffect(() => {
        if (page > pageCount) setPage(pageCount);
    }, [page, pageCount]);

    const paged = useMemo(
        () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
        [filtered, safePage, pageSize],
    );

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

    function confirmRemoveEntry() {
        if (readOnly || !confirmRemoveId || removing) return;
        const removeId = confirmRemoveId;
        setRemoving(true);
        removeTimerRef.current = window.setTimeout(() => {
            removeTimerRef.current = null;
            try {
                setDraft((current) => current.filter((entry) => entry.id !== removeId));
                luxiaToast.success(DESTRUCTIVE_CONFIRM.knowledgeEntry.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.knowledgeEntry.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }

    function addEntry(entry: KnowledgeBaseEntry) {
        if (readOnly) return;
        setDraft((current) => [...current, entry]);
    }

    function updateEntry(entry: KnowledgeBaseEntry) {
        if (readOnly) return;
        setDraft((current) => current.map((item) => item.id === entry.id ? entry : item));
        setEditEntry(null);
    }

    function save() {
        if (readOnly || !dirty || saving) return;
        setSaving(true);
        setSaveError(null);
        window.setTimeout(() => {
            if (readOnly) {
                setSaving(false);
                return;
            }
            const next = cloneEntries(draft);
            onCommit(next);
            initialRef.current = next;
            setDraft(next);
            setSaving(false);
            luxiaToast.success("Knowledge base saved");
            if (!isPage) onCancel();
        }, 500);
    }

    function exportCsv() {
        if (draft.length === 0 || exporting) return;
        setExporting(true);
        try {
            downloadKnowledgeBaseCsv(draft);
            luxiaToast.success("Knowledge Base exported successfully.");
        } finally {
            window.setTimeout(() => setExporting(false), 300);
        }
    }

    function openImportPicker() {
        if (readOnly) return;
        importFileInputRef.current?.click();
    }

    function onImportFileSelected(fileList: FileList | null) {
        if (readOnly) return;
        const file = fileList?.[0];
        if (!file) return;
        setImportFile(file);
        setImportDialogOpen(true);
        if (importFileInputRef.current) importFileInputRef.current.value = "";
    }

    function mergeImportedEntries(createdEntries: KnowledgeBaseEntry[]) {
        if (readOnly) return;
        if (createdEntries.length === 0) {
            setPage(1);
            return;
        }
        // Prepend so page 1 surfaces newly imported draft rows after reset.
        setDraft((current) => [...createdEntries.map((entry) => ({ ...entry })), ...current]);
        setPage(1);
    }

    function chooseAnotherImportFile() {
        if (readOnly) return;
        setImportDialogOpen(false);
        setImportFile(null);
        window.setTimeout(() => {
            importFileInputRef.current?.click();
        }, 0);
    }

    function openAdd() {
        if (readOnly) return;
        setAddOpen(true);
    }

    function openEdit(entry: KnowledgeBaseEntry) {
        if (readOnly) return;
        setEditEntry(entry);
    }

    function openRemoveConfirm(id: string) {
        if (readOnly) return;
        setConfirmRemoveId(id);
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
                            <DialogDescription className="mt-1.5 luxia-type-metadata">
                                {readOnly ? "View curated question-answer pairs for this constellation." : "Changes are local until saved."}
                            </DialogDescription>
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

            <div className="flex-shrink-0 border-b px-6 py-3.5" style={{ borderColor: LX.border }}>
                <div className="flex flex-wrap items-center gap-2">
                    <SearchField
                        density="dense"
                        value={search}
                        onChange={(next) => {
                            setSearch(next);
                            setPage(1);
                        }}
                        placeholder="Search questions and answers…"
                        aria-label="Search knowledge base entries"
                    />
                    {!readOnly ? (
                        <input
                            ref={importFileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="sr-only"
                            tabIndex={-1}
                            aria-label="Knowledge Base CSV file"
                            onChange={(event) => onImportFileSelected(event.target.files)}
                        />
                    ) : null}
                    {!readOnly ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="compact"
                            aria-label="Import CSV"
                            onClick={openImportPicker}
                        >
                            <Upload size={14} aria-hidden />
                            Import CSV
                        </Button>
                    ) : null}
                    <BusyButton
                        type="button"
                        variant="outline"
                        size="compact"
                        disabled={draft.length === 0}
                        busy={exporting}
                        busyLabel="Exporting…"
                        busyText="Exporting…"
                        aria-label="Export CSV"
                        onClick={exportCsv}
                    >
                        <Download size={14} aria-hidden />
                        Export CSV
                    </BusyButton>
                    {!readOnly ? (
                        <Button type="button" variant="primary" size="compact" onClick={openAdd}>
                            <Plus size={14} />Add Knowledge Entry
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                {filtered.length === 0 ? (
                    search.trim() ? (
                        <ListNoResultsState
                            title="No entries match your search."
                            description="Try another question or answer."
                        />
                    ) : (
                        <ListEmptyState
                            title="No knowledge entries yet"
                            description={
                                readOnly
                                    ? "No curated question-answer pairs are available for this constellation."
                                    : "Add curated question-answer pairs for this constellation."
                            }
                            action={
                                readOnly ? undefined : (
                                    <Button type="button" className="px-4" onClick={openAdd}>
                                        <Plus size={14} />Add Knowledge Entry
                                    </Button>
                                )
                            }
                        />
                    )
                ) : (
                    <div className="space-y-2">
                        {paged.map((entry) => {
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
                                            onEdit={readOnly ? undefined : () => openEdit(entry)}
                                            onRemove={readOnly ? undefined : () => openRemoveConfirm(entry.id)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {filtered.length > 0 ? (
                <div className="flex-shrink-0 border-t px-6 py-3" style={{ borderColor: LX.border }}>
                    <ListPagination
                        page={safePage}
                        pageCount={pageCount}
                        onPageChange={setPage}
                        totalItems={filtered.length}
                        pageSize={pageSize}
                        ariaLabel="Knowledge base pagination"
                    >
                        {filtered.length > 10 ? (
                            <PageSizeSelect
                                value={pageSize}
                                options={[...KB_PAGE_SIZES]}
                                onChange={(next) => {
                                    setPageSize(next as (typeof KB_PAGE_SIZES)[number]);
                                    setPage(1);
                                }}
                            />
                        ) : null}
                    </ListPagination>
                </div>
            ) : null}

            {!readOnly ? (
                <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                    {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                    <div className="flex items-center justify-end gap-2">
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
            ) : null}
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

            {!readOnly ? (
                <KnowledgeEntryDialog mode="add" open={addOpen} onOpenChange={setAddOpen} onSubmit={addEntry} />
            ) : null}

            {viewEntry ? (
                <KnowledgeEntryDialog
                    mode="view"
                    entry={viewEntry}
                    open={!!viewEntry}
                    onOpenChange={(next) => { if (!next) setViewEntry(null); }}
                    onSubmit={() => {}}
                />
            ) : null}

            {!readOnly && editEntry ? (
                <KnowledgeEntryDialog
                    mode="edit"
                    entry={editEntry}
                    open={!!editEntry}
                    onOpenChange={(next) => { if (!next) setEditEntry(null); }}
                    onSubmit={updateEntry}
                />
            ) : null}

            {!readOnly ? (
                <ConfirmDialog
                    open={Boolean(confirmRemoveId)}
                    onOpenChange={(next) => {
                        if (!next && !removing) setConfirmRemoveId(null);
                    }}
                    tone="destructive"
                    chrome={isPage ? "standard" : "compact"}
                    title={DESTRUCTIVE_CONFIRM.knowledgeEntry.title}
                    description={DESTRUCTIVE_CONFIRM.knowledgeEntry.description}
                    cancelLabel="Cancel"
                    confirmLabel={DESTRUCTIVE_CONFIRM.knowledgeEntry.confirmLabel}
                    busy={removing}
                    busyLabel={DESTRUCTIVE_CONFIRM.knowledgeEntry.busyLabel}
                    onConfirm={confirmRemoveEntry}
                />
            ) : null}

            {!readOnly ? (
                <DiscardChangesDialog
                    open={discardOpen}
                    onOpenChange={(next) => {
                        setDiscardOpen(next);
                        // Keep editing / escape only — Discard confirms via onDiscard.
                        if (!next && discardIntent === "leave") {
                            onLeaveAborted?.();
                        }
                    }}
                    onDiscard={() => {
                        setDiscardOpen(false);
                        if (discardIntent === "reset") {
                            setDraft(cloneEntries(initialRef.current));
                            return;
                        }
                        onCancel();
                    }}
                />
            ) : null}

            {!readOnly ? (
                <KbImportCsvDialog
                    open={importDialogOpen && !!importFile}
                    file={importFile}
                    existingEntries={draft}
                    onOpenChange={(next) => {
                        setImportDialogOpen(next);
                        if (!next) setImportFile(null);
                    }}
                    onImportComplete={mergeImportedEntries}
                    onChooseAnotherFile={chooseAnotherImportFile}
                />
            ) : null}
        </>
    );
}
