import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { DataSourceDocumentPicker } from "@/app/features/constellation-settings/CreationDocumentPicker";
import { readDataSourceDocuments, type DataSourceDocumentRecord } from "@/app/features/data-sources/documents";
import { BrowserFilterSelect } from "@/app/features/home/browserShared";
import type { AccessLevelRecord, DataSourceCatalogItem } from "@/app/features/permissions";
import { SearchField } from "@/app/features/shared/SearchField";
import { LX } from "./tokens";
import type { PDFCatalogFile, PDFFileRecord } from "./types";

/** Connected File Data Sources whose documents can be added, plus what access checks need. */
export interface PDFDocumentSourceContext {
    sources: DataSourceCatalogItem[];
    accessLevels: AccessLevelRecord[];
    dataSources: DataSourceCatalogItem[];
    currentUserId: string;
}

export interface ManagePDFFilesSaveResult {
    /** Legacy file-library selection, or null when the library was not changed. */
    catalogIds: string[] | null;
    /** Data Source documents to add. Never removes anything. */
    documents: DataSourceDocumentRecord[];
}

/** A legacy library record: a library id and no Data Source document identity. */
export function isLegacyLibraryRecord(file: PDFFileRecord): boolean {
    return Boolean(file.catalogId) && !file.localDocumentId;
}

/**
 * Add documents to a Constellation. "Data Source documents" uses the shared
 * document picker (document IDs, tags, extraction status, Review); documents
 * already added are fixed and adding only ever adds. "File library" keeps the
 * legacy prototype library for files without a Data Source document identity.
 */
export function ManagePDFFilesDialog({
    open,
    onOpenChange,
    catalog,
    connectedFiles,
    documentSources,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    catalog: PDFCatalogFile[];
    connectedFiles: PDFFileRecord[];
    documentSources?: PDFDocumentSourceContext | null;
    onSave: (result: ManagePDFFilesSaveResult) => void;
}) {
    const sources = documentSources?.sources ?? [];
    const hasDocumentSources = sources.length > 0;

    const connectedCatalogIds = useMemo(
        () => new Set(
            connectedFiles
                .filter((f) => !f.markedForRemoval && isLegacyLibraryRecord(f))
                .map((f) => f.catalogId as string),
        ),
        [connectedFiles],
    );
    /** Already-added document IDs per Data Source. */
    const attachedBySource = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const file of connectedFiles) {
            if (file.markedForRemoval || !file.dataSourceId || !file.localDocumentId) continue;
            map.set(file.dataSourceId, [...(map.get(file.dataSourceId) ?? []), file.localDocumentId]);
        }
        return map;
    }, [connectedFiles]);

    const [view, setView] = useState<"documents" | "library">(hasDocumentSources ? "documents" : "library");
    const [sourceId, setSourceId] = useState<string>(sources[0]?.id ?? "");
    const [pendingBySource, setPendingBySource] = useState<Record<string, string[]>>({});
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const initialSelected = useMemo(() => [...connectedCatalogIds], [connectedCatalogIds]);

    useEffect(() => {
        if (!open) return;
        setSearch("");
        setSelected([...connectedCatalogIds]);
        setPendingBySource({});
        setView(hasDocumentSources ? "documents" : "library");
        setSourceId((current) => (sources.some((s) => s.id === current) ? current : sources[0]?.id ?? ""));
        // Reset only when the dialog opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        if (!lowered) return catalog;
        return catalog.filter((file) => file.name.toLowerCase().includes(lowered));
    }, [catalog, search]);

    const libraryDirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...initialSelected].sort());
    const pendingDocumentCount = Object.values(pendingBySource).reduce((sum, ids) => sum + ids.length, 0);
    const canSave = libraryDirty || pendingDocumentCount > 0;
    const activeSource = sources.find((s) => s.id === sourceId) ?? null;

    function toggle(id: string) {
        setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    }

    function selectAllVisible() {
        const visibleIds = filtered.map((file) => file.id);
        setSelected((current) => Array.from(new Set([...current, ...visibleIds])));
    }

    function deselectAllVisible() {
        const visibleIds = new Set(filtered.map((file) => file.id));
        setSelected((current) => current.filter((id) => !visibleIds.has(id)));
    }

    function handleSave() {
        const documents = sources.flatMap((source) => {
            const pending = new Set(pendingBySource[source.id] ?? []);
            if (pending.size === 0) return [];
            return readDataSourceDocuments(source.id, source.contentSummary)
                .filter((document) => pending.has(document.localDocumentId));
        });
        onSave({ catalogIds: libraryDirty ? selected : null, documents });
        onOpenChange(false);
    }

    const wide = view === "documents";
    const saveLabel = pendingDocumentCount > 0 && !libraryDirty
        ? `Add ${pendingDocumentCount} document${pendingDocumentCount === 1 ? "" : "s"}`
        : "Save";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[min(92vh,60rem)] flex-col overflow-hidden p-0"
                style={wide
                    ? { width: "min(96vw, 80rem)", maxWidth: "min(96vw, 80rem)", height: "min(92vh, 60rem)" }
                    : { width: "min(92vw, 560px)", maxWidth: "min(92vw, 560px)" }}
            >
                <DialogHeader>
                    <DialogTitle className="luxia-type-title-panel">Add documents</DialogTitle>
                    <DialogDescription className="sr-only">
                        Add documents from connected Data Sources or the file library.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
                    {hasDocumentSources ? (
                        <div className="flex flex-none gap-1" role="tablist" aria-label="Document source">
                            {([
                                ["documents", "Data Source documents"],
                                ["library", "File library"],
                            ] as const).map(([id, label]) => (
                                <Button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={view === id}
                                    variant={view === id ? "secondary" : "tertiary"}
                                    size="compact"
                                    onClick={() => setView(id)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    ) : null}

                    {view === "documents" && activeSource && documentSources ? (
                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical pr-1">
                            {sources.length > 1 ? (
                                <BrowserFilterSelect
                                    label="Data Source"
                                    className="w-[18rem]"
                                    value={activeSource.id}
                                    onChange={(event) => setSourceId(event.target.value)}
                                >
                                    {sources.map((source) => (
                                        <option key={source.id} value={source.id}>{source.name}</option>
                                    ))}
                                </BrowserFilterSelect>
                            ) : (
                                <p className="luxia-type-caption" style={{ color: LX.textMuted }}>
                                    Available documents from {activeSource.name}
                                </p>
                            )}
                            <DataSourceDocumentPicker
                                key={activeSource.id}
                                source={activeSource}
                                selectedDocumentIds={pendingBySource[activeSource.id] ?? []}
                                onSelectedDocumentIdsChange={(ids) =>
                                    setPendingBySource((current) => ({ ...current, [activeSource.id]: ids }))}
                                lockedDocumentIds={attachedBySource.get(activeSource.id) ?? []}
                                accessLevels={documentSources.accessLevels}
                                dataSources={documentSources.dataSources}
                                currentUserId={documentSources.currentUserId}
                                reviewBackLabel="Back to Add documents"
                            />
                        </div>
                    ) : (
                        <>
                            <SearchField
                                density="dense"
                                className="flex-none"
                                value={search}
                                onChange={setSearch}
                                placeholder="Search files…"
                                aria-label="Search available files"
                                clearable={false}
                            />

                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={selectAllVisible}>Select All</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={deselectAllVisible}>Deselect all</Button>
                            </div>

                            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical pr-1">
                                {filtered.length === 0 ? (
                                    <p className="py-8 text-center luxia-type-body-dense" style={{ color: LX.textMuted }}>No files match your search.</p>
                                ) : filtered.map((file) => {
                                    const checked = selected.includes(file.id);
                                    return (
                                        <button
                                            key={file.id}
                                            type="button"
                                            onClick={() => toggle(file.id)}
                                            className="flex w-full items-start gap-3 rounded-[12px] border px-3 py-2.5 text-left"
                                            style={{ borderColor: checked ? LX.secondary : LX.border, background: checked ? LX.subtle : LX.surface }}
                                        >
                                            <Checkbox checked={checked} className="mt-0.5" aria-hidden tabIndex={-1} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate luxia-type-body-dense-strong" style={{ color: LX.primary }}>{file.name}</p>
                                                <p className="mt-0.5 luxia-type-caption" style={{ color: LX.textMuted }}>{file.sizeLabel}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" variant="primary" disabled={!canSave} onClick={handleSave}>{saveLabel}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
