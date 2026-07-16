import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
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
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { LX } from "./tokens";
import type { DataTableRecord } from "./types";

export function EditTableDetailsDialog({
    table,
    open,
    onOpenChange,
    onSave,
}: {
    table: DataTableRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (tableId: string, patch: Pick<DataTableRecord, "displayName" | "description">) => void;
}) {
    const [draftName, setDraftName] = useState("");
    const [draftDescription, setDraftDescription] = useState("");
    const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
    const initialRef = useRef({ displayName: "", description: "" });

    useEffect(() => {
        if (!table || !open) return;
        setDraftName(table.displayName);
        setDraftDescription(table.description);
        initialRef.current = { displayName: table.displayName, description: table.description };
        setConfirmDiscardOpen(false);
    }, [table, open]);

    if (!table) return null;
    const isValid = draftName.trim().length > 0;
    const isDirty = draftName.trim() !== initialRef.current.displayName || draftDescription !== initialRef.current.description;

    function requestClose() {
        if (isDirty) {
            setConfirmDiscardOpen(true);
            return;
        }
        onOpenChange(false);
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
                <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 720px)", maxWidth: "min(92vw, 720px)" }}>
                    <div className="flex flex-col">
                        <DialogHeader className="border-b px-6 py-5 text-left" style={{ borderColor: LX.border }}>
                            <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="text-[18px] font-extrabold" style={{ color: LX.primary }}>Edit table details</DialogTitle>
                                    <DialogDescription className="sr-only">Change the display name and description for this active data table.</DialogDescription>
                                    <p className="mt-1 text-[12px]" style={{ color: LX.textMuted }}>Change the display name and description.</p>
                                </div>
                                <button type="button" onClick={requestClose} className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ borderColor: LX.border, color: LX.textMuted }} aria-label="Close edit table details">
                                    <X size={15} />
                                </button>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 px-6 py-5">
                            <div>
                                <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: LX.primary }}>Original database table</label>
                                <Input value={table.originalName} readOnly style={{ background: LX.subtle }} />
                                <p className="mt-1 text-[12px]" style={{ color: LX.textMuted }}>{table.sourceDatabase}</p>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: LX.primary }}>Display name</label>
                                <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} aria-invalid={!isValid} />
                                {!isValid && <p className="mt-1 text-[12px]" style={{ color: LX.error }}>Display name cannot be empty.</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: LX.primary }}>Description</label>
                                <Textarea value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} rows={5} />
                            </div>
                        </div>

                        <div className="border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="secondary" className="rounded-full px-4" onClick={requestClose}>Cancel</Button>
                                <Button className="rounded-full px-4" disabled={!isValid || !isDirty} onClick={() => { onSave(table.id, { displayName: draftName.trim(), description: draftDescription.trim() }); onOpenChange(false); }}>Save changes</Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>Unsaved changes will be lost.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConfirmDiscardOpen(false)}>Keep editing</AlertDialogCancel>
                        <AlertDialogAction style={{ background: LX.error }} className="text-white hover:opacity-90" onClick={() => onOpenChange(false)}>Discard</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}