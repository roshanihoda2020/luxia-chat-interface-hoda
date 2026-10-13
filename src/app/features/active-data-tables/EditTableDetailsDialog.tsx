import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";
import { BusyButton } from "@/app/features/shared/Loading";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { LX } from "./tokens";
import type { DataTableRecord } from "./types";

const SAVE_DELAY_MS = 500;

export function EditTableDetailsDialog({
    table,
    open,
    onOpenChange,
    onSave,
    entityKind = "table",
}: {
    table: DataTableRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (tableId: string, patch: Pick<DataTableRecord, "displayName" | "description">) => void;
    /** Local copy context — defaults preserve Active Data Tables labels. */
    entityKind?: "table" | "view";
}) {
    const isView = entityKind === "view";
    const title = isView ? "Edit view details" : "Edit table details";
    const originalLabel = isView ? "Original database view" : "Original database table";
    const closeLabel = isView ? "Close edit view details" : "Close edit table details";
    const srDescription = isView
        ? "Change the display name and description for this database view."
        : "Change the display name and description for this active data table.";
    const successToast = isView ? "View details updated" : "Table details updated";
    const errorToast = isView ? "Could not save the View details" : "Could not save the Table details";
    const [draftName, setDraftName] = useState("");
    const [draftDescription, setDraftDescription] = useState("");
    const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const initialRef = useRef({ displayName: "", description: "" });
    const saveTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!table || !open) return;
        setDraftName(table.displayName);
        setDraftDescription(table.description);
        initialRef.current = { displayName: table.displayName, description: table.description };
        setConfirmDiscardOpen(false);
        setSaving(false);
    }, [table, open]);

    useEffect(() => {
        return () => {
            if (saveTimerRef.current !== null) {
                window.clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    if (!table) return null;
    const isValid = draftName.trim().length > 0;
    const isDirty = draftName.trim() !== initialRef.current.displayName || draftDescription !== initialRef.current.description;

    function requestClose() {
        if (saving) return;
        if (isDirty) {
            setConfirmDiscardOpen(true);
            return;
        }
        onOpenChange(false);
    }

    function handleSave() {
        if (!table || !isValid || !isDirty || saving) return;
        setSaving(true);
        const patch = { displayName: draftName.trim(), description: draftDescription.trim() };
        const tableId = table.id;
        saveTimerRef.current = window.setTimeout(() => {
            saveTimerRef.current = null;
            try {
                onSave(tableId, patch);
                luxiaToast.success(successToast);
                setSaving(false);
                onOpenChange(false);
            } catch {
                luxiaToast.error(errorToast);
                setSaving(false);
            }
        }, SAVE_DELAY_MS);
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
                <DialogContent
                    hideCloseButton
                    className="overflow-hidden p-0"
                    style={{ width: "min(92vw, 720px)", maxWidth: "min(92vw, 720px)" }}
                    onEscapeKeyDown={(event) => {
                        if (saving || isDirty) {
                            event.preventDefault();
                            requestClose();
                        }
                    }}
                    onPointerDownOutside={(event) => {
                        if (saving || isDirty) {
                            event.preventDefault();
                            requestClose();
                        }
                    }}
                >
                    <div className="flex flex-col">
                        <DialogHeader>
                            <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal">{title}</DialogTitle>
                                    <DialogDescription className="sr-only">{srDescription}</DialogDescription>
                                    <p className="mt-1 luxia-type-metadata text-[var(--luxia-purple-10)]">Change the display name and description.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={requestClose}
                                    disabled={saving}
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2",
                                        LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
                                    )}
                                    aria-label={closeLabel}
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 px-6 py-5">
                            <div>
                                <label className="mb-1.5 block luxia-type-label-form" style={{ color: LX.primary }}>{originalLabel}</label>
                                <Input value={table.originalName} readOnly style={{ background: LX.subtle }} />
                                <p className="mt-1 luxia-type-metadata" style={{ color: LX.textMuted }}>{table.sourceDatabase}</p>
                            </div>
                            <div>
                                <label className="mb-1.5 block luxia-type-label-form" style={{ color: LX.primary }}>Display name</label>
                                <Input
                                    value={draftName}
                                    onChange={(e) => setDraftName(e.target.value)}
                                    aria-invalid={!isValid}
                                    disabled={saving}
                                />
                                {!isValid && <p className="mt-1 luxia-type-metadata" style={{ color: LX.error }}>Display name cannot be empty.</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block luxia-type-label-form" style={{ color: LX.primary }}>Description</label>
                                <Textarea
                                    value={draftDescription}
                                    onChange={(e) => setDraftDescription(e.target.value)}
                                    rows={5}
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div className="border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="secondary" className="px-4" onClick={requestClose} disabled={saving}>Cancel</Button>
                                <BusyButton
                                    type="button"
                                    className="min-w-[132px] px-4"
                                    disabled={!isValid || !isDirty}
                                    busy={saving}
                                    busyLabel="Saving…"
                                    busyText="Saving…"
                                    onClick={handleSave}
                                >
                                    Save changes
                                </BusyButton>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <DiscardChangesDialog
                open={confirmDiscardOpen}
                onOpenChange={(next) => {
                    if (saving && !next) return;
                    setConfirmDiscardOpen(next);
                }}
                onDiscard={() => {
                    setConfirmDiscardOpen(false);
                    onOpenChange(false);
                }}
            />
        </>
    );
}
